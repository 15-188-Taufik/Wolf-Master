import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const letter = (body.letter as string)?.trim()?.toUpperCase()?.slice(0, 1);
    if (!letter || !/^[A-Z]$/.test(letter)) {
      return NextResponse.json(
        { error: "Hint harus 1 huruf A-Z" },
        { status: 400 }
      );
    }

    const game = await prisma.game.findUnique({ where: { id } });
    if (!game) {
      return NextResponse.json({ error: "Game tidak ditemukan" }, { status: 404 });
    }

    await prisma.log.create({
      data: {
        gameId: id,
        turnNumber: game.currentTurn,
        phase: "GHOST_HINT",
        message: `Ghost memberi hint: "${letter}".`,
      },
    });

    return NextResponse.json({ success: true, letter });
  } catch (error: any) {
    console.error("GHOST_HINT_ERROR:", error);
    return NextResponse.json(
      { error: "Gagal menyimpan hint Ghost" },
      { status: 500 }
    );
  }
}
