"use client";

import React from "react";
import { Eye, Play } from "lucide-react";
import Link from "next/link";
import { Song } from "@/lib/types";
import { formatViewCount } from "@/lib/supabase";

export default function SongCard({ song }: { song: Song }) {
  const coverUrl = song.cover_url ||
    "https://images.unsplash.com/photo-1511192336575-5a79af67a629?q=80&w=800&auto=format&fit=crop";
  const views = song.views ?? song.view_count ?? 0;

  return (
    <Link
      href={`/chord/${song.id}`}
      className="block flex-shrink-0 w-36 sm:w-44 md:w-48 lg:w-56 group"
    >
      <div className="relative flex flex-col h-full transition-transform duration-300 group-hover:-translate-y-1.5">
        <div className="relative w-full aspect-[3/4] rounded-lg overflow-hidden border border-white/10 bg-surface shadow-lg">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={coverUrl}
            alt={song.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
            loading="lazy"
          />

          {/* Real Total Views Badge */}
          <div className="absolute top-2.5 right-2.5 bg-black/80 backdrop-blur-md px-2 py-0.5 rounded-full border border-white/10 text-[10px] font-mono font-bold text-amber-300 flex items-center gap-1 z-10">
            <Eye className="w-2.5 h-2.5 text-amber-400" />
            <span>{formatViewCount(views)}</span>
          </div>

          {/* Play button hover overlay */}
          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center z-20">
            <div className="w-12 h-12 md:w-14 md:h-14 bg-primary rounded-full flex items-center justify-center transition-transform duration-300 transform scale-90 group-hover:scale-100 shadow-[0_0_20px_rgba(168,85,247,0.8)]">
              <Play
                className="w-5 h-5 md:w-6 md:h-6 text-white ml-0.5"
                fill="currentColor"
              />
            </div>
          </div>
          {/* Bottom gradient */}
          <div className="absolute bottom-0 left-0 right-0 h-1/3 bg-gradient-to-t from-black/90 via-black/40 to-transparent pointer-events-none" />
        </div>

        <div className="mt-3 px-0.5">
          <h3 className="text-white font-bold text-sm md:text-base truncate group-hover:text-primary transition-colors duration-200">
            {song.title}
          </h3>
          <p className="text-slate-400 text-xs md:text-sm truncate mt-0.5">
            {song.artist}
          </p>
        </div>
      </div>
    </Link>
  );
}
