import React, { useState, useEffect } from 'react';
import ChordDiagram from './ChordDiagram';
import { ChordAdapter, Position } from '../lib/chordService';

interface ChordCarouselProps {
    chordName: string;
    initialPositionIndex?: number;
    className?: string;
}

const ChordCarousel: React.FC<ChordCarouselProps> = ({ chordName, initialPositionIndex = 0, className }) => {
    const [positions, setPositions] = useState<Position[]>([]);
    const [currentIndex, setCurrentIndex] = useState(initialPositionIndex);

    useEffect(() => {
        // Fetch data from ChordAdapter (which now merges advanced data)
        const servicePositions = ChordAdapter.getAllChordVoicings(chordName);
        if (servicePositions) {
            setPositions(servicePositions);
        } else {
            setPositions([]);
        }
    }, [chordName]);

    const handlePrev = () => {
        setCurrentIndex((prev) => (prev === 0 ? positions.length - 1 : prev - 1));
    };

    const handleNext = () => {
        setCurrentIndex((prev) => (prev === positions.length - 1 ? 0 : prev + 1));
    };

    if (positions.length === 0) {
        return <div className="text-slate-500 dark:text-white">Chord not found</div>;
    }

    const currentPosition = positions[currentIndex];

    return (
        <div className={`flex flex-col items-center p-4 bg-white dark:bg-slate-900/50 rounded-2xl border border-slate-200 dark:border-white/5 shadow-sm dark:shadow-none ${className}`}>
            {/* Diagram */}
            <div className="mb-4 transition-all duration-300 ease-in-out transform hover:scale-105 w-48">
                <ChordDiagram
                    name={chordName}
                    position={currentPosition}
                    showName={true}
                />
            </div>

            {/* Navigation Controls */}
            <div className="flex items-center gap-4 mt-2">
                <button
                    onClick={handlePrev}
                    className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-white/10 text-slate-600 dark:text-white transition-colors"
                    aria-label="Previous Variation"
                >
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M15 18l-6-6 6-6" />
                    </svg>
                </button>

                <span className="text-sm font-medium text-slate-500 dark:text-slate-400 font-mono">
                    Variation {currentIndex + 1} of {positions.length}
                </span>

                <button
                    onClick={handleNext}
                    className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-white/10 text-slate-600 dark:text-white transition-colors"
                    aria-label="Next Variation"
                >
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M9 18l6-6-6-6" />
                    </svg>
                </button>
            </div>
        </div>
    );
};

export default ChordCarousel;
