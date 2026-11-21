import React from 'react';
import Image from 'next/image';

/**
 * Single source of truth for the Unchartered brand assets.
 *
 * - Wordmark: public/brand/unchartered-wordmark.png — gold "UNCHARTERED — LEGENDS & LEGACIES",
 *   transparent background, 1000x160 (aspect ratio 6.25:1).
 * - Icon mark: src/app/icon.png, served by Next.js at /icon.png — gold buildings, transparent, 512x512.
 *   Also used as the favicon; src/app/apple-icon.png is the Apple touch icon.
 */
export const BRAND_WORDMARK_SRC = '/brand/unchartered-wordmark.png';
export const BRAND_WORDMARK_WIDTH = 1000;
export const BRAND_WORDMARK_HEIGHT = 160;
export const BRAND_ICON_SRC = '/icon.png';
export const BRAND_ALT = 'Unchartered: Legends & Legacies';

interface BrandWordmarkProps {
  /**
   * Height classes control the size; width follows the aspect ratio (w-auto).
   * e.g. "h-8 sm:h-9 lg:h-10"
   */
  className?: string;
  /** Optional override (e.g. a logo uploaded in Admin → Settings). */
  src?: string | null;
  alt?: string;
  priority?: boolean;
  /** Set when a visible/accessible text label is rendered next to the image. */
  decorative?: boolean;
}

export function BrandWordmark({
  className = 'h-9',
  src,
  alt = BRAND_ALT,
  priority = false,
  decorative = false,
}: BrandWordmarkProps) {
  return (
    <Image
      src={src || BRAND_WORDMARK_SRC}
      alt={decorative ? '' : alt}
      aria-hidden={decorative || undefined}
      width={BRAND_WORDMARK_WIDTH}
      height={BRAND_WORDMARK_HEIGHT}
      unoptimized
      priority={priority}
      className={`w-auto max-w-full object-contain select-none ${className}`}
    />
  );
}

export default BrandWordmark;
