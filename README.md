# 🐺 Wolf-Master

> **15-188-Taufik/Wolf-Master** — Aplikasi web moderator permainan *Werewolf* (Mafia) untuk sesi meja/tabletop.

---

## 📖 Deskripsi

**Wolf-Master** adalah aplikasi web yang dirancang untuk membantu moderator (game master) mengelola sesi permainan *Werewolf* secara mulus dan efisien. Tidak perlu lagi mengingat urutan giliran, menghitung suara, atau mencatat peran secara manual — Wolf-Master menangani semua itu.

Aplikasi ini cocok digunakan untuk:
- Sesi permainan di komunitas, kampus, atau acara sosial
- Turnamen lokal atau online dengan banyak pemain
- Moderator pemula yang baru belajar memimpin permainan

---

## ✨ Fitur Utama

| Fitur | Keterangan |
|---|---|
| 🎭 **Manajemen Peran** | Tetapkan peran secara otomatis atau manual (Werewolf, Villager, Seer, Doctor, dll.) |
| 👥 **Manajemen Pemain** | Tambah, hapus, dan kelola daftar pemain dengan mudah |
| 🌙 **Fase Malam & Siang** | Navigasi fase permainan dengan alur yang jelas dan terstruktur |
| 🗳️ **Sistem Voting** | Catat dan hitung suara eliminasi secara real-time |
| 📜 **Log Permainan** | Riwayat kejadian setiap ronde tersimpan otomatis |
| ⚙️ **Konfigurasi Fleksibel** | Sesuaikan jumlah peran sesuai jumlah pemain |
| 📱 **Responsif** | Dapat digunakan di desktop maupun perangkat mobile |

---

## 🛠️ Teknologi

```
Frontend   : HTML / CSS / JavaScript  (atau React — sesuai implementasi)
Backend    : (Node.js / Python / dst. — sesuaikan)
Database   : (localStorage / Firebase / dst. — sesuaikan)
Hosting    : (Vercel / Netlify / dst. — sesuaikan)
```

> ℹ️ *Perbarui bagian ini sesuai stack teknologi aktual yang digunakan.*

---

## 🚀 Cara Menjalankan

### Prasyarat

- Node.js v18+ (jika menggunakan JavaScript/React)
- npm atau yarn

### Instalasi

```bash
# Clone repositori
git clone https://github.com/Taufik/Wolf-Master.git

# Masuk ke direktori proyek
cd Wolf-Master

# Instal dependensi
npm install

# Jalankan server pengembangan
npm run dev
```

Aplikasi akan berjalan di `http://localhost:3000` (atau port yang dikonfigurasi).

### Build untuk Produksi

```bash
npm run build
```

---

## 🎮 Cara Menggunakan

1. **Buat Sesi Baru** — Masukkan nama pemain dan jumlah total peserta.
2. **Pilih Komposisi Peran** — Tentukan berapa banyak Werewolf, Villager, dan peran khusus.
3. **Bagikan Peran** — Sistem membagikan peran secara acak; setiap pemain melihat perannya sendiri.
4. **Mulai Permainan** — Moderator mengarahkan fase malam dan siang melalui antarmuka aplikasi.
5. **Voting & Eliminasi** — Catat hasil voting; aplikasi menandai pemain yang tereliminasi.
6. **Akhir Permainan** — Kondisi menang/kalah terdeteksi otomatis dan ditampilkan ke semua pemain.

---

## 📁 Struktur Proyek

```
Wolf-Master/
├── public/
│   └── index.html
├── src/
│   ├── components/       # Komponen UI
│   ├── pages/            # Halaman utama
│   ├── logic/            # Logika permainan (roles, phases, voting)
│   ├── styles/           # CSS / styling
│   └── main.js           # Entry point
├── README.md
└── package.json
```

---

## 🐺 Peran yang Didukung

- **Werewolf** — Membunuh satu pemain setiap malam
- **Villager** — Tidak memiliki kemampuan khusus
- **Seer** — Dapat melihat peran satu pemain setiap malam
- **Doctor** — Dapat melindungi satu pemain setiap malam
- **Hunter** — Saat tereliminasi, dapat membawa satu pemain bersamanya
- *(Peran tambahan dapat dikonfigurasi)*

---

## 🤝 Kontribusi

Kontribusi sangat disambut! Berikut langkahnya:

1. Fork repositori ini
2. Buat branch fitur baru: `git checkout -b fitur/nama-fitur`
3. Commit perubahan: `git commit -m "feat: tambah fitur X"`
4. Push ke branch: `git push origin fitur/nama-fitur`
5. Buat Pull Request

Harap ikuti konvensi commit [Conventional Commits](https://www.conventionalcommits.org/).

---

## 📄 Lisensi

Proyek ini dilisensikan di bawah [MIT License](LICENSE).

---

## 👤 Author

**Taufik**
- GitHub: [@Taufik](https://github.com/Taufik)
- Project: `15-188-Taufik/Wolf-Master`

---

> *"Satu gigitan cukup untuk mengubah nasib desa."* 🌕
