'use client';

import React from 'react';

export interface CyberCardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'interactive' | 'glowing';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  children: React.ReactNode;
}

export const CyberCard: React.FC<CyberCardProps> = ({
  children,
  variant = 'default',
  padding = 'md',
  className = '',
  onClick,
  ...props
}) => {
  const paddingStyles = {
    none: 'p-0',
    sm: 'p-3 sm:p-4',
    md: 'p-5 sm:p-6',
    lg: 'p-6 sm:p-8',
  };

  const variantStyles = {
    default:
      'bg-slate-900/65 backdrop-blur-xl border border-purple-500/20 shadow-xl',
    interactive:
      'bg-slate-900/65 backdrop-blur-xl border border-purple-500/20 shadow-xl hover:-translate-y-1 hover:border-purple-500/40 hover:bg-slate-900/80 hover:shadow-glow-md cursor-pointer transition-all duration-300',
    glowing:
      'bg-slate-900/70 backdrop-blur-2xl border border-purple-500/35 shadow-glow-sm hover:shadow-glow-md hover:border-cyan-500/50 transition-all duration-300',
  };

  return (
    <div
      onClick={onClick}
      className={`
        relative rounded-2xl overflow-hidden transition-all duration-300
        ${variantStyles[variant]}
        ${paddingStyles[padding]}
        ${className}
      `}
      {...props}
    >
      <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-purple-400/30 to-transparent pointer-events-none" />
      {children}
    </div>
  );
};

export default CyberCard;
