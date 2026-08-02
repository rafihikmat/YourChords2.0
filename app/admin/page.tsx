"use client";

import React, { useState, useEffect, useCallback } from "react";
import Navbar from "@/components/Navbar";
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
import CyberButton from "@/components/ui/CyberButton";
import CyberCard from "@/components/ui/CyberCard";
import CyberBadge from "@/components/ui/CyberBadge";
import CyberInput from "@/components/ui/CyberInput";
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
    <div className="min-h-screen bg-slate-950 text-white font-sans selection:bg-purple-600 selection:text-white pb-32">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 md:px-8 pt-24 space-y-8">
        
        {/* HEADER SECTION: GREETING & STATUS */}
        <CyberCard variant="glowing" padding="lg" className="relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div className="flex items-center gap-3 mb-2 flex-wrap">
                <CyberBadge variant="green" pulse icon={<span className="w-2 h-2 rounded-full bg-emerald-400" />}>
                  Sistem Live & Operational
                </CyberBadge>
                {lastUpdated && (
                  <CyberBadge variant="purple" icon={<Clock className="w-3 h-3 text-purple-300" />}>
                    Diperbarui: {lastUpdated}
                  </CyberBadge>
                )}
              </div>

              <h1 className="text-2xl md:text-4xl font-black text-white tracking-tight flex items-center gap-3">
                Selamat Datang, <span className="bg-gradient-to-r from-purple-400 via-indigo-300 to-cyan-400 bg-clip-text text-transparent">{adminName}</span>
              </h1>
              <p className="text-slate-400 text-xs md:text-sm mt-1">
                Pusat Komando & Dynamic Analytics Engine Platform YourChords Cyber-Zen
              </p>
            </div>

            <CyberButton
              variant="outline"
              size="md"
              isLoading={loadingAnalytics || loadingCms}
              leftIcon={<RefreshCw className={`w-4 h-4 text-purple-400 ${loadingAnalytics || loadingCms ? "animate-spin" : ""}`} />}
              onClick={() => {
                loadAnalytics();
                loadChords();
                loadCMS();
              }}
            >
              Refresh Analytics & CMS
            </CyberButton>
          </div>
        </CyberCard>

        {/* NAVIGATION TABS */}
        <div className="flex items-center gap-3 border-b border-purple-500/15 pb-4">
          <CyberButton
            variant={activeTab === "overview" ? "primary" : "ghost"}
            size="md"
            leftIcon={<Music className="w-4 h-4" />}
            onClick={() => setActiveTab("overview")}
          >
            📊 Overview & Koleksi Database
          </CyberButton>

          <CyberButton
            variant={activeTab === "cms" ? "cyan" : "ghost"}
            size="md"
            leftIcon={<FileText className="w-4 h-4" />}
            onClick={() => setActiveTab("cms")}
          >
            📝 Edit Konten Website (CMS)
          </CyberButton>
        </div>

        {/* GLOBAL FEEDBACK TOAST MESSAGE */}
        {message && (
          <div className={`p-4 rounded-xl border text-xs font-bold flex items-center gap-2 ${
            message.type === 'success' 
              ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.2)]' 
              : 'bg-rose-500/15 border-rose-500/40 text-rose-400 shadow-[0_0_20px_rgba(244,63,94,0.2)]'
          }`}>
            {message.type === 'success' ? <CheckCircle2 className="w-4 h-4 flex-shrink-0" /> : <AlertTriangle className="w-4 h-4 flex-shrink-0" />}
            <span>{message.text}</span>
          </div>
        )}

        {/* TAB CONTENT 1: CMS EDITOR */}
        {activeTab === "cms" ? (
          <CyberCard variant="glowing" padding="lg">
            <form onSubmit={handleSaveCMS} className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-purple-500/15">
                <div>
                  <div className="mb-2">
                    <CyberBadge variant="amber" icon={<Sparkles className="w-3 h-3 text-amber-400" />}>
                      Supabase Dynamic CMS Editor
                    </CyberBadge>
                  </div>
                  <h2 className="text-xl font-black text-white tracking-tight flex items-center gap-2">
                    <Globe className="w-5 h-5 text-amber-400" />
                    <span>Pengaturan Konten Teks Website Real-Time</span>
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">
                    Ubah teks utama beranda, pengumuman, slogan footer, dan tentang tanpa perlu mendeploy ulang kode.
                  </p>
                </div>

                <CyberButton
                  type="submit"
                  variant="primary"
                  size="md"
                  isLoading={savingCms}
                  leftIcon={<Save className="w-4 h-4" />}
                >
                  Simpan Perubahan CMS
                </CyberButton>
              </div>

              {/* Input 1: Hero Banner Title */}
              <CyberInput
                label="1. Hero Banner Title (Teks Utama Beranda)"
                value={cmsContent.heroTitle || ""}
                onChange={(e) => setCmsContent({ ...cmsContent, heroTitle: e.target.value })}
                placeholder="Belajar & Mainkan Chord Lagu Favoritmu Tanpa Batas"
                icon={<Sparkles className="w-4 h-4 text-purple-400" />}
                required
              />

              {/* Input 2: Hero Banner Subtitle */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-300 flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Sliders className="w-3.5 h-3.5 text-cyan-400" />
                    2. Hero Banner Subtitle (Sub-Teks Beranda)
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono">heroSubtitle</span>
                </label>
                <textarea
                  rows={2}
                  value={cmsContent.heroSubtitle || ""}
                  onChange={(e) => setCmsContent({ ...cmsContent, heroSubtitle: e.target.value })}
                  placeholder="Platform musik AI-Powered terdepan untuk musisi Indonesia."
                  className="w-full bg-slate-950/70 border border-purple-500/25 focus:border-purple-500 text-slate-100 placeholder-slate-500 text-sm rounded-xl p-3 outline-none transition-all duration-200"
                  required
                />
              </div>

              {/* Input 3: Footer Slogan */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-300 flex items-center justify-between">
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
                  className="w-full bg-slate-950/70 border border-purple-500/25 focus:border-purple-500 text-slate-100 placeholder-slate-500 text-sm rounded-xl p-3 outline-none transition-all duration-200"
                  required
                />
              </div>

              {/* Input 4: Running Announcement Bar */}
              <CyberInput
                label="4. Running Announcement Bar (Teks Pengumuman Atas Beranda)"
                value={cmsContent.announcementText || ""}
                onChange={(e) => setCmsContent({ ...cmsContent, announcementText: e.target.value })}
                placeholder="🔥 Nikmati fitur Smart Transposer & Interactive Fretboard 3D terbaru!"
                icon={<Megaphone className="w-4 h-4 text-amber-400" />}
              />

              {/* Input 5: Deskripsi Tentang Website */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-300 flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Globe className="w-3.5 h-3.5 text-purple-400" />
                    5. Deskripsi Tentang Platform (Halaman About)
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono">aboutDescription</span>
                </label>
                <textarea
                  rows={3}
                  value={cmsContent.aboutDescription || ""}
                  onChange={(e) => setCmsContent({ ...cmsContent, aboutDescription: e.target.value })}
                  placeholder="YourChords adalah platform edukasi dan latihan musik terlengkap di Indonesia."
                  className="w-full bg-slate-950/70 border border-purple-500/25 focus:border-purple-500 text-slate-100 placeholder-slate-500 text-sm rounded-xl p-3 outline-none transition-all duration-200"
                />
              </div>

              <div className="pt-4 border-t border-purple-500/15 flex justify-end">
                <CyberButton
                  type="submit"
                  variant="primary"
                  size="md"
                  isLoading={savingCms}
                  leftIcon={<Save className="w-4 h-4" />}
                >
                  Simpan Perubahan CMS
                </CyberButton>
              </div>
            </form>
          </CyberCard>
        ) : (
          <div className="space-y-8">
            {/* SECTION 1: OVERVIEW METRIC CARDS */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              
              {/* Metric 1: Total Songs */}
              <CyberCard variant="glowing" padding="md" className="group">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-purple-500/20 border border-purple-500/40 rounded-2xl flex items-center justify-center text-purple-300 group-hover:scale-110 transition-transform">
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
              </CyberCard>

              {/* Metric 2: Total Pageviews */}
              <CyberCard variant="glowing" padding="md" className="group">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-cyan-500/20 border border-cyan-500/40 rounded-2xl flex items-center justify-center text-cyan-300 group-hover:scale-110 transition-transform">
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
              </CyberCard>

              {/* Metric 3: Missing Songs Requests */}
              <CyberCard variant="glowing" padding="md" className="group">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-amber-500/20 border border-amber-500/40 rounded-2xl flex items-center justify-center text-amber-300 group-hover:scale-110 transition-transform">
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
              </CyberCard>

              {/* Metric 4: Total Registered Users */}
              <CyberCard variant="glowing" padding="md" className="group">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-emerald-500/20 border border-emerald-500/40 rounded-2xl flex items-center justify-center text-emerald-300 group-hover:scale-110 transition-transform">
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
              </CyberCard>

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
            <div id="scraper-section" className="space-y-6">
              
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
              <CyberCard variant="glowing" padding="md">
                <div className="border-b border-purple-500/15 pb-4 mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <Music className="w-5 h-5 text-purple-400" />
                    <h2 className="text-base font-bold text-white tracking-wide flex items-center gap-2">
                      <span>Koleksi Database Songs</span>
                      <CyberBadge variant="purple" size="sm">
                        {chords.length} Lagu
                      </CyberBadge>
                    </h2>
                  </div>

                  {/* Filter Search */}
                  <div className="w-full sm:w-64">
                    <CyberInput
                      placeholder="Filter koleksi lagu..."
                      value={songFilter}
                      onChange={(e) => setSongFilter(e.target.value)}
                      icon={<Search className="w-4 h-4 text-slate-400" />}
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
                      <thead className="bg-slate-950/80 text-[10px] uppercase font-bold tracking-wider text-slate-400 border-b border-purple-500/15">
                        <tr>
                          <th className="px-4 py-3">Lagu & Artis</th>
                          <th className="px-4 py-3">Tanggal Dibuat</th>
                          <th className="px-4 py-3 text-center">Aksi</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-purple-500/10">
                        {filteredChords.map((entry) => (
                          <tr key={entry.id} className="hover:bg-purple-950/20 transition-colors group">
                            <td className="px-4 py-3">
                              <div className="font-semibold text-white text-xs group-hover:text-purple-300 transition-colors">{entry.title}</div>
                              <div className="text-slate-400 text-[11px] mt-0.5 flex items-center gap-2">
                                <span>{entry.artist}</span>
                                <span className="text-[9px] bg-purple-500/10 border border-purple-500/20 px-1.5 py-0.5 rounded text-purple-300 font-mono">
                                  👁️ {entry.views || entry.view_count || 0} views
                                </span>
                              </div>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-slate-400 text-[11px] font-mono">
                              {entry.created_at ? new Date(entry.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric'}) : '-'}
                            </td>
                            <td className="px-4 py-3 flex items-center justify-center gap-2">
                              <Link 
                                href={`/chord/${entry.id}`} 
                                target="_blank"
                              >
                                <CyberButton variant="ghost" size="sm" className="p-1.5 min-w-0" title="Buka Detail">
                                  <ExternalLink className="w-3.5 h-3.5 text-purple-400" />
                                </CyberButton>
                              </Link>
                              <Link 
                                href={`/admin/edit/${entry.id}`} 
                              >
                                <CyberButton variant="cyan" size="sm" leftIcon={<Edit3 className="w-3.5 h-3.5" />}>
                                  Edit
                                </CyberButton>
                              </Link>
                              <CyberButton 
                                variant="danger" 
                                size="sm" 
                                className="p-1.5 min-w-0" 
                                title="Hapus Lagu"
                                onClick={() => handleDelete(entry.id, entry.title)}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </CyberButton>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </CyberCard>

            </div>
          </div>
        )}

      </main>
    </div>
  );
}
