
import React from 'react';
import { motion } from 'framer-motion';
import { Copy, Music2, Terminal } from 'lucide-react';
import { cn } from '../lib/utils';

/**
 * Props for the TablatureView component.
 */
interface TablatureViewProps {
  /**
   * A key-value object where keys are section names (e.g., "Intro", "Solo")
   * and values are the tablature content (usually strings).
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  tabs: Record<string, any> | null;
  /** Optional class names for the container. */
  className?: string;
}

/**
 * Renders guitar tablature in a code-block style view with syntax highlighting aesthetics.
 * Includes copy functionality and supports multiple sections.
 *
 * @param {TablatureViewProps} props - The component props.
 * @returns {JSX.Element | null} The TablatureView component.
 */
const TablatureView: React.FC<TablatureViewProps> = ({ tabs, className }) => {
  if (!tabs || Object.keys(tabs).length === 0) return null;

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className={cn("space-y-6", className)}>
      <div className="flex items-center gap-3 mb-4">
         <div className="p-2 bg-secondary/10 rounded-lg border border-secondary/20 shadow-[0_0_15px_rgba(139,92,246,0.3)]">
            <Music2 className="w-6 h-6 text-secondary" />
         </div>
         <div>
             <h3 className="text-xl font-bold text-slate-900 dark:text-white">Guitar Tablature</h3>
             <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">ASCII_MODE_ENABLED</p>
         </div>
      </div>
      
      <div className="grid grid-cols-1 gap-8">
        {Object.entries(tabs).map(([section, content], idx) => (
          <motion.div 
            key={section}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="group relative overflow-hidden rounded-xl bg-[#0d1117] border border-slate-800 shadow-2xl ring-1 ring-white/5"
          >
            {/* Top Bar */}
            <div className="flex justify-between items-center px-4 py-2 border-b border-slate-800 bg-white/5">
              <div className="flex items-center gap-2">
                  <Terminal className="w-3.5 h-3.5 text-slate-500" />
                  <span className="ml-2 text-xs font-bold uppercase tracking-widest text-slate-400 font-mono">
                    {section}
                  </span>
              </div>
              <button 
                onClick={() => copyToClipboard(typeof content === 'string' ? content : JSON.stringify(content))}
                className="p-1.5 rounded-md text-slate-500 hover:text-green-400 hover:bg-green-400/10 transition-colors flex items-center gap-1.5"
                title="Copy Tab"
              >
                <span className="text-[10px] font-mono font-bold hidden group-hover:inline">COPY</span>
                <Copy className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Tab Content */}
            <div className="p-6 overflow-x-auto custom-scrollbar relative">
              {/* Subtle grid background for precision feel */}
              <div className="absolute inset-0 opacity-5 pointer-events-none" 
                   style={{ 
                       backgroundImage: 'linear-gradient(0deg, transparent 24%, #ffffff 25%, #ffffff 26%, transparent 27%, transparent 74%, #ffffff 75%, #ffffff 76%, transparent 77%, transparent), linear-gradient(90deg, transparent 24%, #ffffff 25%, #ffffff 26%, transparent 27%, transparent 74%, #ffffff 75%, #ffffff 76%, transparent 77%, transparent)',
                       backgroundSize: '30px 30px'
                   }}>
              </div>
              
              <div className="flex">
                  {/* Line Numbers */}
                  <div className="mr-4 pr-4 border-r border-white/10 text-slate-700 select-none text-right hidden md:block" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                      {(typeof content === 'string' ? content.split('\n') : JSON.stringify(content, null, 2).split('\n')).map((_, i) => (
                          <div key={i} className="text-sm leading-6 text-[10px] pt-0.5">{i + 1}</div>
                      ))}
                  </div>
                  
                  {/* Code */}
                  <pre className="font-mono text-sm text-green-400/90 whitespace-pre leading-6 tracking-wide" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                    {typeof content === 'string' ? content : JSON.stringify(content, null, 2)}
                  </pre>
              </div>
            </div>
            
            {/* Bottom accent bar */}
            <div className="h-0.5 w-full bg-gradient-to-r from-transparent via-green-500/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default TablatureView;
