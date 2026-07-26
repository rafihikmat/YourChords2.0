"use client";

import React from "react";
import Image from "next/image";
import { Play } from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";

export default function SongCard({ song }: { song: { id: string, title: string, artist: string, cover_url: string, source_url: string } }) {
  return (
    <Link href={`/chord/${song.id}`} className="block flex-shrink-0 w-36 sm:w-44 md:w-48 lg:w-56">
      <motion.div 
        className="group relative flex flex-col cursor-pointer h-full"
        whileHover={{ y: -5 }}
        transition={{ duration: 0.2 }}
      >
        <div className="relative w-full aspect-[3/4] rounded-lg overflow-hidden border border-white/[0.06] bg-surface">
          <Image 
            src={song.cover_url || "https://images.unsplash.com/photo-1511192336575-5a79af67a629?q=80&w=600&h=600&auto=format&fit=crop"} 
            alt={song.title} 
            fill 
            className="object-cover transition-transform duration-500 group-hover:scale-110"
            sizes="(max-width: 768px) 33vw, (max-width: 1200px) 20vw, 15vw"
          />
          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
            <motion.div 
              initial={{ scale: 0.5, opacity: 0 }}
              whileHover={{ scale: 1.1 }}
              className="w-12 h-12 md:w-14 md:h-14 bg-primary rounded-full flex items-center justify-center transform translate-y-4 group-hover:translate-y-0 transition-all duration-300 shadow-neon"
            >
              <Play className="w-5 h-5 md:w-6 md:h-6 text-white ml-0.5" fill="currentColor" />
            </motion.div>
          </div>
          {/* Bottom gradient for text readability */}
          <div className="absolute bottom-0 left-0 right-0 h-1/3 bg-gradient-to-t from-black/80 to-transparent pointer-events-none" />
        </div>

        <div className="mt-3 px-0.5">
          <h3 className="text-white font-semibold text-sm md:text-base truncate group-hover:text-primary transition-colors duration-200">
            {song.title}
          </h3>
          <p className="text-slate-500 text-xs md:text-sm truncate mt-0.5">
            {song.artist}
          </p>
        </div>
      </motion.div>
    </Link>
  );
}
