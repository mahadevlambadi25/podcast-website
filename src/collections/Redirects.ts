import type { CollectionConfig } from 'payload';

export const Redirects: CollectionConfig = {
  slug: 'redirects',
  admin: {
    group: 'Settings & Administration',
    useAsTitle: 'from',
    defaultColumns: ['from', 'to', 'type', 'createdAt'],
    description: 'Manage 301 and 302 vanity URL forwarding and legacy slug migrations.',
  },
  access: {
    read: ({ req: { user } }) => user?.role === 'admin',
    create: ({ req: { user } }) => user?.role === 'admin',
    update: ({ req: { user } }) => user?.role === 'admin',
    delete: ({ req: { user } }) => user?.role === 'admin',
  },
  fields: [
    {
      type: 'row',
      fields: [
        {
          name: 'from',
          type: 'text',
          required: true,
          unique: true,
          label: 'Source Path (From)',
          admin: {
            width: '50%',
            placeholder: 'e.g. /episodes/old-slug or /be-a-guest',
            description: 'Original inbound path to capture and redirect.',
          },
        },
        {
          name: 'to',
          type: 'text',
          required: true,
          label: 'Destination URL (To)',
          admin: {
            width: '50%',
            placeholder: 'e.g. /episodes/new-slug or /nominate-a-leader',
            description: 'Target canonical destination path or URL.',
          },
        },
      ],
    },
    {
      name: 'type',
      type: 'select',
      defaultValue: '301',
      required: true,
      label: 'HTTP Redirect Code',
      admin: {
        description:
          '301 Permanent (strongly recommended for SEO and URL migration) or 302 Temporary (for time-limited routing).',
      },
      options: [
        { label: '301 Permanent (SEO canonical redirect)', value: '301' },
        { label: '302 Temporary (Short-term forward)', value: '302' },
      ],
    },
  ],
};
