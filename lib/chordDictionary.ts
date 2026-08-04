// lib/chordDictionary.ts - Unified Guitar & Piano Chord Dictionary for YourChords 2.0
// Cyber-Zen Engine mapping guitar frets/fingers/barres & piano key semitones.

import { getChordPositions, ChordPosition } from "./chordDb";

export interface BarreInfo {
  fret: number;
  startString: number; // 6 = Low E, 1 = High E
  endString: number;   // 1 = High E, 6 = Low E
}

export interface GuitarChordData {
  frets: number[];       // 6 strings from Low E (0) to High E (5). -1 = Mute (X), 0 = Open (O)
  fingers: number[];     // 0 = none, 1 = index, 2 = middle, 3 = ring, 4 = pinky
  baseFret: number;      // starting fret (usually 1)
  barres?: BarreInfo[];
  chordType?: string;
}

export interface PianoChordData {
  keys: number[];        // pressed key indices on 24-key piano (0-23, C=0, C#=1, D=2...)
  rootNote?: string;
  chordType?: string;
  keyNames?: string[];   // Note names for active keys
}

export interface UnifiedChordData {
  name: string;
  guitar: GuitarChordData[];
  piano: PianoChordData;
}

// Semitone map for roots
const ROOT_NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

const NOTE_TO_SEMITONE: Record<string, number> = {
  'C': 0, 'C#': 1, 'DB': 1,
  'D': 2, 'D#': 3, 'EB': 3,
  'E': 4,
  'F': 5, 'F#': 6, 'GB': 6,
  'G': 7, 'G#': 8, 'AB': 8,
  'A': 9, 'A#': 10, 'BB': 10,
  'B': 11,
};

// Interval definitions (semitones relative to root)
const CHORD_INTERVALS: Record<string, number[]> = {
  // Basic Major & Minor
  '': [0, 4, 7],
  'maj': [0, 4, 7],
  'm': [0, 3, 7],
  'min': [0, 3, 7],

  // 7th chords
  '7': [0, 4, 7, 10],
  'maj7': [0, 4, 7, 11],
  'm7': [0, 3, 7, 10],
  'min7': [0, 3, 7, 10],

  // Suspended
  'sus2': [0, 2, 7],
  'sus4': [0, 5, 7],

  // Diminished & Augmented
  'dim': [0, 3, 6],
  'dim7': [0, 3, 6, 9],
  'aug': [0, 4, 8],

  // Extended / Added
  'add9': [0, 4, 7, 14],
  '9': [0, 4, 7, 10, 14],
  'm9': [0, 3, 7, 10, 14],
  'maj9': [0, 4, 7, 11, 14],
  '5': [0, 7, 12],
  'm7b5': [0, 3, 6, 10],
};

/**
 * Normalizes BarreInfo array from raw number[] or BarreInfo[]
 */
export function normalizeBarres(pos: ChordPosition): BarreInfo[] | undefined {
  if (pos.barres && pos.barres.length > 0) {
    if (typeof pos.barres[0] === 'number') {
      // Raw fret number, convert to full string 6 to 1 barre
      return (pos.barres as unknown as number[]).map(fret => ({
        fret,
        startString: 6,
        endString: 1
      }));
    } else {
      return pos.barres as unknown as BarreInfo[];
    }
  }

  // Auto-detect barre if 2 or more non-open frets equal baseFret and baseFret > 1
  if (pos.baseFret && pos.baseFret > 1) {
    const minFret = pos.baseFret;
    const fretsWithMin = pos.frets
      .map((f, idx) => ({ stringNum: 6 - idx, fret: f }))
      .filter(item => item.fret === minFret);

    if (fretsWithMin.length >= 2) {
      const maxString = Math.max(...fretsWithMin.map(i => i.stringNum));
      const minString = Math.min(...fretsWithMin.map(i => i.stringNum));
      return [{
        fret: minFret,
        startString: maxString,
        endString: minString
      }];
    }
  }

  return undefined;
}

/**
 * Get guitar chord positions for a given chord name
 */
export function getGuitarChordData(chordName: string): GuitarChordData[] {
  const rawPositions = getChordPositions(chordName);

  return rawPositions.map((pos) => ({
    frets: pos.frets,
    fingers: pos.fingers,
    baseFret: pos.baseFret || 1,
    barres: normalizeBarres(pos),
    chordType: pos.chordType || "Standard Chord"
  }));
}

/**
 * Get piano chord keys for a given chord name dynamically
 */
export function getPianoChordData(chordName: string): PianoChordData {
  if (!chordName || typeof chordName !== 'string') {
    return { keys: [0, 4, 7], rootNote: 'C', chordType: 'C Major', keyNames: ['C', 'E', 'G'] };
  }

  const clean = chordName.trim();
  const match = clean.match(/^([A-G][#b]?)(.*)$/i);

  if (!match) {
    return { keys: [0, 4, 7], rootNote: 'C', chordType: 'C Major', keyNames: ['C', 'E', 'G'] };
  }

  const rootNote = match[1].toUpperCase();
  const rawSuffix = match[2].trim().toLowerCase();

  // Strip slash if present (e.g. C/E -> C)
  const suffix = rawSuffix.split('/')[0].trim();

  let semitone = NOTE_TO_SEMITONE[rootNote];
  if (semitone === undefined) semitone = 0;

  // Choose starting octave offset so keys fit nicely in 24 keys (0..23)
  // If root >= 7 (G, G#, A, A#, B), offset can be 0 or 5 to keep keys <= 23
  let startOffset = semitone;
  if (startOffset > 7) {
    // Bring octave down slightly if needed
    startOffset = semitone;
  }

  const intervals = CHORD_INTERVALS[suffix] || CHORD_INTERVALS[''] || [0, 4, 7];

  const keys = intervals.map(inv => {
    let k = startOffset + inv;
    // Keep within 24-key piano (0..23)
    while (k >= 24) k -= 12;
    while (k < 0) k += 12;
    return k;
  }).sort((a, b) => a - b);

  const keyNames = keys.map(k => ROOT_NOTES[k % 12]);

  return {
    keys,
    rootNote,
    chordType: `${rootNote}${suffix ? ' ' + suffix : ' Major'}`,
    keyNames
  };
}

/**
 * Get full unified chord data
 */
export function getUnifiedChordData(chordName: string): UnifiedChordData {
  const cleanName = chordName ? chordName.trim() : "C";
  return {
    name: cleanName,
    guitar: getGuitarChordData(cleanName),
    piano: getPianoChordData(cleanName)
  };
}
