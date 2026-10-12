import type { CollectionConfig } from 'payload';
import { slugify } from '../utils/slug';

export const Topics: CollectionConfig = {
  slug: 'topics',
  admin: {
    group: 'Editorial',
    useAsTitle: 'name',
    defaultColumns: ['name', 'slug', 'updatedAt'],
    description: 'Industry verticals, conversation tags, and executive taxonomy.',
  },
  access: {
    read: () => true,
    create: ({ req: { user } }) => Boolean(user),
    update: ({ req: { user } }) => Boolean(user),
    delete: ({ req: { user } }) => user?.role === 'admin',
  },
  fields: [
    {
      type: 'row',
      fields: [
        {
          name: 'name',
          type: 'text',
          required: true,
          unique: true,
          label: 'Topic / Pillar Name',
          admin: {
            width: '50%',
            placeholder: 'e.g. Sovereign Compute, Frontier AI, Venture Capital',
            description: 'Public name of the industry focus area or conversation pillar.',
          },
        },
        {
          name: 'slug',
          type: 'text',
          required: true,
          unique: true,
          label: 'URL Slug',
          admin: {
            width: '50%',
            placeholder: 'e.g. sovereign-compute',
            description: 'URL-safe identifier. Auto-generated from name if left empty.',
          },
          hooks: {
            beforeValidate: [
              ({ value, data }) => {
                if (!value && data?.name) {
                  return slugify(data.name);
                }
                return value ? slugify(value) : value;
              },
            ],
          },
        },
      ],
    },
    {
      name: 'description',
      type: 'textarea',
      label: 'Editorial Pillar Scope & Overview',
      admin: {
        placeholder: 'Define the scope and strategic importance of this topic vertical...',
        description: 'Brief editorial overview of this industry vertical and its core themes.',
      },
    },
  ],
};
