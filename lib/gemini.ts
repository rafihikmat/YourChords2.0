
import { GoogleGenAI } from "@google/genai";

const getApiKey = () => {
  // Safe extraction for Vite/Browser/Node environments
  // @ts-expect-error - process might not be defined
  if (typeof process !== 'undefined' && process.env?.API_KEY) return process.env.API_KEY;
  // @ts-expect-error - import.meta might not be defined or miss props
  if (import.meta?.env?.API_KEY) return import.meta.env.API_KEY;
  // @ts-expect-error - import.meta might not be defined
  if (import.meta?.env?.VITE_API_KEY) return import.meta.env.VITE_API_KEY;
  
  return 'AIzaSyAupO7EhV9sfU_n5fI0xb6vTA0sAZ2zZD4'; // Fallback/Demo
};

export const ai = new GoogleGenAI({ apiKey: getApiKey() });
