import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const game = await prisma.game.findUnique({
      where: { id },
      include: { players: { include: { role: true }, orderBy: { nickname: 'asc' } }, logs: true }
    });
    if (!game) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(game);
  } catch (error) {
    return NextResponse.json({ error: "Error" }, { status: 500 });
  }
}

// Fitur HAPUS GAME
export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await prisma.game.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Gagal menghapus" }, { status: 500 });
  }
}

// Fitur RENAME GAME
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { nama } = await req.json();
    const updated = await prisma.game.update({
      where: { id },
      data: { name: nama }
    });
    return NextResponse.json({ success: true, game: updated });
  } catch (error) {
    return NextResponse.json({ error: "Gagal update" }, { status: 500 });
  }
}