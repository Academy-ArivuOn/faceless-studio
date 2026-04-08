'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import React from 'react';

// ── Error Boundary ─────────────────────────────────────────────────────────────
class TabErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = { hasError: false }; }
  static getDerivedStateFromError() { return { hasError: true }; }
  componentDidCatch(err, info) { console.error('[ResultTab] Error:', err, info); }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '32px 24px', textAlign: 'center', background: '#1a1a1a', borderRadius: 12, border: '1px solid #333' }}>
          <p style={{ fontSize: 24, marginBottom: 12 }}>⚠️</p>
          <p style={{ fontSize: 15, fontWeight: 600, color: '#f5f5f5', marginBottom: 8, fontFamily: 'var(--font-body)' }}>Could not render this section</p>
          <p style={{ fontSize: 13, color: '#888', marginBottom: 20, fontFamily: 'var(--font-body)' }}>The content was generated but hit a display error. Try refreshing.</p>
          <button onClick={() => this.setState({ hasError: false })}
            style={{ background: '#f5f5f5', color: '#0a0a0a', border: 'none', borderRadius: 8, padding: '10px 20px', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>
            Try again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

// ── Copy Button ────────────────────────────────────────────────────────────────
function CopyBtn({ text, label = 'Copy' }) {
  const [done, setDone] = useState(false);
  return (
    <button
      onClick={() => navigator.clipboard.writeText(text || '').then(() => { setDone(true); setTimeout(() => setDone(false), 2000); })}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 5,
        background: done ? 'rgba(62,207,142,0.15)' : 'rgba(255,255,255,0.07)',
        border: `1px solid ${done ? 'rgba(62,207,142,0.4)' : 'rgba(255,255,255,0.12)'}`,
        borderRadius: 6, padding: '5px 12px', fontSize: 11, fontWeight: 600,
        color: done ? '#3ECF8E' : '#aaa', cursor: 'pointer', fontFamily: 'var(--font-mono)',
        transition: 'all 0.2s', whiteSpace: 'nowrap', flexShrink: 0,
      }}>
      {done ? '✓ Copied' : label}
    </button>
  );
}

// ── Section ────────────────────────────────────────────────────────────────────
function Section({ label, children, copyText, highlight = false }) {
  return (
    <div style={{ marginBottom: 28 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <span style={{
          fontSize: 9, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase',
          color: highlight ? '#D4A847' : '#555', fontFamily: 'var(--font-mono)',
        }}>{label}</span>
        {copyText && <CopyBtn text={copyText} />}
      </div>
      {children}
    </div>
  );
}

// ── Prose Block ────────────────────────────────────────────────────────────────
function Prose({ children, style = {} }) {
  return (
    <div style={{
      background: '#141414', border: '1px solid #2a2a2a', borderRadius: 10,
      padding: '16px 20px', fontSize: 14, color: '#d4d4d4', lineHeight: 1.8,
      fontFamily: 'var(--font-body)', whiteSpace: 'pre-wrap', wordBreak: 'break-word',
      ...style,
    }}>
      {children}
    </div>
  );
}

// ── Chip / Tag ─────────────────────────────────────────────────────────────────
function Chip({ label, color = '#D4A847', dim = false }) {
  return (
    <span style={{
      display: 'inline-block', padding: '3px 10px', borderRadius: 6, fontSize: 11,
      fontWeight: 700, fontFamily: 'var(--font-mono)',
      background: dim ? 'rgba(255,255,255,0.05)' : `${color}18`,
      border: `1px solid ${dim ? 'rgba(255,255,255,0.08)' : `${color}35`}`,
      color: dim ? '#666' : color, whiteSpace: 'nowrap', margin: '2px',
    }}>
      {label}
    </span>
  );
}

// ── Card ───────────────────────────────────────────────────────────────────────
function Card({ children, accent = false, style = {} }) {
  return (
    <div style={{
      background: '#111', border: `1px solid ${accent ? '#D4A847' : '#222'}`,
      borderRadius: 12, padding: '18px 20px', marginBottom: 12,
      boxShadow: accent ? '0 0 0 1px rgba(212,168,71,0.1)' : 'none',
      ...style,
    }}>
      {children}
    </div>
  );
}

// ── KV Row ─────────────────────────────────────────────────────────────────────
function KV({ k, v }) {
  if (!v) return null;
  return (
    <div style={{ display: 'flex', gap: 14, padding: '8px 0', borderBottom: '1px solid #1e1e1e', alignItems: 'flex-start' }}>
      <span style={{ fontSize: 10, color: '#555', minWidth: 120, flexShrink: 0, paddingTop: 2, textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>{k}</span>
      <span style={{ fontSize: 13, color: '#d4d4d4', lineHeight: 1.6, fontFamily: 'var(--font-body)' }}>{v}</span>
    </div>
  );
}

// ── TABS ───────────────────────────────────────────────────────────────────────
const TABS = [
  { id: 'script',  label: 'Script',         icon: '📄' },
  { id: 'scenes',  label: 'Scenes',         icon: '🎬' },
  { id: 'hook',    label: 'Hook Psychology', icon: '🪝' },
  { id: 'youtube', label: 'YouTube SEO',     icon: '▶️' },
  { id: 'social',  label: 'Social',          icon: '📱' },
  { id: 'plan',    label: '7-Day Plan',      icon: '📅' },
];

// ── Scene Card ─────────────────────────────────────────────────────────────────
function SceneCard({ scene }) {
  const [open, setOpen] = useState(false);
  if (!scene) return null;

  const typeColors = {
    HOOK: '#D4A847', INTRO: '#4A90D9', MAIN_CONTENT: '#3ECF8E',
    PATTERN_INTERRUPT: '#F59E0B', RETENTION_BRIDGE: '#8B5CF6',
    CTA: '#EC4899', OUTRO: '#555',
  };
  const col = typeColors[scene.section_type] || '#3ECF8E';

  return (
    <div style={{ background: '#0f0f0f', border: '1px solid #222', borderRadius: 12, overflow: 'hidden', marginBottom: 8, transition: 'border-color 0.2s' }}
      onMouseEnter={e => e.currentTarget.style.borderColor = '#333'}
      onMouseLeave={e => e.currentTarget.style.borderColor = '#222'}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', cursor: 'pointer', userSelect: 'none' }}
        onClick={() => setOpen(!open)}>
        <div style={{ width: 32, height: 32, borderRadius: 8, background: `${col}18`, border: `1.5px solid ${col}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800, color: col, flexShrink: 0, fontFamily: 'var(--font-mono)' }}>
          S{scene.scene_number}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <span style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: col, fontFamily: 'var(--font-mono)' }}>{scene.section_type?.replace('_', ' ')}</span>
          <div style={{ fontSize: 11, color: '#555', fontFamily: 'var(--font-mono)', marginTop: 1 }}>{scene.timestamp_start} → {scene.timestamp_end}</div>
        </div>
        <span style={{ fontSize: 12, color: '#444', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontFamily: 'var(--font-body)' }}>
          {scene.voiceover?.slice(0, 55)}…
        </span>
        <span style={{ fontSize: 11, color: '#444', transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', flexShrink: 0 }}>▼</span>
      </div>
      {open && (
        <div style={{ padding: '0 16px 16px', borderTop: '1px solid #1e1e1e', display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div>
            <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#555', fontFamily: 'var(--font-mono)', margin: '12px 0 6px' }}>🎙 Voiceover</div>
            <div style={{ background: `${col}0d`, borderLeft: `3px solid ${col}`, borderRadius: '0 8px 8px 0', padding: '10px 14px', fontSize: 13, color: '#d4d4d4', lineHeight: 1.75, fontFamily: 'var(--font-body)' }}>{scene.voiceover}</div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {scene.visual_direction && (
              <div style={{ background: '#141414', border: '1px solid #222', borderRadius: 8, padding: '10px 12px' }}>
                <div style={{ fontSize: 9, color: '#555', textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: 'var(--font-mono)', marginBottom: 6, fontWeight: 700 }}>📹 Visual Direction</div>
                <div style={{ fontSize: 12, color: '#aaa', lineHeight: 1.6, fontFamily: 'var(--font-body)' }}>{scene.visual_direction}</div>
              </div>
            )}
            {scene.tone_direction && (
              <div style={{ background: '#141414', border: '1px solid #222', borderRadius: 8, padding: '10px 12px' }}>
                <div style={{ fontSize: 9, color: '#555', textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: 'var(--font-mono)', marginBottom: 6, fontWeight: 700 }}>🎭 Tone</div>
                <div style={{ fontSize: 12, color: '#aaa', lineHeight: 1.6, fontFamily: 'var(--font-body)' }}>{scene.tone_direction}</div>
              </div>
            )}
          </div>
          {scene.retention_technique && (
            <div style={{ background: '#141414', border: '1px solid #2a2a2a', borderRadius: 8, padding: '10px 12px' }}>
              <div style={{ fontSize: 9, color: '#555', textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: 'var(--font-mono)', marginBottom: 4, fontWeight: 700 }}>🔒 Retention Technique</div>
              <div style={{ fontSize: 12, color: '#aaa', fontFamily: 'var(--font-body)' }}>{scene.retention_technique}</div>
            </div>
          )}
          {(scene.overlay_text || scene.b_roll_search_term) && (
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {scene.overlay_text && <span style={{ background: 'rgba(212,168,71,0.12)', border: '1px solid rgba(212,168,71,0.25)', borderRadius: 6, padding: '4px 10px', fontSize: 11, color: '#D4A847', fontFamily: 'var(--font-mono)' }}>📝 "{scene.overlay_text}"</span>}
              {scene.b_roll_search_term && <span style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid #2a2a2a', borderRadius: 6, padding: '4px 10px', fontSize: 11, color: '#777', fontFamily: 'var(--font-mono)' }}>🎬 {scene.b_roll_search_term}</span>}
            </div>
          )}
          <div style={{ display: 'flex', gap: 8 }}>
            <CopyBtn text={scene.voiceover || ''} label="Copy Voiceover" />
            {scene.visual_direction && <CopyBtn text={scene.visual_direction} label="Copy Direction" />}
          </div>
        </div>
      )}
    </div>
  );
}

// ── 7 Day Sprint ───────────────────────────────────────────────────────────────
function SprintTracker({ plan = [], platform = 'YouTube' }) {
  const [done, setDone] = useState({});
  const completedCount = Object.values(done).filter(Boolean).length;
  const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const TYPE_COLORS = {
    'Main Video': '#D4A847', 'Short': '#4A90D9', 'Reel': '#EC4899',
    'Story': '#8B5CF6', 'Community Post': '#3ECF8E', 'Blog': '#F59E0B', 'Podcast': '#6EE7B7',
  };

  if (!plan || plan.length === 0) return (
    <div style={{ textAlign: 'center', padding: '40px', color: '#555', fontFamily: 'var(--font-mono)', fontSize: 13 }}>No 7-day plan available.</div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: '#d4d4d4', fontFamily: 'var(--font-body)' }}>📅 7-Day Sprint</span>
        <span style={{ fontSize: 11, color: '#555', fontFamily: 'var(--font-mono)' }}><span style={{ color: '#D4A847' }}>{completedCount}</span> / {plan.length} done</span>
      </div>
      <div style={{ height: 3, background: '#1e1e1e', borderRadius: 2, overflow: 'hidden' }}>
        <div style={{ height: '100%', background: 'linear-gradient(90deg, #D4A847, #E8CA70)', borderRadius: 2, width: `${(completedCount / Math.max(plan.length, 1)) * 100}%`, transition: 'width 0.5s ease' }} />
      </div>
      {/* Mobile: list view */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {plan.map((item, i) => {
          const col = TYPE_COLORS[item.content_type] || '#D4A847';
          const isDone = done[item.day];
          return (
            <div key={item.day}
              style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 16px', background: isDone ? 'rgba(62,207,142,0.06)' : '#0f0f0f', border: `1px solid ${isDone ? 'rgba(62,207,142,0.2)' : '#222'}`, borderRadius: 10, cursor: 'pointer', transition: 'all 0.2s' }}
              onClick={() => setDone(prev => ({ ...prev, [item.day]: !prev[item.day] }))}>
              <div style={{ width: 28, height: 28, borderRadius: 7, background: isDone ? '#3ECF8E' : '#1a1a1a', border: `1.5px solid ${isDone ? '#3ECF8E' : '#333'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 800, color: isDone ? '#000' : '#555', flexShrink: 0, fontFamily: 'var(--font-mono)', transition: 'all 0.2s' }}>
                {isDone ? '✓' : DAYS[i] || `D${item.day}`}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 10, fontWeight: 700, color: col, fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{item.content_type}</span>
                  <span style={{ fontSize: 10, color: '#444', fontFamily: 'var(--font-mono)' }}>· {item.platform}</span>
                </div>
                <div style={{ fontSize: 13, color: isDone ? '#888' : '#ccc', fontFamily: 'var(--font-body)', textDecoration: isDone ? 'line-through' : 'none', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.topic_angle}</div>
              </div>
              {item.repurpose_from && item.repurpose_from !== 'Original' && (
                <span style={{ fontSize: 10, color: '#444', fontFamily: 'var(--font-mono)', flexShrink: 0 }}>↩ {item.repurpose_from}</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Hook Explainer ─────────────────────────────────────────────────────────────
function HookExplainer({ hookBreakdown, chosenHook, hookTrigger }) {
  const TRIGGER_META = {
    LOSS_AVERSION:       { emoji: '⚠️', color: '#F59E0B', label: 'Loss Aversion' },
    CURIOSITY_GAP:       { emoji: '❓', color: '#4A90D9', label: 'Curiosity Gap' },
    PATTERN_INTERRUPT:   { emoji: '⚡', color: '#8B5CF6', label: 'Pattern Interrupt' },
    SOCIAL_PROOF:        { emoji: '👥', color: '#3ECF8E', label: 'Social Proof' },
    DIRECT_PROMISE:      { emoji: '🎯', color: '#D4A847', label: 'Direct Promise' },
    AUTHORITY_CHALLENGE: { emoji: '🔥', color: '#EC4899', label: 'Authority Challenge' },
    IDENTITY:            { emoji: '🪞', color: '#6EE7B7', label: 'Identity Trigger' },
  };
  const trigger = TRIGGER_META[hookTrigger] || { emoji: '🧠', color: '#D4A847', label: hookTrigger || 'Psychological Trigger' };
  const hb = hookBreakdown || {};

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Hook Display */}
      <div style={{ background: `${trigger.color}0d`, border: `1px solid ${trigger.color}30`, borderRadius: 12, padding: '20px 22px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: trigger.color, fontFamily: 'var(--font-mono)' }}>🪝 Chosen Hook</span>
          <CopyBtn text={chosenHook || ''} />
        </div>
        <div style={{ fontSize: 17, fontWeight: 600, color: '#f5f5f5', lineHeight: 1.6, fontStyle: 'italic', marginBottom: 14, fontFamily: 'var(--font-body)' }}>"{chosenHook || hb.hook_text}"</div>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '5px 12px', borderRadius: 100, fontSize: 11, fontWeight: 700, fontFamily: 'var(--font-mono)', background: `${trigger.color}18`, border: `1px solid ${trigger.color}35`, color: trigger.color }}>
          {trigger.emoji} {trigger.label}
        </span>
      </div>
      {/* Psychology Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 10 }}>
        {hb.psychological_mechanism && (
          <Card>
            <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#555', fontFamily: 'var(--font-mono)', marginBottom: 8 }}>🧠 Psychological Mechanism</div>
            <div style={{ fontSize: 13, color: '#d4d4d4', lineHeight: 1.7, fontFamily: 'var(--font-body)' }}>{hb.psychological_mechanism}</div>
          </Card>
        )}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {hb.what_viewer_is_thinking && (
            <Card>
              <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#555', fontFamily: 'var(--font-mono)', marginBottom: 8 }}>💬 Viewer's Thought</div>
              <div style={{ fontSize: 13, color: '#d4d4d4', lineHeight: 1.65, fontFamily: 'var(--font-body)' }}>{hb.what_viewer_is_thinking}</div>
            </Card>
          )}
          {hb.why_first_3_seconds && (
            <Card>
              <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#555', fontFamily: 'var(--font-mono)', marginBottom: 8 }}>⚡ Why First 3 Seconds</div>
              <div style={{ fontSize: 13, color: '#d4d4d4', lineHeight: 1.65, fontFamily: 'var(--font-body)' }}>{hb.why_first_3_seconds}</div>
            </Card>
          )}
        </div>
        {hb.what_happens_if_hook_fails && (
          <div style={{ background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.18)', borderRadius: 12, padding: '14px 16px' }}>
            <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#ef4444', fontFamily: 'var(--font-mono)', marginBottom: 6 }}>⚠️ If Hook Fails</div>
            <div style={{ fontSize: 13, color: '#d4d4d4', lineHeight: 1.65, fontFamily: 'var(--font-body)' }}>{hb.what_happens_if_hook_fails}</div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────────
export default function ResultsPage() {
  const router = useRouter();
  const [result, setResult] = useState(null);
  const [activeTab, setActiveTab] = useState('script');
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    const raw = sessionStorage.getItem('studioai_result');
    if (!raw) { router.replace('/generate'); return; }
    try {
      setResult(JSON.parse(raw));
      setTimeout(() => setRevealed(true), 80);
    } catch { router.replace('/generate'); }
  }, []);

  if (!result) return (
    <div style={{ minHeight: '100vh', background: '#080808', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: 32, height: 32, borderRadius: '50%', border: '2px solid #222', borderTopColor: '#D4A847', animation: 'spin 0.7s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  const { research = {}, creator = {}, publisher = {}, meta = {}, input = {} } = result;
  const yt = publisher.youtube || {};
  const ig = publisher.instagram || {};
  const tt = publisher.tiktok || {};
  const bl = publisher.blog || {};
  const ps = publisher.posting_schedule || {};
  const totalSec = ((meta.total_duration_ms || 0) / 1000).toFixed(1);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,400;0,9..144,600;0,9..144,700;0,9..144,800;1,9..144,400;1,9..144,600&family=DM+Sans:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap');

        :root {
          --font-display: 'Fraunces', serif;
          --font-body: 'DM Sans', sans-serif;
          --font-mono: 'JetBrains Mono', monospace;
          --bg: #080808;
          --bg-mid: #0d0d0d;
          --bg-card: #111111;
          --border: #1f1f1f;
          --border-mid: #2a2a2a;
          --text-primary: #f0f0f0;
          --text-secondary: #aaa;
          --text-dim: #555;
          --gold: #D4A847;
          --gold-dim: rgba(212,168,71,0.15);
          --green: #3ECF8E;
          --blue: #4A90D9;
          --red: #ef4444;
        }

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes slideIn { from { opacity: 0; transform: translateX(-8px); } to { opacity: 1; transform: translateX(0); } }

        .rp-root {
          min-height: 100vh;
          background: var(--bg);
          color: var(--text-primary);
          font-family: var(--font-body);
          display: flex;
          flex-direction: column;
        }

        /* ── TOPBAR ── */
        .rp-topbar {
          position: sticky;
          top: 0;
          z-index: 50;
          background: rgba(8,8,8,0.96);
          backdrop-filter: blur(16px);
          border-bottom: 1px solid var(--border);
          height: 56px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 24px;
        }

        .rp-topbar-left {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .rp-logo {
          width: 30px; height: 30px;
          background: var(--text-primary);
          border-radius: 8px;
          display: flex; align-items: center; justify-content: center;
          cursor: pointer;
        }

        .rp-breadcrumb-sep { color: var(--border-mid); font-size: 18px; }
        .rp-breadcrumb-page { font-size: 13px; color: var(--text-dim); font-weight: 500; }

        .rp-topbar-right {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .rp-badge {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          padding: 4px 12px;
          border-radius: 100px;
          font-size: 12px;
          font-weight: 600;
          white-space: nowrap;
          font-family: var(--font-mono);
        }

        .rp-badge.streak {
          background: rgba(245,158,11,0.12);
          border: 1px solid rgba(245,158,11,0.25);
          color: #F59E0B;
        }

        .rp-badge.time {
          background: rgba(255,255,255,0.05);
          border: 1px solid var(--border-mid);
          color: var(--text-secondary);
        }

        .rp-btn {
          padding: 7px 14px;
          border-radius: 8px;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          font-family: var(--font-body);
          text-decoration: none;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          border: none;
        }

        .rp-btn.ghost {
          background: transparent;
          color: var(--text-dim);
          border: 1px solid var(--border-mid);
        }
        .rp-btn.ghost:hover { background: rgba(255,255,255,0.05); color: var(--text-secondary); }

        .rp-btn.primary {
          background: var(--text-primary);
          color: #080808;
        }
        .rp-btn.primary:hover { background: #e0e0e0; transform: translateY(-1px); }

        /* ── BANNER ── */
        .rp-banner {
          background: linear-gradient(180deg, #0e0e0e 0%, #080808 100%);
          border-bottom: 1px solid var(--border);
          padding: 36px 24px 32px;
          animation: fadeUp 0.5s ease both;
        }

        .rp-banner-inner {
          max-width: 860px;
          margin: 0 auto;
        }

        .rp-meta-row {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
          margin-bottom: 18px;
        }

        .rp-meta-tag {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          padding: 4px 12px;
          border-radius: 6px;
          font-size: 12px;
          font-weight: 500;
          background: rgba(255,255,255,0.05);
          border: 1px solid var(--border-mid);
          color: var(--text-secondary);
          font-family: var(--font-body);
        }

        .rp-topic {
          font-family: var(--font-display);
          font-size: clamp(22px, 4vw, 36px);
          font-weight: 700;
          color: var(--text-primary);
          line-height: 1.2;
          letter-spacing: -0.03em;
          margin-bottom: 14px;
        }

        .rp-hook {
          font-size: 14px;
          color: var(--text-secondary);
          line-height: 1.7;
          border-left: 3px solid var(--gold);
          padding-left: 16px;
          font-style: italic;
          max-width: 680px;
          margin-bottom: 20px;
          font-family: var(--font-body);
        }

        .rp-stats {
          display: flex;
          gap: 20px;
          flex-wrap: wrap;
        }

        .rp-stat {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 13px;
          color: var(--text-secondary);
          font-family: var(--font-body);
        }

        .rp-stat strong { color: var(--text-primary); font-weight: 700; }

        .rp-streak-bar {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          padding: 10px 16px;
          background: #0a0a0a;
          border: 1px solid #1e1e1e;
          border-radius: 10px;
          margin-top: 18px;
        }

        /* ── TAB STRIP ── */
        .rp-tabstrip {
          background: rgba(8,8,8,0.95);
          border-bottom: 1px solid var(--border);
          position: sticky;
          top: 56px;
          z-index: 40;
        }

        .rp-tabs {
          max-width: 860px;
          margin: 0 auto;
          padding: 0 24px;
          display: flex;
          overflow-x: auto;
          scrollbar-width: none;
          gap: 0;
        }

        .rp-tabs::-webkit-scrollbar { display: none; }

        .rp-tab {
          padding: 14px 18px;
          font-size: 13px;
          font-weight: 500;
          font-family: var(--font-body);
          color: var(--text-dim);
          background: transparent;
          border: none;
          border-bottom: 2px solid transparent;
          cursor: pointer;
          white-space: nowrap;
          transition: all 0.18s;
          letter-spacing: -0.01em;
          margin-bottom: -1px;
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .rp-tab:hover { color: var(--text-secondary); }

        .rp-tab.active {
          color: var(--gold);
          border-bottom-color: var(--gold);
          font-weight: 600;
        }

        /* ── CONTENT PANE ── */
        .rp-content {
          flex: 1;
          background: var(--bg);
        }

        .rp-pane {
          max-width: 860px;
          margin: 0 auto;
          padding: 32px 24px 80px;
          animation: fadeUp 0.35s ease both;
        }

        /* ── TITLE OPTION CARD ── */
        .title-option {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          padding: 14px 16px;
          background: var(--bg-card);
          border: 1px solid var(--border);
          border-radius: 10px;
          margin-bottom: 8px;
          transition: border-color 0.2s;
        }
        .title-option:hover { border-color: var(--border-mid); }

        .title-rank {
          width: 26px; height: 26px;
          border-radius: 6px;
          background: rgba(212,168,71,0.12);
          border: 1px solid rgba(212,168,71,0.25);
          display: flex; align-items: center; justify-content: center;
          font-size: 11px; font-weight: 800; color: var(--gold);
          font-family: var(--font-mono); flex-shrink: 0;
        }

        /* ── SOCIAL PLATFORM ── */
        .social-platform-header {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 12px 16px;
          background: #0d0d0d;
          border: 1px solid var(--border);
          border-radius: 10px 10px 0 0;
          border-bottom: none;
        }

        .social-platform-body {
          background: var(--bg-card);
          border: 1px solid var(--border);
          border-radius: 0 0 10px 10px;
          padding: 18px 20px;
          margin-bottom: 20px;
        }

        /* ── CTA BOX ── */
        .cta-box {
          background: rgba(212,168,71,0.06);
          border: 1px solid rgba(212,168,71,0.18);
          border-radius: 10px;
          padding: 16px 18px;
          margin-bottom: 10px;
        }

        /* ── PATTERN INTERRUPT ── */
        .pi-item {
          display: flex;
          gap: 12px;
          align-items: flex-start;
          padding: 12px 14px;
          background: rgba(245,158,11,0.06);
          border: 1px solid rgba(245,158,11,0.15);
          border-radius: 8px;
          margin-bottom: 8px;
        }

        @media (max-width: 640px) {
          .rp-topbar { padding: 0 16px; }
          .rp-banner { padding: 24px 16px; }
          .rp-pane { padding: 24px 16px 60px; }
          .rp-tabs { padding: 0 16px; }
          .rp-tab { padding: 12px 12px; font-size: 12px; }
          .rp-topic { font-size: 22px; }
          .rp-btn span { display: none; }
        }
      `}</style>

      <div className="rp-root">

        {/* ── Topbar ── */}
        <header className="rp-topbar">
          <div className="rp-topbar-left">
            <div className="rp-logo" onClick={() => router.push('/generate')}>
              <svg width="14" height="14" viewBox="0 0 20 20" fill="none">
                <polygon points="10,2 17,6 17,14 10,18 3,14 3,6" stroke="#080808" strokeWidth="1.5" fill="none"/>
                <polygon points="10,6 14,8.5 14,13.5 10,16 6,13.5 6,8.5" fill="#080808" fillOpacity="0.3"/>
              </svg>
            </div>
            <span className="rp-breadcrumb-sep">/</span>
            <span className="rp-breadcrumb-page">Results</span>
          </div>
          <div className="rp-topbar-right">
            {meta.streak > 0 && (
              <span className="rp-badge streak">🔥 {meta.streak}-day streak</span>
            )}
            <span className="rp-badge time">⚡ {totalSec}s</span>
            <button className="rp-btn ghost" onClick={() => router.push('/dashboard')}>
              <span>History</span>
            </button>
            <button className="rp-btn primary" onClick={() => router.push('/generate')}>
              + New generation
            </button>
          </div>
        </header>

        {/* ── Banner ── */}
        <div className="rp-banner">
          <div className="rp-banner-inner">
            <div className="rp-meta-row">
              {input.platform && <span className="rp-meta-tag">▶ {input.platform}</span>}
              {input.language && <span className="rp-meta-tag">🌐 {input.language}</span>}
              {input.tone && <span className="rp-meta-tag">🎭 {input.tone}</span>}
              {input.creatorType && <span className="rp-meta-tag">👤 {input.creatorType}</span>}
            </div>

            <h1 className="rp-topic">{research.chosen_topic || 'Generated Content'}</h1>

            {research.chosen_hook && (
              <p className="rp-hook">"{research.chosen_hook}"</p>
            )}

            <div className="rp-stats">
              {creator.word_count > 0 && <div className="rp-stat"><span>📝</span><strong>{creator.word_count}</strong> words</div>}
              {creator.scenes?.length > 0 && <div className="rp-stat"><span>🎬</span><strong>{creator.scenes.length}</strong> scenes</div>}
              {yt.tags?.length > 0 && <div className="rp-stat"><span>🏷️</span><strong>{yt.tags.length}</strong> SEO tags</div>}
              {creator.estimated_duration && <div className="rp-stat"><span>⏱</span><strong>{creator.estimated_duration}</strong></div>}
            </div>

            {meta.streak >= 3 && (
              <div className="rp-streak-bar">
                <span style={{ fontSize: 20 }}>🔥</span>
                <div>
                  <span style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 700, color: '#D4A847' }}>{meta.streak}</span>
                  <span style={{ fontSize: 11, color: '#555', fontFamily: 'var(--font-mono)', marginLeft: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>DAY STREAK</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── Tab Strip ── */}
        <div className="rp-tabstrip">
          <div className="rp-tabs">
            {TABS.map(t => (
              <button key={t.id} className={`rp-tab ${activeTab === t.id ? 'active' : ''}`} onClick={() => setActiveTab(t.id)}>
                <span>{t.icon}</span>{t.label}
              </button>
            ))}
          </div>
        </div>

        {/* ── Content ── */}
        <div className="rp-content">
          <TabErrorBoundary key={activeTab}>

            {/* ── SCRIPT ── */}
            {activeTab === 'script' && (
              <div className="rp-pane">
                <Section label="📄 Full Script" copyText={creator.full_script} highlight>
                  <Prose>{creator.full_script || 'No script generated.'}</Prose>
                </Section>

                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 28 }}>
                  {creator.estimated_duration && <Chip label={`⏱ ${creator.estimated_duration}`} />}
                  {creator.word_count > 0 && <Chip label={`📝 ${creator.word_count} words`} color="#3ECF8E" />}
                  {creator.creator_mode && <Chip label={`🎬 ${creator.creator_mode}`} color="#4A90D9" />}
                  {input.language && <Chip label={`🌐 ${input.language}`} color="#8B5CF6" />}
                  {input.tone && <Chip label={`🎭 ${input.tone}`} color="#EC4899" />}
                </div>

                {creator.shorts_script && (
                  <Section label="⚡ Shorts / Reels Version (60s)" copyText={creator.shorts_script}>
                    <Prose>{creator.shorts_script}</Prose>
                  </Section>
                )}

                {Array.isArray(creator.cta_options) && creator.cta_options.length > 0 && (
                  <Section label="📣 CTA Options">
                    {creator.cta_options.map((cta, i) => (
                      <div key={i} className="cta-box">
                        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10, marginBottom: 10 }}>
                          <div style={{ fontSize: 14, color: '#f5f5f5', fontStyle: 'italic', lineHeight: 1.6, flex: 1, fontFamily: 'var(--font-body)' }}>"{cta.cta_text}"</div>
                          <CopyBtn text={cta.cta_text} />
                        </div>
                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                          {cta.placement && <Chip label={`📍 ${cta.placement}`} dim />}
                          {cta.goal && <Chip label={`🎯 ${cta.goal}`} dim />}
                        </div>
                        {cta.why_it_works && <p style={{ fontSize: 12, color: '#666', marginTop: 8, fontFamily: 'var(--font-body)', lineHeight: 1.55 }}>{cta.why_it_works}</p>}
                      </div>
                    ))}
                  </Section>
                )}

                {Array.isArray(creator.pattern_interrupts) && creator.pattern_interrupts.length > 0 && (
                  <Section label="⚡ Pattern Interrupts">
                    {creator.pattern_interrupts.map((pi, i) => (
                      <div key={i} className="pi-item">
                        <span style={{ fontSize: 11, color: '#F59E0B', fontFamily: 'var(--font-mono)', whiteSpace: 'nowrap', paddingTop: 1 }}>{pi.timestamp}</span>
                        <div>
                          <div style={{ fontSize: 10, fontWeight: 700, color: '#F59E0B', fontFamily: 'var(--font-mono)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{pi.technique}</div>
                          <div style={{ fontSize: 12, color: '#aaa', fontFamily: 'var(--font-body)' }}>{pi.script_line}</div>
                        </div>
                      </div>
                    ))}
                  </Section>
                )}
              </div>
            )}

            {/* ── SCENES ── */}
            {activeTab === 'scenes' && (
              <div className="rp-pane">
                <Section label={`🎬 Scene Breakdown — ${creator.scenes?.length || 0} Scenes`}>
                  {Array.isArray(creator.scenes) && creator.scenes.length > 0
                    ? creator.scenes.map(scene => <SceneCard key={scene.scene_number} scene={scene} />)
                    : <Prose>No scene data available.</Prose>
                  }
                </Section>
              </div>
            )}

            {/* ── HOOK PSYCHOLOGY ── */}
            {activeTab === 'hook' && (
              <div className="rp-pane">
                <HookExplainer
                  hookBreakdown={creator.hook_breakdown}
                  chosenHook={research.chosen_hook}
                  hookTrigger={research.chosen_hook_trigger}
                />
                {research.chosen_hook_deep_analysis && (
                  <div style={{ marginTop: 24 }}>
                    <Section label="🧪 Deep Analysis" copyText={research.chosen_hook_deep_analysis}>
                      <Prose>{research.chosen_hook_deep_analysis}</Prose>
                    </Section>
                  </div>
                )}
                {Array.isArray(research.hook_options) && research.hook_options.length > 0 && (
                  <div style={{ marginTop: 24 }}>
                    <Section label="🎣 All Hook Options Considered">
                      {research.hook_options.map((h, i) => {
                        const isChosen = h.hook_text === research.chosen_hook;
                        return (
                          <div key={i} style={{
                            padding: '14px 16px', marginBottom: 8,
                            background: isChosen ? 'rgba(212,168,71,0.06)' : '#0f0f0f',
                            border: `1px solid ${isChosen ? 'rgba(212,168,71,0.25)' : '#1e1e1e'}`,
                            borderRadius: 10,
                          }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
                              {isChosen && <span style={{ fontSize: 9, color: '#D4A847', fontFamily: 'var(--font-mono)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>★ Chosen</span>}
                              <span style={{ fontSize: 9, color: '#555', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{h.psychological_trigger}</span>
                              {h.ctr_strength && <Chip label={h.ctr_strength} color={h.ctr_strength === 'HIGH' ? '#3ECF8E' : h.ctr_strength === 'MEDIUM' ? '#F59E0B' : '#ef4444'} />}
                            </div>
                            <div style={{ fontSize: 14, color: '#e0e0e0', fontFamily: 'var(--font-body)', lineHeight: 1.65, marginBottom: 6, fontStyle: 'italic' }}>"{h.hook_text}"</div>
                            {h.trigger_explanation && <div style={{ fontSize: 12, color: '#666', fontFamily: 'var(--font-body)', lineHeight: 1.55 }}>{h.trigger_explanation}</div>}
                          </div>
                        );
                      })}
                    </Section>
                  </div>
                )}
              </div>
            )}

            {/* ── YOUTUBE SEO ── */}
            {activeTab === 'youtube' && (
              <div className="rp-pane">
                {yt.recommended_title && (
                  <Section label="⭐ Recommended Title" copyText={yt.recommended_title} highlight>
                    <div style={{ padding: '18px 20px', background: 'rgba(212,168,71,0.08)', border: '1px solid rgba(212,168,71,0.22)', borderRadius: 10, fontSize: 18, fontWeight: 700, color: '#f5f5f5', fontFamily: 'var(--font-display)', letterSpacing: '-0.02em', lineHeight: 1.4 }}>
                      {yt.recommended_title}
                    </div>
                  </Section>
                )}
                {Array.isArray(yt.title_options) && yt.title_options.length > 0 && (
                  <Section label="📊 All Title Variants">
                    {yt.title_options.map((t, i) => (
                      <div key={i} className="title-option">
                        <div className="title-rank">{i + 1}</div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 14, fontWeight: 600, color: '#e0e0e0', fontFamily: 'var(--font-body)', marginBottom: 4, lineHeight: 1.4 }}>{t.title}</div>
                          {t.reasoning && <div style={{ fontSize: 12, color: '#666', fontFamily: 'var(--font-body)', lineHeight: 1.5 }}>{t.reasoning}</div>}
                          <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap', marginTop: 6 }}>
                            {t.character_count > 0 && <span style={{ fontSize: 10, color: '#555', fontFamily: 'var(--font-mono)' }}>{t.character_count} chars</span>}
                            {t.primary_strategy && <span style={{ fontSize: 10, color: '#555', fontFamily: 'var(--font-mono)' }}>· {t.primary_strategy}</span>}
                            {t.ctr_prediction && <Chip label={`CTR: ${t.ctr_prediction}`} color={t.ctr_prediction === 'HIGH' ? '#3ECF8E' : '#F59E0B'} />}
                          </div>
                        </div>
                        <CopyBtn text={t.title} />
                      </div>
                    ))}
                  </Section>
                )}
                {yt.description && (
                  <Section label="📝 YouTube Description" copyText={yt.description}>
                    <Prose>{yt.description}</Prose>
                  </Section>
                )}
                {Array.isArray(yt.tags) && yt.tags.length > 0 && (
                  <Section label={`🏷️ Tags (${yt.tags.length})`} copyText={yt.tags.join(', ')}>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                      {yt.tags.map((tag, i) => <Chip key={i} label={tag} />)}
                    </div>
                  </Section>
                )}
                {yt.primary_keyword && (
                  <Section label="🔑 Keywords">
                    <Chip label={yt.primary_keyword} color="#4A90D9" />
                    {Array.isArray(yt.secondary_keywords) && yt.secondary_keywords.length > 0 && (
                      <div style={{ marginTop: 8, display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                        {yt.secondary_keywords.map((k, i) => <Chip key={i} label={k} color="#4A90D9" dim />)}
                      </div>
                    )}
                  </Section>
                )}
                {(yt.end_screen_recommendation || yt.card_recommendation) && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 28 }}>
                    {yt.end_screen_recommendation && (
                      <Card>
                        <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#555', fontFamily: 'var(--font-mono)', marginBottom: 8 }}>📺 End Screen</div>
                        <div style={{ fontSize: 12, color: '#aaa', fontFamily: 'var(--font-body)', lineHeight: 1.6 }}>{yt.end_screen_recommendation}</div>
                      </Card>
                    )}
                    {yt.card_recommendation && (
                      <Card>
                        <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#555', fontFamily: 'var(--font-mono)', marginBottom: 8 }}>🃏 Cards</div>
                        <div style={{ fontSize: 12, color: '#aaa', fontFamily: 'var(--font-body)', lineHeight: 1.6 }}>{yt.card_recommendation}</div>
                      </Card>
                    )}
                  </div>
                )}
                {bl.seo_title && (
                  <>
                    <div style={{ borderTop: '1px solid var(--border)', paddingTop: 24, marginBottom: 20 }}>
                      <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#555', fontFamily: 'var(--font-mono)' }}>✍️ Blog / SEO</span>
                    </div>
                    <Section label="Blog Title" copyText={bl.seo_title}>
                      <Prose>{bl.seo_title}</Prose>
                    </Section>
                    {bl.meta_description && (
                      <Section label="Meta Description" copyText={bl.meta_description}>
                        <Prose>{bl.meta_description}</Prose>
                      </Section>
                    )}
                    {bl.url_slug && (
                      <Section label="URL Slug" copyText={bl.url_slug}>
                        <Chip label={`/${bl.url_slug}`} color="#3ECF8E" />
                      </Section>
                    )}
                    {Array.isArray(bl.suggested_h2_headers) && bl.suggested_h2_headers.length > 0 && (
                      <Section label="H2 Headers" copyText={bl.suggested_h2_headers.join('\n')}>
                        {bl.suggested_h2_headers.map((h, i) => (
                          <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', marginBottom: 6, fontSize: 13, color: '#d4d4d4', fontFamily: 'var(--font-body)' }}>
                            <span style={{ color: '#D4A847', fontFamily: 'var(--font-mono)', fontSize: 11, paddingTop: 2, flexShrink: 0 }}>H2</span>
                            <span>{h}</span>
                          </div>
                        ))}
                      </Section>
                    )}
                  </>
                )}
              </div>
            )}

            {/* ── SOCIAL ── */}
            {activeTab === 'social' && (
              <div className="rp-pane">
                {ig.caption && (
                  <>
                    <div className="social-platform-header">
                      <span style={{ fontSize: 20 }}>📸</span>
                      <span style={{ fontSize: 14, fontWeight: 700, color: '#f0f0f0', fontFamily: 'var(--font-body)' }}>Instagram</span>
                      <div style={{ marginLeft: 'auto' }}>
                        <CopyBtn text={[ig.caption, '', ig.hashtags?.map(h => `#${h.replace(/^#/, '')}`).join(' ')].filter(Boolean).join('\n')} label="Copy All" />
                      </div>
                    </div>
                    <div className="social-platform-body">
                      <Section label="Caption" copyText={ig.caption}>
                        <Prose>{ig.caption}</Prose>
                      </Section>
                      {ig.reel_cover_text && (
                        <Section label="Reel Cover Text"><Chip label={ig.reel_cover_text} /></Section>
                      )}
                      {ig.save_cta && (
                        <Section label="Save CTA" copyText={ig.save_cta}>
                          <Prose style={{ padding: '10px 14px', fontSize: 13 }}>{ig.save_cta}</Prose>
                        </Section>
                      )}
                      {Array.isArray(ig.hashtags) && ig.hashtags.length > 0 && (
                        <Section label={`Hashtags (${ig.hashtags.length})`} copyText={ig.hashtags.map(h => `#${h.replace(/^#/, '')}`).join(' ')}>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                            {ig.hashtags.map((h, i) => <Chip key={i} label={`#${h.replace(/^#/, '')}`} color="#EC4899" />)}
                          </div>
                        </Section>
                      )}
                    </div>
                  </>
                )}
                {tt.caption && (
                  <>
                    <div className="social-platform-header">
                      <span style={{ fontSize: 20 }}>🎵</span>
                      <span style={{ fontSize: 14, fontWeight: 700, color: '#f0f0f0', fontFamily: 'var(--font-body)' }}>TikTok</span>
                      <div style={{ marginLeft: 'auto' }}>
                        <CopyBtn text={[tt.caption, tt.hashtags?.join(' ')].filter(Boolean).join('\n')} label="Copy All" />
                      </div>
                    </div>
                    <div className="social-platform-body">
                      <Section label="Caption" copyText={tt.caption}>
                        <Prose style={{ fontSize: 13 }}>{tt.caption}</Prose>
                      </Section>
                      {tt.first_frame_text && (
                        <Section label="First Frame Text"><Chip label={tt.first_frame_text} /></Section>
                      )}
                      {tt.duet_stitch_suggestion && (
                        <Section label="Duet / Stitch Hook" copyText={tt.duet_stitch_suggestion}>
                          <Prose style={{ fontSize: 13 }}>{tt.duet_stitch_suggestion}</Prose>
                        </Section>
                      )}
                      {Array.isArray(tt.hashtags) && tt.hashtags.length > 0 && (
                        <Section label="Hashtags" copyText={tt.hashtags.join(' ')}>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                            {tt.hashtags.map((h, i) => <Chip key={i} label={h} color="#4A90D9" />)}
                          </div>
                        </Section>
                      )}
                      {tt.trending_sound_category && (
                        <Section label="Sound Category"><Chip label={tt.trending_sound_category} color="#8B5CF6" /></Section>
                      )}
                    </div>
                  </>
                )}
                {Array.isArray(publisher.cross_platform_repurpose) && publisher.cross_platform_repurpose.length > 0 && (
                  <Section label="♻️ Repurpose Across Platforms">
                    {publisher.cross_platform_repurpose.map((r, i) => (
                      <div key={i} style={{ padding: '12px 14px', background: '#0f0f0f', border: '1px solid #1e1e1e', borderRadius: 8, marginBottom: 8 }}>
                        <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 6, flexWrap: 'wrap' }}>
                          <Chip label={r.platform} />
                          {r.format && <Chip label={r.format} color="#8B5CF6" />}
                        </div>
                        <div style={{ fontSize: 12, color: '#888', fontFamily: 'var(--font-body)', lineHeight: 1.6 }}>{r.specific_angle}</div>
                      </div>
                    ))}
                  </Section>
                )}
                {ps.primary_post_day && (
                  <Section label="🕐 Posting Schedule">
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', marginBottom: 10 }}>
                      <Chip label={`📅 ${ps.primary_post_day}`} />
                      {ps.primary_post_time && <Chip label={`🕐 ${ps.primary_post_time}`} />}
                      {ps.follow_up_story_timing && <Chip label={`+📱 ${ps.follow_up_story_timing}`} dim />}
                    </div>
                    {ps.reasoning && <div style={{ fontSize: 12, color: '#666', fontFamily: 'var(--font-body)', lineHeight: 1.6 }}>{ps.reasoning}</div>}
                  </Section>
                )}
              </div>
            )}

            {/* ── 7-DAY PLAN ── */}
            {activeTab === 'plan' && (
              <div className="rp-pane">
                <SprintTracker
                  plan={publisher.seven_day_content_plan}
                  platform={input.platform || 'YouTube'}
                />
              </div>
            )}

          </TabErrorBoundary>
        </div>
      </div>
    </>
  );
}