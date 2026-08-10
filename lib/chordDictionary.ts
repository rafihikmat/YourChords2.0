// lib/chordDictionary.ts - Expanded Cyber-Zen Guitar & Piano Chord Engine
// Universal Music Theory Mapper for YourChords 2.0

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

// Chromatic semitone maps for roots & enharmonics
const ROOT_NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

const ENHARMONIC_MAP: Record<string, string> = {
  'DB': 'C#',
  'EB': 'D#',
  'FB': 'E',
  'E#': 'F',
  'GB': 'F#',
  'AB': 'G#',
  'BB': 'A#',
  'CB': 'B',
  'B#': 'C',
};

const NOTE_TO_SEMITONE: Record<string, number> = {
  'C': 0, 'C#': 1, 'DB': 1,
  'D': 2, 'D#': 3, 'EB': 3,
  'E': 4,
  'F': 5, 'F#': 6, 'GB': 6,
  'G': 7, 'G#': 8, 'AB': 8,
  'A': 9, 'A#': 10, 'BB': 10,
  'B': 11,
};

// Complete Interval Definitions for Piano (semitones relative to root)
const CHORD_INTERVALS: Record<string, number[]> = {
  // Major & Minor
  '': [0, 4, 7],
  'maj': [0, 4, 7],
  'major': [0, 4, 7],
  'm': [0, 3, 7],
  'min': [0, 3, 7],
  'minor': [0, 3, 7],

  // 7th Chords
  '7': [0, 4, 7, 10],
  'dom7': [0, 4, 7, 10],
  'maj7': [0, 4, 7, 11],
  'm7': [0, 3, 7, 10],
  'min7': [0, 3, 7, 10],

  // Suspended
  'sus2': [0, 2, 7],
  'sus4': [0, 5, 7],
  '7sus4': [0, 5, 7, 10],

  // Diminished & Augmented
  'dim': [0, 3, 6],
  'dim7': [0, 3, 6, 9],
  '°': [0, 3, 6, 9],
  'aug': [0, 4, 8],
  '+': [0, 4, 8],

  // Extended & Added
  'add9': [0, 4, 7, 14],
  'madd9': [0, 3, 7, 14],
  '9': [0, 4, 7, 10, 14],
  'm9': [0, 3, 7, 10, 14],
  'min9': [0, 3, 7, 10, 14],
  'maj9': [0, 4, 7, 11, 14],
  '11': [0, 4, 7, 10, 14, 17],
  'm11': [0, 3, 7, 10, 14, 17],
  '13': [0, 4, 7, 10, 14, 21],
  'maj13': [0, 4, 7, 11, 14, 21],

  // Special / Altered
  '5': [0, 7, 12],
  'm7b5': [0, 3, 6, 10],
  'ø': [0, 3, 6, 10],
  '7#9': [0, 4, 7, 10, 15],
  '7b9': [0, 4, 7, 10, 13],
  '6': [0, 4, 7, 9],
  'm6': [0, 3, 7, 9],
};

/**
 * Normalizes BarreInfo array from raw number[] or BarreInfo[]
 */
export function normalizeBarres(pos: ChordPosition): BarreInfo[] | undefined {
  if (pos.barres && pos.barres.length > 0) {
    if (typeof pos.barres[0] === 'number') {
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
 * Helper to normalize chord names (Handling flats like Db -> C#, slash chords, and whitespaces)
 */
export function normalizeChordName(rawName: string): { root: string; suffix: string; bass?: string; normalizedFullName: string } {
  if (!rawName || typeof rawName !== 'string') {
    return { root: 'C', suffix: '', normalizedFullName: 'C' };
  }

  const clean = rawName.trim();
  let mainPart = clean;
  let bassPart: string | undefined = undefined;

  // Handle Slash Chords (e.g. Cadd9/E)
  if (clean.includes('/')) {
    const parts = clean.split('/');
    mainPart = parts[0].trim();
    bassPart = parts[1]?.trim();
  }

  const match = mainPart.match(/^([A-G][#b]?)(.*)$/i);
  if (!match) {
    return { root: 'C', suffix: '', bass: bassPart, normalizedFullName: clean || 'C' };
  }

  let root = match[1].toUpperCase();
  const suffix = match[2].trim();

  // Convert enharmonic flats to sharps if needed
  if (ENHARMONIC_MAP[root]) {
    root = ENHARMONIC_MAP[root];
  }

  let normalizedFullName = `${root}${suffix}`;
  if (bassPart) {
    let normalizedBass = bassPart.toUpperCase();
    if (ENHARMONIC_MAP[normalizedBass]) {
      normalizedBass = ENHARMONIC_MAP[normalizedBass];
    }
    normalizedFullName += `/${normalizedBass}`;
  }

  return { root, suffix, bass: bassPart, normalizedFullName };
}

/**
 * Get guitar chord positions for a given chord name
 */
export function getGuitarChordData(chordName: string): GuitarChordData[] {
  const { normalizedFullName, root, suffix } = normalizeChordName(chordName);
  
  let rawPositions = getChordPositions(normalizedFullName);

  // If initial lookup returns empty or default fallback, try looking up main root+suffix
  if ((!rawPositions || rawPositions.length === 0) && suffix) {
    rawPositions = getChordPositions(`${root}${suffix}`);
  }

  // Fallback to base root if needed
  if (!rawPositions || rawPositions.length === 0) {
    rawPositions = getChordPositions(root);
  }

  return rawPositions.map((pos) => ({
    frets: pos.frets,
    fingers: pos.fingers,
    baseFret: pos.baseFret || 1,
    barres: normalizeBarres(pos),
    chordType: pos.chordType || `${root}${suffix ? ' ' + suffix : ' Major'}`
  }));
}

/**
 * Get piano chord keys for a given chord name dynamically
 */
export function getPianoChordData(chordName: string): PianoChordData {
  const { root, suffix, normalizedFullName } = normalizeChordName(chordName);

  let semitone = NOTE_TO_SEMITONE[root];
  if (semitone === undefined) semitone = 0;

  // Starting octave offset to fit nicely within 24 keys (0..23)
  let startOffset = semitone;
  if (startOffset > 7) {
    startOffset = semitone;
  }

  const cleanSuffixKey = suffix.toLowerCase();
  const intervals = CHORD_INTERVALS[cleanSuffixKey] || CHORD_INTERVALS[''] || [0, 4, 7];

  const keys = intervals.map(inv => {
    let k = startOffset + inv;
    while (k >= 24) k -= 12;
    while (k < 0) k += 12;
    return k;
  }).sort((a, b) => a - b);

  const keyNames = keys.map(k => ROOT_NOTES[k % 12]);

  return {
    keys,
    rootNote: root,
    chordType: `${root}${suffix ? ' ' + suffix : ' Major'}`,
    keyNames
  };
}

/**
 * Unified Chord Data Getter with Safe Fallback Parser
 */
export function getUnifiedChordData(chordName: string): UnifiedChordData {
  const targetName = chordName ? chordName.trim() : "C";
  const guitarData = getGuitarChordData(targetName);
  const pianoData = getPianoChordData(targetName);

  return {
    name: targetName,
    guitar: guitarData.length > 0 ? guitarData : [
      { frets: [-1, 3, 2, 0, 1, 0], fingers: [0, 3, 2, 0, 1, 0], baseFret: 1, chordType: "Standard Major" }
    ],
    piano: pianoData
  };
}
