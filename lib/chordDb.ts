// lib/chordDb.ts - Guitar Chord Database & Hybrid Music Theory Engine
// Based on tombatossals/chords-db with Algorithmic Generator for Power, Diminished, Altered, and Extended Chords

export interface ChordPosition {
  frets: number[];       // 6 strings from Low E (index 0) to High E (index 5). -1 = Muted/X, 0 = Open/O
  fingers: number[];     // Finger assignment: 0 = none/open, 1 = index, 2 = middle, 3 = ring, 4 = pinky
  baseFret: number;      // Starting fret position (default 1)
  barres?: number[];     // Array of fret numbers where barre is applied
  capo?: boolean;
  chordType?: string;    // Metadata: e.g. "Power Chord", "Half-Diminished", "Altered Dominant", "Extended Chord", "Diminished", "Augmented", "Basic Chord"
}

export interface ChordData {
  key: string;
  suffix: string;
  positions: ChordPosition[];
}

// Map of note names to chromatic semitone index (C = 0)
const ROOT_SEMITONES: Record<string, number> = {
  'C': 0, 'C#': 1, 'DB': 1,
  'D': 2, 'D#': 3, 'EB': 3,
  'E': 4,
  'F': 5, 'F#': 6, 'GB': 6,
  'G': 7, 'G#': 8, 'AB': 8,
  'A': 9, 'A#': 10, 'BB': 10,
  'B': 11,
};

// Static Master Database (Layer 1 - Fast Lookup)
export const CHORD_DATABASE: Record<string, ChordPosition> = {
  // === C CHORDS ===
  "C": { frets: [-1, 3, 2, 0, 1, 0], fingers: [0, 3, 2, 0, 1, 0], baseFret: 1, chordType: "Basic Major" },
  "Cm": { frets: [-1, 3, 5, 5, 4, 3], fingers: [0, 1, 3, 4, 2, 1], baseFret: 3, barres: [3], chordType: "Minor Barre" },
  "C7": { frets: [-1, 3, 2, 3, 1, 0], fingers: [0, 3, 2, 4, 1, 0], baseFret: 1, chordType: "Dominant 7th" },
  "Cmaj7": { frets: [-1, 3, 2, 0, 0, 0], fingers: [0, 3, 2, 0, 0, 0], baseFret: 1, chordType: "Major 7th" },
  "Cm7": { frets: [-1, 3, 5, 3, 4, 3], fingers: [0, 1, 3, 1, 2, 1], baseFret: 3, barres: [3], chordType: "Minor 7th" },
  "Csus2": { frets: [-1, 3, 0, 0, 1, 0], fingers: [0, 3, 0, 0, 1, 0], baseFret: 1, chordType: "Suspended 2nd" },
  "Csus4": { frets: [-1, 3, 3, 0, 1, 1], fingers: [0, 3, 4, 0, 1, 1], baseFret: 1, chordType: "Suspended 4th" },
  "Cadd9": { frets: [-1, 3, 2, 0, 3, 0], fingers: [0, 2, 1, 0, 3, 0], baseFret: 1, chordType: "Added 9th" },
  "Cdim": { frets: [-1, 3, 4, 2, 4, -1], fingers: [0, 2, 3, 1, 4, 0], baseFret: 1, chordType: "Diminished" },
  "Cdim7": { frets: [-1, 3, 4, 2, 4, -1], fingers: [0, 2, 3, 1, 4, 0], baseFret: 1, chordType: "Diminished 7th" },
  "Caug": { frets: [-1, 3, 2, 1, 1, 0], fingers: [0, 3, 2, 1, 1, 0], baseFret: 1, chordType: "Augmented" },
  "C5": { frets: [-1, 3, 5, 5, -1, -1], fingers: [0, 1, 3, 4, 0, 0], baseFret: 3, chordType: "Power Chord" },
  "C7#9": { frets: [-1, 3, 2, 3, 4, -1], fingers: [0, 2, 1, 3, 4, 0], baseFret: 1, chordType: "Altered Dominant (Jimi Hendrix)" },
  "Cm7b5": { frets: [-1, 3, 4, 3, 4, -1], fingers: [0, 1, 3, 2, 4, 0], baseFret: 3, chordType: "Half-Diminished" },
  "C/E": { frets: [0, 3, 2, 0, 1, 0], fingers: [0, 3, 2, 0, 1, 0], baseFret: 1, chordType: "Slash Chord" },
  "C/G": { frets: [3, 3, 2, 0, 1, 0], fingers: [3, 4, 2, 0, 1, 0], baseFret: 1, chordType: "Slash Chord" },

  // === D CHORDS ===
  "D": { frets: [-1, -1, 0, 2, 3, 2], fingers: [0, 0, 0, 1, 3, 2], baseFret: 1, chordType: "Basic Major" },
  "Dm": { frets: [-1, -1, 0, 2, 3, 1], fingers: [0, 0, 0, 2, 3, 1], baseFret: 1, chordType: "Basic Minor" },
  "D7": { frets: [-1, -1, 0, 2, 1, 2], fingers: [0, 0, 0, 2, 1, 3], baseFret: 1, chordType: "Dominant 7th" },
  "Dmaj7": { frets: [-1, -1, 0, 2, 2, 2], fingers: [0, 0, 0, 1, 1, 1], baseFret: 1, barres: [2], chordType: "Major 7th" },
  "Dm7": { frets: [-1, -1, 0, 2, 1, 1], fingers: [0, 0, 0, 2, 1, 1], baseFret: 1, chordType: "Minor 7th" },
  "Dsus2": { frets: [-1, -1, 0, 2, 3, 0], fingers: [0, 0, 0, 1, 3, 0], baseFret: 1, chordType: "Suspended 2nd" },
  "Dsus4": { frets: [-1, -1, 0, 2, 3, 3], fingers: [0, 0, 0, 1, 2, 3], baseFret: 1, chordType: "Suspended 4th" },
  "D5": { frets: [-1, 5, 7, 7, -1, -1], fingers: [0, 1, 3, 4, 0, 0], baseFret: 5, chordType: "Power Chord" },
  "D/F#": { frets: [2, 0, 0, 2, 3, 2], fingers: [1, 0, 0, 2, 4, 3], baseFret: 1, chordType: "Slash Chord" },

  // === E CHORDS ===
  "E": { frets: [0, 2, 2, 1, 0, 0], fingers: [0, 2, 3, 1, 0, 0], baseFret: 1, chordType: "Basic Major" },
  "Em": { frets: [0, 2, 2, 0, 0, 0], fingers: [0, 2, 3, 0, 0, 0], baseFret: 1, chordType: "Basic Minor" },
  "E7": { frets: [0, 2, 0, 1, 0, 0], fingers: [0, 2, 0, 1, 0, 0], baseFret: 1, chordType: "Dominant 7th" },
  "Emaj7": { frets: [0, 2, 1, 1, 0, 0], fingers: [0, 2, 1, 1, 0, 0], baseFret: 1, chordType: "Major 7th" },
  "Em7": { frets: [0, 2, 0, 0, 0, 0], fingers: [0, 2, 0, 0, 0, 0], baseFret: 1, chordType: "Minor 7th" },
  "Esus4": { frets: [0, 2, 2, 2, 0, 0], fingers: [0, 2, 3, 4, 0, 0], baseFret: 1, chordType: "Suspended 4th" },
  "E5": { frets: [0, 2, 2, -1, -1, -1], fingers: [0, 1, 2, 0, 0, 0], baseFret: 1, chordType: "Power Chord" },

  // === F CHORDS ===
  "F": { frets: [1, 3, 3, 2, 1, 1], fingers: [1, 3, 4, 2, 1, 1], baseFret: 1, barres: [1], chordType: "Major Barre" },
  "Fm": { frets: [1, 3, 3, 1, 1, 1], fingers: [1, 3, 4, 1, 1, 1], baseFret: 1, barres: [1], chordType: "Minor Barre" },
  "F7": { frets: [1, 3, 1, 2, 1, 1], fingers: [1, 3, 1, 2, 1, 1], baseFret: 1, barres: [1], chordType: "Dominant 7th" },
  "Fmaj7": { frets: [-1, -1, 3, 2, 1, 0], fingers: [0, 0, 3, 2, 1, 0], baseFret: 1, chordType: "Major 7th" },
  "F5": { frets: [1, 3, 3, -1, -1, -1], fingers: [1, 3, 4, 0, 0, 0], baseFret: 1, chordType: "Power Chord" },

  // === G CHORDS ===
  "G": { frets: [3, 2, 0, 0, 0, 3], fingers: [2, 1, 0, 0, 0, 3], baseFret: 1, chordType: "Basic Major" },
  "Gm": { frets: [3, 5, 5, 3, 3, 3], fingers: [1, 3, 4, 1, 1, 1], baseFret: 3, barres: [3], chordType: "Minor Barre" },
  "G7": { frets: [3, 2, 0, 0, 0, 1], fingers: [3, 2, 0, 0, 0, 1], baseFret: 1, chordType: "Dominant 7th" },
  "Gmaj7": { frets: [3, 2, 0, 0, 0, 2], fingers: [3, 2, 0, 0, 0, 1], baseFret: 1, chordType: "Major 7th" },
  "G5": { frets: [3, 5, 5, -1, -1, -1], fingers: [1, 3, 4, 0, 0, 0], baseFret: 3, chordType: "Power Chord" },
  "G/B": { frets: [-1, 2, 0, 0, 0, 3], fingers: [0, 1, 0, 0, 0, 2], baseFret: 1, chordType: "Slash Chord" },

  // === A CHORDS ===
  "A": { frets: [-1, 0, 2, 2, 2, 0], fingers: [0, 0, 1, 2, 3, 0], baseFret: 1, chordType: "Basic Major" },
  "Am": { frets: [-1, 0, 2, 2, 1, 0], fingers: [0, 0, 2, 3, 1, 0], baseFret: 1, chordType: "Basic Minor" },
  "A7": { frets: [-1, 0, 2, 0, 2, 0], fingers: [0, 0, 1, 0, 2, 0], baseFret: 1, chordType: "Dominant 7th" },
  "Amaj7": { frets: [-1, 0, 2, 1, 2, 0], fingers: [0, 0, 2, 1, 3, 0], baseFret: 1, chordType: "Major 7th" },
  "Am7": { frets: [-1, 0, 2, 0, 1, 0], fingers: [0, 0, 2, 0, 1, 0], baseFret: 1, chordType: "Minor 7th" },
  "Asus2": { frets: [-1, 0, 2, 2, 0, 0], fingers: [0, 0, 1, 2, 0, 0], baseFret: 1, chordType: "Suspended 2nd" },
  "Asus4": { frets: [-1, 0, 2, 2, 3, 0], fingers: [0, 0, 1, 2, 3, 0], baseFret: 1, chordType: "Suspended 4th" },
  "A5": { frets: [-1, 0, 2, 2, -1, -1], fingers: [0, 0, 1, 2, 0, 0], baseFret: 1, chordType: "Power Chord" },

  // === B CHORDS ===
  "B": { frets: [-1, 2, 4, 4, 4, 2], fingers: [0, 1, 2, 3, 4, 1], baseFret: 2, barres: [2], chordType: "Major Barre" },
  "Bm": { frets: [-1, 2, 4, 4, 3, 2], fingers: [0, 1, 3, 4, 2, 1], baseFret: 2, barres: [2], chordType: "Minor Barre" },
  "B7": { frets: [-1, 2, 1, 2, 0, 2], fingers: [0, 2, 1, 3, 0, 4], baseFret: 1, chordType: "Dominant 7th" },
  "Bm7": { frets: [-1, 2, 4, 2, 3, 2], fingers: [0, 1, 3, 1, 2, 1], baseFret: 2, barres: [2], chordType: "Minor 7th" },
  "B5": { frets: [-1, 2, 4, 4, -1, -1], fingers: [0, 1, 3, 4, 0, 0], baseFret: 2, chordType: "Power Chord" },
};

/**
 * Helper: Shift base position up/down the fretboard according to semitone offset
 */
export function shiftBarrePosition(baseShape: ChordPosition, semitoneOffset: number, customType?: string): ChordPosition {
  if (semitoneOffset === 0) return { ...baseShape, chordType: customType || baseShape.chordType };

  const frets = baseShape.frets.map((f) => (f >= 0 ? f + semitoneOffset : -1));
  const positiveFrets = frets.filter((f) => f > 0);
  const minFret = positiveFrets.length > 0 ? Math.min(...positiveFrets) : 1;
  const baseFret = minFret > 4 ? minFret : 1;

  let barres: number[] | undefined = undefined;
  if (baseShape.barres && baseShape.barres.length > 0) {
    barres = baseShape.barres.map((b) => b + semitoneOffset);
  } else if (positiveFrets.filter((f) => f === minFret).length >= 2 && minFret > 0) {
    barres = [minFret];
  }

  return {
    frets,
    fingers: [...baseShape.fingers],
    baseFret,
    barres,
    chordType: customType || baseShape.chordType || "Movable Barre",
  };
}

/**
 * LAYER 2: ALGORITHMIC MUSIC THEORY GENERATOR
 * Handles complex extensions, power chords, m7b5, diminished, augmented, altered 7ths.
 */
function generateAlgorithmicChord(chordName: string): ChordPosition | null {
  const clean = chordName.trim();

  // Extract Root Note and Suffix
  const match = clean.match(/^([A-G][#b]?)(.*)$/i);
  if (!match) return null;

  const rawRoot = match[1].toUpperCase();
  const suffix = match[2].trim().toLowerCase();

  const semitone = ROOT_SEMITONES[rawRoot];
  if (semitone === undefined) return null;

  // Root frets calculation
  // Low E String (string 0): (semitone - 4 + 12) % 12
  // A String (string 1): (semitone - 9 + 12) % 12
  const fretE = (semitone - 4 + 12) % 12;
  const fretA = (semitone - 9 + 12) % 12;

  // 1. POWER CHORDS (5)
  if (suffix === "5") {
    if (fretE <= 7) {
      // E-shape Power Chord
      const r = fretE;
      return shiftBarrePosition(
        { frets: [r, r + 2, r + 2, -1, -1, -1], fingers: [1, 3, 4, 0, 0, 0], baseFret: r > 0 ? r : 1 },
        0,
        "Power Chord (5th)"
      );
    } else {
      // A-shape Power Chord
      const r = fretA;
      return shiftBarrePosition(
        { frets: [-1, r, r + 2, r + 2, -1, -1], fingers: [0, 1, 3, 4, 0, 0], baseFret: r > 0 ? r : 1 },
        0,
        "Power Chord (5th)"
      );
    }
  }

  // 2. HALF-DIMINISHED / MINOR 7 FLAT 5 (m7b5, ø)
  if (suffix === "m7b5" || suffix === "ø" || suffix === "m7-5" || suffix === "min7b5") {
    const r = fretA <= 0 ? fretA + 12 : fretA; // prefer string 5 (A string)
    return shiftBarrePosition(
      { frets: [-1, r, r + 1, r, r + 2, -1], fingers: [0, 1, 3, 2, 4, 0], baseFret: r },
      0,
      "Half-Diminished (m7b5)"
    );
  }

  // 3. DIMINISHED & DIMINISHED 7TH (dim, dim7, °)
  if (suffix === "dim" || suffix === "dim7" || suffix === "°" || suffix === "o7") {
    const r = fretA <= 0 ? fretA + 12 : fretA;
    return shiftBarrePosition(
      { frets: [-1, r, r + 1, r - 1, r + 1, -1], fingers: [0, 2, 3, 1, 4, 0], baseFret: r - 1 > 0 ? r - 1 : 1 },
      0,
      "Diminished 7th (Symmetrical)"
    );
  }

  // 4. AUGMENTED (aug, +, +5)
  if (suffix === "aug" || suffix === "+" || suffix === "aug5") {
    const r = fretA <= 0 ? fretA + 12 : fretA;
    return shiftBarrePosition(
      { frets: [-1, r, r - 1, r - 1, r - 1, -1], fingers: [0, 3, 1, 1, 1, 0], baseFret: r - 1 > 0 ? r - 1 : 1, barres: [r - 1] },
      0,
      "Augmented (#5)"
    );
  }

  // 5. ALTERED DOMINANT CHORDS (7#9, 7b9, 7#5, 7b5, #9, b9)
  if (suffix === "7#9" || suffix === "#9") {
    const r = fretA <= 0 ? fretA + 12 : fretA;
    return shiftBarrePosition(
      { frets: [-1, r, r - 1, r, r + 1, -1], fingers: [0, 2, 1, 3, 4, 0], baseFret: r - 1 > 0 ? r - 1 : 1 },
      0,
      "Altered Dominant 7#9 (Hendrix)"
    );
  }
  if (suffix === "7b9" || suffix === "b9") {
    const r = fretA <= 0 ? fretA + 12 : fretA;
    return shiftBarrePosition(
      { frets: [-1, r, r - 1, r, r - 1, -1], fingers: [0, 2, 1, 3, 1, 0], baseFret: r - 1 > 0 ? r - 1 : 1 },
      0,
      "Altered Dominant 7b9"
    );
  }

  // 6. EXTENDED CHORDS (9, 11, 13, maj9, m9, m11, 9th)
  if (suffix === "9" || suffix === "add9" || suffix === "9th") {
    const r = fretA <= 0 ? fretA + 12 : fretA;
    return shiftBarrePosition(
      { frets: [-1, r, r - 1, r, r, r], fingers: [0, 2, 1, 3, 3, 3], baseFret: r - 1 > 0 ? r - 1 : 1, barres: [r] },
      0,
      "Extended 9th Chord"
    );
  }
  if (suffix === "maj9") {
    const r = fretA <= 0 ? fretA + 12 : fretA;
    return shiftBarrePosition(
      { frets: [-1, r, r - 1, r + 1, r + 1, -1], fingers: [0, 1, 2, 3, 4, 0], baseFret: r - 1 > 0 ? r - 1 : 1 },
      0,
      "Extended Major 9th"
    );
  }
  if (suffix === "m9" || suffix === "min9") {
    const r = fretA <= 0 ? fretA + 12 : fretA;
    return shiftBarrePosition(
      { frets: [-1, r, r - 2, r, r - 2, -1], fingers: [0, 2, 1, 3, 1, 0], baseFret: r - 2 > 0 ? r - 2 : 1 },
      0,
      "Extended Minor 9th"
    );
  }
  if (suffix === "11" || suffix === "m11") {
    const r = fretE <= 0 ? fretE + 12 : fretE;
    return shiftBarrePosition(
      { frets: [r, r + 2, r, r + 2, r + 1, r], fingers: [1, 3, 1, 4, 2, 1], baseFret: r, barres: [r] },
      0,
      "Extended 11th Chord"
    );
  }
  if (suffix === "13") {
    const r = fretE <= 0 ? fretE + 12 : fretE;
    return shiftBarrePosition(
      { frets: [r, -1, r, r + 1, r + 2, r], fingers: [1, 0, 2, 3, 4, 1], baseFret: r, barres: [r] },
      0,
      "Extended 13th Chord"
    );
  }

  // 7. GENERIC MOVABLE BARRE GENERATOR (Minor vs Major vs 7th)
  const isMinor = suffix.includes("m") && !suffix.includes("maj");
  const is7th = suffix.includes("7");

  if (fretE <= 6) {
    // E-Shape Movable Barre
    const r = fretE;
    let frets = [r, r + 2, r + 2, r + 1, r, r];
    if (isMinor) frets = [r, r + 2, r + 2, r, r, r];
    if (is7th && !isMinor) frets = [r, r + 2, r, r + 1, r, r];
    if (is7th && isMinor) frets = [r, r + 2, r, r, r, r];

    return shiftBarrePosition(
      { frets, fingers: [1, 3, 4, 2, 1, 1], baseFret: r > 0 ? r : 1, barres: r > 0 ? [r] : undefined },
      0,
      isMinor ? "Algorithmic Minor Barre" : "Algorithmic Major Barre"
    );
  } else {
    // A-Shape Movable Barre
    const r = fretA;
    let frets = [-1, r, r + 2, r + 2, r + 2, r];
    if (isMinor) frets = [-1, r, r + 2, r + 2, r + 1, r];
    if (is7th && !isMinor) frets = [-1, r, r + 2, r, r + 2, r];
    if (is7th && isMinor) frets = [-1, r, r + 2, r, r + 1, r];

    return shiftBarrePosition(
      { frets, fingers: [0, 1, 3, 4, 2, 1], baseFret: r > 0 ? r : 1, barres: r > 0 ? [r] : undefined },
      0,
      isMinor ? "Algorithmic Minor Barre" : "Algorithmic Major Barre"
    );
  }
}

/**
 * Slash Chord Engine
 */
function handleSlashChord(mainChord: string, bassNote: string): ChordPosition | null {
  const basePos = getChordPosition(mainChord);
  if (!basePos) return null;

  const frets = [...basePos.frets];
  const fingers = [...basePos.fingers];

  const bassMapE: Record<string, number> = {
    'F': 1, 'F#': 2, 'GB': 2, 'G': 3, 'G#': 4, 'AB': 4, 'A': 5, 'A#': 6, 'BB': 6, 'B': 7, 'C': 8, 'C#': 9, 'DB': 9, 'D': 10, 'D#': 11, 'EB': 11, 'E': 0
  };
  const bassMapA: Record<string, number> = {
    'A#': 1, 'BB': 1, 'B': 2, 'C': 3, 'C#': 4, 'DB': 4, 'D': 5, 'D#': 6, 'EB': 6, 'E': 7, 'F': 8, 'F#': 9, 'GB': 9, 'G': 10, 'G#': 11, 'AB': 11, 'A': 0
  };

  const cleanBass = bassNote.toUpperCase();
  const bassE = bassMapE[cleanBass];
  const bassA = bassMapA[cleanBass];

  if (bassE !== undefined && bassE <= 5) {
    frets[0] = bassE;
    fingers[0] = bassE === 0 ? 0 : 1;
    return { ...basePos, frets, fingers, chordType: `Slash Chord (${mainChord}/${bassNote})` };
  } else if (bassA !== undefined && bassA <= 5) {
    frets[1] = bassA;
    fingers[1] = bassA === 0 ? 0 : 1;
    return { ...basePos, frets, fingers, chordType: `Slash Chord (${mainChord}/${bassNote})` };
  }

  return { ...basePos, chordType: `Slash Chord (${mainChord}/${bassNote})` };
}

/**
 * Primary Lookup Engine (Hybrid Layer 1 + Layer 2)
 */
export function getChordPosition(chordName: string): ChordPosition {
  if (!chordName || typeof chordName !== 'string') {
    return CHORD_DATABASE["C"];
  }

  const clean = chordName.trim();

  // LAYER 1: Direct match in database
  if (CHORD_DATABASE[clean]) {
    return CHORD_DATABASE[clean];
  }

  // Handle Slash Chords
  if (clean.includes('/')) {
    const [mainChord, bassNote] = clean.split('/').map((s) => s.trim());
    if (CHORD_DATABASE[clean]) {
      return CHORD_DATABASE[clean];
    }
    const slashRes = handleSlashChord(mainChord, bassNote);
    if (slashRes) return slashRes;
  }

  // LAYER 2: Algorithmic Music Theory Generator
  const algoRes = generateAlgorithmicChord(clean);
  if (algoRes) {
    return algoRes;
  }

  // Fallback
  return CHORD_DATABASE["C"];
}

export function getChordPositions(chordName: string): ChordPosition[] {
  const pos = getChordPosition(chordName);
  return [pos];
}
