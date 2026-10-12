import { describe, it, expect } from 'vitest';
import {
  normalizeSearchTerm,
  scoreGuestMatch,
  scoreEpisodeMatch,
  searchCollections,
  SearchGuestItem,
  SearchEpisodeItem,
} from './search';

describe('normalizeSearchTerm', () => {
  it('strips accents and normalizes casing and punctuation', () => {
    expect(normalizeSearchTerm('Renée Müller')).toBe('renee muller');
    expect(normalizeSearchTerm('  Hello, World!  ')).toBe('hello world');
    expect(normalizeSearchTerm('A&B Inc.')).toBe('a b inc');
  });
});

describe('scoreGuestMatch', () => {
  const sampleGuest: SearchGuestItem = {
    id: 'g-1',
    fullName: 'Elena Rostova',
    alternateNames: ['Dr. Elena Rostova', 'E. Rostova'],
    slug: 'elena-rostova',
    role: 'Founder & CEO',
    company: 'Quantum Dynamics',
    shortOverview: 'Leading advances in quantum computing architectures and neuromorphic networks.',
  };

  it('ranks exact full name match highest', () => {
    const exactScore = scoreGuestMatch(sampleGuest, 'elena rostova');
    const partialScore = scoreGuestMatch(sampleGuest, 'elena');
    const companyScore = scoreGuestMatch(sampleGuest, 'quantum');

    expect(exactScore).toBe(1000);
    expect(exactScore).toBeGreaterThan(partialScore);
    expect(partialScore).toBeGreaterThan(companyScore);
  });

  it('matches alternate names and company', () => {
    expect(scoreGuestMatch(sampleGuest, 'dr elena rostova')).toBeGreaterThan(500);
    expect(scoreGuestMatch(sampleGuest, 'quantum dynamics')).toBe(500);
  });

  it('matches diacritics transparently', () => {
    const accentedGuest: SearchGuestItem = {
      id: 'g-2',
      fullName: 'François Dupont',
      slug: 'francois-dupont',
      role: 'Chairman',
      shortOverview: 'Industrial manufacturing icon.',
    };
    expect(scoreGuestMatch(accentedGuest, 'francois dupont')).toBe(1000);
  });
});

describe('searchCollections', () => {
  const guests: SearchGuestItem[] = [
    {
      id: '1',
      fullName: 'Marcus Vance',
      slug: 'marcus-vance',
      role: 'Managing Director',
      company: 'Aether Capital',
      shortOverview: 'Venture investor focused on deep-tech infrastructure.',
    },
    {
      id: '2',
      fullName: 'Aria Sterling',
      slug: 'aria-sterling',
      role: 'Co-Founder',
      company: 'Helix Therapeutics',
      shortOverview: 'Biotech pioneer working with Marcus Vance on synthetic genomics.',
    },
  ];

  const episodes: SearchEpisodeItem[] = [
    {
      id: 'ep-1',
      title: 'Decentering Silicon Valley: The Rise of Sovereign AI',
      slug: 'decentering-silicon-valley',
      shortSummary: 'Marcus Vance discusses global compute sovereignty and capital allocation.',
      publishedAt: '2026-03-15T00:00:00.000Z',
      guestNames: ['Marcus Vance'],
    },
    {
      id: 'ep-2',
      title: 'The Genomic Horizon: Re-engineering Biology',
      slug: 'the-genomic-horizon',
      shortSummary: 'Aria Sterling reveals breakthroughs in targeted mRNA delivery.',
      publishedAt: '2026-03-20T00:00:00.000Z',
      guestNames: ['Aria Sterling'],
    },
  ];

  it('returns guest first when full name strongly matches', () => {
    const result = searchCollections('Marcus Vance', guests, episodes);

    expect(result.guests.length).toBeGreaterThan(0);
    expect(result.guests[0].fullName).toBe('Marcus Vance');
    // Primary guest match score should be top tier
    expect(result.guests[0].score).toBe(1000);
    // Associated episode is also returned
    expect(result.episodes.length).toBe(1);
    expect(result.episodes[0].id).toBe('ep-1');
  });

  it('returns empty results for empty or non-matching queries', () => {
    const emptyResult = searchCollections('', guests, episodes);
    expect(emptyResult.totalCount).toBe(0);

    const noMatchResult = searchCollections('completely unrelated term xyz', guests, episodes);
    expect(noMatchResult.totalCount).toBe(0);
  });
});
