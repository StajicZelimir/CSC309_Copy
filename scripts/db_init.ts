import { ensureMatchesFresh } from "@/utils/matches";
import { ensureStandingsFresh } from "@/utils/standingsService";
import { ensureTeamVenues } from "@/utils/teamVenues";

async function main() {
  console.log("Initializing database with matches and teams...");

  await ensureStandingsFresh();
  await ensureTeamVenues();
  await ensureMatchesFresh();

  console.log("Database initialization complete.");
}

main().catch((err: unknown) => {
  if (err instanceof Error) {
    console.error("Database initialization failed:", err.message);
  } else {
    console.error("Database initialization failed:", err);
  }
  process.exit(1);
});