
import { useState, useEffect, useMemo } from 'react';
import { ChordProParser, HtmlTableFormatter } from 'chordsheetjs';
import { ChordLine } from '../../types';

/**
 * Converts internal ChordLine[] format to ChordPro text.
 * This ensures legacy/AI-generated data works with the ChordProParser.
 */
const convertJsonToRawText = (chordData: ChordLine[] | null): string => {
  if (!chordData || !Array.isArray(chordData)) return '';

  return chordData.map(line => {
    // SMART HEADER DETECTION:
    // Only treat as header if it contains a single bracketed item and NOTHING else.
    const trimmed = line.line?.trim() || '';
    // eslint-disable-next-line no-useless-escape
    if (trimmed && /^\[[^\[\]]+\]$/.test(trimmed)) {
        // eslint-disable-next-line no-useless-escape
        return `{comment: ${trimmed.replace(/[\[\]]/g, '')}}`;
    }
    
    // If we have chords in the legacy array, prepend them
    if (line.chords && line.chords.length > 0) {
       const chordString = line.chords.map(c => `[${c}]`).join('');
       return `${chordString}${line.line}`;
    }
    
    // Just lyrics or empty lines
    return line.line || '';
  }).join('\n');
};

/**
 * Sanitizes raw ChordPro text to prevent parsing errors during live typing.
 * specifically handles "Expected ... but end of input/newline found" errors
 * by auto-closing brackets at end of lines.
 */
const sanitizeChordPro = (text: string): string => {
    if (!text) return '';
    return text.split(/\r?\n/).map(line => {
        let open = 0;
        for (const char of line) {
            if (char === '[') open++;
            if (char === ']') open = Math.max(0, open - 1);
        }
        // Auto-close brackets at end of line to prevent parser crash
        return line + ']'.repeat(open);
    }).join('\n');
};

interface UseChordSheetParserProps {
    songData: ChordLine[] | string[] | string | null;
    transposeSteps?: number;
}

interface ParsedSongData {
    html: string;
    uniqueChords: string[];
    key?: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
        let source = '';
        
        if (typeof songData === 'string') {
            // Direct string input (e.g. from Manual Entry Preview or rawText content)
            source = songData;
        } else if (Array.isArray(songData)) {
            // Handle Arrays
            if (songData.length === 0) {
                source = '';
            } else if (typeof songData[0] === 'string') {
                // Handle Legacy string[] (e.g. saved from Manual Entry to DB)
                // Join with newlines to reconstruct the full song text
                source = (songData as string[]).join('\n');
            } else {
                // Handle ChordLine[] (AI Generated structure)
                source = convertJsonToRawText(songData as ChordLine[]);
            }
        } else {
            // Null or undefined
            return '';
        }
        
        // Apply sanitization to fix common syntax errors before parsing
        return sanitizeChordPro(source);
    }, [songData]);

    useEffect(() => {
        if (!rawSource || rawSource.trim().length === 0) {
             // eslint-disable-next-line react-hooks/set-state-in-effect
             setParsedData({ html: '', uniqueChords: [], metadata: {} });
             return;
        }

        try {
            // Use Named Imports classes
            const parser = new ChordProParser();
            const formatter = new HtmlTableFormatter();

            // 2. Parse
            const song = parser.parse(rawSource);

            // 3. Transpose (if needed)
            if (transposeSteps !== 0) {
                song.transpose(transposeSteps);
            }

            // 4. Format to HTML
            const html = formatter.format(song);

            // 5. Extract UniqueChords (with Strict Filtering)
            const uniqueChords = new Set<string>();
            if (song.paragraphs) {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                song.paragraphs.forEach((p: any) => {
                    if (p.lines) {
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        p.lines.forEach((l: any) => {
                            if (l.items) {
                                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                l.items.forEach((item: any) => {
                                    if (item.chords) {
                                        const c = item.chords.trim();
                                        // CRITICAL: Ensure chord is not empty string to prevent Ghost Diagrams
                                        if (c && c.length > 0) {
                                            uniqueChords.add(c);
                                        }
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
            console.error("Chord Parsing Error:", error);
            // Fallback UI for syntax errors that pass sanitization but fail parsing
            setParsedData(prev => ({
                ...prev,
                html: rawSource.length > 5 
                    ? `<div class="text-xs text-slate-400 italic mt-2 p-4 border border-dashed border-slate-300 dark:border-white/10 rounded">Rendering preview... <span class="opacity-50">(Typing or Format Error)</span></div>` 
                    : ''
            }));
        }

    }, [rawSource, transposeSteps]);

    return parsedData;
};
