import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const games = await prisma.game.findMany({
      orderBy: { createdAt: 'desc' },
      // take: 5, // Opsional: Matikan limit ini jika ingin lihat semua history
      include: { _count: { select: { players: true } } }
    });
    return NextResponse.json(games);
  } catch (error) {
    return NextResponse.json({ error: "Gagal mengambil data game" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, players } = body;

    const newGame = await prisma.game.create({
      data: {
        name: name || `Game ${new Date().toISOString()}`,
        status: 'SETUP',
      }
    });

    // Handle duplicate names using Set
    const uniqueNicknames = [...new Set(players as string[])];

    // Transaction Upsert agar tidak error nickname duplikat
    await prisma.$transaction(
      uniqueNicknames.map((nickname) => 
        prisma.player.upsert({
          where: { gameId_nickname: { gameId: newGame.id, nickname } },
          update: {},
          create: {
            nickname,
            gameId: newGame.id,
            roleId: 'villager', // Default role
            isAlive: true,
            currentAlignment: 'Goodside'
          }
        })
      )
    );

    return NextResponse.json({ success: true, game: newGame });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}