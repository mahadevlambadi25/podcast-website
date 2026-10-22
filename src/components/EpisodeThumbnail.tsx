'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';

interface EpisodeThumbnailProps {
  thumbnailUrl?: string | null;
  youtubeVideoId?: string | null;
  alt: string;
  fill?: boolean;
  priority?: boolean;
  sizes?: string;
  className?: string;
}

export function EpisodeThumbnail({
  thumbnailUrl,
  youtubeVideoId,
  alt,
  fill = true,
  priority = false,
  sizes,
  className = 'object-cover',
}: EpisodeThumbnailProps) {
  const initialSrc =
    thumbnailUrl ||
    (youtubeVideoId
      ? `https://i.ytimg.com/vi/${youtubeVideoId}/maxresdefault.jpg`
      : '/placeholders/episode-placeholder.svg');

  const [currentSrc, setCurrentSrc] = useState<string>(initialSrc);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const nextSrc =
      thumbnailUrl ||
      (youtubeVideoId
        ? `https://i.ytimg.com/vi/${youtubeVideoId}/maxresdefault.jpg`
        : '/placeholders/episode-placeholder.svg');
    setCurrentSrc(nextSrc);
    setIsLoaded(false);
  }, [thumbnailUrl, youtubeVideoId]);

  const handleError = () => {
    // If custom uploaded thumbnail failed, fall back to YouTube maxres
    if (youtubeVideoId && currentSrc === thumbnailUrl) {
      setCurrentSrc(`https://i.ytimg.com/vi/${youtubeVideoId}/maxresdefault.jpg`);
      return;
    }
    // If YouTube maxres failed, fall back to YouTube hq
    if (
      youtubeVideoId &&
      currentSrc === `https://i.ytimg.com/vi/${youtubeVideoId}/maxresdefault.jpg`
    ) {
      setCurrentSrc(`https://i.ytimg.com/vi/${youtubeVideoId}/hqdefault.jpg`);
      return;
    }
    // Final fallback: SVG placeholder
    if (currentSrc !== '/placeholders/episode-placeholder.svg') {
      setCurrentSrc('/placeholders/episode-placeholder.svg');
    }
  };

  return (
    <div className="relative w-full h-full overflow-hidden bg-[#1B2943]">
      {/* Loading Skeleton */}
      {!isLoaded && (
        <div className="absolute inset-0 bg-[#142033] animate-pulse" />
      )}

      <Image
        src={currentSrc}
        alt={alt}
        fill={fill}
        sizes={sizes}
        priority={priority}
        onError={handleError}
        onLoad={() => setIsLoaded(true)}
        className={`${className} transition-opacity duration-500 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
      />
    </div>
  );
}
