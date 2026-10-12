'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Search,
  Bell,
  ChevronRight,
  User,
  Settings,
  LogOut,
  Sparkles,
  Menu,
} from 'lucide-react';
import { CommandPalette } from './CommandPalette';
import { Badge } from '../ui/badge';

interface AdminHeaderProps {
  currentUser?: {
    email: string;
    role: string;
  };
  user?: {
    email?: string;
    role?: string;
  };
  [key: string]: any;
}

export const AdminHeader: React.FC<AdminHeaderProps> = (props) => {
  const currentUser = props.currentUser || props.user;
  const pathname = usePathname() || '';
  const [isCommandOpen, setIsCommandOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);

  const [user, setUser] = useState<{ email: string; role: string }>({
    email: currentUser?.email || 'admin@gmail.com',
    role: currentUser?.role || 'admin',
  });

  // Global Cmd+K / Ctrl+K listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsCommandOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Close menus on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(e.target as Node)) {
        setIsProfileOpen(false);
        setIsNotifOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Compute breadcrumbs from current pathname
  const segments = pathname.split('/').filter(Boolean);
  const breadcrumbItems = segments.map((seg, idx) => {
    const href = '/' + segments.slice(0, idx + 1).join('/');
    const title = seg
      .replace(/-/g, ' ')
      .replace(/\b\w/g, (c) => c.toUpperCase());
    return { title, href };
  });

  const initials = user.email
    ? user.email.slice(0, 2).toUpperCase()
    : 'AD';

  return (
    <>
      <header className="sticky top-0 z-30 h-16 bg-[#0F1B2D] border-b border-white/[0.08] px-4 lg:px-6 flex items-center justify-between text-white shadow-sm backdrop-blur-md">
        {/* Left: Mobile Drawer Trigger + Breadcrumbs */}
        <div className="flex items-center gap-2.5 min-w-0">
          <button
            type="button"
            onClick={() => window.dispatchEvent(new CustomEvent('toggle-admin-sidebar'))}
            className="lg:hidden p-1.5 -ml-1 rounded-xl text-slate-300 hover:text-white hover:bg-white/[0.08] transition-colors"
            aria-label="Toggle navigation drawer"
          >
            <Menu className="w-5 h-5 text-[#C9A24B]" />
          </button>

          <nav aria-label="Breadcrumb navigation" className="flex items-center gap-2 text-sm text-slate-300 min-w-0">
            <Link
              href="/admin"
              className="flex items-center gap-1.5 font-medium hover:text-[#C9A24B] transition-colors"
            >
            <Sparkles className="w-3.5 h-3.5 text-[#C9A24B]" />
            <span>Portal</span>
          </Link>

          {breadcrumbItems.slice(1).map((crumb, idx) => (
            <React.Fragment key={crumb.href}>
              <ChevronRight className="w-3.5 h-3.5 text-slate-500 shrink-0" />
              <Link
                href={crumb.href}
                className={`truncate font-medium transition-colors ${
                  idx === breadcrumbItems.length - 2
                    ? 'text-white font-semibold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {crumb.title}
              </Link>
            </React.Fragment>
          ))}
        </nav>
      </div>

      {/* Right: Search + Notifications + Profile */}
        <div ref={profileMenuRef} className="flex items-center gap-3 shrink-0">
          {/* Command Palette Trigger Button */}
          <button
            type="button"
            onClick={() => setIsCommandOpen(true)}
            className="hidden md:flex items-center gap-3 px-3 py-1.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] border border-white/[0.1] text-xs text-slate-300 hover:text-white transition-all shadow-2xs"
          >
            <Search className="w-3.5 h-3.5 text-[#C9A24B]" />
            <span>Search or jump to...</span>
            <kbd className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-white/[0.08] border border-white/10 text-[10px] text-slate-300 font-mono">
              ⌘K
            </kbd>
          </button>

          {/* Notifications Bell */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsNotifOpen((prev) => !prev)}
              aria-label="View notifications"
              className="relative p-2 rounded-xl text-slate-300 hover:text-white hover:bg-white/[0.06] transition-colors"
            >
              <Bell className="w-4 h-4" />
              <span className="absolute top-1.5 right-1.5 flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#C9A24B] opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#C9A24B]" />
              </span>
            </button>

            {/* Notification Dropdown */}
            {isNotifOpen && (
              <div className="absolute right-0 mt-2 w-80 rounded-2xl bg-white text-slate-800 shadow-2xl border border-slate-200 p-4 z-50 animate-in fade-in zoom-in-95">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <h4 className="font-semibold text-xs text-slate-900 uppercase tracking-wider">
                    Notifications
                  </h4>
                  <span className="text-[10px] bg-amber-50 text-amber-700 font-semibold px-2 py-0.5 rounded-full border border-amber-200">
                    2 New
                  </span>
                </div>
                <div className="py-2 space-y-2 text-xs">
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 hover:bg-slate-100/70 transition-colors">
                    <p className="font-semibold text-slate-900">New Leader Nomination</p>
                    <p className="text-slate-500 text-[11px] mt-0.5">Dr. Maya Lin submitted for Season 3 review.</p>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 hover:bg-slate-100/70 transition-colors">
                    <p className="font-semibold text-slate-900">Broadcast Ready</p>
                    <p className="text-slate-500 text-[11px] mt-0.5">Episode 4 marked as published on schedule.</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Profile Dropdown Trigger */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsProfileOpen((prev) => !prev)}
              aria-label="User profile menu"
              className="flex items-center gap-2 p-1 pl-2 rounded-xl hover:bg-white/[0.06] transition-colors"
            >
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#C9A24B] to-[#9E7E38] text-[#0F1B2D] font-bold text-xs flex items-center justify-center border border-white/20 shadow-xs">
                {initials}
              </div>
            </button>

            {/* Profile Dropdown Menu */}
            {isProfileOpen && (
              <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-white text-slate-800 shadow-2xl border border-slate-200 p-2 z-50 animate-in fade-in zoom-in-95">
                <div className="px-3 py-2 border-b border-slate-100">
                  <p className="text-xs font-bold text-slate-900 truncate">{user.email}</p>
                  <div className="mt-1">
                    <Badge variant={user.role === 'admin' ? 'admin' : 'editor'} showTooltip={false}>
                      {user.role === 'admin' ? 'Administrator' : 'Editor'}
                    </Badge>
                  </div>
                </div>

                <div className="py-1">
                  <Link
                    href="/admin/account"
                    onClick={() => setIsProfileOpen(false)}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition-colors"
                  >
                    <User className="w-3.5 h-3.5 text-slate-400" />
                    <span>My Profile</span>
                  </Link>
                  <Link
                    href="/admin/settings"
                    onClick={() => setIsProfileOpen(false)}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition-colors"
                  >
                    <Settings className="w-3.5 h-3.5 text-slate-400" />
                    <span>Portal Settings</span>
                  </Link>
                </div>

                <div className="pt-1 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        await fetch('/api/auth/logout', { method: 'POST' });
                      } finally {
                        window.location.href = '/admin/login';
                      }
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-red-600 hover:bg-red-50 transition-colors text-left"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Log Out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Global Command Palette */}
      <CommandPalette isOpen={isCommandOpen} onClose={() => setIsCommandOpen(false)} />
    </>
  );
};

export default AdminHeader;
