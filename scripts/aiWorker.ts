// scripts/aiWorker.ts
import cron from "node-cron";
import { prisma } from "@/prisma/db";
import {
  runToxicityAll,
  runEmotionSentimentAll,
  TOX_REPORT_THRESHOLD,
} from "@/utils/ai";

import {ensureMatchesFresh} from "@/utils/matches"
import { ensureStandingsFresh, getStandingsFromDb } from "@/utils/standingsService";

const SYSTEM_USER_ID = Number(process.env.SYSTEM_USER_ID);
if (!Number.isFinite(SYSTEM_USER_ID)) {
  throw new Error("SYSTEM_USER_ID env var missing or not a number");
}

let running = false;

function normalizeName(s: string) {
  return String(s ?? "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function mentionsTeam(text: string, teamName: string) {
  const t = normalizeName(text);
  const name = normalizeName(teamName);
  if (!name) return false;

  const ignore = new Set(["fc", "cf", "club", "football"]);

  const words = name.split(/\s+/).filter(w => !ignore.has(w) && w.length > 2);

  return words.some(word => {
    const pattern = new RegExp(`\\b${word}\\b`, "i");
    return pattern.test(t);
  });
}

function avg(nums: number[]) {
  if (nums.length === 0) return 0;
  return Math.round(nums.reduce((a, b) => a + b, 0) / nums.length);
}

/**
 * ONE toxicity request for:
 * - queued threads (title + text)
 * - queued comments (text only)
 */
async function processToxicityQueuesOneCall() {
  const [threadJobs, commentJobs] = await Promise.all([
    prisma.aiThreads.findMany({ select: { threadId: true } }),
    prisma.aiComments.findMany({ select: { commentId: true } }),
  ]);

  const tids = threadJobs.map((j) => j.threadId);
  const cids = commentJobs.map((j) => j.commentId);

//     console.log("[aiWorker] tids", tids);
//     console.log("[aiWorker] cids", cids);

//   console.log(
//     `[aiWorker] toxicity queue: threads=${tids.length}, comments=${cids.length}`
//   );

  if (tids.length === 0 && cids.length === 0) return;

  const [threads, comments] = await Promise.all([
    tids.length
      ? prisma.threads.findMany({
          where: { tid: { in: tids } },
          select: { tid: true, title: true, text: true },
        })
      : Promise.resolve([]),
    cids.length
      ? prisma.comment.findMany({
          where: { cid: { in: cids } },
          select: { cid: true, text: true , poll: {where:{isHidden:false}}},
        })
      : Promise.resolve([]),
  ]);

  // Build ONE combined batch:
  // - threads use "title\n\ntext"
  // - comments use "text"
  const items: Array<
    | { kind: "thread"; tid: number; text: string }
    | { kind: "comment"; cid: number; text: string }
  > = [];

  for (const t of threads) {
    items.push({
      kind: "thread",
      tid: t.tid,
      text: `${t.title ?? ""}\n\n${t.text ?? ""}`.trim(),
    });
  }

  for (const c of comments) {
    items.push({
      kind: "comment",
      cid: c.cid,
      text:`${c.text ?? ""}\n\n${c.poll[0]?.option1 ?? ""}\n\n${c.poll[0]?.option2 ?? ""}\n\n${c.poll[0]?.option3 ?? ""}\n\n${c.poll[0]?.option4 ?? ""}`.trim(),
    });
  }

  // Convert to runToxicityAll input format
  const toxicityInputs = items.map((it) =>
    it.kind === "thread"
      ? { tid: it.tid, text: it.text }
      : { cid: it.cid, text: it.text }
  );

  console.log("[aiWorker] toxicityInputs:", toxicityInputs.map(x => ({
    tid: x.tid ?? null,
    cid: x.cid ?? null,
    textPreview: x.text.slice(0, 40),
  })));
  console.log("[aiWorker] toxicityInputs.length =", toxicityInputs.length);

  const results = await runToxicityAll(toxicityInputs);

  console.log("[aiWorker] results counts", {
    total: results.length,
    threadResults: results.filter((r) => r.tid != null).length,
    commentResults: results.filter((r) => r.cid != null).length,
    results,
  });

  // Apply updates + delete queue rows
  await prisma.$transaction(async (tx) => {
    for (const r of results) {
      if (r.tid != null) {
        await tx.threads.update({
          where: { tid: r.tid },
          data: { toxic: r.toxic, verdict: r.verdict },
        });

        if (r.toxic > TOX_REPORT_THRESHOLD) {
          await tx.reports.create({
            data: {
              threadId: r.tid,
              userId: SYSTEM_USER_ID,
              text: r.verdict,
            },
          });
        }
      }

      if (r.cid != null) {
        console.log("[aiWorker] updating comment", r.cid, r.toxic, r.verdict);
        await tx.comment.update({
          where: { cid: r.cid },
          data: { toxic: r.toxic, verdict: r.verdict },
        });

        if (r.toxic > TOX_REPORT_THRESHOLD) {
          await tx.reports.create({
            data: {
              commentId: r.cid,
              userId: SYSTEM_USER_ID,
              text: r.verdict,
            },
          });
        }
      }
    }

    if (tids.length) {
      await tx.aiThreads.deleteMany({ where: { threadId: { in: tids } } });
    }
    if (cids.length) {
      await tx.aiComments.deleteMany({ where: { commentId: { in: cids } } });
    }
  });
}

async function processMatchThreadSentiment() {
  const matches = await prisma.matches.findMany({
    where: {
      threadId: { not: null },
      thread: { is: { closed: false, isHidden: false } },
    },
    select: {
      threadId: true,
      homeTeam: { select: { name: true } },
      awayTeam: { select: { name: true } },
      thread: {
        select: {
          comments: { select: { cid: true, text: true } },
        },
      },
    },
  });

  if (matches.length === 0) {
    console.log("[aiWorker] match sentiment: no open match threads");
    return;
  }

  type Item = {
    cid: number;
    threadId: number;
    team: "home" | "away";
    text: string;
  };
  const items: Item[] = [];
  const items2: Item[] = [];

  for (const m of matches) {
    const tid = m.threadId!;
    const home = m.homeTeam?.name ?? "";
    const away = m.awayTeam?.name ?? "";

    const comments = m.thread?.comments ?? [];

    for (const c of comments) {
      const text = String(c.text ?? "");
      if (!text.trim()) continue;
      
      const homeHit = home && mentionsTeam(text, home);
      const awayHit = away && mentionsTeam(text, away);

      if (homeHit) items.push({ cid: c.cid, threadId: tid, team: "home", text });
      if (awayHit) items.push({ cid: c.cid, threadId: tid, team: "away", text });
    }
  }

  const uniqueByCid = new Map<number, string>();

  for (const it of items) {
    if (!uniqueByCid.has(it.cid)) uniqueByCid.set(it.cid, it.text);
  }

  const toScore = Array.from(uniqueByCid.entries()).map(([cid, text]) => ({
    id: cid,
    text,
  }));

  const scored = toScore.length ? await runEmotionSentimentAll(toScore) : [];

  const scoreByCid = new Map<number, number>();
  
  for (const s of scored) scoreByCid.set(s.id, s.score);

  const homeScoresByThread = new Map<number, number[]>();
  const awayScoresByThread = new Map<number, number[]>();
  

  for (const it of items) {
    const s = scoreByCid.get(it.cid);
    if (s == null) continue;

    if (it.team === "home") {
      const arr = homeScoresByThread.get(it.threadId) ?? [];
      arr.push(s);
      homeScoresByThread.set(it.threadId, arr);
    } else {
      const arr = awayScoresByThread.get(it.threadId) ?? [];
      arr.push(s);
      awayScoresByThread.set(it.threadId, arr);
    }
  }
  

  await prisma.$transaction(async (tx) => {
    for (const m of matches) {
      const tid = m.threadId!;
      await tx.matches.updateMany({
        where: { threadId: tid },
        data: {
          sent1: avg(homeScoresByThread.get(tid) ?? []),
          sent2: avg(awayScoresByThread.get(tid) ?? []),
        },
      });
    }
  });

  console.log(`[aiWorker] match sentiment: updated ${matches.length} match threads`);
}

async function processAll() {
  // Toxicity = 1 call max
  await processToxicityQueuesOneCall();

  // Sentiment = 1 call max
  await processMatchThreadSentiment();
}

// Testing every minute
cron.schedule("*/10 * * * *", async () => {
  if (running) {
    console.log("[aiWorker] skipped (previous run still active)");
    return;
  }

  running = true;
  console.log(`[aiWorker] processing started at ${new Date().toISOString()}`);

  try {
    await processAll();
    console.log(`[aiWorker] processing finished at ${new Date().toISOString()}`);
  } catch (e) {
    console.error("[aiWorker] error:", e);
  } finally {
    running = false;
  }
});
console.log("[aiWorker] running every 10 minute");