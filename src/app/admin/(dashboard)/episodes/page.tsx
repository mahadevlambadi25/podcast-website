'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  Mic,
  PlusCircle,
  Search,
  Filter,
  Trash2,
  Edit,
  Copy,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  MoreVertical,
  CheckCircle2,
  Clock,
  Archive,
  RefreshCw,
  AlertCircle,
  Eye,
  ArrowUpDown,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { useToast } from '@/components/ui/toast';

interface EpisodeItem {
  id: number;
  title: string;
  slug: string;
  status: 'draft' | 'published' | 'scheduled' | 'archived';
  episode_number?: number;
  season?: number;
  published_at?: string;
  created_at: string;
  guests: Array<{ id: number; full_name: string }>;
  topics: Array<{ id: number; name: string }>;
}

export default function EpisodesListPage() {
  const { success, error: toastError } = useToast();
  const [episodes, setEpisodes] = useState<EpisodeItem[]>([]);
  const [totalDocs, setTotalDocs] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('published_at');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [isLoading, setIsLoading] = useState(true);

  // Delete modal state
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [episodeToDelete, setEpisodeToDelete] = useState<EpisodeItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchEpisodes = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(limit),
        sort: sortBy,
        direction: sortDir,
      });
      if (statusFilter !== 'all') params.set('status', statusFilter);
      if (searchQuery.trim()) params.set('search', searchQuery.trim());

      const res = await fetch(`/api/admin/episodes?${params.toString()}`);
      if (!res.ok) throw new Error('Failed to load episodes');
      const data = await res.json();
      setEpisodes(data.docs || []);
      setTotalDocs(data.totalDocs || 0);
      setTotalPages(data.totalPages || 1);
    } catch (err: any) {
      toastError('Failed to load episodes', err.message);
    } finally {
      setIsLoading(false);
    }
  }, [page, limit, statusFilter, searchQuery, sortBy, sortDir, toastError]);

  useEffect(() => {
    fetchEpisodes();
  }, [fetchEpisodes]);

  const handleDelete = async () => {
    if (!episodeToDelete) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/admin/episodes/${episodeToDelete.id}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to delete episode');
      }
      success('Episode Deleted', `"${episodeToDelete.title}" has been deleted.`);
      setDeleteModalOpen(false);
      setEpisodeToDelete(null);
      fetchEpisodes();
    } catch (err: any) {
      toastError('Deletion Failed', err.message);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDuplicate = async (ep: EpisodeItem) => {
    try {
      // Fetch full episode
      const fullRes = await fetch(`/api/admin/episodes/${ep.id}`);
      const fullData = await fullRes.json();
      
      const newPayload = {
        ...fullData,
        id: undefined,
        title: `${fullData.title} (Copy)`,
        slug: `${fullData.slug}-copy-${Date.now()}`,
        status: 'draft',
        published_at: null,
        guest_ids: fullData.guests?.map((g: any) => g.id),
        topic_ids: fullData.topics?.map((t: any) => t.id),
      };

      const createRes = await fetch('/api/admin/episodes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newPayload),
      });

      if (!createRes.ok) throw new Error('Failed to duplicate');
      success('Episode Duplicated', 'A draft copy has been created.');
      fetchEpisodes();
    } catch (err: any) {
      toastError('Duplication Failed', err.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with Title and Create Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-serif font-bold text-slate-900">
            Podcast Episodes Catalog
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Manage audio releases, video embeds, show notes, and editorial publishing states.
          </p>
        </div>
        <Link
          href="/admin/episodes/new"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#C9A24B] hover:bg-[#D4B05C] text-[#0F1B2D] font-semibold text-sm shadow-md transition-all active:scale-[0.98] shrink-0"
        >
          <PlusCircle className="w-4 h-4 text-[#0F1B2D]" />
          <span>Create Episode</span>
        </Link>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setPage(1);
            }}
            placeholder="Search by title, topic, or slug..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#C9A24B] transition-all"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* Status Tabs / Filter */}
          <div className="inline-flex p-1 bg-slate-100 rounded-xl text-xs font-medium">
            {['all', 'published', 'draft', 'scheduled', 'archived'].map((st) => (
              <button
                key={st}
                onClick={() => {
                  setStatusFilter(st);
                  setPage(1);
                }}
                className={`px-3 py-1.5 rounded-lg capitalize transition-all ${
                  statusFilter === st
                    ? 'bg-white text-slate-900 shadow-xs font-semibold'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                {st}
              </button>
            ))}
          </div>

          <button
            onClick={() => fetchEpisodes()}
            title="Refresh Catalog"
            className="p-2 rounded-xl border border-slate-200 text-slate-500 hover:text-slate-900 hover:bg-slate-50 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Episodes Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50/70 border-b border-slate-200/80 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              <tr>
                <th className="py-3.5 px-4">Episode Title</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">Leaders / Guests</th>
                <th className="py-3.5 px-4">Topics</th>
                <th className="py-3.5 px-4">Published Date</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-[#C9A24B]" />
                    <span>Loading episodes...</span>
                  </td>
                </tr>
              ) : episodes.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <Mic className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                    <p className="font-medium text-slate-600">No episodes found</p>
                    <p className="text-xs text-slate-400 mt-1">
                      {searchQuery ? 'Try adjusting your search filters' : 'Create your first episode to get started'}
                    </p>
                  </td>
                </tr>
              ) : (
                episodes.map((ep) => (
                  <tr key={ep.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-medium text-slate-900 line-clamp-1">
                        <Link
                          href={`/admin/episodes/${ep.id}`}
                          className="hover:text-[#C9A24B] transition-colors"
                        >
                          {ep.title}
                        </Link>
                      </div>
                      <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-400">
                        {ep.episode_number && <span>EP {ep.episode_number}</span>}
                        {ep.season && <span>· Season {ep.season}</span>}
                        <span>· /{ep.slug}</span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
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
                    </td>

                    <td className="py-3.5 px-4">
                      {ep.guests && ep.guests.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {ep.guests.map((g) => (
                            <span
                              key={g.id}
                              className="inline-block px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-xs font-medium"
                            >
                              {g.full_name}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-slate-300 text-xs">—</span>
                      )}
                    </td>

                    <td className="py-3.5 px-4">
                      {ep.topics && ep.topics.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {ep.topics.map((t) => (
                            <span
                              key={t.id}
                              className="inline-block px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200/60 text-xs font-medium"
                            >
                              {t.name}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-slate-300 text-xs">—</span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-xs text-slate-500 whitespace-nowrap">
                      {ep.published_at
                        ? new Date(ep.published_at).toLocaleDateString(undefined, {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })
                        : 'Not published'}
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <div className="inline-flex items-center gap-1 justify-end">
                        <Link
                          href={`/admin/episodes/${ep.id}`}
                          title="Edit Episode"
                          className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                        >
                          <Edit className="w-4 h-4" />
                        </Link>
                        <button
                          type="button"
                          onClick={() => handleDuplicate(ep)}
                          title="Duplicate Episode"
                          className="p-1.5 rounded-lg text-slate-500 hover:text-[#C9A24B] hover:bg-slate-100 transition-colors"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                        <a
                          href={`/episodes/${ep.slug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          title="Preview on Public Website"
                          className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-slate-100 transition-colors"
                        >
                          <Eye className="w-4 h-4" />
                        </a>
                        <button
                          type="button"
                          onClick={() => {
                            setEpisodeToDelete(ep);
                            setDeleteModalOpen(true);
                          }}
                          title="Delete Episode"
                          className="p-1.5 rounded-lg text-slate-500 hover:text-red-600 hover:bg-red-50 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="p-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <div>
            Showing {(page - 1) * limit + (episodes.length > 0 ? 1 : 0)} to{' '}
            {Math.min(page * limit, totalDocs)} of {totalDocs} episodes
          </div>
          <div className="flex items-center gap-2">
            <button
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="p-2 rounded-lg border border-slate-200 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-2 font-medium">
              Page {page} of {totalPages}
            </span>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="p-2 rounded-lg border border-slate-200 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmDialog
        isOpen={deleteModalOpen}
        title="Delete Episode"
        description={`Are you sure you want to delete "${episodeToDelete?.title}"? This will permanently remove the episode, its show notes, quotes, and relationship links. This action cannot be undone.`}
        confirmText={isDeleting ? 'Deleting...' : 'Delete Episode'}
        cancelText="Cancel"
        variant="danger"
        onConfirm={handleDelete}
        onClose={() => setDeleteModalOpen(false)}
      />
    </div>
  );
}
