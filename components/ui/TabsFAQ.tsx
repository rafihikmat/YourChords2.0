import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Minus } from 'lucide-react';

interface FAQItem {
  question: string;
  answer: string;
}

interface TabData {
  id: string;
  label: string;
  items: FAQItem[];
}

const tabsData: TabData[] = [
  {
    id: 'general',
    label: 'General',
    items: [
      {
        question: 'Is YourChords free to use?',
        answer: 'Yes! The core library, including thousands of songs and basic tools, is completely free. We believe music education should be accessible to everyone. Advanced AI generation features require a free account to ensure fair usage.'
      },
      {
        question: 'How accurate are the chords?',
        answer: 'Our platform is powered by Google\'s Gemini 2.5 Flash model, specifically fine-tuned for musical analysis. We maintain a 95%+ accuracy rate for popular music genres. For complex jazz or classical pieces, our community tools allow for rapid manual refinements.'
      },
      {
        question: 'Do I need an account?',
        answer: 'You can browse and play songs without an account. However, creating a free account unlocks the ability to save favorites, create playlists, use the AI Chord Generator, and contribute to the community.'
      }
    ]
  },
  {
    id: 'features',
    label: 'Features',
    items: [
      {
        question: 'How does the AI Generator work?',
        answer: 'Simply paste lyrics or upload an audio file. Our AI analyzes the harmonic structure in real-time and generates a complete chord sheet with timing. You can then edit, transpose, or save it to your library.'
      },
      {
        question: 'Can I sync with YouTube or Spotify?',
        answer: 'Absolutely. Our "Smart Sync" feature allows you to embed a YouTube video or control Spotify playback directly within the chord sheet, keeping your practice session seamless.'
      },
      {
        question: 'What is the "Smart Transposer"?',
        answer: 'Unlike simple pitch shifting, our Smart Transposer understands musical keys. It adjusts chords to the nearest playable shapes for guitar or ukulele, ensuring the song remains easy to play while matching your vocal range.'
      }
    ]
  },
  {
    id: 'technical',
    label: 'Technical',
    items: [
      {
        question: 'Is my data secure?',
        answer: 'We use enterprise-grade encryption for all user data. Your personal practice history and private uploads are never shared with third parties or used to train public models without your explicit consent.'
      },
      {
        question: 'Does it work on mobile?',
        answer: 'Yes, YourChords is built as a Progressive Web App (PWA). It works flawlessly on iOS and Android devices, offering a native-app-like experience directly from your browser.'
      }
    ]
  }
];

const TabsFAQ: React.FC = () => {
  const [activeTab, setActiveTab] = useState(tabsData[0].id);
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <div className="w-full max-w-4xl mx-auto p-4">
      {/* Tabs Navigation */}
      <div className="flex justify-center mb-8">
        <div className="flex space-x-1 bg-slate-100 dark:bg-slate-900/50 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          {tabsData.map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                setOpenIndex(0); // Reset open accordion on tab switch
              }}
              className={`relative px-6 py-2.5 text-sm font-semibold transition-colors rounded-xl focus:outline-none ${
                activeTab === tab.id 
                  ? 'text-slate-900 dark:text-white' 
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
              }`}
            >
              {activeTab === tab.id && (
                <motion.div
                  layoutId="active-pill"
                  className="absolute inset-0 bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200/50 dark:border-slate-700"
                  transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                />
              )}
              <span className="relative z-10">{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Content Area */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.3 }}
          className="space-y-3"
        >
          {tabsData.find((t) => t.id === activeTab)?.items.map((item, index) => {
            const isOpen = openIndex === index;
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className={`
                  overflow-hidden rounded-2xl border transition-all duration-300
                  ${isOpen 
                    ? 'bg-white dark:bg-slate-900 border-purple-500/30 dark:border-purple-500/30 shadow-lg shadow-purple-500/5' 
                    : 'bg-white/50 dark:bg-slate-900/30 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                  }
                `}
              >
                <button
                  onClick={() => setOpenIndex(isOpen ? null : index)}
                  className="w-full flex items-center justify-between p-5 text-left"
                >
                  <span className={`font-semibold text-lg transition-colors ${isOpen ? 'text-purple-600 dark:text-purple-400' : 'text-slate-700 dark:text-slate-200'}`}>
                    {item.question}
                  </span>
                  <span className={`p-1 rounded-full transition-colors ${isOpen ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400' : 'text-slate-400'}`}>
                    {isOpen ? <Minus size={20} /> : <Plus size={20} />}
                  </span>
                </button>
                
                <AnimatePresence>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: "easeInOut" }}
                    >
                      <div className="px-5 pb-5 pt-0 text-slate-600 dark:text-slate-400 leading-relaxed">
                        {item.answer}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default TabsFAQ;
