import OpenAI from 'openai';

/**
 * Retrieves the OpenAI API key from environment variables.
 * Checks various environment sources (Node.js process, Vite import.meta).
 * 
 * @returns {string} The API key.
 */
const getApiKey = () => {
  // Safe extraction for Vite/Browser/Node environments
  if (typeof process !== 'undefined' && process.env?.OPENAI_API_KEY) return process.env.OPENAI_API_KEY;
  // @ts-expect-error - import.meta might not be defined or miss props
  if (import.meta?.env?.OPENAI_API_KEY) return import.meta.env.OPENAI_API_KEY;
  // @ts-expect-error - import.meta might not be defined
  if (import.meta?.env?.VITE_OPENAI_API_KEY) return import.meta.env.VITE_OPENAI_API_KEY;
  
  return '';
};

/**
 * The initialized OpenAI client instance.
 * Note: Using dangeriouslyAllowBrowser: true because this is a client-side only app.
 * In a production environment, requests should be proxied through a backend to hide the key.
 */
export const openai = new OpenAI({
  apiKey: getApiKey(),
  dangerouslyAllowBrowser: true
});
