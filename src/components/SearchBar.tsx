'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Search, X, User, Video, ArrowRight, Loader2 } from 'lucide-react';
import { SearchResults } from '@/utils/search';

interface SearchBarProps {
  placeholder?: string;
  isHeader?: boolean;
}

export function SearchBar({
  placeholder = 'Search guests, episodes, or topics...',
  isHeader = false,
}: SearchBarProps) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResults | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Debounced search
  useEffect(() => {
    if (!query.trim()) {
      setResults(null);
      setIsOpen(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsLoading(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query.trim())}`);
        if (res.ok) {
          const data: SearchResults = await res.json();
          setResults(data);
          setIsOpen(true);
          setSelectedIndex(-1);
        }
      } catch (err) {
        console.error('Search fetch failed:', err);
      } finally {
        setIsLoading(false);
      }
    }, 280);

    return () => clearTimeout(timer);
  }, [query]);

  // Click outside listener
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    setIsOpen(false);
    router.push(`/search?q=${encodeURIComponent(query.trim())}`);
  };

  const handleClear = () => {
    setQuery('');
    setResults(null);
    setIsOpen(false);
    setSelectedIndex(-1);
    if (inputRef.current) inputRef.current.focus();
  };

  // Keyboard navigation items
  const guestItems = (results?.guests || []).slice(0, 4).map((g) => ({
    type: 'guest',
    href: `/guests/${g.slug}`,
    label: g.fullName,
  }));
  const episodeItems = (results?.episodes || []).slice(0, 4).map((e) => ({
    type: 'episode',
    href: `/episodes/${e.slug}`,
    label: e.title,
  }));
  const allItems = [...guestItems, ...episodeItems];

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setIsOpen(false);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < allItems.length - 1 ? prev + 1 : prev));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
    } else if (e.key === 'Enter' && selectedIndex >= 0 && allItems[selectedIndex]) {
      e.preventDefault();
      setIsOpen(false);
      router.push(allItems[selectedIndex].href);
    }
  };

  const activeOptionId = selectedIndex >= 0 ? `search-option-${selectedIndex}` : undefined;

  return (
    <div
      ref={dropdownRef}
      className={`relative w-full ${isHeader ? 'max-w-md' : 'max-w-2xl mx-auto'}`}
    >
      <form onSubmit={handleSubmit} className="relative flex items-center">
        <div className="absolute left-3.5 text-neu-muted pointer-events-none">
          {isLoading ? (
            <Loader2 className="w-4 h-4 animate-spin text-[#C6A15B]" />
          ) : (
            <Search className={`w-4 h-4 ${isHeader ? 'text-[#8E9CAE]' : 'text-neu-muted'}`} />
          )}
        </div>

        <input
          ref={inputRef}
          type="search"
          role="combobox"
          aria-expanded={isOpen && Boolean(results)}
          aria-haspopup="listbox"
          aria-controls="search-results-listbox"
          aria-activedescendant={activeOptionId}
          aria-autocomplete="list"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (query.trim() && results) {
              setIsOpen(true);
            }
          }}
          placeholder={placeholder}
          aria-label="Search guests, episodes, or topics"
          className={`w-full pl-10 pr-10 py-2.5 min-h-[44px] rounded-xl text-sm focus:outline-none transition-all font-sans ${
            isHeader
              ? 'bg-[#19283B] text-white placeholder-[#8E9CAE] border border-white/15 focus:border-[#C6A15B] focus:ring-2 focus:ring-[#C6A15B]/30'
              : 'neu-inset text-neu-charcoal placeholder-neu-muted focus:ring-2 focus:ring-[#C6A15B]/40'
          }`}
        />

        {query && (
          <button
            type="button"
            onClick={handleClear}
            className={`absolute right-3 p-1 min-w-[32px] min-h-[32px] flex items-center justify-center rounded-lg focus:outline-none ${
              isHeader ? 'text-[#8E9CAE] hover:text-white' : 'text-neu-muted hover:text-neu-charcoal'
            }`}
            aria-label="Clear search input"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </form>

      {/* Live Dropdown */}
      {isOpen && results && (
        <div
          id="search-results-listbox"
          role="listbox"
          aria-label="Search suggestions"
          className="absolute top-full left-0 right-0 mt-2 bg-white border border-[#DFE3E8] rounded-2xl shadow-xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200"
        >
          <div className="max-h-[420px] overflow-y-auto p-2 divide-y divide-neu-border/50">
            {results.totalCount === 0 ? (
              <div className="p-6 text-center" role="status">
                <p className="text-neu-charcoal font-semibold text-sm">
                  No results found for &ldquo;{query}&rdquo;
                </p>
                <p className="text-xs text-neu-muted mt-1">
                  Try searching by guest name, company, executive title, or topic.
                </p>
              </div>
            ) : (
              <>
                {/* Guests Group */}
                {results.guests.length > 0 && (
                  <div className="py-2" role="group" aria-label="Guests">
                    <div className="px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-gold-600 flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5" />
                      Guests ({results.guests.length})
                    </div>
                    {results.guests.slice(0, 4).map((g, idx) => {
                      const isSelected = selectedIndex === idx;
                      return (
                        <Link
                          key={g.id}
                          id={`search-option-${idx}`}
                          role="option"
                          aria-selected={isSelected}
                          href={`/guests/${g.slug}`}
                          onClick={() => setIsOpen(false)}
                          className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all min-h-[44px] ${
                            isSelected
                              ? 'neu-inset text-gold-700 font-medium'
                              : 'text-neu-body hover:neu-raised-sm hover:text-neu-charcoal'
                          }`}
                        >
                          <div className="relative w-9 h-11 rounded-lg overflow-hidden bg-neu-sunken shrink-0 border border-white/70 shadow-sm">
                            <Image
                              src={g.portraitUrl || '/placeholders/portrait-placeholder.svg'}
                              alt={g.fullName}
                              fill
                              className="object-cover"
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-semibold truncate text-neu-charcoal">{g.fullName}</div>
                            <div className="text-xs text-neu-muted truncate">
                              {g.role} {g.company ? `• ${g.company}` : ''}
                            </div>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                )}

                {/* Episodes Group */}
                {results.episodes.length > 0 && (
                  <div className="py-2" role="group" aria-label="Episodes">
                    <div className="px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-gold-600 flex items-center gap-1.5">
                      <Video className="w-3.5 h-3.5" />
                      Episodes ({results.episodes.length})
                    </div>
                    {results.episodes.slice(0, 4).map((e, idx) => {
                      const itemIndex = guestItems.length + idx;
                      const isSelected = selectedIndex === itemIndex;
                      return (
                        <Link
                          key={e.id}
                          id={`search-option-${itemIndex}`}
                          role="option"
                          aria-selected={isSelected}
                          href={`/episodes/${e.slug}`}
                          onClick={() => setIsOpen(false)}
                          className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all min-h-[44px] ${
                            isSelected
                              ? 'neu-inset text-gold-700 font-medium'
                              : 'text-neu-body hover:neu-raised-sm hover:text-neu-charcoal'
                          }`}
                        >
                          <div className="relative w-14 h-9 rounded-lg overflow-hidden bg-neu-sunken shrink-0 border border-white/70 shadow-sm">
                            <Image
                              src={
                                e.thumbnailUrl ||
                                (e.youtubeVideoId && !e.youtubeVideoId.includes('sample')
                                  ? `https://i.ytimg.com/vi/${e.youtubeVideoId}/hqdefault.jpg`
                                  : '/placeholders/episode-placeholder.svg')
                              }
                              alt={e.title}
                              fill
                              className="object-cover"
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-semibold truncate text-neu-charcoal">{e.title}</div>
                            <div className="text-xs text-neu-muted truncate">
                              {e.guestNames.join(', ')}
                            </div>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </>
            )}
          </div>

          {/* Footer View All Link */}
          {results.totalCount > 0 && (
            <div className="p-2.5 bg-neu-surface border-t border-neu-border">
              <Link
                href={`/search?q=${encodeURIComponent(query)}`}
                onClick={() => setIsOpen(false)}
                className="w-full flex items-center justify-center gap-1.5 py-2 min-h-[44px] text-xs font-bold uppercase tracking-wider text-gold-600 hover:text-gold-700 transition-colors"
              >
                View all {results.totalCount} results in full search
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
