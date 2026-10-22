/**
 * URL normalization and validation utilities for guest profile links,
 * portrait images, and external destinations.
 */

const DANGEROUS_SCHEMES_REGEX = /^(javascript|data|vbscript|file):/i;

/**
 * Normalizes an external website or social profile URL.
 * Automatically adds 'https://' if the user entered a domain without protocol (e.g. linkedin.com/in/...).
 * Rejects non-HTTP(S) schemes (such as javascript: or data:) to prevent XSS.
 */
export function normalizeUrl(rawUrl?: string | null): string | null {
  if (!rawUrl || typeof rawUrl !== 'string') {
    return null;
  }

  const trimmed = rawUrl.trim();
  if (!trimmed) {
    return null;
  }

  // Reject dangerous schemes immediately
  if (DANGEROUS_SCHEMES_REGEX.test(trimmed)) {
    return null;
  }

  let candidate = trimmed;

  // Protocol-relative URL: //example.com -> https://example.com
  if (candidate.startsWith('//')) {
    candidate = `https:${candidate}`;
  } else if (!candidate.includes('://')) {
    // Missing protocol: linkedin.com/in/name -> https://linkedin.com/in/name
    candidate = `https://${candidate}`;
  }

  try {
    const parsed = new URL(candidate);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return null;
    }

    // Must have a valid hostname (not empty and contains valid characters)
    if (!parsed.hostname || parsed.hostname.includes(' ') || !parsed.hostname.includes('.')) {
      // Exception: localhost is allowed for local development
      if (parsed.hostname !== 'localhost') {
        return null;
      }
    }

    return parsed.href;
  } catch {
    return null;
  }
}

/**
 * Normalizes an image URL for portraits.
 * Supports relative URLs (e.g. /placeholders/portrait-placeholder.svg or /media/image.jpg)
 * and absolute HTTP/HTTPS URLs.
 */
export function normalizeImageUrl(rawUrl?: string | null): string | null {
  if (!rawUrl || typeof rawUrl !== 'string') {
    return null;
  }

  const trimmed = rawUrl.trim();
  if (!trimmed) {
    return null;
  }

  if (DANGEROUS_SCHEMES_REGEX.test(trimmed)) {
    return null;
  }

  // Relative path
  if (trimmed.startsWith('/')) {
    // Avoid double slashes or protocol-relative trick
    if (trimmed.startsWith('//')) {
      return normalizeUrl(trimmed);
    }
    return trimmed;
  }

  // Data URIs are generally discouraged for arbitrary profile portraits, but if starts with data:image/
  if (trimmed.startsWith('data:image/')) {
    return trimmed;
  }

  return normalizeUrl(trimmed);
}

/**
 * Checks if a given URL is external (starts with http:// or https://)
 */
export function isExternalUrl(url?: string | null): boolean {
  if (!url || typeof url !== 'string') return false;
  return url.startsWith('http://') || url.startsWith('https://');
}
