import { describe, it, expect } from 'vitest';
import { normalizeUrl, normalizeImageUrl, isExternalUrl } from './url';

describe('normalizeUrl', () => {
  it('returns null for null, undefined, or empty string', () => {
    expect(normalizeUrl(null)).toBeNull();
    expect(normalizeUrl(undefined)).toBeNull();
    expect(normalizeUrl('')).toBeNull();
    expect(normalizeUrl('   ')).toBeNull();
  });

  it('preserves valid https and http URLs', () => {
    expect(normalizeUrl('https://linkedin.com/in/john-doe')).toBe('https://linkedin.com/in/john-doe');
    expect(normalizeUrl('http://mycompany.com')).toBe('http://mycompany.com/');
    expect(normalizeUrl('https://example.com/path?foo=bar#section')).toBe('https://example.com/path?foo=bar#section');
  });

  it('normalizes domains without protocol by adding https://', () => {
    expect(normalizeUrl('linkedin.com/in/john-doe')).toBe('https://linkedin.com/in/john-doe');
    expect(normalizeUrl('www.mycompany.com')).toBe('https://www.mycompany.com/');
    expect(normalizeUrl('subdomain.domain.org/about')).toBe('https://subdomain.domain.org/about');
  });

  it('normalizes protocol-relative URLs', () => {
    expect(normalizeUrl('//linkedin.com/in/jane')).toBe('https://linkedin.com/in/jane');
  });

  it('rejects unsafe schemes such as javascript:, data:, and vbscript:', () => {
    expect(normalizeUrl('javascript:alert(1)')).toBeNull();
    expect(normalizeUrl('data:text/html,<script>alert(1)</script>')).toBeNull();
    expect(normalizeUrl('vbscript:msgbox(1)')).toBeNull();
    expect(normalizeUrl('file:///etc/passwd')).toBeNull();
  });

  it('rejects invalid inputs without a dot or valid hostname', () => {
    expect(normalizeUrl('not-a-domain')).toBeNull();
    expect(normalizeUrl('http://')).toBeNull();
  });

  it('permits localhost for development', () => {
    expect(normalizeUrl('http://localhost:3000/test')).toBe('http://localhost:3000/test');
  });
});

describe('normalizeImageUrl', () => {
  it('preserves valid relative paths', () => {
    expect(normalizeImageUrl('/placeholders/portrait-placeholder.svg')).toBe('/placeholders/portrait-placeholder.svg');
    expect(normalizeImageUrl('/media/profile-123.jpg')).toBe('/media/profile-123.jpg');
  });

  it('normalizes external image URLs', () => {
    expect(normalizeImageUrl('https://images.unsplash.com/photo-123')).toBe('https://images.unsplash.com/photo-123');
    expect(normalizeImageUrl('images.unsplash.com/photo-123')).toBe('https://images.unsplash.com/photo-123');
  });

  it('rejects unsafe image URLs', () => {
    expect(normalizeImageUrl('javascript:alert(1)')).toBeNull();
  });
});

describe('isExternalUrl', () => {
  it('correctly identifies external vs relative URLs', () => {
    expect(isExternalUrl('https://example.com')).toBe(true);
    expect(isExternalUrl('http://example.com')).toBe(true);
    expect(isExternalUrl('/placeholders/portrait.svg')).toBe(false);
    expect(isExternalUrl(null)).toBe(false);
  });
});
