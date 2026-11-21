import React from 'react';
import Image from 'next/image';
import { BrandWordmark, BRAND_ICON_SRC } from '@/components/brand/BrandWordmark';

interface BrandLogoProps {
  collapsed?: boolean;
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

// Wordmark heights; width follows the 6.25:1 aspect ratio
const WORDMARK_HEIGHT_CLASS = {
  sm: 'h-[22px]', // ~138px wide
  md: 'h-[26px]', // ~163px wide — admin sidebar
  lg: 'h-11', //     ~275px wide — admin login
  xl: 'h-14', //     ~350px wide
} as const;
const ICON_SIZE = { sm: 24, md: 36, lg: 44, xl: 56 } as const;

export const BrandLogo: React.FC<BrandLogoProps> = ({
  collapsed = false,
  className = '',
  size = 'md',
}) => {
  if (collapsed) {
    // The full wordmark doesn't fit the collapsed sidebar, so show the gold buildings icon
    const iconSize = ICON_SIZE[size];
    return (
      <div className={`flex items-center select-none ${className}`}>
        <Image
          key="brand-icon"
          src={BRAND_ICON_SRC}
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

  return (
    <div className={`flex flex-col items-center leading-none select-none ${className}`}>
      <BrandWordmark key="brand-wordmark" priority className={WORDMARK_HEIGHT_CLASS[size]} />
      <span className="text-[9px] font-semibold uppercase tracking-[0.22em] text-[#C9A24B] mt-[5px]">
        Editorial Portal
      </span>
    </div>
  );
};

export default BrandLogo;
