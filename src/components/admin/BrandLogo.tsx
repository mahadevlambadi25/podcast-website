import React from 'react';

interface BrandLogoProps {
  collapsed?: boolean;
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'dark' | 'light' | 'auto';
}

export const BrandLogo: React.FC<BrandLogoProps> = ({
  collapsed = false,
  className = '',
  size = 'md',
  variant = 'auto',
}) => {
  const markSize =
    size === 'sm' ? 28 : size === 'lg' ? 44 : size === 'xl' ? 56 : 36;

  // Variant classes: 'light' means light background (so dark text), 'dark' means dark background (white text)
  const textColorClass =
    variant === 'light'
      ? 'text-[#0F1B2D]'
      : variant === 'dark'
      ? 'text-[#FFFFFF]'
      : 'text-[#0F1B2D] dark:text-[#FFFFFF] group-data-[theme=dark]:text-white in-[.nav]:text-white in-[.app-header]:text-white';

  return (
    <div className={`flex items-center gap-3 select-none ${className}`}>
      {/* Monogram Mark SVG */}
      <div
        className="relative flex items-center justify-center rounded-xl bg-gradient-to-br from-[#E5C678] via-[#C9A24B] to-[#9E7E38] p-[1.5px] shadow-[0_4px_12px_rgba(201,162,75,0.25)] flex-shrink-0"
        style={{ width: markSize, height: markSize }}
      >
        <div className="w-full h-full rounded-[10px] bg-[#0F1B2D] flex items-center justify-center overflow-hidden">
          <svg
            viewBox="0 0 36 36"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="w-4/5 h-4/5"
            aria-hidden="true"
          >
            {/* Geometric compass diamond background */}
            <path
              d="M18 4L22 18L18 32L14 18Z"
              fill="#C9A24B"
              fillOpacity="0.18"
            />
            <path
              d="M4 18L18 22L32 18L18 14Z"
              fill="#C9A24B"
              fillOpacity="0.18"
            />
            {/* Serif 'U' Monogram */}
            <path
              d="M11 10.5V19.5C11 23.4 14.1 26.5 18 26.5C21.9 26.5 25 23.4 25 19.5V10.5M8.5 10.5H13.5M22.5 10.5H27.5"
              stroke="url(#goldGradient)"
              strokeWidth="2.75"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {/* Center expedition starlet */}
            <circle cx="18" cy="18" r="1.5" fill="#E5C678" />
            <defs>
              <linearGradient id="goldGradient" x1="11" y1="10.5" x2="25" y2="26.5" gradientUnits="userSpaceOnUse">
                <stop stopColor="#F7E7B4" />
                <stop offset="0.5" stopColor="#C9A24B" />
                <stop offset="1" stopColor="#A88132" />
              </linearGradient>
            </defs>
          </svg>
        </div>
      </div>

      {/* Wordmark + Subtitle (hidden when collapsed) */}
      {!collapsed && (
        <div className="flex flex-col leading-none">
          <span
            className={`font-serif text-[17px] font-bold tracking-tight ${textColorClass} drop-shadow-2xs`}
            style={{ color: variant === 'light' ? '#0F1B2D' : undefined }}
          >
            Unchartered
          </span>
          <span className="text-[9px] font-semibold uppercase tracking-[0.22em] text-[#C9A24B] mt-[3px]">
            Editorial Portal
          </span>
        </div>
      )}
    </div>
  );
};

export default BrandLogo;
