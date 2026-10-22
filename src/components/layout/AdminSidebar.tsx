'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Users,
  ArrowRightLeft,
  Settings,
  Mic,
  Mic2,
  Tag,
  Inbox,
  MessageSquare,
  LayoutDashboard,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  LogOut,
  ExternalLink,
  Radio,
  Image as ImageIcon,
  Activity,
  LucideIcon,
} from 'lucide-react';
import { BrandLogo } from '../admin/BrandLogo';
import { Badge } from '../ui/badge';

interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  badge?: string | number;
}

interface NavGroup {
  title: string;
  items: NavItem[];
}

interface AdminSidebarProps {
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

export const AdminSidebar: React.FC<AdminSidebarProps> = (props) => {
  const currentUser = props.currentUser || props.user;
  const pathname = usePathname() || '';
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({
    'Editorial': true,
    'Audience & Submissions': true,
    'Settings & Administration': true,
  });

  const [user, setUser] = useState<{ email: string; role: string }>({
    email: currentUser?.email || 'admin@gmail.com',
    role: currentUser?.role || 'admin',
  });

  useEffect(() => {
    // Try to load cached user or collapse preference
    const savedCollapse = localStorage.getItem('unchartered_sidebar_collapsed');
    if (savedCollapse !== null) {
      setIsCollapsed(savedCollapse === 'true');
    }

    // Mobile drawer toggle listener
    const handleToggle = () => setIsMobileOpen((prev) => !prev);
    const handleClose = () => setIsMobileOpen(false);
    window.addEventListener('toggle-admin-sidebar', handleToggle);
    window.addEventListener('close-admin-sidebar', handleClose);

    // Fetch user if missing
    if (!currentUser?.email) {
      fetch('/api/auth/me')
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data?.user) {
            setUser({
              email: data.user.email || 'admin@gmail.com',
              role: data.user.role || 'admin',
            });
          }
        })
        .catch(() => {});
    }

    return () => {
      window.removeEventListener('toggle-admin-sidebar', handleToggle);
      window.removeEventListener('close-admin-sidebar', handleClose);
    };
  }, [currentUser]);

  const toggleCollapse = () => {
    setIsCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem('unchartered_sidebar_collapsed', String(next));
      return next;
    });
  };

  const toggleGroup = (title: string) => {
    setOpenGroups((prev) => ({
      ...prev,
      [title]: !prev[title],
    }));
  };

  const navGroups: NavGroup[] = [
    {
      title: 'Editorial',
      items: [
        { label: 'Episodes', href: '/admin/episodes', icon: Mic },
        { label: 'Guests', href: '/admin/guests', icon: Mic2 },
        { label: 'Topics', href: '/admin/topics', icon: Tag },
        { label: 'Media Library', href: '/admin/media', icon: ImageIcon },
      ],
    },
    {
      title: 'Audience & Submissions',
      items: [
        { label: 'Nominations', href: '/admin/nominations', icon: Inbox },
        { label: 'Contact Messages', href: '/admin/contact-messages', icon: MessageSquare },
      ],
    },
    {
      title: 'Settings & Administration',
      items: [
        { label: 'Users & Permissions', href: '/admin/users', icon: Users },
        { label: 'Redirects', href: '/admin/redirects', icon: ArrowRightLeft },
        { label: 'SEO & Settings', href: '/admin/settings', icon: Settings },
        { label: 'Activity Logs', href: '/admin/activity', icon: Activity },
      ],
    },
  ];

  // Helper for user initials
  const initials = user.email
    ? user.email
        .split('@')[0]
        .slice(0, 2)
        .toUpperCase()
    : 'AD';

  return (
    <>
      {/* Mobile Drawer Backdrop */}
      {isMobileOpen && (
        <div
          role="button"
          tabIndex={0}
          aria-label="Close navigation overlay"
          onClick={() => setIsMobileOpen(false)}
          onKeyDown={(e) => e.key === 'Escape' && setIsMobileOpen(false)}
          className="lg:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-xs transition-opacity duration-200 !m-0"
        />
      )}

      <aside
        aria-label="Admin Navigation Sidebar"
        className={`fixed inset-y-0 left-0 z-40 lg:z-30 lg:sticky lg:top-0 lg:h-screen lg:shrink-0 bg-[#0F1B2D] text-slate-300 border-r border-white/[0.08] flex flex-col transition-all duration-200 select-none shadow-2xl ${
          isCollapsed ? 'w-[72px]' : 'w-[264px]'
        } ${isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
      >
      {/* Top Brand Header */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-white/[0.08] shrink-0">
        <Link href="/admin" className="flex items-center overflow-hidden">
          <BrandLogo collapsed={isCollapsed} size={isCollapsed ? 'sm' : 'md'} />
        </Link>
        <button
          type="button"
          onClick={toggleCollapse}
          aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          className="p-1.5 rounded-lg text-slate-400 hover:text-[#C9A24B] hover:bg-white/[0.06] transition-colors"
        >
          {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Main Navigation Items */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6 scrollbar-none">
        {/* Dashboard Link */}
        <div>
          <Link
            href="/admin"
            title={isCollapsed ? 'Dashboard' : undefined}
            className={`group relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
              pathname === '/admin'
                ? 'bg-white/[0.08] text-[#FFFFFF] shadow-xs'
                : 'text-slate-300 hover:bg-white/[0.04] hover:text-white'
            }`}
          >
            {/* Gold Active Indicator Bar */}
            {pathname === '/admin' && (
              <span className="absolute left-0 top-1.5 bottom-1.5 w-1 rounded-r-full bg-[#C9A24B] shadow-[0_0_8px_#C9A24B]" />
            )}
            <LayoutDashboard
              className={`w-4 h-4 shrink-0 transition-colors ${
                pathname === '/admin' ? 'text-[#C9A24B]' : 'text-slate-400 group-hover:text-[#C9A24B]'
              }`}
            />
            {!isCollapsed && <span>Dashboard</span>}
          </Link>
        </div>

        {/* Grouped Modules */}
        {navGroups.map((group) => {
          const isOpen = openGroups[group.title] ?? true;

          return (
            <div key={group.title} className="space-y-1">
              {!isCollapsed && (
                <button
                  type="button"
                  onClick={() => toggleGroup(group.title)}
                  className="w-full flex items-center justify-between px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400 hover:text-slate-200 transition-colors"
                >
                  <span>{group.title}</span>
                  <ChevronDown
                    className={`w-3.5 h-3.5 transition-transform duration-150 ${
                      isOpen ? 'rotate-0' : '-rotate-90'
                    }`}
                  />
                </button>
              )}

              {/* Group separator for collapsed state */}
              {isCollapsed && <div className="h-px bg-white/[0.08] my-2 mx-1" />}

              {(isOpen || isCollapsed) && (
                <div className="space-y-1">
                  {group.items.map((item) => {
                    const isActive = pathname.startsWith(item.href);
                    const Icon = item.icon;

                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        title={isCollapsed ? item.label : undefined}
                        className={`group relative flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-all ${
                          isActive
                            ? 'bg-white/[0.08] text-[#FFFFFF] shadow-xs'
                            : 'text-slate-300 hover:bg-white/[0.04] hover:text-white'
                        }`}
                      >
                        {/* Active Gold Indicator Bar */}
                        {isActive && (
                          <span className="absolute left-0 top-1.5 bottom-1.5 w-1 rounded-r-full bg-[#C9A24B] shadow-[0_0_8px_#C9A24B]" />
                        )}
                        <Icon
                          className={`w-4 h-4 shrink-0 transition-colors ${
                            isActive ? 'text-[#C9A24B]' : 'text-slate-400 group-hover:text-[#C9A24B]'
                          }`}
                        />
                        {!isCollapsed && <span className="truncate">{item.label}</span>}
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Broadcast Live & External Link */}
      {!isCollapsed && (
        <div className="px-3 pb-3">
          <div className="rounded-xl bg-[#16263D]/70 border border-white/10 p-2.5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#C9A24B]">
                Broadcast
              </span>
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-[10px] font-semibold text-emerald-400">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Live
              </span>
            </div>
            <a
              href="/"
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center justify-between w-full px-2.5 py-1.5 rounded-lg bg-white/[0.04] hover:bg-[#C9A24B]/15 border border-white/10 hover:border-[#C9A24B]/40 text-[#F7F3EC] hover:text-[#C9A24B] text-xs font-medium transition-all"
            >
              <span className="flex items-center gap-2">
                <Radio className="w-3.5 h-3.5 text-[#C9A24B]" />
                <span>View Public Website</span>
              </span>
              <ExternalLink className="w-3 h-3 text-slate-400 group-hover:text-[#C9A24B] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </a>
          </div>
        </div>
      )}

      {/* Bottom User Card */}
      <div className="p-3 border-t border-white/[0.08] bg-[#0A1320]/60 shrink-0">
        <div className={`flex items-center ${isCollapsed ? 'flex-col gap-2.5 justify-center' : 'justify-between gap-2'}`}>
          <div className="flex items-center gap-2.5 min-w-0" title={`${user.email} (${user.role})`}>
            {/* Avatar Initials */}
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#C9A24B] to-[#9E7E38] text-[#0F1B2D] font-bold text-xs flex items-center justify-center shrink-0 shadow-xs border border-white/20">
              {initials}
            </div>
            {!isCollapsed && (
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-white truncate" title={user.email}>
                  {user.email}
                </p>
                <div className="mt-0.5">
                  <Badge variant={user.role === 'admin' ? 'admin' : 'editor'} showTooltip={false}>
                    {user.role === 'admin' ? 'Admin' : 'Editor'}
                  </Badge>
                </div>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={async () => {
              try {
                await fetch('/api/auth/logout', { method: 'POST' });
              } finally {
                window.location.href = '/admin/login';
              }
            }}
            title="Logout of Editorial Portal"
            className="p-2 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
    </>
  );
};

export default AdminSidebar;
