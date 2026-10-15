import React from 'react';
import type { Metadata } from 'next';
import { notFound, permanentRedirect } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { Building, Linkedin, Globe, ExternalLink, Quote, Sparkles, Video } from 'lucide-react';
import { siteConfig } from '@/config/site';
import { getGuestBySlug, getEpisodesForGuest, getPublishedGuests, getPayloadClient, getRedirectForPath } from '@/lib/payload';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { RichText } from '@/components/RichText';
import { EpisodeCard } from '@/components/EpisodeCard';
import { GuestCard } from '@/components/GuestCard';

export const revalidate = 60;

interface GuestPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export async function generateMetadata({ params }: GuestPageProps): Promise<Metadata> {
  const { slug } = await params;
  const guest = await getGuestBySlug(slug);

  if (!guest) {
    return {
      title: 'Leader Not Found',
    };
  }

  const title = guest.seoTitle || `${guest.fullName} — Biography & Podcast Episodes | ${siteConfig.shortName}`;
  const description = guest.seoDescription || guest.shortOverview;
  const canonicalUrl = `${siteConfig.siteUrl}/guests/${guest.slug}`;

  const ogImageUrl =
    (guest.socialImage as any)?.url ||
    (guest.portrait as any)?.url ||
    `${siteConfig.siteUrl}/api/og?title=${encodeURIComponent(guest.fullName)}&subtitle=${encodeURIComponent(guest.role + (guest.company ? ` at ${guest.company}` : ''))}&type=GUEST`;

  return {
    title,
    description,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      type: 'profile',
      url: canonicalUrl,
      title,
      description,
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
          alt: guest.fullName,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [ogImageUrl],
    },
  };
}

export default async function GuestDetailPage({ params }: GuestPageProps) {
  const { slug } = await params;
  const guest = await getGuestBySlug(slug);

  if (!guest) {
    const redirectTarget = await getRedirectForPath(`/guests/${slug}`);
    if (redirectTarget) {
      permanentRedirect(redirectTarget);
    }
    notFound();
  }

  const [episodes, allGuestsRes] = await Promise.all([
    getEpisodesForGuest(guest.id),
    getPublishedGuests({ limit: 4 }),
  ]);
  const relatedGuests = allGuestsRes.docs.filter((g: any) => g.id !== guest.id).slice(0, 3);

  const portraitObj = guest.portrait && typeof guest.portrait === 'object' ? (guest.portrait as any) : null;
  const portraitUrl = portraitObj?.url || '/placeholders/portrait-placeholder.svg';
  const altText = guest.portraitAlt || portraitObj?.alt || guest.fullName;

  const absolutePortraitUrl = portraitUrl.startsWith('http')
    ? portraitUrl
    : `${siteConfig.siteUrl}${portraitUrl}`;

  // Schema.org Person JSON-LD
  const personJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: guest.fullName,
    jobTitle: guest.role,
    worksFor: guest.company
      ? {
          '@type': 'Organization',
          name: guest.company,
        }
      : undefined,
    description: guest.shortOverview,
    image: absolutePortraitUrl,
    url: `${siteConfig.siteUrl}/guests/${guest.slug}`,
    sameAs: [
      guest.links?.linkedin,
      guest.links?.website,
      guest.links?.other,
    ].filter(Boolean),
  };

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: siteConfig.siteUrl },
      { '@type': 'ListItem', position: 2, name: 'Leaders', item: `${siteConfig.siteUrl}/guests` },
      { '@type': 'ListItem', position: 3, name: guest.fullName, item: `${siteConfig.siteUrl}/guests/${guest.slug}` },
    ],
  };

  const featuredEpisode = episodes[0];
  const moreEpisodes = episodes.slice(1);

  return (
    <article className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-16">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(personJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />

      <Breadcrumbs
        items={[
          { label: 'Guests', href: '/guests' },
          { label: guest.fullName },
        ]}
      />

      {/* Guest Hero Section */}
      <header className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
        {/* Portrait 4:5 with Refined Bezel */}
        <div data-reveal data-reveal-delay="1" className="lg:col-span-5 p-3 rounded-3xl bg-white border border-[#DFE3E8] shadow-xl">
          <div className="relative aspect-[4/5] rounded-2xl overflow-hidden bg-[#EDE8DE] shadow-inner">
            <Image
              src={portraitUrl}
              alt={altText}
              fill
              sizes="(max-width: 1024px) 100vw, 40vw"
              priority
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#101C2C]/70 via-transparent to-transparent opacity-80" />
            {guest.portraitCredit && (
              <div className="absolute bottom-3 right-3 text-[10px] text-white bg-[#101C2C]/80 px-2.5 py-0.5 rounded-lg backdrop-blur border border-white/10">
                Photo: {guest.portraitCredit}
              </div>
            )}
          </div>
        </div>

        {/* Profile Meta & Overview */}
        <div data-reveal data-reveal-delay="2" className="lg:col-span-7 space-y-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#C6A15B]/15 border border-[#C6A15B]/30 text-[#C6A15B] text-xs font-bold tracking-wider uppercase shadow-sm">
              <Sparkles className="w-3.5 h-3.5" />
              Featured Leader Profile
            </div>

            <h1 className="text-3xl sm:text-5xl font-editorial font-bold text-[#172235] tracking-tight leading-tight">
              {guest.fullName}
            </h1>

            <div className="text-lg sm:text-xl text-[#C6A15B] font-bold">
              {guest.role}
            </div>

            {guest.company && (
              <div className="text-base text-[#596579] flex items-center gap-2 font-medium">
                <Building className="w-4 h-4 text-[#596579] shrink-0" />
                <span>{guest.company}</span>
              </div>
            )}
          </div>

          {/* Industry Tags */}
          {guest.industries && guest.industries.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-1">
              {guest.industries.map((t: any) => (
                <span
                  key={t.id || t.slug}
                  className="bg-white border border-[#DFE3E8] px-3 py-1 text-xs font-semibold text-[#172235] shadow-sm rounded-full"
                >
                  {t.name}
                </span>
              ))}
            </div>
          )}

          {/* Executive Overview */}
          <div className="p-6 rounded-2xl bg-white border border-[#DFE3E8] shadow-sm text-[#172235] text-sm leading-relaxed space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-[#172235] block">
              Executive Overview
            </span>
            <p className="text-[#596579]">{guest.shortOverview}</p>
          </div>

          {/* Social / Web Links */}
          {(guest.links?.linkedin || guest.links?.website || guest.links?.other) && (
            <div className="flex items-center gap-3 pt-2">
              {guest.links.linkedin && (
                <a
                  href={guest.links.linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="neu-btn px-4 py-2.5 rounded-xl text-neu-charcoal text-xs font-bold flex items-center gap-2 transition-all hover:scale-[1.02] active:scale-[0.98]"
                >
                  <Linkedin className="w-4 h-4 text-blue-600" />
                  LinkedIn Profile
                </a>
              )}
              {guest.links.website && (
                <a
                  href={guest.links.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="neu-btn px-4 py-2.5 rounded-xl text-neu-charcoal text-xs font-bold flex items-center gap-2 transition-all hover:scale-[1.02] active:scale-[0.98]"
                >
                  <Globe className="w-4 h-4 text-emerald-600" />
                  Website
                </a>
              )}
              {guest.links.other && (
                <a
                  href={guest.links.other}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="neu-btn px-4 py-2.5 rounded-xl text-neu-charcoal text-xs font-bold flex items-center gap-2 transition-all hover:scale-[1.02] active:scale-[0.98]"
                >
                  <ExternalLink className="w-4 h-4 text-neu-muted" />
                  External Bio
                </a>
              )}
            </div>
          )}
        </div>
      </header>

      {/* Key Insights & Quotes */}
      {guest.keyInsights && guest.keyInsights.length > 0 && (
        <section className="space-y-6 pt-10 border-t border-[#DFE3E8]">
          <div data-reveal className="text-xs uppercase tracking-widest font-bold text-[#C6A15B]">
            Contrarian Philosophy &amp; Strategy
          </div>
          <h2 data-reveal className="text-2xl sm:text-3xl font-editorial font-bold text-[#172235]">
            Key Insights from {guest.fullName}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {guest.keyInsights.map((insight: any, idx: number) => (
              <div
                key={idx}
                data-reveal
                data-reveal-delay={String((idx % 2) + 1)}
                className="p-6 sm:p-8 rounded-2xl bg-white border border-[#DFE3E8] shadow-md relative space-y-3"
              >
                <Quote className="w-6 h-6 text-[#C6A15B]/30" />
                <p className="font-editorial text-lg italic text-[#172235] leading-relaxed">
                  &ldquo;{insight.quote}&rdquo;
                </p>
                {insight.context && (
                  <div className="text-xs uppercase tracking-wider font-sans font-bold text-[#C6A15B] pt-2 border-t border-[#DFE3E8]">
                    {insight.context}
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Editorial Biography */}
      <section data-reveal className="space-y-6 pt-10 border-t border-[#DFE3E8]">
        <h2 className="text-2xl sm:text-3xl font-editorial font-bold text-[#172235]">
          Full Leadership Biography
        </h2>
        <div className="p-6 sm:p-8 rounded-2xl border border-[#DFE3E8] bg-white shadow-sm max-w-[72ch] leading-relaxed text-[#172235]">
          <RichText content={guest.biography} />
        </div>
      </section>

      {/* Featured Conversation Episode */}
      {featuredEpisode && (
        <section className="space-y-6 pt-10 border-t border-[#DFE3E8]">
          <div data-reveal className="text-xs uppercase tracking-widest font-bold text-[#C6A15B] flex items-center gap-1.5">
            <Video className="w-3.5 h-3.5" />
            Headline Dialogue
          </div>
          <h2 data-reveal className="text-2xl sm:text-3xl font-editorial font-bold text-[#172235]">
            Watch {guest.fullName}&apos;s Interview
          </h2>
          <EpisodeCard episode={featuredEpisode as any} featuredLarge />
        </section>
      )}

      {/* Additional Episodes featuring this guest */}
      {moreEpisodes.length > 0 && (
        <section className="space-y-6 pt-10 border-t border-[#DFE3E8]">
          <h2 data-reveal className="text-2xl font-editorial font-bold text-neu-charcoal">
            More Episodes Featuring {guest.fullName}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {moreEpisodes.map((ep: any, idx: number) => (
              <EpisodeCard key={ep.id} episode={ep} staggerIndex={(idx % 2) + 1} />
            ))}
          </div>
        </section>
      )}

      {/* Related Leaders */}
      {relatedGuests.length > 0 && (
        <section className="space-y-6 pt-12 border-t border-neu-border">
          <div data-reveal className="text-xs uppercase tracking-widest font-bold text-gold-600">
            More Profiles
          </div>
          <h2 data-reveal className="text-2xl sm:text-3xl font-editorial font-bold text-neu-charcoal">
            Other Featured Leaders
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {relatedGuests.map((g: any, idx: number) => (
              <GuestCard key={g.id} guest={g} staggerIndex={(idx % 3) + 1} />
            ))}
          </div>
        </section>
      )}
    </article>
  );
}
