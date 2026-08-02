export const revalidate = 60;

import React from "react";
import SongCard from "@/components/SongCard";
import { getLatestSongs, getFeaturedHeroSongs, getTrendingSongs } from "@/lib/supabase";
import { getSiteCMSContent } from "@/lib/adminCMS";
import { AnimatedSection, HeroCarousel } from "@/components/HomeClientComponents";
import { Music, PlusCircle, Sparkles, Megaphone } from "lucide-react";
import Link from "next/link";

export default async function Home() {
  const [featuredSongs, popularSongs, recentSongs, cmsContent] = await Promise.all([
    getFeaturedHeroSongs(),
    getTrendingSongs(8),
    getLatestSongs(8),
    getSiteCMSContent()
  ]);

  const heroSongs = featuredSongs.length > 0 ? featuredSongs : popularSongs.slice(0, 3);
  const isEmpty = popularSongs.length === 0 && recentSongs.length === 0;

  return (
    <main className="w-full min-h-screen text-white bg-black block relative z-10 pt-16">
      {/* RUNNING ANNOUNCEMENT BAR */}
      {cmsContent?.announcementText && (
        <div className="bg-gradient-to-r from-primary/20 via-violet-600/30 to-primary/20 border-b border-primary/30 py-2.5 px-4 text-center overflow-hidden">
          <div className="inline-flex items-center gap-2 text-xs font-bold text-primary-light animate-pulse">
            <Megaphone className="w-4 h-4 text-amber-400 flex-shrink-0" />
            <span>{cmsContent.announcementText}</span>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-10 pb-24 pt-0 bg-black">
        
        {/* MASSIVE HERO BANNER CAROUSEL */}
        {heroSongs.length > 0 ? (
          <HeroCarousel 
            trendingSongs={heroSongs} 
            customHeroTitle={cmsContent?.heroTitle}
            customHeroSubtitle={cmsContent?.heroSubtitle}
          />
        ) : (
          <div className="relative w-full h-[35vh] min-h-[280px] bg-gradient-to-b from-slate-900/80 to-black border-b border-white/10 flex flex-col items-center justify-center text-center p-6">
            <div className="p-4 bg-primary/10 rounded-full border border-primary/20 mb-3">
              <Sparkles className="w-8 h-8 text-primary animate-pulse" />
            </div>
            <h1 className="text-3xl font-black text-white tracking-tight">
              {cmsContent?.heroTitle || "YourChords Platform"}
            </h1>
            <p className="text-slate-400 text-sm max-w-md mt-1">
              {cmsContent?.heroSubtitle || "Platform Chord Gitar AI Terlengkap dengan Transkripsi Real-time."}
            </p>
          </div>
        )}


        {/* EMPTY STATE OR SONG LISTS */}
        {isEmpty ? (
          <div className="px-4 md:px-8 lg:px-12 py-16 text-center flex flex-col items-center justify-center">
            <div className="w-20 h-20 rounded-full bg-slate-900 border border-white/10 flex items-center justify-center mb-4">
              <Music className="w-10 h-10 text-slate-500" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-2">Belum Ada Lagu di Database</h3>
            <p className="text-slate-400 max-w-md mb-6 text-sm">
              Mulai tambahkan lagu favoritmu atau generate chord otomatis dengan AI Generator sekarang!
            </p>
            <Link
              href="/ai-generator"
              className="inline-flex items-center gap-2 px-6 py-3 bg-primary hover:bg-primary-light text-white font-bold rounded-xl shadow-[0_0_20px_rgba(168,85,247,0.4)] transition-all"
            >
              <PlusCircle className="w-5 h-5" />
              <span>Generate Lagu Baru dengan AI</span>
            </Link>
          </div>
        ) : (
          <>
            {/* HORIZONTAL ROW 1 - PALING POPULER */}
            {popularSongs.length > 0 && (
              <div className="px-4 md:px-8 lg:px-12 -mt-12 relative z-20">
                <AnimatedSection title="Paling Populer & Trending" subtitle="Lihat Semua">
                  <div className="flex w-full gap-4 md:gap-5 overflow-x-auto snap-x hide-scrollbar pb-6 pt-2">
                    {popularSongs.map((song) => (
                      <div className="snap-start flex-shrink-0" key={`pop-${song.id}`}>
                        <SongCard song={song} />
                      </div>
                    ))}
                  </div>
                </AnimatedSection>
              </div>
            )}

            {/* HORIZONTAL ROW 2 - BARU DITAMBAHKAN */}
            {recentSongs.length > 0 && (
              <div className="px-4 md:px-8 lg:px-12">
                <AnimatedSection title="Baru Ditambahkan" subtitle="Lihat Semua">
                  <div className="flex w-full gap-4 md:gap-5 overflow-x-auto snap-x hide-scrollbar pb-6 pt-2">
                    {recentSongs.map((song) => (
                      <div className="snap-start flex-shrink-0" key={`rec-${song.id}`}>
                        <SongCard song={song} />
                      </div>
                    ))}
                  </div>
                </AnimatedSection>
              </div>
            )}
          </>
        )}

      </div>
    </main>
  );
}

