import React from 'react';
import Link from 'next/link';
import { ArrowRight, Play, Sparkles, Compass } from 'lucide-react';
import { siteConfig } from '@/config/site';
import {
  getSiteSettings,
  getLatestEpisode,
  getPublishedEpisodes,
  getPublishedGuests,
  getTopics,
} from '@/lib/payload';
import { EpisodeCard } from '@/components/EpisodeCard';
import { GuestCard } from '@/components/GuestCard';
import { TopicChips } from '@/components/TopicChips';
import { NominationCTA } from '@/components/NominationCTA';

export const revalidate = 60; // ISR cache revalidation

export default async function HomePage() {
  const [settings, latestEpisode, episodesRes, guestsRes, topics] = await Promise.all([
    getSiteSettings(),
    getLatestEpisode(),
    getPublishedEpisodes({ limit: 6 }),
    getPublishedGuests({ limit: 4, featuredOnly: true }),
    getTopics(),
  ]);

  // Fallback if no guests are flagged featuredOnly, load any published guests
  const featuredGuests =
    guestsRes.docs.length > 0
      ? guestsRes.docs
      : (await getPublishedGuests({ limit: 4 })).docs;

  // Filter out latest episode from the general grid so it doesn't duplicate
  const recentEpisodes = episodesRes.docs.filter((ep: any) => ep.id !== latestEpisode?.id);

  const heroHeadline =
    (settings as any)?.heroHeadline ||
    'Where Industry Titans Share the Architecture of Legacy';
  const heroMission =
    (settings as any)?.heroMission ||
    siteConfig.tagline;

  const websiteJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: siteConfig.brandName,
    url: siteConfig.siteUrl,
    description: siteConfig.description,
    potentialAction: {
      '@type': 'SearchAction',
      target: `${siteConfig.siteUrl}/search?q={search_term_string}`,
      'query-input': 'required name=search_term_string',
    },
    publisher: {
      '@type': 'Organization',
      name: siteConfig.publisher.name,
      url: siteConfig.publisher.url,
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
      />

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-16 pb-24 sm:pt-24 sm:pb-32 bg-[#101C2C] text-white border-b border-white/10">
        {/* Subtle Ambient Radial Lighting */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[400px] bg-[#C6A15B]/15 blur-[140px] rounded-full pointer-events-none" />
        <div className="absolute top-10 right-10 w-[450px] h-[350px] bg-[#19283B]/60 blur-[110px] rounded-full pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="max-w-3xl mx-auto text-center space-y-6">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#C6A15B]/15 border border-[#C6A15B]/30 text-[#C6A15B] text-xs font-bold tracking-widest uppercase shadow-sm">
              <Sparkles className="w-3.5 h-3.5" />
              Long-Form Leadership Dialogues
            </div>

            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-editorial font-extrabold text-white tracking-tight leading-[1.1]">
              {heroHeadline}
            </h1>

            <p className="text-lg sm:text-xl text-[#DFE3E8] leading-relaxed font-normal max-w-2xl mx-auto">
              {heroMission}
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
              {latestEpisode ? (
                <Link
                  href={`/episodes/${latestEpisode.slug}`}
                  className="w-full sm:w-auto px-8 py-4 rounded-xl neu-btn-gold text-xs font-bold uppercase tracking-wider text-white shadow-neu-gold flex items-center justify-center gap-2.5 hover:scale-105 active:scale-95 transition-all"
                >
                  <Play className="w-4 h-4 fill-white" />
                  Watch the Latest Episode
                </Link>
              ) : null}

              <Link
                href="/episodes"
                className="w-full sm:w-auto px-8 py-4 rounded-xl bg-white/10 hover:bg-white/15 text-white border border-white/20 backdrop-blur-sm text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 hover:border-[#C6A15B]/50"
              >
                <Compass className="w-4 h-4 text-[#C6A15B]" />
                Explore All Episodes
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Latest Featured Episode Showcase */}
      {latestEpisode && (
        <section className="py-16 sm:py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <div className="text-xs uppercase tracking-widest font-bold text-gold-600 mb-1">
                Headline Interview
              </div>
              <h2 className="text-2xl sm:text-3xl font-editorial font-bold text-neu-charcoal">
                Latest Conversation
              </h2>
            </div>
            <Link
              href="/episodes"
              className="neu-btn px-4 py-2 text-xs font-bold uppercase tracking-wider text-neu-muted hover:text-gold-600 inline-flex items-center gap-1.5 transition-all"
            >
              All Episodes <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <EpisodeCard episode={latestEpisode as any} featuredLarge />
        </section>
      )}

      {/* Explore by Industry/Topic Chips */}
      {topics.length > 0 && (
        <section className="py-8 bg-neu-surface/70 border-y border-neu-border">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase tracking-wider font-bold text-neu-charcoal">
                Explore by Industry &amp; Theme:
              </span>
            </div>
            <TopicChips topics={topics as any} />
          </div>
        </section>
      )}

      {/* Featured Guests Section */}
      {featuredGuests.length > 0 && (
        <section className="py-16 sm:py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between mb-10">
            <div>
              <div className="text-xs uppercase tracking-widest font-bold text-gold-600 mb-1">
                The Architects of Industry
              </div>
              <h2 className="text-2xl sm:text-4xl font-editorial font-bold text-neu-charcoal">
                Featured Leaders
              </h2>
            </div>
            <Link
              href="/guests"
              className="neu-btn px-4 py-2 text-xs font-bold uppercase tracking-wider text-neu-muted hover:text-gold-600 inline-flex items-center gap-1.5 transition-all"
            >
              View Directory <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {featuredGuests.map((guest: any) => (
              <GuestCard key={guest.id} guest={guest} />
            ))}
          </div>
        </section>
      )}

      {/* Recent Episodes Grid */}
      {recentEpisodes.length > 0 && (
        <section className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 border-t border-neu-border">
          <div className="flex items-end justify-between mb-10">
            <div>
              <div className="text-xs uppercase tracking-widest font-bold text-gold-600 mb-1">
                Recent Broadcasts
              </div>
              <h2 className="text-2xl sm:text-4xl font-editorial font-bold text-neu-charcoal">
                More Conversations
              </h2>
            </div>
            <Link
              href="/episodes"
              className="neu-btn px-4 py-2 text-xs font-bold uppercase tracking-wider text-neu-muted hover:text-gold-600 inline-flex items-center gap-1.5 transition-all"
            >
              Browse All <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {recentEpisodes.map((ep: any) => (
              <EpisodeCard key={ep.id} episode={ep} />
            ))}
          </div>
        </section>
      )}

      {/* About The Show Snippet */}
      <section className="py-20 bg-[#EDE8DE]/40 border-t border-[#DFE3E8]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="rounded-3xl p-10 sm:p-14 border border-[#DFE3E8] shadow-lg text-center space-y-6 bg-white">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#D4AF67] to-[#B89248] text-white flex items-center justify-center mx-auto font-serif text-3xl font-bold shadow-md border border-white/20">
              U
            </div>

            <h2 className="text-3xl sm:text-4xl font-editorial font-bold text-[#172235]">
              Editorial Integrity &amp; Depth
            </h2>

            <p className="text-[#172235] text-base sm:text-lg leading-relaxed max-w-2xl mx-auto">
              {siteConfig.description} Every dialogue unpacks the critical moments, leadership philosophies, and long-term bets that built iconic companies across global industries.
            </p>

            <div className="pt-2">
              <Link
                href="/about"
                className="neu-btn px-6 py-3 text-xs font-bold uppercase tracking-widest text-[#C6A15B] hover:text-[#B89248] inline-flex items-center gap-2 transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                Read About Our Editorial Mission
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Nomination Callout Banner */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <NominationCTA />
      </div>
    </>
  );
}
