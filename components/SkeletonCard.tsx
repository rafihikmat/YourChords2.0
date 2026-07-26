import React from 'react';

export default function SkeletonCard() {
  return (
    <div className="flex flex-col animate-pulse flex-shrink-0 w-36 sm:w-44 md:w-48 lg:w-56">
      <div className="w-full aspect-[3/4] bg-surface rounded-lg mb-3 border border-white/[0.04] relative overflow-hidden">
        <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-primary/[0.04] to-transparent animate-[shimmer_2s_infinite]"></div>
      </div>
      <div className="h-3.5 bg-surface rounded w-3/4 mb-2 overflow-hidden relative">
        <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-primary/[0.04] to-transparent animate-[shimmer_2s_infinite]"></div>
      </div>
      <div className="h-3 bg-surface/50 rounded w-1/2 overflow-hidden relative">
        <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-primary/[0.04] to-transparent animate-[shimmer_2s_infinite]"></div>
      </div>
    </div>
  );
}
