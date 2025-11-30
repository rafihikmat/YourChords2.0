// deno-lint-ignore-file
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { systemPrompt, userPrompt, providerId } = await req.json();

    let responseText = '';

    // 1. Google Gemini
    if (providerId === 'gemini') {
      const apiKey = Deno.env.get('GEMINI_API_KEY');
      if (!apiKey) throw new Error('GEMINI_API_KEY not set');

      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;
      
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            role: 'user',
            parts: [{ text: `${systemPrompt}\n\n${userPrompt}` }]
          }]
        })
      });

      const data = await response.json();
      if (data.error) throw new Error(data.error.message);
      
      responseText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    } 
    
    // 2. OpenAI Compatible Providers (OpenAI, DeepSeek, Kimi, MiniMax, OpenRouter)
    else {
      let apiKey = '';
      let baseURL = '';
      let model = '';

      switch (providerId) {
        case 'openai':
          apiKey = Deno.env.get('OPENAI_API_KEY') ?? '';
          baseURL = 'https://api.openai.com/v1';
          model = 'gpt-4o-mini';
          break;
        case 'deepseek':
          apiKey = Deno.env.get('DEEPSEEK_API_KEY') ?? '';
          baseURL = 'https://api.deepseek.com';
          model = 'deepseek-chat';
          break;
        case 'kimi':
          apiKey = Deno.env.get('KIMI_API_KEY') ?? '';
          baseURL = 'https://api.moonshot.cn/v1'; // Direct URL, no proxy needed in backend
          model = 'moonshot-v1-8k';
          break;
        case 'minimax':
          apiKey = Deno.env.get('MINIMAX_API_KEY') ?? '';
          baseURL = 'https://api.minimax.chat/v1'; // Verify this URL if possible, but standard OpenAI compatible usually follows this
          model = 'abab5.5-chat';
          break;
        case 'openrouter':
          apiKey = Deno.env.get('OPENROUTER_API_KEY') ?? '';
          baseURL = 'https://openrouter.ai/api/v1';
          model = 'openai/gpt-3.5-turbo';
          break;
        default:
          throw new Error(`Unknown provider: ${providerId}`);
      }

      if (!apiKey) throw new Error(`${providerId.toUpperCase()}_API_KEY not set`);

      // Special handling for MiniMax if it's not standard OpenAI (it often is, but let's stick to standard fetch)
      // For Kimi/Moonshot, the URL is https://api.moonshot.cn/v1
      
      const response = await fetch(`${baseURL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ]
        })
      });

      const data = await response.json();
      if (data.error) throw new Error(data.error.message || JSON.stringify(data.error));

      responseText = data.choices?.[0]?.message?.content || '';
    }

    if (!responseText) throw new Error('Empty response from AI provider');

    return new Response(JSON.stringify({ text: responseText }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  // deno-lint-ignore no-explicit-any
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message || 'Unknown error' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
