import React from "react";
import Link from "next/link";
import { 
  Sparkles, Zap, Heart, Cpu, Sliders, Layers, Users, 
  ArrowRight, ShieldCheck, Award, Music2
} from "lucide-react";
import { getSiteCMSContent } from "@/lib/adminCMS";
import { CyberButton } from "@/components/ui/CyberButton";
import { CyberCard } from "@/components/ui/CyberCard";
import { CyberBadge } from "@/components/ui/CyberBadge";

export const metadata = {
  title: "Tentang Kami - YourChords 2.0",
  description: "YourChords 2.0 - Platform Chord & Lirik Lagu Masa Depan dengan AI & Transposer Interaktif.",
};

export default async function AboutPage() {
  const cmsContent = await getSiteCMSContent();

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col font-sans selection:bg-purple-500/30 selection:text-white">
      <main className="flex-1 pt-24 pb-16 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto w-full">
        {/* HERO BANNER CYBER-ZEN */}
        <section className="relative rounded-3xl p-8 md:p-14 border border-purple-500/30 bg-slate-900/80 backdrop-blur-2xl overflow-hidden shadow-[0_0_50px_rgba(168,85,247,0.15)] mb-12 text-center">
          <div className="absolute -top-24 -left-24 w-72 h-72 bg-purple-600/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -right-24 w-72 h-72 bg-cyan-600/20 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 max-w-3xl mx-auto flex flex-col items-center">
            <CyberBadge variant="purple" pulse icon={<Sparkles className="w-3.5 h-3.5" />}>
              EVOLUTION 2.0 • CYBER-ZEN ARCHITECTURE
            </CyberBadge>

            <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white mb-4 leading-tight mt-4">
              YourChords 2.0 - <span className="bg-gradient-to-r from-purple-400 via-cyan-400 to-teal-300 bg-clip-text text-transparent">Platform Chord & Lirik Lagu Masa Depan</span>
            </h1>

            <p className="text-slate-300 text-sm md:text-base leading-relaxed mb-8 max-w-2xl font-medium">
              {cmsContent.aboutDescription || "Platform chord dan lirik lagu gitar paling presisi, cepat, dan interaktif di Indonesia. Dirancang khusus untuk memudahkan setiap musisi dan penyanyi menemukan harmonisasi musik terbaik."}
            </p>

            <Link href="/">
              <CyberButton variant="cyan" size="lg" rightIcon={<ArrowRight className="w-4 h-4" />}>
                Jelajahi Katalog Lagu
              </CyberButton>
            </Link>
          </div>
        </section>

        {/* METRIC STATS GRID (3 CARDS) */}
        <section className="mb-12">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-center">
            <CyberCard variant="glowing" padding="lg">
              <div className="flex flex-col items-center">
                <div className="w-10 h-10 rounded-xl bg-purple-500/20 border border-purple-500/30 text-purple-300 flex items-center justify-center mb-3">
                  <Music2 className="w-5 h-5" />
                </div>
                <div className="text-3xl md:text-4xl font-black text-white font-mono tracking-tight bg-gradient-to-r from-purple-400 to-indigo-300 bg-clip-text text-transparent">
                  10,000+
                </div>
                <div className="text-xs text-slate-400 font-bold uppercase tracking-wider mt-1">
                  Total Katalog Lagu
                </div>
              </div>
            </CyberCard>

            <CyberCard variant="glowing" padding="lg">
              <div className="flex flex-col items-center">
                <div className="w-10 h-10 rounded-xl bg-cyan-500/20 border border-cyan-500/30 text-cyan-300 flex items-center justify-center mb-3">
                  <Users className="w-5 h-5" />
                </div>
                <div className="text-3xl md:text-4xl font-black text-white font-mono tracking-tight bg-gradient-to-r from-cyan-400 to-teal-300 bg-clip-text text-transparent">
                  25,000+
                </div>
                <div className="text-xs text-slate-400 font-bold uppercase tracking-wider mt-1">
                  Total Pengguna Aktif
                </div>
              </div>
            </CyberCard>

            <CyberCard variant="glowing" padding="lg">
              <div className="flex flex-col items-center">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 flex items-center justify-center mb-3">
                  <Award className="w-5 h-5" />
                </div>
                <div className="text-3xl md:text-4xl font-black text-white font-mono tracking-tight bg-gradient-to-r from-emerald-400 to-teal-300 bg-clip-text text-transparent">
                  99.8%
                </div>
                <div className="text-xs text-slate-400 font-bold uppercase tracking-wider mt-1">
                  Tingkat Akurasi Chord
                </div>
              </div>
            </CyberCard>
          </div>
        </section>

        {/* MISSION & VISION */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          <CyberCard variant="interactive" padding="lg">
            <div className="w-12 h-12 bg-purple-500/20 text-purple-300 rounded-xl flex items-center justify-center border border-purple-500/30 mb-5 shadow-[0_0_15px_rgba(168,85,247,0.2)]">
              <Zap className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-bold text-white mb-3">Misi Utama Kami</h2>
            <p className="text-slate-300 text-xs md:text-sm leading-relaxed">
              Menghadirkan perpustakaan kunci gitar terlengkap dengan akurasi tinggi, didukung teknologi AI modern dan alat bantu interaktif seperti Real-time Transposer, Auto Scroll cerdas, serta Diagram Fretboard 3D.
            </p>
          </CyberCard>

          <CyberCard variant="interactive" padding="lg">
            <div className="w-12 h-12 bg-cyan-500/20 text-cyan-300 rounded-xl flex items-center justify-center border border-cyan-500/30 mb-5 shadow-[0_0_15px_rgba(6,182,212,0.2)]">
              <Heart className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-bold text-white mb-3">Komunitas Musisi</h2>
            <p className="text-slate-300 text-xs md:text-sm leading-relaxed">
              Memberdayakan komunitas pencinta musik Indonesia untuk saling berbagi, memberikan rating, menyimpan setlist lagu favorit, dan mengusulkan lagu baru secara instan melalui sistem Smart Insight.
            </p>
          </CyberCard>
        </section>

        {/* FEATURE HIGHLIGHTS */}
        <section className="mb-12">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-black text-white tracking-tight">
              Karakteristik & Keunggulan <span className="text-cyan-400">YourChords</span>
            </h2>
            <p className="text-slate-400 text-xs mt-1">Didesain dengan presisi tinggi untuk kenyamanan latihan dan performa panggung</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <CyberCard variant="default" padding="md">
              <div className="w-10 h-10 rounded-lg bg-purple-500/10 border border-purple-500/30 text-purple-300 flex items-center justify-center mb-4">
                <Cpu className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-white text-sm mb-2">Hybrid Chord Engine</h3>
              <p className="text-slate-400 text-xs leading-relaxed">
                Ekstraksi & pemrosesan lirik-chord presisi menggunakan AI Gemini & Scraper pintar.
              </p>
            </CyberCard>

            <CyberCard variant="default" padding="md">
              <div className="w-10 h-10 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 flex items-center justify-center mb-4">
                <Sliders className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-white text-sm mb-2">Real-time Transposer</h3>
              <p className="text-slate-400 text-xs leading-relaxed">
                Ubah nada dasar lagu secara instan (Capo & Transpose) sesuai jangkauan vokal Anda.
              </p>
            </CyberCard>

            <CyberCard variant="default" padding="md">
              <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 flex items-center justify-center mb-4">
                <Layers className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-white text-sm mb-2">Interactive Fretboard</h3>
              <p className="text-slate-400 text-xs leading-relaxed">
                Visualisasi posisi jari di fretboard gitar interaktif untuk membantu pemula.
              </p>
            </CyberCard>

            <CyberCard variant="default" padding="md">
              <div className="w-10 h-10 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300 flex items-center justify-center mb-4">
                <Users className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-white text-sm mb-2">Crowdsourced Setlist</h3>
              <p className="text-slate-400 text-xs leading-relaxed">
                Kelola setlist lagu pertunjukan dan bagikan daftar lagu ke sesama musisi.
              </p>
            </CyberCard>
          </div>
        </section>
      </main>
    </div>
  );
}
