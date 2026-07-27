"use client";

import React, { useState, useEffect } from "react";
import SongCard from "@/components/SongCard";
import { fetchAllSongs } from "@/lib/supabase";
import { getFeaturedHeroSongs } from "@/lib/adminCurated";
import { INITIAL_FALLBACK_CHORDS } from "@/lib/fallbackData";
import { AnimatedSection, HeroCarousel } from "@/components/HomeClientComponents";
import { Song } from "@/lib/types";

export default function Home() {
  // Direct sync initialization with fallback data so render is INSTANT without blank screens
  const [songs, setSongs] = useState<Song[]>(INITIAL_FALLBACK_CHORDS);
  const [featuredSongs, setFeaturedSongs] = useState<Song[]>([]);

  useEffect(() => {
    let mounted = true;

    async function loadData() {
      try {
        const [fetched, featured] = await Promise.all([
          fetchAllSongs(30),
          getFeaturedHeroSongs()
        ]);

        if (mounted) {
          if (fetched && fetched.length > 0) {
            setSongs(fetched);
          }
          if (featured && featured.length > 0) {
            setFeaturedSongs(featured);
          }
        }
      } catch (err) {
        console.warn("[HOME] Supabase fetch error, retaining fallbacks:", err);
      }
    }

    loadData();

    return () => {
      mounted = false;
    };
  }, []);

  // Use curated featured songs if set by admin, otherwise fallback to top 3
  const heroSongs = featuredSongs.length > 0 ? featuredSongs : songs.slice(0, 3);
  
  // Sorted by views for "Paling Populer"
  const popularSongs = [...songs].sort((a, b) => (b.views || b.view_count || 0) - (a.views || a.view_count || 0)).slice(0, 15);

  // Sorted by creation date for "Baru Ditambahkan"
  const recentSongs = [...songs].sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()).slice(0, 15);

  return (
    <main className="w-full min-h-screen text-white bg-black block relative z-10 pt-16">
      <div className="flex flex-col gap-10 pb-24 pt-0 bg-black">
        
        {/* MASSIVE HERO BANNER CAROUSEL */}
        <HeroCarousel trendingSongs={heroSongs} />

        {/* HORIZONTAL ROW 1 - PALING POPULER */}
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

        {/* HORIZONTAL ROW 2 - BARU DITAMBAHKAN */}
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

      </div>
    </main>
  );
}

