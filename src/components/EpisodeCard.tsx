import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Calendar, Play, Clock } from 'lucide-react';

interface EpisodeCardProps {
  episode: {
    id: string | number;
    title: string;
    slug: string;
    shortSummary: string;
    publishedAt: string;
    thumbnail?: { url?: string; alt?: string } | null;
    youtubeVideoId?: string | null;
    episodeNumber?: number | null;
    guests?: any[];
    topics?: any[];
  };
  featuredLarge?: boolean;
}

export function EpisodeCard({ episode, featuredLarge = false }: EpisodeCardProps) {
  const publishedDate = episode.publishedAt
    ? new Date(episode.publishedAt).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    : '';

  const thumbnailUrl =
    episode.thumbnail?.url ||
    (episode.youtubeVideoId
      ? `https://i.ytimg.com/vi/${episode.youtubeVideoId}/hqdefault.jpg`
      : '/placeholders/episode-placeholder.svg');

  const guests = (episode.guests || []).map((g: any) =>
    typeof g === 'object' ? g : { fullName: 'Featured Leader' }
  );

  if (featuredLarge) {
    return (
      <div className="rounded-3xl overflow-hidden group grid grid-cols-1 lg:grid-cols-12 shadow-xl border border-[#DFE3E8] bg-white transition-all duration-300">
        {/* Large Thumbnail */}
        <div className="relative aspect-video lg:aspect-auto lg:col-span-7 overflow-hidden bg-[#EDE8DE] p-3 sm:p-4">
          <div className="relative w-full h-full min-h-[260px] sm:min-h-[340px] rounded-2xl overflow-hidden shadow-inner">
            <Image
              src={thumbnailUrl}
              alt={episode.thumbnail?.alt || episode.title}
              fill
              sizes="(max-width: 1024px) 100vw, 60vw"
              priority
              className="object-cover group-hover:scale-105 transition-transform duration-700"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#101C2C]/80 via-transparent to-transparent" />
            
            <div className="absolute top-4 left-4 flex gap-2">
              <span className="px-3.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider neu-pill-active shadow-sm">
                Latest Episode
              </span>
              {episode.episodeNumber && (
                <span className="px-3 py-1 rounded-full text-xs font-bold neu-pill text-[#172235] bg-white/95 backdrop-blur border border-[#DFE3E8]">
                  EP #{episode.episodeNumber}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Card Content */}
        <div className="p-8 lg:p-10 lg:col-span-5 flex flex-col justify-between bg-white">
          <div className="space-y-4">
            <div className="flex items-center gap-3 text-xs font-semibold text-[#596579]">
              <span className="flex items-center gap-1.5 bg-[#F7F3EB] border border-[#DFE3E8] px-3 py-1 rounded-full text-[#596579]">
                <Calendar className="w-3.5 h-3.5 text-[#C6A15B]" />
                {publishedDate}
              </span>
            </div>

            <h3 className="text-2xl sm:text-3xl font-editorial font-bold text-[#172235] group-hover:text-[#C6A15B] transition-colors leading-tight">
              <Link href={`/episodes/${episode.slug}`}>
                {episode.title}
              </Link>
            </h3>

            {/* Guest Summary */}
            {guests.length > 0 && (
              <div className="text-sm font-semibold text-[#C6A15B]">
                Featuring {guests.map((g: any) => g.fullName).join(', ')}
                {guests[0]?.role && (
                  <span className="text-[#596579] font-normal">
                    {' '}({guests[0].role}{guests[0].company ? `, ${guests[0].company}` : ''})
                  </span>
                )}
              </div>
            )}

            <p className="text-[#596579] text-sm leading-relaxed line-clamp-3">
              {episode.shortSummary}
            </p>
          </div>

          <div className="pt-6 mt-6 border-t border-[#DFE3E8]">
            <Link
              href={`/episodes/${episode.slug}`}
              className="inline-flex items-center gap-2.5 px-6 py-3 rounded-xl neu-btn-gold text-xs font-bold uppercase tracking-wider transition-all hover:gap-3"
            >
              <Play className="w-4 h-4 fill-white" />
              Watch Episode
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl overflow-hidden flex flex-col h-full group bg-white border border-[#DFE3E8] shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
      {/* 16:9 Thumbnail with Bezel */}
      <div className="p-3 pb-0">
        <Link href={`/episodes/${episode.slug}`} className="relative aspect-video w-full rounded-xl overflow-hidden bg-[#EDE8DE] block shadow-inner">
          <Image
            src={thumbnailUrl}
            alt={episode.thumbnail?.alt || episode.title}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className="object-cover group-hover:scale-105 transition-transform duration-500"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#101C2C]/70 via-transparent to-transparent opacity-80" />
          
          {/* Center Play Icon Button */}
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="w-12 h-12 rounded-full neu-btn-gold flex items-center justify-center shadow-lg scale-95 group-hover:scale-110 transition-transform">
              <Play className="w-5 h-5 fill-white translate-x-0.5" />
            </div>
          </div>

          {episode.episodeNumber && (
            <div className="absolute top-3 left-3 px-2.5 py-0.5 rounded-lg text-[11px] font-bold text-[#172235] bg-white/95 backdrop-blur border border-[#DFE3E8]">
              EP #{episode.episodeNumber}
            </div>
          )}
        </Link>
      </div>

      {/* Details */}
      <div className="p-6 flex flex-col justify-between flex-1 space-y-4 bg-white">
        <div className="space-y-2.5">
          <div className="flex items-center gap-2 text-xs font-semibold text-[#596579]">
            <Calendar className="w-3.5 h-3.5 text-[#C6A15B]" />
            <span>{publishedDate}</span>
          </div>

          <h3 className="text-lg font-editorial font-bold text-[#172235] group-hover:text-[#C6A15B] transition-colors line-clamp-2">
            <Link href={`/episodes/${episode.slug}`}>
              {episode.title}
            </Link>
          </h3>

          {guests.length > 0 && (
            <div className="text-xs text-[#C6A15B] font-bold truncate">
              {guests.map((g: any) => g.fullName).join(', ')}
            </div>
          )}

          <p className="text-xs sm:text-sm text-[#596579] line-clamp-2 leading-relaxed">
            {episode.shortSummary}
          </p>
        </div>

        <div className="pt-4 border-t border-[#DFE3E8] flex items-center justify-between">
          <Link
            href={`/episodes/${episode.slug}`}
            className="neu-btn px-4 py-2 text-xs font-bold uppercase tracking-wider text-[#C6A15B] group-hover:text-[#B89248] inline-flex items-center gap-2 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            Watch Conversation
            <Play className="w-3 h-3 fill-[#C6A15B]" />
          </Link>
        </div>
      </div>
    </div>
  );
}
