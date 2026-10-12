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
    <div className="flex items-center gap-2.5 overflow-x-auto pb-2 scrollbar-none py-1">
      <Link
        href={baseUrl}
        className={`px-4 py-2 rounded-full text-xs whitespace-nowrap transition-all ${
          !activeTopic
            ? 'neu-pill-active font-bold shadow-md'
            : 'bg-white border border-[#DFE3E8] font-semibold text-[#596579] hover:text-[#172235] hover:border-[#C6A15B]'
        }`}
      >
        All
      </Link>

      {topics.map((t) => {
        const isActive = activeTopic === t.slug;
        return (
          <Link
            key={t.slug}
            href={`${baseUrl}?topic=${t.slug}`}
            className={`px-4 py-2 rounded-full text-xs whitespace-nowrap transition-all ${
              isActive
                ? 'neu-pill-active font-bold shadow-md'
                : 'bg-white border border-[#DFE3E8] font-semibold text-[#596579] hover:text-[#172235] hover:border-[#C6A15B]'
            }`}
          >
            {t.name}
          </Link>
        );
      })}
    </div>
  );
}
