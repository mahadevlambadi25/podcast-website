'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Inbox,
  Search,
  Trash2,
  RefreshCw,
  X,
  Save,
  CheckCircle2,
  Clock,
  XCircle,
  Eye,
  Loader2,
  ExternalLink,
} from 'lucide-react';
import { Sheet } from '@/components/ui/sheet';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { useToast } from '@/components/ui/toast';

interface NominationItem {
  id: number;
  guest_name: string;
  guest_role_company: string;
  profile_link?: string;
  reason?: string;
  status: 'pending' | 'under_review' | 'approved' | 'declined';
  internal_notes?: string;
  name?: string;
  email?: string;
  created_at: string;
}

export default function NominationsPage() {
  const { success, error: toastError } = useToast();
  const [nominations, setNominations] = useState<NominationItem[]>([]);
  const [totalDocs, setTotalDocs] = useState(0);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Detail Drawer State
  const [selectedNom, setSelectedNom] = useState<NominationItem | null>(null);
  const [editStatus, setEditStatus] = useState<'pending' | 'under_review' | 'approved' | 'declined'>('pending');
  const [editNotes, setEditNotes] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  // Safe Delete State
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [nomToDelete, setNomToDelete] = useState<NominationItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchNominations = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: '15',
      });
      if (statusFilter !== 'all') params.set('status', statusFilter);
      if (searchQuery.trim()) params.set('search', searchQuery.trim());

      const res = await fetch(`/api/admin/nominations?${params.toString()}`);
      if (!res.ok) throw new Error('Failed to load nominations');
      const data = await res.json();
      setNominations(data.docs || []);
      setTotalDocs(data.totalDocs || 0);
    } catch (err: any) {
      toastError('Load Error', err.message);
    } finally {
      setIsLoading(false);
    }
  }, [page, statusFilter, searchQuery, toastError]);

  useEffect(() => {
    fetchNominations();
  }, [fetchNominations]);

  const openDetailDrawer = (nom: NominationItem) => {
    setSelectedNom(nom);
    setEditStatus(nom.status);
    setEditNotes(nom.internal_notes || '');
  };

  const handleUpdate = async () => {
    if (!selectedNom) return;
    setIsUpdating(true);
    try {
      const res = await fetch(`/api/admin/nominations/${selectedNom.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: editStatus,
          internal_notes: editNotes.trim(),
        }),
      });
      if (!res.ok) throw new Error('Failed to update nomination status');
      success('Nomination Updated', `Status changed to "${editStatus.replace('_', ' ')}".`);
      setSelectedNom(null);
      fetchNominations();
    } catch (err: any) {
      toastError('Update Error', err.message);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDelete = async () => {
    if (!nomToDelete) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/admin/nominations/${nomToDelete.id}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Failed to delete nomination');
      success('Nomination Removed', `Deleted nomination for "${nomToDelete.guest_name}".`);
      setDeleteModalOpen(false);
      setNomToDelete(null);
      if (selectedNom?.id === nomToDelete.id) setSelectedNom(null);
      fetchNominations();
    } catch (err: any) {
      toastError('Delete Error', err.message);
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
            Guest Nominations & Submissions
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Review recommendations submitted by listeners and industry partners.
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by nominee, company, or nominator..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#C9A24B]"
          />
        </div>

        <div className="flex items-center gap-3">
          <div className="inline-flex p-1 bg-slate-100 rounded-xl text-xs font-medium">
            {['all', 'pending', 'under_review', 'approved', 'declined'].map((st) => (
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
                {st.replace('_', ' ')}
              </button>
            ))}
          </div>

          <button
            onClick={() => fetchNominations()}
            title="Refresh Queue"
            className="p-2 rounded-xl border border-slate-200 text-slate-500 hover:text-slate-900 hover:bg-slate-50"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Nominations Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50/70 border-b text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              <tr>
                <th className="py-3.5 px-4">Candidate / Leader</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">Reason / Pitch</th>
                <th className="py-3.5 px-4">Submitted By</th>
                <th className="py-3.5 px-4">Date</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-[#C9A24B]" />
                    <span>Loading submissions...</span>
                  </td>
                </tr>
              ) : nominations.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <Inbox className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                    <p className="font-medium text-slate-600">No nominations found</p>
                  </td>
                </tr>
              ) : (
                nominations.map((nom) => (
                  <tr key={nom.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3.5 px-4">
                      <div
                        onClick={() => openDetailDrawer(nom)}
                        className="font-medium text-slate-900 cursor-pointer hover:text-[#C9A24B]"
                      >
                        {nom.guest_name}
                      </div>
                      <div className="text-xs text-slate-400 mt-0.5 truncate max-w-xs">
                        {nom.guest_role_company || 'Executive'}
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-full capitalize whitespace-nowrap ${
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
                    </td>

                    <td className="py-3.5 px-4 max-w-xs">
                      <p className="text-xs text-slate-600 line-clamp-2">
                        {nom.reason || '—'}
                      </p>
                    </td>

                    <td className="py-3.5 px-4 text-xs">
                      <p className="font-medium text-slate-800">{nom.name || 'Anonymous'}</p>
                      <p className="text-slate-400">{nom.email || '—'}</p>
                    </td>

                    <td className="py-3.5 px-4 text-xs text-slate-400 whitespace-nowrap">
                      {new Date(nom.created_at).toLocaleDateString()}
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <div className="inline-flex items-center gap-1 justify-end">
                        <button
                          type="button"
                          onClick={() => openDetailDrawer(nom)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100"
                          title="Review Nomination"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setNomToDelete(nom);
                            setDeleteModalOpen(true);
                          }}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-red-600 hover:bg-red-50"
                          title="Delete Submission"
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
      </div>

      {/* Review Drawer */}
      <Sheet
        isOpen={Boolean(selectedNom)}
        onClose={() => setSelectedNom(null)}
        title="Candidate Nomination Review"
        description={selectedNom ? `ID: ${selectedNom.id} · Submitted ${new Date(selectedNom.created_at).toLocaleString()}` : ''}
        width="lg"
        footer={
          selectedNom && (
            <div className="w-full flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => {
                  setNomToDelete(selectedNom);
                  setDeleteModalOpen(true);
                }}
                className="px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 rounded-xl flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete</span>
              </button>

              <button
                type="button"
                onClick={handleUpdate}
                disabled={isUpdating}
                className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-[#C9A24B] hover:bg-[#D4B05C] text-[#0F1B2D] text-xs font-semibold shadow-md disabled:opacity-50"
              >
                {isUpdating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                <span>Save Review</span>
              </button>
            </div>
          )
        }
      >
        {selectedNom && (
          <div className="space-y-4">
            {/* Nominee Details Card */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2 text-xs">
              <div>
                <span className="font-semibold text-slate-500 uppercase">Nominee:</span>
                <p className="text-sm font-bold text-slate-900 mt-0.5">{selectedNom.guest_name}</p>
              </div>
              <div>
                <span className="font-semibold text-slate-500 uppercase">Role & Organization:</span>
                <p className="text-slate-800 mt-0.5">{selectedNom.guest_role_company || '—'}</p>
              </div>
              {selectedNom.profile_link && (
                <div>
                  <span className="font-semibold text-slate-500 uppercase">Profile Link:</span>
                  <a
                    href={selectedNom.profile_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#C9A24B] hover:underline flex items-center gap-1 mt-0.5 break-all"
                  >
                    <span>{selectedNom.profile_link}</span>
                    <ExternalLink className="w-3 h-3 shrink-0" />
                  </a>
                </div>
              )}
              <div>
                <span className="font-semibold text-slate-500 uppercase">Editorial Pitch / Why them:</span>
                <p className="text-slate-700 mt-0.5 whitespace-pre-wrap leading-relaxed">
                  {selectedNom.reason || 'No pitch provided.'}
                </p>
              </div>
              <div className="pt-2 border-t border-slate-200/60">
                <span className="font-semibold text-slate-500 uppercase">Submitted By:</span>
                <p className="text-slate-800 mt-0.5">
                  {selectedNom.name} &lt;{selectedNom.email}&gt;
                </p>
              </div>
            </div>

            {/* Reviewer Action Form */}
            <div className="space-y-4 pt-2 text-xs">
              <div>
                <label className="block font-semibold uppercase text-slate-700 mb-1">
                  Editorial Review Decision
                </label>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value as any)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold capitalize"
                >
                  <option value="pending">Pending Review</option>
                  <option value="under_review">Under Editorial Review</option>
                  <option value="approved">Approved for Invitation</option>
                  <option value="declined">Declined</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold uppercase text-slate-700 mb-1">
                  Internal Editorial Notes
                </label>
                <textarea
                  rows={4}
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  placeholder="Private notes for the production team regarding scheduling, topic alignment, or research..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                />
              </div>
            </div>
          </div>
        )}
      </Sheet>

      {/* Delete Confirmation Modal */}
      <ConfirmDialog
        isOpen={deleteModalOpen}
        title="Delete Nomination"
        description={`Are you sure you want to delete the nomination for "${nomToDelete?.guest_name}"?`}
        confirmText={isDeleting ? 'Deleting...' : 'Delete Nomination'}
        cancelText="Cancel"
        variant="danger"
        onConfirm={handleDelete}
        onClose={() => setDeleteModalOpen(false)}
      />
    </div>
  );
}
