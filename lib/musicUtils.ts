
export const NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

export const transposeChord = (chord: string, semitones: number): string => {
  if (!chord || chord.trim() === '') return chord;

  // Regex to separate Root, Quality/Extension, and Bass
  const match = chord.match(/^([A-G][#b]?)(.*?)(\/([A-G][#b]?))?$/);
  if (!match) return chord;

  let root = match[1];
  const quality = match[2] || '';
  let bass = match[4];

  // Normalize flats to sharps for simpler math
  const flatMap: Record<string, string> = { 'Db': 'C#', 'Eb': 'D#', 'Gb': 'F#', 'Ab': 'G#', 'Bb': 'A#' };
  if (flatMap[root]) root = flatMap[root];
  if (bass && flatMap[bass]) bass = flatMap[bass];

  const shiftNote = (n: string, steps: number) => {
    const idx = NOTES.indexOf(n);
    if (idx === -1) return n;
    let newIdx = (idx + steps) % 12;
    if (newIdx < 0) newIdx += 12;
    return NOTES[newIdx];
  };

  let newChord = shiftNote(root, semitones) + quality;
  if (bass) {
    newChord += '/' + shiftNote(bass, semitones);
  }

  return newChord;
};

// Format: [E, A, D, G, B, e] strings. -1 = mute, 0 = open, 1+ = fret
export const CHORD_DATA: Record<string, number[]> = {
  // Major
  'C': [-1, 3, 2, 0, 1, 0],
  'D': [-1, -1, 0, 2, 3, 2],
  'E': [0, 2, 2, 1, 0, 0],
  'F': [1, 3, 3, 2, 1, 1],
  'G': [3, 2, 0, 0, 0, 3],
  'A': [-1, 0, 2, 2, 2, 0],
  'B': [-1, 2, 4, 4, 4, 2],
  
  // Minor
  'Cm': [-1, 3, 5, 5, 4, 3],
  'Dm': [-1, -1, 0, 2, 3, 1],
  'Em': [0, 2, 2, 0, 0, 0],
  'Fm': [1, 3, 3, 1, 1, 1],
  'Gm': [3, 5, 5, 3, 3, 3],
  'Am': [-1, 0, 2, 2, 1, 0],
  'Bm': [-1, 2, 4, 4, 3, 2],

  // Sharps/Flats Major
  'C#': [-1, 4, 6, 6, 6, 4], 'Db': [-1, 4, 6, 6, 6, 4],
  'D#': [-1, 6, 8, 8, 8, 6], 'Eb': [-1, 6, 8, 8, 8, 6],
  'F#': [2, 4, 4, 3, 2, 2], 'Gb': [2, 4, 4, 3, 2, 2],
  'G#': [4, 6, 6, 5, 4, 4], 'Ab': [4, 6, 6, 5, 4, 4],
  'A#': [-1, 1, 3, 3, 3, 1], 'Bb': [-1, 1, 3, 3, 3, 1],

  // Sharps/Flats Minor
  'C#m': [-1, 4, 6, 6, 5, 4], 'Dbm': [-1, 4, 6, 6, 5, 4],
  'D#m': [-1, 6, 8, 8, 7, 6], 'Ebm': [-1, 6, 8, 8, 7, 6],
  'F#m': [2, 4, 4, 2, 2, 2], 'Gbm': [2, 4, 4, 2, 2, 2],
  'G#m': [4, 6, 6, 4, 4, 4], 'Abm': [4, 6, 6, 4, 4, 4],
  'A#m': [-1, 1, 3, 3, 2, 1], 'Bbm': [-1, 1, 3, 3, 2, 1],

  // 7ths
  'C7': [-1, 3, 2, 3, 1, 0],
  'D7': [-1, -1, 0, 2, 1, 2],
  'E7': [0, 2, 0, 1, 0, 0],
  'G7': [3, 2, 0, 0, 0, 1],
  'A7': [-1, 0, 2, 0, 2, 0],
  'B7': [-1, 2, 1, 2, 0, 2],

  // Major 7ths
  'Cmaj7': [-1, 3, 2, 0, 0, 0],
  'Dmaj7': [-1, -1, 0, 2, 2, 2],
  'Emaj7': [0, 2, 1, 1, 0, 0],
  'Fmaj7': [-1, 3, 3, 2, 1, 0],
  'Gmaj7': [3, 2, 0, 0, 0, 2],
  'Amaj7': [-1, 0, 2, 1, 2, 0],

  // Minor 7ths
  'Am7': [-1, 0, 2, 0, 1, 0],
  'Bm7': [-1, 2, 0, 2, 0, 2],
  'Cm7': [-1, 3, 5, 3, 4, 3],
  'Dm7': [-1, -1, 0, 2, 1, 1],
  'Em7': [0, 2, 2, 0, 3, 0],
  'Fm7': [1, 3, 1, 1, 1, 1],
  'Gm7': [3, 5, 3, 3, 3, 3],

  // Suspended
  'Dsus4': [-1, -1, 0, 2, 3, 3],
  'Asus4': [-1, 0, 2, 2, 3, 0],
  'Esus4': [0, 2, 2, 2, 0, 0],
  'Gsus4': [3, 2, 0, 0, 1, 3],
  'Csus4': [-1, 3, 3, 0, 1, 1],

  // Add9
  'Cadd9': [-1, 3, 2, 0, 3, 0],
  'Gadd9': [3, 2, 0, 2, 0, 3],
  'Aadd9': [-1, 0, 2, 4, 2, 0],
};

export const getChordFingering = (name: string) => {
    // Basic lookup
    if (CHORD_DATA[name]) return CHORD_DATA[name];
    
    // Try basic substitutions if exact match not found
    // e.g. if F#m7 not found, try F#m
    const match = name.match(/^([A-G][#b]?)(.*)$/);
    if (match) {
        const root = match[1];
        const quality = match[2];
        
        // If it's a complex chord, fallback to simpler version for diagram
        if (quality.includes('maj7')) return CHORD_DATA[root + 'maj7'] || CHORD_DATA[root];
        if (quality.includes('m7')) return CHORD_DATA[root + 'm7'] || CHORD_DATA[root + 'm'];
        if (quality.includes('m')) return CHORD_DATA[root + 'm'];
        if (quality.includes('7')) return CHORD_DATA[root + '7'] || CHORD_DATA[root];
        
        return CHORD_DATA[root];
    }
    return null;
};
