
import { useMemo } from 'react';
import Fuse from 'fuse.js';

/**
 * useSmartSearch Hook
 * 
 * Implements a "Smart" fuzzy search using Fuse.js.
 * 
 * Configuration (The "Smart" Logic):
 * - threshold: 0.3 (Sweet spot for typo tolerance. Allows "Sepia" -> "Sephia", blocks "Sapi" -> "Sephia")
 * - distance: 100 (How far the typo can be from the expected position)
 * - minMatchCharLength: 2 (Prevents single character noise)
 * 
 * @param data The array of objects to search through
 * @param searchTerm The user's input string
 * @param keys The keys in the object to search against (e.g., ['title', 'artist'])
 */
export function useSmartSearch<T>(data: T[], searchTerm: string, keys: string[]): T[] {
  // 1. Memoize the Fuse instance so it doesn't rebuild on every render
  // Only rebuild if the underlying data or keys change.
  const fuse = useMemo(() => {
    return new Fuse(data, {
      keys,
      threshold: 0.3, 
      distance: 100,
      minMatchCharLength: 2,
      shouldSort: true,
      ignoreLocation: true, // Search anywhere in the string
    });
  }, [data, keys]);

  // 2. Compute results
  const results = useMemo(() => {
    // If search is empty or too short, return original data (no filtering)
    if (!searchTerm || searchTerm.trim().length < 2) {
      return data;
    }

    // Return the 'item' property from Fuse results
    // Explicitly cast result item to T to avoid 'unknown' type inference issues in strict environments
    return fuse.search(searchTerm).map((result: any) => result.item as T);
  }, [fuse, searchTerm, data]);

  return results;
}
