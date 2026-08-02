export const revalidate = 60;

import React from "react";
import Link from "next/link";
import { 
  Sparkles, Music, Flame, TrendingUp, ArrowRight, Search, 
  Play, Users, Zap, Guitar, Megaphone, Star, ChevronRight
} from "lucide-react";
import { getTopSongs, getNewReleases, getPopularArtists } from "@/lib/supabase";
import { getSiteCMSContent } from "@/lib/adminCMS";
import CyberButton from "@/components/ui/CyberButton";
import CyberCard from "@/components/ui/CyberCard";
import CyberBadge from "@/components/ui/CyberBadge";

export default async function Home() {
  const [cmsContent, topSongs, newReleases, popularArtists] = await Promise.all([
    getSiteCMSContent(),
    getTopSongs(8),
    getNewReleases(8),
    getPopularArtists(8),
  ]);

  const featuredSong = topSongs[0] || newReleases[0];

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
    <main className="min-h-screen bg-slate-950 text-slate-100 pt-20 pb-24 px-4 sm:px-6 lg:px-12 selection:bg-purple-600 selection:text-white">
      <div className="max-w-7xl mx-auto space-y-12">

        {/* ANNOUNCEMENT BANNER */}
        {cmsContent?.announcementText && (
          <div className="bg-gradient-to-r from-purple-900/40 via-cyan-900/40 to-purple-900/40 border border-purple-500/30 rounded-2xl p-3 sm:px-6 flex items-center justify-center gap-3 backdrop-blur-md shadow-glow-sm">
            <Megaphone className="w-4 h-4 text-amber-400 shrink-0 animate-bounce" />
            <p className="text-xs sm:text-sm font-semibold text-purple-200 text-center">
              {cmsContent.announcementText}
            </p>
          </div>
        )}

        {/* HERO SECTION - BENTO GRID LAYOUT */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Hero Card (2 Columns) */}
          <CyberCard variant="glowing" padding="lg" className="lg:col-span-2 flex flex-col justify-between relative overflow-hidden group">
            <div className="absolute -top-24 -right-24 w-80 h-80 bg-purple-600/20 rounded-full blur-3xl pointer-events-none group-hover:bg-purple-600/30 transition-all duration-500" />
            <div className="absolute -bottom-24 -left-24 w-80 h-80 bg-cyan-600/15 rounded-full blur-3xl pointer-events-none" />

            <div className="space-y-6 relative z-10">
              <div className="inline-flex items-center gap-2">
                <CyberBadge variant="purple" pulse icon={<Sparkles className="w-3.5 h-3.5 text-amber-400" />}>
                  AI-Powered Guitar Platform
                </CyberBadge>
              </div>

              <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white leading-tight">
                {cmsContent?.heroTitle ? (
                  cmsContent.heroTitle
                ) : (
                  <>
                    Mainkan Chord Favoritmu dengan <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-cyan-300 to-indigo-400">Teknologi Cyber AI</span>
                  </>
                )}
              </h1>

              <p className="text-slate-300 text-sm sm:text-base leading-relaxed max-w-2xl font-normal">
                {cmsContent?.heroSubtitle || 
                  "Ribuan lirik & chord gitar akurat dengan fitur Smart Transposer, Auto-Scroll Teleprompter, Simulasi Genjreng Audio Synth, dan Transkripsi AI Real-time."}
              </p>
            </div>

            <div className="pt-8 mt-6 border-t border-purple-500/15 flex flex-wrap items-center gap-4 relative z-10">
              <Link href="/search">
                <CyberButton variant="cyan" size="lg" leftIcon={<Search className="w-4 h-4" />}>
                  Mulai Cari Chord
                </CyberButton>
              </Link>

              <Link href="/features">
                <CyberButton variant="outline" size="lg" rightIcon={<ArrowRight className="w-4 h-4" />}>
                  Jelajahi Fitur
                </CyberButton>
              </Link>
            </div>
          </CyberCard>

          {/* Side Card: Song of the Day / Quick Stats Widget (1 Column) */}
          <CyberCard variant="glowing" padding="lg" className="lg:col-span-1 flex flex-col justify-between relative">
            <div className="flex items-center justify-between mb-4">
              <CyberBadge variant="amber" icon={<Flame className="w-3.5 h-3.5 text-amber-400" />}>
                Song of the Day
              </CyberBadge>
              <span className="text-[11px] font-mono text-slate-400 font-bold uppercase tracking-wider">Top Trending</span>
            </div>

            {featuredSong ? (
              <div className="space-y-4 my-auto">
                <div className="relative aspect-video rounded-xl overflow-hidden border border-purple-500/30 group">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={featuredSong.cover_url || "https://images.unsplash.com/photo-1511192336575-5a79af67a629?q=80&w=600&h=600&auto=format&fit=crop"}
                    alt={featuredSong.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/30 to-transparent" />
                  
                  <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
                    <CyberBadge variant="purple" size="sm">
                      Key: {featuredSong.key || "C"}
                    </CyberBadge>
                    <CyberBadge variant={getDifficultyVariant(featuredSong.difficulty)} size="sm">
                      {getDifficultyLabel(featuredSong.difficulty)}
                    </CyberBadge>
                  </div>
                </div>

                <div>
                  <h3 className="text-xl font-bold text-white line-clamp-1">{featuredSong.title}</h3>
                  <p className="text-sm text-cyan-400 font-medium">{featuredSong.artist}</p>
                </div>

                <Link href={`/chord/${featuredSong.id}`} className="block">
                  <CyberButton variant="primary" size="md" className="w-full" leftIcon={<Play className="w-4 h-4 fill-current" />}>
                    Mainkan Chord Sekarang
                  </CyberButton>
                </Link>
              </div>
            ) : (
              <div className="py-8 text-center text-slate-400 space-y-2">
                <Guitar className="w-10 h-10 text-purple-400 mx-auto animate-pulse" />
                <p className="text-xs font-semibold">Memuat Rekomendasi Lagu...</p>
              </div>
            )}

            <div className="pt-4 border-t border-purple-500/15 flex items-center justify-between text-xs text-slate-400 font-mono">
              <span>✨ 10,000+ Kunci Gitar</span>
              <span>⚡ Transkripsi AI</span>
            </div>
          </CyberCard>
        </section>

        {/* TRENDING CHORDS SECTION */}
        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Flame className="w-5 h-5 text-rose-500" />
                <h2 className="text-2xl font-black text-white tracking-tight">Trending & Populer</h2>
              </div>
              <p className="text-xs sm:text-sm text-slate-400">Lagu-lagu yang paling banyak dimainkan minggu ini</p>
            </div>

            <Link href="/search">
              <CyberButton variant="ghost" size="sm" rightIcon={<ChevronRight className="w-4 h-4" />}>
                Lihat Semua
              </CyberButton>
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {topSongs.map((song) => (
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
                      {song.views ? `${song.views.toLocaleString()} views` : "Populer"}
                    </span>
                  </div>
                </CyberCard>
              </Link>
            ))}
          </div>
        </section>

        {/* NEW RELEASES SECTION */}
        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-cyan-400" />
                <h2 className="text-2xl font-black text-white tracking-tight">Baru Ditambahkan</h2>
              </div>
              <p className="text-xs sm:text-sm text-slate-400">Chord & lirik lagu terbaru yang siap kamu pelajari</p>
            </div>

            <Link href="/search">
              <CyberButton variant="ghost" size="sm" rightIcon={<ChevronRight className="w-4 h-4" />}>
                Lihat Semua
              </CyberButton>
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {newReleases.map((song) => (
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
                      <h3 className="text-base font-bold text-white group-hover:text-purple-300 transition-colors line-clamp-1">
                        {song.title}
                      </h3>
                      <p className="text-xs text-slate-400 line-clamp-1 font-medium">{song.artist}</p>
                    </div>
                  </div>

                  <div className="pt-3 mt-3 border-t border-purple-500/10 flex items-center justify-between text-xs">
                    <CyberBadge variant="cyan" size="sm">
                      Key: {song.key || "C"}
                    </CyberBadge>
                    <span className="text-[11px] font-mono text-cyan-400 font-semibold">Baru</span>
                  </div>
                </CyberCard>
              </Link>
            ))}
          </div>
        </section>

        {/* POPULAR ARTISTS SHOWCASE */}
        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-purple-400" />
                <h2 className="text-2xl font-black text-white tracking-tight">Katalog Artis Populer</h2>
              </div>
              <p className="text-xs sm:text-sm text-slate-400">Temukan koleksi kunci gitar dari musisi dan band favoritmu</p>
            </div>

            <Link href="/artists">
              <CyberButton variant="ghost" size="sm" rightIcon={<ChevronRight className="w-4 h-4" />}>
                Jelajahi Semua Artis
              </CyberButton>
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-8 gap-4">
            {popularArtists.map((artist: any, index: number) => {
              const artistName = artist.name || artist.artist || `Artist ${index + 1}`;
              const avatar = artist.avatar_url || artist.cover_url || "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=200&h=200&auto=format&fit=crop";
              
              return (
                <Link key={artist.id || artistName} href={`/search?q=${encodeURIComponent(artistName)}`}>
                  <CyberCard variant="interactive" padding="sm" className="flex flex-col items-center text-center group">
                    <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-full overflow-hidden border-2 border-purple-500/30 group-hover:border-cyan-400 shadow-glow-sm transition-all duration-300 mb-2">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={avatar}
                        alt={artistName}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                    </div>
                    <h3 className="text-xs font-bold text-white group-hover:text-cyan-300 transition-colors line-clamp-1">
                      {artistName}
                    </h3>
                    <p className="text-[10px] text-slate-400 font-mono">
                      {artist.song_count || artist.songCount || "Catalog"} Lagu
                    </p>
                  </CyberCard>
                </Link>
              );
            })}
          </div>
        </section>

      </div>
    </main>
  );
}
