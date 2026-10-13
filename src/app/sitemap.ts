import { MetadataRoute } from 'next';
import { getPublishedEpisodes, getPublishedGuests } from '@/lib/payload';
import { siteConfig } from '@/config/site';

export const dynamic = 'force-dynamic';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = siteConfig.siteUrl.replace(/\/$/, '');

  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}/`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/episodes`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/guests`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/about`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/nominate-a-leader`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/contact`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${baseUrl}/privacy-policy`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    {
      url: `${baseUrl}/terms`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.3,
    },
  ];

  try {
    const [episodes, guests] = await Promise.all([
      getPublishedEpisodes({ limit: 1000 }),
      getPublishedGuests({ limit: 1000 }),
    ]);

    const episodeRoutes: MetadataRoute.Sitemap = episodes.docs.map((ep: any) => ({
      url: `${baseUrl}/episodes/${ep.slug}`,
      lastModified: new Date(ep.updatedAt || ep.publishedAt),
      changeFrequency: 'weekly',
      priority: 0.85,
    }));

    const guestRoutes: MetadataRoute.Sitemap = guests.docs.map((g: any) => ({
      url: `${baseUrl}/guests/${g.slug}`,
      lastModified: new Date(g.updatedAt || g.createdAt),
      changeFrequency: 'weekly',
      priority: 0.85,
    }));

    return [...staticRoutes, ...episodeRoutes, ...guestRoutes];
  } catch (err) {
    console.error('Sitemap query error:', err);
    return staticRoutes;
  }
}
