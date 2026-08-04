"use client";

import React from "react";
import { GuitarChordData } from "@/lib/chordDictionary";

interface GuitarChordSVGProps {
  data: GuitarChordData;
  width?: number;
  height?: number;
  className?: string;
}

export const GuitarChordSVG: React.FC<GuitarChordSVGProps> = ({
  data,
  width = 240,
  height = 270,
  className = "",
}) => {
  const numStrings = 6;
  const numFrets = 5;
  const startX = 45;
  const startY = 55;
  const stringGap = 28;
  const fretGap = 38;

  const stringNames = ["E6", "A5", "D4", "G3", "B2", "E1"]; // Low E to High E
  const baseFret = data.baseFret || 1;

  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 240 270"
      className={`select-none ${className}`}
    >
      <defs>
        {/* Cyan Neon Glow Shadow */}
        <filter id="cyanGlow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feComponentTransfer in="blur" result="glow">
            <feFuncA type="linear" slope="0.8" />
          </feComponentTransfer>
          <feMerge>
            <feMergeNode in="glow" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Base Fret Indicator Label */}
      {baseFret > 1 && (
        <text
          x="12"
          y={startY + 24}
          fill="#a855f7"
          fontSize="13"
          fontWeight="900"
          fontFamily="monospace"
        >
          {baseFret}fr
        </text>
      )}

      {/* Nut Line (Top Fret Bar) */}
      <line
        x1={startX}
        y1={startY}
        x2={startX + (numStrings - 1) * stringGap}
        y2={startY}
        stroke={baseFret === 1 ? "#94a3b8" : "#334155"}
        strokeWidth={baseFret === 1 ? "5" : "2"}
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
            strokeWidth="1.8"
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
            stroke="#334155"
            strokeWidth={i === 0 ? "3.2" : i < 3 ? "2.2" : "1.5"}
          />
        );
      })}

      {/* Barre Chords (Palang Rectangles) */}
      {data.barres &&
        data.barres.map((barre, idx) => {
          const fretIndex = barre.fret - baseFret + 1;
          if (fretIndex >= 1 && fretIndex <= numFrets) {
            const y = startY + (fretIndex - 0.5) * fretGap;

            // Convert string numbers (6=Low E, 1=High E) to indices (0..5)
            const startIdx = Math.max(0, Math.min(5, 6 - (barre.startString || 6)));
            const endIdx = Math.max(0, Math.min(5, 6 - (barre.endString || 1)));

            const minX = startX + Math.min(startIdx, endIdx) * stringGap;
            const maxX = startX + Math.max(startIdx, endIdx) * stringGap;
            const barreWidth = maxX - minX + 22;
            const barreX = minX - 11;

            return (
              <g key={`barre-${idx}`} filter="url(#cyanGlow)">
                <rect
                  x={barreX}
                  y={y - 9}
                  width={barreWidth}
                  height="18"
                  rx="6"
                  fill="#06b6d4"
                  opacity="0.95"
                />
              </g>
            );
          }
          return null;
        })}

      {/* Top String Status Indicators (Mute X / Open O) */}
      {data.frets.map((fret, i) => {
        const x = startX + i * stringGap;
        if (fret === -1) {
          return (
            <text
              key={`top-${i}`}
              x={x}
              y={startY - 12}
              textAnchor="middle"
              fill="#f43f5e"
              fontSize="14"
              fontWeight="900"
              fontFamily="sans-serif"
            >
              ✕
            </text>
          );
        } else if (fret === 0) {
          return (
            <text
              key={`top-${i}`}
              x={x}
              y={startY - 12}
              textAnchor="middle"
              fill="#06b6d4"
              fontSize="14"
              fontWeight="900"
              fontFamily="sans-serif"
            >
              O
            </text>
          );
        }
        return null;
      })}

      {/* Finger Press Dots */}
      {data.frets.map((fret, i) => {
        if (typeof fret === "number" && fret > 0) {
          const fretIndex = fret - baseFret + 1;
          if (fretIndex >= 1 && fretIndex <= numFrets) {
            const x = startX + i * stringGap;
            const y = startY + (fretIndex - 0.5) * fretGap;
            const fingerVal = data.fingers ? data.fingers[i] : 0;

            return (
              <g key={`dot-${i}`} filter="url(#cyanGlow)">
                <circle
                  cx={x}
                  cy={y}
                  r="11"
                  fill="#06b6d4"
                  stroke="#ffffff"
                  strokeWidth="1.5"
                />
                {fingerVal > 0 && (
                  <text
                    x={x}
                    y={y + 4}
                    textAnchor="middle"
                    fill="#070a12"
                    fontSize="11"
                    fontWeight="900"
                    fontFamily="monospace"
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
          fill="#64748b"
          fontSize="10"
          fontWeight="700"
          fontFamily="monospace"
        >
          {str}
        </text>
      ))}
    </svg>
  );
};
