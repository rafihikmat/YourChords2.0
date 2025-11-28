import OpenAI from 'openai';
import { GoogleGenAI } from "@google/genai";
import { AI_PROVIDERS } from './ai-config';

/**
 * Helper to get API key from environment
 */
const getApiKey = (envVarName: string): string | undefined => {
  // Check Vite (import.meta.env)
  // @ts-ignore - Safe access for Vite environment
  if (typeof import.meta !== 'undefined' && import.meta.env) {
    // @ts-ignore - Dynamic access
    return import.meta.env[envVarName];
  }
  
  // Check Node.js (process.env)
  // @ts-ignore - Safe access for Node environment
  if (typeof process !== 'undefined' && process.env) {
    return process.env[envVarName];
  }

  return undefined;
};

/**
 * Generates content using the first available AI provider.
 * Iterates through the configured providers in order.
 */
export const generateAIContent = async (systemPrompt: string, userPrompt: string): Promise<string> => {
  const errors: string[] = [];

  for (const provider of AI_PROVIDERS) {
    const apiKey = getApiKey(provider.apiKeyEnv);
    
    if (!apiKey) {
      continue;
    }

    try {
      
      if (provider.type === 'openai') {
        const baseURL = provider.baseURL?.startsWith('/') 
          ? `${window.location.origin}${provider.baseURL}`
          : provider.baseURL;

        const client = new OpenAI({
          apiKey: apiKey,
          baseURL: baseURL,
          dangerouslyAllowBrowser: true,
          defaultHeaders: {
            'Authorization': `Bearer ${apiKey}`
          },
          timeout: 10000 // 10s timeout
        });

        const response = await client.chat.completions.create({
          model: provider.model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ]
        });

        const text = response.choices[0]?.message?.content;
        if (!text) throw new Error('Empty response');
        
        return text;

      } else if (provider.type === 'gemini') {
        try {
            const client = new GoogleGenAI({ apiKey });
            
            // Create a timeout promise
            const timeoutPromise = new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Request timed out')), 10000)
            );

            const apiCall = client.models.generateContent({
                model: provider.model,
                contents: [{
                    role: 'user',
                    parts: [{ text: `${systemPrompt}\n\n${userPrompt}` }]
                }]
            });

            // Race between API call and timeout
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const response: any = await Promise.race([apiCall, timeoutPromise]);

            // SDK type handling
            const text = typeof response.text === 'function' ? response.text() : 
                        response.candidates?.[0]?.content?.parts?.[0]?.text;

            if (!text) throw new Error('Empty response');
            
            return text;
        } catch (geminiInternalError: any) {
             throw geminiInternalError;
        }
      }

    } catch (error: any) {
      const errorMsg = error?.message || 'Unknown error';
      errors.push(`${provider.name}: ${errorMsg}`);
      // Continue to next provider
    }
  }

  // If we get here, all providers failed
  throw new Error(`All AI providers failed.\nDetails:\n${errors.join('\n')}`);
};
