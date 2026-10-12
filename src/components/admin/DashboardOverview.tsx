import React from 'react';
import type { Payload } from 'payload';
import Link from 'next/link';

interface DashboardOverviewProps {
  payload?: Payload;
  user?: {
    id: string | number;
    email: string;
    role?: string;
  };
}

export const DashboardOverview: React.FC<DashboardOverviewProps> = async (props) => {
  let payload = props.payload;
  if (!payload) {
    try {
      const { getPayload } = await import('payload');
      const { default: configPromise } = await import('@payload-config');
      payload = await getPayload({ config: configPromise });
    } catch {
      // Fallback if payload cannot be imported
    }
  }

  // Safe defaults
  let totalEpisodes = 0;
  let publishedEpisodes = 0;
  let draftEpisodes = 0;
  let totalGuests = 0;
  let totalNominations = 0;
  let pendingNominations = 0;
  let totalContactMessages = 0;
  let totalMedia = 0;
  let totalTopics = 0;
  let recentEpisodes: any[] = [];
  let recentNominations: any[] = [];

  const userRole = props.user?.role || 'admin';
  const userEmail = props.user?.email || 'Editorial Staff';

  if (payload) {
    try {
      const [
        episodesCount,
        publishedCount,
        draftCount,
        guestsCount,
        nominationsCount,
        pendingNomCount,
        contactCount,
        mediaCount,
        topicsCount,
        episodesRes,
        nominationsRes,
      ] = await Promise.all([
        payload.count({ collection: 'episodes' }).catch(() => ({ totalDocs: 0 })),
        payload.count({ collection: 'episodes', where: { status: { equals: 'published' } } }).catch(() => ({ totalDocs: 0 })),
        payload.count({ collection: 'episodes', where: { status: { equals: 'draft' } } }).catch(() => ({ totalDocs: 0 })),
        payload.count({ collection: 'guests' }).catch(() => ({ totalDocs: 0 })),
        payload.count({ collection: 'nominations' }).catch(() => ({ totalDocs: 0 })),
        payload.count({ collection: 'nominations', where: { status: { equals: 'new' } } }).catch(() => ({ totalDocs: 0 })),
        payload.count({ collection: 'contact-messages' }).catch(() => ({ totalDocs: 0 })),
        payload.count({ collection: 'media' }).catch(() => ({ totalDocs: 0 })),
        payload.count({ collection: 'topics' }).catch(() => ({ totalDocs: 0 })),
        payload.find({ collection: 'episodes', sort: '-updatedAt', limit: 5, depth: 0 }).catch(() => ({ docs: [] })),
        payload.find({ collection: 'nominations', sort: '-createdAt', limit: 5, depth: 0 }).catch(() => ({ docs: [] })),
      ]);

      totalEpisodes = episodesCount.totalDocs;
      publishedEpisodes = publishedCount.totalDocs;
      draftEpisodes = draftCount.totalDocs;
      totalGuests = guestsCount.totalDocs;
      totalNominations = nominationsCount.totalDocs;
      pendingNominations = pendingNomCount.totalDocs;
      totalContactMessages = contactCount.totalDocs;
      totalMedia = mediaCount.totalDocs;
      totalTopics = topicsCount.totalDocs;
      recentEpisodes = episodesRes.docs || [];
      recentNominations = nominationsRes.docs || [];
    } catch (err) {
      console.error('Error fetching dashboard overview metrics:', err);
    }
  }

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '—';
    try {
      return new Date(dateStr).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  const getEpisodeStatusBadge = (status?: string) => {
    const s = (status || '').toLowerCase();
    switch (s) {
      case 'published':
        return { bg: '#ECFDF5', text: '#065F46', border: '#A7F3D0', dot: '#10B981', label: 'Published' };
      case 'scheduled':
        return { bg: '#EFF6FF', text: '#1E40AF', border: '#BFDBFE', dot: '#3B82F6', label: 'Scheduled' };
      case 'archived':
        return { bg: '#F1F5F9', text: '#475569', border: '#CBD5E1', dot: '#64748B', label: 'Archived' };
      case 'draft':
      default:
        return { bg: '#FEF3C7', text: '#92400E', border: '#FDE68A', dot: '#F59E0B', label: 'Draft' };
    }
  };

  const getNominationStatusBadge = (status?: string) => {
    const s = (status || '').toLowerCase();
    switch (s) {
      case 'new':
        return { bg: '#FEF3C7', text: '#92400E', border: '#FDE68A', dot: '#F59E0B', label: 'New • Pending Vetting' };
      case 'reviewed':
        return { bg: '#EFF6FF', text: '#1E40AF', border: '#BFDBFE', dot: '#3B82F6', label: 'Reviewed' };
      case 'contacted':
        return { bg: '#ECFDF5', text: '#065F46', border: '#A7F3D0', dot: '#10B981', label: 'Outreach Sent' };
      case 'declined':
        return { bg: '#FEF2F2', text: '#991B1B', border: '#FECACA', dot: '#EF4444', label: 'Declined' };
      default:
        return { bg: '#F3F4F6', text: '#374151', border: '#E5E7EB', dot: '#9CA3AF', label: status || 'Pending' };
    }
  };

  return (
    <div className="unchartered-dashboard-root" style={{ marginBottom: '40px' }}>
      {/* Editorial Command Center Header */}
      <div
        className="unchartered-hero-banner"
        style={{
          background: 'linear-gradient(135deg, #101C2C 0%, #19283B 100%)',
          borderRadius: '14px',
          padding: '28px 32px',
          color: '#FFFFFF',
          border: '1px solid rgba(223, 227, 232, 0.16)',
          boxShadow: '0 6px 20px rgba(16, 28, 44, 0.14)',
          marginBottom: '28px',
          display: 'flex',
          flexDirection: 'column',
          gap: '20px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '20px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px', flexWrap: 'wrap' }}>
              <span
                style={{
                  background: '#C6A15B',
                  color: '#101C2C',
                  fontSize: '11px',
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  letterSpacing: '0.14em',
                  padding: '4px 12px',
                  borderRadius: '100px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <span
                  style={{
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    background: '#101C2C',
                    display: 'inline-block',
                  }}
                />
                Command Center
              </span>
              <span style={{ fontSize: '13px', color: '#CBD5E1', fontWeight: 500 }}>
                Unchartered — Legends &amp; Legacies
              </span>
            </div>

            <h1
              style={{
                fontFamily: 'Georgia, "Times New Roman", serif',
                fontSize: '28px',
                fontWeight: 700,
                color: '#FFFFFF',
                margin: 0,
                letterSpacing: '-0.02em',
                lineHeight: 1.2,
              }}
            >
              Editorial Overview &amp; Production Hub
            </h1>

            <p style={{ margin: '8px 0 0 0', fontSize: '14.5px', color: '#CBD5E1', maxWidth: '680px', lineHeight: 1.5 }}>
              Welcome back. Authenticated as <strong style={{ color: '#F7F3EB' }}>{userEmail}</strong>{' '}
              <span
                style={{
                  display: 'inline-block',
                  fontSize: '11px',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  padding: '2px 8px',
                  borderRadius: '4px',
                  background: 'rgba(198, 161, 91, 0.25)',
                  color: '#F7F3EB',
                  border: '1px solid rgba(198, 161, 91, 0.4)',
                  marginLeft: '4px',
                }}
              >
                {userRole}
              </span>
              . Manage published podcast conversations, executive profiles, taxonomy pillars, and leader nominations.
            </p>
          </div>

          {/* Quick Action Navigation Bar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <Link
              href="/admin/collections/episodes/create"
              className="unchartered-action-btn primary"
              style={{
                background: '#C6A15B',
                color: '#101C2C',
                padding: '10px 18px',
                borderRadius: '8px',
                fontSize: '13.5px',
                fontWeight: 700,
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: '0 2px 8px rgba(198, 161, 91, 0.35)',
                transition: 'all 0.15s ease',
              }}
            >
              <span style={{ fontSize: '16px', lineHeight: 1 }}>+</span>
              <span>New Episode</span>
            </Link>

            <Link
              href="/admin/collections/guests/create"
              className="unchartered-action-btn secondary"
              style={{
                background: 'rgba(255, 255, 255, 0.12)',
                color: '#FFFFFF',
                padding: '10px 18px',
                borderRadius: '8px',
                fontSize: '13.5px',
                fontWeight: 600,
                textDecoration: 'none',
                border: '1px solid rgba(255, 255, 255, 0.22)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                transition: 'all 0.15s ease',
              }}
            >
              <span style={{ fontSize: '16px', lineHeight: 1 }}>+</span>
              <span>Add Leader</span>
            </Link>

            <Link
              href="/admin/collections/nominations"
              className="unchartered-action-btn badge-btn"
              style={{
                background: pendingNominations > 0 ? 'rgba(245, 158, 11, 0.2)' : 'rgba(255, 255, 255, 0.12)',
                color: pendingNominations > 0 ? '#FDE68A' : '#FFFFFF',
                padding: '10px 18px',
                borderRadius: '8px',
                fontSize: '13.5px',
                fontWeight: 600,
                textDecoration: 'none',
                border: pendingNominations > 0 ? '1px solid rgba(245, 158, 11, 0.5)' : '1px solid rgba(255, 255, 255, 0.22)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                transition: 'all 0.15s ease',
              }}
            >
              <span>Vetting Queue</span>
              {pendingNominations > 0 && (
                <span
                  style={{
                    background: '#C6A15B',
                    color: '#101C2C',
                    fontSize: '11px',
                    fontWeight: 800,
                    padding: '2px 6px',
                    borderRadius: '100px',
                    lineHeight: 1,
                  }}
                >
                  {pendingNominations}
                </span>
              )}
            </Link>

            <a
              href="/"
              target="_blank"
              rel="noopener noreferrer"
              className="unchartered-action-btn external"
              style={{
                background: 'transparent',
                color: '#CBD5E1',
                padding: '10px 14px',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: 500,
                textDecoration: 'none',
                border: '1px solid rgba(223, 227, 232, 0.2)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <span>Public Website</span>
              <span style={{ color: '#C6A15B' }}>↗</span>
            </a>
          </div>
        </div>

        {/* Live System State & Architecture Indicator */}
        <div
          style={{
            borderTop: '1px solid rgba(223, 227, 232, 0.12)',
            paddingTop: '14px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px',
            fontSize: '12px',
            color: '#94A3B8',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#10B981', display: 'inline-block' }} />
              <strong style={{ color: '#F1F5F9' }}>Database:</strong> SQLite Local Dev Fallback (Healthy)
            </span>
            <span>•</span>
            <span>
              <strong style={{ color: '#F1F5F9' }}>Security:</strong> Session Cookie Auth &amp; Role Access Control
            </span>
            <span>•</span>
            <span>
              <strong style={{ color: '#F1F5F9' }}>Next.js App Router:</strong> Server-Rendered Hub
            </span>
          </div>

          <span style={{ color: '#C6A15B', fontWeight: 600 }}>
            {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
          </span>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div
        className="unchartered-dashboard-metrics"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
          gap: '16px',
          marginBottom: '32px',
        }}
      >
        {/* Metric 1: Total Episodes */}
        <Link href="/admin/collections/episodes" style={{ textDecoration: 'none', color: 'inherit' }}>
          <div className="unchartered-metric-card" style={{ padding: '20px', borderRadius: '12px', background: '#FFFFFF', border: '1px solid #DFE3E8', boxShadow: '0 2px 8px rgba(16, 28, 44, 0.04)', display: 'flex', flexDirection: 'column', gap: '8px', transition: 'all 0.2s ease' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '11.5px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#596579' }}>
                Total Episodes
              </span>
              <span style={{ fontSize: '13px', color: '#C6A15B' }}>🎙️</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px' }}>
              <span style={{ fontSize: '34px', fontWeight: 800, color: '#172235', lineHeight: 1 }}>
                {totalEpisodes}
              </span>
              <span style={{ fontSize: '12px', color: '#059669', fontWeight: 600, background: '#ECFDF5', padding: '2px 8px', borderRadius: '100px', border: '1px solid #A7F3D0' }}>
                {publishedEpisodes} Live
              </span>
            </div>
            <span style={{ fontSize: '11.5px', color: '#596579', marginTop: '2px' }}>
              {draftEpisodes} drafts in development • Browse catalog →
            </span>
          </div>
        </Link>

        {/* Metric 2: Published Episodes */}
        <Link href="/admin/collections/episodes" style={{ textDecoration: 'none', color: 'inherit' }}>
          <div className="unchartered-metric-card" style={{ padding: '20px', borderRadius: '12px', background: '#FFFFFF', border: '1px solid #DFE3E8', boxShadow: '0 2px 8px rgba(16, 28, 44, 0.04)', display: 'flex', flexDirection: 'column', gap: '8px', transition: 'all 0.2s ease' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '11.5px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#596579' }}>
                Active Broadcasts
              </span>
              <span style={{ fontSize: '13px', color: '#059669' }}>📡</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px' }}>
              <span style={{ fontSize: '34px', fontWeight: 800, color: '#065F46', lineHeight: 1 }}>
                {publishedEpisodes}
              </span>
              <span style={{ fontSize: '12px', color: '#596579' }}>
                published
              </span>
            </div>
            <span style={{ fontSize: '11.5px', color: '#596579', marginTop: '2px' }}>
              Live on website, sitemap &amp; feeds →
            </span>
          </div>
        </Link>

        {/* Metric 3: Industry Legends & Guests */}
        <Link href="/admin/collections/guests" style={{ textDecoration: 'none', color: 'inherit' }}>
          <div className="unchartered-metric-card" style={{ padding: '20px', borderRadius: '12px', background: '#FFFFFF', border: '1px solid #DFE3E8', boxShadow: '0 2px 8px rgba(16, 28, 44, 0.04)', display: 'flex', flexDirection: 'column', gap: '8px', transition: 'all 0.2s ease' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '11.5px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#596579' }}>
                Leaders &amp; Guests
              </span>
              <span style={{ fontSize: '13px', color: '#C6A15B' }}>👤</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px' }}>
              <span style={{ fontSize: '34px', fontWeight: 800, color: '#172235', lineHeight: 1 }}>
                {totalGuests}
              </span>
              <span style={{ fontSize: '12px', color: '#C6A15B', fontWeight: 600, background: '#FDFBF7', padding: '2px 8px', borderRadius: '100px', border: '1px solid #DFE3E8' }}>
                Profiles
              </span>
            </div>
            <span style={{ fontSize: '11.5px', color: '#596579', marginTop: '2px' }}>
              Executive biographies &amp; quotes →
            </span>
          </div>
        </Link>

        {/* Metric 4: Pending Nominations */}
        <Link href="/admin/collections/nominations" style={{ textDecoration: 'none', color: 'inherit' }}>
          <div
            className="unchartered-metric-card"
            style={{
              padding: '20px',
              borderRadius: '12px',
              background: '#FFFFFF',
              border: pendingNominations > 0 ? '1.5px solid #FCD34D' : '1px solid #DFE3E8',
              boxShadow: pendingNominations > 0 ? '0 4px 12px rgba(245, 158, 11, 0.12)' : '0 2px 8px rgba(16, 28, 44, 0.04)',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
              transition: 'all 0.2s ease',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '11.5px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#596579' }}>
                Leader Nominations
              </span>
              <span style={{ fontSize: '13px', color: pendingNominations > 0 ? '#D97706' : '#596579' }}>🏆</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px' }}>
              <span style={{ fontSize: '34px', fontWeight: 800, color: pendingNominations > 0 ? '#92400E' : '#172235', lineHeight: 1 }}>
                {pendingNominations}
              </span>
              <span style={{ fontSize: '12px', color: '#596579' }}>
                of {totalNominations} total
              </span>
            </div>
            <span style={{ fontSize: '11.5px', color: pendingNominations > 0 ? '#B45309' : '#596579', marginTop: '2px', fontWeight: pendingNominations > 0 ? 600 : 400 }}>
              {pendingNominations > 0 ? '⚠️ Submissions awaiting review →' : 'All nominations reviewed →'}
            </span>
          </div>
        </Link>

        {/* Metric 5: Audience Inquiries */}
        <Link href="/admin/collections/contact-messages" style={{ textDecoration: 'none', color: 'inherit' }}>
          <div className="unchartered-metric-card" style={{ padding: '20px', borderRadius: '12px', background: '#FFFFFF', border: '1px solid #DFE3E8', boxShadow: '0 2px 8px rgba(16, 28, 44, 0.04)', display: 'flex', flexDirection: 'column', gap: '8px', transition: 'all 0.2s ease' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '11.5px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#596579' }}>
                Audience Inquiries
              </span>
              <span style={{ fontSize: '13px', color: '#596579' }}>✉️</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px' }}>
              <span style={{ fontSize: '34px', fontWeight: 800, color: '#172235', lineHeight: 1 }}>
                {totalContactMessages}
              </span>
              <span style={{ fontSize: '12px', color: '#596579' }}>
                inquiries
              </span>
            </div>
            <span style={{ fontSize: '11px', color: '#64748B', marginTop: '2px' }}>
              Total received • Status tracking not in schema →
            </span>
          </div>
        </Link>

        {/* Metric 6: Media Library */}
        <Link href="/admin/collections/media" style={{ textDecoration: 'none', color: 'inherit' }}>
          <div className="unchartered-metric-card" style={{ padding: '20px', borderRadius: '12px', background: '#FFFFFF', border: '1px solid #DFE3E8', boxShadow: '0 2px 8px rgba(16, 28, 44, 0.04)', display: 'flex', flexDirection: 'column', gap: '8px', transition: 'all 0.2s ease' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '11.5px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#596579' }}>
                Media Library
              </span>
              <span style={{ fontSize: '13px', color: '#C6A15B' }}>🖼️</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px' }}>
              <span style={{ fontSize: '34px', fontWeight: 800, color: '#172235', lineHeight: 1 }}>
                {totalMedia}
              </span>
              <span style={{ fontSize: '12px', color: '#596579' }}>
                assets
              </span>
            </div>
            <span style={{ fontSize: '11.5px', color: '#596579', marginTop: '2px' }}>
              Covers, portraits &amp; brand assets →
            </span>
          </div>
        </Link>
      </div>

      {/* Two Column Section: Recent Episodes & Recent Nominations */}
      <div
        className="unchartered-dashboard-panels"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
          gap: '24px',
          marginBottom: '32px',
        }}
      >
        {/* Panel 1: Recently Updated Episodes */}
        <div
          className="unchartered-panel-card"
          style={{
            background: '#FFFFFF',
            borderRadius: '12px',
            border: '1px solid #DFE3E8',
            padding: '24px',
            boxShadow: '0 2px 8px rgba(16, 28, 44, 0.04)',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '18px',
              paddingBottom: '14px',
              borderBottom: '1px solid #DFE3E8',
            }}
          >
            <div>
              <h2
                style={{
                  fontFamily: 'Georgia, serif',
                  fontSize: '18px',
                  fontWeight: 700,
                  color: '#172235',
                  margin: 0,
                }}
              >
                Recently Updated Episodes
              </h2>
              <span style={{ fontSize: '12px', color: '#596579' }}>
                Latest production and broadcast activity
              </span>
            </div>

            <Link
              href="/admin/collections/episodes"
              style={{
                fontSize: '12.5px',
                fontWeight: 700,
                color: '#C6A15B',
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              <span>View All</span>
              <span>→</span>
            </Link>
          </div>

          {recentEpisodes.length === 0 ? (
            <div
              style={{
                padding: '36px 20px',
                textAlign: 'center',
                background: '#FDFBF7',
                borderRadius: '8px',
                border: '1px dashed #DFE3E8',
              }}
            >
              <span style={{ fontSize: '28px', display: 'block', marginBottom: '8px' }}>🎙️</span>
              <p style={{ fontSize: '14px', color: '#172235', fontWeight: 600, margin: '0 0 6px 0' }}>
                No episodes created yet
              </p>
              <p style={{ fontSize: '12.5px', color: '#596579', margin: '0 0 16px 0' }}>
                Start by creating the first podcast conversation.
              </p>
              <Link
                href="/admin/collections/episodes/create"
                style={{
                  background: '#C6A15B',
                  color: '#101C2C',
                  fontSize: '12.5px',
                  fontWeight: 700,
                  padding: '8px 16px',
                  borderRadius: '6px',
                  textDecoration: 'none',
                  display: 'inline-block',
                }}
              >
                + Create Episode
              </Link>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {recentEpisodes.map((ep: any) => {
                const badge = getEpisodeStatusBadge(ep.status);
                return (
                  <Link
                    key={ep.id}
                    href={`/admin/collections/episodes/${ep.id}`}
                    className="unchartered-list-item"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '12px 14px',
                      borderRadius: '8px',
                      border: '1px solid #F1F5F9',
                      background: '#FDFBF7',
                      textDecoration: 'none',
                      color: 'inherit',
                      gap: '14px',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div
                        style={{
                          fontSize: '13.5px',
                          fontWeight: 600,
                          color: '#172235',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                      >
                        {ep.title || 'Untitled Episode'}
                      </div>
                      <div style={{ fontSize: '12px', color: '#596579', marginTop: '3px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {ep.episodeNumber && <span>Ep. {ep.episodeNumber} •</span>}
                        <span>{formatDate(ep.publishedAt || ep.updatedAt)}</span>
                      </div>
                    </div>

                    <span
                      style={{
                        fontSize: '11px',
                        fontWeight: 700,
                        padding: '3px 10px',
                        borderRadius: '100px',
                        background: badge.bg,
                        color: badge.text,
                        border: `1px solid ${badge.border}`,
                        flexShrink: 0,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '5px',
                      }}
                    >
                      <span
                        style={{
                          width: '5px',
                          height: '5px',
                          borderRadius: '50%',
                          background: badge.dot,
                          display: 'inline-block',
                        }}
                      />
                      {badge.label}
                    </span>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        {/* Panel 2: Latest Leader Nominations */}
        <div
          className="unchartered-panel-card"
          style={{
            background: '#FFFFFF',
            borderRadius: '12px',
            border: '1px solid #DFE3E8',
            padding: '24px',
            boxShadow: '0 2px 8px rgba(16, 28, 44, 0.04)',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '18px',
              paddingBottom: '14px',
              borderBottom: '1px solid #DFE3E8',
            }}
          >
            <div>
              <h2
                style={{
                  fontFamily: 'Georgia, serif',
                  fontSize: '18px',
                  fontWeight: 700,
                  color: '#172235',
                  margin: 0,
                }}
              >
                Incoming Leader Nominations
              </h2>
              <span style={{ fontSize: '12px', color: '#596579' }}>
                Vetting queue for upcoming interview seasons
              </span>
            </div>

            <Link
              href="/admin/collections/nominations"
              style={{
                fontSize: '12.5px',
                fontWeight: 700,
                color: '#C6A15B',
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              <span>Vetting Queue</span>
              <span>→</span>
            </Link>
          </div>

          {recentNominations.length === 0 ? (
            <div
              style={{
                padding: '36px 20px',
                textAlign: 'center',
                background: '#FDFBF7',
                borderRadius: '8px',
                border: '1px dashed #DFE3E8',
              }}
            >
              <span style={{ fontSize: '28px', display: 'block', marginBottom: '8px' }}>🏆</span>
              <p style={{ fontSize: '14px', color: '#172235', fontWeight: 600, margin: '0 0 6px 0' }}>
                No nominations in queue
              </p>
              <p style={{ fontSize: '12.5px', color: '#596579', margin: '0' }}>
                Audience submissions from the public website will appear here for review.
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {recentNominations.map((nom: any) => {
                const badge = getNominationStatusBadge(nom.status);
                return (
                  <Link
                    key={nom.id}
                    href={`/admin/collections/nominations/${nom.id}`}
                    className="unchartered-list-item"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '12px 14px',
                      borderRadius: '8px',
                      border: '1px solid #F1F5F9',
                      background: '#FDFBF7',
                      textDecoration: 'none',
                      color: 'inherit',
                      gap: '14px',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div
                        style={{
                          fontSize: '13.5px',
                          fontWeight: 600,
                          color: '#172235',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                      >
                        {nom.guestName || 'Unnamed Nominee'}
                      </div>
                      <div style={{ fontSize: '12px', color: '#596579', marginTop: '3px' }}>
                        {nom.guestRoleCompany ? `${nom.guestRoleCompany} • ` : ''}Nominated by {nom.name || 'Anonymous'}
                      </div>
                    </div>

                    <span
                      style={{
                        fontSize: '11px',
                        fontWeight: 700,
                        padding: '3px 10px',
                        borderRadius: '100px',
                        background: badge.bg,
                        color: badge.text,
                        border: `1px solid ${badge.border}`,
                        flexShrink: 0,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '5px',
                      }}
                    >
                      <span
                        style={{
                          width: '5px',
                          height: '5px',
                          borderRadius: '50%',
                          background: badge.dot,
                          display: 'inline-block',
                        }}
                      />
                      {badge.label}
                    </span>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Row 3: Editorial Guidelines & Production Automation Guide */}
      <div
        style={{
          background: '#FFFFFF',
          borderRadius: '12px',
          border: '1px solid #DFE3E8',
          padding: '24px 28px',
          boxShadow: '0 2px 8px rgba(16, 28, 44, 0.04)',
        }}
      >
        <div style={{ marginBottom: '16px' }}>
          <h3
            style={{
              fontFamily: 'Georgia, serif',
              fontSize: '17px',
              fontWeight: 700,
              color: '#172235',
              margin: '0 0 4px 0',
            }}
          >
            Editorial Production Checklist &amp; Standards
          </h3>
          <p style={{ margin: 0, fontSize: '13px', color: '#596579' }}>
            Built-in validation rules and automated pipelines for the Unchartered editorial staff.
          </p>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: '16px',
          }}
        >
          <div
            style={{
              padding: '16px',
              borderRadius: '8px',
              background: '#FDFBF7',
              border: '1px solid #F1F5F9',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px',
            }}
          >
            <span style={{ fontSize: '13px', fontWeight: 700, color: '#172235' }}>
              1. Episode Publishing Gate
            </span>
            <p style={{ margin: 0, fontSize: '12px', color: '#596579', lineHeight: 1.4 }}>
              To transition an episode to <strong>Published</strong>, at least one featured guest profile and a valid YouTube URL are strictly required.
            </p>
          </div>

          <div
            style={{
              padding: '16px',
              borderRadius: '8px',
              background: '#FDFBF7',
              border: '1px solid #F1F5F9',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px',
            }}
          >
            <span style={{ fontSize: '13px', fontWeight: 700, color: '#172235' }}>
              2. 301 Redirect Automation
            </span>
            <p style={{ margin: 0, fontSize: '12px', color: '#596579', lineHeight: 1.4 }}>
              When a published episode or guest URL slug is changed, the system automatically writes and collapses permanent 301 redirects to protect SEO rankings.
            </p>
          </div>

          <div
            style={{
              padding: '16px',
              borderRadius: '8px',
              background: '#FDFBF7',
              border: '1px solid #F1F5F9',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px',
            }}
          >
            <span style={{ fontSize: '13px', fontWeight: 700, color: '#172235' }}>
              3. Responsive Player Facade
            </span>
            <p style={{ margin: 0, fontSize: '12px', color: '#596579', lineHeight: 1.4 }}>
              YouTube IDs are extracted automatically to render lightweight, privacy-conscious facades with zero heavy embed iframes until audience interaction.
            </p>
          </div>

          <div
            style={{
              padding: '16px',
              borderRadius: '8px',
              background: '#FDFBF7',
              border: '1px solid #F1F5F9',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px',
            }}
          >
            <span style={{ fontSize: '13px', fontWeight: 700, color: '#172235' }}>
              4. Media &amp; Metadata Scrubbing
            </span>
            <p style={{ margin: 0, fontSize: '12px', color: '#596579', lineHeight: 1.4 }}>
              All uploaded photography is processed with Sharp, stripped of sensitive EXIF/GPS metadata, and automatically converted to optimized responsive sizes.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardOverview;
