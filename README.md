# YourChords 2.0 — Cyber-Zen Guitar Chord & Song Lyrics Platform 🎸

<div align="center">

![Next.js](https://img.shields.io/badge/Next.js_14-000000?style=for-the-badge&logo=nextdotjs&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)
![Web Audio API](https://img.shields.io/badge/Web_Audio_API-FF6F00?style=for-the-badge&logo=web-assembly&logoColor=white)
![PWA Ready](https://img.shields.io/badge/PWA-Ready-5A0FC8?style=for-the-badge&logo=pwa&logoColor=white)

<p align="center">
  <b>Platform Chord & Lirik Lagu Modern dengan Hybrid Chord Engine, Real-time Analytics, dan Komunitas Interaktif.</b>
</p>

</div>

---

## 🌌 Ringkasan Proyek (Overview)

**YourChords 2.0** adalah platform chord gitar dan lirik lagu generasi terbaru
dengan tema visual **Cyber-Zen / Deep Space Dark**. Dirancang khusus untuk
musisi, gitaris pemula hingga profesional, platform ini menggabungkan kecepatan
pencarian sub-0.2s, transposer nada otomatis, simulator fretboard interaktif
berbasis Web Audio API, serta sistem manajemen konten berbasis komando admin dan
kontribusi komunitas.

---

## ⚡ Fitur Utama (Key Features Showcase)

### 🎸 1. Hybrid Chord Position Engine

- **Dual-Layer Architecture:** Menggabungkan _Static Master Lookup Table_ untuk
  chord umum dan _Algorithmic Music Theory Generator_ untuk chord kompleks
  (Movable Barre, CAGED shapes, Extended 9th/11th/13th, Altered Dominants
  7#9/7b9, Half-Diminished m7b5, Diminished, & Augmented).
- **Interactive Multi-Variation Fretboard Modal:** Menampilkan diagram SVG
  fretboard interaktif lengkap dengan navigasi variasi posisi `< 1 of N >`,
  penanda nomor jari (1: Telunjuk, 2: Tengah, 3: Manis, 4: Kelingking), garis
  barre, serta indikator senar open (O) / muted (X).
- **Slash Chord Engine:** Dukungan penuh untuk pemrosesan chord bass khusus
  (seperti `C/E`, `G/B`, `D/F#`).

### 🎵 2. Interactive Song & Chord Sheet

- **Real-Time Transposer:** Pengubah nada dasar (-12 hingga +12 semitones)
  secara instan menggunakan ekspresi reguler (regex) tingkat tinggi tanpa
  mengubah struktur baris lirik.
- **Smart Capo Shift Indicator:** Menampilkan rekomendasi posisi Capo saat
  transposisi diterapkan.
- **Pemula / Simplifier Toggle (1-Click Chord Simplification):** Menyederhanakan
  chord kompleks (seperti `Fmaj7#11` → `F`, `Cadd9` → `C`, `Bm7b5` → `Bm`) dalam
  satu klik untuk kenyamanan pemain pemula.
- **Auto-Scroll Teleprompter:** Fitur gulir layar otomatis bebas genggaman
  (_hands-free_) dengan kontrol kecepatan responsif berbasis
  `requestAnimationFrame`.
- **Web Audio Strumming Synthesizer:** Memutar sampel audio strumming nada chord
  secara langsung menggunakan osilator segitiga Web Audio API dan simulasi
  arpeggio alami.
- **Custom Notes & Strumming Pattern:** Menampilkan catatan instruksi permainan
  (seperti pola genjrengan `D-DU-UB-DU` atau tempo BPM).

### 👥 3. Community & Crowdsourcing Engine

- **Real-time Star Rating:** Pengguna dapat memberikan penilaian bintang (1 - 5
  bintang) yang terhitung otomatis secara agregat.
- **Voting Level Kesulitan Komunitas:** Pemilihan dan akumulasi tingkat
  kesulitan lagu (Pemula, Menengah, Mahir).
- **Usulan Perbaikan Lirik & Chord (Correction Proposals):** Form pengiriman
  perbaikan dari komunitas yang langsung masuk ke panel moderasi admin.
- **Board Permintaan Lagu (Missing Song Requests):** Pengguna dapat meminta lagu
  yang belum tersedia di database.

### 🔒 4. User Ecosystem & Restricted Setlist

- **Sistem Favorit (Like / Disukai):** Simpan lagu favorit ke dalam akun
  pengguna.
- **Folder Setlist Pribadi:** Buat dan kelola koleksi daftar lagu (Setlist)
  pribadi untuk latihan atau pertunjukan panggung.
- **Auth Guard Security:** Dilengkapi proteksi autentikasi email & kata sandi
  via Supabase Auth dengan UI Cyber-Zen.

### 🎛️ 5. Pusat Komando Admin (Admin Command Center `/admin`)

- **Real-Time Analytics Dashboard:** Memantau metrik agregat penting seperti
  Total Lagu, Total Views, Permintaan Lagu Tertunda, dan Pengguna Terdaftar.
- **Multi-Source Scraper & Importer:**
  - Single URL Scraper (Support Scraping Lirik/Chord otomatis).
  - Batch Importer & Manual Paste Importer.
  - Extractor Otomatis: Ekstraksi otomatis 11-karakter ID YouTube, Cover Image
    URL, dan Level Kesulitan.
- **Missing Songs Board dengan 1-Click Scraper:** Eksekusi scraping langsung
  dari daftar permintaan pengguna.
- **Panel Moderasi:** Kelola perbaikan chord/lirik yang dikirim komunitas serta
  reset statistik rating lagu.

### 🖨️ 6. Strict Clean Print & Export PDF

- Modus cetak bersih (Print / Export PDF A4) yang otomatis menyembunyikan
  navbar, sidebar, tombol kontrol, dan elemen UI non-esensial, menghasilkan
  dokumen chord & lirik berwarna hitam-putih yang rapi.

### 📺 7. In-Page Video Tutorial Modal & Floating Player

- Pemutar video YouTube terintegrasi di dalam halaman detail lagu untuk
  mempermudah latihan tanpa perlu membuka tab baru.

---

## 🛠️ Tech Stack & Architecture

| Komponen               | Teknologi                                                                       |
| :--------------------- | :------------------------------------------------------------------------------ |
| **Frontend Framework** | [Next.js 14 (App Router)](https://nextjs.org/) & [React 18](https://react.dev/) |
| **Language**           | [TypeScript](https://www.typescriptlang.org/)                                   |
| **Styling & Motion**   | [Tailwind CSS](https://tailwindcss.com/) & [Lucide Icons](https://lucide.dev/)  |
| **Backend & Database** | [Supabase](https://supabase.com/) (PostgreSQL, Row-Level Security, Auth, RPC)   |
| **Audio & Graphics**   | Web Audio API Synthesizer & Dynamic SVG Fretboard Renderer                      |
| **Web Scraper**        | [Cheerio](https://cheerio.js.org/)                                              |

---

## 🔑 Environment Variables (.env.local)

Buat file `.env.local` di direktori utama proyek dan masukkan variabel berikut:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-supabase-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
```

---

## 🚀 Panduan Instalasi & Jalankan Lokal (Getting Started)

### Prasyarat

- **Node.js**: `v18.x` atau versi lebih baru
- **npm** / **pnpm** / **yarn**

### Langkah-Langkah Instalasi:

1. **Clone Repositori:**
   ```bash
   git clone https://github.com/your-username/yourchords-2.0.git
   cd yourchords-2.0
   ```

2. **Install Dependensi:**
   ```bash
   npm install
   ```

3. **Konfigurasi Environment Variables:** Salin `.env.example` atau buat
   `.env.local` lalu atur kredensial Supabase Anda.

4. **Jalankan Mode Pengembang (Development):**
   ```bash
   npm run dev
   ```
   Buka [http://localhost:3000](http://localhost:3000) pada peramban Anda.

5. **Build Proyek untuk Produksi:**
   ```bash
   npm run build
   npm run start
   ```

---

## 📂 Struktur Direktori Proyek (Project Architecture)

```
yourchords/
├── app/
│   ├── admin/                 # Pusat Komando Admin (Analytics, Scraper, Board)
│   ├── api/
│   │   ├── admin/             # API Routes Admin (Scraper, Moderasi, Analytics)
│   │   └── user/              # API Routes User (Favorit, Setlist, Rating, Correction)
│   ├── auth/                  # Halaman Autentikasi (Sign In & Sign Up)
│   ├── chord/[id]/            # Halaman Detail Lagu & Player Interactive
│   ├── setlists/              # Halaman Manajemen Setlist Pribadi
│   ├── search/                # Halaman Pencarian Lagu
│   ├── globals.css            # Stylesheet Global & Tailwind Configuration
│   ├── layout.tsx             # Root Layout dengan Navbar Glassmorphism
│   └── page.tsx               # Halaman Utama (Hero Banner, Grid Catalog, Trending)
├── components/
│   ├── FretboardModal.tsx     # Diagram Fretboard SVG & Multi-Position Engine
│   ├── ChordClientDetail.tsx # Sheet Transposer, Auto-Scroll, & Web Audio Synth
│   ├── Navbar.tsx             # Navigation Header dengan Auth Status & Search
│   ├── SongCard.tsx           # Album Cover Card Cyber-Zen
│   └── VideoModal.tsx         # In-Page Floating YouTube Tutorial Player
├── lib/
│   ├── chordDb.ts             # Hybrid Chord Database & Algorithmic Music Engine
│   ├── transposer.ts          # Transposer & Regex Chord Processor
│   ├── supabase.ts            # Supabase Client Instance
│   └── types.ts               # Core TypeScript Type Interfaces
└── README.md                  # Dokumentasi Resmi Proyek
```

---

## 📜 Skema Basis Data (Database Schema)

Database PostgreSQL di Supabase menggunakan skema terstruktur berikut:

```sql
-- Tabel Utama Lagu
CREATE TABLE songs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  artist TEXT NOT NULL,
  chords TEXT NOT NULL,
  source_url TEXT UNIQUE,
  cover_url TEXT,
  view_count INT DEFAULT 0,
  difficulty TEXT DEFAULT 'Pemula',
  youtube_id TEXT,
  key_signature TEXT DEFAULT 'C',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabel Profil Pengguna
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  full_name TEXT,
  avatar_url TEXT,
  role TEXT DEFAULT 'user',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabel Rating Lagu
CREATE TABLE song_ratings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  song_id UUID REFERENCES songs(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  rating INT CHECK (rating >= 1 AND rating <= 5),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(song_id, user_id)
);

-- Tabel Favorit Lagu
CREATE TABLE song_favorites (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  song_id UUID REFERENCES songs(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(song_id, user_id)
);

-- Tabel Permintaan Lagu
CREATE TABLE missing_song_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  artist TEXT NOT NULL,
  requested_by UUID REFERENCES auth.users(id),
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabel Usulan Perbaikan
CREATE TABLE song_corrections (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  song_id UUID REFERENCES songs(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  proposed_chords TEXT NOT NULL,
  note TEXT,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

---

## 📄 Lisensi

Proyek ini dilindungi di bawah **MIT License**.

---

<div align="center">
  <sub>Dikembangkan dengan ❤️ untuk seluruh musisi dan pecinta musik. Ditenagai oleh <b>YourChords 2.0 (Cyber-Zen Music Platform)</b>.</sub>
</div>
