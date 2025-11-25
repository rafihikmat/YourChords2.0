import { Position } from '../chordService';

export interface MockChordEntry {
    key: string;
    suffix: string;
    positions: Position[];
}

export const MOCK_CHORD_DATA: MockChordEntry[] = [
    {
        key: 'D',
        suffix: 'major',
        positions: [
            {
                frets: [-1, -1, 0, 2, 3, 2],
                fingers: [0, 0, 0, 1, 3, 2],
                baseFret: 1,
                barres: [],
                midi: [50, 57, 62, 66]
            },
            {
                frets: [-1, 5, 7, 7, 7, 5],
                fingers: [0, 1, 2, 3, 4, 1],
                baseFret: 5,
                barres: [5],
                midi: [50, 57, 62, 66, 69]
            },
            {
                frets: [10, 12, 12, 11, 10, 10],
                fingers: [1, 3, 4, 2, 1, 1],
                baseFret: 10,
                barres: [10],
                midi: [50, 57, 62, 66, 69, 74]
            },
            {
                frets: [-1, -1, 4, 2, 3, 2],
                fingers: [0, 0, 3, 1, 2, 1],
                baseFret: 1, // Actually this is a C shape moved up 2 frets, usually baseFret would be higher if we strictly follow the box, but let's say baseFret 1 and frets are absolute
                barres: [2], // Partial barre on high E? Or just index finger. Let's model as index on 2.
                midi: [54, 57, 62, 66]
            },
            {
                frets: [-1, 9, 7, 7, 10, 10],
                fingers: [0, 2, 1, 1, 4, 4],
                baseFret: 7,
                barres: [7],
                midi: [54, 57, 62, 69, 74]
            }
        ]
    },
    {
        key: 'D',
        suffix: 'minor',
        positions: [
            {
                frets: [-1, -1, 0, 2, 3, 1],
                fingers: [0, 0, 0, 2, 3, 1],
                baseFret: 1,
                barres: [],
                midi: [50, 57, 62, 65]
            },
            {
                frets: [-1, 5, 7, 7, 6, 5],
                fingers: [0, 1, 3, 4, 2, 1],
                baseFret: 5,
                barres: [5],
                midi: [50, 57, 62, 65, 69]
            },
            {
                frets: [10, 12, 12, 10, 10, 10],
                fingers: [1, 3, 4, 1, 1, 1],
                baseFret: 10,
                barres: [10],
                midi: [50, 57, 62, 65, 69, 74]
            },
            {
                frets: [-1, -1, 3, 2, 3, 1],
                fingers: [0, 0, 3, 2, 4, 1],
                baseFret: 1,
                barres: [],
                midi: [53, 57, 62, 65]
            },
            {
                frets: [-1, 8, 7, 7, 6, -1],
                fingers: [0, 3, 2, 2, 1, 0],
                baseFret: 6,
                barres: [7], // Partial
                midi: [53, 57, 62, 65]
            }
        ]
    },
    {
        key: 'A',
        suffix: 'major',
        positions: [
            {
                frets: [-1, 0, 2, 2, 2, 0],
                fingers: [0, 0, 1, 2, 3, 0],
                baseFret: 1,
                barres: [],
                midi: [45, 52, 57, 61, 64]
            },
            {
                frets: [5, 7, 7, 6, 5, 5],
                fingers: [1, 3, 4, 2, 1, 1],
                baseFret: 5,
                barres: [5],
                midi: [45, 52, 57, 61, 64, 69]
            },
            {
                frets: [-1, -1, 7, 6, 5, 5],
                fingers: [0, 0, 3, 2, 1, 1],
                baseFret: 5,
                barres: [5],
                midi: [57, 61, 64, 69]
            },
            {
                frets: [9, 12, 11, 9, 10, 9],
                fingers: [1, 4, 3, 1, 2, 1],
                baseFret: 9,
                barres: [9],
                midi: [49, 57, 61, 64, 69, 73]
            },
            {
                frets: [-1, 12, 11, 9, 10, 9],
                fingers: [0, 4, 3, 1, 2, 1],
                baseFret: 9,
                barres: [9],
                midi: [52, 57, 61, 64, 69]
            }
        ]
    },
    {
        key: 'B',
        suffix: 'minor',
        positions: [
            {
                frets: [-1, 2, 4, 4, 3, 2],
                fingers: [0, 1, 3, 4, 2, 1],
                baseFret: 2,
                barres: [2],
                midi: [47, 54, 59, 62, 66]
            },
            {
                frets: [7, 9, 9, 7, 7, 7],
                fingers: [1, 3, 4, 1, 1, 1],
                baseFret: 7,
                barres: [7],
                midi: [47, 54, 59, 62, 66, 71]
            },
            {
                frets: [-1, -1, 9, 7, 7, 7],
                fingers: [0, 0, 3, 1, 1, 1],
                baseFret: 7,
                barres: [7],
                midi: [59, 62, 66, 71]
            }
        ]
    },
    {
        key: 'C',
        suffix: 'maj7',
        positions: [
            {
                frets: [-1, 3, 2, 0, 0, 0],
                fingers: [0, 3, 2, 0, 0, 0],
                baseFret: 1,
                barres: [],
                midi: [48, 52, 55, 59, 64]
            },
            {
                frets: [-1, 3, 5, 4, 5, 3],
                fingers: [0, 1, 3, 2, 4, 1],
                baseFret: 3,
                barres: [3],
                midi: [48, 55, 59, 64, 67]
            },
            {
                frets: [8, 10, 9, 9, 8, 8],
                fingers: [1, 3, 2, 2, 1, 1], // Simplified jazz grip
                baseFret: 8,
                barres: [8],
                midi: [48, 55, 59, 62, 64, 67]
            }
        ]
    },
    {
        key: 'E',
        suffix: '9',
        positions: [
            {
                frets: [0, 2, 2, 1, 0, 2],
                fingers: [0, 2, 3, 1, 0, 4],
                baseFret: 1,
                barres: [],
                midi: [40, 47, 52, 56, 59, 66]
            },
            {
                frets: [-1, 7, 6, 7, 7, 7],
                fingers: [0, 2, 1, 3, 3, 3], // The "Hendrix" chord shape (E7#9 is similar but this is E9)
                baseFret: 6,
                barres: [7], // Partial barre with 3rd finger
                midi: [52, 56, 62, 66, 69]
            }
        ]
    }
];
