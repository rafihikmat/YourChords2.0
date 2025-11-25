import React, { useState } from 'react';
import ChordDiagram from '../components/ChordDiagram';
import { ChordAdapter } from '../lib/chordService';

const TestAdvancedChords: React.FC = () => {
    const [searchTerm, setSearchTerm] = useState('');

    const testChords = [
        'Cmaj9', 'Cm9', 'C13', 'C7#9',
        'D9', 'Dm11',
        'E9', 'E7#9',
        'Fmaj9',
        'G13',
        'Am11', 'Amaj9',
        'Bm11', 'B7alt'
    ];

    return (
        <div className="min-h-screen bg-[#0a0a0a] text-white p-8 font-sans">
            <h1 className="text-3xl font-bold mb-8 text-center bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
                Advanced Chord Voicings
            </h1>

            <div className="mb-8 text-center">
                <p className="text-gray-400 mb-4">
                    Verifying Jazz, Neo-Soul, Funk, and Rock voicings.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 justify-items-center">
                {testChords.map((chordName) => {
                    const voicings = ChordAdapter.getAllChordVoicings(chordName);

                    if (!voicings) {
                        return (
                            <div key={chordName} className="flex flex-col items-center justify-center w-[200px] h-[240px] border border-red-500/30 rounded-xl bg-red-500/10">
                                <span className="text-red-400 font-bold">{chordName}</span>
                                <span className="text-xs text-red-300">Not Found</span>
                            </div>
                        );
                    }

                    return (
                        <div key={chordName} className="flex flex-col gap-4">
                            <h2 className="text-xl font-bold text-center text-gray-300 border-b border-white/10 pb-2">
                                {chordName}
                            </h2>
                            <div className="flex flex-col gap-6">
                                {voicings.map((voicing, idx) => (
                                    <div key={idx} className="relative group">
                                        <div className="absolute -left-8 top-0 text-xs text-gray-600 font-mono">
                                            #{idx + 1}
                                        </div>
                                        <ChordDiagram
                                            name={chordName}
                                            position={voicing}
                                            showName={false}
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>
                    );
                })}
            </div>

            <div className="mt-12 border-t border-white/10 pt-8">
                <h2 className="text-2xl font-bold mb-6 text-center">Slash Chord Test</h2>
                <div className="flex flex-wrap justify-center gap-8">
                    {['D/F#', 'C/G', 'Am/G'].map(chord => {
                        const voicings = ChordAdapter.getAllChordVoicings(chord);
                        return (
                            <div key={chord} className="flex flex-col items-center">
                                <h3 className="text-lg font-bold mb-2">{chord}</h3>
                                {voicings ? (
                                    <ChordDiagram name={chord} position={voicings[0]} showName={false} />
                                ) : (
                                    <div className="text-red-500">Not Found</div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default TestAdvancedChords;
