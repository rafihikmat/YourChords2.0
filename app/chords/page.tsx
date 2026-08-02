"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { 
  Sparkles, Volume2, ChevronLeft, ChevronRight, Search, 
  Music, ArrowRight, Layers, Sliders, BookOpen, Guitar
} from "lucide-react";
import { getChordPositions, ChordPosition } from "@/lib/chordDb";
import { supabase, normalizeSong } from "@/lib/supabase";
import { Song } from "@/lib/types";
import { INITIAL_FALLBACK_CHORDS } from "@/lib/fallbackData";
import CyberButton from "@/components/ui/CyberButton";
import CyberCard from "@/components/ui/CyberCard";
import CyberBadge from "@/components/ui/CyberBadge";

export default function ChordsDictionaryPage() {
  const [selectedRoot, setSelectedRoot] = useState<string>("C");
  const [selectedSuffix, setSelectedSuffix] = useState<string>("");
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  
  const [songsUsingChord, setSongsUsingChord] = useState<Song[]>([]);
  const [loadingSongs, setLoadingSongs] = useState<boolean>(true);

  // Filter tabs for root keys [C, D, E, F, G, A, B] + Sharps
  const roots = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
  
  // Quick variations [ Major, Minor, 7th, maj7, m7, sus2, sus4, dim, aug, add9 ]
  const qualities = [
    { label: "Major", suffix: "" },
    { label: "Minor", suffix: "m" },
    { label: "7th", suffix: "7" },
    { label: "maj7", suffix: "maj7" },
    { label: "m7", suffix: "m7" },
    { label: "sus2", suffix: "sus2" },
    { label: "sus4", suffix: "sus4" },
    { label: "dim", suffix: "dim" },
    { label: "aug", suffix: "aug" },
    { label: "add9", suffix: "add9" },
  ];

  const currentChordName = `${selectedRoot}${selectedSuffix}`;

  useEffect(() => {
    setCurrentIndex(0);
  }, [selectedRoot, selectedSuffix]);

  useEffect(() => {
    async function fetchSongsForChord() {
      setLoadingSongs(true);
      try {
        const { data, error } = await supabase
          .from("songs")
          .select("*, albums(cover_url)")
          .or(`chords.ilike.%${currentChordName}%,content.ilike.%${currentChordName}%`)
          .order("view_count", { ascending: false })
          .limit(6);

        if (!error && data && data.length > 0) {
          setSongsUsingChord(data.map(normalizeSong));
        } else {
          const filteredFallback = INITIAL_FALLBACK_CHORDS.filter(s => {
            const txt = typeof s.chords === "string" ? s.chords : s.content || "";
            return txt.includes(currentChordName);
          }).slice(0, 6);

          if (filteredFallback.length > 0) {
            setSongsUsingChord(filteredFallback);
          } else {
            setSongsUsingChord(INITIAL_FALLBACK_CHORDS.slice(0, 4));
          }
        }
      } catch (err) {
        console.warn("[FETCH SONGS FOR CHORD ERROR]:", err);
        setSongsUsingChord(INITIAL_FALLBACK_CHORDS.slice(0, 4));
      } finally {
        setLoadingSongs(false);
      }
    }

    fetchSongsForChord();
  }, [currentChordName]);

  const positions: ChordPosition[] = getChordPositions(currentChordName);
  const position: ChordPosition = positions[currentIndex] || positions[0] || {
    frets: [-1, 3, 2, 0, 1, 0],
    fingers: [0, 3, 2, 0, 1, 0],
    baseFret: 1
  };

  const stringNames = ['E6', 'A5', 'D4', 'G3', 'B2', 'E1'];
  const numStrings = 6;
  const numFrets = 4;
  const startX = 50;
  const startY = 75;
  const stringGap = 30;
  const fretGap = 45;

  const handlePlayChord = () => {
    if (typeof window === "undefined") return;
    try {
      setIsPlaying(true);
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();

      const baseFreqs = [82.41, 110.00, 146.83, 196.00, 246.94, 329.63];

      position.frets.forEach((fret, i) => {
        if (fret >= 0) {
          const freq = baseFreqs[i] * Math.pow(2, fret / 12);
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();

          osc.type = "triangle";
          osc.frequency.setValueAtTime(freq, ctx.currentTime);

          const strumDelay = i * 0.04;
          gain.gain.setValueAtTime(0, ctx.currentTime + strumDelay);
          gain.gain.linearRampToValueAtTime(0.25, ctx.currentTime + strumDelay + 0.02);
          gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + strumDelay + 1.2);

          osc.connect(gain);
          gain.connect(ctx.destination);

          osc.start(ctx.currentTime + strumDelay);
          osc.stop(ctx.currentTime + strumDelay + 1.3);
        }
      });

      setTimeout(() => setIsPlaying(false), 1400);
    } catch (e) {
      console.warn("[AUDIO SYNTH ERROR]:", e);
      setIsPlaying(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pt-20 pb-24 px-4 sm:px-6 lg:px-12 selection:bg-purple-600 selection:text-white">
      <div className="max-w-7xl mx-auto space-y-8">

        {/* HERO BANNER SECTION */}
        <CyberCard variant="glowing" padding="lg" className="text-center relative overflow-hidden">
          <div className="absolute -top-24 -left-24 w-72 h-72 bg-purple-600/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -right-24 w-72 h-72 bg-cyan-600/20 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 max-w-3xl mx-auto space-y-4">
            <CyberBadge variant="amber" icon={<BookOpen className="w-3.5 h-3.5 text-amber-400" />}>
              Interaktif Kamus Chord
            </CyberBadge>

            <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white">
              Kamus Chord Gitar & <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-cyan-300 to-indigo-400">Variasi Fretboard</span>
            </h1>

            <p className="text-slate-300 text-xs sm:text-sm leading-relaxed max-w-2xl mx-auto">
              Pelajari bentuk kunci gitar dari dasar hingga tingkat lanjut lengkap dengan variasi posisi fret, posisi jari, dan audio genjreng interaktif.
            </p>
          </div>
        </CyberCard>

        {/* MAIN SELECTOR & VISUALIZER GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* LEFT: INTERACTIVE SELECTORS (7 COLS) */}
          <div className="lg:col-span-7 space-y-6">
            <CyberCard variant="default" padding="lg" className="space-y-6">
              
              {/* TAB 1 - ROOT KEYS */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                    <Sliders className="w-4 h-4 text-purple-400" />
                    <span>1. Pilih Nada Dasar (Root Key)</span>
                  </label>
                  <CyberBadge variant="purple" size="sm">
                    Root: {selectedRoot}
                  </CyberBadge>
                </div>

                <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                  {roots.map((root) => {
                    const isSelected = selectedRoot === root;
                    return (
                      <button
                        key={root}
                        onClick={() => setSelectedRoot(root)}
                        className={`py-3 rounded-xl font-mono text-sm font-black transition-all cursor-pointer ${
                          isSelected
                            ? "bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-glow-sm border border-purple-400/50 scale-105"
                            : "bg-slate-950/80 border border-purple-500/20 text-slate-300 hover:border-purple-500/50 hover:text-white"
                        }`}
                      >
                        {root}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* TAB 2 - QUALITIES / VARIATIONS */}
              <div className="space-y-3 pt-4 border-t border-purple-500/15">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                    <Layers className="w-4 h-4 text-amber-400" />
                    <span>2. Pilih Variasi Chord</span>
                  </label>
                  <CyberBadge variant="amber" size="sm">
                    {currentChordName}
                  </CyberBadge>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  {qualities.map((q) => {
                    const isSelected = selectedSuffix === q.suffix;
                    return (
                      <button
                        key={q.label}
                        onClick={() => setSelectedSuffix(q.suffix)}
                        className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex flex-col items-center justify-center cursor-pointer ${
                          isSelected
                            ? "bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 font-black shadow-[0_0_15px_rgba(245,158,11,0.4)] border border-amber-300 scale-105"
                            : "bg-slate-950/80 border border-purple-500/20 text-slate-300 hover:border-amber-500/40 hover:text-white"
                        }`}
                      >
                        <span className="font-mono text-sm">{q.label}</span>
                        <span className="text-[10px] opacity-80 font-mono">
                          {selectedRoot}{q.suffix}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

            </CyberCard>
          </div>

          {/* RIGHT: INTERACTIVE FRETBOARD VISUALIZER (5 COLS) */}
          <div className="lg:col-span-5 space-y-6">
            <CyberCard variant="glowing" padding="md" className="flex flex-col items-center text-center relative overflow-hidden">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-32 bg-purple-600/20 blur-3xl pointer-events-none rounded-full" />

              <div className="space-y-1 mb-4 relative z-10">
                <CyberBadge variant="purple" size="sm" icon={<Sparkles className="w-3 h-3 text-amber-400" />}>
                  Interactive Fretboard
                </CyberBadge>

                <h2 className="text-4xl font-black text-white tracking-tight font-mono text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-cyan-300 to-indigo-400">
                  {currentChordName}
                </h2>

                {position.chordType && (
                  <p className="text-xs font-mono font-semibold text-slate-400">
                    {position.chordType}
                  </p>
                )}
              </div>

              {/* SVG FRETBOARD */}
              <div className="flex flex-col items-center bg-slate-950/90 p-5 rounded-2xl border border-purple-500/30 relative shadow-inner w-full max-w-xs">
                <svg width="250" height="270" viewBox="0 0 250 270" className="select-none">
                  
                  {position.baseFret > 1 && (
                    <text
                      x="12"
                      y={startY + 25}
                      fill="#A855F7"
                      fontSize="14"
                      fontWeight="900"
                      fontFamily="monospace"
                    >
                      {position.baseFret}fr
                    </text>
                  )}

                  <line
                    x1={startX}
                    y1={startY}
                    x2={startX + (numStrings - 1) * stringGap}
                    y2={startY}
                    stroke={position.baseFret === 1 ? "#C084FC" : "#475569"}
                    strokeWidth={position.baseFret === 1 ? "6" : "2"}
                    strokeLinecap="round"
                  />

                  {Array.from({ length: numFrets }).map((_, i) => {
                    const y = startY + (i + 1) * fretGap;
                    return (
                      <line
                        key={`fret-${i}`}
                        x1={startX}
                        y1={y}
                        x2={startX + (numStrings - 1) * stringGap}
                        y2={y}
                        stroke="#334155"
                        strokeWidth="2"
                      />
                    );
                  })}

                  {Array.from({ length: numStrings }).map((_, i) => {
                    const x = startX + i * stringGap;
                    return (
                      <line
                        key={`string-${i}`}
                        x1={x}
                        y1={startY}
                        x2={x}
                        y2={startY + numFrets * fretGap}
                        stroke="#475569"
                        strokeWidth={i === 0 ? "3.5" : i < 3 ? "2.5" : "1.8"}
                      />
                    );
                  })}

                  {position.barres && position.barres.map((barreFret, idx) => {
                    const fretIndex = barreFret - position.baseFret + 1;
                    if (fretIndex >= 1 && fretIndex <= numFrets) {
                      const y = startY + (fretIndex - 0.5) * fretGap;
                      return (
                        <rect
                          key={`barre-${idx}`}
                          x={startX - 6}
                          y={y - 10}
                          width={(numStrings - 1) * stringGap + 12}
                          height="20"
                          rx="10"
                          fill="#8B5CF6"
                          opacity="0.9"
                        />
                      );
                    }
                    return null;
                  })}

                  {position.frets.map((fret, i) => {
                    const x = startX + i * stringGap;
                    if (fret === -1) {
                      return (
                        <text
                          key={`top-${i}`}
                          x={x}
                          y={startY - 14}
                          textAnchor="middle"
                          fill="#EF4444"
                          fontSize="15"
                          fontWeight="900"
                        >
                          ✕
                        </text>
                      );
                    } else if (fret === 0) {
                      return (
                        <circle
                          key={`top-${i}`}
                          cx={x}
                          cy={startY - 16}
                          r="5.5"
                          fill="none"
                          stroke="#10B981"
                          strokeWidth="2.5"
                        />
                      );
                    }
                    return null;
                  })}

                  {position.frets.map((fret, i) => {
                    if (typeof fret === "number" && fret > 0) {
                      const fretIndex = fret - position.baseFret + 1;
                      if (fretIndex >= 1 && fretIndex <= numFrets) {
                        const x = startX + i * stringGap;
                        const y = startY + (fretIndex - 0.5) * fretGap;
                        const fingerVal = position.fingers[i];
                        const hasFinger = typeof fingerVal === "number" && fingerVal > 0;

                        return (
                          <g key={`dot-${i}`}>
                            <circle
                              cx={x}
                              cy={y}
                              r="12"
                              fill="#8B5CF6"
                              stroke="#FFFFFF"
                              strokeWidth="2"
                            />
                            {hasFinger && (
                              <text
                                x={x}
                                y={y + 4}
                                textAnchor="middle"
                                fill="#FFFFFF"
                                fontSize="12"
                                fontWeight="900"
                              >
                                {fingerVal}
                              </text>
                            )}
                          </g>
                        );
                      }
                    }
                    return null;
                  })}

                  {stringNames.map((str, i) => (
                    <text
                      key={`label-${i}`}
                      x={startX + i * stringGap}
                      y={startY + numFrets * fretGap + 22}
                      textAnchor="middle"
                      fill="#94A3B8"
                      fontSize="10"
                      fontWeight="700"
                      fontFamily="monospace"
                    >
                      {str}
                    </text>
                  ))}
                </svg>
              </div>

              {/* VARIATION NAVIGATION CONTROL */}
              <div className="flex items-center justify-between w-full max-w-[250px] my-3 px-4 py-2 bg-slate-950 border border-purple-500/30 rounded-xl">
                <button
                  onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
                  disabled={currentIndex === 0}
                  className="p-1 text-slate-300 hover:text-white disabled:opacity-30 transition-all cursor-pointer disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>

                <span className="text-xs font-mono font-bold text-cyan-400 tracking-wider">
                  Variasi {currentIndex + 1} / {positions.length}
                </span>

                <button
                  onClick={() => setCurrentIndex((prev) => Math.min(positions.length - 1, prev + 1))}
                  disabled={currentIndex === positions.length - 1}
                  className="p-1 text-slate-300 hover:text-white disabled:opacity-30 transition-all cursor-pointer disabled:cursor-not-allowed"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>

              {/* AUDIO BUTTON */}
              <CyberButton
                variant="cyan"
                size="md"
                onClick={handlePlayChord}
                isLoading={isPlaying}
                leftIcon={<Volume2 className="w-4 h-4" />}
                className="w-full max-w-[250px]"
              >
                {isPlaying ? "Memutar Audio..." : "Genjreng Audio Chord"}
              </CyberButton>

            </CyberCard>
          </div>

        </div>

        {/* SONGS USING THIS CHORD SECTION */}
        <CyberCard variant="default" padding="lg" className="space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-purple-500/15">
            <div>
              <h3 className="text-lg font-black text-white tracking-tight flex items-center gap-2">
                <Music className="w-5 h-5 text-purple-400" />
                <span>Lagu Populer Dengan Chord <strong className="text-cyan-400 font-mono">{currentChordName}</strong></span>
              </h3>
              <p className="text-xs text-slate-400">Pilihan lagu yang menggunakan kunci {currentChordName} dalam progresinya</p>
            </div>

            <Link href={`/search?q=${encodeURIComponent(currentChordName)}`}>
              <CyberButton variant="outline" size="sm" rightIcon={<ArrowRight className="w-3.5 h-3.5" />}>
                Cari Lebih Banyak
              </CyberButton>
            </Link>
          </div>

          {loadingSongs ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3].map((n) => (
                <div key={n} className="h-20 bg-slate-900/50 rounded-2xl animate-pulse border border-purple-500/10" />
              ))}
            </div>
          ) : songsUsingChord.length === 0 ? (
            <div className="text-center py-8 text-slate-400 text-xs">
              Belum ada lagu rekomendasi khusus untuk chord ini.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {songsUsingChord.map((song) => (
                <Link key={song.id} href={`/chord/${song.id}`}>
                  <CyberCard variant="interactive" padding="sm" className="flex items-center gap-3 group">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={song.cover_url || "https://images.unsplash.com/photo-1511192336575-5a79af67a629?q=80&w=200&h=200&auto=format&fit=crop"}
                      alt={song.title}
                      className="w-12 h-12 rounded-xl object-cover border border-purple-500/20 group-hover:border-cyan-400 transition-colors shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <h4 className="text-xs font-bold text-white group-hover:text-cyan-300 transition-colors truncate">
                        {song.title}
                      </h4>
                      <p className="text-[11px] text-slate-400 truncate font-medium">
                        {song.artist}
                      </p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-cyan-400 group-hover:translate-x-1 transition-all shrink-0" />
                  </CyberCard>
                </Link>
              ))}
            </div>
          )}
        </CyberCard>

      </div>
    </div>
  );
}
