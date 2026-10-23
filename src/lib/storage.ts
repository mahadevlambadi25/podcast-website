import fs from 'fs';
import path from 'path';
import {
  isS3Enabled,
  uploadObjectToS3,
  getObjectFromS3,
  deleteObjectFromS3,
} from './s3';

export const MIME_MAP: Record<string, string> = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.avif': 'image/avif',
  '.mp3': 'audio/mpeg',
  '.wav': 'audio/wav',
  '.m4a': 'audio/x-m4a',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.pdf': 'application/pdf',
};

export function getMimeType(filename: string): string {
  const ext = path.extname(filename).toLowerCase();
  return MIME_MAP[ext] || 'application/octet-stream';
}

/**
 * Returns the primary storage directory for uploaded media.
 * Supports:
 * 1. Explicit MEDIA_STORAGE_DIR environment variable (auto-creates if missing)
 * 2. Render native persistent disk mounted at /var/data/media
 * 3. Render docker persistent disk mounted at /app/media
 * 4. Local project directory: process.cwd()/media
 * 5. Fallback: process.cwd()/public/media
 */
export function getPrimaryMediaDir(): string {
  if (process.env.MEDIA_STORAGE_DIR) {
    const dir = path.resolve(process.env.MEDIA_STORAGE_DIR);
    if (!fs.existsSync(dir)) {
      try {
        fs.mkdirSync(dir, { recursive: true });
      } catch {
        // Fallback below
      }
    }
    if (fs.existsSync(dir)) {
      return dir;
    }
  }

  // Render native runtime persistent disk (/var/data)
  if (fs.existsSync('/var/data/media')) {
    return '/var/data/media';
  }
  if (fs.existsSync('/var/data')) {
    const varMedia = '/var/data/media';
    try {
      fs.mkdirSync(varMedia, { recursive: true });
      return varMedia;
    } catch {
      // Continue to next fallback
    }
  }

  // Docker or legacy Render persistent disk
  if (fs.existsSync('/app/media')) {
    return '/app/media';
  }

  // Local media dir
  const localMedia = path.resolve(process.cwd(), 'media');
  if (!fs.existsSync(localMedia)) {
    try {
      fs.mkdirSync(localMedia, { recursive: true });
    } catch {
      // Fallback below
    }
  }

  return localMedia;
}

/**
 * Returns candidate directories where media files might reside.
 */
export function getMediaSearchDirs(): string[] {
  const dirs: string[] = [];

  if (process.env.MEDIA_STORAGE_DIR) {
    dirs.push(path.resolve(process.env.MEDIA_STORAGE_DIR));
  }

  dirs.push('/var/data/media');
  dirs.push('/var/data');
  dirs.push('/app/media');
  dirs.push(path.resolve(process.cwd(), 'media'));
  dirs.push(path.resolve(process.cwd(), 'public', 'media'));
  dirs.push(path.resolve(process.cwd(), 'public'));

  return Array.from(new Set(dirs));
}

/**
 * Saves a media file buffer to storage.
 * - When S3 is enabled: Uploads directly to AWS S3 first! Does not attempt to write to public/media.
 *   Only after S3 succeeds, best-effort mirrors to persistent disk (/var/data/media) if available.
 *   If S3 fails, throws immediately (never silently falls back to local disk).
 * - When S3 is not enabled: Writes to primary local storage directory (/var/data/media or media/).
 *   In non-production development environments, best-effort mirrors to public/media if writable.
 */
export async function saveMediaFile(
  buffer: Buffer,
  filename: string,
  contentType?: string
): Promise<{ filename: string; filePath: string; s3Key?: string; s3Bucket?: string }> {
  const sanitizedFilename = path.basename(filename);

  // 1. S3-ENABLED PATH: Upload directly to private AWS S3 bucket
  if (isS3Enabled()) {
    const mime = contentType || getMimeType(sanitizedFilename);
    const s3Result = await uploadObjectToS3({
      key: sanitizedFilename,
      body: buffer,
      contentType: mime,
    });

    // Best-effort local persistent disk cache ONLY if a dedicated persistent directory exists
    // (Never write to /app/public/media in production)
    let localCachePath = '';
    try {
      if (process.env.MEDIA_STORAGE_DIR || fs.existsSync('/var/data/media')) {
        const primaryDir = getPrimaryMediaDir();
        if (fs.existsSync(primaryDir)) {
          const cachePath = path.join(primaryDir, sanitizedFilename);
          fs.writeFileSync(cachePath, buffer);
          localCachePath = cachePath;
        }
      }
    } catch {
      // Local caching failure is non-fatal: S3 is already the durable source of truth
    }

    return {
      filename: sanitizedFilename,
      filePath: localCachePath || s3Result.key,
      s3Key: s3Result.key,
      s3Bucket: s3Result.bucket,
    };
  }

  // 2. LOCAL-ONLY PATH: S3 is not enabled, store in primary local disk directory
  const primaryDir = getPrimaryMediaDir();
  if (!fs.existsSync(primaryDir)) {
    fs.mkdirSync(primaryDir, { recursive: true });
  }
  const targetPath = path.join(primaryDir, sanitizedFilename);
  fs.writeFileSync(targetPath, buffer);

  // In local development only (NODE_ENV !== 'production'), optionally mirror to public/media if writable
  if (process.env.NODE_ENV !== 'production') {
    try {
      const publicMediaDir = path.resolve(process.cwd(), 'public', 'media');
      if (!fs.existsSync(publicMediaDir)) {
        fs.mkdirSync(publicMediaDir, { recursive: true });
      }
      const publicTargetPath = path.join(publicMediaDir, sanitizedFilename);
      if (publicTargetPath !== targetPath) {
        fs.writeFileSync(publicTargetPath, buffer);
      }
    } catch {
      // Non-fatal if public/media is not writable
    }
  }

  return { filename: sanitizedFilename, filePath: targetPath };
}

/**
 * Finds a media file path across all search directories.
 * Returns absolute path if found, or null if not found.
 */
export function findMediaFile(filename: string): string | null {
  const cleanName = path.basename(filename);
  const dirs = getMediaSearchDirs();

  // 1. Exact match
  for (const dir of dirs) {
    if (!fs.existsSync(dir)) continue;
    const candidate = path.join(dir, cleanName);
    if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) {
      return candidate;
    }
  }

  // 2. Base name fallback (ignoring timestamp suffix if file was mirrored with different timestamp)
  const ext = path.extname(cleanName);
  const nameWithoutExt = path.basename(cleanName, ext);
  const baseName = nameWithoutExt.replace(/-\d{10,}$/, '');

  if (baseName && baseName !== nameWithoutExt) {
    for (const dir of dirs) {
      if (!fs.existsSync(dir)) continue;
      try {
        const files = fs.readdirSync(dir);
        // Find most relevant file sharing the same base name and extension
        const match = files.find(
          (f) => f.startsWith(baseName) && f.endsWith(ext) && fs.statSync(path.join(dir, f)).isFile()
        );
        if (match) {
          return path.join(dir, match);
        }
      } catch {
        // Continue searching other directories
      }
    }
  }

  return null;
}

/**
 * Resolves a media file from S3 or local storage.
 * Priority:
 * 1. S3 (if enabled)
 * 2. Local disk search directories
 */
export async function resolveMediaFile(filename: string): Promise<{
  buffer: Buffer;
  contentType: string;
  contentLength: number;
  source: 's3' | 'disk';
  etag?: string;
  lastModified?: Date;
} | null> {
  const cleanName = path.basename(filename);

  // 1. Check S3 if enabled
  if (isS3Enabled()) {
    try {
      const s3Object = await getObjectFromS3(cleanName);
      if (s3Object) {
        const contentType = s3Object.contentType || getMimeType(cleanName);
        const contentLength = s3Object.contentLength || s3Object.buffer.length;

        // Asynchronously mirror to local disk cache for instant subsequent reads (if persistent disk is mounted)
        try {
          if (process.env.MEDIA_STORAGE_DIR || fs.existsSync('/var/data/media')) {
            const primaryDir = getPrimaryMediaDir();
            if (fs.existsSync(primaryDir)) {
              const targetPath = path.join(primaryDir, cleanName);
              if (!fs.existsSync(targetPath)) {
                fs.writeFileSync(targetPath, s3Object.buffer);
              }
            }
          }
        } catch {
          // Non-fatal cache write failure
        }

        return {
          buffer: s3Object.buffer,
          contentType,
          contentLength,
          source: 's3',
          etag: s3Object.etag,
          lastModified: s3Object.lastModified,
        };
      }
    } catch (s3Err) {
      console.warn(`S3 resolve warning for "${cleanName}":`, s3Err);
    }
  }

  // 2. Check local disk directories
  const localPath = findMediaFile(cleanName);
  if (localPath && fs.existsSync(localPath)) {
    const buffer = fs.readFileSync(localPath);
    return {
      buffer,
      contentType: getMimeType(cleanName),
      contentLength: buffer.length,
      source: 'disk',
    };
  }

  return null;
}

/**
 * Deletes a media file from S3 and all local candidate locations.
 */
export async function deleteMediaFile(filename: string): Promise<boolean> {
  const cleanName = path.basename(filename);
  let deleted = false;

  // 1. Delete from S3 if enabled
  if (isS3Enabled()) {
    try {
      const s3Deleted = await deleteObjectFromS3(cleanName);
      if (s3Deleted) {
        deleted = true;
      }
    } catch (s3Err) {
      console.warn(`Failed to delete S3 object "${cleanName}":`, s3Err);
    }
  }

  // 2. Delete from local disk locations
  const dirs = getMediaSearchDirs();
  for (const dir of dirs) {
    if (!fs.existsSync(dir)) continue;
    const target = path.join(dir, cleanName);
    if (fs.existsSync(target)) {
      try {
        fs.unlinkSync(target);
        deleted = true;
      } catch (err) {
        console.warn(`Could not delete file at ${target}:`, err);
      }
    }
  }

  return deleted;
}
