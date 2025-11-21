
import { GoogleGenAI } from "@google/genai";

// Use the provided API key as a fallback if the environment variable is missing
const apiKey = process.env.API_KEY || 'AIzaSyAupO7EhV9sfU_n5fI0xb6vTA0sAZ2zZD4';

export const ai = new GoogleGenAI({ apiKey });
