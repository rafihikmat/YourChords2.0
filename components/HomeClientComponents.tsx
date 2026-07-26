"use client";

import React, { useState, useEffect } from "react";
import { Song } from "@/lib/types";

export const AnimatedSection = ({ children, title, subtitle }: { children: React.ReactNode, title: string, subtitle?: string }) => {
  return (
    <section className="block w-full my-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl md:text-2xl font-bold text-white border-l-4 border-primary pl-3 tracking-tight">
          {title}
        </h2>
        {subtitle && (
          <a href="#" className="text-xs md:text-sm font-semibold text-slate-400 hover:text-primary transition-colors">
            {subtitle}
          </a>
        )}
      </div>
      {children}
    </section>
  );
};

export const HeroCarousel = ({ trendingSongs }: { trendingSongs: Song[] }) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (!trendingSongs || trendingSongs.length <= 1) return;
    
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % trendingSongs.length);
    }, 5000);
    
    return () => clearInterval(interval);
  }, [trendingSongs]);

  if (!trendingSongs || trendingSongs.length === 0) return null;
  const currentSong = trendingSongs[currentIndex] || trendingSongs[0];

  return (
    <section className="relative w-full h-[65vh] min-h-[460px] max-h-[700px] border-b border-white/10 overflow-hidden bg-black block z-10">
      {/* Hero background image with active opacity */}
      {trendingSongs.map((song, index) => {
        const isActive = index === currentIndex;
        const cover = song.cover_url || "https://images.unsplash.com/photo-1627855365578-8d0cdabeed1a?q=80&w=1600&h=800&auto=format&fit=crop";
        return (
          <div
            key={song.id || index}
            className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${isActive ? "opacity-100 z-10" : "opacity-0 z-0 pointer-events-none"}`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img 
              src={cover}
              alt={song.title}
              className="object-cover object-center w-full h-full"
            />
          </div>
        );
      })}

      {/* Overlays for cinematic dark gradient */}
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/70 to-transparent z-20 pointer-events-none" />
      <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/50 to-transparent z-20 pointer-events-none" />
      
      {/* Content */}
      <div className="absolute inset-0 flex flex-col justify-end p-6 md:p-12 lg:p-16 pb-14 z-30 pointer-events-auto">
        <div className="max-w-4xl">
          <div className="flex items-center gap-3 mb-4">
            <span className="inline-flex items-center px-3 py-1 text-[10px] md:text-xs font-black tracking-[0.2em] uppercase bg-primary text-white rounded-md shadow-[0_0_15px_rgba(168,85,247,0.5)]">
              TRENDING NO. {currentIndex + 1}
            </span>
            <span className="text-slate-400 text-xs font-black tracking-widest uppercase">
              {songViewsFormatter(currentSong.views || currentSong.view_count)} VIEWS
            </span>
          </div>
          
          <h1 className="text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-black text-white mb-2 drop-shadow-2xl leading-tight">
            {currentSong.title}
          </h1>
          <p className="text-xl sm:text-2xl md:text-3xl text-slate-300 font-bold mb-6 drop-shadow-md flex items-center gap-2">
            <span className="w-8 h-1 bg-primary rounded-full"></span>
            {currentSong.artist}
          </p>
          
          <div className="flex gap-4 w-fit">
            <a 
              href={`/chord/${currentSong.id}`} 
              className="flex items-center gap-2.5 bg-primary text-white font-bold px-7 py-3.5 rounded-lg hover:bg-primary-light transition-all duration-300 text-sm sm:text-base shadow-[0_0_20px_rgba(168,85,247,0.5)] hover:shadow-[0_0_30px_rgba(168,85,247,0.8)]"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="6 3 20 12 6 21 6 3"/></svg>
              Mainkan Chord Sekarang
            </a>
          </div>
        </div>
      </div>

      {/* Carousel dots */}
      <div className="absolute bottom-6 right-6 md:right-12 z-40 flex gap-2">
        {trendingSongs.map((_, i) => (
          <button
            key={i} 
            onClick={() => setCurrentIndex(i)}
            aria-label={`Go to slide ${i + 1}`}
            className={`h-1.5 rounded-full transition-all duration-300 ${i === currentIndex ? 'w-8 bg-primary shadow-[0_0_10px_rgba(168,85,247,0.8)]' : 'w-2 bg-white/40 hover:bg-white/70'}`}
          />
        ))}
      </div>
    </section>
  );
};

function songViewsFormatter(num: number | undefined | null) {
  if (!num) return '12.5K';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return num.toString();
}
