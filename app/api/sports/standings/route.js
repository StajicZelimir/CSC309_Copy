import { NextResponse } from "next/server";
import { ensureStandingsFresh, getStandingsFromDb } from "@/utils/standingsService";

export async function GET() {
  try {
    await ensureStandingsFresh();
    const standings = await getStandingsFromDb();
    return NextResponse.json({ standings }, { status: 200 });
  } catch (err) {
    console.error("GET api/sports/standings failed:", err);
    return NextResponse.json(
      { error: "Failed to fetch standings" },
      { status: 500 }
    );
  }
}