import React from 'react';
import Link from 'next/link';
import {
  Mic,
  Mic2,
  Inbox,
  MessageSquare,
  Image as ImageIcon,
  CheckCircle2,
  Clock,
  FileText,
  ArrowUpRight,
  PlusCircle,
  Sparkles,
  Calendar,
  ChevronRight,
  ExternalLink,
} from 'lucide-react';
import { getDashboardMetrics } from '@/services/metrics.service';
import { Badge } from '@/components/ui/badge';
import { PageHeader } from '@/components/layout/PageHeader';

export default async function AdminDashboardPage() {
  const data = await getDashboardMetrics();
  const { counts, recentEpisodes, recentNominations, recentMessages, publishingActivity } = data;

  const statCards = [
    {
      label: 'Total Episodes',
      value: counts.totalEpisodes,
      sub: `${counts.publishedEpisodes} Published · ${counts.draftEpisodes} Drafts · ${counts.scheduledEpisodes} Scheduled`,
      icon: Mic,
      href: '/admin/episodes',
      color: 'from-blue-600/20 to-blue-800/10 text-blue-700',
    },
    {
      label: 'Leader Directory',
      value: counts.totalGuests,
      sub: 'Featured CEOs & Visionaries',
      icon: Mic2,
      href: '/admin/guests',
      color: 'from-amber-600/20 to-amber-800/10 text-amber-700',
    },
    {
      label: 'Candidate Nominations',
      value: counts.pendingNominations,
      sub: counts.pendingNominations > 0 ? 'Pending editorial review' : 'Queue up to date',
      icon: Inbox,
      href: '/admin/nominations',
      badge: counts.pendingNominations > 0 ? `${counts.pendingNominations} Pending` : undefined,
      color: 'from-emerald-600/20 to-emerald-800/10 text-emerald-700',
    },
    {
      label: 'Audience Messages',
      value: counts.unreadMessages,
      sub: `${counts.unreadMessages} Inquiries received`,
      icon: MessageSquare,
      href: '/admin/contact-messages',
      color: 'from-purple-600/20 to-purple-800/10 text-purple-700',
    },
    {
      label: 'Media Assets',
      value: counts.totalMedia,
      sub: 'Posters, audio & portraits',
      icon: ImageIcon,
      href: '/admin/media',
      color: 'from-slate-600/20 to-slate-800/10 text-slate-700',
    },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Top Banner / Welcome Header */}
      <div className="bg-[#0F1B2D] rounded-2xl p-6 lg:p-8 text-white relative overflow-hidden shadow-xl border border-white/10">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#C9A24B]/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#C9A24B]/15 border border-[#C9A24B]/30 text-[#C9A24B] text-xs font-semibold mb-3">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Editorial Command Center</span>
            </div>
            <h1 className="text-2xl lg:text-3xl font-serif font-bold text-white tracking-tight">
              Unchartered — Legends & Legacies
            </h1>
            <p className="mt-1 text-sm text-slate-300 max-w-xl">
              Curate executive leadership interviews, manage guest profiles, schedule broadcast releases, and review audience submissions.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/admin/episodes/new"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#C9A24B] hover:bg-[#D4B05C] text-[#0F1B2D] font-semibold text-sm shadow-md transition-all active:scale-[0.98]"
            >
              <PlusCircle className="w-4 h-4 text-[#0F1B2D]" />
              <span>New Episode</span>
            </Link>
            <Link
              href="/admin/guests"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white font-medium text-sm border border-white/10 transition-all"
            >
              <Mic2 className="w-4 h-4 text-[#C9A24B]" />
              <span>Add Leader</span>
            </Link>
            <a
              href="/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white font-medium text-sm border border-white/5 transition-all"
            >
              <span>Live Site</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </div>

      {/* Real Metric Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <Link
              key={card.label}
              href={card.href}
              className="group p-5 bg-white rounded-2xl border border-slate-200/80 hover:border-[#C9A24B]/50 hover:shadow-lg transition-all flex flex-col justify-between"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  {card.label}
                </span>
                <div className={`p-2 rounded-xl bg-gradient-to-br ${card.color} group-hover:scale-110 transition-transform`}>
                  <Icon className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-4">
                <div className="text-3xl font-serif font-bold text-slate-900">
                  {card.value}
                </div>
                <p className="mt-1 text-xs text-slate-500 font-medium line-clamp-1">
                  {card.sub}
                </p>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Two Column Section: Recent Episodes & Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Cols: Recent Broadcast Episodes */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden flex flex-col">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h2 className="text-base font-serif font-bold text-slate-900">
                Recent Broadcast Episodes
              </h2>
              <p className="text-xs text-slate-500">
                Latest episodes cataloged in the SQLite database
              </p>
            </div>
            <Link
              href="/admin/episodes"
              className="inline-flex items-center gap-1 text-xs font-semibold text-[#C9A24B] hover:text-[#9E7E38] transition-colors"
            >
              <span>View All</span>
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="divide-y divide-slate-100 flex-1">
            {recentEpisodes.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-sm">
                No episodes found in the database.
              </div>
            ) : (
              recentEpisodes.map((ep) => (
                <div
                  key={ep.id}
                  className="p-4 hover:bg-slate-50/70 transition-colors flex items-center justify-between gap-4"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge
                        variant={
                          ep.status === 'published'
                            ? 'published'
                            : ep.status === 'scheduled'
                            ? 'scheduled'
                            : 'draft'
                        }
                        showTooltip={false}
                      >
                        {ep.status}
                      </Badge>
                      {ep.episode_number && (
                        <span className="text-[11px] font-semibold text-slate-500">
                          EP {ep.episode_number}
                        </span>
                      )}
                    </div>
                    <Link
                      href={`/admin/episodes/${ep.id}`}
                      className="text-sm font-semibold text-slate-900 hover:text-[#C9A24B] transition-colors truncate block"
                    >
                      {ep.title}
                    </Link>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Slug: /{ep.slug}
                    </p>
                  </div>

                  <div className="text-right shrink-0">
                    <Link
                      href={`/admin/episodes/${ep.id}`}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-[#C9A24B] text-slate-700 hover:text-white text-xs font-medium transition-all"
                    >
                      <span>Edit</span>
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right 1 Col: Recent Leader Nominations */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden flex flex-col">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h2 className="text-base font-serif font-bold text-slate-900">
                Leader Nominations
              </h2>
              <p className="text-xs text-slate-500">
                Audience & partner submissions
              </p>
            </div>
            <Link
              href="/admin/nominations"
              className="inline-flex items-center gap-1 text-xs font-semibold text-[#C9A24B] hover:text-[#9E7E38] transition-colors"
            >
              <span>View All</span>
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="divide-y divide-slate-100 flex-1">
            {recentNominations.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-sm">
                No nominations in the queue.
              </div>
            ) : (
              recentNominations.slice(0, 5).map((nom) => (
                <div key={nom.id} className="p-4 hover:bg-slate-50/70 transition-colors">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="text-sm font-semibold text-slate-900 truncate">
                      {nom.guest_name}
                    </span>
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-full capitalize ${
                        nom.status === 'approved'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : nom.status === 'declined'
                          ? 'bg-rose-50 text-rose-700 border border-rose-200'
                          : nom.status === 'under_review'
                          ? 'bg-amber-50 text-amber-700 border border-amber-200'
                          : 'bg-slate-100 text-slate-700 border border-slate-200'
                      }`}
                    >
                      {nom.status.replace('_', ' ')}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 truncate">
                    {nom.guest_role_company || 'Executive'}
                  </p>
                  <p className="text-[11px] text-slate-400 mt-1">
                    By: {nom.email || 'Website Visitor'}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Recent Contact Inquiries */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-base font-serif font-bold text-slate-900">
              Recent Inquiries & Contact Submissions
            </h2>
            <p className="text-xs text-slate-500">
              Listener feedback, speaking requests & press inquiries
            </p>
          </div>
          <Link
            href="/admin/contact-messages"
            className="inline-flex items-center gap-1 text-xs font-semibold text-[#C9A24B] hover:text-[#9E7E38] transition-colors"
          >
            <span>Open Inbox</span>
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="divide-y divide-slate-100">
          {recentMessages.slice(0, 4).map((msg) => (
            <div key={msg.id} className="p-4 hover:bg-slate-50/70 transition-colors flex items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-slate-900">
                    {msg.name}
                  </span>
                  <span className="text-xs text-slate-400">
                    &lt;{msg.email}&gt;
                  </span>
                </div>
                <p className="text-xs text-slate-600 mt-1 line-clamp-1">
                  {msg.message}
                </p>
              </div>
              <span className="text-[11px] text-slate-400 whitespace-nowrap">
                {new Date(msg.created_at).toLocaleDateString()}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
