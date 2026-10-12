import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.string().default('3000'),
  NEXT_PUBLIC_SITE_URL: z.string().url().default('http://localhost:3000'),
  PAYLOAD_SECRET: z.string().min(16, 'PAYLOAD_SECRET must be at least 16 characters').default('build-placeholder-secret-for-static-analysis-32ch'),
  DATABASE_URI: z.string().min(1, 'DATABASE_URI is required').default('file:./payload.db'),
  DATABASE_AUTH_TOKEN: z.string().optional(),
  USE_SQLITE: z.enum(['true', 'false']).optional().default('true'),
  CRON_SECRET: z.string().min(12, 'CRON_SECRET must be at least 12 characters').default('build-placeholder-cron-secret-1234'),

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

  // Enforce Production Safety Rules (skip during build phase)
  const isBuildPhase = process.env.DOCKER_BUILD === '1' || process.env.NEXT_PHASE === 'phase-production-build';

  if (env.NODE_ENV === 'production' && !isBuildPhase) {
    const isCloudHosted = Boolean(
      process.env.RENDER ||
      process.env.VERCEL ||
      process.env.AWS_EXECUTION_ENV ||
      process.env.FLY_APP_NAME
    );

    const isLibSqlRemote = env.DATABASE_URI.startsWith('libsql://') || env.DATABASE_URI.startsWith('https://');
    const isPostgres = env.DATABASE_URI.startsWith('postgres://') || env.DATABASE_URI.startsWith('postgresql://');
    const isSqlite = env.DATABASE_URI.startsWith('file:') || env.USE_SQLITE === 'true';

    if (!isLibSqlRemote && !isPostgres && !isSqlite) {
      throw new Error('❌ FATAL: Invalid DATABASE_URI format. Must be postgres://, libsql://, or file:');
    }

    if (isSqlite && isCloudHosted) {
      console.warn('⚠️ NOTICE: Running SQLite on cloud hosting. Note that local storage is ephemeral across restarts unless persistent disk/Turso is configured.');
    }

    // In production runtime, reject missing, short, or placeholder secrets
    if (
      !process.env.PAYLOAD_SECRET ||
      env.PAYLOAD_SECRET.includes('build-placeholder') ||
      env.PAYLOAD_SECRET.includes('dev-secret') ||
      env.PAYLOAD_SECRET.length < 32
    ) {
      throw new Error(
        '❌ FATAL: Production PAYLOAD_SECRET is missing, too short (<32 chars), or using a build-placeholder value. You must configure a unique 32+ character PAYLOAD_SECRET in your environment variables.'
      );
    }

    if (
      !process.env.CRON_SECRET ||
      env.CRON_SECRET.includes('build-placeholder') ||
      env.CRON_SECRET.length < 12
    ) {
      throw new Error(
        '❌ FATAL: Production CRON_SECRET is missing or using a build-placeholder value. You must configure a unique 12+ character CRON_SECRET in your environment variables.'
      );
    }

    if (env.NEXT_PUBLIC_SITE_URL.includes('localhost') && isCloudHosted) {
      console.warn('⚠️ WARNING: NEXT_PUBLIC_SITE_URL is pointing to localhost in production.');
    }
  }

  return env;
}

export const env = validateEnv();
