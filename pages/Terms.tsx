import React from 'react';
import { FileText } from 'lucide-react';

const Terms: React.FC = () => {
  return (
    <div className="min-h-screen pt-24 pb-12 px-4 relative overflow-hidden">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <div className="p-3 bg-primary/10 rounded-xl">
            <FileText className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Terms of Service</h1>
        </div>
        
        <div className="prose dark:prose-invert max-w-none bg-white dark:bg-slate-900 p-8 rounded-2xl border border-slate-200 dark:border-white/10 shadow-sm">
          <p className="text-lg text-slate-600 dark:text-slate-300 mb-6">
            Last updated: {new Date().toLocaleDateString()}
          </p>

          <section className="mb-8">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">1. Agreement to Terms</h2>
            <p className="text-slate-600 dark:text-slate-400">
              By accessing our website, you agree to be bound by these Terms of Service and to comply with all applicable laws and regulations.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">2. Use License</h2>
            <p className="text-slate-600 dark:text-slate-400">
              Permission is granted to temporarily download one copy of the materials (information or software) on YourChords' website for personal, non-commercial transitory viewing only.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">3. Disclaimer</h2>
            <p className="text-slate-600 dark:text-slate-400">
              The materials on YourChords' website are provided on an 'as is' basis. YourChords makes no warranties, expressed or implied, and hereby disclaims and negates all other warranties including, without limitation, implied warranties or conditions of merchantability, fitness for a particular purpose, or non-infringement of intellectual property or other violation of rights.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default Terms;
