import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { players } = await req.json(); // Data: [{ nickname, roleId }, ...]

    const newGame = await prisma.game.create({
      data: {
        status: "NIGHT",
        currentTurn: 1,
        players: {
          create: players.map((p: any) => ({
            nickname: p.nickname,
            roleId: p.roleId,
            currentAlignment: "Goodside", // Logic alignment akan diatur di sistem fase malam
            isAlive: true,
          })),
        },
      },
    });

    return NextResponse.json(newGame);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Gagal membuat sesi game" }, { status: 500 });
  }
}