import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const players = await prisma.player.findMany({
      where: { gameId: id, isAlive: true },
      include: { role: true }
    });

    const goodsideCount = players.filter(p => p.currentAlignment === 'Goodside').length;
    const badsideCount = players.filter(p => p.currentAlignment === 'Badside').length;
    const totalWW = players.filter(p => p.roleId === 'werewolf' || p.roleId === 'lone_wolf').length;

    let winner = null;
    let message = "";

    if (totalWW === 0) {
      winner = "GOODSIDE";
      message = "SELAMAT! Semua Werewolf telah dimusnahkan. Warga menang!";
    } else if (badsideCount >= goodsideCount) {
      winner = "BADSIDE";
      message = "DOMINASI SERIGALA! Jumlah Werewolf setara warga. Werewolf menang!";
    }

    return NextResponse.json({ winner, message, goodsideCount, badsideCount });
  } catch (error) {
    return NextResponse.json({ error: "Gagal cek kemenangan" }, { status: 500 });
  }
}