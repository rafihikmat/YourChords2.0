
import chordDbData from './data/guitar.json';
import { ADVANCED_CHORD_DATA } from './data/advancedChordData';

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

export interface Position {
    frets: number[];
    fingers: number[];
    baseFret: number;
    barres: number[];
    capo?: boolean;
    midi: number[];
    tags?: string[]; // Added tags support
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
    'm11': 'm11',
    '7#9': '7#9', // Ensure Hendrix chord is mapped
    '7alt': '7alt'
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
        const voicings = this.getAllChordVoicings(chordName);
        if (!voicings || voicings.length === 0) return null;
        return voicings[0].frets;
    }

    /**
     * Retrieves all available voicings (positions) for a given chord.
     * Merges standard DB data with Advanced Chord Data.
     *
     * @param {string} chordName - The name of the chord.
     * @returns {Position[] | null} Array of positions or null if not found.
     */
    static getAllChordVoicings(chordName: string): Position[] | null {
        if (!chordName || typeof chordName !== 'string') return null;

        const cleanName = chordName.trim();

        // 1. Parse Root and Suffix
        const match = cleanName.match(/^([A-G][#b]?)(.*?)(?:\/([A-G][#b]?))?$/);
        if (!match) return null;

        let root = match[1];
        const suffixRaw = match[2];
        let bass = match[3];

        // 2. Normalize Root
        if (ENHARMONIC_MAP[root]) root = ENHARMONIC_MAP[root];
        if (bass && ENHARMONIC_MAP[bass]) bass = ENHARMONIC_MAP[bass];

        if (bass) {
            if (bass === 'Csharp') bass = 'C#';
            if (bass === 'Fsharp') bass = 'F#';
        }

        // 3. Normalize Suffix
        const suffix = SUFFIX_MAP[suffixRaw] || suffixRaw;

        // 4. Construct Query Suffix
        let querySuffix = suffix;
        if (bass) {
            if (suffix === 'minor') querySuffix = `m/${bass}`;
            else if (suffix === 'major') querySuffix = `/${bass}`;
            else querySuffix = `${suffix}/${bass}`;
        }

        // 5. Lookup in Advanced Data FIRST (Priority)
        // We need to match key and suffix. Advanced data uses standard keys (C, C#, Db etc) but let's assume it matches normalized root if possible,
        // or we just check both.
        // Our advanced data uses "C", "D", etc.
        // Let's try to match exactly.

        let advancedPositions: Position[] = [];

        // Convert normalized root back to standard for advanced lookup if needed (e.g. Csharp -> C#)
        // Actually our advanced data uses 'C', 'D', 'E', 'F', 'G', 'A', 'B' mostly for now.
        // But if we had C#, we should check.

        // Simple lookup in advanced data
        const advEntry = ADVANCED_CHORD_DATA.find(c => c.key === root && c.suffix === suffix);
        if (advEntry) {
            advancedPositions = [...advEntry.positions];
        }

        // 6. Lookup in Standard DB
        let dbPositions: Position[] = [];
        const rootChords = CHORD_DB.chords[root];

        if (rootChords) {
            let entry = rootChords.find(c => c.suffix === querySuffix);

            if (!entry && bass) {
                querySuffix = suffix;
                entry = rootChords.find(c => c.suffix === querySuffix);
            }

            if (!entry) {
                if (querySuffix === 'major') entry = rootChords.find(c => c.suffix === 'major');
            }

            if (!entry) {
                if (suffix.startsWith('m') || suffix.includes('min')) {
                    entry = rootChords.find(c => c.suffix === 'minor');
                } else {
                    entry = rootChords.find(c => c.suffix === 'major');
                }
            }

            if (entry && entry.positions) {
                // Convert DB positions to have absolute frets if needed, but wait, 
                // the previous implementation of getExternalChord did this conversion.
                // getAllChordVoicings should probably return the raw positions with baseFret info,
                // and the consumer handles display.
                // HOWEVER, getExternalChord was returning absolute frets.
                // Let's stick to the structure: Position has baseFret. 
                // If baseFret > 1, the frets array usually has relative numbers in some DBs, or absolute.
                // In `guitar.json` (chords-db), frets are usually absolute?
                // Let's check `guitar.json` sample... 
                // "frets": [8, 10, 10, 9, 8, 8], "baseFret": 8.
                // It seems they are absolute.
                // BUT `getExternalChord` had logic: `f + baseOffset`. 
                // If `guitar.json` has absolute frets, `f + baseOffset` would DOUBLE the offset.
                // Let's assume `guitar.json` has RELATIVE frets if baseFret is used?
                // Actually, looking at the mock data:
                // frets: [-1, 5, 7, 7, 7, 5], baseFret: 5.
                // These look absolute.
                // If they are absolute, `baseFret` is just a label.

                // Let's trust the data is absolute frets, and baseFret is just for display.
                // So we just pass them through.
                dbPositions = entry.positions;
            }
        }

        // 7. Merge Results
        // Advanced positions first
        const allPositions = [...advancedPositions, ...dbPositions];

        if (allPositions.length === 0) return null;

        return allPositions;
    }
}
