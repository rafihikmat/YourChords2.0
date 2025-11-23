
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
    // Input can be standard (lyrics), vision (images), or text extraction (raw pdf text)
    const { title, artist, lyrics, images, text, mode } = await req.json();
    const apiKey = Deno.env.get('API_KEY') ?? '';

    if (!apiKey) {
      throw new Error('API_KEY is not set in Supabase Secrets');
    }

    const ai = new GoogleGenAI({ apiKey });
    // Default text model
    const model = 'gemini-1.5-flash';

    let prompt = "";
    let contentParts: any[] = [];

    // --- MODE 1: TEXT EXTRACTION (Raw PDF Text -> Structured ChordPro) ---
    if (mode === 'text_extraction' && text) {
      prompt = `
          You are an expert music transcriber and data cleaner.
          
          I will give you RAW TEXT extracted from a music PDF. 
          The text preserves VISUAL SPACING (horizontal gaps).
          
          YOUR TASKS:
          1. **Metadata**: Identify Title and Artist. If unclear, use "Unknown".
          2. **Strict Alignment**: 
             - Detect lines that contain chords (e.g. "G     C     D").
             - Detect lines that are lyrics (e.g. "Hello world today").
             - If a chord line is visually positioned above a lyric line, MERGE them into ChordPro format.
             - Use the whitespace/padding to align the chord exactly [Ch] before the corresponding syllable/word.
             - Example Input:
               Am      F
               Hello   World
             - Example Output:
               [Am]Hello   [F]World
          3. **Chord Normalization (CRITICAL)**:
             - Convert 'A+' -> 'Aaug'
             - Convert 'M' suffix (e.g. CM7, CM) -> 'maj7' or 'maj' (e.g. Cmaj7)
             - Convert 'min' -> 'm'
             - Standardize separators: use slash for bass notes (D/F#).
          4. **Cleanup**: 
             - REMOVE lines containing: "Tuning:", "Key:", "Capo:", "Strumming:", "Page X of Y", copyright info.
             - Ignore tab numbers (e.g. |-3-2-1-|). Focus on Chords + Lyrics.
          
          OUTPUT JSON FORMAT:
          {
            "title": "Song Title",
            "artist": "Artist Name",
            "difficulty": "Medium",
            "chords": [
              { "line": "[Am]Full lyric line with [F]chords embedded...", "chords": ["Am", "F"] },
              { "line": "[Chorus]", "chords": [] }
            ]
          }

          RAW TEXT INPUT:
          ${text.substring(0, 30000)} 
        `;
      // Limit text length to prevent context window overflow, though 2.5 flash handles ~1M tokens.
      contentParts.push({ text: prompt });
    }
    // --- MODE 2: VISION (Images -> ChordPro) ---
    else if (mode === 'vision_extraction' && images && Array.isArray(images) && images.length > 0) {
      prompt = `
          You are an expert Music Transcriber. Look at the provided images of a guitar chord sheet.
          Transcribe them EXACTLY as they appear into a JSON structure.
          
          CRITICAL RULES:
          1. **Alignment**: If a chord (e.g., A7) is visually located above a word, output it as [A7]Word.
          2. **Fidelity**: Copy lyrics exactly.
          3. **Headers**: Identify [Chorus], [Verse] etc.
          4. **Metadata**: Extract Title/Artist from top.

          OUTPUT JSON FORMAT:
          {
            "title": "Extracted Title",
            "artist": "Extracted Artist",
            "difficulty": "Medium",
            "chords": [
              { "line": "[Bm]Full lyric line...", "chords": ["Bm"] }
            ]
          }
        `;

      images.forEach((base64: string) => {
        contentParts.push({
          inlineData: {
            mimeType: 'image/jpeg',
            data: base64
          }
        });
      });
      contentParts.push({ text: prompt });
    }
    // --- MODE 3: STANDARD GENERATION (Lyrics -> AI Composed Chords) ---
    else {
      prompt = `
          You are a music theory expert.
          Analyze the song "${title}" by "${artist}".
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

    const textResponse = response.text || "{}";
    const cleanJson = textResponse.replace(/^```json\s*/, '').replace(/\s*```$/, '').trim();

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
