"use client";

import React from "react";
import { motion } from "framer-motion";

export const AnimatedSection = ({ children, title, subtitle }: { children: React.ReactNode, title: string, subtitle?: string }) => {
  return (
    <motion.section
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.6 }}
    >
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-white border-l-4 border-primary pl-3">
          {title}
        </h2>
        {subtitle && (
          <a href="#" className="text-sm font-medium text-slate-400 hover:text-primary transition-colors">
            {subtitle}
          </a>
        )}
      </div>
      {children}
    </motion.section>
  );
};

export const HeroCarousel = ({ trendingSongs }: { trendingSongs: any[] }) => {
  const [currentIndex, setCurrentIndex] = React.useState(0);

  React.useEffect(() => {
    if (trendingSongs.length <= 1) return;
    
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % trendingSongs.length);
    }, 5000); // 5 seconds rotation
    
    return () => clearInterval(interval);
  }, [trendingSongs.length]);

  if (!trendingSongs.length) return null;
  const currentSong = trendingSongs[currentIndex];

  return (
    <section className="relative w-full h-[75vh] min-h-[500px] border-b border-white/10 overflow-hidden">
      {trendingSongs.map((song, index) => (
        <motion.div
          key={song.id}
          initial={{ opacity: 0 }}
          animate={{ opacity: index === currentIndex ? 1 : 0 }}
          transition={{ duration: 1.5, ease: "easeInOut" }}
          className="absolute inset-0"
          style={{ zIndex: index === currentIndex ? 10 : 0 }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img 
            src={song.cover_url || "https://images.unsplash.com/photo-1627855365578-8d0cdabeed1a?q=80&w=1600&h=800&auto=format&fit=crop"}
            alt={song.title}
            className="object-cover object-center w-full h-full"
          />
        </motion.div>
      ))}

      {/* Overlay gradient untuk transisi ke background */}
      <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-transparent z-20 pointer-events-none" />
      <div className="absolute inset-0 bg-gradient-to-r from-background/95 via-background/40 to-transparent z-20 pointer-events-none" />
      
      <div className="absolute inset-0 flex flex-col justify-end p-6 md:p-12 lg:p-16 pb-12 z-30 pointer-events-none">
        <motion.div 
          key={currentIndex}
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="max-w-4xl"
        >
          <div className="flex items-center gap-3 mb-5">
            <span className="inline-flex items-center px-3 py-1 text-[10px] md:text-xs font-black tracking-[0.2em] uppercase bg-primary text-white rounded-md shadow-neon pointer-events-auto">
              TRENDING NO. {currentIndex + 1}
            </span>
            <span className="text-white/50 text-xs font-black tracking-widest">{songViewsFormatter(currentSong.views)} VIEWS</span>
          </div>
          
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-black text-white mb-2 drop-shadow-2xl leading-none">
            {currentSong.title}
          </h1>
          <p className="text-2xl md:text-3xl text-slate-300 font-bold mb-8 drop-shadow-md flex items-center gap-2">
            <span className="w-8 h-1 bg-primary rounded-full"></span>
            {currentSong.artist}
          </p>
          
          <div className="flex gap-4 pointer-events-auto w-fit">
            <a href={`/chord/${currentSong.id}`} className="flex items-center gap-2 bg-primary text-white font-bold px-8 py-4 rounded-lg hover:bg-primary-light transition-all duration-300 text-lg shadow-neon hover:shadow-neon-lg">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="6 3 20 12 6 21 6 3"/></svg>
              Mainkan Chord
            </a>
          </div>
        </motion.div>
      </div>

      {/* Identifiers Slider */}
      <div className="absolute bottom-6 right-6 md:right-12 z-40 flex gap-2">
        {trendingSongs.map((_, i) => (
          <div 
            key={i} 
            className={`h-1 rounded-full transition-all duration-500 ${i === currentIndex ? 'w-8 bg-primary opacity-100 shadow-neon-sm' : 'w-2 bg-white/30 opacity-50'}`}
          />
        ))}
      </div>
    </section>
  );
};

function songViewsFormatter(num: number | undefined | null) {
  if (!num) return '0';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return num.toString();
}
