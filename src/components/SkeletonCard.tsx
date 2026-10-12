import React from 'react';

export function EpisodeCardSkeleton() {
  return (
    <div className="neu-card rounded-2xl bg-neu-card border border-white/80 overflow-hidden animate-pulse p-3 space-y-3">
      <div className="aspect-video bg-neu-sunken rounded-xl neu-inset" />
      <div className="p-3 space-y-3">
        <div className="h-4 bg-neu-sunken rounded-lg w-1/4" />
        <div className="h-6 bg-neu-sunken rounded-lg w-3/4" />
        <div className="h-4 bg-neu-sunken rounded-lg w-full" />
        <div className="h-4 bg-neu-sunken rounded-lg w-2/3" />
      </div>
    </div>
  );
}

export function GuestCardSkeleton() {
  return (
    <div className="neu-card rounded-2xl bg-neu-card border border-white/80 overflow-hidden animate-pulse p-3 space-y-3">
      <div className="aspect-[4/5] bg-neu-sunken rounded-xl neu-inset" />
      <div className="p-3 space-y-2">
        <div className="h-5 bg-neu-sunken rounded-lg w-2/3" />
        <div className="h-3.5 bg-neu-sunken rounded-lg w-1/2" />
        <div className="h-3.5 bg-neu-sunken rounded-lg w-full pt-2" />
      </div>
    </div>
  );
}
