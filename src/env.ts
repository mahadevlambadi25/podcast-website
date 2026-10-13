import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.string().default('3000'),
  NEXT_PUBLIC_SITE_URL: z.string().url().default('http://localhost:3000'),

  // PostgreSQL Connection String (DATABASE_URL is standard for Render PostgreSQL)
  DATABASE_URL: z.string().optional(),
  DATABASE_URI: z.string().optional(),

  // Session & Security Secrets
  SESSION_SECRET: z
    .string()
    .min(16, 'SESSION_SECRET must be at least 16 characters')
    .optional(),
  PAYLOAD_SECRET: z.string().optional(),
  CRON_SECRET: z
    .string()
    .min(12, 'CRON_SECRET must be at least 12 characters')
    .default('build-placeholder-cron-secret-1234'),

  // Initial Admin Bootstrap Credentials (optional, used if fresh database needs admin)
  ADMIN_EMAIL: z.string().email().optional(),
  ADMIN_PASSWORD: z.string().min(8).optional(),
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
  const isBuildPhase =
    process.env.DOCKER_BUILD === '1' ||
    process.env.NEXT_PHASE === 'phase-production-build';

  if (env.NODE_ENV === 'production' && !isBuildPhase) {
    const isCloudHosted = Boolean(
      process.env.RENDER ||
      process.env.VERCEL ||
      process.env.AWS_EXECUTION_ENV ||
      process.env.FLY_APP_NAME
    );

    const dbUrl = env.DATABASE_URL || env.DATABASE_URI || '';
    const isPostgres =
      dbUrl.startsWith('postgres://') || dbUrl.startsWith('postgresql://');

    if (!isPostgres && isCloudHosted) {
      console.warn(
        '⚠️ NOTICE: DATABASE_URL does not start with postgres:// or postgresql://. Ensure Render PostgreSQL is linked.'
      );
    }

    const secret =
      env.SESSION_SECRET ||
      env.PAYLOAD_SECRET ||
      process.env.SESSION_SECRET ||
      process.env.PAYLOAD_SECRET ||
      '';

    if (
      !secret ||
      secret.includes('build-placeholder') ||
      secret.includes('dev-secret') ||
      secret.length < 32
    ) {
      console.warn(
        '⚠️ WARNING: Production SESSION_SECRET is missing or using a default. Configure a unique 32+ character SESSION_SECRET in Render environment variables.'
      );
    }

    if (env.NEXT_PUBLIC_SITE_URL.includes('localhost') && isCloudHosted) {
      console.warn(
        '⚠️ WARNING: NEXT_PUBLIC_SITE_URL is pointing to localhost in production.'
      );
    }
  }

  return env;
}

export const env = validateEnv();
