import React from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import { FileText, UserCheck, AlertTriangle, Copyright, RefreshCw, ArrowLeft } from "lucide-react";

export const metadata = {
  title: "Syarat & Ketentuan - YourChords",
  description: "Syarat dan ketentuan penggunaan platform YourChords.",
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col font-sans selection:bg-primary selection:text-white">
      <Navbar />

      <main className="flex-1 pt-24 pb-16 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto w-full">
        {/* HEADER */}
        <div className="mb-10 text-center sm:text-left">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-primary transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Kembali ke Beranda</span>
          </Link>

          <div className="flex items-center gap-3 justify-center sm:justify-start mb-3">
            <div className="p-2.5 bg-primary/10 border border-primary/30 rounded-xl text-primary shadow-[0_0_15px_rgba(168,85,247,0.2)]">
              <FileText className="w-6 h-6" />
            </div>
            <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
              Syarat & Ketentuan <span className="text-primary font-mono text-sm block sm:inline font-normal">(Terms & Conditions)</span>
            </h1>
          </div>

          <p className="text-slate-400 text-xs sm:text-sm">
            Terakhir diperbarui: 31 Juli 2026 • Ketentuan resmi penggunaan platform YourChords.
          </p>
        </div>

        {/* LEGAL DOCUMENT CONTENT CARDS */}
        <div className="space-y-6">
          {/* SECTION 1 */}
          <section className="p-6 sm:p-8 rounded-2xl bg-surface/70 border border-white/10 backdrop-blur-xl shadow-xl">
            <div className="flex items-center gap-3 mb-4 text-primary">
              <UserCheck className="w-5 h-5 flex-shrink-0" />
              <h2 className="text-lg font-bold text-white">1. Ketentuan Akun & Pendaftaran</h2>
            </div>
            <p className="text-slate-300 text-xs sm:text-sm leading-relaxed mb-3">
              Dengan membuat akun di YourChords, Anda menyetujui ketentuan berikut:
            </p>
            <ul className="list-disc list-inside space-y-2 text-slate-300 text-xs sm:text-sm pl-2">
              <li>Pengguna bertanggung jawab penuh atas keamanan kredensial kata sandi dan seluruh aktivitas yang terjadi di dalam akun mereka.</li>
              <li>Pengguna wajib memberikan informasi email yang valid saat pendaftaran untuk keperluan verifikasi akun dan pemulihan akses.</li>
            </ul>
          </section>

          {/* SECTION 2 */}
          <section className="p-6 sm:p-8 rounded-2xl bg-surface/70 border border-white/10 backdrop-blur-xl shadow-xl">
            <div className="flex items-center gap-3 mb-4 text-amber-400">
              <AlertTriangle className="w-5 h-5 flex-shrink-0" />
              <h2 className="text-lg font-bold text-white">2. Konten Komunitas & Etika Fitur</h2>
            </div>
            <p className="text-slate-300 text-xs sm:text-sm leading-relaxed mb-3">
              YourChords menyediakan fitur interaktif seperti pengiriman permintaan lagu, pemberian rating, dan catatan komunitas:
            </p>
            <ul className="list-disc list-inside space-y-2 text-slate-300 text-xs sm:text-sm pl-2">
              <li>Dilarang keras mengunggah atau mengirimkan materi yang berisikan ujaran kebencian, SARA, materi pornografi, spam, atau kata-kata kasar.</li>
              <li>Tim moderator YourChords berhak menghapus ulasan, catatan, atau memblokir akun yang melanggar aturan etika komunitas tanpa pemberitahuan sebelumnya.</li>
            </ul>
          </section>

          {/* SECTION 3 - COPYRIGHT STATEMENT */}
          <section className="p-6 sm:p-8 rounded-2xl bg-surface/70 border border-primary/30 backdrop-blur-xl shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-2xl pointer-events-none" />
            <div className="flex items-center gap-3 mb-4 text-primary">
              <Copyright className="w-5 h-5 flex-shrink-0" />
              <h2 className="text-lg font-bold text-white">3. Hak Cipta & Hak Kekayaan Intelektual (HKI)</h2>
            </div>
            <p className="text-slate-300 text-xs sm:text-sm leading-relaxed mb-3">
              Pernyataan resmi mengenai lisensi musik dan karya cipta:
            </p>
            <ul className="list-disc list-inside space-y-2 text-slate-300 text-xs sm:text-sm pl-2">
              <li><strong className="text-white">Hak Cipta Lagu:</strong> Seluruh lirik, komposisi lagu, dan nama pencipta adalah sepenuhnya milik sah dari musisi, pencipta lagu, dan pemegang lisensi resmi terkait.</li>
              <li><strong className="text-white">Tujuan Edukasi:</strong> YourChords hadir murni sebagai platform media pembelajaran, edukasi latihan musik, dan alat bantu transposisi kunci gitar bagi para musisi dan penggemar musik.</li>
              <li>Jika Anda adalah pemegang hak cipta dan merasa konten di platform ini perlu diperbarui atau dihapus, silakan hubungi tim pengelola kami.</li>
            </ul>
          </section>

          {/* SECTION 4 */}
          <section className="p-6 sm:p-8 rounded-2xl bg-surface/70 border border-white/10 backdrop-blur-xl shadow-xl">
            <div className="flex items-center gap-3 mb-4 text-emerald-400">
              <RefreshCw className="w-5 h-5 flex-shrink-0" />
              <h2 className="text-lg font-bold text-white">4. Perubahan & Perbaruan Layanan</h2>
            </div>
            <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
              Pengelola YourChords berhak memperbarui, mengubah, atau menambahkan fitur pada layanan kapan saja demi meningkatkan kualitas dan kenyamanan pengguna. Syarat & Ketentuan ini dapat diperbarui secara berkala dan perubahan akan berlaku segera setelah dipublikasikan pada halaman ini.
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}
