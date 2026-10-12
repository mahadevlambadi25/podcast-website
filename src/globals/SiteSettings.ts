import type { GlobalConfig } from 'payload';

export const SiteSettings: GlobalConfig = {
  slug: 'site-settings',
  admin: {
    group: 'Settings & Administration',
    description: 'Global brand overrides, social links, SEO defaults, and email notifications.',
  },
  access: {
    read: ({ req: { user } }) => user?.role === 'admin',
    update: ({ req: { user } }) => user?.role === 'admin',
  },
  fields: [
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Brand & Identity',
          fields: [
            {
              name: 'brandName',
              type: 'text',
              label: 'Brand Name Override',
              admin: {
                description: 'Defaults to config (Unchartered — Legends & Legacies).',
              },
            },
            {
              name: 'tagline',
              type: 'text',
              label: 'Tagline',
            },
            {
              name: 'publisherName',
              type: 'text',
              label: 'Publisher Name (AI Automation Labs)',
            },
            {
              name: 'publisherUrl',
              type: 'text',
              label: 'Publisher Website URL',
            },
            {
              name: 'attribution',
              type: 'text',
              label: 'Attribution Line',
              admin: {
                description: 'e.g. "A podcast by AI Automation Labs"',
              },
            },
            {
              name: 'logo',
              type: 'upload',
              relationTo: 'media',
              label: 'Custom Logo Image (Optional - typographic wordmark used by default)',
            },
            {
              name: 'defaultOgImage',
              type: 'upload',
              relationTo: 'media',
              label: 'Default Social Share Image (1200x630)',
            },
          ],
        },
        {
          label: 'Homepage Hero & Featured',
          fields: [
            {
              name: 'heroHeadline',
              type: 'text',
              label: 'Hero Headline',
              admin: {
                placeholder: 'Where Industry Titans Share the Architecture of Legacy',
              },
            },
            {
              name: 'heroMission',
              type: 'textarea',
              label: 'Hero Mission / Subtitle',
            },
            {
              name: 'featuredEpisodeOverride',
              type: 'relationship',
              relationTo: 'episodes',
              label: 'Featured Episode Pin (Overrides latest episode in hero if set)',
            },
          ],
        },
        {
          label: 'About Page & Host',
          fields: [
            {
              name: 'aboutMission',
              type: 'richText',
              label: 'Show Mission & Purpose',
            },
            {
              name: 'aboutAudience',
              type: 'richText',
              label: 'Who This Is For',
            },
            {
              name: 'aboutEditorial',
              type: 'richText',
              label: 'Editorial Standards & Integrity',
            },
            {
              name: 'hasHostSection',
              type: 'checkbox',
              defaultValue: false,
              label: 'Display Host Profile Section',
            },
            {
              name: 'hostName',
              type: 'text',
              label: 'Host Name',
              admin: {
                condition: (data) => Boolean(data?.hasHostSection),
              },
            },
            {
              name: 'hostRole',
              type: 'text',
              label: 'Host Role / Title',
              admin: {
                condition: (data) => Boolean(data?.hasHostSection),
              },
            },
            {
              name: 'hostBio',
              type: 'richText',
              label: 'Host Biography',
              admin: {
                condition: (data) => Boolean(data?.hasHostSection),
              },
            },
            {
              name: 'hostPortrait',
              type: 'upload',
              relationTo: 'media',
              label: 'Host Portrait Image',
              admin: {
                condition: (data) => Boolean(data?.hasHostSection),
              },
            },
          ],
        },
        {
          label: 'Social & Channels',
          fields: [
            {
              name: 'youtubeChannelUrl',
              type: 'text',
              label: 'YouTube Channel URL (Rendered only if provided)',
            },
            {
              name: 'linkedinUrl',
              type: 'text',
              label: 'LinkedIn Page URL',
            },
            {
              name: 'twitterUrl',
              type: 'text',
              label: 'X (Twitter) Profile URL',
            },
            {
              name: 'spotifyUrl',
              type: 'text',
              label: 'Spotify Show URL',
            },
            {
              name: 'applePodcastsUrl',
              type: 'text',
              label: 'Apple Podcasts URL',
            },
          ],
        },
        {
          label: 'Contact & Integrations',
          fields: [
            {
              name: 'contactEmail',
              type: 'email',
              label: 'Public Contact Email',
            },
            {
              name: 'contactPhone',
              type: 'text',
              label: 'Public Contact Phone (Optional)',
            },
            {
              name: 'contactAddress',
              type: 'text',
              label: 'Office / City Location (Optional)',
            },
            {
              name: 'nominationRecipientEmail',
              type: 'email',
              label: 'Nomination Alert Recipient Email',
            },
            {
              name: 'nominationWebhookUrl',
              type: 'text',
              label: 'CRM / Slack Webhook URL for Nominations',
            },
            {
              name: 'analyticsId',
              type: 'text',
              label: 'Google Analytics 4 Measurement ID (e.g. G-XXXXXXXXXX)',
            },
          ],
        },
        {
          label: 'Legal & Policies',
          fields: [
            {
              name: 'privacyPolicyContent',
              type: 'richText',
              label: 'Privacy Policy Text',
            },
            {
              name: 'termsContent',
              type: 'richText',
              label: 'Terms of Service Text',
            },
          ],
        },
      ],
    },
  ],
};
