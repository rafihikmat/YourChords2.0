"use client";

import React, { useState } from "react";
import Link from "next/link";
import { 
  Sparkles, Sliders, Layers, Volume2, Smartphone, Play, 
  ArrowRight, CheckCircle2, Wand2, Radio, Music, Guitar
} from "lucide-react";
import { CyberButton } from "@/components/ui/CyberButton";
import { CyberCard } from "@/components/ui/CyberCard";
import { CyberBadge } from "@/components/ui/CyberBadge";

export default function FeaturesPage() {
  const [hoveredId, setHoveredId] = useState<number | null>(null);

  const mainFeatures = [
    {
      id: 1,
      title: "Interactive Fretboard 3D",
      subtitle: "Visualisasi posisi jari & nada chord gitar",
      icon: Guitar,
      badgeVariant: "purple" as const,
      badgeText: "SVG Fretboard 3D",
      description: "Nikmati tampilan visualisasi penjarian senar gitar yang presisi secara real-time. Lengkap dengan penomoran jari (1=Telunjuk, 2=Tengah, 3=Manis, 4=Kelingking), posisi barre chord, serta navigator variasi bentuk kunci < 1 of N >.",
      benefits: ["Penomoran jari otomatis & presisi", "Support Barre Chord fret tinggi", "Variasi alternatif Open vs High Fret"]
    },
    {
      id: 2,
      title: "Smart Transposer & Capo Shift",
      subtitle: "Ubah nada dasar lagu secara real-time 1-klik",
      icon: Sliders,
      badgeVariant: "cyan" as const,
      badgeText: "Semitone Engine",
      description: "Transposisi nada dasar lagu dalam hitungan milidetik secara instan. Lengkap dengan perhitungan Capo Shift otomatis sehingga Anda dapat memainkan bentuk chord yang lebih simpel tanpa mengubah pitch vokal.",
      benefits: ["Naik/turun semitone +1 / -1 instan", "Perhitungan fret Capo otomatis", "Reset 1-click ke Original Key"]
    },
    {
      id: 3,
      title: "Pemula / Simplifier Mode",
      subtitle: "Sederhanakan chord palang/barre rumit",
      icon: Wand2,
      badgeVariant: "green" as const,
      badgeText: "Easy Chord Mode",
      description: "Merasa kesulitan memainkan chord gantung/barre rumit seperti F, B, atau extended chord 9th/11th/13th? Aktifkan Mode Pemula untuk mengonversi chord lagu menjadi bentuk open chord yang sangat mudah dipelajari.",
      benefits: ["Konversi chord barre ke open chord", "Ramah untuk pemula & gitar akustik", "Presisi harmoni tetap terjaga"]
    },
    {
      id: 4,
      title: "Hands-Free Auto-Scroll Teleprompter",
      subtitle: "Pengatur kecepatan gulir lirik otomatis",
      icon: Play,
      badgeVariant: "amber" as const,
      badgeText: "Live Performance Mode",
      description: "Latihan dan manggung tanpa gangguan menggeser layar HP atau laptop. Fitur Auto-Scroll pintar menyelaraskan tempo gulir layar dengan ritme lagu, lengkap dengan slider pengatur kecepatan dinamis.",
      benefits: ["Kontrol Play / Pause hands-free", "Pengatur kecepatan tempo halus", "Responsif di Layar HP, Tablet & Laptop"]
    },
    {
      id: 5,
      title: "Web Audio Strumming Synthesizer",
      subtitle: "Simulasi audio petikan & genjrengan real-time",
      icon: Volume2,
      badgeVariant: "rose" as const,
      badgeText: "Web Audio API",
      description: "Dengarkan sampel nada asli dari setiap chord sebelum memetiknya di gitar Anda. Menggunakan sintesis frekuensi Web Audio API murni tanpa perlu mengunduh file sampel mp3 yang berat.",
      benefits: ["Suara petikan instan & responsif", "Akurasi frekuensi pitch nada", "Bekerja di seluruh browser modern"]
    },
    {
      id: 6,
      title: "PWA & Offline First Mode",
      subtitle: "Akses lagu favorit kapan saja tanpa kuota",
      icon: Smartphone,
      badgeVariant: "cyan" as const,
      badgeText: "Progressive Web App",
      description: "YourChords dapat diinstall langsung ke layar HP atau PC Anda sebagai Progressive Web App (PWA). Seluruh lagu favorit dan setlist yang pernah dibuka tersimpan dalam cache lokal untuk dimainkan secara offline.",
      benefits: ["Install langsung tanpa PlayStore", "Penyimpanan cache offline otomatis", "Hemat kuota & loading ultra-cepat"]
    }
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col font-sans selection:bg-purple-500/30 selection:text-white">
      <main className="flex-1 pt-24 pb-16 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto w-full">
        {/* HERO BANNER SECTION */}
        <section className="relative rounded-3xl p-8 md:p-14 border border-purple-500/30 bg-slate-900/80 backdrop-blur-2xl overflow-hidden shadow-[0_0_60px_rgba(168,85,247,0.18)] mb-12 text-center">
          <div className="absolute -top-28 -left-28 w-80 h-80 bg-purple-600/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-28 -right-28 w-80 h-80 bg-cyan-600/20 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 max-w-3xl mx-auto flex flex-col items-center gap-4">
            <CyberBadge variant="purple" pulse icon={<Sparkles className="w-3.5 h-3.5 text-amber-400" />}>
              YOURCHORDS 2.0 TECH STACK
            </CyberBadge>

            <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white leading-tight">
              Fitur Unggulan <span className="bg-gradient-to-r from-purple-400 via-cyan-400 to-teal-300 bg-clip-text text-transparent">YourChords 2.0</span>
            </h1>

            <p className="text-slate-300 text-xs sm:text-base leading-relaxed max-w-2xl font-medium">
              Ekosistem musik terlengkap untuk latihan, manggung, dan mempelajari teori chord dengan performa tinggi dan desain Cyber-Zen mutakhir.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-4 mt-2">
              <Link href="/">
                <CyberButton variant="cyan" size="lg" rightIcon={<ArrowRight className="w-4 h-4" />}>
                  Coba Semua Fitur Sekarang
                </CyberButton>
              </Link>
            </div>
          </div>
        </section>

        {/* 6 BENTO GRID SHOWCASE */}
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
          {mainFeatures.map((feat) => {
            const Icon = feat.icon;

            return (
              <CyberCard
                key={feat.id}
                variant="glowing"
                padding="lg"
                onMouseEnter={() => setHoveredId(feat.id)}
                onMouseLeave={() => setHoveredId(null)}
                className="flex flex-col justify-between"
              >
                <div>
                  {/* Card Header: Icon + CyberBadge */}
                  <div className="flex items-center justify-between mb-5">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-600 to-cyan-600 p-0.5 shadow-lg group-hover:scale-110 transition-transform">
                      <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
                        <Icon className="w-6 h-6 text-cyan-300" />
                      </div>
                    </div>

                    <CyberBadge variant={feat.badgeVariant} size="sm">
                      {feat.badgeText}
                    </CyberBadge>
                  </div>

                  {/* Title & Subtitle */}
                  <h3 className="text-lg font-black text-white group-hover:text-cyan-300 transition-colors mb-1">
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
              </CyberCard>
            );
          })}
        </section>

        {/* BOTTOM CTA BANNER */}
        <section className="relative rounded-3xl p-8 sm:p-10 border border-purple-500/40 bg-gradient-to-r from-purple-950/60 via-slate-900/80 to-slate-950 backdrop-blur-2xl overflow-hidden shadow-2xl text-center flex flex-col items-center gap-4">
          <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="w-12 h-12 rounded-2xl bg-purple-500/20 border border-purple-500/40 text-purple-300 flex items-center justify-center mb-1 shadow-[0_0_20px_rgba(168,85,247,0.4)]">
            <Radio className="w-6 h-6 animate-pulse" />
          </div>

          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Siap Memainkan Lagu Favoritmu Hari Ini?
          </h2>

          <p className="text-xs sm:text-sm text-slate-300 max-w-xl leading-relaxed">
            Bergabunglah dengan ribuan musisi Indonesia. Cari chord lagu favorit, simpan setlist manggung, dan rasakan kemudahan latihan tanpa iklan mengganggu.
          </p>

          <Link href="/">
            <CyberButton variant="cyan" size="lg" leftIcon={<Music className="w-4 h-4" />}>
              Jelajahi Katalog Lagu
            </CyberButton>
          </Link>
        </section>
      </main>
    </div>
  );
}
