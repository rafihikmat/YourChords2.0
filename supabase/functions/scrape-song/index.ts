
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import * as cheerio from "https://esm.sh/cheerio@1.0.0-rc.12";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Improved Regex for Chord Detection
// Looks for lines containing mostly chords (A-G, m, 7, #, b, /, sus, dim, etc)
// Allows for some whitespace and minor connectors
const CHORD_LINE_REGEX = /^(\s*[A-G][#b]?(?:m|min|maj|dim|aug|sus|add|M)*[0-9]*(?:\/[A-G][#b]?)?(\s+|$))+$/;
const CHORD_TOKEN_REGEX = /\b[A-G][#b]?(?:m|maj|min|dim|aug|sus|add|[0-9]|b|#|\/)*\b/g;

function isChordLine(line: string): boolean {
  const trimmed = line.trim();
  if (trimmed.length === 0) return false;
  
  // Strategy 1: Strict Regex Match
  if (CHORD_LINE_REGEX.test(trimmed)) return true;

  // Strategy 2: Ratio of chords to length
  // Filter out lyrics like "A long time ago" which start with 'A'
  const potentialChords = trimmed.match(CHORD_TOKEN_REGEX) || [];
  if (potentialChords.length === 0) return false;

  const chordLength = potentialChords.join('').length;
  // If > 50% of the line is made up of chord characters (excluding spaces), it's likely a chord line
  const nonSpaceLength = trimmed.replace(/\s/g, '').length;
  
  // Heuristic: If chords make up significant portion and it doesn't look like a sentence
  return (chordLength / nonSpaceLength) > 0.6;
}

function convertToChordPro(rawText: string): string {
  if (!rawText) return "";
  
  // Normalize line endings
  const lines = rawText.replace(/\r\n/g, '\n').split('\n');
  const result: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const currentLine = lines[i]; 
    const nextLine = lines[i + 1];

    // Check if current line is chords and next line is lyrics (Standard text tab format)
    if (isChordLine(currentLine) && nextLine && !isChordLine(nextLine) && nextLine.trim().length > 0) {
      // Merge Strategy
      let mergedLine = nextLine;
      const matches = [...currentLine.matchAll(CHORD_TOKEN_REGEX)];
      let finalLine = "";
      let lyricCursor = 0;
      
      // We reconstruct the line by inserting chords at their specific indices
      // However, we must be careful about index alignment as lyrics might be shorter/longer
      
      for (const match of matches) {
          const chord = match[0];
          const chordIndex = match.index!;
          
          // Append text before this chord
          if (chordIndex > lyricCursor) {
              const textSegment = mergedLine.slice(lyricCursor, chordIndex);
              finalLine += textSegment;
              
              // Pad with spaces if chord starts way after lyric ends (rare but possible)
              if (lyricCursor + textSegment.length < chordIndex) {
                 // finalLine += " ".repeat(chordIndex - (lyricCursor + textSegment.length));
              }
              
              lyricCursor = chordIndex;
          }
          
          // If the lyric line ended before this chord, append spaces
          if (lyricCursor < chordIndex && lyricCursor >= mergedLine.length) {
              finalLine += " "; 
              lyricCursor++;
          }

          finalLine += `[${chord}]`;
      }
      
      // Append remaining lyrics
      if (lyricCursor < mergedLine.length) {
          finalLine += mergedLine.slice(lyricCursor);
      }
      
      result.push(finalLine);
      i++; // Skip next line as we merged it
    } 
    else if (isChordLine(currentLine)) {
        // Orphaned chord line (maybe intro or instrumental) -> Wrap all chords
        result.push(currentLine.replace(CHORD_TOKEN_REGEX, '[$&]'));
    } 
    else {
        // Lyric line or header
        const trimmed = currentLine.trim();
        // Detect headers like [Chorus], Chorus:, VERSE 1
        if (/^\[.+\]$/.test(trimmed) || /^(Chorus|Verse|Bridge|Intro|Outro).*:/i.test(trimmed)) {
             const headerName = trimmed.replace(/[:\[\]]/g, '').trim();
             result.push(`{comment: ${headerName}}`);
        } else {
             result.push(currentLine);
        }
    }
  }
  return result.join('\n');
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { url } = await req.json();

    if (!url) {
        return new Response(JSON.stringify({ error: 'URL is required' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }

    let title = "Unknown Song";
    let artist = "Unknown Artist";
    let rawContent = "";

    // REALISTIC BROWSER HEADERS
    // Essential to bypass basic anti-bot checks on UG/ChordTela
    const headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache',
        'Upgrade-Insecure-Requests': '1',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'none',
        'Sec-Fetch-User': '?1'
    };

    console.log(`Scraping URL: ${url}`);

    if (url.includes('chordtela.com')) {
        const res = await fetch(url, { headers });
        if (!res.ok) throw new Error(`ChordTela returned status ${res.status}`);
        
        const html = await res.text();
        const $ = cheerio.load(html);

        const fullTitle = $('title').text().replace('Kunci Gitar ', '').replace(/ Chord Dasar.*$/, '').replace(/ Chord.*$/, '');
        const parts = fullTitle.split(' - ');
        
        if (parts.length >= 2) {
            artist = parts[0].trim();
            title = parts[1].trim();
        } else {
            title = fullTitle;
        }

        // ChordTela usually puts content in <pre> or div.post-body
        let contentNode = $('.entry-content pre');
        if (contentNode.length === 0) contentNode = $('div.post-body pre');
        if (contentNode.length === 0) contentNode = $('div.post-body');
        
        // Remove scripts and style tags from content
        contentNode.find('script, style, div').remove();
        
        rawContent = contentNode.text();
    } 
    else if (url.includes('ultimate-guitar.com')) {
        const res = await fetch(url, { headers });
        if (!res.ok) {
             if (res.status === 403) throw new Error("Ultimate-Guitar blocked the request (403). Try scraping a different source.");
             throw new Error(`Ultimate-Guitar returned status ${res.status}`);
        }
        
        const html = await res.text();
        const $ = cheerio.load(html);
        
        let storeData = null;
        
        // Strategy: Find the global JSON store object (window.UGAPP.store.page)
        const scripts = $('script').toArray();
        for (const script of scripts) {
            const text = $(script).html() || '';
            if (text.includes('window.UGAPP.store.page')) {
                try {
                    // Extract JSON string carefully
                    const startStr = 'window.UGAPP.store.page = ';
                    const startIndex = text.indexOf(startStr);
                    if (startIndex === -1) continue;
                    
                    const cutoff = text.substring(startIndex + startStr.length);
                    // Find the end of the JSON object (look for the next variable declaration or semicolon)
                    // Usually ends with "; window.UGAPP..."
                    let jsonStr = "";
                    
                    // Simple stack parser to find matching braces if needed, but usually split by semicolon works
                    const endSemi = cutoff.indexOf(';');
                    if (endSemi !== -1) {
                         jsonStr = cutoff.substring(0, endSemi);
                    } else {
                         // Fallback: take mostly everything
                         jsonStr = cutoff;
                    }

                    storeData = JSON.parse(jsonStr);
                    break;
                } catch (e) {
                    console.log("JSON Parse Error on UG Script:", e.message);
                }
            }
        }

        if (storeData && storeData.data) {
            // Path 1: Valid JSON Data found
            const tabData = storeData.data.tab_view?.wiki_tab;
            const metaData = storeData.data.tab;
            
            if (metaData) {
                title = metaData.song_name;
                artist = metaData.artist_name;
            }
            
            if (tabData && tabData.content) {
                rawContent = tabData.content
                    .replace(/\[\/?ch\]/g, '') // Remove UG specific [ch] tags
                    .replace(/\[\/?tab\]/g, '');
            } else {
                throw new Error("Found UG Data but no tab content. Is this a Pro tab? Only Chords/Tabs are supported.");
            }
        } else {
            // Path 2: Fallback to DOM scraping (older pages or print layout)
            const jsTabContent = $('.js-tab-content').text();
            if (jsTabContent) {
                const pageTitle = $('title').text();
                title = pageTitle.split(' Chords')[0] || "Unknown";
                rawContent = jsTabContent;
            } else {
                 throw new Error("Could not parse Ultimate-Guitar structure. The page layout may have changed.");
            }
        }
    }
    else {
        throw new Error("Unsupported domain. Please use a URL from ChordTela.com or Ultimate-Guitar.com");
    }

    if (!rawContent || rawContent.length < 50) {
         throw new Error("Extracted content is too short or empty. Parsing failed.");
    }

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
    console.error("Scrape Error:", error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 422, // Unprocessable Entity (Logical error, not server crash)
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
