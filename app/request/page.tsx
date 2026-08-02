"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { 
  Music, Send, Sparkles, Flame, CheckCircle2, AlertCircle, 
  Link2, FileText, ShieldCheck, User
} from "lucide-react";
import { CyberInput } from "@/components/ui/CyberInput";
import { CyberButton } from "@/components/ui/CyberButton";
import { CyberCard } from "@/components/ui/CyberCard";
import { CyberBadge } from "@/components/ui/CyberBadge";

interface RequestedSongItem {
  id: string;
  keyword: string;
  search_count: number;
}

export default function SongRequestPage() {
  const [title, setTitle] = useState("");
  const [artist, setArtist] = useState("");
  const [referenceUrl, setReferenceUrl] = useState("");
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
    const fullNote = [
      referenceUrl.trim() ? `Link Referensi: ${referenceUrl.trim()}` : "",
      note.trim()
    ].filter(Boolean).join("\n");

    try {
      const res = await fetch("/api/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          keyword: keyword,
          title: title.trim(), 
          artist: artist.trim(), 
          reference_url: referenceUrl.trim(),
          note: fullNote 
        }),
      });

      const json = await res.json();

      if (json.success) {
        setSuccessMessage(`Terimakasih! Permintaan lagu "${keyword}" telah dicatat dan masuk ke antrean admin.`);
        setTitle("");
        setArtist("");
        setReferenceUrl("");
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
    <div className="min-h-screen bg-slate-950 text-white flex flex-col font-sans selection:bg-purple-500/30 selection:text-white">
      <main className="flex-1 pt-24 pb-16 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto w-full">
        {/* HERO BANNER SECTION */}
        <section className="relative rounded-3xl p-8 md:p-12 border border-purple-500/30 bg-slate-900/80 backdrop-blur-2xl overflow-hidden shadow-[0_0_50px_rgba(168,85,247,0.15)] mb-10 text-center">
          <div className="absolute -top-24 -left-24 w-72 h-72 bg-purple-600/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -right-24 w-72 h-72 bg-cyan-600/20 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 max-w-2xl mx-auto flex flex-col items-center gap-3">
            <CyberBadge variant="purple" pulse icon={<Sparkles className="w-3.5 h-3.5" />}>
              COMMUNITY CROWDSOURCING
            </CyberBadge>

            <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-white mt-2">
              Permintaan <span className="bg-gradient-to-r from-purple-400 via-cyan-400 to-teal-300 bg-clip-text text-transparent">Lagu Baru</span>
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
            <CyberCard variant="glowing" padding="lg" className="relative overflow-hidden">
              <div className="flex items-center gap-3 mb-6 pb-4 border-b border-white/10">
                <div className="p-2.5 rounded-xl bg-purple-500/20 border border-purple-500/40 text-purple-300 shadow-[0_0_15px_rgba(168,85,247,0.3)]">
                  <Music className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-white uppercase tracking-wide">
                    Formulir Permintaan Lagu
                  </h3>
                  <p className="text-xs text-slate-400">Pastikan ejaan judul dan artis sudah benar</p>
                </div>
              </div>

              {/* NEON TOAST SUCCESS */}
              {successMessage && (
                <div className="mb-6 p-4 rounded-xl bg-emerald-950/60 border border-emerald-500/50 text-emerald-300 text-xs font-bold flex items-start gap-3 shadow-[0_0_20px_rgba(16,185,129,0.3)] animate-fade-in">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5 animate-bounce" />
                  <div className="leading-relaxed flex-1">{successMessage}</div>
                </div>
              )}

              {/* ERROR NOTIFICATION */}
              {errorMessage && (
                <div className="mb-6 p-4 rounded-xl bg-rose-950/60 border border-rose-500/50 text-rose-300 text-xs font-bold flex items-start gap-3 animate-fade-in">
                  <AlertCircle className="w-5 h-5 text-rose-400 flex-shrink-0 mt-0.5" />
                  <div className="leading-relaxed flex-1">{errorMessage}</div>
                </div>
              )}

              <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                {/* Judul Lagu */}
                <CyberInput
                  label="Judul Lagu *"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Contoh: Rayuan Perempuan Gila"
                  icon={<Music className="w-4 h-4 text-purple-400" />}
                  required
                />

                {/* Nama Artis / Band */}
                <CyberInput
                  label="Nama Artis / Band *"
                  value={artist}
                  onChange={(e) => setArtist(e.target.value)}
                  placeholder="Contoh: Nadin Amizah"
                  icon={<User className="w-4 h-4 text-cyan-400" />}
                  required
                />

                {/* Link Referensi (Opsional) */}
                <CyberInput
                  label="Link Referensi (Opsional)"
                  value={referenceUrl}
                  onChange={(e) => setReferenceUrl(e.target.value)}
                  placeholder="https://youtube.com/watch?v=... atau link Spotify"
                  icon={<Link2 className="w-4 h-4 text-emerald-400" />}
                  helperText="Link YouTube/Spotify untuk referensi versi lagu (jika ada)"
                />

                {/* Catatan Khusus */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                    <FileText className="w-3.5 h-3.5 text-purple-400" />
                    <span>Catatan Khusus (Opsional)</span>
                  </label>
                  <textarea
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    rows={3}
                    placeholder="Informasi tambahan seperti versi kunci (Acoustic/Easy), atau petunjuk tempo..."
                    className="w-full bg-slate-950/70 text-slate-100 placeholder-slate-500 text-sm rounded-xl border border-purple-500/25 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 hover:border-purple-500/40 p-3.5 outline-none transition-all duration-200"
                  />
                </div>

                {/* Submit Button */}
                <div className="mt-2">
                  <CyberButton
                    type="submit"
                    variant="primary"
                    size="lg"
                    isLoading={submitting}
                    rightIcon={<Send className="w-4 h-4" />}
                    className="w-full"
                  >
                    Kirim Permintaan Lagu
                  </CyberButton>
                </div>
              </form>
            </CyberCard>
          </section>

          {/* RIGHT COLUMN: TOP REQUESTS BOARD (5 COLS) */}
          <section className="lg:col-span-5 flex flex-col gap-6">
            <CyberCard variant="default" padding="md" className="flex flex-col gap-4">
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <Flame className="w-5 h-5 text-amber-400 animate-bounce" />
                  <h3 className="text-sm font-black text-white uppercase tracking-wider">
                    Top Requested Songs
                  </h3>
                </div>
                <CyberBadge variant="amber" size="sm">
                  5 Terpopuler
                </CyberBadge>
              </div>

              <p className="text-xs text-slate-400 leading-relaxed">
                Lagu dengan permintaan terbanyak akan menjadi prioritas scraper AI dan tim penulisan chord kami:
              </p>

              {loadingTopRequests ? (
                <div className="flex items-center justify-center py-8">
                  <div className="w-6 h-6 border-2 border-purple-500/30 border-t-purple-500 rounded-full animate-spin" />
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
                      className="flex items-center justify-between bg-slate-950/70 border border-white/10 hover:border-purple-500/40 rounded-xl p-3 transition-all"
                    >
                      <div className="flex items-center gap-3">
                        <span className={`w-6 h-6 rounded-lg flex items-center justify-center font-mono text-xs font-black ${
                          idx === 0 ? "bg-amber-500/20 text-amber-300 border border-amber-500/40" :
                          idx === 1 ? "bg-slate-400/20 text-slate-300 border border-slate-400/40" :
                          idx === 2 ? "bg-amber-700/20 text-amber-400 border border-amber-700/40" :
                          "bg-white/5 text-slate-400 border border-white/10"
                        }`}>
                          {idx + 1}
                        </span>
                        <span className="text-xs font-bold text-slate-200 line-clamp-1">
                          {req.keyword}
                        </span>
                      </div>

                      <CyberBadge variant="purple" size="sm">
                        {req.search_count} req
                      </CyberBadge>
                    </div>
                  ))}
                </div>
              )}
            </CyberCard>

            {/* COMMUNITY GUARANTEE CARD */}
            <CyberCard variant="interactive" padding="md">
              <div className="flex items-center gap-2 font-bold text-white text-xs uppercase tracking-wide mb-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Jaminan Komunitas YourChords</span>
              </div>
              <p className="text-xs leading-relaxed text-slate-300">
                Setiap lagu yang Anda minta diproses secara otomatis oleh sistem pencari AI dan diverifikasi oleh komunitas musisi agar penempatan chord dan lirik selalu 100% presisi.
              </p>
            </CyberCard>
          </section>
        </div>
      </main>
    </div>
  );
}
