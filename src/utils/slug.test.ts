import { describe, it, expect } from 'vitest';
import { slugify, ensureUniqueSlug } from './slug';

describe('slugify', () => {
  it('converts simple strings to clean slugs', () => {
    expect(slugify('Satya Nadella')).toBe('satya-nadella');
    expect(slugify('Jensen Huang')).toBe('jensen-huang');
  });

  it('handles accents and diacritics', () => {
    expect(slugify('Renée François-Müller')).toBe('renee-francois-muller');
    expect(slugify('José María Aznar')).toBe('jose-maria-aznar');
  });

  it('strips punctuation, quotes, and symbols', () => {
    expect(slugify('John D. Rockefeller, Jr.')).toBe('john-d-rockefeller-jr');
    expect(slugify('Episode #42: The Future & AI!')).toBe('episode-42-the-future-ai');
  });

  it('collapses multiple whitespace and dashes', () => {
    expect(slugify('   A   B   C   ')).toBe('a-b-c');
    expect(slugify('test---double--dash')).toBe('test-double-dash');
  });

  it('handles empty or non-string values gracefully', () => {
    expect(slugify('')).toBe('');
    // @ts-expect-error testing null safety
    expect(slugify(null)).toBe('');
  });
});

describe('ensureUniqueSlug', () => {
  it('returns candidate when not conflicting', () => {
    expect(ensureUniqueSlug('Satya Nadella', ['tim-cook', 'sundar-pichai'])).toBe('satya-nadella');
  });

  it('appends -2 for first duplicate', () => {
    expect(ensureUniqueSlug('Satya Nadella', ['satya-nadella'])).toBe('satya-nadella-2');
  });

  it('increments counter when -2 already exists', () => {
    expect(ensureUniqueSlug('Satya Nadella', ['satya-nadella', 'satya-nadella-2'])).toBe('satya-nadella-3');
  });
});
