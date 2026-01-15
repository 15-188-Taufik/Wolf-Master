import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { playerId } = await req.json();

    console.log(`[kill-day] Game ID: ${id}, Player ID: ${playerId}`);

    // Get the player to kill
    const player = await prisma.player.findUnique({
      where: { id: playerId },
      include: { role: true }
    });

    if (!player) {
      return NextResponse.json(
        { error: "Pemain tidak ditemukan" },
        { status: 404 }
      );
    }

    if (!player.isAlive) {
      return NextResponse.json(
        { error: "Pemain sudah mati" },
        { status: 400 }
      );
    }

    // Mark player as dead
    await prisma.player.update({
      where: { id: playerId },
      data: { isAlive: false }
    });

    // Check if there's a lover - if yes, lover also dies
    let deaths = [playerId];
    if (player.linkedToId) {
      const lover = await prisma.player.findUnique({
        where: { id: player.linkedToId }
      });
      if (lover && lover.isAlive) {
        await prisma.player.update({
          where: { id: player.linkedToId },
          data: { isAlive: false }
        });
        deaths.push(player.linkedToId);
      }
    }

    // Create log
    const deadPlayers = await prisma.player.findMany({
      where: { id: { in: deaths } }
    });
    const deathMessage = deadPlayers.map(p => p.nickname).join(", ") + " telah tewas dalam voting siang hari.";
    
    // Get current game state to get turn number and phase
    const game = await prisma.game.findUnique({
      where: { id }
    });
    
    await prisma.log.create({
      data: {
        gameId: id,
        message: deathMessage,
        turnNumber: game?.currentTurn || 1,
        phase: "DAY"
      }
    });

    // Check win condition
    const survivors = await prisma.player.findMany({
      where: { gameId: id, isAlive: true },
      include: { role: true }
    });

    const goodsideCount = survivors.filter(p => p.role.alignment === 'Goodside').length;
    const badsideCount = survivors.filter(p => p.role.alignment === 'Badside').length;

    let gameFinished = false;
    let winner = null;

    if (badsideCount === 0) {
      gameFinished = true;
      winner = "GOODSIDE";
    } else if (badsideCount >= goodsideCount) {
      gameFinished = true;
      winner = "BADSIDE";
    }

    if (gameFinished) {
      await prisma.game.update({
        where: { id },
        data: { status: "FINISHED" }
      });
    }

    return NextResponse.json({
      success: true,
      message: deathMessage,
      gameFinished,
      winner
    });
  } catch (error: any) {
    console.error('[kill-day] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Gagal membunuh pemain' },
      { status: 500 }
    );
  }
}
