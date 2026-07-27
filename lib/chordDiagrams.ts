export interface ChordDiagram {
  name: string;
  frets: (number | 'x')[]; // 6 values: String 6 (Low E) to String 1 (High E)
  fingers: number[];       // finger numbers: 0 = open, 1 = index, 2 = middle, 3 = ring, 4 = pinky
  baseFret: number;        // starting fret number (usually 1)
  barres?: number[];       // fret numbers where barre is applied
}

export const CHORD_DICTIONARY: Record<string, ChordDiagram> = {
  // --- C CHORDS ---
  "C": { name: "C", frets: ['x', 3, 2, 0, 1, 0], fingers: [0, 3, 2, 0, 1, 0], baseFret: 1 },
  "Cm": { name: "Cm", frets: ['x', 3, 5, 5, 4, 3], fingers: [0, 1, 3, 4, 2, 1], baseFret: 3, barres: [3] },
  "C7": { name: "C7", frets: ['x', 3, 2, 3, 1, 0], fingers: [0, 3, 2, 4, 1, 0], baseFret: 1 },
  "Cmaj7": { name: "Cmaj7", frets: ['x', 3, 2, 0, 0, 0], fingers: [0, 3, 2, 0, 0, 0], baseFret: 1 },
  "Cm7": { name: "Cm7", frets: ['x', 3, 5, 3, 4, 3], fingers: [0, 1, 3, 1, 2, 1], baseFret: 3, barres: [3] },
  "Csus2": { name: "Csus2", frets: ['x', 3, 0, 0, 1, 0], fingers: [0, 3, 0, 0, 1, 0], baseFret: 1 },
  "Csus4": { name: "Csus4", frets: ['x', 3, 3, 0, 1, 1], fingers: [0, 3, 4, 0, 1, 1], baseFret: 1 },
  "Cadd9": { name: "Cadd9", frets: ['x', 3, 2, 0, 3, 0], fingers: [0, 2, 1, 0, 3, 0], baseFret: 1 },
  "C/E": { name: "C/E", frets: [0, 3, 2, 0, 1, 0], fingers: [0, 3, 2, 0, 1, 0], baseFret: 1 },
  "C/G": { name: "C/G", frets: [3, 3, 2, 0, 1, 0], fingers: [3, 4, 2, 0, 1, 0], baseFret: 1 },
  "Cdim": { name: "Cdim", frets: ['x', 3, 4, 2, 4, 'x'], fingers: [0, 2, 3, 1, 4, 0], baseFret: 1 },
  "Caug": { name: "Caug", frets: ['x', 3, 2, 1, 1, 0], fingers: [0, 3, 2, 1, 1, 0], baseFret: 1 },

  // --- C# / Db CHORDS ---
  "C#": { name: "C#", frets: ['x', 4, 6, 6, 6, 4], fingers: [0, 1, 2, 3, 4, 1], baseFret: 4, barres: [4] },
  "C#m": { name: "C#m", frets: ['x', 4, 6, 6, 5, 4], fingers: [0, 1, 3, 4, 2, 1], baseFret: 4, barres: [4] },
  "C#7": { name: "C#7", frets: ['x', 4, 6, 4, 6, 4], fingers: [0, 1, 3, 1, 4, 1], baseFret: 4, barres: [4] },
  "C#m7": { name: "C#m7", frets: ['x', 4, 6, 4, 5, 4], fingers: [0, 1, 3, 1, 2, 1], baseFret: 4, barres: [4] },
  "Db": { name: "Db", frets: ['x', 4, 6, 6, 6, 4], fingers: [0, 1, 2, 3, 4, 1], baseFret: 4, barres: [4] },

  // --- D CHORDS ---
  "D": { name: "D", frets: ['x', 'x', 0, 2, 3, 2], fingers: [0, 0, 0, 1, 3, 2], baseFret: 1 },
  "Dm": { name: "Dm", frets: ['x', 'x', 0, 2, 3, 1], fingers: [0, 0, 0, 2, 3, 1], baseFret: 1 },
  "D7": { name: "D7", frets: ['x', 'x', 0, 2, 1, 2], fingers: [0, 0, 0, 2, 1, 3], baseFret: 1 },
  "Dmaj7": { name: "Dmaj7", frets: ['x', 'x', 0, 2, 2, 2], fingers: [0, 0, 0, 1, 1, 1], baseFret: 1 },
  "Dm7": { name: "Dm7", frets: ['x', 'x', 0, 2, 1, 1], fingers: [0, 0, 0, 2, 1, 1], baseFret: 1 },
  "Dsus2": { name: "Dsus2", frets: ['x', 'x', 0, 2, 3, 0], fingers: [0, 0, 0, 1, 3, 0], baseFret: 1 },
  "Dsus4": { name: "Dsus4", frets: ['x', 'x', 0, 2, 3, 3], fingers: [0, 0, 0, 1, 2, 3], baseFret: 1 },
  "Dadd9": { name: "Dadd9", frets: ['x', 'x', 0, 2, 3, 0], fingers: [0, 0, 0, 1, 2, 0], baseFret: 1 },
  "D/F#": { name: "D/F#", frets: [2, 0, 0, 2, 3, 2], fingers: [1, 0, 0, 2, 4, 3], baseFret: 1 },

  // --- D# / Eb CHORDS ---
  "D#m": { name: "D#m", frets: ['x', 6, 8, 8, 7, 6], fingers: [0, 1, 3, 4, 2, 1], baseFret: 6, barres: [6] },
  "Eb": { name: "Eb", frets: ['x', 6, 8, 8, 8, 6], fingers: [0, 1, 2, 3, 4, 1], baseFret: 6, barres: [6] },
  "Ebm": { name: "Ebm", frets: ['x', 6, 8, 8, 7, 6], fingers: [0, 1, 3, 4, 2, 1], baseFret: 6, barres: [6] },

  // --- E CHORDS ---
  "E": { name: "E", frets: [0, 2, 2, 1, 0, 0], fingers: [0, 2, 3, 1, 0, 0], baseFret: 1 },
  "Em": { name: "Em", frets: [0, 2, 2, 0, 0, 0], fingers: [0, 2, 3, 0, 0, 0], baseFret: 1 },
  "E7": { name: "E7", frets: [0, 2, 0, 1, 0, 0], fingers: [0, 2, 0, 1, 0, 0], baseFret: 1 },
  "Emaj7": { name: "Emaj7", frets: [0, 2, 1, 1, 0, 0], fingers: [0, 2, 1, 1, 0, 0], baseFret: 1 },
  "Em7": { name: "Em7", frets: [0, 2, 0, 0, 0, 0], fingers: [0, 2, 0, 0, 0, 0], baseFret: 1 },
  "Esus4": { name: "Esus4", frets: [0, 2, 2, 2, 0, 0], fingers: [0, 2, 3, 4, 0, 0], baseFret: 1 },
  "Eadd9": { name: "Eadd9", frets: [0, 2, 4, 1, 0, 0], fingers: [0, 2, 4, 1, 0, 0], baseFret: 1 },

  // --- F CHORDS ---
  "F": { name: "F", frets: [1, 3, 3, 2, 1, 1], fingers: [1, 3, 4, 2, 1, 1], baseFret: 1, barres: [1] },
  "Fm": { name: "Fm", frets: [1, 3, 3, 1, 1, 1], fingers: [1, 3, 4, 1, 1, 1], baseFret: 1, barres: [1] },
  "F7": { name: "F7", frets: [1, 3, 1, 2, 1, 1], fingers: [1, 3, 1, 2, 1, 1], baseFret: 1, barres: [1] },
  "Fmaj7": { name: "Fmaj7", frets: ['x', 'x', 3, 2, 1, 0], fingers: [0, 0, 3, 2, 1, 0], baseFret: 1 },
  "Fm7": { name: "Fm7", frets: [1, 3, 1, 1, 1, 1], fingers: [1, 3, 1, 1, 1, 1], baseFret: 1, barres: [1] },
  "Fsus2": { name: "Fsus2", frets: ['x', 3, 3, 0, 1, 1], fingers: [0, 3, 4, 0, 1, 1], baseFret: 1 },
  "Fsus4": { name: "Fsus4", frets: [1, 3, 3, 3, 1, 1], fingers: [1, 2, 3, 4, 1, 1], baseFret: 1, barres: [1] },
  "F/A": { name: "F/A", frets: ['x', 0, 3, 2, 1, 1], fingers: [0, 0, 3, 2, 1, 1], baseFret: 1 },

  // --- F# / Gb CHORDS ---
  "F#": { name: "F#", frets: [2, 4, 4, 3, 2, 2], fingers: [1, 3, 4, 2, 1, 1], baseFret: 2, barres: [2] },
  "F#m": { name: "F#m", frets: [2, 4, 4, 2, 2, 2], fingers: [1, 3, 4, 1, 1, 1], baseFret: 2, barres: [2] },
  "F#7": { name: "F#7", frets: [2, 4, 2, 3, 2, 2], fingers: [1, 3, 1, 2, 1, 1], baseFret: 2, barres: [2] },
  "F#m7": { name: "F#m7", frets: [2, 4, 2, 2, 2, 2], fingers: [1, 3, 1, 1, 1, 1], baseFret: 2, barres: [2] },
  "Gb": { name: "Gb", frets: [2, 4, 4, 3, 2, 2], fingers: [1, 3, 4, 2, 1, 1], baseFret: 2, barres: [2] },

  // --- G CHORDS ---
  "G": { name: "G", frets: [3, 2, 0, 0, 0, 3], fingers: [2, 1, 0, 0, 0, 3], baseFret: 1 },
  "Gm": { name: "Gm", frets: [3, 5, 5, 3, 3, 3], fingers: [1, 3, 4, 1, 1, 1], baseFret: 3, barres: [3] },
  "G7": { name: "G7", frets: [3, 2, 0, 0, 0, 1], fingers: [3, 2, 0, 0, 0, 1], baseFret: 1 },
  "Gmaj7": { name: "Gmaj7", frets: [3, 2, 0, 0, 0, 2], fingers: [3, 2, 0, 0, 0, 1], baseFret: 1 },
  "Gm7": { name: "Gm7", frets: [3, 5, 3, 3, 3, 3], fingers: [1, 3, 1, 1, 1, 1], baseFret: 3, barres: [3] },
  "Gsus2": { name: "Gsus2", frets: [3, 0, 0, 2, 3, 3], fingers: [2, 0, 0, 1, 3, 4], baseFret: 1 },
  "Gsus4": { name: "Gsus4", frets: [3, 3, 0, 0, 1, 3], fingers: [2, 3, 0, 0, 1, 4], baseFret: 1 },
  "G/B": { name: "G/B", frets: ['x', 2, 0, 0, 0, 3], fingers: [0, 1, 0, 0, 0, 2], baseFret: 1 },
  "G/D": { name: "G/D", frets: ['x', 'x', 0, 0, 0, 3], fingers: [0, 0, 0, 0, 0, 1], baseFret: 1 },

  // --- G# / Ab CHORDS ---
  "G#m": { name: "G#m", frets: [4, 6, 6, 4, 4, 4], fingers: [1, 3, 4, 1, 1, 1], baseFret: 4, barres: [4] },
  "Ab": { name: "Ab", frets: [4, 6, 6, 5, 4, 4], fingers: [1, 3, 4, 2, 1, 1], baseFret: 4, barres: [4] },

  // --- A CHORDS ---
  "A": { name: "A", frets: ['x', 0, 2, 2, 2, 0], fingers: [0, 0, 1, 2, 3, 0], baseFret: 1 },
  "Am": { name: "Am", frets: ['x', 0, 2, 2, 1, 0], fingers: [0, 0, 2, 3, 1, 0], baseFret: 1 },
  "A7": { name: "A7", frets: ['x', 0, 2, 0, 2, 0], fingers: [0, 0, 1, 0, 2, 0], baseFret: 1 },
  "Amaj7": { name: "Amaj7", frets: ['x', 0, 2, 1, 2, 0], fingers: [0, 0, 2, 1, 3, 0], baseFret: 1 },
  "Am7": { name: "Am7", frets: ['x', 0, 2, 0, 1, 0], fingers: [0, 0, 2, 0, 1, 0], baseFret: 1 },
  "Asus2": { name: "Asus2", frets: ['x', 0, 2, 2, 0, 0], fingers: [0, 0, 1, 2, 0, 0], baseFret: 1 },
  "Asus4": { name: "Asus4", frets: ['x', 0, 2, 2, 3, 0], fingers: [0, 0, 1, 2, 3, 0], baseFret: 1 },
  "Aadd9": { name: "Aadd9", frets: ['x', 0, 2, 4, 2, 0], fingers: [0, 0, 1, 3, 2, 0], baseFret: 1 },
  "A/C#": { name: "A/C#", frets: ['x', 4, 2, 2, 2, 0], fingers: [0, 4, 1, 2, 3, 0], baseFret: 1 },

  // --- A# / Bb CHORDS ---
  "A#m": { name: "A#m", frets: ['x', 1, 3, 3, 2, 1], fingers: [0, 1, 3, 4, 2, 1], baseFret: 1, barres: [1] },
  "Bb": { name: "Bb", frets: ['x', 1, 3, 3, 3, 1], fingers: [0, 1, 2, 3, 4, 1], baseFret: 1, barres: [1] },
  "Bbm": { name: "Bbm", frets: ['x', 1, 3, 3, 2, 1], fingers: [0, 1, 3, 4, 2, 1], baseFret: 1, barres: [1] },

  // --- B CHORDS ---
  "B": { name: "B", frets: ['x', 2, 4, 4, 4, 2], fingers: [0, 1, 2, 3, 4, 1], baseFret: 2, barres: [2] },
  "Bm": { name: "Bm", frets: ['x', 2, 4, 4, 3, 2], fingers: [0, 1, 3, 4, 2, 1], baseFret: 2, barres: [2] },
  "B7": { name: "B7", frets: ['x', 2, 1, 2, 0, 2], fingers: [0, 2, 1, 3, 0, 4], baseFret: 1 },
  "Bmaj7": { name: "Bmaj7", frets: ['x', 2, 4, 3, 4, 2], fingers: [0, 1, 3, 2, 4, 1], baseFret: 2, barres: [2] },
  "Bm7": { name: "Bm7", frets: ['x', 2, 4, 2, 3, 2], fingers: [0, 1, 3, 1, 2, 1], baseFret: 2, barres: [2] },
  "Bsus2": { name: "Bsus2", frets: ['x', 2, 4, 4, 2, 2], fingers: [0, 1, 3, 4, 1, 1], baseFret: 2, barres: [2] },
  "Bsus4": { name: "Bsus4", frets: ['x', 2, 4, 4, 5, 2], fingers: [0, 1, 2, 3, 4, 1], baseFret: 2, barres: [2] },
  "Bdim": { name: "Bdim", frets: ['x', 2, 3, 4, 3, 'x'], fingers: [0, 1, 2, 4, 3, 0], baseFret: 2 }
};

/**
 * Smart Parser to get chord diagram with multi-tier fallback mechanism.
 * Guaranteed to NEVER return null or empty diagram.
 */
export function getChordDiagram(chordName: string): ChordDiagram {
  if (!chordName) {
    return CHORD_DICTIONARY["C"];
  }

  const clean = chordName.trim();

  // Tier 1: Direct exact match
  if (CHORD_DICTIONARY[clean]) {
    return CHORD_DICTIONARY[clean];
  }

  // Tier 2: Handle Slash Chords (e.g. C/E -> try C/E first, then C)
  if (clean.includes('/')) {
    const mainChord = clean.split('/')[0].trim();
    if (CHORD_DICTIONARY[mainChord]) {
      return { ...CHORD_DICTIONARY[mainChord], name: clean };
    }
  }

  // Tier 3: Strip complex extensions (e.g. Am9 -> Am, Cmaj7 -> C)
  const rootAndQualityMatch = clean.match(/^([A-G][#b]?)(m|maj|dim|aug|sus|add)?[0-9]*/i);
  if (rootAndQualityMatch) {
    const root = rootAndQualityMatch[1];
    const isMinor = clean.toLowerCase().includes('m') && !clean.toLowerCase().includes('maj');

    const simplifiedKey = isMinor ? `${root}m` : root;
    if (CHORD_DICTIONARY[simplifiedKey]) {
      return { ...CHORD_DICTIONARY[simplifiedKey], name: clean };
    }

    if (CHORD_DICTIONARY[root]) {
      return { ...CHORD_DICTIONARY[root], name: clean };
    }
  }

  // Tier 4: Fallback to root note 'C' or default C chord with custom name
  return {
    ...CHORD_DICTIONARY["C"],
    name: clean
  };
}
