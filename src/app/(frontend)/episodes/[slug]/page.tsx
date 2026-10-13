import React from 'react';
import type { Metadata } from 'next';
import { notFound, permanentRedirect } from 'next/navigation';
import Link from 'next/link';
import { Calendar, Quote, CheckCircle2, FileText, ArrowLeft, ArrowRight, Tag } from 'lucide-react';
import { siteConfig } from '@/config/site';
import { getEpisodeBySlug, getAdjacentEpisodes, getPublishedEpisodes, getPayloadClient, getRedirectForPath } from '@/lib/payload';
import { YouTubeFacade } from '@/components/YouTubeFacade';
import { GuestCard } from '@/components/GuestCard';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { ShareButtons } from '@/components/ShareButtons';
import { RichText } from '@/components/RichText';
import { EpisodeCard } from '@/components/EpisodeCard';

export const revalidate = 60;

interface EpisodePageProps {
  params: Promise<{
    slug: string;
  }>;
}

export async function generateMetadata({ params }: EpisodePageProps): Promise<Metadata> {
  const { slug } = await params;
  const episode = await getEpisodeBySlug(slug);

  if (!episode) {
    return {
      title: 'Episode Not Found',
    };
  }

  const title = episode.seoTitle || `${episode.title} | ${siteConfig.brandName}`;
  const description = episode.seoDescription || episode.shortSummary;
  const canonicalUrl = episode.canonicalOverride || `${siteConfig.siteUrl}/episodes/${episode.slug}`;

  const ogImageUrl =
    (episode.thumbnail as any)?.url ||
    `${siteConfig.siteUrl}/api/og?title=${encodeURIComponent(episode.title)}&type=EPISODE`;

  return {
    title,
    description,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      type: 'video.other',
      url: canonicalUrl,
      title,
      description,
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
          alt: episode.title,
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

export default async function EpisodeDetailPage({ params }: EpisodePageProps) {
  const { slug } = await params;
  const episode = await getEpisodeBySlug(slug);

  if (!episode) {
    const redirectTarget = await getRedirectForPath(`/episodes/${slug}`);
    if (redirectTarget) {
      permanentRedirect(redirectTarget);
    }
    notFound();
  }

  const adjacent = await getAdjacentEpisodes(episode.publishedAt);
  const relatedRes = await getPublishedEpisodes({ limit: 3 });
  const relatedEpisodes = relatedRes.docs.filter((e: any) => e.id !== episode.id).slice(0, 3);

  const publishedDate = episode.publishedAt
    ? new Date(episode.publishedAt).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : '';

  const canonicalUrl = episode.canonicalOverride || `${siteConfig.siteUrl}/episodes/${episode.slug}`;
  const guests = episode.guests || [];

  // Schema.org VideoObject JSON-LD
  const thumbnailObj = episode.thumbnail && typeof episode.thumbnail === 'object' ? (episode.thumbnail as any) : null;
  const thumbnailAbsolute = thumbnailObj?.url
    ? (thumbnailObj.url.startsWith('http') ? thumbnailObj.url : `${siteConfig.siteUrl}${thumbnailObj.url}`)
    : (episode.youtubeVideoId && !episode.youtubeVideoId.includes('sample') && !episode.youtubeVideoId.includes('placeholder')
        ? `https://i.ytimg.com/vi/${episode.youtubeVideoId}/maxresdefault.jpg`
        : `${siteConfig.siteUrl}/placeholders/episode-placeholder.svg`);

  const videoObjectJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'VideoObject',
    name: episode.title,
    description: episode.shortSummary,
    thumbnailUrl: [thumbnailAbsolute],
    uploadDate: episode.publishedAt || new Date().toISOString(),
    embedUrl:
      episode.youtubeVideoId && !episode.youtubeVideoId.includes('sample') && !episode.youtubeVideoId.includes('placeholder')
        ? `https://www.youtube-nocookie.com/embed/${episode.youtubeVideoId}`
        : `${siteConfig.siteUrl}/episodes/${episode.slug}`,
    publisher: {
      '@type': 'Organization',
      name: siteConfig.publisher.name,
      url: siteConfig.publisher.url,
    },
  };

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: siteConfig.siteUrl },
      { '@type': 'ListItem', position: 2, name: 'Episodes', item: `${siteConfig.siteUrl}/episodes` },
      { '@type': 'ListItem', position: 3, name: episode.title, item: canonicalUrl },
    ],
  };

  return (
    <article className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-12">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(videoObjectJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />

      {/* Breadcrumbs */}
      <Breadcrumbs
        items={[
          { label: 'Episodes', href: '/episodes' },
          { label: episode.title },
        ]}
      />

      {/* Episode Header */}
      <header className="space-y-6">
        <div className="flex flex-wrap items-center gap-3 text-xs text-[#596579]">
          <span className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white border border-[#DFE3E8] font-semibold text-[#172235] shadow-sm">
            <Calendar className="w-3.5 h-3.5 text-[#C6A15B]" />
            {publishedDate}
          </span>
          {episode.episodeNumber && (
            <span className="text-[#C6A15B] px-3.5 py-1.5 rounded-full font-bold bg-white border border-[#DFE3E8] shadow-sm">
              Episode #{episode.episodeNumber}
            </span>
          )}
        </div>

        <h1 className="text-3xl sm:text-5xl lg:text-6xl font-editorial font-bold text-[#172235] tracking-tight leading-[1.15]">
          {episode.title}
        </h1>

        <p className="text-lg sm:text-xl text-[#596579] leading-relaxed max-w-3xl font-normal">
          {episode.shortSummary}
        </p>

        {/* Share Bar */}
        <div className="pt-3 border-t border-[#DFE3E8] flex items-center justify-between">
          <ShareButtons
            url={canonicalUrl}
            title={episode.title}
            summary={episode.shortSummary}
          />
        </div>
      </header>

      {/* Privacy-Enhanced YouTube Player Facade */}
      <div className="my-8">
        <YouTubeFacade
          videoId={episode.youtubeVideoId}
          title={episode.title}
          customThumbnailUrl={thumbnailObj?.url}
          fallbackWatchUrl={episode.fallbackWatchUrl || episode.youtubeUrl}
        />
      </div>

      {/* Key Takeaways Box */}
      {episode.keyTakeaways && episode.keyTakeaways.length > 0 && (
        <section className="rounded-3xl p-6 sm:p-8 space-y-4 shadow-xl border border-[#DFE3E8] bg-white">
          <h2 className="text-lg sm:text-xl font-editorial font-bold text-[#172235] flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-[#C6A15B]" />
            Key Executive Takeaways
          </h2>
          <ul className="space-y-3 pl-2">
            {episode.keyTakeaways.map((item: any, idx: number) => (
              <li key={idx} className="flex items-start gap-3 text-sm text-[#172235] leading-relaxed">
                <span className="w-2 h-2 rounded-full bg-[#C6A15B] mt-2 shrink-0 shadow-sm" />
                <span>{item.takeaway || item}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Featured Quotes */}
      {episode.quotes && episode.quotes.length > 0 && (
        <section className="space-y-4 my-8">
          {episode.quotes.map((q: any, idx: number) => (
            <blockquote
              key={idx}
              className="relative p-6 sm:p-8 rounded-2xl bg-white border-l-4 border-l-[#C6A15B] border border-[#DFE3E8] shadow-md italic text-[#172235] text-lg sm:text-xl font-editorial leading-relaxed"
            >
              <Quote className="w-8 h-8 text-[#C6A15B]/30 absolute top-4 right-4" />
              &ldquo;{q.quote}&rdquo;
              {q.speaker && (
                <footer className="text-xs uppercase tracking-wider font-sans font-bold text-[#C6A15B] mt-3 not-italic">
                  — {q.speaker}
                </footer>
              )}
            </blockquote>
          ))}
        </section>
      )}

      {/* Show Notes & Full Description */}
      <section className="space-y-6 pt-6 border-t border-[#DFE3E8]">
        <h2 className="text-2xl font-editorial font-bold text-[#172235]">
          Show Notes &amp; Overview
        </h2>
        <div className="max-w-[72ch] leading-relaxed text-[#172235] p-6 sm:p-8 rounded-2xl border border-[#DFE3E8] bg-white shadow-sm">
          <RichText content={episode.description} />
        </div>
      </section>

      {/* Topics & Tags */}
      {Boolean((episode.topics && episode.topics.length > 0) || (episode.tags && episode.tags.length > 0)) && (
        <div className="pt-6 border-t border-[#DFE3E8] flex flex-wrap items-center gap-2">
          <span className="text-xs uppercase tracking-wider font-bold text-[#596579] flex items-center gap-1.5 mr-2">
            <Tag className="w-3.5 h-3.5" />
            Themes:
          </span>
          {episode.topics?.map((topic: any) => (
            <Link
              key={topic.id || topic.slug}
              href={`/episodes?topic=${topic.slug}`}
              className="bg-white border border-[#DFE3E8] px-3.5 py-1.5 text-xs font-semibold text-[#172235] hover:border-[#C6A15B] hover:text-[#C6A15B] rounded-full transition-all shadow-sm"
            >
              {topic.name}
            </Link>
          ))}
          {episode.tags?.map((t: any, idx: number) => (
            <span
              key={idx}
              className="bg-[#EDE8DE] border border-[#DFE3E8] px-2.5 py-1 rounded-lg text-xs font-medium text-[#596579]"
            >
              #{t.tag || t}
            </span>
          ))}
        </div>
      )}

      {/* Featured Guest Profile Cards */}
      {guests.length > 0 && (
        <section className="space-y-6 pt-10 border-t border-[#DFE3E8]">
          <div className="text-xs uppercase tracking-widest font-bold text-[#C6A15B]">
            In Conversation With
          </div>
          <h2 className="text-2xl sm:text-3xl font-editorial font-bold text-[#172235]">
            Featured Leaders
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {guests.map((guest: any) => (
              <GuestCard key={guest.id} guest={guest} />
            ))}
          </div>
        </section>
      )}

      {/* Accessible Transcript Section */}
      {episode.transcript && (
        <section className="pt-10 border-t border-[#DFE3E8] space-y-4">
          <details className="group border border-[#DFE3E8] rounded-2xl p-6 open:p-8 bg-white shadow-md transition-all">
            <summary className="font-editorial text-xl font-bold text-[#172235] cursor-pointer flex items-center justify-between list-none focus:outline-none">
              <span className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-[#C6A15B]" />
                Read Full Accessible Transcript
              </span>
              <span className="text-xs text-[#C6A15B] font-bold uppercase tracking-wider font-sans group-open:hidden">
                + Expand
              </span>
              <span className="text-xs text-[#C6A15B] font-bold uppercase tracking-wider font-sans hidden group-open:inline">
                - Collapse
              </span>
            </summary>
            <div className="mt-6 pt-6 border-t border-[#DFE3E8] text-[#172235] text-sm leading-relaxed whitespace-pre-line space-y-4 max-h-[500px] overflow-y-auto pr-4 bg-[#EDE8DE] p-4 rounded-xl">
              {episode.transcript}
            </div>
          </details>
        </section>
      )}

      {/* Prev / Next Episode Navigation */}
      <nav aria-label="Previous and Next Episodes" className="pt-10 border-t border-neu-border grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div>
          {adjacent.prev && (
            <Link
              href={`/episodes/${adjacent.prev.slug}`}
              className="neu-card p-5 rounded-2xl border border-white/80 bg-neu-card block space-y-1 group transition-all hover:scale-[1.01]"
            >
              <div className="text-xs text-neu-muted flex items-center gap-1 group-hover:text-gold-600 font-semibold">
                <ArrowLeft className="w-3.5 h-3.5" /> Previous Episode
              </div>
              <div className="text-sm font-bold text-neu-charcoal group-hover:text-gold-600 truncate">
                {adjacent.prev.title}
              </div>
            </Link>
          )}
        </div>

        <div>
          {adjacent.next && (
            <Link
              href={`/episodes/${adjacent.next.slug}`}
              className="neu-card p-5 rounded-2xl border border-white/80 bg-neu-card block space-y-1 text-right group transition-all hover:scale-[1.01]"
            >
              <div className="text-xs text-neu-muted flex items-center justify-end gap-1 group-hover:text-gold-600 font-semibold">
                Next Episode <ArrowRight className="w-3.5 h-3.5" />
              </div>
              <div className="text-sm font-bold text-neu-charcoal group-hover:text-gold-600 truncate">
                {adjacent.next.title}
              </div>
            </Link>
          )}
        </div>
      </nav>

      {/* Related Episodes */}
      {relatedEpisodes.length > 0 && (
        <section className="pt-12 border-t border-neu-border space-y-6">
          <div className="text-xs uppercase tracking-widest font-bold text-gold-600">
            Keep Exploring
          </div>
          <h2 className="text-2xl sm:text-3xl font-editorial font-bold text-neu-charcoal">
            Related Conversations
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {relatedEpisodes.map((ep: any) => (
              <EpisodeCard key={ep.id} episode={ep} />
            ))}
          </div>
        </section>
      )}
    </article>
  );
}
