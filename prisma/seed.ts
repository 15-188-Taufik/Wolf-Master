import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const roles = [
    // --- PRIORITAS MALAM 1-3 (Setup & Linkage) ---
    { id: 'mason', name: 'Mason', alignment: 'Goodside', nightPriority: 0, description: 'Warga yang saling mengenal sesama Mason.' },
    { id: 'beholder', name: 'Beholder', alignment: 'Goodside', nightPriority: 1, description: 'Mati jika ada yang mengaku Beholder.' },
    { id: 'thief', name: 'Thief', alignment: 'Neutral', nightPriority: 1, description: 'Mencuri kartu pemain lain di malam pertama.' },
    { id: 'orphan', name: 'Orphan', alignment: 'Goodside', nightPriority: 2, description: 'Menunjuk 1 pemain jadi bapak. Jika bapak mati, Orphan jadi WW.' },
    { id: 'lover', name: 'Lover', alignment: 'Neutral', nightPriority: 2, description: 'Memilih pasangan hidup semati.' },

    // --- PRIORITAS MALAM 3-5 (Killing Roles) ---
    { id: 'vampire', name: 'Vampire', alignment: 'Badside', nightPriority: 3, description: 'Menggigit warga jadi Vampire, atau membunuh role spesial.' },
    { id: 'psycopath', name: 'Psycopath', alignment: 'Badside', nightPriority: 3, description: 'Membunuh 1 pemain setiap malam.' },
    { id: 'werewolf', name: 'Werewolf', alignment: 'Badside', nightPriority: 4, description: 'Memangsa warga desa di malam hari.' },
    { id: 'wolfman', name: 'Wolfman', alignment: 'Badside', nightPriority: 4, description: 'Werewolf yang terdeteksi sebagai orang baik oleh Seer.' },
    { id: 'lone_wolf', name: 'Lone Wolf', alignment: 'Badside', nightPriority: 4, description: 'Hanya bisa memangsa jika WW lain sudah mati.' },

    // --- PRIORITAS MALAM 5-9 (Protection & Sabotage) ---
    { id: 'guardian', name: 'Guardian', alignment: 'Goodside', nightPriority: 5, description: 'Melindungi 1 warga dari serangan Werewolf.' },
    { id: 'doctor', name: 'Doctor', alignment: 'Goodside', nightPriority: 6, description: 'Menghidupkan warga yang mati (kesempatan 2x).' },
    { id: 'harlot', name: 'Harlot', alignment: 'Goodside', nightPriority: 7, description: 'Bercinta dengan 1 orang. Mati jika mendatangi Werewolf.' },
    { id: 'blacksmith', name: 'Blacksmith', alignment: 'Goodside', nightPriority: 8, description: 'Menyebar biji besi agar WW tidak bisa masuk (1x).' },

    // --- PRIORITAS MALAM 10-15 (Information & Magic) ---
    { id: 'seer', name: 'Seer', alignment: 'Goodside', nightPriority: 10, description: 'Menerawang peran pemain (Good/Evil).' },
    { id: 'sorcerer', name: 'Sorcerer', alignment: 'Badside', nightPriority: 10, description: 'Seer versi pihak Badside.' },
    { id: 'impression_seer', name: 'Impression Seer', alignment: 'Goodside', nightPriority: 11, description: 'Menjadi Seer jika Seer utama mati.' },
    { id: 'spellcaster', name: 'Spellcaster', alignment: 'Goodside', nightPriority: 12, description: 'Membungkam diskusi 1 pemain di siang hari.' },
    { id: 'gunner', name: 'Gunner', alignment: 'Goodside', nightPriority: 13, description: 'Memiliki 2 peluru untuk menembak di malam hari.' },
    { id: 'great_shaman', name: 'Great Shaman', alignment: 'Goodside', nightPriority: 14, description: 'Mengecek bangkai (WW/Bukan) atau Necromancy.' },

    // --- PRIORITAS 99 (Passive Roles / No Night Action) ---
    { id: 'villager', name: 'Villager', alignment: 'Goodside', nightPriority: 99, description: 'Warga desa biasa tanpa kekuatan.' },
    { id: 'king', name: 'King', alignment: 'Goodside', nightPriority: 99, description: 'Tidak bisa dikeluarkan melalui voting siang hari.' },
    { id: 'drunk', name: 'Drunk', alignment: 'Goodside', nightPriority: 99, description: 'Jika dimakan, Werewolf puasa di malam berikutnya.' },
    { id: 'ghost', name: 'Ghost', alignment: 'Goodside', nightPriority: 99, description: 'Mati malam ke-2. Memberi hint 1 huruf tiap siang.' },
    { id: 'hunter', name: 'Hunter', alignment: 'Goodside', nightPriority: 99, description: 'Membawa 1 orang mati bersamanya jika dibunuh WW.' },
    { id: 'disease', name: 'Disease', alignment: 'Goodside', nightPriority: 99, description: 'Jika dimakan, Werewolf puasa di malam berikutnya.' },
    { id: 'lycan', name: 'Lycan', alignment: 'Goodside', nightPriority: 99, description: 'Goodside yang terdeteksi jahat oleh Seer.' },
    { id: 'major', name: 'Major', alignment: 'Goodside', nightPriority: 99, description: 'Memiliki suara ganda dalam voting.' },
    { id: 'politician', name: 'Politician', alignment: 'Goodside', nightPriority: 99, description: 'Bisa membeli suara pemain lain (1x).' },
    { id: 'bomberman', name: 'Bomberman', alignment: 'Neutral', nightPriority: 99, description: 'Meledakkan kanan-kiri jika mati.' },
    { id: 'curse', name: 'Cursed', alignment: 'Goodside', nightPriority: 99, description: 'Menjadi Werewolf jika dimakan/mati.' },
    { id: 'tough_guy', name: 'Tough Guy', alignment: 'Goodside', nightPriority: 99, description: 'Memiliki 2 nyawa (mati setelah 2x serangan).' },
    { id: 'traitor', name: 'Traitor', alignment: 'Badside', nightPriority: 99, description: 'Menjadi Werewolf jika semua WW asli sudah mati.' },
  ];

  console.log('--- 🐺 Memulai Seeding Role Werewolf ---');

  for (const role of roles) {
    await prisma.role.upsert({
      where: { id: role.id },
      update: role,
      create: role,
    });
    console.log(`✅ Role ${role.name} berhasil disinkronkan.`);
  }

  console.log('--- 🌕 Seeding Selesai! Database NeonDB Siap Digunakan. ---');
}

main()
  .catch((e) => {
    console.error('❌ Terjadi error saat seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });