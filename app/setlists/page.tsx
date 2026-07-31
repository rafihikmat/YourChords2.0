"use client";

import React, { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import {
  createSetlist,
  deleteSetlist,
  getUserFavorites,
  getUserSetlists,
  removeSongFromSetlist,
} from "@/lib/setlists";
import { fetchSongById } from "@/lib/supabase";
import { Setlist, Song } from "@/lib/types";
import { useAuth } from "@/lib/authContext";
import AuthModal from "@/components/AuthModal";
import {
  BookOpen,
  ExternalLink,
  FolderPlus,
  Heart,
  Home,
  Library,
  ListMusic,
  Lock,
  Music,
  Plus,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";
import Link from "next/link";

export default function SetlistsPage() {
  const { user, loading: authLoading } = useAuth();

  const [activeTab, setActiveTab] = useState<"setlists" | "favorites">(
    "setlists",
  );
  const [setlists, setlistsState] = useState<Setlist[]>([]);
  const [favorites, setFavoritesState] = useState<Song[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Create Setlist Modal state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  // Auth Modal state for guest visitors
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<"signin" | "signup">(
    "signin",
  );

  const [songDetailsMap, setSongDetailsMap] = useState<Record<string, Song>>(
    {},
  );

  // Auto-trigger auth modal if unauthenticated visitor lands here
  useEffect(() => {
    if (!authLoading && !user) {
      setShowAuthModal(true);
    }
  }, [authLoading, user]);

  const loadData = async () => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    // Fetch user setlists and favorites in parallel
    const [setlistData, favoriteData] = await Promise.all([
      getUserSetlists(user.id),
      getUserFavorites(user.id),
    ]);

    setlistsState(setlistData);
    setFavoritesState(favoriteData);

    // Fetch details for all unique song IDs across all setlists
    const allSongIds = Array.from(
      new Set(setlistData.flatMap((s) => s.song_ids)),
    );
    const detailsMap: Record<string, Song> = {};

    await Promise.all(
      allSongIds.map(async (id) => {
        const song = await fetchSongById(id);
        if (song) {
          detailsMap[id] = song;
        }
      }),
    );

    setSongDetailsMap(detailsMap);
    setIsLoading(false);
  };

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const handleCreateSetlist = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !user) return;

    setIsCreating(true);
    const created = await createSetlist(user.id, newName, newDescription);
    setIsCreating(false);

    if (created) {
      setNewName("");
      setNewDescription("");
      setShowCreateModal(false);
      loadData();
    }
  };

  const handleRemoveSong = async (setlistId: string, songId: string) => {
    if (!user) return;
    await removeSongFromSetlist(setlistId, songId, user.id);
    loadData();
  };

  const handleDeleteSetlist = async (setlistId: string) => {
    if (!user) return;
    if (confirm("Apakah Anda yakin ingin menghapus folder setlist ini?")) {
      await deleteSetlist(setlistId, user.id);
      loadData();
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white font-sans relative pb-24">
      <Navbar />

      <main className="max-w-[1200px] mx-auto px-4 md:px-8 pt-24">
        {/* HERO HEADER */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 bg-gradient-to-r from-slate-900/90 via-primary/10 to-slate-900/90 p-6 md:p-8 rounded-2xl border border-primary/30 backdrop-blur-xl shadow-[0_0_50px_rgba(168,85,247,0.15)] relative overflow-hidden">
          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/20 border border-primary/40 text-primary-light text-xs font-bold mb-3">
              <Library className="w-3.5 h-3.5 text-primary" />{" "}
              MEMBER SONGBOOK & SETLIST MANAGER
            </div>
            <h1 className="text-2xl md:text-4xl font-black tracking-tight text-white mb-2">
              Setlist &{" "}
              <span className="text-primary neon-text">Lagu Favorit Saya</span>
            </h1>
            <p className="text-slate-400 text-xs md:text-sm max-w-xl">
              Ruang pribadi untuk menyusun daftar lagu manggung, latihan, dan
              koleksi chord favorit Anda yang tersimpan aman di database.
            </p>
          </div>

          {user && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="relative z-10 px-5 py-3 bg-primary hover:bg-primary-light text-white font-extrabold rounded-xl text-xs md:text-sm transition-all shadow-[0_0_25px_rgba(168,85,247,0.5)] hover:shadow-[0_0_35px_rgba(168,85,247,0.8)] flex items-center gap-2 cursor-pointer self-start md:self-auto"
            >
              <FolderPlus className="w-4 h-4" />
              <span>Buat Setlist Baru</span>
            </button>
          )}
        </div>

        {/* AUTH GUARD: UNAUTHENTICATED USER RESTRICTED BANNER */}
        {!authLoading && !user && (
          <div className="max-w-2xl mx-auto my-12 bg-gradient-to-b from-slate-900/90 via-surface/80 to-slate-950 border border-primary/40 rounded-3xl p-8 md:p-12 backdrop-blur-2xl text-center shadow-[0_0_80px_rgba(168,85,247,0.25)] relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl pointer-events-none" />

            <div className="w-20 h-20 rounded-3xl bg-primary/20 border-2 border-primary/50 flex items-center justify-center text-primary mx-auto mb-6 shadow-[0_0_30px_rgba(168,85,247,0.4)] animate-bounce-slow">
              <Lock className="w-10 h-10 text-primary" />
            </div>

            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-bold mb-4">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />{" "}
              RESTRIKSI HAK AKSES
            </div>

            <h2 className="text-2xl md:text-3xl font-black text-white mb-3">
              Akses Terbatas: Khusus Member Registered
            </h2>

            <p className="text-slate-300 text-xs md:text-sm leading-relaxed max-w-lg mx-auto mb-8">
              Silakan <span className="text-primary font-bold">Sign In</span>
              {" "}
              atau <span className="text-primary font-bold">Sign Up</span>{" "}
              terlebih dahulu untuk membuat, menyimpan, dan mengelola folder
              Setlist pribadi serta koleksi chord lagu favorit Anda secara aman.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                onClick={() => {
                  setAuthModalMode("signin");
                  setShowAuthModal(true);
                }}
                className="w-full sm:w-auto px-6 py-3 bg-primary hover:bg-primary-light text-white font-extrabold rounded-xl text-xs md:text-sm transition-all shadow-[0_0_20px_rgba(168,85,247,0.5)] cursor-pointer"
              >
                Sign In
              </button>

              <button
                onClick={() => {
                  setAuthModalMode("signup");
                  setShowAuthModal(true);
                }}
                className="w-full sm:w-auto px-6 py-3 bg-white/10 hover:bg-white/20 border border-white/20 text-white font-extrabold rounded-xl text-xs md:text-sm transition-all cursor-pointer"
              >
                Daftar Akun Baru (Gratis)
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

        {/* LOGGED IN USER CONTENT */}
        {user && (
          <>
            {/* TABS NAVIGATION */}
            <div className="flex items-center gap-3 border-b border-white/10 pb-4 mb-8">
              <button
                onClick={() => setActiveTab("setlists")}
                className={`px-4 py-2.5 rounded-xl text-xs font-black tracking-wider uppercase transition-all flex items-center gap-2 cursor-pointer ${
                  activeTab === "setlists"
                    ? "bg-primary text-white shadow-[0_0_20px_rgba(168,85,247,0.5)] border border-primary-light"
                    : "bg-surface/60 text-slate-400 hover:text-white border border-white/10"
                }`}
              >
                <ListMusic className="w-4 h-4" />
                <span>Folder Setlist ({setlists.length})</span>
              </button>

              <button
                onClick={() => setActiveTab("favorites")}
                className={`px-4 py-2.5 rounded-xl text-xs font-black tracking-wider uppercase transition-all flex items-center gap-2 cursor-pointer ${
                  activeTab === "favorites"
                    ? "bg-rose-500 text-white shadow-[0_0_20px_rgba(244,63,94,0.5)] border border-rose-400"
                    : "bg-surface/60 text-slate-400 hover:text-white border border-white/10"
                }`}
              >
                <Heart className="w-4 h-4 text-rose-400 fill-rose-400" />
                <span>Lagu Disukai ({favorites.length})</span>
              </button>
            </div>

            {/* LOADING STATE */}
            {isLoading || authLoading
              ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {[1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className="h-44 bg-white/5 border border-white/10 rounded-2xl animate-pulse p-6"
                    />
                  ))}
                </div>
              )
              : activeTab === "setlists"
              ? (
                /* TAB 1: SETLISTS */
                setlists.length === 0
                  ? (
                    <div className="text-center py-16 bg-surface/50 border border-white/10 rounded-2xl p-8 backdrop-blur-md">
                      <div className="w-16 h-16 rounded-2xl bg-primary/20 border border-primary/30 flex items-center justify-center text-primary mx-auto mb-4">
                        <BookOpen className="w-8 h-8" />
                      </div>
                      <h3 className="text-lg font-bold text-white mb-1">
                        Belum Ada Setlist
                      </h3>
                      <p className="text-slate-400 text-xs max-w-md mx-auto mb-6">
                        Buat folder setlist pertama Anda sekarang untuk
                        menyimpan koleksi chord lagu manggung atau latihan.
                      </p>
                      <button
                        onClick={() => setShowCreateModal(true)}
                        className="px-5 py-2.5 bg-primary text-white font-bold rounded-xl text-xs hover:bg-primary-light transition-all shadow-neon-sm cursor-pointer"
                      >
                        + Buat Setlist Pertama
                      </button>
                    </div>
                  )
                  : (
                    <div className="grid grid-cols-1 gap-8">
                      {setlists.map((setlist) => (
                        <div
                          key={setlist.id}
                          className="bg-surface/80 border border-white/10 rounded-2xl p-6 backdrop-blur-md shadow-xl hover:border-primary/40 transition-all duration-300"
                        >
                          {/* SETLIST HEADER */}
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4 mb-5">
                            <div>
                              <div className="flex items-center gap-3">
                                <h2 className="text-xl font-black text-white">
                                  {setlist.name}
                                </h2>
                                <span className="px-2.5 py-0.5 bg-primary/20 border border-primary/40 text-primary-light rounded-full text-[10px] font-extrabold">
                                  {setlist.song_ids.length} Lagu
                                </span>
                              </div>
                              {setlist.description && (
                                <p className="text-xs text-slate-400 mt-1">
                                  {setlist.description}
                                </p>
                              )}
                            </div>

                            <div className="flex items-center gap-2">
                              <Link
                                href="/search"
                                className="px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-xs font-bold text-slate-300 hover:text-white transition-colors flex items-center gap-1.5"
                              >
                                <Plus className="w-3.5 h-3.5 text-primary" />
                                <span>Tambah Lagu</span>
                              </Link>
                              <button
                                onClick={() => handleDeleteSetlist(setlist.id)}
                                className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg border border-transparent hover:border-red-500/20 transition-colors cursor-pointer"
                                title="Hapus Setlist"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>

                          {/* SONGS IN SETLIST */}
                          {setlist.song_ids.length === 0
                            ? (
                              <div className="text-center py-8 bg-black/40 border border-dashed border-white/10 rounded-xl p-4 text-slate-500 text-xs">
                                Belum ada lagu dalam setlist ini. Cari lagu di
                                YourChords dan klik{" "}
                                <span className="text-primary font-bold">
                                  Setlist (+)
                                </span>{" "}
                                untuk menambahkan.
                              </div>
                            )
                            : (
                              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                {setlist.song_ids.map((songId) => {
                                  const song = songDetailsMap[songId];
                                  return (
                                    <div
                                      key={songId}
                                      className="flex items-center justify-between gap-3 p-3 bg-black/50 hover:bg-white/5 border border-white/10 hover:border-primary/40 rounded-xl transition-all group"
                                    >
                                      <div className="flex items-center gap-3 overflow-hidden">
                                        <div className="w-10 h-10 rounded-lg bg-surface flex-shrink-0 overflow-hidden border border-white/10">
                                          {song?.cover_url
                                            ? (
                                              /* eslint-disable-next-line @next/next/no-img-element */
                                              <img
                                                src={song.cover_url}
                                                alt={song.title}
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
                                            {song ? song.title : songId}
                                          </p>
                                          <p className="text-[10px] text-slate-400 truncate">
                                            {song ? song.artist : "Loading..."}
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
                                            handleRemoveSong(
                                              setlist.id,
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
                                })}
                              </div>
                            )}
                        </div>
                      ))}
                    </div>
                  )
              )
              : (
                /* TAB 2: FAVORITES */
                favorites.length === 0
                  ? (
                    <div className="text-center py-16 bg-surface/50 border border-white/10 rounded-2xl p-8 backdrop-blur-md">
                      <div className="w-16 h-16 rounded-2xl bg-rose-500/20 border border-rose-500/30 flex items-center justify-center text-rose-400 mx-auto mb-4">
                        <Heart className="w-8 h-8 fill-rose-500" />
                      </div>
                      <h3 className="text-lg font-bold text-white mb-1">
                        Belum Ada Lagu Disukai
                      </h3>
                      <p className="text-slate-400 text-xs max-w-md mx-auto mb-6">
                        Buka halaman chord lagu mana saja dan klik tombol{" "}
                        <span className="text-rose-400 font-bold">
                          Sukai (❤️)
                        </span>{" "}
                        untuk memasukkannya ke daftar favorit Anda.
                      </p>
                      <Link
                        href="/search"
                        className="inline-flex items-center gap-2 px-5 py-2.5 bg-rose-500 text-white font-bold rounded-xl text-xs hover:bg-rose-600 transition-all shadow-[0_0_20px_rgba(244,63,94,0.4)]"
                      >
                        Eksplorasi Katalog Lagu
                      </Link>
                    </div>
                  )
                  : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {favorites.map((song) => (
                        <div
                          key={song.id}
                          className="flex items-center justify-between gap-3 p-3.5 bg-surface/80 hover:bg-white/5 border border-white/10 hover:border-rose-500/40 rounded-xl transition-all group"
                        >
                          <div className="flex items-center gap-3 overflow-hidden">
                            <div className="w-12 h-12 rounded-lg bg-surface flex-shrink-0 overflow-hidden border border-white/10 relative">
                              {song.cover_url
                                ? (
                                  /* eslint-disable-next-line @next/next/no-img-element */
                                  <img
                                    src={song.cover_url}
                                    alt={song.title}
                                    className="w-full h-full object-cover"
                                  />
                                )
                                : (
                                  <div className="w-full h-full flex items-center justify-center text-rose-400">
                                    <Music className="w-5 h-5" />
                                  </div>
                                )}
                            </div>
                            <div className="truncate">
                              <p className="text-xs font-extrabold text-white group-hover:text-rose-400 transition-colors truncate">
                                {song.title}
                              </p>
                              <p className="text-[11px] text-slate-400 truncate">
                                {song.artist}
                              </p>
                            </div>
                          </div>

                          <Link
                            href={`/chord/${song.id}`}
                            className="px-3 py-1.5 bg-rose-500/20 hover:bg-rose-500 border border-rose-500/40 rounded-lg text-rose-300 hover:text-white text-xs font-bold transition-all flex items-center gap-1 flex-shrink-0"
                          >
                            <span>Mainkan</span>
                            <ExternalLink className="w-3 h-3" />
                          </Link>
                        </div>
                      ))}
                    </div>
                  )
              )}
          </>
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
                    Buat folder untuk menyimpan daftar lagu manggung
                  </p>
                </div>
              </div>

              <form onSubmit={handleCreateSetlist} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5 uppercase tracking-wider">
                    Nama Setlist <span className="text-primary">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Nongkrong Cafe, Acoustic Night"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
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
                    value={newDescription}
                    onChange={(e) => setNewDescription(e.target.value)}
                    className="w-full bg-black/60 border border-white/15 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-primary resize-none"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="px-4 py-2 bg-white/5 border border-white/10 text-slate-300 rounded-xl text-xs font-bold hover:bg-white/10 transition-colors cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={isCreating}
                    className="px-5 py-2 bg-primary text-white font-bold rounded-xl text-xs hover:bg-primary-light transition-all shadow-neon-sm cursor-pointer disabled:opacity-50"
                  >
                    {isCreating ? "Menyimpan..." : "Buat Setlist"}
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
