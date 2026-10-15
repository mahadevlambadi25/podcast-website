import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { Search as SearchIcon, Users, Video, Compass, ArrowRight } from 'lucide-react';
import { siteConfig } from '@/config/site';
import { executeGlobalSearch } from '@/lib/payload';
import { SearchBar } from '@/components/SearchBar';
import { GuestCard } from '@/components/GuestCard';
import { EpisodeCard } from '@/components/EpisodeCard';

export const metadata: Metadata = {
  title: 'Search Results',
  robots: {
    index: false,
    follow: false,
  },
};

interface SearchPageProps {
  searchParams: Promise<{
    q?: string;
  }>;
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const { q } = await searchParams;
  const query = q?.trim() || '';

  const results = query ? await executeGlobalSearch(query) : { query: '', guests: [], episodes: [], totalCount: 0 };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 space-y-12">
      <div data-reveal className="max-w-3xl mx-auto text-center space-y-4">
        <h1 className="text-3xl sm:text-4xl font-editorial font-bold text-neu-charcoal tracking-tight">
          Search Results
        </h1>
        <p className="text-neu-muted text-sm">
          Searching across executive profiles, full episode dialogues, and core industry themes.
        </p>

        <div className="pt-2">
          <SearchBar placeholder="Search guests, titles, roles, or topics..." />
        </div>
      </div>

      {query ? (
        <div className="space-y-12">
          <div data-reveal className="border-b border-neu-border pb-4 flex items-center justify-between text-xs text-neu-muted">
            <span>
              Found <strong className="text-gold-600 font-bold">{results.totalCount}</strong> result{results.totalCount === 1 ? '' : 's'} for &ldquo;{query}&rdquo;
            </span>
          </div>

          {results.totalCount === 0 ? (
            <div data-reveal className="neu-card rounded-3xl border border-white/80 p-12 text-center max-w-xl mx-auto space-y-4 my-8 bg-neu-card shadow-neu-raised">
              <SearchIcon className="w-10 h-10 text-gold-600 mx-auto" />
              <h3 className="text-xl font-editorial font-bold text-neu-charcoal">No exact matches found</h3>
              <p className="text-sm text-neu-muted leading-relaxed">
                We couldn&apos;t locate any guests or episodes for &ldquo;{query}&rdquo;. Check spelling, try general terms like &ldquo;Technology&rdquo; or browse the complete directories below.
              </p>
              <div className="flex items-center justify-center gap-3 pt-2">
                <Link
                  href="/episodes"
                  className="px-5 py-2.5 rounded-xl neu-btn-gold text-xs font-bold uppercase tracking-wider text-white shadow-neu-gold"
                >
                  Explore Episodes
                </Link>
                <Link
                  href="/guests"
                  className="px-5 py-2.5 rounded-xl neu-btn text-neu-charcoal text-xs font-bold uppercase tracking-wider transition-all"
                >
                  View All Guests
                </Link>
              </div>
            </div>
          ) : (
            <div className="space-y-16">
              {/* Guests Results (Ranked First) */}
              {results.guests.length > 0 && (
                <section className="space-y-6">
                  <div data-reveal className="flex items-center gap-2 text-xs uppercase tracking-wider font-bold text-gold-600">
                    <Users className="w-4 h-4" />
                    Guest Profiles ({results.guests.length})
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {results.guests.map((guest: any, idx: number) => (
                      <GuestCard key={guest.id} guest={guest} staggerIndex={(idx % 4) + 1} />
                    ))}
                  </div>
                </section>
              )}

              {/* Episodes Results */}
              {results.episodes.length > 0 && (
                <section className="space-y-6 pt-8 border-t border-neu-border">
                  <div data-reveal className="flex items-center gap-2 text-xs uppercase tracking-wider font-bold text-gold-600">
                    <Video className="w-4 h-4" />
                    Episode Dialogues ({results.episodes.length})
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
                    {results.episodes.map((ep: any, idx: number) => (
                      <EpisodeCard key={ep.id} episode={ep} staggerIndex={(idx % 3) + 1} />
                    ))}
                  </div>
                </section>
              )}
            </div>
          )}
        </div>
      ) : (
        <div data-reveal className="text-center py-12 text-neu-muted text-sm">
          Please enter a search keyword above to discover leaders and conversations.
        </div>
      )}
    </div>
  );
}
