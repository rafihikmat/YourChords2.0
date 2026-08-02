"use client";

import React, { useState } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import { 
  Sparkles, Sliders, Layers, Volume2, Smartphone, Play, 
  ArrowRight, ShieldCheck, Zap, Music, BookOpen, CheckCircle2,
  Wand2, Radio
} from "lucide-react";

export default function FeaturesPage() {
  const [activeTab, setActiveTab] = useState<number | null>(null);

  const features = [
    {
      id: 1,
      title: "Hybrid Chord Position Engine",
      subtitle: "Diagram SVG Fretboard Interaktif & Variasi Kunci",
      icon: Layers,
      color: "from-primary to-violet-600",
      borderColor: "hover:border-primary/50",
      glowColor: "rgba(168,85,247,0.25)",
      badge: "SVG Fretboard 3D",
      description: "Nikmati tampilan visualisasi penjarian senar gitar yang presisi secara real-time. Lengkap dengan penomoran jari (1=Telunjuk, 2=Tengah, 3=Manis, 4=Kelingking), posisi barre chord, serta navigator variasi bentuk kunci < 1 of N >.",
      benefits: ["Penomoran jari otomatis", "Support Barre Chord fret tinggi", "Variasi alternatif Open vs High Fret"]
    },
    {
      id: 2,
      title: "Smart Transposer & Capo Shift",
      subtitle: "Ubah Nada Dasar & Penyesuaian Capo Otomatis",
      icon: Sliders,
      color: "from-blue-500 to-indigo-600",
      borderColor: "hover:border-blue-500/50",
      glowColor: "rgba(59,130,246,0.25)",
      badge: "Semitone Engine",
      description: "Transposisi nada dasar lagu dalam hitungan milidetik secara instan. Lengkap dengan perhitungan Capo Shift otomatis sehingga Anda dapat memainkan bentuk chord yang lebih simpel tanpa mengubah pitch vokal.",
      benefits: ["Naik/turun semitone +1 / -1", "Perhitungan fret Capo otomatis", "Reset 1-click ke Original Key"]
    },
    {
      id: 3,
      title: "Pemula / Simplifier Toggle",
      subtitle: "Mode 1-Click Penyederhanaan Chord Rumit",
      icon: Wand2,
      color: "from-emerald-500 to-teal-600",
      borderColor: "hover:border-emerald-500/50",
      glowColor: "rgba(16,185,129,0.25)",
      badge: "Easy Chord Mode",
      description: "Merasa kesulitan memainkan chord gantung/barre rumit seperti F, B, atau extended chord 9th/11th/13th? Aktifkan Mode Pemula untuk mengonversi chord lagu menjadi bentuk open chord yang sangat mudah dipelajari.",
      benefits: ["Konversi chord barre ke open chord", "Ramah untuk pemula & akustik", "Presisi harmoni tetap terjaga"]
    },
    {
      id: 4,
      title: "Auto-Scroll Teleprompter",
      subtitle: "Pengatur Kecepatan Gulir Lirik Hands-Free",
      icon: Play,
      color: "from-amber-500 to-orange-600",
      borderColor: "hover:border-amber-500/50",
      glowColor: "rgba(245,158,11,0.25)",
      badge: "Live Performance Mode",
      description: "Latihan dan manggung tanpa gangguan menggeser layar HP atau laptop. Fitur Auto-Scroll pintar menyelaraskan tempo gulir layar dengan ritme lagu, lengkap dengan slider pengatur kecepatan dinamis.",
      benefits: ["Kontrol Play / Pause mudah", "Pengatur kecepatan tempo halus", "Responsif di Layar HP & Tablet"]
    },
    {
      id: 5,
      title: "Web Audio Strumming Synthesizer",
      subtitle: "Simulasi Audio Petikan & Genjrengan Real-Time",
      icon: Volume2,
      color: "from-rose-500 to-pink-600",
      borderColor: "hover:border-rose-500/50",
      glowColor: "rgba(244,63,94,0.25)",
      badge: "Web Audio API",
      description: "Dengarkan sampel nada asli dari setiap chord sebelum memetiknya di gitar Anda. Menggunakan sintesis frekuensi Web Audio API murni tanpa perlu mengunduh file sampel mp3 yang berat.",
      benefits: ["Suara petikan instan & responsif", "Akurasi frekuensi pitch nada", "Bekerja di seluruh browser modern"]
    },
    {
      id: 6,
      title: "PWA & Offline First Mode",
      subtitle: "Akses Lagu Favorit Kapan Saja Tanpa Kuota",
      icon: Smartphone,
      color: "from-cyan-500 to-blue-600",
      borderColor: "hover:border-cyan-500/50",
      glowColor: "rgba(6,182,212,0.25)",
      badge: "Progressive Web App",
      description: "YourChords dapat diinstall langsung ke layar HP atau PC Anda sebagai Progressive Web App (PWA). Seluruh lagu favorit dan setlist yang pernah dibuka tersimpan dalam cache lokal untuk dimainkan secara offline.",
      benefits: ["Install langsung tanpa PlayStore", "Penyimpanan cache offline otomatis", "Hemat kuota & loading ultra-cepat"]
    }
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col font-sans selection:bg-primary selection:text-white">
      <Navbar />

      <main className="flex-1 pt-24 pb-16 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto w-full">
        {/* HERO BANNER SECTION */}
        <section className="relative rounded-3xl p-8 md:p-14 border border-primary/30 bg-surface/80 backdrop-blur-2xl overflow-hidden shadow-[0_0_60px_rgba(168,85,247,0.18)] mb-12 text-center">
          <div className="absolute -top-28 -left-28 w-80 h-80 bg-primary/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-28 -right-28 w-80 h-80 bg-violet-600/20 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 max-w-3xl mx-auto flex flex-col items-center gap-4">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/30 text-primary-light text-xs font-mono font-bold shadow-[0_0_15px_rgba(168,85,247,0.3)]">
              <Sparkles className="w-3.5 h-3.5 animate-pulse text-amber-400" />
              <span>YOURCHORDS 2.0 TECH STACK</span>
            </div>

            <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white leading-tight">
              Teknologi & Fitur Unggulan <span className="text-primary neon-text">YourChords 2.0</span>
            </h1>

            <p className="text-slate-300 text-xs sm:text-base leading-relaxed max-w-2xl font-medium">
              Ekosistem musik terlengkap untuk latihan, manggung, dan mempelajari teori chord dengan performa tinggi dan desain Cyber-Zen mutakhir.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-4 mt-2">
              <Link
                href="/"
                className="inline-flex items-center gap-2 px-6 py-3.5 bg-primary hover:bg-primary-light text-white font-extrabold rounded-2xl shadow-[0_0_25px_rgba(168,85,247,0.5)] hover:shadow-[0_0_35px_rgba(168,85,247,0.7)] transition-all text-xs uppercase tracking-wider cursor-pointer group"
              >
                <span>Coba Semua Fitur Sekarang</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>
        </section>

        {/* 6 MAIN FEATURES SHOWCASE GRID */}
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
          {features.map((feat) => {
            const Icon = feat.icon;
            const isHovered = activeTab === feat.id;

            return (
              <div
                key={feat.id}
                onMouseEnter={() => setActiveTab(feat.id)}
                onMouseLeave={() => setActiveTab(null)}
                className={`group relative bg-surface/80 border border-white/10 ${feat.borderColor} rounded-3xl p-6 sm:p-7 backdrop-blur-xl transition-all duration-300 hover:-translate-y-1.5 flex flex-col justify-between overflow-hidden shadow-xl`}
                style={{
                  boxShadow: isHovered ? `0 0 35px ${feat.glowColor}` : undefined
                }}
              >
                {/* Ambient Top Corner Glow */}
                <div className={`absolute -right-16 -top-16 w-36 h-36 bg-gradient-to-br ${feat.color} opacity-15 rounded-full blur-2xl group-hover:opacity-30 transition-opacity pointer-events-none`} />

                <div>
                  {/* Card Header: Icon + Badge */}
                  <div className="flex items-center justify-between mb-5">
                    <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${feat.color} p-0.5 shadow-lg group-hover:scale-110 transition-transform`}>
                      <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
                        <Icon className="w-6 h-6 text-white" />
                      </div>
                    </div>

                    <span className="text-[10px] font-mono font-bold px-3 py-1 rounded-full bg-white/5 border border-white/10 text-slate-300 group-hover:border-white/20 transition-colors">
                      {feat.badge}
                    </span>
                  </div>

                  {/* Title & Subtitle */}
                  <h3 className="text-lg font-black text-white group-hover:text-primary transition-colors mb-1">
                    {feat.title}
                  </h3>
                  <p className="text-xs font-bold text-slate-400 mb-3">
                    {feat.subtitle}
                  </p>

                  {/* Description */}
                  <p className="text-xs text-slate-300 leading-relaxed mb-6">
                    {feat.description}
                  </p>
                </div>

                {/* Benefits List */}
                <div className="pt-4 border-t border-white/10 flex flex-col gap-2">
                  {feat.benefits.map((b, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-[11px] font-medium text-slate-300">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                      <span>{b}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </section>

        {/* BOTTOM CTA BANNER */}
        <section className="relative rounded-3xl p-8 sm:p-10 border border-primary/40 bg-gradient-to-r from-purple-950/60 via-slate-900/80 to-slate-950 backdrop-blur-2xl overflow-hidden shadow-2xl text-center flex flex-col items-center gap-4">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 rounded-full blur-3xl pointer-events-none" />

          <div className="w-12 h-12 rounded-2xl bg-primary/20 border border-primary/40 text-primary flex items-center justify-center mb-1 shadow-[0_0_20px_rgba(168,85,247,0.4)]">
            <Radio className="w-6 h-6 animate-pulse" />
          </div>

          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Siap Memainkan Lagu Favoritmu Hari Ini?
          </h2>

          <p className="text-xs sm:text-sm text-slate-300 max-w-xl leading-relaxed">
            Bergabunglah dengan ribuan musisi Indonesia. Cari chord lagu favorit, simpan setlist manggung, dan rasakan kemudahan latihan tanpa iklan mengganggu.
          </p>

          <Link
            href="/"
            className="mt-2 inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-primary to-violet-600 hover:from-primary-light hover:to-violet-500 text-white font-black rounded-2xl shadow-[0_0_30px_rgba(168,85,247,0.5)] hover:shadow-[0_0_40px_rgba(168,85,247,0.7)] transition-all text-xs uppercase tracking-wider cursor-pointer"
          >
            <Music className="w-4 h-4" />
            <span>Jelajahi Ribuan Chord Lagu</span>
          </Link>
        </section>
      </main>
    </div>
  );
}
