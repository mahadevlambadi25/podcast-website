import React from 'react';
import { Quote } from 'lucide-react';

interface PullQuoteProps {
  quote: string;
  speaker?: string;
  context?: string;
  className?: string;
}

export function PullQuote({ quote, speaker, context, className = '' }: PullQuoteProps) {
  return (
    <figure
      className={`relative my-8 p-6 sm:p-8 rounded-2xl bg-white border border-[#DFE3E8] border-l-4 border-l-[#C6A15B] shadow-md ${className}`}
    >
      <Quote className="w-8 h-8 text-[#C6A15B]/30 mb-3" />
      <blockquote className="font-editorial text-lg sm:text-xl md:text-2xl text-[#172235] font-medium leading-snug tracking-tight italic">
        &ldquo;{quote.replace(/^["“]|["”]$/g, '')}&rdquo;
      </blockquote>
      {(speaker || context) && (
        <figcaption className="mt-4 flex flex-wrap items-center gap-2 text-xs text-[#596579]">
          {speaker && (
            <span className="font-sans font-bold text-[#C6A15B] uppercase tracking-wider">
              {speaker}
            </span>
          )}
          {speaker && context && <span className="text-neu-border">•</span>}
          {context && <span className="text-neu-muted">{context}</span>}
        </figcaption>
      )}
    </figure>
  );
}
