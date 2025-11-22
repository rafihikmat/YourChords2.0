
// --- Merged Logic: Integrated ChordAdapter & External DB ---
export const NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

// --- Shared Helpers ---
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

// --- Chord Data Store (Internal + External Merged) ---
// Format: [E, A, D, G, B, e] (-1=mute, 0=open, 1+=fret)
const INTERNAL_DB: Record<string, number[]> = {
  'C': [-1,3,2,0,1,0], 'D': [-1,-1,0,2,3,2], 'E': [0,2,2,1,0,0], 'F': [1,3,3,2,1,1], 'G': [3,2,0,0,0,3], 'A': [-1,0,2,2,2,0], 'B': [-1,2,4,4,4,2],
  'Cm': [-1,3,5,5,4,3], 'Dm': [-1,-1,0,2,3,1], 'Em': [0,2,2,0,0,0], 'Fm': [1,3,3,1,1,1], 'Gm': [3,5,5,3,3,3], 'Am': [-1,0,2,2,1,0], 'Bm': [-1,2,4,4,3,2],
  'C7': [-1,3,2,3,1,0], 'D7': [-1,-1,0,2,1,2], 'E7': [0,2,0,1,0,0], 'F7': [1,3,1,2,1,1], 'G7': [3,2,0,0,0,1], 'A7': [-1,0,2,0,2,0], 'B7': [-1,2,1,2,0,2],
  'Cmaj7': [-1,3,2,0,0,0], 'Dmaj7': [-1,-1,0,2,2,2], 'Emaj7': [0,2,1,1,0,0], 'Fmaj7': [-1,3,3,2,1,0], 'Gmaj7': [3,2,0,0,0,2], 'Amaj7': [-1,0,2,1,2,0],
  'Am7': [-1,0,2,0,1,0], 'Bm7': [-1,2,0,2,0,2], 'Em7': [0,2,2,0,3,0], 'Dm7': [-1,-1,0,2,1,1],
  'Dsus4': [-1,-1,0,2,3,3], 'Asus4': [-1,0,2,2,3,0], 'Esus4': [0,2,2,2,0,0], 'Gsus4': [3,2,0,0,1,3], 'Csus4': [-1,3,3,0,1,1]
};

const EXTERNAL_DB_RAW: Record<string, Record<string, {frets: string}[]>> = {
  'C': { 'major': [{frets:'x32010'}], 'minor': [{frets:'x35543'}], '7': [{frets:'x32310'}], 'maj7': [{frets:'x32000'}], 'm7': [{frets:'x3134x'}], 'add9': [{frets:'x32030'}] },
  'D': { 'major': [{frets:'xx0232'}], 'minor': [{frets:'xx0231'}], '7': [{frets:'xx0212'}], 'maj7': [{frets:'xx0222'}], 'm7': [{frets:'xx0211'}], 'sus4': [{frets:'xx0233'}] },
  'E': { 'major': [{frets:'022100'}], 'minor': [{frets:'022000'}], '7': [{frets:'020100'}], 'maj7': [{frets:'021100'}], 'm7': [{frets:'022030'}] },
  'F': { 'major': [{frets:'133211'}], 'minor': [{frets:'133111'}], '7': [{frets:'131211'}], 'maj7': [{frets:'132211'}], 'm7': [{frets:'131111'}] },
  'G': { 'major': [{frets:'320003'}], 'minor': [{frets:'355333'}], '7': [{frets:'320001'}], 'maj7': [{frets:'320002'}], 'm7': [{frets:'353333'}], 'sus4': [{frets:'330013'}] },
  'A': { 'major': [{frets:'x02220'}], 'minor': [{frets:'x02210'}], '7': [{frets:'x02020'}], 'maj7': [{frets:'x02120'}], 'm7': [{frets:'x02010'}], 'sus2': [{frets:'x02200'}] },
  'B': { 'major': [{frets:'x24442'}], 'minor': [{frets:'x24432'}], '7': [{frets:'x21202'}], 'maj7': [{frets:'x24342'}], 'm7': [{frets:'x20202'}] }
};

const SUFFIX_MAP: Record<string, string> = {
  '': 'major', 'm': 'minor', 'min': 'minor', 'maj': 'major', 'dim': 'dim', 'aug': 'aug',
  '7': '7', 'm7': 'm7', 'maj7': 'maj7', '9': '9', 'm9': 'm9', 'sus4': 'sus4', 'sus2': 'sus2'
};

// --- Helper: Convert Hex String to Fret Array ---
const convertFrets = (hex: string): number[] => hex.split('').map(c => c.toLowerCase() === 'x' ? -1 : parseInt(c, 16));

// --- Main Lookup Function ---
export const getChordFingering = (name: string): number[] | null => {
  if (!name || typeof name !== 'string') return null;
  
  // 1. Internal Fast Lookup
  if (INTERNAL_DB[name]) return INTERNAL_DB[name];

  // 2. External DB Adapter Lookup
  const match = name.match(/^([A-G][#b]?)(.*)$/);
  if (match) {
    const [_, root, suffixRaw] = match;
    const mappedSuffix = SUFFIX_MAP[suffixRaw] || suffixRaw;
    const rootData = EXTERNAL_DB_RAW[root];
    
    if (rootData && rootData[mappedSuffix]?.[0]) {
      return convertFrets(rootData[mappedSuffix][0].frets);
    }
    
    // 3. Heuristics / Fallbacks
    if (suffixRaw.includes('maj7')) return INTERNAL_DB[root + 'maj7'] || INTERNAL_DB[root];
    if (suffixRaw.includes('m7')) return INTERNAL_DB[root + 'm7'] || INTERNAL_DB[root + 'm'];
    if (suffixRaw.includes('sus')) return INTERNAL_DB[root + 'sus4'];
    return INTERNAL_DB[root] || null;
  }
  return null;
};

export const CHORD_FAMILIES: Record<string, string[]> = {
  'Major': ['C', 'D', 'E', 'F', 'G', 'A', 'B'],
  'Minor': ['Cm', 'Dm', 'Em', 'Fm', 'Gm', 'Am', 'Bm'],
  '7th': ['C7', 'D7', 'E7', 'F7', 'G7', 'A7', 'B7'],
  'Maj7': ['Cmaj7', 'Dmaj7', 'Emaj7', 'Fmaj7', 'Gmaj7', 'Amaj7', 'Bmaj7'],
  'Min7': ['Cm7', 'Dm7', 'Em7', 'Fm7', 'Gm7', 'Am7', 'Bm7'],
  'Sus': ['Csus4', 'Gsus4', 'Asus4', 'Dsus4', 'Esus4'],
  'Dim/Aug': ['Cdim', 'Caug', 'Ddim', 'Daug'],
  'Add9': ['Cadd9', 'Gadd9', 'Aadd9', 'Dadd9']
};
