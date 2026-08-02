"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { 
  AlertTriangle, Send, CheckCircle2, ArrowLeft, 
  Music, Mail, FileText, Sparkles, HelpCircle 
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { CyberInput } from "@/components/ui/CyberInput";
import { CyberButton } from "@/components/ui/CyberButton";
import { CyberCard } from "@/components/ui/CyberCard";
import { CyberBadge } from "@/components/ui/CyberBadge";

export default function ReportTypoPage() {
  const [songTitleArtist, setSongTitleArtist] = useState("");
  const [faultySection, setFaultySection] = useState("");
  const [proposedFix, setProposedFix] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [successToast, setSuccessToast] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Auto-fill user email if authenticated
  useEffect(() => {
    async function loadUser() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user && user.email) {
          setEmail(user.email);
        }
      } catch (err) {
        // Silent catch if anonymous
      }
    }
    loadUser();

    // Auto fill query parameter if navigated from song page
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const songParam = params.get("song");
      if (songParam) {
        setSongTitleArtist(decodeURIComponent(songParam));
      }
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessToast(null);
    setErrorMsg(null);

    if (!songTitleArtist.trim()) {
      setErrorMsg("Harap isi Judul Lagu & Nama Artis.");
      return;
    }

    if (!faultySection.trim() && !proposedFix.trim()) {
      setErrorMsg("Harap deskripsikan bagian yang salah dan usulan perbaikan.");
      return;
    }

    setLoading(true);

    const fullDetails = [
      faultySection.trim() ? `[Bagian yang salah]: ${faultySection.trim()}` : "",
      proposedFix.trim() ? `[Usulan perbaikan]: ${proposedFix.trim()}` : ""
    ].filter(Boolean).join("\n\n");

    try {
      const res = await fetch("/api/report-typo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          song_title_artist: songTitleArtist,
          issue_type: "Chord / Lirik Typo",
          details: fullDetails,
          email: email,
        }),
      });

      const json = await res.json();

      if (json.success) {
        setSuccessToast("Terimakasih! Laporan kesalahan chord Anda telah diterima oleh Admin.");
        setSongTitleArtist("");
        setFaultySection("");
        setProposedFix("");
      } else {
        setErrorMsg(json.error || "Gagal mengirim laporan. Coba lagi nanti.");
      }
    } catch (err: any) {
      setErrorMsg(err?.message || "Terjadi kesalahan koneksi saat mengirim laporan.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col font-sans selection:bg-purple-500/30 selection:text-white">
      <main className="flex-1 pt-24 pb-16 px-4 sm:px-6 lg:px-8 max-w-3xl mx-auto w-full">
        {/* HEADER */}
        <div className="mb-8">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-white transition-colors mb-4 group"
          >
            <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
            <span>Kembali ke Beranda</span>
          </Link>

          <div className="flex items-center gap-3 mb-2">
            <div className="p-2.5 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.2)]">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Laporkan Typo <span className="text-amber-400">Chord & Lirik</span>
            </h1>
          </div>

          <p className="text-slate-400 text-xs sm:text-sm">
            Bantu kami menjaga akurasi kunci gitar & lirik lagu di YourChords agar seluruh musisi dapat berlatih dengan nyaman.
          </p>
        </div>

        {/* NEON SUCCESS TOAST BANNER */}
        {successToast && (
          <div className="mb-8 p-5 rounded-2xl bg-emerald-950/70 border border-emerald-500/50 text-emerald-300 text-xs sm:text-sm font-bold flex items-center gap-3 shadow-[0_0_30px_rgba(16,185,129,0.3)] animate-fade-in">
            <CheckCircle2 className="w-6 h-6 text-emerald-400 flex-shrink-0 animate-bounce" />
            <div className="leading-relaxed flex-1">{successToast}</div>
          </div>
        )}

        {/* ERROR MESSAGE BANNER */}
        {errorMsg && (
          <div className="mb-8 p-4 rounded-xl bg-rose-950/60 border border-rose-500/40 text-rose-300 text-xs font-bold flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-400 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* FORM CARD CYBER-ZEN */}
        <CyberCard variant="glowing" padding="lg" className="relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

          <form onSubmit={handleSubmit} className="flex flex-col gap-5 relative z-10">
            {/* Field 1: Song Title & Artist */}
            <CyberInput
              label="Judul Lagu & Nama Artis *"
              value={songTitleArtist}
              onChange={(e) => setSongTitleArtist(e.target.value)}
              placeholder="Contoh: Sheila On 7 - Dan"
              icon={<Music className="w-4 h-4 text-purple-400" />}
              required
            />

            {/* Field 2: Bagian yang Salah */}
            <CyberInput
              label="Bagian yang Salah *"
              value={faultySection}
              onChange={(e) => setFaultySection(e.target.value)}
              placeholder="Contoh: Reff ke-2 baris ke-3, atau Verse 1 kata 'melangkah'"
              icon={<AlertTriangle className="w-4 h-4 text-amber-400" />}
              required
            />

            {/* Field 3: Usulan Perbaikan */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                <FileText className="w-3.5 h-3.5 text-cyan-400" />
                <span>Usulan Perbaikan / Detail Koreksi *</span>
              </label>
              <textarea
                value={proposedFix}
                onChange={(e) => setProposedFix(e.target.value)}
                rows={4}
                placeholder="Jelaskan kunci atau lirik yang benar (misal: 'Chord harusnya Am, bukan A' atau 'Lirik yang benar: Dan bila esok...')"
                className="w-full bg-slate-950/70 text-slate-100 placeholder-slate-500 text-sm rounded-xl border border-purple-500/25 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 hover:border-purple-500/40 p-3.5 outline-none transition-all duration-200 leading-relaxed"
                required
              />
            </div>

            {/* Field 4: Reporter Email */}
            <CyberInput
              label="Email Pelapor (Opsional)"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="emailAnda@example.com"
              icon={<Mail className="w-4 h-4 text-slate-400" />}
              helperText="Opsional - Untuk menerima konfirmasi kabar perbaikan dari admin"
            />

            {/* SUBMIT BUTTON */}
            <div className="mt-2">
              <CyberButton
                type="submit"
                variant="cyan"
                size="lg"
                isLoading={loading}
                rightIcon={<Send className="w-4 h-4" />}
                className="w-full"
              >
                Kirim Laporan Perbaikan
              </CyberButton>
            </div>
          </form>
        </CyberCard>
      </main>
    </div>
  );
}
