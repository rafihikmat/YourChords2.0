"use client";

import React from "react";
import { X, Volume2 } from "lucide-react";
import { getChordDiagram, ChordDiagram } from "@/lib/chordDiagrams";

interface FretboardModalProps {
  chordName: string | null;
  onClose: () => void;
}

export default function FretboardModal({ chordName, onClose }: FretboardModalProps) {
  if (!chordName) return null;

  const diagram: ChordDiagram = getChordDiagram(chordName);
  const strings = ['E', 'A', 'D', 'G', 'B', 'E']; // String 6 (Low E) to String 1 (High E)

  const numStrings = 6;
  const numFrets = 4;
  const startX = 45;
  const startY = 70;
  const stringGap = 28;
  const fretGap = 42;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div 
        className="relative w-full max-w-sm bg-surface border border-white/10 rounded-2xl p-6 shadow-[0_0_50px_rgba(168,85,247,0.3)] text-white"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-full transition-all"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Title & Badge */}
        <div className="text-center mb-4">
          <div className="inline-block px-3 py-1 bg-primary/10 border border-primary/30 rounded-full text-xs font-bold text-primary mb-1 tracking-widest uppercase">
            Chord Diagram
          </div>
          <h2 className="text-3xl font-black text-white tracking-tight flex items-center justify-center gap-2">
            {diagram.name}
          </h2>
        </div>

        {/* SVG Fretboard */}
        <div className="flex justify-center my-2 bg-black/40 p-4 rounded-xl border border-white/5 relative">
          <svg width="220" height="260" viewBox="0 0 220 260" className="select-none">
            {/* Base fret label if > 1 */}
            {diagram.baseFret > 1 && (
              <text
                x="15"
                y={startY + 25}
                fill="#A855F7"
                fontSize="12"
                fontWeight="bold"
                fontFamily="sans-serif"
              >
                {diagram.baseFret}fr
              </text>
            )}

            {/* Nut Line (Top fret border) */}
            <line
              x1={startX}
              y1={startY}
              x2={startX + (numStrings - 1) * stringGap}
              y2={startY}
              stroke={diagram.baseFret === 1 ? "#A855F7" : "#475569"}
              strokeWidth={diagram.baseFret === 1 ? "6" : "2"}
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
                  strokeWidth={i === 0 ? "3" : i < 3 ? "2" : "1.5"}
                />
              );
            })}

            {/* Barre Lines if specified */}
            {diagram.barres && diagram.barres.map((barreFret, idx) => {
              const fretIndex = barreFret - diagram.baseFret + 1;
              if (fretIndex >= 1 && fretIndex <= numFrets) {
                const y = startY + (fretIndex - 0.5) * fretGap;
                return (
                  <rect
                    key={`barre-${idx}`}
                    x={startX - 6}
                    y={y - 8}
                    width={(numStrings - 1) * stringGap + 12}
                    height="16"
                    rx="8"
                    fill="#A855F7"
                    opacity="0.85"
                  />
                );
              }
              return null;
            })}

            {/* Strings top indicators ('x', 'o', or string names) */}
            {diagram.frets.map((fret, i) => {
              const x = startX + i * stringGap;
              if (fret === 'x') {
                return (
                  <text
                    key={`top-${i}`}
                    x={x}
                    y={startY - 15}
                    textAnchor="middle"
                    fill="#EF4444"
                    fontSize="14"
                    fontWeight="bold"
                  >
                    ✕
                  </text>
                );
              } else if (fret === 0) {
                return (
                  <circle
                    key={`top-${i}`}
                    cx={x}
                    cy={startY - 15}
                    r="5"
                    fill="none"
                    stroke="#22C55E"
                    strokeWidth="2"
                  />
                );
              }
              return null;
            })}

            {/* Pressed Finger Dots */}
            {diagram.frets.map((fret, i) => {
              if (typeof fret === 'number' && fret > 0) {
                const fretIndex = fret - diagram.baseFret + 1;
                if (fretIndex >= 1 && fretIndex <= numFrets) {
                  const x = startX + i * stringGap;
                  const y = startY + (fretIndex - 0.5) * fretGap;
                  const fingerVal = diagram.fingers[i];
                  const hasFinger = typeof fingerVal === 'number' && fingerVal > 0;

                  return (
                    <g key={`dot-${i}`}>
                      <circle
                        cx={x}
                        cy={y}
                        r="11"
                        fill="#A855F7"
                        stroke="#FFFFFF"
                        strokeWidth="1.5"
                      />
                      {hasFinger && (
                        <text
                          x={x}
                          y={y + 4}
                          textAnchor="middle"
                          fill="#FFFFFF"
                          fontSize="11"
                          fontWeight="bold"
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
            {strings.map((str, i) => (
              <text
                key={`label-${i}`}
                x={startX + i * stringGap}
                y={startY + numFrets * fretGap + 20}
                textAnchor="middle"
                fill="#94A3B8"
                fontSize="11"
                fontWeight="600"
              >
                {str}
              </text>
            ))}
          </svg>
        </div>

        {/* Bottom Helper Info */}
        <div className="mt-3 flex items-center justify-between text-xs text-slate-400 border-t border-white/5 pt-3">
          <span>Tali: 6 (Low E) ke 1 (High E)</span>
          <button 
            onClick={onClose}
            className="px-4 py-1.5 bg-primary text-white font-bold rounded-lg hover:bg-primary-light transition-colors"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}
