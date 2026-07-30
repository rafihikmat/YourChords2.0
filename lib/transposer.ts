const NOTES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
const FLATS = ["C", "Db", "D", "Eb", "E", "F", "Gb", "G", "Ab", "A", "Bb", "B"];

// Comprehensive Chord RegEx with lookbehind/lookahead to correctly handle sharps (#) and slash (/) chords
export const CHORD_REGEX = /(?<![a-zA-Z0-9_#])([A-G][#b]?(?:m|maj|min|dim|aug|sus|add|7|9|11|13|b5|#5|b9|#9)*(?:\/[A-G][#b]?)?)(?![a-zA-Z0-9_#])/g;

export const SINGLE_CHORD_REGEX = /^([A-G][#b]?(?:m|maj|min|dim|aug|sus|add|7|9|11|13|b5|#5|b9|#9)*(?:\/[A-G][#b]?)?)$/;

function getNoteIndex(note: string): number {
  let idx = NOTES.indexOf(note);
  if (idx === -1) idx = FLATS.indexOf(note);
  return idx;
}

export function transposeChord(chord: string, steps: number): string {
  // Regex to extract Root Note (e.g. C#, B, Eb, F#) and the Suffix (e.g. m7, maj9, /F#)
  const regex = /^([A-G][#b]?)(.*)$/;
  const match = chord.match(regex);
  if (!match) return chord; // Not a standard chord

  const root = match[1];
  let suffix = match[2];

  // Process Bass note if it's a slash chord (e.g. C/E -> E is bass, D/F# -> F# is bass)
  if (suffix.includes('/')) {
    const parts = suffix.split('/');
    if (parts.length === 2 && parts[1]) {
      const bassTransposed = transposeChordLine(parts[1], steps); // recursive for bass note
      suffix = parts[0] + '/' + bassTransposed;
    }
  }

  const idx = getNoteIndex(root);
  if (idx === -1) return chord; // Not a valid note

  // Is it a flat? Keep flat format if original was flat
  const isFlat = root.includes("b");

  let newIdx = (idx + steps) % 12;
  if (newIdx < 0) newIdx += 12;

  const newRoot = isFlat ? FLATS[newIdx] : NOTES[newIdx];
  return newRoot + suffix;
}

export function transposeChordLine(line: string, steps: number): string {
  if (steps === 0) return line;
  
  return line.replace(CHORD_REGEX, (match) => {
    return transposeChord(match, steps);
  });
}

/**
 * Simplifies complex chord (e.g., Cmaj7 -> C, F#m7 -> F#m, Bsus4 -> B, A/C# -> A)
 * Rules:
 * 1. Remove slash bass note: A/C# -> A, G/B -> G, D/F# -> D, F/A -> F
 * 2. Convert 7th, maj7, Extended (9, 11, 13, add9), Suspended (sus2, sus4), Dim/Aug to Basic Major/Minor
 *    - Cmaj7 / C7 / Csus4 / Csus2 / Cadd9 -> C
 *    - Am7 / Am9 / Asus4 -> Am
 *    - F#m7 / F#m7b5 -> F#m
 *    - Bm7 -> Bm
 *    - Fdim7 / Faug -> F
 * 3. Preserve basic Major and Minor chords (C, Dm, Em, F, G, Am, B, F#m, etc.)
 */
export function simplifyChord(chord: string): string {
  if (!chord) return chord;
  const match = chord.match(/^([A-G][#b]?)(.*)$/);
  if (!match) return chord;

  const root = match[1];
  let rest = match[2];

  // 1. Remove slash bass note for simplified view
  if (rest.includes('/')) {
    rest = rest.split('/')[0];
  }

  // 2. Detect minor quality (starts with 'm' but NOT 'maj', or 'min')
  const isMinor = /^(m(?!aj)|min)/i.test(rest);

  return isMinor ? `${root}m` : root;
}

/**
 * Runs regex on a chord text line to simplify all complex chords for beginners.
 */
export function simplifyChordLine(line: string): string {
  return line.replace(CHORD_REGEX, (match) => {
    return simplifyChord(match);
  });
}

/**
 * Calculates semitone transpose offset when using a Capo.
 * Capo on fret X raises pitch by X semitones.
 * To play with Capo X and match original pitch, chord shapes are transposed by -X semitones.
 */
export function calculateCapoTranspose(originalKey: string, targetCapoFret: number): number {
  if (!targetCapoFret || targetCapoFret <= 0) return 0;
  return -Math.abs(targetCapoFret);
}

/**
 * Checks if a line is likely a chord line to avoid transposing lyrics.
 */
export function isChordLine(line: string): boolean {
  const trimmed = line.trim();
  if (trimmed.length === 0) return false;
  
  const words = trimmed.split(/\s+/);
  let chordCount = 0;
  
  for (const word of words) {
    const cleanWord = word.replace(/^[\[\(\{]+|[\]\)\}]+$/g, '');
    if (SINGLE_CHORD_REGEX.test(cleanWord)) {
      chordCount++;
    }
  }
  
  return chordCount / words.length >= 0.3;
}
