
import { cn, fuzzySearch, formatTime, calculateStrength } from '../lib/utils';
import assert from 'assert';

console.log("Running tests for utils...");

// Test 1: cn (Class merging)
try {
    const result = cn('text-red-500', 'bg-blue-500', { 'p-4': true, 'm-2': false });
    // 'text-red-500 bg-blue-500 p-4'
    // Order might vary depending on internal implementation but tailwind-merge handles conflict resolution.
    // If we have conflicting classes:
    const conflict = cn('p-2', 'p-4');
    assert.strictEqual(conflict, 'p-4', 'Should resolve conflict to last class');

    assert.ok(result.includes('text-red-500'), 'Should include text-red-500');
    assert.ok(result.includes('p-4'), 'Should include p-4');
    assert.ok(!result.includes('m-2'), 'Should not include m-2');

    console.log("Test 1 Passed: Class merging.");
} catch (e: any) {
    console.error("Test 1 Failed:", e.message);
    process.exit(1);
}

// Test 2: fuzzySearch
try {
    const data = [
        { id: 1, title: 'Amazing Grace', artist: 'John Newton' },
        { id: 2, title: 'Wonderwall', artist: 'Oasis' },
        { id: 3, title: 'Grace', artist: 'Jeff Buckley' }
    ];

    const results = fuzzySearch(data, 'Grace', ['title', 'artist']);
    assert.strictEqual(results.length, 2, 'Should find 2 items with "Grace"');

    const artistSearch = fuzzySearch(data, 'Oasis', ['artist']);
    assert.strictEqual(artistSearch.length, 1, 'Should find 1 item with "Oasis"');
    assert.strictEqual(artistSearch[0].title, 'Wonderwall');

    const noMatch = fuzzySearch(data, 'Metallica', ['title']);
    assert.strictEqual(noMatch.length, 0, 'Should find 0 items');

    console.log("Test 2 Passed: Fuzzy search.");
} catch (e: any) {
    console.error("Test 2 Failed:", e.message);
    process.exit(1);
}

// Test 3: formatTime
try {
    assert.strictEqual(formatTime(65), '1:05', '65s should be 1:05');
    assert.strictEqual(formatTime(125), '2:05', '125s should be 2:05');
    assert.strictEqual(formatTime(9), '0:09', '9s should be 0:09');
    assert.strictEqual(formatTime(0), '0:00', '0s should be 0:00');
    assert.strictEqual(formatTime(NaN), '0:00', 'NaN should be 0:00');

    console.log("Test 3 Passed: Time formatting.");
} catch (e: any) {
    console.error("Test 3 Failed:", e.message);
    process.exit(1);
}

// Test 4: calculateStrength
try {
    // Rules: >7 chars, uppercase, digit, special char. Each +1.

    assert.strictEqual(calculateStrength('abc'), 0, 'Weak password should be 0');

    const len8 = 'abcdefgh';
    assert.strictEqual(calculateStrength(len8), 1, 'Length > 7 gives 1 point');

    const withCap = 'Abcdefgh';
    assert.strictEqual(calculateStrength(withCap), 2, 'Length + Cap gives 2 points');

    const withDigit = 'Abcdefg1';
    assert.strictEqual(calculateStrength(withDigit), 3, 'Length + Cap + Digit gives 3 points');

    const strong = 'Abcdefg1!';
    assert.strictEqual(calculateStrength(strong), 4, 'All criteria gives 4 points');

    console.log("Test 4 Passed: Password strength.");
} catch (e: any) {
    console.error("Test 4 Failed:", e.message);
    process.exit(1);
}
