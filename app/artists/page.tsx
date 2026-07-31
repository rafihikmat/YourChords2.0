"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { 
  Users, Search, Sparkles, Music, ArrowRight, ChevronRight, Filter 
} from "lucide-react";
import { supabase } from "@/lib/supabase";

interface ArtistItem {
  name: string;
  songCount: number;
  avatarUrl?: string;
}

// Fallback list of curated popular artists to guarantee a rich catalog
const FALLBACK_ARTISTS: ArtistItem[] = [
  { name: "Sheila On 7", songCount: 18, avatarUrl: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=400&h=400&auto=format&fit=crop" },
  { name: "Nadin Amizah", songCount: 12, avatarUrl: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?q=80&w=400&h=400&auto=format&fit=crop" },
  { name: "Dewa 19", songCount: 22, avatarUrl: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?q=80&w=400&h=400&auto=format&fit=crop" },
  { name: "Noah / Peterpan", songCount: 25, avatarUrl: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=400&h=400&auto=format&fit=crop" },
  { name: "Ed Sheeran", songCount: 15, avatarUrl: "https://images.unsplash.com/photo-1501386761578-eac5c94b800a?q=80&w=400&h=400&auto=format&fit=crop" },
  { name: "Coldplay", songCount: 16, avatarUrl: "https://images.unsplash.com/photo-1511192336575-5a79af67a629?q=80&w=400&h=400&auto=format&fit=crop" },
  { name: "Taylor Swift", songCount: 20, avatarUrl: "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?q=80&w=400&h=400&auto=format&fit=crop" },
  { name: "Tulus", songCount: 14, avatarUrl: "https://images.unsplash.com/photo-1465847899084-d164df4dedc6?q=80&w=400&h=400&auto=format&fit=crop" },
  { name: "Pamungkas", songCount: 10, avatarUrl: "https://images.unsplash.com/photo-1520523839897-bd0b52f945a0?q=80&w=400&h=400&auto=format&fit=crop" },
  { name: "Fourtwnty", songCount: 9, avatarUrl: "https://images.unsplash.com/photo-1442504028989-ab58b5f29a4a?q=80&w=400&h=400&auto=format&fit=crop" },
  { name: "Juicy Luicy", songCount: 8, avatarUrl: "https://images.unsplash.com/photo-1510915361894-db8b60106cb1?q=80&w=400&h=400&auto=format&fit=crop" },
  { name: "Hindia", songCount: 11, avatarUrl: "https://images.unsplash.com/photo-1487180144351-b8472da7d491?q=80&w=400&h=400&auto=format&fit=crop" },
  { name: "Bernadya", songCount: 7, avatarUrl: "https://images.unsplash.com/photo-1516575334481-f85287c2c82d?q=80&w=400&h=400&auto=format&fit=crop" },
  { name: "Mahalini", songCount: 8, avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=400&h=400&auto=format&fit=crop" },
  { name: "Slank", songCount: 24, avatarUrl: "https://images.unsplash.com/photo-1498038432885-c6f3f1b912ee?q=80&w=400&h=400&auto=format&fit=crop" },
  { name: "Iwan Fals", songCount: 30, avatarUrl: "https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?q=80&w=400&h=400&auto=format&fit=crop" },
  { name: "Ungu", songCount: 16, avatarUrl: "https://images.unsplash.com/photo-1459749411175-04bf5292ceea?q=80&w=400&h=400&auto=format&fit=crop" },
  { name: "Judika", songCount: 13, avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=400&h=400&auto=format&fit=crop" },
];

export default function ArtistsPage() {
  const [artists, setArtists] = useState<ArtistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeLetter, setActiveLetter] = useState("All");

  const alphabets = [
    "All", "A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", 
    "M", "N", "O", "P", "Q", "R", "S", "T", "U", "V", "W", "X", "Y", "Z", "#"
  ];

  useEffect(() => {
    async function fetchArtists() {
      setLoading(true);
      try {
        const { data: songsData, error } = await supabase
          .from("songs")
          .select("artist, cover_url");

        if (!error && songsData && songsData.length > 0) {
          // Group songs by artist name
          const artistMap: Record<string, { count: number; coverUrl?: string }> = {};

          songsData.forEach((row) => {
            if (!row.artist) return;
            const name = row.artist.trim();
            if (!artistMap[name]) {
              artistMap[name] = { count: 0, coverUrl: row.cover_url };
            }
            artistMap[name].count += 1;
            if (!artistMap[name].coverUrl && row.cover_url) {
              artistMap[name].coverUrl = row.cover_url;
            }
          });

          const dbArtists: ArtistItem[] = Object.keys(artistMap).map((name) => ({
            name,
            songCount: artistMap[name].count,
            avatarUrl: artistMap[name].coverUrl,
          }));

          // Merge DB artists with fallback list to ensure rich collection
          const mergedMap: Record<string, ArtistItem> = {};

          FALLBACK_ARTISTS.forEach((item) => {
            mergedMap[item.name.toLowerCase()] = item;
          });

          dbArtists.forEach((item) => {
            const key = item.name.toLowerCase();
            if (mergedMap[key]) {
              mergedMap[key].songCount = Math.max(mergedMap[key].songCount, item.songCount);
              if (item.avatarUrl) mergedMap[key].avatarUrl = item.avatarUrl;
            } else {
              mergedMap[key] = item;
            }
          });

          const sortedList = Object.values(mergedMap).sort((a, b) => 
            a.name.localeCompare(b.name)
          );

          setArtists(sortedList);
        } else {
          setArtists(FALLBACK_ARTISTS);
        }
      } catch (err) {
        console.warn("[FETCH ARTISTS ERROR]:", err);
        setArtists(FALLBACK_ARTISTS);
      } finally {
        setLoading(false);
      }
    }

    fetchArtists();
  }, []);

  // Filter logic: letter + search query
  const filteredArtists = artists.filter((artist) => {
    const nameUpper = artist.name.toUpperCase();
    
    // Letter filter
    let matchesLetter = true;
    if (activeLetter === "#") {
      matchesLetter = !/^[A-Z]/.test(nameUpper);
    } else if (activeLetter !== "All") {
      matchesLetter = nameUpper.startsWith(activeLetter);
    }

    // Search query filter
    const matchesSearch = 
      searchQuery.trim() === "" ||
      artist.name.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesLetter && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col font-sans selection:bg-primary selection:text-white">
      <Navbar />

      <main className="flex-1 pt-24 pb-16 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto w-full">
        {/* HERO BANNER */}
        <section className="relative rounded-3xl p-8 md:p-12 border border-primary/30 bg-surface/80 backdrop-blur-2xl overflow-hidden shadow-[0_0_50px_rgba(168,85,247,0.15)] mb-10 text-center">
          <div className="absolute -top-24 -left-24 w-72 h-72 bg-primary/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -right-24 w-72 h-72 bg-violet-600/20 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 max-w-3xl mx-auto flex flex-col items-center gap-3">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary/10 border border-primary/30 text-primary-light text-xs font-mono font-bold mb-2 shadow-[0_0_15px_rgba(168,85,247,0.3)]">
              <Users className="w-3.5 h-3.5 animate-pulse text-primary" />
              <span>ARTIST & BAND DIRECTORY</span>
            </div>

            <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-white">
              Katalog Artis & <span className="text-primary neon-text">Musisi Terlengkap</span>
            </h1>

            <p className="text-slate-300 text-xs sm:text-sm leading-relaxed max-w-2xl">
              Jelajahi koleksi chord dan lirik lagu terlengkap dari band dan penyanyi favorit Anda, baik lokal maupun internasional.
            </p>

            {/* REAL-TIME SEARCH BAR */}
            <div className="w-full max-w-xl relative group mt-2">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-primary transition-colors" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari nama artis atau band (misal: Sheila On 7, Nadin, Coldplay)..."
                className="w-full bg-black/80 border border-white/15 focus:border-primary/70 rounded-2xl py-3.5 pl-11 pr-4 text-white placeholder-slate-500 text-xs sm:text-sm font-sans focus:outline-none focus:shadow-[0_0_25px_rgba(168,85,247,0.3)] transition-all"
              />
            </div>
          </div>
        </section>

        {/* ALPHABET FILTER BAR */}
        <section className="mb-8">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
              <Filter className="w-3.5 h-3.5 text-primary" />
              <span>Filter Berdasarkan Abjad</span>
            </span>
            <span className="text-xs font-mono text-slate-500">
              Total: {filteredArtists.length} Artis
            </span>
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-3 no-scrollbar scroll-smooth">
            {alphabets.map((letter) => {
              const isActive = activeLetter === letter;
              return (
                <button
                  key={letter}
                  onClick={() => setActiveLetter(letter)}
                  className={`min-w-[36px] h-9 px-2 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer flex items-center justify-center flex-shrink-0 ${
                    isActive
                      ? "bg-primary text-white shadow-[0_0_15px_rgba(168,85,247,0.5)] border border-primary-light scale-105"
                      : "bg-surface/60 border border-white/10 text-slate-400 hover:text-white hover:border-white/20"
                  }`}
                >
                  {letter}
                </button>
              );
            })}
          </div>
        </section>

        {/* ARTISTS CARDS GRID */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
              <div key={n} className="h-28 bg-white/5 rounded-2xl animate-pulse border border-white/5" />
            ))}
          </div>
        ) : filteredArtists.length === 0 ? (
          <div className="p-12 rounded-3xl bg-surface/40 border border-white/10 text-center text-slate-400 my-8">
            <Users className="w-12 h-12 text-slate-600 mx-auto mb-3 animate-bounce" />
            <p className="text-base font-bold text-white mb-1">Artis tidak ditemukan</p>
            <p className="text-xs">Coba cari dengan nama lain atau pilih filter abjad "All".</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {filteredArtists.map((artist) => (
              <Link
                key={artist.name}
                href={`/search?q=${encodeURIComponent(artist.name)}`}
                className="group relative bg-surface/70 border border-white/10 hover:border-primary/50 rounded-2xl p-4 backdrop-blur-xl transition-all duration-300 hover:shadow-[0_0_30px_rgba(168,85,247,0.2)] hover:-translate-y-1 flex items-center gap-4 overflow-hidden"
              >
                {/* Ambient Hover Glow */}
                <div className="absolute -right-12 -bottom-12 w-28 h-28 bg-primary/10 rounded-full blur-2xl group-hover:bg-primary/20 transition-colors pointer-events-none" />

                {/* Avatar / Cover Image */}
                <div className="relative w-14 h-14 rounded-2xl overflow-hidden border border-white/15 group-hover:border-primary/50 flex-shrink-0 transition-colors">
                  <img
                    src={artist.avatarUrl || "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=200&h=200&auto=format&fit=crop"}
                    alt={artist.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                </div>

                {/* Artist Info */}
                <div className="flex-1 min-w-0 pr-2">
                  <h3 className="text-sm font-bold text-white group-hover:text-primary transition-colors truncate">
                    {artist.name}
                  </h3>
                  
                  <div className="flex items-center gap-1.5 mt-1">
                    <Music className="w-3 h-3 text-slate-400" />
                    <span className="text-[11px] font-mono text-slate-400 font-medium">
                      {artist.songCount} Kunci Lagu
                    </span>
                  </div>
                </div>

                {/* Hover Arrow Icon */}
                <ChevronRight className="w-5 h-5 text-slate-500 group-hover:text-primary group-hover:translate-x-1 transition-all flex-shrink-0" />
              </Link>
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
