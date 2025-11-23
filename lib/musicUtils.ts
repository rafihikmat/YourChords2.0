
import { ChordAdapter } from './chordService';

export const NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

export const CHORD_FAMILIES: Record<string, string[]> = {
  'Major': ['C', 'D', 'E', 'F', 'G', 'A', 'B'],
  'Minor': ['Cm', 'Dm', 'Em', 'Fm', 'Gm', 'Am', 'Bm'],
  '7th': ['C7', 'D7', 'E7', 'F7', 'G7', 'A7', 'B7'],
  'Maj7': ['Cmaj7', 'Dmaj7', 'Emaj7', 'Fmaj7', 'Gmaj7', 'Amaj7', 'Bmaj7'],
  'Min7': ['Cm7', 'Dm7', 'Em7', 'Fm7', 'Gm7', 'Am7', 'Bm7'],
  'Sus4': ['Csus4', 'Dsus4', 'Esus4', 'Fsus4', 'Gsus4', 'Asus4', 'Bsus4'],
};

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
  
  // This function extracts a list of unique chords found in the text
  // used for the "Chords Used" section in SongDetail.
  
  const chords = new Set<string>();
  // Expanded regex to catch chords in brackets [C]
  const chordRegex = /\[([A-G][#b]?(?:m|min|maj|dim|aug|sus|add|M)*[0-9]*(?:\/[A-G][#b]?)?)\]/g;
  let match;
  
  while ((match = chordRegex.exec(text)) !== null) {
      chords.add(match[1]);
  }
  
  return Array.from(chords);
};

export const getChordFingering = (name: string): number[] | null => {
  return ChordAdapter.getExternalChord(name);
};

// --- ADVANCED SMART MERGE ENGINE (TEXT -> CHORDPRO) ---

// Capture group 1 is the chord. Checks for whitespace or start/end of line boundaries.
// This fixes the bug where "C#" was not detected because '#' is a non-word char.
const CHORD_TOKEN_REGEX = /(?:^|\s)([A-G][#b]?(?:m|maj|min|dim|aug|sus|add|M|2|4|5|6|7|9|11|13)*\d*\+?(?:\/[A-G][#b]?)?)(?=\s|$)/g;

/**
 * Expand tabs to spaces to ensure alignment logic works
 */
function expandTabs(text: string, tabSize = 4): string {
    return text.replace(/\t/g, ' '.repeat(tabSize));
}

/**
 * Determines if a line is purely a chord line (to be merged) or a lyric line.
 * Uses heuristic density analysis to avoid false positives.
 */
function isChordLine(line: string): boolean {
  const trimmed = line.trim();
  if (trimmed.length === 0) return false;
  
  // 1. Headers are not chord lines
  if (/^\[.+\]$/.test(trimmed) || /^(Chorus|Verse|Bridge|Intro|Outro|Reff).*[:]?$/i.test(trimmed)) {
      return false;
  }

  // 2. Extract potential tokens
  const tokens = trimmed.split(/\s+/);
  let validChordCount = 0;
  let nonChordCount = 0;

  // Strict regex for standalone chords checking
  const strictChordRegex = /^[A-G][#b]?(?:m|maj|min|dim|aug|sus|add|M|2|4|5|6|7|9|11|13)*\d*\+?(?:\/[A-G][#b]?)?$/;

  for (const token of tokens) {
      // Remove simple punctuation for checking
      const cleanToken = token.replace(/[.,!?;:"']/g, '');
      if (!cleanToken) continue;

      // Handle (C) style chords by stripping parens for check
      const parenStripped = cleanToken.replace(/^\(|\)$/g, '');

      if (strictChordRegex.test(parenStripped)) {
          validChordCount++;
      } else {
          // Contains letters but not a chord?
          if (/[a-zA-Z]/.test(cleanToken)) {
              nonChordCount++;
          }
      }
  }

  // 3. Decision Logic
  if (validChordCount === 0) return false;
  
  // If we have lyrics words, it's likely a mixed line or just lyrics
  // Allow some tolerance: if 80% of words are chords, it's a chord line
  if (nonChordCount > 0) {
      const ratio = validChordCount / (validChordCount + nonChordCount);
      return ratio > 0.8;
  }
  
  return true;
}

/**
 * Converts raw text (Tab/Lyrics format) to ChordPro format.
 * Features:
 * - Merges "Chords over Lyrics" into single lines: [C]Lyric
 * - Auto-detects sections
 * - Handles file imports with tabs/bad spacing
 * - Converts (C) to [C]
 */
export const convertToChordPro = (rawText: string): string => {
  if (!rawText) return "";
  
  let processed = expandTabs(rawText);
  
  // Pre-processing: Convert (C) to [C] standard
  // Capture (C) or (Am/G) etc.
  processed = processed.replace(/\(([A-G][#b]?(?:m|maj|dim|aug|sus|add|M|2|4|5|6|7|9|11|13)*\d*\+?(?:\/[A-G][#b]?)?)\)/g, '[$1]');

  const lines = processed.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');
  const result: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const currentLine = lines[i];
    const nextLine = lines[i + 1];

    // CASE 1: Current line is Chords, Next line is Lyrics -> MERGE
    if (isChordLine(currentLine) && nextLine && nextLine.trim().length > 0 && !isChordLine(nextLine)) {
        
        const chordMatches = [...currentLine.matchAll(CHORD_TOKEN_REGEX)];
        let finalLine = "";
        let lastLyricIndex = 0;

        if (chordMatches.length === 0) {
            result.push(currentLine); // Fallback
            continue;
        }

        for (const match of chordMatches) {
            const chord = match[1]; // Group 1 capture
            // Calculate visual index (match.index points to start of regex match, which might be a space)
            // We find the chord within the match string to be precise
            const offset = match[0].indexOf(chord);
            const chordIndex = match.index! + offset;

            // Append lyrics up to this chord's position
            if (chordIndex > lastLyricIndex) {
                if (lastLyricIndex < nextLine.length) {
                    finalLine += nextLine.substring(lastLyricIndex, Math.min(chordIndex, nextLine.length));
                } else {
                    finalLine += " ";
                }
            }

            // Insert the chord in brackets
            const isBracketed = currentLine[chordIndex - 1] === '[' && currentLine[chordIndex + chord.length] === ']';
            
            if (isBracketed) {
                finalLine += `[${chord}]`;
            } else {
                finalLine += `[${chord}]`;
            }
            
            lastLyricIndex = Math.max(lastLyricIndex, chordIndex);
        }

        // Append remaining lyrics
        if (lastLyricIndex < nextLine.length) {
            finalLine += nextLine.substring(lastLyricIndex);
        }

        result.push(finalLine);
        i++; // Skip the next line (lyrics) since we merged it
    } 
    // CASE 2: Current line is Chords, but next is empty or another chord line -> ORPHAN CHORDS (e.g. Intro)
    else if (isChordLine(currentLine)) {
        // Wrap matches in brackets
        const formatted = currentLine.replace(CHORD_TOKEN_REGEX, (match, p1, offset, string) => {
            // Check if already bracketed
            if (string[offset + match.indexOf(p1) - 1] === '[' && string[offset + match.indexOf(p1) + p1.length] === ']') return match;
            return match.replace(p1, `[${p1}]`);
        });
        result.push(formatted);
    }
    // CASE 3: Headers / Metadata / Lyrics
    else {
        const trimmed = currentLine.trim();
        if (!trimmed) {
            result.push("");
        }
        // Check for headers like [Chorus], Verse 1:, etc.
        else if (/^\[.+\]$/.test(trimmed) || /^(Chorus|Verse|Bridge|Intro|Outro|Reff).*[:]?$/i.test(trimmed)) {
             const headerName = trimmed.replace(/[:\[\]]/g, '').trim();
             result.push(`{comment: ${headerName}}`);
        } 
        else {
            result.push(currentLine);
        }
    }
  }

  return result.join('\n');
};
