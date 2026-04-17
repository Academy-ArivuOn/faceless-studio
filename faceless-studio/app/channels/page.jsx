'use client';
// app/channels/page.jsx
// Multi-channel management — Studio plan only

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { getSupabaseBrowser } from '@/packages/supabase-browser';

// ── Constants ─────────────────────────────────────────────────────────────────
const PLATFORMS = ['YouTube', 'Instagram Reels', 'TikTok', 'Podcast', 'Blog', 'YouTube Shorts'];
const LANGUAGES = ['English', 'Hindi', 'Tamil', 'Telugu', 'Kannada', 'Marathi', 'Bengali', 'Gujarati', 'Malayalam', 'Punjabi', 'Spanish', 'French'];
const CREATOR_TYPES = [
  { value: 'general',     label: 'General Creator' },
  { value: 'educator',    label: 'Educator'        },
  { value: 'coach',       label: 'Coach / Mentor'  },
  { value: 'entertainer', label: 'Entertainer'     },
  { value: 'podcaster',   label: 'Podcaster'       },
  { value: 'blogger',     label: 'Blogger / Vlogger'},
  { value: 'agency',      label: 'Agency / Brand'  },
];
const CREATOR_MODES = [
  { value: 'faceless', label: '🎬 Faceless', desc: 'B-roll & voiceover' },
  { value: 'face',     label: '🎥 On Camera', desc: 'On-camera direction' },
  { value: 'blogger',  label: '🎒 Blogger',  desc: 'Vlog filming scripts' },
];
const TONES = ['Educational', 'Conversational', 'Motivational', 'Entertaining', 'Authoritative', 'Storytelling'];
const CHANNEL_SIZES = [
  { value: 'under_1k',  label: 'Under 1K'   },
  { value: '1k_10k',    label: '1K – 10K'   },
  { value: '10k_100k',  label: '10K – 100K' },
  { value: '100k_plus', label: '100K+'       },
];
const EMOJI_OPTIONS = ['📺', '🎬', '🎥', '📡', '🎙️', '✍️', '📸', '🎵', '🎮', '💼', '🌏', '🔬', '💰', '🏋️', '🍜', '✈️'];
const COLOR_OPTIONS  = ['#C9A227', '#2563EB', '#0E7C4A', '#DC2626', '#7C3AED', '#0891B2', '#D97706', '#DB2777', '#0F766E', '#7C3AED', '#92400E', '#1D4ED8'];

const BLANK_CHANNEL = {
  name: '', handle: '', description: '',
  avatar_emoji: '📺', avatar_color: '#C9A227',
  niche: '', platform: 'YouTube', language: 'English',
  creator_type: 'general', creator_mode: 'faceless', tone: 'Educational',
  brand_voice: '', target_audience: '', content_pillars: [],
  channel_size: 'under_1k', social_links: {},
  is_default: false,
};

// ── Sub-components ─────────────────────────────────────────────────────────────
function ChannelAvatar({ emoji, color, size = 44, active = false }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: size * 0.28,
      background: `${color}18`,
      border: `2px solid ${active ? color : `${color}40`}`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.45, flexShrink: 0,
      transition: 'all 0.2s',
      boxShadow: active ? `0 0 0 3px ${color}25` : 'none',
    }}>
      {emoji}
    </div>
  );
}

function PlanGate({ plan, router }) {
  if (plan === 'studio') return null;
  return (
    <div style={{ minHeight: '100vh', background: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, fontFamily: "'DM Sans', sans-serif" }}>
      <div style={{ textAlign: 'center', maxWidth: 480 }}>
        <div style={{ width: 72, height: 72, borderRadius: 18, background: '#FFF9EB', border: '2px solid #FDE68A', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32, margin: '0 auto 24px' }}>🏢</div>
        <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 26, fontWeight: 800, color: '#0A0A0A', marginBottom: 10, letterSpacing: '-0.03em' }}>Studio Plan Required</h1>
        <p style={{ fontSize: 14, color: '#5C5C5C', lineHeight: 1.7, marginBottom: 28 }}>
          Multi-channel management lets you handle up to 5 separate channels with their own Creator DNA, voice, and settings. Available exclusively on the Studio plan.
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'center' }}>
          <button onClick={() => router.push('/checkout?plan=studio')} style={{ background: '#0A0A0A', border: 'none', borderRadius: 10, padding: '13px 28px', color: '#FFFFFF', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}>
            Upgrade to Studio →
          </button>
          <button onClick={() => router.push('/dashboard')} style={{ background: 'none', border: 'none', color: '#8C8C8C', fontSize: 13, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}>
            Back to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}

function ChannelCard({ channel, isActive, onActivate, onEdit, onDelete }) {
  const [delConfirm, setDelConfirm] = useState(false);
  const timeSince = (dateStr) => {
    if (!dateStr) return 'Never used';
    const d = new Date(dateStr);
    const diff = Date.now() - d.getTime();
    const days = Math.floor(diff / 86400000);
    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days}d ago`;
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  };

  return (
    <div style={{
      border: `1.5px solid ${isActive ? channel.avatar_color : '#E8E8E8'}`,
      borderRadius: 14, background: isActive ? `${channel.avatar_color}06` : '#FFFFFF',
      padding: '18px 20px', position: 'relative', transition: 'all 0.2s',
    }}>
      {isActive && (
        <div style={{ position: 'absolute', top: 12, right: 14, display: 'flex', alignItems: 'center', gap: 5, padding: '3px 10px', background: `${channel.avatar_color}18`, border: `1px solid ${channel.avatar_color}40`, borderRadius: 100, fontSize: 10, fontWeight: 700, color: channel.avatar_color, fontFamily: "'JetBrains Mono', monospace", textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          <span style={{ width: 5, height: 5, borderRadius: '50%', background: channel.avatar_color, display: 'inline-block', animation: 'pulse-dot 1.5s ease infinite' }} />
          Active
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, marginBottom: 14 }}>
        <ChannelAvatar emoji={channel.avatar_emoji} color={channel.avatar_color} size={48} active={isActive} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: '#0A0A0A', fontFamily: "'DM Sans', sans-serif", marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{channel.name}</div>
          {channel.handle && <div style={{ fontSize: 12, color: '#8C8C8C', fontFamily: "'JetBrains Mono', monospace", marginBottom: 4 }}>{channel.handle}</div>}
          {channel.niche && <div style={{ fontSize: 12, color: '#5C5C5C', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{channel.niche}</div>}
        </div>
      </div>

      {/* Tags */}
      <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginBottom: 14 }}>
        <Tag label={channel.platform} />
        <Tag label={channel.language} />
        <Tag label={channel.creator_mode} />
        <Tag label={channel.channel_size} />
      </div>

      {/* Stats row */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 16, paddingTop: 12, borderTop: '1px solid #F5F5F5' }}>
        <div>
          <div style={{ fontSize: 18, fontWeight: 800, color: '#0A0A0A', fontFamily: "'Playfair Display', serif", letterSpacing: '-0.03em', lineHeight: 1 }}>{channel.generation_count || 0}</div>
          <div style={{ fontSize: 10, color: '#BCBCBC', fontFamily: "'JetBrains Mono', monospace", marginTop: 2 }}>GENERATIONS</div>
        </div>
        <div>
          <div style={{ fontSize: 11, fontWeight: 600, color: '#5C5C5C', lineHeight: 1.4 }}>{timeSince(channel.last_used_at)}</div>
          <div style={{ fontSize: 10, color: '#BCBCBC', fontFamily: "'JetBrains Mono', monospace", marginTop: 2 }}>LAST USED</div>
        </div>
        <div>
          <div style={{ fontSize: 11, fontWeight: 600, color: '#5C5C5C', lineHeight: 1.4 }}>{new Date(channel.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: '2-digit' })}</div>
          <div style={{ fontSize: 10, color: '#BCBCBC', fontFamily: "'JetBrains Mono', monospace", marginTop: 2 }}>CREATED</div>
        </div>
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: 7 }}>
        {!isActive && (
          <button onClick={() => onActivate(channel.id)} style={{ flex: 1, padding: '8px', border: 'none', borderRadius: 7, background: '#0A0A0A', color: '#FFFFFF', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}>
            Switch to this
          </button>
        )}
        <button onClick={() => onEdit(channel)} style={{ flex: isActive ? 2 : 1, padding: '8px', border: '1px solid #E8E8E8', borderRadius: 7, background: '#FFFFFF', color: '#5C5C5C', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif', transition: 'all 0.15s" }}>
          ✏ Edit
        </button>
        {!delConfirm
          ? <button onClick={() => setDelConfirm(true)} style={{ padding: '8px 12px', border: '1px solid #E8E8E8', borderRadius: 7, background: '#FFFFFF', color: '#8C8C8C', fontSize: 12, cursor: 'pointer' }}>🗑</button>
          : (
            <div style={{ display: 'flex', gap: 4 }}>
              <button onClick={() => { onDelete(channel.id); setDelConfirm(false); }} style={{ padding: '8px 10px', border: 'none', borderRadius: 7, background: '#DC2626', color: '#FFFFFF', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>Delete</button>
              <button onClick={() => setDelConfirm(false)} style={{ padding: '8px 10px', border: '1px solid #E8E8E8', borderRadius: 7, background: '#FFFFFF', color: '#5C5C5C', fontSize: 11, cursor: 'pointer' }}>×</button>
            </div>
          )
        }
      </div>
    </div>
  );
}

function Tag({ label }) {
  return (
    <span style={{ padding: '3px 8px', background: '#F5F5F5', border: '1px solid #E8E8E8', borderRadius: 4, fontSize: 10, fontWeight: 600, color: '#5C5C5C', fontFamily: "'JetBrains Mono', monospace", textTransform: 'capitalize', whiteSpace: 'nowrap' }}>
      {label}
    </span>
  );
}

// ── Channel Form (Create / Edit) ──────────────────────────────────────────────
function ChannelForm({ initial = BLANK_CHANNEL, onSave, onCancel, saving, title = 'New Channel' }) {
  const [form, setForm] = useState({ ...BLANK_CHANNEL, ...initial });
  const [pillarInput, setPillarInput] = useState('');
  const [tab, setTab] = useState('identity');

  function set(key, val) { setForm(p => ({ ...p, [key]: val })); }

  function addPillar() {
    const v = pillarInput.trim();
    if (!v || form.content_pillars.length >= 5) return;
    set('content_pillars', [...form.content_pillars, v]);
    setPillarInput('');
  }

  const FORM_TABS = [
    { id: 'identity', label: '🪪 Identity'  },
    { id: 'dna',      label: '🧬 Creator DNA' },
    { id: 'links',    label: '🔗 Links'      },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0, height: '100%' }}>
      {/* Form header */}
      <div style={{ padding: '20px 24px 0', borderBottom: '1px solid #E8E8E8', flexShrink: 0 }}>
        <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 20, fontWeight: 800, color: '#0A0A0A', letterSpacing: '-0.02em', marginBottom: 16 }}>{title}</h2>
        <div style={{ display: 'flex', gap: 0 }}>
          {FORM_TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} style={{ padding: '10px 16px', background: 'none', border: 'none', borderBottom: `2px solid ${tab === t.id ? '#0A0A0A' : 'transparent'}`, cursor: 'pointer', fontSize: 12, fontWeight: tab === t.id ? 700 : 500, color: tab === t.id ? '#0A0A0A' : '#8C8C8C', fontFamily: "'DM Sans', sans-serif", marginBottom: -1, transition: 'all 0.15s' }}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Form body — scrollable */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>

        {/* ── Identity Tab ── */}
        {tab === 'identity' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

            {/* Avatar picker */}
            <div>
              <label style={LS}>Avatar</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 12 }}>
                <ChannelAvatar emoji={form.avatar_emoji} color={form.avatar_color} size={56} active />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#5C5C5C', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6, fontFamily: "'JetBrains Mono', monospace" }}>Emoji</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                    {EMOJI_OPTIONS.map(e => (
                      <button key={e} onClick={() => set('avatar_emoji', e)} style={{ width: 32, height: 32, borderRadius: 7, border: `2px solid ${form.avatar_emoji === e ? '#0A0A0A' : '#E8E8E8'}`, background: form.avatar_emoji === e ? '#F8F8F8' : '#FFFFFF', fontSize: 16, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {e}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#5C5C5C', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6, fontFamily: "'JetBrains Mono', monospace" }}>Accent colour</div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {COLOR_OPTIONS.map(c => (
                  <button key={c} onClick={() => set('avatar_color', c)} style={{ width: 28, height: 28, borderRadius: '50%', background: c, border: `3px solid ${form.avatar_color === c ? '#0A0A0A' : 'transparent'}`, cursor: 'pointer', flexShrink: 0 }} />
                ))}
              </div>
            </div>

            <Field label="Channel Name *">
              <input style={IS} placeholder="e.g. Finance With Arjun" value={form.name} onChange={e => set('name', e.target.value)} required />
            </Field>

            <Field label="Handle / URL">
              <input style={IS} placeholder="e.g. @financewith arjun or youtube.com/c/..." value={form.handle} onChange={e => set('handle', e.target.value)} />
            </Field>

            <Field label="Short Description">
              <textarea style={{ ...IS, resize: 'none' }} rows={2} placeholder="What this channel is about..." value={form.description} onChange={e => set('description', e.target.value)} />
            </Field>

            <Field label="Primary Niche">
              <input style={IS} placeholder="e.g. Personal Finance India, AI Tools for Students..." value={form.niche} onChange={e => set('niche', e.target.value)} />
            </Field>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <Field label="Platform">
                <select style={SS} value={form.platform} onChange={e => set('platform', e.target.value)}>
                  {PLATFORMS.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </Field>
              <Field label="Language">
                <select style={SS} value={form.language} onChange={e => set('language', e.target.value)}>
                  {LANGUAGES.map(l => <option key={l} value={l}>{l}</option>)}
                </select>
              </Field>
            </div>

            <Field label="Channel Size">
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {CHANNEL_SIZES.map(s => (
                  <button key={s.value} onClick={() => set('channel_size', s.value)} style={{ padding: '7px 12px', border: `1.5px solid ${form.channel_size === s.value ? '#0A0A0A' : '#E8E8E8'}`, borderRadius: 8, fontSize: 12, fontWeight: form.channel_size === s.value ? 700 : 500, background: form.channel_size === s.value ? '#0A0A0A' : '#FFFFFF', color: form.channel_size === s.value ? '#FFFFFF' : '#5C5C5C', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", transition: 'all 0.15s' }}>
                    {s.label}
                  </button>
                ))}
              </div>
            </Field>
          </div>
        )}

        {/* ── DNA Tab ── */}
        {tab === 'dna' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <Field label="Creator Mode">
              <div style={{ display: 'flex', gap: 8 }}>
                {CREATOR_MODES.map(m => (
                  <button key={m.value} onClick={() => set('creator_mode', m.value)} style={{ flex: 1, padding: '10px 8px', border: `1.5px solid ${form.creator_mode === m.value ? '#0A0A0A' : '#E8E8E8'}`, borderRadius: 9, background: form.creator_mode === m.value ? '#F8F8F8' : '#FFFFFF', cursor: 'pointer', textAlign: 'center', transition: 'all 0.15s' }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: form.creator_mode === m.value ? '#0A0A0A' : '#5C5C5C', fontFamily: "'DM Sans', sans-serif" }}>{m.label}</div>
                    <div style={{ fontSize: 10, color: '#8C8C8C' }}>{m.desc}</div>
                  </button>
                ))}
              </div>
            </Field>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <Field label="Creator Type">
                <select style={SS} value={form.creator_type} onChange={e => set('creator_type', e.target.value)}>
                  {CREATOR_TYPES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                </select>
              </Field>
              <Field label="Tone">
                <select style={SS} value={form.tone} onChange={e => set('tone', e.target.value)}>
                  {TONES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </Field>
            </div>

            <Field label="Brand Voice" hint="How does this channel speak? The AI will match this in every script.">
              <textarea style={{ ...IS, resize: 'vertical' }} rows={3} placeholder="e.g. Conversational and direct — like a knowledgeable friend. Uses relatable analogies, occasional humour. Never corporate." value={form.brand_voice} onChange={e => set('brand_voice', e.target.value)} />
            </Field>

            <Field label="Target Audience" hint="Be specific — age, interests, goals, pain points.">
              <textarea style={{ ...IS, resize: 'vertical' }} rows={3} placeholder="e.g. Indian professionals aged 25–35, earning ₹8–20L/year, interested in investing but overwhelmed by jargon." value={form.target_audience} onChange={e => set('target_audience', e.target.value)} />
            </Field>

            <Field label="Content Pillars" hint="Up to 5 core topics this channel covers.">
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 8 }}>
                {form.content_pillars.map((p, i) => (
                  <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 10px', background: '#F5F5F5', border: '1px solid #E8E8E8', borderRadius: 6, fontSize: 12 }}>
                    {p}
                    <button onClick={() => set('content_pillars', form.content_pillars.filter((_, idx) => idx !== i))} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#8C8C8C', fontSize: 11, padding: 0 }}>✕</button>
                  </span>
                ))}
              </div>
              {form.content_pillars.length < 5 && (
                <div style={{ display: 'flex', gap: 7 }}>
                  <input style={{ ...IS, flex: 1 }} placeholder="e.g. Index Fund Basics" value={pillarInput} onChange={e => setPillarInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addPillar())} />
                  <button onClick={addPillar} style={{ padding: '10px 14px', border: 'none', borderRadius: 8, background: '#0A0A0A', color: '#FFFFFF', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>+</button>
                </div>
              )}
            </Field>
          </div>
        )}

        {/* ── Links Tab ── */}
        {tab === 'links' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <p style={{ fontSize: 12, color: '#8C8C8C', lineHeight: 1.6, margin: 0, fontFamily: "'DM Sans', sans-serif" }}>Add this channel's social profiles. These are used to personalise CTAs in generated scripts.</p>
            {[
              { key: 'youtube',   label: 'YouTube',  placeholder: 'youtube.com/c/yourchannel' },
              { key: 'instagram', label: 'Instagram', placeholder: 'instagram.com/yourhandle'  },
              { key: 'tiktok',    label: 'TikTok',    placeholder: 'tiktok.com/@yourhandle'    },
              { key: 'twitter',   label: 'X/Twitter', placeholder: 'x.com/yourhandle'          },
              { key: 'website',   label: 'Website',   placeholder: 'yourwebsite.com'            },
            ].map(sp => (
              <div key={sp.key} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: '#5C5C5C', minWidth: 70, fontFamily: "'JetBrains Mono', monospace", textTransform: 'uppercase', letterSpacing: '0.05em' }}>{sp.label}</span>
                <input style={{ ...IS, flex: 1 }} placeholder={sp.placeholder} value={(form.social_links || {})[sp.key] || ''} onChange={e => set('social_links', { ...(form.social_links || {}), [sp.key]: e.target.value })} />
              </div>
            ))}

            <div style={{ marginTop: 8, padding: '12px 14px', background: '#F8F8F8', border: '1px solid #E8E8E8', borderRadius: 8 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 9, cursor: 'pointer' }}>
                <input type="checkbox" checked={form.is_default} onChange={e => set('is_default', e.target.checked)} style={{ width: 15, height: 15 }} />
                <span style={{ fontSize: 13, fontWeight: 600, color: '#0A0A0A', fontFamily: "'DM Sans', sans-serif" }}>Set as default channel</span>
              </label>
              <p style={{ fontSize: 11, color: '#8C8C8C', margin: '4px 0 0 24px', fontFamily: "'DM Sans', sans-serif" }}>This channel will be automatically selected when you generate content.</p>
            </div>
          </div>
        )}
      </div>

      {/* Form footer */}
      <div style={{ padding: '16px 24px', borderTop: '1px solid #E8E8E8', display: 'flex', gap: 10, flexShrink: 0, background: '#FAFAFA' }}>
        <button onClick={onCancel} style={{ padding: '11px 18px', border: '1px solid #E8E8E8', borderRadius: 9, background: '#FFFFFF', fontSize: 13, fontWeight: 600, color: '#5C5C5C', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}>Cancel</button>
        <button onClick={() => onSave(form)} disabled={saving || !form.name?.trim()} style={{ flex: 1, padding: '11px', border: 'none', borderRadius: 9, background: saving ? '#E8E8E8' : '#0A0A0A', color: saving ? '#8C8C8C' : '#FFFFFF', fontSize: 13, fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer', fontFamily: "'DM Sans', sans-serif", display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
          {saving ? <><span style={{ width: 13, height: 13, borderRadius: '50%', border: '2px solid rgba(0,0,0,0.2)', borderTopColor: '#0A0A0A', display: 'inline-block', animation: 'spin 0.7s linear infinite' }} />Saving…</> : 'Save Channel'}
        </button>
      </div>
    </div>
  );
}

// Shared styles
const LS = { display: 'block', fontSize: 11, fontWeight: 700, color: '#0A0A0A', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6, fontFamily: "'JetBrains Mono', monospace" };
const IS = { width: '100%', padding: '10px 13px', border: '1.5px solid #E8E8E8', borderRadius: 8, fontSize: 13, color: '#0A0A0A', fontFamily: "'DM Sans', sans-serif", outline: 'none', transition: 'border-color 0.15s', background: '#FFFFFF', boxSizing: 'border-box' };
const SS = { ...IS, appearance: 'none', cursor: 'pointer', backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6' viewBox='0 0 10 6'%3E%3Cpath d='M1 1l4 4 4-4' stroke='%238C8C8C' strokeWidth='1.5' fill='none'/%3E%3C/svg%3E\")", backgroundRepeat: 'no-repeat', backgroundPosition: 'right 10px center', paddingRight: 30 };

function Field({ label, hint, children }) {
  return (
    <div>
      <label style={LS}>{label}</label>
      {hint && <p style={{ fontSize: 11, color: '#8C8C8C', marginBottom: 6, fontFamily: "'DM Sans', sans-serif" }}>{hint}</p>}
      {children}
    </div>
  );
}

// ── MAIN PAGE ─────────────────────────────────────────────────────────────────
export default function ChannelsPage() {
  const router   = useRouter();
  const supabase = getSupabaseBrowser();

  const [user,            setUser]            = useState(null);
  const [plan,            setPlan]            = useState(null);
  const [channels,        setChannels]        = useState([]);
  const [activeChannelId, setActiveChannelId] = useState(null);
  const [canCreate,       setCanCreate]       = useState(false);
  const [loading,         setLoading]         = useState(true);
  const [saving,          setSaving]          = useState(false);
  const [error,           setError]           = useState('');
  const [toast,           setToast]           = useState(null);
  const [panelMode,       setPanelMode]       = useState(null); // 'create' | 'edit' | null
  const [editTarget,      setEditTarget]      = useState(null);

  function showToast(msg, type = 'success') {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  }

  async function loadData(session) {
    const res  = await fetch('/api/channels', { headers: { Authorization: `Bearer ${session.access_token}` } });
    const json = await res.json();
    if (json.success) {
      setChannels(json.channels || []);
      setActiveChannelId(json.active_channel_id);
      setCanCreate(json.can_create);
    }
  }

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) { router.replace('/login'); return; }
      setUser(session.user);

      const usageRes  = await fetch('/api/usage', { headers: { Authorization: `Bearer ${session.access_token}` } });
      const usageJson = await usageRes.json();
      const p = usageJson.usage?.plan || 'free';
      setPlan(p);

      if (p === 'studio') await loadData(session);
      setLoading(false);
    });
  }, []);

  async function handleActivate(channelId) {
    const { data: { session } } = await supabase.auth.getSession();
    const res = await fetch(`/api/channels/${channelId}/activate`, {
      method: 'POST', headers: { Authorization: `Bearer ${session.access_token}` },
    });
    const json = await res.json();
    if (json.success) {
      setActiveChannelId(channelId);
      showToast(`Switched to "${json.channel_name}"`);
    }
  }

  async function handleSave(formData) {
    setSaving(true);
    setError('');
    const { data: { session } } = await supabase.auth.getSession();

    try {
      const isEdit = panelMode === 'edit' && editTarget;
      const url = isEdit ? `/api/channels/${editTarget.id}` : '/api/channels';
      const method = isEdit ? 'PATCH' : 'POST';

      const res  = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify(formData),
      });
      const json = await res.json();

      if (!res.ok || !json.success) throw new Error(json.error || 'Failed to save channel');

      await loadData(session);
      setPanelMode(null);
      setEditTarget(null);
      showToast(isEdit ? 'Channel updated' : 'Channel created');
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(channelId) {
    const { data: { session } } = await supabase.auth.getSession();
    const res  = await fetch(`/api/channels/${channelId}`, {
      method: 'DELETE', headers: { Authorization: `Bearer ${session.access_token}` },
    });
    const json = await res.json();
    if (json.success) {
      await loadData(session);
      showToast('Channel deleted');
    } else {
      showToast(json.error || 'Delete failed', 'error');
    }
  }

  function openEdit(channel) { setEditTarget(channel); setPanelMode('edit'); }
  function openCreate()      { setEditTarget(null);    setPanelMode('create'); }

  // ── Guards ──────────────────────────────────────────────────────────────────
  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: 24, height: 24, borderRadius: '50%', border: '2px solid #E8E8E8', borderTopColor: '#0A0A0A', animation: 'spin 0.7s linear infinite' }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  if (plan !== 'studio') return <PlanGate plan={plan} router={router} />;

  const activeChannel = channels.find(c => c.id === activeChannelId);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;800&family=DM+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        @keyframes spin   { to { transform: rotate(360deg); } }
        @keyframes fadeUp { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }
        @keyframes slideIn{ from { opacity:0; transform:translateX(24px); } to { opacity:1; transform:translateX(0); } }
        @keyframes notif  { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } }
        @keyframes pulse-dot { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.5;transform:scale(.7)} }
        body { background: #FFFFFF; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-thumb { background: #D0D0D0; border-radius: 4px; }
        input:focus, textarea:focus, select:focus { border-color: #0A0A0A !important; box-shadow: 0 0 0 3px rgba(10,10,10,0.05) !important; outline: none; }
      `}</style>

      {/* Toast */}
      {toast && (
        <div style={{ position: 'fixed', bottom: 28, left: '50%', transform: 'translateX(-50%)', padding: '10px 20px', background: toast.type === 'error' ? '#FEF2F2' : '#0A0A0A', border: toast.type === 'error' ? '1px solid #FCA5A5' : 'none', borderRadius: 8, color: toast.type === 'error' ? '#DC2626' : '#FFFFFF', fontSize: 13, fontWeight: 600, fontFamily: "'DM Sans', sans-serif", zIndex: 1000, animation: 'notif 0.3s ease both', boxShadow: '0 4px 16px rgba(0,0,0,0.15)', whiteSpace: 'nowrap' }}>
          {toast.msg}
        </div>
      )}

      <div style={{ minHeight: '100vh', background: '#FFFFFF', fontFamily: "'DM Sans', sans-serif", color: '#0A0A0A', display: 'flex', flexDirection: 'column' }}>

        {/* Topbar */}
        <header style={{ height: 56, borderBottom: '1px solid #E8E8E8', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 28px', position: 'sticky', top: 0, background: 'rgba(255,255,255,0.97)', backdropFilter: 'blur(12px)', zIndex: 100, flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 28, height: 28, background: '#0A0A0A', borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }} onClick={() => router.push('/dashboard')}>
              <svg width="13" height="13" viewBox="0 0 20 20" fill="none">
                <polygon points="10,2 17,6 17,14 10,18 3,14 3,6" stroke="#FFFFFF" strokeWidth="1.5" fill="none"/>
                <polygon points="10,6 14,8.5 14,13.5 10,16 6,13.5 6,8.5" fill="#FFFFFF" fillOpacity="0.3"/>
              </svg>
            </div>
            <span style={{ fontFamily: "'Playfair Display', serif", fontSize: 15, fontWeight: 700, color: '#0A0A0A', cursor: 'pointer' }} onClick={() => router.push('/dashboard')}>Studio AI</span>
            <span style={{ color: '#E8E8E8', fontSize: 16 }}>/</span>
            <span style={{ fontSize: 13, color: '#8C8C8C', fontWeight: 500 }}>Channels</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {/* Studio badge */}
            <span style={{ padding: '3px 10px', background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: 100, fontSize: 10, fontWeight: 700, color: '#2563EB', fontFamily: "'JetBrains Mono', monospace", textTransform: 'uppercase', letterSpacing: '0.06em' }}>🏢 Studio</span>
            <button onClick={() => router.push('/generate')} style={{ background: '#0A0A0A', border: 'none', borderRadius: 7, padding: '7px 16px', color: '#FFFFFF', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}>
              Generate →
            </button>
          </div>
        </header>

        {/* Body: left = channel list, right = form panel */}
        <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>

          {/* ── Channel list ── */}
          <main style={{ flex: 1, overflowY: 'auto', padding: '36px 32px 80px' }}>
            <div style={{ maxWidth: 900, margin: '0 auto' }}>

              {/* Page header */}
              <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 20, marginBottom: 36, flexWrap: 'wrap' }}>
                <div>
                  <p style={{ fontSize: 10, fontWeight: 700, color: '#8C8C8C', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8, fontFamily: "'JetBrains Mono', monospace" }}>Multi-Channel Management</p>
                  <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 30, fontWeight: 800, color: '#0A0A0A', letterSpacing: '-0.04em', lineHeight: 1.1, marginBottom: 4 }}>Your Channels</h1>
                  <p style={{ fontSize: 13, color: '#8C8C8C' }}>Each channel has its own Creator DNA, voice, and settings.</p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 28, fontWeight: 800, color: '#0A0A0A', letterSpacing: '-0.04em', lineHeight: 1 }}>{channels.length} <span style={{ fontSize: 14, fontWeight: 500, color: '#BCBCBC', letterSpacing: 0 }}>/ 5</span></div>
                    <div style={{ fontSize: 10, color: '#BCBCBC', fontFamily: "'JetBrains Mono', monospace", textTransform: 'uppercase', letterSpacing: '0.08em' }}>channels</div>
                  </div>
                  {canCreate && (
                    <button onClick={openCreate} style={{ background: '#0A0A0A', border: 'none', borderRadius: 10, padding: '12px 20px', color: '#FFFFFF', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", display: 'flex', alignItems: 'center', gap: 7, whiteSpace: 'nowrap' }}>
                      <span>+</span> New Channel
                    </button>
                  )}
                </div>
              </div>

              {/* Active channel banner */}
              {activeChannel && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 18px', background: `${activeChannel.avatar_color}08`, border: `1.5px solid ${activeChannel.avatar_color}30`, borderRadius: 12, marginBottom: 28, animation: 'fadeUp 0.3s ease both' }}>
                  <ChannelAvatar emoji={activeChannel.avatar_emoji} color={activeChannel.avatar_color} size={40} active />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: activeChannel.avatar_color, fontFamily: "'JetBrains Mono', monospace", textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 2 }}>Currently active</div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: '#0A0A0A' }}>{activeChannel.name}</div>
                    {activeChannel.niche && <div style={{ fontSize: 12, color: '#5C5C5C' }}>{activeChannel.niche} · {activeChannel.platform}</div>}
                  </div>
                  <button onClick={() => router.push('/generate')} style={{ padding: '9px 16px', background: activeChannel.avatar_color, border: 'none', borderRadius: 8, fontSize: 12, fontWeight: 700, color: '#FFFFFF', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", whiteSpace: 'nowrap' }}>
                    Generate now →
                  </button>
                </div>
              )}

              {/* Error */}
              {error && (
                <div style={{ background: '#FEF2F2', border: '1px solid #FCA5A5', borderRadius: 8, padding: '10px 14px', color: '#DC2626', fontSize: 13, marginBottom: 20 }}>
                  ⚠ {error}
                </div>
              )}

              {/* Grid */}
              {channels.length === 0 ? (
                <div style={{ border: '1.5px dashed #E8E8E8', borderRadius: 14, padding: '60px 24px', textAlign: 'center', animation: 'fadeUp 0.3s ease both' }}>
                  <div style={{ fontSize: 40, marginBottom: 16, opacity: 0.3 }}>📺</div>
                  <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: 20, fontWeight: 700, color: '#0A0A0A', marginBottom: 8 }}>No channels yet</h3>
                  <p style={{ fontSize: 13, color: '#8C8C8C', marginBottom: 24, maxWidth: 360, margin: '0 auto 24px' }}>Create your first channel to start managing multiple creator identities from one account.</p>
                  <button onClick={openCreate} style={{ background: '#0A0A0A', border: 'none', borderRadius: 10, padding: '12px 24px', color: '#FFFFFF', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}>
                    Create First Channel →
                  </button>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16, animation: 'fadeUp 0.3s ease both' }}>
                  {channels.map(ch => (
                    <ChannelCard
                      key={ch.id}
                      channel={ch}
                      isActive={ch.id === activeChannelId}
                      onActivate={handleActivate}
                      onEdit={openEdit}
                      onDelete={handleDelete}
                    />
                  ))}

                  {/* Create slot */}
                  {canCreate && (
                    <button onClick={openCreate} style={{ border: '1.5px dashed #E8E8E8', borderRadius: 14, padding: '24px', background: '#FAFAFA', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10, minHeight: 200, transition: 'all 0.2s' }}
                      onMouseEnter={e => { e.currentTarget.style.borderColor = '#0A0A0A'; e.currentTarget.style.background = '#F5F5F5'; }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor = '#E8E8E8'; e.currentTarget.style.background = '#FAFAFA'; }}>
                      <div style={{ width: 44, height: 44, borderRadius: 11, background: '#F0F0F0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>+</div>
                      <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 600, color: '#5C5C5C' }}>Add Channel</div>
                      <div style={{ fontSize: 11, color: '#BCBCBC', fontFamily: "'JetBrains Mono', monospace" }}>{5 - channels.length} slot{5 - channels.length !== 1 ? 's' : ''} remaining</div>
                    </button>
                  )}
                </div>
              )}

              {/* Info box */}
              {channels.length > 0 && (
                <div style={{ marginTop: 32, padding: '16px 20px', background: '#F8F8F8', border: '1px solid #E8E8E8', borderRadius: 10, display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                  <span style={{ fontSize: 16, flexShrink: 0 }}>💡</span>
                  <div>
                    <p style={{ fontSize: 13, fontWeight: 600, color: '#0A0A0A', marginBottom: 3 }}>How channels work</p>
                    <p style={{ fontSize: 12, color: '#5C5C5C', lineHeight: 1.6, margin: 0 }}>
                      Switch to a channel before generating — the AI uses that channel's Creator DNA (niche, voice, audience) to personalise every output. Each channel tracks its own generation history and stats.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </main>

          {/* ── Side panel: Create / Edit ── */}
          {panelMode !== null && (
            <aside style={{ width: 440, flexShrink: 0, borderLeft: '1px solid #E8E8E8', background: '#FFFFFF', height: 'calc(100vh - 56px)', position: 'sticky', top: 56, display: 'flex', flexDirection: 'column', animation: 'slideIn 0.25s ease both', overflow: 'hidden' }}>
              <ChannelForm
                key={panelMode + (editTarget?.id || 'new')}
                initial={panelMode === 'edit' ? editTarget : BLANK_CHANNEL}
                title={panelMode === 'edit' ? `Edit: ${editTarget?.name}` : 'New Channel'}
                onSave={handleSave}
                onCancel={() => { setPanelMode(null); setEditTarget(null); setError(''); }}
                saving={saving}
              />
            </aside>
          )}
        </div>
      </div>
    </>
  );
}