import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const games = await prisma.game.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5, // Ambil 5 game terakhir
      include: { _count: { select: { players: true } } }
    });
    return NextResponse.json(games);
  } catch (error) {
    return NextResponse.json({ error: "Gagal mengambil data game" }, { status: 500 });
  }
}