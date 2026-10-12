'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  ArrowRightLeft,
  PlusCircle,
  Trash2,
  RefreshCw,
  X,
  Save,
  Loader2,
} from 'lucide-react';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { useToast } from '@/components/ui/toast';

interface RedirectItem {
  id: number;
  from: string;
  to: string;
  type: string;
  created_at: string;
}

export default function RedirectsPage() {
  const { success, error: toastError } = useToast();
  const [redirects, setRedirects] = useState<RedirectItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [fromPath, setFromPath] = useState('');
  const [toPath, setToPath] = useState('');
  const [type, setType] = useState('301');
  const [isSaving, setIsSaving] = useState(false);

  // Delete State
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [ruleToDelete, setRuleToDelete] = useState<RedirectItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchRedirects = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/admin/redirects');
      if (!res.ok) throw new Error('Failed to load redirects');
      const data = await res.json();
      setRedirects(data.docs || []);
    } catch (err: any) {
      toastError('Load Error', err.message);
    } finally {
      setIsLoading(false);
    }
  }, [toastError]);

  useEffect(() => {
    fetchRedirects();
  }, [fetchRedirects]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fromPath.trim() || !toPath.trim()) {
      toastError('Validation', 'Both source (from) and target (to) paths are required.');
      return;
    }

    setIsSaving(true);
    try {
      const res = await fetch('/api/admin/redirects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from: fromPath.trim(),
          to: toPath.trim(),
          type,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create redirect');

      success('Redirect Saved', `Redirect rule ${fromPath} -> ${toPath} created.`);
      setIsModalOpen(false);
      setFromPath('');
      setToPath('');
      fetchRedirects();
    } catch (err: any) {
      toastError('Save Error', err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!ruleToDelete) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/admin/redirects/${ruleToDelete.id}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Failed to delete redirect');
      success('Redirect Removed', 'Redirect rule deleted.');
      setDeleteModalOpen(false);
      setRuleToDelete(null);
      fetchRedirects();
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
            SEO & URL Redirects
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Manage permanent (301) and temporary (302) redirects to preserve SEO rankings and fix broken links.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#C9A24B] hover:bg-[#D4B05C] text-[#0F1B2D] font-semibold text-sm shadow-md transition-all active:scale-[0.98] shrink-0"
        >
          <PlusCircle className="w-4 h-4 text-[#0F1B2D]" />
          <span>Add Redirect Rule</span>
        </button>
      </div>

      {/* Redirects Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50/70 border-b text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              <tr>
                <th className="py-3.5 px-4">From (Source Path)</th>
                <th className="py-3.5 px-4">To (Target Destination)</th>
                <th className="py-3.5 px-4">Status Code</th>
                <th className="py-3.5 px-4">Created Date</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-[#C9A24B]" />
                    <span>Loading redirect rules...</span>
                  </td>
                </tr>
              ) : redirects.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400">
                    <ArrowRightLeft className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                    <p className="font-medium text-slate-600">No redirect rules defined</p>
                  </td>
                </tr>
              ) : (
                redirects.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3.5 px-4 font-mono text-xs text-slate-800">
                      {r.from}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-xs text-slate-800">
                      {r.to}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
                        {r.type}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-xs text-slate-400">
                      {new Date(r.created_at).toLocaleDateString()}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        type="button"
                        onClick={() => {
                          setRuleToDelete(r);
                          setDeleteModalOpen(true);
                        }}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-red-600 hover:bg-red-50"
                        title="Delete Redirect"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Redirect Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-6 border border-slate-100">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h2 className="text-base font-serif font-bold text-slate-900">
                Create Redirect Rule
              </h2>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-900"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4 py-4 text-xs">
              <div>
                <label className="block font-semibold uppercase text-slate-700 mb-1">
                  Source Path (From) *
                </label>
                <input
                  type="text"
                  required
                  value={fromPath}
                  onChange={(e) => setFromPath(e.target.value)}
                  placeholder="/old-podcast-link"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold uppercase text-slate-700 mb-1">
                  Target Destination (To) *
                </label>
                <input
                  type="text"
                  required
                  value={toPath}
                  onChange={(e) => setToPath(e.target.value)}
                  placeholder="/episodes/new-slug"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold uppercase text-slate-700 mb-1">
                  HTTP Status Code
                </label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold"
                >
                  <option value="301">301 — Moved Permanently (Default SEO recommendation)</option>
                  <option value="308">308 — Permanent Redirect (Preserves HTTP Method)</option>
                  <option value="302">302 — Found / Temporary Redirect</option>
                  <option value="307">307 — Temporary Redirect (Preserves HTTP Method)</option>
                </select>
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
                  <span>Save Rule</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmDialog
        isOpen={deleteModalOpen}
        title="Delete Redirect Rule"
        description={`Are you sure you want to delete redirect: ${ruleToDelete?.from} -> ${ruleToDelete?.to}?`}
        confirmText={isDeleting ? 'Deleting...' : 'Delete Rule'}
        cancelText="Cancel"
        variant="danger"
        onConfirm={handleDelete}
        onClose={() => setDeleteModalOpen(false)}
      />
    </div>
  );
}
