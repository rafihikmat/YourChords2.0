
import React, { memo } from 'react';
import { getChordFingering } from '../lib/musicUtils';

/**
 * Props for the ChordDiagram component.
 */
interface ChordDiagramProps {
  /** The name of the chord to display (e.g., "Am", "C#7"). */
  name: string;
  /** Optional CSS class names to apply to the container. */
  className?: string;
}

/**
 * Renders a visual diagram of a guitar chord.
 * Displays strings, frets, finger positions, open strings, and muted strings.
 * Automatically handles barre chords and higher fret positions.
 *
 * @param {ChordDiagramProps} props - The component props.
 * @returns {JSX.Element | null} The SVG chord diagram, or null if the chord data is invalid.
 */
const ChordDiagram: React.FC<ChordDiagramProps> = ({ name, className }) => {
  const frets = getChordFingering(name);

  if (!frets) return null;

  // Calculate view box
  const numStrings = 6;
  const numFrets = 5; // Show first 5 frets usually
  
  // Check if we need to show higher frets (barre chords)
  const validFrets = frets.filter(f => f > 0);
  const minFret = validFrets.length > 0 ? Math.min(...validFrets) : 1;
  const startFret = minFret > 2 ? minFret - 1 : 1;

  const width = 80;
  const height = 100;
  const padding = 12;
  const stringSpacing = (width - 2 * padding) / (numStrings - 1);
  const fretSpacing = (height - 2 * padding) / numFrets;

  return (
    <div className={`flex flex-col items-center ${className}`}>
      <div className="text-xs font-bold mb-1 text-slate-900 dark:text-white font-mono">{name}</div>
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="bg-white dark:bg-slate-800 rounded-lg p-1 border border-slate-200 dark:border-white/10">
        {/* Frets (Horizontal) */}
        {Array.from({ length: numFrets + 1 }).map((_, i) => (
          <line
            key={`fret-${i}`}
            x1={padding}
            y1={padding + i * fretSpacing}
            x2={width - padding}
            y2={padding + i * fretSpacing}
            stroke="currentColor"
            strokeWidth={i === 0 && startFret === 1 ? 3 : 1} // Nut is thicker
            className="text-slate-300 dark:text-slate-600"
          />
        ))}

        {/* Strings (Vertical) */}
        {Array.from({ length: numStrings }).map((_, i) => (
          <line
            key={`string-${i}`}
            x1={padding + i * stringSpacing}
            y1={padding}
            x2={padding + i * stringSpacing}
            y2={height - padding}
            stroke="currentColor"
            strokeWidth={1}
            className="text-slate-300 dark:text-slate-600"
          />
        ))}

        {/* Finger Positions */}
        {frets.map((fret, stringIdx) => {
          if (fret === -1) {
            // Mute (X)
            return (
              <text
                key={`mute-${stringIdx}`}
                x={padding + stringIdx * stringSpacing}
                y={padding - 4}
                textAnchor="middle"
                className="text-[8px] fill-slate-500"
                dominantBaseline="middle"
              >
                X
              </text>
            );
          }
          if (fret === 0) {
            // Open (O)
            return (
              <circle
                key={`open-${stringIdx}`}
                cx={padding + stringIdx * stringSpacing}
                cy={padding - 4}
                r={2}
                fill="none"
                stroke="currentColor"
                strokeWidth={1}
                className="text-slate-500"
              />
            );
          }
          
          // Fretted Note
          const displayFret = fret - startFret + 1;
          if (displayFret > 0 && displayFret <= numFrets) {
               return (
                <circle
                    key={`note-${stringIdx}`}
                    cx={padding + stringIdx * stringSpacing}
                    cy={padding + (displayFret - 0.5) * fretSpacing}
                    r={4}
                    className="fill-primary"
                />
               );
          }
          return null;
        })}
        
        {/* Fret Number Label if not at Nut */}
        {startFret > 1 && (
            <text x={padding - 4} y={padding + 0.5 * fretSpacing} className="text-[8px] fill-slate-500 font-mono text-right" textAnchor="end" dominantBaseline="middle">{startFret}</text>
        )}
      </svg>
    </div>
  );
};

export default memo(ChordDiagram);
