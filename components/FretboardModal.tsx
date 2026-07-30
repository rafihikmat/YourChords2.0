"use client";

import React, { useState } from "react";
import { X, Volume2, Sparkles, Music, Info } from "lucide-react";
import { getChordPosition, ChordPosition } from "@/lib/chordDb";

interface FretboardModalProps {
  chordName: string | null;
  onClose: () => void;
}

export default function FretboardModal({ chordName, onClose }: FretboardModalProps) {
  const [isPlaying, setIsPlaying] = useState(false);

  if (!chordName) return null;

  const position: ChordPosition = getChordPosition(chordName);
  const stringNames = ['E6', 'A5', 'D4', 'G3', 'B2', 'E1']; // String 6 (Low E) to String 1 (High E)

  const numStrings = 6;
  const numFrets = 4;
  const startX = 45;
  const startY = 75;
  const stringGap = 28;
  const fretGap = 42;

  // Check if chord is a Slash chord
  const isSlashChord = chordName.includes('/');
  const [mainChordRoot, bassNote] = isSlashChord ? chordName.split('/').map(s => s.trim()) : [chordName, ''];

  // Audio synthesize chord sound (Web Audio API)
  const handlePlayChord = () => {
    if (typeof window === 'undefined' || !window.AudioContext) return;
    try {
      setIsPlaying(true);
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioCtx();

      // Base string frequencies (E2, A2, D3, G3, B3, E4)
      const baseFreqs = [82.41, 110.00, 146.83, 196.00, 246.94, 329.63];

      position.frets.forEach((fret, i) => {
        if (fret >= 0) {
          const freq = baseFreqs[i] * Math.pow(2, fret / 12);
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();

          osc.type = 'triangle';
          osc.frequency.setValueAtTime(freq, ctx.currentTime);

          // Arpeggiate slightly for natural guitar strumming feel
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
      console.warn('[AUDIO SYNTH ERROR]:', e);
      setIsPlaying(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in"
      onClick={onClose}
    >
      <div 
        className="relative w-full max-w-sm bg-slate-950 border border-primary/30 rounded-3xl p-6 shadow-[0_0_50px_rgba(168,85,247,0.35)] text-white"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Glow Effects */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-20 bg-primary/20 blur-3xl pointer-events-none rounded-full" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-full transition-all cursor-pointer"
          title="Tutup Modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Title & Badge */}
        <div className="text-center mb-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-primary/10 border border-primary/30 rounded-full text-[10px] font-bold text-primary tracking-widest uppercase mb-1.5">
            <Sparkles className="w-3 h-3 text-amber-400" />
            <span>Chord Fretboard</span>
          </div>
          
          <h2 className="text-3xl font-black text-white tracking-tight flex items-center justify-center gap-2 font-mono">
            {chordName}
          </h2>

          {/* Slash chord info indicator */}
          {isSlashChord && (
            <p className="text-xs text-amber-300 font-medium mt-1 bg-amber-500/10 border border-amber-500/20 px-3 py-0.5 rounded-full inline-block">
              Bass Note: <strong className="text-amber-200">{bassNote}</strong>
            </p>
          )}
        </div>

        {/* SVG Fretboard Container */}
        <div className="flex flex-col items-center my-3 bg-black/60 p-4 rounded-2xl border border-white/10 relative shadow-inner">
          <svg width="230" height="260" viewBox="0 0 230 260" className="select-none">
            
            {/* Base fret label if > 1 */}
            {position.baseFret > 1 && (
              <text
                x="12"
                y={startY + 25}
                fill="#8B5CF6"
                fontSize="13"
                fontWeight="900"
                fontFamily="monospace"
              >
                {position.baseFret}fr
              </text>
            )}

            {/* Nut Line (Top fret border) */}
            <line
              x1={startX}
              y1={startY}
              x2={startX + (numStrings - 1) * stringGap}
              y2={startY}
              stroke={position.baseFret === 1 ? "#C084FC" : "#475569"}
              strokeWidth={position.baseFret === 1 ? "6" : "2"}
              strokeLinecap="round"
            />

            {/* Fret Lines (Horizontal) */}
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

            {/* String Lines (Vertical) */}
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

            {/* Barre Lines if specified */}
            {position.barres && position.barres.map((barreFret, idx) => {
              const fretIndex = barreFret - position.baseFret + 1;
              if (fretIndex >= 1 && fretIndex <= numFrets) {
                const y = startY + (fretIndex - 0.5) * fretGap;
                return (
                  <rect
                    key={`barre-${idx}`}
                    x={startX - 6}
                    y={y - 9}
                    width={(numStrings - 1) * stringGap + 12}
                    height="18"
                    rx="9"
                    fill="#8B5CF6"
                    opacity="0.9"
                    className="shadow-lg"
                  />
                );
              }
              return null;
            })}

            {/* Top String Status Indicators (Muted X or Open O) */}
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
                    fontSize="14"
                    fontWeight="900"
                    fontFamily="sans-serif"
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
                    r="5"
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
              if (typeof fret === 'number' && fret > 0) {
                const fretIndex = fret - position.baseFret + 1;
                if (fretIndex >= 1 && fretIndex <= numFrets) {
                  const x = startX + i * stringGap;
                  const y = startY + (fretIndex - 0.5) * fretGap;
                  const fingerVal = position.fingers[i];
                  const hasFinger = typeof fingerVal === 'number' && fingerVal > 0;

                  return (
                    <g key={`dot-${i}`}>
                      <circle
                        cx={x}
                        cy={y}
                        r="11.5"
                        fill="#8B5CF6"
                        stroke="#FFFFFF"
                        strokeWidth="2"
                        className="drop-shadow-[0_0_8px_rgba(139,92,246,0.8)]"
                      />
                      {hasFinger && (
                        <text
                          x={x}
                          y={y + 4}
                          textAnchor="middle"
                          fill="#FFFFFF"
                          fontSize="11"
                          fontWeight="900"
                          fontFamily="sans-serif"
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

            {/* String Labels at Bottom */}
            {stringNames.map((str, i) => (
              <text
                key={`label-${i}`}
                x={startX + i * stringGap}
                y={startY + numFrets * fretGap + 20}
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

        {/* Bottom Bar Controls: Audio Strum + Finger Guide Info */}
        <div className="flex items-center justify-between text-xs border-t border-white/10 pt-3 mt-2">
          <button
            onClick={handlePlayChord}
            disabled={isPlaying}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/20 hover:bg-primary/30 text-primary border border-primary/40 rounded-xl font-bold transition-all cursor-pointer disabled:opacity-50"
            title="Dengarkan Suara Strumming Chord"
          >
            <Volume2 className={`w-4 h-4 ${isPlaying ? 'animate-bounce text-amber-400' : ''}`} />
            <span>{isPlaying ? 'Memutar...' : 'Strum Sound'}</span>
          </button>

          <button 
            onClick={onClose}
            className="px-4 py-1.5 bg-white/10 text-white font-bold rounded-xl hover:bg-white/20 border border-white/10 transition-all cursor-pointer"
          >
            Tutup
          </button>
        </div>

        <div className="mt-2 text-[10px] text-slate-400 text-center flex items-center justify-center gap-1">
          <Info className="w-3 h-3 text-slate-500" />
          <span>Angka dalam lingkaran = Jari (1: Telunjuk, 2: Tengah, 3: Manis, 4: Kelingking)</span>
        </div>

      </div>
    </div>
  );
}
