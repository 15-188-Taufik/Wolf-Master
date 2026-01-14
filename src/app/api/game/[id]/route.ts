import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(
  req: Request,
  // Di Next.js terbaru, params adalah Promise
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // LANGKAH KRUSIAL: Unwrapping params dengan await
    const { id } = await params;

    const game = await prisma.game.findUnique({
      where: { id: id },
      include: {
        players: {
          include: { role: true },
          orderBy: { nickname: 'asc' }
        },
        logs: true
      }
    });

    if (!game) {
      return NextResponse.json({ error: "Game tidak ditemukan" }, { status: 404 });
    }

    return NextResponse.json(game);
  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json({ error: "Gagal mengambil detail game" }, { status: 500 });
  }
}