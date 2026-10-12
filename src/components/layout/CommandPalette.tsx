'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Search,
  Mic,
  Mic2,
  Tag,
  Inbox,
  MessageSquare,
  Users,
  ArrowRightLeft,
  Settings,
  PlusCircle,
  X,
  ExternalLink,
} from 'lucide-react';

interface CommandItem {
  id: string;
  title: string;
  subtitle: string;
  category: 'Navigation' | 'Quick Actions';
  href: string;
  icon: React.ElementType;
}

export const CommandPalette: React.FC<{ isOpen: boolean; onClose: () => void }> = ({
  isOpen,
  onClose,
}) => {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);

  const items: CommandItem[] = [
    // Quick Actions
    {
      id: 'action-new-episode',
      title: 'Create New Episode',
      subtitle: 'Draft title, audio links, YouTube embed & show notes',
      category: 'Quick Actions',
      href: '/admin/episodes/new',
      icon: PlusCircle,
    },
    {
      id: 'action-new-guest',
      title: 'Add New Leader Profile',
      subtitle: 'Executive biography, credentials, portrait & quotes',
      category: 'Quick Actions',
      href: '/admin/guests',
      icon: PlusCircle,
    },
    {
      id: 'action-new-user',
      title: 'Invite / Add Team Member',
      subtitle: 'Grant Administrator or Editor role permissions',
      category: 'Quick Actions',
      href: '/admin/users',
      icon: PlusCircle,
    },
    // Navigation
    {
      id: 'nav-dashboard',
      title: 'Dashboard Overview',
      subtitle: 'Command center, metrics, recent broadcast activity',
      category: 'Navigation',
      href: '/admin',
      icon: ExternalLink,
    },
    {
      id: 'nav-episodes',
      title: 'Episodes Collection',
      subtitle: 'Browse catalog, audio runtime, transcripts',
      category: 'Navigation',
      href: '/admin/episodes',
      icon: Mic,
    },
    {
      id: 'nav-guests',
      title: 'Leaders & Guests Directory',
      subtitle: 'Executive portraits, affiliations & quotes',
      category: 'Navigation',
      href: '/admin/guests',
      icon: Mic2,
    },
    {
      id: 'nav-topics',
      title: 'Thematic Pillars & Topics',
      subtitle: 'Taxonomy categories, slugs & descriptions',
      category: 'Navigation',
      href: '/admin/topics',
      icon: Tag,
    },
    {
      id: 'nav-media',
      title: 'Media Assets & Library',
      subtitle: 'Audio tracks, hero posters, logos & thumbnails',
      category: 'Navigation',
      href: '/admin/media',
      icon: Tag,
    },
    {
      id: 'nav-nominations',
      title: 'Leader Nominations Queue',
      subtitle: 'Review incoming candidates & vetting pipeline',
      category: 'Navigation',
      href: '/admin/nominations',
      icon: Inbox,
    },
    {
      id: 'nav-contact',
      title: 'Audience Contact Inquiries',
      subtitle: 'Partner messages & feedback submissions',
      category: 'Navigation',
      href: '/admin/contact-messages',
      icon: MessageSquare,
    },
    {
      id: 'nav-users',
      title: 'User Management',
      subtitle: 'Team accounts, authentication & roles',
      category: 'Navigation',
      href: '/admin/users',
      icon: Users,
    },
    {
      id: 'nav-redirects',
      title: 'URL Redirects & 301 Rules',
      subtitle: 'Legacy route routing & vanity URLs',
      category: 'Navigation',
      href: '/admin/redirects',
      icon: ArrowRightLeft,
    },
    {
      id: 'nav-settings',
      title: 'Global Site Settings',
      subtitle: 'SEO defaults, podcast metadata & feeds',
      category: 'Navigation',
      href: '/admin/settings',
      icon: Settings,
    },
    {
      id: 'nav-activity',
      title: 'Activity Logs & Audits',
      subtitle: 'Administrative audit trails and publish history',
      category: 'Navigation',
      href: '/admin/activity',
      icon: Settings,
    },
  ];

  const filteredItems = items.filter(
    (item) =>
      item.title.toLowerCase().includes(query.toLowerCase()) ||
      item.subtitle.toLowerCase().includes(query.toLowerCase())
  );

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % (filteredItems.length || 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + filteredItems.length) % (filteredItems.length || 1));
      } else if (e.key === 'Enter' && filteredItems[selectedIndex]) {
        e.preventDefault();
        const target = filteredItems[selectedIndex];
        onClose();
        router.push(target.href);
      } else if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, filteredItems, selectedIndex, router, onClose]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Global Command Palette Search"
      className="fixed inset-0 z-50 flex items-start justify-center pt-24 p-4"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-[#0F1B2D]/70 backdrop-blur-xs transition-opacity duration-150"
        onClick={onClose}
      />

      {/* Surface */}
      <div className="relative w-full max-w-xl rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden z-10 animate-in zoom-in-95 duration-150">
        {/* Search Bar Input */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-slate-100 bg-slate-50/50">
          <Search className="w-5 h-5 text-[#C9A24B] shrink-0" />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type a command or search collections... (e.g. Users, Episodes)"
            className="w-full bg-transparent text-sm text-slate-800 placeholder-slate-400 focus:outline-none"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              className="p-1 rounded-md text-slate-400 hover:text-slate-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <kbd className="hidden sm:inline-flex items-center gap-0.5 px-2 py-0.5 rounded-md bg-slate-200/70 border border-slate-300 text-[11px] font-medium text-slate-600">
            ESC
          </kbd>
        </div>

        {/* Results List */}
        <div className="max-h-80 overflow-y-auto p-2 space-y-1">
          {filteredItems.length === 0 ? (
            <div className="py-8 text-center text-sm text-slate-500">
              No matching commands found for &ldquo;{query}&rdquo;
            </div>
          ) : (
            filteredItems.map((item, index) => {
              const Icon = item.icon;
              const isSelected = index === selectedIndex;

              return (
                <div
                  key={item.id}
                  onClick={() => {
                    onClose();
                    router.push(item.href);
                  }}
                  onMouseEnter={() => setSelectedIndex(index)}
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl cursor-pointer transition-colors ${
                    isSelected
                      ? 'bg-[#0F1B2D] text-white shadow-xs'
                      : 'text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <div
                    className={`p-2 rounded-lg shrink-0 ${
                      isSelected
                        ? 'bg-[#C9A24B] text-[#0F1B2D]'
                        : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className={`text-sm font-semibold truncate ${isSelected ? 'text-white' : 'text-slate-900'}`}>
                        {item.title}
                      </p>
                      <span
                        className={`text-[10px] font-medium px-1.5 py-0.5 rounded-md uppercase tracking-wider ${
                          isSelected
                            ? 'bg-white/10 text-[#C9A24B]'
                            : 'bg-slate-100 text-slate-500'
                        }`}
                      >
                        {item.category}
                      </span>
                    </div>
                    <p className={`text-xs truncate ${isSelected ? 'text-slate-300' : 'text-slate-500'}`}>
                      {item.subtitle}
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer shortcuts hint */}
        <div className="px-4 py-2 border-t border-slate-100 bg-slate-50 flex items-center justify-between text-[11px] text-slate-500">
          <div className="flex items-center gap-3">
            <span>↑↓ Navigate</span>
            <span>↵ Select</span>
          </div>
          <span className="text-[#C9A24B] font-medium">Unchartered Editorial Portal</span>
        </div>
      </div>
    </div>
  );
};

export default CommandPalette;
