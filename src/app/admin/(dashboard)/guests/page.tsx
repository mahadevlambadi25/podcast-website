'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  Mic2,
  PlusCircle,
  Search,
  Trash2,
  Edit,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Eye,
  Linkedin,
  Globe,
  X,
  Save,
  Loader2,
  AlertTriangle,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Sheet } from '@/components/ui/sheet';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { useToast } from '@/components/ui/toast';
import { generateSlug } from '@/utils/slug';
import { normalizeUrl, normalizeImageUrl } from '@/utils/url';

interface GuestItem {
  id: number;
  full_name: string;
  slug: string;
  role?: string;
  company?: string;
  short_overview?: string;
  biography?: string;
  portrait_url?: string;
  links_linkedin?: string;
  links_website?: string;
  featured?: boolean;
  status: 'draft' | 'published' | 'archived';
  episode_count: number;
}

export default function GuestsPage() {
  const { success, error: toastError } = useToast();
  const [guests, setGuests] = useState<GuestItem[]>([]);
  const [totalDocs, setTotalDocs] = useState(0);
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isLoading, setIsLoading] = useState(true);

  // Drawer / Modal state for Create / Edit
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingGuest, setEditingGuest] = useState<GuestItem | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Form Fields
  const [fullName, setFullName] = useState('');
  const [slug, setSlug] = useState('');
  const [role, setRole] = useState('');
  const [company, setCompany] = useState('');
  const [shortOverview, setShortOverview] = useState('');
  const [biography, setBiography] = useState('');
  const [portraitUrl, setPortraitUrl] = useState('');
  const [linkedinUrl, setLinkedinUrl] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [guestStatus, setGuestStatus] = useState<'published' | 'draft' | 'archived'>('published');
  const [featured, setFeatured] = useState(false);

  // Safe Delete Modal
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [guestToDelete, setGuestToDelete] = useState<GuestItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchGuests = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: '12',
      });
      if (searchQuery.trim()) params.set('search', searchQuery.trim());
      if (statusFilter !== 'all') params.set('status', statusFilter);

      const res = await fetch(`/api/admin/guests?${params.toString()}`);
      if (!res.ok) throw new Error('Failed to load guests');
      const data = await res.json();
      setGuests(data.docs || []);
      setTotalDocs(data.totalDocs || 0);
    } catch (err: any) {
      toastError('Failed to load guests', err.message);
    } finally {
      setIsLoading(false);
    }
  }, [page, searchQuery, statusFilter, toastError]);

  useEffect(() => {
    fetchGuests();
  }, [fetchGuests]);

  const openCreateModal = () => {
    setEditingGuest(null);
    setFullName('');
    setSlug('');
    setRole('');
    setCompany('');
    setShortOverview('');
    setBiography('');
    setPortraitUrl('');
    setLinkedinUrl('');
    setWebsiteUrl('');
    setGuestStatus('published');
    setFeatured(false);
    setIsDrawerOpen(true);
  };

  const openEditModal = (g: GuestItem) => {
    setEditingGuest(g);
    setFullName(g.full_name);
    setSlug(g.slug);
    setRole(g.role || '');
    setCompany(g.company || '');
    setShortOverview(g.short_overview || '');
    setBiography(g.biography || '');
    setPortraitUrl(g.portrait_url || '');
    setLinkedinUrl(g.links_linkedin || '');
    setWebsiteUrl(g.links_website || '');
    setGuestStatus(g.status || 'published');
    setFeatured(Boolean(g.featured));
    setIsDrawerOpen(true);
  };

  const handleNameChange = (val: string) => {
    setFullName(val);
    if (!editingGuest || !slug) {
      setSlug(generateSlug(val));
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) {
      toastError('Validation', 'Full name is required.');
      return;
    }

    const cleanPortrait = portraitUrl.trim() ? normalizeImageUrl(portraitUrl.trim()) : null;
    const cleanLinkedin = linkedinUrl.trim() ? normalizeUrl(linkedinUrl.trim()) : null;
    const cleanWebsite = websiteUrl.trim() ? normalizeUrl(websiteUrl.trim()) : null;

    setIsSaving(true);
    try {
      const payload = {
        full_name: fullName.trim(),
        slug: slug.trim() || generateSlug(fullName),
        role: role.trim() || null,
        company: company.trim() || null,
        short_overview: shortOverview.trim() || null,
        biography: biography.trim() || null,
        portrait_url: cleanPortrait,
        links_linkedin: cleanLinkedin,
        links_website: cleanWebsite,
        status: guestStatus,
        featured,
      };

      if (editingGuest) {
        const res = await fetch(`/api/admin/guests/${editingGuest.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || 'Failed to update guest');
        }
        success('Leader Updated', `"${fullName}" profile has been updated.`);
      } else {
        const res = await fetch('/api/admin/guests', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || 'Failed to create guest');
        }
        success('Leader Added', `"${fullName}" has been added to the directory.`);
      }

      setIsDrawerOpen(false);
      fetchGuests();
    } catch (err: any) {
      toastError('Save Error', err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!guestToDelete) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/admin/guests/${guestToDelete.id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Cannot delete guest');
      }
      success('Leader Removed', `"${guestToDelete.full_name}" has been deleted.`);
      setDeleteModalOpen(false);
      setGuestToDelete(null);
      fetchGuests();
    } catch (err: any) {
      toastError('Safe Deletion Check Blocked Action', err.message);
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
            Leaders & Visionaries Directory
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Manage executive bios, company affiliations, credentials, and episode associations.
          </p>
        </div>
        <button
          type="button"
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#C9A24B] hover:bg-[#D4B05C] text-[#0F1B2D] font-semibold text-sm shadow-md transition-all active:scale-[0.98] shrink-0"
        >
          <PlusCircle className="w-4 h-4 text-[#0F1B2D]" />
          <span>Add New Leader</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setPage(1);
            }}
            placeholder="Search by name, company, or role..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#C9A24B]"
          />
        </div>

        <div className="flex items-center gap-3">
          <div className="inline-flex p-1 bg-slate-100 rounded-xl text-xs font-medium">
            {['all', 'published', 'draft'].map((st) => (
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
            onClick={() => fetchGuests()}
            title="Refresh"
            className="p-2 rounded-xl border border-slate-200 text-slate-500 hover:text-slate-900 hover:bg-slate-50"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Guests Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {isLoading ? (
          <div className="col-span-full py-16 text-center text-slate-400">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-[#C9A24B]" />
            <span>Loading leaders directory...</span>
          </div>
        ) : guests.length === 0 ? (
          <div className="col-span-full py-16 text-center text-slate-400 bg-white rounded-2xl border">
            <Mic2 className="w-8 h-8 mx-auto mb-2 text-slate-300" />
            <p className="font-medium text-slate-700">No leaders found</p>
            <p className="text-xs text-slate-400 mt-1">
              Add guest profiles to associate them with episodes.
            </p>
          </div>
        ) : (
          guests.map((g) => (
            <div
              key={g.id}
              className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 hover:border-[#C9A24B]/40 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-[#0F1B2D] text-[#C9A24B] font-bold text-sm flex items-center justify-center shrink-0 border border-[#C9A24B]/20 overflow-hidden relative">
                      {g.portrait_url ? (
                        <img
                          src={g.portrait_url}
                          alt={g.full_name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLElement).style.display = 'none';
                          }}
                        />
                      ) : (
                        g.full_name
                          .split(' ')
                          .map((n) => n[0])
                          .slice(0, 2)
                          .join('')
                      )}
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-900 text-sm leading-snug">
                        {g.full_name}
                      </h3>
                      <p className="text-xs text-slate-500 line-clamp-1">
                        {g.role ? `${g.role}${g.company ? ` at ${g.company}` : ''}` : g.company || 'Executive'}
                      </p>
                    </div>
                  </div>

                  <Badge variant={g.status === 'published' ? 'published' : 'draft'} showTooltip={false}>
                    {g.status}
                  </Badge>
                </div>

                {g.short_overview && (
                  <p className="text-xs text-slate-600 line-clamp-2 mt-2 leading-relaxed">
                    {g.short_overview}
                  </p>
                )}

                <div className="flex items-center gap-2 mt-3 pt-3 border-t border-slate-100 text-xs text-slate-500">
                  <span className="inline-flex items-center gap-1 font-medium text-slate-700 bg-slate-100 px-2.5 py-0.5 rounded-md">
                    {g.episode_count} {g.episode_count === 1 ? 'Episode' : 'Episodes'}
                  </span>
                  {g.links_linkedin && (
                    <a
                      href={g.links_linkedin}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-slate-400 hover:text-blue-600 p-1"
                      title="LinkedIn Profile"
                    >
                      <Linkedin className="w-3.5 h-3.5" />
                    </a>
                  )}
                  {g.links_website && (
                    <a
                      href={g.links_website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-slate-400 hover:text-slate-700 p-1"
                      title="Personal Website"
                    >
                      <Globe className="w-3.5 h-3.5" />
                    </a>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between gap-2 mt-4 pt-3 border-t border-slate-100">
                <a
                  href={`/guests/${g.slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-slate-500 hover:text-[#C9A24B] inline-flex items-center gap-1"
                >
                  <span>Preview</span>
                  <ExternalLink className="w-3 h-3" />
                </a>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => openEditModal(g)}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                    title="Edit Leader"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setGuestToDelete(g);
                      setDeleteModalOpen(true);
                    }}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-red-600 hover:bg-red-50 transition-colors"
                    title="Delete Leader"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add / Edit Drawer Modal */}
      <Sheet
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        title={editingGuest ? 'Edit Leader Profile' : 'Add New Leader'}
        description={editingGuest ? 'Update profile information, company credentials, and portrait image.' : 'Add a new executive profile to associate with podcast episodes.'}
        width="lg"
        footer={
          <>
            <button
              type="button"
              onClick={() => setIsDrawerOpen(false)}
              className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              form="guest-form"
              disabled={isSaving}
              className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-[#C9A24B] hover:bg-[#D4B05C] text-[#0F1B2D] text-xs font-semibold shadow-md disabled:opacity-50"
            >
              {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              <span>{editingGuest ? 'Save Changes' : 'Create Leader'}</span>
            </button>
          </>
        }
      >
        <form id="guest-form" onSubmit={handleSave} className="space-y-4 py-1 text-xs">
                <div>
                  <label className="block font-semibold uppercase text-slate-700 mb-1">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => handleNameChange(e.target.value)}
                    placeholder="e.g. Elena Rostova"
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

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold uppercase text-slate-700 mb-1">
                      Title / Role
                    </label>
                    <input
                      type="text"
                      value={role}
                      onChange={(e) => setRole(e.target.value)}
                      placeholder="e.g. Co-Founder & CEO"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold uppercase text-slate-700 mb-1">
                      Company / Affiliation
                    </label>
                    <input
                      type="text"
                      value={company}
                      onChange={(e) => setCompany(e.target.value)}
                      placeholder="e.g. Quantum Dynamics"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold uppercase text-slate-700 mb-1">
                    Short Overview (Card Blurb)
                  </label>
                  <textarea
                    rows={2}
                    value={shortOverview}
                    onChange={(e) => setShortOverview(e.target.value)}
                    placeholder="Brief 1-sentence credentials summary"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                  />
                </div>

                <div>
                  <label className="block font-semibold uppercase text-slate-700 mb-1">
                    Full Biography
                  </label>
                  <textarea
                    rows={5}
                    value={biography}
                    onChange={(e) => setBiography(e.target.value)}
                    placeholder="Comprehensive executive background and achievements..."
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                  />
                </div>

                <div>
                  <label className="block font-semibold uppercase text-slate-700 mb-1">
                    Portrait Image URL
                  </label>
                  <input
                    type="text"
                    value={portraitUrl}
                    onChange={(e) => setPortraitUrl(e.target.value)}
                    onBlur={() => {
                      if (portraitUrl.trim()) {
                        const norm = normalizeImageUrl(portraitUrl.trim());
                        if (norm) setPortraitUrl(norm);
                      }
                    }}
                    placeholder="https://... or /placeholders/portrait-placeholder.svg"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    Accepts HTTPS image URLs or relative media paths (e.g. /placeholders/...).
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold uppercase text-slate-700 mb-1">
                      LinkedIn Profile
                    </label>
                    <input
                      type="text"
                      value={linkedinUrl}
                      onChange={(e) => setLinkedinUrl(e.target.value)}
                      onBlur={() => {
                        if (linkedinUrl.trim()) {
                          const norm = normalizeUrl(linkedinUrl.trim());
                          if (norm) setLinkedinUrl(norm);
                        }
                      }}
                      placeholder="linkedin.com/in/... or https://..."
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                    />
                    <p className="text-[11px] text-slate-400 mt-1">
                      https:// optional; auto-formatted on save.
                    </p>
                  </div>
                  <div>
                    <label className="block font-semibold uppercase text-slate-700 mb-1">
                      Website URL
                    </label>
                    <input
                      type="text"
                      value={websiteUrl}
                      onChange={(e) => setWebsiteUrl(e.target.value)}
                      onBlur={() => {
                        if (websiteUrl.trim()) {
                          const norm = normalizeUrl(websiteUrl.trim());
                          if (norm) setWebsiteUrl(norm);
                        }
                      }}
                      placeholder="example.com or https://..."
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                    />
                    <p className="text-[11px] text-slate-400 mt-1">
                      https:// optional; auto-formatted on save.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div>
                    <label className="block font-semibold uppercase text-slate-700 mb-1">
                      Status
                    </label>
                    <select
                      value={guestStatus}
                      onChange={(e) => setGuestStatus(e.target.value as any)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                    >
                      <option value="published">Published</option>
                      <option value="draft">Draft</option>
                      <option value="archived">Archived</option>
                    </select>
                  </div>
                  <div className="flex items-center gap-2 pt-6">
                    <input
                      id="guest-featured"
                      type="checkbox"
                      checked={featured}
                      onChange={(e) => setFeatured(e.target.checked)}
                      className="w-4 h-4 text-[#C9A24B] rounded-sm"
                    />
                    <label htmlFor="guest-featured" className="font-medium text-slate-800">
                      Feature on Home
                    </label>
                  </div>
                </div>
              </form>
      </Sheet>

      {/* Safe Delete Modal with Dependency Protection Warning */}
      <ConfirmDialog
        isOpen={deleteModalOpen}
        title="Delete Leader Profile"
        description={`Are you sure you want to delete "${guestToDelete?.full_name}"? If this guest is currently linked to any episodes, the database safety policy will prevent deletion until they are unlinked.`}
        confirmText={isDeleting ? 'Checking Dependencies...' : 'Delete Profile'}
        cancelText="Cancel"
        variant="danger"
        onConfirm={handleDelete}
        onClose={() => setDeleteModalOpen(false)}
      />
    </div>
  );
}
