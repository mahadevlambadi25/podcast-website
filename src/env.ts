import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.string().default('3000'),
  NEXT_PUBLIC_SITE_URL: z.string().url().default('http://localhost:3000'),
  PAYLOAD_SECRET: z.string().min(16, 'PAYLOAD_SECRET must be at least 16 characters in development'),
  DATABASE_URI: z.string().min(1, 'DATABASE_URI is required'),
  USE_SQLITE: z.enum(['true', 'false']).optional().default('false'),
  CRON_SECRET: z.string().min(12, 'CRON_SECRET must be at least 12 characters'),

  // Seed credentials (strictly required in production if seeding)
  SEED_ADMIN_EMAIL: z.string().email().optional(),
  SEED_ADMIN_PASSWORD: z.string().min(8).optional(),
  SEED_DEMO: z.enum(['true', 'false']).optional().default('false'),

  // Optional External Integrations
  REDIS_URL: z.string().url().optional(),
  UPSTASH_REDIS_REST_URL: z.string().url().optional(),
  UPSTASH_REDIS_REST_TOKEN: z.string().optional(),
  RESEND_API_KEY: z.string().optional(),
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.string().optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  SMTP_FROM: z.string().optional(),
  NOMINATION_RECIPIENT_EMAIL: z.string().email().optional(),
  CONTACT_RECIPIENT_EMAIL: z.string().email().optional(),
  NOMINATION_WEBHOOK_URL: z.string().url().optional(),
  NEXT_PUBLIC_GA_MEASUREMENT_ID: z.string().optional(),

  // S3 Cloud Storage
  S3_ENABLED: z.enum(['true', 'false']).optional().default('false'),
  S3_BUCKET: z.string().optional(),
  S3_REGION: z.string().optional().default('us-east-1'),
  S3_ACCESS_KEY_ID: z.string().optional(),
  S3_SECRET_ACCESS_KEY: z.string().optional(),
  S3_ENDPOINT: z.string().optional(),
});

function validateEnv() {
  const parsed = envSchema.safeParse(process.env);

  if (!parsed.success) {
    console.error('❌ FATAL: Invalid environment variable configuration:');
    console.error(JSON.stringify(parsed.error.format(), null, 2));
    throw new Error('Invalid environment configuration. Process halted for security.');
  }

  const env = parsed.data;

  // Enforce Production Safety Rules
  if (env.NODE_ENV === 'production') {
    const isCloudHosted = Boolean(
      process.env.RENDER ||
      process.env.VERCEL ||
      process.env.AWS_EXECUTION_ENV ||
      process.env.FLY_APP_NAME
    );

    if (env.USE_SQLITE === 'true') {
      if (isCloudHosted) {
        throw new Error('❌ FATAL: SQLite fallback is strictly forbidden in production cloud deployments. PostgreSQL is mandatory.');
      }
      console.warn('⚠️ NOTICE: Local production build running with USE_SQLITE=true. In live cloud deployment, PostgreSQL is mandatory.');
    } else {
      if (!env.DATABASE_URI.startsWith('postgres://') && !env.DATABASE_URI.startsWith('postgresql://')) {
        throw new Error('❌ FATAL: In production, PostgreSQL is mandatory. SQLite fallback is disabled. Provide a valid postgres:// connection string.');
      }
      if (env.PAYLOAD_SECRET.includes('dev') || env.PAYLOAD_SECRET.includes('secret-at-least')) {
        throw new Error('❌ FATAL: Production PAYLOAD_SECRET cannot use default or dev placeholder values.');
      }
    }

    if (env.PAYLOAD_SECRET.length < 32) {
      throw new Error('❌ FATAL: PAYLOAD_SECRET must be at least 32 characters long.');
    }

    if (env.NEXT_PUBLIC_SITE_URL.includes('localhost') && isCloudHosted) {
      console.warn('⚠️ WARNING: NEXT_PUBLIC_SITE_URL is pointing to localhost in production.');
    }
  }

  return env;
}

export const env = validateEnv();
