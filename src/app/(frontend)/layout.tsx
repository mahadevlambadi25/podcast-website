import type { Metadata } from 'next';
import { Fraunces, Inter } from 'next/font/google';
import '../globals.css';
import { siteConfig } from '@/config/site';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { CookieBanner } from '@/components/CookieBanner';
import { Analytics } from '@/components/Analytics';
import { ScrollRevealProvider } from '@/components/ScrollRevealProvider';
import { getSiteSettings } from '@/lib/payload';

const fraunces = Fraunces({
  subsets: ['latin'],
  variable: '--font-fraunces',
  display: 'swap',
});

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.siteUrl),
  title: {
    default: `${siteConfig.brandName} — The Leadership & Legacy Podcast`,
    template: `%s | ${siteConfig.shortName}`,
  },
  description: siteConfig.description,
  keywords: [
    'podcast',
    'leadership interviews',
    'CEOs',
    'founders',
    'business legends',
    'executive insights',
    'Unchartered podcast',
    'AI Automation Labs',
  ],
  authors: [{ name: siteConfig.publisher.name, url: siteConfig.publisher.url }],
  creator: siteConfig.publisher.name,
  publisher: siteConfig.publisher.name,
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: siteConfig.siteUrl,
    title: siteConfig.brandName,
    description: siteConfig.description,
    siteName: siteConfig.brandName,
    images: [
      {
        url: '/api/og',
        width: 1200,
        height: 630,
        alt: siteConfig.brandName,
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: siteConfig.brandName,
    description: siteConfig.description,
    images: ['/api/og'],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default async function FrontendLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const settings = await getSiteSettings();

  const customLogoUrl = (settings as any)?.logo?.url || null;
  const brandNameOverride = (settings as any)?.brandName || null;
  const socials = {
    youtube: (settings as any)?.youtubeChannelUrl,
    linkedin: (settings as any)?.linkedinUrl,
    twitter: (settings as any)?.twitterUrl,
  };
  const analyticsId = (settings as any)?.analyticsId || process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

  return (
    <html lang="en" className={`${fraunces.variable} ${inter.variable}`}>
      <body className="min-h-screen bg-neu-base text-neu-body flex flex-col font-sans selection:bg-gold-500 selection:text-white">
        <a href="#main-content" className="skip-link">
          Skip to main content
        </a>

        <Header customLogoUrl={customLogoUrl} brandNameOverride={brandNameOverride} />

        <main id="main-content" className="flex-1">
          {children}
        </main>

        <Footer socialsOverride={socials} />

        <ScrollRevealProvider />
        <CookieBanner />
        <Analytics measurementId={analyticsId} />
      </body>
    </html>
  );
}
