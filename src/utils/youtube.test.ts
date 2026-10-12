import { describe, it, expect } from 'vitest';
import { extractYouTubeId, getYouTubeThumbnailUrl, getYouTubeEmbedUrl } from './youtube';

describe('extractYouTubeId', () => {
  it('extracts ID from standard watch URL', () => {
    expect(extractYouTubeId('https://www.youtube.com/watch?v=dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ');
    expect(extractYouTubeId('https://youtube.com/watch?v=dQw4w9WgXcQ&t=10s')).toBe('dQw4w9WgXcQ');
    expect(extractYouTubeId('http://m.youtube.com/watch?v=dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ');
  });

  it('extracts ID from youtu.be short URL', () => {
    expect(extractYouTubeId('https://youtu.be/dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ');
    expect(extractYouTubeId('https://youtu.be/dQw4w9WgXcQ?t=42')).toBe('dQw4w9WgXcQ');
  });

  it('extracts ID from embed URLs', () => {
    expect(extractYouTubeId('https://www.youtube.com/embed/dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ');
    expect(extractYouTubeId('https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ');
  });

  it('accepts raw 11-char video ID', () => {
    expect(extractYouTubeId('dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ');
  });

  it('rejects shorts by default unless explicitly allowed', () => {
    expect(extractYouTubeId('https://www.youtube.com/shorts/dQw4w9WgXcQ')).toBeNull();
    expect(extractYouTubeId('https://www.youtube.com/shorts/dQw4w9WgXcQ', { allowShorts: true })).toBe('dQw4w9WgXcQ');
  });

  it('rejects arbitrary HTML and script tags', () => {
    expect(extractYouTubeId('<iframe src="https://evil.com"></iframe>')).toBeNull();
    expect(extractYouTubeId('<script>alert("xss")</script>')).toBeNull();
  });

  it('rejects invalid or malformed inputs', () => {
    expect(extractYouTubeId('')).toBeNull();
    expect(extractYouTubeId(null)).toBeNull();
    expect(extractYouTubeId(undefined)).toBeNull();
    expect(extractYouTubeId('https://vimeo.com/123456')).toBeNull();
    expect(extractYouTubeId('not-a-valid-id-too-long-here')).toBeNull();
    expect(extractYouTubeId('short')).toBeNull();
  });
});

describe('getYouTubeThumbnailUrl', () => {
  it('generates correct thumbnail URLs for valid IDs', () => {
    expect(getYouTubeThumbnailUrl('dQw4w9WgXcQ')).toBe('https://i.ytimg.com/vi/dQw4w9WgXcQ/maxresdefault.jpg');
    expect(getYouTubeThumbnailUrl('dQw4w9WgXcQ', 'hq')).toBe('https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg');
  });

  it('returns fallback for invalid IDs', () => {
    expect(getYouTubeThumbnailUrl('invalid')).toBe('/placeholders/episode-placeholder.svg');
  });
});

describe('getYouTubeEmbedUrl', () => {
  it('generates privacy-enhanced embed URL', () => {
    expect(getYouTubeEmbedUrl('dQw4w9WgXcQ')).toBe('https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ?rel=0&modestbranding=1');
  });
});
