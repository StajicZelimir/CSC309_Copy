import { prisma } from "@/prisma/db";
import { fdGet } from "@/utils/footballData";

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getRetryDelayMs(message: string): number | null {
  const match = message.match(/Wait (\d+) seconds/i);
  if (!match) return null;
  return Number(match[1]) * 1000;
}

export async function ensureTeamVenues() {
  const teams = await prisma.team.findMany({
    where: {
      OR: [{ venue: "" }, { venue: "Unavailable" }],
    },
    select: {
      tid: true,
      name: true,
    },
  });

  console.log(`Found ${teams.length} teams missing venues.`);

  for (let i = 0; i < teams.length; i++) {
    const team = teams[i];
    let done = false;

    while (!done) {
      try {
        const teamData = await fdGet(`/teams/${team.tid}`);
        const venue = teamData?.venue?.trim() || "Unavailable";

        await prisma.team.update({
          where: { tid: team.tid },
          data: { venue },
        });

        console.log(`Updated venue for ${team.name}: ${venue}`);
        done = true;
      } catch (ex: unknown) {
        const message = ex instanceof Error ? ex.message : String(ex);
        const retryDelay = getRetryDelayMs(message);

        if (retryDelay) {
          console.log(`Rate limited on ${team.name}. Waiting ${retryDelay / 1000}s before retrying...`);
          await sleep(retryDelay);
        } else {
          console.log(`Failed to fetch venue for team ${team.tid}: ${message}`);
          done = true;
        }
      }
    }

    if (i < teams.length - 1) {
      await sleep(1000);
    }
  }
}