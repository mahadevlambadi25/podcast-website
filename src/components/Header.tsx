'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X, ArrowUpRight, Search } from 'lucide-react';
import { siteConfig } from '@/config/site';
import { SearchBar } from './SearchBar';
import { BrandLockup } from './brand/BrandWordmark';

interface HeaderProps {
  customLogoUrl?: string | null;
  brandNameOverride?: string | null;
}

export function Header({ customLogoUrl, brandNameOverride }: HeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const pathname = usePathname();

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setMobileMenuOpen(false);
        setMobileSearchOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Accessible name for the logo image (brand name from Settings when available)
  const brandAlt = brandNameOverride || siteConfig.brandName;

  return (
    <header className="sticky top-0 z-50 w-full bg-[#101C2C]/95 backdrop-blur-md border-b border-white/10 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-18 gap-4 lg:gap-6">
          {/* Logo / Brand Editorial Wordmark */}
          <div className="flex items-center gap-3 shrink-0">
            <Link
              href="/"
              prefetch={true}
              className="flex items-center gap-3 group focus:outline-none"
              aria-label={`${siteConfig.brandName} - Home`}
            >
              {/* Gold buildings icon + wordmark (uploaded Settings logo replaces the wordmark).
                  Phones 22→26→28px icon / 138→163→175px wordmark; 640px 32/200;
                  tablet 24/150; 1024px 40/250; 1280px+ 44/263 */}
              <BrandLockup
                wordmarkSrc={customLogoUrl}
                alt={brandAlt}
                priority
                gapClassName="gap-1.5 min-[360px]:gap-2 sm:gap-2.5 md:gap-2 lg:gap-3"
                iconClassName="h-[22px] w-[22px] min-[360px]:h-[26px] min-[360px]:w-[26px] min-[400px]:h-7 min-[400px]:w-7 sm:h-8 sm:w-8 md:h-6 md:w-6 lg:h-10 lg:w-10 xl:h-11 xl:w-11"
                wordmarkClassName="h-[22px] min-[360px]:h-[26px] min-[400px]:h-7 sm:h-8 md:h-6 lg:h-10 xl:h-[42px]"
              />
            </Link>

            {/* Publisher Attribution Badge */}
            <div className="hidden xl:flex items-center gap-1.5 pl-3 border-l border-white/15 text-xs text-[#8E9CAE]">
              <span>by</span>
              <a
                href={siteConfig.publisher.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#DFE3E8] hover:text-[#C6A15B] transition-colors font-medium inline-flex items-center gap-0.5"
              >
                {siteConfig.publisher.name}
                <ArrowUpRight className="w-3 h-3 text-[#8E9CAE]" />
              </a>
            </div>
          </div>

          {/* Desktop Search Bar */}
          <div className="hidden md:flex flex-1 min-w-[88px] max-w-sm lg:max-w-md ml-1 mr-3 lg:mx-4">
            <SearchBar isHeader placeholder="Search guests, episodes, topics..." />
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center shrink-0 gap-1 lg:gap-2">
            {siteConfig.nav.map((item) => {
              const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
              const isNominate = item.href === '/nominate-a-leader';

              if (isNominate) {
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    prefetch={true}
                    className="ml-1 lg:ml-2 px-3 lg:px-4 py-2 rounded-xl neu-btn-gold whitespace-nowrap text-xs tracking-wider uppercase transition-all hover:scale-[1.02] active:scale-[0.98]"
                  >
                    {item.label}
                  </Link>
                );
              }

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  prefetch={true}
                  className={`px-2 lg:px-3.5 py-2 rounded-xl whitespace-nowrap text-xs uppercase tracking-wider font-semibold transition-all ${
                    isActive
                      ? 'bg-white/10 text-[#C6A15B] font-bold border border-[#C6A15B]/30'
                      : 'text-[#DFE3E8] hover:text-white hover:bg-white/5'
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* Mobile Search Toggle & Hamburger */}
          <div className="flex md:hidden items-center gap-2">
            <button
              type="button"
              onClick={() => setMobileSearchOpen(!mobileSearchOpen)}
              className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-[#DFE3E8] hover:text-white"
              aria-label="Toggle search input"
            >
              <Search className="w-5 h-5" />
            </button>

            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2.5 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl bg-white/5 border border-white/10 text-[#DFE3E8] hover:text-white focus-visible:outline-[#C6A15B]"
              aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={mobileMenuOpen}
              aria-controls="mobile-navigation-drawer"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Search Input Drawer */}
        {mobileSearchOpen && (
          <div className="md:hidden pb-4 pt-1 animate-in slide-in-from-top-2 duration-150">
            <SearchBar isHeader placeholder="Search guests, episodes..." />
          </div>
        )}
      </div>

      {/* Mobile Menu Drawer */}
      {mobileMenuOpen && (
        <div
          id="mobile-navigation-drawer"
          role="region"
          aria-label="Mobile Navigation"
          className="md:hidden bg-[#101C2C] border-b border-white/15 px-4 pt-3 pb-6 space-y-3 shadow-2xl animate-in slide-in-from-top duration-200 max-h-[calc(100vh-4.5rem)] overflow-y-auto"
        >
          <nav className="flex flex-col space-y-2">
            {siteConfig.nav.map((item) => {
              const isActive = pathname === item.href;
              const isNominate = item.href === '/nominate-a-leader';

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  prefetch={true}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                    isNominate
                      ? 'neu-btn-gold text-center mt-2'
                      : isActive
                      ? 'bg-white/10 text-[#C6A15B] font-bold border border-[#C6A15B]/30'
                      : 'bg-white/5 text-[#DFE3E8] hover:text-white border border-white/10'
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="pt-4 border-t border-white/10 text-xs text-[#8E9CAE] flex items-center justify-between px-2">
            <span>{siteConfig.publisher.attribution}</span>
            <a
              href={siteConfig.publisher.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#C6A15B] hover:underline flex items-center gap-0.5 font-medium"
            >
              Visit Publisher
              <ArrowUpRight className="w-3 h-3" />
            </a>
          </div>
        </div>
      )}
    </header>
  );
}
