
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { GoogleGenAI } from "https://esm.sh/@google/genai@0.1.1";

declare const Deno: any;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight request
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { title, artist, lyrics } = await req.json();
    const apiKey = Deno.env.get('API_KEY') ?? ''; // Get from Supabase Secrets

    if (!apiKey) {
      throw new Error('API_KEY is not set in Supabase Secrets');
    }

    const ai = new GoogleGenAI({ apiKey });
    
    const prompt = `
      Analyze the song "${title}" by "${artist}".
      Lyrics:
      ${lyrics}

      Task:
      1. Identify the key and difficulty.
      2. Place chords precisely over the lyrics.
      3. Return ONLY a valid JSON object with this structure:
      {
        "title": "${title}",
        "artist": "${artist}",
        "difficulty": "Easy|Medium|Hard|Expert",
        "chords": [
          { "line": "Verse 1", "chords": [] },
          { "line": "I'm walking down the street", "chords": ["C", "Am"] } 
        ]
      }
      Do not include markdown formatting like \`\`\`json. Just the raw JSON.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    const text = response.text || "{}";
    // Clean up any potential markdown code blocks if the model ignores instructions
    const cleanJson = text.replace(/```json|```/g, '').trim();
    const chordData = JSON.parse(cleanJson);

    return new Response(JSON.stringify(chordData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
