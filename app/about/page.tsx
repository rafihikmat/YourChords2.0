import React from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import { 
  Sparkles, Music2, Cpu, Sliders, Layers, Users, 
  ArrowRight, ShieldCheck, Zap, Heart, Award
} from "lucide-react";

export const metadata = {
  title: "Tentang Kami - YourChords 2.0",
  description: "Platform chord & lirik gitar AI tercanggih di Indonesia dengan fitur interaktif real-time.",
};

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col font-sans selection:bg-primary selection:text-white">
      <Navbar />

      <main className="flex-1 pt-24 pb-16 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto w-full">
        {/* HERO BANNER CYBER-ZEN */}
        <section className="relative rounded-3xl p-8 md:p-14 border border-primary/30 bg-surface/80 backdrop-blur-2xl overflow-hidden shadow-[0_0_50px_rgba(168,85,247,0.15)] mb-12 text-center">
          {/* Ambient Glows */}
          <div className="absolute -top-24 -left-24 w-72 h-72 bg-primary/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -right-24 w-72 h-72 bg-violet-600/20 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 max-w-3xl mx-auto flex flex-col items-center">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/30 text-primary-light text-xs font-mono font-bold mb-6 shadow-[0_0_15px_rgba(168,85,247,0.3)]">
              <Sparkles className="w-3.5 h-3.5 animate-pulse" />
              <span>EVOLUTION 2.0 • CYBER-ZEN ARCHITECTURE</span>
            </div>

            <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white mb-4 leading-tight">
              Tentang <span className="text-primary neon-text">YourChords 2.0</span>
            </h1>

            <p className="text-slate-300 text-sm md:text-base leading-relaxed mb-8">
              Platform chord dan lirik lagu gitar paling presisi, cepat, dan interaktif di Indonesia. Dirancang khusus untuk memudahkan setiap musisi dan penyanyi menemukan harmonisasi musik terbaik.
            </p>

            <Link
              href="/"
              className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl bg-primary hover:bg-primary-light text-white font-bold text-xs md:text-sm uppercase tracking-wider transition-all shadow-[0_0_25px_rgba(168,85,247,0.4)] hover:shadow-[0_0_35px_rgba(168,85,247,0.6)] cursor-pointer"
            >
              <span>Jelajahi Lagu Sekarang</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </section>

        {/* MISSION & VISION */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          <div className="p-8 rounded-2xl bg-surface/60 border border-white/10 backdrop-blur-xl relative overflow-hidden group hover:border-primary/40 transition-all">
            <div className="w-12 h-12 bg-primary/20 text-primary rounded-xl flex items-center justify-center border border-primary/30 mb-5 shadow-[0_0_15px_rgba(168,85,247,0.2)]">
              <Zap className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-bold text-white mb-3">Misi Utama Kami</h2>
            <p className="text-slate-300 text-xs md:text-sm leading-relaxed">
              Menghadirkan perpustakaan kunci gitar terlengkap dengan akurasi tinggi, didukung teknologi AI modern dan alat bantu interaktif seperti Real-time Transposer, Auto Scroll cerdas, serta Diagram Fretboard 3D.
            </p>
          </div>

          <div className="p-8 rounded-2xl bg-surface/60 border border-white/10 backdrop-blur-xl relative overflow-hidden group hover:border-violet-500/40 transition-all">
            <div className="w-12 h-12 bg-violet-500/20 text-violet-400 rounded-xl flex items-center justify-center border border-violet-500/30 mb-5 shadow-[0_0_15px_rgba(139,92,246,0.2)]">
              <Heart className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-bold text-white mb-3">Komunitas Musisi</h2>
            <p className="text-slate-300 text-xs md:text-sm leading-relaxed">
              Memberdayakan komunitas pencinta musik Indonesia untuk saling berbagi, memberikan rating, menyimpan setlist lagu favorit, dan mengusulkan lagu baru secara instan melalui sistem Smart Insight.
            </p>
          </div>
        </section>

        {/* FEATURE SHOWCASE BENTO GRID */}
        <section className="mb-12">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-black text-white tracking-tight">
              Fitur Unggulan <span className="text-primary">YourChords</span>
            </h2>
            <p className="text-slate-400 text-xs mt-1">Didesain dengan presisi tinggi untuk kenyamanan latihan dan performa panggung</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {/* Feature 1 */}
            <div className="p-6 rounded-2xl bg-black/60 border border-white/10 hover:border-primary/50 transition-all flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-lg bg-primary/10 border border-primary/30 text-primary flex items-center justify-center mb-4">
                  <Cpu className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-white text-sm mb-2">Hybrid Chord Engine</h3>
                <p className="text-slate-400 text-xs leading-relaxed">
                  Ekstraksi & pemrosesan lirik-chord presisi menggunakan AI Gemini & Scraper pintar.
                </p>
              </div>
            </div>

            {/* Feature 2 */}
            <div className="p-6 rounded-2xl bg-black/60 border border-white/10 hover:border-primary/50 transition-all flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mb-4">
                  <Sliders className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-white text-sm mb-2">Real-time Transposer</h3>
                <p className="text-slate-400 text-xs leading-relaxed">
                  Ubah nada dasar lagu secara instan (Capo & Transpose) sesuai jangkauan vokal Anda.
                </p>
              </div>
            </div>

            {/* Feature 3 */}
            <div className="p-6 rounded-2xl bg-black/60 border border-white/10 hover:border-primary/50 transition-all flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-lg bg-violet-500/10 border border-violet-500/30 text-violet-400 flex items-center justify-center mb-4">
                  <Layers className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-white text-sm mb-2">Interactive Fretboard</h3>
                <p className="text-slate-400 text-xs leading-relaxed">
                  Visualisasi posisi jari di fretboard gitar interaktif untuk membantu pemula.
                </p>
              </div>
            </div>

            {/* Feature 4 */}
            <div className="p-6 rounded-2xl bg-black/60 border border-white/10 hover:border-primary/50 transition-all flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center mb-4">
                  <Users className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-white text-sm mb-2">Crowdsourced Setlist</h3>
                <p className="text-slate-400 text-xs leading-relaxed">
                  Kelola setlist lagu pertunjukan dan bagikan daftar lagu ke sesama musisi.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* STATS CARDS */}
        <section className="p-8 rounded-3xl bg-surface/80 border border-white/10 backdrop-blur-xl mb-12 shadow-2xl">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-center divide-y sm:divide-y-0 sm:divide-x divide-white/10">
            <div className="pt-4 sm:pt-0">
              <div className="text-3xl md:text-4xl font-black text-white font-mono tracking-tight text-primary neon-text">
                10,000+
              </div>
              <div className="text-xs text-slate-400 font-bold uppercase tracking-wider mt-1">
                Koleksi Chord Lagu
              </div>
            </div>

            <div className="pt-4 sm:pt-0">
              <div className="text-3xl md:text-4xl font-black text-white font-mono tracking-tight text-violet-400">
                1M+
              </div>
              <div className="text-xs text-slate-400 font-bold uppercase tracking-wider mt-1">
                Total Penayangan Lirik
              </div>
            </div>

            <div className="pt-4 sm:pt-0">
              <div className="text-3xl md:text-4xl font-black text-white font-mono tracking-tight text-emerald-400">
                25,000+
              </div>
              <div className="text-xs text-slate-400 font-bold uppercase tracking-wider mt-1">
                Musisi Terdaftar
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
