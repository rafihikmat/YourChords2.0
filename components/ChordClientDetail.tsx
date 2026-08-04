"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { 
  Play, Minus, Plus, Settings2, Copy, Check, Pause, Type, Music, Heart, Wand2, 
  Sparkles, Keyboard, X, Youtube, FolderPlus, FileText, Save, CheckCircle2, 
  Printer, Music2, Edit3, Volume2, Shield, Eye, Flame
} from "lucide-react";
import { transposeChordLine, simplifyChordLine, calculateCapoTranspose, CHORD_REGEX, SINGLE_CHORD_REGEX } from "@/lib/transposer";
import { 
  toggleSongFavorite, checkIsSongLiked, getUserSongNote 
} from "@/lib/userPreferences";
import { saveUserSongNote } from "@/lib/userDashboard";
import { 
  getUserSetlists, addSongToSetlist, createSetlist 
} from "@/lib/setlists";
import { incrementSongViews } from "@/lib/supabase";
import { useAuth } from "@/lib/authContext";
import AuthModal from "@/components/AuthModal";
import { getVideoTutorials, VideoTutorial } from "@/lib/adminCurated";
import { ChordVisualizer } from "@/components/ui/ChordVisualizer";
import FloatingYouTubePlayer from "@/components/FloatingYouTubePlayer";
import Metronome from "@/components/Metronome";
import SongRating from "@/components/SongRating";
import ChordCorrectionModal from "@/components/ChordCorrectionModal";
import VideoTutorialModal from "@/components/VideoTutorialModal";
import { saveSongToOfflineCache } from "@/lib/offlineCache";
import { Setlist } from "@/lib/types";
import { extractYouTubeId } from "@/lib/youtube";

// Cyber Atomic Components
import CyberButton from "@/components/ui/CyberButton";
import CyberCard from "@/components/ui/CyberCard";
import CyberBadge from "@/components/ui/CyberBadge";
import CyberModal from "@/components/ui/CyberModal";

type ChordData = {
  id: string;
  title: string;
  artist: string;
  cover_url?: string;
  content: string;
  youtube_video_id?: string | null;
  difficulty?: string | null;
  key?: string | null;
  views?: number;
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
  const [isPlayingSynth, setIsPlayingSynth] = useState(false);
  
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

  // Personal Notes State
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

  // Teleprompter Auto-Scroll
  const [autoScrollSpeed, setAutoScrollSpeed] = useState(0); 
  const lastActiveSpeedRef = useRef(1.0);
  const scrollAccumulatorRef = useRef(0);
  const scrollRef = useRef<number | null>(null);

  const activeUserId = user?.id || "guest";
  const cleanVideoId = extractYouTubeId(data?.youtube_video_id);

  // Initial Load & Offline Cache
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

  // Audio Synth Strumming Engine (Web Audio API)
  const playStrumSound = (chordName = data?.key || "C") => {
    if (typeof window === "undefined" || !window.AudioContext) return;
    try {
      setIsPlayingSynth(true);
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioCtx();
      const baseFreqs = [82.41, 110.00, 146.83, 196.00, 246.94, 329.63];
      
      baseFreqs.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "triangle";
        osc.frequency.setValueAtTime(freq * Math.pow(2, (i % 5) / 12), ctx.currentTime);
        const strumDelay = i * 0.04;
        gain.gain.setValueAtTime(0, ctx.currentTime + strumDelay);
        gain.gain.linearRampToValueAtTime(0.2, ctx.currentTime + strumDelay + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + strumDelay + 1.2);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + strumDelay);
        osc.stop(ctx.currentTime + strumDelay + 1.3);
      });

      setTimeout(() => setIsPlayingSynth(false), 1400);
    } catch (e) {
      console.warn("[AUDIO SYNTH ERROR]:", e);
      setIsPlayingSynth(false);
    }
  };

  // Open Setlist Modal
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

  // Toggle Favorite
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

  // Trigger Auth Modal
  const triggerAuthGuard = (reasonMessage = "Login untuk menyimpan catatan & pola genjrengan pribadi Anda.") => {
    setAuthModalReason(reasonMessage);
    setIsAuthModalOpen(true);
  };

  // Save Personal Note
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

  // Teleprompter Auto-Scroll Engine
  useEffect(() => {
    if (autoScrollSpeed > 0) {
      lastActiveSpeedRef.current = autoScrollSpeed;

      const scrollLoop = () => {
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

  // Keyboard Shortcuts
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

  // Total Transpose Calculation
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

  const coverUrl = data?.cover_url || "https://images.unsplash.com/photo-1511192336575-5a79af67a629?q=80&w=600&h=600&auto=format&fit=crop";
  const processedLines = getProcessedLines();

  // Difficulty Label & Color
  const difficultyMap: Record<string, { label: string; variant: "green" | "purple" | "amber" | "rose" }> = {
    "sangat mudah": { label: "Sangat Mudah", variant: "green" },
    "mudah": { label: "Mudah", variant: "green" },
    "sedang": { label: "Sedang", variant: "amber" },
    "sulit": { label: "Sulit", variant: "rose" },
  };
  const diffInfo = difficultyMap[(data?.difficulty || "mudah").toLowerCase()] || { label: "Mudah", variant: "green" };

  return (
    <div className="flex flex-col min-h-screen pb-40 relative pt-20">
      
      {/* PRINT HEADER */}
      <div className="print-header hidden print:block mb-6">
        <h1 className="text-2xl font-bold">{data.title}</h1>
        <h2 className="text-lg text-gray-700">{data.artist}</h2>
        <div className="text-xs text-gray-600 mt-2 flex flex-wrap gap-4 border-t border-gray-300 pt-2">
          <span><strong>Key:</strong> {data.key || "C"}</span>
          <span><strong>Capo:</strong> {capoFret > 0 ? `Fret ${capoFret}` : "Tanpa Capo"}</span>
          <span><strong>Transpose:</strong> {transpose > 0 ? `+${transpose}` : transpose}</span>
          <span><strong>Platform:</strong> YourChords 2.0</span>
        </div>
      </div>

      {/* 1. SONG HERO METADATA CARD */}
      <div className="no-print mx-4 md:mx-8 lg:mx-12 mb-8">
        <CyberCard variant="glowing" padding="lg">
          <div className="flex flex-col md:flex-row gap-6 md:items-center justify-between">
            
            <div className="flex flex-col md:flex-row gap-6 items-start md:items-center">
              {/* Cover Album */}
              <div className="relative w-28 h-28 md:w-36 md:h-36 rounded-2xl overflow-hidden shrink-0 bg-slate-900 border border-purple-500/30 shadow-[0_0_30px_rgba(168,85,247,0.3)] group">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img 
                  src={coverUrl} 
                  alt={data.title}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent pointer-events-none" />
              </div>

              {/* Title, Artist & Badges */}
              <div className="space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <CyberBadge variant="purple" size="sm">
                    {data.key ? `Key: ${data.key}` : "Key: C"}
                  </CyberBadge>

                  <CyberBadge variant={diffInfo.variant} size="sm">
                    {diffInfo.label}
                  </CyberBadge>

                  <CyberBadge variant="cyan" size="sm" icon={<Flame className="w-3 h-3 text-cyan-400" />}>
                    120 BPM
                  </CyberBadge>
                </div>

                <h1 className="text-3xl md:text-5xl font-black text-white tracking-tight glow-text-purple">
                  {data.title}
                </h1>

                <p className="text-base md:text-lg text-slate-300 font-semibold flex items-center gap-2">
                  <span>oleh</span>
                  <Link href="/artists" className="text-cyan-400 hover:text-cyan-300 underline underline-offset-4 transition-colors">
                    {data.artist}
                  </Link>
                </p>
              </div>
            </div>

            {/* Action Bar Buttons */}
            <div className="flex flex-wrap md:flex-col lg:flex-row items-center gap-3 pt-4 md:pt-0 border-t md:border-t-0 border-purple-500/15">
              <CyberButton
                variant={isFavorite ? "danger" : "outline"}
                size="md"
                onClick={handleToggleFavorite}
                leftIcon={<Heart className={`w-4 h-4 ${isFavorite ? "fill-current text-white" : ""}`} />}
              >
                {isFavorite ? "Disukai" : "Sukai"}
              </CyberButton>

              <CyberButton
                variant="cyan"
                size="md"
                onClick={handleOpenSetlistModal}
                leftIcon={<FolderPlus className="w-4 h-4" />}
              >
                Setlist (+)
              </CyberButton>

              <CyberButton
                variant="ghost"
                size="md"
                onClick={handleOpenCorrectionModal}
                leftIcon={<Edit3 className="w-4 h-4 text-purple-400" />}
              >
                Laporkan Typo
              </CyberButton>
            </div>

          </div>
        </CyberCard>
      </div>

      {/* PERSONAL NOTES & STRUMMING PATTERN ENGINE */}
      <div className="no-print w-full max-w-4xl mx-auto px-4 md:px-0 mb-6">
        <CyberCard variant="default" padding="md" className="relative">
          {!user && (
            <div 
              onClick={() => triggerAuthGuard("Login untuk menyimpan catatan & pola genjrengan pribadi Anda.")}
              className="absolute inset-0 z-20 bg-slate-950/85 backdrop-blur-[2px] border border-purple-500/30 rounded-2xl p-5 flex flex-col items-center justify-center text-center cursor-pointer group transition-all hover:bg-slate-950/90"
            >
              <div className="flex items-center gap-2 text-purple-300 font-bold text-xs md:text-sm mb-1 group-hover:scale-105 transition-transform">
                <span className="text-base">🔒</span>
                <span>Catatan & Genjrengan Pribadi</span>
              </div>
              <p className="text-xs text-slate-400 max-w-md px-4 leading-relaxed font-medium">
                Silakan <span className="text-cyan-400 font-bold underline">Sign In</span> atau <span className="text-cyan-400 font-bold underline">Daftar Akun</span> untuk menyimpan catatan pribadi lagu ini.
              </p>
            </div>
          )}

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-cyan-400" />
              <h3 className="text-sm font-extrabold text-white">Catatan Pribadi & Strumming Pattern</h3>
            </div>

            <div className="flex items-center gap-2">
              {noteSaveSuccess && (
                <span className="text-xs text-emerald-400 font-extrabold flex items-center gap-1 bg-emerald-950/40 border border-emerald-500/30 px-2.5 py-1 rounded-lg">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Tersimpan!
                </span>
              )}
              <CyberButton
                variant="outline"
                size="sm"
                onClick={handleSaveNote}
                isLoading={isSavingNote}
                leftIcon={<Save className="w-3.5 h-3.5" />}
              >
                Simpan Catatan
              </CyberButton>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 mb-3 pt-2 border-t border-purple-500/10">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Preset Genjrengan:</span>
            {['D - D - U - U - D - U (Pop 4/4)', 'D - D - U - D - U (Ballad)', 'D - U - D - U (Cepat)', 'D - U - U (Waltz)'].map((pattern) => (
              <button
                key={pattern}
                onClick={() => applyStrummingPreset(pattern)}
                className="px-2.5 py-1 bg-slate-900 hover:bg-purple-950/40 border border-purple-500/20 rounded-lg text-[11px] text-slate-300 font-mono hover:text-cyan-300 transition-colors cursor-pointer"
              >
                {pattern}
              </button>
            ))}
          </div>

          <textarea
            rows={2}
            value={userNote}
            readOnly={!user}
            onClick={() => !user && triggerAuthGuard("Login untuk menyimpan catatan & pola genjrengan pribadi Anda.")}
            onChange={(e) => user && setUserNote(e.target.value)}
            placeholder={user ? "Tulis pola genjrengan (misal: D-D-U-U-D-U) atau pengingat nada di sini..." : "Silakan Sign In untuk menulis catatan..."}
            className={`w-full bg-slate-950/80 border border-purple-500/20 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 resize-y font-sans ${!user ? 'cursor-not-allowed opacity-60' : ''}`}
          />
        </CyberCard>
      </div>

      {/* 3. HIGH-READABILITY INTERACTIVE CHORD SHEET */}
      <div className="w-full max-w-4xl mx-auto px-4 md:px-0 relative mb-12">
        
        {/* Capo Instruction Banner */}
        {capoFret > 0 && (
          <div className="no-print mb-4 bg-purple-950/40 border border-purple-500/30 text-purple-200 rounded-xl p-3.5 px-5 flex items-center gap-3 backdrop-blur-md shadow-glow-sm">
            <span className="text-lg">📌</span>
            <div className="text-xs md:text-sm">
              <span className="font-extrabold text-white">Petunjuk Capo: </span>
              Pasang <span className="font-bold text-cyan-300 underline">Capo di Fret {capoFret}</span> pada gitar Anda untuk memainkan nada asli lagu ini!
            </div>
          </div>
        )}

        {/* Copy Button */}
        <button 
          onClick={copyToClipboard}
          className="no-print absolute -top-12 right-4 md:top-4 md:right-4 p-2 bg-slate-900 hover:bg-slate-800 rounded-xl border border-purple-500/30 text-slate-300 hover:text-cyan-400 transition-all z-30 flex items-center gap-2 text-xs font-bold cursor-pointer"
          title="Salin Chord"
        >
          {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
          <span className="hidden md:inline">{copied ? "Tersalin!" : "Salin Chord"}</span>
        </button>

        {/* Chord Sheet Box */}
        <div className="chord-sheet-container bg-slate-950/80 p-6 md:p-10 rounded-2xl border border-slate-800/80 overflow-x-auto backdrop-blur-md shadow-2xl">
          <div 
            className="font-mono text-slate-200 whitespace-pre leading-relaxed select-text"
            style={{ fontSize: `${fontSize}px`, lineHeight: '2.1' }}
          >
            {processedLines.map((line, idx) => {
              const parts = line.split(CHORD_REGEX);
              return (
                <div key={idx} className="lyric-line min-h-[1.5em]">
                  {parts.map((part, partIdx) => {
                    if (SINGLE_CHORD_REGEX.test(part)) {
                      return (
                        <button
                          key={partIdx}
                          onClick={() => setSelectedChordForDiagram(part)}
                          className="chord-badge chord-text font-black text-cyan-400 cursor-pointer hover:text-white transition-all bg-cyan-950/40 hover:bg-cyan-600/30 px-2 py-0.5 rounded-md border border-cyan-500/40 hover:border-cyan-400 mx-0.5 inline-block shadow-[0_0_12px_rgba(6,182,212,0.3)] hover:shadow-[0_0_20px_rgba(6,182,212,0.6)] hover:scale-105"
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

        {/* 4. DIFFICULTY VOTING & SONG RATING */}
        <div className="no-print mt-6">
          <SongRating songId={data.id} songTitle={data.title} initialDifficulty={data.difficulty} />
        </div>
      </div>

      {/* VIDEO TUTORIALS SECTION */}
      {videoTutorials.length > 0 && (
        <div className="no-print w-full max-w-4xl mx-auto px-4 md:px-0 mb-12">
          <CyberCard variant="default" padding="md">
            <div className="flex items-center gap-3 border-b border-purple-500/15 pb-3 mb-4">
              <div className="p-2 rounded-xl bg-red-600/20 text-red-400 border border-red-500/30">
                <Youtube className="w-5 h-5 fill-current" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-white">Video Tutorial Gitar</h3>
                <p className="text-xs text-slate-400">Panduan belajar dan kunci gitar untuk lagu ini</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {videoTutorials.map((tutorial) => (
                <button
                  key={tutorial.id}
                  onClick={() => setSelectedTutorial(tutorial)}
                  className="bg-slate-950 rounded-xl border border-purple-500/20 p-3 flex flex-col gap-2.5 hover:border-red-500/50 transition-all group text-left cursor-pointer w-full"
                >
                  <div className="relative aspect-video rounded-lg overflow-hidden bg-slate-900 border border-white/10 w-full">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={tutorial.thumbnail_url || `https://img.youtube.com/vi/${extractYouTubeId(tutorial.video_id) || tutorial.video_id}/hqdefault.jpg`}
                      alt={tutorial.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 flex items-center justify-center transition-colors">
                      <div className="w-10 h-10 rounded-full bg-red-600 text-white flex items-center justify-center shadow-lg transform group-hover:scale-110 transition-transform">
                        <Play className="w-5 h-5 fill-current translate-x-0.5" />
                      </div>
                    </div>
                  </div>
                  <h4 className="text-xs font-bold text-white line-clamp-2 group-hover:text-red-400 transition-colors">
                    {tutorial.title}
                  </h4>
                </button>
              ))}
            </div>
          </CyberCard>
        </div>
      )}

      {/* 2. FLOATING GLASS TOOLBAR CONTROL BAR */}
      <div className="no-print fixed bottom-6 left-1/2 -translate-x-1/2 z-40 max-w-[95vw] md:max-w-none">
        <div className="bg-slate-900/85 backdrop-blur-2xl border border-purple-500/30 rounded-full px-5 md:px-6 py-2.5 md:py-3 shadow-2xl flex items-center gap-3 md:gap-5 overflow-x-auto scrollbar-none">
          
          {/* Audio Synth Strumming */}
          <CyberButton
            variant="cyan"
            size="sm"
            onClick={() => playStrumSound(data?.key || "C")}
            isLoading={isPlayingSynth}
            leftIcon={<Volume2 className="w-3.5 h-3.5" />}
            title="Bunyi Genjreng Chord Audio Synth"
          >
            Genjreng
          </CyberButton>

          <div className="w-px h-6 bg-purple-500/20 shrink-0" />

          {/* Smart Transposer Section */}
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider">Nada:</span>
            <CyberButton
              variant="ghost"
              size="sm"
              onClick={() => handleTranspose(-1)}
              className="px-2"
            >
              <Minus className="w-3 h-3" />
            </CyberButton>

            <span className="text-xs font-mono font-bold text-purple-300 min-w-[32px] text-center">
              {transpose === 0 ? "Orig" : transpose > 0 ? `+${transpose}` : transpose}
            </span>

            <CyberButton
              variant="ghost"
              size="sm"
              onClick={() => handleTranspose(1)}
              className="px-2"
            >
              <Plus className="w-3 h-3" />
            </CyberButton>
          </div>

          <div className="w-px h-6 bg-purple-500/20 shrink-0" />

          {/* Capo Selector */}
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider">Capo:</span>
            <select 
              value={capoFret} 
              onChange={(e) => setCapoFret(Number(e.target.value))}
              className="bg-slate-950 text-cyan-300 border border-purple-500/30 rounded-lg text-xs font-bold px-2 py-1 outline-none cursor-pointer"
            >
              <option value={0}>Off</option>
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(fret => (
                <option key={fret} value={fret}>Fret {fret}</option>
              ))}
            </select>
          </div>

          <div className="w-px h-6 bg-purple-500/20 shrink-0" />

          {/* Pemula / Simplifier Switch */}
          <CyberButton
            variant={isSimplified ? "primary" : "ghost"}
            size="sm"
            onClick={() => setIsSimplified(prev => !prev)}
            leftIcon={<Wand2 className="w-3.5 h-3.5" />}
            title="Sederhanakan Chord (Pemula)"
          >
            {isSimplified ? "Pemula ON" : "Pemula"}
          </CyberButton>

          <div className="w-px h-6 bg-purple-500/20 shrink-0" />

          {/* Auto-Scroll Teleprompter */}
          <div className="flex items-center gap-2 shrink-0">
            <CyberButton
              variant={autoScrollSpeed > 0 ? "cyan" : "outline"}
              size="sm"
              onClick={() => setAutoScrollSpeed(prev => prev > 0 ? 0 : lastActiveSpeedRef.current)}
              leftIcon={autoScrollSpeed > 0 ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            >
              {autoScrollSpeed > 0 ? `${autoScrollSpeed.toFixed(1)}x` : "Scroll"}
            </CyberButton>

            {/* Speed Presets */}
            <div className="hidden lg:flex items-center gap-1">
              {[1.0, 2.0, 3.0].map((spd) => (
                <button
                  key={spd}
                  onClick={() => {
                    lastActiveSpeedRef.current = spd;
                    setAutoScrollSpeed(spd);
                  }}
                  className={`text-[10px] font-mono px-1.5 py-0.5 rounded transition-all ${
                    autoScrollSpeed === spd
                      ? 'bg-cyan-500 text-white font-bold'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {spd}x
                </button>
              ))}
            </div>
          </div>

          <div className="w-px h-6 bg-purple-500/20 shrink-0" />

          {/* Metronome & Print */}
          <div className="flex items-center gap-1.5 shrink-0">
            <CyberButton
              variant={showMetronome ? "primary" : "ghost"}
              size="sm"
              onClick={() => setShowMetronome(prev => !prev)}
              leftIcon={<Music2 className="w-3.5 h-3.5" />}
              title="Buka Metronom AI"
            >
              Beat
            </CyberButton>

            <CyberButton
              variant="ghost"
              size="sm"
              onClick={() => window.print()}
              leftIcon={<Printer className="w-3.5 h-3.5" />}
              title="Cetak PDF"
            >
              PDF
            </CyberButton>
          </div>

        </div>
      </div>

      {/* METRONOME OVERLAY */}
      {showMetronome && (
        <div className="fixed bottom-24 right-4 z-[90] animate-fade-in no-print">
          <Metronome onClose={() => setShowMetronome(false)} />
        </div>
      )}

      {/* CHORD VISUALIZER MODAL */}
      <CyberModal
        isOpen={!!selectedChordForDiagram}
        onClose={() => setSelectedChordForDiagram(null)}
        title={`Diagram Chord: ${selectedChordForDiagram}`}
      >
        {selectedChordForDiagram && (
          <ChordVisualizer
            chordName={selectedChordForDiagram}
            initialInstrument="guitar"
            showSwitcher={true}
          />
        )}
      </CyberModal>

      {/* VIDEO TUTORIAL MODAL */}
      <VideoTutorialModal
        isOpen={!!selectedTutorial}
        onClose={() => setSelectedTutorial(null)}
        tutorial={selectedTutorial}
      />

      {/* FLOATING YOUTUBE PLAYER */}
      {showYouTubePlayer && cleanVideoId && (
        <FloatingYouTubePlayer
          title={data.title}
          artist={data.artist}
          youtubeVideoId={cleanVideoId}
          onClose={() => setShowYouTubePlayer(false)}
        />
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

      {/* SETLIST MODAL */}
      <CyberModal
        isOpen={showSetlistModal}
        onClose={() => setShowSetlistModal(false)}
        title="Simpan ke Setlist"
        description="Pilih folder setlist atau buat baru"
      >
        <div className="space-y-4 pt-2">
          <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
            {userSetlists.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-4">Belum ada setlist. Buat setlist baru di bawah.</p>
            ) : (
              userSetlists.map(setlist => {
                const isAdded = addedSetlistIds.includes(setlist.id) || setlist.song_ids?.includes(data.id);
                return (
                  <div
                    key={setlist.id}
                    className="flex items-center justify-between p-3 bg-slate-950 border border-purple-500/20 rounded-xl"
                  >
                    <div>
                      <p className="text-xs font-bold text-white">{setlist.name}</p>
                      <p className="text-[10px] text-slate-400">{setlist.song_ids?.length || 0} Lagu</p>
                    </div>
                    <CyberButton
                      variant={isAdded ? "ghost" : "cyan"}
                      size="sm"
                      disabled={isAdded}
                      onClick={() => !isAdded && handleAddSongToSetlist(setlist.id)}
                    >
                      {isAdded ? "Tersimpan ✓" : "+ Tambah"}
                    </CyberButton>
                  </div>
                );
              })
            )}
          </div>

          <form onSubmit={handleCreateNewSetlist} className="pt-3 border-t border-purple-500/15 flex gap-2">
            <input
              type="text"
              value={newSetlistName}
              onChange={(e) => setNewSetlistName(e.target.value)}
              placeholder="Nama setlist baru..."
              className="flex-1 bg-slate-950 border border-purple-500/30 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 outline-none focus:border-purple-500"
            />
            <CyberButton
              type="submit"
              variant="primary"
              size="sm"
              isLoading={isCreatingSetlist}
            >
              Buat
            </CyberButton>
          </form>
        </div>
      </CyberModal>

      {/* AUTH MODAL REASON PROMPT */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        initialMode="signin"
      />

    </div>
  );
}
