
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

export function fuzzySearch<T>(items: T[], query: string, keys: (keyof T)[]): T[] {
  if (!query) return items;
  const lowerQuery = query.toLowerCase();
  
  return items.filter(item => {
    return keys.some(key => {
      const value = String(item[key]).toLowerCase();
      if (value === lowerQuery) return true;
      if (value.includes(lowerQuery)) return true;
      
      let queryIdx = 0;
      let valueIdx = 0;
      while (queryIdx < lowerQuery.length && valueIdx < value.length) {
        if (lowerQuery[queryIdx] === value[valueIdx]) queryIdx++;
        valueIdx++;
      }
      return queryIdx === lowerQuery.length;
    });
  });
}

// --- Merged Logic: Shared Constants & Helpers ---

export const DIFFICULTY_COLORS: Record<string, string> = {
  Easy: "text-green-600 dark:text-green-400 bg-green-500/10 border-green-500/20",
  Medium: "text-yellow-600 dark:text-yellow-400 bg-yellow-500/10 border-yellow-500/20",
  Hard: "text-orange-600 dark:text-orange-400 bg-orange-500/10 border-orange-500/20",
  Expert: "text-red-600 dark:text-red-400 bg-red-500/10 border-red-500/20",
};

export const blobToBase64 = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === 'string') resolve(reader.result.split(',')[1]);
      else reject(new Error('Failed to convert blob to base64'));
    };
    reader.readAsDataURL(blob);
  });
};

export const formatTime = (sec: number) => {
  if (isNaN(sec)) return "0:00";
  const minutes = Math.floor(sec / 60);
  const seconds = Math.floor(sec % 60);
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};
