import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const game = await prisma.game.findUnique({ where: { id }, include: { players: { include: { role: true } }, logs: true } });
  return NextResponse.json(game || { error: "Not found" });
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await prisma.game.delete({ where: { id } });
  return NextResponse.json({ success: true });
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { name } = await req.json();
  const game = await prisma.game.update({ where: { id }, data: { name } });
  return NextResponse.json({ success: true, game });
}