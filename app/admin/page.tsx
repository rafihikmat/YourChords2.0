"use client";

import React, { useState, useEffect, useCallback } from "react";
import { 
  Music, Eye, AlertTriangle, Users, RefreshCw, Wand2, Search, 
  Sparkles, CheckCircle2, ExternalLink, Trash2, Edit3
} from "lucide-react";
import { useRouter } from "next/navigation";
import { supabase, normalizeSong } from "@/lib/supabase";
import { useAuth } from "@/lib/authContext";
import { getAdminOverviewStats, getTopMissingSongs, AdminOverviewStats, MissingSongItem } from "@/lib/adminAnalytics";
import BatchScraper from "@/components/BatchScraper";
import Link from "next/link";

export default function AdminDashboardPage() {
  const { user, profile } = useAuth();
  const router = useRouter();

  // Overview Stats & Analytics State
  const [stats, setStats] = useState<AdminOverviewStats>({
    totalSongs: 0,
    totalViews: 0,
    totalMissingRequests: 0,
    totalUsers: 0,
  });
  const [missingSongs, setMissingSongs] = useState<MissingSongItem[]>([]);
  const [loadingAnalytics, setLoadingAnalytics] = useState(true);

  // Scraper prefill URL state
  const [scraperUrl, setScraperUrl] = useState("");
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  // Database Songs State
  const [chords, setChords] = useState<any[]>([]);
  const [fetchingChords, setFetchingChords] = useState(true);
  const [songFilter, setSongFilter] = useState("");

  // Fetch Analytics & Overview Stats
  const loadAnalytics = useCallback(async () => {
    setLoadingAnalytics(true);
    try {
      const [overviewData, missingData] = await Promise.all([
        getAdminOverviewStats(),
        getTopMissingSongs(10),
      ]);
      setStats(overviewData);
      setMissingSongs(missingData);
    } catch (err) {
      console.error("[LOAD ANALYTICS ERROR]:", err);
    } finally {
      setLoadingAnalytics(false);
    }
  }, []);

  // Fetch Database Songs Collection
  const loadChords = useCallback(async () => {
    setFetchingChords(true);
    try {
      // 1. Try fetching 'songs'
      const { data: songsData, error: songsErr } = await supabase
        .from('songs')
        .select('*')
        .order('created_at', { ascending: false });

      if (!songsErr && songsData && songsData.length > 0) {
        setChords(songsData.map(normalizeSong));
      } else {
        // 2. Try fetching 'chords'
        const { data: chordsData, error: chordsErr } = await supabase
          .from('chords')
          .select('*')
          .order('created_at', { ascending: false });

        if (!chordsErr && chordsData && chordsData.length > 0) {
          setChords(chordsData.map(normalizeSong));
        } else {
          const { INITIAL_FALLBACK_CHORDS } = await import("@/lib/fallbackData");
          setChords(INITIAL_FALLBACK_CHORDS);
        }
      }
    } catch {
      const { INITIAL_FALLBACK_CHORDS } = await import("@/lib/fallbackData");
      setChords(INITIAL_FALLBACK_CHORDS);
    } finally {
      setFetchingChords(false);
    }
  }, []);

  useEffect(() => {
    loadAnalytics();
    loadChords();
  }, [loadAnalytics, loadChords]);

  // Quick Action: Scrape Missing Song
  const handleQuickScrapeMissing = (query: string) => {
    // Generate Chordtela Search URL
    const searchUrl = `https://www.chordtela.com/search?q=${encodeURIComponent(query)}`;
    setScraperUrl(searchUrl);

    // Scroll to Scraper Section
    const element = document.getElementById("scraper-section");
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  // Handle Song Deletion
  const handleDelete = async (id: string, title: string) => {
    const confirmAsk = window.confirm(`Hapus "${title}" dari database secara permanen?`);
    if (!confirmAsk) return;

    await supabase.from('songs').delete().eq('id', id);
    await supabase.from('chords').delete().eq('id', id);

    setChords(prev => prev.filter(c => c.id !== id));
    setMessage({ text: `"${title}" berhasil dihapus.`, type: "success" });
    loadAnalytics();
    router.refresh();
  };

  const filteredChords = songFilter
    ? chords.filter(c => 
        c.title?.toLowerCase().includes(songFilter.toLowerCase()) || 
        c.artist?.toLowerCase().includes(songFilter.toLowerCase())
      )
    : chords;

  const adminName = profile?.full_name || user?.email?.split('@')[0] || "Admin";

  return (
    <div className="flex flex-col gap-8 max-w-6xl mx-auto py-8 px-4 md:px-8 animate-fade-in pb-32 min-h-screen bg-black text-slate-100">
      
      {/* HEADER SECTION: GREETING & STATUS */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-surface/70 p-6 md:p-8 rounded-2xl border border-white/10 backdrop-blur-xl shadow-2xl">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="flex h-2.5 w-2.5 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            <span className="text-xs font-mono font-bold text-emerald-400 tracking-wider uppercase">
              Sistem Live & Operational
            </span>
          </div>

          <h1 className="text-2xl md:text-4xl font-black text-white tracking-tight flex items-center gap-3">
            Selamat Datang, <span className="text-primary neon-text">{adminName}</span>
          </h1>
          <p className="text-slate-400 text-xs md:text-sm mt-1">
            Pusat Komando & Smart Analytics Platform YourChords Cyber-Zen
          </p>
        </div>

        <button
          onClick={() => {
            loadAnalytics();
            loadChords();
          }}
          disabled={loadingAnalytics}
          className="px-4 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 text-primary ${loadingAnalytics ? "animate-spin" : ""}`} />
          <span>Refresh Analytics</span>
        </button>
      </div>

      {/* SECTION 1: OVERVIEW METRIC CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        
        {/* Metric 1: Total Songs */}
        <div className="bg-surface/80 border border-white/10 rounded-2xl p-5 backdrop-blur-md shadow-lg flex items-center gap-4 hover:border-primary/40 transition-all group">
          <div className="w-12 h-12 bg-primary/10 border border-primary/30 rounded-xl flex items-center justify-center text-primary group-hover:scale-110 transition-transform shadow-[0_0_15px_rgba(168,85,247,0.2)]">
            <Music className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Koleksi Lagu</p>
            <h3 className="text-2xl font-black text-white font-mono mt-0.5">
              {loadingAnalytics ? "..." : stats.totalSongs.toLocaleString("id-ID")}
            </h3>
            <p className="text-[10px] text-slate-500 mt-0.5">Terdaftar di database</p>
          </div>
        </div>

        {/* Metric 2: Total Pageviews */}
        <div className="bg-surface/80 border border-white/10 rounded-2xl p-5 backdrop-blur-md shadow-lg flex items-center gap-4 hover:border-blue-500/40 transition-all group">
          <div className="w-12 h-12 bg-blue-500/10 border border-blue-500/30 rounded-xl flex items-center justify-center text-blue-400 group-hover:scale-110 transition-transform shadow-[0_0_15px_rgba(59,130,246,0.2)]">
            <Eye className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total View Lagu</p>
            <h3 className="text-2xl font-black text-white font-mono mt-0.5">
              {loadingAnalytics ? "..." : stats.totalViews.toLocaleString("id-ID")}
            </h3>
            <p className="text-[10px] text-slate-500 mt-0.5">Aktivitas pembaca chord</p>
          </div>
        </div>

        {/* Metric 3: Missing Songs Requests */}
        <div className="bg-surface/80 border border-amber-500/30 rounded-2xl p-5 backdrop-blur-md shadow-lg flex items-center gap-4 hover:border-amber-500/50 transition-all group">
          <div className="w-12 h-12 bg-amber-500/10 border border-amber-500/30 rounded-xl flex items-center justify-center text-amber-400 group-hover:scale-110 transition-transform shadow-[0_0_15px_rgba(245,158,11,0.2)]">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-amber-400 uppercase tracking-wider">Permintaan Lagu Kosong</p>
            <h3 className="text-2xl font-black text-white font-mono mt-0.5">
              {loadingAnalytics ? "..." : stats.totalMissingRequests.toLocaleString("id-ID")}
            </h3>
            <p className="text-[10px] text-slate-500 mt-0.5">Pencarian tanpa hasil</p>
          </div>
        </div>

        {/* Metric 4: Total Registered Users */}
        <div className="bg-surface/80 border border-white/10 rounded-2xl p-5 backdrop-blur-md shadow-lg flex items-center gap-4 hover:border-violet-500/40 transition-all group">
          <div className="w-12 h-12 bg-violet-500/10 border border-violet-500/30 rounded-xl flex items-center justify-center text-violet-400 group-hover:scale-110 transition-transform shadow-[0_0_15px_rgba(139,92,246,0.2)]">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Pengguna Terdaftar</p>
            <h3 className="text-2xl font-black text-white font-mono mt-0.5">
              {loadingAnalytics ? "..." : stats.totalUsers.toLocaleString("id-ID")}
            </h3>
            <p className="text-[10px] text-slate-500 mt-0.5">Akun di Supabase Auth</p>
          </div>
        </div>

      </div>

      {/* SECTION 2: SMART INSIGHT — MISSING SONGS LOG TABLE */}
      <div className="bg-surface/80 rounded-2xl border border-amber-500/30 overflow-hidden backdrop-blur-xl shadow-2xl">
        <div className="p-5 md:p-6 border-b border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-amber-500/5">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-500/20 text-amber-400 rounded-xl border border-amber-500/30">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-white flex items-center gap-2">
                Smart Insight: Lagu Paling Dicari Pengguna (Missing Songs)
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Daftar kata kunci pencarian yang belum ada di database. Klik tombol untuk langsung scrape!
              </p>
            </div>
          </div>
          <span className="text-xs font-mono font-bold bg-amber-500/20 text-amber-400 border border-amber-500/40 px-3 py-1 rounded-lg self-start sm:self-auto">
            {missingSongs.length} Kata Kunci
          </span>
        </div>

        <div className="overflow-x-auto">
          {loadingAnalytics ? (
            <div className="p-8 text-center text-slate-500 animate-pulse text-xs">Memuat data smart insights...</div>
          ) : missingSongs.length === 0 ? (
            <div className="p-8 text-center text-slate-500 text-xs">
              Belum ada pencarian lagu yang hilang tercatat. Sistem akan mencatat otomatis ketika pengguna melakukan pencarian tanpa hasil!
            </div>
          ) : (
            <table className="w-full text-left text-xs">
              <thead className="bg-black/60 text-[10px] uppercase font-bold tracking-wider text-slate-400 border-b border-white/10">
                <tr>
                  <th className="px-5 py-3">Kata Kunci Pencarian</th>
                  <th className="px-5 py-3 text-center">Permintaan User</th>
                  <th className="px-5 py-3">Terakhir Dicari</th>
                  <th className="px-5 py-3 text-center">Tindakan Admin</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {missingSongs.map((item, idx) => (
                  <tr key={item.id || idx} className="hover:bg-amber-500/5 transition-colors group">
                    <td className="px-5 py-3.5 font-bold text-white capitalize flex items-center gap-2">
                      <span className="text-[10px] font-mono text-slate-500 w-5">#{idx + 1}</span>
                      <span className="group-hover:text-amber-400 transition-colors">{item.query}</span>
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      <span className="px-2.5 py-1 bg-amber-500/20 text-amber-300 font-mono font-black border border-amber-500/40 rounded-md text-[11px] shadow-[0_0_10px_rgba(245,158,11,0.2)]">
                        {item.count}x dicari
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-slate-400 font-mono text-[11px]">
                      {item.last_searched_at ? new Date(item.last_searched_at).toLocaleString("id-ID") : "-"}
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      <button
                        onClick={() => handleQuickScrapeMissing(item.query)}
                        className="px-3 py-1.5 bg-primary/20 hover:bg-primary text-primary hover:text-white border border-primary/40 rounded-lg font-bold transition-all flex items-center gap-1.5 mx-auto cursor-pointer shadow-neon-sm"
                      >
                        <Wand2 className="w-3.5 h-3.5" />
                        <span>Cari & Scrape Lagu Ini</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* SECTION 3: ADVANCED BATCH & MASS SCRAPER COMPONENT */}
      <div id="scraper-section" className="flex flex-col gap-6">
        
        {/* Feedback Message */}
        {message && (
          <div className={`p-4 rounded-xl border text-xs font-bold flex items-center gap-2 ${
            message.type === 'success' 
              ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.2)]' 
              : 'bg-red-500/15 border-red-500/40 text-red-400 shadow-[0_0_20px_rgba(239,68,68,0.2)]'
          }`}>
            {message.type === 'success' ? <CheckCircle2 className="w-4 h-4 flex-shrink-0" /> : <AlertTriangle className="w-4 h-4 flex-shrink-0" />}
            <span>{message.text}</span>
          </div>
        )}

        {/* BATCH SCRAPER COMPONENT */}
        <BatchScraper 
          initialUrl={scraperUrl} 
          onComplete={() => {
            loadChords();
            loadAnalytics();
            router.refresh();
          }} 
        />

        {/* DATABASE SONGS COLLECTION TABLE */}
        <div className="bg-surface/80 rounded-2xl border border-white/10 overflow-hidden backdrop-blur-xl shadow-2xl">
          <div className="p-5 border-b border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Music className="w-4 h-4 text-primary" />
              <h2 className="text-sm font-bold text-white tracking-wide">
                Koleksi Database Songs 
              </h2>
              <span className="text-[10px] bg-primary/20 text-primary px-2.5 py-0.5 rounded-md border border-primary/30 font-mono font-bold">
                {chords.length} Lagu
              </span>
            </div>

            {/* Filter Search */}
            <div className="relative max-w-xs w-full">
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Filter koleksi lagu..."
                value={songFilter}
                onChange={(e) => setSongFilter(e.target.value)}
                className="w-full bg-black/60 border border-white/10 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-primary/50"
              />
            </div>
          </div>
          
          <div className="overflow-x-auto">
            {fetchingChords ? (
              <div className="p-12 text-center text-slate-500 animate-pulse text-xs">Memuat data dari database...</div>
            ) : filteredChords.length === 0 ? (
              <div className="p-12 text-center text-slate-500 text-xs">Tidak ada data lagu yang cocok.</div>
            ) : (
              <table className="w-full text-left text-xs">
                <thead className="bg-black/60 text-[10px] uppercase font-bold tracking-wider text-slate-500 border-b border-white/10">
                  <tr>
                    <th className="px-5 py-3.5">Lagu & Artis</th>
                    <th className="px-5 py-3.5">Tanggal Dibuat</th>
                    <th className="px-5 py-3.5 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {filteredChords.map((entry) => (
                    <tr key={entry.id} className="hover:bg-white/[0.03] transition-colors group">
                      <td className="px-5 py-3.5">
                        <div className="font-semibold text-white text-xs group-hover:text-primary transition-colors">{entry.title}</div>
                        <div className="text-slate-400 text-[11px] mt-0.5 flex items-center gap-2">
                          <span>{entry.artist}</span>
                          <span className="text-[9px] bg-white/5 border border-white/10 px-1.5 py-0.5 rounded text-slate-400 font-mono">
                            👁️ {entry.views || entry.view_count || 0} views
                          </span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 whitespace-nowrap text-slate-400 text-[11px] font-mono">
                        {entry.created_at ? new Date(entry.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric'}) : '-'}
                      </td>
                      <td className="px-5 py-3.5 flex items-center justify-center gap-2">
                        <Link 
                          href={`/chord/${entry.id}`} 
                          target="_blank" 
                          className="p-1.5 bg-white/5 hover:bg-primary/20 text-slate-400 hover:text-primary rounded-lg transition-colors cursor-pointer" 
                          title="Buka Detail"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </Link>
                        <Link 
                          href={`/admin/edit/${entry.id}`} 
                          className="p-1.5 bg-primary/10 hover:bg-primary/30 text-primary border border-primary/20 rounded-lg transition-colors cursor-pointer flex items-center gap-1 font-bold text-[10px]" 
                          title="Edit / Rapikan Lagu"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">Edit</span>
                        </Link>
                        <button 
                          onClick={() => handleDelete(entry.id, entry.title)} 
                          className="p-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg transition-colors cursor-pointer" 
                          title="Hapus"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

      </div>

    </div>
  );
}
