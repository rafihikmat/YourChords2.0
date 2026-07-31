"use client";

import React, { useState } from "react";
import { Send, CheckCircle2, RefreshCw, Music, Sparkles, HelpCircle } from "lucide-react";

interface SearchEmptyStateProps {
  searchQuery: string;
}

export default function SearchEmptyState({ searchQuery }: SearchEmptyStateProps) {
  const [loading, setLoading] = useState(false);
  const [requested, setRequested] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  const handleRequestSong = async () => {
    if (!searchQuery.trim() || loading || requested) return;

    setLoading(true);
    setFeedbackMsg(null);

    try {
      const res = await fetch("/api/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ keyword: searchQuery.trim() }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setRequested(true);
        setFeedbackMsg("✨ Permintaan lagu berhasil dikirim ke Admin!");
      } else {
        setFeedbackMsg(data.error || "Gagal mengirim permintaan ke admin.");
      }
    } catch (err: any) {
      setFeedbackMsg(err?.message || "Terjadi kesalahan koneksi saat mengirim permintaan.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center text-center py-16 px-6 max-w-xl mx-auto border border-white/10 rounded-3xl bg-surface/80 backdrop-blur-xl shadow-2xl relative overflow-hidden my-8">
      {/* BACKGROUND NEON GLOW */}
      <div className="absolute -top-24 -left-24 w-48 h-48 bg-primary/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-violet-500/20 rounded-full blur-3xl pointer-events-none" />

      {/* ICON BADGE */}
      <div className="w-16 h-16 bg-primary/10 border border-primary/30 rounded-2xl flex items-center justify-center text-primary mb-6 shadow-[0_0_25px_rgba(168,85,247,0.3)]">
        <Music className="w-8 h-8" />
      </div>

      <h2 className="text-xl md:text-2xl font-black text-white tracking-tight mb-2">
        Chord Tidak Ditemukan
      </h2>

      <p className="text-slate-300 text-xs md:text-sm leading-relaxed mb-6">
        Tidak ada chord yang cocok dengan pencarian <span className="text-primary font-mono font-bold bg-primary/10 px-2 py-0.5 rounded border border-primary/20">&quot;{searchQuery}&quot;</span>.
      </p>

      {/* ACTION BUTTON */}
      <div className="flex flex-col items-center gap-3 w-full">
        <button
          type="button"
          onClick={handleRequestSong}
          disabled={loading || requested}
          className={`w-full sm:w-auto px-6 py-3.5 rounded-xl font-bold text-xs md:text-sm transition-all flex items-center justify-center gap-2 cursor-pointer ${
            requested
              ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-[0_0_20px_rgba(16,185,129,0.3)] cursor-default"
              : "bg-primary hover:bg-primary-light text-white shadow-[0_0_25px_rgba(168,85,247,0.4)] hover:shadow-[0_0_35px_rgba(168,85,247,0.6)]"
          } disabled:opacity-80`}
        >
          {loading ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin text-white" />
              <span>Mengirim Permintaan...</span>
            </>
          ) : requested ? (
            <>
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Permintaan Terkirim!</span>
            </>
          ) : (
            <>
              <Send className="w-4 h-4" />
              <span>Minta Admin Tambahkan Lagu Ini</span>
            </>
          )}
        </button>

        {/* FEEDBACK TOAST NOTIFICATION */}
        {feedbackMsg && (
          <div className={`mt-3 p-3.5 rounded-xl border text-xs font-bold flex items-center gap-2 w-full animate-fade-in ${
            requested 
              ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-300 shadow-[0_0_15px_rgba(16,185,129,0.2)] text-left" 
              : "bg-red-500/15 border-red-500/40 text-red-300 text-left"
          }`}>
            {requested ? (
              <Sparkles className="w-4 h-4 text-emerald-400 flex-shrink-0 animate-pulse" />
            ) : (
              <HelpCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
            )}
            <span>{feedbackMsg}</span>
          </div>
        )}
      </div>

      <p className="text-[11px] text-slate-500 mt-6 font-mono">
        💡 Tim Admin YourChords akan menerima permintaan lagu ini dan dapat menyedotnya langsung ke database.
      </p>
    </div>
  );
}
