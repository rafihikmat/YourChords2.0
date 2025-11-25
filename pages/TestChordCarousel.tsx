import React from 'react';
import ChordCarousel from '../components/ChordCarousel';

const TestPage: React.FC = () => {
    return (
        <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-8 gap-8">
            <h1 className="text-3xl font-bold text-white mb-8">Chord Carousel Test</h1>

            <div className="flex flex-wrap justify-center gap-8">
                <div className="flex flex-col items-center">
                    <h2 className="text-xl text-slate-400 mb-4">D Major</h2>
                    <ChordCarousel chordName="D" />
                </div>

                <div className="flex flex-col items-center">
                    <h2 className="text-xl text-slate-400 mb-4">D Minor</h2>
                    <ChordCarousel chordName="Dm" />
                </div>

                <div className="flex flex-col items-center">
                    <h2 className="text-xl text-slate-400 mb-4">A Major</h2>
                    <ChordCarousel chordName="A" />
                </div>

                <div className="flex flex-col items-center">
                    <h2 className="text-xl text-slate-400 mb-4">B Minor (Barre)</h2>
                    <ChordCarousel chordName="Bm" />
                </div>

                <div className="flex flex-col items-center">
                    <h2 className="text-xl text-slate-400 mb-4">C Maj7 (Jazz)</h2>
                    <ChordCarousel chordName="Cmaj7" />
                </div>

                <div className="flex flex-col items-center">
                    <h2 className="text-xl text-slate-400 mb-4">E9 (Blues/Funk)</h2>
                    <ChordCarousel chordName="E9" />
                </div>
            </div>
        </div>
    );
};

export default TestPage;
