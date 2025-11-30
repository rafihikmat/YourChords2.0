import React, { useState } from 'react';
import { LayoutTemplate, FileText, Save, ChevronRight, Plus, Trash2, AlertTriangle } from 'lucide-react';
import { cn } from '../../../lib/utils';
import { useContentManager } from '../hooks/useContentManager';
import { HomeEditor } from '../components/HomeEditor';
import { AboutEditor } from '../components/AboutEditor';
import { FooterEditor } from '../components/FooterEditor';

const ContentManager: React.FC = () => {
    const {
        selectedPageId,
        editContent,
        viewMode,
        setViewMode,
        handlePageSelect,
        handleSave,
        updateField,
        updateNestedField,
        removeField,
        addField,
        setEditContent // Needed for JSON editor
    } = useContentManager();

    const [newFieldKey, setNewFieldKey] = useState('');
    const [showAddField, setShowAddField] = useState(false);

    const handleAddField = () => {
        if (addField(newFieldKey)) {
            setNewFieldKey('');
            setShowAddField(false);
        }
    };

    // Helper to determine if a field is "standard" for the current page
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
                            {selectedPageId === 'home' && <HomeEditor content={editContent} updateField={updateField} />}
                            {selectedPageId === 'about' && <AboutEditor content={editContent} updateField={updateField} />}
                            {selectedPageId === 'footer' && <FooterEditor content={editContent} updateField={updateField} updateNestedField={updateNestedField} />}
                            
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
                                            onClick={handleAddField}
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
