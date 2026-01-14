export type Alignment = 'Goodside' | 'Badside' | 'Neutral';

export interface Role {
  id: string;
  name: string;
  alignment: Alignment;
  description: string;
  nightPriority: number; // Semakin kecil semakin duluan bangun
}

export const ROLES: Role[] = [
  // --- GOODSIDE ---
  { id: 'seer', name: 'Seer', alignment: 'Goodside', nightPriority: 10, description: 'Menerawang peran pemain di malam hari.' },
  { id: 'villager', name: 'Villager', alignment: 'Goodside', nightPriority: 99, description: 'Warga biasa tanpa kekuatan spesial.' },
  { id: 'guardian', name: 'Guardian', alignment: 'Goodside', nightPriority: 5, description: 'Melindungi satu warga setiap malam.' },
  { id: 'gunner', name: 'Gunner', alignment: 'Goodside', nightPriority: 15, description: 'Memiliki 2 peluru untuk menembak di malam hari.' },
  { id: 'great_shaman', name: 'Great Shaman', alignment: 'Goodside', nightPriority: 20, description: 'Mengecek status mati atau melakukan necromancy.' },
  { id: 'king', name: 'King', alignment: 'Goodside', nightPriority: 99, description: 'Tidak bisa dikeluarkan melalui voting.' },
  { id: 'doctor', name: 'Doctor', alignment: 'Goodside', nightPriority: 6, description: 'Bisa menghidupkan warga yang mati 2 kali.' },
  { id: 'drunk', name: 'Drunk', alignment: 'Goodside', nightPriority: 99, description: 'Jika dimakan, WW puasa di malam berikutnya.' },
  { id: 'ghost', name: 'Ghost', alignment: 'Goodside', nightPriority: 99, description: 'Mati di malam kedua, memberi hint 1 huruf tiap siang.' },
  { id: 'hunter', name: 'Hunter', alignment: 'Goodside', nightPriority: 99, description: 'Membawa 1 orang mati bersamanya jika dibunuh WW.' },
  { id: 'disease', name: 'Disease', alignment: 'Goodside', nightPriority: 99, description: 'Jika dimakan, WW puasa di malam berikutnya.' },
  { id: 'harlot', name: 'Harlot', alignment: 'Goodside', nightPriority: 7, description: 'Bercinta tiap malam. Mati jika mendatangi WW.' },
  { id: 'blacksmith', name: 'Blacksmith', alignment: 'Goodside', nightPriority: 8, description: 'Menyebar biji besi agar WW tidak bisa masuk.' },
  { id: 'orphan', name: 'Orphan', alignment: 'Goodside', nightPriority: 2, description: 'Mencari bapak. Jadi WW jika bapaknya mati.' },
  { id: 'impression_seer', name: 'Impression Seer', alignment: 'Goodside', nightPriority: 11, description: 'Menjadi Seer jika Seer utama mati.' },
  { id: 'beholder', name: 'Beholder', alignment: 'Goodside', nightPriority: 1, description: 'Mati jika ada yang mengaku Beholder.' },
  { id: 'major', name: 'Major', alignment: 'Goodside', nightPriority: 99, description: 'Memimpin setiap keputusan.' },
  { id: 'lycan', name: 'Lycan', alignment: 'Goodside', nightPriority: 99, description: 'Warga baik yang terdeteksi WW oleh Seer.' },
  { id: 'politician', name: 'Politician', alignment: 'Goodside', nightPriority: 99, description: 'Bisa membeli suara pemain lain 1 kali.' },
  { id: 'tough_guy', name: 'Tough Guy', alignment: 'Goodside', nightPriority: 99, description: 'Memiliki 2 nyawa.' },
  { id: 'spellcaster', name: 'Spellcaster', alignment: 'Goodside', nightPriority: 12, description: 'Membungkam diskusi 1 pemain.' },

  // --- BADSIDE ---
  { id: 'werewolf', name: 'Werewolf', alignment: 'Badside', nightPriority: 4, description: 'Memangsa warga di malam hari.' },
  { id: 'wolfman', name: 'Wolfman', alignment: 'Badside', nightPriority: 4, description: 'WW yang terdeteksi baik oleh Seer.' },
  { id: 'sorcerer', name: 'Sorcerer', alignment: 'Badside', nightPriority: 10, description: 'Seer dipihak Badside.' },
  { id: 'vampire', name: 'Vampire', alignment: 'Badside', nightPriority: 3, description: 'Menggigit warga atau memangsa WW.' },
  { id: 'traitor', name: 'Traitor', alignment: 'Badside', nightPriority: 99, description: 'Menjadi WW jika semua WW sudah mati.' },

  // --- NEUTRAL / OTHERS ---
  { id: 'thief', name: 'Thief', alignment: 'Neutral', nightPriority: 1, description: 'Mencuri dan bertukar kartu di malam pertama.' },
  { id: 'psycopath', name: 'Psycopath', alignment: 'Badside', nightPriority: 3, description: 'Membunuh setiap malam, terdeteksi warga.' },
  { id: 'lone_wolf', name: 'Lone Wolf', alignment: 'Badside', nightPriority: 4, description: 'WW yang hanya bisa makan jika WW lain mati.' },
  { id: 'mason', name: 'Mason', alignment: 'Goodside', nightPriority: 0, description: 'Warga yang saling mengenal sesama Mason.' },
  { id: 'bomberman', name: 'Bomberman', alignment: 'Neutral', nightPriority: 99, description: 'Meledakkan kanan-kiri jika mati.' },
  { id: 'curse', name: 'Cursed', alignment: 'Goodside', nightPriority: 99, description: 'Jadi WW jika mati dimakan.' },
  { id: 'lover', name: 'Lover', alignment: 'Neutral', nightPriority: 2, description: 'Memilih pasangan hidup semati.' },
];