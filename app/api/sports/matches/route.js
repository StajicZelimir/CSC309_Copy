import { NextResponse } from "next/server";
import { prisma } from "@/prisma/db";
import { ensureMatchesFresh, syncMatchThreads } from "@/utils/matches";

export async function GET(req) {
  try {

    await ensureMatchesFresh();
    await syncMatchThreads();

    const { searchParams } = new URL(req.url);

    // optoinal filters for matchday, stage, from, to
    const matchdayParam = searchParams.get("matchday");
    const stageParam = searchParams.get("stage");
    const fromParam = searchParams.get("from");
    const toParam = searchParams.get("to");

    const hasMatchday = !!matchdayParam;
    const hasStage = !!stageParam
    const hasDate = !!fromParam || !!toParam;
    
    const where = {};

    const defaultFrom = new Date();
    defaultFrom.setDate(defaultFrom.getDate() - 30);

    const defaultTo = new Date();
    defaultTo.setDate(defaultTo.getDate() + 30);

    if (hasMatchday) {
        const md = Number(matchdayParam);
        if (!Number.isFinite(md)) {
          return NextResponse.json({ error: "matchday must be a number" }, { status: 400 });
        }
        where.matchday = md;
    } 
    if (hasStage) {
        where.stage = stageParam;
    } 
    if (hasDate) {
        const fromDate = fromParam ? new Date(`${fromParam}T00:00:00.000Z`) : defaultFrom;
        const toDate = toParam ? new Date(`${toParam}T23:59:59.999Z`) : defaultTo;
  
        where.date = { gte: fromDate, lte: toDate };
    } else {
        // default date window
        where.date = { gte: defaultFrom, lte: defaultTo };
    }

    const matches = await prisma.matches.findMany({
      where,
      orderBy: { date: "asc" },
      select: {
        mid: true,
        date: true,
        status: true,
        homeScore: true,
        awayScore: true,
        threadId: true,
        stage: true,
        venue: true,
        sent1: true,
        sent2: true,
        homeTeam: {
          select: {
            name: true,
            logo: true,
          },
        },
        awayTeam: {
          select: {
            name: true,
            logo: true,
          },
        },
        thread: {
          select: {
            _count: {
              select: {
                comments: true,
              },
            },
          },
        },
      },
    });
  

    return NextResponse.json({ matches });
  } catch (e) {
    return NextResponse.json(
      { error: e?.message ?? "Unknown error" },
      { status: 500 }
    );
  }
}