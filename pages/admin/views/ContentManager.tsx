
import React, { useState, useEffect } from 'react';
import { LayoutTemplate, FileText, Save, Info } from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { cn } from '../../../lib/utils';

const ContentManager: React.FC = () => {
    const [pages, setPages] = useState<{id: string, content: any}[]>([]);
    const [selectedPage, setSelectedPage] = useState<string>('home');
    const [editContent, setEditContent] = useState<any>({});
    const [viewMode, setViewMode] = useState<'visual' | 'json'>('visual');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchContent();
    }, []);

    const fetchContent = async () => {
        setLoading(true);
        const { data } = await supabase.from('page_content').select('*');
        if (data) {
            setPages(data);
            const current = data.find(p => p.id === selectedPage);
            if (current) setEditContent(current.content);
        }
        setLoading(false);
    };

    const handlePageSelect = (pageId: string) => {
        setSelectedPage(pageId);
        const p = pages.find(x => x.id === pageId);
        // Default empty object if page doesn't exist in DB yet but is selectable
        setEditContent(p ? p.content : {});
    };

    const handleSave = async () => {
        try {
            const { error } = await supabase
                .from('page_content')
                .upsert({ id: selectedPage, content: editContent, updated_at: new Date().toISOString() });
            
            if (error) throw error;
            alert('Content updated successfully! Changes are live.');
            fetchContent();
        } catch (e: any) {
            alert('Error saving: ' + e.message);
        }
    };

    const updateField = (key: string, value: string) => {
        setEditContent((prev: any) => ({ ...prev, [key]: value }));
    };

    return (
        <div className="p-8 animate-in fade-in">
             <div className="mb-8 flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Content Management</h1>
                    <p className="text-slate-500">Edit website copy and configuration.</p>
                </div>
                <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
                    <button 
                        onClick={() => setViewMode('visual')}
                        className={cn("px-4 py-2 rounded-md text-xs font-bold flex items-center gap-2", viewMode === 'visual' ? "bg-white dark:bg-slate-600 shadow text-primary dark:text-white" : "text-slate-500")}
                    >
                        <LayoutTemplate className="w-4 h-4" /> Visual
                    </button>
                    <button 
                        onClick={() => setViewMode('json')}
                        className={cn("px-4 py-2 rounded-md text-xs font-bold flex items-center gap-2", viewMode === 'json' ? "bg-white dark:bg-slate-600 shadow text-primary dark:text-white" : "text-slate-500")}
                    >
                        <FileText className="w-4 h-4" /> JSON
                    </button>
                </div>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl overflow-hidden flex flex-col md:flex-row min-h-[500px] shadow-sm">
                {/* Sidebar */}
                <div className="w-full md:w-64 bg-slate-50 dark:bg-slate-950/50 border-r border-slate-200 dark:border-white/10 p-4">
                    <h3 className="text-xs font-bold uppercase text-slate-500 mb-4">Select Page</h3>
                    <div className="space-y-2">
                        {['home', 'about', 'footer'].map(page => (
                            <button 
                                key={page}
                                onClick={() => handlePageSelect(page)}
                                className={cn(
                                    "w-full text-left px-4 py-2 rounded-lg text-sm font-medium capitalize transition-all",
                                    selectedPage === page ? "bg-white dark:bg-slate-800 text-primary shadow border border-slate-200 dark:border-transparent" : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
                                )}
                            >
                                {page}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Editor */}
                <div className="flex-1 p-8 flex flex-col bg-slate-50/50 dark:bg-slate-900/50">
                    <div className="flex justify-between items-center mb-6">
                        <div className="text-sm font-mono text-slate-500">Editing: <span className="text-primary font-bold uppercase">{selectedPage}</span></div>
                        <button 
                            onClick={handleSave} 
                            className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20"
                        >
                            <Save className="w-4 h-4" /> Save Changes
                        </button>
                    </div>

                    {viewMode === 'visual' ? (
                        <div className="space-y-6 max-w-2xl">
                            {selectedPage === 'home' && (
                                <>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold uppercase text-slate-500">Hero Title</label>
                                        <input 
                                            value={editContent.hero_title || ''} 
                                            onChange={(e) => updateField('hero_title', e.target.value)}
                                            className="w-full p-3 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary/50 outline-none font-bold text-lg"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold uppercase text-slate-500">Hero Subtitle</label>
                                        <textarea 
                                            value={editContent.hero_subtitle || ''} 
                                            onChange={(e) => updateField('hero_subtitle', e.target.value)}
                                            rows={4}
                                            className="w-full p-3 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary/50 outline-none resize-none"
                                        />
                                    </div>
                                </>
                            )}
                            {selectedPage === 'about' && (
                                <>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold uppercase text-slate-500">Page Title</label>
                                        <input 
                                            value={editContent.title || ''} 
                                            onChange={(e) => updateField('title', e.target.value)}
                                            className="w-full p-3 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary/50 outline-none font-bold text-lg"
                                        />
                                    </div>
                                     <div className="space-y-2">
                                        <label className="text-xs font-bold uppercase text-slate-500">Subtitle / Tagline</label>
                                        <textarea 
                                            value={editContent.subtitle || ''} 
                                            onChange={(e) => updateField('subtitle', e.target.value)}
                                            rows={3}
                                            className="w-full p-3 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary/50 outline-none resize-none"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold uppercase text-slate-500">Mission Title</label>
                                        <input 
                                            value={editContent.mission_title || ''} 
                                            onChange={(e) => updateField('mission_title', e.target.value)}
                                            className="w-full p-3 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary/50 outline-none"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold uppercase text-slate-500">Mission Text</label>
                                        <textarea 
                                            value={editContent.mission_text || ''} 
                                            onChange={(e) => updateField('mission_text', e.target.value)}
                                            rows={4}
                                            className="w-full p-3 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary/50 outline-none resize-none"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold uppercase text-slate-500">Founder Credits (Bottom Text)</label>
                                        <input 
                                            value={editContent.founded_text || ''} 
                                            onChange={(e) => updateField('founded_text', e.target.value)}
                                            className="w-full p-3 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary/50 outline-none font-mono text-xs"
                                            placeholder="Founded in 2024 by RJ. Powered by RJ."
                                        />
                                    </div>
                                </>
                            )}
                            {selectedPage === 'footer' && (
                                <>
                                    <div className="bg-yellow-50 dark:bg-yellow-900/10 p-4 rounded-lg border border-yellow-200 dark:border-yellow-700/30 mb-4 flex gap-3 text-xs text-yellow-700 dark:text-yellow-400">
                                        <Info className="w-4 h-4 shrink-0 mt-0.5" />
                                        <p>For complex footer links and column structures, please use the <strong>JSON Editor</strong> mode.</p>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold uppercase text-slate-500">Brand Description</label>
                                        <textarea 
                                            value={editContent.brand_description || ''} 
                                            onChange={(e) => updateField('brand_description', e.target.value)}
                                            rows={3}
                                            className="w-full p-3 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary/50 outline-none resize-none"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold uppercase text-slate-500">Attribution (Made by)</label>
                                        <input 
                                            value={editContent.made_by_text || ''} 
                                            onChange={(e) => updateField('made_by_text', e.target.value)}
                                            className="w-full p-3 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary/50 outline-none"
                                            placeholder="Neural Architects"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold uppercase text-slate-500">Copyright Text (Year auto-generated)</label>
                                        <input 
                                            value={editContent.copyright_text || ''} 
                                            onChange={(e) => updateField('copyright_text', e.target.value)}
                                            className="w-full p-3 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary/50 outline-none"
                                            placeholder="YourChords AI. All rights reserved."
                                        />
                                    </div>
                                </>
                            )}
                            
                             {/* Fallback for other props */}
                             <div className="pt-4 border-t border-slate-200 dark:border-white/10">
                                 <p className="text-xs text-slate-500 mb-2">Full Configuration Preview</p>
                                 <pre className="text-xs bg-slate-100 dark:bg-slate-950 p-4 rounded-lg text-slate-600 dark:text-slate-400 overflow-auto h-40 custom-scrollbar">
                                     {JSON.stringify(editContent, null, 2)}
                                 </pre>
                             </div>
                        </div>
                    ) : (
                        <textarea 
                            value={JSON.stringify(editContent, null, 2)}
                            onChange={e => {
                                try {
                                    const parsed = JSON.parse(e.target.value);
                                    setEditContent(parsed);
                                } catch(err) {
                                    // keep typing
                                }
                            }}
                            className="flex-1 w-full bg-slate-900 text-green-400 font-mono text-sm p-4 rounded-xl border border-slate-800 focus:border-primary outline-none resize-none"
                            spellCheck={false}
                        />
                    )}
                </div>
            </div>
        </div>
    );
};

export default ContentManager;
