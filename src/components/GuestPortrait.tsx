'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { isExternalUrl } from '@/utils/url';

interface GuestPortraitProps {
  src?: string | null;
  alt: string;
  fill?: boolean;
  priority?: boolean;
  sizes?: string;
  className?: string;
  fallbackSrc?: string;
}

export function GuestPortrait({
  src,
  alt,
  fill = true,
  priority = false,
  sizes,
  className = 'object-cover',
  fallbackSrc = '/placeholders/portrait-placeholder.svg',
}: GuestPortraitProps) {
  const initialSrc = src && src.trim() ? src.trim() : fallbackSrc;
  const [currentSrc, setCurrentSrc] = useState<string>(initialSrc);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const nextSrc = src && src.trim() ? src.trim() : fallbackSrc;
    setCurrentSrc(nextSrc);
    setIsLoaded(false);
  }, [src, fallbackSrc]);

  const handleError = () => {
    if (currentSrc !== fallbackSrc) {
      setCurrentSrc(fallbackSrc);
      setIsLoaded(true);
    }
  };

  const isExternal = isExternalUrl(currentSrc);

  return (
    <div className="relative w-full h-full overflow-hidden bg-[#EDE8DE]">
      {/* Subtle skeleton shimmer until image is loaded */}
      {!isLoaded && (
        <div className="absolute inset-0 bg-[#E2DBD0] animate-pulse" />
      )}

      <Image
        src={currentSrc}
        alt={alt}
        fill={fill}
        sizes={sizes}
        priority={priority}
        unoptimized={isExternal}
        onError={handleError}
        onLoad={() => setIsLoaded(true)}
        className={`${className} transition-opacity duration-300 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
      />
    </div>
  );
}
