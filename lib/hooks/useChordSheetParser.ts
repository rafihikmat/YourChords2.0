
import { useState, useEffect, useMemo } from 'react';
import { ChordLine } from '../../types';

/**
 * Converts our internal JSON ChordLine[] format into a raw text format 
 * that ChordSheetJS can parse (Chord-over-Lyric style).
 */
const convertJsonToRawText = (chordData: ChordLine[] | null): string => {
  if (!chordData || !Array.isArray(chordData)) return '';

  return chordData.map(line => {
    // If it's a section header, ensure it stands out. 
    if (line.line.trim().startsWith('[') && line.line.trim().endsWith(']')) {
        return `{comment: ${line.line.replace(/[\[\]]/g, '')}}`;
    }
    
    // If we have chords, we place them above lyrics.
    if (line.chords && line.chords.length > 0) {
       const chordString = line.chords.join('   ');
       // Ensure spacing between chords to avoid merging
       return `${chordString}\n${line.line}`;
    }
    
    // Just lyrics or empty lines
    return line.line;
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
        return convertJsonToRawText(songData);
    }, [songData]);

    useEffect(() => {
        if (!rawSource) return;

        const parseSong = async () => {
            try {
                // Dynamic Import to prevent app crash if CDN fails
                // @ts-ignore
                const ChordSheetJSModule = await import('chordsheetjs');
                
                // Robustly check for exports whether it's a default export bundle or named exports
                let ParserClass = ChordSheetJSModule.ChordsOverLyricsParser;
                let HtmlDivFormatter = ChordSheetJSModule.HtmlDivFormatter;

                // Fallback 1: Default export
                if (!ParserClass && ChordSheetJSModule.default) {
                    ParserClass = ChordSheetJSModule.default.ChordsOverLyricsParser;
                    HtmlDivFormatter = ChordSheetJSModule.default.HtmlDivFormatter;
                }

                // Fallback 2: Default export nested
                if (!ParserClass && ChordSheetJSModule.default && ChordSheetJSModule.default.default) {
                    ParserClass = ChordSheetJSModule.default.default.ChordsOverLyricsParser;
                    HtmlDivFormatter = ChordSheetJSModule.default.default.HtmlDivFormatter;
                }

                if (!ParserClass || !HtmlDivFormatter) {
                     console.warn("ChordSheetJS exports found:", Object.keys(ChordSheetJSModule));
                     throw new Error("ChordSheetJS classes not found in loaded module");
                }

                const parser = new ParserClass();
                const formatter = new HtmlDivFormatter();

                // 3. Parse
                const song = parser.parse(rawSource);

                // 4. Transpose (if needed)
                if (transposeSteps !== 0) {
                    song.transpose(transposeSteps);
                }

                // 5. Format to HTML
                const html = formatter.format(song);

                // 6. Extract Unique Chords for the diagram section
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
                console.error("ChordSheetJS Loading/Parsing Failed:", error);
                // Graceful Fallback: Show raw text if library fails
                setParsedData({
                    html: `<pre class="whitespace-pre-wrap font-mono text-sm text-slate-600 dark:text-slate-300">${rawSource}</pre>`,
                    uniqueChords: [],
                    metadata: {}
                });
            }
        };

        parseSong();

    }, [rawSource, transposeSteps]);

    return parsedData;
};
