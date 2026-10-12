import React from 'react';
import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowUpRight, Award, Target, BookOpen, Mic } from 'lucide-react';
import { siteConfig } from '@/config/site';
import { getSiteSettings } from '@/lib/payload';
import { RichText } from '@/components/RichText';
import { NominationCTA } from '@/components/NominationCTA';

export const metadata: Metadata = {
  title: 'About the Show',
  description: `Learn about the mission, audience, and editorial integrity behind ${siteConfig.brandName}, a podcast produced by AI Automation Labs.`,
};

export const revalidate = 60;

export default async function AboutPage() {
  const settings = await getSiteSettings();

  const brandName = (settings as any)?.brandName || siteConfig.brandName;
  const publisherName = (settings as any)?.publisherName || siteConfig.publisher.name;
  const publisherUrl = (settings as any)?.publisherUrl || siteConfig.publisher.url;

  const hasHost = Boolean((settings as any)?.hasHostSection && (settings as any)?.hostName);
  const hostName = (settings as any)?.hostName;
  const hostRole = (settings as any)?.hostRole;
  const hostBio = (settings as any)?.hostBio;
  const hostPortraitUrl = (settings as any)?.hostPortrait?.url;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-20 space-y-16">
      {/* Header */}
      <div className="space-y-6 max-w-3xl">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#C6A15B]/15 border border-[#C6A15B]/30 text-[#C6A15B] text-xs font-bold tracking-wider uppercase shadow-sm">
          <BookOpen className="w-3.5 h-3.5" />
          The Story Behind The Show
        </div>

        <h1 className="text-4xl sm:text-6xl font-editorial font-bold text-[#172235] tracking-tight leading-tight">
          About {brandName}
        </h1>

        <p className="text-xl text-[#596579] font-normal leading-relaxed">
          Uncovering the defining inflection points, foundational philosophies, and long-term architectures behind legendary business leaders.
        </p>

        {/* Publisher Attribution */}
        <div className="pt-2 flex items-center gap-2 text-sm text-[#596579]">
          <span>A podcast produced by</span>
          <a
            href={publisherUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#172235] hover:text-[#C6A15B] font-bold inline-flex items-center gap-1 transition-colors"
          >
            {publisherName}
            <ArrowUpRight className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>

      {/* Editorial Mission Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-4">
        {/* Mission */}
        <div className="p-8 rounded-3xl bg-white border border-[#DFE3E8] space-y-4 shadow-sm">
          <div className="w-10 h-10 rounded-xl bg-[#F7F3EB] border border-[#DFE3E8] text-[#C6A15B] flex items-center justify-center shadow-sm">
            <Target className="w-5 h-5" />
          </div>
          <h2 className="text-xl font-editorial font-bold text-[#172235]">Our Mission</h2>
          <div className="text-sm text-[#596579] leading-relaxed">
            {(settings as any)?.aboutMission ? (
              <RichText content={(settings as any).aboutMission} />
            ) : (
              <p>
                To provide in-depth, rigorous, and thoughtful long-form conversations that move past soundbites, exploring the strategic bets and leadership crucibles that forged transformative global organizations.
              </p>
            )}
          </div>
        </div>

        {/* Who This Is For */}
        <div className="p-8 rounded-3xl bg-white border border-[#DFE3E8] space-y-4 shadow-sm">
          <div className="w-10 h-10 rounded-xl bg-[#F7F3EB] border border-[#DFE3E8] text-[#C6A15B] flex items-center justify-center shadow-sm">
            <Award className="w-5 h-5" />
          </div>
          <h2 className="text-xl font-editorial font-bold text-[#172235]">Our Audience</h2>
          <div className="text-sm text-[#596579] leading-relaxed">
            {(settings as any)?.aboutAudience ? (
              <RichText content={(settings as any).aboutAudience} />
            ) : (
              <p>
                Designed specifically for founders, C-suite executives, institutional investors, board chairs, and ambitious leaders seeking deep strategic insight rather than generic business advice.
              </p>
            )}
          </div>
        </div>

        {/* Editorial Integrity */}
        <div className="p-8 rounded-3xl bg-white border border-[#DFE3E8] space-y-4 shadow-sm">
          <div className="w-10 h-10 rounded-xl bg-[#F7F3EB] border border-[#DFE3E8] text-[#C6A15B] flex items-center justify-center shadow-sm">
            <Mic className="w-5 h-5" />
          </div>
          <h2 className="text-xl font-editorial font-bold text-[#172235]">Editorial Standard</h2>
          <div className="text-sm text-[#596579] leading-relaxed">
            {(settings as any)?.aboutEditorial ? (
              <RichText content={(settings as any).aboutEditorial} />
            ) : (
              <p>
                We do not produce pay-for-play interviews. Every guest is selected based on verifiable industry achievement, contrarian perspective, and an enduring legacy worth documenting.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Host Section - Rendered ONLY if configured in CMS */}
      {hasHost && (
        <section className="p-8 sm:p-12 rounded-3xl neu-card bg-neu-card border border-white/80 shadow-neu-raised-lg grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
          {hostPortraitUrl && (
            <div className="md:col-span-4 relative aspect-[4/5] rounded-2xl overflow-hidden bg-neu-sunken neu-inset shadow-inner">
              <Image
                src={hostPortraitUrl}
                alt={hostName || 'Show Host'}
                fill
                className="object-cover"
              />
            </div>
          )}

          <div className={`${hostPortraitUrl ? 'md:col-span-8' : 'md:col-span-12'} space-y-4`}>
            <div className="text-xs uppercase tracking-widest font-bold text-gold-600">
              The Host
            </div>
            <h2 className="text-3xl font-editorial font-bold text-neu-charcoal">
              {hostName}
            </h2>
            {hostRole && (
              <div className="text-sm text-gold-600 font-semibold">
                {hostRole}
              </div>
            )}
            <div className="text-sm text-neu-body leading-relaxed">
              <RichText content={hostBio} />
            </div>
          </div>
        </section>
      )}

      {/* About AI Automation Labs */}
      <section className="p-8 sm:p-10 rounded-3xl neu-card bg-neu-card border border-white/80 shadow-neu-raised space-y-4">
        <h2 className="text-2xl font-editorial font-bold text-neu-charcoal">
          Presented by {publisherName}
        </h2>
        <p className="text-sm text-neu-body leading-relaxed max-w-3xl">
          {brandName} is an editorial initiative supported by {publisherName}. Dedicated to exploring innovation and executive decision-making, the podcast serves as a public repository of modern corporate statecraft and technological leadership.
        </p>
        <div className="pt-2">
          <a
            href={publisherUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="neu-btn px-4 py-2.5 rounded-xl inline-flex items-center gap-1.5 text-xs uppercase tracking-wider font-bold text-gold-600 hover:text-gold-700 transition-colors"
          >
            Learn more at {publisherUrl.replace('https://', '')}
            <ArrowUpRight className="w-4 h-4" />
          </a>
        </div>
      </section>

      {/* Nomination CTA */}
      <NominationCTA />
    </div>
  );
}
