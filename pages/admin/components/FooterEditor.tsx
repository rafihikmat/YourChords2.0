import React from 'react';
import { Info, Twitter, Github, Instagram, Mail } from 'lucide-react';
import { FieldEditor } from './FieldEditor';

interface FooterEditorProps {
    content: Record<string, any>;
    updateField: (key: string, value: any) => void;
    updateNestedField: (parent: string, key: string, value: any) => void;
}

export const FooterEditor: React.FC<FooterEditorProps> = ({ content, updateField, updateNestedField }) => {
    return (
        <>
            <div className="bg-yellow-500/10 p-4 rounded-xl border border-yellow-500/20 mb-6 flex gap-3 text-xs text-yellow-700 dark:text-yellow-400 items-start">
                <Info className="w-5 h-5 shrink-0" />
                <p className="leading-relaxed">For complex footer links and column structures, please use the <strong>JSON Editor</strong> mode. The visual editor only supports basic text fields.</p>
            </div>
            
            <FieldEditor
                label="Brand Description"
                value={content.brand_description}
                onChange={(val) => updateField('brand_description', val)}
                type="textarea"
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FieldEditor
                    label="Attribution (Made by)"
                    value={content.made_by_text}
                    onChange={(val) => updateField('made_by_text', val)}
                    placeholder="Neural Architects"
                />
                <FieldEditor
                    label="Copyright Text"
                    value={content.copyright_text}
                    onChange={(val) => updateField('copyright_text', val)}
                    placeholder="YourChords AI. All rights reserved."
                />
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
                                value={content.socials?.[social] || ''} 
                                onChange={(e) => updateNestedField('socials', social, e.target.value)}
                                className="w-full pl-10 p-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-white/50 dark:bg-slate-950/50 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-primary/50 focus:border-primary/50 outline-none transition-all"
                                placeholder={`${social.charAt(0).toUpperCase() + social.slice(1)} URL`}
                            />
                        </div>
                    ))}
                </div>
            </div>
        </>
    );
};
