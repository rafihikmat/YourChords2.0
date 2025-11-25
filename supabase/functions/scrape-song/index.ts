
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import * as cheerio from "https://esm.sh/cheerio@1.0.0-rc.12";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Robust Regex for detection
const CHORD_LINE_REGEX = /^(\s*[A-G][#b]?(?:m|min|maj|dim|aug|sus|add|M)*[0-9]*(?:\/[A-G][#b]?)?(\s+|$))+$/;
// New Capture Regex: Handles boundaries without relying on \b for symbols
const CHORD_TOKEN_REGEX = /(?:^|\s)([A-G][#b]?(?:m|maj|min|dim|aug|sus|add|M|2|4|5|6|7|9|11|13)*\d*\+?(?:\/[A-G][#b]?)?)(?=\s|$)/g;

function isChordLine(line: string): boolean {
  const trimmed = line.trim();
  if (trimmed.length === 0) return false;

  if (CHORD_LINE_REGEX.test(trimmed)) return true;

  // Simple density check
  // Count valid chord chars vs total chars (rough heuristic)
  const simpleChordToken = /[A-G][#b]?(?:m|maj|min|dim|aug|sus|add|0-9)*/g;
  const potentialChords = trimmed.match(simpleChordToken) || [];
  if (potentialChords.length === 0) return false;

  const chordLength = potentialChords.join('').length;
  const nonSpaceLength = trimmed.replace(/\s/g, '').length;

  return (chordLength / nonSpaceLength) > 0.6;
}

function convertToChordPro(rawText: string): string {
  if (!rawText) return "";

  const lines = rawText.replace(/\r\n/g, '\n').split('\n');
  const result: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const currentLine = lines[i];
    const nextLine = lines[i + 1];

    if (isChordLine(currentLine) && nextLine && !isChordLine(nextLine) && nextLine.trim().length > 0) {
      const mergedLine = nextLine;
      const matches = [...currentLine.matchAll(CHORD_TOKEN_REGEX)];
      let finalLine = "";
      let lyricCursor = 0;

      for (const match of matches) {
        const chord = match[1]; // Group 1
        const offset = match[0].indexOf(chord);
        const chordIndex = match.index! + offset;

        if (chordIndex > lyricCursor) {
          const textSegment = mergedLine.slice(lyricCursor, Math.min(chordIndex, mergedLine.length));
          finalLine += textSegment;
          lyricCursor = chordIndex;
        }

        if (lyricCursor < chordIndex && lyricCursor >= mergedLine.length) {
          finalLine += " ";
          lyricCursor++;
        }

        finalLine += `[${chord}]`;

        // Ideally we also update lyricCursor if the chord spans over lyrics, 
        // but typically chords float *above* text.
        // We just update lyricCursor to the current position in lyrics string
        lyricCursor = Math.max(lyricCursor, chordIndex);
      }

      if (lyricCursor < mergedLine.length) {
        finalLine += mergedLine.slice(lyricCursor);
      }

      result.push(finalLine);
      i++;
    }
    else if (isChordLine(currentLine)) {
      // Replace all occurrences
      const formatted = currentLine.replace(CHORD_TOKEN_REGEX, (match, p1) => {
        return match.replace(p1, `[${p1}]`);
      });
      result.push(formatted);
    }
    else {
      const trimmed = currentLine.trim();
      if (/^\[.+]$/.test(trimmed) || /^(Chorus|Verse|Bridge|Intro|Outro).*:/i.test(trimmed)) {
        const headerName = trimmed.replace(/[:[\]]/g, '').trim();
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

    const headers = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
    };



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

      // Priority: <pre> tags, then fallback to div.post-body
      let contentNode = $('.entry-content pre');
      if (contentNode.length === 0) contentNode = $('div.post-body pre');

      if (contentNode.length > 0) {
        // <pre> usually preserves whitespace
        contentNode.find('script, style, div').remove();
        rawContent = contentNode.text();
      } else {
        // Fallback to raw body (often uses <br>)
        contentNode = $('div.post-body');
        // Remove ads/scripts first
        contentNode.find('script, style, div[class], iframe, ins').remove();

        // Convert <br> to newlines manually before getting text
        contentNode.find('br').replaceWith('\n');

        rawContent = contentNode.text();
      }
    }
    else if (url.includes('ultimate-guitar.com')) {
      const res = await fetch(url, { headers });
      if (!res.ok) {
        if (res.status === 403) throw new Error("Ultimate-Guitar blocked the request (403).");
        throw new Error(`Ultimate-Guitar returned status ${res.status}`);
      }

      const html = await res.text();
      const $ = cheerio.load(html);

      let storeData = null;

      const scripts = $('script').toArray();
      for (const script of scripts) {
        const text = $(script).html() || '';
        if (text.includes('window.UGAPP.store.page')) {
          try {
            const startStr = 'window.UGAPP.store.page = ';
            const startIndex = text.indexOf(startStr);
            if (startIndex === -1) continue;

            const cutoff = text.substring(startIndex + startStr.length);
            let jsonStr = "";

            const endSemi = cutoff.indexOf(';');
            if (endSemi !== -1) {
              jsonStr = cutoff.substring(0, endSemi);
            } else {
              jsonStr = cutoff;
            }

            storeData = JSON.parse(jsonStr);
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
          } catch (e) {
            // ignore error
          }
        }
      }

      if (storeData && storeData.data) {
        const tabData = storeData.data.tab_view?.wiki_tab;
        const metaData = storeData.data.tab;

        if (metaData) {
          title = metaData.song_name;
          artist = metaData.artist_name;
        }

        if (tabData && tabData.content) {
          rawContent = tabData.content
            .replace(/\[\/?ch\]/g, '')
            .replace(/\[\/?tab\]/g, '');
        } else {
          throw new Error("No tab content found in UG JSON.");
        }
      } else {
        const jsTabContent = $('.js-tab-content').text();
        if (jsTabContent) {
          const pageTitle = $('title').text();
          title = pageTitle.split(' Chords')[0] || "Unknown";
          rawContent = jsTabContent;
        } else {
          throw new Error("Could not parse Ultimate-Guitar structure.");
        }
      }
    }
    else {
      throw new Error("Unsupported domain. Use ChordTela or Ultimate-Guitar.");
    }

    if (!rawContent || rawContent.length < 50) {
      throw new Error("Extracted content is too short or empty.");
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

  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : "Unknown error";
    console.error("Scrape Error:", errorMsg);
    return new Response(JSON.stringify({ error: errorMsg }), {
      status: 422,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
