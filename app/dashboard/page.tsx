"use client";

import React, { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import { useAuth } from "@/lib/authContext";
import AuthModal from "@/components/AuthModal";
import {
    getUserDashboardStats,
    getUserFavoriteSongs,
    getUserNotesList,
    updateUserProfileName,
    UserDashboardStats,
    UserSongNoteItem,
} from "@/lib/userDashboard";
import {
    createSetlist,
    deleteSetlist,
    getUserSetlists,
    removeSongFromSetlist,
} from "@/lib/setlists";
import { toggleSongFavorite } from "@/lib/userPreferences";
import { fetchSongById } from "@/lib/supabase";
import { Setlist, Song } from "@/lib/types";
import {
    Check,
    CheckCircle2,
    Clock,
    ExternalLink,
    FileText,
    Folder,
    FolderPlus,
    Heart,
    Home,
    ListMusic,
    ListOrdered,
    Loader2,
    Lock,
    LogOut,
    Music,
    Plus,
    Save,
    Settings,
    ShieldCheck,
    Sparkles,
    Trash2,
    User as UserIcon,
    X,
} from "lucide-react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";

export default function DashboardPage() {
    const { user, profile, loading: authLoading, signOut, refreshProfile } =
        useAuth();

    const [activeTab, setActiveTab] = useState<
        "favorites" | "setlists" | "notes" | "settings"
    >("favorites");

    // Dashboard Data State
    const [stats, setStats] = useState<UserDashboardStats>({
        favoritesCount: 0,
        setlistsCount: 0,
        notesCount: 0,
    });
    const [favoriteSongs, setFavoriteSongs] = useState<Song[]>([]);
    const [setlists, setSetlists] = useState<Setlist[]>([]);
    const [notesList, setNotesList] = useState<UserSongNoteItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Setlists songs details map
    const [songDetailsMap, setSongDetailsMap] = useState<Record<string, Song>>(
        {},
    );

    // Create Setlist Modal state
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [newSetlistName, setNewSetlistName] = useState("");
    const [newSetlistDesc, setNewSetlistDesc] = useState("");
    const [isCreatingSetlist, setIsCreatingSetlist] = useState(false);

    // Settings State
    const [displayName, setDisplayName] = useState("");
    const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
    const [profileSaveSuccess, setProfileSaveSuccess] = useState(false);

    // Auth Modal state for guest visitors
    const [showAuthModal, setShowAuthModal] = useState(false);
    const [authModalMode, setAuthModalMode] = useState<"signin" | "signup">(
        "signin",
    );

    // Load all dashboard data
    const loadDashboardData = async () => {
        if (!user) {
            setIsLoading(false);
            return;
        }

        setIsLoading(true);

        try {
            const [statsData, favsData, setlistsData, notesData] = await Promise
                .all([
                    getUserDashboardStats(user.id),
                    getUserFavoriteSongs(user.id),
                    getUserSetlists(user.id),
                    getUserNotesList(user.id),
                ]);

            setStats(statsData);
            setFavoriteSongs(favsData);
            setSetlists(setlistsData);
            setNotesList(notesData);

            // Pre-fetch details for songs inside setlists
            const allSongIds = Array.from(
                new Set(setlistsData.flatMap((s) => s.song_ids)),
            );
            const detailsMap: Record<string, Song> = {};

            if (allSongIds.length > 0) {
                await Promise.all(
                    allSongIds.map(async (id) => {
                        const song = await fetchSongById(id);
                        if (song) {
                            detailsMap[id] = song;
                        }
                    }),
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

        setFavoriteSongs((prev) => prev.filter((s) => s.id !== songId));
        setStats((prev) => ({
            ...prev,
            favoritesCount: Math.max(0, prev.favoritesCount - 1),
        }));
    };

    // Handle Create Setlist
    const handleCreateSetlistSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newSetlistName.trim() || !user) return;

        setIsCreatingSetlist(true);
        const created = await createSetlist(
            user.id,
            newSetlistName,
            newSetlistDesc,
        );
        setIsCreatingSetlist(false);

        if (created) {
            setNewSetlistName("");
            setNewSetlistDesc("");
            setShowCreateModal(false);
            loadDashboardData();
        }
    };

    // Handle Remove Song from Setlist
    const handleRemoveSongFromSetlist = async (
        setlistId: string,
        songId: string,
    ) => {
        if (!user) return;
        await removeSongFromSetlist(setlistId, songId, user.id);
        loadDashboardData();
    };

    // Handle Delete Setlist
    const handleDeleteSetlist = async (setlistId: string) => {
        if (!user) return;
        if (confirm("Apakah Anda yakin ingin menghapus folder setlist ini?")) {
            await deleteSetlist(setlistId, user.id);
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
        <div className="min-h-screen bg-slate-950 text-white font-sans relative pb-28 selection:bg-primary selection:text-white">
            <Navbar />

            <main className="max-w-[1280px] mx-auto px-4 md:px-8 pt-24">
                {
                    /* ==========================================
            UNAUTHENTICATED / GUEST AUTH GUARD
        ========================================== */
                }
                {!authLoading && !user && (
                    <div className="max-w-2xl mx-auto my-12 bg-gradient-to-b from-slate-900/90 via-surface/80 to-slate-950 border border-primary/40 rounded-3xl p-8 md:p-12 backdrop-blur-2xl text-center shadow-[0_0_80px_rgba(168,85,247,0.25)] relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl pointer-events-none" />

                        <div className="w-20 h-20 rounded-3xl bg-primary/20 border-2 border-primary/50 flex items-center justify-center text-primary mx-auto mb-6 shadow-[0_0_30px_rgba(168,85,247,0.4)] animate-bounce-slow">
                            <Lock className="w-10 h-10 text-primary" />
                        </div>

                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-bold mb-4">
                            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                            {" "}
                            RESTRIKSI HAK AKSES
                        </div>

                        <h2 className="text-2xl md:text-3xl font-black text-white mb-3">
                            Akses Terbatas: Dashboard Khusus Member
                        </h2>

                        <p className="text-slate-300 text-xs md:text-sm leading-relaxed max-w-lg mx-auto mb-8 font-medium">
                            Silakan{" "}
                            <span className="text-primary font-bold">
                                Sign In
                            </span>{" "}
                            atau{" "}
                            <span className="text-primary font-bold">
                                Daftar Akun Baru
                            </span>{" "}
                            untuk mengakses Dashboard Member Anda, mengelola
                            lagu favorit, folder setlist, serta catatan musik
                            pribadi Anda.
                        </p>

                        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                            <button
                                onClick={() => {
                                    setAuthModalMode("signin");
                                    setShowAuthModal(true);
                                }}
                                className="w-full sm:w-auto px-6 py-3 bg-primary hover:bg-primary-light text-white font-extrabold rounded-xl text-xs md:text-sm transition-all shadow-[0_0_20px_rgba(168,85,247,0.5)] cursor-pointer"
                            >
                                Sign In Sekarang
                            </button>

                            <button
                                onClick={() => {
                                    setAuthModalMode("signup");
                                    setShowAuthModal(true);
                                }}
                                className="w-full sm:w-auto px-6 py-3 bg-white/10 hover:bg-white/20 border border-white/20 text-white font-extrabold rounded-xl text-xs md:text-sm transition-all cursor-pointer"
                            >
                                Daftar Akun (Gratis)
                            </button>

                            <Link
                                href="/"
                                className="w-full sm:w-auto px-5 py-3 bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 border border-white/10"
                            >
                                <Home className="w-4 h-4" />
                                Kembali ke Beranda
                            </Link>
                        </div>
                    </div>
                )}

                {
                    /* ==========================================
            LOGGED IN USER DASHBOARD CONTENT
        ========================================== */
                }
                {user && (
                    <div className="space-y-8">
                        {/* HEADER PROFILE CARD (CYBER-ZEN STYLING) */}
                        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900/90 via-surface/80 to-slate-950 border border-primary/30 p-6 md:p-8 backdrop-blur-2xl shadow-[0_0_50px_rgba(168,85,247,0.15)]">
                            {/* Background ambient lighting */}
                            <div className="absolute top-0 right-0 w-96 h-96 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
                            <div className="absolute -bottom-10 -left-10 w-72 h-72 bg-violet-600/10 rounded-full blur-3xl pointer-events-none" />

                            <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                                {/* User Info Avatar & Title */}
                                <div className="flex items-center gap-4 md:gap-6">
                                    {/* Avatar ring */}
                                    <div className="relative flex-shrink-0">
                                        <div className="w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-gradient-to-br from-primary via-violet-600 to-indigo-900 p-0.5 shadow-[0_0_25px_rgba(168,85,247,0.4)]">
                                            <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center text-primary font-black text-2xl md:text-3xl">
                                                {profile?.full_name
                                                    ? profile.full_name[0]
                                                        .toUpperCase()
                                                    : user.email?.[0]
                                                        .toUpperCase() || "M"}
                                            </div>
                                        </div>
                                        <div
                                            className="absolute -bottom-1 -right-1 bg-emerald-500 border-2 border-slate-950 w-5 h-5 rounded-full flex items-center justify-center"
                                            title="Online Member"
                                        >
                                            <Check className="w-3 h-3 text-slate-950 stroke-[3]" />
                                        </div>
                                    </div>

                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-primary/20 border border-primary/40 text-primary-light text-[10px] md:text-xs font-bold tracking-wider uppercase">
                                                <Sparkles className="w-3 h-3 text-primary animate-pulse" />
                                                {" "}
                                                Member Musisi
                                            </span>
                                        </div>

                                        <h1 className="text-xl md:text-3xl font-black text-white tracking-tight">
                                            {profile?.full_name ||
                                                user.email?.split("@")[0]}
                                        </h1>

                                        <p className="text-xs md:text-sm text-slate-400 font-mono mt-0.5">
                                            {user.email}
                                        </p>
                                    </div>
                                </div>

                                {/* 3 Quick Stats Cards */}
                                <div className="grid grid-cols-3 gap-3 md:gap-4 w-full lg:w-auto">
                                    {/* Stats 1: Favorites */}
                                    <div className="bg-black/50 border border-white/10 rounded-2xl p-3.5 md:p-4 text-center hover:border-rose-500/40 transition-all group">
                                        <div className="w-8 h-8 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 flex items-center justify-center mx-auto mb-2 group-hover:scale-110 transition-transform">
                                            <Heart className="w-4 h-4 fill-rose-500/30" />
                                        </div>
                                        <span className="block text-xl md:text-2xl font-black text-white group-hover:text-rose-400 transition-colors">
                                            {stats.favoritesCount}
                                        </span>
                                        <span className="text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-wider">
                                            Lagu Disukai
                                        </span>
                                    </div>

                                    {/* Stats 2: Setlists */}
                                    <div className="bg-black/50 border border-white/10 rounded-2xl p-3.5 md:p-4 text-center hover:border-primary/40 transition-all group">
                                        <div className="w-8 h-8 rounded-xl bg-primary/10 border border-primary/30 text-primary-light flex items-center justify-center mx-auto mb-2 group-hover:scale-110 transition-transform">
                                            <Folder className="w-4 h-4" />
                                        </div>
                                        <span className="block text-xl md:text-2xl font-black text-white group-hover:text-primary transition-colors">
                                            {stats.setlistsCount}
                                        </span>
                                        <span className="text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-wider">
                                            Folder Setlist
                                        </span>
                                    </div>

                                    {/* Stats 3: Song Notes */}
                                    <div className="bg-black/50 border border-white/10 rounded-2xl p-3.5 md:p-4 text-center hover:border-cyan-500/40 transition-all group">
                                        <div className="w-8 h-8 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 flex items-center justify-center mx-auto mb-2 group-hover:scale-110 transition-transform">
                                            <FileText className="w-4 h-4" />
                                        </div>
                                        <span className="block text-xl md:text-2xl font-black text-white group-hover:text-cyan-400 transition-colors">
                                            {stats.notesCount}
                                        </span>
                                        <span className="text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-wider">
                                            Catatan
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* TABBED NAVIGATION SYSTEM */}
                        <div className="flex flex-wrap items-center gap-2 md:gap-3 border-b border-white/10 pb-4">
                            <button
                                onClick={() => setActiveTab("favorites")}
                                className={`px-4 py-2.5 rounded-xl text-xs md:text-sm font-black tracking-wider uppercase transition-all flex items-center gap-2 cursor-pointer ${
                                    activeTab === "favorites"
                                        ? "bg-rose-500 text-white shadow-[0_0_20px_rgba(244,63,94,0.5)] border border-rose-400"
                                        : "bg-surface/60 text-slate-400 hover:text-white border border-white/10"
                                }`}
                            >
                                <Heart
                                    className={`w-4 h-4 ${
                                        activeTab === "favorites"
                                            ? "fill-white"
                                            : "text-rose-400"
                                    }`}
                                />
                                <span>
                                    Lagu Disukai ({favoriteSongs.length})
                                </span>
                            </button>

                            <button
                                onClick={() => setActiveTab("setlists")}
                                className={`px-4 py-2.5 rounded-xl text-xs md:text-sm font-black tracking-wider uppercase transition-all flex items-center gap-2 cursor-pointer ${
                                    activeTab === "setlists"
                                        ? "bg-primary text-white shadow-[0_0_20px_rgba(168,85,247,0.5)] border border-primary-light"
                                        : "bg-surface/60 text-slate-400 hover:text-white border border-white/10"
                                }`}
                            >
                                <Folder className="w-4 h-4" />
                                <span>Setlist Saya ({setlists.length})</span>
                            </button>

                            <button
                                onClick={() => setActiveTab("notes")}
                                className={`px-4 py-2.5 rounded-xl text-xs md:text-sm font-black tracking-wider uppercase transition-all flex items-center gap-2 cursor-pointer ${
                                    activeTab === "notes"
                                        ? "bg-cyan-500 text-slate-950 font-black shadow-[0_0_20px_rgba(6,182,212,0.5)] border border-cyan-300"
                                        : "bg-surface/60 text-slate-400 hover:text-white border border-white/10"
                                }`}
                            >
                                <FileText className="w-4 h-4" />
                                <span>
                                    Catatan Pribadi ({notesList.length})
                                </span>
                            </button>

                            <button
                                onClick={() => setActiveTab("settings")}
                                className={`px-4 py-2.5 rounded-xl text-xs md:text-sm font-black tracking-wider uppercase transition-all flex items-center gap-2 cursor-pointer ${
                                    activeTab === "settings"
                                        ? "bg-slate-700 text-white shadow-[0_0_20px_rgba(148,163,184,0.3)] border border-slate-500"
                                        : "bg-surface/60 text-slate-400 hover:text-white border border-white/10"
                                }`}
                            >
                                <Settings className="w-4 h-4" />
                                <span>Pengaturan Akun</span>
                            </button>
                        </div>

                        {/* TAB CONTENT AREAS */}
                        {isLoading
                            ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 py-8">
                                    {[1, 2, 3, 4, 5, 6].map((i) => (
                                        <div
                                            key={i}
                                            className="h-32 bg-white/5 border border-white/10 rounded-2xl animate-pulse p-4"
                                        />
                                    ))}
                                </div>
                            )
                            : (
                                <div>
                                    {
                                        /* ==========================================
                    TAB 1: ❤️ LAGU DISUKAI
                ========================================== */
                                    }
                                    {activeTab === "favorites" && (
                                        <div>
                                            {favoriteSongs.length === 0
                                                ? (
                                                    <div className="text-center py-16 bg-surface/40 border border-white/10 rounded-3xl p-8 backdrop-blur-md">
                                                        <div className="w-16 h-16 rounded-2xl bg-rose-500/20 border border-rose-500/30 flex items-center justify-center text-rose-400 mx-auto mb-4">
                                                            <Heart className="w-8 h-8 fill-rose-500" />
                                                        </div>
                                                        <h3 className="text-lg font-bold text-white mb-1">
                                                            Belum Ada Lagu
                                                            Disukai
                                                        </h3>
                                                        <p className="text-slate-400 text-xs max-w-md mx-auto mb-6">
                                                            Jelajahi lagu di
                                                            YourChords dan klik
                                                            tombol{" "}
                                                            <span className="text-rose-400 font-bold">
                                                                Sukai (❤️)
                                                            </span>{" "}
                                                            pada lagu favorit
                                                            Anda.
                                                        </p>
                                                        <Link
                                                            href="/search"
                                                            className="inline-flex items-center gap-2 px-5 py-2.5 bg-rose-500 hover:bg-rose-600 text-white font-bold rounded-xl text-xs transition-all shadow-[0_0_20px_rgba(244,63,94,0.4)]"
                                                        >
                                                            Cari Lagu Favorit
                                                        </Link>
                                                    </div>
                                                )
                                                : (
                                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                                        {favoriteSongs.map((
                                                            song,
                                                        ) => (
                                                            <div
                                                                key={song.id}
                                                                className="bg-surface/80 border border-white/10 hover:border-rose-500/50 rounded-2xl p-4 backdrop-blur-md shadow-lg transition-all duration-300 flex flex-col justify-between group"
                                                            >
                                                                <div className="flex items-start gap-3.5 mb-3">
                                                                    <div className="w-14 h-14 rounded-xl bg-slate-900 border border-white/10 flex-shrink-0 overflow-hidden relative">
                                                                        {song
                                                                                .cover_url
                                                                            ? (
                                                                                /* eslint-disable-next-line @next/next/no-img-element */
                                                                                <img
                                                                                    src={song
                                                                                        .cover_url}
                                                                                    alt={song
                                                                                        .title}
                                                                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                                                                                />
                                                                            )
                                                                            : (
                                                                                <div className="w-full h-full flex items-center justify-center text-rose-400">
                                                                                    <Music className="w-6 h-6" />
                                                                                </div>
                                                                            )}
                                                                    </div>

                                                                    <div className="flex-1 min-w-0">
                                                                        <h3 className="text-sm font-extrabold text-white truncate group-hover:text-rose-400 transition-colors">
                                                                            {song
                                                                                .title}
                                                                        </h3>
                                                                        <p className="text-xs text-slate-400 truncate mb-1">
                                                                            {song
                                                                                .artist}
                                                                        </p>
                                                                        <div className="flex items-center gap-1.5 flex-wrap">
                                                                            <span className="px-2 py-0.5 bg-primary/20 border border-primary/40 text-primary-light text-[10px] font-mono font-bold rounded-md">
                                                                                Nada:
                                                                                {" "}
                                                                                {song
                                                                                    .key_chord ||
                                                                                    "C"}
                                                                            </span>
                                                                            <span className="px-2 py-0.5 bg-white/5 border border-white/10 text-slate-300 text-[10px] font-bold rounded-md">
                                                                                {song
                                                                                    .difficulty ||
                                                                                    "Easy"}
                                                                            </span>
                                                                        </div>
                                                                    </div>
                                                                </div>

                                                                <div className="flex items-center justify-between gap-2 pt-3 border-t border-white/10">
                                                                    <Link
                                                                        href={`/chord/${song.id}`}
                                                                        className="flex-1 text-center py-2 bg-rose-500/20 hover:bg-rose-500 border border-rose-500/40 rounded-xl text-rose-300 hover:text-white text-xs font-bold transition-all flex items-center justify-center gap-1.5"
                                                                    >
                                                                        <span>
                                                                            Buka
                                                                            Chord
                                                                        </span>
                                                                        <ExternalLink className="w-3.5 h-3.5" />
                                                                    </Link>

                                                                    <button
                                                                        onClick={() =>
                                                                            handleRemoveFavorite(
                                                                                song.id,
                                                                            )}
                                                                        className="p-2 text-slate-400 hover:text-red-400 bg-white/5 hover:bg-red-500/10 border border-white/10 hover:border-red-500/30 rounded-xl transition-all cursor-pointer"
                                                                        title="Hapus dari Favorit"
                                                                    >
                                                                        <Trash2 className="w-4 h-4" />
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                        </div>
                                    )}

                                    {
                                        /* ==========================================
                    TAB 2: 📁 SETLIST SAYA
                ========================================== */
                                    }
                                    {activeTab === "setlists" && (
                                        <div className="space-y-6">
                                            <div className="flex items-center justify-between gap-4">
                                                <div>
                                                    <h2 className="text-lg font-black text-white">
                                                        Folder Setlist Pribadi
                                                    </h2>
                                                    <p className="text-xs text-slate-400">
                                                        Susun lagu untuk
                                                        manggung atau latihan
                                                        rutin Anda
                                                    </p>
                                                </div>

                                                <button
                                                    onClick={() =>
                                                        setShowCreateModal(
                                                            true,
                                                        )}
                                                    className="px-4 py-2.5 bg-primary hover:bg-primary-light text-white font-extrabold rounded-xl text-xs transition-all shadow-[0_0_20px_rgba(168,85,247,0.4)] flex items-center gap-2 cursor-pointer"
                                                >
                                                    <FolderPlus className="w-4 h-4" />
                                                    <span>
                                                        + Buat Setlist Baru
                                                    </span>
                                                </button>
                                            </div>

                                            {setlists.length === 0
                                                ? (
                                                    <div className="text-center py-16 bg-surface/40 border border-white/10 rounded-3xl p-8 backdrop-blur-md">
                                                        <div className="w-16 h-16 rounded-2xl bg-primary/20 border border-primary/30 flex items-center justify-center text-primary mx-auto mb-4">
                                                            <Folder className="w-8 h-8" />
                                                        </div>
                                                        <h3 className="text-lg font-bold text-white mb-1">
                                                            Belum Ada Setlist
                                                        </h3>
                                                        <p className="text-slate-400 text-xs max-w-md mx-auto mb-6">
                                                            Buat folder setlist
                                                            pertama Anda untuk
                                                            mengelompokkan
                                                            lagu-lagu pilihan.
                                                        </p>
                                                        <button
                                                            onClick={() =>
                                                                setShowCreateModal(
                                                                    true,
                                                                )}
                                                            className="px-5 py-2.5 bg-primary text-white font-bold rounded-xl text-xs hover:bg-primary-light transition-all shadow-neon-sm cursor-pointer"
                                                        >
                                                            + Buat Setlist
                                                            Pertama
                                                        </button>
                                                    </div>
                                                )
                                                : (
                                                    <div className="grid grid-cols-1 gap-6">
                                                        {setlists.map((
                                                            setlist,
                                                        ) => (
                                                            <div
                                                                key={setlist.id}
                                                                className="bg-surface/80 border border-white/10 rounded-2xl p-6 backdrop-blur-md shadow-xl hover:border-primary/40 transition-all duration-300"
                                                            >
                                                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4 mb-4">
                                                                    <div>
                                                                        <div className="flex items-center gap-3">
                                                                            <h3 className="text-lg font-black text-white">
                                                                                {setlist
                                                                                    .name}
                                                                            </h3>
                                                                            <span className="px-2.5 py-0.5 bg-primary/20 border border-primary/40 text-primary-light rounded-full text-[10px] font-extrabold">
                                                                                {setlist
                                                                                    .song_ids
                                                                                    .length}
                                                                                {" "}
                                                                                Lagu
                                                                            </span>
                                                                        </div>
                                                                        {setlist
                                                                            .description &&
                                                                            (
                                                                                <p className="text-xs text-slate-400 mt-1">
                                                                                    {setlist
                                                                                        .description}
                                                                                </p>
                                                                            )}
                                                                    </div>

                                                                    <div className="flex items-center gap-2">
                                                                        <Link
                                                                            href="/search"
                                                                            className="px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-xs font-bold text-slate-300 hover:text-white transition-colors flex items-center gap-1.5"
                                                                        >
                                                                            <Plus className="w-3.5 h-3.5 text-primary" />
                                                                            <span>
                                                                                Cari
                                                                                &
                                                                                Tambah
                                                                                Lagu
                                                                            </span>
                                                                        </Link>

                                                                        <button
                                                                            onClick={() =>
                                                                                handleDeleteSetlist(
                                                                                    setlist
                                                                                        .id,
                                                                                )}
                                                                            className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors cursor-pointer"
                                                                            title="Hapus Setlist"
                                                                        >
                                                                            <Trash2 className="w-4 h-4" />
                                                                        </button>
                                                                    </div>
                                                                </div>

                                                                {/* SONG ITEMS INSIDE SETLIST */}
                                                                {setlist
                                                                        .song_ids
                                                                        .length ===
                                                                        0
                                                                    ? (
                                                                        <div className="text-center py-6 bg-black/40 border border-dashed border-white/10 rounded-xl p-4 text-slate-500 text-xs">
                                                                            Belum
                                                                            ada
                                                                            lagu
                                                                            dalam
                                                                            setlist
                                                                            ini.
                                                                        </div>
                                                                    )
                                                                    : (
                                                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                                                            {setlist
                                                                                .song_ids
                                                                                .map(
                                                                                    (
                                                                                        songId,
                                                                                    ) => {
                                                                                        const song =
                                                                                            songDetailsMap[
                                                                                                songId
                                                                                            ];
                                                                                        return (
                                                                                            <div
                                                                                                key={songId}
                                                                                                className="flex items-center justify-between gap-3 p-3 bg-black/50 hover:bg-white/5 border border-white/10 hover:border-primary/40 rounded-xl transition-all group"
                                                                                            >
                                                                                                <div className="flex items-center gap-3 overflow-hidden">
                                                                                                    <div className="w-10 h-10 rounded-lg bg-slate-900 flex-shrink-0 overflow-hidden border border-white/10">
                                                                                                        {song
                                                                                                                ?.cover_url
                                                                                                            ? (
                                                                                                                /* eslint-disable-next-line @next/next/no-img-element */
                                                                                                                <img
                                                                                                                    src={song
                                                                                                                        .cover_url}
                                                                                                                    alt={song
                                                                                                                        .title}
                                                                                                                    className="w-full h-full object-cover"
                                                                                                                />
                                                                                                            )
                                                                                                            : (
                                                                                                                <div className="w-full h-full flex items-center justify-center text-primary">
                                                                                                                    <Music className="w-4 h-4" />
                                                                                                                </div>
                                                                                                            )}
                                                                                                    </div>
                                                                                                    <div className="truncate">
                                                                                                        <p className="text-xs font-bold text-white group-hover:text-primary transition-colors truncate">
                                                                                                            {song
                                                                                                                ? song
                                                                                                                    .title
                                                                                                                : songId}
                                                                                                        </p>
                                                                                                        <p className="text-[10px] text-slate-400 truncate">
                                                                                                            {song
                                                                                                                ? song
                                                                                                                    .artist
                                                                                                                : "Memuat..."}
                                                                                                        </p>
                                                                                                    </div>
                                                                                                </div>

                                                                                                <div className="flex items-center gap-1 flex-shrink-0">
                                                                                                    <Link
                                                                                                        href={`/chord/${songId}`}
                                                                                                        className="p-1.5 bg-primary/20 hover:bg-primary border border-primary/40 rounded-lg text-primary hover:text-white transition-all cursor-pointer"
                                                                                                        title="Buka Chord"
                                                                                                    >
                                                                                                        <ExternalLink className="w-3.5 h-3.5" />
                                                                                                    </Link>
                                                                                                    <button
                                                                                                        onClick={() =>
                                                                                                            handleRemoveSongFromSetlist(
                                                                                                                setlist
                                                                                                                    .id,
                                                                                                                songId,
                                                                                                            )}
                                                                                                        className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
                                                                                                        title="Keluarkan dari setlist"
                                                                                                    >
                                                                                                        <X className="w-3.5 h-3.5" />
                                                                                                    </button>
                                                                                                </div>
                                                                                            </div>
                                                                                        );
                                                                                    },
                                                                                )}
                                                                        </div>
                                                                    )}
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                        </div>
                                    )}

                                    {
                                        /* ==========================================
                    TAB 3: 📝 CATATAN PRIBADI SAYA
                ========================================== */
                                    }
                                    {activeTab === "notes" && (
                                        <div>
                                            {notesList.length === 0
                                                ? (
                                                    <div className="text-center py-16 bg-surface/40 border border-white/10 rounded-3xl p-8 backdrop-blur-md">
                                                        <div className="w-16 h-16 rounded-2xl bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400 mx-auto mb-4">
                                                            <FileText className="w-8 h-8" />
                                                        </div>
                                                        <h3 className="text-lg font-bold text-white mb-1">
                                                            Belum Ada Catatan
                                                            Pribadi
                                                        </h3>
                                                        <p className="text-slate-400 text-xs max-w-md mx-auto mb-6">
                                                            Anda dapat menulis
                                                            catatan genjrengan,
                                                            tempo BPM, atau
                                                            pengingat nada di
                                                            halaman chord lagu.
                                                        </p>
                                                        <Link
                                                            href="/search"
                                                            className="inline-flex items-center gap-2 px-5 py-2.5 bg-cyan-500 text-slate-950 font-extrabold rounded-xl text-xs hover:bg-cyan-400 transition-all shadow-[0_0_20px_rgba(6,182,212,0.4)]"
                                                        >
                                                            Cari Lagu & Tulis
                                                            Catatan
                                                        </Link>
                                                    </div>
                                                )
                                                : (
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                        {notesList.map((
                                                            item,
                                                        ) => (
                                                            <div
                                                                key={item.id}
                                                                className="bg-surface/80 border border-white/10 hover:border-cyan-500/50 rounded-2xl p-5 backdrop-blur-md shadow-lg transition-all duration-300 flex flex-col justify-between group"
                                                            >
                                                                <div>
                                                                    {/* Song Header */}
                                                                    <div className="flex items-center justify-between gap-3 mb-3 pb-3 border-b border-white/10">
                                                                        <div className="flex items-center gap-3 overflow-hidden">
                                                                            <div className="w-10 h-10 rounded-xl bg-slate-900 border border-white/10 flex-shrink-0 overflow-hidden relative">
                                                                                {item
                                                                                        .song
                                                                                        ?.cover_url
                                                                                    ? (
                                                                                        /* eslint-disable-next-line @next/next/no-img-element */
                                                                                        <img
                                                                                            src={item
                                                                                                .song
                                                                                                .cover_url}
                                                                                            alt={item
                                                                                                .song
                                                                                                .title}
                                                                                            className="w-full h-full object-cover"
                                                                                        />
                                                                                    )
                                                                                    : (
                                                                                        <div className="w-full h-full flex items-center justify-center text-cyan-400">
                                                                                            <Music className="w-5 h-5" />
                                                                                        </div>
                                                                                    )}
                                                                            </div>

                                                                            <div className="truncate">
                                                                                <h3 className="text-sm font-extrabold text-white truncate group-hover:text-cyan-400 transition-colors">
                                                                                    {item
                                                                                            .song
                                                                                        ? item
                                                                                            .song
                                                                                            .title
                                                                                        : "Lagu"}
                                                                                </h3>
                                                                                <p className="text-xs text-slate-400 truncate">
                                                                                    {item
                                                                                            .song
                                                                                        ? item
                                                                                            .song
                                                                                            .artist
                                                                                        : "Artis"}
                                                                                </p>
                                                                            </div>
                                                                        </div>

                                                                        <span className="text-[10px] text-slate-400 flex items-center gap-1 bg-black/40 px-2 py-1 rounded-lg border border-white/5 flex-shrink-0">
                                                                            <Clock className="w-3 h-3 text-cyan-400" />
                                                                            {new Date(
                                                                                item.updated_at,
                                                                            ).toLocaleDateString(
                                                                                "id-ID",
                                                                                {
                                                                                    day: "numeric",
                                                                                    month:
                                                                                        "short",
                                                                                },
                                                                            )}
                                                                        </span>
                                                                    </div>

                                                                    {/* Note Content Preview */}
                                                                    <div className="bg-black/60 border border-cyan-500/20 rounded-xl p-3 mb-4 text-xs font-mono text-cyan-200/90 whitespace-pre-wrap leading-relaxed max-h-28 overflow-y-auto">
                                                                        {item
                                                                            .notes_content}
                                                                    </div>
                                                                </div>

                                                                <Link
                                                                    href={`/chord/${item.song_id}`}
                                                                    className="w-full text-center py-2 bg-cyan-500/10 hover:bg-cyan-500 border border-cyan-500/30 text-cyan-300 hover:text-slate-950 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                                                                >
                                                                    <span>
                                                                        Buka
                                                                        Lagu &
                                                                        Edit
                                                                        Catatan
                                                                    </span>
                                                                    <ExternalLink className="w-3.5 h-3.5" />
                                                                </Link>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                        </div>
                                    )}

                                    {
                                        /* ==========================================
                    TAB 4: ⚙️ PENGATURAN AKUN
                ========================================== */
                                    }
                                    {activeTab === "settings" && (
                                        <div className="max-w-2xl mx-auto space-y-6">
                                            {/* PROFILE EDIT FORM */}
                                            <div className="bg-surface/80 border border-white/10 rounded-2xl p-6 md:p-8 backdrop-blur-md shadow-xl">
                                                <div className="flex items-center gap-3 mb-6">
                                                    <div className="w-10 h-10 rounded-xl bg-primary/20 border border-primary/40 flex items-center justify-center text-primary">
                                                        <UserIcon className="w-5 h-5" />
                                                    </div>
                                                    <div>
                                                        <h2 className="text-lg font-black text-white">
                                                            Profil Pengguna
                                                        </h2>
                                                        <p className="text-xs text-slate-400">
                                                            Perbarui informasi
                                                            nama profil Anda
                                                        </p>
                                                    </div>
                                                </div>

                                                {profileSaveSuccess && (
                                                    <div className="mb-5 p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-400 text-xs font-bold flex items-center gap-2">
                                                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                                                        <span>
                                                            Nama profil berhasil
                                                            diperbarui!
                                                        </span>
                                                    </div>
                                                )}

                                                <form
                                                    onSubmit={handleSaveProfile}
                                                    className="space-y-4"
                                                >
                                                    <div>
                                                        <label className="block text-xs font-bold text-slate-300 mb-1.5 uppercase tracking-wider">
                                                            Nama Lengkap / Nama
                                                            Tampilan
                                                        </label>
                                                        <input
                                                            type="text"
                                                            value={displayName}
                                                            onChange={(e) =>
                                                                setDisplayName(
                                                                    e.target
                                                                        .value,
                                                                )}
                                                            placeholder="Tulis nama Anda..."
                                                            className="w-full bg-black/60 border border-white/15 rounded-xl px-4 py-3 text-xs md:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-primary transition-all"
                                                        />
                                                    </div>

                                                    <div>
                                                        <label className="block text-xs font-bold text-slate-300 mb-1.5 uppercase tracking-wider">
                                                            Alamat Email
                                                            (Terverifikasi)
                                                        </label>
                                                        <input
                                                            type="email"
                                                            disabled
                                                            value={user.email ||
                                                                ""}
                                                            className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-xs md:text-sm text-slate-400 cursor-not-allowed opacity-80"
                                                        />
                                                    </div>

                                                    <div className="pt-2 flex justify-end">
                                                        <button
                                                            type="submit"
                                                            disabled={isUpdatingProfile ||
                                                                !displayName
                                                                    .trim()}
                                                            className="px-6 py-2.5 bg-primary hover:bg-primary-light text-white font-extrabold rounded-xl text-xs md:text-sm transition-all shadow-[0_0_20px_rgba(168,85,247,0.4)] flex items-center gap-2 cursor-pointer disabled:opacity-50"
                                                        >
                                                            {isUpdatingProfile
                                                                ? (
                                                                    <>
                                                                        <Loader2 className="w-4 h-4 animate-spin" />
                                                                        <span>
                                                                            Menyimpan...
                                                                        </span>
                                                                    </>
                                                                )
                                                                : (
                                                                    <>
                                                                        <Save className="w-4 h-4" />
                                                                        <span>
                                                                            Simpan
                                                                            Perubahan
                                                                        </span>
                                                                    </>
                                                                )}
                                                        </button>
                                                    </div>
                                                </form>
                                            </div>

                                            {/* ACCOUNT METADATA CARD */}
                                            <div className="bg-surface/80 border border-white/10 rounded-2xl p-6 backdrop-blur-md shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                                                <div>
                                                    <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 text-[10px] font-bold uppercase mb-1">
                                                        <ShieldCheck className="w-3.5 h-3.5" />
                                                        {" "}
                                                        Akun Aktif & Terlindungi
                                                    </div>
                                                    <p className="text-xs text-slate-300 font-mono">
                                                        ID Akun: {user.id}
                                                    </p>
                                                </div>

                                                <button
                                                    onClick={signOut}
                                                    className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer"
                                                >
                                                    <LogOut className="w-4 h-4" />
                                                    <span>
                                                        Sign Out (Keluar Akun)
                                                    </span>
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                    </div>
                )}

                {/* CREATE SETLIST MODAL */}
                {showCreateModal && user && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
                        <div className="relative w-full max-w-md bg-surface border border-white/15 rounded-2xl p-6 shadow-[0_0_50px_rgba(168,85,247,0.3)] text-white">
                            <button
                                onClick={() => setShowCreateModal(false)}
                                className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white bg-white/5 rounded-full cursor-pointer"
                            >
                                <X className="w-4 h-4" />
                            </button>

                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-10 h-10 rounded-xl bg-primary/20 border border-primary/40 flex items-center justify-center text-primary">
                                    <FolderPlus className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-black text-white">
                                        Buat Setlist Baru
                                    </h3>
                                    <p className="text-slate-400 text-xs">
                                        Buat folder untuk menyimpan daftar lagu
                                        manggung
                                    </p>
                                </div>
                            </div>

                            <form
                                onSubmit={handleCreateSetlistSubmit}
                                className="space-y-4"
                            >
                                <div>
                                    <label className="block text-xs font-bold text-slate-300 mb-1.5 uppercase tracking-wider">
                                        Nama Setlist{" "}
                                        <span className="text-primary">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="Contoh: Nongkrong Cafe, Acoustic Night"
                                        value={newSetlistName}
                                        onChange={(e) =>
                                            setNewSetlistName(e.target.value)}
                                        className="w-full bg-black/60 border border-white/15 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-primary"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-300 mb-1.5 uppercase tracking-wider">
                                        Deskripsi (Opsional)
                                    </label>
                                    <textarea
                                        rows={3}
                                        placeholder="Catatan singkat tentang setlist ini..."
                                        value={newSetlistDesc}
                                        onChange={(e) =>
                                            setNewSetlistDesc(e.target.value)}
                                        className="w-full bg-black/60 border border-white/15 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-primary resize-none"
                                    />
                                </div>

                                <div className="flex justify-end gap-2 pt-2">
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setShowCreateModal(false)}
                                        className="px-4 py-2 bg-white/5 border border-white/10 text-slate-300 rounded-xl text-xs font-bold hover:bg-white/10 transition-colors cursor-pointer"
                                    >
                                        Batal
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={isCreatingSetlist}
                                        className="px-5 py-2 bg-primary text-white font-bold rounded-xl text-xs hover:bg-primary-light transition-all shadow-neon-sm cursor-pointer disabled:opacity-50"
                                    >
                                        {isCreatingSetlist
                                            ? "Menyimpan..."
                                            : "Buat Setlist"}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* AUTH MODAL FOR UNREGISTERED VISITORS */}
                <AuthModal
                    isOpen={showAuthModal && !user}
                    onClose={() => setShowAuthModal(false)}
                    initialMode={authModalMode}
                />
            </main>
        </div>
    );
}
