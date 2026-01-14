import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { actions } = await req.json(); // Format: { [actorId]: targetId }

    // 1. Ambil data semua pemain & role yang masih hidup
    const players = await prisma.player.findMany({
      where: { gameId: id, isAlive: true },
      include: { role: true }
    });

    // Urutkan aksi berdasarkan nightPriority peran si pelaku (Priority 0 - 99)
    const sortedActions = Object.entries(actions)
      .map(([actorId, targetId]) => ({
        actor: players.find(p => p.id === actorId),
        target: players.find(p => p.id === (targetId as string)),
      }))
      .filter(a => a.actor && a.target)
      .sort((a, b) => (a.actor?.role.nightPriority || 99) - (b.actor?.role.nightPriority || 99));

    let deaths: string[] = [];
    let protections: string[] = [];
    let reports: string[] = [];
    let blacksmithActive = false;
    let silencedPlayers: string[] = [];

    // --- PHASE 1: SETUP & MANIPULATION (Thief, Blacksmith, Protection) ---
    for (const action of sortedActions) {
      const { actor, target } = action;
      if (!actor || !target) continue;

      switch (actor.roleId) {
        case 'thief':
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
          blacksmithActive = true;
          reports.push("Blacksmith menyebarkan biji besi, Werewolf akan kesulitan masuk.");
          break;

        case 'guardian':
        case 'doctor':
          protections.push(target.id);
          break;
      }
    }

    // --- PHASE 2: KILLING & SPECIAL ACTIONS (WW, Gunner, Psycopath, Vampire, etc.) ---
    for (const action of sortedActions) {
      const { actor, target } = action;
      if (!actor || !target || !actor.isAlive) continue;

      // Skip role yang sudah diproses di Phase 1
      if (['thief', 'blacksmith', 'guardian', 'doctor'].includes(actor.roleId)) continue;

      switch (actor.roleId) {
        case 'werewolf':
        case 'wolfman':
        case 'lone_wolf':
          if (blacksmithActive) {
            reports.push("Werewolf mencoba menyerang, namun terhalang oleh biji besi!");
          } else if (!protections.includes(target.id)) {
            deaths.push(target.id);
            reports.push(`${target.nickname} tewas mengenaskan akibat terkaman serigala.`);
          } else {
            reports.push(`Serangan serigala pada ${target.nickname} berhasil digagalkan oleh pelindung!`);
          }
          break;

        case 'gunner':
          deaths.push(target.id);
          reports.push(`*DOR!* Suara tembakan terdengar keras. ${target.nickname} tewas seketika.`);
          break;

        case 'psycopath':
          if (!protections.includes(target.id)) {
            deaths.push(target.id);
            reports.push(`Seorang psikopat telah menghabisi ${target.nickname} dengan kejam.`);
          }
          break;

        case 'vampire':
          if (!protections.includes(target.id)) {
            if (target.roleId === 'villager') {
              await prisma.player.update({ where: { id: target.id }, data: { roleId: 'vampire' } });
              reports.push(`${target.nickname} merasa lemas dan menemukan bekas gigitan di leher.`);
            } else {
              deaths.push(target.id);
              reports.push(`${target.nickname} ditemukan tewas kehabisan darah.`);
            }
          }
          break;

        case 'harlot':
          const targetIsWolf = ['werewolf', 'wolfman', 'lone_wolf'].includes(target.roleId);
          if (targetIsWolf) {
            deaths.push(actor.id);
            reports.push(`Harlot tewas karena nekat mengunjungi rumah serigala.`);
          } else {
            // Harlot selamat jika menginap di rumah orang baik
            protections.push(actor.id);
            reports.push(`Harlot sedang tidak berada di rumahnya sendiri malam ini.`);
          }
          break;

        case 'seer':
        case 'sorcerer':
          reports.push(`${actor.role.name} menerawang ${target.nickname}: Terlihat aura **${target.role.alignment}**.`);
          break;

        case 'spellcaster':
          silencedPlayers.push(target.id);
          reports.push(`${target.nickname} telah dibungkam secara magis (Tidak bisa bicara besok).`);
          break;
      }
    }

    // --- PHASE 3: CHAIN REACTIONS (Lover & Orphan) ---
    // Gunakan Set untuk menghindari duplikasi kematian
    let finalDeaths = [...new Set(deaths)];

    for (const deathId of finalDeaths) {
      const deadPlayer = players.find(p => p.id === deathId);
      if (!deadPlayer) continue;

      // 1. Lover Effect: Jika satu mati, pasangannya ikut mati
      if (deadPlayer.linkedToId) {
        const partner = players.find(p => p.id === deadPlayer.linkedToId);
        if (partner && partner.isAlive && !finalDeaths.includes(partner.id)) {
          finalDeaths.push(partner.id);
          reports.push(`${partner.nickname} tewas karena patah hati ditinggal pasangannya.`);
        }
      }

      // 2. Orphan Effect: Jika "Bapak" (parentId) mati, Orphan jadi Werewolf
      const orphans = players.filter(p => p.parentId === deadPlayer.id && p.roleId === 'orphan');
      for (const orphan of orphans) {
        await prisma.player.update({
          where: { id: orphan.id },
          data: { roleId: 'werewolf' }
        });
        reports.push(`Seseorang kehilangan pelindungnya dan berubah menjadi buas!`);
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