/**
 * Slug generation and formatting utility
 * Normalizes diacritics, strips punctuation, handles initials and spaces.
 */

export function slugify(text: string): string {
  if (!text || typeof text !== 'string') return '';

  return text
    .normalize('NFD') // decompose accents
    .replace(/[\u0300-\u036f]/g, '') // remove accent marks
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '') // remove special characters
    .replace(/[\s_]+/g, '-') // replace spaces & underscores with -
    .replace(/-+/g, '-') // collapse consecutive dashes
    .replace(/^-+|-+$/g, ''); // trim leading/trailing dashes
}

export const generateSlug = slugify;

/**
 * Helper to generate a unique slug candidate given existing slugs.
 * Appends -2, -3, etc. if conflict exists.
 */
export function ensureUniqueSlug(candidate: string, existingSlugs: string[]): string {
  const base = slugify(candidate) || 'item';
  if (!existingSlugs.includes(base)) {
    return base;
  }

  let counter = 2;
  while (existingSlugs.includes(`${base}-${counter}`)) {
    counter++;
  }
  return `${base}-${counter}`;
}
