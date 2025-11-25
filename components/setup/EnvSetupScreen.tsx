
import React from 'react';
import { Copy, ShieldAlert, Database, Key } from 'lucide-react';

export const EnvSetupScreen: React.FC = () => {
  const envExample = `VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFnZmt0Zmp3bnB5Y3JlbWVnZW1lIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM2NzQyMjcsImV4cCI6MjA3OTI1MDIyN30.cSPW-OROIwQiN8hCY6Ecl_g79Y2bOP_mKgc76bkmh00
API_KEY=AIzaSyAupO7EhV9sfU_n5fI0xb6vTA0sAZ2zZD4`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(envExample);
    alert("Copied to clipboard!");
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-6 text-slate-900 dark:text-white font-sans">
       <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-slate-200 via-slate-50 to-slate-50 dark:from-slate-900 dark:via-slate-950 dark:to-slate-950 z-0"></div>
       
       <div className="relative z-10 max-w-2xl w-full bg-white/80 dark:bg-slate-900/50 backdrop-blur-xl border border-yellow-500/30 rounded-2xl p-8 shadow-2xl">
          <div className="flex items-center gap-4 text-yellow-600 dark:text-yellow-500 mb-6 border-b border-yellow-500/10 pb-6">
             <div className="p-3 bg-yellow-500/10 rounded-xl">
                <ShieldAlert className="w-8 h-8" />
             </div>
             <div>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Missing Environment Configuration</h1>
                <p className="text-slate-500 dark:text-slate-400 text-sm">System cannot initialize Neural Uplink</p>
             </div>
          </div>

          <div className="space-y-6">
             <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                To connect <strong>YourChords</strong> to the backend, you must create a <code className="text-yellow-600 dark:text-yellow-400 font-mono bg-yellow-100 dark:bg-yellow-400/10 px-1.5 py-0.5 rounded">.env</code> file in the project root.
             </p>

             <div className="space-y-2">
                <div className="flex items-center justify-between text-xs uppercase tracking-wider text-slate-500 font-semibold">
                   <span>Required Variables</span>
                   <button onClick={copyToClipboard} className="flex items-center gap-1 hover:text-primary transition-colors">
                      <Copy className="w-3 h-3" /> Copy Snippet
                   </button>
                </div>
                <div className="relative group">
                   <pre className="bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-4 text-sm font-mono text-slate-800 dark:text-green-400 overflow-x-auto shadow-inner">
                      {envExample}
                   </pre>
                </div>
             </div>

             <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <a 
                  href="https://supabase.com/dashboard/project/_/settings/api" 
                  target="_blank" 
                  rel="noreferrer"
                  className="flex items-center justify-center gap-2 p-3 rounded-lg bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 transition-all text-sm font-medium"
                >
                   <Database className="w-4 h-4 text-green-500 dark:text-green-400" />
                   Get Supabase Keys
                </a>
                <a 
                  href="https://aistudio.google.com/app/apikey" 
                  target="_blank" 
                  rel="noreferrer"
                  className="flex items-center justify-center gap-2 p-3 rounded-lg bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 transition-all text-sm font-medium"
                >
                   <Key className="w-4 h-4 text-blue-500 dark:text-blue-400" />
                   Get Gemini API Key
                </a>
             </div>
          </div>
       </div>
    </div>
  );
};
