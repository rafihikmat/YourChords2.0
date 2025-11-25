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
 * "Pro-Grade" visual style matching Ultimate Guitar dark mode.
 */
const ChordDiagram: React.FC<ChordDiagramProps> = ({ name, position, className, showName = true }) => {
  // If position is not provided, try to fetch the default one
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
  const numFrets = 5; // Standard chord box height
  const width = 200;
  const height = 240;

  // Margins
  const margin = { top: 40, right: 30, bottom: 20, left: 40 };
  const gridWidth = width - margin.left - margin.right;
  const gridHeight = height - margin.top - margin.bottom;

  const stringSpacing = gridWidth / (numStrings - 1);
  const fretSpacing = gridHeight / numFrets;

  // Colors
  const colors = {
    bg: "transparent",
    line: "#FFFFFF", // White lines for dark mode
    dot: "#FFFFFF",
    text: "#000000", // Text inside dot
    muted: "#A0A0A0", // Gray for X/O
    fretLabel: "#FFFFFF"
  };

  // Helper to determine if a fret is visible in the current window
  // The window usually starts at baseFret and goes up numFrets
  // But our frets array has absolute fret numbers.
  // We need to map absolute fret -> relative row index (0 to numFrets-1)
  const getRelativeFret = (absFret: number) => {
    return absFret - baseFret + 1;
  };

  return (
    <div className={`flex flex-col items-center select-none ${className}`}>
      {showName && (
        <div className="text-xl font-bold mb-2 text-white font-sans tracking-wide">{name}</div>
      )}

      <svg
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        className="bg-[#111] rounded-xl shadow-2xl border border-white/10"
        style={{ fontFamily: 'Inter, sans-serif' }}
      >
        {/* Fret Label (e.g., "5fr") */}
        {baseFret > 1 && (
          <text
            x={margin.left + gridWidth + 8}
            y={margin.top + fretSpacing / 2}
            className="text-xs font-bold fill-white opacity-60"
            dominantBaseline="middle"
          >
            {baseFret}fr
          </text>
        )}

        {/* Grid: Frets (Horizontal) */}
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
              stroke={colors.line}
              strokeWidth={isNut ? 4 : 1} // Thick nut
              strokeOpacity={isNut ? 1 : 0.3}
              strokeLinecap="round"
            />
          );
        })}

        {/* Grid: Strings (Vertical) */}
        {Array.from({ length: numStrings }).map((_, i) => {
          const x = margin.left + i * stringSpacing;
          return (
            <line
              key={`string-${i}`}
              x1={x}
              y1={margin.top}
              x2={x}
              y2={margin.top + gridHeight}
              stroke={colors.line}
              strokeWidth={1} // Thicker strings? Maybe vary thickness like real guitar?
              strokeOpacity={0.3}
            />
          );
        })}

        {/* Barres */}
        {barres && barres.map((barreFret, idx) => {
          const relFret = getRelativeFret(barreFret);
          if (relFret < 1 || relFret > numFrets) return null;

          // Find range of strings for this barre
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

          // Curved Barre
          const curveHeight = 8;
          const pathData = `
            M ${x1} ${y} 
            Q ${(x1 + x2) / 2} ${y - curveHeight} ${x2} ${y}
            Q ${(x1 + x2) / 2} ${y + curveHeight} ${x1} ${y}
            Z
          `;

          return (
            <g key={`barre-${idx}`}>
              {/* Solid Bar Style (Alternative to curve, cleaner for UI) */}
              <rect
                x={x1 - 6}
                y={y - 6}
                width={(x2 - x1) + 12}
                height={12}
                rx={6}
                fill={colors.dot}
              />
            </g>
          );
        })}

        {/* Dots and X/O */}
        {frets.map((fret, stringIdx) => {
          const x = margin.left + stringIdx * stringSpacing;

          // Muted (X)
          if (fret === -1) {
            return (
              <text
                key={`mute-${stringIdx}`}
                x={x}
                y={margin.top - 15}
                textAnchor="middle"
                className="text-sm fill-white opacity-50 font-sans"
                dominantBaseline="middle"
              >
                ✕
              </text>
            );
          }

          // Open (O)
          if (fret === 0) {
            // Only show 'O' if baseFret is 1, otherwise it's weird to have open string with capo/high fret? 
            // Actually open string is always open 0.
            // If baseFret > 1, an open string 0 is theoretically way above.
            // But usually we just show 'O' at the top.
            return (
              <circle
                key={`open-${stringIdx}`}
                cx={x}
                cy={margin.top - 15}
                r={4}
                fill="none"
                stroke={colors.line}
                strokeWidth={1.5}
                strokeOpacity={0.5}
              />
            );
          }

          // Fretted Note
          const relFret = getRelativeFret(fret);
          if (relFret >= 1 && relFret <= numFrets) {
            const y = margin.top + (relFret - 0.5) * fretSpacing;

            // Check if this is part of a barre. If it is, we usually DON'T draw the dot ON TOP of the barre 
            // unless we want to show the finger number.
            // But for visual clarity, a dot on top of the barre bar is fine if it has the number.

            const finger = fingers && fingers[stringIdx];

            return (
              <g key={`note-${stringIdx}`}>
                <circle
                  cx={x}
                  cy={y}
                  r={9}
                  fill={colors.dot}
                />
                {finger > 0 && (
                  <text
                    x={x}
                    y={y + 1} // Optical adjustment
                    textAnchor="middle"
                    dominantBaseline="middle"
                    className="text-[10px] font-bold fill-black"
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

      {/* Tags Display */}
      {chordData.tags && chordData.tags.length > 0 && (
        <div className="flex gap-2 mt-2 flex-wrap justify-center max-w-[200px]">
          {chordData.tags.map(tag => (
            <span key={tag} className="px-2 py-0.5 text-[10px] uppercase tracking-wider font-bold bg-white/10 text-white/70 rounded-full">
              {tag}
            </span>
          ))}
        </div>
      )}
    </div>
  );
};

export default memo(ChordDiagram);
