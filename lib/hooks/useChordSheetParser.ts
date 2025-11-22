
import { useState, useEffect, useMemo } from 'react';
import ChordSheetJS from 'chordsheetjs';
import { ChordLine } from '../../types';

/**
 * Converts internal ChordLine[] format to ChordPro text.
 * This ensures legacy/AI-generated data works with the ChordProParser.
 */
const convertJsonToRawText = (chordData: ChordLine[] | null): string => {
  if (!chordData || !Array.isArray(chordData)) return '';

  return chordData.map(line => {
    // If it's a section header (e.g. [Chorus]), convert to ChordPro comment
    if (line.line && line.line.trim().startsWith('[') && line.line.trim().endsWith(']')) {
        return `{comment: ${line.line.replace(/[\[\]]/g, '')}}`;
    }
    
    // If we have chords, prepend them in brackets (Approximate ChordPro)
    if (line.chords && line.chords.length > 0) {
       const chordString = line.chords.map(c => `[${c}]`).join('');
       // E.g. [C][Am]Lyrics here
       return `${chordString}${line.line}`;
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

    // 1. Prepare the Source String (Ensure ChordPro format)
    const rawSource = useMemo(() => {
        if (typeof songData === 'string') return songData;
        // If it's a string array (legacy simple chords), we can't really parse it as a song sheet easily
        if (Array.isArray(songData) && typeof songData[0] === 'string') return ''; 
        // If it's ChordLine[], convert it
        return convertJsonToRawText(songData as ChordLine[]);
    }, [songData]);

    useEffect(() => {
        if (!rawSource) return;

        try {
            // Use the ChordSheetJS namespace to access classes
            const parser = new ChordSheetJS.ChordProParser();
            const formatter = new ChordSheetJS.HtmlTableFormatter();

            // 2. Parse
            const song = parser.parse(rawSource);

            // 3. Transpose (if needed)
            if (transposeSteps !== 0) {
                song.transpose(transposeSteps);
            }

            // 4. Format to HTML
            const html = formatter.format(song);

            // 5. Extract UniqueChords
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
            // Fallback display if parsing fails
            setParsedData({
                html: `<div class="p-4 text-red-500 border border-red-200 rounded">Error parsing song data. <pre class="mt-2 text-xs text-slate-500">${error}</pre></div>`,
                uniqueChords: [],
                metadata: {}
            });
        }

    }, [rawSource, transposeSteps]);

    return parsedData;
};
