"use client";

import React, { useState } from "react";
import Link from "next/link";
import { 
  HelpCircle, Search, Sliders, Layers, FolderHeart, 
  UserCheck, Smartphone, ChevronDown, ChevronUp, Sparkles, 
  MessageSquare, ArrowRight, Music2, FileCode2
} from "lucide-react";
import { CyberInput } from "@/components/ui/CyberInput";
import { CyberButton } from "@/components/ui/CyberButton";
import { CyberCard } from "@/components/ui/CyberCard";
import { CyberBadge } from "@/components/ui/CyberBadge";

interface FAQItem {
  id: string;
  category: string;
  question: string;
  answer: React.ReactNode;
}

export default function HelpPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [expandedId, setExpandedId] = useState<string | null>("transposer-1");

  const categories = [
    { id: "all", label: "Semua Kategori", icon: HelpCircle },
    { id: "transposer", label: "Transposer & Capo", icon: Sliders },
    { id: "fretboard", label: "Variasi Chord", icon: Layers },
    { id: "dashboard", label: "Dashboard & Setlist", icon: FolderHeart },
    { id: "account", label: "Akun & Akses", icon: UserCheck },
    { id: "pwa", label: "PWA & Offline Mode", icon: Smartphone },
  ];

  const faqs: FAQItem[] = [
    // Requirement 1: Transpose
    {
      id: "transposer-1",
      category: "transposer",
      question: "Bagaimana cara mengubah nada dasar (transpose) lagu?",
      answer: (
        <div className="space-y-2 leading-relaxed">
          <p>
            Anda dapat menggunakan bilah kontrol <strong className="text-cyan-400">Real-time Transposer</strong> yang terletak di bagian atas atau samping halaman lirik lagu.
          </p>
          <ul className="list-disc list-inside space-y-1 text-slate-300">
            <li>Klik tombol <span className="text-white font-bold font-mono px-1.5 py-0.5 bg-white/10 rounded">+1</span> atau <span className="text-white font-bold font-mono px-1.5 py-0.5 bg-white/10 rounded">-1</span> untuk menaikkan/menurunkan nada dasar sebanyak setengah nada (semitone).</li>
            <li>Gunakan fitur <strong className="text-emerald-400">Capo Shift</strong> untuk menyesuaikan penjarian gitar tanpa mengubah kunci asli vokal.</li>
            <li>Tombol <strong className="text-amber-400">Reset</strong> akan mengembalikan chord ke kunci asli (Key of C / Original Key).</li>
          </ul>
        </div>
      ),
    },

    // Requirement 2: Setlist
    {
      id: "dashboard-1",
      category: "dashboard",
      question: "Bagaimana cara membuat folder setlist pribadi?",
      answer: (
        <div className="space-y-2 leading-relaxed">
          <p>
            Sebagai member terdaftar, Anda dapat mengelompokkan lagu-lagu pertunjukan (gig/latihan) dalam folder Setlist kustom:
          </p>
          <ol className="list-decimal list-inside space-y-1 text-slate-300">
            <li>Buka halaman lagu yang diinginkan, klik ikon <strong className="text-purple-400 font-semibold font-mono">"Simpan Favorit"</strong> atau <strong className="text-purple-400 font-semibold font-mono">"Tambah ke Setlist"</strong>.</li>
            <li>Kunjungi <Link href="/dashboard" className="text-cyan-400 underline font-bold">Dashboard Saya</Link> untuk membuat nama folder Setlist baru (misal: "Setlist Manggung Kafe Sabtu").</li>
            <li>Anda juga dapat menambahkan <strong className="text-amber-400">Catatan Pribadi (Personal Notes)</strong> pada setiap lagu untuk menyimpan petunjuk tempo, ritme strumming, atau posisi capo.</li>
          </ol>
        </div>
      ),
    },

    // Requirement 3: Request Song
    {
      id: "request-1",
      category: "account",
      question: "Apakah saya bisa mengajukan request lagu yang belum ada?",
      answer: (
        <div className="space-y-2 leading-relaxed">
          <p>
            Tentu saja! Jika lagu favorit Anda belum tersedia di direktori YourChords, Anda dapat mengajukannya langsung melalui halaman <Link href="/request" className="text-cyan-400 underline font-bold">Request Lagu Baru</Link>.
          </p>
          <p className="text-slate-300">
            Cukup isikan judul lagu dan nama penyanyi/band. Tim scraper AI dan administrator kami akan secara otomatis memproses antrean permintaan dan mempublikasikan kunci lagu tersebut secara akurat.
          </p>
        </div>
      ),
    },

    // Requirement 4: Report Typo
    {
      id: "typo-1",
      category: "account",
      question: "Bagaimana cara melaporkan kesalahan chord?",
      answer: (
        <div className="space-y-2 leading-relaxed">
          <p>
            Kami sangat mengapresiasi bantuan komunitas untuk menjaga tingkat akurasi kunci gitar! Jika Anda menemukan chord yang kurang pas atau lirik yang typo:
          </p>
          <ul className="list-disc list-inside space-y-1 text-slate-300">
            <li>Klik tombol <strong className="text-amber-400 font-mono">"Laporkan Typo"</strong> di bagian bawah halaman lagu terkait, atau kunjungi langsung halaman <Link href="/report-typo" className="text-amber-400 underline font-bold">Report Typo</Link>.</li>
            <li>Isi detail bagian lagu mana yang perlu diperbaiki (misal: "Reff chord ke-2 harusnya Am bukan A").</li>
            <li>Tim moderator kami akan memverifikasi dan memperbarui chord dalam hitungan jam.</li>
          </ul>
        </div>
      ),
    },

    // Additional helpful FAQ: Capo vs Transpose
    {
      id: "transposer-2",
      category: "transposer",
      question: "Apa bedanya Transpose biasa dengan Capo Shift?",
      answer: (
        <p className="leading-relaxed">
          <strong className="text-white">Transpose biasa</strong> mengubah seluruh notasi chord secara aktual (misal C berubah menjadi D). Sedangkan <strong className="text-cyan-400">Capo Shift</strong> memperhitungkan posisi penjepit Capo pada fret gitar tertentu, sehingga Anda bisa memainkan bentuk chord yang lebih simpel (seperti bentuk C/G) sementara suara instrumen terangkat sesuai tinggi nada yang diinginkan.
        </p>
      ),
    },

    // Additional helpful FAQ: Interactive Fretboard 3D
    {
      id: "fretboard-1",
      category: "fretboard",
      question: "Bagaimana cara melihat bentuk diagram jari dan variasi chord (< 1 of N >)?",
      answer: (
        <div className="space-y-2 leading-relaxed">
          <p>
            Di halaman lagu, Anda dapat menautkan kursor atau mengetuk (<span className="text-purple-400 font-bold">click / tap</span>) pada nama chord mana saja (seperti <span className="text-purple-400 font-mono font-bold">C</span>, <span className="text-purple-400 font-mono font-bold">Am7</span>, <span className="text-purple-400 font-mono font-bold font-mono">F#m</span>) untuk membuka <strong className="text-white">Modal Fretboard 3D</strong>.
          </p>
          <ul className="list-disc list-inside space-y-1 text-slate-300">
            <li>Modal akan menampilkan posisi senar, fret, dan penomoran jari (1=Telunjuk, 2=Tengah, 3=Manis, 4=Kelingking).</li>
            <li>Gunakan tombol panah navigator <strong className="text-purple-400 font-mono">&lt; 1 of N &gt;</strong> untuk berpindah antar variasi chord (misal variasi Open Position vs Barre Chord di fret tinggi).</li>
          </ul>
        </div>
      ),
    },

    // Additional helpful FAQ: PWA Offline Mode
    {
      id: "pwa-1",
      category: "pwa",
      question: "Bagaimana cara menginstall aplikasi YourChords di HP/PC untuk latihan offline?",
      answer: (
        <div className="space-y-2 leading-relaxed">
          <p>
            YourChords dibangun dengan teknologi <strong className="text-cyan-400">Progressive Web App (PWA)</strong> sehingga dapat diinstall langsung tanpa perlu mendownload dari PlayStore/AppStore:
          </p>
          <ul className="list-disc list-inside space-y-1 text-slate-300">
            <li><strong className="text-white">Android (Chrome):</strong> Ketuk menu titik tiga di kanan atas browser → pilih <strong className="text-cyan-400">"Tambahkan ke Layar Utama" / "Install App"</strong>.</li>
            <li><strong className="text-white">iOS (Safari):</strong> Ketuk tombol Share (ikon panah ke atas) → pilih <strong className="text-cyan-400">"Add to Home Screen"</strong>.</li>
            <li><strong className="text-white">Desktop (Chrome/Edge):</strong> Klik ikon laptop/download di sebelah kanan address bar browser.</li>
          </ul>
        </div>
      ),
    },
  ];

  const filteredFaqs = faqs.filter((faq) => {
    const matchesCategory = activeCategory === "all" || faq.category === activeCategory;
    const matchesQuery = 
      searchQuery.trim() === "" ||
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.id.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesQuery;
  });

  const toggleAccordion = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col font-sans selection:bg-purple-500/30 selection:text-white">
      <main className="flex-1 pt-24 pb-16 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto w-full">
        {/* HERO BANNER & SEARCH */}
        <section className="relative rounded-3xl p-8 md:p-12 border border-purple-500/30 bg-slate-900/80 backdrop-blur-2xl overflow-hidden shadow-[0_0_50px_rgba(168,85,247,0.15)] mb-10 text-center">
          <div className="absolute -top-24 -left-24 w-72 h-72 bg-purple-600/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -right-24 w-72 h-72 bg-cyan-600/20 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 max-w-2xl mx-auto flex flex-col items-center">
            <CyberBadge variant="purple" pulse icon={<Sparkles className="w-3.5 h-3.5" />}>
              YOURCHORDS SUPPORT CENTER
            </CyberBadge>

            <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-white mb-3 mt-4">
              Pusat Bantuan & <span className="bg-gradient-to-r from-purple-400 via-cyan-400 to-teal-300 bg-clip-text text-transparent">Panduan Musisi</span>
            </h1>

            <p className="text-slate-300 text-xs sm:text-sm leading-relaxed mb-6">
              Temukan jawaban cepat seputar fitur transposer, variasi chord, pembuatan setlist, dan tips penggunaan YourChords.
            </p>

            {/* SEARCH BAR CYBERINPUT */}
            <div className="w-full">
              <CyberInput
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari kata kunci bantuan (misal: Transpose, Capo, Setlist, Request, Typo)..."
                icon={<Search className="w-4 h-4 text-cyan-400" />}
              />
            </div>
          </div>
        </section>

        {/* CATEGORY BADGES */}
        <section className="flex items-center gap-2 overflow-x-auto pb-4 mb-8 no-scrollbar">
          {categories.map((cat) => {
            const Icon = cat.icon;
            const isActive = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                  isActive
                    ? "bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-[0_0_15px_rgba(168,85,247,0.4)] border border-purple-400/40"
                    : "bg-slate-900/60 border border-white/10 text-slate-400 hover:text-white hover:border-white/20"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{cat.label}</span>
              </button>
            );
          })}
        </section>

        {/* FAQ ACCORDION LIST */}
        <section className="space-y-4 mb-12">
          {filteredFaqs.length === 0 ? (
            <CyberCard variant="default" padding="lg" className="text-center text-slate-400">
              <HelpCircle className="w-10 h-10 text-slate-600 mx-auto mb-3 animate-bounce" />
              <p className="text-sm font-bold text-white mb-1">Pertanyaan tidak ditemukan</p>
              <p className="text-xs">Coba gunakan kata kunci lain atau pilih kategori Semua.</p>
            </CyberCard>
          ) : (
            filteredFaqs.map((faq) => {
              const isExpanded = expandedId === faq.id;
              return (
                <div
                  key={faq.id}
                  className={`rounded-2xl border transition-all duration-200 overflow-hidden ${
                    isExpanded
                      ? "bg-slate-900/90 border-purple-500/40 shadow-[0_0_20px_rgba(168,85,247,0.15)]"
                      : "bg-slate-900/50 border-white/10 hover:border-white/20"
                  }`}
                >
                  <button
                    onClick={() => toggleAccordion(faq.id)}
                    className="w-full p-5 sm:p-6 text-left flex items-center justify-between gap-4 cursor-pointer select-none"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${isExpanded ? "bg-purple-500/20 text-purple-300" : "bg-white/5 text-slate-400"}`}>
                        <HelpCircle className="w-4 h-4" />
                      </div>
                      <h3 className="text-sm sm:text-base font-bold text-white">
                        {faq.question}
                      </h3>
                    </div>
                    {isExpanded ? (
                      <ChevronUp className="w-5 h-5 text-purple-400 flex-shrink-0" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-slate-500 flex-shrink-0" />
                    )}
                  </button>

                  {isExpanded && (
                    <div className="px-5 pb-6 sm:px-6 text-xs sm:text-sm text-slate-300 border-t border-white/10 pt-4 animate-fade-in">
                      {faq.answer}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </section>

        {/* CONTACT SUPPORT CARDS WITH CYBERBUTTON */}
        <section className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <CyberCard variant="interactive" padding="lg" className="flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-300 flex items-center justify-center mb-3">
                <Music2 className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-white text-base mb-1">
                Ingin Menambahkan Lagu Baru?
              </h4>
              <p className="text-xs text-slate-400 leading-relaxed mb-4">
                Kirimkan request judul lagu & artis agar segera ditambahkan ke sistem oleh scraper AI kami.
              </p>
            </div>
            <Link href="/request" className="inline-block">
              <CyberButton variant="primary" size="md" rightIcon={<ArrowRight className="w-4 h-4" />}>
                Request Lagu Baru
              </CyberButton>
            </Link>
          </CyberCard>

          <CyberCard variant="interactive" padding="lg" className="flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 flex items-center justify-center mb-3">
                <MessageSquare className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-white text-base mb-1">
                Temukan Typo Chord atau Lirik?
              </h4>
              <p className="text-xs text-slate-400 leading-relaxed mb-4">
                Bantu tingkatkan akurasi lagu dengan melaporkan kesalahan penulisan chord atau lirik.
              </p>
            </div>
            <Link href="/report-typo" className="inline-block">
              <CyberButton variant="cyan" size="md" rightIcon={<ArrowRight className="w-4 h-4" />}>
                Laporkan Typo Chord
              </CyberButton>
            </Link>
          </CyberCard>
        </section>
      </main>
    </div>
  );
}
