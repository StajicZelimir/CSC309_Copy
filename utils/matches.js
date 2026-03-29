import { prisma } from "@/prisma/db";
import { fdGet } from "@/utils/footballData"; 
import { isKeyStale } from "@/utils/sportsCacheHandling";
import { stdout } from "process";

const ttl = Number(process.env.MATCHES_TTL_MINUTES);
const league = process.env.LEAGUE_CODE;
const SYSTEM_USER_ID = Number(process.env.SYSTEM_USER_ID);
const KEY = `matches:${league}`;

export async function ensureMatchesFresh() {
    try{
      const stale = await isKeyStale(KEY, ttl);
      const empty = (await prisma.Matches.count()) === 0;

      if (!stale && !empty) {
          return;
      }

      const from = new Date();
      from.setDate(from.getDate() - 30); // 30 days ago
      const fromStr = from.toISOString().slice(0, 10);

      const to = new Date();
      to.setDate(to.getDate() + 30); // 30 days in the future
      const toStr = to.toISOString().slice(0, 10);

      const data = await fdGet(
          `/competitions/${league}/matches?dateFrom=${fromStr}&dateTo=${toStr}`
        );
      
      const matches = data.matches;

      await prisma.$transaction(async (tx) => {
          for (const m of matches) {
              const matchDate = new Date(m.utcDate);

              const homeTeam = await tx.team.findUnique({
                where: { tid: m.homeTeam.id },
                select: { venue: true },
              });

              const venue = homeTeam?.venue ?? "Unavailable";

              await tx.Matches.upsert({
                where: { mid: m.id },
                create: {
                  mid: m.id,
                  team1Id: m.homeTeam.id,
                  team2Id: m.awayTeam.id,
                  date: matchDate,
                  matchday: m.matchday,
                  status: m.status,
                  venue,
                  stage: m.stage,
                  homeScore: m.score.fullTime.home,
                  awayScore: m.score.fullTime.away,
                  sent1: null,
                  sent2: null,
                },
                update: {
                  team1Id: m.homeTeam.id,
                  team2Id: m.awayTeam.id,
                  date: matchDate,
                  matchday: m.matchday,
                  status: m.status,
                  venue,
                  stage: m.stage,
                  homeScore: m.score.fullTime.home,
                  awayScore: m.score.fullTime.away,
                },
              });
              
          }
          await tx.Timestamp.upsert({
              where: { key: KEY },
              create: { key: KEY, updatedAt: new Date() },
              update: { updatedAt: new Date() },
          });
      });
  }
  catch(ex){
    console.log(ex.message);
  }
}

export async function syncMatchThreads() {

    const from = new Date();
    from.setDate(from.getDate() - 30); // we check 30 days in the past to catch any missed threads

    const to = new Date();
    to.setDate(to.getDate() + 14); // we check 14 days in the future to catch any upcoming matches

    const twoWeeksAgo = new Date();
    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);

    const twoWeeksAhead = new Date();
    twoWeeksAhead.setDate(twoWeeksAhead.getDate() + 14);


    const matches = await prisma.Matches.findMany({
        where: {
          date: {
            gte: from, 
            lte: to
          },
        },
        include: {
          homeTeam: true,
          awayTeam: true,
          thread: true,
        },
        orderBy: { date: "asc" },
    });

    await prisma.$transaction(async (tx) => {
        for (const m of matches) {
            const matchDate = new Date(m.date);
        
            const inWindow = matchDate >= twoWeeksAgo && matchDate <= twoWeeksAhead;
            const isOld = matchDate < twoWeeksAgo;
        
            const title = `${m.homeTeam.name} vs ${m.awayTeam.name} (${matchDate
                .toISOString()
                .slice(0, 10)})`;
        
            // Create/attach thread if match is within +-2 weeks and missing thread
            if (inWindow && !m.threadId) {
                const thread = await tx.Threads.create({
                data: {
                    title,
                    ownerId: SYSTEM_USER_ID,
                    date: matchDate,
                    text: `Match thread for ${title}`,
                    tags: "match",
                    verdict: "",
                    toxic: 0,
                    closed: false,
                },
                });
        
                await tx.Matches.update({
                where: { mid: m.mid },
                data: { threadId: thread.tid },
                });
            }
        
            // 2) Close thread if match older than 2 weeks
            if (isOld && m.threadId && !m.thread.closed) {
                await tx.Threads.update({
                where: { tid: m.threadId },
                data: { closed: true },
                });
            }
        }
    });
}