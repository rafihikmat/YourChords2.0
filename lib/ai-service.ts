import OpenAI from 'openai';
import { GoogleGenAI } from "@google/genai";
import { AI_PROVIDERS, AIProviderConfig } from './ai-config';

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
      console.warn(`Skipping ${provider.name}: No API Key found in ${provider.apiKeyEnv}`);
      continue;
    }

    try {
      console.log(`Attempting to generate content using ${provider.name}...`);
      
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
          }
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
        
        console.log(`Success! Generated content with ${provider.name}`);
        return text;

      } else if (provider.type === 'gemini') {
        // Use the new @google/genai SDK syntax
        try {
            const client = new GoogleGenAI({ apiKey });
            
            // The new SDK uses client.models.generateContent
            // If this fails with "is not a function", it means the SDK version might be different than expected
            // or the import is resolving to the old SDK.
            const response = await client.models.generateContent({
                model: provider.model,
                contents: [{
                    role: 'user',
                    parts: [{ text: `${systemPrompt}\n\n${userPrompt}` }]
                }]
            });

            // @ts-expect-error - SDK type handling for text() helper or direct access
            const text = typeof response.text === 'function' ? response.text() : 
                        response.candidates?.[0]?.content?.parts?.[0]?.text;

            if (!text) throw new Error('Empty response');
            
            console.log(`Success! Generated content with ${provider.name}`);
            return text;
        } catch (geminiInternalError: any) {
             console.error("Gemini SDK Internal Error:", geminiInternalError);
             throw geminiInternalError;
        }
      }

    } catch (error: any) {
      const errorMsg = error?.message || 'Unknown error';
      console.warn(`Failed to generate with ${provider.name}:`, errorMsg);
      errors.push(`${provider.name}: ${errorMsg}`);
      // Continue to next provider
    }
  }

  // If we get here, all providers failed
  throw new Error(`All AI providers failed.\nDetails:\n${errors.join('\n')}`);
};
