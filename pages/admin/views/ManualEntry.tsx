import React, { useState, useEffect, useRef } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { Save, Eye, Edit3, ArrowLeft } from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { Song } from '../../../types';
import { cn } from '../../../lib/utils';
import { convertToChordPro } from '../../../lib/musicUtils';
import SongLyricsDisplay from '../../../components/SongLyricsDisplay';
import { useChordSheetParser } from '../../../lib/hooks/useChordSheetParser';
import * as mammoth from 'mammoth';
import { extractTextFromPdf } from '../../../lib/pdfUtils';
import { ImportSection } from '../../../components/admin/ManualEntry/ImportSection';
import { SongMetadataForm } from '../../../components/admin/ManualEntry/SongMetadataForm';
import { EditorToolbar } from '../../../components/admin/ManualEntry/EditorToolbar';
import { QuickInsertPanel } from '../../../components/admin/ManualEntry/QuickInsertPanel';
import { useToast } from '../../../contexts/ToastContext';

const ManualEntry: React.FC = () => {
    const location = useLocation();
    const state = location.state as { songToEdit?: Song } | null;
    const [mode, setMode] = useState<'edit' | 'preview'>('edit');
    const { toast, success, error: toastError } = useToast();

    // Import State
    const [isProcessingFile, setIsProcessingFile] = useState(false);
    const [urlInput, setUrlInput] = useState('');
    const [isScraping, setIsScraping] = useState(false);
    const [importStatus, setImportStatus] = useState<{ type: 'success' | 'error', msg: string } | null>(null);

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
    const [selectedQuality, setSelectedQuality] = useState({ label: 'MAJOR', suffix: '' });
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    // Live Parser for Preview Mode
    const { html } = useChordSheetParser({ songData: formData.rawText });

    useEffect(() => {
        if (state?.songToEdit) {
            const s = state.songToEdit;
            let raw = '';
            if (s.chords) {
                if (Array.isArray(s.chords) && s.chords.length > 0) {
                    if (typeof s.chords[0] === 'string') {
                        raw = (s.chords as unknown as string[]).join('\n');
                    } else {
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        raw = (s.chords as any[]).map((line: any) => {
                            if (line.chords && line.chords.length > 0) {
                                const chordStr = line.chords.map((c: string) => `[${c}]`).join('');
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
                rawContent = await file.text();
            }

            if (!rawContent || rawContent.length < 10) throw new Error("File is empty or too short.");

            // CRITICAL: Convert Spatial/Text layout to ChordPro immediately.
            const processedText = convertToChordPro(rawContent);

            const lines = rawContent.split('\n').filter(l => l.trim().length > 0);
            const detectedTitle = lines[0]?.replace(/\[.*?\]/g, '').trim() || "";
            const artistLine = lines.slice(0, 5).find(l => l.toLowerCase().includes('by '));
            const detectedArtist = artistLine ? artistLine.replace(/^by\s+/i, '').trim() : "";

            setFormData(prev => ({
                ...prev,
                rawText: processedText,
                title: !prev.title && detectedTitle.length < 50 ? detectedTitle : prev.title,
                artist: !prev.artist && detectedArtist.length < 50 ? detectedArtist : prev.artist
            }));

            setImportStatus({ type: 'success', msg: `Processed "${file.name}" successfully. Layout preserved & converted to ChordPro.` });
            success(`Processed "${file.name}" successfully.`);

        } catch (error: any) {
            console.error(error);
            const msg = "Failed to process file. " + (error.message || "Unknown error");
            setImportStatus({ type: 'error', msg });
            toastError(msg);
        } finally {
            setIsProcessingFile(false);
            e.target.value = ''; // Reset input
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

            setFormData(prev => ({
                ...prev,
                title: data.title || prev.title,
                artist: data.artist || prev.artist,
                rawText: data.rawText || prev.rawText
            }));

            const msg = `Successfully scraped "${data.title}" from ${new URL(urlInput).hostname}`;
            setImportStatus({ type: 'success', msg });
            success(msg);
            setUrlInput('');
        } catch (err: any) {
            const msg = "Scrape failed: " + (err.message || "Unknown error");
            setImportStatus({ type: 'error', msg });
            toastError(msg);
        } finally {
            setIsScraping(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        const lines = formData.rawText.split('\n');
        const payload = {
            title: formData.title,
            artist: formData.artist,
            difficulty: formData.difficulty,
            spotify_track_id: formData.spotify_id,
            youtube_video_id: formData.youtube_id,
            chords: lines,
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
        if (error) {
            toastError('Error: ' + error.message);
        } else {
            success(formData.id ? 'Song updated!' : 'Song added successfully!');
            if (!formData.id) setFormData({ id: '', title: '', artist: '', difficulty: 'Medium', spotify_id: '', youtube_id: '', rawText: '' });
        }
    };

    const insertAtCursor = (root: string) => {
        const chord = `${root}${selectedQuality.suffix}`;

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
        const converted = convertToChordPro(formData.rawText);
        setFormData({ ...formData, rawText: converted });
        setImportStatus({ type: 'success', msg: 'Text structure converted to ChordPro format.' });
        success('Converted to ChordPro format');
    };

    const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
        const pastedText = e.clipboardData.getData('text');
        if (!pastedText) return;

        const hasBrackets = /\[[A-G][#b]?[^\]]*\]/.test(pastedText);

        if (!hasBrackets) {
            const converted = convertToChordPro(pastedText);
            if (converted !== pastedText && /\[[A-G][#b]?[^\]]*\]/.test(converted)) {
                e.preventDefault();

                if (textareaRef.current) {
                    const start = textareaRef.current.selectionStart;
                    const end = textareaRef.current.selectionEnd;
                    const currentText = formData.rawText;
                    const newText = currentText.substring(0, start) + converted + currentText.substring(end);

                    setFormData({ ...formData, rawText: newText });
                    setImportStatus({ type: 'success', msg: 'Standard text detected & auto-converted to ChordPro.' });
                    toast('info', 'Auto-converted pasted text to ChordPro', 2000);

                    setTimeout(() => {
                        if (textareaRef.current) {
                            textareaRef.current.focus();
                            textareaRef.current.selectionStart = start + converted.length;
                            textareaRef.current.selectionEnd = start + converted.length;
                        }
                    }, 0);
                }
            }
        }
    };

    return (
        <div className="p-8 animate-in fade-in duration-500 space-y-8">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link to="/admin/songs" className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-white/5 text-slate-500 transition-colors">
                        <ArrowLeft className="w-5 h-5" />
                    </Link>
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">{formData.id ? 'Edit Song' : 'Manual Song Entry'}</h1>
                        <p className="text-slate-500 mt-1">Create or modify song data manually.</p>
                    </div>
                </div>
                
                <div className="flex bg-white/50 dark:bg-slate-900/50 p-1.5 rounded-xl border border-slate-200/60 dark:border-white/5 backdrop-blur-sm">
                    <button
                        type="button"
                        onClick={() => setMode('edit')}
                        className={cn(
                            "px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all duration-300",
                            mode === 'edit' 
                                ? "bg-white dark:bg-slate-800 shadow-sm text-primary dark:text-white scale-105" 
                                : "text-slate-500 hover:text-slate-900 dark:hover:text-slate-300"
                        )}
                    >
                        <Edit3 className="w-4 h-4" /> Editor
                    </button>
                    <button
                        type="button"
                        onClick={() => setMode('preview')}
                        className={cn(
                            "px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all duration-300",
                            mode === 'preview' 
                                ? "bg-white dark:bg-slate-800 shadow-sm text-primary dark:text-white scale-105" 
                                : "text-slate-500 hover:text-slate-900 dark:hover:text-slate-300"
                        )}
                    >
                        <Eye className="w-4 h-4" /> Preview
                    </button>
                </div>
            </div>

            {/* IMPORT SECTION */}
            <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl border border-slate-200/60 dark:border-white/5 rounded-2xl p-6 shadow-sm">
                <ImportSection
                    isProcessingFile={isProcessingFile}
                    isScraping={isScraping}
                    urlInput={urlInput}
                    importStatus={importStatus}
                    onFileSelect={handleFileSelect}
                    onUrlChange={setUrlInput}
                    onUrlScrape={handleUrlScrape}
                />
            </div>

            <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-1 bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl border border-slate-200/60 dark:border-white/5 rounded-2xl p-6 shadow-sm h-fit">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Metadata</h3>
                    <SongMetadataForm
                        title={formData.title}
                        artist={formData.artist}
                        difficulty={formData.difficulty}
                        spotifyId={formData.spotify_id}
                        youtubeId={formData.youtube_id}
                        onChange={(field, value) => setFormData(prev => ({ ...prev, [field]: value }))}
                    />
                </div>

                <div className="lg:col-span-2 space-y-4">
                    {mode === 'edit' ? (
                        <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl border border-slate-200/60 dark:border-white/5 rounded-2xl overflow-hidden shadow-sm flex flex-col min-h-[600px]">
                            {/* Toolbar */}
                            <div className="border-b border-slate-200/60 dark:border-white/5 bg-slate-50/50 dark:bg-slate-950/50 p-2">
                                <EditorToolbar
                                    onAutoConvert={handleAutoConvert}
                                    onRefresh={() => {
                                        const converted = convertToChordPro(formData.rawText);
                                        setFormData({ ...formData, rawText: converted });
                                    }}
                                />
                            </div>

                            {/* Quick Insert Panel */}
                            <div className="border-b border-slate-200/60 dark:border-white/5 bg-slate-50/30 dark:bg-slate-950/30 p-2">
                                <QuickInsertPanel
                                    selectedQuality={selectedQuality}
                                    onQualitySelect={setSelectedQuality}
                                    onInsert={insertAtCursor}
                                />
                            </div>

                            <textarea
                                ref={textareaRef}
                                required
                                value={formData.rawText}
                                onChange={e => setFormData({ ...formData, rawText: e.target.value })}
                                onPaste={handlePaste}
                                className="flex-1 w-full p-6 bg-transparent font-mono text-sm text-slate-900 dark:text-white focus:ring-0 outline-none leading-relaxed resize-none"
                                placeholder="Type lyrics here. Use [Bracket] notation for chords. e.g. [C]Hello [G]World"
                            />
                        </div>
                    ) : (
                        /* Live Preview Mode */
                        <div className="relative bg-white/80 dark:bg-[#0A0F1C]/90 backdrop-blur-xl rounded-2xl border border-slate-200 dark:border-white/10 p-10 shadow-xl min-h-[600px]">
                            <SongLyricsDisplay html={html} />
                        </div>
                    )}
                </div>

                <div className="lg:col-span-3 flex justify-end pt-4 border-t border-slate-200/60 dark:border-white/5">
                    <button 
                        type="submit" 
                        disabled={loading} 
                        className="bg-gradient-to-r from-primary to-purple-600 hover:shadow-lg hover:shadow-primary/25 text-white px-8 py-3 rounded-xl font-bold transition-all duration-300 flex items-center gap-2 disabled:opacity-50 hover:scale-105 active:scale-95"
                    >
                        <Save className="w-5 h-5" />
                        {loading ? 'Saving...' : 'Save Song'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default ManualEntry;
