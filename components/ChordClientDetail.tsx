"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { 
  Play, Minus, Plus, Settings2, Copy, Check, Pause, Type, Music, Heart, Wand2, 
  Sparkles, Keyboard, X, Youtube, FolderPlus, FileText, Save, CheckCircle2, PlusCircle, Printer, Music2, Edit3 
} from "lucide-react";
import { transposeChordLine, simplifyChordLine, calculateCapoTranspose, CHORD_REGEX, SINGLE_CHORD_REGEX } from "@/lib/transposer";
import { 
  toggleSongFavorite, checkIsFavorite, checkIsSongLiked, getUserSongNote 
} from "@/lib/userPreferences";
import { saveUserSongNote } from "@/lib/userDashboard";
import { 
  getUserSetlists, addSongToSetlist, createSetlist 
} from "@/lib/setlists";
import { incrementSongViews } from "@/lib/supabase";
import { useAuth } from "@/lib/authContext";
import AuthModal from "@/components/AuthModal";
import { getVideoTutorials, VideoTutorial } from "@/lib/adminCurated";
import FretboardModal from "@/components/FretboardModal";
import FloatingYouTubePlayer from "@/components/FloatingYouTubePlayer";
import Metronome from "@/components/Metronome";
import SongRating from "@/components/SongRating";
import ChordCorrectionModal from "@/components/ChordCorrectionModal";
import VideoTutorialModal from "@/components/VideoTutorialModal";
import { saveSongToOfflineCache } from "@/lib/offlineCache";
import { Setlist } from "@/lib/types";
import { extractYouTubeId } from "@/lib/youtube";

type ChordData = {
  id: string;
  title: string;
  artist: string;
  cover_url?: string;
  content: string;
  youtube_video_id?: string | null;
  difficulty?: string | null;
  key?: string | null;
};

type ChordClientDetailProps = {
  data?: ChordData;
  song?: ChordData;
  ratingStats?: any;
  difficultyStats?: any;
  relatedSongs?: any[];
};

export default function ChordClientDetail(props: ChordClientDetailProps) {
  const data = props.song || props.data!;
  const { user } = useAuth();

  const [transpose, setTranspose] = useState(0);
  const [capoFret, setCapoFret] = useState(0);
  const [fontSize, setFontSize] = useState(16);
  const [isSimplified, setIsSimplified] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  
  const [selectedChordForDiagram, setSelectedChordForDiagram] = useState<string | null>(null);
  const [showShortcutsGuide, setShowShortcutsGuide] = useState(false);
  const [showMetronome, setShowMetronome] = useState(false);
  const [showCorrectionModal, setShowCorrectionModal] = useState(false);

  // Auth Modal state
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalReason, setAuthModalReason] = useState("");

  // Floating YouTube Player State
  const [showYouTubePlayer, setShowYouTubePlayer] = useState(false);
  const [videoTutorials, setVideoTutorials] = useState<VideoTutorial[]>([]);
  const [selectedTutorial, setSelectedTutorial] = useState<VideoTutorial | null>(null);

  // Personal Notes & Strumming State
  const [userNote, setUserNote] = useState("");
  const [isSavingNote, setIsSavingNote] = useState(false);
  const [noteSaveSuccess, setNoteSaveSuccess] = useState(false);
  const [noteSaveError, setNoteSaveError] = useState<string | null>(null);

  // Setlist Modal State
  const [showSetlistModal, setShowSetlistModal] = useState(false);
  const [userSetlists, setUserSetlists] = useState<Setlist[]>([]);
  const [newSetlistName, setNewSetlistName] = useState("");
  const [isCreatingSetlist, setIsCreatingSetlist] = useState(false);
  const [addedSetlistIds, setAddedSetlistIds] = useState<string[]>([]);

  const [autoScrollSpeed, setAutoScrollSpeed] = useState(0); 
  const lastActiveSpeedRef = useRef(1.0);
  const scrollAccumulatorRef = useRef(0);
  const scrollRef = useRef<number | null>(null);

  const activeUserId = user?.id || "guest";
  const cleanVideoId = extractYouTubeId(data?.youtube_video_id);

  // Check Favorite Status, Personal Note & Video Tutorials on Load & Save to Offline Cache + Increment View Count
  useEffect(() => {
    if (data?.id) {
      incrementSongViews(data.id);
      checkIsSongLiked(data.id, activeUserId).then(fav => setIsFavorite(fav));
      if (user?.id) {
        getUserSongNote(data.id, user.id).then(note => setUserNote(note));
      } else {
        setUserNote("");
      }
      getVideoTutorials(data.id).then(tuts => setVideoTutorials(tuts));

      // Automate offline caching
      saveSongToOfflineCache({
        id: data.id,
        title: data.title,
        artist: data.artist,
        chords: data.content,
        content: data.content,
        difficulty: data.difficulty,
        cover_url: data.cover_url,
      });
    }
  }, [data, activeUserId, user?.id]);

  // Load Setlists when Setlist Modal opens (Auth guarded)
  const handleOpenSetlistModal = async () => {
    if (!user) {
      setAuthModalReason("Silakan Sign In atau Sign Up terlebih dahulu untuk membuat dan mengelola Setlist pribadi Anda.");
      setIsAuthModalOpen(true);
      return;
    }
    setShowSetlistModal(true);
    const setlists = await getUserSetlists(user.id);
    setUserSetlists(setlists);
  };

  const handleOpenCorrectionModal = () => {
    if (!user) {
      setAuthModalReason("Silakan Sign In atau Sign Up terlebih dahulu untuk mengirim saran perbaikan chord & lirik.");
      setIsAuthModalOpen(true);
      return;
    }
    setShowCorrectionModal(true);
  };

  const handleAddSongToSetlist = async (setlistId: string) => {
    if (!data?.id) return;
    await addSongToSetlist(setlistId, data.id);
    setAddedSetlistIds(prev => [...prev, setlistId]);
  };

  const handleCreateNewSetlist = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSetlistName.trim() || !data?.id) return;

    setIsCreatingSetlist(true);
    const created = await createSetlist(activeUserId, newSetlistName);
    setIsCreatingSetlist(false);

    if (created) {
      await addSongToSetlist(created.id, data.id);
      setAddedSetlistIds(prev => [...prev, created.id]);
      setNewSetlistName("");
      const updated = await getUserSetlists(activeUserId);
      setUserSetlists(updated);
    }
  };

  // Toggle Favorite Action (Real-time DB Sync or Auth Prompt)
  const handleToggleFavorite = async () => {
    if (!data?.id) return;

    if (!user) {
      setAuthModalReason("Silakan masuk atau daftar akun terlebih dahulu untuk menyukai lagu ini.");
      setIsAuthModalOpen(true);
      return;
    }

    const newFavStatus = await toggleSongFavorite(data.id, user.id);
    setIsFavorite(newFavStatus);
  };

  // Trigger Auth Modal with custom motivation message
  const triggerAuthGuard = (reasonMessage = "Login untuk menyimpan catatan & pola genjrengan pribadi Anda.") => {
    setAuthModalReason(reasonMessage);
    setIsAuthModalOpen(true);
  };

  // Save Note Action (Real-time DB Sync or Auth Prompt)
  const handleSaveNote = async () => {
    if (!data?.id) return;

    if (!user) {
      triggerAuthGuard("Login untuk menyimpan catatan & pola genjrengan pribadi Anda.");
      return;
    }

    setIsSavingNote(true);
    setNoteSaveError(null);

    const res = await saveUserSongNote(user.id, data.id, userNote);
    setIsSavingNote(false);

    if (res.success) {
      setNoteSaveSuccess(true);
      setTimeout(() => setNoteSaveSuccess(false), 3000);
    } else {
      setNoteSaveError(res.error || "Gagal menyimpan catatan.");
      setTimeout(() => setNoteSaveError(null), 4000);
    }
  };

  const applyStrummingPreset = (pattern: string) => {
    if (!user) {
      triggerAuthGuard("Login untuk menyimpan catatan & pola genjrengan pribadi Anda.");
      return;
    }
    setUserNote(prev => {
      if (!prev.trim()) return `Strumming: ${pattern}`;
      return `${prev.trim()}\nStrumming: ${pattern}`;
    });
  };

  // Sub-Pixel Accumulator Auto-Scroll Engine (0.3x - 5.0x Range)
  useEffect(() => {
    if (autoScrollSpeed > 0) {
      lastActiveSpeedRef.current = autoScrollSpeed;

      const scrollLoop = () => {
        // Accumulate sub-pixels per frame (at ~60 FPS)
        scrollAccumulatorRef.current += autoScrollSpeed;

        if (scrollAccumulatorRef.current >= 1) {
          const pixelsToScroll = Math.floor(scrollAccumulatorRef.current);
          window.scrollBy({ top: pixelsToScroll, behavior: 'instant' });
          scrollAccumulatorRef.current -= pixelsToScroll;
        }

        if ((window.innerHeight + window.scrollY) >= document.body.offsetHeight - 5) {
          setAutoScrollSpeed(0);
          scrollAccumulatorRef.current = 0;
        } else {
          scrollRef.current = requestAnimationFrame(scrollLoop);
        }
      };

      scrollRef.current = requestAnimationFrame(scrollLoop);
    } else {
      scrollAccumulatorRef.current = 0;
    }

    return () => {
      if (scrollRef.current) cancelAnimationFrame(scrollRef.current);
    };
  }, [autoScrollSpeed]);

  // Hands-Free Keyboard Shortcuts Handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeElement = document.activeElement;
      const tagName = activeElement?.tagName.toLowerCase();
      const isInputFocused = tagName === 'input' || tagName === 'textarea' || (activeElement as HTMLElement)?.isContentEditable;

      if (isInputFocused) return;

      if (e.code === 'Space') {
        e.preventDefault();
        setAutoScrollSpeed(prev => (prev > 0 ? 0 : lastActiveSpeedRef.current));
      } else if (e.code === 'ArrowUp' || e.key === '+' || e.key === '=') {
        e.preventDefault();
        setAutoScrollSpeed(prev => {
          const current = prev > 0 ? prev : lastActiveSpeedRef.current;
          const updated = Number(Math.min(5.0, current + 0.2).toFixed(1));
          lastActiveSpeedRef.current = updated;
          return prev > 0 ? updated : 0;
        });
      } else if (e.code === 'ArrowDown' || e.key === '-') {
        e.preventDefault();
        setAutoScrollSpeed(prev => {
          const current = prev > 0 ? prev : lastActiveSpeedRef.current;
          const updated = Number(Math.max(0.3, current - 0.2).toFixed(1));
          lastActiveSpeedRef.current = updated;
          return prev > 0 ? updated : 0;
        });
      } else if (e.code === 'ArrowRight') {
        e.preventDefault();
        setTranspose(prev => prev + 1);
      } else if (e.code === 'ArrowLeft') {
        e.preventDefault();
        setTranspose(prev => prev - 1);
      } else if (e.code === 'KeyS') {
        e.preventDefault();
        setIsSimplified(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleTranspose = (amount: number) => {
    setTranspose(prev => prev + amount);
  };

  const adjustFontSize = (amount: number) => {
    setFontSize(prev => Math.max(12, Math.min(32, prev + amount)));
  };

  // Compute Total Transpose Steps
  const totalTransposeSteps = transpose + calculateCapoTranspose(data?.title || "", capoFret);

  const getProcessedLines = useCallback(() => {
    if (!data?.content) return [];
    const rawLines = data.content.split('\n');
    return rawLines.map(line => {
      let processed = line;
      if (isSimplified) {
        processed = simplifyChordLine(processed);
      }
      return transposeChordLine(processed, totalTransposeSteps);
    });
  }, [data?.content, isSimplified, totalTransposeSteps]);

  const copyToClipboard = async () => {
    if (!data) return;
    try {
      const fullText = getProcessedLines().join('\n');
      await navigator.clipboard.writeText(fullText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  const coverUrl = data.cover_url || "https://images.unsplash.com/photo-1511192336575-5a79af67a629?q=80&w=600&h=600&auto=format&fit=crop";
  const processedLines = getProcessedLines();

  return (
    <div className="flex flex-col min-h-screen pb-40 animate-fade-in relative pt-20">
      
      {/* PRINT HEADER (Hanya Tampil Saat Cetak / Export PDF) */}
      <div className="print-header hidden print:block mb-6">
        <h1 className="text-2xl font-bold">{data.title}</h1>
        <h2 className="text-lg text-gray-700">{data.artist}</h2>
        <div className="text-xs text-gray-600 mt-2 flex flex-wrap gap-4 border-t border-gray-300 pt-2">
          <span><strong>Key:</strong> {data.key || "Original"}</span>
          <span><strong>Capo:</strong> {capoFret > 0 ? `Fret ${capoFret}` : "Tanpa Capo"}</span>
          <span><strong>Transpose:</strong> {transpose > 0 ? `+${transpose}` : transpose}</span>
          <span><strong>Platform:</strong> YourChords</span>
        </div>
      </div>

      {/* HEADER LAGU & TOOLS */}
      <div className="no-print flex flex-col md:flex-row gap-6 md:items-end mb-6 bg-surface/60 p-6 md:p-8 rounded-2xl border border-white/10 backdrop-blur-md mx-4 md:mx-8 lg:mx-12 shadow-2xl">
        <div className="relative w-28 h-28 md:w-44 md:h-44 rounded-xl overflow-hidden flex-shrink-0 bg-surface border border-white/10 shadow-[0_0_30px_rgba(168,85,247,0.2)] group">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img 
            src={coverUrl} 
            alt={data.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        </div>

        <div className="flex flex-col flex-1 pb-1">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-2">
            <h1 className="text-3xl md:text-5xl lg:text-6xl font-black text-white tracking-tight">
              {data.title}
            </h1>
            
            <div className="flex items-center gap-2">
              {/* SETLIST BUTTON */}
              <button
                onClick={handleOpenSetlistModal}
                className="p-3 rounded-xl border border-primary/40 bg-primary/10 text-primary hover:bg-primary/20 transition-all duration-300 flex items-center gap-2 cursor-pointer shadow-[0_0_15px_rgba(168,85,247,0.2)]"
                title="Tambah ke Setlist / Songbook"
              >
                <FolderPlus className="w-5 h-5 text-primary" />
                <span className="hidden sm:inline text-xs font-extrabold">Setlist (+)</span>
              </button>

              {/* FAVORITE BUTTON */}
              <button
                onClick={handleToggleFavorite}
                className={`p-3 rounded-xl border transition-all duration-300 flex items-center gap-2 cursor-pointer ${
                  isFavorite 
                    ? 'bg-rose-500/20 border-rose-500/50 text-rose-400 shadow-[0_0_20px_rgba(244,63,94,0.5)] scale-105' 
                    : 'bg-white/5 border-white/10 text-slate-400 hover:text-white hover:bg-white/10'
                }`}
                title={isFavorite ? "Hapus dari Favorit" : "Tambah ke Favorit"}
              >
                <Heart className={`w-5 h-5 transition-transform ${isFavorite ? 'fill-rose-500 text-rose-500 scale-110' : ''}`} />
                <span className="hidden sm:inline text-xs font-bold">{isFavorite ? 'Disukai' : 'Sukai'}</span>
              </button>

              {/* CORRECTION BUTTON */}
              <button
                onClick={handleOpenCorrectionModal}
                className="p-3 rounded-xl border border-white/10 bg-white/5 text-slate-300 hover:text-white hover:bg-white/10 hover:border-primary/40 transition-all duration-300 flex items-center gap-2 cursor-pointer"
                title="Saran Perbaikan Chord & Lirik"
              >
                <Edit3 className="w-5 h-5 text-primary" />
                <span className="hidden sm:inline text-xs font-bold">Perbaiki</span>
              </button>
            </div>
          </div>

          <h2 className="text-lg md:text-xl text-slate-400 font-medium mb-5 flex items-center gap-3">
            <span className="w-5 h-0.5 bg-primary rounded-full"></span>
            {data.artist}
          </h2>

          <div className="flex flex-wrap items-center gap-3">
            {/* Original Key Badge */}
            <div className="px-3 py-1.5 bg-primary/10 text-primary border border-primary/30 rounded-lg text-xs font-bold tracking-widest flex items-center gap-1.5 shadow-sm">
              <Music className="w-3.5 h-3.5" /> ORIGINAL KEY
            </div>

            {transpose !== 0 && (
              <div className="px-3 py-1.5 bg-secondary/20 text-secondary border border-secondary/40 rounded-lg text-xs font-black tracking-widest shadow-[0_0_12px_rgba(236,72,153,0.3)]">
                TRANSPOSE: {transpose > 0 ? `+${transpose}` : transpose}
              </div>
            )}

            {/* Capo Selector */}
            <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-lg px-3 py-1 text-xs hover:border-primary/40 transition-colors">
              <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Capo:</span>
              <select 
                value={capoFret} 
                onChange={(e) => setCapoFret(Number(e.target.value))}
                className="bg-transparent text-primary font-bold focus:outline-none cursor-pointer"
              >
                <option value={0} className="bg-slate-900 text-white">Tanpa Capo</option>
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(fret => (
                  <option key={fret} value={fret} className="bg-slate-900 text-white">Fret {fret}</option>
                ))}
              </select>
            </div>

            {/* Simplifier Toggle */}
            <button
              onClick={() => setIsSimplified(prev => !prev)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 border cursor-pointer ${
                isSimplified 
                  ? 'bg-primary text-white border-primary shadow-[0_0_20px_rgba(168,85,247,0.6)] scale-105' 
                  : 'bg-white/5 text-slate-400 border-white/10 hover:text-white hover:bg-white/10'
              }`}
              title="Sederhanakan chord sulit untuk pemula"
            >
              <Sparkles className={`w-3.5 h-3.5 ${isSimplified ? 'text-white animate-pulse' : ''}`} />
              <span>{isSimplified ? 'Chord Pemula: ON' : 'Sederhanakan'}</span>
            </button>

            {/* Floating YouTube Toggle Button */}
            <button
              onClick={() => setShowYouTubePlayer(prev => !prev)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 border cursor-pointer ${
                showYouTubePlayer
                  ? 'bg-red-600 text-white border-red-500 shadow-[0_0_20px_rgba(239,68,68,0.6)] scale-105'
                  : 'bg-red-600/15 border-red-500/40 text-red-400 hover:bg-red-600/30 hover:text-white'
              }`}
              title="Putar Musik & Video YouTube"
            >
              <Youtube className="w-4 h-4 fill-current" />
              <span>{showYouTubePlayer ? 'Tutup YouTube' : 'Putar Musik (YouTube)'}</span>
            </button>

            {/* Shortcuts Help Button */}
            <button
              onClick={() => setShowShortcutsGuide(true)}
              className="p-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-slate-400 hover:text-white transition-all ml-auto flex items-center gap-1.5 text-xs font-bold cursor-pointer"
              title="Panduan Pintas Keyboard"
            >
              <Keyboard className="w-4 h-4 text-primary" />
              <span className="hidden sm:inline">Pintas Keyboard</span>
            </button>
          </div>
        </div>
      </div>

      {/* PERSONAL NOTES & STRUMMING PATTERN ENGINE */}
      <div className="no-print personal-notes-container w-full max-w-4xl mx-auto px-4 md:px-0 mb-6">
        <div className="relative bg-surface/70 border border-white/10 rounded-2xl p-5 backdrop-blur-md shadow-lg overflow-hidden">
          
          {/* ANONYMOUS / GUEST OVERLAY BANNER */}
          {!user && (
            <div 
              onClick={() => triggerAuthGuard("Login untuk menyimpan catatan & pola genjrengan pribadi Anda.")}
              className="absolute inset-0 z-20 bg-slate-950/80 backdrop-blur-[3px] border border-primary/30 rounded-2xl p-5 flex flex-col items-center justify-center text-center cursor-pointer group transition-all hover:bg-slate-950/90"
            >
              <div className="flex items-center gap-2 text-primary font-bold text-xs md:text-sm mb-1.5 group-hover:scale-105 transition-transform">
                <span className="text-base">🔒</span>
                <span>Fitur Terbatas</span>
              </div>
              <p className="text-xs text-slate-300 max-w-md px-4 leading-relaxed font-medium">
                Silakan <span className="text-primary font-bold underline">Sign In</span> atau <span className="text-primary font-bold underline">Daftar akun gratis</span> untuk menulis & menyimpan Catatan Pribadi serta Pola Genjrengan khusus lagu ini.
              </p>
              <button 
                type="button"
                className="mt-3 px-4 py-1.5 bg-primary/20 hover:bg-primary text-primary hover:text-white border border-primary/40 rounded-xl text-xs font-bold transition-all shadow-[0_0_15px_rgba(168,85,247,0.3)] cursor-pointer"
              >
                Sign In / Daftar Sekarang
              </button>
            </div>
          )}

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-primary" />
              <h3 className="text-sm font-extrabold text-white">Catatan Pribadi & Strumming Pattern</h3>
            </div>

            <div className="flex items-center gap-2">
              {noteSaveSuccess && (
                <span className="text-xs text-emerald-400 font-extrabold flex items-center gap-1 animate-fade-in bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-1 rounded-lg shadow-[0_0_12px_rgba(16,185,129,0.3)]">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> ✨ Catatan pribadi berhasil disimpan!
                </span>
              )}
              {noteSaveError && (
                <span className="text-xs text-red-400 font-extrabold flex items-center gap-1 animate-fade-in bg-red-500/10 border border-red-500/30 px-2.5 py-1 rounded-lg">
                  <X className="w-3.5 h-3.5 text-red-400" /> {noteSaveError}
                </span>
              )}
              <button
                onClick={handleSaveNote}
                disabled={isSavingNote}
                className="px-3.5 py-1.5 bg-primary/20 hover:bg-primary text-primary hover:text-white border border-primary/40 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{isSavingNote ? 'Menyimpan...' : 'Simpan Catatan'}</span>
              </button>
            </div>
          </div>

          {/* Quick Strumming Pattern Presets */}
          <div className="flex flex-wrap items-center gap-2 mb-3 pt-1 border-t border-white/5">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Preset Genjrengan:</span>
            <button
              onClick={() => applyStrummingPreset('D - D - U - U - D - U')}
              className="px-2.5 py-1 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-[11px] text-slate-300 font-mono hover:text-primary transition-colors cursor-pointer"
            >
              D-D-U-U-D-U (Pop 4/4)
            </button>
            <button
              onClick={() => applyStrummingPreset('D - D - U - D - U')}
              className="px-2.5 py-1 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-[11px] text-slate-300 font-mono hover:text-primary transition-colors cursor-pointer"
            >
              D-D-U-D-U (Ballad)
            </button>
            <button
              onClick={() => applyStrummingPreset('D - U - D - U')}
              className="px-2.5 py-1 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-[11px] text-slate-300 font-mono hover:text-primary transition-colors cursor-pointer"
            >
              D-U-D-U (Cepat)
            </button>
            <button
              onClick={() => applyStrummingPreset('D - U - U')}
              className="px-2.5 py-1 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-[11px] text-slate-300 font-mono hover:text-primary transition-colors cursor-pointer"
            >
              D-U-U (3/4 Waltz)
            </button>
          </div>

          <textarea
            rows={2}
            value={userNote}
            readOnly={!user}
            onClick={() => !user && triggerAuthGuard("Login untuk menyimpan catatan & pola genjrengan pribadi Anda.")}
            onChange={(e) => user && setUserNote(e.target.value)}
            placeholder={user ? "Tulis pola genjrengan (misal: D-D-U-U-D-U), tempo BPM, atau pengingat nada di sini..." : "Silakan Sign In untuk menulis catatan..."}
            className={`w-full bg-black/60 border border-white/10 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-primary resize-y font-sans ${!user ? 'cursor-not-allowed opacity-60' : ''}`}
          />
        </div>
      </div>

      {/* CHORD DISPLAY AREA */}
      <div className="w-full max-w-4xl mx-auto px-4 md:px-0 relative mb-12">
        
        {/* CAPO INSTRUCTION BANNER */}
        {capoFret > 0 && (
          <div className="no-print mb-4 bg-primary/15 border border-primary/40 text-primary-light rounded-xl p-3.5 px-5 flex items-center gap-3 backdrop-blur-md shadow-[0_0_20px_rgba(168,85,247,0.25)] animate-fade-in">
            <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center text-primary flex-shrink-0 font-bold text-lg">
              📌
            </div>
            <div className="text-xs md:text-sm">
              <span className="font-extrabold text-white">Petunjuk Capo: </span>
              Pasang <span className="font-bold text-primary underline">Capo di Fret {capoFret}</span> pada gitar Anda untuk memainkan nada asli lagu ini!
            </div>
          </div>
        )}

        {/* COPY BUTTON */}
        <button 
          onClick={copyToClipboard}
          className="no-print absolute -top-12 right-4 md:top-3 md:-right-14 p-2.5 bg-surface hover:bg-surface-light rounded-lg border border-white/10 text-slate-400 hover:text-primary transition-all z-30 flex items-center gap-2 text-xs font-bold cursor-pointer"
          title="Salin Chord"
        >
          {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
        </button>

        {/* CHORD SHEET CONTAINER */}
        <div className="chord-sheet-container bg-surface/80 p-5 md:p-8 rounded-2xl border border-white/10 overflow-x-auto backdrop-blur-md shadow-[0_10px_40px_rgba(0,0,0,0.8)]">
          <div 
            className="font-mono text-slate-200 whitespace-pre leading-relaxed select-text"
            style={{ fontSize: `${fontSize}px`, lineHeight: '2.0' }}
          >
            {processedLines.map((line, idx) => {
              const parts = line.split(CHORD_REGEX);
              return (
                <div key={idx} className="song-section-block lyric-line min-h-[1.5em]">
                  {parts.map((part, partIdx) => {
                    if (SINGLE_CHORD_REGEX.test(part)) {
                      return (
                        <button
                          key={partIdx}
                          onClick={() => setSelectedChordForDiagram(part)}
                          className="chord-badge text-primary font-black cursor-pointer hover:text-white transition-all bg-primary/10 hover:bg-primary/30 px-2 py-0.5 rounded-md border border-primary/40 hover:border-primary mx-0.5 inline-block shadow-[0_0_10px_rgba(168,85,247,0.2)] hover:shadow-[0_0_15px_rgba(168,85,247,0.5)] hover:scale-105"
                          title={`Klik untuk melihat diagram fretboard chord ${part}`}
                        >
                          {part}
                        </button>
                      );
                    }

                    return <span key={partIdx}>{part}</span>;
                  })}
                </div>
              );
            })}
          </div>
        </div>

        {/* SONG RATING & COMMUNITY DIFFICULTY VOTING */}
        <div className="no-print rating-section mt-6">
          <SongRating songId={data.id} songTitle={data.title} initialDifficulty={data.difficulty} />
        </div>
      </div>

      {/* VIDEO TUTORIALS SECTION */}
      {videoTutorials.length > 0 && (
        <div className="no-print video-tutorial-section w-full max-w-4xl mx-auto px-4 md:px-0 mb-12">
          <div className="bg-surface/70 border border-white/10 rounded-2xl p-6 backdrop-blur-md shadow-lg space-y-4">
            <div className="flex items-center gap-3 border-b border-white/10 pb-3">
              <div className="p-2 rounded-xl bg-red-600/20 text-red-500 border border-red-500/30">
                <Youtube className="w-5 h-5 fill-current" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-white">Video Tutorial Gitar</h3>
                <p className="text-xs text-slate-400">Panduan belajar dan kunci gitar untuk lagu ini</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              {videoTutorials.map((tutorial) => (
                <button
                  key={tutorial.id}
                  onClick={() => setSelectedTutorial(tutorial)}
                  className="bg-black/60 rounded-xl border border-white/10 p-3 flex flex-col gap-3 hover:border-red-500/50 transition-all group text-left cursor-pointer w-full"
                >
                  <div className="relative aspect-video rounded-lg overflow-hidden bg-slate-900 border border-white/10 w-full">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={tutorial.thumbnail_url || `https://img.youtube.com/vi/${extractYouTubeId(tutorial.video_id) || tutorial.video_id}/hqdefault.jpg`}
                      alt={tutorial.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 flex items-center justify-center transition-colors">
                      <div className="w-12 h-12 rounded-full bg-red-600 text-white flex items-center justify-center shadow-lg transform group-hover:scale-110 transition-transform">
                        <Play className="w-6 h-6 fill-current translate-x-0.5" />
                      </div>
                    </div>
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white line-clamp-2 group-hover:text-red-400 transition-colors">{tutorial.title}</h4>
                    {tutorial.channel_title && (
                      <p className="text-[11px] text-slate-400 mt-1">{tutorial.channel_title}</p>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* POPUP MODAL FOR VIDEO TUTORIALS */}
      <VideoTutorialModal
        isOpen={!!selectedTutorial}
        onClose={() => setSelectedTutorial(null)}
        tutorial={selectedTutorial}
      />

      {/* FLOATING YOUTUBE PLAY-ALONG WIDGET */}
      {showYouTubePlayer && cleanVideoId && (
        <FloatingYouTubePlayer
          title={data.title}
          artist={data.artist}
          youtubeVideoId={cleanVideoId}
          onClose={() => setShowYouTubePlayer(false)}
        />
      )}

      {/* STICKY CONTROL PANEL */}
      <div className="no-print floating-controls fixed bottom-5 left-1/2 -translate-x-1/2 w-[94%] md:w-auto min-w-[320px] max-w-3xl bg-slate-950/90 backdrop-blur-2xl border border-white/15 rounded-2xl px-5 py-3.5 shadow-[0_10px_50px_rgba(0,0,0,0.95)] z-50 flex items-center justify-between gap-3 md:gap-5 transition-all">
        
        {/* Tool: Font Size */}
        <div className="flex flex-col items-center gap-1">
          <span className="text-[9px] text-slate-400 font-bold tracking-[0.15em] uppercase flex items-center gap-1">
            <Type className="w-2.5 h-2.5" /> Ukuran
          </span>
          <div className="flex items-center gap-1 bg-white/5 rounded-lg px-1 py-0.5 border border-white/10">
            <button onClick={() => adjustFontSize(-2)} className="p-1.5 hover:bg-white/10 rounded-md text-white transition-colors cursor-pointer">
              <Minus className="w-3 h-3" />
            </button>
            <span className="text-white font-mono font-bold w-5 text-center text-xs">{fontSize}</span>
            <button onClick={() => adjustFontSize(2)} className="p-1.5 hover:bg-white/10 rounded-md text-white transition-colors cursor-pointer">
              <Plus className="w-3 h-3" />
            </button>
          </div>
        </div>

        <div className="w-px h-8 bg-white/10"></div>

        {/* Tool: Transpose */}
        <div className="flex flex-col items-center gap-1">
          <span className="text-[9px] text-slate-400 font-bold tracking-[0.15em] uppercase">Nada</span>
          <div className="flex items-center gap-1 bg-primary/10 border border-primary/30 rounded-lg px-1 py-0.5">
            <button onClick={() => handleTranspose(-1)} className="p-1.5 hover:bg-primary/20 rounded-md text-primary transition-colors cursor-pointer">
              <Minus className="w-3 h-3" />
            </button>
            <span className="text-primary font-mono font-black w-7 text-center text-xs">
              {transpose > 0 ? `+${transpose}` : transpose}
            </span>
            <button onClick={() => handleTranspose(1)} className="p-1.5 hover:bg-primary/20 rounded-md text-primary transition-colors cursor-pointer">
              <Plus className="w-3 h-3" />
            </button>
          </div>
        </div>

        <div className="w-px h-8 bg-white/10"></div>

        {/* Tool: Simplifier */}
        <div className="flex flex-col items-center gap-1">
          <span className="text-[9px] text-slate-400 font-bold tracking-[0.15em] uppercase">Pemula</span>
          <button
            onClick={() => setIsSimplified(prev => !prev)}
            className={`p-1.5 px-2.5 rounded-lg border text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
              isSimplified 
                ? 'bg-primary text-white border-primary shadow-[0_0_15px_rgba(168,85,247,0.5)]' 
                : 'bg-white/5 border-white/10 text-slate-300 hover:text-white'
            }`}
            title="Sederhanakan Chord (S)"
          >
            <Wand2 className="w-3 h-3" />
            <span>{isSimplified ? 'ON' : 'OFF'}</span>
          </button>
        </div>

        <div className="w-px h-8 bg-white/10"></div>

        {/* Tool: Auto Scroll */}
        <div className="flex flex-col items-center md:items-start gap-1 flex-1 md:flex-none min-w-[150px] max-w-[210px]">
          <div className="flex items-center justify-between w-full">
            <span className="text-[9px] text-slate-400 font-bold tracking-[0.15em] uppercase flex items-center gap-1">
              <Settings2 className="w-2.5 h-2.5 text-primary" /> Scroll
            </span>
            <span className={`text-[10px] font-mono font-extrabold px-1.5 py-0.5 rounded transition-all ${
              autoScrollSpeed > 0 
                ? 'text-primary bg-primary/20 border border-primary/40 shadow-[0_0_12px_rgba(168,85,247,0.4)]' 
                : 'text-slate-500 bg-white/5 border border-white/5'
            }`}>
              {autoScrollSpeed > 0 ? `${autoScrollSpeed.toFixed(1)}x` : 'Off'}
            </span>
          </div>

          <div className="flex items-center gap-2 w-full">
            <button 
              onClick={() => setAutoScrollSpeed(prev => prev > 0 ? 0 : lastActiveSpeedRef.current)}
              className={`p-1.5 rounded-lg transition-all flex-shrink-0 cursor-pointer ${
                autoScrollSpeed > 0 
                  ? 'bg-primary text-white shadow-neon-sm scale-105' 
                  : 'bg-white/5 border border-white/10 text-white hover:bg-white/10'
              }`}
              title={autoScrollSpeed > 0 ? "Jeda Auto-Scroll (Spacebar)" : "Mulai Auto-Scroll (Spacebar)"}
            >
              {autoScrollSpeed > 0 ? <Pause className="w-3.5 h-3.5 fill-current" /> : <Play className="w-3.5 h-3.5 fill-current translate-x-0.5" />}
            </button>

            <input 
              type="range" 
              min="0.3" 
              max="5.0" 
              step="0.1"
              value={autoScrollSpeed > 0 ? autoScrollSpeed : lastActiveSpeedRef.current}
              onChange={(e) => {
                const val = Number(parseFloat(e.target.value).toFixed(1));
                lastActiveSpeedRef.current = val;
                setAutoScrollSpeed(val);
              }}
              className="w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-primary"
            />
          </div>

          {/* Quick Preset Buttons: 0.5x, 1.0x, 2.5x, 5.0x */}
          <div className="flex items-center justify-between w-full gap-1 pt-0.5">
            {[0.5, 1.0, 2.5, 5.0].map((preset) => (
              <button
                key={preset}
                onClick={() => {
                  lastActiveSpeedRef.current = preset;
                  setAutoScrollSpeed(preset);
                }}
                className={`text-[9px] font-mono px-1.5 py-0.5 rounded border transition-all cursor-pointer ${
                  autoScrollSpeed === preset
                    ? 'bg-primary text-white border-primary shadow-neon-sm font-bold scale-105'
                    : 'bg-white/5 border-white/10 text-slate-400 hover:text-white hover:bg-white/10'
                }`}
              >
                {preset.toFixed(1)}x
              </button>
            ))}
          </div>
        </div>

        <div className="w-px h-8 bg-white/10"></div>

        {/* Tool: Metronome Toggle */}
        <div className="flex flex-col items-center gap-1">
          <span className="text-[9px] text-slate-400 font-bold tracking-[0.15em] uppercase">Beat</span>
          <button
            onClick={() => setShowMetronome(prev => !prev)}
            className={`p-1.5 px-2.5 rounded-lg border text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
              showMetronome 
                ? 'bg-primary text-white border-primary shadow-[0_0_15px_rgba(168,85,247,0.5)]' 
                : 'bg-white/5 border-white/10 text-slate-300 hover:text-white'
            }`}
            title="Buka Metronom AI"
          >
            <Music2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Metronom</span>
          </button>
        </div>

        <div className="w-px h-8 bg-white/10"></div>

        {/* Tool: Print / Export PDF */}
        <div className="flex flex-col items-center gap-1">
          <span className="text-[9px] text-slate-400 font-bold tracking-[0.15em] uppercase">PDF</span>
          <button
            onClick={() => window.print()}
            className="p-1.5 px-2.5 rounded-lg border border-white/10 bg-white/5 text-slate-300 hover:text-white hover:bg-primary/20 hover:border-primary/50 text-xs font-bold transition-all cursor-pointer flex items-center gap-1 printable-button"
            title="Cetak / Export PDF Lagu Ini"
          >
            <Printer className="w-3.5 h-3.5 text-primary" />
            <span className="hidden sm:inline">Cetak</span>
          </button>
        </div>

        <div className="w-px h-8 bg-white/10"></div>

        {/* Tool: Chord Correction Modal */}
        <div className="flex flex-col items-center gap-1">
          <span className="text-[9px] text-slate-400 font-bold tracking-[0.15em] uppercase">Edit</span>
          <button
            onClick={() => setShowCorrectionModal(true)}
            className="p-1.5 px-2.5 rounded-lg border border-white/10 bg-white/5 text-slate-300 hover:text-white hover:bg-primary/20 hover:border-primary/50 text-xs font-bold transition-all cursor-pointer flex items-center gap-1"
            title="Saran Perbaikan Lirik & Chord"
          >
            <Edit3 className="w-3.5 h-3.5 text-primary" />
            <span className="hidden sm:inline">Perbaiki</span>
          </button>
        </div>

      </div>

      {/* CHORD CORRECTION MODAL */}
      <ChordCorrectionModal
        isOpen={showCorrectionModal}
        onClose={() => setShowCorrectionModal(false)}
        songId={data.id}
        songTitle={data.title}
        songArtist={data.artist}
        currentContent={data.content}
      />

      {/* FLOATING METRONOME WIDGET */}
      {showMetronome && (
        <div className="fixed bottom-24 right-4 z-[90] animate-fade-in no-print">
          <Metronome onClose={() => setShowMetronome(false)} />
        </div>
      )}

      {/* CHORD FRETBOARD DIAGRAM POPUP MODAL */}
      <FretboardModal 
        chordName={selectedChordForDiagram} 
        onClose={() => setSelectedChordForDiagram(null)} 
      />

      {/* SETLIST SELECTION MODAL */}
      {showSetlistModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
          <div className="relative w-full max-w-md bg-surface border border-white/15 rounded-2xl p-6 shadow-[0_0_50px_rgba(168,85,247,0.3)] text-white">
            <button 
              onClick={() => setShowSetlistModal(false)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-full transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3 mb-4 border-b border-white/10 pb-3">
              <FolderPlus className="w-6 h-6 text-primary" />
              <div>
                <h3 className="text-xl font-bold">Simpan ke Setlist</h3>
                <p className="text-xs text-slate-400">Pilih folder setlist atau buat baru</p>
              </div>
            </div>

            {/* List of existing setlists */}
            <div className="space-y-2.5 max-h-52 overflow-y-auto pr-1 mb-4">
              {userSetlists.length === 0 ? (
                <p className="text-xs text-slate-500 text-center py-4">Belum ada setlist. Buat setlist baru di bawah.</p>
              ) : (
                userSetlists.map(setlist => {
                  const isAdded = addedSetlistIds.includes(setlist.id) || setlist.song_ids.includes(data.id);
                  return (
                    <div
                      key={setlist.id}
                      className="flex items-center justify-between p-3 bg-black/50 hover:bg-white/5 border border-white/10 rounded-xl transition-all"
                    >
                      <div>
                        <p className="text-xs font-bold text-white">{setlist.name}</p>
                        <p className="text-[10px] text-slate-400">{setlist.song_ids.length} Lagu</p>
                      </div>
                      <button
                        onClick={() => !isAdded && handleAddSongToSetlist(setlist.id)}
                        disabled={isAdded}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-all ${
                          isAdded
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                            : 'bg-primary text-white hover:bg-primary-light cursor-pointer shadow-neon-sm'
                        }`}
                      >
                        {isAdded ? <Check className="w-3.5 h-3.5" /> : <PlusCircle className="w-3.5 h-3.5" />}
                        <span>{isAdded ? 'Tersimpan' : 'Tambah'}</span>
                      </button>
                    </div>
                  );
                })
              )}
            </div>

            {/* Create new setlist form */}
            <form onSubmit={handleCreateNewSetlist} className="pt-3 border-t border-white/10 flex gap-2">
              <input
                type="text"
                placeholder="Nama setlist baru..."
                value={newSetlistName}
                onChange={(e) => setNewSetlistName(e.target.value)}
                className="flex-1 bg-black/60 border border-white/15 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-primary"
              />
              <button
                type="submit"
                disabled={isCreatingSetlist}
                className="px-4 py-2 bg-primary text-white font-bold rounded-xl text-xs hover:bg-primary-light cursor-pointer disabled:opacity-50 flex-shrink-0"
              >
                {isCreatingSetlist ? "..." : "+ Buat"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* KEYBOARD SHORTCUTS GUIDE MODAL */}
      {showShortcutsGuide && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
          <div className="relative w-full max-w-md bg-surface border border-white/15 rounded-2xl p-6 shadow-[0_0_50px_rgba(168,85,247,0.3)] text-white">
            <button 
              onClick={() => setShowShortcutsGuide(false)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-full transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3 mb-4 border-b border-white/10 pb-3">
              <Keyboard className="w-6 h-6 text-primary" />
              <h3 className="text-xl font-bold">Pintas Keyboard (Hands-Free)</h3>
            </div>

            <div className="space-y-3 text-sm">
              <div className="flex justify-between items-center bg-white/5 p-2.5 rounded-lg border border-white/5">
                <span className="text-slate-300">Play / Pause Scroll</span>
                <kbd className="px-2.5 py-1 bg-primary/20 text-primary border border-primary/30 rounded font-mono font-bold text-xs">Spacebar</kbd>
              </div>
              <div className="flex justify-between items-center bg-white/5 p-2.5 rounded-lg border border-white/5">
                <span className="text-slate-300">Kecepatan Scroll +/-</span>
                <kbd className="px-2.5 py-1 bg-white/10 text-white border border-white/20 rounded font-mono font-bold text-xs">↑ / ↓</kbd>
              </div>
              <div className="flex justify-between items-center bg-white/5 p-2.5 rounded-lg border border-white/5">
                <span className="text-slate-300">Transpose Nada +/-</span>
                <kbd className="px-2.5 py-1 bg-white/10 text-white border border-white/20 rounded font-mono font-bold text-xs">← / →</kbd>
              </div>
              <div className="flex justify-between items-center bg-white/5 p-2.5 rounded-lg border border-white/5">
                <span className="text-slate-300">Toggle Chord Pemula</span>
                <kbd className="px-2.5 py-1 bg-primary/20 text-primary border border-primary/30 rounded font-mono font-bold text-xs">S</kbd>
              </div>
            </div>

            <div className="mt-6 text-right">
              <button 
                onClick={() => setShowShortcutsGuide(false)}
                className="px-5 py-2 bg-primary text-white font-bold rounded-xl text-xs hover:bg-primary-light transition-colors cursor-pointer shadow-neon-sm"
              >
                Paham
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CHORD CORRECTION MODAL */}
      <ChordCorrectionModal
        isOpen={showCorrectionModal}
        onClose={() => setShowCorrectionModal(false)}
        songId={data.id}
        songTitle={data.title}
        songArtist={data.artist}
        currentContent={data.content}
      />

      {/* AUTH MODAL */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        initialMode="signin"
        reason={authModalReason}
      />

    </div>
  );
}
