import React from 'react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '../lib/utils';

interface ContactCardProps {
    icon: LucideIcon;
    title: string;
    description: string;
    action: React.ReactNode;
    colorClass: string;
    bgClass: string;
}

export const ContactCard: React.FC<ContactCardProps> = ({ icon: Icon, title, description, action, colorClass, bgClass }) => {
    return (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-white/10 shadow-sm text-center hover:border-primary/50 transition-colors group">
            <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform", bgClass)}>
                <Icon className={cn("w-6 h-6", colorClass)} />
            </div>
            <h3 className="font-bold text-slate-900 dark:text-white mb-2">{title}</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
                {description}
            </p>
            {action}
        </div>
    );
};
