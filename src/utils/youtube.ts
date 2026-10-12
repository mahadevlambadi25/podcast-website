/**
 * YouTube Utility Functions
 * Validates URLs and extracts the 11-character video ID securely.
 */

// YouTube IDs are strictly 11 alphanumeric characters, dashes, or underscores.
const YOUTUBE_ID_REGEX = /^[a-zA-Z0-9_-]{11}$/;

/**
 * Extracts and validates the 11-character YouTube video ID from supported URL patterns.
 * Supported patterns:
 * - https://www.youtube.com/watch?v=XXXXXXXXXXX
 * - https://youtube.com/watch?v=XXXXXXXXXXX
 * - https://m.youtube.com/watch?v=XXXXXXXXXXX
 * - https://youtu.be/XXXXXXXXXXX
 * - https://www.youtube.com/embed/XXXXXXXXXXX
 * - https://www.youtube-nocookie.com/embed/XXXXXXXXXXX
 * 
 * Rejects:
 * - Arbitrary HTML/iframes
 * - Malformed query strings
 * - Invalid length or characters
 * - Shorts (unless allowShorts is explicitly true)
 */
export const SAMPLE_VIDEO_ID = 'sample-placeholder';

export function isSampleVideoId(id: string | null | undefined): boolean {
  if (!id) return false;
  return (
    id === SAMPLE_VIDEO_ID ||
    id === 'sample_demo' ||
    id === 'dQw4w9WgXcQ' ||
    id.toLowerCase().includes('placeholder') ||
    id.toLowerCase().includes('sample')
  );
}

export function extractYouTubeId(urlOrInput: string | null | undefined, options: { allowShorts?: boolean } = {}): string | null {
  if (!urlOrInput || typeof urlOrInput !== 'string') {
    return null;
  }

  const trimmed = urlOrInput.trim();

  // If explicit sample demo/placeholder token
  if (
    trimmed === SAMPLE_VIDEO_ID ||
    trimmed === 'sample_demo' ||
    trimmed.includes('sample-placeholder') ||
    trimmed.includes('sample_demo')
  ) {
    return SAMPLE_VIDEO_ID;
  }

  // If input is directly an 11-char valid ID
  if (YOUTUBE_ID_REGEX.test(trimmed)) {
    return trimmed;
  }

  // Reject if contains HTML tags or scripts
  if (/<[a-z][\s\S]*>/i.test(trimmed)) {
    return null;
  }

  try {
    // Add protocol if missing
    let formattedUrl = trimmed;
    if (!formattedUrl.startsWith('http://') && !formattedUrl.startsWith('https://')) {
      formattedUrl = 'https://' + formattedUrl;
    }

    const parsed = new URL(formattedUrl);
    const host = parsed.hostname.toLowerCase().replace(/^www\./, '');

    // Case 1: youtu.be/VIDEO_ID
    if (host === 'youtu.be') {
      const pathname = parsed.pathname.slice(1).split('/')[0];
      if (YOUTUBE_ID_REGEX.test(pathname)) {
        return pathname;
      }
      return null;
    }

    // Case 2: youtube.com or youtube-nocookie.com or m.youtube.com
    if (host === 'youtube.com' || host === 'youtube-nocookie.com' || host === 'm.youtube.com') {
      // /watch?v=VIDEO_ID
      if (parsed.pathname === '/watch') {
        const v = parsed.searchParams.get('v');
        if (v && YOUTUBE_ID_REGEX.test(v)) {
          return v;
        }
        return null;
      }

      // /embed/VIDEO_ID
      if (parsed.pathname.startsWith('/embed/')) {
        const parts = parsed.pathname.split('/');
        const id = parts[2];
        if (id && YOUTUBE_ID_REGEX.test(id)) {
          return id;
        }
        return null;
      }

      // /shorts/VIDEO_ID (optional)
      if (parsed.pathname.startsWith('/shorts/')) {
        if (!options.allowShorts) {
          return null;
        }
        const parts = parsed.pathname.split('/');
        const id = parts[2];
        if (id && YOUTUBE_ID_REGEX.test(id)) {
          return id;
        }
        return null;
      }
    }

    return null;
  } catch {
    return null;
  }
}

/**
 * Returns a high-res or max-res YouTube thumbnail URL for a given video ID.
 */
export function getYouTubeThumbnailUrl(videoId: string, quality: 'maxres' | 'hq' | 'mq' = 'maxres'): string {
  if (!videoId || !YOUTUBE_ID_REGEX.test(videoId)) {
    return '/placeholders/episode-placeholder.svg';
  }

  if (quality === 'hq') {
    return `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
  }
  if (quality === 'mq') {
    return `https://i.ytimg.com/vi/${videoId}/mqdefault.jpg`;
  }
  return `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`;
}

/**
 * Returns the privacy-enhanced embed URL for the nocookie domain.
 */
export function getYouTubeEmbedUrl(videoId: string): string {
  return `https://www.youtube-nocookie.com/embed/${videoId}?rel=0&modestbranding=1`;
}
