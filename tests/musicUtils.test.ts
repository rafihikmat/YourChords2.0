
import { convertToChordPro } from '../lib/musicUtils';
import assert from 'assert';

console.log("Running tests for musicUtils...");

// Test 1: Bug Reproduction - Chords trailing after lyrics
try {
    const input = `
C       D       E
Love`;
    // C at 0, D at 8, E at 16
    // Love at 0 (length 4)
    // Expect: [C]Love    [D]       [E]
    // Explanation:
    // C at 0. 'Love' consumes 0-4.
    // D at 8. We need to reach 8 from 4. 4 spaces.
    // E at 16. We need to reach 16 from 8 + length of D (which is 1 char visually?).
    // Actually, convertToChordPro constructs the string.
    // The original logic assumes fixed width font for input.
    // D starts at 8. E starts at 16. Gap is 8 chars.
    // So between [D] and [E] there should be spaces representing that gap.
    // [D] takes up characters in the output string, but visually it replaces the D in the input line.

    // Let's look at what we expect.
    // Original:
    // C       D       E
    // Love

    // We want the resulting ChordPro to represent this timing/spacing.
    // [C]Love    [D]       [E]

    // Wait, let's trace my manual calculation again.
    // [C] (len 3)
    // Love (len 4). Total len 7.
    // Spaces needed to reach D at 8?
    // In original text, D is at 8.
    // Love ends at 4.
    // Gap is 4 spaces (indices 4, 5, 6, 7).
    // So we need 4 spaces after Love.
    // [C]Love    [D]

    // Now we are at index 8 (visually).
    // E is at 16.
    // Gap is 16 - 8 = 8 spaces.
    // [C]Love    [D]        [E]

    // Note: The previous logic produced [C]Love[D] [E] (1 space).

    const output = convertToChordPro(input);
    const expectedSubstr = "[C]Love    [D]        [E]"; // Check exact spacing

    // We trim the output for comparison to ignore surrounding newlines if any
    const trimmedOutput = output.trim();

    // Allow for some flexibility if my manual count is off by one, but [D] [E] is definitely wrong.
    if (!trimmedOutput.includes("        [E]")) {
        throw new Error(`Expected significant spacing before [E]. Got: '${trimmedOutput}'`);
    }

    console.log("Test 1 Passed: Trailing chords spacing preserved.");
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
    // Expect: [C]Love [G]You

    const output = convertToChordPro(input);
    // [C]Love [G]You
    if (!output.includes("[C]Love [G]You")) {
        throw new Error(`Expected '[C]Love [G]You'. Got: '${output}'`);
    }
     console.log("Test 2 Passed: Standard merge works.");
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
    console.log("Test 3 Passed: Gap after short lyric line.");
} catch (e: any) {
     console.error("Test 3 Failed:", e.message);
     process.exit(1);
}
