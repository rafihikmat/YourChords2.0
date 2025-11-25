
import { ChordAdapter } from '../lib/chordService';
import assert from 'assert';



// Test 1: Standard Major Chord
try {
    const fingering = ChordAdapter.getExternalChord('C');
    // chords-db C Major: x32010
    assert.deepStrictEqual(fingering, [-1, 3, 2, 0, 1, 0], 'C Major fingering incorrect');

} catch (e: any) {
    console.error("Test 1 Failed:", e.message);
    process.exit(1);
}

// Test 2: Standard Minor Chord
try {
    const fingering = ChordAdapter.getExternalChord('Am');
    // chords-db Am: x02210
    assert.deepStrictEqual(fingering, [-1, 0, 2, 2, 1, 0], 'Am fingering incorrect');

} catch (e: any) {
    console.error("Test 2 Failed:", e.message);
    process.exit(1);
}

// Test 3: Enharmonic Equivalents (C# vs Db)
try {
    const cSharp = ChordAdapter.getExternalChord('C#');
    const dFlat = ChordAdapter.getExternalChord('Db');

    assert.notStrictEqual(cSharp, null, 'C# should be found');
    assert.notStrictEqual(dFlat, null, 'Db should be found');
    assert.deepStrictEqual(cSharp, dFlat, 'C# and Db should have same fingering');

    // chords-db C# Major: x43121 (C shape moved up) or x46664?
    // My manual test showed [-1, 4, 3, 1, 2, 1]
    assert.deepStrictEqual(cSharp, [-1, 4, 3, 1, 2, 1], 'C# fingering matches DB');


} catch (e: any) {
    console.error("Test 3 Failed:", e.message);
    process.exit(1);
}

// Test 4: Slash Chords (G/A)
try {
    const gOverA = ChordAdapter.getExternalChord('G/A');
    assert.notStrictEqual(gOverA, null, 'G/A should be found (or fallback)');

} catch (e: any) {
    console.error("Test 4 Failed:", e.message);
    process.exit(1);
}

// Test 4b: Minor Slash Chord (Cm/G)
try {
    // Cm/G should NOT fall back to Cm if it exists in DB.
    // Cm: [-1, 3, 1, 0, 1, 3] (based on previous run)
    // Cm/G: Should have 3 in bass (index 0 for string E) or similar.

    const cmOverG = ChordAdapter.getExternalChord('Cm/G');
    const cm = ChordAdapter.getExternalChord('Cm');

    assert.notStrictEqual(cmOverG, null, 'Cm/G should be found');
    assert.notDeepStrictEqual(cmOverG, cm, 'Cm/G should differ from Cm (fingering)');

    // Check if bass note is G (3rd fret on E string)
    // cmOverG is likely [3, 3, 5, 5, 4, 3] or similar.
    if (cmOverG) {
        // Assert bass note is 3
        assert.strictEqual(cmOverG[0], 3, 'Cm/G should have G (3rd fret) in bass');
    }


} catch (e: any) {
    console.error("Test 4b Failed:", e.message);
    process.exit(1);
}


// Test 5: Normalization (min -> m)
try {
    const cMin = ChordAdapter.getExternalChord('Cmin');
    const cM = ChordAdapter.getExternalChord('Cm');
    assert.deepStrictEqual(cMin, cM, 'Cmin should match Cm');

} catch (e: any) {
    console.error("Test 5 Failed:", e.message);
    process.exit(1);
}

// Test 6: Fallback Logic
try {
    // Cm11 -> Cm (if not in DB)
    const cm11 = ChordAdapter.getExternalChord('Cm11');
    assert.notStrictEqual(cm11, null, 'Cm11 should return result');

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


} catch (e: any) {
    console.error("Test 7 Failed:", e.message);
    process.exit(1);
}
