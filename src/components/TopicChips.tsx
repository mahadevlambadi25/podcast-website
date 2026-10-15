import React from 'react';
import Link from 'next/link';

interface TopicChipsProps {
  topics: Array<{ name: string; slug: string }>;
  activeTopic?: string;
  baseUrl?: string;
}

export function TopicChips({ topics, activeTopic, baseUrl = '/episodes' }: TopicChipsProps) {
  if (!topics || topics.length === 0) return null;

  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none py-1">
      <Link
        href={baseUrl}
        className={`px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all duration-200 ${
          !activeTopic
            ? 'bg-gradient-to-r from-[#D4AF67] to-[#B89248] text-white font-bold shadow-sm shadow-[#C6A15B]/30 border border-white/20 scale-[1.02]'
            : 'bg-white border border-[#DFE3E8] text-[#596579] hover:text-[#172235] hover:border-[#C6A15B]/60 hover:bg-[#FAF8F5]'
        }`}
      >
        All Categories
      </Link>

      {topics.map((t) => {
        const isActive = activeTopic === t.slug;
        return (
          <Link
            key={t.slug}
            href={`${baseUrl}?topic=${t.slug}`}
            className={`px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all duration-200 ${
              isActive
                ? 'bg-gradient-to-r from-[#D4AF67] to-[#B89248] text-white font-bold shadow-sm shadow-[#C6A15B]/30 border border-white/20 scale-[1.02]'
                : 'bg-white border border-[#DFE3E8] text-[#596579] hover:text-[#172235] hover:border-[#C6A15B]/60 hover:bg-[#FAF8F5]'
            }`}
          >
            {t.name}
          </Link>
        );
      })}
    </div>
  );
}
