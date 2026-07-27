const NOTES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
const FLATS = ["C", "Db", "D", "Eb", "E", "F", "Gb", "G", "Ab", "A", "Bb", "B"];

function getNoteIndex(note: string): number {
  let idx = NOTES.indexOf(note);
  if (idx === -1) idx = FLATS.indexOf(note);
  return idx;
}

export function transposeChord(chord: string, steps: number): string {
  // Regex to extract Root Note (e.g. C#, B, Eb) and the Suffix (e.g. m7, maj9, /F#)
  const regex = /^([A-G][#b]?)(.*)$/;
  const match = chord.match(regex);
  if (!match) return chord; // Not a standard chord

  const root = match[1];
  let suffix = match[2];

  // Process Bass note if it's a slash chord (e.g. C/E -> E is bass)
  if (suffix.includes('/')) {
    const parts = suffix.split('/');
    if (parts.length === 2 && getNoteIndex(parts[1]) !== -1) {
      const bassTransposed = transposeChordLine(parts[1], steps); // recursive but just for single note
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
  
  // A robust Regex to catch valid musical chords
  const chordRegex = /\b([A-G][#b]?(?:m|maj|dim|aug|sus|add)?[0-9]*(?:\/[A-G][#b]?)?)\b/g;
  
  return line.replace(chordRegex, (match) => {
    return transposeChord(match, steps);
  });
}

/**
 * Simplifies complex chord (e.g., Cmaj7 -> C, F#m7 -> F#m, Bsus4 -> B)
 */
export function simplifyChord(chord: string): string {
  if (!chord) return chord;
  const match = chord.match(/^([A-G][#b]?)(.*)$/);
  if (!match) return chord;

  const root = match[1];
  let rest = match[2];

  // Remove slash bass note for simplified view
  if (rest.includes('/')) {
    rest = rest.split('/')[0];
  }

  // Detect minor quality (m, min, m7, m9 but NOT maj)
  const isMinor = /m(?!aj)/i.test(rest) || /^min/i.test(rest);

  return isMinor ? `${root}m` : root;
}

/**
 * Runs regex on a chord text line to simplify all complex chords for beginners.
 */
export function simplifyChordLine(line: string): string {
  const chordRegex = /\b([A-G][#b]?(?:m|maj|dim|aug|sus|add)?[0-9]*(?:\/[A-G][#b]?)?)\b/g;
  return line.replace(chordRegex, (match) => {
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
  const chordRegex = /^([A-G][#b]?(?:m|maj|dim|aug|sus|add)?[0-9]*(?:\/[A-G][#b]?)?)$/;
  
  for (const word of words) {
    if (chordRegex.test(word)) {
      chordCount++;
    }
  }
  
  return chordCount / words.length >= 0.3;
}
