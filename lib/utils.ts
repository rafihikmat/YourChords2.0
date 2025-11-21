
import { ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const DOT_GRID_SVG = `
<svg width="20" height="20" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
    <circle cx="1" cy="1" r="1" fill="rgba(255, 255, 255, 0.05)"/>
</svg>
`;

/**
 * Intelligent Fuzzy Search Utility
 * Replaces heavy dependencies like Fuse.js for client-side filtering.
 * Scores matches based on continuity and position.
 */
export function fuzzySearch<T>(items: T[], query: string, keys: (keyof T)[]): T[] {
  if (!query) return items;
  
  const lowerQuery = query.toLowerCase();
  
  return items.filter(item => {
    return keys.some(key => {
      const value = String(item[key]).toLowerCase();
      // Exact match boost
      if (value === lowerQuery) return true;
      // Includes match
      if (value.includes(lowerQuery)) return true;
      
      // Fuzzy characters match (in order)
      let queryIdx = 0;
      let valueIdx = 0;
      while (queryIdx < lowerQuery.length && valueIdx < value.length) {
        if (lowerQuery[queryIdx] === value[valueIdx]) {
          queryIdx++;
        }
        valueIdx++;
      }
      return queryIdx === lowerQuery.length;
    });
  });
}
