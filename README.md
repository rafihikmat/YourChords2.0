# YourChords 2.0 🎸

<div align="center">

![Next.js](https://img.shields.io/badge/Next.js_16-000000?style=for-the-badge&logo=nextdotjs&logoColor=white)
![React](https://img.shields.io/badge/React_19-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS_v4-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-purple?style=for-the-badge)

<p align="center">
  <b>A Modern, Cinematic Guitar Chord & Lyrics Platform built with Next.js 16 & Supabase.</b>
</p>

</div>

---

## 🌌 Overview & Visual Aesthetic

**YourChords 2.0** is redesigned from the ground up with an **IDLIX-Inspired
"Neon Purple x Deep Black"** aesthetic. Designed for guitarists, musicians, and
chord seekers, it merges streaming-platform style visual ergonomics with
lightning-fast chord transposing and auto-scrolling tools.

- **Primary Background:** Deep Pitch Black (`#000000`)
- **Accent Color:** Neon Electric Violet (`#A855F7` / `#8B5CF6`)
- **Surfaces:** Glassmorphism backdrop filters with high contrast typography and
  glowing border highlights
- **Card Proportions:** Cinematic 3:4 album cover cards with instant play hover
  overlays
- **Hero Banner:** Massive rotating featured song carousel with real-time view
  counts

---

## ⚡ Key Features

- 🍿 **IDLIX-Style Cinematic Interface:** Rotating Hero Banner Carousel
  showcasing trending songs with view counters alongside smooth horizontal
  scrolling rows of 3:4 album cover cards.
- ⚡ **Sub-0.2s Fast Database Fetch:** High-performance SSR and client caching
  querying Supabase PostgreSQL using pure UUIDs for instantaneous song loading.
- 🥷 **Admin Control Center (`/admin`):** Exclusive command center for
  administrators to scrape Chordtela URLs using Cheerio, auto-populate
  chords/lyrics to Supabase, and manage database records.
- 🎸 **Interactive Chord Tools:**
  - **Dynamic Transposer:** Instant transposition of key signatures (-12 to +12
    semitones) using intelligent regex parsing.
  - **Auto-Scroll Teleprompter:** Variable speed smooth auto-scrolling
    (`requestAnimationFrame`) for hands-free playing.
  - **Custom Typography Control:** On-the-fly chord text resizing for optimal
    readability across any screen size.
- 🔍 **Smart Database Search:** Real-time search query matching titles and
  artists directly against Supabase `songs` records.
- 🌍 **Dynamic SEO Metadata:** Automated OpenGraph social preview tags and
  dynamic dynamic title/description generation via Next.js `generateMetadata`.
- 🛡️ **System Guard & Fallback:** Built-in fallback dataset
  (`lib/fallbackData.ts`) ensuring zero blank screens or total app downtime if
  Supabase connectivity fluctuates.

---

## 🛠️ Tech Stack

| Category               | Technology                                                                                    |
| :--------------------- | :-------------------------------------------------------------------------------------------- |
| **Frontend Framework** | [Next.js 16 (App Router)](https://nextjs.org/) & [React 19](https://react.dev/)               |
| **Language**           | [TypeScript](https://www.typescriptlang.org/)                                                 |
| **Styling & Motion**   | [Tailwind CSS v4](https://tailwindcss.com/) & [Framer Motion](https://www.framer.com/motion/) |
| **Database & Auth**    | [Supabase](https://supabase.com/) (PostgreSQL, Row-Level Security, Auth)                      |
| **Web Scraper**        | [Cheerio](https://cheerio.js.org/)                                                            |
| **Icons**              | [Lucide React](https://lucide.dev/)                                                           |

---

## 📂 Project Architecture

```
yourchords/
├── app/
│   ├── admin/             # Admin Control Center (Scraper & DB Management)
│   ├── api/
│   │   └── scrape/        # API Route for Cheerio Cheerio Web Scraping
│   ├── auth/              # Authentication routes (SignIn & SignUp)
│   ├── chord/[id]/        # Dynamic Chord Detail View with Transposer
│   ├── search/            # Search Results Page
│   ├── globals.css        # Global Tailwind Styles & Neon Utilities
│   ├── layout.tsx         # Root Layout with Glassmorphism Navbar
│   └── page.tsx           # Home Page (Hero Carousel & Horizontal Rows)
├── components/
│   ├── ChordClientDetail.tsx # Interactive Chord Player, Transposer & Auto-Scroll
│   ├── HomeClientComponents.tsx# Hero Carousel & Animated Section Wrappers
│   ├── Navbar.tsx         # Glassmorphism Top Navigation Bar
│   └── SongCard.tsx       # 3:4 Aspect Ratio Cinematic Album Card
├── lib/
│   ├── fallbackData.ts    # System Guard Fallback Dataset
│   ├── supabase.ts        # Supabase Client & Query Helpers
│   ├── transposer.ts      # Regex-based Chord Transposition Logic
│   └── types.ts           # Core TypeScript Interfaces
└── README.md              # Documentation
```

---

## 🚀 Getting Started & Local Installation

### Prerequisites

- **Node.js**: `v18.x` or higher
- **npm** or **yarn** or **pnpm**
- **Supabase Account**: A Supabase project with a `songs` table

### Step-by-Step Setup

1. **Clone the Repository:**
   ```bash
   git clone https://github.com/your-username/yourchords-2.0.git
   cd yourchords-2.0
   ```

2. **Install Dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment Variables:** Create a `.env.local` file in the root
   directory and add your Supabase credentials:

   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-supabase-project-id.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
   ```

4. **Run the Development Server:**
   ```bash
   npm run dev
   ```

5. **Open Application:** Navigate to
   [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📜 Database Schema Reference

The primary table in Supabase is `songs`:

```sql
CREATE TABLE songs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  artist TEXT NOT NULL,
  chords TEXT NOT NULL,
  source_url TEXT UNIQUE,
  cover_url TEXT,
  view_count INT DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

---

## 📄 License

Distributed under the **MIT License**. See `LICENSE` for more information.

---

<div align="center">
  <sub>Crafted with ❤️ for guitarists and music lovers. Powered by <b>YourChords 2.0</b>.</sub>
</div>
