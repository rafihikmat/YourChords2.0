
import { GoogleGenAI } from "@google/genai";

const getApiKey = () => {
  // Safe extraction for Vite/Browser/Node environments
  // @ts-ignore
  if (typeof process !== 'undefined' && process.env?.API_KEY) return process.env.API_KEY;
  // @ts-ignore
  if (import.meta?.env?.API_KEY) return import.meta.env.API_KEY;
  // @ts-ignore
  if (import.meta?.env?.VITE_API_KEY) return import.meta.env.VITE_API_KEY;
  
  return 'AIzaSyAupO7EhV9sfU_n5fI0xb6vTA0sAZ2zZD4'; // Fallback/Demo
};

export const ai = new GoogleGenAI({ apiKey: getApiKey() });
