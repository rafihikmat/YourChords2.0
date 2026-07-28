"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { 
  WifiOff, Music, Search, Trash2, ArrowLeft, RefreshCw, 
  Sparkles, HardDrive, CheckCircle2, Music2, BookOpen
} from "lucide-react";
import { getAllCachedSongs, removeSongFromOfflineCache, CachedSong } from "@/lib/offlineCache";

export default function OfflinePage() {
  const [cachedSongs, setCachedSongs] = useState<CachedSong[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedSong, setSelectedSong] = useState<CachedSong | null>(null);

  const fetchOfflineSongs = async () => {
    setLoading(true);
    try {
      const songs = await getAllCachedSongs();
      setCachedSongs(songs);
    } catch (err) {
      console.warn("[OFFLINE PAGE FETCH ERR]:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOfflineSongs();
  }, []);

  const handleRemove = async (e: React.MouseEvent, songId: string) => {
    e.stopPropagation();
    await removeSongFromOfflineCache(songId);
    setCachedSongs((prev) => prev.filter((s) => s.id !== songId));
    if (selectedSong?.id === songId) {
      setSelectedSong(null);
    }
  };

  const filteredSongs = cachedSongs.filter(
    (s) =>
      s.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.artist?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-950 text-white font-sans pb-20 selection:bg-primary selection:text-white">
      
      {/* HEADER */}
      <header className="sticky top-0 z-50 bg-slate-950/80 backdrop-blur-xl border-b border-white/10 px-4 md:px-8 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="p-2 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 text-slate-300 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div>
              <h1 className="text-base md:text-lg font-black text-white tracking-wide uppercase flex items-center gap-2">
                <span>Musician Offline Mode</span>
                <span className="text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <WifiOff className="w-3 h-3" />
                  IndexedDB
                </span>
              </h1>
              <p className="text-xs text-slate-400">Latihan gitar tanpa batas meskipun koneksi internet terputus</p>
            </div>
          </div>

          <button
            onClick={fetchOfflineSongs}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 border border-white/10 rounded-xl text-xs font-bold text-slate-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            <span className="hidden sm:inline">Refresh Storage</span>
          </button>
        </div>
      </header>

      {/* MAIN CONTENT */}
      <main className="max-w-6xl mx-auto px-4 md:px-8 mt-8 flex flex-col gap-6">
        
        {/* STATS & SEARCH BANNER */}
        <div className="bg-surface/80 border border-white/10 rounded-2xl p-6 backdrop-blur-xl flex flex-col md:flex-row items-center justify-between gap-4 shadow-xl">
          <div className="flex items-center gap-4 w-full md:w-auto">
            <div className="p-3 bg-amber-500/20 border border-amber-500/40 rounded-2xl text-amber-400">
              <HardDrive className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-sm font-extrabold text-white flex items-center gap-2">
                <span>Penyimpanan Offline Lokal</span>
                <span className="text-xs font-mono font-bold text-primary bg-primary/20 px-2 py-0.5 rounded-full border border-primary/30">
                  {cachedSongs.length} Lagu Tersimpan
                </span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Semua lagu yang pernah kamu buka atau jadikan favorit tersimpan otomatis di sini.
              </p>
            </div>
          </div>

          {/* SEARCH FIELD */}
          <div className="relative w-full md:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari lagu offline..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-black/50 border border-white/10 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-primary transition-colors"
            />
          </div>
        </div>

        {/* CONTENT GRID: LIST VS READER */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* SONG LIST (5 COLS) */}
          <div className="lg:col-span-5 flex flex-col gap-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <BookOpen className="w-4 h-4 text-primary" />
              <span>Koleksi Offline ({filteredSongs.length})</span>
            </h3>

            {loading ? (
              <div className="py-12 flex justify-center">
                <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
              </div>
            ) : filteredSongs.length === 0 ? (
              <div className="bg-surface/50 border border-white/10 rounded-2xl p-8 text-center text-slate-500 text-xs flex flex-col items-center gap-3">
                <WifiOff className="w-8 h-8 text-slate-600" />
                <span>Belum ada lagu yang tersimpan di memori offline. Buka lagu apapun saat online untuk menyimpannya secara otomatis!</span>
              </div>
            ) : (
              <div className="flex flex-col gap-2.5 max-h-[70vh] overflow-y-auto pr-1">
                {filteredSongs.map((song) => {
                  const isSelected = selectedSong?.id === song.id;

                  return (
                    <div
                      key={song.id}
                      onClick={() => setSelectedSong(song)}
                      className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                        isSelected
                          ? "bg-primary/20 border-primary shadow-[0_0_20px_rgba(168,85,247,0.3)]"
                          : "bg-surface/70 border-white/10 hover:border-white/20 hover:bg-surface"
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="p-2.5 bg-white/5 border border-white/10 rounded-xl text-primary flex-shrink-0">
                          <Music2 className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <h4 className="text-xs md:text-sm font-extrabold text-white truncate">
                            {song.title}
                          </h4>
                          <p className="text-[11px] text-slate-400 truncate">{song.artist}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 flex-shrink-0">
                        <Link
                          href={`/chord/${song.id}`}
                          onClick={(e) => e.stopPropagation()}
                          className="px-2.5 py-1 bg-white/10 hover:bg-white/20 border border-white/10 rounded-lg text-[10px] font-bold text-slate-300 hover:text-white transition-colors"
                        >
                          Buka
                        </Link>

                        <button
                          onClick={(e) => handleRemove(e, song.id)}
                          className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors cursor-pointer"
                          title="Hapus dari cache"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* READER / OFFLINE VIEWER (7 COLS) */}
          <div className="lg:col-span-7">
            {!selectedSong ? (
              <div className="bg-surface/50 border border-white/10 rounded-2xl p-12 text-center text-slate-500 text-xs flex flex-col items-center gap-3">
                <Music className="w-8 h-8 text-slate-600" />
                <span>Pilih lagu dari daftar di sebelah kiri untuk melihat chord dan lirik secara instan secara offline.</span>
              </div>
            ) : (
              <div className="bg-surface/90 border border-white/10 rounded-2xl p-6 backdrop-blur-xl shadow-2xl flex flex-col gap-6">
                
                {/* SONG TITLE & ARTIST */}
                <div className="flex items-start justify-between gap-4 pb-4 border-b border-white/10">
                  <div>
                    <span className="text-[10px] font-mono font-bold text-amber-400 uppercase tracking-widest bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full">
                      Offline Reader
                    </span>
                    <h2 className="text-xl font-black text-white mt-1">
                      {selectedSong.title}
                    </h2>
                    <p className="text-sm text-slate-400 font-medium">{selectedSong.artist}</p>
                  </div>

                  <Link
                    href={`/chord/${selectedSong.id}`}
                    className="px-4 py-2 bg-primary text-white rounded-xl text-xs font-bold shadow-[0_0_15px_rgba(168,85,247,0.4)] hover:bg-primary-light transition-all flex items-center gap-1.5"
                  >
                    <span>Mode Lengkap</span>
                  </Link>
                </div>

                {/* CONTENT / CHORDS */}
                <div className="bg-black/90 border border-white/10 rounded-xl p-5 font-mono text-xs text-slate-200 whitespace-pre leading-relaxed overflow-x-auto max-h-[60vh]">
                  {selectedSong.chords || selectedSong.content || "Tidak ada data chord offline."}
                </div>

              </div>
            )}
          </div>

        </div>

      </main>
    </div>
  );
}
