import { supabase } from './supabase';
import { AI_PROVIDERS } from './ai-config';

/**
 * Generates content using the first available AI provider via Supabase Edge Function.
 * Iterates through the configured providers in order.
 */
export const generateAIContent = async (systemPrompt: string, userPrompt: string): Promise<string> => {
  const errors: string[] = [];

  for (const provider of AI_PROVIDERS) {
    try {
      console.log(`Attempting to use provider: ${provider.name}`);
      
      const { data, error } = await supabase.functions.invoke('ai-chat', {
        body: {
          systemPrompt,
          userPrompt,
          providerId: provider.id
        }
      });

      if (error) {
        throw new Error(error.message || 'Edge Function invocation failed');
      }

      if (data?.error) {
        throw new Error(data.error);
      }

      if (!data?.text) {
        throw new Error('Empty response from AI');
      }

      return data.text;

    } catch (error: any) {
      const errorMsg = error?.message || 'Unknown error';
      console.warn(`${provider.name} failed:`, errorMsg);
      errors.push(`${provider.name}: ${errorMsg}`);
      // Continue to next provider
    }
  }

  // If we get here, all providers failed
  throw new Error(`All AI providers failed.\nDetails:\n${errors.join('\n')}`);
};
