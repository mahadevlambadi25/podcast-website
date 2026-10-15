import fs from 'fs';
import path from 'path';

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
 * In development, also mirrors to public/media for instant static availability.
 */
export async function saveMediaFile(
  buffer: Buffer,
  filename: string
): Promise<{ filename: string; filePath: string }> {
  const primaryDir = getPrimaryMediaDir();
  if (!fs.existsSync(primaryDir)) {
    fs.mkdirSync(primaryDir, { recursive: true });
  }

  const sanitizedFilename = path.basename(filename);
  const targetPath = path.join(primaryDir, sanitizedFilename);
  fs.writeFileSync(targetPath, buffer);

  // In local development or testing, also mirror to public/media
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
    // Non-fatal if mirroring fails
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

  for (const dir of dirs) {
    if (!fs.existsSync(dir)) continue;
    const candidate = path.join(dir, cleanName);
    if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) {
      return candidate;
    }
  }

  return null;
}

/**
 * Deletes a media file from all candidate locations.
 */
export async function deleteMediaFile(filename: string): Promise<boolean> {
  const cleanName = path.basename(filename);
  const dirs = getMediaSearchDirs();
  let deleted = false;

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
