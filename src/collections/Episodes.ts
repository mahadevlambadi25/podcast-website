import type { CollectionConfig } from 'payload';
import { slugify } from '../utils/slug';
import { extractYouTubeId } from '../utils/youtube';
import { siteConfig } from '../config/site';
import { revalidatePath } from 'next/cache';
import { handleSlugRedirect } from '../utils/redirects';

export const Episodes: CollectionConfig = {
  slug: 'episodes',
  admin: {
    group: 'Editorial',
    useAsTitle: 'title',
    defaultColumns: ['title', 'publishedAt', 'status', 'featured', 'episodeNumber'],
    description: 'Manage audio & video episodes, show notes, transcripts, and key takeaways.',
  },
  access: {
    read: ({ req: { user } }): any => {
      if (user) return true;
      const now = new Date().toISOString();
      return {
        and: [
          { status: { equals: 'published' } },
          { publishedAt: { less_than_equal: now } },
        ],
      };
    },
    create: ({ req: { user } }) => Boolean(user),
    update: ({ req: { user } }) => Boolean(user),
    delete: ({ req: { user } }) => user?.role === 'admin',
  },
  hooks: {
    beforeValidate: [
      ({ data }) => {
        if (!data) return;

        // Auto-generate slug from title
        if (!data.slug && data.title) {
          data.slug = slugify(data.title);
        } else if (data.slug) {
          data.slug = slugify(data.slug);
        }

        // Derive YouTube video ID from URL
        if (data.youtubeUrl) {
          const videoId = extractYouTubeId(data.youtubeUrl);
          if (videoId) {
            data.youtubeVideoId = videoId;
          }
        }

        // Auto-prefill SEO fields
        if (!data.seoTitle && data.title) {
          data.seoTitle = `${data.title} | ${siteConfig.brandName}`;
        }
        if (!data.seoDescription && data.shortSummary) {
          data.seoDescription = data.shortSummary;
        }

        return data;
      },
    ],
    beforeChange: [
      ({ data }) => {
        if (data.status === 'published') {
          if (!data.guests || (Array.isArray(data.guests) && data.guests.length === 0)) {
            throw new Error('An episode must have at least one associated guest to be published.');
          }
          if (!data.youtubeUrl) {
            throw new Error('A YouTube video URL is required before publishing an episode.');
          }
          const videoId = extractYouTubeId(data.youtubeUrl);
          if (!videoId) {
            throw new Error('Invalid YouTube URL. Please provide a valid watch, youtu.be, or embed link.');
          }
          data.youtubeVideoId = videoId;
          if (!data.publishedAt) {
            data.publishedAt = new Date().toISOString();
          }
        }
        return data;
      },
    ],
    afterChange: [
      async ({ doc, previousDoc, req }) => {
        // Auto-create and collapse redirect if published episode slug changed
        if (
          previousDoc?.status === 'published' &&
          previousDoc?.slug &&
          doc.slug &&
          previousDoc.slug !== doc.slug
        ) {
          await handleSlugRedirect(
            req.payload,
            `/episodes/${previousDoc.slug}`,
            `/episodes/${doc.slug}`
          );
        }

        // Revalidate Next.js static pages and linked guests
        try {
          revalidatePath('/');
          revalidatePath('/episodes');
          revalidatePath('/sitemap.xml');
          revalidatePath('/search');
          revalidatePath(`/episodes/${doc.slug}`);
          if (previousDoc?.slug) {
            revalidatePath(`/episodes/${previousDoc.slug}`);
          }

          // Revalidate linked guests
          if (Array.isArray(doc.guests)) {
            for (const g of doc.guests) {
              const guestId = typeof g === 'object' ? g.id : g;
              const guestDoc =
                typeof g === 'object' && g.slug
                  ? g
                  : await req.payload.findByID({ collection: 'guests', id: guestId }).catch(() => null);
              if (guestDoc?.slug) {
                revalidatePath(`/guests/${guestDoc.slug}`);
              }
            }
          }
        } catch {
          // runs on server requests
        }
      },
    ],
  },
  fields: [
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Basic Information',
          description: 'Core episode metadata, title, sequential identifiers, and executive summary.',
          fields: [
            {
              name: 'title',
              type: 'text',
              required: true,
              unique: true,
              label: 'Episode Title',
              admin: {
                placeholder: 'e.g. Episode 01: The Quantum Horizon & Sovereign Compute',
                description: 'The official headline title of the episode.',
              },
            },
            {
              name: 'slug',
              type: 'text',
              required: true,
              unique: true,
              index: true,
              label: 'URL Slug',
              admin: {
                placeholder: 'e.g. the-quantum-horizon-sovereign-compute',
                description:
                  'Permanent canonical URL identifier. Auto-generated from title if blank. Changing a published slug automatically creates a 301 redirect.',
              },
            },
            {
              type: 'row',
              fields: [
                {
                  name: 'episodeNumber',
                  type: 'number',
                  label: 'Episode Number',
                  admin: {
                    width: '50%',
                    placeholder: 'e.g. 1',
                    description: 'Sequential episode index.',
                  },
                },
                {
                  name: 'season',
                  type: 'number',
                  label: 'Season Number',
                  admin: {
                    width: '50%',
                    placeholder: 'e.g. 1',
                    description: 'Production season number.',
                  },
                },
              ],
            },
            {
              name: 'shortSummary',
              type: 'textarea',
              required: true,
              label: 'Executive Short Summary',
              admin: {
                placeholder: 'Concise executive brief (40–100 words recommended)...',
                description: 'Executive summary displayed in episode cards, search previews, and social snippets.',
              },
            },
          ],
        },
        {
          label: 'Media & Playback',
          description: 'Video streaming link, auto-extracted YouTube ID, fallback player URL, and artwork.',
          fields: [
            {
              name: 'youtubeUrl',
              type: 'text',
              label: 'YouTube Video URL',
              admin: {
                placeholder: 'https://www.youtube.com/watch?v=... or https://youtu.be/...',
                description: 'Standard YouTube link. The 11-character video ID is extracted automatically.',
              },
            },
            {
              name: 'youtubeVideoId',
              type: 'text',
              label: 'Derived YouTube Video ID',
              admin: {
                readOnly: true,
                description: 'Server-computed 11-character video ID for the responsive player facade.',
              },
            },
            {
              name: 'fallbackWatchUrl',
              type: 'text',
              label: 'Fallback Watch URL (Optional)',
              admin: {
                placeholder: 'https://...',
                description: 'External link to watch if embedded playback encounters regional restrictions.',
              },
            },
            {
              name: 'thumbnail',
              type: 'upload',
              relationTo: 'media',
              label: 'Custom Episode Artwork (16:9 Landscape)',
              admin: {
                description: 'High-resolution landscape cover art. If omitted, YouTube high-res artwork is used.',
              },
            },
          ],
        },
        {
          label: 'Guests & Topics',
          description: 'Link featured leaders, conversation taxonomy, and discovery keywords.',
          fields: [
            {
              name: 'guests',
              type: 'relationship',
              relationTo: 'guests',
              hasMany: true,
              required: true,
              label: 'Featured Leaders & Guests',
              admin: {
                description: 'Select one or more leaders featured in this conversation. Required for publishing.',
              },
            },
            {
              name: 'topics',
              type: 'relationship',
              relationTo: 'topics',
              hasMany: true,
              label: 'Industry Verticals & Topics',
              admin: {
                description: 'Associate this episode with conversation pillars and industry tags.',
              },
            },
            {
              name: 'tags',
              type: 'array',
              label: 'Search & SEO Tags',
              admin: {
                description: 'Keywords and phrases for on-site search ranking and content discovery.',
              },
              fields: [
                {
                  name: 'tag',
                  type: 'text',
                  required: true,
                  label: 'Tag Keyword',
                  admin: {
                    placeholder: 'e.g. Sovereign AI, Capital Allocation',
                  },
                },
              ],
            },
          ],
        },
        {
          label: 'Show Notes & Content',
          description: 'Comprehensive editorial show notes, core takeaways, quotes, and transcript.',
          fields: [
            {
              name: 'description',
              type: 'richText',
              required: true,
              label: 'Full Description & Show Notes',
              admin: {
                description: 'Comprehensive editorial show notes, chapter timestamps, and reference resources.',
              },
            },
            {
              name: 'keyTakeaways',
              type: 'array',
              label: 'Key Takeaways & Core Lessons',
              admin: {
                description: 'Structured executive takeaways highlighted across the episode detail page.',
              },
              fields: [
                {
                  name: 'takeaway',
                  type: 'text',
                  required: true,
                  label: 'Key Takeaway',
                  admin: {
                    placeholder: 'e.g. Strategic moat architecture requires compounding network effects...',
                  },
                },
              ],
            },
            {
              name: 'quotes',
              type: 'array',
              label: 'Memorable Quotes',
              admin: {
                description: 'Direct quotations highlighted in editorial callout blocks.',
              },
              fields: [
                {
                  name: 'quote',
                  type: 'textarea',
                  required: true,
                  label: 'Quote Text',
                  admin: {
                    placeholder: 'Direct quote verbatim from the conversation...',
                  },
                },
                {
                  name: 'speaker',
                  type: 'text',
                  label: 'Speaker Name (Optional)',
                  admin: {
                    placeholder: 'e.g. Dr. Aris Thorne',
                  },
                },
              ],
            },
            {
              name: 'transcript',
              type: 'textarea',
              label: 'Full Episode Transcript (Accessible HTML / Text)',
              admin: {
                placeholder: 'Paste the full transcript of this conversation...',
                description: 'Complete accessible transcript for deep reading, accessibility, and search indexation.',
              },
            },
          ],
        },
        {
          label: 'Publishing & Schedule',
          description: 'Publication status, homepage showcase flag, and release timing.',
          fields: [
            {
              type: 'row',
              fields: [
                {
                  name: 'status',
                  type: 'select',
                  defaultValue: 'draft',
                  required: true,
                  index: true,
                  label: 'Publishing Status',
                  options: [
                    { label: 'Draft — Private work-in-progress', value: 'draft' },
                    { label: 'Scheduled — Auto-publish at release date', value: 'scheduled' },
                    { label: 'Published — Live on public website', value: 'published' },
                    { label: 'Archived — Hidden from directories', value: 'archived' },
                  ],
                  admin: {
                    width: '50%',
                    description: 'Controls public access and search visibility.',
                  },
                },
                {
                  name: 'featured',
                  type: 'checkbox',
                  defaultValue: false,
                  index: true,
                  label: 'Feature on Homepage Marquee',
                  admin: {
                    width: '50%',
                    description: 'Showcase this episode prominently in the homepage spotlight.',
                  },
                },
              ],
            },
            {
              name: 'publishedAt',
              type: 'date',
              required: true,
              index: true,
              label: 'Publication Date & Time',
              admin: {
                date: {
                  pickerAppearance: 'dayAndTime',
                },
                description: 'Determines chronological order and automated scheduled release.',
              },
            },
          ],
        },
        {
          label: 'SEO & Syndication',
          description: 'Search engine metadata, social share previews, and canonical link attribution.',
          fields: [
            {
              name: 'seoTitle',
              type: 'text',
              label: 'SEO Meta Title',
              admin: {
                placeholder: 'Episode Title | Unchartered — Legends & Legacies',
                description: 'Optimal search title length: 50–60 characters. Auto-prefilled from title if left blank.',
              },
            },
            {
              name: 'seoDescription',
              type: 'textarea',
              label: 'SEO Meta Description',
              admin: {
                placeholder: 'Concise summary for Google search result snippet...',
                description: 'Optimal search description length: 120–160 characters. Auto-prefilled from summary if left blank.',
              },
            },
            {
              name: 'canonicalOverride',
              type: 'text',
              label: 'Canonical URL Override (Admin Only)',
              access: {
                update: ({ req: { user } }) => user?.role === 'admin',
              },
              admin: {
                placeholder: 'https://...',
                description: 'Admin-only: specify alternative canonical URL if syndicated from an external publication.',
              },
            },
          ],
        },
      ],
    },
  ],
};
