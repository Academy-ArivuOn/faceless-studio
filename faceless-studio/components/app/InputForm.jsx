'use client';

/**
 * InputForm — reusable generate form, can be embedded anywhere
 *
 * Props:
 *   onSubmit       {function(formData)}  — called with { niche, platform, creatorType, language, tone }
 *   loading        {boolean}
 *   error          {string}
 *   usage          {object}             — { plan, remaining, limit, allowed }
 *   defaultValues  {object}             — pre-fill any field
 *   compact        {boolean}            — smaller layout for embedding in panels
 */

const PLATFORMS = [
  { value: 'YouTube',         label: 'YouTube'          },
  { value: 'Instagram Reels', label: 'Instagram Reels'  },
  { value: 'TikTok',          label: 'TikTok'           },
  { value: 'Podcast',         label: 'Podcast'          },
  { value: 'Blog',            label: 'Blog / Article'   },
  { value: 'YouTube Shorts',  label: 'YouTube Shorts'   },
];

const CREATOR_TYPES = [
  { value: 'educator',    label: 'Educator'         },
  { value: 'coach',       label: 'Coach / Mentor'   },
  { value: 'entertainer', label: 'Entertainer'      },
  { value: 'podcaster',   label: 'Podcaster'        },
  { value: 'blogger',     label: 'Blogger / Writer' },
  { value: 'agency',      label: 'Agency / Brand'   },
  { value: 'general',     label: 'General Creator'  },
];

const LANGUAGES = [
  'English', 'Hindi', 'Tamil', 'Telugu', 'Kannada', 'Marathi',
  'Bengali', 'Gujarati', 'Malayalam', 'Punjabi',
  'Spanish', 'French', 'Portuguese', 'Arabic', 'Indonesian', 'Japanese', 'Korean',
];

const TONES = [
  'Educational', 'Conversational', 'Motivational',
  'Entertaining', 'Authoritative', 'Storytelling',
];

import { useState } from 'react';

// ── Atom styles ───────────────────────────────────────────────────────────────
const C1 = '#EEEEF5';
const C2 = 'rgba(238,238,245,0.55)';
const C3 = 'rgba(238,238,245,0.28)';
const CA = '#D4A847';
const CB = 'rgba(255,255,255,0.07)';

const SEL_ARROW = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='11' height='7' viewBox='0 0 11 7'%3E%3Cpath d='M1 1l4.5 4.5L10 1' stroke='rgba(238,238,245,0.28)' strokeWidth='1.5' fill='none' strokeLinecap='round'/%3E%3C/svg%3E")`;

const S = {
  field:  { display: 'flex', flexDirection: 'column', gap: '7px' },
  label:  { fontSize: '11px', fontWeight: '600', color: C2, letterSpacing: '0.06em', textTransform: 'uppercase' },
  hint:   { fontSize: '12px', color: C3, lineHeight: '1.5' },
  input:  {
    background: 'rgba(255,255,255,0.03)', border: `1px solid ${CB}`,
    borderRadius: '8px', padding: '11px 14px', color: C1, fontSize: '14px',
    fontFamily: 'var(--FB)', outline: 'none', width: '100%', boxSizing: 'border-box',
  },
  select: {
    background: 'rgba(255,255,255,0.03)', border: `1px solid ${CB}`,
    borderRadius: '8px', padding: '11px 36px 11px 14px', color: C1, fontSize: '14px',
    fontFamily: 'var(--FB)', outline: 'none', cursor: 'pointer', width: '100%',
    appearance: 'none', backgroundImage: SEL_ARROW,
    backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center',
  },
  errBox: {
    background: 'rgba(248,113,113,0.07)', border: '1px solid rgba(248,113,113,0.18)',
    borderRadius: '8px', padding: '11px 14px', color: '#F87171', fontSize: '13px',
    display: 'flex', alignItems: 'center', gap: '8px',
  },
  cta: {
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: CA, border: 'none', borderRadius: '8px', padding: '14px 24px',
    color: '#000', fontSize: '14px', fontWeight: '700', fontFamily: 'var(--FH)',
    letterSpacing: '-0.01em', transition: 'opacity 0.2s', width: '100%',
  },
};

function Spinner() {
  return (
    <span style={{
      width: '14px', height: '14px', borderRadius: '50%',
      border: '2px solid rgba(0,0,0,0.2)', borderTopColor: '#000',
      display: 'inline-block', animation: 'spin 0.7s linear infinite', flexShrink: 0,
    }} />
  );
}

export default function InputForm({
  onSubmit,
  loading       = false,
  error         = '',
  usage         = null,
  defaultValues = {},
  compact       = false,
}) {
  const [niche,       setNiche]       = useState(defaultValues.niche       || '');
  const [platform,    setPlatform]    = useState(defaultValues.platform    || 'YouTube');
  const [creatorType, setCreatorType] = useState(defaultValues.creatorType || 'general');
  const [language,    setLanguage]    = useState(defaultValues.language    || 'English');
  const [tone,        setTone]        = useState(defaultValues.tone        || 'Educational');

  function handleSubmit(e) {
    e.preventDefault();
    if (!onSubmit) return;
    onSubmit({ niche: niche.trim(), platform, creatorType, language, tone });
  }

  const overLimit = usage && !usage.allowed;

  return (
    <>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        .if-input:focus {
          border-color: rgba(212,168,71,0.4) !important;
          box-shadow: 0 0 0 3px rgba(212,168,71,0.06);
        }
        .if-select:focus { border-color: rgba(212,168,71,0.4) !important; }
        .if-cta:hover:not(:disabled) { opacity: 0.9 !important; transform: translateY(-1px); }
      `}</style>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: compact ? '14px' : '20px' }}>

        {/* Niche */}
        <div style={S.field}>
          <label style={S.label}>Niche <span style={{ color: CA }}>*</span></label>
          <input
            className="if-input"
            style={S.input}
            type="text"
            placeholder="e.g. personal finance for Indian millennials, AI tools for SaaS founders..."
            value={niche}
            onChange={e => setNiche(e.target.value)}
            disabled={loading}
            required
            minLength={2}
          />
          {!compact && (
            <span style={S.hint}>Specific beats generic. The more precise your niche, the stronger the output.</span>
          )}
        </div>

        {/* Platform + Creator Type */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
          <div style={S.field}>
            <label style={S.label}>Platform</label>
            <select className="if-select" style={S.select} value={platform} onChange={e => setPlatform(e.target.value)} disabled={loading}>
              {PLATFORMS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
            </select>
          </div>
          <div style={S.field}>
            <label style={S.label}>Creator Type</label>
            <select className="if-select" style={S.select} value={creatorType} onChange={e => setCreatorType(e.target.value)} disabled={loading}>
              {CREATOR_TYPES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
          </div>
        </div>

        {/* Language + Tone */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
          <div style={S.field}>
            <label style={S.label}>Language</label>
            <select className="if-select" style={S.select} value={language} onChange={e => setLanguage(e.target.value)} disabled={loading}>
              {LANGUAGES.map(l => <option key={l} value={l}>{l}</option>)}
            </select>
          </div>
          <div style={S.field}>
            <label style={S.label}>Tone</label>
            <select className="if-select" style={S.select} value={tone} onChange={e => setTone(e.target.value)} disabled={loading}>
              {TONES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div style={S.errBox}>
            <span style={{ color: '#F87171', fontSize: '11px' }}>●</span>
            <span>{error}</span>
          </div>
        )}

        {/* Limit warning */}
        {overLimit && (
          <div style={{ ...S.errBox, background: 'rgba(245,158,11,0.07)', border: '1px solid rgba(245,158,11,0.2)', color: '#F59E0B' }}>
            <span style={{ fontSize: '11px' }}>⚠</span>
            <span>Monthly limit reached. <a href="/dashboard" style={{ color: '#D4A847', textDecoration: 'underline' }}>Upgrade your plan</a> to continue.</span>
          </div>
        )}

        {/* Submit */}
        <button
          type="submit"
          className="if-cta"
          disabled={loading || overLimit}
          style={{ ...S.cta, opacity: (loading || overLimit) ? 0.5 : 1, cursor: (loading || overLimit) ? 'not-allowed' : 'pointer' }}
        >
          {loading
            ? <><Spinner /><span style={{ marginLeft: '10px' }}>Pipeline running…</span></>
            : <>Run All 3 Agents <span style={{ marginLeft: '8px', fontSize: '15px' }}>→</span></>
          }
        </button>

        {/* Usage indicator */}
        {usage?.plan === 'free' && !overLimit && (
          <p style={{ textAlign: 'center', fontSize: '12px', color: C3, margin: '0' }}>
            {usage.remaining ?? 0} of {usage.limit} free generations remaining this month
          </p>
        )}

      </form>
    </>
  );
}