import React from 'react';
import type { Metadata } from 'next';
import { FileText } from 'lucide-react';
import { siteConfig } from '@/config/site';
import { getSiteSettings } from '@/lib/payload';
import { RichText } from '@/components/RichText';

export const metadata: Metadata = {
  title: 'Terms of Service',
  description: `Terms of Service governing the use of ${siteConfig.brandName}.`,
};

export const revalidate = 60;

export default async function TermsPage() {
  const settings = await getSiteSettings();
  const customContent = (settings as any)?.termsContent;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-20 space-y-10">
      <div data-reveal className="space-y-4">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full neu-raised-sm border border-neu-border/60 text-neu-gold text-xs font-semibold tracking-wider uppercase">
          <FileText className="w-3.5 h-3.5" />
          Legal Agreement
        </div>
        <h1 className="text-3xl sm:text-5xl font-editorial font-bold text-neu-charcoal tracking-tight">
          Terms of Service
        </h1>
        <p className="text-neu-muted text-sm font-medium">
          Last revised: March 2026
        </p>
      </div>

      <div data-reveal className="p-8 sm:p-12 rounded-3xl neu-card border border-neu-border/80 text-neu-body leading-relaxed space-y-8">
        {customContent ? (
          <RichText content={customContent} />
        ) : (
          <>
            <section className="space-y-3">
              <h2 className="text-xl font-editorial font-bold text-neu-charcoal">1. Acceptance of Terms</h2>
              <p>
                By accessing and using <strong>{siteConfig.brandName}</strong>, published by <strong>{siteConfig.publisher.name}</strong>, you agree to comply with and be bound by these Terms of Service.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-editorial font-bold text-neu-charcoal">2. Intellectual Property</h2>
              <p>
                All editorial dialogues, interview transcripts, graphic marks, and audio-visual recordings presented on this website are the property of {siteConfig.publisher.name} or their respective copyright holders. Content is provided for personal, non-commercial education and research. Unlicensed commercial reproduction or syndication is prohibited without express permission.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-editorial font-bold text-neu-charcoal">3. Leader Nominations &amp; Submissions</h2>
              <p>
                By submitting leader nominations, you represent that all information provided is accurate to the best of your knowledge. Submitting a nomination conveys no commercial obligations or guarantee of production or interview scheduling.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-editorial font-bold text-neu-charcoal">4. Third-Party Content &amp; Media</h2>
              <p>
                This site links to external platforms including YouTube, LinkedIn, and corporate profiles. We bear no liability for third-party platform availability, content policies, or algorithmic playback restrictions.
              </p>
            </section>
          </>
        )}
      </div>
    </div>
  );
}
