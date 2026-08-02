"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { 
  Search, SlidersHorizontal, Music, Flame, Filter, Play, 
  ChevronRight, Sparkles, AlertCircle 
} from "lucide-react";
import { supabase, normalizeSong, searchSongs, logMissingSearch } from "@/lib/supabase";
import { Song } from "@/lib/types";
import CyberButton from "@/components/ui/CyberButton";
import CyberCard from "@/components/ui/CyberCard";
import CyberBadge from "@/components/ui/CyberBadge";
import CyberInput from "@/components/ui/CyberInput";
import SearchEmptyState from "@/components/SearchEmptyState";

function SearchContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const queryParam = searchParams?.get("q") || "";

  const [searchTerm, setSearchTerm] = useState(queryParam);
  const [results, setResults] = useState<Song[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Filter pill badge states
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>("Semua");
  const [selectedGenre, setSelectedGenre] = useState<string>("Semua");

  const difficulties = ["Semua", "Sangat Mudah", "Mudah", "Sedang", "Sulit"];
  const genres = ["Semua", "Pop", "Rock", "Indie", "Ballad", "Jazz", "Dangdut"];

  // Perform search
  useEffect(() => {
    setSearchTerm(queryParam);

    async function executeSearch() {
      if (!queryParam.trim()) {
        // If no query, fetch initial top/latest songs for discovery
        setLoading(true);
        try {
          const { data } = await supabase
            .from("songs")
            .select("*, albums(cover_url)")
            .order("view_count", { ascending: false })
            .limit(16);

          if (data && data.length > 0) {
            setResults(data.map(normalizeSong));
          } else {
            setResults([]);
          }
        } catch (e) {
          console.error(e);
        } finally {
          setLoading(false);
        }
        return;
      }

      setLoading(true);
      try {
        const found = await searchSongs(queryParam);
        setResults(found);

        if (found.length === 0) {
          await logMissingSearch(queryParam);
        }
      } catch (e) {
        console.error("[SEARCH EXECUTION ERROR]:", e);
      } finally {
        setLoading(false);
      }
    }

    executeSearch();
  }, [queryParam]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchTerm.trim())}`);
    } else {
      router.push(`/search`);
    }
  };

  // Filtered results by difficulty and genre
  const filteredResults = results.filter((song) => {
    let matchesDiff = true;
    if (selectedDifficulty !== "Semua") {
      const diff = (song.difficulty || "").toLowerCase();
      const targetDiff = selectedDifficulty.toLowerCase();
      matchesDiff = diff.includes(targetDiff);
    }

    let matchesGenre = true;
    if (selectedGenre !== "Semua") {
      const g = (song.genre || "").toLowerCase();
      const targetG = selectedGenre.toLowerCase();
      matchesGenre = g.includes(targetG) || song.title.toLowerCase().includes(targetG) || song.artist.toLowerCase().includes(targetG);
    }

    return matchesDiff && matchesGenre;
  });

  const getDifficultyVariant = (difficulty?: string | null): "green" | "amber" | "rose" => {
    const d = (difficulty || "").toLowerCase();
    if (d.includes("sangat mudah") || d.includes("mudah")) return "green";
    if (d.includes("sedang")) return "amber";
    if (d.includes("sulit")) return "rose";
    return "green";
  };

  const getDifficultyLabel = (difficulty?: string | null): string => {
    const d = (difficulty || "").toLowerCase();
    if (d.includes("sangat mudah")) return "Sangat Mudah";
    if (d.includes("mudah")) return "Mudah";
    if (d.includes("sedang")) return "Sedang";
    if (d.includes("sulit")) return "Sulit";
    return "Mudah";
  };

  return (
    <div className="space-y-8">
      {/* UNIVERSAL SEARCH BAR HEADER */}
      <CyberCard variant="glowing" padding="lg" className="relative overflow-hidden">
        <div className="absolute -top-24 -right-24 w-72 h-72 bg-purple-600/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-72 h-72 bg-cyan-600/20 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 space-y-4 max-w-3xl mx-auto text-center">
          <CyberBadge variant="cyan" pulse icon={<Search className="w-3.5 h-3.5 text-cyan-400" />}>
            Pencarian Universal
          </CyberBadge>

          <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white">
            Cari Chord, Lirik & <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-cyan-300 to-indigo-400">Musisi Favorit</span>
          </h1>

          <form onSubmit={handleSearchSubmit} className="flex gap-2 items-center max-w-2xl mx-auto pt-2">
            <div className="flex-1">
              <CyberInput
                icon={<Search className="w-5 h-5 text-purple-400" />}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Ketikkan judul lagu, nama artis, atau chord (misal: Sheila On 7, C, Dewa 19)..."
                className="py-3 text-base"
              />
            </div>
            <CyberButton type="submit" variant="cyan" size="lg" isLoading={loading}>
              Cari
            </CyberButton>
          </form>
        </div>
      </CyberCard>

      {/* FILTER PILL BADGES BAR */}
      <CyberCard variant="default" padding="md" className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-purple-500/15">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="w-4 h-4 text-cyan-400" />
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Filter Pencarian Presisi</h3>
          </div>
          <span className="text-xs font-mono text-cyan-400 font-bold">
            {filteredResults.length} Lagu Ditemukan
          </span>
        </div>

        {/* Difficulty Pills */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider min-w-[100px]">Tingkat Kesulitan:</span>
          {difficulties.map((diff) => {
            const isSelected = selectedDifficulty === diff;
            return (
              <button
                key={diff}
                onClick={() => setSelectedDifficulty(diff)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-all cursor-pointer ${
                  isSelected
                    ? "bg-purple-600 text-white font-bold border border-purple-400 shadow-glow-sm"
                    : "bg-slate-950/80 border border-purple-500/20 text-slate-400 hover:text-white hover:border-purple-500/40"
                }`}
              >
                {diff}
              </button>
            );
          })}
        </div>

        {/* Genre Pills */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-purple-500/10">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider min-w-[100px]">Genre Musik:</span>
          {genres.map((g) => {
            const isSelected = selectedGenre === g;
            return (
              <button
                key={g}
                onClick={() => setSelectedGenre(g)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-all cursor-pointer ${
                  isSelected
                    ? "bg-cyan-600 text-white font-bold border border-cyan-400 shadow-glow-cyan"
                    : "bg-slate-950/80 border border-purple-500/20 text-slate-400 hover:text-white hover:border-purple-500/40"
                }`}
              >
                {g}
              </button>
            );
          })}
        </div>
      </CyberCard>

      {/* SEARCH RESULTS GRID */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
            <div key={n} className="h-48 bg-slate-900/50 rounded-2xl animate-pulse border border-purple-500/10" />
          ))}
        </div>
      ) : filteredResults.length === 0 ? (
        queryParam ? (
          <SearchEmptyState searchQuery={queryParam} />
        ) : (
          <CyberCard variant="default" padding="lg" className="text-center py-12">
            <Music className="w-12 h-12 text-slate-500 mx-auto mb-3 animate-pulse" />
            <p className="text-base font-bold text-white mb-1">Ketikkan Kata Kunci Pencarian</p>
            <p className="text-xs text-slate-400">Temukan lagu favoritmu berdasarkan judul, artis, atau genre.</p>
          </CyberCard>
        )
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {filteredResults.map((song) => (
            <Link key={song.id} href={`/chord/${song.id}`}>
              <CyberCard variant="interactive" padding="sm" className="h-full flex flex-col justify-between group">
                <div className="space-y-3">
                  <div className="relative aspect-video rounded-xl overflow-hidden border border-purple-500/20 bg-slate-900">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={song.cover_url || "https://images.unsplash.com/photo-1511192336575-5a79af67a629?q=80&w=400&h=400&auto=format&fit=crop"}
                      alt={song.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute top-2 right-2">
                      <CyberBadge variant={getDifficultyVariant(song.difficulty)} size="sm">
                        {getDifficultyLabel(song.difficulty)}
                      </CyberBadge>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-base font-bold text-white group-hover:text-cyan-300 transition-colors line-clamp-1">
                      {song.title}
                    </h3>
                    <p className="text-xs text-slate-400 line-clamp-1 font-medium">{song.artist}</p>
                  </div>
                </div>

                <div className="pt-3 mt-3 border-t border-purple-500/10 flex items-center justify-between text-xs">
                  <CyberBadge variant="purple" size="sm">
                    Key: {song.key || "C"}
                  </CyberBadge>
                  <span className="text-[11px] font-mono text-slate-400">
                    {song.views ? `${song.views.toLocaleString()} views` : "Available"}
                  </span>
                </div>
              </CyberCard>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

export default function SearchPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pt-20 pb-24 px-4 sm:px-6 lg:px-12 selection:bg-purple-600 selection:text-white">
      <div className="max-w-7xl mx-auto">
        <Suspense fallback={
          <div className="text-center py-24 text-slate-400 animate-pulse">
            Memuat Halaman Pencarian...
          </div>
        }>
          <SearchContent />
        </Suspense>
      </div>
    </div>
  );
}
