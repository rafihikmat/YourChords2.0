import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, User, Bot, Sparkles, Loader2, RefreshCw } from 'lucide-react';
import { generateAIContent } from '@/lib/ai-service';
import { cn } from '@/lib/utils';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

const ProfessorChat: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: "Hello! I'm Professor Harmony. I specialize in Music Theory, History, Composition, and Performance. How can I assist your musical journey today?",
      timestamp: Date.now()
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    if (scrollAreaRef.current) {
      const { scrollHeight, clientHeight } = scrollAreaRef.current;
      scrollAreaRef.current.scrollTo({
        top: scrollHeight - clientHeight,
        behavior: 'smooth'
      });
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    const systemPrompt = `
You are Professor Harmony, a distinguished and friendly music professor.
Your knowledge domain is strictly limited to:
1. Music Theory and Harmony (notation, rhythm, scales, chords, structure).
2. Music History (periods, composers, evolution).
3. Instruments and Vocals (techniques, practice).
4. Composition and Arrangement (orchestration, songwriting).
5. Ethnomusicology (world music cultures).
6. Music Pedagogy (teaching methods).
7. Conducting and Ensemble Direction.
8. Music Research and Analysis.

RULES:
- You must ONLY answer questions related to music.
- If a user asks about non-music topics (e.g., coding, math, politics, general life), politely decline and ask them to return to a musical topic.
- Format your responses using clean Markdown (bold for emphasis, lists for steps).
- Keep your tone professional, encouraging, and educational.
- Do not mention that you are an AI if possible, act as the Professor.
- **LANGUAGE:** You are capable of understanding and speaking all languages. ALWAYS reply in the SAME language that the user uses. If the user speaks Indonesian, reply in Indonesian. If the user speaks English, reply in English. Default to English if the language is unclear or mixed, but prioritize matching the user's language.
    `.trim();

    try {
      const response = await generateAIContent(
        systemPrompt,
        userMessage.content
      );

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response,
        timestamp: Date.now()
      };

      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error("AI Error:", error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: "I apologize, but I'm having trouble accessing my musical archives. Please try again momentarily.",
        timestamp: Date.now()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      if (window.innerWidth > 768) {
        inputRef.current?.focus();
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-[600px] w-full max-w-4xl mx-auto bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-white/10 shadow-xl overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-950 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-full">
            <Bot className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 dark:text-white">Professor Harmony</h3>
            <p className="text-xs text-slate-500 flex items-center gap-1">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              Online & Ready to Teach
            </p>
          </div>
        </div>
        <button 
          type="button"
          onClick={() => setMessages([messages[0]])} 
          className="p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-full transition-colors text-slate-500"
          title="Clear Chat"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Messages Area */}
      <div 
        ref={scrollAreaRef}
        className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50 dark:bg-slate-950/50 scroll-smooth"
      >
        <AnimatePresence initial={false}>
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className={cn(
                "flex gap-3 max-w-[85%]",
                msg.role === 'user' ? "ml-auto flex-row-reverse" : ""
              )}
            >
              <div className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0",
                msg.role === 'user' ? "bg-primary text-white" : "bg-purple-600 text-white"
              )}>
                {msg.role === 'user' ? <User className="w-5 h-5" /> : <Bot className="w-5 h-5" />}
              </div>
              
              <div className={cn(
                "p-3 rounded-2xl text-sm leading-relaxed shadow-sm overflow-hidden",
                msg.role === 'user' 
                  ? "bg-primary text-white rounded-tr-none" 
                  : "bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-tl-none border border-slate-200 dark:border-white/5"
              )}>
                {msg.role === 'user' ? (
                  <div className="whitespace-pre-wrap">{msg.content}</div>
                ) : (
                  <div className="prose dark:prose-invert prose-sm max-w-none prose-p:my-1 prose-headings:my-2 prose-ul:my-1 prose-li:my-0">
                    <ReactMarkdown 
                      remarkPlugins={[remarkGfm]}
                      components={{
                        p: ({node, ...props}) => <p className="mb-2 last:mb-0" {...props} />,
                        ul: ({node, ...props}) => <ul className="list-disc ml-4 mb-2" {...props} />,
                        ol: ({node, ...props}) => <ol className="list-decimal ml-4 mb-2" {...props} />,
                        li: ({node, ...props}) => <li className="mb-1" {...props} />,
                        strong: ({node, ...props}) => <span className="font-bold text-purple-700 dark:text-purple-400" {...props} />,
                      }}
                    >
                      {msg.content}
                    </ReactMarkdown>
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        
        {isLoading && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex gap-3 max-w-[85%]"
          >
             <div className="w-8 h-8 rounded-full bg-purple-600 text-white flex items-center justify-center flex-shrink-0">
                <Bot className="w-5 h-5" />
              </div>
              <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl rounded-tl-none border border-slate-200 dark:border-white/5 flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-purple-600" />
                <span className="text-xs text-slate-500 animate-pulse">Professor is thinking...</span>
              </div>
          </motion.div>
        )}
      </div>

      {/* Input Area */}
      <div className="p-4 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-white/10">
        <div className="relative flex items-end gap-2">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about chords, scales, or music theory..."
            className="w-full min-h-[50px] max-h-[150px] p-3 pr-12 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary/50 outline-none resize-none"
            rows={1}
          />
          <button
            type="button"
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className="absolute right-2 bottom-2 p-2 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-primary/25"
          >
            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
          </button>
        </div>
        <div className="text-center mt-2">
           <p className="text-[10px] text-slate-400 flex items-center justify-center gap-1">
             <Sparkles className="w-3 h-3" /> Powered by Advanced AI Models
           </p>
        </div>
      </div>
    </div>
  );
};

export default ProfessorChat;
