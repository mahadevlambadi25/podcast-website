import React from 'react';
import Image from 'next/image';

interface BrandLogoProps {
  collapsed?: boolean;
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

// Brand assets (shared with the public site):
// - Wordmark: public/brand/unchartered-wordmark.png (1000x160, transparent)
// - Icon mark: src/app/icon.png, served by Next.js at /icon.png (512x512, transparent)
const WORDMARK_SRC = '/brand/unchartered-wordmark.png';
const WORDMARK_RATIO = 1000 / 160;
const ICON_SRC = '/icon.png';

const WORDMARK_HEIGHT = { sm: 22, md: 26, lg: 44, xl: 56 } as const;
const ICON_SIZE = { sm: 24, md: 36, lg: 44, xl: 56 } as const;

export const BrandLogo: React.FC<BrandLogoProps> = ({
  collapsed = false,
  className = '',
  size = 'md',
}) => {
  if (collapsed) {
    const iconSize = ICON_SIZE[size];
    return (
      <div className={`flex items-center select-none ${className}`}>
        <Image
          key="brand-icon"
          src={ICON_SRC}
          alt="Unchartered"
          width={iconSize}
          height={iconSize}
          unoptimized
          priority
          className="object-contain flex-shrink-0"
          style={{ width: iconSize, height: iconSize }}
        />
      </div>
    );
  }

  const height = WORDMARK_HEIGHT[size];
  const width = Math.round(height * WORDMARK_RATIO);

  return (
    <div className={`flex flex-col items-start leading-none select-none ${className}`}>
      <Image
        key="brand-wordmark"
        src={WORDMARK_SRC}
        alt="Unchartered: Legends & Legacies"
        width={width}
        height={height}
        unoptimized
        priority
        className="object-contain max-w-full h-auto"
        style={{ width, maxWidth: '100%' }}
      />
      <span className="text-[9px] font-semibold uppercase tracking-[0.22em] text-[#C9A24B] mt-[5px] self-center">
        Editorial Portal
      </span>
    </div>
  );
};

export default BrandLogo;
