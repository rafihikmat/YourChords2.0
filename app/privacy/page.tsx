import React from "react";
import Link from "next/link";
import { Shield, Lock, Eye, Database, UserCheck, ArrowLeft } from "lucide-react";
import { CyberBadge } from "@/components/ui/CyberBadge";
import { CyberCard } from "@/components/ui/CyberCard";

export const metadata = {
  title: "Kebijakan Privasi - YourChords",
  description: "Kebijakan privasi dan perlindungan data pengguna pada platform YourChords.",
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col font-sans selection:bg-purple-500/30 selection:text-white">
      <main className="flex-1 pt-24 pb-16 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto w-full">
        {/* HEADER */}
        <div className="mb-10 text-center sm:text-left">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-cyan-400 transition-colors mb-4 group"
          >
            <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
            <span>Kembali ke Beranda</span>
          </Link>

          <div className="flex flex-wrap items-center gap-3 justify-center sm:justify-start mb-3">
            <div className="p-2.5 bg-purple-500/10 border border-purple-500/30 rounded-xl text-purple-300 shadow-[0_0_15px_rgba(168,85,247,0.2)]">
              <Shield className="w-6 h-6" />
            </div>
            <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
              Kebijakan Privasi <span className="text-purple-400 font-mono text-sm block sm:inline font-normal">(Privacy Policy)</span>
            </h1>
          </div>

          <div className="mt-2">
            <CyberBadge variant="cyan" pulse icon={<Shield className="w-3 h-3" />}>
              Terakhir Diperbarui: 2026
            </CyberBadge>
          </div>
        </div>

        {/* LEGAL DOCUMENT CONTENT CARDS */}
        <div className="space-y-6">
          {/* SECTION 1 */}
          <CyberCard variant="default" padding="lg">
            <div className="flex items-center gap-3 mb-4 text-purple-400">
              <Database className="w-5 h-5 flex-shrink-0" />
              <h2 className="text-lg font-bold text-white">1. Pengumpulan Data Pengguna</h2>
            </div>
            <p className="text-slate-300 text-xs sm:text-sm leading-relaxed mb-3">
              YourChords mengumpulkan informasi dasar yang diperlukan untuk mengoperasikan platform dan memberikan pengalaman bermain musik yang terpersonalisasi:
            </p>
            <ul className="list-disc list-inside space-y-2 text-slate-300 text-xs sm:text-sm pl-2 leading-relaxed">
              <li><strong className="text-white">Informasi Akun Auth:</strong> Alamat email, nama tampilan (display name), dan foto profil (avatar) yang dikelola secara aman melalui layanan Supabase Authentication.</li>
              <li><strong className="text-white">Preferensi Musik:</strong> Daftar lagu favorit yang Anda simpan, kustomisasi setlist pertunjukan, serta catatan chords pribadi.</li>
              <li><strong className="text-white">Data Log Pencarian:</strong> Kata kunci pencarian lagu anonim untuk membantu tim kami menambahkan lagu-lagu yang paling banyak diminta pengguna.</li>
            </ul>
          </CyberCard>

          {/* SECTION 2 */}
          <CyberCard variant="default" padding="lg">
            <div className="flex items-center gap-3 mb-4 text-emerald-400">
              <Eye className="w-5 h-5 flex-shrink-0" />
              <h2 className="text-lg font-bold text-white">2. Penggunaan Data Informasi</h2>
            </div>
            <p className="text-slate-300 text-xs sm:text-sm leading-relaxed mb-3">
              Data yang kami kumpulkan digunakan strictly untuk tujuan fungsionalitas platform dan peningkatan kualitas layanan:
            </p>
            <ul className="list-disc list-inside space-y-2 text-slate-300 text-xs sm:text-sm pl-2 leading-relaxed">
              <li>Menyimpan dan mengsinkronisasikan setlist serta favorit Anda di seluruh perangkat.</li>
              <li>Memberikan rekomendasi lagu yang relevan berdasarkan preferensi bermain gitar Anda.</li>
              <li><strong className="text-emerald-400">Jaminan Privasi:</strong> Kami TIDAK PERNAH memperjualbelikan, menyewakan, atau membagikan data pribadi Anda kepada pihak ketiga atau pengiklan mana pun.</li>
            </ul>
          </CyberCard>

          {/* SECTION 3 */}
          <CyberCard variant="default" padding="lg">
            <div className="flex items-center gap-3 mb-4 text-cyan-400">
              <Lock className="w-5 h-5 flex-shrink-0" />
              <h2 className="text-lg font-bold text-white">3. Keamanan & Proteksi Informasi</h2>
            </div>
            <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
              Seluruh data tersimpan di infrastruktur basis data Supabase dengan proteksi tingkat tinggi. Kami menerapkan aturan <span className="text-purple-400 font-mono font-bold">Row Level Security (RLS)</span> sehingga data pribadi Anda hanya dapat diakses dan diubah oleh akun Anda sendiri. Transmisi data dari dan ke browser Anda dienkripsi menggunakan standar industri HTTPS / SSL.
            </p>
          </CyberCard>

          {/* SECTION 4 */}
          <CyberCard variant="default" padding="lg">
            <div className="flex items-center gap-3 mb-4 text-amber-400">
              <UserCheck className="w-5 h-5 flex-shrink-0" />
              <h2 className="text-lg font-bold text-white">4. Hak Pengguna & Pengelolaan Akun</h2>
            </div>
            <p className="text-slate-300 text-xs sm:text-sm leading-relaxed mb-3">
              Sebagai pengguna YourChords, Anda memiliki kontrol penuh atas data Anda:
            </p>
            <ul className="list-disc list-inside space-y-2 text-slate-300 text-xs sm:text-sm pl-2 leading-relaxed">
              <li>Anda dapat memperbarui informasi nama profil dan avatar kapan saja via halaman <Link href="/dashboard" className="text-cyan-400 underline font-semibold">Dashboard Saya</Link>.</li>
              <li>Anda berhak menghapus lagu favorit, setlist, atau mengajukan penghapusan akun beserta seluruh data terkait secara permanen.</li>
            </ul>
          </CyberCard>
        </div>
      </main>
    </div>
  );
}
