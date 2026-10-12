'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Save,
  ArrowLeft,
  Eye,
  CheckCircle2,
  Clock,
  Sparkles,
  AlertCircle,
  Plus,
  Trash2,
  Calendar,
  Layers,
  FileText,
  Video,
  Users,
  Search,
  Check,
  Globe,
  Radio,
  Loader2,
} from 'lucide-react';
import { useToast } from '@/components/ui/toast';
import { Badge } from '@/components/ui/badge';
import { generateSlug } from '@/utils/slug';

interface EpisodeEditorProps {
  initialData?: any;
  isNew?: boolean;
}

export function EpisodeEditor({ initialData, isNew = false }: EpisodeEditorProps) {
  const router = useRouter();
  const { success, error: toastError } = useToast();

  const [activeTab, setActiveTab] = useState<'basic' | 'media' | 'relations' | 'notes' | 'publishing' | 'seo'>('basic');
  const [isSaving, setIsSaving] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);

  // Form State
  const [title, setTitle] = useState(initialData?.title || '');
  const [slug, setSlug] = useState(initialData?.slug || '');
  const [shortSummary, setShortSummary] = useState(initialData?.short_summary || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [episodeNumber, setEpisodeNumber] = useState(initialData?.episode_number ?? '');
  const [season, setSeason] = useState(initialData?.season ?? '');
  const [featured, setFeatured] = useState(Boolean(initialData?.featured));

  // Media
  const [youtubeUrl, setYoutubeUrl] = useState(initialData?.youtube_url || '');
  const [youtubeVideoId, setYoutubeVideoId] = useState(initialData?.youtube_video_id || '');
  const [fallbackWatchUrl, setFallbackWatchUrl] = useState(initialData?.fallback_watch_url || '');
  const [thumbnailUrl, setThumbnailUrl] = useState(initialData?.thumbnail_url || '');

  // Relationships
  const [selectedGuestIds, setSelectedGuestIds] = useState<number[]>(
    initialData?.guests?.map((g: any) => g.id) || []
  );
  const [selectedTopicIds, setSelectedTopicIds] = useState<number[]>(
    initialData?.topics?.map((t: any) => t.id) || []
  );

  // Show Notes
  const [keyTakeaways, setKeyTakeaways] = useState<string[]>(
    initialData?.key_takeaways || []
  );
  const [quotes, setQuotes] = useState<Array<{ quote: string; speaker: string }>>(
    initialData?.quotes || []
  );
  const [tags, setTags] = useState<string[]>(initialData?.tags || []);
  const [transcript, setTranscript] = useState(initialData?.transcript || '');

  // Publishing
  const [status, setStatus] = useState<'draft' | 'published' | 'scheduled' | 'archived'>(
    initialData?.status || 'draft'
  );
  const [publishedAt, setPublishedAt] = useState(
    initialData?.published_at ? new Date(initialData.published_at).toISOString().slice(0, 16) : ''
  );

  // SEO
  const [seoTitle, setSeoTitle] = useState(initialData?.seo_title || '');
  const [seoDescription, setSeoDescription] = useState(initialData?.seo_description || '');
  const [canonicalOverride, setCanonicalOverride] = useState(initialData?.canonical_override || '');

  // Available options
  const [allGuests, setAllGuests] = useState<Array<{ id: number; full_name: string }>>([]);
  const [allTopics, setAllTopics] = useState<Array<{ id: number; name: string }>>([]);

  useEffect(() => {
    // Load guests and topics
    fetch('/api/admin/guests?limit=100')
      .then((r) => r.json())
      .then((d) => setAllGuests(d.docs || []))
      .catch(() => {});

    fetch('/api/admin/topics')
      .then((r) => r.json())
      .then((d) => setAllTopics(d.docs || []))
      .catch(() => {});
  }, []);

  // Auto-slug on title change if new
  const handleTitleChange = (val: string) => {
    setTitle(val);
    if (isNew || !slug) {
      setSlug(generateSlug(val));
    }
  };

  const handleAddTakeaway = () => {
    setKeyTakeaways([...keyTakeaways, '']);
  };

  const handleUpdateTakeaway = (idx: number, val: string) => {
    const updated = [...keyTakeaways];
    updated[idx] = val;
    setKeyTakeaways(updated);
  };

  const handleRemoveTakeaway = (idx: number) => {
    setKeyTakeaways(keyTakeaways.filter((_, i) => i !== idx));
  };

  const handleAddQuote = () => {
    setQuotes([...quotes, { quote: '', speaker: '' }]);
  };

  const handleUpdateQuote = (idx: number, field: 'quote' | 'speaker', val: string) => {
    const updated = [...quotes];
    updated[idx] = { ...updated[idx], [field]: val };
    setQuotes(updated);
  };

  const handleRemoveQuote = (idx: number) => {
    setQuotes(quotes.filter((_, i) => i !== idx));
  };

  const saveEpisode = async (publishAction?: 'publish' | 'unpublish' | 'archive' | 'schedule') => {
    if (!title.trim()) {
      toastError('Validation Error', 'Episode title is required.');
      setActiveTab('basic');
      return;
    }

    setIsSaving(true);
    try {
      const payload = {
        title: title.trim(),
        slug: slug.trim() || generateSlug(title),
        short_summary: shortSummary.trim() || null,
        description: description.trim() || null,
        episode_number: episodeNumber ? Number(episodeNumber) : null,
        season: season ? Number(season) : null,
        featured,
        youtube_url: youtubeUrl.trim() || null,
        youtube_video_id: youtubeVideoId.trim() || null,
        fallback_watch_url: fallbackWatchUrl.trim() || null,
        guest_ids: selectedGuestIds,
        topic_ids: selectedTopicIds,
        key_takeaways: keyTakeaways.filter((t) => t.trim()),
        quotes: quotes.filter((q) => q.quote.trim()),
        tags: tags.filter((t) => t.trim()),
        transcript: transcript.trim() || null,
        status: publishAction ? (publishAction === 'unpublish' ? 'draft' : publishAction) : status,
        published_at: publishedAt ? new Date(publishedAt).toISOString() : null,
        seo_title: seoTitle.trim() || null,
        seo_description: seoDescription.trim() || null,
        canonical_override: canonicalOverride.trim() || null,
      };

      if (isNew) {
        const res = await fetch('/api/admin/episodes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to create episode');
        success('Episode Created', 'New episode was saved successfully.');
        router.push(`/admin/episodes/${data.id}`);
      } else {
        const res = await fetch(`/api/admin/episodes/${initialData.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to update episode');
        success('Episode Updated', 'All changes saved to database.');
        router.refresh();
      }
    } catch (err: any) {
      toastError('Save Failed', err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handlePublishToggle = async () => {
    if (isNew) {
      await saveEpisode('publish');
      return;
    }

    setIsPublishing(true);
    try {
      const action = status === 'published' ? 'unpublish' : 'publish';
      const res = await fetch(`/api/admin/episodes/${initialData.id}/publish`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to change publish status');
      setStatus(data.status);
      success(
        action === 'publish' ? 'Episode Published' : 'Reverted to Draft',
        action === 'publish'
          ? 'Episode is now live on the public website.'
          : 'Episode has been unpublished.'
      );
      router.refresh();
    } catch (err: any) {
      toastError('Action Failed', err.message);
    } finally {
      setIsPublishing(false);
    }
  };

  const tabs = [
    { id: 'basic', label: 'Basic Information', icon: Layers },
    { id: 'media', label: 'Media & Playback', icon: Video },
    { id: 'relations', label: 'Guests & Topics', icon: Users },
    { id: 'notes', label: 'Show Notes & Quotes', icon: FileText },
    { id: 'publishing', label: 'Publishing', icon: Clock },
    { id: 'seo', label: 'SEO & Sharing', icon: Globe },
  ];

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-16">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/episodes"
            className="p-2 rounded-xl border border-slate-200 text-slate-500 hover:text-slate-900 hover:bg-slate-50 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-serif font-bold text-slate-900">
                {isNew ? 'Create New Episode' : title || 'Edit Episode'}
              </h1>
              <Badge
                variant={
                  status === 'published'
                    ? 'published'
                    : status === 'scheduled'
                    ? 'scheduled'
                    : 'draft'
                }
                showTooltip={false}
              >
                {status}
              </Badge>
            </div>
            {!isNew && (
              <p className="text-xs text-slate-400 mt-0.5">
                ID: {initialData?.id} · Slug: /{slug}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          {!isNew && slug && (
            <a
              href={`/episodes/${slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50 text-xs font-semibold transition-all"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Preview</span>
            </a>
          )}

          <button
            type="button"
            onClick={handlePublishToggle}
            disabled={isPublishing || isSaving}
            className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
              status === 'published'
                ? 'bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300'
                : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs'
            }`}
          >
            {isPublishing ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : status === 'published' ? (
              <span>Unpublish</span>
            ) : (
              <span>Publish Live</span>
            )}
          </button>

          <button
            type="button"
            onClick={() => saveEpisode()}
            disabled={isSaving}
            className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-[#C9A24B] hover:bg-[#D4B05C] text-[#0F1B2D] font-semibold text-xs shadow-md transition-all active:scale-[0.98]"
          >
            {isSaving ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin text-[#0F1B2D]" />
            ) : (
              <Save className="w-3.5 h-3.5 text-[#0F1B2D]" />
            )}
            <span>Save Draft</span>
          </button>
        </div>
      </div>

      {/* Editor Tabs Nav */}
      <div className="flex overflow-x-auto border-b border-slate-200 gap-1 bg-white p-1 rounded-2xl border shadow-xs">
        {tabs.map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id as any)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                activeTab === t.id
                  ? 'bg-[#0F1B2D] text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{t.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Panels */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 sm:p-8">
        {/* TAB A: Basic Information */}
        {activeTab === 'basic' && (
          <div className="space-y-6 animate-in fade-in">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                Episode Title *
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => handleTitleChange(e.target.value)}
                placeholder="e.g. Episode 5: The Architect of Modern Compute"
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#C9A24B]"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                  URL Slug *
                </label>
                <div className="flex rounded-xl shadow-xs">
                  <span className="inline-flex items-center px-3 rounded-l-xl border border-r-0 border-slate-200 bg-slate-100 text-slate-500 text-xs font-medium">
                    /episodes/
                  </span>
                  <input
                    type="text"
                    required
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    className="block w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-r-xl text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#C9A24B]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                    Episode #
                  </label>
                  <input
                    type="number"
                    value={episodeNumber}
                    onChange={(e) => setEpisodeNumber(e.target.value)}
                    placeholder="1"
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                    Season
                  </label>
                  <input
                    type="number"
                    value={season}
                    onChange={(e) => setSeason(e.target.value)}
                    placeholder="1"
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                Short Summary (Card Preview)
              </label>
              <textarea
                rows={2}
                value={shortSummary}
                onChange={(e) => setShortSummary(e.target.value)}
                placeholder="A compelling 1-2 sentence executive overview for podcast directories and cards."
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#C9A24B]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                Full Episode Editorial Description
              </label>
              <textarea
                rows={6}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Detailed narrative, key conversation points, background on the guest's achievements..."
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#C9A24B]"
              />
            </div>

            <div className="flex items-center gap-3 pt-2">
              <input
                id="featured"
                type="checkbox"
                checked={featured}
                onChange={(e) => setFeatured(e.target.checked)}
                className="w-4 h-4 text-[#C9A24B] rounded-sm focus:ring-[#C9A24B] border-slate-300"
              />
              <label htmlFor="featured" className="text-sm font-medium text-slate-800">
                Feature prominently on Homepage Hero
              </label>
            </div>
          </div>
        )}

        {/* TAB B: Media & Playback */}
        {activeTab === 'media' && (
          <div className="space-y-6 animate-in fade-in">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                YouTube Watch / Embed URL
              </label>
              <input
                type="url"
                value={youtubeUrl}
                onChange={(e) => {
                  setYoutubeUrl(e.target.value);
                  // Auto extract video id if matches standard youtube pattern
                  const match = e.target.value.match(/(?:v=|\/embed\/|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
                  if (match && match[1]) {
                    setYoutubeVideoId(match[1]);
                  }
                }}
                placeholder="https://www.youtube.com/watch?v=..."
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#C9A24B]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                YouTube Video ID (11 characters)
              </label>
              <input
                type="text"
                value={youtubeVideoId}
                onChange={(e) => setYoutubeVideoId(e.target.value)}
                placeholder="e.g. dQw4w9WgXcQ"
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                Direct Audio / Fallback Stream URL
              </label>
              <input
                type="url"
                value={fallbackWatchUrl}
                onChange={(e) => setFallbackWatchUrl(e.target.value)}
                placeholder="https://.../episode.mp3 or external stream link"
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm"
              />
            </div>

            {/* Video preview if video ID is present */}
            {youtubeVideoId && (
              <div className="pt-4 border-t border-slate-100">
                <span className="text-xs font-semibold uppercase text-slate-500 mb-2 block">
                  YouTube Playback Preview
                </span>
                <div className="relative aspect-video rounded-xl overflow-hidden bg-black max-w-lg shadow-md">
                  <iframe
                    src={`https://www.youtube-nocookie.com/embed/${youtubeVideoId}`}
                    title="Playback Preview"
                    className="w-full h-full border-0"
                    allowFullScreen
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB C: Guests & Topics */}
        {activeTab === 'relations' && (
          <div className="space-y-8 animate-in fade-in">
            {/* Guest Association */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
                  Associated Leaders & Guests
                </label>
                <Link
                  href="/admin/guests"
                  className="text-xs text-[#C9A24B] hover:underline font-medium"
                >
                  + Add New Leader
                </Link>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-60 overflow-y-auto p-1">
                {allGuests.map((g) => {
                  const isChecked = selectedGuestIds.includes(g.id);
                  return (
                    <button
                      type="button"
                      key={g.id}
                      onClick={() => {
                        if (isChecked) {
                          setSelectedGuestIds(selectedGuestIds.filter((id) => id !== g.id));
                        } else {
                          setSelectedGuestIds([...selectedGuestIds, g.id]);
                        }
                      }}
                      className={`flex items-center justify-between p-3 rounded-xl border text-left text-xs font-medium transition-all ${
                        isChecked
                          ? 'bg-[#C9A24B]/15 border-[#C9A24B] text-[#0F1B2D] font-semibold'
                          : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      <span>{g.full_name}</span>
                      {isChecked && <Check className="w-4 h-4 text-[#C9A24B]" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Topics Association */}
            <div className="pt-6 border-t border-slate-100">
              <div className="flex items-center justify-between mb-3">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
                  Thematic Pillars & Topics
                </label>
                <Link
                  href="/admin/topics"
                  className="text-xs text-[#C9A24B] hover:underline font-medium"
                >
                  + Add New Topic
                </Link>
              </div>

              <div className="flex flex-wrap gap-2">
                {allTopics.map((t) => {
                  const isChecked = selectedTopicIds.includes(t.id);
                  return (
                    <button
                      type="button"
                      key={t.id}
                      onClick={() => {
                        if (isChecked) {
                          setSelectedTopicIds(selectedTopicIds.filter((id) => id !== t.id));
                        } else {
                          setSelectedTopicIds([...selectedTopicIds, t.id]);
                        }
                      }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                        isChecked
                          ? 'bg-[#0F1B2D] text-white border-[#0F1B2D]'
                          : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {t.name}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* TAB D: Show Notes & Quotes */}
        {activeTab === 'notes' && (
          <div className="space-y-8 animate-in fade-in">
            {/* Key Takeaways */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
                  Key Executive Takeaways
                </label>
                <button
                  type="button"
                  onClick={handleAddTakeaway}
                  className="text-xs font-semibold text-[#C9A24B] hover:underline flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Takeaway</span>
                </button>
              </div>

              <div className="space-y-2">
                {keyTakeaways.length === 0 ? (
                  <p className="text-xs text-slate-400 italic">No takeaways added yet.</p>
                ) : (
                  keyTakeaways.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <input
                        type="text"
                        value={item}
                        onChange={(e) => handleUpdateTakeaway(idx, e.target.value)}
                        placeholder={`Takeaway #${idx + 1}`}
                        className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveTakeaway(idx)}
                        className="p-2 text-slate-400 hover:text-red-500 rounded-lg hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Standout Quotes */}
            <div className="pt-6 border-t border-slate-100">
              <div className="flex items-center justify-between mb-3">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
                  Standout Quotes & Attributions
                </label>
                <button
                  type="button"
                  onClick={handleAddQuote}
                  className="text-xs font-semibold text-[#C9A24B] hover:underline flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Quote</span>
                </button>
              </div>

              <div className="space-y-3">
                {quotes.length === 0 ? (
                  <p className="text-xs text-slate-400 italic">No quotes added yet.</p>
                ) : (
                  quotes.map((q, idx) => (
                    <div key={idx} className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-slate-500">
                          Quote #{idx + 1}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleRemoveQuote(idx)}
                          className="text-slate-400 hover:text-red-500 p-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <input
                        type="text"
                        value={q.quote}
                        onChange={(e) => handleUpdateQuote(idx, 'quote', e.target.value)}
                        placeholder="&quot;True leadership is deciding what not to do...&quot;"
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm"
                      />
                      <input
                        type="text"
                        value={q.speaker}
                        onChange={(e) => handleUpdateQuote(idx, 'speaker', e.target.value)}
                        placeholder="Speaker name (e.g. Thomas Sterling)"
                        className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                      />
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Full Transcript */}
            <div className="pt-6 border-t border-slate-100">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                Episode Transcript
              </label>
              <textarea
                rows={8}
                value={transcript}
                onChange={(e) => setTranscript(e.target.value)}
                placeholder="Full conversation transcript or timestamped chapter notes..."
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm font-mono text-xs"
              />
            </div>
          </div>
        )}

        {/* TAB E: Publishing & Scheduling */}
        {activeTab === 'publishing' && (
          <div className="space-y-6 animate-in fade-in max-w-lg">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                Publishing Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#C9A24B]"
              >
                <option value="draft">Draft (Visible only to editors)</option>
                <option value="published">Published (Live on public website)</option>
                <option value="scheduled">Scheduled (Releases on date below)</option>
                <option value="archived">Archived (Unlisted from directory)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                Publication Date & Time
              </label>
              <input
                type="datetime-local"
                value={publishedAt}
                onChange={(e) => setPublishedAt(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm"
              />
              <p className="text-xs text-slate-400 mt-1">
                If status is set to Published, this timestamp is shown on the website episode card.
              </p>
            </div>
          </div>
        )}

        {/* TAB F: SEO & Metadata */}
        {activeTab === 'seo' && (
          <div className="space-y-6 animate-in fade-in">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                Custom SEO Title (Browser Tab)
              </label>
              <input
                type="text"
                value={seoTitle}
                onChange={(e) => setSeoTitle(e.target.value)}
                placeholder="Leave blank to use episode title"
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                Meta Description
              </label>
              <textarea
                rows={3}
                value={seoDescription}
                onChange={(e) => setSeoDescription(e.target.value)}
                placeholder="Up to 160 characters for search engines and social cards..."
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                Canonical URL Override (Optional)
              </label>
              <input
                type="url"
                value={canonicalOverride}
                onChange={(e) => setCanonicalOverride(e.target.value)}
                placeholder="https://uncharteredpodcast.com/..."
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
