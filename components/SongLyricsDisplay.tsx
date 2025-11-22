
import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '../lib/utils';

interface SongLyricsDisplayProps {
    html: string;
    fontSize?: number;
    onChordClick?: (chordName: string) => void;
    className?: string;
}

/**
 * Presentational Component: SongLyricsDisplay
 * 
 * Responsible ONLY for rendering the pre-processed HTML chord sheet.
 * Uses DangerouslySetInnerHTML because ChordSheetJS outputs trusted HTML structure.
 * Styling is handled via global CSS in index.html targeting .chord-sheet-container
 */
const SongLyricsDisplay: React.FC<SongLyricsDisplayProps> = ({ 
    html, 
    fontSize = 16, 
    onChordClick, 
    className 
}) => {

    const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
        // Event delegation to handle clicks on dynamically generated .chord elements
        const target = e.target as HTMLElement;
        if (target.classList.contains('chord')) {
            const chordName = target.textContent?.trim();
            if (chordName && onChordClick) {
                onChordClick(chordName);
            }
        }
    };

    return (
        <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            className={cn(
                "w-full overflow-x-auto pb-12 selection:bg-primary/30",
                className
            )}
        >
            <div 
                className="chord-sheet-container"
                style={{ fontSize: `${fontSize}px` }}
                onClick={handleClick}
                dangerouslySetInnerHTML={{ __html: html }}
            />
            
            {!html && (
                 <div className="p-8 text-center border-2 border-dashed border-slate-200 dark:border-white/10 rounded-xl text-slate-400">
                    No chord data available to render.
                 </div>
            )}
        </motion.div>
    );
};

export default SongLyricsDisplay;
