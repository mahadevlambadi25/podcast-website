import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
  type PutObjectCommandInput,
} from '@aws-sdk/client-s3';
import { Readable } from 'stream';

export interface S3Config {
  bucket: string;
  region: string;
  accessKeyId?: string;
  secretAccessKey?: string;
  endpoint?: string;
  forcePathStyle?: boolean;
}

/**
 * Sanitizes and normalizes an environment variable value.
 * Trims whitespace and strips surrounding matching quotes (single or double).
 */
export function cleanEnvValue(val?: string | null): string | undefined {
  if (val === undefined || val === null) return undefined;
  let trimmed = String(val).trim();
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    trimmed = trimmed.slice(1, -1).trim();
  }
  return trimmed.length > 0 ? trimmed : undefined;
}

/**
 * Returns the effective S3 configuration from environment variables.
 * Prioritizes standard AWS_* variables while supporting S3_* aliases.
 */
export function getS3Config(): S3Config {
  const bucket =
    cleanEnvValue(process.env.AWS_S3_BUCKET) ||
    cleanEnvValue(process.env.S3_BUCKET) ||
    'podcast-media-mahadev-2026';

  let rawRegion =
    cleanEnvValue(process.env.AWS_REGION) ||
    cleanEnvValue(process.env.AWS_DEFAULT_REGION) ||
    cleanEnvValue(process.env.S3_REGION);

  // If the bucket is the production podcast bucket and an obsolete default region (e.g. us-east-1)
  // was inherited from legacy template env vars without an explicit AWS_REGION, enforce ap-south-1.
  if (bucket === 'podcast-media-mahadev-2026') {
    if (!cleanEnvValue(process.env.AWS_REGION) && (!rawRegion || rawRegion === 'us-east-1')) {
      rawRegion = 'ap-south-1';
    }
  }

  const region = rawRegion || 'ap-south-1';

  const accessKeyId =
    cleanEnvValue(process.env.AWS_ACCESS_KEY_ID) ||
    cleanEnvValue(process.env.S3_ACCESS_KEY_ID) ||
    undefined;

  const secretAccessKey =
    cleanEnvValue(process.env.AWS_SECRET_ACCESS_KEY) ||
    cleanEnvValue(process.env.S3_SECRET_ACCESS_KEY) ||
    undefined;

  // Endpoint: Only set if an explicit custom non-AWS endpoint is provided (e.g. MinIO, Cloudflare R2, LocalStack).
  // Standard AWS S3 must NOT specify an endpoint property; AWS SDK v3 automatically derives
  // the canonical regional virtual-hosted endpoint (https://<bucket>.s3.<region>.amazonaws.com).
  const rawEndpoint =
    cleanEnvValue(process.env.AWS_ENDPOINT_URL_S3) ||
    cleanEnvValue(process.env.AWS_ENDPOINT_URL) ||
    cleanEnvValue(process.env.S3_ENDPOINT);

  // If someone passed standard AWS endpoints (e.g. s3.amazonaws.com or s3.ap-south-1.amazonaws.com),
  // strip it so AWS SDK v3 handles endpoint resolution and virtual hosting natively.
  const isStandardAwsEndpoint =
    rawEndpoint &&
    (rawEndpoint.includes('amazonaws.com') ||
      rawEndpoint.startsWith('https://s3.') ||
      rawEndpoint.startsWith('http://s3.'));

  const endpoint = isStandardAwsEndpoint ? undefined : rawEndpoint;

  // Path-style is legacy and explicitly deprecated for AWS S3.
  // Only enable forcePathStyle if explicitly requested (S3_FORCE_PATH_STYLE=true)
  // or when targeting local emulators (MinIO / LocalStack).
  const forcePathStyle =
    cleanEnvValue(process.env.S3_FORCE_PATH_STYLE) === 'true' ||
    Boolean(endpoint && (endpoint.includes('localhost') || endpoint.includes('127.0.0.1')));

  return {
    bucket,
    region,
    accessKeyId,
    secretAccessKey,
    endpoint,
    forcePathStyle,
  };
}

/**
 * Checks if S3 has the required credentials and configuration.
 */
export function isS3Configured(): boolean {
  const config = getS3Config();
  return Boolean(
    config.bucket &&
    config.accessKeyId &&
    config.secretAccessKey &&
    config.accessKeyId.length > 0 &&
    config.secretAccessKey.length > 0
  );
}

/**
 * Determines if S3 storage should be actively used for media operations.
 * - Handles surrounding quotes, whitespace, casing, and truthy/falsy representations.
 * - If S3_ENABLED is 'false', '0', 'no', 'off', S3 is disabled.
 * - If S3_ENABLED is 'true', '1', 'yes', 'on', S3 is enabled.
 * - If S3_ENABLED is not set, S3 is automatically enabled whenever credentials and bucket are present.
 */
export function isS3Enabled(): boolean {
  const rawEnabled = cleanEnvValue(process.env.S3_ENABLED);

  if (rawEnabled !== undefined) {
    const lower = rawEnabled.toLowerCase();
    if (lower === 'false' || lower === '0' || lower === 'no' || lower === 'off') {
      return false;
    }
    if (lower === 'true' || lower === '1' || lower === 'yes' || lower === 'on') {
      return true;
    }
  }

  return isS3Configured();
}

let cachedS3Client: S3Client | null = null;

/**
 * Returns a cached singleton S3Client instance.
 */
export function getS3Client(): S3Client {
  if (cachedS3Client) {
    return cachedS3Client;
  }

  const config = getS3Config();

  const clientConfig: any = {
    region: config.region,
  };

  if (config.accessKeyId && config.secretAccessKey) {
    clientConfig.credentials = {
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
    };
  }

  // Only pass endpoint if an explicit custom non-AWS endpoint is required
  if (config.endpoint) {
    clientConfig.endpoint = config.endpoint;
  }

  // Only pass forcePathStyle if explicitly true (e.g. MinIO / LocalStack)
  if (config.forcePathStyle) {
    clientConfig.forcePathStyle = true;
  }

  cachedS3Client = new S3Client(clientConfig);
  return cachedS3Client;
}

/**
 * Resets the cached S3Client instance (primarily for testing).
 */
export function resetS3Client(): void {
  cachedS3Client = null;
}

/**
 * Sanitizes error messages to prevent accidental exposure of keys or secrets.
 */
export function sanitizeS3Error(error: any): string {
  if (!error) return 'Unknown S3 error';
  const msg = typeof error === 'string' ? error : error.message || error.name || 'S3 request failed';
  // Redact potential access keys, secrets, or bearer tokens
  return msg
    .replace(/(AKIA[A-Z0-9]{16})/gi, '[REDACTED_AWS_KEY]')
    .replace(/([A-Za-z0-9/+=]{40})/g, '[REDACTED_SECRET]')
    .replace(/(Bearer\s+[A-Za-z0-9._-]+)/gi, 'Bearer [REDACTED]');
}

/**
 * Converts a readable stream to a Buffer.
 */
async function streamToBuffer(stream: any): Promise<Buffer> {
  if (Buffer.isBuffer(stream)) {
    return stream;
  }
  if (stream instanceof Uint8Array) {
    return Buffer.from(stream);
  }

  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    stream.on('data', (chunk: any) => chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)));
    stream.on('error', (err: any) => reject(err));
    stream.on('end', () => resolve(Buffer.concat(chunks)));
  });
}

/**
 * Uploads a file buffer to private S3 storage.
 */
export async function uploadObjectToS3(params: {
  key: string;
  body: Buffer | Uint8Array;
  contentType: string;
  metadata?: Record<string, string>;
}): Promise<{
  key: string;
  bucket: string;
  etag?: string;
  contentType: string;
}> {
  const config = getS3Config();
  if (!config.bucket) {
    throw new Error('S3 upload failed: AWS_S3_BUCKET is not configured.');
  }

  const client = getS3Client();

  const commandInput: PutObjectCommandInput = {
    Bucket: config.bucket,
    Key: params.key,
    Body: params.body,
    ContentType: params.contentType,
    Metadata: params.metadata,
  };

  try {
    const response = await client.send(new PutObjectCommand(commandInput));
    return {
      key: params.key,
      bucket: config.bucket,
      etag: response.ETag,
      contentType: params.contentType,
    };
  } catch (err: any) {
    const safeError = sanitizeS3Error(err);
    console.error(`S3 Upload Error for key "${params.key}":`, safeError);
    throw new Error(`S3 upload failed for ${params.key}: ${safeError}`);
  }
}

/**
 * Retrieves an object buffer and metadata from S3.
 * Returns null if the object is not found (404/NoSuchKey).
 */
export async function getObjectFromS3(key: string): Promise<{
  buffer: Buffer;
  contentType?: string;
  contentLength?: number;
  etag?: string;
  lastModified?: Date;
} | null> {
  const config = getS3Config();
  if (!config.bucket) {
    return null;
  }

  const client = getS3Client();

  try {
    const response = await client.send(
      new GetObjectCommand({
        Bucket: config.bucket,
        Key: key,
      })
    );

    if (!response.Body) {
      return null;
    }

    const buffer = await streamToBuffer(response.Body);

    return {
      buffer,
      contentType: response.ContentType,
      contentLength: response.ContentLength ?? buffer.length,
      etag: response.ETag,
      lastModified: response.LastModified,
    };
  } catch (err: any) {
    if (err.name === 'NoSuchKey' || err.$metadata?.httpStatusCode === 404) {
      return null;
    }
    const safeError = sanitizeS3Error(err);
    console.warn(`S3 GetObject Warning for key "${key}":`, safeError);
    return null;
  }
}

/**
 * Checks if an object exists in S3 without downloading its body.
 */
export async function checkObjectExistsInS3(key: string): Promise<boolean> {
  const config = getS3Config();
  if (!config.bucket) {
    return false;
  }

  const client = getS3Client();

  try {
    await client.send(
      new HeadObjectCommand({
        Bucket: config.bucket,
        Key: key,
      })
    );
    return true;
  } catch (err: any) {
    if (err.name === 'NotFound' || err.name === 'NoSuchKey' || err.$metadata?.httpStatusCode === 404) {
      return false;
    }
    return false;
  }
}

/**
 * Deletes an object from S3.
 */
export async function deleteObjectFromS3(key: string): Promise<boolean> {
  const config = getS3Config();
  if (!config.bucket) {
    return false;
  }

  const client = getS3Client();

  try {
    await client.send(
      new DeleteObjectCommand({
        Bucket: config.bucket,
        Key: key,
      })
    );
    return true;
  } catch (err: any) {
    const safeError = sanitizeS3Error(err);
    console.warn(`S3 Delete Warning for key "${key}":`, safeError);
    return false;
  }
}
