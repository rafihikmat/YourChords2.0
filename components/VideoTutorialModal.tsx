"use client";

import React, { useEffect } from "react";
import { X, Youtube, ExternalLink } from "lucide-react";
import { extractYouTubeId } from "@/lib/youtube";

interface VideoTutorialModalProps {
  isOpen: boolean;
  onClose: () => void;
  tutorial: {
    title: string;
    video_id: string;
    channel_title?: string;
  } | null;
}

export default function VideoTutorialModal({ isOpen, onClose, tutorial }: VideoTutorialModalProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !tutorial) return null;

  const cleanVideoId = extractYouTubeId(tutorial.video_id);

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-3xl bg-slate-950 border border-red-500/30 rounded-3xl p-5 md:p-6 shadow-[0_0_50px_rgba(239,68,68,0.25)] text-white overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Glow Effects */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-24 bg-red-600/20 blur-3xl pointer-events-none rounded-full" />

        {/* Header */}
        <div className="flex items-start justify-between gap-4 mb-4 relative z-10">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-red-600/20 text-red-500 border border-red-500/30 rounded-2xl flex-shrink-0">
              <Youtube className="w-6 h-6 fill-current" />
            </div>
            <div>
              <h3 className="text-base md:text-lg font-bold text-white line-clamp-1">
                {tutorial.title}
              </h3>
              {tutorial.channel_title && (
                <p className="text-xs text-slate-400 font-medium">
                  {tutorial.channel_title}
                </p>
              )}
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-full transition-all cursor-pointer flex-shrink-0"
            title="Tutup Modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Video Player Frame (16:9 Aspect Ratio) */}
        <div className="relative w-full aspect-video rounded-2xl overflow-hidden bg-black border border-white/10 shadow-inner">
          {cleanVideoId ? (
            <iframe
              src={`https://www.youtube-nocookie.com/embed/${cleanVideoId}?autoplay=1&rel=0`}
              title={tutorial.title}
              className="w-full h-full border-0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center text-slate-400">
              <p className="text-sm font-semibold mb-2">Video ID tidak valid</p>
              <a
                href={`https://www.youtube.com/watch?v=${tutorial.video_id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-red-600 text-white font-bold text-xs rounded-xl hover:bg-red-700 transition-colors"
              >
                <span>Buka di YouTube</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="mt-4 flex items-center justify-between text-xs text-slate-400 border-t border-white/10 pt-3">
          <span className="text-[11px]">Tutorial Gitar Interactive Player</span>
          <a
            href={`https://www.youtube.com/watch?v=${cleanVideoId || tutorial.video_id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-slate-400 hover:text-red-400 transition-colors text-xs"
          >
            <span>Tonton langsung di YouTube</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>
    </div>
  );
}
