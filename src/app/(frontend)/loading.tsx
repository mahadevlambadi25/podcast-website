import React from 'react';

export default function Loading() {
  return (
    <div className="w-full min-h-[60vh] max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 space-y-10 animate-fade-in">
      {/* Top subtle golden progress line */}
      <div className="fixed top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#C6A15B] to-transparent animate-pulse z-50 pointer-events-none" />

      {/* Header Skeleton */}
      <div className="space-y-4 max-w-2xl">
        <div className="h-6 w-32 rounded-full bg-[#DFE3E8]/60 animate-pulse" />
        <div className="h-10 sm:h-12 w-3/4 rounded-2xl bg-[#DFE3E8]/80 animate-pulse" />
        <div className="h-4 w-full max-w-md rounded-lg bg-[#DFE3E8]/50 animate-pulse" />
      </div>

      {/* Grid Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 pt-4">
        {[1, 2, 3].map((n) => (
          <div
            key={n}
            className="rounded-2xl overflow-hidden bg-white border border-[#DFE3E8] p-4 space-y-4 shadow-sm"
          >
            <div className="aspect-video w-full rounded-xl bg-[#EDE8DE] animate-pulse" />
            <div className="space-y-2 pt-2">
              <div className="h-4 w-24 rounded bg-[#DFE3E8]/70 animate-pulse" />
              <div className="h-6 w-5/6 rounded-lg bg-[#DFE3E8]/90 animate-pulse" />
              <div className="h-3 w-full rounded bg-[#DFE3E8]/50 animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
