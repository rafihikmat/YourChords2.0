
import { ChordAdapter } from '../lib/chordService';
import assert from 'assert';

console.log("Running tests for chordService...");

// Test 1: Standard Major Chord
try {
    const fingering = ChordAdapter.getExternalChord('C');
    assert.deepStrictEqual(fingering, [-1, 3, 2, 0, 1, 0], 'C Major fingering incorrect');
    console.log("Test 1 Passed: C Major retrieval.");
} catch (e: any) {
    console.error("Test 1 Failed:", e.message);
    process.exit(1);
}

// Test 2: Standard Minor Chord
try {
    const fingering = ChordAdapter.getExternalChord('Am');
    assert.deepStrictEqual(fingering, [-1, 0, 2, 2, 1, 0], 'Am fingering incorrect');
    console.log("Test 2 Passed: Am retrieval.");
} catch (e: any) {
    console.error("Test 2 Failed:", e.message);
    process.exit(1);
}

// Test 3: Enharmonic Equivalents (C# vs Db)
try {
    const cSharp = ChordAdapter.getExternalChord('C#');
    const dFlat = ChordAdapter.getExternalChord('Db');
    assert.deepStrictEqual(cSharp, dFlat, 'C# and Db should have same fingering');
    // C# major in DB: x46664 -> [-1, 4, 6, 6, 6, 4]
    assert.deepStrictEqual(cSharp, [-1, 4, 6, 6, 6, 4], 'C# fingering incorrect');
    console.log("Test 3 Passed: Enharmonic equivalents.");
} catch (e: any) {
    console.error("Test 3 Failed:", e.message);
    process.exit(1);
}

// Test 4: Slash Chords (G/A -> G)
try {
    // The service currently splits by slash and takes the first part.
    // So G/A becomes G.
    const gOverA = ChordAdapter.getExternalChord('G/A');
    const g = ChordAdapter.getExternalChord('G');
    assert.deepStrictEqual(gOverA, g, 'Slash chord should be simplified to root chord');
    console.log("Test 4 Passed: Slash chord simplification.");
} catch (e: any) {
    console.error("Test 4 Failed:", e.message);
    process.exit(1);
}

// Test 5: Normalization (min -> m)
try {
    const cMin = ChordAdapter.getExternalChord('Cmin');
    const cM = ChordAdapter.getExternalChord('Cm');
    assert.deepStrictEqual(cMin, cM, 'Cmin should match Cm');
    console.log("Test 5 Passed: Suffix normalization.");
} catch (e: any) {
    console.error("Test 5 Failed:", e.message);
    process.exit(1);
}

// Test 6: Fallback Logic (Unknown extension but known root/quality)
try {
    // Cm11 is not in DB. Should fallback to Cm or Cm7 if implemented?
    // Code says: if mappedSuffix startsWith 'm' and rootData['minor'] exists -> return minor
    const cm11 = ChordAdapter.getExternalChord('Cm11');
    const cm = ChordAdapter.getExternalChord('Cm');

    assert.deepStrictEqual(cm11, cm, 'Cm11 should fallback to Cm');
    console.log("Test 6 Passed: Fallback logic (Minor).");

    // C69 not in DB. mappedSuffix '69' doesn't match keys.
    // Fallback: rootData['major']
    const c69 = ChordAdapter.getExternalChord('C69');
    const c = ChordAdapter.getExternalChord('C');
    assert.deepStrictEqual(c69, c, 'C69 should fallback to C Major');
    console.log("Test 6 Passed: Fallback logic (Major).");

} catch (e: any) {
    console.error("Test 6 Failed:", e.message);
    process.exit(1);
}

// Test 7: Invalid/Unknown Chords
try {
    const invalid = ChordAdapter.getExternalChord('H');
    assert.strictEqual(invalid, null, 'H chord should return null');

    const invalid2 = ChordAdapter.getExternalChord('');
    assert.strictEqual(invalid2, null, 'Empty string should return null');

    console.log("Test 7 Passed: Invalid input handling.");
} catch (e: any) {
    console.error("Test 7 Failed:", e.message);
    process.exit(1);
}
