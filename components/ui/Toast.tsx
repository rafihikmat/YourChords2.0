import React, { useEffect } from 'react';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';
import { cn } from '../../lib/utils';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface ToastProps {
  id: string;
  type: ToastType;
  message: string;
  duration?: number;
  onClose: (id: string) => void;
}

const icons = {
  success: <CheckCircle className="w-5 h-5 text-green-500" />,
  error: <AlertCircle className="w-5 h-5 text-red-500" />,
  info: <Info className="w-5 h-5 text-blue-500" />,
  warning: <AlertTriangle className="w-5 h-5 text-yellow-500" />,
};

const styles = {
  success: 'border-green-500/20 bg-green-500/10 text-green-700 dark:text-green-400',
  error: 'border-red-500/20 bg-red-500/10 text-red-700 dark:text-red-400',
  info: 'border-blue-500/20 bg-blue-500/10 text-blue-700 dark:text-blue-400',
  warning: 'border-yellow-500/20 bg-yellow-500/10 text-yellow-700 dark:text-yellow-400',
};

export const Toast: React.FC<ToastProps> = ({ id, type, message, duration = 3000, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose(id);
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, id, onClose]);

  return (
    <div className={cn(
      "flex items-center gap-3 px-4 py-3 rounded-xl border shadow-lg backdrop-blur-md transition-all duration-500 animate-in slide-in-from-right-full fade-in",
      styles[type],
      "bg-white/80 dark:bg-slate-950/80" // Fallback/Base background
    )}>
      <div className="shrink-0">{icons[type]}</div>
      <p className="text-sm font-medium">{message}</p>
      <button 
        onClick={() => onClose(id)}
        className="shrink-0 p-1 hover:bg-black/5 dark:hover:bg-white/10 rounded-lg transition-colors"
      >
        <X className="w-4 h-4 opacity-50" />
      </button>
    </div>
  );
};
