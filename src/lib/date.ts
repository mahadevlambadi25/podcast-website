/**
 * Unified Date and Timestamp Normalizer for PostgreSQL & APIs
 * Ensures all timestamps are valid ISO 8601 UTC strings, preventing:
 * PostgreSQL 22023 (time zone "gmt+0530" not recognized) errors.
 */

export function normalizeIsoTimestamp(input: unknown): string | null {
  if (input === null || input === undefined || input === '') {
    return null;
  }

  if (input instanceof Date) {
    return isNaN(input.getTime()) ? null : input.toISOString();
  }

  if (typeof input === 'number') {
    const d = new Date(input);
    return isNaN(d.getTime()) ? null : d.toISOString();
  }

  if (typeof input === 'string') {
    const trimmed = input.trim();
    if (!trimmed) return null;

    // 1. Direct standard Date parsing (works for standard ISO 8601 strings)
    const directDate = new Date(trimmed);
    if (!isNaN(directDate.getTime())) {
      return directDate.toISOString();
    }

    // 2. Handle browser Date.toString() strings containing GMT+0530, GMT-0400, etc.
    // e.g., "Tue Oct 13 2026 17:12:56 GMT+0530 (India Standard Time)"
    // or "2026-10-13 17:12:56 GMT+0530"
    const cleaned = trimmed.replace(/\s*\([^)]*\)\s*$/, ''); // strip "(India Standard Time)"
    const gmtFixed = cleaned.replace(
      /GMT([+-])(\d{2})(\d{2})?/i,
      (_, sign, hours, mins) => `${sign}${hours}:${mins || '00'}`
    );

    const fixedDate = new Date(gmtFixed);
    if (!isNaN(fixedDate.getTime())) {
      return fixedDate.toISOString();
    }

    // 3. Handle datetime-local input format without timezone: "YYYY-MM-DDTHH:mm"
    if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?$/.test(trimmed)) {
      const localParsed = new Date(trimmed);
      if (!isNaN(localParsed.getTime())) {
        return localParsed.toISOString();
      }
    }
  }

  return null;
}

/**
 * Returns a guaranteed valid ISO 8601 UTC string.
 * Falls back to current time if input is missing or invalid.
 */
export function toUtcIsoString(input?: unknown): string {
  const normalized = normalizeIsoTimestamp(input);
  return normalized || new Date().toISOString();
}
