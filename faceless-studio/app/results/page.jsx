'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import React from 'react';
import ResultTabs from '@/components/app/ResultTabs';

class ResultTabErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = { hasError: false, error: null }; }
  static getDerivedStateFromError(error) { return { hasError: true, error }; }
  componentDidCatch(error, info) { console.error('[ResultTabs] Error boundary caught:', error, info); }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '40px 24px', textAlign: 'center', border: '1px solid #FCA5A5', borderRadius: 12, background: '#FEF2F2', margin: '24px 0' }}>
          <p style={{ fontSize: 20, marginBottom: 12 }}>⚠️</p>
          <p style={{ fontFamily: "'Playfair Display', serif", fontSize: 18, fontWeight: 700, color: '#0A0A0A', marginBottom: 8 }}>
            Something went wrong displaying this section
          </p>
          <p style={{ fontSize: 13, color: '#6B7280', lineHeight: 1.6, marginBottom: 20 }}>
            The content was generated but could not be displayed. Try refreshing, or generate again.
          </p>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            style={{ background: '#0A0A0A', border: 'none', borderRadius: 8, padding: '10px 20px', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
          >
            Try again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

function ResultTabsWithBoundary(props) {
  return (
    <ResultTabErrorBoundary>
      <ResultTabs {...props} />
    </ResultTabErrorBoundary>
  );
}

export default function ResultsPage() {
  const router = useRouter();
  const [result, setResult] = useState(null);
  const [copied, setCopied] = useState('');
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    const raw = sessionStorage.getItem('studioai_result');
    if (!raw) { router.replace('/generate'); return; }
    try {
      setResult(JSON.parse(raw));
      setTimeout(() => setRevealed(true), 100);
    } catch { router.replace('/generate'); }
  }, []);

  if (!result) return (
    <div style={{ minHeight: '100vh', background: '#FAFAFA', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: 32, height: 32, borderRadius: '50%', border: '2px solid #E5E7EB', borderTopColor: '#0A0A0A', animation: 'spin 0.7s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  const { research, creator, publisher, meta, input } = result;
  const totalSec = ((meta?.total_duration_ms || 0) / 1000).toFixed(1);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=DM+Sans:wght@300;400;500;600&family=JetBrains+Mono:wght@400;500&display=swap');

        * { box-sizing: border-box; }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes scaleIn {
          from { opacity: 0; transform: scale(0.97); }
          to   { opacity: 1; transform: scale(1); }
        }

        .results-root {
          min-height: 100vh;
          background: #FAFAFA;
          font-family: 'DM Sans', sans-serif;
          color: #0A0A0A;
          display: flex;
          flex-direction: column;
        }

        /* Topbar */
        .results-topbar {
          height: 56px;
          background: #fff;
          border-bottom: 1px solid #F3F4F6;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 24px;
          position: sticky;
          top: 0;
          z-index: 50;
        }

        .topbar-left {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .logo-mark-sm {
          width: 28px;
          height: 28px;
          background: #0A0A0A;
          border-radius: 7px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #fff;
          font-family: 'Instrument Serif', serif;
          font-size: 14px;
          cursor: pointer;
        }

        .topbar-sep { color: #E5E7EB; font-size: 18px; }
        .topbar-page { font-size: 14px; color: #6B7280; }

        .topbar-right {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .time-badge {
          font-family: 'JetBrains Mono', monospace;
          font-size: 12px;
          padding: 5px 10px;
          background: #F9FAFB;
          border: 1px solid #F3F4F6;
          border-radius: 6px;
          color: #374151;
        }

        .topbar-btn {
          font-size: 13px;
          font-family: 'DM Sans', sans-serif;
          padding: 7px 14px;
          border-radius: 7px;
          cursor: pointer;
          font-weight: 500;
          transition: all 0.15s;
        }

        .topbar-btn.ghost {
          border: 1.5px solid #E5E7EB;
          background: #fff;
          color: #374151;
        }

        .topbar-btn.ghost:hover { background: #F9FAFB; }

        .topbar-btn.primary {
          background: #0A0A0A;
          color: #fff;
          border: none;
        }

        .topbar-btn.primary:hover { background: #1a1a1a; }

        /* Banner */
        .results-banner {
          background: #fff;
          border-bottom: 1px solid #F3F4F6;
          padding: 28px 24px 24px;
          animation: ${revealed ? 'fadeUp 0.5s ease both' : 'none'};
        }

        .banner-inner {
          max-width: 920px;
          margin: 0 auto;
        }

        .banner-meta {
          display: flex;
          gap: 6px;
          flex-wrap: wrap;
          margin-bottom: 12px;
        }

        .meta-tag {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 4px 10px;
          border-radius: 6px;
          font-size: 12px;
          font-weight: 500;
          background: #F3F4F6;
          color: #374151;
        }

        .banner-topic {
          font-family: 'Instrument Serif', serif;
          font-size: clamp(20px, 2.5vw, 30px);
          font-weight: 400;
          color: #0A0A0A;
          letter-spacing: -0.03em;
          margin-bottom: 10px;
          line-height: 1.25;
        }

        .banner-hook {
          font-size: 14px;
          color: #6B7280;
          line-height: 1.65;
          border-left: 3px solid #0A0A0A;
          padding-left: 14px;
          font-style: italic;
          max-width: 640px;
        }

        /* Stats row */
        .stats-row {
          display: flex;
          gap: 20px;
          margin-top: 20px;
          flex-wrap: wrap;
        }

        .stat-item {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 13px;
          color: #374151;
        }

        .stat-icon { font-size: 14px; }
        .stat-val { font-weight: 600; }
        .stat-lbl { color: #9CA3AF; }

        /* Streak banner */
        .streak-banner {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px 16px;
          background: #0A0A0A;
          border-radius: 8px;
          margin-top: 16px;
          max-width: 300px;
        }

        .streak-fire { font-size: 18px; }

        .streak-info { flex: 1; }

        .streak-num {
          font-family: 'Instrument Serif', serif;
          font-size: 18px;
          color: #fff;
          letter-spacing: -0.03em;
          display: block;
          line-height: 1;
        }

        .streak-label {
          font-size: 11px;
          color: rgba(255,255,255,0.4);
          font-family: 'JetBrains Mono', monospace;
          display: block;
          margin-top: 2px;
        }

        .streak-progress {
          display: flex;
          gap: 3px;
        }

        .streak-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
        }

        /* Tab strip */
        .tab-strip {
          background: #fff;
          border-bottom: 1px solid #F3F4F6;
          position: sticky;
          top: 56px;
          z-index: 40;
        }

        .tab-strip-inner {
          max-width: 920px;
          margin: 0 auto;
          padding: 0 24px;
          display: flex;
          overflow-x: auto;
          scrollbar-width: none;
          gap: 0;
        }

        .tab-strip-inner::-webkit-scrollbar { display: none; }

        .tab-btn {
          padding: 14px 18px;
          font-size: 13px;
          font-weight: 500;
          font-family: 'DM Sans', sans-serif;
          color: #9CA3AF;
          background: transparent;
          border: none;
          border-bottom: 2px solid transparent;
          cursor: pointer;
          white-space: nowrap;
          transition: all 0.18s;
          letter-spacing: -0.01em;
          margin-bottom: -1px;
        }

        .tab-btn:hover { color: #374151; }

        .tab-btn.active {
          color: #0A0A0A;
          border-bottom-color: #0A0A0A;
          font-weight: 600;
        }

        /* Body */
        .results-body {
          flex: 1;
        }

        .results-body-inner {
          max-width: 920px;
          margin: 0 auto;
          padding: 32px 24px 80px;
          animation: ${revealed ? 'scaleIn 0.5s ease 0.1s both' : 'none'};
        }

        /* Override ResultTabs for light theme */
        .results-body-inner .rt-tab {
          color: #9CA3AF !important;
          font-family: 'DM Sans', sans-serif !important;
        }

        .results-body-inner .rt-tab.active {
          color: #0A0A0A !important;
          border-bottom-color: #0A0A0A !important;
        }

        .results-body-inner .rt-tabs {
          border-bottom-color: #F3F4F6 !important;
        }
      `}</style>

      <div className="results-root">
        {/* Topbar */}
        <header className="results-topbar">
          <div className="topbar-left">
            <div className="logo-mark-sm" onClick={() => router.push('/generate')}>S</div>
            <span className="topbar-sep">/</span>
            <span className="topbar-page">Results</span>
          </div>
          <div className="topbar-right">
            {meta?.streak > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 10px', background: '#F9FAFB', borderRadius: 6, border: '1px solid #F3F4F6' }}>
                <span>🔥</span>
                <span style={{ fontSize: 12, fontWeight: 600, color: '#374151' }}>{meta.streak}-day streak</span>
              </div>
            )}
            <span className="time-badge">⚡ {totalSec}s</span>
            <button className="topbar-btn ghost" onClick={() => router.push('/dashboard')}>History</button>
            <button className="topbar-btn primary" onClick={() => router.push('/generate')}>+ New generation</button>
          </div>
        </header>

        {/* Banner */}
        <div className="results-banner">
          <div className="banner-inner">
            <div className="banner-meta">
              {input?.platform && <span className="meta-tag">▶ {input.platform}</span>}
              {input?.language && <span className="meta-tag">🌐 {input.language}</span>}
              {input?.tone && <span className="meta-tag">🎭 {input.tone}</span>}
              {input?.creatorType && <span className="meta-tag">👤 {input.creatorType}</span>}
            </div>

            <h1 className="banner-topic">{research?.chosen_topic}</h1>

            {research?.chosen_hook && (
              <p className="banner-hook">"{research.chosen_hook}"</p>
            )}

            <div className="stats-row">
              {creator?.word_count > 0 && (
                <div className="stat-item">
                  <span className="stat-icon">📝</span>
                  <span className="stat-val">{creator.word_count}</span>
                  <span className="stat-lbl">words</span>
                </div>
              )}
              {creator?.scenes?.length > 0 && (
                <div className="stat-item">
                  <span className="stat-icon">🎬</span>
                  <span className="stat-val">{creator.scenes.length}</span>
                  <span className="stat-lbl">scenes</span>
                </div>
              )}
              {publisher?.youtube?.tags?.length > 0 && (
                <div className="stat-item">
                  <span className="stat-icon">🏷️</span>
                  <span className="stat-val">{publisher.youtube.tags.length}</span>
                  <span className="stat-lbl">SEO tags</span>
                </div>
              )}
              {creator?.estimated_duration && (
                <div className="stat-item">
                  <span className="stat-icon">⏱</span>
                  <span className="stat-val">{creator.estimated_duration}</span>
                </div>
              )}
            </div>

            {meta?.streak >= 3 && (
              <div className="streak-banner">
                <span className="streak-fire">🔥</span>
                <div className="streak-info">
                  <span className="streak-num">{meta.streak}</span>
                  <span className="streak-label">DAY STREAK — KEEP IT UP</span>
                </div>
                <div className="streak-progress">
                  {Array.from({ length: Math.min(meta.streak, 7) }).map((_, i) => (
                    <div key={i} className="streak-dot" style={{ background: `hsl(${42 - i * 3}, 90%, ${60 - i}%)` }} />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Content — using ResultTabs which handles all 6 tabs */}
        <div className="results-body">
          <div className="results-body-inner">
            <ResultTabsWithBoundary
              research={research}
              creator={creator}
              publisher={publisher}
              input={input}
            />
          </div>
        </div>
      </div>
    </>
  );
}