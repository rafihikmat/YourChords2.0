"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { 
  ArrowLeft, Sparkles, Pin, PinOff, Plus, Trash2, Search, Youtube, 
  RefreshCw, CheckCircle2, AlertTriangle, X, Play, Music, Layout, ArrowUp, ArrowDown
} from "lucide-react";
import { 
  getFeaturedHeroSongs, toggleSongFeaturedStatus, 
  getVideoTutorials, addVideoTutorial, deleteVideoTutorial, VideoTutorial 
} from "@/lib/adminCurated";
import { fetchAllSongs, searchSongs } from "@/lib/supabase";
import { Song } from "@/lib/types";

export default function AdminCuratedPage() {
  // Hero Carousel State
  const [featuredSongs, setFeaturedSongs] = useState<Song[]>([]);
  const [loadingHero, setLoadingHero] = useState(true);

  // Pin Modal State
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [songSearchQuery, setSongSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Song[]>([]);
  const [searching, setSearching] = useState(false);

  // Video Tutorial Manager State
  const [selectedSongForTutorial, setSelectedSongForTutorial] = useState<Song | null>(null);
  const [tutorials, setTutorials] = useState<VideoTutorial[]>([]);
  const [loadingTutorials, setLoadingTutorials] = useState(false);
  const [videoTitle, setVideoTitle] = useState("");
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [addingTutorial, setAddingTutorial] = useState(false);

  // Toast State
  const [toast, setToast] = useState<{ text: string; type: "success" | "error" } | null>(null);

  // Load Hero Songs
  const loadHeroSongs = useCallback(async () => {
    setLoadingHero(true);
    const songs = await getFeaturedHeroSongs();
    setFeaturedSongs(songs);
    setLoadingHero(false);
  }, []);

  useEffect(() => {
    loadHeroSongs();
  }, [loadHeroSongs]);

  // Handle Search for Pin Modal
  const handleSearchSongs = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setSearching(true);
    if (!songSearchQuery.trim()) {
      const all = await fetchAllSongs(20);
      setSearchResults(all);
    } else {
      const results = await searchSongs(songSearchQuery);
      setSearchResults(results);
    }
    setSearching(false);
  };

  useEffect(() => {
    if (isPinModalOpen) {
      handleSearchSongs();
    }
  }, [isPinModalOpen]);

  // Handle Pin Song to Hero
  const handlePinSong = async (song: Song) => {
    const nextOrder = featuredSongs.length + 1;
    const res = await toggleSongFeaturedStatus(song.id, true, nextOrder);

    if (res.success) {
      setToast({ text: `Berhasil menambahkan "${song.title}" ke Hero Carousel!`, type: "success" });
      setIsPinModalOpen(false);
      loadHeroSongs();
    } else {
      setToast({ text: res.error || "Gagal pin lagu.", type: "error" });
    }
  };

  // Handle Unpin Song from Hero
  const handleUnpinSong = async (song: Song) => {
    const res = await toggleSongFeaturedStatus(song.id, false, 0);

    if (res.success) {
      setToast({ text: `Lagu "${song.title}" telah dilepas dari Hero Carousel.`, type: "success" });
      loadHeroSongs();
    } else {
      setToast({ text: res.error || "Gagal unpin lagu.", type: "error" });
    }
  };

  // Handle Order Change for Featured Songs
  const handleOrderChange = async (song: Song, direction: 'up' | 'down', currentIndex: number) => {
    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (targetIndex < 0 || targetIndex >= featuredSongs.length) return;

    const otherSong = featuredSongs[targetIndex];
    const order1 = targetIndex + 1;
    const order2 = currentIndex + 1;

    await toggleSongFeaturedStatus(song.id, true, order1);
    await toggleSongFeaturedStatus(otherSong.id, true, order2);
    
    setToast({ text: "Urutan Hero Carousel berhasil diperbarui!", type: "success" });
    loadHeroSongs();
  };

  // Handle Select Song for Video Tutorial Management
  const handleSelectSongForTutorial = async (song: Song) => {
    setSelectedSongForTutorial(song);
    setLoadingTutorials(true);
    const data = await getVideoTutorials(song.id);
    setTutorials(data);
    setLoadingTutorials(false);
  };

  // Handle Add Video Tutorial
  const handleAddTutorial = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSongForTutorial) {
      setToast({ text: "Pilih lagu terlebih dahulu!", type: "error" });
      return;
    }

    setAddingTutorial(true);
    const res = await addVideoTutorial(selectedSongForTutorial.id, youtubeUrl, videoTitle);
    setAddingTutorial(false);

    if (res.success) {
      setToast({ text: "Video tutorial berhasil ditambahkan!", type: "success" });
      setVideoTitle("");
      setYoutubeUrl("");
      // Refresh list
      const updated = await getVideoTutorials(selectedSongForTutorial.id);
      setTutorials(updated);
    } else {
      setToast({ text: res.error || "Gagal menambahkan tutorial.", type: "error" });
    }
  };

  // Handle Delete Video Tutorial
  const handleDeleteTutorial = async (tutorialId: string) => {
    if (!confirm("Apakah Anda yakin ingin menghapus video tutorial ini?")) return;

    const res = await deleteVideoTutorial(tutorialId);
    if (res.success) {
      setToast({ text: "Video tutorial berhasil dihapus.", type: "success" });
      if (selectedSongForTutorial) {
        const updated = await getVideoTutorials(selectedSongForTutorial.id);
        setTutorials(updated);
      }
    } else {
      setToast({ text: res.error || "Gagal menghapus tutorial.", type: "error" });
    }
  };

  return (
    <div className="min-h-screen bg-black text-slate-100 pb-24">
      
      {/* HEADER NAVIGATION */}
      <header className="sticky top-0 z-40 bg-surface/90 border-b border-white/10 backdrop-blur-xl px-4 md:px-8 py-4 flex items-center justify-between shadow-2xl">
        <div className="flex items-center gap-3">
          <Link
            href="/admin"
            className="p-2.5 bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white rounded-xl transition-all flex items-center justify-center cursor-pointer"
            title="Kembali ke Dashboard Admin"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono font-bold bg-primary/20 text-primary border border-primary/30 px-2 py-0.5 rounded-md uppercase">
                CMS Curator Engine
              </span>
            </div>
            <h1 className="text-lg md:text-xl font-black text-white truncate mt-0.5">
              Pengelola Konten Utama Beranda & Tutorial
            </h1>
          </div>
        </div>

        <Link
          href="/"
          target="_blank"
          className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white text-xs font-bold rounded-xl border border-white/10 transition-all flex items-center gap-2"
        >
          <Layout className="w-3.5 h-3.5 text-primary" />
          <span>Lihat Live Beranda</span>
        </Link>
      </header>

      {/* TOAST NOTIFICATION */}
      {toast && (
        <div className="fixed top-20 right-4 z-50 animate-bounce">
          <div className={`p-4 rounded-xl border text-xs font-bold flex items-center gap-3 shadow-2xl backdrop-blur-xl ${
            toast.type === 'success' 
              ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300 shadow-[0_0_30px_rgba(16,185,129,0.3)]' 
              : 'bg-red-500/20 border-red-500/50 text-red-300 shadow-[0_0_30px_rgba(239,68,68,0.3)]'
          }`}>
            {toast.type === 'success' ? <CheckCircle2 className="w-5 h-5 text-emerald-400" /> : <AlertTriangle className="w-5 h-5 text-red-400" />}
            <span>{toast.text}</span>
            <button onClick={() => setToast(null)} className="ml-2 text-slate-400 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* CONTAINER CONTENT */}
      <div className="max-w-[1400px] mx-auto px-4 md:px-8 pt-8 space-y-10">
        
        {/* SECTION 1: HERO CAROUSEL MANAGER */}
        <section className="bg-surface/80 p-6 md:p-8 rounded-2xl border border-white/10 backdrop-blur-xl shadow-2xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/20 border border-primary/40 flex items-center justify-center text-primary shadow-[0_0_15px_rgba(168,85,247,0.3)]">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base md:text-lg font-black text-white tracking-wide">
                  SECTION 1: HERO CAROUSEL MANAGER (Spanduk Utama Beranda)
                </h2>
                <p className="text-xs text-slate-400 font-medium">
                  Atur lagu-lagu yang ditampilkan secara visual di banner slider beranda utama.
                </p>
              </div>
            </div>

            <button
              onClick={() => setIsPinModalOpen(true)}
              className="px-4 py-2.5 bg-primary hover:bg-primary-light text-white text-xs font-bold rounded-xl transition-all shadow-[0_0_20px_rgba(168,85,247,0.5)] flex items-center justify-center gap-2 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Pin Lagu Baru ke Hero</span>
            </button>
          </div>

          {/* LIST OF CURRENT HERO SONGS */}
          {loadingHero ? (
            <div className="flex items-center justify-center py-12 text-slate-400 text-xs font-mono">
              <RefreshCw className="w-5 h-5 text-primary animate-spin mr-2" />
              Memuat data Hero Banner Carousel...
            </div>
          ) : featuredSongs.length === 0 ? (
            <div className="p-8 text-center bg-black/60 rounded-xl border border-white/10 space-y-3">
              <Sparkles className="w-8 h-8 text-slate-600 mx-auto" />
              <p className="text-sm font-semibold text-slate-300">
                Belum ada lagu yang di-pin ke Hero Carousel.
              </p>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Secara otomatis beranda akan menampilkan 3 lagu paling populer dari database. Klik tombol &quot;Pin Lagu Baru ke Hero&quot; di atas untuk memilih lagu secara manual.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {featuredSongs.map((song, index) => (
                <div 
                  key={song.id}
                  className="bg-black/80 rounded-xl border border-white/10 p-4 flex flex-col justify-between gap-4 group hover:border-primary/50 transition-all shadow-lg relative overflow-hidden"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-14 h-14 rounded-lg overflow-hidden bg-surface border border-white/10 flex-shrink-0 relative">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img 
                        src={song.cover_url || "https://images.unsplash.com/photo-1511192336575-5a79af67a629?q=80&w=600&h=600&auto=format&fit=crop"} 
                        alt={song.title} 
                        className="w-full h-full object-cover"
                      />
                      <span className="absolute top-1 left-1 bg-primary text-white text-[9px] font-black px-1.5 py-0.5 rounded shadow">
                        #{index + 1}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-extrabold text-white truncate">
                        {song.title}
                      </h3>
                      <p className="text-xs text-slate-400 font-medium truncate">
                        {song.artist}
                      </p>
                      <span className="text-[10px] text-slate-500 font-mono mt-1 block">
                        {(song.views || song.view_count || 0).toLocaleString()} Views
                      </span>
                    </div>
                  </div>

                  {/* Actions Bar */}
                  <div className="flex items-center justify-between border-t border-white/10 pt-3">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleOrderChange(song, 'up', index)}
                        disabled={index === 0}
                        className="p-1.5 bg-white/5 hover:bg-white/10 disabled:opacity-30 text-slate-300 rounded-lg text-xs"
                        title="Naikkan Urutan"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleOrderChange(song, 'down', index)}
                        disabled={index === featuredSongs.length - 1}
                        className="p-1.5 bg-white/5 hover:bg-white/10 disabled:opacity-30 text-slate-300 rounded-lg text-xs"
                        title="Turunkan Urutan"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <button
                      onClick={() => handleUnpinSong(song)}
                      className="px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      <PinOff className="w-3.5 h-3.5" />
                      <span>Unpin dari Hero</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* SECTION 2: VIDEO TUTORIAL GUITAR MANAGER */}
        <section className="bg-surface/80 p-6 md:p-8 rounded-2xl border border-white/10 backdrop-blur-xl shadow-2xl space-y-6">
          <div className="flex items-center gap-3 border-b border-white/10 pb-5">
            <div className="w-10 h-10 rounded-xl bg-red-500/20 border border-red-500/40 flex items-center justify-center text-red-400 shadow-[0_0_15px_rgba(239,68,68,0.3)]">
              <Youtube className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base md:text-lg font-black text-white tracking-wide">
                SECTION 2: VIDEO TUTORIAL GUITAR MANAGER
              </h2>
              <p className="text-xs text-slate-400 font-medium">
                Sematkan video tutorial YouTube untuk membantu pengguna mempelajari petikan & genjrengan lagu.
              </p>
            </div>
          </div>

          {/* STEP 1: SELECT SONG */}
          <div className="bg-black/60 p-5 rounded-xl border border-white/10 space-y-3">
            <label className="text-xs font-bold text-slate-300 flex items-center gap-2">
              <Music className="w-4 h-4 text-primary" />
              <span>1. Pilih Lagu dari Koleksi Database:</span>
            </label>
            <button
              type="button"
              onClick={() => setIsPinModalOpen(true)}
              className="w-full bg-black border border-white/10 hover:border-primary/50 p-3.5 rounded-xl text-left flex items-center justify-between transition-all cursor-pointer group"
            >
              {selectedSongForTutorial ? (
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded bg-surface overflow-hidden border border-white/10">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img 
                      src={selectedSongForTutorial.cover_url || "https://images.unsplash.com/photo-1511192336575-5a79af67a629?q=80&w=600&h=600&auto=format&fit=crop"} 
                      alt="Cover" 
                      className="w-full h-full object-cover" 
                    />
                  </div>
                  <div>
                    <h4 className="text-sm font-extrabold text-white">
                      {selectedSongForTutorial.title}
                    </h4>
                    <p className="text-xs text-slate-400 font-medium">
                      {selectedSongForTutorial.artist}
                    </p>
                  </div>
                </div>
              ) : (
                <span className="text-xs text-slate-500 font-medium">
                  Klik di sini untuk mencari dan memilih lagu yang akan diberi tutorial video...
                </span>
              )}
              <Search className="w-4 h-4 text-slate-400 group-hover:text-primary transition-colors" />
            </button>
          </div>

          {/* STEP 2: FORM & TUTORIAL LIST IF SONG SELECTED */}
          {selectedSongForTutorial && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-2">
              
              {/* FORM INPUT */}
              <form onSubmit={handleAddTutorial} className="bg-black/80 p-5 rounded-xl border border-white/10 space-y-4">
                <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono border-b border-white/10 pb-2">
                  Tambah Video Tutorial Baru
                </h3>

                <div>
                  <label className="text-xs font-bold text-slate-300 mb-1.5 block">
                    Judul Tutorial <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={videoTitle}
                    onChange={(e) => setVideoTitle(e.target.value)}
                    placeholder="Contoh: Tutorial Petikan Intro Melodi"
                    className="w-full bg-surface border border-white/10 rounded-xl px-3.5 py-2.5 text-white text-xs focus:outline-none focus:border-primary/60 font-semibold"
                    required
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-300 mb-1.5 block">
                    URL atau ID Video YouTube <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={youtubeUrl}
                    onChange={(e) => setYoutubeUrl(e.target.value)}
                    placeholder="https://www.youtube.com/watch?v=..."
                    className="w-full bg-surface border border-white/10 rounded-xl px-3.5 py-2.5 text-white text-xs font-mono focus:outline-none focus:border-primary/60"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={addingTutorial}
                  className="w-full py-2.5 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl text-xs transition-all shadow-[0_0_15px_rgba(239,68,68,0.4)] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {addingTutorial ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Plus className="w-4 h-4" />
                  )}
                  <span>{addingTutorial ? "Menyimpan..." : "Simpan Video Tutorial"}</span>
                </button>
              </form>

              {/* TUTORIALS TABLE / PREVIEW */}
              <div className="lg:col-span-2 bg-black/80 p-5 rounded-xl border border-white/10 space-y-4">
                <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono border-b border-white/10 pb-2 flex items-center justify-between">
                  <span>Daftar Video Tutorial ({tutorials.length})</span>
                  <span className="text-[10px] text-slate-400 font-normal">
                    Lagu: {selectedSongForTutorial.title}
                  </span>
                </h3>

                {loadingTutorials ? (
                  <div className="py-8 text-center text-slate-500 text-xs font-mono flex items-center justify-center">
                    <RefreshCw className="w-4 h-4 animate-spin mr-2 text-primary" />
                    Memuat daftar tutorial...
                  </div>
                ) : tutorials.length === 0 ? (
                  <div className="py-12 text-center text-slate-500 text-xs italic font-mono">
                    Belum ada video tutorial untuk lagu ini. Gunakan formulir di sebelah kiri untuk menambahkan.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {tutorials.map((tut) => (
                      <div key={tut.id} className="bg-surface p-3 rounded-xl border border-white/10 flex flex-col sm:flex-row items-center gap-4 justify-between">
                        <div className="flex items-center gap-3 w-full sm:w-auto">
                          <div className="w-20 h-12 bg-black rounded border border-white/10 flex items-center justify-center flex-shrink-0 relative overflow-hidden">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img 
                              src={`https://img.youtube.com/vi/${tut.video_id}/mqdefault.jpg`} 
                              alt="Thumbnail" 
                              className="w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                              <Play className="w-4 h-4 text-white fill-white" />
                            </div>
                          </div>
                          <div>
                            <h4 className="text-xs font-extrabold text-white">
                              {tut.title}
                            </h4>
                            <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                              ID: {tut.video_id}
                            </p>
                          </div>
                        </div>

                        <button
                          onClick={() => handleDeleteTutorial(tut.id)}
                          className="px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer self-end sm:self-auto"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Hapus</span>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>
          )}

        </section>

      </div>

      {/* SEARCH / PIN MODAL */}
      {isPinModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-surface p-6 rounded-2xl border border-white/10 max-w-2xl w-full max-h-[85vh] flex flex-col gap-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="text-base font-black text-white flex items-center gap-2">
                <Search className="w-4 h-4 text-primary" />
                Pilih Lagu dari Koleksi Database
              </h3>
              <button 
                onClick={() => setIsPinModalOpen(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Search Input */}
            <form onSubmit={handleSearchSongs} className="relative">
              <input
                type="text"
                value={songSearchQuery}
                onChange={(e) => setSongSearchQuery(e.target.value)}
                placeholder="Cari judul lagu atau nama artis..."
                className="w-full bg-black border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-primary/60 font-medium"
              />
              <button type="submit" className="absolute right-3 top-2.5 text-slate-400 hover:text-primary">
                <Search className="w-4 h-4" />
              </button>
            </form>

            {/* Results List */}
            <div className="flex-1 overflow-y-auto space-y-2 pr-1 min-h-[300px]">
              {searching ? (
                <div className="py-12 text-center text-slate-500 text-xs font-mono">
                  Mencari lagu...
                </div>
              ) : searchResults.length === 0 ? (
                <div className="py-12 text-center text-slate-500 text-xs font-mono">
                  Tidak ada lagu ditemukan.
                </div>
              ) : (
                searchResults.map((song) => {
                  const isPinned = featuredSongs.some(f => f.id === song.id);
                  return (
                    <div 
                      key={song.id} 
                      className="p-3 bg-black/60 rounded-xl border border-white/10 flex items-center justify-between hover:border-primary/40 transition-all"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded bg-surface overflow-hidden border border-white/10 flex-shrink-0">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img 
                            src={song.cover_url || "https://images.unsplash.com/photo-1511192336575-5a79af67a629?q=80&w=600&h=600&auto=format&fit=crop"} 
                            alt="Cover" 
                            className="w-full h-full object-cover" 
                          />
                        </div>
                        <div>
                          <h4 className="text-xs font-extrabold text-white">
                            {song.title}
                          </h4>
                          <p className="text-[10px] text-slate-400 font-medium">
                            {song.artist}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            handleSelectSongForTutorial(song);
                            setIsPinModalOpen(false);
                          }}
                          className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-lg text-[10px] font-bold transition-all"
                        >
                          Pilih Tutorial
                        </button>

                        {isPinned ? (
                          <span className="px-3 py-1.5 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-lg text-[10px] font-bold flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" /> Pinned
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handlePinSong(song)}
                            className="px-3 py-1.5 bg-primary hover:bg-primary-light text-white rounded-lg text-[10px] font-bold transition-all flex items-center gap-1 cursor-pointer"
                          >
                            <Pin className="w-3 h-3" /> Pin to Hero
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
