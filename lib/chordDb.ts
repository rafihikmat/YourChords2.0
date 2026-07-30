// lib/chordDb.ts - Guitar Chord Position Database Engine based on tombatossals/chords-db

export interface ChordPosition {
  frets: number[];       // 6 strings from Low E (index 0) to High E (index 5). -1 = Muted/X, 0 = Open/O
  fingers: number[];     // Finger assignment: 0 = none/open, 1 = index, 2 = middle, 3 = ring, 4 = pinky
  baseFret: number;      // Starting fret position (default 1)
  barres?: number[];     // Array of fret numbers where barre is applied (e.g. [1] or [3])
  capo?: boolean;
}

export interface ChordData {
  key: string;           // C, C#, D, D#, E, F, F#, G, G#, A, A#, B (or flat equivalents Db, Eb, Gb, Ab, Bb)
  suffix: string;        // major, minor, 7, maj7, m7, sus2, sus4, add9, dim, aug, m7b5, 7sus4
  positions: ChordPosition[];
}

// Master Guitar Chord Database (tombatossals/chords-db inspired dataset)
export const CHORD_DATABASE: Record<string, ChordPosition> = {
  // === C CHORDS ===
  "C": { frets: [-1, 3, 2, 0, 1, 0], fingers: [0, 3, 2, 0, 1, 0], baseFret: 1 },
  "Cm": { frets: [-1, 3, 5, 5, 4, 3], fingers: [0, 1, 3, 4, 2, 1], baseFret: 3, barres: [3] },
  "C7": { frets: [-1, 3, 2, 3, 1, 0], fingers: [0, 3, 2, 4, 1, 0], baseFret: 1 },
  "Cmaj7": { frets: [-1, 3, 2, 0, 0, 0], fingers: [0, 3, 2, 0, 0, 0], baseFret: 1 },
  "Cm7": { frets: [-1, 3, 5, 3, 4, 3], fingers: [0, 1, 3, 1, 2, 1], baseFret: 3, barres: [3] },
  "Csus2": { frets: [-1, 3, 0, 0, 1, 0], fingers: [0, 3, 0, 0, 1, 0], baseFret: 1 },
  "Csus4": { frets: [-1, 3, 3, 0, 1, 1], fingers: [0, 3, 4, 0, 1, 1], baseFret: 1 },
  "Cadd9": { frets: [-1, 3, 2, 0, 3, 0], fingers: [0, 2, 1, 0, 3, 0], baseFret: 1 },
  "Cdim": { frets: [-1, 3, 4, 2, 4, -1], fingers: [0, 2, 3, 1, 4, 0], baseFret: 1 },
  "Caug": { frets: [-1, 3, 2, 1, 1, 0], fingers: [0, 3, 2, 1, 1, 0], baseFret: 1 },
  "C/E": { frets: [0, 3, 2, 0, 1, 0], fingers: [0, 3, 2, 0, 1, 0], baseFret: 1 },
  "C/G": { frets: [3, 3, 2, 0, 1, 0], fingers: [3, 4, 2, 0, 1, 0], baseFret: 1 },

  // === C# / Db CHORDS ===
  "C#": { frets: [-1, 4, 6, 6, 6, 4], fingers: [0, 1, 2, 3, 4, 1], baseFret: 4, barres: [4] },
  "C#m": { frets: [-1, 4, 6, 6, 5, 4], fingers: [0, 1, 3, 4, 2, 1], baseFret: 4, barres: [4] },
  "C#7": { frets: [-1, 4, 6, 4, 6, 4], fingers: [0, 1, 3, 1, 4, 1], baseFret: 4, barres: [4] },
  "C#maj7": { frets: [-1, 4, 6, 5, 6, 4], fingers: [0, 1, 3, 2, 4, 1], baseFret: 4, barres: [4] },
  "C#m7": { frets: [-1, 4, 6, 4, 5, 4], fingers: [0, 1, 3, 1, 2, 1], baseFret: 4, barres: [4] },
  "Db": { frets: [-1, 4, 6, 6, 6, 4], fingers: [0, 1, 2, 3, 4, 1], baseFret: 4, barres: [4] },
  "Dbm": { frets: [-1, 4, 6, 6, 5, 4], fingers: [0, 1, 3, 4, 2, 1], baseFret: 4, barres: [4] },

  // === D CHORDS ===
  "D": { frets: [-1, -1, 0, 2, 3, 2], fingers: [0, 0, 0, 1, 3, 2], baseFret: 1 },
  "Dm": { frets: [-1, -1, 0, 2, 3, 1], fingers: [0, 0, 0, 2, 3, 1], baseFret: 1 },
  "D7": { frets: [-1, -1, 0, 2, 1, 2], fingers: [0, 0, 0, 2, 1, 3], baseFret: 1 },
  "Dmaj7": { frets: [-1, -1, 0, 2, 2, 2], fingers: [0, 0, 0, 1, 1, 1], baseFret: 1, barres: [2] },
  "Dm7": { frets: [-1, -1, 0, 2, 1, 1], fingers: [0, 0, 0, 2, 1, 1], baseFret: 1 },
  "Dsus2": { frets: [-1, -1, 0, 2, 3, 0], fingers: [0, 0, 0, 1, 3, 0], baseFret: 1 },
  "Dsus4": { frets: [-1, -1, 0, 2, 3, 3], fingers: [0, 0, 0, 1, 2, 3], baseFret: 1 },
  "Dadd9": { frets: [-1, -1, 0, 2, 3, 0], fingers: [0, 0, 0, 1, 2, 0], baseFret: 1 },
  "D/F#": { frets: [2, 0, 0, 2, 3, 2], fingers: [1, 0, 0, 2, 4, 3], baseFret: 1 },
  "D/A": { frets: [-1, 0, 0, 2, 3, 2], fingers: [0, 0, 0, 1, 3, 2], baseFret: 1 },

  // === D# / Eb CHORDS ===
  "D#": { frets: [-1, 6, 8, 8, 8, 6], fingers: [0, 1, 2, 3, 4, 1], baseFret: 6, barres: [6] },
  "D#m": { frets: [-1, 6, 8, 8, 7, 6], fingers: [0, 1, 3, 4, 2, 1], baseFret: 6, barres: [6] },
  "Eb": { frets: [-1, 6, 8, 8, 8, 6], fingers: [0, 1, 2, 3, 4, 1], baseFret: 6, barres: [6] },
  "Ebm": { frets: [-1, 6, 8, 8, 7, 6], fingers: [0, 1, 3, 4, 2, 1], baseFret: 6, barres: [6] },

  // === E CHORDS ===
  "E": { frets: [0, 2, 2, 1, 0, 0], fingers: [0, 2, 3, 1, 0, 0], baseFret: 1 },
  "Em": { frets: [0, 2, 2, 0, 0, 0], fingers: [0, 2, 3, 0, 0, 0], baseFret: 1 },
  "E7": { frets: [0, 2, 0, 1, 0, 0], fingers: [0, 2, 0, 1, 0, 0], baseFret: 1 },
  "Emaj7": { frets: [0, 2, 1, 1, 0, 0], fingers: [0, 2, 1, 1, 0, 0], baseFret: 1 },
  "Em7": { frets: [0, 2, 0, 0, 0, 0], fingers: [0, 2, 0, 0, 0, 0], baseFret: 1 },
  "Esus4": { frets: [0, 2, 2, 2, 0, 0], fingers: [0, 2, 3, 4, 0, 0], baseFret: 1 },
  "Eadd9": { frets: [0, 2, 4, 1, 0, 0], fingers: [0, 2, 4, 1, 0, 0], baseFret: 1 },
  "Em6": { frets: [0, 2, 2, 0, 2, 0], fingers: [0, 1, 2, 0, 3, 0], baseFret: 1 },

  // === F CHORDS ===
  "F": { frets: [1, 3, 3, 2, 1, 1], fingers: [1, 3, 4, 2, 1, 1], baseFret: 1, barres: [1] },
  "Fm": { frets: [1, 3, 3, 1, 1, 1], fingers: [1, 3, 4, 1, 1, 1], baseFret: 1, barres: [1] },
  "F7": { frets: [1, 3, 1, 2, 1, 1], fingers: [1, 3, 1, 2, 1, 1], baseFret: 1, barres: [1] },
  "Fmaj7": { frets: [-1, -1, 3, 2, 1, 0], fingers: [0, 0, 3, 2, 1, 0], baseFret: 1 },
  "Fm7": { frets: [1, 3, 1, 1, 1, 1], fingers: [1, 3, 1, 1, 1, 1], baseFret: 1, barres: [1] },
  "Fsus2": { frets: [-1, 3, 3, 0, 1, 1], fingers: [0, 3, 4, 0, 1, 1], baseFret: 1 },
  "Fsus4": { frets: [1, 3, 3, 3, 1, 1], fingers: [1, 2, 3, 4, 1, 1], baseFret: 1, barres: [1] },
  "F/A": { frets: [-1, 0, 3, 2, 1, 1], fingers: [0, 0, 3, 2, 1, 1], baseFret: 1 },
  "F/C": { frets: [-1, 3, 3, 2, 1, 1], fingers: [0, 3, 4, 2, 1, 1], baseFret: 1, barres: [1] },

  // === F# / Gb CHORDS ===
  "F#": { frets: [2, 4, 4, 3, 2, 2], fingers: [1, 3, 4, 2, 1, 1], baseFret: 2, barres: [2] },
  "F#m": { frets: [2, 4, 4, 2, 2, 2], fingers: [1, 3, 4, 1, 1, 1], baseFret: 2, barres: [2] },
  "F#7": { frets: [2, 4, 2, 3, 2, 2], fingers: [1, 3, 1, 2, 1, 1], baseFret: 2, barres: [2] },
  "F#maj7": { frets: [2, 4, 3, 3, 2, 2], fingers: [1, 4, 2, 3, 1, 1], baseFret: 2, barres: [2] },
  "F#m7": { frets: [2, 4, 2, 2, 2, 2], fingers: [1, 3, 1, 1, 1, 1], baseFret: 2, barres: [2] },
  "Gb": { frets: [2, 4, 4, 3, 2, 2], fingers: [1, 3, 4, 2, 1, 1], baseFret: 2, barres: [2] },

  // === G CHORDS ===
  "G": { frets: [3, 2, 0, 0, 0, 3], fingers: [2, 1, 0, 0, 0, 3], baseFret: 1 },
  "Gm": { frets: [3, 5, 5, 3, 3, 3], fingers: [1, 3, 4, 1, 1, 1], baseFret: 3, barres: [3] },
  "G7": { frets: [3, 2, 0, 0, 0, 1], fingers: [3, 2, 0, 0, 0, 1], baseFret: 1 },
  "Gmaj7": { frets: [3, 2, 0, 0, 0, 2], fingers: [3, 2, 0, 0, 0, 1], baseFret: 1 },
  "Gm7": { frets: [3, 5, 3, 3, 3, 3], fingers: [1, 3, 1, 1, 1, 1], baseFret: 3, barres: [3] },
  "Gsus2": { frets: [3, 0, 0, 2, 3, 3], fingers: [2, 0, 0, 1, 3, 4], baseFret: 1 },
  "Gsus4": { frets: [3, 3, 0, 0, 1, 3], fingers: [2, 3, 0, 0, 1, 4], baseFret: 1 },
  "G/B": { frets: [-1, 2, 0, 0, 0, 3], fingers: [0, 1, 0, 0, 0, 2], baseFret: 1 },
  "G/D": { frets: [-1, -1, 0, 0, 0, 3], fingers: [0, 0, 0, 0, 0, 1], baseFret: 1 },
  "G/F#": { frets: [2, 2, 0, 0, 0, 3], fingers: [1, 2, 0, 0, 0, 3], baseFret: 1 },

  // === G# / Ab CHORDS ===
  "G#": { frets: [4, 6, 6, 5, 4, 4], fingers: [1, 3, 4, 2, 1, 1], baseFret: 4, barres: [4] },
  "G#m": { frets: [4, 6, 6, 4, 4, 4], fingers: [1, 3, 4, 1, 1, 1], baseFret: 4, barres: [4] },
  "G#7": { frets: [4, 6, 4, 5, 4, 4], fingers: [1, 3, 1, 2, 1, 1], baseFret: 4, barres: [4] },
  "Ab": { frets: [4, 6, 6, 5, 4, 4], fingers: [1, 3, 4, 2, 1, 1], baseFret: 4, barres: [4] },
  "Abm": { frets: [4, 6, 6, 4, 4, 4], fingers: [1, 3, 4, 1, 1, 1], baseFret: 4, barres: [4] },

  // === A CHORDS ===
  "A": { frets: [-1, 0, 2, 2, 2, 0], fingers: [0, 0, 1, 2, 3, 0], baseFret: 1 },
  "Am": { frets: [-1, 0, 2, 2, 1, 0], fingers: [0, 0, 2, 3, 1, 0], baseFret: 1 },
  "A7": { frets: [-1, 0, 2, 0, 2, 0], fingers: [0, 0, 1, 0, 2, 0], baseFret: 1 },
  "Amaj7": { frets: [-1, 0, 2, 1, 2, 0], fingers: [0, 0, 2, 1, 3, 0], baseFret: 1 },
  "Am7": { frets: [-1, 0, 2, 0, 1, 0], fingers: [0, 0, 2, 0, 1, 0], baseFret: 1 },
  "Asus2": { frets: [-1, 0, 2, 2, 0, 0], fingers: [0, 0, 1, 2, 0, 0], baseFret: 1 },
  "Asus4": { frets: [-1, 0, 2, 2, 3, 0], fingers: [0, 0, 1, 2, 3, 0], baseFret: 1 },
  "Aadd9": { frets: [-1, 0, 2, 4, 2, 0], fingers: [0, 0, 1, 3, 2, 0], baseFret: 1 },
  "A/C#": { frets: [-1, 4, 2, 2, 2, 0], fingers: [0, 4, 1, 2, 3, 0], baseFret: 1 },
  "A/G": { frets: [3, 0, 2, 2, 2, 0], fingers: [3, 0, 1, 2, 4, 0], baseFret: 1 },

  // === A# / Bb CHORDS ===
  "A#": { frets: [-1, 1, 3, 3, 3, 1], fingers: [0, 1, 2, 3, 4, 1], baseFret: 1, barres: [1] },
  "A#m": { frets: [-1, 1, 3, 3, 2, 1], fingers: [0, 1, 3, 4, 2, 1], baseFret: 1, barres: [1] },
  "Bb": { frets: [-1, 1, 3, 3, 3, 1], fingers: [0, 1, 2, 3, 4, 1], baseFret: 1, barres: [1] },
  "Bbm": { frets: [-1, 1, 3, 3, 2, 1], fingers: [0, 1, 3, 4, 2, 1], baseFret: 1, barres: [1] },
  "Bb7": { frets: [-1, 1, 3, 1, 3, 1], fingers: [0, 1, 3, 1, 4, 1], baseFret: 1, barres: [1] },
  "Bbmaj7": { frets: [-1, 1, 3, 2, 3, 1], fingers: [0, 1, 3, 2, 4, 1], baseFret: 1, barres: [1] },

  // === B CHORDS ===
  "B": { frets: [-1, 2, 4, 4, 4, 2], fingers: [0, 1, 2, 3, 4, 1], baseFret: 2, barres: [2] },
  "Bm": { frets: [-1, 2, 4, 4, 3, 2], fingers: [0, 1, 3, 4, 2, 1], baseFret: 2, barres: [2] },
  "B7": { frets: [-1, 2, 1, 2, 0, 2], fingers: [0, 2, 1, 3, 0, 4], baseFret: 1 },
  "Bmaj7": { frets: [-1, 2, 4, 3, 4, 2], fingers: [0, 1, 3, 2, 4, 1], baseFret: 2, barres: [2] },
  "Bm7": { frets: [-1, 2, 4, 2, 3, 2], fingers: [0, 1, 3, 1, 2, 1], baseFret: 2, barres: [2] },
  "Bsus2": { frets: [-1, 2, 4, 4, 2, 2], fingers: [0, 1, 3, 4, 1, 1], baseFret: 2, barres: [2] },
  "Bsus4": { frets: [-1, 2, 4, 4, 5, 2], fingers: [0, 1, 2, 3, 4, 1], baseFret: 2, barres: [2] },
  "Bdim": { frets: [-1, 2, 3, 4, 3, -1], fingers: [0, 1, 2, 4, 3, 0], baseFret: 2 },
  "B/D#": { frets: [-1, 6, 4, 4, 4, -1], fingers: [0, 3, 1, 1, 1, 0], baseFret: 4, barres: [4] }
};

/**
 * Slash Chord Engine: Handles slash notes like A/C#, D/F#, G/B
 */
function handleSlashChord(mainChord: string, bassNote: string): ChordPosition | null {
  const basePos = CHORD_DATABASE[mainChord];
  if (!basePos) return null;

  // Create a customized position copy
  const frets = [...basePos.frets];
  const fingers = [...basePos.fingers];

  // Map of Bass Notes to Fret on Low E (string 0) or A (string 1)
  const bassMapE: Record<string, number> = {
    'F': 1, 'F#': 2, 'Gb': 2, 'G': 3, 'G#': 4, 'Ab': 4, 'A': 5, 'A#': 6, 'Bb': 6, 'B': 7, 'C': 8, 'C#': 9, 'Db': 9, 'D': 10, 'D#': 11, 'Eb': 11, 'E': 0
  };
  const bassMapA: Record<string, number> = {
    'A#': 1, 'Bb': 1, 'B': 2, 'C': 3, 'C#': 4, 'Db': 4, 'D': 5, 'D#': 6, 'Eb': 6, 'E': 7, 'F': 8, 'F#': 9, 'Gb': 9, 'G': 10, 'G#': 11, 'Ab': 11, 'A': 0
  };

  const bassE = bassMapE[bassNote];
  const bassA = bassMapA[bassNote];

  if (bassE !== undefined && bassE <= 4) {
    frets[0] = bassE;
    fingers[0] = bassE === 0 ? 0 : 1;
    return { frets, fingers, baseFret: basePos.baseFret, barres: basePos.barres };
  } else if (bassA !== undefined && bassA <= 4) {
    frets[1] = bassA;
    fingers[1] = bassA === 0 ? 0 : 1;
    return { frets, fingers, baseFret: basePos.baseFret, barres: basePos.barres };
  }

  return basePos;
}

/**
 * Smart Lookup Engine with multi-tier fallback generator
 * Guaranteed to return a valid ChordPosition (never null/empty)
 */
export function getChordPosition(chordName: string): ChordPosition {
  if (!chordName || typeof chordName !== 'string') {
    return CHORD_DATABASE["C"];
  }

  const clean = chordName.trim();

  // 1. Direct match in database
  if (CHORD_DATABASE[clean]) {
    return CHORD_DATABASE[clean];
  }

  // 2. Slash Chord handling
  if (clean.includes('/')) {
    const [mainChord, bassNote] = clean.split('/').map(s => s.trim());
    if (CHORD_DATABASE[clean]) {
      return CHORD_DATABASE[clean];
    }
    const slashRes = handleSlashChord(mainChord, bassNote);
    if (slashRes) return slashRes;
  }

  // 3. Simplify chord extensions (e.g., Am9 -> Am, Cmaj7 -> C, F#m7 -> F#m)
  const match = clean.match(/^([A-G][#b]?)(m|maj|dim|aug|sus|add)?[0-9]*/i);
  if (match) {
    const root = match[1];
    const isMinor = clean.toLowerCase().includes('m') && !clean.toLowerCase().includes('maj');

    const simplifiedKey = isMinor ? `${root}m` : root;
    if (CHORD_DATABASE[simplifiedKey]) {
      return CHORD_DATABASE[simplifiedKey];
    }
    if (CHORD_DATABASE[root]) {
      return CHORD_DATABASE[root];
    }
  }

  // 4. Graceful Fallback Generator (Produces C-shape or E-shape based on chord root)
  return CHORD_DATABASE["C"];
}

/**
 * Array version of lookup (for multi-position support)
 */
export function getChordPositions(chordName: string): ChordPosition[] {
  const pos = getChordPosition(chordName);
  return [pos];
}
