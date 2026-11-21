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

interface BrandLockupProps {
  /** Square size classes for the gold buildings icon, e.g. "h-10 w-10 xl:h-11 xl:w-11" */
  iconClassName?: string;
  /** Height classes for the wordmark, e.g. "h-8 lg:h-10" */
  wordmarkClassName?: string;
  /** Spacing between icon and wordmark, e.g. "gap-2 lg:gap-3" */
  gapClassName?: string;
  /** Optional wordmark override (e.g. a logo uploaded in Admin → Settings). */
  wordmarkSrc?: string | null;
  alt?: string;
  priority?: boolean;
  decorative?: boolean;
  className?: string;
  /** Optional content rendered under the wordmark (e.g. an "Editorial Portal" label). */
  wordmarkCaption?: React.ReactNode;
}

/**
 * Brand lockup: gold buildings icon on the left + gold wordmark, aligned as one unit.
 * The icon is decorative; the wordmark carries the accessible name.
 */
export function BrandLockup({
  iconClassName = 'h-10 w-10',
  wordmarkClassName = 'h-10',
  gapClassName = 'gap-3',
  wordmarkSrc,
  alt = BRAND_ALT,
  priority = false,
  decorative = false,
  className = '',
  wordmarkCaption,
}: BrandLockupProps) {
  return (
    <span className={`inline-flex items-center min-w-0 ${gapClassName} ${className}`}>
      <Image
        src={BRAND_ICON_SRC}
        alt=""
        aria-hidden
        width={512}
        height={512}
        unoptimized
        priority={priority}
        className={`shrink-0 object-contain select-none ${iconClassName}`}
      />
      {wordmarkCaption ? (
        <span className="flex flex-col items-center leading-none min-w-0">
          <BrandWordmark
            src={wordmarkSrc}
            alt={alt}
            priority={priority}
            decorative={decorative}
            className={wordmarkClassName}
          />
          {wordmarkCaption}
        </span>
      ) : (
        <BrandWordmark
          src={wordmarkSrc}
          alt={alt}
          priority={priority}
          decorative={decorative}
          className={wordmarkClassName}
        />
      )}
    </span>
  );
}

export default BrandWordmark;
