import { prisma } from "@/lib/prisma";

async function cleanupDuplicatePlayers() {
  try {
    console.log("🧹 Starting cleanup of duplicate MasterPlayers...");

    // Get all master players grouped by nickname
    const allPlayers = await prisma.masterPlayer.findMany({
      orderBy: [{ nickname: 'asc' }, { createdAt: 'desc' }]
    });

    // Find duplicates
    const playersByNickname: Record<string, string[]> = {};
    allPlayers.forEach(player => {
      if (!playersByNickname[player.nickname]) {
        playersByNickname[player.nickname] = [];
      }
      playersByNickname[player.nickname].push(player.id);
    });

    let deletedCount = 0;

    // Keep only the latest one, delete the rest
    for (const [nickname, ids] of Object.entries(playersByNickname)) {
      if (ids.length > 1) {
        const idsToDelete = ids.slice(1); // Keep first (latest), delete rest
        console.log(`Found ${ids.length} duplicates for "${nickname}" - keeping 1, deleting ${ids.length - 1}`);

        const result = await prisma.masterPlayer.deleteMany({
          where: { id: { in: idsToDelete } }
        });

        deletedCount += result.count;
      }
    }

    console.log(`✅ Cleanup complete! Deleted ${deletedCount} duplicate records.`);
  } catch (error) {
    console.error("❌ Error during cleanup:", error);
  } finally {
    await prisma.$disconnect();
  }
}

cleanupDuplicatePlayers();
