
// lib/chordService.ts

interface ExternalPosition {
    frets: string | number[];
    fingers?: string | number[];
    barres?: number | number[];
    capo?: boolean;
}

// Helper: Map Suffix standar
const SUFFIX_MAP: Record<string, string> = {
    '': 'major', 'm': 'minor', 'min': 'minor', 'maj': 'major',
    'dim': 'dim', 'aug': 'aug', '7': '7', 'm7': 'm7', 'maj7': 'maj7',
    '9': '9', 'm9': 'm9', 'maj9': 'maj9', 'sus4': 'sus4', 'sus2': 'sus2',
    '7sus4': '7sus4', '5': '5', '6': '6', 'm6': 'm6', 'add9': 'add9',
};

const convertFrets = (frets: string | number[]): number[] => {
    if (Array.isArray(frets)) return frets;
    return frets.split('').map(char => (char.toLowerCase() === 'x' ? -1 : parseInt(char, 16)));
};

// Database Lengkap (12 Nada)
const EXTERNAL_GUITAR_DB: Record<string, Record<string, ExternalPosition[]>> = {
    'C': { 'major': [{ frets: 'x32010' }], 'minor': [{ frets: 'x35543' }], '7': [{ frets: 'x32310' }], 'maj7': [{ frets: 'x32000' }], 'm7': [{ frets: 'x3134x' }], 'sus4': [{ frets: 'x33011' }] },
    'C#': { 'major': [{ frets: 'x46664' }], 'minor': [{ frets: 'x46654' }], '7': [{ frets: 'x46464' }], 'maj7': [{ frets: 'x46564' }], 'm7': [{ frets: 'x46454' }] },
    'D': { 'major': [{ frets: 'xx0232' }], 'minor': [{ frets: 'xx0231' }], '7': [{ frets: 'xx0212' }], 'maj7': [{ frets: 'xx0222' }], 'm7': [{ frets: 'xx0211' }], 'sus4': [{ frets: 'xx0233' }] },
    'D#': { 'major': [{ frets: 'x68886' }], 'minor': [{ frets: 'x68876' }], '7': [{ frets: 'x68686' }], 'maj7': [{ frets: 'x68786' }], 'm7': [{ frets: 'x68676' }] },
    'E': { 'major': [{ frets: '022100' }], 'minor': [{ frets: '022000' }], '7': [{ frets: '020100' }], 'maj7': [{ frets: '021100' }], 'm7': [{ frets: '022030' }], 'sus4': [{ frets: '022200' }] },
    'F': { 'major': [{ frets: '133211' }], 'minor': [{ frets: '133111' }], '7': [{ frets: '131211' }], 'maj7': [{ frets: '132211' }], 'm7': [{ frets: '131111' }] },
    'F#': { 'major': [{ frets: '244322' }], 'minor': [{ frets: '244222' }], '7': [{ frets: '242322' }], 'maj7': [{ frets: '243322' }], 'm7': [{ frets: '242222' }] },
    'G': { 'major': [{ frets: '320003' }], 'minor': [{ frets: '355333' }], '7': [{ frets: '320001' }], 'maj7': [{ frets: '320002' }], 'm7': [{ frets: '353333' }], 'sus4': [{ frets: '330013' }] },
    'G#': { 'major': [{ frets: '466544' }], 'minor': [{ frets: '466444' }], '7': [{ frets: '464544' }], 'maj7': [{ frets: '465544' }], 'm7': [{ frets: '464444' }] },
    'A': { 'major': [{ frets: 'x02220' }], 'minor': [{ frets: 'x02210' }], '7': [{ frets: 'x02020' }], 'maj7': [{ frets: 'x02120' }], 'm7': [{ frets: 'x02010' }], 'sus4': [{ frets: 'x02230' }] },
    'A#': { 'major': [{ frets: 'x13331' }], 'minor': [{ frets: 'x13321' }], '7': [{ frets: 'x13131' }], 'maj7': [{ frets: 'x13231' }], 'm7': [{ frets: 'x13121' }] },
    'B': { 'major': [{ frets: 'x24442' }], 'minor': [{ frets: 'x24432' }], '7': [{ frets: 'x21202' }], 'maj7': [{ frets: 'x24342' }], 'm7': [{ frets: 'x20202' }] }
};

export class ChordAdapter {
    static getExternalChord(chordName: string): number[] | null {
        if (!chordName || typeof chordName !== 'string') return null;
        let cleanName = chordName.trim();
        if (cleanName.includes('/')) cleanName = cleanName.split('/')[0]; // Handle Slash Chords (G/A -> G)

        const match = cleanName.match(/^([A-G][#b]?)(.*)$/);
        if (!match) return null;

        const root = match[1];
        const suffixRaw = match[2];

        const ENHARMONIC_MAP: Record<string, string> = {
            'Db': 'C#', 'Eb': 'D#', 'Gb': 'F#', 'Ab': 'G#', 'Bb': 'A#',
            'C#': 'Db', 'D#': 'Eb', 'F#': 'Gb', 'G#': 'Ab', 'A#': 'Bb'
        };

        let rootData = EXTERNAL_GUITAR_DB[root];
        if (!rootData && ENHARMONIC_MAP[root]) rootData = EXTERNAL_GUITAR_DB[ENHARMONIC_MAP[root]];
        if (!rootData) return null;

        const mappedSuffix = SUFFIX_MAP[suffixRaw] || suffixRaw;
        const chordPositions = rootData[mappedSuffix];

        if (!chordPositions || chordPositions.length === 0) {
             // Fallback Logic: Try generic major/minor if extension not found
             if (mappedSuffix.startsWith('m') && rootData['minor']) return convertFrets(rootData['minor'][0].frets);
             if (rootData['major']) return convertFrets(rootData['major'][0].frets);
             return null;
        }
        return convertFrets(chordPositions[0].frets);
    }
}
