
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import * as cheerio from "https://esm.sh/cheerio@1.0.0-rc.12";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Regex to identify chord lines
const CHORD_REGEX = /\b[A-G][#b]?(?:m|maj|min|dim|aug|sus|add|[0-9]|b|#|\/)*\b/g;

function isChordLine(line: string): boolean {
  const trimmed = line.trim();
  if (trimmed.length === 0) return false;
  const nonChordContent = line.replace(CHORD_REGEX, '').replace(/\s+/g, '');
  return nonChordContent.length < (line.length * 0.4) || nonChordContent.length < 3;
}

function convertToChordPro(rawText: string): string {
  const lines = rawText.split('\n');
  const result: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const currentLine = lines[i]; 
    const nextLine = lines[i + 1];

    if (isChordLine(currentLine) && nextLine && !isChordLine(nextLine) && nextLine.trim().length > 0) {
      let mergedLine = nextLine;
      const matches = [...currentLine.matchAll(CHORD_REGEX)];
      let finalLine = "";
      let lyricCursor = 0;
      
      for (const match of matches) {
          const chord = match[0];
          const chordIndex = match.index!;
          if (chordIndex > lyricCursor) {
              finalLine += mergedLine.slice(lyricCursor, Math.min(chordIndex, mergedLine.length));
              if (chordIndex > mergedLine.length) finalLine += " ".repeat(chordIndex - mergedLine.length);
              lyricCursor = Math.min(chordIndex, mergedLine.length);
          }
          finalLine += `[${chord}]`;
      }
      if (lyricCursor < mergedLine.length) finalLine += mergedLine.slice(lyricCursor);
      result.push(finalLine);
      i++;
    } 
    else if (isChordLine(currentLine)) {
        result.push(currentLine.replace(CHORD_REGEX, '[$&]'));
    } 
    else {
        const trimmed = currentLine.trim();
        if (trimmed.startsWith('[') && trimmed.endsWith(']')) result.push(trimmed); 
        else if (trimmed.endsWith(':')) result.push(`[${trimmed.replace(':', '')}]`); 
        else result.push(currentLine);
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

    // --- SAFETY & COMPLIANCE ---
    // User-Agent added to mimic browser and allow functionality for PERSONAL/DEV use.
    // Heavy scraping may result in IP bans from target sites.
    const fetchOptions = {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Referer': 'https://www.google.com/'
      }
    };

    if (url.includes('chordtela.com')) {
        const res = await fetch(url, fetchOptions);
        if (!res.ok) throw new Error(`ChordTela returned status ${res.status}`);
        const html = await res.text();
        const $ = cheerio.load(html);

        const fullTitle = $('title').text().replace('Kunci Gitar ', '').replace(' Chord Dasar © ChordTela.com', '');
        const parts = fullTitle.split(' - ');
        if (parts.length >= 2) {
            artist = parts[0].trim();
            title = parts[1].trim();
        } else {
            title = fullTitle;
        }

        let contentNode = $('.entry-content pre');
        if (contentNode.length === 0) contentNode = $('div.post-body');
        rawContent = contentNode.text();
    } 
    else if (url.includes('ultimate-guitar.com')) {
        const res = await fetch(url, fetchOptions);
        if (!res.ok) throw new Error(`Ultimate Guitar returned status ${res.status}`);
        const html = await res.text();
        const $ = cheerio.load(html);
        
        const scripts = $('script').toArray();
        let storeData = null;
        
        for (const script of scripts) {
            const text = $(script).html() || '';
            if (text.includes('window.UGAPP.store.page')) {
                try {
                    const jsonStr = text.replace('window.UGAPP.store.page = ', '').replace(/;$/, '');
                    storeData = JSON.parse(jsonStr);
                    break;
                } catch (e) {}
            }
        }

        if (storeData) {
            const tabData = storeData.data.tab_view.wiki_tab;
            const metaData = storeData.data.tab;
            title = metaData.song_name;
            artist = metaData.artist_name;
            rawContent = tabData.content.replace(/\[\/?ch\]/g, '').replace(/\[\/?tab\]/g, '');
        } else {
            const jsTabContent = $('.js-tab-content').text();
            if (jsTabContent) {
                const pageTitle = $('title').text();
                title = pageTitle.split(' Chords')[0] || "Unknown";
                rawContent = jsTabContent;
            } else {
                 throw new Error("Could not extract data. Target structure may have changed.");
            }
        }
    }
    else {
        throw new Error("Unsupported domain. Only ChordTela and Ultimate-Guitar are supported.");
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
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
