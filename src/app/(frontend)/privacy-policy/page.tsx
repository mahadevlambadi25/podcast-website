import React from 'react';
import type { Metadata } from 'next';
import { Shield } from 'lucide-react';
import { siteConfig } from '@/config/site';
import { getSiteSettings } from '@/lib/payload';
import { RichText } from '@/components/RichText';

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: `Privacy Policy for ${siteConfig.brandName}. Details on data handling, nominations, analytics, and YouTube embedded players.`,
};

export const revalidate = 60;

export default async function PrivacyPolicyPage() {
  const settings = await getSiteSettings();
  const customContent = (settings as any)?.privacyPolicyContent;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-20 space-y-10">
      <div data-reveal className="space-y-4">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full neu-raised-sm border border-neu-border/60 text-neu-gold text-xs font-semibold tracking-wider uppercase">
          <Shield className="w-3.5 h-3.5" />
          Transparency &amp; Governance
        </div>
        <h1 className="text-3xl sm:text-5xl font-editorial font-bold text-neu-charcoal tracking-tight">
          Privacy Policy
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
              <h2 className="text-xl font-editorial font-bold text-neu-charcoal">1. Overview</h2>
              <p>
                <strong>{siteConfig.brandName}</strong> (&ldquo;we&rdquo;, &ldquo;our&rdquo;, or &ldquo;the Podcast&rdquo;), published by <strong>{siteConfig.publisher.name}</strong>, is committed to safeguarding the privacy of our audience and nominators. This Privacy Policy outlines our data collection, usage, and protection practices across our website.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-editorial font-bold text-neu-charcoal">2. Form Submissions &amp; Leader Nominations</h2>
              <p>
                When you submit a nomination through our &ldquo;Nominate a Leader&rdquo; form or contact us via our general inquiry form, we collect the information you voluntarily provide, including names, email addresses, nominee biographical notes, and commentary.
              </p>
              <ul className="list-disc pl-5 space-y-1.5 text-neu-muted text-sm">
                <li><strong className="text-neu-charcoal">Private Storage:</strong> Nomination submissions are stored privately in our secure administrative database and are accessible solely to our editorial review desk.</li>
                <li><strong className="text-neu-charcoal">No Auto-Publication:</strong> Nominee information is never published automatically or shared with third parties without direct written authorization.</li>
                <li><strong className="text-neu-charcoal">Purpose:</strong> Form data is utilized exclusively to evaluate prospective interview subjects and correspond directly with nominators.</li>
              </ul>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-editorial font-bold text-neu-charcoal">3. YouTube Embedded Players &amp; Cookies</h2>
              <p>
                Our episode pages feature video interviews hosted on YouTube. To protect your privacy:
              </p>
              <ul className="list-disc pl-5 space-y-1.5 text-neu-muted text-sm">
                <li>We implement <strong className="text-neu-charcoal">click-to-load facades</strong>. YouTube code and iframes are never downloaded or executed until you explicitly click to play an episode.</li>
                <li>All embedded video players utilize YouTube&apos;s privacy-enhanced mode (<code>youtube-nocookie.com</code>), which prevents YouTube from storing tracking cookies on your device unless you initiate playback.</li>
                <li>Your interaction with YouTube is governed by Google&apos;s Privacy Policy.</li>
              </ul>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-editorial font-bold text-neu-charcoal">4. Web Analytics &amp; Consent</h2>
              <p>
                We use privacy-friendly analytics tools to evaluate traffic patterns and episode interest. Analytics scripts are loaded <strong className="text-neu-charcoal">only after explicit user consent</strong> via our consent banner. We configure IP anonymization and do not sell, rent, or monetize visitor telemetry.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-editorial font-bold text-neu-charcoal">5. Data Retention &amp; Rights</h2>
              <p>
                You maintain the right to inspect, correct, or request deletion of any personal correspondence or nomination submissions by contacting our editorial desk at <a href={`mailto:${siteConfig.contact.email}`} className="text-neu-gold hover:text-neu-gold-hover font-medium underline transition-colors">{siteConfig.contact.email}</a>.
              </p>
            </section>
          </>
        )}
      </div>
    </div>
  );
}
