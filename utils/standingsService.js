import { prisma } from "@/prisma/db";
import { fdGet } from "@/utils/footballData";
import { isKeyStale } from "@/utils/sportsCacheHandling";

const KEY = "standings";

export async function ensureStandingsFresh() {
    const ttl = Number(process.env.STANDINGS_TTL_MINUTES);
    const league = process.env.LEAGUE_CODE;

    const stale = await isKeyStale(KEY, ttl);
    const empty = (await prisma.team.count()) === 0;

    if (!stale && !empty) {
        return;
    }

    const data = await fdGet(`/competitions/${league}/standings`);
    const table = data.standings[0].table;

    // Use a transaction to ensure all updates are applied atomically, everything succeeds or nothing changes
    await prisma.$transaction(async (tx) => {
        for (const row of table) {
            const t = row.team;

            await tx.team.upsert({
                where: { tid: t.id },
                create: {
                tid: t.id,
                name: t.name, 
                logo: t.crest,
                venue: "Unavailable",
                position: row.position,
                wins: row.won,
                losses: row.lost,
                draws: row.draw,
                playedGames: row.playedGames,
                points: row.points,
                goalsFor: row.goalsFor,
                goalsAgainst: row.goalsAgainst,
                },
                update: {
                name: t.name, 
                logo: t.crest,
                position: row.position,
                wins: row.won,
                losses: row.lost,
                draws: row.draw,
                playedGames: row.playedGames,
                points: row.points,
                goalsFor: row.goalsFor,
                goalsAgainst: row.goalsAgainst,
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

export async function getStandingsFromDb() {
    return prisma.team.findMany({
      select: {
        tid: true,
        name: true, 
        logo: true,
        position: true,
        wins: true,
        losses: true,
        draws: true,
        playedGames: true,
        points: true,
        goalsFor: true,
        goalsAgainst: true,
      },
      orderBy: { position: "asc" },
    });
  }