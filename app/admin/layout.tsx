import React from 'react';
import Link from 'next/link';
import { verifyAdminAccess } from '@/lib/authAdmin';
import { ShieldAlert, Disc3, Home, Sparkles, LayoutDashboard, Users } from 'lucide-react';
import AdminSignOutButton from '@/components/AdminSignOutButton';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Pengecekan ganda di tingkat Server Component menggunakan verifyAdminAccess()
  const access = await verifyAdminAccess();

  // Jika bukan admin / super_admin -> Tampilkan UI "Akses Ditolak (403 Unauthorized)" bergaya IDLIX
  if (!access.isAdmin) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-center text-white relative overflow-hidden">
        {/* Glowing Ambient Background */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-red-600/10 blur-[120px] rounded-full pointer-events-none" />

        <div className="relative z-10 max-w-md bg-surface/80 border border-red-500/30 rounded-2xl p-8 backdrop-blur-2xl shadow-[0_0_50px_rgba(239,68,68,0.25)] flex flex-col items-center">
          <div className="w-16 h-16 bg-red-500/20 border border-red-500/40 rounded-2xl flex items-center justify-center text-red-400 mb-6 shadow-[0_0_20px_rgba(239,68,68,0.4)] animate-bounce">
            <ShieldAlert className="w-8 h-8" />
          </div>

          <h1 className="text-3xl font-black text-white tracking-tight mb-2">
            403 - Akses Ditolak
          </h1>
          <p className="text-slate-400 text-sm mb-6 leading-relaxed">
            Maaf, Anda tidak memiliki hak akses Admin atau Super Admin untuk memasuki Pusat Komando ini.
          </p>

          <Link
            href="/"
            className="w-full py-3 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl text-sm transition-all shadow-[0_0_20px_rgba(239,68,68,0.5)] flex items-center justify-center gap-2 cursor-pointer"
          >
            <Home className="w-4 h-4" />
            Kembali ke Beranda
          </Link>
        </div>
      </div>
    );
  }

  // Jika terverifikasi sebagai admin / super_admin
  const roleBadge = access.isSuperAdmin ? 'SUPER_ADMIN' : 'ADMIN';

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Admin Header & Navigation Bar */}
      <header className="sticky top-0 z-50 bg-black/90 backdrop-blur-xl border-b border-white/10 px-4 md:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin" className="flex items-center gap-2.5 font-black text-white">
            <div className="w-8 h-8 bg-primary/20 rounded-lg flex items-center justify-center border border-primary/40 shadow-[0_0_15px_rgba(168,85,247,0.4)]">
              <Disc3 className="w-4 h-4 text-primary animate-spin-slow" />
            </div>
            <span className="text-base tracking-tight hidden sm:inline">
              YourChords <span className="text-primary">Admin</span>
            </span>
          </Link>

          {/* Role Badge */}
          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black tracking-widest uppercase border ${
            access.isSuperAdmin 
              ? 'bg-violet-500/20 text-violet-400 border-violet-500/40 shadow-[0_0_12px_rgba(139,92,246,0.3)]' 
              : 'bg-blue-500/20 text-blue-400 border-blue-500/40 shadow-[0_0_12px_rgba(59,130,246,0.3)]'
          }`}>
            ⚡ {roleBadge}
          </span>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 md:gap-3">
          <Link
            href="/admin"
            className="px-3 py-1.5 text-xs font-semibold text-slate-300 hover:text-white transition-colors flex items-center gap-1.5"
          >
            <LayoutDashboard className="w-3.5 h-3.5 text-primary" />
            <span className="hidden sm:inline">Dashboard</span>
          </Link>

          <Link
            href="/admin/curated"
            className="px-3 py-1.5 text-xs font-bold text-primary bg-primary/10 hover:bg-primary/20 border border-primary/30 rounded-lg transition-all flex items-center gap-1.5 shadow-[0_0_10px_rgba(168,85,247,0.2)]"
          >
            <Sparkles className="w-3.5 h-3.5 text-primary" />
            <span className="hidden sm:inline">Kurasi Beranda</span>
          </Link>

          <Link
            href="/admin/users"
            className="px-3 py-1.5 text-xs font-bold text-blue-400 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 rounded-lg transition-all flex items-center gap-1.5 shadow-[0_0_10px_rgba(59,130,246,0.2)]"
          >
            <Users className="w-3.5 h-3.5 text-blue-400" />
            <span className="hidden sm:inline">Kelola User</span>
          </Link>

          <div className="h-4 w-px bg-white/10 mx-0.5" />

          <Link
            href="/"
            className="px-3 py-1.5 text-xs font-semibold text-slate-400 hover:text-white transition-colors flex items-center gap-1.5"
          >
            <Home className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Web Utama</span>
          </Link>

          <AdminSignOutButton />
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1">
        {children}
      </main>
    </div>
  );
}

