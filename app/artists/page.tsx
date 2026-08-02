"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { 
  Users, Search, Sparkles, Music, ArrowRight, ChevronRight, Filter 
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import CyberButton from "@/components/ui/CyberButton";
import CyberCard from "@/components/ui/CyberCard";
import CyberBadge from "@/components/ui/CyberBadge";
import CyberInput from "@/components/ui/CyberInput";

interface ArtistItem {
  name: string;
  songCount: number;
  avatarUrl?: string;
  genre?: string;
}

// Fallback list of curated popular artists to guarantee a rich catalog
const FALLBACK_ARTISTS: ArtistItem[] = [
  { name: "Sheila On 7", songCount: 18, genre: "Pop Rock", avatarUrl: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=400&h=400&auto=format&fit=crop" },
  { name: "Nadin Amizah", songCount: 12, genre: "Indie Pop", avatarUrl: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?q=80&w=400&h=400&auto=format&fit=crop" },
  { name: "Dewa 19", songCount: 22, genre: "Rock / Pop", avatarUrl: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?q=80&w=400&h=400&auto=format&fit=crop" },
  { name: "Noah / Peterpan", songCount: 25, genre: "Pop Rock", avatarUrl: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=400&h=400&auto=format&fit=crop" },
  { name: "Ed Sheeran", songCount: 15, genre: "Pop Acoustic", avatarUrl: "https://images.unsplash.com/photo-1501386761578-eac5c94b800a?q=80&w=400&h=400&auto=format&fit=crop" },
  { name: "Coldplay", songCount: 16, genre: "Alt Rock / Pop", avatarUrl: "https://images.unsplash.com/photo-1511192336575-5a79af67a629?q=80&w=400&h=400&auto=format&fit=crop" },
  { name: "Taylor Swift", songCount: 20, genre: "Pop / Country", avatarUrl: "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?q=80&w=400&h=400&auto=format&fit=crop" },
  { name: "Tulus", songCount: 14, genre: "Pop / Jazz", avatarUrl: "https://images.unsplash.com/photo-1465847899084-d164df4dedc6?q=80&w=400&h=400&auto=format&fit=crop" },
  { name: "Pamungkas", songCount: 10, genre: "Indie Pop", avatarUrl: "https://images.unsplash.com/photo-1520523839897-bd0b52f945a0?q=80&w=400&h=400&auto=format&fit=crop" },
  { name: "Fourtwnty", songCount: 9, genre: "Folk / Indie", avatarUrl: "https://images.unsplash.com/photo-1442504028989-ab58b5f29a4a?q=80&w=400&h=400&auto=format&fit=crop" },
  { name: "Juicy Luicy", songCount: 8, genre: "Pop Soul", avatarUrl: "https://images.unsplash.com/photo-1510915361894-db8b60106cb1?q=80&w=400&h=400&auto=format&fit=crop" },
  { name: "Hindia", songCount: 11, genre: "Indie Rock", avatarUrl: "https://images.unsplash.com/photo-1487180144351-b8472da7d491?q=80&w=400&h=400&auto=format&fit=crop" },
  { name: "Bernadya", songCount: 7, genre: "Pop / Ballad", avatarUrl: "https://images.unsplash.com/photo-1516575334481-f85287c2c82d?q=80&w=400&h=400&auto=format&fit=crop" },
  { name: "Mahalini", songCount: 8, genre: "Pop Ballad", avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=400&h=400&auto=format&fit=crop" },
  { name: "Slank", songCount: 24, genre: "Rock", avatarUrl: "https://images.unsplash.com/photo-1498038432885-c6f3f1b912ee?q=80&w=400&h=400&auto=format&fit=crop" },
  { name: "Iwan Fals", songCount: 30, genre: "Folk Rock", avatarUrl: "https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?q=80&w=400&h=400&auto=format&fit=crop" },
  { name: "Ungu", songCount: 16, genre: "Pop Rock", avatarUrl: "https://images.unsplash.com/photo-1459749411175-04bf5292ceea?q=80&w=400&h=400&auto=format&fit=crop" },
  { name: "Judika", songCount: 13, genre: "Pop Rock", avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=400&h=400&auto=format&fit=crop" },
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
            genre: "Indonesian Music",
          }));

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

  const filteredArtists = artists.filter((artist) => {
    const nameUpper = artist.name.toUpperCase();
    
    let matchesLetter = true;
    if (activeLetter === "#") {
      matchesLetter = !/^[A-Z]/.test(nameUpper);
    } else if (activeLetter !== "All") {
      matchesLetter = nameUpper.startsWith(activeLetter);
    }

    const matchesSearch = 
      searchQuery.trim() === "" ||
      artist.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (artist.genre && artist.genre.toLowerCase().includes(searchQuery.toLowerCase()));

    return matchesLetter && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pt-20 pb-24 px-4 sm:px-6 lg:px-12 selection:bg-purple-600 selection:text-white">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* SPECIAL HEADER BANNER */}
        <CyberCard variant="glowing" padding="lg" className="text-center relative overflow-hidden">
          <div className="absolute -top-24 -left-24 w-72 h-72 bg-purple-600/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -right-24 w-72 h-72 bg-cyan-600/20 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 max-w-3xl mx-auto space-y-4">
            <CyberBadge variant="purple" pulse icon={<Users className="w-3.5 h-3.5 text-purple-400" />}>
              Directory Artis & Band
            </CyberBadge>

            <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white">
              Katalog Artis & <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-cyan-300 to-indigo-400">Band Indonesia</span>
            </h1>

            <p className="text-slate-300 text-xs sm:text-sm leading-relaxed max-w-2xl mx-auto">
              Jelajahi koleksi chord & lirik lagu dari penyanyi, musisi, dan band populer Indonesia dan Internasional.
            </p>

            {/* INTERACTIVE SEARCH BAR */}
            <div className="w-full max-w-xl mx-auto pt-2">
              <CyberInput
                icon={<Search className="w-4 h-4 text-purple-400" />}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari nama artis atau genre (misal: Sheila On 7, Pop, Rock)..."
              />
            </div>
          </div>
        </CyberCard>

        {/* ALPHABET FILTER BAR */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <Filter className="w-3.5 h-3.5 text-cyan-400" />
              <span>Filter Abjad</span>
            </span>
            <span className="text-xs font-mono text-cyan-400 font-bold">
              Total: {filteredArtists.length} Artis
            </span>
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none">
            {alphabets.map((letter) => {
              const isActive = activeLetter === letter;
              return (
                <button
                  key={letter}
                  onClick={() => setActiveLetter(letter)}
                  className={`min-w-[36px] h-9 px-2 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer flex items-center justify-center shrink-0 ${
                    isActive
                      ? "bg-gradient-to-r from-purple-600 to-cyan-600 text-white shadow-glow-sm border border-cyan-400/50 scale-105"
                      : "bg-slate-900/60 border border-purple-500/20 text-slate-400 hover:text-white hover:border-purple-500/40"
                  }`}
                >
                  {letter}
                </button>
              );
            })}
          </div>
        </div>

        {/* ARTISTS CARDS GRID */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
              <div key={n} className="h-32 bg-slate-900/50 rounded-2xl animate-pulse border border-purple-500/10" />
            ))}
          </div>
        ) : filteredArtists.length === 0 ? (
          <CyberCard variant="default" padding="lg" className="text-center py-12">
            <Users className="w-12 h-12 text-slate-500 mx-auto mb-3 animate-bounce" />
            <p className="text-base font-bold text-white mb-1">Artis Tidak Ditemukan</p>
            <p className="text-xs text-slate-400">Coba cari dengan kata kunci lain atau pilih filter abjad "All".</p>
          </CyberCard>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {filteredArtists.map((artist) => (
              <CyberCard key={artist.name} variant="interactive" padding="md" className="flex flex-col justify-between h-full group">
                <div className="flex items-center gap-4 mb-4">
                  <div className="relative w-14 h-14 rounded-2xl overflow-hidden border border-purple-500/30 group-hover:border-cyan-400 shrink-0 transition-colors">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={artist.avatarUrl || "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=200&h=200&auto=format&fit=crop"}
                      alt={artist.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    <h3 className="text-base font-bold text-white group-hover:text-cyan-300 transition-colors truncate">
                      {artist.name}
                    </h3>
                    <p className="text-xs text-purple-400 font-medium truncate">
                      {artist.genre || "Pop / Rock"}
                    </p>
                    <div className="flex items-center gap-1 mt-1 text-[11px] text-slate-400 font-mono">
                      <Music className="w-3 h-3 text-cyan-400" />
                      <span>{artist.songCount} Lagu</span>
                    </div>
                  </div>
                </div>

                <Link href={`/search?q=${encodeURIComponent(artist.name)}`} className="w-full">
                  <CyberButton variant="cyan" size="sm" className="w-full" rightIcon={<ChevronRight className="w-3.5 h-3.5" />}>
                    Lihat Seluruh Chord
                  </CyberButton>
                </Link>
              </CyberCard>
            ))}
          </div>
        )}

      </div>
    </div>
  );
}
