
import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { Music, Zap, Save, Grid, Eye, Edit3 } from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { Song } from '../../../types';
import { cn } from '../../../lib/utils';
import { CHORD_FAMILIES, parseChordsFromText } from '../../../lib/musicUtils';

const ManualEntry: React.FC = () => {
    const location = useLocation();
    const state = location.state as { songToEdit?: Song } | null;
    const [mode, setMode] = useState<'edit' | 'preview'>('edit');
    
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

    useEffect(() => {
        if (state?.songToEdit) {
            const s = state.songToEdit;
            let raw = '';
            if (s.chords) {
                raw = s.chords.map((line: any) => {
                    // If line has chords but content is same as chords, it's a chord line
                    // Just simple reconstruction
                    return `${line.line}`;
                }).join('\n');
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
            
            // Automatically wrap in brackets for ChordPro format
            const textToInsert = `[${chord}]`;
            
            const newText = currentText.substring(0, start) + textToInsert + currentText.substring(end);
            setFormData({ ...formData, rawText: newText });
            
            // Restore focus and cursor
            setTimeout(() => {
                if (textareaRef.current) {
                    textareaRef.current.focus();
                    textareaRef.current.selectionStart = start + textToInsert.length;
                    textareaRef.current.selectionEnd = start + textToInsert.length;
                }
            }, 0);
        }
    };

    const previewData = parseChordsFromText(formData.rawText);

    return (
        <div className="p-8 animate-in fade-in">
            <div className="flex items-center justify-between mb-8">
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
                                <div className="flex items-center gap-2">
                                     <button type="button" className="flex items-center gap-1 text-xs font-bold px-3 py-1.5 bg-white dark:bg-slate-700 rounded hover:bg-slate-50 dark:hover:bg-slate-600 transition-colors shadow-sm border border-slate-200 dark:border-transparent text-slate-700 dark:text-white">
                                         <Zap className="w-3 h-3 text-yellow-500" /> Format with AI
                                     </button>
                                </div>
                             </div>
                            
                            {/* Quick Insert Panel */}
                            <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-white/10 shadow-sm dark:shadow-inner">
                                <div className="flex items-center justify-between mb-4">
                                     <h3 className="text-slate-900 dark:text-white font-bold text-sm flex items-center gap-2 shrink-0"><Grid className="w-4 h-4 text-primary" /> Quick Insert Chords</h3>
                                     
                                     {/* Scrollable Tabs */}
                                     <div className="overflow-x-auto pb-1 ml-4 w-full">
                                         <div className="flex gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg w-max min-w-full">
                                             {Object.keys(CHORD_FAMILIES).map(fam => (
                                                 <button 
                                                    type="button"
                                                    key={fam}
                                                    onClick={() => setChordCategory(fam)}
                                                    className={cn(
                                                        "px-3 py-1.5 rounded text-[10px] font-bold uppercase transition-all whitespace-nowrap",
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
                                <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2 max-h-48 overflow-y-auto custom-scrollbar p-1">
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
                                className="w-full p-6 rounded-b-xl border border-t-0 bg-white dark:bg-slate-950 border-slate-200 dark:border-white/10 font-mono text-sm text-slate-900 dark:text-white min-h-[500px] focus:ring-0 outline-none leading-relaxed" 
                                placeholder="Type lyrics here. Click chord buttons above to insert [Chord] at cursor position."
                            />
                        </>
                    ) : (
                        /* Preview Mode */
                        <div className="relative bg-white/80 dark:bg-[#0A0F1C]/90 backdrop-blur-xl rounded-2xl border border-slate-200 dark:border-white/10 p-10 shadow-xl min-h-[500px]">
                             <div className="space-y-8 font-mono selection:bg-primary/30" style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: `16px` }}>
                                {previewData.map((section: any, idx: number) => (
                                    <div key={idx} className="relative mb-8 group/line break-inside-avoid">
                                        <div className="min-h-[1.6em] mb-1.5 flex flex-wrap gap-x-4 font-bold select-none text-cyan-400">
                                            {section.chords?.length > 0 ? section.chords.map((chord: string, cIdx: number) => (
                                                <span key={cIdx} className="inline-block bg-cyan-500/10 px-1 rounded text-cyan-400">{chord}</span>
                                            )) : <span className="opacity-0">.</span>}
                                        </div>
                                        <div className="text-slate-700 dark:text-slate-200 leading-relaxed whitespace-pre-wrap">{section.line || " "}</div>
                                    </div>
                                ))}
                            </div>
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
