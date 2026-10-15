import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { Compass, Filter, RefreshCw } from 'lucide-react';
import { siteConfig } from '@/config/site';
import { getPublishedEpisodes, getTopics } from '@/lib/payload';
import { EpisodeCard } from '@/components/EpisodeCard';
import { SearchBar } from '@/components/SearchBar';
import { TopicChips } from '@/components/TopicChips';

export const metadata: Metadata = {
  title: 'All Episodes',
  description: `Browse all full-length podcast conversations with visionary founders, chairpersons, and industry pioneers on ${siteConfig.brandName}.`,
};

export const revalidate = 60;

interface EpisodesPageProps {
  searchParams: Promise<{
    topic?: string;
    guest?: string;
    year?: string;
    page?: string;
  }>;
}

export default async function EpisodesPage({ searchParams }: EpisodesPageProps) {
  const params = await searchParams;
  const currentPage = Number(params.page) || 1;
  const topicSlug = params.topic;
  const guestSlug = params.guest;
  const yearFilter = params.year;

  const [episodesData, allTopics] = await Promise.all([
    getPublishedEpisodes({
      topicSlug,
      guestSlug,
      year: yearFilter,
      page: currentPage,
      limit: 9,
    }),
    getTopics(),
  ]);

  // Extract available years from published episodes for dynamic year filtering
  const availableYears = ['2026', '2025', '2024'];

  const hasActiveFilters = Boolean(topicSlug || guestSlug || yearFilter);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 space-y-12">
      {/* Header & Mission */}
      <div data-reveal className="space-y-4 max-w-3xl">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full neu-pill text-gold-600 text-xs font-bold tracking-wider uppercase shadow-sm">
          <Compass className="w-3.5 h-3.5" />
          The Archive
        </div>
        <h1 className="text-3xl sm:text-5xl font-editorial font-bold text-neu-charcoal tracking-tight">
          All Episodes
        </h1>
        <p className="text-neu-body text-base sm:text-lg leading-relaxed">
          Full-length editorial interviews with founders, CEOs, chairpersons, and executives shaping global enterprise.
        </p>
      </div>

      {/* Search & Filter Controls */}
      <div data-reveal className="space-y-6 pt-6 border-t border-neu-border">
        <div className="flex flex-col lg:flex-row gap-4 items-stretch lg:items-center justify-between">
          <div className="w-full lg:max-w-md">
            <SearchBar placeholder="Search episodes by title, guest, or tag..." />
          </div>

          {/* Secondary Select Dropdowns */}
          <div className="flex flex-wrap items-center gap-3 text-xs">
            {/* Year Filter */}
            <div className="flex items-center gap-2 neu-raised-sm rounded-xl px-3.5 py-2 text-neu-muted bg-neu-card border border-white/80">
              <span className="text-neu-muted font-medium">Year:</span>
              <div className="flex items-center gap-2.5 font-semibold">
                <Link
                  href={`/episodes?${new URLSearchParams({
                    ...(topicSlug && { topic: topicSlug }),
                    ...(guestSlug && { guest: guestSlug }),
                  }).toString()}`}
                  className={`${!yearFilter ? 'text-gold-600 font-bold neu-inset px-2 py-0.5 rounded-lg' : 'hover:text-neu-charcoal'}`}
                >
                  All
                </Link>
                {availableYears.map((yr) => (
                  <Link
                    key={yr}
                    href={`/episodes?${new URLSearchParams({
                      ...(topicSlug && { topic: topicSlug }),
                      ...(guestSlug && { guest: guestSlug }),
                      year: yr,
                    }).toString()}`}
                    className={`${yearFilter === yr ? 'text-gold-600 font-bold neu-inset px-2 py-0.5 rounded-lg' : 'hover:text-neu-charcoal'}`}
                  >
                    {yr}
                  </Link>
                ))}
              </div>
            </div>

            {/* Clear Filters Button */}
            {hasActiveFilters && (
              <Link
                href="/episodes"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl neu-btn text-gold-600 font-bold transition-all"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Clear Filters
              </Link>
            )}
          </div>
        </div>

        {/* Industry / Topic Chips */}
        {allTopics.length > 0 && (
          <div className="pt-2">
            <TopicChips topics={allTopics as any} activeTopic={topicSlug} baseUrl="/episodes" />
          </div>
        )}
      </div>

      {/* Episode Grid or Empty State */}
      {episodesData.docs.length === 0 ? (
        <div data-reveal className="neu-card rounded-3xl border border-white/80 p-12 text-center max-w-xl mx-auto space-y-4 my-12 bg-neu-card shadow-neu-raised">
          <Filter className="w-10 h-10 text-gold-600 mx-auto" />
          <h3 className="text-xl font-editorial font-bold text-neu-charcoal">No episodes found</h3>
          <p className="text-sm text-neu-muted">
            No published episodes matched your active filter selections. Try broadening your criteria or reset filters.
          </p>
          <div className="pt-2">
            <Link
              href="/episodes"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl neu-btn-gold text-xs font-bold uppercase tracking-wider text-white shadow-neu-gold"
            >
              Reset All Filters
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {episodesData.docs.map((episode: any, idx: number) => (
            <EpisodeCard key={episode.id} episode={episode} staggerIndex={(idx % 3) + 1} />
          ))}
        </div>
      )}

      {/* Pagination Controls */}
      {episodesData.totalPages > 1 && (
        <nav data-reveal aria-label="Episodes Pagination" className="pt-8 border-t border-neu-border flex items-center justify-between">
          <div>
            {episodesData.hasPrevPage ? (
              <Link
                href={`/episodes?${new URLSearchParams({
                  ...(topicSlug && { topic: topicSlug }),
                  ...(guestSlug && { guest: guestSlug }),
                  ...(yearFilter && { year: yearFilter }),
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
            Page <span className="text-gold-600 font-bold">{currentPage}</span> of {episodesData.totalPages}
          </div>

          <div>
            {episodesData.hasNextPage ? (
              <Link
                href={`/episodes?${new URLSearchParams({
                  ...(topicSlug && { topic: topicSlug }),
                  ...(guestSlug && { guest: guestSlug }),
                  ...(yearFilter && { year: yearFilter }),
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
