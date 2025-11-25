import { Position } from '../chordService';

export interface AdvancedChordEntry {
    key: string;
    suffix: string;
    positions: Position[];
}

export const ADVANCED_CHORD_DATA: AdvancedChordEntry[] = [
    // --- C Major Family ---
    {
        key: 'C',
        suffix: 'maj9',
        positions: [
            {
                frets: [-1, 3, 2, 4, 3, -1],
                fingers: [0, 2, 1, 4, 3, 0],
                baseFret: 1,
                barres: [],
                midi: [48, 52, 59, 64], // C E B E (approx)
                tags: ['jazz', 'shell', 'rootless']
            },
            {
                frets: [8, 7, 9, 7, 8, 7],
                fingers: [2, 1, 3, 1, 2, 1],
                baseFret: 7,
                barres: [7],
                midi: [48, 55, 59, 62, 64, 67],
                tags: ['neo-soul', 'barre']
            }
        ]
    },
    {
        key: 'C',
        suffix: 'maj7',
        positions: [
            {
                frets: [-1, 3, 5, 4, 5, 3],
                fingers: [0, 1, 3, 2, 4, 1],
                baseFret: 3,
                barres: [3],
                midi: [48, 55, 59, 64, 67],
                tags: ['jazz', 'drop2']
            },
            {
                frets: [8, -1, 9, 9, 8, -1],
                fingers: [1, 0, 3, 4, 2, 0],
                baseFret: 8,
                barres: [],
                midi: [48, 59, 64, 67],
                tags: ['jazz', 'shell']
            }
        ]
    },
    // --- C Minor Family ---
    {
        key: 'C',
        suffix: 'm9',
        positions: [
            {
                frets: [-1, 3, 1, 3, 3, -1],
                fingers: [0, 2, 1, 3, 4, 0],
                baseFret: 1,
                barres: [],
                midi: [48, 51, 58, 62],
                tags: ['jazz', 'minor']
            },
            {
                frets: [8, 10, 8, 8, 8, 10],
                fingers: [1, 3, 1, 1, 1, 4],
                baseFret: 8,
                barres: [8],
                midi: [48, 55, 58, 62, 65, 67],
                tags: ['neo-soul', 'barre']
            }
        ]
    },
    {
        key: 'C',
        suffix: 'm11',
        positions: [
            {
                frets: [8, -1, 8, 8, 6, -1],
                fingers: [2, 0, 3, 4, 1, 0],
                baseFret: 6,
                barres: [],
                midi: [48, 58, 62, 65],
                tags: ['jazz', 'rootless']
            }
        ]
    },
    // --- C Dominant Family ---
    {
        key: 'C',
        suffix: '13',
        positions: [
            {
                frets: [8, -1, 8, 9, 10, -1],
                fingers: [1, 0, 2, 3, 4, 0],
                baseFret: 8,
                barres: [],
                midi: [48, 58, 64, 69],
                tags: ['funk', 'jazz']
            }
        ]
    },
    {
        key: 'C',
        suffix: '7#9',
        positions: [
            {
                frets: [-1, 3, 2, 3, 4, -1],
                fingers: [0, 2, 1, 3, 4, 0],
                baseFret: 1,
                barres: [],
                midi: [48, 52, 58, 63],
                tags: ['funk', 'hendrix']
            }
        ]
    },
    // --- D Family ---
    {
        key: 'D',
        suffix: '9',
        positions: [
            {
                frets: [-1, 5, 4, 5, 5, 5],
                fingers: [0, 2, 1, 3, 3, 3],
                baseFret: 4,
                barres: [5],
                midi: [50, 54, 60, 64, 67],
                tags: ['funk']
            }
        ]
    },
    {
        key: 'D',
        suffix: 'm11',
        positions: [
            {
                frets: [10, -1, 10, 10, 8, -1],
                fingers: [2, 0, 3, 4, 1, 0],
                baseFret: 8,
                barres: [],
                midi: [50, 60, 64, 67],
                tags: ['jazz', 'neo-soul']
            }
        ]
    },
    // --- E Family ---
    {
        key: 'E',
        suffix: '9',
        positions: [
            {
                frets: [0, 2, 2, 1, 0, 2],
                fingers: [0, 2, 3, 1, 0, 4],
                baseFret: 1,
                barres: [],
                midi: [40, 47, 52, 56, 59, 66],
                tags: ['open']
            },
            {
                frets: [-1, 7, 6, 7, 7, 7],
                fingers: [0, 2, 1, 3, 3, 3],
                baseFret: 6,
                barres: [7],
                midi: [52, 56, 62, 66, 69],
                tags: ['funk']
            }
        ]
    },
    {
        key: 'E',
        suffix: '7#9',
        positions: [
            {
                frets: [-1, 7, 6, 7, 8, -1],
                fingers: [0, 2, 1, 3, 4, 0],
                baseFret: 6,
                barres: [],
                midi: [52, 56, 62, 67],
                tags: ['rock', 'hendrix']
            },
            {
                frets: [0, 2, 2, 1, 3, 3],
                fingers: [0, 2, 3, 1, 4, 4],
                baseFret: 1,
                barres: [],
                midi: [40, 47, 52, 56, 63, 63], // Open E7#9
                tags: ['rock']
            }
        ]
    },
    // --- F Family ---
    {
        key: 'F',
        suffix: 'maj9',
        positions: [
            {
                frets: [-1, 8, 7, 9, 8, -1],
                fingers: [0, 2, 1, 4, 3, 0],
                baseFret: 7,
                barres: [],
                midi: [53, 57, 64, 69],
                tags: ['jazz', 'shell']
            }
        ]
    },
    // --- G Family ---
    {
        key: 'G',
        suffix: '13',
        positions: [
            {
                frets: [3, -1, 3, 4, 5, -1],
                fingers: [1, 0, 2, 3, 4, 0],
                baseFret: 3,
                barres: [],
                midi: [43, 53, 59, 64],
                tags: ['jazz', 'funk']
            }
        ]
    },
    {
        key: 'G',
        suffix: 'maj9',
        positions: [
            {
                frets: [-1, 10, 9, 11, 10, -1],
                fingers: [0, 2, 1, 4, 3, 0],
                baseFret: 9,
                barres: [],
                midi: [55, 59, 66, 71],
                tags: ['jazz', 'shell']
            },
            {
                frets: [3, -1, 4, 4, 3, -1],
                fingers: [1, 0, 3, 4, 2, 0],
                baseFret: 3,
                barres: [],
                midi: [43, 54, 59, 62],
                tags: ['jazz', 'shell']
            }
        ]
    },
    // --- A Family ---
    {
        key: 'A',
        suffix: 'm11',
        positions: [
            {
                frets: [5, -1, 5, 5, 3, -1],
                fingers: [2, 0, 3, 4, 1, 0],
                baseFret: 3,
                barres: [],
                midi: [45, 55, 59, 62],
                tags: ['jazz', 'neo-soul']
            },
            {
                frets: [-1, 12, 10, 12, 12, -1], // A minor 11 (root on 5th string)
                fingers: [0, 2, 1, 3, 4, 0],
                baseFret: 10,
                barres: [],
                midi: [57, 60, 64, 67],
                tags: ['jazz', 'rootless']
            }
        ]
    },
    {
        key: 'A',
        suffix: 'maj9',
        positions: [
            {
                frets: [5, -1, 6, 6, 5, -1],
                fingers: [1, 0, 3, 4, 2, 0],
                baseFret: 5,
                barres: [],
                midi: [45, 56, 61, 64],
                tags: ['jazz', 'shell']
            },
            {
                frets: [-1, 0, 2, 1, 0, 0],
                fingers: [0, 0, 2, 1, 0, 0],
                baseFret: 1,
                barres: [],
                midi: [45, 52, 56, 59, 64],
                tags: ['open', 'pop']
            }
        ]
    },
    // --- B Family ---
    {
        key: 'B',
        suffix: 'm11',
        positions: [
            {
                frets: [7, -1, 7, 7, 5, -1],
                fingers: [2, 0, 3, 4, 1, 0],
                baseFret: 5,
                barres: [],
                midi: [47, 57, 61, 64],
                tags: ['jazz', 'neo-soul']
            }
        ]
    },
    {
        key: 'B',
        suffix: '7alt',
        positions: [
            {
                frets: [7, -1, 7, 8, 8, -1], // B7#5#9
                fingers: [1, 0, 2, 3, 4, 0],
                baseFret: 7,
                barres: [],
                midi: [47, 57, 63, 68],
                tags: ['jazz', 'altered']
            }
        ]
    },
    {
        key: 'B',
        suffix: 'maj9',
        positions: [
            {
                frets: [-1, 2, 1, 3, 2, -1],
                fingers: [0, 2, 1, 4, 3, 0],
                baseFret: 1,
                barres: [],
                midi: [47, 51, 58, 63],
                tags: ['jazz', 'shell']
            }
        ]
    }
];
