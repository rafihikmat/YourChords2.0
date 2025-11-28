import { ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Combines multiple class names into a single string, handling conflicts and merging appropriately.
 * Uses `clsx` for conditional class joining and `tailwind-merge` to handle Tailwind CSS class conflicts.
 *
 * @param {...ClassValue[]} inputs - The class names or objects to combine.
 * @returns {string} The merged class string.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * SVG string for a dot grid pattern, used for background styling.
 */
export const DOT_GRID_SVG = `
<svg width="20" height="20" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
    <circle cx="1" cy="1" r="1" fill="rgba(255, 255, 255, 0.05)"/>
</svg>
`;

/**
 * Maps difficulty levels to their corresponding Tailwind CSS color classes.
 * Includes text, background, and border colors for light and dark modes.
 */
export const DIFFICULTY_COLORS: Record<string, string> = {
  Easy: "text-green-600 dark:text-green-400 bg-green-500/10 border-green-500/20",
  Medium: "text-yellow-600 dark:text-yellow-400 bg-yellow-500/10 border-yellow-500/20",
  Hard: "text-orange-600 dark:text-orange-400 bg-orange-500/10 border-orange-500/20",
  Expert: "text-red-600 dark:text-red-400 bg-red-500/10 border-red-500/20",
};

/**
 * Maps a Song object to a SearchResult.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const mapSongToResult = (s: any) => ({
    id: s.id,
    title: s.title,
    artist: s.artist,
    source: 'library' as const,
    url: `/song/${s.id}`
});

/**
 * Maps an Album object to a SearchResult.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const mapAlbumToResult = (a: any) => ({
    id: a.id,
    title: a.title,
    artist: a.artist,
    thumbnail: a.cover_url,
    source: 'library' as const,
    url: `#album-${a.id}`
});

/**
 * Maps a Video object to a SearchResult.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const mapVideoToResult = (v: any) => ({
    id: v.video_id,
    title: v.title,
    artist: v.channel_title,
    thumbnail: v.thumbnail_url,
    source: 'youtube' as const,
    url: `https://www.youtube.com/watch?v=${v.video_id}`
});

/**
 * Converts a Blob object to a Base64 string.
 * Useful for handling file uploads or data URIs.
 *
 * @param {Blob} blob - The Blob to convert.
 * @returns {Promise<string>} A promise that resolves to the Base64 string (without the data URL prefix).
 */
export const blobToBase64 = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => typeof reader.result === 'string' ? resolve(reader.result.split(',')[1]) : reject(new Error('Blob conversion failed'));
    reader.readAsDataURL(blob);
  });
};

/**
 * Formats a duration in seconds into a "MM:SS" string.
 *
 * @param {number} sec - The time in seconds.
 * @returns {string} The formatted time string (e.g., "1:30").
 */
export const formatTime = (sec: number) => {
  if (isNaN(sec)) return "0:00";
  const minutes = Math.floor(sec / 60);
  const seconds = Math.floor(sec % 60);
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};

/**
 * Calculates the strength of a password based on length and character variety.
 *
 * @param {string} pwd - The password to evaluate.
 * @returns {number} A score from 0 to 4.
 *   - +1 for length > 7
 *   - +1 for containing an uppercase letter
 *   - +1 for containing a number
 *   - +1 for containing a special character
 */
export const calculateStrength = (pwd: string) => {
    let score = 0;
    if (pwd.length > 5) score++; // Easier length requirement
    if (pwd.length > 7) score++; // Bonus for standard length
    if (/[A-Z]/.test(pwd) || /\d/.test(pwd)) score++; // Mixed content (easier)
    if (/[^A-Za-z0-9]/.test(pwd)) score++; // Special char bonus
    return score;
};
