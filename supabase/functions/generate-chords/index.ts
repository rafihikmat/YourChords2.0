
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { GoogleGenAI } from "https://esm.sh/@google/genai@0.1.1";

declare const Deno: any;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { title, artist, lyrics, images, mode } = await req.json();
    const apiKey = Deno.env.get('API_KEY') ?? '';

    if (!apiKey) {
      throw new Error('API_KEY is not set in Supabase Secrets');
    }

    const ai = new GoogleGenAI({ apiKey });
    const model = 'gemini-2.5-flash';

    let prompt = "";
    let contentParts: any[] = [];

    if (mode === 'vision_extraction' && images && Array.isArray(images) && images.length > 0) {
        // --- VISION MODE (PDF to CHORDPRO) ---
        prompt = `
          You are an expert Music Transcriber. 
          
          TASK:
          Look at the provided images of a guitar chord sheet (PDF pages).
          Transcribe them EXACTLY as they appear into a JSON structure.
          
          CRITICAL RULES FOR ACCURACY:
          1. **Structure**: Return a valid JSON object.
          2. **Alignment**: If a chord (e.g., A7) is visually located above a specific word in the image, you MUST place it immediately before that syllable in the output using brackets [A7]. 
             Example: If "A7" is above "Hello", output "[A7]Hello".
          3. **Fidelity**: Do not invent chords. Do not change the lyrics. Copy exactly what is on the page.
          4. **Headers**: Identify sections (Chorus, Verse, Intro) and put them in the "line" text, but ensure chords are empty for those lines.
          5. **Metadata**: Extract the Title and Artist from the top of the first page if visible.
          6. **Cleaning**: Ignore "Page 1/3", "Copyright", or website URLs at the bottom. Focus on the song content.

          OUTPUT JSON FORMAT:
          {
            "title": "Extracted Title",
            "artist": "Extracted Artist",
            "difficulty": "Medium",
            "chords": [
              { "line": "[Bm]Full lyric line with [A]merged chords...", "chords": ["Bm", "A"] },
              { "line": "[Chorus]", "chords": [] }
            ]
          }
        `;

        // Add images to payload using proper SDK structure
        images.forEach((base64: string) => {
            contentParts.push({ 
                inlineData: { 
                    mimeType: 'image/jpeg', 
                    data: base64 
                } 
            });
        });
        contentParts.push({ text: prompt });

    } else {
        // --- TEXT GENERATION MODE (Lyrics to Chords) ---
        prompt = `
          You are a music theory expert.
          Analyze the song "${title}" by "${artist}".
          
          Rules:
          1. Place chords at the START of phrases or words where harmonic change occurs.
          2. Match the emotion.
          3. Output JSON.

          Lyrics:
          ${lyrics}

          Output Format:
          {
            "title": "${title}",
            "artist": "${artist}",
            "difficulty": "Medium",
            "chords": [
              { "line": "Lyric line...", "chords": ["C", "G"] }
            ]
          }
        `;
        contentParts.push({ text: prompt });
    }

    const response = await ai.models.generateContent({
      model: model,
      contents: { parts: contentParts },
    });

    const text = response.text || "{}";
    // Clean markdown code blocks if present (```json ... ```)
    const cleanJson = text.replace(/^```json\s*/, '').replace(/\s*```$/, '').trim();
    
    let chordData;
    try {
        chordData = JSON.parse(cleanJson);
    } catch (e) {
        console.error("AI JSON Parse Error", cleanJson);
        throw new Error("AI returned invalid format. Please try again.");
    }

    return new Response(JSON.stringify(chordData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error("Edge Function Error:", error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
