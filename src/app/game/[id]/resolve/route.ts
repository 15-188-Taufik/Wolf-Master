import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 1. Unwrapping params (WAJIB di Next.js 15)
    const { id } = await params;
    
    // 2. Ambil body request
    const body = await req.json();
    const { wwTarget, guardianTarget, harlotTarget, doctorHealTarget } = body;

    console.log("Memulai Kalkulasi Malam untuk Game:", id);

    // 3. Ambil data semua pemain yang masih hidup
    const players = await prisma.player.findMany({
      where: { gameId: id, isAlive: true },
      include: { role: true }
    });

    let deaths: string[] = [];
    let reports: string[] = [];

    // --- LOGIKA KALKULASI ---

    // A. Werewolf Attack
    if (wwTarget) {
      const isProtected = wwTarget === guardianTarget;
      const isHealed = wwTarget === doctorHealTarget;
      const victim = players.find(p => p.id === wwTarget);

      if (isProtected || isHealed) {
        reports.push(`Seseorang diserang Werewolf, tapi berhasil selamat!`);
      } else if (victim) {
        deaths.push(wwTarget);
        reports.push(`${victim.nickname} (${victim.role.name}) tewas diterkam Werewolf.`);
      }
    }

    // B. Harlot Check (Mati jika datangi Werewolf)
    if (harlotTarget) {
      const target = players.find(p => p.id === harlotTarget);
      const harlot = players.find(p => p.roleId === 'harlot');
      
      const isWolf = target?.roleId === 'werewolf' || target?.roleId === 'wolfman' || target?.roleId === 'lone_wolf';
      
      if (isWolf && harlot) {
        deaths.push(harlot.id);
        reports.push(`Harlot tewas karena mengunjungi rumah Werewolf.`);
      }
    }

    // C. Lover Effect (Efek Berantai)
    // Kita lakukan pengecekan sederhana, jika satu mati, pasangannya ikut mati
    for (const deathId of [...deaths]) {
      const deadPlayer = players.find(p => p.id === deathId);
      if (deadPlayer?.linkedToId) {
        const partner = players.find(p => p.id === deadPlayer.linkedToId);
        if (partner && partner.isAlive && !deaths.includes(partner.id)) {
          deaths.push(partner.id);
          reports.push(`${partner.nickname} mati karena patah hati (Lover).`);
        }
      }
    }

    // 4. Update Database (Hanya jika ada yang mati)
    if (deaths.length > 0) {
      await prisma.player.updateMany({
        where: { id: { in: deaths } },
        data: { isAlive: false }
      });
    }

    // 5. Catat Log ke Database
    await prisma.log.create({
      data: {
        gameId: id,
        turnNumber: 1,
        phase: "MORNING",
        message: reports.length > 0 ? reports.join(" | ") : "Malam yang tenang, tidak ada korban."
      }
    });

    return NextResponse.json({ 
      success: true, 
      deaths, 
      reports: reports.length > 0 ? reports : ["Malam yang tenang, tidak ada korban."] 
    });

  } catch (error: any) {
    console.error("RESOLVE_ERROR:", error);
    return NextResponse.json({ 
      error: "Gagal menghitung kalkulasi", 
      details: error.message 
    }, { status: 500 });
  }
}