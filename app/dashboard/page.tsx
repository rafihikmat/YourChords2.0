"use client";

import React, { useState, useEffect, Suspense } from "react";
import Navbar from "@/components/Navbar";
import { useAuth } from "@/lib/authContext";
import AuthModal from "@/components/AuthModal";
import { 
  getUserDashboardStats, 
  getUserFavoriteSongs, 
  getUserNotesList, 
  getUserSetlistsWithItems,
  updateUserProfileName, 
  UserDashboardStats, 
  UserSongNoteItem,
  UserSetlistWithItems
} from "@/lib/userDashboard";
import { 
  createUserSetlist, 
  removeSongFromSetlist, 
  deleteUserSetlist 
} from "@/lib/setlists";
import { toggleSongFavorite } from "@/lib/userPreferences";
import { fetchSongById } from "@/lib/supabase";
import { Song } from "@/lib/types";
import { 
  Heart, 
  FolderPlus, 
  FileText, 
  Settings, 
  User as UserIcon, 
  Trash2, 
  Music, 
  ExternalLink, 
  CheckCircle2, 
  Sparkles, 
  Plus, 
  Loader2, 
  Folder, 
  X, 
  Lock, 
  Home, 
  Clock, 
  Check, 
  Save,
  PenTool
} from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import CyberButton from "@/components/ui/CyberButton";
import CyberCard from "@/components/ui/CyberCard";
import CyberBadge from "@/components/ui/CyberBadge";
import CyberInput from "@/components/ui/CyberInput";
import CyberModal from "@/components/ui/CyberModal";

export const dynamic = "force-dynamic";

function DashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const { user, profile, loading: authLoading, signOut, refreshProfile, isAdmin } = useAuth();

  const [activeTab, setActiveTab] = useState<"favorites" | "setlists" | "notes" | "settings">("favorites");
  const [unauthorizedMsg, setUnauthorizedMsg] = useState<string | null>(null);

  // Client side role guard: Redirect admin/super_admin to /admin immediately
  useEffect(() => {
    if (searchParams.get("error") === "unauthorized") {
      setUnauthorizedMsg("Akses Ditolak: Halaman Admin khusus untuk Admin. Anda dialihkan ke Dashboard.");
    }
  }, [searchParams]);

  useEffect(() => {
    if (!authLoading && user && profile) {
      if (profile.role === "admin" || profile.role === "super_admin") {
        router.replace("/admin");
      }
    }
  }, [user, profile, authLoading, router]);
  
  // Dashboard Data State
  const [stats, setStats] = useState<UserDashboardStats>({ favoritesCount: 0, setlistsCount: 0, notesCount: 0 });
  const [favoriteSongs, setFavoriteSongs] = useState<Song[]>([]);
  const [setlists, setSetlists] = useState<UserSetlistWithItems[]>([]);
  const [notesList, setNotesList] = useState<UserSongNoteItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Setlists songs details map
  const [songDetailsMap, setSongDetailsMap] = useState<Record<string, Song>>({});

  // Create Setlist Modal state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newSetlistName, setNewSetlistName] = useState("");
  const [newSetlistDesc, setNewSetlistDesc] = useState("");
  const [isCreatingSetlist, setIsCreatingSetlist] = useState(false);
  const [createSetlistError, setCreateSetlistError] = useState<string | null>(null);
  const [createSetlistToast, setCreateSetlistToast] = useState<string | null>(null);

  // Settings State
  const [displayName, setDisplayName] = useState("");
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [profileSaveSuccess, setProfileSaveSuccess] = useState(false);

  // Auth Modal state for guest visitors
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<"signin" | "signup">("signin");

  // Load all dashboard data
  const loadDashboardData = async () => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    try {
      const [statsData, favsData, setlistsData, notesData] = await Promise.all([
        getUserDashboardStats(user.id),
        getUserFavoriteSongs(user.id),
        getUserSetlistsWithItems(user.id),
        getUserNotesList(user.id),
      ]);

      setStats(statsData);
      setFavoriteSongs(favsData);
      setSetlists(setlistsData);
      setNotesList(notesData);

      // Pre-fetch details map from returned setlists
      const detailsMap: Record<string, Song> = {};
      setlistsData.forEach((s) => {
        s.songs.forEach((song) => {
          if (song?.id) {
            detailsMap[song.id] = song;
          }
        });
      });

      // Also check missing song_ids
      const missingSongIds = Array.from(new Set(setlistsData.flatMap((s) => s.song_ids))).filter(
        (id) => !detailsMap[id]
      );

      if (missingSongIds.length > 0) {
        await Promise.all(
          missingSongIds.map(async (id) => {
            const song = await fetchSongById(id);
            if (song) {
              detailsMap[id] = song;
            }
          })
        );
      }

      setSongDetailsMap(detailsMap);
    } catch (err) {
      console.error("[LOAD DASHBOARD DATA ERROR]:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      loadDashboardData();
      setDisplayName(profile?.full_name || "");
    }
  }, [user, profile?.full_name]);

  // Handle Remove Favorite in Realtime
  const handleRemoveFavorite = async (songId: string) => {
    if (!user) return;
    await toggleSongFavorite(songId, user.id);
    
    setFavoriteSongs(prev => prev.filter(s => s.id !== songId));
    setStats(prev => ({
      ...prev,
      favoritesCount: Math.max(0, prev.favoritesCount - 1),
    }));
  };

  // Handle Create Setlist
  const handleCreateSetlistSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      alert("Error: User tidak terautentikasi.");
      return;
    }
    if (!newSetlistName.trim()) {
      setCreateSetlistError("Nama setlist tidak boleh kosong.");
      return;
    }

    setIsCreatingSetlist(true);
    setCreateSetlistError(null);

    const res = await createUserSetlist(user.id, newSetlistName, newSetlistDesc);
    setIsCreatingSetlist(false);

    if (res.success) {
      setNewSetlistName("");
      setNewSetlistDesc("");
      setShowCreateModal(false);
      setCreateSetlistToast("✨ Folder Setlist berhasil dibuat!");
      setTimeout(() => setCreateSetlistToast(null), 4000);
      loadDashboardData();
    } else {
      setCreateSetlistError(res.error || "Gagal membuat setlist.");
    }
  };

  // Handle Remove Song from Setlist
  const handleRemoveSongFromSetlist = async (setlistId: string, songId: string) => {
    if (!user) return;
    await removeSongFromSetlist(setlistId, songId, user.id);
    loadDashboardData();
  };

  // Handle Delete Setlist
  const handleDeleteSetlist = async (setlistId: string) => {
    if (!user) return;
    if (confirm("Apakah Anda yakin ingin menghapus folder setlist ini?")) {
      await deleteUserSetlist(setlistId, user.id);
      loadDashboardData();
    }
  };

  // Handle Update Profile Name
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !displayName.trim()) return;

    setIsUpdatingProfile(true);
    const success = await updateUserProfileName(user.id, displayName);
    setIsUpdatingProfile(false);

    if (success) {
      await refreshProfile();
      setProfileSaveSuccess(true);
      setTimeout(() => setProfileSaveSuccess(false), 4000);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white font-sans relative pb-28 selection:bg-purple-600 selection:text-white">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 md:px-8 pt-24">
        
        {/* CREATE SETLIST TOAST */}
        {createSetlistToast && (
          <div className="mb-6 p-4 rounded-2xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 text-xs md:text-sm font-bold flex items-center justify-between gap-3 shadow-[0_0_20px_rgba(16,185,129,0.3)] animate-fade-in">
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <span>{createSetlistToast}</span>
            </div>
            <button
              onClick={() => setCreateSetlistToast(null)}
              className="p-1 text-emerald-400 hover:text-white rounded-lg hover:bg-emerald-500/20 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* UNAUTHORIZED BANNER */}
        {unauthorizedMsg && (
          <div className="mb-6 p-4 rounded-2xl bg-amber-500/15 border border-amber-500/40 text-amber-300 text-xs md:text-sm font-bold flex items-center justify-between gap-3 shadow-[0_0_20px_rgba(245,158,11,0.2)]">
            <div className="flex items-center gap-2.5">
              <Lock className="w-4 h-4 text-amber-400 flex-shrink-0" />
              <span>{unauthorizedMsg}</span>
            </div>
            <button
              onClick={() => setUnauthorizedMsg(null)}
              className="p-1 text-amber-400 hover:text-white rounded-lg hover:bg-amber-500/20 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* ADMIN REDIRECTING SPINNER */}
        {user && profile && (profile.role === "admin" || profile.role === "super_admin") && (
          <div className="text-center py-24">
            <Loader2 className="w-8 h-8 text-purple-400 animate-spin mx-auto mb-3" />
            <p className="text-sm font-bold text-slate-300">Mengalihkan ke Pusat Komando Admin...</p>
          </div>
        )}

        {/* ==========================================
            UNAUTHENTICATED / GUEST AUTH GUARD
        ========================================== */}

        {!authLoading && !user && (
          <CyberCard variant="glowing" padding="lg" className="max-w-2xl mx-auto my-12 text-center">
            <div className="w-20 h-20 rounded-3xl bg-purple-500/20 border-2 border-purple-500/50 flex items-center justify-center text-purple-400 mx-auto mb-6 shadow-[0_0_30px_rgba(168,85,247,0.4)]">
              <Lock className="w-10 h-10" />
            </div>

            <CyberBadge variant="amber" pulse icon={<Sparkles className="w-3.5 h-3.5" />} className="mb-4">
              Restriksi Hak Akses
            </CyberBadge>

            <h2 className="text-2xl md:text-3xl font-black text-white mb-3">
              Akses Terbatas: Dashboard Khusus Member
            </h2>

            <p className="text-slate-300 text-xs md:text-sm leading-relaxed max-w-lg mx-auto mb-8 font-medium">
              Silakan <span className="text-cyan-400 font-bold">Sign In</span> atau <span className="text-purple-400 font-bold">Daftar Akun Baru</span> untuk mengakses Dashboard Member Anda, mengelola lagu favorit, folder setlist, serta catatan musik pribadi Anda.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <CyberButton
                variant="primary"
                size="md"
                onClick={() => {
                  setAuthModalMode("signin");
                  setShowAuthModal(true);
                }}
                className="w-full sm:w-auto"
              >
                Sign In Sekarang
              </CyberButton>

              <CyberButton
                variant="cyan"
                size="md"
                onClick={() => {
                  setAuthModalMode("signup");
                  setShowAuthModal(true);
                }}
                className="w-full sm:w-auto"
              >
                Daftar Akun (Gratis)
              </CyberButton>

              <Link href="/">
                <CyberButton variant="ghost" size="md" leftIcon={<Home className="w-4 h-4" />} className="w-full sm:w-auto">
                  Beranda
                </CyberButton>
              </Link>
            </div>
          </CyberCard>
        )}

        {/* ==========================================
            LOGGED IN USER DASHBOARD CONTENT
        ========================================== */}
        {user && profile?.role !== "admin" && profile?.role !== "super_admin" && (
          <div className="space-y-8">

            {/* HEADER PROFILE CARD (CYBER-ZEN STYLING) */}
            <CyberCard variant="glowing" padding="lg" className="relative overflow-hidden">
              {/* Background ambient lighting */}
              <div className="absolute top-0 right-0 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute -bottom-10 -left-10 w-72 h-72 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

              <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                
                {/* User Info Avatar & Title */}
                <div className="flex items-center gap-4 md:gap-6">
                  {/* Avatar ring */}
                  <div className="relative flex-shrink-0">
                    <div className="w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-gradient-to-br from-purple-500 via-indigo-600 to-cyan-500 p-0.5 shadow-[0_0_25px_rgba(168,85,247,0.5)] ring-2 ring-purple-500/50">
                      <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center text-purple-300 font-black text-2xl md:text-3xl">
                        {profile?.full_name ? profile.full_name[0].toUpperCase() : user.email?.[0].toUpperCase() || 'M'}
                      </div>
                    </div>
                    <div className="absolute -bottom-1 -right-1 bg-emerald-500 border-2 border-slate-950 w-5 h-5 rounded-full flex items-center justify-center" title="Online Member">
                      <Check className="w-3 h-3 text-slate-950 stroke-[3]" />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <CyberBadge variant="purple" pulse icon={<Sparkles className="w-3 h-3" />}>
                        Musisi Member
                      </CyberBadge>
                      {isAdmin && (
                        <CyberBadge variant="rose">Admin</CyberBadge>
                      )}
                    </div>

                    <h1 className="text-xl md:text-3xl font-black text-white tracking-tight">
                      {profile?.full_name || user.email?.split('@')[0]}
                    </h1>

                    <p className="text-xs md:text-sm text-slate-400 font-mono mt-0.5">
                      {user.email}
                    </p>
                  </div>
                </div>

                {/* 3 Quick Stats Cards */}
                <div className="grid grid-cols-3 gap-3 md:gap-4 w-full lg:w-auto">
                  {/* Stats 1: Favorites */}
                  <CyberCard variant="glowing" padding="sm" className="text-center group">
                    <div className="w-8 h-8 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 flex items-center justify-center mx-auto mb-2 group-hover:scale-110 transition-transform">
                      <Heart className="w-4 h-4 fill-rose-500/30" />
                    </div>
                    <span className="block text-xl md:text-2xl font-black text-white group-hover:text-rose-400 transition-colors">
                      {stats.favoritesCount}
                    </span>
                    <span className="text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-wider">
                      Lagu Disukai
                    </span>
                  </CyberCard>

                  {/* Stats 2: Setlists */}
                  <CyberCard variant="glowing" padding="sm" className="text-center group">
                    <div className="w-8 h-8 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-300 flex items-center justify-center mx-auto mb-2 group-hover:scale-110 transition-transform">
                      <Folder className="w-4 h-4" />
                    </div>
                    <span className="block text-xl md:text-2xl font-black text-white group-hover:text-purple-300 transition-colors">
                      {stats.setlistsCount}
                    </span>
                    <span className="text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-wider">
                      Folder Setlist
                    </span>
                  </CyberCard>

                  {/* Stats 3: Song Notes */}
                  <CyberCard variant="glowing" padding="sm" className="text-center group">
                    <div className="w-8 h-8 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 flex items-center justify-center mx-auto mb-2 group-hover:scale-110 transition-transform">
                      <FileText className="w-4 h-4" />
                    </div>
                    <span className="block text-xl md:text-2xl font-black text-white group-hover:text-cyan-400 transition-colors">
                      {stats.notesCount}
                    </span>
                    <span className="text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-wider">
                      Catatan
                    </span>
                  </CyberCard>
                </div>

              </div>
            </CyberCard>

            {/* TABBED NAVIGATION SYSTEM */}
            <div className="flex flex-wrap items-center gap-2 md:gap-3 border-b border-purple-500/15 pb-4">
              <CyberButton
                variant={activeTab === "favorites" ? "primary" : "ghost"}
                size="sm"
                leftIcon={<Heart className={`w-4 h-4 ${activeTab === "favorites" ? "fill-white" : "text-rose-400"}`} />}
                onClick={() => setActiveTab("favorites")}
              >
                ❤️ Lagu Favorit Saya ({favoriteSongs.length})
              </CyberButton>

              <CyberButton
                variant={activeTab === "setlists" ? "primary" : "ghost"}
                size="sm"
                leftIcon={<Folder className="w-4 h-4 text-purple-400" />}
                onClick={() => setActiveTab("setlists")}
              >
                📁 Setlist Saya ({setlists.length})
              </CyberButton>

              <CyberButton
                variant={activeTab === "notes" ? "cyan" : "ghost"}
                size="sm"
                leftIcon={<FileText className="w-4 h-4 text-cyan-400" />}
                onClick={() => setActiveTab("notes")}
              >
                📝 Catatan Pribadi ({notesList.length})
              </CyberButton>

              <CyberButton
                variant={activeTab === "settings" ? "outline" : "ghost"}
                size="sm"
                leftIcon={<Settings className="w-4 h-4 text-slate-400" />}
                onClick={() => setActiveTab("settings")}
              >
                ⚙️ Pengaturan Akun
              </CyberButton>
            </div>

            {/* TAB CONTENT AREAS */}
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 py-8">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="h-32 bg-slate-900/60 border border-purple-500/20 rounded-2xl animate-pulse p-4" />
                ))}
              </div>
            ) : (
              <div>
                
                {/* ==========================================
                    TAB 1: ❤️ LAGU DISUKAI
                ========================================== */}
                {activeTab === "favorites" && (
                  <div>
                    {favoriteSongs.length === 0 ? (
                      <CyberCard variant="default" padding="lg" className="text-center py-16">
                        <div className="w-16 h-16 rounded-2xl bg-rose-500/20 border border-rose-500/30 flex items-center justify-center text-rose-400 mx-auto mb-4">
                          <Heart className="w-8 h-8 fill-rose-500" />
                        </div>
                        <h3 className="text-lg font-bold text-white mb-1">Belum Ada Lagu Disukai</h3>
                        <p className="text-slate-400 text-xs max-w-md mx-auto mb-6">
                          Jelajahi lagu di YourChords dan klik tombol <span className="text-rose-400 font-bold">Sukai (❤️)</span> pada lagu favorit Anda.
                        </p>
                        <Link href="/search">
                          <CyberButton variant="danger" size="md" leftIcon={<Heart className="w-4 h-4 fill-white" />}>
                            Cari Lagu Favorit
                          </CyberButton>
                        </Link>
                      </CyberCard>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {favoriteSongs.map((song) => (
                          <CyberCard key={song.id} variant="interactive" padding="md" className="flex flex-col justify-between group">
                            <div className="flex items-start gap-3.5 mb-3">
                              <div className="w-14 h-14 rounded-xl bg-slate-900 border border-purple-500/20 flex-shrink-0 overflow-hidden relative">
                                {song.cover_url ? (
                                  /* eslint-disable-next-line @next/next/no-img-element */
                                  <img src={song.cover_url} alt={song.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center text-rose-400">
                                    <Music className="w-6 h-6" />
                                  </div>
                                )}
                              </div>

                              <div className="flex-1 min-w-0">
                                <h3 className="text-sm font-extrabold text-white truncate group-hover:text-purple-300 transition-colors">
                                  {song.title}
                                </h3>
                                <p className="text-xs text-slate-400 truncate mb-1.5">
                                  {song.artist}
                                </p>
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <CyberBadge variant="purple" size="sm">
                                    Nada: {song.key_chord || 'C'}
                                  </CyberBadge>
                                  <CyberBadge variant="cyan" size="sm">
                                    {song.difficulty || 'Easy'}
                                  </CyberBadge>
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center justify-between gap-2 pt-3 border-t border-purple-500/15">
                              <Link href={`/chord/${song.id}`} className="flex-1">
                                <CyberButton variant="primary" size="sm" className="w-full" rightIcon={<ExternalLink className="w-3.5 h-3.5" />}>
                                  Buka Chord
                                </CyberButton>
                              </Link>

                              <button
                                onClick={() => handleRemoveFavorite(song.id)}
                                className="p-2 text-slate-400 hover:text-rose-400 bg-slate-900/60 hover:bg-rose-500/10 border border-purple-500/20 hover:border-rose-500/40 rounded-xl transition-all cursor-pointer"
                                title="Hapus dari Favorit"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </CyberCard>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* ==========================================
                    TAB 2: 📁 SETLIST SAYA
                ========================================== */}
                {activeTab === "setlists" && (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <h2 className="text-lg font-black text-white">Folder Setlist Pribadi</h2>
                        <p className="text-xs text-slate-400">Susun lagu untuk manggung atau latihan rutin Anda</p>
                      </div>

                      <CyberButton
                        variant="primary"
                        size="sm"
                        leftIcon={<FolderPlus className="w-4 h-4" />}
                        onClick={() => setShowCreateModal(true)}
                      >
                        + Buat Setlist Baru
                      </CyberButton>
                    </div>

                    {setlists.length === 0 ? (
                      <CyberCard variant="default" padding="lg" className="text-center py-16">
                        <div className="w-16 h-16 rounded-2xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-purple-400 mx-auto mb-4">
                          <Folder className="w-8 h-8" />
                        </div>
                        <h3 className="text-lg font-bold text-white mb-1">Belum Ada Setlist</h3>
                        <p className="text-slate-400 text-xs max-w-md mx-auto mb-6">
                          Buat folder setlist pertama Anda untuk mengelompokkan lagu-lagu pilihan.
                        </p>
                        <CyberButton
                          variant="primary"
                          size="md"
                          onClick={() => setShowCreateModal(true)}
                        >
                          + Buat Setlist Pertama
                        </CyberButton>
                      </CyberCard>
                    ) : (
                      <div className="grid grid-cols-1 gap-6">
                        {setlists.map((setlist) => (
                          <CyberCard key={setlist.id} variant="glowing" padding="md">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-purple-500/15 pb-4 mb-4">
                              <div>
                                <div className="flex items-center gap-3">
                                  <h3 className="text-lg font-black text-white">{setlist.name}</h3>
                                  <CyberBadge variant="purple" size="sm">
                                    {setlist.song_ids.length} Lagu
                                  </CyberBadge>
                                </div>
                                {setlist.description && (
                                  <p className="text-xs text-slate-400 mt-1">{setlist.description}</p>
                                )}
                              </div>

                              <div className="flex items-center gap-2">
                                <Link href="/search">
                                  <CyberButton variant="outline" size="sm" leftIcon={<Plus className="w-3.5 h-3.5 text-purple-400" />}>
                                    Cari & Tambah Lagu
                                  </CyberButton>
                                </Link>

                                <button
                                  onClick={() => handleDeleteSetlist(setlist.id)}
                                  className="p-2 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer"
                                  title="Hapus Setlist"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>

                            {/* SONG ITEMS INSIDE SETLIST */}
                            {setlist.song_ids.length === 0 ? (
                              <div className="text-center py-6 bg-slate-950/50 border border-dashed border-purple-500/20 rounded-xl p-4 text-slate-500 text-xs">
                                Belum ada lagu dalam setlist ini.
                              </div>
                            ) : (
                              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                {setlist.song_ids.map((songId) => {
                                  const song = songDetailsMap[songId];
                                  return (
                                    <div
                                      key={songId}
                                      className="flex items-center justify-between gap-3 p-3 bg-slate-950/60 hover:bg-purple-950/20 border border-purple-500/20 hover:border-purple-500/40 rounded-xl transition-all group"
                                    >
                                      <div className="flex items-center gap-3 overflow-hidden">
                                        <div className="w-10 h-10 rounded-lg bg-slate-900 flex-shrink-0 overflow-hidden border border-purple-500/20">
                                          {song?.cover_url ? (
                                            /* eslint-disable-next-line @next/next/no-img-element */
                                            <img src={song.cover_url} alt={song.title} className="w-full h-full object-cover" />
                                          ) : (
                                            <div className="w-full h-full flex items-center justify-center text-purple-400">
                                              <Music className="w-4 h-4" />
                                            </div>
                                          )}
                                        </div>
                                        <div className="truncate">
                                          <p className="text-xs font-bold text-white group-hover:text-purple-300 transition-colors truncate">
                                            {song ? song.title : songId}
                                          </p>
                                          <p className="text-[10px] text-slate-400 truncate">
                                            {song ? song.artist : 'Memuat...'}
                                          </p>
                                        </div>
                                      </div>

                                      <div className="flex items-center gap-1 flex-shrink-0">
                                        <Link href={`/chord/${songId}`}>
                                          <CyberButton variant="ghost" size="sm" className="p-1.5 min-w-0" title="Buka Chord">
                                            <ExternalLink className="w-3.5 h-3.5 text-purple-400" />
                                          </CyberButton>
                                        </Link>
                                        <button
                                          onClick={() => handleRemoveSongFromSetlist(setlist.id, songId)}
                                          className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-slate-800/50 rounded-lg transition-colors cursor-pointer"
                                          title="Keluarkan dari setlist"
                                        >
                                          <X className="w-3.5 h-3.5" />
                                        </button>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </CyberCard>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* ==========================================
                    TAB 3: 📝 CATATAN PRIBADI SAYA
                ========================================== */}
                {activeTab === "notes" && (
                  <div>
                    {notesList.length === 0 ? (
                      <CyberCard variant="default" padding="lg" className="text-center py-16">
                        <div className="w-16 h-16 rounded-2xl bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400 mx-auto mb-4">
                          <FileText className="w-8 h-8" />
                        </div>
                        <h3 className="text-lg font-bold text-white mb-1">Belum Ada Catatan Pribadi</h3>
                        <p className="text-slate-400 text-xs max-w-md mx-auto mb-6">
                          Anda dapat menulis catatan genjrengan, tempo BPM, atau pengingat nada di halaman chord lagu.
                        </p>
                        <Link href="/search">
                          <CyberButton variant="cyan" size="md" leftIcon={<PenTool className="w-4 h-4" />}>
                            Cari Lagu & Tulis Catatan
                          </CyberButton>
                        </Link>
                      </CyberCard>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {notesList.map((item) => (
                          <CyberCard key={item.id} variant="interactive" padding="md" className="flex flex-col justify-between group">
                            <div>
                              {/* Song Header */}
                              <div className="flex items-center justify-between gap-3 mb-3 pb-3 border-b border-purple-500/15">
                                <div className="flex items-center gap-3 overflow-hidden">
                                  <div className="w-10 h-10 rounded-xl bg-slate-900 border border-purple-500/20 flex-shrink-0 overflow-hidden relative">
                                    {item.song?.cover_url ? (
                                      /* eslint-disable-next-line @next/next/no-img-element */
                                      <img src={item.song.cover_url} alt={item.song.title} className="w-full h-full object-cover" />
                                    ) : (
                                      <div className="w-full h-full flex items-center justify-center text-cyan-400">
                                        <Music className="w-5 h-5" />
                                      </div>
                                    )}
                                  </div>

                                  <div className="truncate">
                                    <h3 className="text-sm font-extrabold text-white truncate group-hover:text-cyan-300 transition-colors">
                                      {item.song ? item.song.title : 'Lagu'}
                                    </h3>
                                    <p className="text-xs text-slate-400 truncate">
                                      {item.song ? item.song.artist : 'Artis'}
                                    </p>
                                  </div>
                                </div>

                                <CyberBadge variant="cyan" size="sm" icon={<Clock className="w-3 h-3" />}>
                                  {new Date(item.updated_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                                </CyberBadge>
                              </div>

                              {/* Note Content Preview */}
                              <div className="bg-slate-950/70 border border-cyan-500/20 rounded-xl p-3 mb-4 text-xs font-mono text-cyan-200/90 whitespace-pre-wrap leading-relaxed max-h-28 overflow-y-auto">
                                {item.notes_content}
                              </div>
                            </div>

                            <Link href={`/chord/${item.song_id}`}>
                              <CyberButton variant="cyan" size="sm" className="w-full" rightIcon={<ExternalLink className="w-3.5 h-3.5" />}>
                                Buka Lagu & Edit Catatan
                              </CyberButton>
                            </Link>
                          </CyberCard>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* ==========================================
                    TAB 4: ⚙️ PENGATURAN AKUN
                ========================================== */}
                {activeTab === "settings" && (
                  <div className="max-w-2xl mx-auto space-y-6">
                    
                    {/* PROFILE EDIT FORM */}
                    <CyberCard variant="glowing" padding="lg">
                      <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 rounded-xl bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-purple-300">
                          <UserIcon className="w-5 h-5" />
                        </div>
                        <div>
                          <h2 className="text-lg font-black text-white">Profil Pengguna</h2>
                          <p className="text-xs text-slate-400">Perbarui informasi nama profil Anda</p>
                        </div>
                      </div>

                      {profileSaveSuccess && (
                        <div className="mb-5 p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-400 text-xs font-bold flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                          <span>Nama profil berhasil diperbarui!</span>
                        </div>
                      )}

                      <form onSubmit={handleSaveProfile} className="space-y-4">
                        <CyberInput
                          label="Nama Lengkap / Nama Tampilan"
                          value={displayName}
                          onChange={(e) => setDisplayName(e.target.value)}
                          placeholder="Tulis nama Anda..."
                          icon={<UserIcon className="w-4 h-4" />}
                        />

                        <CyberInput
                          label="Alamat Email (Terverifikasi)"
                          value={user.email || ""}
                          disabled
                          helperText="Email dihubungkan ke autentikasi Supabase dan tidak dapat diubah langsung."
                        />

                        <div className="pt-2 flex justify-end">
                          <CyberButton
                            type="submit"
                            variant="primary"
                            size="md"
                            isLoading={isUpdatingProfile}
                            disabled={!displayName.trim()}
                            leftIcon={<Save className="w-4 h-4" />}
                          >
                            Simpan Perubahan
                          </CyberButton>
                        </div>
                      </form>
                    </CyberCard>

                  </div>
                )}

              </div>
            )}

          </div>
        )}

        {/* CREATE SETLIST MODAL */}
        <CyberModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          title={
            <span className="flex items-center gap-2">
              <FolderPlus className="w-5 h-5 text-purple-400" />
              <span>Buat Folder Setlist Baru</span>
            </span>
          }
          description="Kelompokkan lagu untuk daftar latihan atau penampilan panggung."
        >
          <form onSubmit={handleCreateSetlistSubmit} className="space-y-4">
            {createSetlistError && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-400 text-xs font-medium">
                {createSetlistError}
              </div>
            )}

            <CyberInput
              label="Nama Setlist"
              value={newSetlistName}
              onChange={(e) => setNewSetlistName(e.target.value)}
              placeholder="Contoh: Latihan Band Sabtu / Akustikan Cafe"
              icon={<Folder className="w-4 h-4" />}
              required
            />

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                Deskripsi / Catatan (Opsional)
              </label>
              <textarea
                rows={3}
                value={newSetlistDesc}
                onChange={(e) => setNewSetlistDesc(e.target.value)}
                placeholder="Tuliskan detail tempat, tanggal, atau daftar lagu..."
                className="w-full bg-slate-950/70 border border-purple-500/25 focus:border-purple-500 text-slate-100 placeholder-slate-500 text-sm rounded-xl p-3 outline-none transition-all duration-200"
              />
            </div>

            <div className="pt-3 flex items-center justify-end gap-3">
              <CyberButton variant="ghost" size="sm" type="button" onClick={() => setShowCreateModal(false)}>
                Batal
              </CyberButton>
              <CyberButton variant="primary" size="sm" type="submit" isLoading={isCreatingSetlist}>
                Buat Setlist
              </CyberButton>
            </div>
          </form>
        </CyberModal>

        {/* AUTH MODAL FOR GUEST */}
        <AuthModal
          isOpen={showAuthModal}
          onClose={() => setShowAuthModal(false)}
          initialMode={authModalMode}
        />

      </main>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white">
        <Loader2 className="w-8 h-8 text-purple-400 animate-spin" />
      </div>
    }>
      <DashboardContent />
    </Suspense>
  );
}
