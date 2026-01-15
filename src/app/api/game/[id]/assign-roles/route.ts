import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

interface RoleAssignment {
  [roleId: string]: string[]; // roleId -> array of player IDs
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { roleAssignments } = body as { roleAssignments: RoleAssignment };

    console.log(`[assign-roles] Game ID: ${id}`);
    console.log(`[assign-roles] Role assignments:`, roleAssignments);

    // Get all players in the game
    const players = await prisma.player.findMany({
      where: { gameId: id },
      include: { role: true }
    });

    console.log(`[assign-roles] Found ${players.length} players`);

    if (!players.length) {
      console.warn(`[assign-roles] No players found for game ${id}`);
      return NextResponse.json(
        { error: "Tidak ada pemain dalam game ini" },
        { status: 400 }
      );
    }

    // Build role update array
    const updates: { playerId: string; roleId: string }[] = [];

    // Assign special roles based on explicit assignment
    for (const [roleId, playerIds] of Object.entries(roleAssignments)) {
      if (roleId !== 'villager' && Array.isArray(playerIds)) {
        for (const playerId of playerIds) {
          updates.push({ playerId, roleId });
        }
      }
    }

    // Assign remaining players as villagers
    const assignedPlayerIds = new Set(updates.map(u => u.playerId));
    const remainingPlayers = players.filter(p => !assignedPlayerIds.has(p.id));

    remainingPlayers.forEach(player => {
      updates.push({ playerId: player.id, roleId: 'villager' });
    });

    console.log(`[assign-roles] Total updates:`, updates.length);

    // Update players with their roles
    await Promise.all(
      updates.map(update =>
        prisma.player.update({
          where: { id: update.playerId },
          data: { roleId: update.roleId },
        })
      )
    );

    // Update game status to NIGHT
    const updatedGame = await prisma.game.update({
      where: { id },
      data: {
        status: 'NIGHT',
        currentTurn: 1,
      },
      include: {
        players: {
          include: { role: true },
        },
      },
    });

    console.log('[assign-roles] Game updated successfully');

    return NextResponse.json({
      success: true,
      game: updatedGame,
    });
  } catch (error: any) {
    console.error('[assign-roles] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Gagal mengassign role' },
      { status: 500 }
    );
  }
}
