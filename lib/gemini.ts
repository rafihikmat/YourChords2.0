
import { GoogleGenAI } from "@google/genai";

/**
 * Retrieves the Google Gemini API key from environment variables.
 * Checks various environment sources (Node.js process, Vite import.meta).
 * Falls back to a demo key if no key is found.
 *
 * @returns {string} The API key.
 */
const getApiKey = () => {
  // Safe extraction for Vite/Browser/Node environments
  if (typeof process !== 'undefined' && process.env?.API_KEY) return process.env.API_KEY;
  // @ts-expect-error - import.meta might not be defined or miss props
  if (import.meta?.env?.API_KEY) return import.meta.env.API_KEY;
  // @ts-expect-error - import.meta might not be defined
  if (import.meta?.env?.VITE_API_KEY) return import.meta.env.VITE_API_KEY;
  
  return 'AIzaSyAupO7EhV9sfU_n5fI0xb6vTA0sAZ2zZD4'; // Fallback/Demo
};

/**
 * The initialized Google GenAI client instance.
 * Usage: `ai.models.generateContent(...)`
 */
export const ai = new GoogleGenAI({ apiKey: getApiKey() });
