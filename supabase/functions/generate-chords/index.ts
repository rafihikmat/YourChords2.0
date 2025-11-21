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
    const { title, artist, lyrics } = await req.json();
    const apiKey = Deno.env.get('API_KEY') ?? '';

    if (!apiKey) {
      throw new Error('API_KEY is not set in Supabase Secrets');
    }

    const ai = new GoogleGenAI({ apiKey });
    
    // Extracted "Music Theory Expert" persona from legacy format-chords-ai
    const prompt = `
      You are a music theory expert and professional transcriber.
      
      Your Task: Analyze the song "${title}" by "${artist}" and the provided lyrics.
      
      Rules for Chord Placement:
      1. Place chords at the START of phrases or words where the harmonic change occurs.
      2. Follow standard progression patterns (I-V-vi-IV, ii-V-I, etc.) matching the song's emotion.
      3. Use common guitar chords: C, G, Am, F, Em, Dm, D, A, E, Bm.
      4. Include extensions (maj7, m7, sus4) ONLY if essential to the song's character.
      5. Match the chord progression to the emotional tone of the lyrics.
      
      Lyrics:
      ${lyrics}

      Output Requirement:
      Return ONLY a valid JSON object with this exact structure (no markdown):
      {
        "title": "${title}",
        "artist": "${artist}",
        "difficulty": "Easy|Medium|Hard|Expert",
        "chords": [
          { "line": "[Header or Lyric Line]", "chords": ["Chord1", "Chord2"] }
        ]
      }
      
      Note: 
      - If a line is a header (like [Chorus]), 'chords' should be empty.
      - If a line has lyrics, 'chords' should be an array of chords played in that line, in order.
      - Use 'chords': [] if no chords are played on that line.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    const text = response.text || "{}";
    const cleanJson = text.replace(/```json|```/g, '').trim();
    let chordData;
    
    try {
        chordData = JSON.parse(cleanJson);
    } catch (e) {
        // Fallback or error handling for malformed JSON
        console.error("AI returned malformed JSON", cleanJson);
        throw new Error("Failed to parse AI response");
    }

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