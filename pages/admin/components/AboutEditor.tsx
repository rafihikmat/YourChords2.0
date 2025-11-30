import React from 'react';
import { FieldEditor } from './FieldEditor';

interface AboutEditorProps {
    content: Record<string, any>;
    updateField: (key: string, value: any) => void;
}

export const AboutEditor: React.FC<AboutEditorProps> = ({ content, updateField }) => {
    return (
        <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FieldEditor
                    label="Page Title"
                    value={content.title}
                    onChange={(val) => updateField('title', val)}
                />
                <FieldEditor
                    label="Mission Title"
                    value={content.mission_title}
                    onChange={(val) => updateField('mission_title', val)}
                />
            </div>

            <FieldEditor
                label="Subtitle / Tagline"
                value={content.subtitle}
                onChange={(val) => updateField('subtitle', val)}
                type="textarea"
            />
            
            <FieldEditor
                label="Mission Text"
                value={content.mission_text}
                onChange={(val) => updateField('mission_text', val)}
                type="textarea"
            />

            {/* CTA Section */}
            <div className="pt-6 mt-6 border-t border-slate-200/60 dark:border-white/5">
                <h4 className="text-xs font-bold uppercase text-slate-500 mb-4">CTA Section</h4>
                <div className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-[10px] font-bold uppercase text-slate-400">Title</label>
                        <input 
                            value={content.cta_title || ''} 
                            onChange={(e) => updateField('cta_title', e.target.value)}
                            className="w-full p-3 rounded-xl border border-slate-200 dark:border-white/10 bg-white/50 dark:bg-slate-950/50 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-primary/50 outline-none"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-bold uppercase text-slate-400">Text</label>
                        <textarea 
                            value={content.cta_text || ''} 
                            onChange={(e) => updateField('cta_text', e.target.value)}
                            rows={3}
                            className="w-full p-3 rounded-xl border border-slate-200 dark:border-white/10 bg-white/50 dark:bg-slate-950/50 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-primary/50 outline-none resize-none"
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold uppercase text-slate-400">Primary Button</label>
                            <input 
                                value={content.cta_btn_primary || ''} 
                                onChange={(e) => updateField('cta_btn_primary', e.target.value)}
                                className="w-full p-3 rounded-xl border border-slate-200 dark:border-white/10 bg-white/50 dark:bg-slate-950/50 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-primary/50 outline-none"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold uppercase text-slate-400">Secondary Button</label>
                            <input 
                                value={content.cta_btn_secondary || ''} 
                                onChange={(e) => updateField('cta_btn_secondary', e.target.value)}
                                className="w-full p-3 rounded-xl border border-slate-200 dark:border-white/10 bg-white/50 dark:bg-slate-950/50 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-primary/50 outline-none"
                            />
                        </div>
                    </div>
                </div>
            </div>

            <FieldEditor
                label="Founder Credits"
                value={content.founded_text}
                onChange={(val) => updateField('founded_text', val)}
                placeholder="Founded in 2024 by RJ. Powered by RJ."
                className="mt-6"
            />
        </>
    );
};
