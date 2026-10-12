'use client';

import React, { useState, useEffect } from 'react';
import {
  Settings,
  Save,
  Globe,
  Radio,
  Share2,
  Mail,
  User,
  Shield,
  Loader2,
  CheckCircle2,
  RefreshCw,
} from 'lucide-react';
import { useToast } from '@/components/ui/toast';

export default function SiteSettingsPage() {
  const { success, error: toastError } = useToast();
  const [activeTab, setActiveTab] = useState<'branding' | 'hero' | 'host' | 'socials' | 'contact' | 'legal'>('branding');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Settings State
  const [brandName, setBrandName] = useState('');
  const [tagline, setTagline] = useState('');
  const [publisherName, setPublisherName] = useState('');
  const [publisherUrl, setPublisherUrl] = useState('');
  const [heroHeadline, setHeroHeadline] = useState('');
  const [heroMission, setHeroMission] = useState('');
  const [aboutMission, setAboutMission] = useState('');
  const [aboutAudience, setAboutAudience] = useState('');
  const [aboutEditorial, setAboutEditorial] = useState('');
  const [hostName, setHostName] = useState('');
  const [hostRole, setHostRole] = useState('');
  const [hostBio, setHostBio] = useState('');
  const [youtubeChannelUrl, setYoutubeChannelUrl] = useState('');
  const [linkedinUrl, setLinkedinUrl] = useState('');
  const [twitterUrl, setTwitterUrl] = useState('');
  const [spotifyUrl, setSpotifyUrl] = useState('');
  const [applePodcastsUrl, setApplePodcastsUrl] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [contactAddress, setContactAddress] = useState('');
  const [nominationRecipientEmail, setNominationRecipientEmail] = useState('');
  const [nominationWebhookUrl, setNominationWebhookUrl] = useState('');
  const [analyticsId, setAnalyticsId] = useState('');
  const [privacyPolicyContent, setPrivacyPolicyContent] = useState('');
  const [termsContent, setTermsContent] = useState('');

  useEffect(() => {
    setIsLoading(true);
    fetch('/api/admin/settings')
      .then((r) => r.json())
      .then((data) => {
        if (data) {
          setBrandName(data.brand_name || '');
          setTagline(data.tagline || '');
          setPublisherName(data.publisher_name || '');
          setPublisherUrl(data.publisher_url || '');
          setHeroHeadline(data.hero_headline || '');
          setHeroMission(data.hero_mission || '');
          setAboutMission(data.about_mission || '');
          setAboutAudience(data.about_audience || '');
          setAboutEditorial(data.about_editorial || '');
          setHostName(data.host_name || '');
          setHostRole(data.host_role || '');
          setHostBio(data.host_bio || '');
          setYoutubeChannelUrl(data.youtube_channel_url || '');
          setLinkedinUrl(data.linkedin_url || '');
          setTwitterUrl(data.twitter_url || '');
          setSpotifyUrl(data.spotify_url || '');
          setApplePodcastsUrl(data.apple_podcasts_url || '');
          setContactEmail(data.contact_email || '');
          setContactPhone(data.contact_phone || '');
          setContactAddress(data.contact_address || '');
          setNominationRecipientEmail(data.nomination_recipient_email || '');
          setNominationWebhookUrl(data.nomination_webhook_url || '');
          setAnalyticsId(data.analytics_id || '');
          setPrivacyPolicyContent(data.privacy_policy_content || '');
          setTermsContent(data.terms_content || '');
        }
      })
      .catch((err) => toastError('Load Error', err.message))
      .finally(() => setIsLoading(false));
  }, [toastError]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const payload = {
        brand_name: brandName.trim(),
        tagline: tagline.trim() || null,
        publisher_name: publisherName.trim() || null,
        publisher_url: publisherUrl.trim() || null,
        hero_headline: heroHeadline.trim() || null,
        hero_mission: heroMission.trim() || null,
        about_mission: aboutMission.trim() || null,
        about_audience: aboutAudience.trim() || null,
        about_editorial: aboutEditorial.trim() || null,
        host_name: hostName.trim() || null,
        host_role: hostRole.trim() || null,
        host_bio: hostBio.trim() || null,
        youtube_channel_url: youtubeChannelUrl.trim() || null,
        linkedin_url: linkedinUrl.trim() || null,
        twitter_url: twitterUrl.trim() || null,
        spotify_url: spotifyUrl.trim() || null,
        apple_podcasts_url: applePodcastsUrl.trim() || null,
        contact_email: contactEmail.trim() || null,
        contact_phone: contactPhone.trim() || null,
        contact_address: contactAddress.trim() || null,
        nomination_recipient_email: nominationRecipientEmail.trim() || null,
        nomination_webhook_url: nominationWebhookUrl.trim() || null,
        analytics_id: analyticsId.trim() || null,
        privacy_policy_content: privacyPolicyContent.trim() || null,
        terms_content: termsContent.trim() || null,
      };

      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error('Failed to update settings');
      success('Settings Updated', 'Global website configuration saved to database.');
    } catch (err: any) {
      toastError('Save Error', err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const navTabs = [
    { id: 'branding', label: 'Branding & Publisher', icon: Radio },
    { id: 'hero', label: 'Hero & Mission', icon: Globe },
    { id: 'host', label: 'Host Profile', icon: User },
    { id: 'socials', label: 'Social & Platforms', icon: Share2 },
    { id: 'contact', label: 'Inquiries & CRM', icon: Mail },
    { id: 'legal', label: 'Legal & Analytics', icon: Shield },
  ];

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-serif font-bold text-slate-900">
            SEO & Website Global Settings
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Configure site-wide editorial branding, social channels, host profiles, and notification webhooks.
          </p>
        </div>

        <button
          type="button"
          onClick={handleSave}
          disabled={isSaving || isLoading}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#C9A24B] hover:bg-[#D4B05C] text-[#0F1B2D] font-semibold text-xs shadow-md transition-all active:scale-[0.98] disabled:opacity-50 shrink-0"
        >
          {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
          <span>Save Changes</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex overflow-x-auto border-b border-slate-200 gap-1 bg-white p-1 rounded-2xl border shadow-xs">
        {navTabs.map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id as any)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
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

      {/* Settings Form Body */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 sm:p-8">
        {isLoading ? (
          <div className="py-12 text-center text-slate-400">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-[#C9A24B]" />
            <span>Loading settings...</span>
          </div>
        ) : (
          <form onSubmit={handleSave} className="space-y-6 text-xs">
            {/* TAB: Branding */}
            {activeTab === 'branding' && (
              <div className="space-y-4 animate-in fade-in">
                <div>
                  <label className="block font-semibold uppercase text-slate-700 mb-1">
                    Brand Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={brandName}
                    onChange={(e) => setBrandName(e.target.value)}
                    placeholder="Unchartered: Legends & Legacies"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                  />
                </div>

                <div>
                  <label className="block font-semibold uppercase text-slate-700 mb-1">
                    Tagline
                  </label>
                  <input
                    type="text"
                    value={tagline}
                    onChange={(e) => setTagline(e.target.value)}
                    placeholder="The Leadership & Legacy Podcast"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-semibold uppercase text-slate-700 mb-1">
                      Publisher / Production Studio Name
                    </label>
                    <input
                      type="text"
                      value={publisherName}
                      onChange={(e) => setPublisherName(e.target.value)}
                      placeholder="AI Automation Labs"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold uppercase text-slate-700 mb-1">
                      Publisher Website URL
                    </label>
                    <input
                      type="url"
                      value={publisherUrl}
                      onChange={(e) => setPublisherUrl(e.target.value)}
                      placeholder="https://aiautomationlabs.com"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* TAB: Hero & Mission */}
            {activeTab === 'hero' && (
              <div className="space-y-4 animate-in fade-in">
                <div>
                  <label className="block font-semibold uppercase text-slate-700 mb-1">
                    Hero Section Headline
                  </label>
                  <input
                    type="text"
                    value={heroHeadline}
                    onChange={(e) => setHeroHeadline(e.target.value)}
                    placeholder="Uncompromising Conversations with the Architects of Industry."
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                  />
                </div>

                <div>
                  <label className="block font-semibold uppercase text-slate-700 mb-1">
                    Hero Section Mission Statement
                  </label>
                  <textarea
                    rows={3}
                    value={heroMission}
                    onChange={(e) => setHeroMission(e.target.value)}
                    placeholder="Deep-dive dialogues with CEOs, founders, and frontier pioneers..."
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                  />
                </div>

                <div>
                  <label className="block font-semibold uppercase text-slate-700 mb-1">
                    About Section — Mission
                  </label>
                  <textarea
                    rows={4}
                    value={aboutMission}
                    onChange={(e) => setAboutMission(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                  />
                </div>
              </div>
            )}

            {/* TAB: Host Profile */}
            {activeTab === 'host' && (
              <div className="space-y-4 animate-in fade-in">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-semibold uppercase text-slate-700 mb-1">
                      Host Name
                    </label>
                    <input
                      type="text"
                      value={hostName}
                      onChange={(e) => setHostName(e.target.value)}
                      placeholder="Reshma"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold uppercase text-slate-700 mb-1">
                      Host Role / Title
                    </label>
                    <input
                      type="text"
                      value={hostRole}
                      onChange={(e) => setHostRole(e.target.value)}
                      placeholder="Managing Editor & Executive Producer"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold uppercase text-slate-700 mb-1">
                    Host Biography
                  </label>
                  <textarea
                    rows={4}
                    value={hostBio}
                    onChange={(e) => setHostBio(e.target.value)}
                    placeholder="Short biography displayed in the Host section on the about page..."
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                  />
                </div>
              </div>
            )}

            {/* TAB: Social Channels */}
            {activeTab === 'socials' && (
              <div className="space-y-4 animate-in fade-in">
                <div>
                  <label className="block font-semibold uppercase text-slate-700 mb-1">
                    YouTube Channel URL
                  </label>
                  <input
                    type="url"
                    value={youtubeChannelUrl}
                    onChange={(e) => setYoutubeChannelUrl(e.target.value)}
                    placeholder="https://youtube.com/@uncharteredpodcast"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                  />
                </div>

                <div>
                  <label className="block font-semibold uppercase text-slate-700 mb-1">
                    LinkedIn Organization / Show URL
                  </label>
                  <input
                    type="url"
                    value={linkedinUrl}
                    onChange={(e) => setLinkedinUrl(e.target.value)}
                    placeholder="https://linkedin.com/company/unchartered"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                  />
                </div>

                <div>
                  <label className="block font-semibold uppercase text-slate-700 mb-1">
                    Twitter / X Handle or URL
                  </label>
                  <input
                    type="text"
                    value={twitterUrl}
                    onChange={(e) => setTwitterUrl(e.target.value)}
                    placeholder="https://x.com/unchartered"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-semibold uppercase text-slate-700 mb-1">
                      Spotify Show URL
                    </label>
                    <input
                      type="url"
                      value={spotifyUrl}
                      onChange={(e) => setSpotifyUrl(e.target.value)}
                      placeholder="https://open.spotify.com/show/..."
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold uppercase text-slate-700 mb-1">
                      Apple Podcasts URL
                    </label>
                    <input
                      type="url"
                      value={applePodcastsUrl}
                      onChange={(e) => setApplePodcastsUrl(e.target.value)}
                      placeholder="https://podcasts.apple.com/..."
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* TAB: Inquiries & Webhooks */}
            {activeTab === 'contact' && (
              <div className="space-y-4 animate-in fade-in">
                <div>
                  <label className="block font-semibold uppercase text-slate-700 mb-1">
                    Primary Public Contact Email
                  </label>
                  <input
                    type="email"
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    placeholder="contact@uncharteredpodcast.com"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                  />
                </div>

                <div>
                  <label className="block font-semibold uppercase text-slate-700 mb-1">
                    Nomination Notification Destination Email
                  </label>
                  <input
                    type="email"
                    value={nominationRecipientEmail}
                    onChange={(e) => setNominationRecipientEmail(e.target.value)}
                    placeholder="nominations@uncharteredpodcast.com"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                  />
                </div>

                <div>
                  <label className="block font-semibold uppercase text-slate-700 mb-1">
                    Nomination Webhook URL (Zapier / Slack / CRM)
                  </label>
                  <input
                    type="url"
                    value={nominationWebhookUrl}
                    onChange={(e) => setNominationWebhookUrl(e.target.value)}
                    placeholder="https://hooks.zapier.com/hooks/catch/..."
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono"
                  />
                </div>
              </div>
            )}

            {/* TAB: Legal & Analytics */}
            {activeTab === 'legal' && (
              <div className="space-y-4 animate-in fade-in">
                <div>
                  <label className="block font-semibold uppercase text-slate-700 mb-1">
                    Google Analytics 4 Measurement ID
                  </label>
                  <input
                    type="text"
                    value={analyticsId}
                    onChange={(e) => setAnalyticsId(e.target.value)}
                    placeholder="G-XXXXXXXXXX"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono"
                  />
                </div>

                <div>
                  <label className="block font-semibold uppercase text-slate-700 mb-1">
                    Privacy Policy Markdown Content
                  </label>
                  <textarea
                    rows={6}
                    value={privacyPolicyContent}
                    onChange={(e) => setPrivacyPolicyContent(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono"
                  />
                </div>

                <div>
                  <label className="block font-semibold uppercase text-slate-700 mb-1">
                    Terms & Conditions Markdown Content
                  </label>
                  <textarea
                    rows={6}
                    value={termsContent}
                    onChange={(e) => setTermsContent(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono"
                  />
                </div>
              </div>
            )}
          </form>
        )}
      </div>
    </div>
  );
}
