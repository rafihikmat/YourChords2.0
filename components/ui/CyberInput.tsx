'use client';

import React, { forwardRef } from 'react';

export interface CyberInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
  leftElement?: React.ReactNode;
  rightElement?: React.ReactNode;
  helperText?: string;
}

export const CyberInput = forwardRef<HTMLInputElement, CyberInputProps>(
  (
    {
      label,
      error,
      icon,
      leftElement,
      rightElement,
      helperText,
      className = '',
      id,
      disabled,
      ...props
    },
    ref
  ) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);
    const hasLeftIcon = icon || leftElement;

    return (
      <div className="w-full flex flex-col gap-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="text-xs font-semibold uppercase tracking-wider text-slate-300 flex items-center justify-between"
          >
            <span>{label}</span>
          </label>
        )}

        <div className="relative flex items-center w-full">
          {hasLeftIcon && (
            <div className="absolute left-3.5 inset-y-0 flex items-center justify-center text-slate-400 pointer-events-none">
              {icon || leftElement}
            </div>
          )}

          <input
            ref={ref}
            id={inputId}
            disabled={disabled}
            className={`
              w-full bg-slate-950/70 text-slate-100 placeholder-slate-500 text-sm rounded-xl
              border transition-all duration-200 outline-none
              ${hasLeftIcon ? 'pl-10' : 'pl-4'}
              ${rightElement ? 'pr-10' : 'pr-4'}
              py-2.5
              ${
                error
                  ? 'border-rose-500/70 focus:border-rose-500 focus:ring-1 focus:ring-rose-500'
                  : 'border-purple-500/25 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 hover:border-purple-500/40'
              }
              disabled:opacity-50 disabled:cursor-not-allowed
              ${className}
            `}
            {...props}
          />

          {rightElement && (
            <div className="absolute right-3.5 inset-y-0 flex items-center justify-center text-slate-400">
              {rightElement}
            </div>
          )}
        </div>

        {error && (
          <p className="text-xs text-rose-400 font-medium mt-0.5 flex items-center gap-1">
            <span>•</span> {error}
          </p>
        )}

        {!error && helperText && (
          <p className="text-xs text-slate-400 mt-0.5">{helperText}</p>
        )}
      </div>
    );
  }
);

CyberInput.displayName = 'CyberInput';

export default CyberInput;
