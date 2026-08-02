"use client";

import React, { useState } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import { 
  HelpCircle, Search, Sliders, Layers, FolderHeart, 
  UserCheck, Smartphone, ChevronDown, ChevronUp, Sparkles, 
  MessageSquare, ArrowRight, CheckCircle2, Music2
} from "lucide-react";

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
    // Category 1: Transposer & Capo
    {
      id: "transposer-1",
      category: "transposer",
      question: "Bagaimana cara mengubah nada dasar (Transpose) lagu?",
      answer: (
        <div className="space-y-2 leading-relaxed">
          <p>
            Anda dapat menggunakan bilah kontrol <strong className="text-primary">Real-time Transposer</strong> yang terletak di bagian atas atau samping halaman lirik lagu.
          </p>
          <ul className="list-disc list-inside space-y-1 text-slate-300">
            <li>Klik tombol <span className="text-white font-bold font-mono px-1.5 py-0.5 bg-white/10 rounded">+1</span> atau <span className="text-white font-bold font-mono px-1.5 py-0.5 bg-white/10 rounded">-1</span> untuk menaikkan/menurunkan nada dasar sebanyak setengah nada (semitone).</li>
            <li>Gunakan fitur <strong className="text-emerald-400">Capo Shift</strong> untuk menyesuaikan penjarian gitar tanpa mengubah kunci asli vokal.</li>
            <li>Tombol <strong className="text-amber-400">Reset</strong> akan mengembalikan chord ke kunci asli (Key of C / Original Key).</li>
          </ul>
        </div>
      ),
    },
    {
      id: "transposer-2",
      category: "transposer",
      question: "Apa bedanya Transpose biasa dengan Capo Shift?",
      answer: (
        <p className="leading-relaxed">
          <strong className="text-white">Transpose biasa</strong> mengubah seluruh notasi chord secara aktual (misal C berubah menjadi D). Sedangkan <strong className="text-primary">Capo Shift</strong> memperhitungkan posisi penjepit Capo pada fret gitar tertentu, sehingga Anda bisa memainkan bentuk chord yang lebih simpel (seperti bentuk C/G) sementara suara instrumen terangkat sesuai tinggi nada yang diinginkan.
        </p>
      ),
    },

    // Category 2: Variasi Chord
    {
      id: "fretboard-1",
      category: "fretboard",
      question: "Bagaimana cara melihat bentuk diagram jari dan variasi chord (< 1 of N >)?",
      answer: (
        <div className="space-y-2 leading-relaxed">
          <p>
            Di halaman lagu, Anda dapat menautkan kursor atau mengetuk (<span className="text-primary font-bold">click / tap</span>) pada nama chord mana saja (seperti <span className="text-primary font-mono font-bold">C</span>, <span className="text-primary font-mono font-bold">Am7</span>, <span className="text-primary font-mono font-bold">F#m</span>) untuk membuka <strong className="text-white">Modal Fretboard 3D</strong>.
          </p>
          <ul className="list-disc list-inside space-y-1 text-slate-300">
            <li>Modal akan menampilkan posisi senar, fret, dan penomoran jari (1=Telunjuk, 2=Tengah, 3=Manis, 4=Kelingking).</li>
            <li>Gunakan tombol panah navigator <strong className="text-primary font-mono">&lt; 1 of N &gt;</strong> untuk berpindah antar variasi chord (misal variasi Open Position vs Barre Chord di fret tinggi).</li>
          </ul>
        </div>
      ),
    },

    // Category 3: Dashboard & Setlist
    {
      id: "dashboard-1",
      category: "dashboard",
      question: "Bagaimana cara membuat folder Setlist dan menambahkan catatan pribadi?",
      answer: (
        <div className="space-y-2 leading-relaxed">
          <p>
            Sebagai member terdaftar, Anda dapat mengelompokkan lagu-lagu pertunjukan (gig/latihan) dalam folder Setlist kustom:
          </p>
          <ol className="list-decimal list-inside space-y-1 text-slate-300">
            <li>Buka halaman lagu yang diinginkan, klik ikon <strong className="text-primary">"Tambah ke Setlist"</strong> atau <strong className="text-primary">"Simpan Favorit"</strong>.</li>
            <li>Kunjungi <Link href="/dashboard" className="text-primary underline font-bold">Dashboard Saya</Link> untuk membuat nama folder Setlist baru (misal: "Setlist Manggung Kafe Sabtu").</li>
            <li>Anda juga dapat menambahkan <strong className="text-amber-400">Catatan Pribadi (Personal Notes)</strong> pada setiap lagu untuk menyimpan petunjuk tempo, ritme strumming, atau capo.</li>
          </ol>
        </div>
      ),
    },

    // Category 4: Akun & Akses
    {
      id: "account-1",
      category: "account",
      question: "Apa keuntungan menjadi Member Musisi terdaftar vs Pengunjung Anonim?",
      answer: (
        <div className="space-y-2 leading-relaxed">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-1">
            <div className="p-3 bg-white/5 rounded-xl border border-white/10">
              <span className="text-xs font-bold text-slate-400 block mb-1">Pengunjung Anonim</span>
              <ul className="text-xs text-slate-400 space-y-1">
                <li>• Akses pencarian lagu gratis</li>
                <li>• Penggunaan Transposer & Fretboard</li>
                <li>• Tanpa penyimpanan permanen</li>
              </ul>
            </div>
            <div className="p-3 bg-primary/10 rounded-xl border border-primary/30">
              <span className="text-xs font-bold text-primary block mb-1">Member Terdaftar (Gratis)</span>
              <ul className="text-xs text-slate-200 space-y-1">
                <li>✓ Simpan Lagu Favorit tak terbatas</li>
                <li>✓ Buat folder Setlist pertunjukan</li>
                <li>✓ Catatan pribadi & sinkronisasi multi-device</li>
                <li>✓ Kirim Request Lagu & Laporan Typo</li>
              </ul>
            </div>
          </div>
        </div>
      ),
    },

    // Category 5: PWA & Offline Mode
    {
      id: "pwa-1",
      category: "pwa",
      question: "Bagaimana cara menginstall aplikasi YourChords di HP/PC untuk latihan offline?",
      answer: (
        <div className="space-y-2 leading-relaxed">
          <p>
            YourChords dibangun dengan teknologi <strong className="text-primary">Progressive Web App (PWA)</strong> sehingga dapat diinstall langsung tanpa perlu mendownload dari PlayStore/AppStore:
          </p>
          <ul className="list-disc list-inside space-y-1 text-slate-300">
            <li><strong className="text-white">Android (Chrome):</strong> Ketuk menu titik tiga di kanan atas browser → pilih <strong className="text-primary">"Tambahkan ke Layar Utama" / "Install App"</strong>.</li>
            <li><strong className="text-white">iOS (Safari):</strong> Ketuk tombol Share (ikon panah ke atas) → pilih <strong className="text-primary">"Add to Home Screen"</strong>.</li>
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
    <div className="min-h-screen bg-slate-950 text-white flex flex-col font-sans selection:bg-primary selection:text-white">
      <Navbar />

      <main className="flex-1 pt-24 pb-16 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto w-full">
        {/* HERO BANNER & SEARCH */}
        <section className="relative rounded-3xl p-8 md:p-12 border border-primary/30 bg-surface/80 backdrop-blur-2xl overflow-hidden shadow-[0_0_50px_rgba(168,85,247,0.15)] mb-10 text-center">
          <div className="absolute -top-24 -left-24 w-72 h-72 bg-primary/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -right-24 w-72 h-72 bg-violet-600/20 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 max-w-2xl mx-auto flex flex-col items-center">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary/10 border border-primary/30 text-primary-light text-xs font-mono font-bold mb-4 shadow-[0_0_15px_rgba(168,85,247,0.3)]">
              <Sparkles className="w-3.5 h-3.5 animate-pulse" />
              <span>YOURCHORDS SUPPORT CENTER</span>
            </div>

            <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-white mb-3">
              Pusat Bantuan & <span className="text-primary neon-text">Panduan Musisi</span>
            </h1>

            <p className="text-slate-300 text-xs sm:text-sm leading-relaxed mb-6">
              Temukan jawaban cepat seputar fitur transposer, variasi chord, pembuatan setlist, dan tips penggunaan YourChords.
            </p>

            {/* SEARCH BAR */}
            <div className="w-full relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-primary transition-colors" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari kata kunci bantuan (misal: Transpose, Capo, Setlist, PWA)..."
                className="w-full bg-black/80 border border-white/15 focus:border-primary/70 rounded-2xl py-3.5 pl-11 pr-4 text-white placeholder-slate-500 text-xs sm:text-sm font-sans focus:outline-none focus:shadow-[0_0_25px_rgba(168,85,247,0.3)] transition-all"
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
                    ? "bg-primary text-white shadow-[0_0_15px_rgba(168,85,247,0.4)] border border-primary-light"
                    : "bg-surface/60 border border-white/10 text-slate-400 hover:text-white hover:border-white/20"
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
            <div className="p-12 rounded-2xl bg-surface/50 border border-white/10 text-center text-slate-400">
              <HelpCircle className="w-10 h-10 text-slate-600 mx-auto mb-3 animate-bounce" />
              <p className="text-sm font-bold text-white mb-1">Pertanyaan tidak ditemukan</p>
              <p className="text-xs">Coba gunakan kata kunci lain atau pilih kategori Semua.</p>
            </div>
          ) : (
            filteredFaqs.map((faq) => {
              const isExpanded = expandedId === faq.id;
              return (
                <div
                  key={faq.id}
                  className={`rounded-2xl border transition-all duration-200 overflow-hidden ${
                    isExpanded
                      ? "bg-surface/90 border-primary/40 shadow-[0_0_20px_rgba(168,85,247,0.15)]"
                      : "bg-surface/50 border-white/10 hover:border-white/20"
                  }`}
                >
                  <button
                    onClick={() => toggleAccordion(faq.id)}
                    className="w-full p-5 sm:p-6 text-left flex items-center justify-between gap-4 cursor-pointer select-none"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${isExpanded ? "bg-primary/20 text-primary" : "bg-white/5 text-slate-400"}`}>
                        <HelpCircle className="w-4 h-4" />
                      </div>
                      <h3 className="text-sm sm:text-base font-bold text-white">
                        {faq.question}
                      </h3>
                    </div>
                    {isExpanded ? (
                      <ChevronUp className="w-5 h-5 text-primary flex-shrink-0" />
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

        {/* QUICK ACTION CARDS */}
        <section className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <Link
            href="/report-typo"
            className="p-6 rounded-2xl bg-surface/60 border border-white/10 hover:border-amber-500/50 backdrop-blur-xl transition-all group flex items-start justify-between"
          >
            <div>
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center mb-3">
                <MessageSquare className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-white text-sm mb-1 group-hover:text-amber-400 transition-colors">
                Temukan Typo Chord atau Lirik?
              </h4>
              <p className="text-xs text-slate-400">
                Bantu tingkatkan akurasi lagu dengan melaporkan kesalahan penulisan chord.
              </p>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-amber-400 group-hover:translate-x-1 transition-all flex-shrink-0 mt-1" />
          </Link>

          <Link
            href="/request"
            className="p-6 rounded-2xl bg-surface/60 border border-white/10 hover:border-primary/50 backdrop-blur-xl transition-all group flex items-start justify-between"
          >
            <div>
              <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/30 text-primary flex items-center justify-center mb-3">
                <Music2 className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-white text-sm mb-1 group-hover:text-primary-light transition-colors">
                Ingin Menambahkan Lagu Baru?
              </h4>
              <p className="text-xs text-slate-400">
                Kirimkan request judul lagu & artis agar segera ditambahkan ke sistem.
              </p>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-primary-light group-hover:translate-x-1 transition-all flex-shrink-0 mt-1" />
          </Link>
        </section>
      </main>
    </div>
  );
}
