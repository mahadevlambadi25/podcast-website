'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { Play, AlertCircle, ExternalLink } from 'lucide-react';
import { getYouTubeEmbedUrl, getYouTubeThumbnailUrl, isSampleVideoId } from '@/utils/youtube';

interface YouTubeFacadeProps {
  videoId: string | null | undefined;
  title: string;
  customThumbnailUrl?: string | null;
  fallbackWatchUrl?: string | null;
}

export function YouTubeFacade({
  videoId,
  title,
  customThumbnailUrl,
  fallbackWatchUrl,
}: YouTubeFacadeProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasError, setHasError] = useState(!videoId);
  const iframeRef = React.useRef<HTMLIFrameElement>(null);

  const isSample = isSampleVideoId(videoId);

  const initialThumb =
    customThumbnailUrl ||
    (videoId && !isSample ? getYouTubeThumbnailUrl(videoId, 'maxres') : '/placeholders/episode-placeholder.svg');

  const [currentThumb, setCurrentThumb] = useState<string>(initialThumb);
  const [isLoaded, setIsLoaded] = useState(false);

  React.useEffect(() => {
    const next =
      customThumbnailUrl ||
      (videoId && !isSample ? getYouTubeThumbnailUrl(videoId, 'maxres') : '/placeholders/episode-placeholder.svg');
    setCurrentThumb(next);
    setIsLoaded(false);
  }, [customThumbnailUrl, videoId, isSample]);

  const handleImageError = () => {
    if (videoId && !isSample) {
      const maxres = getYouTubeThumbnailUrl(videoId, 'maxres');
      const hq = getYouTubeThumbnailUrl(videoId, 'hq');

      if (currentThumb !== maxres && currentThumb !== hq) {
        setCurrentThumb(maxres);
        return;
      }
      if (currentThumb === maxres) {
        setCurrentThumb(hq);
        return;
      }
    }
    setCurrentThumb('/placeholders/episode-placeholder.svg');
  };

  const handlePlayClick = () => {
    if (!videoId || isSample) {
      return;
    }

    // Trigger analytics custom event for embed play click
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'embed_play_click', {
        video_id: videoId,
        episode_title: title,
      });
    }

    setIsPlaying(true);
    // Focus management for keyboard accessibility
    setTimeout(() => {
      iframeRef.current?.focus();
    }, 100);
  };

  // 1. Explicit Sample Placeholder State (Never loads third-party video)
  if (isSample) {
    return (
      <div className="p-3 sm:p-4 rounded-3xl shadow-xl bg-white border border-[#DFE3E8]">
        <div
          className="relative aspect-video w-full rounded-2xl overflow-hidden bg-neu-sunken border border-neu-border flex flex-col items-center justify-center p-8 text-center neu-inset shadow-inner group"
          role="region"
          aria-label={`Sample video placeholder: ${title}`}
        >
          <Image
            src={currentThumb}
            alt={`Episode cover: ${title}`}
            fill
            sizes="(max-width: 1200px) 100vw, 1200px"
            priority
            onError={handleImageError}
            className="object-cover opacity-20 filter blur-sm"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-neu-base/90 via-neu-base/60 to-neu-base/80" />

          <div className="relative z-10 flex flex-col items-center max-w-lg space-y-4">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full neu-pill-active text-white text-xs font-bold uppercase tracking-widest shadow-sm">
              Sample Preview
            </div>

            <h3 className="text-xl sm:text-2xl font-editorial font-bold text-neu-charcoal tracking-tight">
              Sample video — replace in CMS
            </h3>

            <p className="text-neu-body text-xs sm:text-sm leading-relaxed max-w-md">
              This demonstration episode is staged with placeholder metadata. To activate full-length video streaming, add an official YouTube interview URL in the Payload CMS editor.
            </p>

            <div className="pt-2">
              <span className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl neu-btn text-xs text-neu-charcoal font-semibold">
                Payload CMS &rarr; Episodes &rarr; YouTube URL
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (hasError || !videoId) {
    return (
      <div className="p-3 sm:p-4 rounded-3xl shadow-xl bg-white border border-[#DFE3E8]">
        <div className="relative aspect-video w-full rounded-2xl overflow-hidden bg-neu-sunken border border-neu-border neu-inset flex flex-col items-center justify-center p-8 text-center">
          <AlertCircle className="w-12 h-12 text-gold-600 mb-4" />
          <h3 className="text-xl font-editorial font-bold text-neu-charcoal mb-2">Video Currently Unavailable</h3>
          <p className="text-neu-muted max-w-md text-sm mb-6">
            The embedded player could not load this conversation directly. You can access the full interview via our external watch link below.
          </p>
          {fallbackWatchUrl && (
            <a
              href={fallbackWatchUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl neu-btn-gold text-xs font-bold uppercase tracking-wider transition-all"
            >
              Watch Full Interview on YouTube
              <ExternalLink className="w-4 h-4" />
            </a>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="p-3 sm:p-4 rounded-3xl shadow-xl bg-white border border-[#DFE3E8]">
      <div className="relative aspect-video w-full rounded-2xl overflow-hidden bg-black shadow-inner border border-neu-border/60 group">
        {isPlaying ? (
          <iframe
            ref={iframeRef}
            tabIndex={-1}
            src={`${getYouTubeEmbedUrl(videoId)}&autoplay=1`}
            title={`Watch ${title} on YouTube`}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            loading="lazy"
            className="absolute inset-0 w-full h-full border-0"
          />
        ) : (
          <button
            type="button"
            onClick={handlePlayClick}
            aria-label={`Play episode: ${title}`}
            className="w-full h-full relative cursor-pointer block text-left group focus:outline-none focus-visible:ring-4 focus-visible:ring-gold-500"
          >
            {/* Loading skeleton */}
            {!isLoaded && (
              <div className="absolute inset-0 bg-[#172235] animate-pulse" />
            )}

            {/* Thumbnail Image */}
            <Image
              src={currentThumb}
              alt={`Episode thumbnail: ${title}`}
              fill
              sizes="(max-width: 1200px) 100vw, 1200px"
              priority
              onError={handleImageError}
              onLoad={() => setIsLoaded(true)}
              className={`object-cover transition-all duration-700 group-hover:scale-105 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
            />

            {/* Vignette Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-neu-charcoal/80 via-black/20 to-black/30 pointer-events-none" />

            {/* Neumorphic Play Button Facade */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="relative flex items-center justify-center">
                {/* Outer pulsing ring on hover */}
                <div className="absolute w-24 h-24 rounded-full bg-gold-500/25 scale-90 group-hover:scale-125 transition-transform duration-500 ease-out" />
                
                {/* Main Play Circle */}
                <div className="w-20 h-20 rounded-full neu-btn-gold text-white flex items-center justify-center shadow-neu-gold-hover transition-all duration-300 group-hover:scale-110">
                  <Play className="w-9 h-9 fill-white translate-x-0.5" />
                </div>
              </div>
            </div>

            {/* Bottom Bar Info */}
            <div className="absolute bottom-0 inset-x-0 p-6 flex items-center justify-between pointer-events-none">
              <span className="text-xs uppercase tracking-widest font-bold text-gold-600 neu-pill bg-neu-card/95 px-3.5 py-1.5 shadow-sm">
                Click to Load Privacy-Enhanced Player
              </span>
            </div>
          </button>
        )}
      </div>
    </div>
  );
}
