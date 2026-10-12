/**
 * Central Site Configuration
 * 
 * IMPORTANT: Brand spelling is defined here as "Unchartered".
 * If the owner decides to switch to "Uncharted", change it in this file only.
 * NEVER hard-code the brand name in components.
 */

export interface SiteConfig {
  brandName: string;
  shortName: string;
  tagline: string;
  description: string;
  publisher: {
    name: string;
    url: string;
    attribution: string;
  };
  siteUrl: string;
  nav: Array<{
    label: string;
    href: string;
  }>;
  socials: {
    youtube?: string;
    linkedin?: string;
    twitter?: string;
    spotify?: string;
    apple?: string;
  };
  contact: {
    email: string;
    nominationRecipientEmail: string;
  };
}

export const siteConfig: SiteConfig = {
  brandName: 'Unchartered — Legends & Legacies',
  shortName: 'Unchartered',
  tagline: 'In-depth conversations with founders, CEOs, chairpersons, and pioneers shaping the global frontier.',
  description: 'Long-form editorial interviews exploring the decisive moments, contrarian insights, and enduring legacies of industry leaders.',
  publisher: {
    name: 'AI Automation Labs',
    url: 'https://automationlabs.online/',
    attribution: 'A podcast by AI Automation Labs',
  },
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL || 'https://uncharteredpodcast.com',
  nav: [
    { label: 'Episodes', href: '/episodes' },
    { label: 'Guests', href: '/guests' },
    { label: 'About', href: '/about' },
    { label: 'Nominate a Leader', href: '/nominate-a-leader' },
  ],
  socials: {
    youtube: 'https://www.youtube.com/@uncharteredpodcast',
    linkedin: 'https://www.linkedin.com/company/ai-automation-labs',
    twitter: 'https://x.com/uncharteredcast',
  },
  contact: {
    email: 'contact@uncharteredpodcast.com',
    nominationRecipientEmail: 'nominations@uncharteredpodcast.com',
  },
};
