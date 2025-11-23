import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import * as cheerio from "https://esm.sh/cheerio@1.0.0-rc.12";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Regex to identify a chord line (heuristic: mostly chords and spaces)
// Matches standard chords: C, C#m, Bb7, F#m7b5, G/B, etc.
const CHORD_REGEX = /\b[A-G][#b]?(?:m|maj|min|dim|aug|sus|add|5|6|7|9|11|13)*(?:\/[A-G][#b]?)?\b/g;

function isChordLine(line: string): boolean {
  const trimmed = line.trim();
  if (trimmed.length === 0) return false;
  
  // Remove chords from line to see what's left
  const nonChordContent = line.replace(CHORD_REGEX, '').replace(/\s+/g, '');
  
  // If what's left is very short compared to line length, or empty, it's a chord line
  // Allow some noise (like "x4" or symbols)
  return nonChordContent.length < (line.length * 0.4) || nonChordContent.length < 3;
}

function convertToChordPro(rawText: string): string {
  const lines = rawText.split('\n');
  const result: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const currentLine = lines[i]; 
    const nextLine = lines[i + 1];

    // Case 1: Current line is Chords, Next line is Lyrics (Merge them)
    if (isChordLine(currentLine) && nextLine && !isChordLine(nextLine) && nextLine.trim().length > 0) {
      let mergedLine = nextLine;
      
      // Find all chords and their positions
      const matches = [...currentLine.matchAll(CHORD_REGEX)];
      
      let finalLine = "";
      let lyricCursor = 0;
      
      for (const match of matches) {
          const chord = match[0];
          const chordIndex = match.index!;
          
          // Append lyrics up to this chord
          if (chordIndex > lyricCursor) {
              finalLine += mergedLine.slice(lyricCursor, Math.min(chordIndex, mergedLine.length));
              // If lyrics ran out, pad with spaces
              if (chordIndex > mergedLine.length) {
                  finalLine += " ".repeat(chordIndex - mergedLine.length);
              }
              lyricCursor = Math.min(chordIndex, mergedLine.length);
          }
          
          finalLine += `[${chord}]`;
      }
      
      // Append remaining lyrics
      if (lyricCursor < mergedLine.length) {
          finalLine += mergedLine.slice(lyricCursor);
      }
      
      result.push(finalLine);
      i++; // Skip the lyrics line since we merged it
    } 
    // Case 2: Chord line with no lyrics below (Intro, Solo, etc.)
    else if (isChordLine(currentLine)) {
        // Just wrap chords in brackets
        const wrapped = currentLine.replace(CHORD_REGEX, '[$&]');
        result.push(wrapped);
    } 
    // Case 3: Lyric line or Header
    else {
        const trimmed = currentLine.trim();
        // Detect headers like [Chorus], [Verse] and preserve them
        if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
             result.push(trimmed); 
        } else if (trimmed.endsWith(':')) {
             result.push(`[${trimmed.replace(':', '')}]`); 
        } else {
             result.push(currentLine);
        }
    }
  }
  
  return result.join('\n');
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const { url } = await req.json();
    if (!url) throw new Error('URL is required');

    let title = "Unknown Song";
    let artist = "Unknown Artist";
    let rawContent = "";

    // --- STRATEGY: CHORDTELA ---
    if (url.includes('chordtela.com')) {
        const res = await fetch(url);
        const html = await res.text();
        const $ = cheerio.load(html);

        // Metadata
        const fullTitle = $('title').text().replace('Kunci Gitar ', '').replace(' Chord Dasar © ChordTela.com', '');
        const parts = fullTitle.split(' - ');
        if (parts.length >= 2) {
            artist = parts[0].trim();
            title = parts[1].trim();
        } else {
            title = fullTitle;
        }

        // Content
        let contentNode = $('.entry-content pre');
        if (contentNode.length === 0) contentNode = $('div.post-body');
        
        rawContent = contentNode.text();
    } 
    // --- STRATEGY: ULTIMATE GUITAR ---
    else if (url.includes('ultimate-guitar.com')) {
        const res = await fetch(url);
        const html = await res.text();
        const $ = cheerio.load(html);
        
        // UG stores data in a massive JSON object inside a script tag
        const scripts = $('script').toArray();
        let storeData = null;
        
        for (const script of scripts) {
            const text = $(script).html() || '';
            if (text.includes('window.UGAPP.store.page')) {
                try {
                    const jsonStr = text.replace('window.UGAPP.store.page = ', '').replace(/;$/, '');
                    storeData = JSON.parse(jsonStr);
                    break;
                } catch (e) {
                    console.error("Failed to parse UG JSON", e);
                }
            }
        }

        if (storeData) {
            const tabData = storeData.data.tab_view.wiki_tab;
            const metaData = storeData.data.tab;
            
            title = metaData.song_name;
            artist = metaData.artist_name;
            rawContent = tabData.content;
            
            // Clean up UG proprietary tags
            rawContent = rawContent.replace(/\[\/?ch\]/g, '');
            rawContent = rawContent.replace(/\[\/?tab\]/g, '');
        } else {
            throw new Error("Could not extract data from Ultimate-Guitar");
        }
    }
    else {
        throw new Error("Unsupported domain. Only ChordTela and Ultimate-Guitar are supported.");
    }

    // Run the Smart Algorithm
    const chordProContent = convertToChordPro(rawContent);

    return new Response(JSON.stringify({ 
      title, 
      artist, 
      rawText: chordProContent,
      source: url
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});