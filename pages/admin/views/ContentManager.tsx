import React, { useState, useEffect, useCallback } from 'react';
import { LayoutTemplate, FileText, Save, Info, ChevronRight, Plus, Trash2, AlertTriangle, Twitter, Github, Instagram, Mail } from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { cn } from '../../../lib/utils';
import { useToast } from '../../../contexts/ToastContext';
import { PageContent } from '../../../types';

const ContentManager: React.FC = () => {
    const [pages, setPages] = useState<PageContent[]>([]);
    const [selectedPageId, setSelectedPageId] = useState<string>('home');
    const [editContent, setEditContent] = useState<Record<string, any>>({});
    const [viewMode, setViewMode] = useState<'visual' | 'json'>('visual');
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [loading, setLoading] = useState(false);
    const { success, error: toastError } = useToast();

    // New Field State
    const [newFieldKey, setNewFieldKey] = useState('');
    const [showAddField, setShowAddField] = useState(false);

    const fetchContent = useCallback(async () => {
        setLoading(true);
        const { data, error } = await supabase.from('page_content').select('*');
        if (error) {
            toastError('Failed to fetch content: ' + error.message);
        } else if (data) {
            setPages(data as PageContent[]);
            const current = data.find(p => p.id === selectedPageId);
            if (current) setEditContent(current.content);
        }
        setLoading(false);
    }, [selectedPageId, toastError]);

    useEffect(() => {
        fetchContent();
    }, [fetchContent]);

    const handlePageSelect = (pageId: string) => {
        setSelectedPageId(pageId);
        const p = pages.find(x => x.id === pageId);
        setEditContent(p ? p.content : {});
        setShowAddField(false);
        setNewFieldKey('');
    };

    const handleSave = async () => {
        try {
            const { error } = await supabase
                .from('page_content')
                .upsert({ id: selectedPageId, content: editContent, updated_at: new Date().toISOString() });
            
            if (error) throw error;
            success('Content updated successfully! Changes are live.');
            fetchContent();
        } catch (e: any) {
            toastError('Error saving: ' + (e.message || "Unknown error"));
        }
    };

    const updateField = (key: string, value: any) => {
        setEditContent((prev) => ({ ...prev, [key]: value }));
    };

    const updateNestedField = (parent: string, key: string, value: any) => {
        setEditContent((prev) => ({
            ...prev,
            [parent]: {
                ...prev[parent],
                [key]: value
            }
        }));
    };

    const removeField = (key: string) => {
        if (!confirm(`Are you sure you want to delete the field "${key}"?`)) return;
        setEditContent(prev => {
            const next = { ...prev };
            delete next[key];
            return next;
        });
    };

    const addNewField = () => {
        if (!newFieldKey) return;
        if (editContent[newFieldKey]) {
            toastError('Field already exists!');
            return;
        }
        setEditContent(prev => ({ ...prev, [newFieldKey]: '' }));
        setNewFieldKey('');
        setShowAddField(false);
        success('New field added. You can now edit it.');
    };

    // Helper to determine if a field is "standard" for the current page (to show in the main UI)
    const isStandardField = (key: string) => {
        if (selectedPageId === 'home') return ['hero_title', 'hero_subtitle', 'hero_title_prefix', 'hero_title_words'].includes(key);
        if (selectedPageId === 'about') return ['title', 'subtitle', 'mission_title', 'mission_text', 'founded_text', 'cta_title', 'cta_text', 'cta_btn_primary', 'cta_btn_secondary', 'commitments', 'commitments_title', 'bento_items'].includes(key);
        if (selectedPageId === 'footer') return ['brand_description', 'made_by_text', 'copyright_text', 'socials'].includes(key);
        return false;
    };

    // Get non-standard fields for the "Extra Fields" section
    const extraFields = Object.keys(editContent).filter(key => !isStandardField(key));

    return (
        <div className="p-8 animate-in fade-in duration-500">
             <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Content Management</h1>
                    <p className="text-slate-500 mt-1">Edit website copy and configuration.</p>
                </div>
                <div className="flex bg-white/50 dark:bg-slate-900/50 p-1.5 rounded-xl border border-slate-200/60 dark:border-white/5 backdrop-blur-sm">
                    <button 
                        onClick={() => setViewMode('visual')}
                        className={cn(
                            "px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition-all duration-300", 
                            viewMode === 'visual' 
                                ? "bg-white dark:bg-slate-800 shadow-sm text-primary dark:text-white scale-105" 
                                : "text-slate-500 hover:text-slate-900 dark:hover:text-slate-300"
                        )}
                    >
                        <LayoutTemplate className="w-4 h-4" /> Visual
                    </button>
                    <button 
                        onClick={() => setViewMode('json')}
                        className={cn(
                            "px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition-all duration-300", 
                            viewMode === 'json' 
                                ? "bg-white dark:bg-slate-800 shadow-sm text-primary dark:text-white scale-105" 
                                : "text-slate-500 hover:text-slate-900 dark:hover:text-slate-300"
                        )}
                    >
                        <FileText className="w-4 h-4" /> JSON
                    </button>
                </div>
            </div>

            <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl border border-slate-200/60 dark:border-white/5 rounded-2xl overflow-hidden flex flex-col md:flex-row min-h-[600px] shadow-xl shadow-slate-200/20 dark:shadow-black/20">
                {/* Sidebar */}
                <div className="w-full md:w-72 bg-slate-50/50 dark:bg-slate-950/30 border-r border-slate-200/60 dark:border-white/5 p-6">
                    <h3 className="text-xs font-bold uppercase text-slate-400 mb-4 tracking-wider">Select Page</h3>
                    <div className="space-y-2">
                        {['home', 'about', 'footer'].map(page => (
                            <button 
                                key={page}
                                onClick={() => handlePageSelect(page)}
                                className={cn(
                                    "w-full text-left px-4 py-3 rounded-xl text-sm font-medium capitalize transition-all duration-300 flex items-center justify-between group",
                                    selectedPageId === page 
                                        ? "bg-white dark:bg-slate-800 text-primary shadow-md shadow-slate-200/50 dark:shadow-black/20 border border-slate-100 dark:border-white/5" 
                                        : "text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-white/5"
                                )}
                            >
                                {page}
                                {selectedPageId === page && <ChevronRight className="w-4 h-4 text-primary opacity-100" />}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Editor */}
                <div className="flex-1 p-8 flex flex-col relative">
                    <div className="flex justify-between items-center mb-8 pb-6 border-b border-slate-200/60 dark:border-white/5">
                        <div className="text-sm font-mono text-slate-500">Editing: <span className="text-primary font-bold uppercase tracking-wider">{selectedPageId}</span></div>
                        <button 
                            onClick={handleSave} 
                            className="flex items-center gap-2 bg-gradient-to-r from-primary to-purple-600 text-white px-6 py-2.5 rounded-xl text-sm font-bold hover:shadow-lg hover:shadow-primary/25 hover:scale-105 transition-all duration-300 active:scale-95"
                        >
                            <Save className="w-4 h-4" /> Save Changes
                        </button>
                    </div>

                    {viewMode === 'visual' ? (
                        <div className="space-y-8 max-w-3xl animate-in fade-in slide-in-from-bottom-4 duration-500">
                            {/* Standard Fields */}
                            {selectedPageId === 'home' && (
                                <>
                                    <div className="space-y-3 group">
                                        <label className="text-xs font-bold uppercase text-slate-500 group-focus-within:text-primary transition-colors">Hero Title Prefix</label>
                                        <input 
                                            value={editContent.hero_title_prefix || ''} 
                                            onChange={(e) => updateField('hero_title_prefix', e.target.value)}
                                            className="w-full p-4 rounded-xl border border-slate-200 dark:border-white/10 bg-white/50 dark:bg-slate-950/50 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary/50 focus:border-primary/50 outline-none font-bold text-lg transition-all duration-300"
                                            placeholder="Master your chords in "
                                        />
                                    </div>
                                    <div className="space-y-3 group">
                                        <label className="text-xs font-bold uppercase text-slate-500 group-focus-within:text-primary transition-colors">Hero Title Words (Comma Separated)</label>
                                        <input 
                                            value={Array.isArray(editContent.hero_title_words) ? editContent.hero_title_words.join(', ') : (editContent.hero_title_words || '')} 
                                            onChange={(e) => updateField('hero_title_words', e.target.value.split(',').map(s => s.trim()))}
                                            className="w-full p-4 rounded-xl border border-slate-200 dark:border-white/10 bg-white/50 dark:bg-slate-950/50 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary/50 focus:border-primary/50 outline-none font-bold text-lg transition-all duration-300"
                                            placeholder="Hyperspeed, Realtime, Focus"
                                        />
                                        <p className="text-[10px] text-slate-400">These words will flip/animate.</p>
                                    </div>
                                    <div className="space-y-3 group">
                                        <label className="text-xs font-bold uppercase text-slate-500 group-focus-within:text-primary transition-colors">Hero Subtitle</label>
                                        <textarea 
                                            value={editContent.hero_subtitle || ''} 
                                            onChange={(e) => updateField('hero_subtitle', e.target.value)}
                                            rows={4}
                                            className="w-full p-4 rounded-xl border border-slate-200 dark:border-white/10 bg-white/50 dark:bg-slate-950/50 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary/50 focus:border-primary/50 outline-none resize-none transition-all duration-300"
                                        />
                                    </div>
                                </>
                            )}
                            {selectedPageId === 'about' && (
                                <>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-3 group">
                                            <label className="text-xs font-bold uppercase text-slate-500 group-focus-within:text-primary transition-colors">Page Title</label>
                                            <input 
                                                value={editContent.title || ''} 
                                                onChange={(e) => updateField('title', e.target.value)}
                                                className="w-full p-4 rounded-xl border border-slate-200 dark:border-white/10 bg-white/50 dark:bg-slate-950/50 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary/50 focus:border-primary/50 outline-none font-bold text-lg transition-all duration-300"
                                            />
                                        </div>
                                        <div className="space-y-3 group">
                                            <label className="text-xs font-bold uppercase text-slate-500 group-focus-within:text-primary transition-colors">Mission Title</label>
                                            <input 
                                                value={editContent.mission_title || ''} 
                                                onChange={(e) => updateField('mission_title', e.target.value)}
                                                className="w-full p-4 rounded-xl border border-slate-200 dark:border-white/10 bg-white/50 dark:bg-slate-950/50 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary/50 focus:border-primary/50 outline-none font-bold text-lg transition-all duration-300"
                                            />
                                        </div>
                                    </div>

                                     <div className="space-y-3 group">
                                        <label className="text-xs font-bold uppercase text-slate-500 group-focus-within:text-primary transition-colors">Subtitle / Tagline</label>
                                        <textarea 
                                            value={editContent.subtitle || ''} 
                                            onChange={(e) => updateField('subtitle', e.target.value)}
                                            rows={3}
                                            className="w-full p-4 rounded-xl border border-slate-200 dark:border-white/10 bg-white/50 dark:bg-slate-950/50 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary/50 focus:border-primary/50 outline-none resize-none transition-all duration-300"
                                        />
                                    </div>
                                    
                                    <div className="space-y-3 group">
                                        <label className="text-xs font-bold uppercase text-slate-500 group-focus-within:text-primary transition-colors">Mission Text</label>
                                        <textarea 
                                            value={editContent.mission_text || ''} 
                                            onChange={(e) => updateField('mission_text', e.target.value)}
                                            rows={4}
                                            className="w-full p-4 rounded-xl border border-slate-200 dark:border-white/10 bg-white/50 dark:bg-slate-950/50 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary/50 focus:border-primary/50 outline-none resize-none transition-all duration-300"
                                        />
                                    </div>

                                    {/* CTA Section */}
                                    <div className="pt-6 mt-6 border-t border-slate-200/60 dark:border-white/5">
                                        <h4 className="text-xs font-bold uppercase text-slate-500 mb-4">CTA Section</h4>
                                        <div className="space-y-4">
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-bold uppercase text-slate-400">Title</label>
                                                <input 
                                                    value={editContent.cta_title || ''} 
                                                    onChange={(e) => updateField('cta_title', e.target.value)}
                                                    className="w-full p-3 rounded-xl border border-slate-200 dark:border-white/10 bg-white/50 dark:bg-slate-950/50 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-primary/50 outline-none"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-bold uppercase text-slate-400">Text</label>
                                                <textarea 
                                                    value={editContent.cta_text || ''} 
                                                    onChange={(e) => updateField('cta_text', e.target.value)}
                                                    rows={3}
                                                    className="w-full p-3 rounded-xl border border-slate-200 dark:border-white/10 bg-white/50 dark:bg-slate-950/50 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-primary/50 outline-none resize-none"
                                                />
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <label className="text-[10px] font-bold uppercase text-slate-400">Primary Button</label>
                                                    <input 
                                                        value={editContent.cta_btn_primary || ''} 
                                                        onChange={(e) => updateField('cta_btn_primary', e.target.value)}
                                                        className="w-full p-3 rounded-xl border border-slate-200 dark:border-white/10 bg-white/50 dark:bg-slate-950/50 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-primary/50 outline-none"
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-[10px] font-bold uppercase text-slate-400">Secondary Button</label>
                                                    <input 
                                                        value={editContent.cta_btn_secondary || ''} 
                                                        onChange={(e) => updateField('cta_btn_secondary', e.target.value)}
                                                        className="w-full p-3 rounded-xl border border-slate-200 dark:border-white/10 bg-white/50 dark:bg-slate-950/50 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-primary/50 outline-none"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-3 group mt-6">
                                        <label className="text-xs font-bold uppercase text-slate-500 group-focus-within:text-primary transition-colors">Founder Credits</label>
                                        <input 
                                            value={editContent.founded_text || ''} 
                                            onChange={(e) => updateField('founded_text', e.target.value)}
                                            className="w-full p-4 rounded-xl border border-slate-200 dark:border-white/10 bg-white/50 dark:bg-slate-950/50 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary/50 focus:border-primary/50 outline-none font-mono text-xs transition-all duration-300"
                                            placeholder="Founded in 2024 by RJ. Powered by RJ."
                                        />
                                    </div>
                                </>
                            )}
                            {selectedPageId === 'footer' && (
                                <>
                                    <div className="bg-yellow-500/10 p-4 rounded-xl border border-yellow-500/20 mb-6 flex gap-3 text-xs text-yellow-700 dark:text-yellow-400 items-start">
                                        <Info className="w-5 h-5 shrink-0" />
                                        <p className="leading-relaxed">For complex footer links and column structures, please use the <strong>JSON Editor</strong> mode. The visual editor only supports basic text fields.</p>
                                    </div>
                                    <div className="space-y-3 group">
                                        <label className="text-xs font-bold uppercase text-slate-500 group-focus-within:text-primary transition-colors">Brand Description</label>
                                        <textarea 
                                            value={editContent.brand_description || ''} 
                                            onChange={(e) => updateField('brand_description', e.target.value)}
                                            rows={3}
                                            className="w-full p-4 rounded-xl border border-slate-200 dark:border-white/10 bg-white/50 dark:bg-slate-950/50 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary/50 focus:border-primary/50 outline-none resize-none transition-all duration-300"
                                        />
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-3 group">
                                            <label className="text-xs font-bold uppercase text-slate-500 group-focus-within:text-primary transition-colors">Attribution (Made by)</label>
                                            <input 
                                                value={editContent.made_by_text || ''} 
                                                onChange={(e) => updateField('made_by_text', e.target.value)}
                                                className="w-full p-4 rounded-xl border border-slate-200 dark:border-white/10 bg-white/50 dark:bg-slate-950/50 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary/50 focus:border-primary/50 outline-none transition-all duration-300"
                                                placeholder="Neural Architects"
                                            />
                                        </div>
                                        <div className="space-y-3 group">
                                            <label className="text-xs font-bold uppercase text-slate-500 group-focus-within:text-primary transition-colors">Copyright Text</label>
                                            <input 
                                                value={editContent.copyright_text || ''} 
                                                onChange={(e) => updateField('copyright_text', e.target.value)}
                                                className="w-full p-4 rounded-xl border border-slate-200 dark:border-white/10 bg-white/50 dark:bg-slate-950/50 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary/50 focus:border-primary/50 outline-none transition-all duration-300"
                                                placeholder="YourChords AI. All rights reserved."
                                            />
                                        </div>
                                    </div>

                                    {/* Socials */}
                                    <div className="pt-4 border-t border-slate-200/60 dark:border-white/5">
                                        <h4 className="text-xs font-bold uppercase text-slate-500 mb-4">Social Media Links</h4>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {['twitter', 'github', 'instagram', 'email'].map(social => (
                                                <div key={social} className="relative group">
                                                    <div className="absolute left-3 top-2.5 text-slate-400">
                                                        {social === 'twitter' && <Twitter className="w-4 h-4" />}
                                                        {social === 'github' && <Github className="w-4 h-4" />}
                                                        {social === 'instagram' && <Instagram className="w-4 h-4" />}
                                                        {social === 'email' && <Mail className="w-4 h-4" />}
                                                    </div>
                                                    <input 
                                                        value={editContent.socials?.[social] || ''} 
                                                        onChange={(e) => updateNestedField('socials', social, e.target.value)}
                                                        className="w-full pl-10 p-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-white/50 dark:bg-slate-950/50 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-primary/50 focus:border-primary/50 outline-none transition-all"
                                                        placeholder={`${social.charAt(0).toUpperCase() + social.slice(1)} URL`}
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </>
                            )}
                            
                            {/* Generic Field Editor for Extra Fields */}
                            {extraFields.length > 0 && (
                                <div className="pt-8 mt-8 border-t border-slate-200/60 dark:border-white/5">
                                    <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                                        <AlertTriangle className="w-4 h-4 text-orange-500" />
                                        Extra Fields
                                    </h4>
                                    <div className="space-y-4">
                                        {extraFields.map(key => (
                                            <div key={key} className="group relative bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-200 dark:border-white/5">
                                                <div className="flex justify-between items-center mb-2">
                                                    <label className="text-xs font-bold font-mono text-slate-500">{key}</label>
                                                    <button onClick={() => removeField(key)} className="text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 p-1.5 rounded-lg transition-colors">
                                                        <Trash2 className="w-3 h-3" />
                                                    </button>
                                                </div>
                                                <textarea 
                                                    value={typeof editContent[key] === 'string' ? editContent[key] : JSON.stringify(editContent[key])}
                                                    onChange={(e) => updateField(key, e.target.value)}
                                                    rows={2}
                                                    className="w-full bg-transparent border-none outline-none text-sm text-slate-900 dark:text-white resize-none"
                                                />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Add New Field */}
                            <div className="pt-4">
                                {!showAddField ? (
                                    <button 
                                        onClick={() => setShowAddField(true)}
                                        className="text-xs font-bold text-primary flex items-center gap-1 hover:underline"
                                    >
                                        <Plus className="w-3 h-3" /> Add Custom Field
                                    </button>
                                ) : (
                                    <div className="flex items-center gap-2 animate-in fade-in slide-in-from-left-2">
                                        <input 
                                            value={newFieldKey}
                                            onChange={e => setNewFieldKey(e.target.value.toLowerCase().replace(/\s+/g, '_'))}
                                            placeholder="field_name"
                                            className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-950 text-xs font-mono outline-none focus:border-primary"
                                            autoFocus
                                        />
                                        <button 
                                            onClick={addNewField}
                                            disabled={!newFieldKey}
                                            className="px-3 py-1.5 bg-primary text-white rounded-lg text-xs font-bold hover:bg-primary/90 disabled:opacity-50"
                                        >
                                            Add
                                        </button>
                                        <button 
                                            onClick={() => setShowAddField(false)}
                                            className="px-3 py-1.5 text-slate-500 hover:text-slate-900 dark:hover:text-white text-xs"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : (
                        <textarea 
                            value={JSON.stringify(editContent, null, 2)}
                            onChange={e => {
                                try {
                                    const parsed = JSON.parse(e.target.value);
                                    setEditContent(parsed);
                                } catch {
                                    // keep typing
                                }
                            }}
                            className="flex-1 w-full bg-slate-950 text-green-400 font-mono text-sm p-6 rounded-xl border border-slate-800 focus:border-primary outline-none resize-none shadow-inner"
                            spellCheck={false}
                        />
                    )}
                </div>
            </div>
        </div>
    );
};

export default ContentManager;
