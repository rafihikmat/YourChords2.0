"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { 
  Music, Send, Sparkles, Flame, CheckCircle2, AlertCircle, ArrowLeft, 
  Search, FileText, HeartHandshake, ShieldCheck, HelpCircle 
} from "lucide-react";

interface RequestedSongItem {
  id: string;
  keyword: string;
  search_count: number;
}

export default function SongRequestPage() {
  const [title, setTitle] = useState("");
  const [artist, setArtist] = useState("");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [topRequests, setTopRequests] = useState<RequestedSongItem[]>([]);
  const [loadingTopRequests, setLoadingTopRequests] = useState(true);

  const fetchTopRequests = async () => {
    setLoadingTopRequests(true);
    try {
      const res = await fetch("/api/request");
      const json = await res.json();
      if (json.success && json.requests) {
        setTopRequests(json.requests);
      }
    } catch (err) {
      console.warn("Failed to load top requests:", err);
    } finally {
      setLoadingTopRequests(false);
    }
  };

  useEffect(() => {
    fetchTopRequests();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMessage(null);
    setErrorMessage(null);

    if (!title.trim() || !artist.trim()) {
      setErrorMessage("Harap lengkapi Judul Lagu dan Nama Artis.");
      return;
    }

    setSubmitting(true);

    const keyword = `${title.trim()} - ${artist.trim()}`;

    try {
      const res = await fetch("/api/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          keyword: keyword,
          title: title.trim(), 
          artist: artist.trim(), 
          note: note.trim() 
        }),
      });

      const json = await res.json();

      if (json.success) {
        setSuccessMessage(`Terimakasih! Permintaan lagu "${keyword}" telah dicatat dan masuk ke antrean admin.`);
        setTitle("");
        setArtist("");
        setNote("");
        fetchTopRequests();
      } else {
        setErrorMessage(json.error || "Gagal mengirim request lagu.");
      }
    } catch (err: any) {
      setErrorMessage(err?.message || "Terjadi kesalahan koneksi saat mengirim permintaan.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col font-sans selection:bg-primary selection:text-white">
      <Navbar />

      <main className="flex-1 pt-24 pb-16 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto w-full">
        {/* HERO BANNER SECTION */}
        <section className="relative rounded-3xl p-8 md:p-12 border border-primary/30 bg-surface/80 backdrop-blur-2xl overflow-hidden shadow-[0_0_50px_rgba(168,85,247,0.15)] mb-10 text-center">
          <div className="absolute -top-24 -left-24 w-72 h-72 bg-primary/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -right-24 w-72 h-72 bg-violet-600/20 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 max-w-2xl mx-auto flex flex-col items-center gap-3">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary/10 border border-primary/30 text-primary-light text-xs font-mono font-bold mb-2 shadow-[0_0_15px_rgba(168,85,247,0.3)]">
              <Sparkles className="w-3.5 h-3.5 animate-pulse" />
              <span>COMMUNITY CROWDSOURCING</span>
            </div>

            <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-white">
              Permintaan <span className="text-primary neon-text">Lagu Baru</span>
            </h1>

            <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
              Tidak menemukan lagu favoritmu di YourChords? Kirimkan request judul lagu & nama artis di bawah ini. Tim dan Scraper AI kami akan segera menambahkannya!
            </p>
          </div>
        </section>

        {/* MAIN CONTENT GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* LEFT COLUMN: REQUEST FORM (7 COLS) */}
          <section className="lg:col-span-7 flex flex-col gap-6">
            <div className="bg-surface/80 border border-white/10 rounded-3xl p-6 sm:p-8 backdrop-blur-xl shadow-2xl relative overflow-hidden">
              <div className="flex items-center gap-3 mb-6 pb-4 border-b border-white/10">
                <div className="p-2.5 rounded-xl bg-primary/20 border border-primary/40 text-primary shadow-[0_0_15px_rgba(168,85,247,0.3)]">
                  <Music className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-white uppercase tracking-wide">
                    Formulir Permintaan Lagu
                  </h3>
                  <p className="text-xs text-slate-400">Pastikan ejaan judul dan artis sudah benar</p>
                </div>
              </div>

              {successMessage && (
                <div className="mb-6 p-4 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-bold flex items-start gap-3 shadow-[0_0_20px_rgba(16,185,129,0.2)] animate-fade-in">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                  <div className="leading-relaxed">{successMessage}</div>
                </div>
              )}

              {errorMessage && (
                <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs font-bold flex items-start gap-3 animate-fade-in">
                  <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                  <div className="leading-relaxed">{errorMessage}</div>
                </div>
              )}

              <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold text-slate-300 flex items-center justify-between">
                    <span>Judul Lagu <span className="text-red-400">*</span></span>
                    <span className="text-[10px] text-slate-500 font-mono">Contoh: Rayuan Perempuan Gila</span>
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Masukkan judul lagu..."
                    className="w-full bg-black/80 border border-white/15 focus:border-primary/70 rounded-xl px-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:shadow-[0_0_20px_rgba(168,85,247,0.25)] text-xs font-sans transition-all"
                    required
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold text-slate-300 flex items-center justify-between">
                    <span>Nama Artis / Band <span className="text-red-400">*</span></span>
                    <span className="text-[10px] text-slate-500 font-mono">Contoh: Nadin Amizah</span>
                  </label>
                  <input
                    type="text"
                    value={artist}
                    onChange={(e) => setArtist(e.target.value)}
                    placeholder="Masukkan nama penyanyi atau band..."
                    className="w-full bg-black/80 border border-white/15 focus:border-primary/70 rounded-xl px-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:shadow-[0_0_20px_rgba(168,85,247,0.25)] text-xs font-sans transition-all"
                    required
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold text-slate-300 flex items-center justify-between">
                    <span>Catatan Tambahan <span className="text-slate-500 font-normal">(Opsional)</span></span>
                    <span className="text-[10px] text-slate-500 font-mono">Contoh: Versi Acoustic / Live</span>
                  </label>
                  <textarea
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    rows={3}
                    placeholder="Informasi tambahan seperti link YouTube, versi kunci (Acoustic/Easy), atau bagian spesifik..."
                    className="w-full bg-black/80 border border-white/15 focus:border-primary/70 rounded-xl p-4 text-white placeholder-slate-600 focus:outline-none focus:shadow-[0_0_20px_rgba(168,85,247,0.25)] text-xs font-sans transition-all"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="mt-2 w-full flex items-center justify-center gap-2 bg-primary hover:bg-primary-light text-white font-bold py-3.5 px-6 rounded-xl shadow-[0_0_25px_rgba(168,85,247,0.4)] hover:shadow-[0_0_35px_rgba(168,85,247,0.6)] transition-all disabled:opacity-40 disabled:cursor-not-allowed text-xs sm:text-sm uppercase tracking-wider cursor-pointer"
                >
                  {submitting ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                      <span>Mengirim Request...</span>
                    </div>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>Kirim Permintaan Lagu</span>
                    </>
                  )}
                </button>
              </form>
            </div>
          </section>

          {/* RIGHT COLUMN: TOP REQUESTS BOARD (5 COLS) */}
          <section className="lg:col-span-5 flex flex-col gap-6">
            <div className="bg-surface/80 border border-white/10 rounded-3xl p-6 backdrop-blur-xl shadow-2xl flex flex-col gap-4">
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <Flame className="w-5 h-5 text-amber-400 animate-bounce" />
                  <h3 className="text-sm font-black text-white uppercase tracking-wider">
                    Top Requested Songs
                  </h3>
                </div>
                <span className="text-[10px] font-mono text-primary bg-primary/20 border border-primary/30 px-2 py-0.5 rounded-full font-bold">
                  5 Terpopuler
                </span>
              </div>

              <p className="text-xs text-slate-400">
                Lagu dengan permintaan terbanyak akan menjadi prioritas scraper AI dan tim penulisan chord kami:
              </p>

              {loadingTopRequests ? (
                <div className="flex items-center justify-center py-8">
                  <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                </div>
              ) : topRequests.length === 0 ? (
                <div className="text-center py-6 text-slate-500 text-xs">
                  Belum ada data permintaan lagu.
                </div>
              ) : (
                <div className="flex flex-col gap-2.5 mt-1">
                  {topRequests.slice(0, 5).map((req, idx) => (
                    <div
                      key={req.id || idx}
                      className="flex items-center justify-between bg-black/60 border border-white/10 hover:border-primary/40 rounded-xl p-3 transition-all"
                    >
                      <div className="flex items-center gap-3">
                        <span className={`w-6 h-6 rounded-lg flex items-center justify-center font-mono text-xs font-black ${
                          idx === 0 ? "bg-amber-500/20 text-amber-400 border border-amber-500/40" :
                          idx === 1 ? "bg-slate-400/20 text-slate-300 border border-slate-400/40" :
                          idx === 2 ? "bg-amber-700/20 text-amber-500 border border-amber-700/40" :
                          "bg-white/5 text-slate-400 border border-white/10"
                        }`}>
                          {idx + 1}
                        </span>
                        <span className="text-xs font-bold text-slate-200 line-clamp-1">
                          {req.keyword}
                        </span>
                      </div>

                      <div className="flex items-center gap-1 bg-primary/10 border border-primary/30 px-2.5 py-1 rounded-lg text-primary text-[10px] font-mono font-bold flex-shrink-0">
                        <span>{req.search_count}</span>
                        <span className="text-[9px] text-primary/70">req</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* COMMUNITY GUARANTEE CARD */}
            <div className="bg-gradient-to-br from-purple-900/30 via-slate-900/50 to-slate-950 border border-primary/20 rounded-2xl p-5 text-xs text-slate-300 flex flex-col gap-3">
              <div className="flex items-center gap-2 font-bold text-white uppercase tracking-wide">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Jaminan Komunitas YourChords</span>
              </div>
              <p className="leading-relaxed text-slate-400">
                Setiap lagu yang Anda minta diproses secara otomatis oleh sistem pencari AI dan diverifikasi oleh komunitas musisi agar penempatan chord dan lirik selalu 100% presisi.
              </p>
            </div>
          </section>

        </div>
      </main>

      <Footer />
    </div>
  );
}
