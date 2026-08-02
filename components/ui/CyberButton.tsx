'use client';

import React from 'react';
import { Loader2 } from 'lucide-react';

export interface CyberButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'cyan' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const CyberButton: React.FC<CyberButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  leftIcon,
  rightIcon,
  className = '',
  disabled,
  ...props
}) => {
  const variantStyles = {
    primary:
      'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white border border-purple-400/30 shadow-glow-sm hover:shadow-glow-md',
    cyan:
      'bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-500 hover:to-teal-500 text-white border border-cyan-400/30 shadow-glow-cyan hover:shadow-[0_0_30px_-5px_rgba(6,182,212,0.6)]',
    outline:
      'bg-slate-900/40 hover:bg-purple-950/40 text-purple-300 hover:text-white border border-purple-500/40 hover:border-purple-400 shadow-sm hover:shadow-glow-sm',
    ghost:
      'bg-transparent hover:bg-slate-800/50 text-slate-300 hover:text-white border border-transparent',
    danger:
      'bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white border border-rose-400/30 shadow-[0_0_15px_-3px_rgba(244,63,94,0.3)] hover:shadow-[0_0_25px_-5px_rgba(244,63,94,0.5)]',
  };

  const sizeStyles = {
    sm: 'px-3 py-1.5 text-xs font-semibold rounded-lg gap-1.5',
    md: 'px-4 py-2 text-sm font-semibold rounded-xl gap-2',
    lg: 'px-6 py-3 text-base font-bold rounded-xl gap-2.5',
  };

  const isDisabled = disabled || isLoading;

  return (
    <button
      disabled={isDisabled}
      className={`
        relative inline-flex items-center justify-center overflow-hidden transition-all duration-200 
        backdrop-blur-md cursor-pointer select-none
        hover:scale-[1.02] active:scale-95
        disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:shadow-none
        ${variantStyles[variant]}
        ${sizeStyles[size]}
        ${className}
      `}
      {...props}
    >
      {!isDisabled && (
        <span className="absolute inset-0 pointer-events-none opacity-0 hover:opacity-100 transition-opacity duration-300">
          <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full animate-light-sweep" />
        </span>
      )}

      {isLoading ? (
        <Loader2 className="w-4 h-4 animate-spin text-current" />
      ) : (
        leftIcon && <span className="inline-flex shrink-0 items-center">{leftIcon}</span>
      )}

      <span className="relative z-10 whitespace-nowrap">{children}</span>

      {!isLoading && rightIcon && (
        <span className="inline-flex shrink-0 items-center">{rightIcon}</span>
      )}
    </button>
  );
};

export default CyberButton;
