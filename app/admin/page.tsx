"use client";

import React, { useState, useEffect, useCallback } from "react";
import { 
  Music, Eye, AlertTriangle, Users, RefreshCw, Search, 
  CheckCircle2, ExternalLink, Trash2, Edit3, Clock, FileText,
  Save, Globe, Sparkles, Megaphone, Sliders
} from "lucide-react";
import { useRouter } from "next/navigation";
import { supabase, normalizeSong } from "@/lib/supabase";
import { useAuth } from "@/lib/authContext";
import { getAdminOverviewStats, getTopMissingSongs, AdminOverviewStats, MissingSongItem } from "@/lib/adminAnalytics";
import { getSiteCMSContent, updateSiteCMSContent, SiteCMSContent, DEFAULT_CMS_CONTENT } from "@/lib/adminCMS";
import BatchScraper from "@/components/BatchScraper";
import MissingSongsPanel from "@/components/MissingSongsPanel";
import RatingsModerationPanel from "@/components/RatingsModerationPanel";
import CorrectionsPanel from "@/components/CorrectionsPanel";
import Link from "next/link";

export default function AdminDashboardPage() {
  const { user, profile } = useAuth();
  const router = useRouter();

  // Tab State
  const [activeTab, setActiveTab] = useState<"overview" | "cms">("overview");

  // Overview Stats & Analytics State
  const [stats, setStats] = useState<AdminOverviewStats>({
    totalSongs: 0,
    totalViews: 0,
    totalMissingRequests: 0,
    totalUsers: 0,
  });
  const [missingSongs, setMissingSongs] = useState<MissingSongItem[]>([]);
  const [loadingAnalytics, setLoadingAnalytics] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<string>("");

  // CMS State
  const [cmsContent, setCmsContent] = useState<SiteCMSContent>(DEFAULT_CMS_CONTENT);
  const [loadingCms, setLoadingCms] = useState(false);
  const [savingCms, setSavingCms] = useState(false);

  // Scraper prefill URL state
  const [scraperUrl, setScraperUrl] = useState("");
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  // Database Songs State
  const [chords, setChords] = useState<any[]>([]);
  const [fetchingChords, setFetchingChords] = useState(true);
  const [songFilter, setSongFilter] = useState("");

  // Fetch CMS Content
  const loadCMS = useCallback(async () => {
    setLoadingCms(true);
    try {
      const data = await getSiteCMSContent();
      setCmsContent(data);
    } catch (err) {
      console.error("[LOAD CMS ERROR]:", err);
    } finally {
      setLoadingCms(false);
    }
  }, []);

  // Fetch Analytics & Overview Stats Real-time
  const loadAnalytics = useCallback(async () => {
    setLoadingAnalytics(true);
    try {
      const [overviewData, missingData] = await Promise.all([
        getAdminOverviewStats(),
        getTopMissingSongs(15),
      ]);
      setStats(overviewData);
      setMissingSongs(missingData);
      setLastUpdated(new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", second: "2-digit" }));
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
        .select('*, albums(cover_url)')
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
    loadCMS();
  }, [loadAnalytics, loadChords, loadCMS]);

  // Quick Action: Scrape Missing Song
  const handleQuickScrapeMissing = (query: string) => {
    const searchUrl = `https://www.chordtela.com/search?q=${encodeURIComponent(query)}`;
    setScraperUrl(searchUrl);

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
    setMessage({ text: `"${title}" berhasil dihapus dari database.`, type: "success" });
    loadAnalytics();
    router.refresh();
  };

  // Save CMS Content
  const handleSaveCMS = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingCms(true);
    try {
      const res = await updateSiteCMSContent(cmsContent);
      if (res.success) {
        setMessage({
          text: "✨ Perubahan Konten CMS Berhasil Disimpan & Aktif Real-Time!",
          type: "success"
        });
      } else {
        setMessage({
          text: `❌ ${res.error || "Gagal menyimpan CMS."}`,
          type: "error"
        });
      }
    } catch (err: any) {
      setMessage({
        text: `❌ ${err?.message || "Terjadi kesalahan saat menyimpan CMS."}`,
        type: "error"
      });
    } finally {
      setSavingCms(false);
    }
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
          <div className="flex items-center gap-3 mb-2">
            <span className="flex h-2.5 w-2.5 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            <span className="text-xs font-mono font-bold text-emerald-400 tracking-wider uppercase">
              Sistem Live & Real-Time Operational
            </span>
            {lastUpdated && (
              <span className="text-[10px] font-mono text-slate-400 flex items-center gap-1 bg-white/5 px-2 py-0.5 rounded border border-white/10">
                <Clock className="w-3 h-3 text-slate-400" />
                Diperbarui: {lastUpdated}
              </span>
            )}
          </div>

          <h1 className="text-2xl md:text-4xl font-black text-white tracking-tight flex items-center gap-3">
            Selamat Datang, <span className="text-primary neon-text">{adminName}</span>
          </h1>
          <p className="text-slate-400 text-xs md:text-sm mt-1">
            Pusat Komando & Dynamic Analytics Engine Platform YourChords Cyber-Zen
          </p>
        </div>

        <button
          onClick={() => {
            loadAnalytics();
            loadChords();
            loadCMS();
          }}
          disabled={loadingAnalytics || loadingCms}
          className="px-4 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 text-primary ${loadingAnalytics || loadingCms ? "animate-spin" : ""}`} />
          <span>Refresh Analytics & CMS</span>
        </button>
      </div>

      {/* NAVIGATION TABS */}
      <div className="flex items-center gap-3 border-b border-white/10 pb-4">
        <button
          onClick={() => setActiveTab("overview")}
          className={`px-5 py-2.5 rounded-xl text-xs font-bold font-mono transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === "overview"
              ? "bg-primary text-white shadow-[0_0_20px_rgba(168,85,247,0.5)] border border-primary-light scale-105"
              : "bg-surface/80 text-slate-400 border border-white/10 hover:text-white hover:bg-white/10"
          }`}
        >
          <Music className="w-4 h-4" />
          <span>📊 Overview & Koleksi Database</span>
        </button>

        <button
          onClick={() => setActiveTab("cms")}
          className={`px-5 py-2.5 rounded-xl text-xs font-bold font-mono transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === "cms"
              ? "bg-amber-500 text-slate-950 font-black shadow-[0_0_20px_rgba(245,158,11,0.5)] border border-amber-300 scale-105"
              : "bg-surface/80 text-slate-400 border border-white/10 hover:text-white hover:bg-white/10"
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>📝 Edit Konten Website (CMS)</span>
        </button>
      </div>

      {/* GLOBAL FEEDBACK TOAST MESSAGE */}
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

      {/* TAB CONTENT 1: CMS EDITOR */}
      {activeTab === "cms" ? (
        <form onSubmit={handleSaveCMS} className="bg-surface/80 border border-amber-500/30 rounded-3xl p-6 sm:p-8 backdrop-blur-2xl shadow-[0_0_40px_rgba(245,158,11,0.15)] flex flex-col gap-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-[10px] font-mono font-bold uppercase tracking-wider mb-2">
                <Sparkles className="w-3 h-3 text-amber-400" />
                <span>Supabase Dynamic CMS Editor</span>
              </div>
              <h2 className="text-xl font-black text-white tracking-tight flex items-center gap-2">
                <Globe className="w-5 h-5 text-amber-400" />
                <span>Pengaturan Konten Teks Website Real-Time</span>
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Ubah teks utama beranda, pengumuman, slogan footer, dan tentang tanpa perlu mendeploy ulang kode.
              </p>
            </div>

            <button
              type="submit"
              disabled={savingCms}
              className="px-6 py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black rounded-xl shadow-[0_0_25px_rgba(245,158,11,0.4)] transition-all flex items-center gap-2 text-xs uppercase tracking-wider cursor-pointer disabled:opacity-50"
            >
              <Save className={`w-4 h-4 ${savingCms ? "animate-spin" : ""}`} />
              <span>{savingCms ? "Menyimpan..." : "💾 Simpan Perubahan CMS"}</span>
            </button>
          </div>

          {/* Input 1: Hero Banner Title */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-primary" />
                1. Hero Banner Title (Teks Utama Beranda)
              </span>
              <span className="text-[10px] text-slate-500 font-mono">heroTitle</span>
            </label>
            <input
              type="text"
              value={cmsContent.heroTitle || ""}
              onChange={(e) => setCmsContent({ ...cmsContent, heroTitle: e.target.value })}
              placeholder="Belajar & Mainkan Chord Lagu Favoritmu Tanpa Batas"
              className="w-full bg-black/80 border border-white/15 focus:border-amber-400 rounded-xl px-4 py-3 text-sm text-white font-medium focus:outline-none focus:shadow-[0_0_20px_rgba(245,158,11,0.2)] transition-all"
              required
            />
          </div>

          {/* Input 2: Hero Banner Subtitle */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Sliders className="w-3.5 h-3.5 text-blue-400" />
                2. Hero Banner Subtitle (Sub-Teks Beranda)
              </span>
              <span className="text-[10px] text-slate-500 font-mono">heroSubtitle</span>
            </label>
            <textarea
              rows={2}
              value={cmsContent.heroSubtitle || ""}
              onChange={(e) => setCmsContent({ ...cmsContent, heroSubtitle: e.target.value })}
              placeholder="Platform musik AI-Powered terdepan untuk musisi Indonesia."
              className="w-full bg-black/80 border border-white/15 focus:border-amber-400 rounded-xl px-4 py-3 text-sm text-white font-medium focus:outline-none focus:shadow-[0_0_20px_rgba(245,158,11,0.2)] transition-all"
              required
            />
          </div>

          {/* Input 3: Footer Slogan */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center justify-between">
              <span className="flex items-center gap-2">
                <FileText className="w-3.5 h-3.5 text-emerald-400" />
                3. Footer Slogan (Deskripsi Singkat di Footer)
              </span>
              <span className="text-[10px] text-slate-500 font-mono">footerSlogan</span>
            </label>
            <textarea
              rows={2}
              value={cmsContent.footerSlogan || ""}
              onChange={(e) => setCmsContent({ ...cmsContent, footerSlogan: e.target.value })}
              placeholder="Belajar, latih, dan mainkan ribuan chord & lirik lagu favoritmu secara real-time."
              className="w-full bg-black/80 border border-white/15 focus:border-amber-400 rounded-xl px-4 py-3 text-sm text-white font-medium focus:outline-none focus:shadow-[0_0_20px_rgba(245,158,11,0.2)] transition-all"
              required
            />
          </div>

          {/* Input 4: Running Announcement Bar */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Megaphone className="w-3.5 h-3.5 text-amber-400" />
                4. Running Announcement Bar (Teks Pengumuman Atas Beranda)
              </span>
              <span className="text-[10px] text-slate-500 font-mono">announcementText</span>
            </label>
            <input
              type="text"
              value={cmsContent.announcementText || ""}
              onChange={(e) => setCmsContent({ ...cmsContent, announcementText: e.target.value })}
              placeholder="🔥 Nikmati fitur Smart Transposer & Interactive Fretboard 3D terbaru!"
              className="w-full bg-black/80 border border-white/15 focus:border-amber-400 rounded-xl px-4 py-3 text-sm text-white font-medium focus:outline-none focus:shadow-[0_0_20px_rgba(245,158,11,0.2)] transition-all"
            />
          </div>

          {/* Input 5: Deskripsi Tentang Website */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Globe className="w-3.5 h-3.5 text-violet-400" />
                5. Deskripsi Tentang Platform (Halaman About)
              </span>
              <span className="text-[10px] text-slate-500 font-mono">aboutDescription</span>
            </label>
            <textarea
              rows={3}
              value={cmsContent.aboutDescription || ""}
              onChange={(e) => setCmsContent({ ...cmsContent, aboutDescription: e.target.value })}
              placeholder="YourChords 2.0 adalah platform edukasi dan latihan musik terlengkap di Indonesia."
              className="w-full bg-black/80 border border-white/15 focus:border-amber-400 rounded-xl px-4 py-3 text-sm text-white font-medium focus:outline-none focus:shadow-[0_0_20px_rgba(245,158,11,0.2)] transition-all"
            />
          </div>

          <div className="pt-4 border-t border-white/10 flex justify-end">
            <button
              type="submit"
              disabled={savingCms}
              className="px-8 py-3.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black rounded-xl shadow-[0_0_30px_rgba(245,158,11,0.5)] transition-all flex items-center gap-2 text-xs uppercase tracking-wider cursor-pointer disabled:opacity-50"
            >
              <Save className={`w-4 h-4 ${savingCms ? "animate-spin" : ""}`} />
              <span>{savingCms ? "Menyimpan Perubahan..." : "💾 Simpan Perubahan CMS"}</span>
            </button>
          </div>
        </form>
      ) : (
        <>
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

          {/* SECTION 2: SMART INSIGHT — MISSING SONGS LOG BOARD */}
          <MissingSongsPanel
            missingSongs={missingSongs}
            loading={loadingAnalytics}
            onQuickScrape={handleQuickScrapeMissing}
            onRefresh={loadAnalytics}
          />

          {/* SECTION 3: MODERASI RATING & KESULITAN KOMUNITAS PANEL */}
          <RatingsModerationPanel onRatingsReset={loadAnalytics} />

          {/* SECTION 4: MODERASI PERBAIKAN CHORD & LIRIK (USULAN KOMUNITAS) */}
          <CorrectionsPanel onApproved={loadChords} />

          {/* SECTION 5: ADVANCED BATCH & MASS SCRAPER COMPONENT */}
          <div id="scraper-section" className="flex flex-col gap-6">
            
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
                  <div className="p-12 text-center text-slate-500 animate-pulse text-xs font-mono">Memuat data lagu dari database...</div>
                ) : filteredChords.length === 0 ? (
                  <div className="p-12 text-center text-slate-500 text-xs font-mono">Tidak ada data lagu yang cocok.</div>
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
        </>
      )}

    </div>
  );
}

