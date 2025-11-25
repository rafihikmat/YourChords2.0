import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Play } from 'lucide-react';
import ChordDiagram from './ChordDiagram';
import { ChordAdapter, Position } from '../lib/chordService';

interface ChordTooltipProps {
    chordName: string | null;
    anchorRect: DOMRect | null;
    isOpen: boolean;
    onClose: () => void;
}

const ChordTooltip: React.FC<ChordTooltipProps> = ({ chordName, anchorRect, isOpen, onClose }) => {
    const [voicings, setVoicings] = useState<Position[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const tooltipRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (chordName) {
            const allVoicings = ChordAdapter.getAllChordVoicings(chordName);
            setVoicings(allVoicings || []);
            setCurrentIndex(0);
        }
    }, [chordName]);

    // Handle click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (tooltipRef.current && !tooltipRef.current.contains(event.target as Node)) {
                onClose();
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen, onClose]);

    if (!isOpen || !chordName || !anchorRect) return null;

    const currentVoicing = voicings[currentIndex];
    const totalVoicings = voicings.length;

    // Calculate position
    // We want to center the tooltip above the anchorRect
    const tooltipWidth = 220; // Approximate width
    const tooltipHeight = 280; // Approximate height

    let left = anchorRect.left + anchorRect.width / 2 - tooltipWidth / 2;
    let top = anchorRect.top - tooltipHeight - 10; // 10px gap

    // Boundary checks (basic)
    if (left < 10) left = 10;
    if (left + tooltipWidth > window.innerWidth - 10) left = window.innerWidth - tooltipWidth - 10;
    if (top < 10) {
        // Flip to bottom if not enough space on top
        top = anchorRect.bottom + 10;
    }

    const handlePrev = (e: React.MouseEvent) => {
        e.stopPropagation();
        setCurrentIndex((prev) => (prev === 0 ? totalVoicings - 1 : prev - 1));
    };

    const handleNext = (e: React.MouseEvent) => {
        e.stopPropagation();
        setCurrentIndex((prev) => (prev === totalVoicings - 1 ? 0 : prev + 1));
    };

    return createPortal(
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    ref={tooltipRef}
                    initial={{ opacity: 0, scale: 0.95, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 10 }}
                    transition={{ duration: 0.15 }}
                    style={{
                        position: 'fixed',
                        left: left,
                        top: top,
                        zIndex: 50,
                    }}
                    className="bg-slate-900 text-white rounded-xl shadow-2xl border border-slate-700 p-4 w-[200px] flex flex-col items-center"
                >
                    {/* Header */}
                    <div className="flex justify-between w-full items-center mb-2 px-2">
                        <span className="font-bold text-lg">{chordName}</span>
                        {/* Placeholder for other variations if needed */}
                    </div>

                    {/* Diagram */}
                    <div className="bg-slate-800 rounded-lg p-2 mb-3 w-full flex justify-center">
                        {currentVoicing ? (
                            <ChordDiagram
                                name={chordName}
                                position={currentVoicing}
                                showName={false}
                                className="text-white"
                            />
                        ) : (
                            <div className="h-[120px] flex items-center justify-center text-xs text-slate-400">
                                No diagram found
                            </div>
                        )}
                    </div>

                    {/* Carousel Controls */}
                    {totalVoicings > 1 && (
                        <div className="flex items-center justify-between w-full px-2 mb-3 text-sm text-slate-400">
                            <button
                                onClick={handlePrev}
                                className="p-1 hover:text-white hover:bg-slate-800 rounded-full transition-colors"
                            >
                                <ChevronLeft size={20} />
                            </button>
                            <span className="font-mono text-xs">
                                {currentIndex + 1} of {totalVoicings}
                            </span>
                            <button
                                onClick={handleNext}
                                className="p-1 hover:text-white hover:bg-slate-800 rounded-full transition-colors"
                            >
                                <ChevronRight size={20} />
                            </button>
                        </div>
                    )}

                    {/* Play Button (Visual Only for now) */}
                    <button className="flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-white w-full py-2 rounded-lg transition-colors text-sm font-medium">
                        <Play size={16} className="fill-white" />
                        Play
                    </button>

                </motion.div>
            )}
        </AnimatePresence>,
        document.body
    );
};

export default ChordTooltip;
