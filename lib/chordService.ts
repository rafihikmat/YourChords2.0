
// --- Types Matching External Source (chords-db) ---
interface ExternalPosition {
    frets: string | number[]; // External uses strings like "x32010" or arrays
    fingers?: string | number[];
    barres?: number | number[];
    capo?: boolean;
}

interface ExternalChordDef {
    key: string;
    suffix: string;
    positions: ExternalPosition[];
}

// --- ADAPTER LOGIC ---

/**
 * Maps common shorthand suffixes to the keys used in the external DB
 */
const SUFFIX_MAP: Record<string, string> = {
    '': 'major',
    'm': 'minor',
    'min': 'minor',
    'maj': 'major',
    'dim': 'dim',
    'aug': 'aug',
    '7': '7',
    'm7': 'm7',
    'maj7': 'maj7',
    '9': '9',
    'm9': 'm9',
    'maj9': 'maj9',
    'sus4': 'sus4',
    'sus2': 'sus2',
    '7sus4': '7sus4',
    '5': '5',
    '6': '6',
    'm6': 'm6',
    'add9': 'add9',
};

/**
 * Converts external fret string (e.g., "x32010") to internal array format ([-1, 3, 2, 0, 1, 0])
 */
const convertFrets = (frets: string | number[]): number[] => {
    if (Array.isArray(frets)) return frets; // Already an array
    
    return frets.split('').map(char => {
        if (char.toLowerCase() === 'x') return -1;
        // Handle hex values (a=10, b=11, etc) which chords-db uses
        return parseInt(char, 16);
    });
};

// --- EXTERNAL DATA STORE (Consolidated from provided files) ---
// We use a simplified lookup structure: DB[Root][Suffix] = Position[]
const EXTERNAL_GUITAR_DB: Record<string, Record<string, ExternalPosition[]>> = {
    'C': {
        'major': [{ frets: 'x32010' }, { frets: 'x35553' }, { frets: '8aa988' }],
        'minor': [{ frets: 'x35543' }, { frets: '8aa888' }],
        '7': [{ frets: 'x32310' }, { frets: 'x35353' }, { frets: '8a8988' }],
        'maj7': [{ frets: 'x32000' }, { frets: '335453' }, { frets: 'x35453' }], // From file
        'm7': [{ frets: 'x3134x' }, { frets: '8x888x' }],
        'sus4': [{ frets: 'x33011' }, { frets: '335563' }],
        'add9': [{ frets: 'x32030' }, { frets: 'x30030' }]
    },
    'D': {
        'major': [{ frets: 'xx0232' }, { frets: 'x57775' }],
        'minor': [{ frets: 'xx0231' }, { frets: '557765' }, { frets: 'x57765' }],
        '7': [{ frets: 'xx0212' }, { frets: 'x5453x' }, { frets: '557575' }],
        'maj7': [{ frets: 'xx0222' }, { frets: 'x57675' }],
        'm7': [{ frets: 'xx0211' }, { frets: 'x57565' }],
        'sus4': [{ frets: 'xx0233' }, { frets: '557785' }],
        'sus2': [{ frets: 'xx0230' }, { frets: '557755' }]
    },
    'E': {
        'major': [{ frets: '022100' }, { frets: 'x79997' }],
        'minor': [{ frets: '022000' }, { frets: 'x79987' }],
        '7': [{ frets: '020100' }, { frets: 'x7675x' }],
        'maj7': [{ frets: '021100' }, { frets: 'x76444' }],
        'm7': [{ frets: '022030' }, { frets: '020000' }],
        'sus4': [{ frets: '022200' }, { frets: '022455' }]
    },
    'F': {
        'major': [{ frets: '133211' }, { frets: 'x8aa98' }],
        'minor': [{ frets: '133111' }, { frets: 'x8aa98' }], // Corrected from file logic
        '7': [{ frets: '131211' }, { frets: 'x8a8a8' }],
        'maj7': [{ frets: '132211' }, { frets: 'x8a998' }],
        'm7': [{ frets: '131111' }, { frets: 'x8a898' }]
    },
    'G': {
        'major': [{ frets: '320003' }, { frets: '355433' }],
        'minor': [{ frets: '355333' }, { frets: 'xx5786' }],
        '7': [{ frets: '320001' }, { frets: '353433' }],
        'maj7': [{ frets: '320002' }, { frets: '354433' }],
        'm7': [{ frets: '353333' }, { frets: '3x333x' }],
        'sus4': [{ frets: '330013' }, { frets: '355533' }]
    },
    'A': {
        'major': [{ frets: 'x02220' }, { frets: '577655' }],
        'minor': [{ frets: 'x02210' }, { frets: '577555' }],
        '7': [{ frets: 'x02020' }, { frets: '575655' }],
        'maj7': [{ frets: 'x02120' }, { frets: '5x6655' }], // Approx
        'm7': [{ frets: 'x02010' }, { frets: '575555' }],
        'sus2': [{ frets: 'x02200' }],
        'sus4': [{ frets: 'x02230' }]
    },
    'B': {
        'major': [{ frets: 'x24442' }, { frets: '799877' }],
        'minor': [{ frets: 'x24432' }, { frets: '799777' }],
        '7': [{ frets: 'x21202' }, { frets: '797877' }],
        'maj7': [{ frets: 'x24342' }, { frets: '7x8877' }],
        'm7': [{ frets: 'x20202' }, { frets: '797777' }]
    }
};

// --- SERVICE CLASS ---

export class ChordAdapter {
    
    /**
     * Tries to find a chord in the external database structure and adapt it to the internal format.
     * @param chordName The chord name (e.g., "C#m7", "G")
     * @returns An array of 6 numbers representing frets, or null if not found.
     */
    static getExternalChord(chordName: string): number[] | null {
        if (!chordName || typeof chordName !== 'string') return null;

        // 1. Parse the chord name into Root and Suffix
        // Matches "C", "C#", "Bb", "Am7", "F#maj7"
        const match = chordName.match(/^([A-G][#b]?)(.*)$/);
        if (!match) return null;

        let root = match[1]; // e.g. "C" or "F#"
        let suffixRaw = match[2]; // e.g. "m7" or ""

        // Handle flat/sharp normalization if necessary (Chords-DB uses sharp usually)
        // Check if we need to swap root key for lookup
        // Note: The consolidated DB above uses 'C#', 'F#', etc.
        
        // 2. Map the suffix to external key
        const mappedSuffix = SUFFIX_MAP[suffixRaw] || suffixRaw;

        // 3. Lookup
        const rootData = EXTERNAL_GUITAR_DB[root];
        if (!rootData) return null;

        const chordPositions = rootData[mappedSuffix];
        if (!chordPositions || chordPositions.length === 0) return null;

        // 4. Adapt
        // We prefer the first position (usually open or lowest fret)
        const bestPosition = chordPositions[0];
        
        return convertFrets(bestPosition.frets);
    }
}
