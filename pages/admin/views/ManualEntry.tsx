
import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { Music, Save, Grid, Eye, Edit3, Globe, Loader2, AlertTriangle, CheckCircle, FileText } from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { Song } from '../../../types';
import { cn } from '../../../lib/utils';
import { CHORD_FAMILIES, parseChordsFromText } from '../../../lib/musicUtils';
import SongLyricsDisplay from '../../../components/SongLyricsDisplay';
import { useChordSheetParser } from '../../../lib/hooks/useChordSheetParser';
import * as mammoth from 'mammoth';

const ManualEntry: React.FC = () => {
    const location = useLocation();
    const state = location.state as { songToEdit?: Song } | null;
    const [mode, setMode] = useState<'edit' | 'preview'>('edit');
    
    // Local File Import State
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isProcessingFile, setIsProcessingFile] = useState(false);
    const [importStatus, setImportStatus] = useState<{type: 'success' | 'error', msg: string} | null>(null);

    const [formData, setFormData] = useState({
        id: '', 
        title: '',
        artist: '',
        difficulty: 'Medium',
        spotify_id: '', 
        youtube_id: '', 
        rawText: ''
    });
    const [loading, setLoading] = useState(false);
    const [chordCategory, setChordCategory] = useState('Major');
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    // Live Parser for Preview Mode
    const { html } = useChordSheetParser({ songData: formData.rawText });

    useEffect(() => {
        if (state?.songToEdit) {
            const s = state.songToEdit;
            let raw = '';
            if (s.chords) {
                // Convert existing JSON format back to text for editing if necessary
                if (Array.isArray(s.chords) && s.chords.length > 0) {
                    // Check if it's legacy string[] or ChordLine[]
                    if (typeof s.chords[0] === 'string') {
                        // Legacy
                         raw = (s.chords as unknown as string[]).join('\n');
                    } else {
                        // ChordLine object from new parser
                        raw = s.chords.map((line: any) => {
                             if (line.chords && line.chords.length > 0) {
                                 // Reconstruct brackets for editing consistency
                                 const chordStr = line.chords.map((c:string) => `[${c}]`).join('');
                                 return `${chordStr}${line.line}`;
                             }
                             return line.line;
                        }).join('\n');
                    }
                }
            }

            setFormData({
                id: s.id,
                title: s.title,
                artist: s.artist,
                difficulty: s.difficulty,
                spotify_id: s.spotify_track_id || '',
                youtube_id: s.youtube_video_id || '',
                rawText: raw || ''
            });
        }
    }, [state]);

    // --- SMART ZIPPER ALGORITHM ---

    const isChordLine = (line: string): boolean => {
        const trimmed = line.trim();
        if (!trimmed) return false;
        
        // Regex matching valid chord tokens
        // Matches: A, Am, A#m7, G/B, Csus4, etc.
        const chordTokenRegex = /\b[A-G][#b]?(?:m|maj|min|dim|aug|sus|add|M|2|4|5|6|7|9|11|13)*\d*(?:\/[A-G][#b]?)?\b/g;
        
        const matches = trimmed.match(chordTokenRegex) || [];
        if (matches.length === 0) return false;

        const chordCharsCount = matches.join('').length;
        const totalNonSpaceChars = trimmed.replace(/\s/g, '').length;
        
        // Heuristic: If > 50% of non-space characters are chords, it's a chord line
        return (chordCharsCount / totalNonSpaceChars) > 0.5;
    };

    const convertRawToChordPro = (fullText: string) => {
        const lines = fullText.split(/\r?\n/);
        const resultLines: string[] = [];
        
        // Auto-Title Detection (First non-empty line)
        let detectedTitle = "";
        let detectedArtist = "";
        
        // Find first few non-empty lines
        const nonEmptyLines = lines.filter(l => l.trim().length > 0);
        if (nonEmptyLines.length > 0) detectedTitle = nonEmptyLines[0].trim();
        if (nonEmptyLines.length > 1) {
            const secondLine = nonEmptyLines[1].trim();
            if (secondLine.toLowerCase().startsWith('by') || secondLine.length < 40) {
                detectedArtist = secondLine.replace(/^by\s+/i, '');
            }
        }

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i]; // Keep original line for indexing
            const trimmed = line.trim();

            // 1. Clean Metadata
            if (/^(Tuning|Capo|Key|Difficulty|Strumming|Author|Tempo):/i.test(trimmed)) continue;
            if (!trimmed) {
                resultLines.push(""); 
                continue;
            }

            // 2. Detect Chord Line
            if (isChordLine(line)) {
                const nextLine = lines[i + 1];
                
                // Case A: Merge with Lyrics (Zipper)
                if (nextLine && !isChordLine(nextLine) && nextLine.trim().length > 0) {
                    // Find all chords and their indices in the source line
                    const chordTokenRegex = /[A-G][#b]?(?:m|maj|min|dim|aug|sus|add|M|2|4|5|6|7|9|11|13)*\d*(?:\/[A-G][#b]?)?/g;
                    const chords = [];
                    let match;
                    while ((match = chordTokenRegex.exec(line)) !== null) {
                        chords.push({ text: match[0], index: match.index });
                    }

                    // We build the new line by inserting chords into the lyric line at specific indices
                    // Processing from Right to Left avoids index shifting issues!
                    let mergedLine = nextLine;
                    
                    // Sort chords descending by index
                    chords.sort((a, b) => b.index - a.index);

                    for (const chord of chords) {
                        const idx = chord.index;
                        const chordTag = `[${chord.text}]`;

                        if (idx >= mergedLine.length) {
                            // Pad with spaces if chord is beyond current lyric length
                            mergedLine = mergedLine.padEnd(idx, ' ') + chordTag;
                        } else {
                            // Insert at index
                            mergedLine = mergedLine.slice(0, idx) + chordTag + mergedLine.slice(idx);
                        }
                    }
                    
                    resultLines.push(mergedLine);
                    i++; // Skip next line (lyrics) as it's merged
                } 
                // Case B: Orphaned Chords (Intro/Instrumental) -> Wrap in brackets
                else {
                    const chordTokenRegex = /\b([A-G][#b]?(?:m|maj|min|dim|aug|sus|add|M|2|4|5|6|7|9|11|13)*\d*(?:\/[A-G][#b]?)?)\b/g;
                    // Only wrap if not already wrapped
                    const wrapped = line.replace(chordTokenRegex, (match) => {
                        return `[${match}]`; 
                    });
                    // Clean up double brackets just in case [[C]] -> [C]
                    resultLines.push(wrapped.replace(/\[\[/g, '[').replace(/\]\]/g, ']'));
                }
            } else {
                // Regular Lyric Line or Header
                if (/^(Chorus|Verse|Bridge|Intro|Outro|Reff).*:/i.test(trimmed) || (trimmed.startsWith('[') && trimmed.endsWith(']'))) {
                    // It's likely a header
                    resultLines.push(trimmed);
                } else {
                    resultLines.push(line);
                }
            }
        }

        return {
            processedText: resultLines.join('\n'),
            title: detectedTitle,
            artist: detectedArtist
        };
    };

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsProcessingFile(true);
        setImportStatus(null);

        try {
            let rawText = "";

            if (file.name.endsWith('.docx')) {
                const arrayBuffer = await file.arrayBuffer();
                // Mammoth extracts raw text from Word
                const result = await mammoth.extractRawText({ arrayBuffer });
                rawText = result.value;
                if (result.messages.length > 0) {
                    console.warn("Mammoth warnings:", result.messages);
                }
            } else {
                // .txt file
                rawText = await file.text();
            }

            if (!rawText || rawText.length < 10) throw new Error("File is empty or too short.");

            const { processedText, title, artist } = convertRawToChordPro(rawText);

            setFormData(prev => ({
                ...prev,
                rawText: processedText,
                title: title || prev.title,
                artist: artist || prev.artist
            }));

            setImportStatus({ type: 'success', msg: `Processed "${file.name}" successfully.` });

        } catch (error: any) {
            console.error("File Processing Error:", error);
            setImportStatus({ type: 'error', msg: "Failed to process file. " + error.message });
        } finally {
            setIsProcessingFile(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        const parsedChords = parseChordsFromText(formData.rawText);

        const payload = {
            title: formData.title,
            artist: formData.artist,
            difficulty: formData.difficulty,
            spotify_track_id: formData.spotify_id,
            youtube_video_id: formData.youtube_id,
            chords: parsedChords,
        };

        let error;
        
        if (formData.id) {
            const { error: updateError } = await supabase.from('songs').update(payload).eq('id', formData.id);
            error = updateError;
        } else {
            const { error: insertError } = await supabase.from('songs').insert([{ ...payload, view_count: 0 }]);
            error = insertError;
        }

        setLoading(false);
        if (error) alert('Error: ' + error.message);
        else {
            alert(formData.id ? 'Song updated!' : 'Song added successfully!');
            if (!formData.id) setFormData({ id: '', title: '', artist: '', difficulty: 'Medium', spotify_id: '', youtube_id: '', rawText: '' });
        }
    };

    const insertAtCursor = (chord: string) => {
        if (textareaRef.current) {
            const start = textareaRef.current.selectionStart;
            const end = textareaRef.current.selectionEnd;
            const currentText = formData.rawText;
            
            const textToInsert = `[${chord}]`;
            
            const newText = currentText.substring(0, start) + textToInsert + currentText.substring(end);
            setFormData({ ...formData, rawText: newText });
            
            setTimeout(() => {
                if (textareaRef.current) {
                    textareaRef.current.focus();
                    textareaRef.current.selectionStart = start + textToInsert.length;
                    textareaRef.current.selectionEnd = start + textToInsert.length;
                }
            }, 0);
        }
    };

    return (
        <div className="p-8 animate-in fade-in space-y-8">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold text-slate-900 dark:text-white">{formData.id ? 'Edit Song' : 'Manual Song Entry'}</h1>
                <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-lg border border-slate-200 dark:border-white/10">
                    <button
                        type="button"
                        onClick={() => setMode('edit')}
                        className={cn(
                            "px-4 py-2 rounded-md text-sm font-bold flex items-center gap-2 transition-all",
                            mode === 'edit' ? "bg-white dark:bg-slate-700 shadow text-primary dark:text-white" : "text-slate-500"
                        )}
                    >
                        <Edit3 className="w-4 h-4" /> Editor
                    </button>
                    <button
                        type="button"
                        onClick={() => setMode('preview')}
                        className={cn(
                            "px-4 py-2 rounded-md text-sm font-bold flex items-center gap-2 transition-all",
                            mode === 'preview' ? "bg-white dark:bg-slate-700 shadow text-primary dark:text-white" : "text-slate-500"
                        )}
                    >
                        <Eye className="w-4 h-4" /> Preview
                    </button>
                </div>
            </div>

            {/* FILE IMPORT SECTION */}
            <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl p-6 rounded-xl border border-slate-200 dark:border-white/10 shadow-lg">
                <div className="flex items-center gap-2 text-primary font-bold text-sm uppercase tracking-wider mb-4">
                    <Globe className="w-4 h-4" /> Import External Data
                </div>
                
                <div className="flex items-center gap-4">
                    <div className="relative flex-1">
                        <input 
                            type="file" 
                            ref={fileInputRef}
                            accept=".txt,.docx"
                            onChange={handleFileSelect}
                            className="hidden"
                            id="chord-file-import"
                        />
                        <label 
                            htmlFor="chord-file-import" 
                            className={cn(
                                "flex items-center justify-between w-full p-3 rounded-lg border border-dashed border-slate-300 dark:border-white/20 bg-slate-50 dark:bg-slate-950 cursor-pointer hover:bg-slate-100 dark:hover:bg-white/5 transition-colors",
                                isProcessingFile && "opacity-50 cursor-not-allowed"
                            )}
                        >
                            <span className="text-sm text-slate-500 dark:text-slate-400">
                                {isProcessingFile ? "Processing..." : "Click to select Chord Sheet (.docx / .txt)"}
                            </span>
                            <FileText className="w-5 h-5 text-slate-400" />
                        </label>
                    </div>
                    
                    <button 
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isProcessingFile}
                        className="px-6 py-3 bg-gradient-to-r from-slate-800 to-slate-900 dark:from-white dark:to-slate-200 text-white dark:text-slate-900 rounded-lg font-bold text-sm flex items-center gap-2 transition-all hover:shadow-lg disabled:opacity-50 whitespace-nowrap active:scale-95"
                    >
                        {isProcessingFile ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
                        Process File
                    </button>
                </div>

                {importStatus && (
                    <div className={cn(
                        "mt-4 p-3 rounded-lg text-xs font-medium flex items-center gap-2 animate-in slide-in-from-top-2",
                        importStatus.type === 'success' ? "bg-green-500/10 text-green-600 border border-green-500/20" : "bg-red-500/10 text-red-500 border border-red-500/20"
                    )}>
                        {importStatus.type === 'success' ? <CheckCircle className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
                        {importStatus.msg}
                    </div>
                )}
            </div>
            
            <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-2 gap-6 bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-white/10 shadow-sm">
                    <div>
                        <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Title</label>
                        <input required value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} placeholder="Song title" className="w-full p-2.5 rounded-lg border bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-white/10 text-slate-900 dark:text-white focus:ring-1 focus:ring-primary outline-none" />
                    </div>
                    <div>
                        <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Artist</label>
                        <input required value={formData.artist} onChange={e => setFormData({...formData, artist: e.target.value})} placeholder="Artist name" className="w-full p-2.5 rounded-lg border bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-white/10 text-slate-900 dark:text-white focus:ring-1 focus:ring-primary outline-none" />
                    </div>
                    <div>
                        <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Difficulty</label>
                        <select value={formData.difficulty} onChange={e => setFormData({...formData, difficulty: e.target.value})} className="w-full p-2.5 rounded-lg border bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-white/10 text-slate-900 dark:text-white focus:ring-1 focus:ring-primary outline-none">
                            <option>Easy</option>
                            <option>Medium</option>
                            <option>Hard</option>
                            <option>Expert</option>
                        </select>
                    </div>
                     <div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Spotify Track ID</label>
                                <input value={formData.spotify_id} onChange={e => setFormData({...formData, spotify_id: e.target.value})} placeholder="Optional" className="w-full p-2.5 rounded-lg border bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-white/10 text-slate-900 dark:text-white focus:ring-1 focus:ring-primary outline-none" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold uppercase text-slate-500 mb-1">YouTube Video ID</label>
                                <input value={formData.youtube_id} onChange={e => setFormData({...formData, youtube_id: e.target.value})} placeholder="Optional" className="w-full p-2.5 rounded-lg border bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-white/10 text-slate-900 dark:text-white focus:ring-1 focus:ring-primary outline-none" />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="lg:col-span-3 space-y-4">
                    {mode === 'edit' ? (
                        <>
                             {/* Toolbar */}
                             <div className="flex items-center justify-between bg-slate-100 dark:bg-slate-800 p-2 rounded-t-xl border-b border-slate-200 dark:border-white/10">
                                <div className="flex items-center gap-2 text-xs font-bold text-slate-500 px-2">
                                    <Music className="w-4 h-4" /> Chords & Lyrics Editor
                                </div>
                             </div>
                            
                            {/* Quick Insert Panel */}
                            <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-white/10 shadow-sm dark:shadow-inner">
                                <div className="flex items-center justify-between mb-4">
                                     <h3 className="text-slate-900 dark:text-white font-bold text-sm flex items-center gap-2 shrink-0"><Grid className="w-4 h-4 text-primary" /> Quick Insert Chords</h3>
                                     
                                     {/* Scrollable Tabs */}
                                     <div className="overflow-x-auto pb-1 ml-4 w-full no-scrollbar">
                                         <div className="flex gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg w-max min-w-full">
                                             {Object.keys(CHORD_FAMILIES).map(fam => (
                                                 <button 
                                                    type="button"
                                                    key={fam}
                                                    onClick={() => setChordCategory(fam)}
                                                    className={cn(
                                                        "px-3 py-1.5 rounded-md text-[10px] font-bold uppercase transition-all whitespace-nowrap",
                                                        chordCategory === fam 
                                                            ? "bg-white dark:bg-slate-700 text-primary dark:text-white shadow-sm ring-1 ring-black/5 dark:ring-white/10" 
                                                            : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/50 dark:hover:bg-white/5"
                                                    )}
                                                 >
                                                     {fam}
                                                 </button>
                                             ))}
                                         </div>
                                     </div>
                                </div>
                                
                                {/* Chord Buttons Grid */}
                                <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-2 max-h-48 overflow-y-auto custom-scrollbar p-1">
                                     {CHORD_FAMILIES[chordCategory]?.map(chord => (
                                         <button
                                            type="button"
                                            key={chord}
                                            onClick={() => insertAtCursor(chord)}
                                            className="bg-slate-50 dark:bg-slate-800 hover:bg-primary hover:text-white dark:hover:bg-primary dark:hover:text-white text-slate-700 dark:text-slate-200 text-xs font-bold py-2.5 rounded-lg border border-slate-200 dark:border-white/5 transition-all active:scale-95 shadow-sm"
                                        >
                                            {chord}
                                        </button>
                                     ))}
                                </div>
                            </div>

                            <textarea 
                                ref={textareaRef}
                                required 
                                value={formData.rawText} 
                                onChange={e => setFormData({...formData, rawText: e.target.value})} 
                                className="w-full p-6 rounded-b-xl border border-t-0 bg-white dark:bg-slate-900 border-slate-200 dark:border-white/10 font-mono text-sm text-slate-900 dark:text-white min-h-[500px] focus:ring-0 outline-none leading-relaxed" 
                                placeholder="Type lyrics here. Use [Bracket] notation for chords. e.g. [C]Hello [G]World"
                            />
                        </>
                    ) : (
                        /* Live Preview Mode using actual SongLyricsDisplay */
                        <div className="relative bg-white/80 dark:bg-[#0A0F1C]/90 backdrop-blur-xl rounded-2xl border border-slate-200 dark:border-white/10 p-10 shadow-xl min-h-[500px]">
                            <SongLyricsDisplay html={html} />
                        </div>
                    )}
                </div>

                <div className="lg:col-span-3 flex justify-end">
                    <button type="submit" disabled={loading} className="bg-primary hover:bg-primary/90 text-white px-8 py-3 rounded-lg font-bold shadow-lg transition-all flex items-center gap-2 disabled:opacity-50">
                        <Save className="w-5 h-5" />
                        {loading ? 'Saving...' : 'Save Song'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default ManualEntry;
