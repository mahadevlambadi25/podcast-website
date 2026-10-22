import { describe, it, expect } from 'vitest';
import path from 'path';
import fs from 'fs';
import { findMediaFile, getMediaSearchDirs } from '../src/lib/storage';
import { getYouTubeThumbnailUrl, isSampleVideoId } from '../src/utils/youtube';

describe('Episode Thumbnail & Storage Resilience', () => {
  it('includes primary search directories including public/media and persistent disk mounts', () => {
    const dirs = getMediaSearchDirs();
    expect(dirs.some((d) => d.includes('public') && d.includes('media'))).toBe(true);
    expect(dirs.some((d) => d.includes('/var/data/media') || d.includes('/app/media'))).toBe(true);
  });

  it('locates media file via exact match or base-name fallback', () => {
    // Check that our uploaded thumbnail is discoverable
    const targetFile = 'gemini_generated_image_xsmlesxsmlesxsml-1792040513909.png';
    const foundPath = findMediaFile(targetFile);
    expect(foundPath).not.toBeNull();
    expect(fs.existsSync(foundPath!)).toBe(true);
  });

  it('supports fuzzy fallback when timestamp suffix differs', () => {
    // If an asset was requested with a different timestamp but shares the base name
    const variantFile = 'gemini_generated_image_xsmlesxsmlesxsml-9999999999999.png';
    const foundPath = findMediaFile(variantFile);
    expect(foundPath).not.toBeNull();
    expect(fs.existsSync(foundPath!)).toBe(true);
    expect(path.basename(foundPath!)).toContain('gemini_generated_image_xsmlesxsmlesxsml');
  });

  it('generates YouTube thumbnail fallbacks when custom thumbnail is unavailable', () => {
    const validVideoId = 'JqwfZdW4WvI';
    const maxres = getYouTubeThumbnailUrl(validVideoId, 'maxres');
    const hq = getYouTubeThumbnailUrl(validVideoId, 'hq');

    expect(maxres).toBe('https://i.ytimg.com/vi/JqwfZdW4WvI/maxresdefault.jpg');
    expect(hq).toBe('https://i.ytimg.com/vi/JqwfZdW4WvI/hqdefault.jpg');
  });

  it('falls back to episode placeholder for sample or invalid video IDs', () => {
    expect(getYouTubeThumbnailUrl('', 'maxres')).toBe('/placeholders/episode-placeholder.svg');
    expect(getYouTubeThumbnailUrl('invalid', 'maxres')).toBe('/placeholders/episode-placeholder.svg');
    expect(isSampleVideoId('sample-placeholder')).toBe(true);
  });
});
