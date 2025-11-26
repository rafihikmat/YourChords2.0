import React, { memo, useMemo } from 'react';
import { Position, ChordAdapter } from '../lib/chordService';

/**
 * Props for the ChordDiagram component.
 */
interface ChordDiagramProps {
  /** The name of the chord to display (e.g., "Am", "C#7"). */
  name: string;
  /** Optional: Specific voicing position to render. If not provided, fetches the default. */
  position?: Position;
  /** Optional CSS class names to apply to the container. */
  className?: string;
  /** Whether to display the chord name above the diagram. Default: true. */
  showName?: boolean;
}

/**
 * Renders a visual diagram of a guitar chord using SVG.
 * Supports multi-voicing, barre chords, muted strings, and open strings.
 * Minimalist, responsive, and print-friendly.
 */
const ChordDiagram: React.FC<ChordDiagramProps> = ({ name, position, className, showName = true }) => {
  const chordData = useMemo(() => {
    if (position) return position;
    const voicings = ChordAdapter.getAllChordVoicings(name);
    return voicings ? voicings[0] : null;
  }, [name, position]);

  if (!chordData) {
    return null;
  }

  const { frets, baseFret, barres, fingers } = chordData;

  // Configuration
  const numStrings = 6;
  const numFrets = 5;
  const viewBoxWidth = 100; // Reduced coordinate space for simpler math
  const viewBoxHeight = 120;

  // Margins
  const margin = { top: 20, right: 15, bottom: 10, left: 15 };
  const gridWidth = viewBoxWidth - margin.left - margin.right;
  const gridHeight = viewBoxHeight - margin.top - margin.bottom;

  const stringSpacing = gridWidth / (numStrings - 1);
  const fretSpacing = gridHeight / numFrets;

  const getRelativeFret = (absFret: number) => absFret - baseFret + 1;

  return (
    <div className={`flex flex-col items-center select-none ${className}`}>
      {showName && (
        <div className="text-lg font-bold mb-1 text-slate-900 dark:text-white font-sans tracking-tight print:text-black">{name}</div>
      )}

      <div className="relative w-full aspect-[5/6]"> {/* Aspect ratio container */}
        <svg
          viewBox={`0 0 ${viewBoxWidth} ${viewBoxHeight}`}
          className="w-full h-full bg-white dark:bg-slate-900/50 rounded-lg border border-slate-200 dark:border-white/10 transition-colors duration-300 print:bg-white print:border-slate-300"
          style={{ fontFamily: 'Inter, sans-serif' }}
          preserveAspectRatio="xMidYMid meet"
        >
          {/* Fret Label */}
          {baseFret > 1 && (
            <text
              x={margin.left + gridWidth + 4}
              y={margin.top + fretSpacing / 2}
              className="text-[8px] font-bold fill-slate-500 dark:fill-slate-400 print:fill-black"
              dominantBaseline="middle"
            >
              {baseFret}fr
            </text>
          )}

          {/* Grid: Frets */}
          {Array.from({ length: numFrets + 1 }).map((_, i) => {
            const y = margin.top + i * fretSpacing;
            const isNut = i === 0 && baseFret === 1;
            return (
              <line
                key={`fret-${i}`}
                x1={margin.left}
                y1={y}
                x2={margin.left + gridWidth}
                y2={y}
                className={`stroke-slate-300 dark:stroke-slate-600 print:stroke-slate-400 ${isNut ? 'stroke-[2px] opacity-100' : 'stroke-[0.5px]'}`}
                strokeLinecap="round"
              />
            );
          })}

          {/* Grid: Strings */}
          {Array.from({ length: numStrings }).map((_, i) => {
            const x = margin.left + i * stringSpacing;
            return (
              <line
                key={`string-${i}`}
                x1={x}
                y1={margin.top}
                x2={x}
                y2={margin.top + gridHeight}
                className="stroke-slate-300 dark:stroke-slate-600 print:stroke-slate-400 stroke-[0.5px]"
              />
            );
          })}

          {/* Barres */}
          {barres && barres.map((barreFret, idx) => {
            const relFret = getRelativeFret(barreFret);
            if (relFret < 1 || relFret > numFrets) return null;

            let minString = 5;
            let maxString = 0;
            let hasBarre = false;

            frets.forEach((f, stringIdx) => {
              if (f === barreFret) {
                minString = Math.min(minString, stringIdx);
                maxString = Math.max(maxString, stringIdx);
                hasBarre = true;
              }
            });

            if (!hasBarre) return null;

            const x1 = margin.left + minString * stringSpacing;
            const x2 = margin.left + maxString * stringSpacing;
            const y = margin.top + (relFret - 0.5) * fretSpacing;

            return (
              <rect
                key={`barre-${idx}`}
                x={x1 - 3}
                y={y - 3}
                width={(x2 - x1) + 6}
                height={6}
                rx={3}
                className="fill-slate-800 dark:fill-white print:fill-black"
              />
            );
          })}

          {/* Dots and X/O */}
          {frets.map((fret, stringIdx) => {
            const x = margin.left + stringIdx * stringSpacing;

            if (fret === -1) {
              return (
                <text
                  key={`mute-${stringIdx}`}
                  x={x}
                  y={margin.top - 8}
                  textAnchor="middle"
                  className="text-[8px] fill-slate-400 dark:fill-slate-500 print:fill-slate-600 font-sans"
                  dominantBaseline="middle"
                >
                  ✕
                </text>
              );
            }

            if (fret === 0) {
              return (
                <circle
                  key={`open-${stringIdx}`}
                  cx={x}
                  cy={margin.top - 8}
                  r={2}
                  fill="none"
                  className="stroke-slate-800 dark:stroke-white print:stroke-black stroke-[1px]"
                />
              );
            }

            const relFret = getRelativeFret(fret);
            if (relFret >= 1 && relFret <= numFrets) {
              const y = margin.top + (relFret - 0.5) * fretSpacing;
              const finger = fingers && fingers[stringIdx];

              return (
                <g key={`note-${stringIdx}`}>
                  <circle
                    cx={x}
                    cy={y}
                    r={4}
                    className="fill-slate-800 dark:fill-white print:fill-black"
                  />
                  {finger > 0 && (
                    <text
                      x={x}
                      y={y + 0.5}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      className="text-[5px] font-bold fill-white dark:fill-slate-900 print:fill-white"
                    >
                      {finger}
                    </text>
                  )}
                </g>
              );
            }
            return null;
          })}
        </svg>
      </div>

      {/* Tags Display */}
      {chordData.tags && chordData.tags.length > 0 && (
        <div className="flex gap-1 mt-1 flex-wrap justify-center max-w-full">
          {chordData.tags.map(tag => (
            <span key={tag} className="px-1.5 py-0.5 text-[8px] uppercase tracking-wider font-bold bg-slate-100 text-slate-600 dark:bg-white/10 dark:text-white/70 rounded-full print:bg-slate-100 print:text-black">
              {tag}
            </span>
          ))}
        </div>
      )}
    </div>
  );
};

export default memo(ChordDiagram);
