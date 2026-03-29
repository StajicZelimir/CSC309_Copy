import { NextResponse } from "next/server";
import { prisma } from "@/prisma/db";

export async function GET(req, { params }) {
  try {
    
    const { id } = await params;
    const id2 = parseInt(id);


    if (!Number.isFinite(id2)) {
      return NextResponse.json(
        { error: "match id must be a number" },
        { status: 400 }
      );
    }

    const match = await prisma.Matches.findUnique({
      where: { mid: id2 },
      include: { homeTeam: true, awayTeam: true, thread: true },
    });

    if (!match) {
      return NextResponse.json({ error: "Match not found" }, { status: 404 });
    }

    return NextResponse.json({ match });
  } catch (e) {
    return NextResponse.json(
      { error: e?.message ?? "Unknown error" },
      { status: 500 }
    );
  }
}