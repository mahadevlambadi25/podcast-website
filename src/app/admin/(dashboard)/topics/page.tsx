'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Tag,
  PlusCircle,
  Search,
  Trash2,
  Edit,
  RefreshCw,
  X,
  Save,
  Loader2,
  CheckCircle2,
} from 'lucide-react';
import { Dialog } from '@/components/ui/dialog';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { useToast } from '@/components/ui/toast';
import { generateSlug } from '@/utils/slug';

interface TopicItem {
  id: number;
  name: string;
  slug: string;
  description?: string;
  episode_count: number;
}

export default function TopicsPage() {
  const { success, error: toastError } = useToast();
  const [topics, setTopics] = useState<TopicItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTopic, setEditingTopic] = useState<TopicItem | null>(null);
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Delete State
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [topicToDelete, setTopicToDelete] = useState<TopicItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchTopics = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchQuery.trim()) params.set('search', searchQuery.trim());
      const res = await fetch(`/api/admin/topics?${params.toString()}`);
      if (!res.ok) throw new Error('Failed to load topics');
      const data = await res.json();
      setTopics(data.docs || []);
    } catch (err: any) {
      toastError('Load Error', err.message);
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery, toastError]);

  useEffect(() => {
    fetchTopics();
  }, [fetchTopics]);

  const openCreateModal = () => {
    setEditingTopic(null);
    setName('');
    setSlug('');
    setDescription('');
    setIsModalOpen(true);
  };

  const openEditModal = (t: TopicItem) => {
    setEditingTopic(t);
    setName(t.name);
    setSlug(t.slug);
    setDescription(t.description || '');
    setIsModalOpen(true);
  };

  const handleNameChange = (val: string) => {
    setName(val);
    if (!editingTopic || !slug) {
      setSlug(generateSlug(val));
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toastError('Validation', 'Topic name is required.');
      return;
    }

    setIsSaving(true);
    try {
      const payload = {
        name: name.trim(),
        slug: slug.trim() || generateSlug(name),
        description: description.trim() || null,
      };

      if (editingTopic) {
        const res = await fetch(`/api/admin/topics/${editingTopic.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to update topic');
        success('Topic Updated', `"${name}" topic was updated.`);
      } else {
        const res = await fetch('/api/admin/topics', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to create topic');
        success('Topic Created', `"${name}" topic was added.`);
      }

      setIsModalOpen(false);
      fetchTopics();
    } catch (err: any) {
      toastError('Save Error', err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!topicToDelete) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/admin/topics/${topicToDelete.id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete topic');
      success('Topic Deleted', `"${topicToDelete.name}" has been removed.`);
      setDeleteModalOpen(false);
      setTopicToDelete(null);
      fetchTopics();
    } catch (err: any) {
      toastError('Cannot Delete Topic', err.message);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-serif font-bold text-slate-900">
            Thematic Pillars & Topics
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Organize episodes into industry verticals, leadership themes, and core disciplines.
          </p>
        </div>
        <button
          type="button"
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#C9A24B] hover:bg-[#D4B05C] text-[#0F1B2D] font-semibold text-sm shadow-md transition-all active:scale-[0.98] shrink-0"
        >
          <PlusCircle className="w-4 h-4 text-[#0F1B2D]" />
          <span>Add New Topic</span>
        </button>
      </div>

      {/* Filter and Search */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between gap-4">
        <div className="relative w-full max-w-sm">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search topics by name or slug..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#C9A24B]"
          />
        </div>

        <button
          onClick={() => fetchTopics()}
          title="Refresh Topics"
          className="p-2 rounded-xl border border-slate-200 text-slate-500 hover:text-slate-900 hover:bg-slate-50"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Topics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoading ? (
          <div className="col-span-full py-16 text-center text-slate-400">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-[#C9A24B]" />
            <span>Loading topics...</span>
          </div>
        ) : topics.length === 0 ? (
          <div className="col-span-full py-16 text-center text-slate-400 bg-white rounded-2xl border">
            <Tag className="w-8 h-8 mx-auto mb-2 text-slate-300" />
            <p className="font-medium text-slate-700">No topics found</p>
          </div>
        ) : (
          topics.map((t) => (
            <div
              key={t.id}
              className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 hover:border-[#C9A24B]/40 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-xl bg-amber-50 text-amber-700 border border-amber-200/60">
                      <Tag className="w-4 h-4" />
                    </div>
                    <h3 className="font-semibold text-slate-900 text-sm">
                      {t.name}
                    </h3>
                  </div>
                  <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
                    {t.episode_count} {t.episode_count === 1 ? 'Episode' : 'Episodes'}
                  </span>
                </div>

                <p className="text-xs text-slate-400 font-mono">
                  Slug: /{t.slug}
                </p>

                {t.description && (
                  <p className="text-xs text-slate-600 mt-2 line-clamp-2 leading-relaxed">
                    {t.description}
                  </p>
                )}
              </div>

              <div className="flex items-center justify-end gap-1 mt-4 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => openEditModal(t)}
                  className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100"
                  title="Edit Topic"
                >
                  <Edit className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setTopicToDelete(t);
                    setDeleteModalOpen(true);
                  }}
                  className="p-1.5 rounded-lg text-slate-500 hover:text-red-600 hover:bg-red-50"
                  title="Delete Topic"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Create / Edit Topic Modal */}
      <Dialog
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingTopic ? 'Edit Topic' : 'Create New Topic'}
        maxWidth="md"
      >
        <form onSubmit={handleSave} className="space-y-4 pt-2 text-xs">
          <div>
            <label className="block font-semibold uppercase text-slate-700 mb-1">
              Topic Name *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="e.g. Artificial Intelligence"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm"
            />
          </div>

          <div>
            <label className="block font-semibold uppercase text-slate-700 mb-1">
              URL Slug *
            </label>
            <input
              type="text"
              required
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm"
            />
          </div>

          <div>
            <label className="block font-semibold uppercase text-slate-700 mb-1">
              Description
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Editorial pillar summary..."
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm"
            />
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-3.5 py-2 rounded-xl border text-slate-600 hover:bg-slate-50 text-xs font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#C9A24B] hover:bg-[#D4B05C] text-[#0F1B2D] text-xs font-semibold shadow-md disabled:opacity-50"
            >
              {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              <span>{editingTopic ? 'Save Changes' : 'Create Topic'}</span>
            </button>
          </div>
        </form>
      </Dialog>

      {/* Safe Delete Modal */}
      <ConfirmDialog
        isOpen={deleteModalOpen}
        title="Delete Topic"
        description={`Are you sure you want to delete "${topicToDelete?.name}"? The system will check if any episodes are currently assigned to this topic before allowing deletion.`}
        confirmText={isDeleting ? 'Checking Dependencies...' : 'Delete Topic'}
        cancelText="Cancel"
        variant="danger"
        onConfirm={handleDelete}
        onClose={() => setDeleteModalOpen(false)}
      />
    </div>
  );
}
