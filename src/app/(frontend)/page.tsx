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
import { HeroMicrophoneVisual } from '@/components/HeroMicrophoneVisual';

export const revalidate = 60; // ISR cache revalidation

export default async function HomePage() {
  const [settings, latestEpisode, episodesRes, guestsRes, topics] = await Promise.all([
    getSiteSettings(),
    getLatestEpisode(),
    getPublishedEpisodes({ limit: 7 }),
    getPublishedGuests({ limit: 4 }),
    getTopics(),
  ]);

  const featuredGuests = guestsRes.docs.slice(0, 4);

  // Filter out latest episode from the general grid so it doesn't duplicate, limit to 6
  const recentEpisodes = episodesRes.docs
    .filter((ep: any) => ep.id !== latestEpisode?.id)
    .slice(0, 6);

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

      {/* B. Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-16 sm:pt-18 sm:pb-22 lg:pt-20 lg:pb-24 bg-[#101C2C] text-white border-b border-white/10">
        {/* Subtle Ambient Radial Lighting */}
        <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-[#C6A15B]/12 blur-[140px] rounded-full pointer-events-none" />
        <div className="absolute top-10 right-10 w-[550px] h-[450px] bg-[#19283B]/70 blur-[130px] rounded-full pointer-events-none" />
        <div className="absolute bottom-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-[#C6A15B]/30 to-transparent" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
            {/* Left Column: Eyebrow, Main Headline, Description, CTAs */}
            <div data-reveal className="lg:col-span-7 space-y-6 text-left">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#C6A15B]/15 border border-[#C6A15B]/30 text-[#C6A15B] text-xs font-bold tracking-widest uppercase shadow-sm">
                <Sparkles className="w-3.5 h-3.5" />
                Long-Form Leadership Dialogues
              </div>

              <h1 className="text-3xl sm:text-5xl lg:text-6xl font-editorial font-extrabold text-white tracking-tight leading-[1.15]">
                {heroHeadline}
              </h1>

              <p className="text-base sm:text-lg lg:text-xl text-[#DFE3E8] leading-relaxed font-normal max-w-2xl">
                {heroMission}
              </p>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 pt-3">
                {latestEpisode ? (
                  <Link
                    href={`/episodes/${latestEpisode.slug}`}
                    className="px-7 py-3.5 rounded-xl neu-btn-gold text-xs font-bold uppercase tracking-wider text-white shadow-neu-gold flex items-center justify-center gap-2.5 hover:scale-[1.02] active:scale-[0.98] transition-all"
                  >
                    <Play className="w-4 h-4 fill-white" />
                    Watch the Latest Episode
                  </Link>
                ) : null}

                <Link
                  href="/episodes"
                  className="px-7 py-3.5 rounded-xl bg-white/10 hover:bg-white/15 text-white border border-white/20 backdrop-blur-sm text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 hover:border-[#C6A15B]/50 hover:scale-[1.02] active:scale-[0.98]"
                >
                  <Compass className="w-4 h-4 text-[#C6A15B]" />
                  Explore All Episodes
                </Link>
              </div>
            </div>

            {/* Right Column: Premium Studio Microphone Visual */}
            <div data-reveal data-reveal-delay="2" className="lg:col-span-5 flex justify-center lg:justify-end">
              <HeroMicrophoneVisual />
            </div>
          </div>
        </div>
      </section>

      {/* C. Latest Conversation */}
      {latestEpisode && (
        <section className="py-14 sm:py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div data-reveal className="flex items-end justify-between mb-8 sm:mb-10">
            <div>
              <div className="text-xs uppercase tracking-widest font-bold text-[#C6A15B] mb-1">
                Headline Interview
              </div>
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-editorial font-bold text-[#172235]">
                Latest Conversation
              </h2>
            </div>
            <Link
              href="/episodes"
              className="neu-btn px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-[#596579] hover:text-[#C6A15B] inline-flex items-center gap-1.5 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              All Episodes <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <EpisodeCard episode={latestEpisode as any} featuredLarge />
        </section>
      )}

      {/* D. Browse by Industry */}
      {topics.length > 0 && (
        <section data-reveal className="py-7 bg-white/60 border-y border-[#DFE3E8] backdrop-blur-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase tracking-widest font-bold text-[#596579]">
                Browse by Industry:
              </span>
            </div>
            <TopicChips topics={topics as any} />
          </div>
        </section>
      )}

      {/* E. Featured Leaders */}
      {featuredGuests.length > 0 && (
        <section className="py-14 sm:py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div data-reveal className="flex items-end justify-between mb-8 sm:mb-10">
            <div>
              <div className="text-xs uppercase tracking-widest font-bold text-[#C6A15B] mb-1">
                The Architects of Industry
              </div>
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-editorial font-bold text-[#172235]">
                Featured Leaders
              </h2>
            </div>
            <Link
              href="/guests"
              className="neu-btn px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-[#596579] hover:text-[#C6A15B] inline-flex items-center gap-1.5 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              View Directory <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {featuredGuests.map((guest: any, idx: number) => (
              <GuestCard key={guest.id} guest={guest} staggerIndex={idx + 1} />
            ))}
          </div>
        </section>
      )}

      {/* F. More Conversations */}
      {recentEpisodes.length > 0 && (
        <section className="py-14 sm:py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 border-t border-[#DFE3E8]">
          <div data-reveal className="flex items-end justify-between mb-8 sm:mb-10">
            <div>
              <div className="text-xs uppercase tracking-widest font-bold text-[#C6A15B] mb-1">
                Recent Broadcasts
              </div>
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-editorial font-bold text-[#172235]">
                More Conversations
              </h2>
            </div>
            <Link
              href="/episodes"
              className="neu-btn px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-[#596579] hover:text-[#C6A15B] inline-flex items-center gap-1.5 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              Browse All <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {recentEpisodes.map((ep: any, idx: number) => (
              <EpisodeCard key={ep.id} episode={ep} staggerIndex={(idx % 3) + 1} />
            ))}
          </div>
        </section>
      )}

      {/* G. Nominate a Leader CTA */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-6 sm:pb-10">
        <NominationCTA />
      </div>
    </>
  );
}
