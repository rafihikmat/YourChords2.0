import React, { useState } from 'react';
import { Search } from 'lucide-react';
import ChordDiagram from '../../components/ChordDiagram';
import ChordCarousel from '../../components/ChordCarousel';
import { CHORD_FAMILIES, normalizeChordName } from '../../lib/musicUtils';

const LibraryTool: React.FC = () => {
    const [chordSearchTerm, setChordSearchTerm] = useState('');
    const [searchedChord, setSearchedChord] = useState<string | null>(null);

    const handleChordSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (chordSearchTerm) setSearchedChord(normalizeChordName(chordSearchTerm));
    };

    return (
        <div className="w-full mx-auto space-y-8">
            <form onSubmit={handleChordSearch} className="max-w-md mx-auto relative">
                <input 
                    type="text" 
                    value={chordSearchTerm} 
                    onChange={(e) => setChordSearchTerm(e.target.value)} 
                    placeholder="Search Chord (e.g. C, Am)" 
                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-full py-3 pl-12 pr-4 text-sm shadow-lg focus:ring-2 focus:ring-primary/50 outline-none dark:text-white" 
                />
                <Search className="absolute left-4 top-3 w-5 h-5 text-slate-400" />
            </form>
            
            {searchedChord && (
                <div className="flex flex-col items-center animate-in fade-in">
                    <div className="p-8 bg-white dark:bg-slate-900 rounded-2xl border border-primary/30 shadow-xl max-w-sm w-full">
                        <h3 className="text-2xl font-bold text-center mb-6 text-primary">{searchedChord}</h3>
                        <ChordCarousel chordName={searchedChord} />
                    </div>
                </div>
            )}
            
            {Object.entries(CHORD_FAMILIES).map(([family, chords]) => (
                <div key={family} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-white/10 p-6 shadow-lg">
                    <h3 className="text-lg font-bold dark:text-white uppercase tracking-wider mb-6 border-b border-slate-200 dark:border-white/5 pb-2">{family}</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-6">
                        {chords.map(chord => (
                            <div 
                                key={chord} 
                                className="flex flex-col items-center p-3 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-white/5 hover:border-primary/30 cursor-pointer hover:shadow-md" 
                                onClick={() => {setSearchedChord(chord); window.scrollTo({top:0, behavior:'smooth'})}}
                            >
                                <ChordDiagram name={chord} />
                            </div>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
};

export default LibraryTool;
