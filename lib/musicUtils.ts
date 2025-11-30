
import { ChordAdapter } from './chordService';

/**
 * Array of standard musical notes used for transposition and validation.
 */
export const NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

/**
 * Mapping of chord families to their constituent chords.
 * Used for categorization or grouping of chords.
 */
export const CHORD_FAMILIES: Record<string, string[]> = {
  'Major': ['C', 'D', 'E', 'F', 'G', 'A', 'B'],
  'Minor': ['Cm', 'Dm', 'Em', 'Fm', 'Gm', 'Am', 'Bm'],
  '7th': ['C7', 'D7', 'E7', 'F7', 'G7', 'A7', 'B7'],
  'Maj7': ['Cmaj7', 'Dmaj7', 'Emaj7', 'Fmaj7', 'Gmaj7', 'Amaj7', 'Bmaj7'],
  'Min7': ['Cm7', 'Dm7', 'Em7', 'Fm7', 'Gm7', 'Am7', 'Bm7'],
  'Sus4': ['Csus4', 'Dsus4', 'Esus4', 'Fsus4', 'Gsus4', 'Asus4', 'Bsus4'],
};

/**
 * Normalizes a chord name to a standard format.
 * Examples: "c minor" -> "Cm", "G major" -> "G", "Dsus" -> "Dsus4".
 *
 * @param {string} input - The raw chord string to normalize.
 * @returns {string} The normalized chord string, or an empty string if input is invalid.
 */
export const normalizeChordName = (input: string): string => {
  if (!input || typeof input !== 'string') return "";
  const normalized = input.trim().charAt(0).toUpperCase() + input.trim().slice(1);
  return normalized
    .replace(/min$/, 'm').replace(/minor$/, 'm')
    .replace(/maj$/, 'maj7').replace(/major$/, '')
    .replace(/sus$/, 'sus4');
};

/**
 * Transposes a chord by a given number of semitones.
 * Handles slash chords (e.g., C/G) and maintains chord quality (e.g., m, 7, sus4).
 *
 * @param {string} chord - The chord to transpose (e.g., "Am", "C/G").
 * @param {number} semitones - The number of semitones to shift (positive or negative).
 * @returns {string} The transposed chord. Returns the original chord if input is invalid or not recognized.
 */
export const transposeChord = (chord: string, semitones: number): string => {
  if (!chord || typeof chord !== 'string' || !chord.trim()) return chord;
  const match = chord.match(/^([A-G][#b]?)(.*?)(\/([A-G][#b]?))?$/);
  if (!match) return chord;

  // eslint-disable-next-line @typescript-eslint/no-unused-vars, prefer-const
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

/**
 * Parses a text to find all unique chords formatted within brackets (e.g., [C], [Am7]).
 * Used for extracting a list of chords used in a song.
 *
 * @param {string} text - The text to scan for chords.
 * @returns {string[]} An array of unique chord names found in the text.
 */
export const parseChordsFromText = (text: string): string[] => {
  if (!text || typeof text !== 'string') return [];
  
  // This function extracts a list of unique chords found in the text
  // used for the "Chords Used" section in SongDetail.
  
  const chords = new Set<string>();
  // Expanded regex to catch chords in brackets [C]
  const chordRegex = /\[([A-G][#b]?(?:m|min|maj|dim|aug|sus|add|M)*[0-9]*(?:\/[A-G][#b]?)?)]/g;
  let match;
  
  while ((match = chordRegex.exec(text)) !== null) {
      chords.add(match[1]);
  }
  
  return Array.from(chords);
};

/**
 * Retrieves the fingering (fret positions) for a given chord name.
 * Delegates to ChordAdapter to fetch data from the external database.
 *
 * @param {string} name - The name of the chord.
 * @returns {number[] | null} An array representing fret positions (e.g., [-1, 3, 2, 0, 1, 0] for C major), or null if not found.
 */
export const getChordFingering = (name: string): number[] | null => {
  return ChordAdapter.getExternalChord(name);
};

// --- ADVANCED SMART MERGE ENGINE (TEXT -> CHORDPRO) ---

// Capture group 1 is the chord. Checks for whitespace or start/end of line boundaries.
// This fixes the bug where "C#" was not detected because '#' is a non-word char.
const CHORD_TOKEN_REGEX = /(?:^|\s)([A-G][#b]?(?:m|maj|min|dim|aug|sus|add|M|2|4|5|6|7|9|11|13)*\d*\+?(?:\/[A-G][#b]?)?)(?=\s|$)/g;

/**
 * Expand tabs to spaces to ensure alignment logic works.
 *
 * @param {string} text - The text containing tabs.
 * @param {number} [tabSize=4] - The number of spaces to replace each tab with.
 * @returns {string} The text with tabs expanded to spaces.
 */
function expandTabs(text: string, tabSize = 4): string {
    return text.replace(/\t/g, ' '.repeat(tabSize));
}

/**
 * Determines if a line is purely a chord line (to be merged) or a lyric line.
 * Uses heuristic density analysis to avoid false positives.
 *
 * @param {string} line - The line of text to analyze.
 * @returns {boolean} True if the line is determined to be a chord line, false otherwise.
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
 *
 * @param {string} rawText - The raw song text (chords and lyrics).
 * @returns {string} The converted ChordPro formatted string.
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
                const endOfLyrics = nextLine.length;

                // If we have lyrics to cover the gap
                if (lastLyricIndex < endOfLyrics) {
                    const takeUntil = Math.min(chordIndex, endOfLyrics);
                    finalLine += nextLine.substring(lastLyricIndex, takeUntil);

                    // If we still haven't reached chordIndex (because lyrics ran out)
                    if (takeUntil < chordIndex) {
                        finalLine += " ".repeat(chordIndex - takeUntil);
                    }
                } else {
                    // Lyrics already exhausted, just pad spaces
                    finalLine += " ".repeat(chordIndex - lastLyricIndex);
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

/**
 * Extracts a unique list of chords from various song data formats.
 * Handles:
 * 1. Parser output (uniqueChords)
 * 2. Legacy DB format (string[])
 * 3. AI/New DB format (ChordLine[])
 * 
 * @param {string[] | null} parserChords - Chords extracted by the parser.
 * @param {any} dbChords - Raw chords data from the database.
 * @returns {string[]} A sorted list of unique, valid chords.
 */
export const extractUniqueChords = (parserChords: string[] | null, dbChords: any): string[] => {
    let rawList: string[] = [];

    // 1. Priority: Use unique chords extracted by the parser
    if (parserChords && parserChords.length > 0) {
        rawList = parserChords;
    }
    // 2. Fallback: Use DB 'chords' column
    else if (Array.isArray(dbChords)) {
        if (dbChords.length > 0) {
            const firstItem = dbChords[0];

            if (typeof firstItem === 'string') {
                // Legacy Format: ["C", "Am", "F"]
                rawList = dbChords as string[];
            } else if (typeof firstItem === 'object' && firstItem !== null && 'chords' in firstItem) {
                // AI/New Format: [{ line: "...", chords: ["C", "Am"] }]
                // Flatten all chords from all lines
                rawList = (dbChords as any[]).flatMap(line => Array.isArray(line.chords) ? line.chords : []);
            }
        }
    }

    // 3. Clean, Dedup, and Validate
    const validSet = new Set<string>();

    rawList.forEach(c => {
        if (!c || typeof c !== 'string') return;
        const clean = c.trim();
        // Verify against music utils to ensure it's a renderable chord
        if (clean.length > 0 && clean.length < 10 && getChordFingering(clean) !== null) {
            validSet.add(clean);
        }
    });

    return Array.from(validSet);
};
