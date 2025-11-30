import React from 'react';
import { Search, Filter, X } from 'lucide-react';
import { cn } from '../../lib/utils';

interface SearchFilterBarProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  placeholder?: string;
  filters?: {
    value: string;
    onChange: (value: string) => void;
    options: { label: string; value: string }[];
    icon?: React.ReactNode;
  }[];
  actions?: React.ReactNode;
}

export const SearchFilterBar: React.FC<SearchFilterBarProps> = ({
  searchTerm,
  onSearchChange,
  placeholder = "Search...",
  filters = [],
  actions
}) => {
  return (
    <div className="flex flex-col sm:flex-row items-center gap-4 w-full xl:w-auto bg-white/50 dark:bg-slate-900/50 p-2 rounded-2xl border border-slate-200/60 dark:border-white/5 backdrop-blur-sm">
      {/* Search & Filter Group */}
      <div className="flex items-center gap-3 bg-white dark:bg-slate-950 p-1.5 rounded-xl border border-slate-200/60 dark:border-white/5 shadow-sm flex-1 w-full sm:w-auto">
        <div className="relative flex-1 sm:w-64">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
          <input 
            type="text" 
            placeholder={placeholder}
            value={searchTerm} 
            onChange={(e) => onSearchChange(e.target.value)} 
            className="pl-10 pr-8 py-2 rounded-lg bg-transparent border-none focus:ring-0 text-sm w-full text-slate-900 dark:text-white placeholder-slate-500" 
          />
          {searchTerm && (
            <button 
              onClick={() => onSearchChange('')}
              className="absolute right-2 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        
        {filters.map((filter, idx) => (
          <React.Fragment key={idx}>
            <div className="h-6 w-px bg-slate-200 dark:bg-white/10"></div>
            <div className="relative">
              <div className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-slate-400 pointer-events-none">
                {filter.icon || <Filter className="w-3.5 h-3.5" />}
              </div>
              <select 
                className="bg-transparent text-sm font-medium text-slate-600 dark:text-slate-400 focus:outline-none cursor-pointer pl-8 pr-2 py-2 appearance-none hover:text-primary transition-colors max-w-[120px] truncate" 
                value={filter.value} 
                onChange={(e) => filter.onChange(e.target.value)}
              >
                {filter.options.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
          </React.Fragment>
        ))}
      </div>

      {/* Action Group */}
      {actions && (
        <div className="flex gap-2 w-full sm:w-auto">
          {actions}
        </div>
      )}
    </div>
  );
};
