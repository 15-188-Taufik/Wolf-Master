import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { playerId, reason } = await req.json();

    // Update status pemain menjadi mati
    const updatedPlayer = await prisma.player.update({
      where: { id: playerId },
      data: { isAlive: false }
    });

    // Catat ke log sejarah
    await prisma.log.create({
      data: {
        gameId: id,
        turnNumber: 1, // Bisa dibuat dinamis nantinya
        phase: "VOTING",
        message: `${updatedPlayer.nickname} telah dieksekusi mati oleh warga. Alasan: ${reason}`
      }
    });

    return NextResponse.json({ success: true, nickname: updatedPlayer.nickname });
  } catch (error) {
    return NextResponse.json({ error: "Gagal mengeksekusi pemain" }, { status: 500 });
  }
}