import React from 'react';
import Link from 'next/link';
import { Compass, Users, Video, Home } from 'lucide-react';
import { siteConfig } from '@/config/site';
import { SearchBar } from '@/components/SearchBar';

export default function NotFound() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center space-y-8">
      <div className="inline-flex items-center justify-center w-24 h-24 rounded-3xl neu-raised text-neu-gold font-editorial text-4xl font-bold mx-auto border border-neu-border/60">
        404
      </div>

      <div className="space-y-3">
        <h1 className="text-3xl sm:text-5xl font-editorial font-bold text-neu-charcoal tracking-tight">
          Page Not Found
        </h1>
        <p className="text-neu-body text-base max-w-md mx-auto leading-relaxed">
          The requested page or interview recording could not be found. It may have been moved or archived.
        </p>
      </div>

      <div className="max-w-md mx-auto pt-2">
        <SearchBar placeholder="Search episodes, guests, or themes..." />
      </div>

      <div className="flex flex-wrap items-center justify-center gap-3 pt-4">
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl neu-btn-gold text-xs font-semibold uppercase tracking-wider"
        >
          <Home className="w-3.5 h-3.5" />
          Home
        </Link>
        <Link
          href="/episodes"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl neu-btn text-neu-charcoal text-xs font-semibold uppercase tracking-wider"
        >
          <Video className="w-3.5 h-3.5 text-neu-gold" />
          All Episodes
        </Link>
        <Link
          href="/guests"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl neu-btn text-neu-charcoal text-xs font-semibold uppercase tracking-wider"
        >
          <Users className="w-3.5 h-3.5 text-neu-gold" />
          Guest Directory
        </Link>
      </div>
    </div>
  );
}
