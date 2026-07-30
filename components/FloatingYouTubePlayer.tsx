"use client";

import React, { useState } from "react";
import { X, Minimize2, Maximize2, Youtube, ExternalLink, RefreshCw } from "lucide-react";
import { extractYouTubeId } from "@/lib/youtube";

interface FloatingYouTubePlayerProps {
  title: string;
  artist: string;
  youtubeVideoId?: string | null;
  onClose: () => void;
}

export default function FloatingYouTubePlayer({
  title,
  artist,
  youtubeVideoId,
  onClose,
}: FloatingYouTubePlayerProps) {
  const [isMinimized, setIsMinimized] = useState(false);
  const initialCleanId = extractYouTubeId(youtubeVideoId);
  const [customVideoId, setCustomVideoId] = useState<string | null>(initialCleanId || null);
  const [isEditingUrl, setIsEditingUrl] = useState(false);
  const [inputUrl, setInputUrl] = useState("");

  const activeVideoId = customVideoId || extractYouTubeId(youtubeVideoId);

  // Build Embed URL with clean YouTube video ID
  const embedUrl = activeVideoId
    ? `https://www.youtube-nocookie.com/embed/${activeVideoId}?autoplay=0&enablejsapi=1&rel=0`
    : `https://www.youtube-nocookie.com/embed?listType=search&list=${encodeURIComponent(artist + " " + title + " official audio")}`;

  const handleSaveCustomUrl = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputUrl.trim()) {
      const extracted = extractYouTubeId(inputUrl);
      if (extracted) {
        setCustomVideoId(extracted);
      }
    }
    setIsEditingUrl(false);
  };

  return (
    <div className="fixed bottom-24 right-4 md:right-8 z-[90] transition-all duration-300 animate-slide-up">
      <div
        className={`bg-slate-950/95 border border-primary/40 rounded-2xl shadow-[0_0_40px_rgba(168,85,247,0.35)] backdrop-blur-xl overflow-hidden transition-all duration-300 ${
          isMinimized ? "w-72 p-3" : "w-[320px] sm:w-[380px]"
        }`}
      >
        {/* HEADER BAR */}
        <div className="flex items-center justify-between p-3 bg-white/5 border-b border-white/10 gap-2">
          <div className="flex items-center gap-2 overflow-hidden">
            <div className="w-7 h-7 rounded-lg bg-red-600/20 border border-red-500/40 flex items-center justify-center text-red-500 flex-shrink-0">
              <Youtube className="w-4 h-4 fill-current" />
            </div>
            <div className="truncate">
              <p className="text-xs font-bold text-white truncate">{title}</p>
              <p className="text-[10px] text-slate-400 truncate">{artist} • Play-Along</p>
            </div>
          </div>

          <div className="flex items-center gap-1 flex-shrink-0">
            <button
              onClick={() => setIsEditingUrl(!isEditingUrl)}
              className="p-1.5 text-slate-400 hover:text-primary hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
              title="Ganti Video YouTube"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setIsMinimized(!isMinimized)}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
              title={isMinimized ? "Perbesar Player" : "Kecilkan Player"}
            >
              {isMinimized ? <Maximize2 className="w-3.5 h-3.5" /> : <Minimize2 className="w-3.5 h-3.5" />}
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
              title="Tutup Player"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* CUSTOM URL INPUT PANEL */}
        {isEditingUrl && !isMinimized && (
          <form onSubmit={handleSaveCustomUrl} className="p-3 bg-white/5 border-b border-white/10 flex gap-2">
            <input
              type="text"
              placeholder="Paste URL YouTube..."
              value={inputUrl}
              onChange={(e) => setInputUrl(e.target.value)}
              className="flex-1 bg-black/60 border border-white/15 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-slate-500 outline-none focus:border-primary"
            />
            <button
              type="submit"
              className="px-3 py-1.5 bg-primary text-white font-bold text-xs rounded-lg hover:bg-primary-light cursor-pointer"
            >
              Set
            </button>
          </form>
        )}

        {/* VIDEO IFRAME AREA */}
        {!isMinimized && (
          <div className="relative w-full aspect-video bg-black">
            <iframe
              src={embedUrl}
              title={`${title} - ${artist}`}
              className="w-full h-full border-0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            ></iframe>
          </div>
        )}

        {/* MINIMIZED VIEW CONTENT */}
        {isMinimized && (
          <div className="flex items-center justify-between text-xs text-slate-300 pt-1">
            <span className="text-[11px] font-medium text-primary-light animate-pulse">Pemutar Musik Aktif</span>
            <a
              href={`https://www.youtube.com/results?search_query=${encodeURIComponent(artist + " " + title)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-slate-400 hover:text-white flex items-center gap-1 text-[10px]"
            >
              Buka YouTube <ExternalLink className="w-2.5 h-2.5" />
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
