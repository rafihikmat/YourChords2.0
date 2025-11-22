
import { ChordAdapter } from './chordService';

export const NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

export const normalizeChordName = (input: string): string => {
  if (!input || typeof input !== 'string') return "";
  let normalized = input.trim().charAt(0).toUpperCase() + input.trim().slice(1);
  return normalized
    .replace(/min$/, 'm').replace(/minor$/, 'm')
    .replace(/maj$/, 'maj7').replace(/major$/, '')
    .replace(/sus$/, 'sus4');
};

export const transposeChord = (chord: string, semitones: number): string => {
  if (!chord || typeof chord !== 'string' || !chord.trim()) return chord;
  const match = chord.match(/^([A-G][#b]?)(.*?)(\/([A-G][#b]?))?$/);
  if (!match) return chord;

  let [_, root, quality, __, bass] = match;
  
  const flatMap: Record<string, string> = { 'Db': 'C#', 'Eb': 'D#', 'Gb': 'F#', 'Ab': 'G#', 'Bb': 'A#' };
  root = flatMap[root] || root;
  if (bass) bass = flatMap[bass] || bass;

  const shift = (n: string) => {
    const idx = NOTES.indexOf(n);
    return idx === -1 ? n : NOTES[(idx + semitones + 120) % 12]; // +120 handles negative semitones safely
  };

  return `${shift(root)}${quality}${bass ? '/' + shift(bass) : ''}`;
};

export const parseChordsFromText = (text: string) => {
  if (!text || typeof text !== 'string') return [];
  const chordRegex = /\b[A-G][#b]?(m|maj|dim|aug|sus|add|7|9|11|13|6)*(\/[A-G][#b]?)?\b/g;
  return text.split('\n').map(line => {
    const trimmed = line.trimEnd();
    if (!trimmed) return { line: "", chords: [] };
    if (trimmed.startsWith('[') && trimmed.endsWith(']')) return { line: trimmed, chords: [] };
    return { line: trimmed, chords: trimmed.match(chordRegex) || [] };
  });
};

export const getChordFingering = (name: string): number[] | null => {
  return ChordAdapter.getExternalChord(name);
};

// Expanded Chord Families for Manual Entry Editor
export const CHORD_FAMILIES: Record<string, string[]> = {
  'Major': ['C', 'D', 'E', 'F', 'G', 'A', 'B', 'C#', 'Eb', 'F#', 'Ab', 'Bb'],
  'Minor': ['Cm', 'Dm', 'Em', 'Fm', 'Gm', 'Am', 'Bm', 'C#m', 'Ebm', 'F#m', 'G#m', 'Bbm'],
  '7th': ['C7', 'D7', 'E7', 'F7', 'G7', 'A7', 'B7', 'B7', 'C#7', 'F#7'],
  'Maj7': ['Cmaj7', 'Dmaj7', 'Emaj7', 'Fmaj7', 'Gmaj7', 'Amaj7', 'Bmaj7'],
  'Min7': ['Cm7', 'Dm7', 'Em7', 'Fm7', 'Gm7', 'Am7', 'Bm7'],
  'Sus2': ['Csus2', 'Dsus2', 'Esus2', 'Fsus2', 'Gsus2', 'Asus2', 'Bsus2'],
  'Sus4': ['Csus4', 'Dsus4', 'Esus4', 'Fsus4', 'Gsus4', 'Asus4', 'Bsus4'],
  'Add9': ['Cadd9', 'Dadd9', 'Eadd9', 'Fadd9', 'Gadd9', 'Aadd9', 'Badd9'],
  'Dim': ['Cdim', 'Ddim', 'Edim', 'Fdim', 'Gdim', 'Adim', 'Bdim'],
  'Aug': ['Caug', 'Daug', 'Eaug', 'Faug', 'Gaug', 'Aaug', 'Baug'],
  'Slash': ['D/F#', 'G/B', 'C/G', 'Am/G', 'F/C', 'E/G#'],
  'Power': ['C5', 'D5', 'E5', 'F5', 'G5', 'A5', 'B5']
};
