'use client';

import React from 'react';

export interface CyberBadgeProps {
  variant?: 'purple' | 'cyan' | 'green' | 'amber' | 'rose';
  size?: 'sm' | 'md';
  pulse?: boolean;
  icon?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export const CyberBadge: React.FC<CyberBadgeProps> = ({
  variant = 'purple',
  size = 'md',
  pulse = false,
  icon,
  children,
  className = '',
}) => {
  const variantStyles = {
    purple:
      'bg-purple-950/40 text-purple-300 border-purple-500/30 shadow-[0_0_12px_-2px_rgba(168,85,247,0.25)]',
    cyan:
      'bg-cyan-950/40 text-cyan-300 border-cyan-500/30 shadow-[0_0_12px_-2px_rgba(6,182,212,0.25)]',
    green:
      'bg-emerald-950/40 text-emerald-300 border-emerald-500/30 shadow-[0_0_12px_-2px_rgba(16,185,129,0.25)]',
    amber:
      'bg-amber-950/40 text-amber-300 border-amber-500/30 shadow-[0_0_12px_-2px_rgba(245,158,11,0.25)]',
    rose:
      'bg-rose-950/40 text-rose-300 border-rose-500/30 shadow-[0_0_12px_-2px_rgba(244,63,94,0.25)]',
  };

  const dotColors = {
    purple: 'bg-purple-400',
    cyan: 'bg-cyan-400',
    green: 'bg-emerald-400',
    amber: 'bg-amber-400',
    rose: 'bg-rose-400',
  };

  const sizeStyles = {
    sm: 'px-2 py-0.5 text-[11px] font-medium gap-1 rounded-full',
    md: 'px-2.5 py-1 text-xs font-semibold gap-1.5 rounded-full',
  };

  return (
    <span
      className={`
        inline-flex items-center backdrop-blur-md border uppercase tracking-wider
        whitespace-nowrap transition-all duration-200
        ${variantStyles[variant]}
        ${sizeStyles[size]}
        ${className}
      `}
    >
      {pulse && (
        <span className="relative flex h-2 w-2 items-center justify-center">
          <span
            className={`absolute inline-flex h-full w-full rounded-full opacity-75 animate-ping ${dotColors[variant]}`}
          />
          <span
            className={`relative inline-flex h-1.5 w-1.5 rounded-full ${dotColors[variant]}`}
          />
        </span>
      )}

      {icon && <span className="inline-flex shrink-0 items-center">{icon}</span>}

      <span>{children}</span>
    </span>
  );
};

export default CyberBadge;
