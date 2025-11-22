
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

export const DIFFICULTY_COLORS: Record<string, string> = {
  Easy: "text-green-600 dark:text-green-400 bg-green-500/10 border-green-500/20",
  Medium: "text-yellow-600 dark:text-yellow-400 bg-yellow-500/10 border-yellow-500/20",
  Hard: "text-orange-600 dark:text-orange-400 bg-orange-500/10 border-orange-500/20",
  Expert: "text-red-600 dark:text-red-400 bg-red-500/10 border-red-500/20",
};

export function fuzzySearch<T>(items: T[], query: string, keys: (keyof T)[]): T[] {
  if (!query) return items;
  const lowerQuery = query.toLowerCase();
  return items.filter(item => keys.some(key => String(item[key]).toLowerCase().includes(lowerQuery)));
}

export const blobToBase64 = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => typeof reader.result === 'string' ? resolve(reader.result.split(',')[1]) : reject(new Error('Blob conversion failed'));
    reader.readAsDataURL(blob);
  });
};

export const formatTime = (sec: number) => {
  if (isNaN(sec)) return "0:00";
  const minutes = Math.floor(sec / 60);
  const seconds = Math.floor(sec % 60);
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};

export const calculateStrength = (pwd: string) => {
    let score = 0;
    if (pwd.length > 7) score++;
    if (/[A-Z]/.test(pwd)) score++;
    if (/\d/.test(pwd)) score++;
    if (/[^A-Za-z0-9]/.test(pwd)) score++;
    return score;
};
