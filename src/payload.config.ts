import { buildConfig } from 'payload';
import { postgresAdapter } from '@payloadcms/db-postgres';
import { sqliteAdapter } from '@payloadcms/db-sqlite';
import { lexicalEditor } from '@payloadcms/richtext-lexical';
import { s3Storage } from '@payloadcms/storage-s3';
import path from 'path';
import { fileURLToPath } from 'url';
import sharp from 'sharp';

import { Users } from './collections/Users';
import { Media } from './collections/Media';
import { Topics } from './collections/Topics';
import { Guests } from './collections/Guests';
import { Episodes } from './collections/Episodes';
import { Redirects } from './collections/Redirects';
import { Nominations } from './collections/Nominations';
import { ContactMessages } from './collections/ContactMessages';
import { SiteSettings } from './globals/SiteSettings';

const filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(filename);

import { env } from './env';

// Database Adapter selection:
// Prefers PostgreSQL if URI begins with postgresql:// or postgres://
// Falls back to SQLite for local development only
const databaseUri = env.DATABASE_URI || process.env.DATABASE_URI || 'file:./payload.db';

if (env.NODE_ENV === 'production' && env.USE_SQLITE !== 'true') {
  if (!databaseUri.startsWith('postgres://') && !databaseUri.startsWith('postgresql://')) {
    throw new Error(
      'FATAL CONFIGURATION ERROR: Production environment strictly requires PostgreSQL. SQLite fallback is forbidden in production.'
    );
  }
}

const usePostgres = (databaseUri.startsWith('postgres://') || databaseUri.startsWith('postgresql://')) && env.USE_SQLITE !== 'true';

const projectRoot = path.resolve(dirname, '..');
const defaultSqlitePath = path.resolve(projectRoot, 'payload.db');

const getSqliteClientUrl = (uri: string): string => {
  if (uri.startsWith('file:')) {
    const rawPath = uri.slice(5);
    if (path.isAbsolute(rawPath)) {
      return uri;
    }
    return `file:${path.resolve(projectRoot, rawPath)}`;
  }
  return `file:${defaultSqlitePath}`;
};

const dbAdapter = usePostgres
  ? postgresAdapter({
      pool: {
        connectionString: databaseUri,
      },
    })
  : sqliteAdapter({
      client: {
        url: getSqliteClientUrl(databaseUri),
      },
    });

// Configure plugins list
const plugins: any[] = [];

// Optional S3 cloud storage for production media uploads
if (process.env.S3_ENABLED === 'true' && process.env.S3_BUCKET) {
  plugins.push(
    s3Storage({
      collections: {
        media: true,
      },
      bucket: process.env.S3_BUCKET,
      config: {
        credentials: {
          accessKeyId: process.env.S3_ACCESS_KEY_ID || '',
          secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || '',
        },
        region: process.env.S3_REGION || 'us-east-1',
        endpoint: process.env.S3_ENDPOINT,
      },
    })
  );
}

export default buildConfig({
  admin: {
    user: Users.slug,
    importMap: {
      baseDir: path.resolve(dirname),
    },
    meta: {
      titleSuffix: ' — Unchartered CMS',
    },
    components: {
      graphics: {
        Logo: '/components/admin/Logo#Logo',
        Icon: '/components/admin/Icon#Icon',
      },
      beforeDashboard: ['/components/admin/DashboardOverview#DashboardOverview'],
      beforeNavLinks: ['/components/admin/NavBrand#NavBrand'],
    },
  },
  collections: [
    Users,
    Guests,
    Episodes,
    Topics,
    Redirects,
    Nominations,
    ContactMessages,
    Media,
  ],
  globals: [SiteSettings],
  editor: lexicalEditor({}),
  secret: process.env.PAYLOAD_SECRET || 'dev-fallback-secret-at-least-32-characters-long',
  serverURL: process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',
  cors: Array.from(
    new Set([
      'http://localhost:3000',
      'http://127.0.0.1:3000',
      ...(process.env.NEXT_PUBLIC_SITE_URL ? [process.env.NEXT_PUBLIC_SITE_URL] : []),
    ])
  ),
  csrf: Array.from(
    new Set([
      'http://localhost:3000',
      'http://127.0.0.1:3000',
      ...(process.env.NEXT_PUBLIC_SITE_URL ? [process.env.NEXT_PUBLIC_SITE_URL] : []),
    ])
  ),
  sharp,
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  db: dbAdapter,
  plugins,
});
