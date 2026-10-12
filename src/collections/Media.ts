import type { CollectionConfig } from 'payload';
import sharp from 'sharp';

export const Media: CollectionConfig = {
  slug: 'media',
  admin: {
    group: 'Media Library',
    useAsTitle: 'alt',
    description: 'Central media storage for episode covers, guest portraits, and brand assets.',
  },
  upload: {
    staticDir: 'media',
    imageSizes: [
      {
        name: 'thumbnail',
        width: 400,
        height: 300,
        position: 'centre',
      },
      {
        name: 'portrait',
        width: 800,
        height: 1000,
        position: 'centre',
      },
      {
        name: 'og',
        width: 1200,
        height: 630,
        position: 'centre',
      },
    ],
    adminThumbnail: 'thumbnail',
    mimeTypes: [
      'image/jpeg',
      'image/png',
      'image/webp',
      'image/avif',
      'image/svg+xml',
    ],
  },
  access: {
    read: () => true,
    create: ({ req: { user } }: any) => Boolean(user),
    update: ({ req: { user } }: any) => Boolean(user),
    delete: ({ req: { user } }: any) => user?.role === 'admin',
  },
  hooks: {
    beforeValidate: [
      ({ req, data }: any) => {
        if (req.file) {
          const maxBytes = 5 * 1024 * 1024; // 5 MB
          if (req.file.size > maxBytes) {
            throw new Error('File exceeds the maximum allowable upload size of 5MB.');
          }
          const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/svg+xml'];
          if (!allowed.includes(req.file.mimetype)) {
            throw new Error(`Unauthorized file type ${req.file.mimetype}. Allowed types: JPEG, PNG, WebP, AVIF, SVG.`);
          }
        }
        return data;
      },
    ],
    beforeChange: [
      async ({ req, data }: any) => {
        // Strip EXIF/GPS metadata from raster uploads
        if (req.file?.data && req.file.mimetype.startsWith('image/') && req.file.mimetype !== 'image/svg+xml') {
          try {
            req.file.data = await sharp(req.file.data).rotate().toBuffer();
          } catch (err) {
            console.warn('EXIF metadata scrub warning:', err);
          }
        }
        return data;
      },
    ],
  },
  fields: [
    {
      name: 'alt',
      type: 'text',
      required: true,
      label: 'Alt Text (Accessibility & SEO)',
      admin: {
        placeholder: 'e.g. Studio portrait of guest in executive setting',
        description: 'Accurately describe the visual content for screen readers and search engines.',
      },
    },
    {
      name: 'caption',
      type: 'text',
      label: 'Editorial Caption / Photo Credit',
      admin: {
        placeholder: 'e.g. Photography courtesy of Studio Apex / Unchartered Media',
        description: 'Optional editorial caption or copyright credit.',
      },
    },
  ],
};
