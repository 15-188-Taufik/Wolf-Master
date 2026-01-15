import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const players = await prisma.masterPlayer.findMany({
      orderBy: { nickname: 'asc' }
    });
    // Pastikan mengembalikan array kosong [] jika data tidak ada, bukan null
    return NextResponse.json(players || []); 
  } catch (error) {
    console.error(error);
    // Jika error, kirim array kosong agar UI tidak crash
    return NextResponse.json([], { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { nickname } = await req.json();
    if (!nickname) return NextResponse.json({ error: "Nama kosong" }, { status: 400 });

    const player = await prisma.masterPlayer.upsert({
      where: { nickname: nickname.trim() },
      update: {},
      create: { nickname: nickname.trim() }
    });
    return NextResponse.json(player);
  } catch (error) {
    return NextResponse.json({ error: "Gagal simpan" }, { status: 500 });
  }
}