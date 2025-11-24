
import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { Music, Save, Grid, Eye, Edit3, Globe, Loader2, AlertTriangle, CheckCircle, FileText, Link as LinkIcon, Download, Lock, RefreshCw } from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { Song } from '../../../types';
import { cn } from '../../../lib/utils';
import { CHORD_FAMILIES, convertToChordPro } from '../../../lib/musicUtils';
import SongLyricsDisplay from '../../../components/SongLyricsDisplay';
import { useChordSheetParser } from '../../../lib/hooks/useChordSheetParser';
import * as mammoth from 'mammoth';
import * as pdfjsLib from 'pdfjs-dist';

// --- PDF WORKER INITIALIZATION ---
// We use CDNJS because esm.sh often has strict CORS on Web Workers or version mismatch issues.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const pdfApi = (pdfjsLib as any).default || pdfjsLib;
if (typeof window !== 'undefined' && pdfApi) {
    // Manually set worker source to a stable CDN that matches the imported version (3.11.174)
    // This fixes "Uncaught TypeError: Cannot set properties of undefined (setting 'workerSrc')"
    // and "NetworkError" due to CORS.
    if (!pdfApi.GlobalWorkerOptions.workerSrc) {
        pdfApi.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
    }
}

const ManualEntry: React.FC = () => {
    const location = useLocation();
    const state = location.state as { songToEdit?: Song } | null;
    const [mode, setMode] = useState<'edit' | 'preview'>('edit');
    
    // Import State
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isProcessingFile, setIsProcessingFile] = useState(false);
    const [urlInput, setUrlInput] = useState('');
    const [isScraping, setIsScraping] = useState(false);
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
                        interface ChordLine { line: string; chords: string[] }
                        raw = (s.chords as unknown as ChordLine[]).map((line) => {
                             if (line.chords && line.chords.length > 0) {
                                 // Reconstruct brackets for editing consistency
                                 const chordStr = line.chords.map((c) => `[${c}]`).join('');
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

    /**
     * PDF Text Extractor with Layout Preservation (Spatial Analysis)
     */
    const extractTextFromPdf = async (arrayBuffer: ArrayBuffer): Promise<string> => {
        try {
            if (!pdfApi || !pdfApi.getDocument) {
                throw new Error("PDF Library not initialized correctly.");
            }

            const loadingTask = pdfApi.getDocument({ data: arrayBuffer });
            const pdf = await loadingTask.promise;
            let fullText = '';

            for (let i = 1; i <= pdf.numPages; i++) {
                const page = await pdf.getPage(i);
                const textContent = await page.getTextContent();
                
                // Map items to include coordinate data
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const items = textContent.items.map((item: any) => ({
                    str: item.str,
                    x: item.transform[4], // x coordinate
                    y: item.transform[5], // y coordinate
                    width: item.width,
                    height: item.height || 10
                }));

                // 1. Group items into lines based on Y position (Row clustering)
                const lines: Record<string, typeof items> = {};
                const tolerance = 4; // Tolerance for slight Y misalignments (e.g. subscripts)

                items.forEach(item => {
                    // Find an existing line key that is close enough
                    const existingY = Object.keys(lines).find(y => Math.abs(Number(y) - item.y) < tolerance);
                    const key = existingY || item.y.toString();
                    
                    if (!lines[key]) lines[key] = [];
                    lines[key].push(item);
                });

                // 2. Sort lines from Top to Bottom (PDF Y origin is bottom-left)
                const sortedY = Object.keys(lines).sort((a, b) => Number(b) - Number(a));

                sortedY.forEach(y => {
                    // 3. Sort items in the line from Left to Right
                    const lineItems = lines[y].sort((a, b) => a.x - b.x);
                    let lineStr = '';
                    let lastX = 0; 
                    
                    // Normalize start x (margin)
                    if (lineItems.length > 0) lastX = lineItems[0].x;

                    lineItems.forEach(item => {
                        // 4. Calculate gap from previous item
                        // Only add spaces if we aren't at the absolute start
                        const gap = item.x - lastX;
                        
                        // Heuristic: Average font character width is roughly height * 0.4 or ~4-5 units
                        // We insert spaces if the gap is significant.
                        // This preserves the "Chord ...... Chord" spacing.
                        if (gap > 2) {
                            // 3.5 is an arbitrary divisor to approximate space width in PDF units
                            const spaces = Math.max(0, Math.floor(gap / 3.5));
                            lineStr += ' '.repeat(spaces);
                        }
                        
                        lineStr += item.str;
                        lastX = item.x + item.width;
                    });

                    fullText += lineStr + '\n';
                });
                
                fullText += '\n';
            }

            return fullText;
        } catch (e: unknown) {
            console.error("PDF Extraction Error:", e);
            if (e instanceof Error) {
                 throw new Error("Could not read PDF. " + (e.message || "Worker failed."));
            } else {
                 throw new Error("Could not read PDF. Unknown error.");
            }
        }
    };

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsProcessingFile(true);
        setImportStatus(null);

        try {
            let rawContent = "";
            
            if (file.name.toLowerCase().endsWith('.pdf')) {
                const arrayBuffer = await file.arrayBuffer();
                rawContent = await extractTextFromPdf(arrayBuffer);
            } 
            else if (file.name.toLowerCase().endsWith('.docx')) {
                const arrayBuffer = await file.arrayBuffer();
                const result = await mammoth.extractRawText({ arrayBuffer });
                rawContent = result.value;
            } 
            else {
                // Text file
                rawContent = await file.text();
            }

            if (!rawContent || rawContent.length < 10) throw new Error("File is empty or too short.");

            // CRITICAL: Convert Spatial/Text layout to ChordPro immediately.
            // This ensures features like Transpose/Capo/Size work because they rely on
            // identifying [Chord] syntax, not just raw text lines.
            const processedText = convertToChordPro(rawContent);

            // 2. Metadata Extraction (Heuristics)
            const lines = rawContent.split('\n').filter(l => l.trim().length > 0);
            const detectedTitle = lines[0]?.replace(/\[.*?\]/g, '').trim() || "";
            // Try to find artist in first few lines
            const artistLine = lines.slice(0, 5).find(l => l.toLowerCase().includes('by '));
            const detectedArtist = artistLine ? artistLine.replace(/^by\s+/i, '').trim() : "";

            setFormData(prev => ({
                ...prev,
                rawText: processedText, // Load the converted ChordPro text
                title: !prev.title && detectedTitle.length < 50 ? detectedTitle : prev.title,
                artist: !prev.artist && detectedArtist.length < 50 ? detectedArtist : prev.artist
            }));

            setImportStatus({ type: 'success', msg: `Processed "${file.name}" successfully. Layout preserved & converted to ChordPro.` });

        } catch (error: unknown) {
            console.error(error);
             if (error instanceof Error) {
                setImportStatus({ type: 'error', msg: "Failed to process file. " + error.message });
            } else {
                 setImportStatus({ type: 'error', msg: "Failed to process file. Unknown error." });
            }
        } finally {
            setIsProcessingFile(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const handleUrlScrape = async (e: React.MouseEvent) => {
        e.preventDefault();
        if (!urlInput) return;
        setIsScraping(true);
        setImportStatus(null);

        try {
            const { data, error } = await supabase.functions.invoke('scrape-song', {
                body: { url: urlInput }
            });

            if (error) throw error;
            if (data.error) throw new Error(data.error);

            // The Edge Function 'scrape-song' also runs convertToChordPro,
            // so the data.rawText is already in [Chord]Lyrics format.
            setFormData(prev => ({
                ...prev,
                title: data.title || prev.title,
                artist: data.artist || prev.artist,
                rawText: data.rawText || prev.rawText
            }));

            setImportStatus({ type: 'success', msg: `Successfully scraped "${data.title}" from ${new URL(urlInput).hostname}` });
            setUrlInput('');
        } catch (err: unknown) {
             if (err instanceof Error) {
                setImportStatus({ type: 'error', msg: "Scrape failed: " + err.message });
            } else {
                 setImportStatus({ type: 'error', msg: "Scrape failed. Unknown error." });
            }
        } finally {
            setIsScraping(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        // Store strings array for DB compatibility (legacy format), 
        // but content is fully ChordPro formatted text.
        const lines = formData.rawText.split('\n');

        const payload = {
            title: formData.title,
            artist: formData.artist,
            difficulty: formData.difficulty,
            spotify_track_id: formData.spotify_id,
            youtube_video_id: formData.youtube_id,
            chords: lines, // Stored as array of ChordPro strings
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

    const handleAutoConvert = () => {
        // Manual trigger to convert current text to ChordPro
        const converted = convertToChordPro(formData.rawText);
        setFormData({ ...formData, rawText: converted });
        setImportStatus({ type: 'success', msg: 'Text structure converted to ChordPro format.' });
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

            {/* IMPORT SECTION */}
            <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl p-6 rounded-xl border border-slate-200 dark:border-white/10 shadow-lg">
                <div className="flex justify-between items-start mb-6">
                    <div className="flex items-center gap-2 text-primary font-bold text-sm uppercase tracking-wider">
                        <Globe className="w-4 h-4" /> Import Source
                    </div>
                    <div className="flex items-center gap-1.5 text-[10px] font-bold bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 px-2 py-1 rounded-full border border-blue-200 dark:border-blue-900/30">
                        <Lock className="w-3 h-3" />
                        Smart Layout Engine Active
                    </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* File Upload */}
                    <div className="space-y-3 border-r border-slate-200 dark:border-white/5 md:pr-8">
                        <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase flex items-center gap-2">
                            <FileText className="w-3 h-3" /> From File (PDF / Word / Txt)
                        </label>
                        <div className="flex gap-2">
                            <div className="relative flex-1">
                                <input 
                                    type="file" 
                                    ref={fileInputRef}
                                    accept=".txt,.docx,.pdf"
                                    onChange={handleFileSelect}
                                    className="hidden"
                                    id="chord-file-import"
                                />
                                <label 
                                    htmlFor="chord-file-import" 
                                    className={cn(
                                        "flex items-center justify-between w-full px-3 py-2.5 rounded-lg border border-dashed border-slate-300 dark:border-white/20 bg-slate-50 dark:bg-slate-950 cursor-pointer hover:bg-slate-100 dark:hover:bg-white/5 transition-colors",
                                        isProcessingFile && "opacity-50 cursor-not-allowed"
                                    )}
                                >
                                    <span className="text-sm text-slate-500 dark:text-slate-400 truncate">
                                        {isProcessingFile ? "Extracting Spatial Data..." : "Select PDF, DOCX, or TXT..."}
                                    </span>
                                </label>
                            </div>
                            
                            <button 
                                onClick={() => fileInputRef.current?.click()}
                                disabled={isProcessingFile}
                                className="px-4 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-lg font-bold text-xs hover:bg-slate-200 dark:hover:bg-slate-700 transition-all flex items-center gap-2"
                            >
                                {isProcessingFile ? <Loader2 className="w-4 h-4 animate-spin" /> : "Upload"}
                            </button>
                        </div>
                        <p className="text-[10px] text-slate-400">PDFs are analyzed geometrically to preserve Chord-over-Lyric positioning.</p>
                    </div>

                    {/* URL Scrape */}
                    <div className="space-y-3">
                        <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase flex items-center gap-2">
                            <LinkIcon className="w-3 h-3" /> From URL (ChordTela / UG)
                        </label>
                        <div className="flex gap-2">
                            <div className="relative flex-1">
                                <input 
                                    type="url"
                                    value={urlInput}
                                    onChange={(e) => setUrlInput(e.target.value)}
                                    placeholder="https://www.chordtela.com/..."
                                    className="w-full px-3 py-2.5 rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-950 text-sm text-slate-900 dark:text-white focus:ring-1 focus:ring-primary outline-none"
                                />
                            </div>
                            <button 
                                onClick={handleUrlScrape}
                                disabled={isScraping || !urlInput}
                                className="px-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-lg font-bold text-xs hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center gap-2 min-w-[80px] justify-center"
                            >
                                {isScraping ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                                Fetch
                            </button>
                        </div>
                    </div>
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
                                <button 
                                    type="button"
                                    onClick={handleAutoConvert}
                                    className="flex items-center gap-1.5 text-[10px] font-bold bg-primary/10 text-primary px-3 py-1.5 rounded hover:bg-primary/20 transition-colors"
                                    title="Converts text chords like 'Am' to ChordPro '[Am]'"
                                >
                                    <RefreshCw className="w-3 h-3" /> Convert to ChordPro
                                </button>
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
                        /* Live Preview Mode */
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
