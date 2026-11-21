import React from 'react';
import Image from 'next/image';
import { BrandLockup, BRAND_ICON_SRC } from '@/components/brand/BrandWordmark';

interface BrandLogoProps {
  collapsed?: boolean;
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

// Icon + wordmark sizes; wordmark width follows its 6.25:1 aspect ratio
const LOCKUP_SIZES = {
  // ~24 + 8 + 138px
  sm: { icon: 'h-6 w-6', wordmark: 'h-[22px]', gap: 'gap-2' },
  // ~30 + 8 + 138px — admin sidebar (264px wide, next to the collapse button)
  md: { icon: 'h-[30px] w-[30px]', wordmark: 'h-[22px]', gap: 'gap-2' },
  // ~28 + 10 + 175px on phones, ~34 + 12 + 200px from 640px — admin login
  lg: { icon: 'h-7 w-7 sm:h-[34px] sm:w-[34px]', wordmark: 'h-7 sm:h-8', gap: 'gap-2.5 sm:gap-3' },
  xl: { icon: 'h-14 w-14', wordmark: 'h-14', gap: 'gap-3' },
} as const;
const ICON_SIZE = { sm: 24, md: 36, lg: 44, xl: 56 } as const;

export const BrandLogo: React.FC<BrandLogoProps> = ({
  collapsed = false,
  className = '',
  size = 'md',
}) => {
  if (collapsed) {
    // The full lockup doesn't fit the collapsed sidebar, so show the gold buildings icon only
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

  const s = LOCKUP_SIZES[size];
  return (
    <BrandLockup
      key="brand-lockup"
      priority
      className={`select-none ${className}`}
      gapClassName={s.gap}
      iconClassName={s.icon}
      wordmarkClassName={s.wordmark}
      wordmarkCaption={
        <span className="text-[9px] font-semibold uppercase tracking-[0.22em] text-[#C9A24B] mt-[5px]">
          Editorial Portal
        </span>
      }
    />
  );
};

export default BrandLogo;
