import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, Building, Award } from 'lucide-react';

interface GuestCardProps {
  guest: {
    id: string | number;
    fullName: string;
    slug: string;
    role: string;
    company?: string | null;
    shortOverview: string;
    portrait?: { url?: string; alt?: string } | null;
    portraitAlt?: string | null;
    industries?: any[];
  };
}

export function GuestCard({ guest }: GuestCardProps) {
  const portraitUrl = guest.portrait?.url || '/placeholders/portrait-placeholder.svg';
  const altText = guest.portraitAlt || guest.portrait?.alt || guest.fullName;

  const topics = (guest.industries || []).slice(0, 2).map((t: any) =>
    typeof t === 'object' ? t.name : t
  );

  return (
    <div className="rounded-2xl overflow-hidden flex flex-col group h-full bg-white border border-[#DFE3E8] shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
      {/* 4:5 Portrait Image with Bezel */}
      <div className="p-3 pb-0">
        <Link href={`/guests/${guest.slug}`} className="relative aspect-[4/5] w-full rounded-xl overflow-hidden bg-[#EDE8DE] block shadow-inner">
          <Image
            src={portraitUrl}
            alt={altText}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            className="object-cover group-hover:scale-105 transition-transform duration-700"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#101C2C]/70 via-transparent to-transparent opacity-80" />
          
          {/* Topic Badges Overlay */}
          {topics.length > 0 && (
            <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
              {topics.map((topic, i) => (
                <span
                  key={i}
                  className="px-2.5 py-0.5 rounded-lg text-[11px] font-bold text-[#172235] bg-white/95 backdrop-blur border border-[#DFE3E8]"
                >
                  {topic}
                </span>
              ))}
            </div>
          )}
        </Link>
      </div>

      {/* Guest Bio Info */}
      <div className="p-6 flex flex-col justify-between flex-1 space-y-4 bg-white">
        <div className="space-y-1.5">
          <h3 className="text-xl font-editorial font-bold text-[#172235] group-hover:text-[#C6A15B] transition-colors">
            <Link href={`/guests/${guest.slug}`}>
              {guest.fullName}
            </Link>
          </h3>

          <div className="text-xs text-[#C6A15B] font-bold">
            {guest.role}
          </div>

          {guest.company && (
            <div className="text-xs text-[#596579] flex items-center gap-1.5">
              <Building className="w-3.5 h-3.5 text-[#596579] shrink-0" />
              <span className="truncate">{guest.company}</span>
            </div>
          )}

          <p className="text-xs sm:text-sm text-[#596579] line-clamp-3 pt-2 leading-relaxed">
            {guest.shortOverview}
          </p>
        </div>

        <div className="pt-4 border-t border-[#DFE3E8]">
          <Link
            href={`/guests/${guest.slug}`}
            className="neu-btn px-4 py-2 text-xs font-bold uppercase tracking-wider text-[#C6A15B] group-hover:text-[#B89248] inline-flex items-center gap-2 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            View Story &amp; Episode
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
