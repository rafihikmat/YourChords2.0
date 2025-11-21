
import React, { useState, useRef, useEffect } from 'react';
import { Send, User, Bot, Sparkles, BrainCircuit, Zap, Globe, Loader2 } from 'lucide-react';
import { Chat, GenerateContentResponse } from "@google/genai";
import { ai } from '../lib/gemini';
import { cn, DOT_GRID_SVG } from '../lib/utils';
import { Spotlight } from '../components/ui/Spotlight';

type ChatMode = 'turbo' | 'guru' | 'thinking' | 'researcher';

interface Message {
  id: string;
  role: 'user' | 'model';
  text: string;
  groundingUrls?: Array<{uri: string, title: string}>;
}

const modes: Record<ChatMode, { name: string; icon: React.ReactNode; description: string; model: string; systemInstruction: string }> = {
  turbo: {
    name: 'Turbo',
    icon: <Zap className="w-4 h-4 text-yellow-400" />,
    description: 'Fast responses (Flash Lite)',
    model: 'gemini-2.5-flash-lite-latest',
    systemInstruction: 'You are a helpful music assistant. Keep answers short and concise.'
  },
  guru: {
    name: 'Theory Guru',
    icon: <Bot className="w-4 h-4 text-primary" />,
    description: 'Music Theory & Harmony Expert',
    model: 'gemini-3-pro-preview',
    systemInstruction: 'You are a world-class Music Theory Expert and Composer. You specialize in explaining harmony, scales, modes, chord progressions, and compositional techniques. Provide detailed, educational answers. When explaining chords, visualize the intervals. Use ASCII representation for musical staves or fretboards if helpful.'
  },
  thinking: {
    name: 'Deep Thought',
    icon: <BrainCircuit className="w-4 h-4 text-purple-400" />,
    description: 'Complex analysis (Reasoning)',
    model: 'gemini-3-pro-preview',
    systemInstruction: 'You are a deep reasoning engine for complex musical analysis.'
  },
  researcher: {
    name: 'Researcher',
    icon: <Globe className="w-4 h-4 text-green-400" />,
    description: 'Live data (Grounding)',
    model: 'gemini-2.5-flash',
    systemInstruction: 'You are a music researcher with access to live web data.'
  }
};

const ChatPage: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    { id: '1', role: 'model', text: "Greetings. I am your AI Music Architect. Select 'Theory Guru' for questions about scales, modes, and harmony." }
  ]);
  const [input, setInput] = useState('');
  const [mode, setMode] = useState<ChatMode>('guru');
  const [isStreaming, setIsStreaming] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatSessionRef = useRef<Chat | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    chatSessionRef.current = null;
  }, [mode]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isStreaming) return;

    const userMessage: Message = { id: Date.now().toString(), role: 'user', text: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsStreaming(true);

    try {
      const currentMode = modes[mode];
      let config: any = { systemInstruction: currentMode.systemInstruction };

      if (mode === 'thinking') {
        config.thinkingConfig = { thinkingBudget: 32768 };
      } else if (mode === 'researcher') {
        config.tools = [{ googleSearch: {} }];
      }

      if (!chatSessionRef.current) {
        chatSessionRef.current = ai.chats.create({ model: currentMode.model, config });
      }

      const aiMessageId = (Date.now() + 1).toString();
      setMessages(prev => [...prev, { id: aiMessageId, role: 'model', text: '' }]);

      const result = await chatSessionRef.current.sendMessageStream({ message: userMessage.text });
      
      let fullText = '';
      let groundingUrls: any[] = [];

      for await (const chunk of result) {
        const c = chunk as GenerateContentResponse;
        if (c.text) {
          fullText += c.text;
          setMessages(prev => prev.map(msg => 
            msg.id === aiMessageId ? { ...msg, text: fullText } : msg
          ));
        }
        
        if (c.candidates?.[0]?.groundingMetadata?.groundingChunks) {
            const chunks = c.candidates[0].groundingMetadata.groundingChunks;
            chunks.forEach((chunk: any) => {
                if (chunk.web?.uri) {
                    groundingUrls.push({ uri: chunk.web.uri, title: chunk.web.title });
                }
            });
        }
      }

      if (groundingUrls.length > 0) {
          setMessages(prev => prev.map(msg => 
            msg.id === aiMessageId ? { ...msg, groundingUrls } : msg
          ));
      }

    } catch (error) {
      setMessages(prev => [...prev, { id: Date.now().toString(), role: 'model', text: "My neural link was interrupted. Please try again." }]);
    } finally {
      setIsStreaming(false);
    }
  };

  return (
    <div className="relative w-full h-screen pt-20 pb-6 px-4 bg-slate-50 dark:bg-slate-950 overflow-hidden flex flex-col transition-colors duration-500">
      <div 
        className="absolute inset-0 pointer-events-none z-0 opacity-30"
        style={{ backgroundImage: `url('data:image/svg+xml;utf8,${encodeURIComponent(DOT_GRID_SVG)}')`, backgroundSize: '20px 20px' }}
      />
      <Spotlight className="-top-40 left-0 hidden dark:block opacity-50" fill="white" />

      <div className="relative z-10 flex-1 max-w-5xl mx-auto w-full flex flex-col bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl rounded-2xl border border-slate-200 dark:border-white/10 shadow-2xl overflow-hidden">
        
        <div className="p-4 border-b border-slate-200 dark:border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 bg-white/60 dark:bg-slate-950/60">
            <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg"><Bot className="w-6 h-6 text-primary" /></div>
                <div>
                    <h2 className="font-bold text-slate-900 dark:text-white">Neural Chat</h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Ask the {modes[mode].name}</p>
                </div>
            </div>
            
            <div className="flex bg-slate-200 dark:bg-slate-800 p-1 rounded-lg overflow-x-auto max-w-full">
                {(Object.keys(modes) as ChatMode[]).map((m) => (
                    <button
                        key={m}
                        onClick={() => setMode(m)}
                        className={cn(
                            "flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-all whitespace-nowrap",
                            mode === m 
                                ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm" 
                                : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
                        )}
                        title={modes[m].description}
                    >
                        {modes[m].icon}
                        <span className="hidden sm:inline">{modes[m].name}</span>
                    </button>
                ))}
            </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
            {messages.map((msg) => (
                <div key={msg.id} className={cn("flex gap-4", msg.role === 'user' ? "flex-row-reverse" : "flex-row")}>
                    <div className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center shrink-0",
                        msg.role === 'user' ? "bg-primary text-white" : "bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
                    )}>
                        {msg.role === 'user' ? <User className="w-4 h-4" /> : <Sparkles className="w-4 h-4" />}
                    </div>
                    <div className={cn(
                        "max-w-[80%] rounded-2xl px-5 py-3 text-sm leading-relaxed shadow-sm",
                        msg.role === 'user' 
                            ? "bg-primary text-white rounded-tr-none" 
                            : "bg-white dark:bg-slate-800/80 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-white/5 rounded-tl-none"
                    )}>
                        <div className="whitespace-pre-wrap font-mono text-xs md:text-sm">{msg.text}</div>
                        {msg.groundingUrls && msg.groundingUrls.length > 0 && (
                            <div className="mt-3 pt-3 border-t border-white/10">
                                <p className="text-xs font-semibold mb-1 opacity-70 flex items-center gap-1"><Globe className="w-3 h-3" /> Sources:</p>
                                <div className="flex flex-wrap gap-2">
                                    {msg.groundingUrls.map((url, idx) => (
                                        <a key={idx} href={url.uri} target="_blank" rel="noreferrer" className="text-xs bg-black/20 hover:bg-black/30 px-2 py-1 rounded transition-colors truncate max-w-[200px] block">
                                            {url.title || url.uri}
                                        </a>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            ))}
            {isStreaming && (
                <div className="flex gap-4">
                     <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center shrink-0">
                        <Sparkles className="w-4 h-4" />
                    </div>
                    <div className="bg-white dark:bg-slate-800/80 px-5 py-3 rounded-2xl rounded-tl-none border border-slate-200 dark:border-white/5">
                        <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
                    </div>
                </div>
            )}
            <div ref={messagesEndRef} />
        </div>

        <div className="p-4 bg-white/60 dark:bg-slate-950/60 border-t border-slate-200 dark:border-white/10">
            <form onSubmit={handleSend} className="relative flex items-center">
                <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder={mode === 'guru' ? "Ask about the Circle of Fifths, modal interchange, or chord extensions..." : "Type your message..."}
                    className="w-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl py-3 pl-4 pr-12 text-sm text-slate-900 dark:text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all shadow-inner"
                />
                <button 
                    type="submit"
                    disabled={!input.trim() || isStreaming}
                    className="absolute right-2 p-2 bg-primary hover:bg-primary/90 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <Send className="w-4 h-4" />
                </button>
            </form>
            <div className="text-center mt-2">
                <span className="text-[10px] text-slate-400 uppercase tracking-wider font-medium">
                    Using: <span className="text-primary">{modes[mode].name}</span> ({modes[mode].model})
                </span>
            </div>
        </div>
      </div>
    </div>
  );
};

export default ChatPage;
