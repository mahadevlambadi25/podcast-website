'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Image as ImageIcon,
  UploadCloud,
  Search,
  Trash2,
  Copy,
  Check,
  Edit,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  LayoutGrid,
  List,
  FileAudio,
  FileVideo,
  File,
  X,
  Save,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { useToast } from '@/components/ui/toast';

interface MediaItem {
  id: number;
  filename: string;
  url: string;
  mime_type?: string;
  filesize?: number;
  width?: number;
  height?: number;
  alt?: string;
  caption?: string;
  created_at: string;
  usage_count: number;
}

export default function MediaLibraryPage() {
  const { success, error: toastError } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [mediaList, setMediaList] = useState<MediaItem[]>([]);
  const [totalDocs, setTotalDocs] = useState(0);
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);

  // Asset detail modal / edit modal
  const [selectedAsset, setSelectedAsset] = useState<MediaItem | null>(null);
  const [editAlt, setEditAlt] = useState('');
  const [editCaption, setEditCaption] = useState('');
  const [isSavingMeta, setIsSavingMeta] = useState(false);
  const [copiedId, setCopiedId] = useState<number | null>(null);

  // Safe Delete Modal
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [assetToDelete, setAssetToDelete] = useState<MediaItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchMedia = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: '24',
      });
      if (searchQuery.trim()) params.set('search', searchQuery.trim());

      const res = await fetch(`/api/admin/media?${params.toString()}`);
      if (!res.ok) throw new Error('Failed to load media');
      const data = await res.json();
      setMediaList(data.docs || []);
      setTotalDocs(data.totalDocs || 0);
    } catch (err: any) {
      toastError('Media Error', err.message);
    } finally {
      setIsLoading(false);
    }
  }, [page, searchQuery, toastError]);

  useEffect(() => {
    fetchMedia();
  }, [fetchMedia]);

  const handleFileUpload = async (file: File) => {
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('alt', file.name.replace(/\.[^/.]+$/, ''));

      const res = await fetch('/api/admin/media', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Upload failed');

      success('File Uploaded', `${file.name} was successfully stored.`);
      fetchMedia();
    } catch (err: any) {
      toastError('Upload Failed', err.message);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const openAssetDetail = (item: MediaItem) => {
    setSelectedAsset(item);
    setEditAlt(item.alt || '');
    setEditCaption(item.caption || '');
  };

  const handleSaveMetadata = async () => {
    if (!selectedAsset) return;
    setIsSavingMeta(true);
    try {
      const res = await fetch(`/api/admin/media/${selectedAsset.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          alt: editAlt.trim(),
          caption: editCaption.trim(),
        }),
      });
      if (!res.ok) throw new Error('Failed to update metadata');

      success('Metadata Updated', 'Alt text and caption updated.');
      setSelectedAsset(null);
      fetchMedia();
    } catch (err: any) {
      toastError('Save Error', err.message);
    } finally {
      setIsSavingMeta(false);
    }
  };

  const copyUrlToClipboard = (item: MediaItem) => {
    const fullUrl = window.location.origin + item.url;
    navigator.clipboard.writeText(fullUrl);
    setCopiedId(item.id);
    success('Copied URL', 'Direct link copied to clipboard.');
    setTimeout(() => setCopiedId(null), 2500);
  };

  const handleDelete = async () => {
    if (!assetToDelete) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/admin/media/${assetToDelete.id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete asset');

      success('Asset Deleted', `${assetToDelete.filename} has been removed.`);
      setDeleteModalOpen(false);
      setAssetToDelete(null);
      if (selectedAsset?.id === assetToDelete.id) setSelectedAsset(null);
      fetchMedia();
    } catch (err: any) {
      toastError('Cannot Delete Asset', err.message);
    } finally {
      setIsDeleting(false);
    }
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '—';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-serif font-bold text-slate-900">
            Media & Asset Library
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Store episode cover artwork, audio files, portraits, and branding assets.
          </p>
        </div>

        <div>
          <input
            type="file"
            ref={fileInputRef}
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                handleFileUpload(e.target.files[0]);
              }
            }}
            accept="image/*,audio/*,video/*"
            className="hidden"
          />
          <button
            type="button"
            disabled={isUploading}
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#C9A24B] hover:bg-[#D4B05C] text-[#0F1B2D] font-semibold text-sm shadow-md transition-all active:scale-[0.98] disabled:opacity-50"
          >
            {isUploading ? (
              <Loader2 className="w-4 h-4 animate-spin text-[#0F1B2D]" />
            ) : (
              <UploadCloud className="w-4 h-4 text-[#0F1B2D]" />
            )}
            <span>{isUploading ? 'Uploading File...' : 'Upload Media Asset'}</span>
          </button>
        </div>
      </div>

      {/* Drag & Drop Upload Dropzone */}
      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
        className="p-8 border-2 border-dashed border-slate-300 hover:border-[#C9A24B] bg-slate-50/50 hover:bg-[#C9A24B]/5 rounded-2xl text-center transition-all cursor-pointer"
        onClick={() => fileInputRef.current?.click()}
      >
        <UploadCloud className="w-10 h-10 mx-auto text-slate-400 mb-2" />
        <p className="text-sm font-semibold text-slate-800">
          Drag & drop media files here, or click to browse
        </p>
        <p className="text-xs text-slate-400 mt-1">
          Supports JPEG, PNG, WebP, SVG, MP3, WAV, M4A, MP4 (up to 50MB)
        </p>
      </div>

      {/* Search and View Controls */}
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
            placeholder="Search by filename, alt text, or caption..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#C9A24B]"
          />
        </div>

        <div className="flex items-center gap-2">
          {/* View Toggle */}
          <div className="inline-flex p-1 bg-slate-100 rounded-xl">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg ${
                viewMode === 'grid' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-400 hover:text-slate-700'
              }`}
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-lg ${
                viewMode === 'list' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-400 hover:text-slate-700'
              }`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={() => fetchMedia()}
            title="Refresh Library"
            className="p-2 rounded-xl border border-slate-200 text-slate-500 hover:text-slate-900 hover:bg-slate-50"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Assets Grid / List */}
      {isLoading ? (
        <div className="py-16 text-center text-slate-400">
          <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-[#C9A24B]" />
          <span>Loading media assets...</span>
        </div>
      ) : mediaList.length === 0 ? (
        <div className="py-16 text-center text-slate-400 bg-white rounded-2xl border">
          <ImageIcon className="w-10 h-10 mx-auto mb-2 text-slate-300" />
          <p className="font-medium text-slate-700">No media assets in the library</p>
          <p className="text-xs text-slate-400 mt-1">Upload your first image or audio track above.</p>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {mediaList.map((m) => {
            const isImage = m.mime_type?.startsWith('image/') || /\.(png|jpe?g|webp|gif|svg)$/i.test(m.filename);
            const isAudio = m.mime_type?.startsWith('audio/') || /\.(mp3|wav|m4a)$/i.test(m.filename);
            const isVideo = m.mime_type?.startsWith('video/') || /\.(mp4|webm)$/i.test(m.filename);

            return (
              <div
                key={m.id}
                onClick={() => openAssetDetail(m)}
                className="group relative bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden cursor-pointer hover:border-[#C9A24B] hover:shadow-md transition-all flex flex-col justify-between"
              >
                {/* Thumbnail Preview */}
                <div className="aspect-square bg-slate-100 flex items-center justify-center overflow-hidden relative">
                  {isImage ? (
                    <img
                      src={m.url}
                      alt={m.alt || m.filename}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                    />
                  ) : isAudio ? (
                    <FileAudio className="w-12 h-12 text-[#C9A24B]" />
                  ) : isVideo ? (
                    <FileVideo className="w-12 h-12 text-blue-600" />
                  ) : (
                    <File className="w-12 h-12 text-slate-400" />
                  )}

                  {/* Usage Badge */}
                  {m.usage_count > 0 && (
                    <span className="absolute top-2 left-2 bg-emerald-600/90 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-xs">
                      {m.usage_count} {m.usage_count === 1 ? 'use' : 'uses'}
                    </span>
                  )}
                </div>

                {/* Info Bar */}
                <div className="p-3">
                  <p className="text-xs font-semibold text-slate-900 truncate" title={m.filename}>
                    {m.filename}
                  </p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    {formatFileSize(m.filesize)}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* List Mode Table */
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50/70 border-b text-[11px] uppercase tracking-wider font-semibold text-slate-500">
              <tr>
                <th className="py-3 px-4">Asset</th>
                <th className="py-3 px-4">Filename</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">Size</th>
                <th className="py-3 px-4">Usage</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {mediaList.map((m) => (
                <tr key={m.id} className="hover:bg-slate-50/60">
                  <td className="py-2 px-4">
                    <div
                      className="w-10 h-10 rounded-lg bg-slate-100 overflow-hidden cursor-pointer"
                      onClick={() => openAssetDetail(m)}
                    >
                      <img src={m.url} alt="" className="w-full h-full object-cover" />
                    </div>
                  </td>
                  <td className="py-2 px-4 font-medium text-slate-900 truncate max-w-xs">
                    {m.filename}
                  </td>
                  <td className="py-2 px-4 text-xs text-slate-500">
                    {m.mime_type || '—'}
                  </td>
                  <td className="py-2 px-4 text-xs text-slate-500">
                    {formatFileSize(m.filesize)}
                  </td>
                  <td className="py-2 px-4">
                    {m.usage_count > 0 ? (
                      <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                        {m.usage_count} in use
                      </span>
                    ) : (
                      <span className="text-xs text-slate-400">Unused</span>
                    )}
                  </td>
                  <td className="py-2 px-4 text-right">
                    <button
                      type="button"
                      onClick={() => copyUrlToClipboard(m)}
                      title="Copy URL"
                      className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900"
                    >
                      {copiedId === m.id ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setAssetToDelete(m);
                        setDeleteModalOpen(true);
                      }}
                      title="Delete Asset"
                      className="p-1.5 rounded-lg text-slate-500 hover:text-red-600"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Asset Detail / Metadata Drawer */}
      {selectedAsset && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex justify-end animate-in fade-in">
          <div className="w-full max-w-md bg-white h-full min-h-screen shadow-2xl p-6 flex flex-col justify-between overflow-y-auto">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h2 className="text-base font-serif font-bold text-slate-900 truncate">
                  {selectedAsset.filename}
                </h2>
                <button
                  type="button"
                  onClick={() => setSelectedAsset(null)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-900"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Preview */}
              <div className="my-4 aspect-video rounded-xl bg-slate-100 overflow-hidden flex items-center justify-center border border-slate-200">
                <img
                  src={selectedAsset.url}
                  alt={selectedAsset.alt || ''}
                  className="max-h-full max-w-full object-contain"
                />
              </div>

              {/* File Info */}
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80 text-xs space-y-1.5 text-slate-600">
                <p>
                  <span className="font-semibold text-slate-800">Filesize:</span>{' '}
                  {formatFileSize(selectedAsset.filesize)}
                </p>
                <p>
                  <span className="font-semibold text-slate-800">MIME Type:</span>{' '}
                  {selectedAsset.mime_type || 'image'}
                </p>
                <p>
                  <span className="font-semibold text-slate-800">Public URL:</span>{' '}
                  <span className="font-mono text-[11px] text-slate-500 break-all">
                    {selectedAsset.url}
                  </span>
                </p>
                <p>
                  <span className="font-semibold text-slate-800">Active References:</span>{' '}
                  {selectedAsset.usage_count > 0 ? (
                    <span className="text-emerald-700 font-semibold">
                      {selectedAsset.usage_count} linked item(s)
                    </span>
                  ) : (
                    'Not referenced by any episode or guest'
                  )}
                </p>
              </div>

              {/* Copy URL Button */}
              <div className="mt-3">
                <button
                  type="button"
                  onClick={() => copyUrlToClipboard(selectedAsset)}
                  className="w-full flex items-center justify-center gap-2 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  {copiedId === selectedAsset.id ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                  <span>{copiedId === selectedAsset.id ? 'URL Copied!' : 'Copy Direct Asset URL'}</span>
                </button>
              </div>

              {/* Metadata Form */}
              <div className="mt-5 space-y-3 text-xs">
                <div>
                  <label className="block font-semibold uppercase text-slate-700 mb-1">
                    Alt Text (Accessibility)
                  </label>
                  <input
                    type="text"
                    value={editAlt}
                    onChange={(e) => setEditAlt(e.target.value)}
                    placeholder="Short description for screen readers and SEO"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                  />
                </div>

                <div>
                  <label className="block font-semibold uppercase text-slate-700 mb-1">
                    Caption / Attribution
                  </label>
                  <textarea
                    rows={2}
                    value={editCaption}
                    onChange={(e) => setEditCaption(e.target.value)}
                    placeholder="Optional image credit or caption..."
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                  />
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => {
                  setAssetToDelete(selectedAsset);
                  setDeleteModalOpen(true);
                }}
                className="px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 rounded-xl flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete</span>
              </button>

              <button
                type="button"
                onClick={handleSaveMetadata}
                disabled={isSavingMeta}
                className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-[#C9A24B] hover:bg-[#D4B05C] text-[#0F1B2D] text-xs font-semibold shadow-md disabled:opacity-50"
              >
                {isSavingMeta ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                <span>Save Metadata</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Safe Delete Modal */}
      <ConfirmDialog
        isOpen={deleteModalOpen}
        title="Delete Media Asset"
        description={`Are you sure you want to delete "${assetToDelete?.filename}"? If this file is referenced as an episode thumbnail or guest portrait, deletion will be safely blocked to prevent broken images.`}
        confirmText={isDeleting ? 'Checking Usage...' : 'Delete Asset'}
        cancelText="Cancel"
        variant="danger"
        onConfirm={handleDelete}
        onClose={() => setDeleteModalOpen(false)}
      />
    </div>
  );
}
