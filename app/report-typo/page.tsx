"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import { 
  AlertTriangle, Send, CheckCircle2, ArrowLeft, 
  Music, Mail, FileText, Sparkles, HelpCircle 
} from "lucide-react";
import { supabase } from "@/lib/supabase";

export default function ReportTypoPage() {
  const [songTitleArtist, setSongTitleArtist] = useState("");
  const [issueType, setIssueType] = useState("Chord Salah");
  const [details, setDetails] = useState("");
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

  const issueOptions = [
    { value: "Chord Salah", label: "Chord Salah / Tidak Pas" },
    { value: "Lirik Typo", label: "Lirik Typo / Salah Kata" },
    { value: "Kunci Terlalu Sulit", label: "Kunci Terlalu Sulit (Butuh Versi Easy)" },
    { value: "Video Tutorial Mati", label: "Video Tutorial / YouTube Mati" },
    { value: "Lainnya", label: "Masalah Lainnya" },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessToast(null);
    setErrorMsg(null);

    if (!songTitleArtist.trim()) {
      setErrorMsg("Harap isi Judul Lagu & Nama Artis.");
      return;
    }

    if (!details.trim()) {
      setErrorMsg("Harap deskripsikan detail perbaikan yang diperlukan.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/report-typo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          song_title_artist: songTitleArtist,
          issue_type: issueType,
          details: details,
          email: email,
        }),
      });

      const json = await res.json();

      if (json.success) {
        setSuccessToast("Terimakasih! Laporan typo Anda telah diterima oleh Admin.");
        setSongTitleArtist("");
        setDetails("");
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
    <div className="min-h-screen bg-slate-950 text-white flex flex-col font-sans selection:bg-primary selection:text-white">
      <Navbar />

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
          <div className="mb-8 p-5 rounded-2xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 text-xs sm:text-sm font-bold flex items-center gap-3 shadow-[0_0_30px_rgba(16,185,129,0.25)] animate-fade-in">
            <CheckCircle2 className="w-6 h-6 text-emerald-400 flex-shrink-0 animate-bounce" />
            <div className="leading-relaxed flex-1">{successToast}</div>
          </div>
        )}

        {/* ERROR MESSAGE BANNER */}
        {errorMsg && (
          <div className="mb-8 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs font-bold flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* FORM CARD CYBER-ZEN */}
        <div className="bg-surface/80 border border-white/10 rounded-3xl p-6 sm:p-8 backdrop-blur-2xl shadow-2xl relative overflow-hidden">
          {/* Ambient Glow */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

          <form onSubmit={handleSubmit} className="flex flex-col gap-5 relative z-10">
            {/* Field 1: Song Title & Artist */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold text-slate-300 flex items-center gap-2">
                <Music className="w-4 h-4 text-primary" />
                <span>Judul Lagu & Nama Artis <span className="text-red-400">*</span></span>
              </label>
              <input
                type="text"
                value={songTitleArtist}
                onChange={(e) => setSongTitleArtist(e.target.value)}
                placeholder="Contoh: Sheila On 7 - Dan"
                className="w-full bg-black/80 border border-white/15 focus:border-amber-400/70 rounded-xl px-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:shadow-[0_0_20px_rgba(245,158,11,0.2)] text-xs sm:text-sm font-sans transition-all"
                required
              />
            </div>

            {/* Field 2: Issue Type Dropdown */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold text-slate-300 flex items-center gap-2">
                <FileText className="w-4 h-4 text-amber-400" />
                <span>Jenis Kesalahan <span className="text-red-400">*</span></span>
              </label>
              <select
                value={issueType}
                onChange={(e) => setIssueType(e.target.value)}
                className="w-full bg-black/80 border border-white/15 focus:border-amber-400/70 rounded-xl px-4 py-3 text-white focus:outline-none focus:shadow-[0_0_20px_rgba(245,158,11,0.2)] text-xs sm:text-sm font-sans cursor-pointer transition-all"
              >
                {issueOptions.map((opt) => (
                  <option key={opt.value} value={opt.value} className="bg-slate-900 text-white">
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Field 3: Issue Details */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold text-slate-300 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-primary" />
                <span>Detail Perbaikan <span className="text-red-400">*</span></span>
              </label>
              <textarea
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                rows={4}
                placeholder="Jelaskan bagian mana yang salah (misal: 'Bait ke-2 chord harusnya Am, bukan A' atau 'BaitReff typo kata melangkah')..."
                className="w-full bg-black/80 border border-white/15 focus:border-amber-400/70 rounded-xl p-4 text-white placeholder-slate-600 focus:outline-none focus:shadow-[0_0_20px_rgba(245,158,11,0.2)] text-xs sm:text-sm font-sans transition-all leading-relaxed"
                required
              />
            </div>

            {/* Field 4: Reporter Email */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold text-slate-300 flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-slate-400" />
                  <span>Email Pelapor</span>
                </span>
                <span className="text-[10px] text-slate-500 font-mono">(Opsional - Untuk kabar perbaikan)</span>
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="emailAnda@example.com"
                className="w-full bg-black/80 border border-white/15 focus:border-amber-400/70 rounded-xl px-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:shadow-[0_0_20px_rgba(245,158,11,0.2)] text-xs sm:text-sm font-sans transition-all"
              />
            </div>

            {/* SUBMIT BUTTON */}
            <button
              type="submit"
              disabled={loading}
              className="mt-2 w-full flex items-center justify-center gap-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black py-3.5 px-6 rounded-xl shadow-[0_0_25px_rgba(245,158,11,0.3)] hover:shadow-[0_0_35px_rgba(245,158,11,0.5)] transition-all disabled:opacity-40 disabled:cursor-not-allowed text-xs sm:text-sm uppercase tracking-wider cursor-pointer"
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                  <span>Mengirim Laporan...</span>
                </div>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Kirim Laporan Perbaikan</span>
                </>
              )}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}
