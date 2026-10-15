import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { Users, Filter, RefreshCw } from 'lucide-react';
import { siteConfig } from '@/config/site';
import { getPublishedGuests, getTopics } from '@/lib/payload';
import { GuestCard } from '@/components/GuestCard';
import { SearchBar } from '@/components/SearchBar';
import { TopicChips } from '@/components/TopicChips';

export const metadata: Metadata = {
  title: 'Guest Directory',
  description: `Profiles and biographies of founders, CEOs, and industry leaders featured on ${siteConfig.brandName}.`,
};

export const revalidate = 60;

interface GuestsPageProps {
  searchParams: Promise<{
    topic?: string;
    page?: string;
  }>;
}

export default async function GuestsPage({ searchParams }: GuestsPageProps) {
  const params = await searchParams;
  const currentPage = Number(params.page) || 1;
  const industrySlug = params.topic;

  const [guestsData, topics] = await Promise.all([
    getPublishedGuests({
      industrySlug,
      page: currentPage,
      limit: 12,
    }),
    getTopics(),
  ]);

  const hasActiveFilters = Boolean(industrySlug);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 space-y-12">
      {/* Header */}
      <div data-reveal className="space-y-4 max-w-3xl">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full neu-pill text-gold-600 text-xs font-bold tracking-wider uppercase shadow-sm">
          <Users className="w-3.5 h-3.5" />
          The Leaders
        </div>
        <h1 className="text-3xl sm:text-5xl font-editorial font-bold text-neu-charcoal tracking-tight">
          Guest Directory
        </h1>
        <p className="text-neu-body text-base sm:text-lg leading-relaxed">
          Permanent biographies and exclusive conversations with executives, innovators, and chairs shaping modern enterprise.
        </p>
      </div>

      {/* Search & Filters */}
      <div data-reveal className="space-y-6 pt-6 border-t border-neu-border">
        <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center justify-between">
          <div className="w-full sm:max-w-md">
            <SearchBar placeholder="Search by guest name, company or topic..." />
          </div>

          {hasActiveFilters && (
            <Link
              href="/guests"
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl neu-btn text-gold-600 text-xs font-bold transition-all"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Clear Filters
            </Link>
          )}
        </div>

        {topics.length > 0 && (
          <div className="pt-2">
            <TopicChips topics={topics as any} activeTopic={industrySlug} baseUrl="/guests" />
          </div>
        )}
      </div>

      {/* Guest Cards Grid or Empty State */}
      {guestsData.docs.length === 0 ? (
        <div data-reveal className="neu-card rounded-3xl border border-white/80 p-12 text-center max-w-xl mx-auto space-y-4 my-12 bg-neu-card shadow-neu-raised">
          <Filter className="w-10 h-10 text-gold-600 mx-auto" />
          <h3 className="text-xl font-editorial font-bold text-neu-charcoal">No leaders found</h3>
          <p className="text-sm text-neu-muted">
            No published guest profiles matched your selected filter.
          </p>
          <div className="pt-2">
            <Link
              href="/guests"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl neu-btn-gold text-xs font-bold uppercase tracking-wider text-white shadow-neu-gold"
            >
              Reset Filters
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {guestsData.docs.map((guest: any, idx: number) => (
            <GuestCard key={guest.id} guest={guest} staggerIndex={(idx % 4) + 1} />
          ))}
        </div>
      )}

      {/* Pagination */}
      {guestsData.totalPages > 1 && (
        <nav data-reveal aria-label="Guests Pagination" className="pt-8 border-t border-neu-border flex items-center justify-between">
          <div>
            {guestsData.hasPrevPage ? (
              <Link
                href={`/guests?${new URLSearchParams({
                  ...(industrySlug && { topic: industrySlug }),
                  page: String(currentPage - 1),
                }).toString()}`}
                className="px-5 py-2.5 rounded-xl neu-btn text-neu-charcoal text-xs font-bold uppercase tracking-wider transition-all"
              >
                Previous Page
              </Link>
            ) : (
              <span className="px-5 py-2.5 rounded-xl neu-inset text-neu-muted/50 text-xs font-bold uppercase tracking-wider cursor-not-allowed">
                Previous Page
              </span>
            )}
          </div>

          <div className="text-xs text-neu-muted font-medium">
            Page <span className="text-gold-600 font-bold">{currentPage}</span> of {guestsData.totalPages}
          </div>

          <div>
            {guestsData.hasNextPage ? (
              <Link
                href={`/guests?${new URLSearchParams({
                  ...(industrySlug && { topic: industrySlug }),
                  page: String(currentPage + 1),
                }).toString()}`}
                className="px-5 py-2.5 rounded-xl neu-btn text-neu-charcoal text-xs font-bold uppercase tracking-wider transition-all"
              >
                Next Page
              </Link>
            ) : (
              <span className="px-5 py-2.5 rounded-xl neu-inset text-neu-muted/50 text-xs font-bold uppercase tracking-wider cursor-not-allowed">
                Next Page
              </span>
            )}
          </div>
        </nav>
      )}
    </div>
  );
}
