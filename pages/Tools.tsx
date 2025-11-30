import React, { useState } from 'react';
import { Activity, Book, Mic2, GraduationCap } from 'lucide-react';
import { cn } from '../lib/utils';
import { Spotlight } from '../components/ui/Spotlight';
import ProfessorChat from '@/components/tools/ProfessorChat';
import TunerTool from '../components/tools/TunerTool';
import MetronomeTool from '../components/tools/MetronomeTool';
import LibraryTool from '../components/tools/LibraryTool';

// Augment window type for older browser AudioContext
declare global {
  interface Window {
    webkitAudioContext: typeof AudioContext;
  }
}

/**
 * Available tool tabs.
 */
type TabId = 'ai' | 'upload' | 'tuner' | 'library' | 'metronome' | 'assistant';

/**
 * The Tools page component.
 * Aggregates various music utilities into a single interface with tabs.
 * Tools include:
 * - Guitar Tuner (Web Audio API)
 * - Metronome (Custom Hook)
 * - Chord Visualizer (Library)
 * - Professor AI (LLM Chat)
 *
 * @returns {JSX.Element} The ToolsPage component.
 */
const ToolsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabId>('tuner');

  const tabs = [
      { id: 'tuner', label: 'Guitar Tuner', icon: Activity, show: true },
      { id: 'metronome', label: 'Metronome', icon: Mic2, show: true },
      { id: 'library', label: 'Chord Visualizer', icon: Book, show: true },
      { id: 'assistant', label: 'Professor AI', icon: GraduationCap, show: true },
  ];

  return (
    <div className="min-h-screen pt-24 pb-12 px-4 relative overflow-hidden">
      <Spotlight className="-top-40 left-0 hidden dark:block opacity-50" fill="white" />

      <div className="max-w-5xl mx-auto relative z-10">
        <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-4">Tools & Utilities</h1>
            <p className="text-slate-600 dark:text-slate-400">Musician's Toolkit: Tuner, Metronome, and AI Research.</p>
        </div>

        {/* Tabs */}
        <div className="flex justify-center mb-8 overflow-x-auto">
            <div className="flex bg-white dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-white/10 shadow-sm min-w-max">
                {tabs.filter(t => t.show).map((tab) => (
                    <button 
                        key={tab.id} 
                        onClick={() => setActiveTab(tab.id as TabId)} 
                        className={cn(
                            "flex items-center gap-2 px-6 py-2 rounded-lg text-sm font-bold transition-all", 
                            activeTab === tab.id 
                                ? "bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white" 
                                : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
                        )}
                    >
                        <tab.icon className="w-4 h-4" /> {tab.label}
                    </button>
                ))}
            </div>
        </div>

        {/* View Content */}
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            {activeTab === 'tuner' && <TunerTool />}
            {activeTab === 'metronome' && <MetronomeTool />}
            {activeTab === 'library' && <LibraryTool />}
            
            {activeTab === 'assistant' && (
                 <div className="w-full max-w-4xl mx-auto space-y-8">
                    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-white/10 overflow-hidden shadow-xl p-6">
                        <div className="text-center mb-8">
                            <h2 className="text-2xl font-bold dark:text-white flex items-center justify-center gap-2 mb-2">
                                <GraduationCap className="w-6 h-6 text-primary" /> Professor Harmony AI
                            </h2>
                            <p className="text-slate-500 text-sm">
                                Your Personal Music Theory Assistant & Composition Guide
                            </p>
                        </div>
                        <ProfessorChat />
                    </div>
                 </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default ToolsPage;
