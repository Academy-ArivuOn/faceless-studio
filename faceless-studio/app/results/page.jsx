'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import React from 'react';
import { getSupabaseBrowser } from '@/packages/supabase-browser';

// ── Error Boundary ────────────────────────────────────────────────────────────
class TabErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = { hasError: false }; }
  static getDerivedStateFromError() { return { hasError: true }; }
  componentDidCatch(err) { console.error('[ResultTab]', err); }
  render() {
    if (this.state.hasError) return (
      <div style={{ padding: '32px 24px', textAlign: 'center', background: '#FEF2F2', borderRadius: 12, border: '1px solid #FCA5A5', margin: '24px 0' }}>
        <p style={{ fontSize: 14, fontWeight: 600, color: '#0A0A0A', marginBottom: 8 }}>Display error in this tab</p>
        <button onClick={() => this.setState({ hasError: false })}
          style={{ background: '#0A0A0A', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 18px', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
          Try again
        </button>
      </div>
    );
    return this.props.children;
  }
}

// ── Copy button ───────────────────────────────────────────────────────────────
function CopyBtn({ text, label = 'Copy' }) {
  const [done, setDone] = useState(false);
  return (
    <button onClick={() => navigator.clipboard.writeText(text || '').then(() => { setDone(true); setTimeout(() => setDone(false), 2000); })}
      style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: done ? '#F0FDF4' : '#F8F8F8', border: `1px solid ${done ? '#86EFAC' : '#E8E8E8'}`, borderRadius: 6, padding: '4px 11px', fontSize: 11, fontWeight: 600, color: done ? '#15803D' : '#5C5C5C', cursor: 'pointer', fontFamily: "'JetBrains Mono',monospace", transition: 'all 0.18s', whiteSpace: 'nowrap', flexShrink: 0 }}>
      {done ? '✓ Copied' : label}
    </button>
  );
}

function Label({ children, color = '#8C8C8C' }) {
  return <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color, fontFamily: "'JetBrains Mono',monospace" }}>{children}</span>;
}

function Prose({ children, style = {} }) {
  return (
    <div style={{ background: '#F8F8F8', border: '1px solid #E8E8E8', borderRadius: 10, padding: '16px 18px', fontSize: 14, color: '#1A1A1A', lineHeight: 1.8, fontFamily: "'DM Sans',sans-serif", whiteSpace: 'pre-wrap', wordBreak: 'break-word', ...style }}>
      {children}
    </div>
  );
}

function Card({ children, highlight = false, style = {} }) {
  return (
    <div style={{ background: highlight ? '#FAFAF7' : '#FFFFFF', border: `1px solid ${highlight ? '#D4A847' : '#E8E8E8'}`, borderRadius: 10, padding: '16px 18px', ...style }}>
      {children}
    </div>
  );
}

function Chip({ label, color = '#0A0A0A', bg = '#F0F0F0', border = '#E8E8E8' }) {
  return (
    <span style={{ display: 'inline-block', padding: '3px 10px', borderRadius: 5, fontSize: 11, fontWeight: 600, fontFamily: "'JetBrains Mono',monospace", background: bg, border: `1px solid ${border}`, color, whiteSpace: 'nowrap', margin: '2px' }}>
      {label}
    </span>
  );
}

function KV({ k, v }) {
  if (!v) return null;
  return (
    <div style={{ display: 'flex', gap: 12, padding: '8px 0', borderBottom: '1px solid #F5F5F5', alignItems: 'flex-start' }}>
      <span style={{ fontSize: 10, color: '#BCBCBC', minWidth: 120, flexShrink: 0, paddingTop: 2, textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 700, fontFamily: "'JetBrains Mono',monospace" }}>{k}</span>
      <span style={{ fontSize: 13, color: '#1A1A1A', lineHeight: 1.6, fontFamily: "'DM Sans',sans-serif" }}>{v}</span>
    </div>
  );
}

// ── EDIT PANEL COMPONENT ──────────────────────────────────────────────────────
const QUICK_PROMPTS = {
  hook: [
    { label: 'More punchy', prompt: 'Make it shorter and punchier, maximum 15 words' },
    { label: 'More curiosity', prompt: 'Add more curiosity gap — tease without fully revealing the answer' },
    { label: 'Add a number', prompt: 'Add a specific number or statistic to make it more credible' },
    { label: 'Loss aversion', prompt: 'Rewrite using loss aversion psychology — focus on what they might lose' },
    { label: 'More conversational', prompt: 'Make it sound more conversational, like a friend talking' },
    { label: 'FOMO angle', prompt: 'Use FOMO — something is happening and they might miss it' },
  ],
  youtube_titles: [
    { label: 'Shorter', prompt: 'Make all titles under 60 characters while keeping the same emotional punch' },
    { label: 'Add number', prompt: 'Add a specific number to the best title for higher CTR' },
    { label: 'More urgent', prompt: 'Add urgency — a deadline or time-sensitive angle' },
    { label: 'More curiosity', prompt: 'Lead with a curiosity gap — tease the answer without giving it away' },
    { label: 'For Shorts', prompt: 'Rewrite for YouTube Shorts audience — punchy, 8 words max' },
    { label: 'Different angle', prompt: 'Completely different approach — avoid the current framing entirely' },
  ],
  youtube_description: [
    { label: 'Shorter', prompt: 'Make it shorter, around 150 words, punchy and to the point' },
    { label: 'Add timestamps', prompt: 'Add placeholder timestamps every 60-90 seconds' },
    { label: 'More SEO', prompt: 'Improve SEO — work the primary keyword in naturally 3-4 times' },
    { label: 'Add CTA', prompt: 'Strengthen the subscribe CTA and add a lead-generation hook' },
    { label: 'Conversational', prompt: 'Make the tone more conversational and less formal' },
    { label: 'Hindi blend', prompt: 'Add a few Hindi words naturally for Indian audience relatability' },
  ],
  youtube_tags: [
    { label: 'More specific', prompt: 'Replace generic tags with more niche-specific long-tail keywords' },
    { label: 'Trending terms', prompt: 'Include trending search terms related to this topic in 2025' },
    { label: 'India focus', prompt: 'Add India-specific search terms and regional tags' },
    { label: 'Remove weak ones', prompt: 'Remove overly broad tags and replace with targeted ones' },
  ],
  full_script: [
    { label: 'Shorter intro', prompt: 'Cut the intro by 30% — get to the point faster in the first 30 seconds' },
    { label: 'More examples', prompt: 'Add 2 more real-world examples with specific numbers' },
    { label: 'Stronger hook', prompt: 'Rewrite the opening 3 sentences to be more dramatic and attention-grabbing' },
    { label: 'Shorter overall', prompt: 'Trim the script by 20% without losing key information' },
    { label: 'More conversational', prompt: 'Make the language more conversational — shorter sentences, more "you" statements' },
    { label: 'Add pattern interrupt', prompt: 'Add a strong pattern interrupt at the 90-second mark to re-capture attention' },
  ],
  scenes: [
    { label: 'Better B-roll', prompt: 'Improve the B-roll search terms to be more specific and cinematic' },
    { label: 'More scenes', prompt: 'Break the main content sections into more scenes for better pacing' },
    { label: 'Tighter timing', prompt: 'Adjust timestamps for better pacing — no scene should exceed 2 minutes' },
    { label: 'On-camera notes', prompt: 'Add specific body language and energy direction for on-camera scenes' },
  ],
  instagram: [
    { label: 'Shorter caption', prompt: 'Trim caption to under 150 words — punchy and scroll-stopping' },
    { label: 'More hashtags', prompt: 'Add 10 more niche-specific hashtags for better reach' },
    { label: 'Add hook line', prompt: 'Add a stronger opening line that stops the scroll before "more"' },
    { label: 'Save CTA stronger', prompt: 'Make the "save this" CTA much more compelling with a clear reason to save' },
  ],
  tiktok: [
    { label: 'Punchy caption', prompt: 'Make the caption under 100 characters — TikTok punchy' },
    { label: 'Better hashtags', prompt: 'Replace with trending TikTok hashtags for this niche in 2025' },
    { label: 'First frame text', prompt: 'Rewrite the first frame text to be more scroll-stopping' },
  ],
  seven_day_plan: [
    { label: 'More variety', prompt: 'Add more content format variety — mix shorts, carousels, and long-form' },
    { label: 'Better spacing', prompt: 'Rearrange for better posting cadence — peak engagement days first' },
    { label: 'India timing', prompt: 'Adjust posting days/times for Indian audience peak hours' },
  ],
  shorts_script: [
    { label: 'Faster pace', prompt: 'Speed up the pacing — cut any sentence that is not essential' },
    { label: 'Stronger hook', prompt: 'Rewrite the opening 2 seconds to be more attention-grabbing' },
    { label: 'Add text overlay', prompt: 'Add specific text overlay suggestions at key moments' },
  ],
};

const SECTION_AGENT_MAP = {
  hook: 'research',
  hook_options: 'research',
  youtube_titles: 'publisher',
  youtube_description: 'publisher',
  youtube_tags: 'publisher',
  instagram: 'publisher',
  tiktok: 'publisher',
  seven_day_plan: 'publisher',
  full_script: 'creator',
  scenes: 'creator',
  shorts_script: 'creator',
  cta_options: 'creator',
};

const SCOPE_OPTIONS = [
  { id: 'section', label: 'This section only', desc: 'Regenerate just the selected section' },
  { id: 'related', label: 'Section + related', desc: 'Also refresh closely linked sections' },
  { id: 'full', label: 'Full result', desc: 'Regenerate everything with this change' },
];

function EditPanel({ activeSection, sectionMeta, onRegenerate, isRegenerating, onClose }) {
  const [instruction, setInstruction] = useState('');
  const [scope, setScope] = useState('section');
  const textareaRef = useRef(null);
  const quickPrompts = QUICK_PROMPTS[activeSection] || [];

  useEffect(() => {
    setInstruction('');
    if (textareaRef.current) textareaRef.current.focus();
  }, [activeSection]);

  function handleQuickPrompt(prompt) {
    setInstruction(prompt);
    if (textareaRef.current) textareaRef.current.focus();
  }

  function handleRegenerate() {
    onRegenerate({ section: activeSection, instruction: instruction.trim(), scope });
  }

  const placeholders = {
    hook: 'e.g. Make it more dramatic. Use FOMO. Keep it under 15 words.',
    youtube_titles: 'e.g. Make titles more urgent, add a deadline angle, keep under 70 chars.',
    youtube_description: 'e.g. Add timestamps, make it shorter, stronger SEO for Indian audience.',
    youtube_tags: 'e.g. More long-tail keywords, India-specific terms, remove generic tags.',
    full_script: 'e.g. Shorten the intro, add more examples with specific numbers.',
    scenes: 'e.g. Better B-roll suggestions, tighter timing, more on-camera direction.',
    instagram: 'e.g. Shorter caption, add a hook line, more niche hashtags.',
    tiktok: 'e.g. Punchier caption, trending hashtags 2025, better first frame text.',
    seven_day_plan: 'e.g. Add more variety, adjust for Indian peak posting times.',
    shorts_script: 'e.g. Faster pacing, stronger opening hook, add text overlay notes.',
  };

  return (
    <div style={{ width: 300, flexShrink: 0, borderLeft: '1px solid #E8E8E8', background: '#FAFAFA', display: 'flex', flexDirection: 'column', position: 'sticky', top: 56, height: 'calc(100vh - 56px)', overflowY: 'auto' }}>
      {/* Panel header */}
      <div style={{ padding: '16px 18px', borderBottom: '1px solid #E8E8E8', background: '#FFFFFF', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
          <div>
            <p style={{ fontSize: 13, fontWeight: 700, color: '#0A0A0A', marginBottom: 2, fontFamily: "'DM Sans',sans-serif" }}>
              {sectionMeta?.label || 'Edit section'}
            </p>
            <p style={{ fontSize: 11, color: '#8C8C8C', fontFamily: "'DM Sans',sans-serif" }}>Tell AI how to improve this</p>
          </div>
          <button onClick={onClose} style={{ background: '#F5F5F5', border: 'none', borderRadius: 6, width: 26, height: 26, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: 12, color: '#5C5C5C', flexShrink: 0 }}>✕</button>
        </div>
      </div>

      {/* Panel body */}
      <div style={{ padding: '16px 18px', flex: 1, display: 'flex', flexDirection: 'column', gap: 16, overflowY: 'auto' }}>

        {/* Instruction */}
        <div>
          <p style={{ fontSize: 10, fontWeight: 700, color: '#5C5C5C', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 7, fontFamily: "'JetBrains Mono',monospace" }}>Your instruction</p>
          <textarea
            ref={textareaRef}
            rows={4}
            value={instruction}
            onChange={e => setInstruction(e.target.value)}
            placeholder={placeholders[activeSection] || 'Describe how you want this changed...'}
            style={{ width: '100%', padding: '10px 12px', border: '1.5px solid #E8E8E8', borderRadius: 9, fontSize: 13, color: '#0A0A0A', fontFamily: "'DM Sans',sans-serif", resize: 'vertical', outline: 'none', lineHeight: 1.6, transition: 'border-color 0.2s', background: '#FFFFFF' }}
            onFocus={e => e.target.style.borderColor = '#0A0A0A'}
            onBlur={e => e.target.style.borderColor = '#E8E8E8'}
          />
        </div>

        {/* Quick prompts */}
        {quickPrompts.length > 0 && (
          <div>
            <p style={{ fontSize: 10, fontWeight: 700, color: '#5C5C5C', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 7, fontFamily: "'JetBrains Mono',monospace" }}>Quick prompts</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
              {quickPrompts.map(q => (
                <button key={q.label} onClick={() => handleQuickPrompt(q.prompt)}
                  style={{ padding: '5px 10px', border: '1px solid #E8E8E8', borderRadius: 6, fontSize: 11, background: '#FFFFFF', color: '#5C5C5C', cursor: 'pointer', fontFamily: "'DM Sans',sans-serif", transition: 'all 0.15s' }}
                  onMouseEnter={e => { e.target.style.borderColor = '#0A0A0A'; e.target.style.color = '#0A0A0A'; }}
                  onMouseLeave={e => { e.target.style.borderColor = '#E8E8E8'; e.target.style.color = '#5C5C5C'; }}
                >
                  {q.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Scope */}
        <div>
          <p style={{ fontSize: 10, fontWeight: 700, color: '#5C5C5C', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 7, fontFamily: "'JetBrains Mono',monospace" }}>Apply to</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            {SCOPE_OPTIONS.map(opt => (
              <label key={opt.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 9, padding: '8px 10px', border: `1.5px solid ${scope === opt.id ? '#0A0A0A' : '#E8E8E8'}`, borderRadius: 8, cursor: 'pointer', background: scope === opt.id ? '#F8F8F8' : '#FFFFFF', transition: 'all 0.15s' }}>
                <input type="radio" name="scope" value={opt.id} checked={scope === opt.id} onChange={() => setScope(opt.id)} style={{ marginTop: 3, flexShrink: 0 }} />
                <div>
                  <p style={{ fontSize: 12, fontWeight: 600, color: '#0A0A0A', margin: 0, fontFamily: "'DM Sans',sans-serif" }}>{opt.label}</p>
                  <p style={{ fontSize: 11, color: '#8C8C8C', margin: '2px 0 0', fontFamily: "'DM Sans',sans-serif" }}>{opt.desc}</p>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Regenerate CTA */}
        <button
          onClick={handleRegenerate}
          disabled={isRegenerating}
          style={{ background: isRegenerating ? '#E8E8E8' : '#0A0A0A', border: 'none', borderRadius: 9, padding: '13px', color: isRegenerating ? '#8C8C8C' : '#FFFFFF', fontSize: 13, fontWeight: 700, cursor: isRegenerating ? 'not-allowed' : 'pointer', fontFamily: "'DM Sans',sans-serif", display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, width: '100%', transition: 'all 0.2s' }}
        >
          {isRegenerating ? <><Spinner size={13} /><span>Regenerating…</span></> : '↻ Regenerate section'}
        </button>

        {/* Tip */}
        <div style={{ padding: '10px 12px', background: '#F0FDF4', border: '1px solid #86EFAC', borderRadius: 8 }}>
          <p style={{ fontSize: 11, color: '#15803D', lineHeight: 1.6, fontFamily: "'DM Sans',sans-serif" }}>
            Tip: Leave the instruction blank to regenerate with the same prompt but different output.
          </p>
        </div>
      </div>
    </div>
  );
}

// ── Spinner ───────────────────────────────────────────────────────────────────
function Spinner({ size = 16, dark = false }) {
  return (
    <span style={{ width: size, height: size, borderRadius: '50%', border: `2px solid ${dark ? 'rgba(0,0,0,0.15)' : '#E8E8E8'}`, borderTopColor: dark ? '#0A0A0A' : '#FFFFFF', display: 'inline-block', animation: 'spin 0.7s linear infinite', flexShrink: 0 }} />
  );
}

// ── Editable Section Wrapper ──────────────────────────────────────────────────
function EditableSection({ id, label, editMode, activeSection, onSelect, isRegenerating, children, copyText, noEdit = false }) {
  const isActive = activeSection === id;
  const isLoading = isRegenerating === id;

  return (
    <div style={{ marginBottom: 28, position: 'relative' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Label color={isActive ? '#0A0A0A' : '#8C8C8C'}>{label}</Label>
          {isActive && (
            <span style={{ fontSize: 9, background: '#F0FDF4', border: '1px solid #86EFAC', borderRadius: 4, padding: '1px 7px', color: '#15803D', fontFamily: "'JetBrains Mono',monospace", fontWeight: 700 }}>EDITING</span>
          )}
          {isLoading && (
            <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 10, color: '#8C8C8C', fontFamily: "'JetBrains Mono',monospace' " }}>
              <Spinner size={10} dark /> regenerating…
            </span>
          )}
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          {copyText && <CopyBtn text={copyText} />}
          {editMode && !noEdit && (
            <button onClick={() => onSelect(id)} style={{ padding: '4px 10px', border: `1px solid ${isActive ? '#0A0A0A' : '#E8E8E8'}`, borderRadius: 6, fontSize: 11, background: isActive ? '#0A0A0A' : '#FFFFFF', color: isActive ? '#FFFFFF' : '#5C5C5C', cursor: 'pointer', fontFamily: "'JetBrains Mono',monospace", fontWeight: 600, transition: 'all 0.15s' }}>
              {isActive ? '✓ Selected' : 'Edit'}
            </button>
          )}
        </div>
      </div>
      <div style={{ border: `1.5px solid ${isActive ? '#0A0A0A' : isLoading ? '#FDE68A' : 'transparent'}`, borderRadius: 12, transition: 'border-color 0.2s', padding: isActive || isLoading ? 1 : 0, opacity: isLoading ? 0.6 : 1 }}>
        {children}
      </div>
    </div>
  );
}

// ── InlineTextEdit ─────────────────────────────────────────────────────────────
function InlineTextEdit({ value, onSave, style = {}, multiline = false }) {
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(value);
  const ref = useRef(null);

  useEffect(() => { setText(value); }, [value]);
  useEffect(() => { if (editing && ref.current) ref.current.focus(); }, [editing]);

  function handleSave() {
    setEditing(false);
    if (text !== value) onSave(text);
  }

  if (!editing) {
    return (
      <div onClick={() => setEditing(true)} title="Click to edit" style={{ cursor: 'text', position: 'relative', ...style }}>
        {value}
        <span style={{ position: 'absolute', top: -2, right: -2, fontSize: 9, background: '#F5F5F5', border: '1px solid #E8E8E8', borderRadius: 3, padding: '1px 4px', color: '#8C8C8C', fontFamily: "'JetBrains Mono',monospace", opacity: 0, transition: 'opacity 0.15s', pointerEvents: 'none' }} className="edit-hint">click to edit</span>
      </div>
    );
  }

  const sharedStyle = { width: '100%', padding: '8px 10px', border: '1.5px solid #0A0A0A', borderRadius: 7, fontSize: style.fontSize || 13, fontFamily: "'DM Sans',sans-serif", color: '#0A0A0A', outline: 'none', lineHeight: 1.6, background: '#FAFAFA', boxSizing: 'border-box' };

  return (
    <div>
      {multiline
        ? <textarea ref={ref} value={text} onChange={e => setText(e.target.value)} rows={6} style={{ ...sharedStyle, resize: 'vertical', whiteSpace: 'pre-wrap' }} />
        : <input ref={ref} type="text" value={text} onChange={e => setText(e.target.value)} style={sharedStyle} onKeyDown={e => { if (e.key === 'Enter') handleSave(); if (e.key === 'Escape') setEditing(false); }} />
      }
      <div style={{ display: 'flex', gap: 7, marginTop: 7 }}>
        <button onClick={handleSave} style={{ padding: '5px 14px', border: 'none', borderRadius: 6, background: '#0A0A0A', color: '#FFFFFF', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: "'DM Sans',sans-serif" }}>Save</button>
        <button onClick={() => { setText(value); setEditing(false); }} style={{ padding: '5px 12px', border: '1px solid #E8E8E8', borderRadius: 6, background: '#FFFFFF', color: '#5C5C5C', fontSize: 12, cursor: 'pointer', fontFamily: "'DM Sans',sans-serif" }}>Cancel</button>
      </div>
    </div>
  );
}

// ── Sprint Tracker ─────────────────────────────────────────────────────────────
function SprintTracker({ plan = [] }) {
  const [done, setDone] = useState({});
  const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const TYPE_COLORS = {
    'Main Video': '#D4A847', 'Short': '#2563EB', 'Reel': '#DC2626', 'Vlog': '#D97706',
    'Story': '#7C3AED', 'Community Post': '#0E7C4A', 'Blog': '#D97706', 'Podcast': '#0D9488',
  };
  if (!plan || plan.length === 0) return <div style={{ textAlign: 'center', padding: 40, color: '#BCBCBC', fontSize: 13 }}>No 7-day plan in this result.</div>;
  const completedCount = Object.values(done).filter(Boolean).length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <p style={{ fontSize: 13, fontWeight: 700, color: '#0A0A0A', margin: 0, fontFamily: "'DM Sans',sans-serif" }}>📅 7-Day Content Sprint</p>
        <span style={{ fontSize: 11, color: '#8C8C8C', fontFamily: "'JetBrains Mono',monospace" }}><span style={{ color: '#0E7C4A', fontWeight: 700 }}>{completedCount}</span> / {plan.length} done</span>
      </div>
      <div style={{ height: 4, background: '#F0F0F0', borderRadius: 2, overflow: 'hidden' }}>
        <div style={{ height: '100%', background: '#0A0A0A', borderRadius: 2, width: `${(completedCount / Math.max(plan.length, 1)) * 100}%`, transition: 'width 0.5s' }} />
      </div>
      {plan.map((item, i) => {
        const col = TYPE_COLORS[item.content_type] || '#0A0A0A';
        const isDone = done[item.day];
        return (
          <div key={item.day} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 16px', background: isDone ? '#F0FDF4' : '#FFFFFF', border: `1px solid ${isDone ? '#86EFAC' : '#E8E8E8'}`, borderRadius: 10, cursor: 'pointer', transition: 'all 0.2s' }}
            onClick={() => setDone(prev => ({ ...prev, [item.day]: !prev[item.day] }))}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: isDone ? '#0E7C4A' : '#F8F8F8', border: `1.5px solid ${isDone ? '#0E7C4A' : '#E8E8E8'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 800, color: isDone ? '#FFFFFF' : '#5C5C5C', flexShrink: 0, fontFamily: "'JetBrains Mono',monospace", transition: 'all 0.2s' }}>
              {isDone ? '✓' : DAYS[i] || `D${item.day}`}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 3, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 10, fontWeight: 700, color: col, fontFamily: "'JetBrains Mono',monospace", textTransform: 'uppercase', letterSpacing: '0.04em' }}>{item.content_type}</span>
                <span style={{ fontSize: 10, color: '#BCBCBC', fontFamily: "'JetBrains Mono',monospace" }}>· {item.platform}</span>
              </div>
              <p style={{ fontSize: 13, color: isDone ? '#5C5C5C' : '#0A0A0A', margin: 0, fontFamily: "'DM Sans',sans-serif", textDecoration: isDone ? 'line-through' : 'none', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.topic_angle}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Hook Explainer ─────────────────────────────────────────────────────────────
function HookExplainer({ hookBreakdown = {}, chosenHook, hookTrigger }) {
  const TRIGGER_META = {
    LOSS_AVERSION: { emoji: '⚠️', color: '#D97706', bg: '#FFF7ED', border: '#FDE68A', label: 'Loss Aversion' },
    CURIOSITY_GAP: { emoji: '❓', color: '#2563EB', bg: '#EFF6FF', border: '#BFDBFE', label: 'Curiosity Gap' },
    PATTERN_INTERRUPT: { emoji: '⚡', color: '#7C3AED', bg: '#F5F3FF', border: '#DDD6FE', label: 'Pattern Interrupt' },
    SOCIAL_PROOF: { emoji: '👥', color: '#0E7C4A', bg: '#F0FDF4', border: '#86EFAC', label: 'Social Proof' },
    DIRECT_PROMISE: { emoji: '🎯', color: '#D4A847', bg: '#FFF9EB', border: '#FDE68A', label: 'Direct Promise' },
    AUTHORITY_CHALLENGE: { emoji: '🔥', color: '#DC2626', bg: '#FEF2F2', border: '#FCA5A5', label: 'Authority Challenge' },
    IDENTITY: { emoji: '🪞', color: '#0891B2', bg: '#ECFEFF', border: '#A5F3FC', label: 'Identity Trigger' },
  };
  const t = TRIGGER_META[hookTrigger] || { emoji: '🧠', color: '#0A0A0A', bg: '#F8F8F8', border: '#E8E8E8', label: hookTrigger || 'Psychological Trigger' };
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ background: t.bg, border: `1px solid ${t.border}`, borderRadius: 12, padding: '20px 22px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
          <Label color={t.color}>🪝 Chosen Hook</Label>
          <CopyBtn text={chosenHook || ''} />
        </div>
        <p style={{ fontSize: 16, fontWeight: 600, color: '#0A0A0A', lineHeight: 1.65, fontStyle: 'italic', marginBottom: 14, fontFamily: "'DM Sans',sans-serif" }}>
          "{chosenHook || hookBreakdown?.hook_text}"
        </p>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 12px', borderRadius: 100, fontSize: 11, fontWeight: 700, fontFamily: "'JetBrains Mono',monospace", background: '#FFFFFF', border: `1px solid ${t.border}`, color: t.color }}>
          {t.emoji} {t.label}
        </span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        {hookBreakdown?.psychological_mechanism && (
          <Card style={{ gridColumn: '1 / -1' }}>
            <Label>🧠 Psychological Mechanism</Label>
            <p style={{ fontSize: 13, color: '#1A1A1A', lineHeight: 1.7, marginTop: 8, marginBottom: 0, fontFamily: "'DM Sans',sans-serif" }}>{hookBreakdown.psychological_mechanism}</p>
          </Card>
        )}
        {hookBreakdown?.what_viewer_is_thinking && (
          <Card>
            <Label>💬 Viewer's Thought</Label>
            <p style={{ fontSize: 13, color: '#1A1A1A', lineHeight: 1.65, marginTop: 8, marginBottom: 0, fontFamily: "'DM Sans',sans-serif" }}>{hookBreakdown.what_viewer_is_thinking}</p>
          </Card>
        )}
        {hookBreakdown?.why_first_3_seconds && (
          <Card>
            <Label>⚡ Why First 3 Seconds</Label>
            <p style={{ fontSize: 13, color: '#1A1A1A', lineHeight: 1.65, marginTop: 8, marginBottom: 0, fontFamily: "'DM Sans',sans-serif" }}>{hookBreakdown.why_first_3_seconds}</p>
          </Card>
        )}
      </div>
    </div>
  );
}

const SECTION_META = {
  hook: { label: 'Editing: Hook / Opening' },
  youtube_titles: { label: 'Editing: YouTube Titles' },
  youtube_description: { label: 'Editing: YouTube Description' },
  youtube_tags: { label: 'Editing: SEO Tags' },
  full_script: { label: 'Editing: Full Script' },
  scenes: { label: 'Editing: Scene Breakdown' },
  shorts_script: { label: 'Editing: Shorts / Reels Version' },
  cta_options: { label: 'Editing: CTA Options' },
  instagram: { label: 'Editing: Instagram Assets' },
  tiktok: { label: 'Editing: TikTok Assets' },
  seven_day_plan: { label: 'Editing: 7-Day Plan' },
};

const TABS = [
  { id: 'script', label: 'Script', icon: '📄' },
  { id: 'scenes', label: 'Scenes', icon: '🎬' },
  { id: 'hook', label: 'Hook Psychology', icon: '🪝' },
  { id: 'youtube', label: 'YouTube SEO', icon: '▶️' },
  { id: 'social', label: 'Social', icon: '📱' },
  { id: 'plan', label: '7-Day Plan', icon: '📅' },
];

const BLOG_TYPE_LABELS = {
  travel: '✈️ Travel Blog', advertisement: '📢 Place Ad',
  food: '🍜 Food Blog', culture: '🏛️ Culture',
  event: '🎪 Event', product_review: '⭐ Review', lifestyle: '🌅 Lifestyle',
};

// ── MAIN PAGE ─────────────────────────────────────────────────────────────────
export default function ResultsPage() {
  const router = useRouter();
  const supabase = getSupabaseBrowser();
  const [result, setResult] = useState(null);
  const [activeTab, setActiveTab] = useState('script');
  const [editMode, setEditMode] = useState(false);
  const [activeSection, setActiveSection] = useState(null);
  const [isRegenerating, setIsRegenerating] = useState(null);
  const [regenStatus, setRegenStatus] = useState('');
  const [notification, setNotification] = useState(null);
  const sessionRef = useRef(null);

  useEffect(() => {
    const raw = sessionStorage.getItem('studioai_result');
    if (!raw) { router.replace('/generate'); return; }
    try { setResult(JSON.parse(raw)); }
    catch { router.replace('/generate'); }
  }, []);

  // Load supabase session for auth header
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      sessionRef.current = session;
    });
  }, []);

  function showNotification(msg, type = 'success') {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 3000);
  }

  function handleSelectSection(sectionId) {
    if (activeSection === sectionId) {
      setActiveSection(null);
    } else {
      setActiveSection(sectionId);
    }
  }

  function handleClosePanel() {
    setActiveSection(null);
  }

  // Inline text save — updates result state directly
  function handleInlineEdit(path, value) {
    setResult(prev => {
      const next = JSON.parse(JSON.stringify(prev));
      const parts = path.split('.');
      let obj = next;
      for (let i = 0; i < parts.length - 1; i++) obj = obj[parts[i]];
      obj[parts[parts.length - 1]] = value;
      sessionStorage.setItem('studioai_result', JSON.stringify(next));
      return next;
    });
    showNotification('Saved');
  }

  // Regenerate via API
  async function handleRegenerate({ section, instruction, scope }) {
    if (!sessionRef.current) {
      showNotification('Please log in to regenerate sections', 'error');
      return;
    }
    setIsRegenerating(section);
    setRegenStatus('Calling AI...');

    try {
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || '';
      const res = await fetch(`${baseUrl}/api/regenerate-section`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionRef.current.access_token}`,
        },
        body: JSON.stringify({
          section,
          instruction,
          scope,
          currentResult: result,
          input: result?.input || {},
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || 'Regeneration failed');

      // Merge the new data back into result
      setResult(prev => {
        const next = JSON.parse(JSON.stringify(prev));
        const { agentName, data } = json;

        if (agentName === 'research') {
          next.research = { ...next.research, ...data };
        } else if (agentName === 'creator') {
          // Merge specific sections so we don't overwrite everything
          if (section === 'full_script') {
            next.creator.full_script = data.full_script || next.creator.full_script;
            next.creator.word_count = data.word_count || next.creator.word_count;
            next.creator.estimated_duration = data.estimated_duration || next.creator.estimated_duration;
          } else if (section === 'scenes') {
            next.creator.scenes = data.scenes || next.creator.scenes;
          } else if (section === 'shorts_script') {
            next.creator.shorts_script = data.shorts_script || next.creator.shorts_script;
          } else if (section === 'cta_options') {
            next.creator.cta_options = data.cta_options || next.creator.cta_options;
          } else {
            next.creator = { ...next.creator, ...data };
          }
        } else if (agentName === 'publisher') {
          if (section === 'youtube_titles') {
            next.publisher.youtube = { ...next.publisher.youtube, title_options: data.youtube?.title_options || next.publisher.youtube?.title_options, recommended_title: data.youtube?.recommended_title || next.publisher.youtube?.recommended_title };
          } else if (section === 'youtube_description') {
            if (next.publisher.youtube) next.publisher.youtube.description = data.youtube?.description || next.publisher.youtube?.description;
          } else if (section === 'youtube_tags') {
            if (next.publisher.youtube) next.publisher.youtube.tags = data.youtube?.tags || next.publisher.youtube?.tags;
          } else if (section === 'instagram') {
            next.publisher.instagram = data.instagram || next.publisher.instagram;
          } else if (section === 'tiktok') {
            next.publisher.tiktok = data.tiktok || next.publisher.tiktok;
          } else if (section === 'seven_day_plan') {
            next.publisher.seven_day_content_plan = data.seven_day_content_plan || next.publisher.seven_day_content_plan;
          } else {
            next.publisher = { ...next.publisher, ...data };
          }
        }

        sessionStorage.setItem('studioai_result', JSON.stringify(next));
        return next;
      });

      showNotification('Section updated successfully');
      setActiveSection(null);
    } catch (err) {
      showNotification(err.message || 'Regeneration failed', 'error');
    } finally {
      setIsRegenerating(null);
      setRegenStatus('');
    }
  }

  if (!result) return (
    <div style={{ minHeight: '100vh', background: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: 28, height: 28, borderRadius: '50%', border: '2.5px solid #E8E8E8', borderTopColor: '#0A0A0A', animation: 'spin 0.7s linear infinite' }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  const { research = {}, creator = {}, publisher = {}, meta = {}, input = {} } = result;
  const yt = publisher.youtube || {};
  const ig = publisher.instagram || {};
  const tt = publisher.tiktok || {};
  const bl = publisher.blog || {};
  const ps = publisher.posting_schedule || {};
  const totalSec = ((meta.total_duration_ms || 0) / 1000).toFixed(1);
  const isVlogger = creator.creator_mode === 'blogger' || input.creatorType === 'blogger';
  const blogType = creator.blog_type || input.blogType;
  const location = creator.location || input.location;

  const editPanelOpen = editMode && activeSection !== null;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;800&family=DM+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes slideIn { from { opacity: 0; transform: translateX(20px); } to { opacity: 1; transform: translateX(0); } }
        @keyframes notifIn { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } }
        body { background: #FFFFFF; }
        ::-webkit-scrollbar { width: 4px; height: 4px; }
        ::-webkit-scrollbar-track { background: #F5F5F5; }
        ::-webkit-scrollbar-thumb { background: #D0D0D0; border-radius: 4px; }
        .rp-root { min-height: 100vh; background: #FFFFFF; color: #0A0A0A; font-family: 'DM Sans', sans-serif; display: flex; flex-direction: column; }
        .rp-bar { position: sticky; top: 0; z-index: 50; background: rgba(255,255,255,0.96); backdrop-filter: blur(12px); border-bottom: 1px solid #E8E8E8; height: 56px; display: flex; align-items: center; justify-content: space-between; padding: 0 24px; flex-shrink: 0; }
        .rp-bar-left { display: flex; align-items: center; gap: 10px; }
        .rp-logo { width: 28px; height: 28px; background: #0A0A0A; border-radius: 7px; display: flex; align-items: center; justify-content: center; cursor: pointer; flex-shrink: 0; }
        .rp-brand { font-family: 'Playfair Display', serif; font-size: 15px; font-weight: 700; color: #0A0A0A; }
        .rp-sep { color: #E8E8E8; font-size: 16px; }
        .rp-crumb { font-size: 13px; color: #8C8C8C; font-weight: 500; }
        .rp-bar-right { display: flex; align-items: center; gap: 8px; }
        .rp-chip { display: inline-flex; align-items: center; gap: 5px; padding: 4px 12px; border-radius: 100px; font-size: 11px; font-weight: 600; white-space: nowrap; font-family: 'JetBrains Mono', monospace; }
        .rp-chip.streak { background: #FFF7ED; border: 1px solid #FED7AA; color: #C2410C; }
        .rp-chip.time { background: #F5F5F5; border: 1px solid #E8E8E8; color: #5C5C5C; }
        .rp-btn { padding: 7px 14px; border-radius: 7px; font-size: 13px; font-weight: 600; cursor: pointer; font-family: 'DM Sans', sans-serif; border: none; transition: all 0.18s; white-space: nowrap; }
        .rp-btn.ghost { background: transparent; color: #5C5C5C; border: 1px solid #E8E8E8; }
        .rp-btn.ghost:hover { background: #F8F8F8; color: #0A0A0A; }
        .rp-btn.primary { background: #0A0A0A; color: #FFFFFF; }
        .rp-btn.primary:hover { background: #1a1a1a; }
        .rp-btn.edit-toggle { border: 1.5px solid #0A0A0A; }
        .rp-btn.edit-toggle.on { background: #0A0A0A; color: #FFFFFF; }
        .rp-btn.edit-toggle.off { background: transparent; color: #0A0A0A; }
        .rp-banner { background: #FFFFFF; border-bottom: 1px solid #E8E8E8; padding: 28px 24px 22px; animation: fadeUp 0.4s ease both; flex-shrink: 0; }
        .rp-banner-inner { max-width: 820px; margin: 0 auto; }
        .rp-meta-row { display: flex; gap: 6px; flex-wrap: wrap; margin-bottom: 12px; }
        .rp-meta-tag { display: inline-flex; align-items: center; gap: 4px; padding: 4px 11px; border-radius: 6px; font-size: 12px; font-weight: 500; background: #F5F5F5; border: 1px solid #E8E8E8; color: #5C5C5C; }
        .rp-topic { font-family: 'Playfair Display', serif; font-size: clamp(20px, 3vw, 30px); font-weight: 700; color: #0A0A0A; line-height: 1.2; letter-spacing: -0.03em; margin-bottom: 10px; }
        .rp-hook { font-size: 14px; color: #5C5C5C; line-height: 1.7; border-left: 3px solid #0A0A0A; padding-left: 16px; font-style: italic; max-width: 640px; margin-bottom: 16px; }
        .rp-stats { display: flex; gap: 20px; flex-wrap: wrap; }
        .rp-stat { display: flex; align-items: center; gap: 6px; font-size: 13px; color: #5C5C5C; }
        .rp-stat strong { color: #0A0A0A; font-weight: 700; }
        .rp-tabstrip { background: rgba(255,255,255,0.97); border-bottom: 1px solid #E8E8E8; position: sticky; top: 56px; z-index: 40; flex-shrink: 0; }
        .rp-tabs { max-width: 820px; margin: 0 auto; padding: 0 24px; display: flex; overflow-x: auto; scrollbar-width: none; }
        .rp-tabs::-webkit-scrollbar { display: none; }
        .rp-tab { padding: 13px 16px; font-size: 13px; font-weight: 500; color: #8C8C8C; background: transparent; border: none; border-bottom: 2px solid transparent; cursor: pointer; white-space: nowrap; transition: all 0.18s; margin-bottom: -1px; display: flex; align-items: center; gap: 5px; font-family: 'DM Sans', sans-serif; }
        .rp-tab:hover { color: #0A0A0A; }
        .rp-tab.active { color: #0A0A0A; border-bottom-color: #0A0A0A; font-weight: 600; }
        .rp-body { display: flex; flex: 1; min-height: 0; overflow: hidden; }
        .rp-content { flex: 1; overflow-y: auto; }
        .rp-pane { max-width: 820px; margin: 0 auto; padding: 28px 24px 80px; animation: fadeUp 0.3s ease both; }
        .sp-header { display: flex; align-items: center; gap: 10px; padding: 12px 16px; background: #F8F8F8; border: 1px solid #E8E8E8; border-radius: 10px 10px 0 0; border-bottom: none; }
        .sp-body { background: #FFFFFF; border: 1px solid #E8E8E8; border-radius: 0 0 10px 10px; padding: 20px; margin-bottom: 20px; }
        .title-opt { display: flex; align-items: flex-start; gap: 12px; padding: 13px 16px; background: #FFFFFF; border: 1px solid #E8E8E8; border-radius: 10px; margin-bottom: 8px; transition: border-color 0.18s; }
        .title-opt:hover { border-color: #0A0A0A; }
        .title-rank { width: 26px; height: 26px; border-radius: 6px; background: #F0F0F0; display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 800; color: #5C5C5C; font-family: 'JetBrains Mono', monospace; flex-shrink: 0; }
        .title-rank.gold { background: #FFF9EB; color: #D4A847; }
        .edit-mode-banner { padding: 8px 24px; background: #F0FDF4; border-bottom: 1px solid #86EFAC; display: flex; align-items: center; gap: 10px; font-size: 12px; color: #15803D; font-family: 'DM Sans', sans-serif; flex-shrink: 0; }
        .regen-overlay { position: absolute; inset: 0; background: rgba(255,255,255,0.7); display: flex; align-items: center; justify-content: center; border-radius: 10px; z-index: 5; }
        .notification { position: fixed; bottom: 32px; left: 50%; transform: translateX(-50%); padding: 10px 20px; border-radius: 8px; font-size: 13px; font-weight: 600; font-family: 'DM Sans', sans-serif; z-index: 1000; animation: notifIn 0.3s ease both; white-space: nowrap; box-shadow: 0 4px 16px rgba(0,0,0,0.15); }
        .notification.success { background: #0A0A0A; color: #FFFFFF; }
        .notification.error { background: #FEF2F2; border: 1px solid #FCA5A5; color: #DC2626; }
        .edit-panel-wrapper { animation: slideIn 0.25s ease both; }
        @media (max-width: 640px) {
          .rp-bar { padding: 0 16px; }
          .rp-banner { padding: 20px 16px; }
          .rp-pane { padding: 20px 16px 60px; }
          .rp-tabs { padding: 0 16px; }
          .rp-tab { padding: 12px 10px; font-size: 12px; }
        }
      `}</style>

      <div className="rp-root">
        {/* Notification toast */}
        {notification && (
          <div className={`notification ${notification.type}`}>{notification.msg}</div>
        )}

        {/* Topbar */}
        <header className="rp-bar">
          <div className="rp-bar-left">
            <div className="rp-logo" onClick={() => router.push('/generate')}>
              <svg width="13" height="13" viewBox="0 0 20 20" fill="none">
                <polygon points="10,2 17,6 17,14 10,18 3,14 3,6" stroke="#FFFFFF" strokeWidth="1.5" fill="none"/>
                <polygon points="10,6 14,8.5 14,13.5 10,16 6,13.5 6,8.5" fill="#FFFFFF" fillOpacity="0.3"/>
              </svg>
            </div>
            <span className="rp-brand">Studio AI</span>
            <span className="rp-sep">/</span>
            <span className="rp-crumb">Results</span>
          </div>
          <div className="rp-bar-right">
            {meta.streak > 0 && <span className="rp-chip streak">🔥 {meta.streak}-day streak</span>}
            <span className="rp-chip time">⚡ {totalSec}s</span>
            <button className={`rp-btn edit-toggle ${editMode ? 'on' : 'off'}`} onClick={() => { setEditMode(!editMode); if (editMode) setActiveSection(null); }}>
              {editMode ? '✓ Edit mode on' : '✏ Edit mode'}
            </button>
            <button className="rp-btn ghost" onClick={() => router.push('/dashboard')}>History</button>
            <button className="rp-btn primary" onClick={() => router.push('/generate')}>+ New</button>
          </div>
        </header>

        {/* Edit mode banner */}
        {editMode && (
          <div className="edit-mode-banner">
            <span>✏️</span>
            <span>Edit mode on — hover any section and click <strong>Edit</strong> to modify it, or click <strong>Regenerate</strong> to refresh with AI.</span>
          </div>
        )}

        {/* Banner */}
        <div className="rp-banner">
          <div className="rp-banner-inner">
            <div className="rp-meta-row">
              {isVlogger && blogType && <span className="rp-meta-tag">{BLOG_TYPE_LABELS[blogType] || blogType}</span>}
              {location && <span className="rp-meta-tag">📍 {location}</span>}
              {input.platform && <span className="rp-meta-tag">▶ {input.platform}</span>}
              {input.language && <span className="rp-meta-tag">🌐 {input.language}</span>}
              {input.tone && <span className="rp-meta-tag">🎭 {input.tone}</span>}
            </div>
            <h1 className="rp-topic">{research.chosen_topic || 'Generated Content'}</h1>
            {research.chosen_hook && <p className="rp-hook">"{research.chosen_hook}"</p>}
            <div className="rp-stats">
              {creator.word_count > 0 && <div className="rp-stat"><span>📝</span><strong>{creator.word_count}</strong> words</div>}
              {creator.scenes?.length > 0 && <div className="rp-stat"><span>🎬</span><strong>{creator.scenes.length}</strong> scenes</div>}
              {yt.tags?.length > 0 && <div className="rp-stat"><span>🏷️</span><strong>{yt.tags.length}</strong> tags</div>}
              {creator.estimated_duration && <div className="rp-stat"><span>⏱</span><strong>{creator.estimated_duration}</strong></div>}
            </div>
          </div>
        </div>

        {/* Tab strip */}
        <div className="rp-tabstrip">
          <div className="rp-tabs">
            {TABS.map(t => (
              <button key={t.id} className={`rp-tab ${activeTab === t.id ? 'active' : ''}`} onClick={() => setActiveTab(t.id)}>
                {t.icon} {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Body: content + edit panel side by side */}
        <div className="rp-body">
          <div className="rp-content">
            <TabErrorBoundary key={activeTab}>

              {/* ── SCRIPT TAB ── */}
              {activeTab === 'script' && (
                <div className="rp-pane">
                  <EditableSection id="full_script" label="📄 Full Script" editMode={editMode} activeSection={activeSection} onSelect={handleSelectSection} isRegenerating={isRegenerating} copyText={creator.full_script}>
                    {editMode && activeSection !== 'full_script'
                      ? <Prose>{creator.full_script || 'No script generated.'}</Prose>
                      : editMode && activeSection === 'full_script'
                      ? <InlineTextEdit value={creator.full_script || ''} onSave={v => handleInlineEdit('creator.full_script', v)} multiline style={{ fontSize: 14 }} />
                      : <Prose>{creator.full_script || 'No script generated.'}</Prose>
                    }
                  </EditableSection>

                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 28 }}>
                    {creator.estimated_duration && <Chip label={`⏱ ${creator.estimated_duration}`} />}
                    {creator.word_count > 0 && <Chip label={`📝 ${creator.word_count} words`} color="#0E7C4A" bg="#F0FDF4" border="#86EFAC" />}
                  </div>

                  {creator.shorts_script && (
                    <EditableSection id="shorts_script" label="⚡ Shorts / Reels Version (60s)" editMode={editMode} activeSection={activeSection} onSelect={handleSelectSection} isRegenerating={isRegenerating} copyText={creator.shorts_script}>
                      <Prose>{creator.shorts_script}</Prose>
                    </EditableSection>
                  )}

                  {Array.isArray(creator.cta_options) && creator.cta_options.length > 0 && (
                    <EditableSection id="cta_options" label="📣 CTA Options" editMode={editMode} activeSection={activeSection} onSelect={handleSelectSection} isRegenerating={isRegenerating}>
                      {creator.cta_options.map((cta, i) => (
                        <div key={i} style={{ background: '#FAFAF7', border: '1px solid #E8E8E8', borderRadius: 10, padding: '14px 16px', marginBottom: 8 }}>
                          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10, marginBottom: 8 }}>
                            <p style={{ fontSize: 14, color: '#0A0A0A', fontStyle: 'italic', lineHeight: 1.6, flex: 1, margin: 0, fontFamily: "'DM Sans',sans-serif" }}>"{cta.cta_text}"</p>
                            <CopyBtn text={cta.cta_text} />
                          </div>
                          <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                            {cta.placement && <Chip label={`📍 ${cta.placement}`} />}
                            {cta.goal && <Chip label={`🎯 ${cta.goal}`} />}
                          </div>
                        </div>
                      ))}
                    </EditableSection>
                  )}
                </div>
              )}

              {/* ── SCENES TAB ── */}
              {activeTab === 'scenes' && (
                <div className="rp-pane">
                  <EditableSection id="scenes" label={`🎬 Scene Breakdown — ${creator.scenes?.length || 0} Scenes`} editMode={editMode} activeSection={activeSection} onSelect={handleSelectSection} isRegenerating={isRegenerating}>
                    {Array.isArray(creator.scenes) && creator.scenes.length > 0
                      ? creator.scenes.map(s => (
                        <div key={s.scene_number} style={{ border: '1px solid #E8E8E8', borderRadius: 10, overflow: 'hidden', marginBottom: 8 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', background: '#F8F8F8', cursor: 'pointer' }}>
                            <div style={{ width: 32, height: 32, borderRadius: 7, background: '#F0F0F0', border: '1px solid #E8E8E8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 800, color: '#5C5C5C', flexShrink: 0, fontFamily: "'JetBrains Mono',monospace" }}>S{s.scene_number}</div>
                            <div style={{ flexShrink: 0, minWidth: 90 }}>
                              <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#D4A847', fontFamily: "'JetBrains Mono',monospace" }}>{s.section_type}</div>
                              <div style={{ fontSize: 10, color: '#BCBCBC', fontFamily: "'JetBrains Mono',monospace", marginTop: 2 }}>{s.timestamp_start} → {s.timestamp_end}</div>
                            </div>
                            <p style={{ flex: 1, fontSize: 12, color: '#5C5C5C', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontFamily: "'DM Sans',sans-serif" }}>
                              {s.voiceover?.slice(0, 70)}…
                            </p>
                            <CopyBtn text={s.voiceover || ''} label="Copy" />
                          </div>
                        </div>
                      ))
                      : <Prose>No scene data.</Prose>
                    }
                  </EditableSection>
                </div>
              )}

              {/* ── HOOK PSYCHOLOGY TAB ── */}
              {activeTab === 'hook' && (
                <div className="rp-pane">
                  <EditableSection id="hook" label="🪝 Hook Psychology" editMode={editMode} activeSection={activeSection} onSelect={handleSelectSection} isRegenerating={isRegenerating}>
                    <HookExplainer hookBreakdown={creator.hook_breakdown} chosenHook={research.chosen_hook} hookTrigger={research.chosen_hook_trigger} />
                  </EditableSection>

                  {research.chosen_hook_deep_analysis && (
                    <div style={{ marginTop: 24 }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                        <Label color="#8C8C8C">🧪 Deep Psychological Analysis</Label>
                        <CopyBtn text={research.chosen_hook_deep_analysis} />
                      </div>
                      <Prose>{research.chosen_hook_deep_analysis}</Prose>
                    </div>
                  )}

                  {Array.isArray(research.hook_options) && research.hook_options.length > 0 && (
                    <div style={{ marginTop: 24 }}>
                      <Label color="#8C8C8C">🎣 All Hook Options Considered</Label>
                      <div style={{ marginTop: 10 }}>
                        {research.hook_options.map((h, i) => {
                          const isChosen = h.hook_text === research.chosen_hook;
                          return (
                            <div key={i} style={{ padding: '14px 16px', marginBottom: 8, background: isChosen ? '#FAFAF7' : '#FFFFFF', border: `1px solid ${isChosen ? '#D4A847' : '#E8E8E8'}`, borderRadius: 10 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8, flexWrap: 'wrap' }}>
                                {isChosen && <span style={{ fontSize: 9, color: '#D4A847', fontFamily: "'JetBrains Mono',monospace", fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>★ Chosen</span>}
                                <Label color="#8C8C8C">{h.psychological_trigger}</Label>
                                {h.ctr_strength && <Chip label={h.ctr_strength} color={h.ctr_strength === 'HIGH' ? '#0E7C4A' : '#D97706'} bg={h.ctr_strength === 'HIGH' ? '#F0FDF4' : '#FFF7ED'} border={h.ctr_strength === 'HIGH' ? '#86EFAC' : '#FDE68A'} />}
                                <div style={{ marginLeft: 'auto' }}><CopyBtn text={h.hook_text} /></div>
                              </div>
                              <p style={{ fontSize: 14, color: '#0A0A0A', lineHeight: 1.65, marginBottom: 6, fontStyle: 'italic', fontFamily: "'DM Sans',sans-serif" }}>"{h.hook_text}"</p>
                              {h.trigger_explanation && <p style={{ fontSize: 12, color: '#8C8C8C', margin: 0, lineHeight: 1.55, fontFamily: "'DM Sans',sans-serif" }}>{h.trigger_explanation}</p>}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ── YOUTUBE SEO TAB ── */}
              {activeTab === 'youtube' && (
                <div className="rp-pane">
                  {yt.recommended_title && (
                    <EditableSection id="youtube_titles" label="⭐ YouTube Titles" editMode={editMode} activeSection={activeSection} onSelect={handleSelectSection} isRegenerating={isRegenerating} copyText={yt.recommended_title}>
                      {/* Recommended title with inline edit */}
                      <div style={{ padding: '14px 16px', background: '#FAFAF7', border: '1px solid #D4A847', borderRadius: 10, marginBottom: 12 }}>
                        <div style={{ fontSize: 10, fontWeight: 700, color: '#D4A847', fontFamily: "'JetBrains Mono',monospace", marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.08em' }}>⭐ Recommended</div>
                        {editMode
                          ? <InlineTextEdit value={yt.recommended_title} onSave={v => handleInlineEdit('publisher.youtube.recommended_title', v)} style={{ fontSize: 17, fontWeight: 700 }} />
                          : <div style={{ fontSize: 17, fontWeight: 700, color: '#0A0A0A', fontFamily: "'Playfair Display',serif", letterSpacing: '-0.02em', lineHeight: 1.4 }}>{yt.recommended_title}</div>
                        }
                      </div>

                      {Array.isArray(yt.title_options) && yt.title_options.map((t, i) => (
                        <div key={i} className="title-opt">
                          <div className={`title-rank ${i === 0 ? 'gold' : ''}`}>{i + 1}</div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            {editMode
                              ? <InlineTextEdit value={t.title} onSave={v => {
                                const newOpts = [...(yt.title_options || [])];
                                newOpts[i] = { ...newOpts[i], title: v };
                                handleInlineEdit('publisher.youtube.title_options', newOpts);
                              }} style={{ fontSize: 14, fontWeight: 600 }} />
                              : <p style={{ fontSize: 14, fontWeight: 600, color: '#0A0A0A', margin: '0 0 4px', lineHeight: 1.4, fontFamily: "'DM Sans',sans-serif" }}>{t.title}</p>
                            }
                            {t.reasoning && <p style={{ fontSize: 12, color: '#8C8C8C', margin: '4px 0 0', lineHeight: 1.5, fontFamily: "'DM Sans',sans-serif" }}>{t.reasoning}</p>}
                            <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginTop: 5 }}>
                              {t.character_count > 0 && <span style={{ fontSize: 10, color: '#BCBCBC', fontFamily: "'JetBrains Mono',monospace" }}>{t.character_count} chars</span>}
                              {t.ctr_prediction && <Chip label={`CTR: ${t.ctr_prediction}`} color={t.ctr_prediction === 'HIGH' ? '#0E7C4A' : '#D97706'} bg={t.ctr_prediction === 'HIGH' ? '#F0FDF4' : '#FFF7ED'} border={t.ctr_prediction === 'HIGH' ? '#86EFAC' : '#FDE68A'} />}
                            </div>
                          </div>
                          <CopyBtn text={t.title} />
                        </div>
                      ))}
                    </EditableSection>
                  )}

                  {yt.description && (
                    <EditableSection id="youtube_description" label="📝 YouTube Description" editMode={editMode} activeSection={activeSection} onSelect={handleSelectSection} isRegenerating={isRegenerating} copyText={yt.description}>
                      {editMode
                        ? <InlineTextEdit value={yt.description} onSave={v => handleInlineEdit('publisher.youtube.description', v)} multiline style={{ fontSize: 13 }} />
                        : <Prose>{yt.description}</Prose>
                      }
                    </EditableSection>
                  )}

                  {Array.isArray(yt.tags) && yt.tags.length > 0 && (
                    <EditableSection id="youtube_tags" label={`🏷️ SEO Tags (${yt.tags.length})`} editMode={editMode} activeSection={activeSection} onSelect={handleSelectSection} isRegenerating={isRegenerating} copyText={yt.tags.join(', ')}>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                        {yt.tags.map((tag, i) => (
                          <div key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 10px', borderRadius: 5, fontSize: 11, fontWeight: 600, fontFamily: "'JetBrains Mono',monospace", background: '#F0F0F0', border: '1px solid #E8E8E8', color: '#0A0A0A', margin: 2 }}>
                            {tag}
                            {editMode && <button onClick={() => { const newTags = yt.tags.filter((_, ti) => ti !== i); handleInlineEdit('publisher.youtube.tags', newTags); }} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 9, color: '#8C8C8C', padding: 0, marginLeft: 2, lineHeight: 1 }}>✕</button>}
                          </div>
                        ))}
                        {editMode && (
                          <button onClick={() => { const tag = prompt('Add a new tag:'); if (tag?.trim()) handleInlineEdit('publisher.youtube.tags', [...yt.tags, tag.trim()]); }} style={{ padding: '3px 10px', borderRadius: 5, fontSize: 11, fontFamily: "'JetBrains Mono',monospace", background: '#F0F8FF', border: '1px dashed #86EFAC', color: '#0E7C4A', cursor: 'pointer', margin: 2 }}>
                            + Add tag
                          </button>
                        )}
                      </div>
                    </EditableSection>
                  )}

                  {yt.primary_keyword && (
                    <div style={{ marginBottom: 28 }}>
                      <div style={{ marginBottom: 10 }}><Label color="#8C8C8C">🔑 Keywords</Label></div>
                      <Chip label={yt.primary_keyword} color="#2563EB" bg="#EFF6FF" border="#BFDBFE" />
                      {Array.isArray(yt.secondary_keywords) && (
                        <div style={{ marginTop: 8, display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                          {yt.secondary_keywords.map((k, i) => <Chip key={i} label={k} />)}
                        </div>
                      )}
                    </div>
                  )}

                  {bl.seo_title && (
                    <>
                      <div style={{ borderTop: '1px solid #E8E8E8', paddingTop: 24, marginBottom: 20 }}><Label>✍️ Blog / SEO Assets</Label></div>
                      <div style={{ marginBottom: 20 }}>
                        <div style={{ marginBottom: 10 }}><Label color="#8C8C8C">Blog Title</Label></div>
                        {editMode ? <InlineTextEdit value={bl.seo_title} onSave={v => handleInlineEdit('publisher.blog.seo_title', v)} /> : <Prose style={{ fontSize: 14, padding: '12px 14px' }}>{bl.seo_title}</Prose>}
                      </div>
                      {bl.meta_description && (
                        <div style={{ marginBottom: 20 }}>
                          <div style={{ marginBottom: 10 }}><Label color="#8C8C8C">Meta Description</Label></div>
                          {editMode ? <InlineTextEdit value={bl.meta_description} onSave={v => handleInlineEdit('publisher.blog.meta_description', v)} multiline /> : <Prose style={{ fontSize: 13, padding: '10px 14px' }}>{bl.meta_description}</Prose>}
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}

              {/* ── SOCIAL TAB ── */}
              {activeTab === 'social' && (
                <div className="rp-pane">
                  {ig.caption && (
                    <EditableSection id="instagram" label="📸 Instagram" editMode={editMode} activeSection={activeSection} onSelect={handleSelectSection} isRegenerating={isRegenerating}>
                      <div className="sp-header">
                        <span style={{ fontSize: 18 }}>📸</span>
                        <span style={{ fontSize: 14, fontWeight: 700, color: '#0A0A0A', fontFamily: "'DM Sans',sans-serif" }}>Instagram</span>
                        <div style={{ marginLeft: 'auto' }}><CopyBtn text={[ig.caption, '', ig.hashtags?.join(' ')].filter(Boolean).join('\n')} label="Copy All" /></div>
                      </div>
                      <div className="sp-body">
                        <div style={{ marginBottom: 16 }}>
                          <div style={{ marginBottom: 8 }}><Label color="#8C8C8C">Caption</Label></div>
                          {editMode
                            ? <InlineTextEdit value={ig.caption} onSave={v => handleInlineEdit('publisher.instagram.caption', v)} multiline />
                            : <Prose>{ig.caption}</Prose>
                          }
                        </div>
                        {Array.isArray(ig.hashtags) && ig.hashtags.length > 0 && (
                          <div>
                            <div style={{ marginBottom: 8 }}><Label color="#8C8C8C">Hashtags ({ig.hashtags.length})</Label></div>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                              {ig.hashtags.map((h, i) => <Chip key={i} label={h.startsWith('#') ? h : `#${h}`} color="#DC2626" bg="#FEF2F2" border="#FCA5A5" />)}
                            </div>
                          </div>
                        )}
                      </div>
                    </EditableSection>
                  )}

                  {tt.caption && (
                    <EditableSection id="tiktok" label="🎵 TikTok" editMode={editMode} activeSection={activeSection} onSelect={handleSelectSection} isRegenerating={isRegenerating}>
                      <div className="sp-header">
                        <span style={{ fontSize: 18 }}>🎵</span>
                        <span style={{ fontSize: 14, fontWeight: 700, color: '#0A0A0A', fontFamily: "'DM Sans',sans-serif" }}>TikTok</span>
                        <div style={{ marginLeft: 'auto' }}><CopyBtn text={[tt.caption, tt.hashtags?.join(' ')].filter(Boolean).join('\n')} label="Copy All" /></div>
                      </div>
                      <div className="sp-body">
                        <div style={{ marginBottom: 12 }}>
                          <div style={{ marginBottom: 8 }}><Label color="#8C8C8C">Caption</Label></div>
                          {editMode
                            ? <InlineTextEdit value={tt.caption} onSave={v => handleInlineEdit('publisher.tiktok.caption', v)} multiline />
                            : <Prose style={{ padding: '10px 14px', fontSize: 13 }}>{tt.caption}</Prose>
                          }
                        </div>
                        {Array.isArray(tt.hashtags) && tt.hashtags.length > 0 && (
                          <div>
                            <div style={{ marginBottom: 8 }}><Label color="#8C8C8C">Hashtags</Label></div>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                              {tt.hashtags.map((h, i) => <Chip key={i} label={h} color="#2563EB" bg="#EFF6FF" border="#BFDBFE" />)}
                            </div>
                          </div>
                        )}
                      </div>
                    </EditableSection>
                  )}

                  {ps.primary_post_day && (
                    <div style={{ marginBottom: 28 }}>
                      <div style={{ marginBottom: 10 }}><Label color="#8C8C8C">🕐 Posting Schedule</Label></div>
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
                        <Chip label={`📅 ${ps.primary_post_day}`} />
                        {ps.primary_post_time && <Chip label={`🕐 ${ps.primary_post_time}`} />}
                      </div>
                      {ps.reasoning && <p style={{ fontSize: 12, color: '#8C8C8C', margin: 0, lineHeight: 1.6, fontFamily: "'DM Sans',sans-serif" }}>{ps.reasoning}</p>}
                    </div>
                  )}
                </div>
              )}

              {/* ── 7-DAY PLAN TAB ── */}
              {activeTab === 'plan' && (
                <div className="rp-pane">
                  <EditableSection id="seven_day_plan" label="📅 7-Day Sprint Plan" editMode={editMode} activeSection={activeSection} onSelect={handleSelectSection} isRegenerating={isRegenerating}>
                    <SprintTracker plan={publisher.seven_day_content_plan} />
                  </EditableSection>
                </div>
              )}

            </TabErrorBoundary>
          </div>

          {/* Edit Panel */}
          {editPanelOpen && (
            <div className="edit-panel-wrapper">
              <EditPanel
                activeSection={activeSection}
                sectionMeta={SECTION_META[activeSection]}
                onRegenerate={handleRegenerate}
                isRegenerating={!!isRegenerating}
                onClose={handleClosePanel}
              />
            </div>
          )}
        </div>
      </div>
    </>
  );
}