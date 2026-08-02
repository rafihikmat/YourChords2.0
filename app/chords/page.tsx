"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import { 
  Sparkles, Volume2, ChevronLeft, ChevronRight, Search, 
  Music, ArrowRight, Layers, Sliders, Info, BookOpen
} from "lucide-react";
import { getChordPositions, ChordPosition } from "@/lib/chordDb";
import { supabase, normalizeSong } from "@/lib/supabase";
import { Song } from "@/lib/types";
import { INITIAL_FALLBACK_CHORDS } from "@/lib/fallbackData";

export default function ChordsDictionaryPage() {
  const [selectedRoot, setSelectedRoot] = useState<string>("C");
  const [selectedSuffix, setSelectedSuffix] = useState<string>("");
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  
  const [songsUsingChord, setSongsUsingChord] = useState<Song[]>([]);
  const [loadingSongs, setLoadingSongs] = useState<boolean>(true);

  const roots = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
  
  const qualities = [
    { label: "Major", suffix: "" },
    { label: "Minor", suffix: "m" },
    { label: "7", suffix: "7" },
    { label: "maj7", suffix: "maj7" },
    { label: "m7", suffix: "m7" },
    { label: "sus2", suffix: "sus2" },
    { label: "sus4", suffix: "sus4" },
    { label: "dim", suffix: "dim" },
    { label: "aug", suffix: "aug" },
    { label: "add9", suffix: "add9" },
    { label: "9", suffix: "9" },
    { label: "11", suffix: "11" },
    { label: "13", suffix: "13" }
  ];

  const currentChordName = `${selectedRoot}${selectedSuffix}`;

  // Reset variation index when root or suffix changes
  useEffect(() => {
    setCurrentIndex(0);
  }, [selectedRoot, selectedSuffix]);

  // Fetch songs using current chord
  useEffect(() => {
    async function fetchSongsForChord() {
      setLoadingSongs(true);
      try {
        // Query Supabase for songs containing this chord in chords or content
        const { data, error } = await supabase
          .from("songs")
          .select("*, albums(cover_url)")
          .or(`chords.ilike.%${currentChordName}%,content.ilike.%${currentChordName}%`)
          .order("view_count", { ascending: false })
          .limit(6);

        if (!error && data && data.length > 0) {
          setSongsUsingChord(data.map(normalizeSong));
        } else {
          // Fallback search from INITIAL_FALLBACK_CHORDS
          const filteredFallback = INITIAL_FALLBACK_CHORDS.filter(s => {
            const txt = typeof s.chords === "string" ? s.chords : s.content || "";
            return txt.includes(currentChordName);
          }).slice(0, 6);

          if (filteredFallback.length > 0) {
            setSongsUsingChord(filteredFallback);
          } else {
            // General fallback
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

  // Audio Synthesizer (Web Audio API)
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
    <div className="min-h-screen bg-slate-950 text-white flex flex-col font-sans selection:bg-primary selection:text-white">
      <Navbar />

      <main className="flex-1 pt-24 pb-16 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto w-full">
        {/* HERO BANNER SECTION */}
        <section className="relative rounded-3xl p-8 md:p-12 border border-primary/30 bg-surface/80 backdrop-blur-2xl overflow-hidden shadow-[0_0_50px_rgba(168,85,247,0.15)] mb-10 text-center">
          <div className="absolute -top-24 -left-24 w-72 h-72 bg-primary/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -right-24 w-72 h-72 bg-violet-600/20 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 max-w-3xl mx-auto flex flex-col items-center gap-3">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary/10 border border-primary/30 text-primary-light text-xs font-mono font-bold mb-2 shadow-[0_0_15px_rgba(168,85,247,0.3)]">
              <BookOpen className="w-3.5 h-3.5 animate-pulse text-amber-400" />
              <span>INTERACTIVE GUITAR CHORD DICTIONARY</span>
            </div>

            <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-white">
              Kamus Chord Gitar & <span className="text-primary neon-text">Variasi Fretboard</span>
            </h1>

            <p className="text-slate-300 text-xs sm:text-sm leading-relaxed max-w-2xl">
              Pelajari seluruh bentuk kunci gitar dari dasar hingga tingkat lanjut lengkap dengan variasi posisi fret, bentuk jari, dan simulasi audio genjreng.
            </p>
          </div>
        </section>

        {/* MAIN SELECTOR & VISUALIZER GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-12">
          
          {/* LEFT: INTERACTIVE SELECTORS (7 COLS) */}
          <div className="lg:col-span-7 flex flex-col gap-6">
            <div className="bg-surface/80 border border-white/10 rounded-3xl p-6 sm:p-8 backdrop-blur-xl shadow-2xl flex flex-col gap-6">
              
              {/* BARIS 1 - ROOT NOTE PICKER */}
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                    <Sliders className="w-4 h-4 text-primary" />
                    <span>1. Pilih Nada Dasar (Root Note)</span>
                  </label>
                  <span className="text-xs font-mono font-bold text-primary bg-primary/10 border border-primary/30 px-2.5 py-0.5 rounded-full">
                    {selectedRoot}
                  </span>
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
                            ? "bg-primary text-white shadow-[0_0_20px_rgba(168,85,247,0.5)] border border-primary-light scale-105"
                            : "bg-black/60 border border-white/10 text-slate-300 hover:bg-white/10 hover:text-white"
                        }`}
                      >
                        {root}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* BARIS 2 - QUALITY / EXTENSION PICKER */}
              <div className="flex flex-col gap-3 pt-4 border-t border-white/10">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                    <Layers className="w-4 h-4 text-amber-400" />
                    <span>2. Pilih Kualitas / Ekstensi Chord</span>
                  </label>
                  <span className="text-xs font-mono font-bold text-amber-400 bg-amber-500/10 border border-amber-500/30 px-2.5 py-0.5 rounded-full">
                    {currentChordName}
                  </span>
                </div>

                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                  {qualities.map((q) => {
                    const isSelected = selectedSuffix === q.suffix;
                    return (
                      <button
                        key={q.label}
                        onClick={() => setSelectedSuffix(q.suffix)}
                        className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex flex-col items-center justify-center cursor-pointer ${
                          isSelected
                            ? "bg-amber-500 text-slate-950 font-black shadow-[0_0_20px_rgba(245,158,11,0.4)] border border-amber-300 scale-105"
                            : "bg-black/60 border border-white/10 text-slate-300 hover:bg-white/10 hover:text-white"
                        }`}
                      >
                        <span className="font-mono text-sm">{q.label}</span>
                        <span className="text-[10px] opacity-70 font-mono">
                          {selectedRoot}{q.suffix}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

            </div>
          </div>

          {/* RIGHT: INTERACTIVE FRETBOARD VISUALIZER (5 COLS) */}
          <div className="lg:col-span-5 flex flex-col gap-6">
            <div className="bg-surface/90 border border-primary/30 rounded-3xl p-6 backdrop-blur-2xl shadow-[0_0_40px_rgba(168,85,247,0.2)] flex flex-col items-center relative overflow-hidden">
              
              {/* Background Glow */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-32 bg-primary/20 blur-3xl pointer-events-none rounded-full" />

              {/* Chord Header Info */}
              <div className="text-center mb-4 relative z-10">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-primary/10 border border-primary/30 rounded-full text-[10px] font-bold text-primary tracking-widest uppercase mb-2">
                  <Sparkles className="w-3 h-3 text-amber-400" />
                  <span>Interactive Fretboard</span>
                </div>

                <h2 className="text-4xl font-black text-white tracking-tight font-mono neon-text mb-1">
                  {currentChordName}
                </h2>

                {position.chordType && (
                  <span className="text-xs font-mono font-bold bg-white/5 border border-white/10 text-slate-300 px-3 py-1 rounded-full inline-block">
                    {position.chordType}
                  </span>
                )}
              </div>

              {/* SVG FRETBOARD */}
              <div className="flex flex-col items-center bg-black/70 p-5 rounded-2xl border border-white/15 relative shadow-inner w-full max-w-xs">
                <svg width="250" height="270" viewBox="0 0 250 270" className="select-none">
                  
                  {/* Base Fret Label */}
                  {position.baseFret > 1 && (
                    <text
                      x="12"
                      y={startY + 25}
                      fill="#8B5CF6"
                      fontSize="14"
                      fontWeight="900"
                      fontFamily="monospace"
                    >
                      {position.baseFret}fr
                    </text>
                  )}

                  {/* Nut Line */}
                  <line
                    x1={startX}
                    y1={startY}
                    x2={startX + (numStrings - 1) * stringGap}
                    y2={startY}
                    stroke={position.baseFret === 1 ? "#C084FC" : "#475569"}
                    strokeWidth={position.baseFret === 1 ? "6" : "2"}
                    strokeLinecap="round"
                  />

                  {/* Fret Lines */}
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

                  {/* String Lines */}
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

                  {/* Barres */}
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

                  {/* Muted X or Open O */}
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

                  {/* Finger Dots & Numbers */}
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
                              className="drop-shadow-[0_0_10px_rgba(139,92,246,0.9)]"
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

                  {/* String Labels */}
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
              <div className="flex items-center justify-between w-full max-w-[250px] mx-auto my-3 px-4 py-2 bg-black/80 border border-white/10 rounded-xl">
                <button
                  onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
                  disabled={currentIndex === 0}
                  className="p-1 text-slate-300 hover:text-white disabled:opacity-30 transition-all cursor-pointer disabled:cursor-not-allowed"
                  title="Variasi Kunci Sebelumnya"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>

                <span className="text-xs font-mono font-bold text-primary tracking-wider">
                  &lt; {currentIndex + 1} of {positions.length} &gt;
                </span>

                <button
                  onClick={() => setCurrentIndex((prev) => Math.min(positions.length - 1, prev + 1))}
                  disabled={currentIndex === positions.length - 1}
                  className="p-1 text-slate-300 hover:text-white disabled:opacity-30 transition-all cursor-pointer disabled:cursor-not-allowed"
                  title="Variasi Kunci Berikutnya"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>

              {/* STRUM AUDIO BUTTON */}
              <button
                onClick={handlePlayChord}
                disabled={isPlaying}
                className="w-full max-w-[250px] flex items-center justify-center gap-2 py-3 px-4 bg-gradient-to-r from-primary to-violet-600 hover:from-primary-light hover:to-violet-500 text-white font-bold rounded-xl shadow-[0_0_20px_rgba(168,85,247,0.4)] hover:shadow-[0_0_30px_rgba(168,85,247,0.6)] transition-all cursor-pointer disabled:opacity-50 text-xs uppercase tracking-wider"
              >
                <Volume2 className={`w-4 h-4 ${isPlaying ? "animate-bounce text-amber-300" : ""}`} />
                <span>{isPlaying ? "Memutar Audio..." : "🔊 Genjreng Sound Kunci"}</span>
              </button>

            </div>
          </div>

        </div>

        {/* SONGS USING THIS CHORD SECTION */}
        <section className="bg-surface/60 border border-white/10 rounded-3xl p-6 sm:p-8 backdrop-blur-xl">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-white/10">
            <div>
              <h3 className="text-lg font-black text-white tracking-tight flex items-center gap-2">
                <Music className="w-5 h-5 text-primary" />
                <span>Lagu Populer Dengan Chord <strong className="text-primary font-mono">{currentChordName}</strong></span>
              </h3>
              <p className="text-xs text-slate-400">Pilihan lagu favorit yang menggunakan kunci {currentChordName} dalam progresinya</p>
            </div>

            <Link
              href={`/search?q=${encodeURIComponent(currentChordName)}`}
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary/20 hover:bg-primary/30 text-primary border border-primary/40 rounded-xl text-xs font-bold transition-all hover:scale-105"
            >
              <Search className="w-3.5 h-3.5" />
              <span>Cari Lagu Lain dengan Chord Ini</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {loadingSongs ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3].map((n) => (
                <div key={n} className="h-20 bg-white/5 rounded-2xl animate-pulse border border-white/5" />
              ))}
            </div>
          ) : songsUsingChord.length === 0 ? (
            <div className="text-center py-8 text-slate-400 text-xs">
              Belum ada lagu spesifik dengan chord ini di rekomendasi langsung.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {songsUsingChord.map((song) => (
                <Link
                  key={song.id}
                  href={`/song/${song.id}`}
                  className="flex items-center gap-3 p-3 bg-black/60 hover:bg-surface border border-white/10 hover:border-primary/50 rounded-2xl transition-all group"
                >
                  <img
                    src={song.cover_url || "https://images.unsplash.com/photo-1511192336575-5a79af67a629?q=80&w=200&h=200&auto=format&fit=crop"}
                    alt={song.title}
                    className="w-12 h-12 rounded-xl object-cover border border-white/10 group-hover:border-primary/40 transition-colors"
                  />
                  <div className="flex-1 min-w-0">
                    <h4 className="text-xs font-bold text-white group-hover:text-primary transition-colors truncate">
                      {song.title}
                    </h4>
                    <p className="text-[11px] text-slate-400 truncate">
                      {song.artist}
                    </p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-primary group-hover:translate-x-1 transition-all flex-shrink-0" />
                </Link>
              ))}
            </div>
          )}
        </section>

      </main>
    </div>
  );
}
