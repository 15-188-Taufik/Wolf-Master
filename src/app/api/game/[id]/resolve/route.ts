import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { actions: rawActions, great_shaman_mode: greatShamanMode } = body as {
      actions: Record<string, string>;
      great_shaman_mode?: 'check' | 'transform';
    };
    const actions = { ...rawActions };

    console.log('📋 [RESOLVE] Incoming actions:', JSON.stringify(actions));

    const game = await prisma.game.findUnique({ where: { id }, select: { currentTurn: true } });
    const currentTurn = game?.currentTurn ?? 1;

    // 1. Ambil data pemain hidup & mati
    const players = await prisma.player.findMany({
      where: { gameId: id, isAlive: true },
      include: { role: true }
    });
    const deadPlayers = await prisma.player.findMany({
      where: { gameId: id, isAlive: false },
      include: { role: true }
    });

    console.log('👥 [RESOLVE] Players:', players.map(p => ({ id: p.id, nickname: p.nickname, roleId: p.roleId })));

    // Ghost: mati otomatis di malam ke-2
    let deaths: string[] = [];
    let reports: string[] = [];
    if (currentTurn === 2) {
      const ghosts = players.filter(p => p.roleId === 'ghost');
      if (ghosts.length > 0) {
        for (const g of ghosts) deaths.push(g.id);
        reports.push("Ghost meninggal di malam kedua.");
      }
    }

    // Handle special werewolf_hunt key - map to all werewolf and wolfman players
    let normalizedActions = { ...actions };
    delete (normalizedActions as any).great_shaman_mode;
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

    let protections: string[] = [];
    let blacksmithActive = false;
    let silencedPlayers: string[] = [];
    let reportedDeaths: Set<string> = new Set(); // Track reported deaths to avoid duplicates

    // --- PHASE 1: SETUP & MANIPULATION (Thief, Blacksmith, Protection, Orphan, Great Shaman) ---
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
          reports.push("Thief mencuri identitas salah satu warga.");
          break;

        case 'blacksmith':
          phase1ActorIds.push(actor.id);
          blacksmithActive = true;
          if (!reportedDeaths.has('blacksmith_active')) {
            reports.push("Blacksmith menyebarkan biji besi; Werewolf akan kesulitan masuk.");
            reportedDeaths.add('blacksmith_active');
          }
          break;

        case 'guardian':
          phase1ActorIds.push(actor.id);
          protections.push(target.id);
          reports.push("Guardian berhasil melindungi warga.");
          break;
        case 'doctor':
          phase1ActorIds.push(actor.id);
          protections.push(target.id);
          reports.push(`Doctor menyembuhkan ${target.nickname}.`);
          break;

        case 'orphan':
          // Orphan hanya beraksi di malam pertama (hari pertama): pilih bapak
          if (currentTurn === 1) {
            phase1ActorIds.push(actor.id);
            await prisma.player.update({
              where: { id: actor.id },
              data: { parentId: target.id }
            });
            reports.push(`Orphan memilih ${target.nickname} sebagai bapak.`);
          }
          break;
      }
    }

    // Great Shaman: hanya jika ada mayat; aksi = cek role mayat ATAU berubah jadi role mayat (sekali saja)
    const greatShamanPlayers = players.filter(p => p.roleId === 'great_shaman');
    for (const shaman of greatShamanPlayers) {
      const deadTargetId = normalizedActions[shaman.id] as string | undefined;
      if (!deadTargetId || !greatShamanMode || deadPlayers.length === 0) continue;
      const deadTarget = deadPlayers.find(p => p.id === deadTargetId);
      if (!deadTarget) continue;

      phase1ActorIds.push(shaman.id);
      if (greatShamanMode === 'check') {
        reports.push(`Great Shaman mengecek mayat ${deadTarget.nickname}: role adalah ${deadTarget.role.name}.`);
      } else if (greatShamanMode === 'transform') {
        const currentEffects = Array.isArray(shaman.effects) ? shaman.effects : [];
        if (currentEffects.includes('great_shaman_transformed')) continue; // hanya sekali
        await prisma.player.update({
          where: { id: shaman.id },
          data: {
            roleId: deadTarget.roleId,
            effects: [...currentEffects, 'great_shaman_transformed']
          }
        });
        reports.push(`Great Shaman mengambil bentuk ${deadTarget.nickname} dan berubah menjadi ${deadTarget.role.name}.`);
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
              reports.push("Serigala mencoba masuk ke desa, tetapi terhalang oleh biji besi Blacksmith.");
              reportedDeaths.add(`blacksmith_block_${target.id}`);
            }
          } else if (!protections.includes(target.id)) {
            deaths.push(target.id);
            if (!reportedDeaths.has(`werewolf_kill_${target.id}`)) {
              reports.push(`Serigala menerkam ${target.nickname}.`);
              reportedDeaths.add(`werewolf_kill_${target.id}`);
            }
          } else {
            if (!reportedDeaths.has(`werewolf_saved_${target.id}`)) {
              reports.push("Serigala mencoba menerkam warga, tetapi dilindungi Guardian.");
              reportedDeaths.add(`werewolf_saved_${target.id}`);
            }
          }
          break;

        case 'gunner':
          console.log(`🔫 [GUNNER] ${actor.nickname} shooting ${target.nickname}`);
          if (protections.includes(target.id)) {
            if (!reportedDeaths.has(`gunner_blocked_${target.id}`)) {
              reports.push("Gunner menembak warga, tetapi dilindungi Guardian.");
              reportedDeaths.add(`gunner_blocked_${target.id}`);
            }
          } else {
            deaths.push(target.id);
            if (!reportedDeaths.has(`gunner_kill_${target.id}`)) {
              reports.push(`Gunner menembak ${target.nickname}.`);
              reportedDeaths.add(`gunner_kill_${target.id}`);
            }
          }
          break;

        case 'psycopath':
          if (protections.includes(target.id)) {
            if (!reportedDeaths.has(`psycopath_blocked_${target.id}`)) {
              reports.push("Psycopath menyerang warga, tetapi dilindungi.");
              reportedDeaths.add(`psycopath_blocked_${target.id}`);
            }
          } else {
            deaths.push(target.id);
            if (!reportedDeaths.has(`psycopath_kill_${target.id}`)) {
              reports.push(`Psycopath menghabisi ${target.nickname}.`);
              reportedDeaths.add(`psycopath_kill_${target.id}`);
            }
          }
          break;

        case 'vampire':
          if (!protections.includes(target.id)) {
            if (target.roleId === 'villager') {
              await prisma.player.update({ where: { id: target.id }, data: { roleId: 'vampire' } });
              if (!reportedDeaths.has(`vampire_turn_${target.id}`)) {
                reports.push("Seorang warga merasa lemas dan menemukan bekas gigitan di leher.");
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
              reports.push("Harlot tewas karena mengunjungi rumah serigala.");
              reportedDeaths.add(`harlot_death_${actor.id}`);
            }
          } else {
            protections.push(actor.id);
            if (!reportedDeaths.has(`harlot_safe_${actor.id}`)) {
              reports.push("Harlot menginap di rumah seorang warga; Harlot aman malam ini.");
              reportedDeaths.add(`harlot_safe_${actor.id}`);
            }
          }
          break;

        case 'seer':
        case 'sorcerer':
          if (!reportedDeaths.has(`${actor.roleId}_see_${target.id}`)) {
            reports.push(`${actor.role.name} menerawang seorang warga: aura ${target.role.alignment}.`);
            reportedDeaths.add(`${actor.roleId}_see_${target.id}`);
          }
          break;

        case 'spellcaster':
          silencedPlayers.push(target.id);
          if (!reportedDeaths.has(`spellcaster_silence_${target.id}`)) {
            reports.push("Spellcaster membungkam seorang warga (tidak bisa bicara besok).");
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
      const orphans = updatedPlayers.filter(p => p.roleId === 'orphan' && p.parentId === deadPlayer.id);
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

    // Catat ke Log & increment turn
    await prisma.log.create({
      data: {
        gameId: id,
        turnNumber: currentTurn,
        phase: "MORNING_REPORT",
        message: reports.join(" | ") || "Malam yang sangat tenang, tidak ada korban."
      }
    });
    await prisma.game.update({
      where: { id },
      data: { currentTurn: currentTurn + 1 }
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