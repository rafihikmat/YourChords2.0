export interface AIProviderConfig {
  id: string;
  name: string;
  type: 'openai' | 'gemini';
  apiKeyEnv: string;
  baseURL?: string;
  model: string;
}

export const AI_PROVIDERS: AIProviderConfig[] = [
  { 
    id: 'openai',
    name: 'OpenAI (GPT-4o Mini)', 
    type: 'openai', 
    apiKeyEnv: 'VITE_OPENAI_API_KEY', 
    model: 'gpt-4o-mini' 
  },
  { 
    id: 'deepseek',
    name: 'DeepSeek (V3)', 
    type: 'openai', 
    apiKeyEnv: 'VITE_DEEPSEEK_API_KEY', 
    baseURL: 'https://api.deepseek.com', 
    model: 'deepseek-chat' 
  },
  { 
    id: 'kimi',
    name: 'Kimi (Moonshot)', 
    type: 'openai', 
    apiKeyEnv: 'VITE_KIMI_API_KEY', 
    baseURL: '/api/kimi', // Proxy via Vite
    model: 'moonshot-v1-8k' 
  },
  { 
    id: 'minimax',
    name: 'MiniMax', 
    type: 'openai', 
    apiKeyEnv: 'VITE_MINIMAX_API_KEY', 
    baseURL: '/api/minimax', // Proxy via Vite
    model: 'abab5.5-chat' 
  },
  { 
    id: 'openrouter',
    name: 'OpenRouter (Auto)', 
    type: 'openai', 
    apiKeyEnv: 'VITE_OPENROUTER_API_KEY', 
    baseURL: 'https://openrouter.ai/api/v1', 
    model: 'openai/gpt-3.5-turbo' // Fallback model
  },
  { 
    id: 'gemini',
    name: 'Google Gemini (1.5 Flash)', 
    type: 'gemini', 
    apiKeyEnv: 'VITE_API_KEY', 
    model: 'gemini-1.5-flash' 
  }
];
