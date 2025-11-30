import React from 'react';
import { cn } from '../../../lib/utils';

interface FieldEditorProps {
    label: string;
    value: string | string[];
    onChange: (value: any) => void;
    type?: 'text' | 'textarea' | 'array';
    placeholder?: string;
    helperText?: string;
    className?: string;
}

export const FieldEditor: React.FC<FieldEditorProps> = ({
    label,
    value,
    onChange,
    type = 'text',
    placeholder,
    helperText,
    className
}) => {
    return (
        <div className={cn("space-y-3 group", className)}>
            <label className="text-xs font-bold uppercase text-slate-500 group-focus-within:text-primary transition-colors">
                {label}
            </label>
            
            {type === 'textarea' ? (
                <textarea 
                    value={value as string || ''} 
                    onChange={(e) => onChange(e.target.value)}
                    rows={4}
                    className="w-full p-4 rounded-xl border border-slate-200 dark:border-white/10 bg-white/50 dark:bg-slate-950/50 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary/50 focus:border-primary/50 outline-none resize-none transition-all duration-300"
                    placeholder={placeholder}
                />
            ) : type === 'array' ? (
                <input 
                    value={Array.isArray(value) ? value.join(', ') : (value || '')} 
                    onChange={(e) => onChange(e.target.value.split(',').map(s => s.trim()))}
                    className="w-full p-4 rounded-xl border border-slate-200 dark:border-white/10 bg-white/50 dark:bg-slate-950/50 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary/50 focus:border-primary/50 outline-none font-bold text-lg transition-all duration-300"
                    placeholder={placeholder}
                />
            ) : (
                <input 
                    value={value as string || ''} 
                    onChange={(e) => onChange(e.target.value)}
                    className="w-full p-4 rounded-xl border border-slate-200 dark:border-white/10 bg-white/50 dark:bg-slate-950/50 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary/50 focus:border-primary/50 outline-none font-bold text-lg transition-all duration-300"
                    placeholder={placeholder}
                />
            )}
            
            {helperText && <p className="text-[10px] text-slate-400">{helperText}</p>}
        </div>
    );
};
