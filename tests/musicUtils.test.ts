
import { convertToChordPro, normalizeChordName, transposeChord, parseChordsFromText } from '../lib/musicUtils';
import assert from 'assert';



// Test 1: Bug Reproduction - Chords trailing after lyrics
try {
    const input = `
C       D       E
Love`;
    // C at 0, D at 8, E at 16
    // Love at 0 (length 4)
    // Expect: [C]Love    [D]       [E]

    const output = convertToChordPro(input);
    const trimmedOutput = output.trim();

    if (!trimmedOutput.includes("        [E]")) {
        throw new Error(`Expected significant spacing before [E]. Got: '${trimmedOutput}'`);
    }


} catch (e: any) {
    console.error("Test 1 Failed:", e.message);
    process.exit(1);
}

// Test 2: Standard Merge (Regression Check)
try {
    const input = `
C    G
Love You
`;
    // C at 0. G at 5.
    // Love You. (Love at 0, space at 4, You at 5).
    const output = convertToChordPro(input);
    if (!output.includes("[C]Love [G]You")) {
        throw new Error(`Expected '[C]Love [G]You'. Got: '${output}'`);
    }

} catch (e: any) {
    console.error("Test 2 Failed:", e.message);
    process.exit(1);
}

// Test 3: Chord starts after lyrics end (with gap)
try {
    const input = `
C       G
Hi`;
    // C at 0. G at 8.
    // Hi (len 2).
    // Gap 8 - 2 = 6 spaces.
    // [C]Hi      [G]

    const output = convertToChordPro(input);
    if (!output.includes("[C]Hi      [G]")) {
        throw new Error(`Expected '[C]Hi      [G]'. Got: '${output}'`);
    }

} catch (e: any) {
    console.error("Test 3 Failed:", e.message);
    process.exit(1);
}

// Test 4: normalizeChordName
try {
    assert.strictEqual(normalizeChordName('Cmin'), 'Cm', 'Cmin -> Cm');
    assert.strictEqual(normalizeChordName('Cminor'), 'Cm', 'Cminor -> Cm');
    assert.strictEqual(normalizeChordName('Dmajor'), 'D', 'Dmajor -> D');
    assert.strictEqual(normalizeChordName('Emaj'), 'Emaj7', 'Emaj -> Emaj7');
    assert.strictEqual(normalizeChordName('Fsus'), 'Fsus4', 'Fsus -> Fsus4');
    assert.strictEqual(normalizeChordName(''), '', 'Empty string -> Empty string');


} catch (e: any) {
    console.error("Test 4 Failed:", e.message);
    process.exit(1);
}

// Test 5: transposeChord
try {
    assert.strictEqual(transposeChord('C', 2), 'D', 'C + 2 -> D');
    assert.strictEqual(transposeChord('C', -1), 'B', 'C - 1 -> B');
    assert.strictEqual(transposeChord('G', 5), 'C', 'G + 5 -> C');

    // Slash Chords
    assert.strictEqual(transposeChord('C/G', 2), 'D/A', 'C/G + 2 -> D/A');
    assert.strictEqual(transposeChord('Am/G', -2), 'Gm/F', 'Am/G - 2 -> Gm/F');

    // Flat/Sharp handling
    assert.strictEqual(transposeChord('Db', 1), 'D', 'Db + 1 -> D');
    assert.strictEqual(transposeChord('C#', 1), 'D', 'C# + 1 -> D');

    // Invalid/Ignored
    assert.strictEqual(transposeChord('Hello', 2), 'Hello', 'Invalid chord returned as is');


} catch (e: any) {
    console.error("Test 5 Failed:", e.message);
    process.exit(1);
}

// Test 6: parseChordsFromText
try {
    const text = `
    This is a song.
    [C]Hello world [G]
    [Am]How are you? [Fmaj7]
    `;
    const chords = parseChordsFromText(text);

    // Check existence
    assert.ok(chords.includes('C'), 'Should extract C');
    assert.ok(chords.includes('G'), 'Should extract G');
    assert.ok(chords.includes('Am'), 'Should extract Am');
    assert.ok(chords.includes('Fmaj7'), 'Should extract Fmaj7');
    assert.strictEqual(chords.length, 4, 'Should extract exactly 4 unique chords');

    // Duplicates
    const textWithDupes = '[C] [G] [C]';
    const dupes = parseChordsFromText(textWithDupes);
    assert.strictEqual(dupes.length, 2, 'Should ignore duplicates');


} catch (e: any) {
    console.error("Test 6 Failed:", e.message);
    process.exit(1);
}
