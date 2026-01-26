import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { actions } = await req.json(); // Format: { [actorId]: targetId } or werewolf_hunt: targetId

    console.log('📋 [RESOLVE] Incoming actions:', JSON.stringify(actions));

    // 1. Ambil data semua pemain & role yang masih hidup
    const players = await prisma.player.findMany({
      where: { gameId: id, isAlive: true },
      include: { role: true }
    });

    console.log('👥 [RESOLVE] Players:', players.map(p => ({ id: p.id, nickname: p.nickname, roleId: p.roleId })));

    // Handle special werewolf_hunt key - map to all werewolf and wolfman players
    let normalizedActions = { ...actions };
    if (actions.werewolf_hunt) {
      const werewolfPlayers = players.filter(p => ['werewolf', 'wolfman'].includes(p.roleId));
      for (const wolf of werewolfPlayers) {
        normalizedActions[wolf.id] = actions.werewolf_hunt;
      }
      delete normalizedActions.werewolf_hunt;
    }

    console.log('🔄 [RESOLVE] Normalized actions:', JSON.stringify(normalizedActions));

    // Urutkan aksi berdasarkan nightPriority peran si pelaku (Priority 0 - 99)
    const sortedActions = Object.entries(normalizedActions)
      .map(([actorId, targetId]) => ({
        actor: players.find(p => p.id === actorId),
        target: players.find(p => p.id === (targetId as string)),
      }))
      .filter(a => a.actor && a.target)
      .sort((a, b) => (a.actor?.role.nightPriority || 99) - (b.actor?.role.nightPriority || 99));

    console.log('📊 [RESOLVE] Sorted actions:', sortedActions.map(a => ({ actor: a.actor?.nickname, actorRole: a.actor?.roleId, target: a.target?.nickname })));

    let deaths: string[] = [];
    let protections: string[] = [];
    let reports: string[] = [];
    let blacksmithActive = false;
    let silencedPlayers: string[] = [];
    let reportedDeaths: Set<string> = new Set(); // Track reported deaths to avoid duplicates

    // --- PHASE 1: SETUP & MANIPULATION (Thief, Blacksmith, Protection) ---
    let phase1ActorIds: string[] = []; // Track which players were involved in Phase 1
    
    for (const action of sortedActions) {
      const { actor, target } = action;
      if (!actor || !target) continue;

      switch (actor.roleId) {
        case 'thief':
          // Track that this player was involved in Phase 1 ONLY if they actually have an action
          phase1ActorIds.push(actor.id);
          // Mekanisme Thief: Langsung tukar roleId di database
          const actorRole = actor.roleId;
          const targetRole = target.roleId;
          await prisma.$transaction([
            prisma.player.update({ where: { id: actor.id }, data: { roleId: targetRole } }),
            prisma.player.update({ where: { id: target.id }, data: { roleId: actorRole } })
          ]);
          reports.push("Seorang Thief telah mencuri identitas salah satu warga!");
          break;

        case 'blacksmith':
          phase1ActorIds.push(actor.id);
          blacksmithActive = true;
          if (!reportedDeaths.has('blacksmith_active')) {
            reports.push("Blacksmith menyebarkan biji besi, Werewolf akan kesulitan masuk.");
            reportedDeaths.add('blacksmith_active');
          }
          break;

        case 'guardian':
        case 'doctor':
          phase1ActorIds.push(actor.id);
          protections.push(target.id);
          break;
      }
    }

    // Re-fetch players to get updated roles after Phase 1
    const updatedPlayers = await prisma.player.findMany({
      where: { gameId: id, isAlive: true },
      include: { role: true }
    });

    // Rebuild sortedActions with updated player data
    const updatedSortedActions = Object.entries(normalizedActions)
      .map(([actorId, targetId]) => ({
        actor: updatedPlayers.find(p => p.id === actorId),
        target: updatedPlayers.find(p => p.id === (targetId as string)),
      }))
      .filter(a => a.actor && a.target)
      .sort((a, b) => (a.actor?.role.nightPriority || 99) - (b.actor?.role.nightPriority || 99));

    console.log('🔄 [PHASE 1.5] Updated sorted actions:', updatedSortedActions.map(a => ({ actor: a.actor?.nickname, actorRole: a.actor?.roleId, priority: a.actor?.role.nightPriority, target: a.target?.nickname })));

    // --- PHASE 2: KILLING & SPECIAL ACTIONS (WW, Gunner, Psycopath, Vampire, etc.) ---
    for (const action of updatedSortedActions) {
      const { actor, target } = action;
      if (!actor || !target || !actor.isAlive) continue;

      console.log(`⚔️ [PHASE 2] Processing ${actor.nickname} (${actor.roleId}) targeting ${target.nickname}`);

      // Skip players that were already involved in Phase 1 (even if their role changed)
      if (phase1ActorIds.includes(actor.id)) {
        console.log(`⏭️ [PHASE 2] Skipping ${actor.nickname} because they were involved in Phase 1`);
        continue;
      }

      switch (actor.roleId) {
        case 'werewolf':
        case 'wolfman':
        case 'lone_wolf':
          if (blacksmithActive) {
            if (!reportedDeaths.has(`blacksmith_block_${target.id}`)) {
              reports.push("Werewolf mencoba menyerang, namun terhalang oleh biji besi!");
              reportedDeaths.add(`blacksmith_block_${target.id}`);
            }
          } else if (!protections.includes(target.id)) {
            deaths.push(target.id);
            if (!reportedDeaths.has(`werewolf_kill_${target.id}`)) {
              reports.push(`${target.nickname} tewas mengenaskan akibat terkaman serigala.`);
              reportedDeaths.add(`werewolf_kill_${target.id}`);
            }
          } else {
            if (!reportedDeaths.has(`werewolf_saved_${target.id}`)) {
              reports.push(`Serangan serigala pada ${target.nickname} berhasil digagalkan oleh pelindung!`);
              reportedDeaths.add(`werewolf_saved_${target.id}`);
            }
          }
          break;

        case 'gunner':
          console.log(`🔫 [GUNNER] ${actor.nickname} shooting ${target.nickname}`);
          deaths.push(target.id);
          if (!reportedDeaths.has(`gunner_kill_${target.id}`)) {
            reports.push(`*DOR!* Suara tembakan terdengar keras. ${target.nickname} tewas seketika.`);
            reportedDeaths.add(`gunner_kill_${target.id}`);
          }
          break;

        case 'psycopath':
          if (!protections.includes(target.id)) {
            deaths.push(target.id);
            if (!reportedDeaths.has(`psycopath_kill_${target.id}`)) {
              reports.push(`Seorang psikopat telah menghabisi ${target.nickname} dengan kejam.`);
              reportedDeaths.add(`psycopath_kill_${target.id}`);
            }
          }
          break;

        case 'vampire':
          if (!protections.includes(target.id)) {
            if (target.roleId === 'villager') {
              await prisma.player.update({ where: { id: target.id }, data: { roleId: 'vampire' } });
              if (!reportedDeaths.has(`vampire_turn_${target.id}`)) {
                reports.push(`${target.nickname} merasa lemas dan menemukan bekas gigitan di leher.`);
                reportedDeaths.add(`vampire_turn_${target.id}`);
              }
            } else {
              deaths.push(target.id);
              if (!reportedDeaths.has(`vampire_kill_${target.id}`)) {
                reports.push(`${target.nickname} ditemukan tewas kehabisan darah.`);
                reportedDeaths.add(`vampire_kill_${target.id}`);
              }
            }
          }
          break;

        case 'harlot':
          const targetIsWolf = ['werewolf', 'wolfman', 'lone_wolf'].includes(target.roleId);
          if (targetIsWolf) {
            deaths.push(actor.id);
            if (!reportedDeaths.has(`harlot_death_${actor.id}`)) {
              reports.push(`Harlot tewas karena nekat mengunjungi rumah serigala.`);
              reportedDeaths.add(`harlot_death_${actor.id}`);
            }
          } else {
            // Harlot selamat jika menginap di rumah orang baik
            protections.push(actor.id);
            if (!reportedDeaths.has(`harlot_safe_${actor.id}`)) {
              reports.push(`Harlot sedang tidak berada di rumahnya sendiri malam ini.`);
              reportedDeaths.add(`harlot_safe_${actor.id}`);
            }
          }
          break;

        case 'seer':
        case 'sorcerer':
          if (!reportedDeaths.has(`${actor.roleId}_see_${target.id}`)) {
            reports.push(`${actor.role.name} menerawang ${target.nickname}: Terlihat aura **${target.role.alignment}**.`);
            reportedDeaths.add(`${actor.roleId}_see_${target.id}`);
          }
          break;

        case 'spellcaster':
          silencedPlayers.push(target.id);
          if (!reportedDeaths.has(`spellcaster_silence_${target.id}`)) {
            reports.push(`${target.nickname} telah dibungkam secara magis (Tidak bisa bicara besok).`);
            reportedDeaths.add(`spellcaster_silence_${target.id}`);
          }
          break;
      }
    }

    // --- PHASE 3: CHAIN REACTIONS (Lover & Orphan) ---
    // Gunakan Set untuk menghindari duplikasi kematian
    let finalDeaths = [...new Set(deaths)];

    console.log('💀 [PHASE 2 END] Deaths collected:', finalDeaths.map(id => players.find(p => p.id === id)?.nickname));
    console.log('📝 [PHASE 2 END] Reports:', reports);

    for (const deathId of finalDeaths) {
      const deadPlayer = players.find(p => p.id === deathId);
      if (!deadPlayer) continue;

      // 1. Lover Effect: Jika satu mati, pasangannya ikut mati
      if (deadPlayer.linkedToId) {
        const partner = players.find(p => p.id === deadPlayer.linkedToId);
        if (partner && partner.isAlive && !finalDeaths.includes(partner.id)) {
          finalDeaths.push(partner.id);
          if (!reportedDeaths.has(`lover_death_${partner.id}`)) {
            reports.push(`${partner.nickname} tewas karena patah hati ditinggal pasangannya.`);
            reportedDeaths.add(`lover_death_${partner.id}`);
          }
        }
      }

      // 2. Orphan Effect: Jika "Bapak" (parentId) mati, Orphan jadi Werewolf
      const orphans = players.filter(p => p.parentId === deadPlayer.id && p.roleId === 'orphan');
      for (const orphan of orphans) {
        await prisma.player.update({
          where: { id: orphan.id },
          data: { roleId: 'werewolf' }
        });
        if (!reportedDeaths.has(`orphan_transform_${orphan.id}`)) {
          reports.push(`Seseorang kehilangan pelindungnya dan berubah menjadi buas!`);
          reportedDeaths.add(`orphan_transform_${orphan.id}`);
        }
      }
    }

    // --- PHASE 4: UPDATE DATABASE & GAME OVER CHECK ---
    // Update status kematian
    if (finalDeaths.length > 0) {
      await prisma.player.updateMany({
        where: { id: { in: finalDeaths } },
        data: { isAlive: false }
      });
    }

    // Ambil sisa pemain yang masih hidup setelah resolusi
    const survivors = await prisma.player.findMany({
      where: { gameId: id, isAlive: true },
      include: { role: true }
    });

    const goodsideCount = survivors.filter(p => p.role.alignment === 'Goodside').length;
    const badsideCount = survivors.filter(p => p.role.alignment === 'Badside').length;

    let isGameOver = false;
    let winner = null;

    if (badsideCount === 0) {
      isGameOver = true;
      winner = "GOODSIDE";
      reports.push("Seluruh ancaman telah dimusnahkan. Warga desa menang!");
    } else if (badsideCount >= goodsideCount) {
      isGameOver = true;
      winner = "BADSIDE";
      reports.push("Werewolf kini mendominasi desa. Tim Badside menang!");
    }

    // Update status game jika berakhir
    if (isGameOver) {
      await prisma.game.update({
        where: { id },
        data: { status: "FINISHED" }
      });
    }

    // Catat ke Log
    await prisma.log.create({
      data: {
        gameId: id,
        turnNumber: 1, // Logika turn bisa disesuaikan
        phase: "MORNING_REPORT",
        message: reports.join(" | ") || "Malam yang sangat tenang, tidak ada korban."
      }
    });

    return NextResponse.json({
      success: true,
      reports: reports.length > 0 ? reports : ["Malam yang sangat tenang, tidak ada korban."],
      isGameOver,
      winner,
      deaths: finalDeaths
    });

  } catch (error: any) {
    console.error("RESOLVE_ERROR:", error);
    return NextResponse.json({ 
      success: false, 
      error: "Gagal memproses malam", 
      details: error.message 
    }, { status: 500 });
  }
}