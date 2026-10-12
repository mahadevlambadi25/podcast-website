import type { CollectionConfig } from 'payload';
import { slugify } from '../utils/slug';
import { siteConfig } from '../config/site';
import { revalidatePath } from 'next/cache';

import { handleSlugRedirect } from '../utils/redirects';

export const Guests: CollectionConfig = {
  slug: 'guests',
  admin: {
    group: 'Editorial',
    useAsTitle: 'fullName',
    defaultColumns: ['fullName', 'role', 'company', 'status', 'featured', 'updatedAt'],
    description: 'Leader directories, biographies, company affiliations, and quotations.',
  },
  access: {
    read: ({ req: { user } }) => {
      if (user) return true;
      return {
        status: { equals: 'published' },
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
        // Auto-generate slug from fullName if empty
        if (!data.slug && data.fullName) {
          data.slug = slugify(data.fullName);
        } else if (data.slug) {
          data.slug = slugify(data.slug);
        }

        // Auto-prefill SEO title and description
        if (!data.seoTitle && data.fullName) {
          data.seoTitle = `${data.fullName} — Biography & Podcast Episodes | ${siteConfig.shortName}`;
        }
        if (!data.seoDescription && data.fullName) {
          const comp = data.company ? ` at ${data.company}` : '';
          data.seoDescription = `${data.fullName}, ${data.role || 'Executive'}${comp}. Read biography, career leadership insights, and watch exclusive podcast conversations on ${siteConfig.brandName}.`;
        }
        return data;
      },
    ],
    beforeChange: [
      ({ data, context }) => {
        if (context?.skipValidation) return data;
        if (data.status === 'published') {
          if (!data.portrait) {
            throw new Error('A portrait image is required before publishing a guest profile.');
          }
          if (!data.shortOverview || data.shortOverview.trim().length < 20) {
            throw new Error('A short overview (40–100 words recommended) is required before publishing.');
          }
        }
        return data;
      },
    ],
    afterChange: [
      async ({ doc, previousDoc, req }) => {
        // Auto-create and collapse redirects if published guest slug changed
        if (
          previousDoc?.status === 'published' &&
          previousDoc?.slug &&
          doc.slug &&
          previousDoc.slug !== doc.slug
        ) {
          await handleSlugRedirect(
            req.payload,
            `/guests/${previousDoc.slug}`,
            `/guests/${doc.slug}`
          );
        }

        // Revalidate Next.js static pages and linked episodes
        try {
          revalidatePath('/');
          revalidatePath('/guests');
          revalidatePath('/sitemap.xml');
          revalidatePath('/search');
          revalidatePath(`/guests/${doc.slug}`);
          if (previousDoc?.slug) {
            revalidatePath(`/guests/${previousDoc.slug}`);
          }

          // Revalidate all episodes featuring this guest
          const linkedEpisodes = await req.payload.find({
            collection: 'episodes',
            where: { guests: { contains: doc.id } },
            limit: 25,
          });
          for (const ep of linkedEpisodes.docs) {
            if (ep.slug) {
              revalidatePath(`/episodes/${ep.slug}`);
            }
          }
        } catch {
          // Cache revalidation safe execution
        }
      },
    ],
  },
  fields: [
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Profile & Credentials',
          description: 'Leader name, URL identifier, executive title, and organizational affiliation.',
          fields: [
            {
              name: 'fullName',
              type: 'text',
              required: true,
              label: 'Full Name',
              admin: {
                placeholder: 'e.g. Dr. Aris Thorne',
                description: 'Primary name displayed on the profile and across episodes.',
              },
            },
            {
              name: 'alternateNames',
              type: 'array',
              label: 'Alternate Names (for Search)',
              admin: {
                description: 'Nicknames, previous surnames, formal titles, or maiden names.',
              },
              fields: [
                {
                  name: 'name',
                  type: 'text',
                  required: true,
                  label: 'Alternate Name / Alias',
                  admin: {
                    placeholder: 'e.g. Aris Thorne, PhD',
                  },
                },
              ],
            },
            {
              name: 'slug',
              type: 'text',
              required: true,
              unique: true,
              index: true,
              label: 'URL Slug',
              admin: {
                placeholder: 'e.g. aris-thorne',
                description:
                  'Permanent canonical URL identifier. Auto-generated from full name if blank. Changing a published slug automatically creates a 301 redirect.',
              },
            },
            {
              type: 'row',
              fields: [
                {
                  name: 'role',
                  type: 'text',
                  required: true,
                  label: 'Executive Role / Title',
                  admin: {
                    width: '50%',
                    placeholder: 'e.g. Co-Founder & CEO, Managing Partner, Chair',
                    description: 'Current leadership role or designation.',
                  },
                },
                {
                  name: 'company',
                  type: 'text',
                  label: 'Company / Organization',
                  admin: {
                    width: '50%',
                    placeholder: 'e.g. Apex BioTech, Global Logistics Ltd',
                    description: 'Primary enterprise or institution.',
                  },
                },
              ],
            },
          ],
        },
        {
          label: 'Biography & Insights',
          description: 'Executive overview, comprehensive biographical profile, and featured quotes.',
          fields: [
            {
              name: 'shortOverview',
              type: 'textarea',
              required: true,
              label: 'Executive Short Overview',
              admin: {
                placeholder: 'Concise summary of leadership career (recommended 40–100 words)...',
                description: 'Summary snippet used in guest directory cards and search snippets. Required to publish.',
              },
            },
            {
              name: 'biography',
              type: 'richText',
              required: true,
              label: 'Full Editorial Biography',
              admin: {
                description:
                  'Comprehensive editorial profile highlighting career trajectory, major milestones, and strategic leadership philosophy.',
              },
            },
            {
              name: 'keyInsights',
              type: 'array',
              label: 'Key Insights & Direct Quotes',
              admin: {
                description: 'Direct quotations and strategic philosophies featured on the leader profile page.',
              },
              fields: [
                {
                  name: 'quote',
                  type: 'textarea',
                  required: true,
                  label: 'Quote or Insight Text',
                  admin: {
                    placeholder: 'Core leadership insight verbatim from the guest...',
                  },
                },
                {
                  name: 'context',
                  type: 'text',
                  label: 'Context / Topic (Optional)',
                  admin: {
                    placeholder: 'e.g. On scaling past 1,000 employees',
                  },
                },
              ],
            },
          ],
        },
        {
          label: 'Portrait & Imagery',
          description: 'High-resolution photography, alt text accessibility, photo credits, and social cards.',
          fields: [
            {
              name: 'portrait',
              type: 'upload',
              relationTo: 'media',
              label: 'Executive Portrait Image (4:5 Aspect Ratio)',
              admin: {
                description: 'High-resolution professional portrait. Required to publish profile.',
              },
            },
            {
              type: 'row',
              fields: [
                {
                  name: 'portraitAlt',
                  type: 'text',
                  label: 'Portrait Alt Text (Accessibility)',
                  admin: {
                    width: '50%',
                    placeholder: 'e.g. Portrait of Dr. Aris Thorne in executive attire',
                    description: 'Accessible screen-reader description.',
                  },
                },
                {
                  name: 'portraitCredit',
                  type: 'text',
                  label: 'Photo Credit / Agency Permission',
                  admin: {
                    width: '50%',
                    placeholder: 'e.g. Photo courtesy of Apex BioTech Press Office',
                    description: 'Photographer credit or agency permission note.',
                  },
                },
              ],
            },
            {
              name: 'socialImage',
              type: 'upload',
              relationTo: 'media',
              label: 'Custom Social Share Image (OG 1200x630)',
              admin: {
                description: 'Optional custom social card for LinkedIn / Twitter previews.',
              },
            },
          ],
        },
        {
          label: 'Affiliations & Links',
          description: 'Industry verticals, conversation taxonomy, and verified external profiles.',
          fields: [
            {
              name: 'industries',
              type: 'relationship',
              relationTo: 'topics',
              hasMany: true,
              label: 'Associated Industries & Topics',
              admin: {
                description: 'Link this leader to industry verticals and conversation tags.',
              },
            },
            {
              name: 'links',
              type: 'group',
              label: 'External Links & Verified Socials',
              fields: [
                {
                  name: 'linkedin',
                  type: 'text',
                  label: 'LinkedIn Profile URL',
                  admin: {
                    placeholder: 'https://linkedin.com/in/...',
                  },
                },
                {
                  name: 'website',
                  type: 'text',
                  label: 'Company / Personal Website URL',
                  admin: {
                    placeholder: 'https://...',
                  },
                },
                {
                  name: 'other',
                  type: 'text',
                  label: 'Other Profile URL (Wikipedia, X, Forbes)',
                  admin: {
                    placeholder: 'https://...',
                  },
                },
              ],
            },
          ],
        },
        {
          label: 'Publishing & SEO',
          description: 'Visibility controls, homepage showcase, and search engine metadata.',
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
                    { label: 'Draft — Private profile', value: 'draft' },
                    { label: 'Published — Live in directory', value: 'published' },
                    { label: 'Archived — Hidden from public', value: 'archived' },
                  ],
                  admin: {
                    width: '50%',
                    description: 'Controls public directory listing.',
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
                    description: 'Showcase this leader in the homepage featured guests carousel.',
                  },
                },
              ],
            },
            {
              name: 'seoTitle',
              type: 'text',
              label: 'SEO Meta Title',
              admin: {
                placeholder: 'Leader Name — Biography & Insights | Unchartered',
                description: 'Optimal search title length: 50–60 characters. Auto-prefilled if left blank.',
              },
            },
            {
              name: 'seoDescription',
              type: 'textarea',
              label: 'SEO Meta Description',
              admin: {
                placeholder: 'Search snippet describing leader background and insights...',
                description: 'Optimal search description length: 120–160 characters. Auto-prefilled if left blank.',
              },
            },
            {
              name: 'canonicalOverride',
              type: 'text',
              label: 'Canonical URL Override (Admin Only)',
              admin: {
                placeholder: 'https://...',
                description: 'Custom canonical URL override. Restricted to Administrators.',
              },
              access: {
                update: ({ req: { user } }) => user?.role === 'admin',
              },
            },
          ],
        },
      ],
    },
  ],
};
