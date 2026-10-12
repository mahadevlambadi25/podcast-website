/**
 * Search Utilities and Ranking Algorithms
 * Provides robust diacritic-insensitive, punctuation-tolerant matching and scoring.
 */

export interface SearchGuestItem {
  id: string | number;
  fullName: string;
  alternateNames?: string[] | null;
  slug: string;
  role: string;
  company?: string | null;
  shortOverview: string;
  portraitUrl?: string | null;
  status?: string;
  industries?: Array<{ name: string; slug: string }> | null;
}

export interface SearchEpisodeItem {
  id: string | number;
  title: string;
  slug: string;
  shortSummary: string;
  thumbnailUrl?: string | null;
  youtubeVideoId?: string | null;
  publishedAt: string;
  status?: string;
  guestNames: string[];
  topics?: Array<{ name: string; slug: string }> | null;
  tags?: string[] | null;
}

export interface SearchResults {
  query: string;
  guests: Array<SearchGuestItem & { score: number }>;
  episodes: Array<SearchEpisodeItem & { score: number }>;
  totalCount: number;
}

/**
 * Normalizes string for search comparison:
 * lowercase, removes accents, strips punctuation, collapses whitespace.
 */
export function normalizeSearchTerm(term: string): string {
  if (!term) return '';
  return term
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Calculates match score for a guest.
 */
export function scoreGuestMatch(guest: SearchGuestItem, normalizedQuery: string): number {
  if (!normalizedQuery) return 0;

  const normFullName = normalizeSearchTerm(guest.fullName);
  const normRole = normalizeSearchTerm(guest.role || '');
  const normCompany = normalizeSearchTerm(guest.company || '');
  const normOverview = normalizeSearchTerm(guest.shortOverview || '');
  const normAlts = (guest.alternateNames || []).map(normalizeSearchTerm);

  // Exact full name match: top score
  if (normFullName === normalizedQuery) {
    return 1000;
  }

  // Name starts with query
  if (normFullName.startsWith(normalizedQuery)) {
    return 800;
  }

  // Name contains query
  if (normFullName.includes(normalizedQuery)) {
    return 600;
  }

  // Check alternate names
  for (const alt of normAlts) {
    if (alt === normalizedQuery) return 900;
    if (alt.startsWith(normalizedQuery)) return 700;
    if (alt.includes(normalizedQuery)) return 550;
  }

  // Company exact or contains
  if (normCompany === normalizedQuery) return 500;
  if (normCompany.includes(normalizedQuery)) return 400;

  // Role contains
  if (normRole.includes(normalizedQuery)) return 350;

  // Industry match
  if (guest.industries) {
    for (const ind of guest.industries) {
      if (normalizeSearchTerm(ind.name).includes(normalizedQuery)) return 300;
    }
  }

  // Check word-by-word token matches
  const queryTokens = normalizedQuery.split(' ').filter(Boolean);
  let tokenMatches = 0;
  for (const token of queryTokens) {
    if (normFullName.includes(token)) tokenMatches += 3;
    if (normCompany.includes(token)) tokenMatches += 2;
    if (normRole.includes(token)) tokenMatches += 1;
    if (normOverview.includes(token)) tokenMatches += 0.5;
  }

  if (tokenMatches > 0) {
    return tokenMatches * 50;
  }

  // Overview contains
  if (normOverview.includes(normalizedQuery)) return 100;

  return 0;
}

/**
 * Calculates match score for an episode.
 */
export function scoreEpisodeMatch(episode: SearchEpisodeItem, normalizedQuery: string): number {
  if (!normalizedQuery) return 0;

  const normTitle = normalizeSearchTerm(episode.title);
  const normSummary = normalizeSearchTerm(episode.shortSummary || '');

  // Exact title match
  if (normTitle === normalizedQuery) return 850;

  // Title starts with query
  if (normTitle.startsWith(normalizedQuery)) return 700;

  // Title contains query
  if (normTitle.includes(normalizedQuery)) return 550;

  // Guest name match
  for (const guest of episode.guestNames) {
    const normGuest = normalizeSearchTerm(guest);
    if (normGuest === normalizedQuery) return 500;
    if (normGuest.includes(normalizedQuery)) return 400;
  }

  // Tags or Topics match
  if (episode.tags) {
    for (const tag of episode.tags) {
      if (normalizeSearchTerm(tag).includes(normalizedQuery)) return 300;
    }
  }
  if (episode.topics) {
    for (const topic of episode.topics) {
      if (normalizeSearchTerm(topic.name).includes(normalizedQuery)) return 300;
    }
  }

  // Token matches
  const queryTokens = normalizedQuery.split(' ').filter(Boolean);
  let tokenMatches = 0;
  for (const token of queryTokens) {
    if (normTitle.includes(token)) tokenMatches += 2;
    if (normSummary.includes(token)) tokenMatches += 0.5;
  }

  if (tokenMatches > 0) {
    return tokenMatches * 40;
  }

  if (normSummary.includes(normalizedQuery)) return 80;

  return 0;
}

/**
 * Executes multi-collection search and orders results appropriately.
 */
export function searchCollections(
  query: string,
  guestsList: SearchGuestItem[],
  episodesList: SearchEpisodeItem[]
): SearchResults {
  const normalized = normalizeSearchTerm(query);
  if (!normalized) {
    return { query, guests: [], episodes: [], totalCount: 0 };
  }

  const scoredGuests = guestsList
    .map((g) => ({ ...g, score: scoreGuestMatch(g, normalized) }))
    .filter((g) => g.score > 0)
    .sort((a, b) => b.score - a.score);

  const scoredEpisodes = episodesList
    .map((e) => ({ ...e, score: scoreEpisodeMatch(e, normalized) }))
    .filter((e) => e.score > 0)
    .sort((a, b) => b.score - a.score);

  return {
    query,
    guests: scoredGuests,
    episodes: scoredEpisodes,
    totalCount: scoredGuests.length + scoredEpisodes.length,
  };
}
