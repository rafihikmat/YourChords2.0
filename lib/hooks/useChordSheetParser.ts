
import { useState, useEffect, useMemo } from 'react';
// @ts-ignore
import ChordSheetJS from 'chordsheetjs';
import { ChordLine } from '../../types';

/**
 * Converts our internal JSON ChordLine[] format into a raw text format 
 * that ChordSheetJS can parse (Chord-over-Lyric style).
 */
const convertJsonToRawText = (chordData: ChordLine[] | null): string => {
  if (!chordData || !Array.isArray(chordData)) return '';

  return chordData.map(line => {
    // If it's a section header, ensure it stands out. 
    if (line.line && line.line.trim().startsWith('[') && line.line.trim().endsWith(']')) {
        return `{comment: ${line.line.replace(/[\[\]]/g, '')}}`;
    }
    
    // If we have chords, we place them above lyrics.
    if (line.chords && line.chords.length > 0) {
       const chordString = line.chords.join('   ');
       // Ensure spacing between chords to avoid merging
       return `${chordString}\n${line.line}`;
    }
    
    // Just lyrics or empty lines
    return line.line || '';
  }).join('\n');
};

interface UseChordSheetParserProps {
    songData: ChordLine[] | string | null;
    transposeSteps?: number;
}

interface ParsedSongData {
    html: string;
    uniqueChords: string[];
    key?: string;
    metadata: Record<string, any>;
}

export const useChordSheetParser = ({ songData, transposeSteps = 0 }: UseChordSheetParserProps): ParsedSongData => {
    const [parsedData, setParsedData] = useState<ParsedSongData>({
        html: '',
        uniqueChords: [],
        metadata: {}
    });

    // 1. Prepare the Source String
    const rawSource = useMemo(() => {
        if (typeof songData === 'string') return songData;
        // Helper check to ensure we don't process string[] as ChordLine[]
        if (Array.isArray(songData) && typeof songData[0] === 'string') return '';
        return convertJsonToRawText(songData as ChordLine[]);
    }, [songData]);

    useEffect(() => {
        if (!rawSource) return;

        try {
            // Instantiate parser and formatter from the default export object
            // This handles cases where the CDN module only exposes a default export
            let parser;
            
            // Detect ChordPro format (brackets around chords)
            if (rawSource.includes('[') && rawSource.includes(']')) {
                parser = new ChordSheetJS.ChordProParser();
            } else {
                // Fix: ChordsOverLyricsParser is deprecated/missing in types, using ChordsOverWordsParser
                parser = new ChordSheetJS.ChordsOverWordsParser();
            }

            const formatter = new ChordSheetJS.HtmlTableFormatter();

            // 2. Parse
            const song = parser.parse(rawSource);

            // 3. Transpose (if needed)
            if (transposeSteps !== 0) {
                song.transpose(transposeSteps);
            }

            // 4. Format to HTML
            const html = formatter.format(song);

            // 5. Extract Unique Chords for the diagram section
            const uniqueChords = new Set<string>();
            if (song.paragraphs) {
                song.paragraphs.forEach((p: any) => {
                    if (p.lines) {
                        p.lines.forEach((l: any) => {
                            if (l.items) {
                                l.items.forEach((item: any) => {
                                    if (item.chords) {
                                        uniqueChords.add(item.chords.trim());
                                    }
                                });
                            }
                        });
                    }
                });
            }

            setParsedData({
                html,
                uniqueChords: Array.from(uniqueChords),
                metadata: song.metadata || {},
                key: song.metadata?.key
            });

        } catch (error) {
            console.error("ChordSheetJS Parsing Failed:", error);
            // Graceful Fallback: Show raw text if library fails
            setParsedData({
                html: `<pre class="whitespace-pre-wrap font-mono text-sm text-slate-600 dark:text-slate-300 p-4 bg-slate-100 dark:bg-slate-900 rounded-lg overflow-x-auto">${rawSource}</pre>`,
                uniqueChords: [],
                metadata: {}
            });
        }

    }, [rawSource, transposeSteps]);

    return parsedData;
};
