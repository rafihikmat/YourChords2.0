
import React, { useState, useRef, useEffect } from 'react';
import { Send, User, Bot, Sparkles, BrainCircuit, Zap, Globe, Loader2 } from 'lucide-react';
import { Chat, GenerateContentResponse } from "@google/genai";
import { ai } from '../lib/gemini';
import { cn, DOT_GRID_SVG } from '../lib/utils';
import { Spotlight } from '../components/ui/Spotlight';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

/**
 * Defines the available chat modes and their configurations.
 */
type ChatMode = 'turbo' | 'guru' | 'thinking' | 'researcher';

/**
 * Structure of a chat message.
 */
interface Message {
    /** Unique identifier for the message. */
    id: string;
    /** Role of the sender (user or model). */
    role: 'user' | 'model';
    /** The content of the message. */
    text: string;
    /** Optional web sources for citation (Researcher mode). */
    groundingUrls?: {uri: string, title: string}[]
}

/**
 * Configuration for each chat mode.
 */
const MODES: Record<ChatMode, { name: string; icon: React.ReactNode; description: string; model: string; systemInstruction: string }> = {
  turbo: { 
    name: 'Turbo', 
    icon: <Zap className="w-4 h-4 text-yellow-400" />, 
    description: 'Fast Assistant', 
    model: 'gemini-2.0-flash', 
    // Prompt singkat untuk mode cepat
    systemInstruction: 'You are a helpful music assistant. Answer strictly about music only. Concise answers.' 
  },
  guru: { 
    name: 'Professor', 
    icon: <Bot className="w-4 h-4 text-primary" />, 
    description: 'Music Theory Expert', 
    model: 'gemini-2.0-flash', 
    systemInstruction: `You are "Professor Melodi," an expert in Music Arts (theory, history, composition, instruments). 
    MISSION: Assist users with music inquiries only. Explain complex concepts simply.
    STRICT CONSTRAINTS: 
    1. ONLY answer questions related to music/audio. 
    2. REFUSE any non-music topics (politics, coding, cooking, etc) with: "Maaf, sebagai Profesor Musik, saya hanya membahas musik."
    3. Detect language (Indonesian/English) and reply accordingly.` 
  },
  thinking: { 
    name: 'Deep Thought', 
    icon: <BrainCircuit className="w-4 h-4 text-purple-400" />, 
    description: 'Detailed Analysis', 
    model: 'gemini-2.0-flash', 
    systemInstruction: 'You are a deep reasoning engine for complex music analysis. Breakdown song structures and theoretical concepts in depth.' 
  },
  researcher: { 
    name: 'Researcher', 
    icon: <Globe className="w-4 h-4 text-green-400" />, 
    description: 'Live Music Data', 
    model: 'gemini-2.0-flash', 
    systemInstruction: 'You are a music researcher. Find facts about latest songs, artist biographies, and music trends.' 
  }
};
const ChatPage: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([{ id: '1', role: 'model', text: "Greetings. Select a persona to begin." }]);
  const [input, setInput] = useState('');
  const [mode, setMode] = useState<ChatMode>('guru');
  const [isStreaming, setIsStreaming] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const chatRef = useRef<Chat | null>(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);
  useEffect(() => { chatRef.current = null; }, [mode]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isStreaming) return;

    const userMsg: Message = { id: Date.now().toString(), role: 'user', text: input };
    setMessages(p => [...p, userMsg]);
    setInput('');
    setIsStreaming(true);

    try {
      const { model, systemInstruction } = MODES[mode];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const config: any = { systemInstruction };
      if (mode === 'thinking') config.thinkingConfig = { thinkingBudget: 32768 };
      if (mode === 'researcher') config.tools = [{ googleSearch: {} }];

      if (!chatRef.current) chatRef.current = ai.chats.create({ model, config });

      const aiId = (Date.now() + 1).toString();
      setMessages(p => [...p, { id: aiId, role: 'model', text: '' }]);

      const stream = await chatRef.current.sendMessageStream({ message: userMsg.text });
      let fullText = '';
      
      for await (const chunk of stream) {
        const c = chunk as GenerateContentResponse;
        if (c.text) {
          fullText += c.text;
          setMessages(p => p.map(m => m.id === aiId ? { ...m, text: fullText } : m));
        }
         
        const urls = c.candidates?.[0]?.groundingMetadata?.groundingChunks
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            ?.filter((x: any) => x.web?.uri).map((x: any) => ({ uri: x.web.uri, title: x.web.title }));
        
        if (urls?.length) {
             setMessages(p => p.map(m => m.id === aiId ? { ...m, groundingUrls: urls } : m));
        }
      }
    } catch {
      setMessages(p => [...p, { id: Date.now().toString(), role: 'model', text: "Connection interrupted." }]);
    } finally {
      setIsStreaming(false);
    }
  };

  return (
    <div className="relative w-full h-screen pt-20 pb-6 px-4 overflow-hidden flex flex-col">
      <Spotlight className="-top-40 left-0 hidden dark:block opacity-50" fill="white" />

      <div className="relative z-10 flex-1 max-w-5xl mx-auto w-full flex flex-col bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl rounded-2xl border border-slate-200 dark:border-white/10 shadow-2xl overflow-hidden">
        <div className="p-4 border-b border-slate-200 dark:border-white/10 flex flex-wrap items-center justify-between gap-4 bg-white/60 dark:bg-slate-950/60">
            <div className="flex items-center gap-3"><Bot className="w-6 h-6 text-primary" /><span className="font-bold dark:text-white">Neural Chat</span></div>
            <div className="flex bg-slate-200 dark:bg-slate-800 p-1 rounded-lg overflow-x-auto">
                {(Object.keys(MODES) as ChatMode[]).map((m) => (
                    <button key={m} onClick={() => setMode(m)} className={cn("flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-all", mode === m ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm" : "text-slate-500 dark:text-slate-400")}>
                        {MODES[m].icon} <span className="hidden sm:inline">{MODES[m].name}</span>
                    </button>
                ))}
            </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
            {messages.map((msg) => (
                <div key={msg.id} className={cn("flex gap-4", msg.role === 'user' ? "flex-row-reverse" : "flex-row")}>
                    <div className={cn("w-8 h-8 rounded-full flex items-center justify-center shrink-0", msg.role === 'user' ? "bg-primary text-white" : "bg-slate-200 dark:bg-slate-800")}>
                        {msg.role === 'user' ? <User className="w-4 h-4" /> : <Sparkles className="w-4 h-4" />}
                    </div>
                    <div className={cn("max-w-[80%] rounded-2xl px-5 py-3 text-sm leading-relaxed shadow-sm", msg.role === 'user' ? "bg-primary text-white rounded-tr-none" : "bg-white dark:bg-slate-800/80 dark:text-slate-200 border border-slate-200 dark:border-white/5 rounded-tl-none")}>
                        <div className="prose dark:prose-invert max-w-none text-xs md:text-sm">
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                {msg.text}
                            </ReactMarkdown>
                        </div>
                        {msg.groundingUrls && (
                            <div className="mt-3 pt-3 border-t border-white/10 flex flex-wrap gap-2">
                                {msg.groundingUrls.map((u, i) => (
                                    <a key={i} href={u.uri} target="_blank" rel="noreferrer" className="text-xs bg-black/20 px-2 py-1 rounded truncate max-w-[200px]">{u.title || u.uri}</a>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            ))}
            {isStreaming && <Loader2 className="w-6 h-6 animate-spin text-primary mx-auto" />}
            <div ref={bottomRef} />
        </div>

        <div className="p-4 bg-white/60 dark:bg-slate-950/60 border-t border-slate-200 dark:border-white/10">
            <form onSubmit={handleSend} className="relative flex items-center">
                <input type="text" value={input} onChange={(e) => setInput(e.target.value)} placeholder={`Ask ${MODES[mode].name}...`} className="w-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl py-3 pl-4 pr-12 text-sm dark:text-white focus:ring-2 focus:ring-primary/50 outline-none" />
                <button type="submit" disabled={!input.trim() || isStreaming} className="absolute right-2 p-2 bg-primary text-white rounded-lg disabled:opacity-50"><Send className="w-4 h-4" /></button>
            </form>
        </div>
      </div>
    </div>
  );
};

export default ChatPage;
