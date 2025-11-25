
import chordDbData from './data/guitar.json';

// TYPES based on chords-db structure
interface ChordDB {
    main: Record<string, unknown>;
    tunings: Record<string, unknown>;
    keys: string[];
    suffixes: string[];
    chords: Record<string, ChordEntry[]>;
}

interface ChordEntry {
    key: string;
    suffix: string;
    positions: Position[];
}

interface Position {
    frets: number[];
    fingers: number[];
    baseFret: number;
    barres: number[];
    capo?: boolean;
    midi: number[];
}

const CHORD_DB = chordDbData as unknown as ChordDB;

// MAPPING for Suffixes to match DB expectations
const SUFFIX_MAP: Record<string, string> = {
    '': 'major',
    'maj': 'major',
    'M': 'major',
    'm': 'minor',
    'min': 'minor',
    '-': 'minor',
    '+': 'aug',
    'dim': 'dim',
    'aug': 'aug',
    '7': '7',
    'm7': 'm7',
    'maj7': 'maj7',
    'M7': 'maj7',
    '9': '9',
    'm9': 'm9',
    'maj9': 'maj9',
    'sus': 'sus4',
    'sus4': 'sus4',
    'sus2': 'sus2',
    '7sus4': '7sus4',
    '5': '5',
    '6': '6',
    'm6': 'm6',
    'add9': 'add9',
    'madd9': 'madd9',
    '11': '11',
    '13': '13',
    'm11': 'm11'
};

const ENHARMONIC_MAP: Record<string, string> = {
    'C#': 'Csharp', 'Db': 'Csharp',
    'D#': 'Eb', 'Eb': 'Eb',
    'F#': 'Fsharp', 'Gb': 'Fsharp',
    'G#': 'Ab', 'Ab': 'Ab',
    'A#': 'Bb', 'Bb': 'Bb'
};

/**
 * Adapter class to interface with the external guitar chord database.
 */
export class ChordAdapter {
    /**
     * Retrieves the finger positions for a given chord from the internal database.
     * Handles slash chords (lookup directly if possible, else fallback to root).
     * Handles enharmonic equivalents (e.g., Db = C#).
     * Returns ABSOLUTE fret positions (calculating from baseFret).
     *
     * @param {string} chordName - The name of the chord (e.g., "Am", "C#m7", "G/B").
     * @returns {number[] | null} Array of fret positions or null if the chord is not found.
     */
    static getExternalChord(chordName: string): number[] | null {
        if (!chordName || typeof chordName !== 'string') return null;

        const cleanName = chordName.trim();

        // 1. Parse Root and Suffix (handling slash chords)
        const match = cleanName.match(/^([A-G][#b]?)(.*?)(?:\/([A-G][#b]?))?$/);

        if (!match) return null;

        let root = match[1]; // e.g., "C"
        let suffixRaw = match[2]; // e.g., "m7" or ""
        let bass = match[3]; // e.g., "G" or undefined

        // 2. Normalize Root
        // We map standard roots to the specific keys used in chords-db
        if (ENHARMONIC_MAP[root]) {
            root = ENHARMONIC_MAP[root];
        }

        // Also normalize bass if present
        if (bass && ENHARMONIC_MAP[bass]) {
             bass = ENHARMONIC_MAP[bass];
        }

        // Re-map back from "Csharp" to "C#" ONLY for the suffix part construction
        if (bass) {
             if (bass === 'Csharp') bass = 'C#';
             if (bass === 'Fsharp') bass = 'F#';
        }

        // 3. Normalize Suffix
        let suffix = SUFFIX_MAP[suffixRaw] || suffixRaw;

        // 4. Construct Query Suffix
        let querySuffix = suffix;
        if (bass) {
            // SPECIAL CASE: chords-db uses 'm' for minor in slash chords, not 'minor'
            if (suffix === 'minor') {
                querySuffix = `m/${bass}`;
            } else if (suffix === 'major') {
                querySuffix = `/${bass}`;
            } else {
                querySuffix = `${suffix}/${bass}`;
            }
        }

        // 5. Lookup in DB
        const rootChords = CHORD_DB.chords[root];

        if (!rootChords) {
            return null;
        }

        // Search for exact suffix match
        let entry = rootChords.find(c => c.suffix === querySuffix);

        // Retry logic for Slash Chords:
        // If exact slash chord not found, fallback to root chord.
        if (!entry && bass) {
             querySuffix = suffix;
             entry = rootChords.find(c => c.suffix === querySuffix);
        }

        if (!entry) {
            if (querySuffix === 'major') {
                entry = rootChords.find(c => c.suffix === 'major');
            }
        }

        if (!entry) {
             if (suffix.startsWith('m') || suffix.includes('min')) {
                 entry = rootChords.find(c => c.suffix === 'minor');
             } else {
                 entry = rootChords.find(c => c.suffix === 'major');
             }
        }

        if (!entry || !entry.positions || entry.positions.length === 0) {
            return null;
        }

        // 6. Return first position with ABSOLUTE frets
        const bestPosition = entry.positions[0];
        const baseOffset = (bestPosition.baseFret || 1) - 1;

        if (baseOffset === 0) {
            return bestPosition.frets;
        }

        return bestPosition.frets.map(f => (f >= 0 ? f + baseOffset : f));
    }
}
