import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { Spotlight } from '../ui/Spotlight';
import { LayoutTextFlip } from '../ui/layout-text-flip';

interface HomeHeroProps {
    pageContent: any;
    heroSubtitle: string;
}

export const HomeHero: React.FC<HomeHeroProps> = ({ pageContent, heroSubtitle }) => {
    return (
        <div className="relative z-10 pt-36 pb-20 px-4 w-full flex flex-col items-center justify-center">
            <Spotlight className="-top-40 left-0 md:left-60 md:-top-20 hidden dark:block" fill="white" />
            
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="flex flex-col items-center text-center max-w-4xl mx-auto"
            >
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 text-xs font-medium text-primary mb-8 shadow-sm backdrop-blur-md">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                    </span>
                    v2.0 System Online
                </div>

                <LayoutTextFlip
                    text={pageContent?.hero_title_prefix || "Master your chords in "}
                    words={pageContent?.hero_title_words || ["Hyperspeed", "ANJAY", "Realtime"]}
                    className="mb-6 text-4xl md:text-6xl"
                />

                <p className="text-slate-600 dark:text-neutral-400 text-base md:text-xl max-w-2xl mb-8 md:mb-10 px-4">
                    {heroSubtitle}
                </p>

                <div className="flex flex-col sm:flex-row gap-4">
                    <button onClick={() => document.getElementById('library-section')?.scrollIntoView({behavior: 'smooth'})} className="relative inline-flex h-12 overflow-hidden rounded-full p-[1px] focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 focus:ring-offset-slate-50">
                        <span className="absolute inset-[-1000%] animate-[spin_2s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,#E2CBFF_0%,#393BB2_50%,#E2CBFF_100%)]" />
                        <span className="inline-flex h-full w-full cursor-pointer items-center justify-center rounded-full bg-slate-950 px-8 py-1 text-sm font-medium text-white backdrop-blur-3xl gap-2 hover:bg-slate-900 transition-colors">
                            Explore Library <ArrowRight className="w-4 h-4" />
                        </span>
                    </button>
                </div>
            </motion.div>
        </div>
    );
};
