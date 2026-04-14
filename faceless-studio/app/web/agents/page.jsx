'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { getSupabaseBrowser } from '@/packages/supabase-browser';

// ── Constants ──────────────────────────────────────────────────────────────────
const PLATFORMS    = ['YouTube', 'Instagram Reels', 'TikTok', 'Podcast', 'Blog', 'YouTube Shorts'];
const LANGUAGES    = ['English', 'Hindi', 'Tamil', 'Telugu', 'Kannada', 'Marathi', 'Bengali', 'Gujarati', 'Malayalam', 'Punjabi'];
const TONES        = ['Educational', 'Conversational', 'Motivational', 'Entertaining', 'Authoritative', 'Storytelling'];
const CREATORTYPES = ['general', 'educator', 'coach', 'entertainer', 'podcaster', 'blogger', 'agency'];
const LOC_LANGS    = ['Hindi', 'Tamil', 'Telugu', 'Kannada', 'Marathi', 'Bengali', 'Gujarati', 'Malayalam', 'Punjabi', 'Spanish', 'French', 'Portuguese', 'Arabic', 'Indonesian', 'Japanese', 'Korean'];

// ── Agent Config ───────────────────────────────────────────────────────────────
const AGENT_GROUPS = [
  {
    tier: 'pro', label: 'Pro Agents', color: '#2563EB',
    agents: [
      {
        id: 'trend-spy', icon: '📡', name: 'Trend Spy',
        desc: '48-hour trend brief: what is blowing up in your niche right now.',
        fields: [
          { key: 'niche',    label: 'Niche',    type: 'text',   required: true,  placeholder: 'e.g. personal finance india' },
          { key: 'platform', label: 'Platform', type: 'select', options: PLATFORMS },
          { key: 'language', label: 'Language', type: 'select', options: LANGUAGES },
        ],
      },
      {
        id: 'title-battle', icon: '🥊', name: 'Title Battle',
        desc: '10 title variants scored and ranked by CTR psychology.',
        fields: [
          { key: 'topic',        label: 'Video Topic',              type: 'text',   required: true, placeholder: 'e.g. How to invest in index funds' },
          { key: 'niche',        label: 'Niche',                    type: 'text',   required: true, placeholder: 'e.g. personal finance' },
          { key: 'platform',     label: 'Platform',                 type: 'select', options: PLATFORMS },
          { key: 'currentTitle', label: 'Current Title (optional)', type: 'text',   placeholder: 'Paste your existing title to beat' },
          { key: 'creatorType',  label: 'Creator Type',             type: 'select', options: CREATORTYPES },
        ],
      },
      {
        id: 'thumbnail-brain', icon: '🖼️', name: 'Thumbnail Brain',
        desc: 'Full designer-ready thumbnail brief with AI image prompts.',
        fields: [
          { key: 'topic',      label: 'Topic',               type: 'text',   required: true, placeholder: 'e.g. passive income ideas 2025' },
          { key: 'niche',      label: 'Niche',               type: 'text',   required: true, placeholder: 'e.g. personal finance' },
          { key: 'platform',   label: 'Platform',            type: 'select', options: PLATFORMS },
          { key: 'chosenHook', label: 'Hook (optional)',     type: 'text',   placeholder: 'Your opening hook' },
          { key: 'titleText',  label: 'Title Text (optional)',type: 'text',  placeholder: 'Thumbnail text overlay' },
        ],
      },
      {
        id: 'hook-upgrader', icon: '⚡', name: 'Hook Upgrader',
        desc: 'Paste a weak hook — get 5 powerful rewrites with psychology explained.',
        fields: [
          { key: 'weakHook', label: 'Weak Hook to Upgrade', type: 'textarea', required: true, rows: 3, placeholder: 'Paste your weak opening hook here...' },
          { key: 'niche',    label: 'Niche',                type: 'text',     required: true, placeholder: 'e.g. fitness' },
          { key: 'platform', label: 'Platform',             type: 'select',   options: PLATFORMS },
          { key: 'tone',     label: 'Tone',                 type: 'select',   options: TONES },
        ],
      },
      {
        id: 'comment-reply', icon: '💬', name: 'Comment Reply',
        desc: 'Algorithm-optimised replies that encourage re-engagement.',
        fields: [
          { key: 'comments',    label: 'Comments (one per line)', type: 'textarea', required: true, rows: 5, placeholder: 'Paste comments here, one per line...' },
          { key: 'niche',       label: 'Niche',                   type: 'text',     required: true, placeholder: 'e.g. cooking' },
          { key: 'platform',    label: 'Platform',                type: 'select',   options: PLATFORMS },
          { key: 'channelTone', label: 'Channel Tone',            type: 'select',   options: TONES },
          { key: 'channelName', label: 'Channel Name (optional)', type: 'text',     placeholder: 'Your channel name' },
        ],
      },
    ],
  },
  {
    tier: 'studio', label: 'Studio Agents', color: '#0E7C4A',
    agents: [
      {
        id: 'competitor-autopsy', icon: '🔬', name: 'Competitor Autopsy',
        desc: 'Dissect any channel — hook patterns, gaps, and battle plan to beat them.',
        fields: [
          { key: 'channelName',     label: 'Channel / Creator Name', type: 'text',   required: true, placeholder: 'e.g. Akshat Shrivastava' },
          { key: 'niche',           label: 'Niche',                  type: 'text',   required: true, placeholder: 'e.g. personal finance india' },
          { key: 'platform',        label: 'Platform',               type: 'select', options: PLATFORMS },
          { key: 'subscriberCount', label: 'Approx. Subscribers',    type: 'text',   placeholder: 'e.g. 1.2M' },
        ],
      },
      {
        id: 'viral-decoder', icon: '🔄', name: 'Viral Decoder',
        desc: 'Reverse-engineer why a video went viral and extract the replicable formula.',
        fields: [
          { key: 'videoTitle',  label: 'Viral Video Title',       type: 'text',   required: true, placeholder: 'Paste the exact viral video title' },
          { key: 'niche',       label: 'Niche',                   type: 'text',   required: true, placeholder: 'e.g. finance' },
          { key: 'platform',    label: 'Platform',                type: 'select', options: PLATFORMS },
          { key: 'channelName', label: 'Channel Name (optional)', type: 'text',   placeholder: 'Creator / channel name' },
          { key: 'viewCount',   label: 'View Count (optional)',   type: 'text',   placeholder: 'e.g. 2.4M views' },
        ],
      },
      {
        id: 'channel-strategy', icon: '📊', name: 'Channel Strategy',
        desc: '90-day content roadmap with pillars, milestones, and first 15 titles.',
        fields: [
          { key: 'niche',              label: 'Niche',                    type: 'text',     required: true, placeholder: 'e.g. AI tools for students' },
          { key: 'platform',           label: 'Platform',                 type: 'select',   options: PLATFORMS },
          { key: 'currentSubscribers', label: 'Current Subscribers',      type: 'text',     placeholder: 'e.g. 0 or 850' },
          { key: 'monetisationGoal',   label: 'Monetisation Goal',        type: 'textarea', rows: 2, placeholder: 'e.g. reach ₹50k/month via affiliates within 6 months' },
          { key: 'contentFrequency',   label: 'Current Posting Frequency',type: 'text',     placeholder: 'e.g. 1 video/week or not posting yet' },
          { key: 'biggestChallenge',   label: 'Biggest Challenge',        type: 'textarea', rows: 2, placeholder: 'e.g. topic consistency and low views' },
          { key: 'targetAudience',     label: 'Target Audience',          type: 'textarea', rows: 2, placeholder: 'e.g. Indian college students interested in AI and productivity' },
        ],
      },
      {
        id: 'monetisation-coach', icon: '💰', name: 'Monetisation Coach',
        desc: 'CPM map, affiliate matches, sponsorship pricing and a ready-to-send pitch email.',
        fields: [
          { key: 'niche',           label: 'Niche',           type: 'text',   required: true, placeholder: 'e.g. fitness india' },
          { key: 'platform',        label: 'Platform',        type: 'select', options: PLATFORMS },
          { key: 'subscriberCount', label: 'Subscribers',     type: 'text',   placeholder: 'e.g. 3500' },
          { key: 'averageViews',    label: 'Average Views',   type: 'text',   placeholder: 'e.g. 600' },
          { key: 'location',        label: 'Location',        type: 'text',   placeholder: 'India' },
        ],
      },
      {
        id: 'script-localiser', icon: '🌏', name: 'Script Localiser',
        desc: 'Culturally adapt your English script into Hindi, Tamil, Telugu and more.',
        fields: [
          { key: 'originalScript', label: 'Original Script (min 50 chars)', type: 'textarea', required: true, rows: 8, placeholder: 'Paste your full English script here...' },
          { key: 'targetLanguage', label: 'Target Language',                type: 'select',   options: LOC_LANGS },
          { key: 'niche',          label: 'Niche',                          type: 'text',     required: true, placeholder: 'e.g. finance' },
          { key: 'platform',       label: 'Platform',                       type: 'select',   options: PLATFORMS },
          { key: 'creatorType',    label: 'Creator Type',                   type: 'select',   options: CREATORTYPES },
        ],
      },
    ],
  },
];

const AGENT_MAP = {};
AGENT_GROUPS.forEach(g => g.agents.forEach(a => {
  AGENT_MAP[a.id] = { ...a, tier: g.tier, tierColor: g.color };
}));

// ── Utility ────────────────────────────────────────────────────────────────────
function Spinner({ size = 18 }) {
  return (
    <span style={{
      width: size, height: size, borderRadius: '50%',
      border: '2px solid #E8E8E8', borderTopColor: '#0A0A0A',
      display: 'inline-block', animation: 'spin 0.7s linear infinite', flexShrink: 0,
    }} />
  );
}

function CopyBtn({ text, label = 'Copy' }) {
  const [done, setDone] = useState(false);
  return (
    <button
      onClick={() => { navigator.clipboard.writeText(text || '').then(() => { setDone(true); setTimeout(() => setDone(false), 1800); }); }}
      style={{
        background: done ? '#F0FDF4' : '#F8F8F8', border: `1px solid ${done ? '#86EFAC' : '#E8E8E8'}`,
        borderRadius: 6, padding: '4px 12px', color: done ? '#15803D' : '#5C5C5C',
        fontSize: 11, cursor: 'pointer', fontFamily: "'JetBrains Mono', monospace",
        transition: 'all 0.2s', flexShrink: 0, whiteSpace: 'nowrap',
      }}
    >
      {done ? '✓ Copied' : label}
    </button>
  );
}

function Block({ title, children, accent = false, danger = false }) {
  const borderColor = accent ? '#0A0A0A' : danger ? '#FCA5A5' : '#E8E8E8';
  const bg = accent ? '#F8F8F8' : danger ? '#FEF2F2' : '#FFFFFF';
  return (
    <div style={{ border: `1px solid ${borderColor}`, borderRadius: 10, overflow: 'hidden', marginBottom: 12 }}>
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '10px 16px', borderBottom: `1px solid ${borderColor}`,
        background: bg,
      }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: accent ? '#0A0A0A' : danger ? '#DC2626' : '#5C5C5C', letterSpacing: '-0.01em', fontFamily: "'DM Sans', sans-serif" }}>
          {title}
        </span>
      </div>
      <div style={{ padding: 16 }}>{children}</div>
    </div>
  );
}

function Tag({ label, color = '#5C5C5C', bg = '#F0F0F0' }) {
  return (
    <span style={{
      background: bg, border: `1px solid ${color}30`,
      borderRadius: 4, padding: '2px 8px', color,
      fontSize: 10, fontWeight: 700, letterSpacing: '0.04em',
      fontFamily: "'JetBrains Mono', monospace", whiteSpace: 'nowrap',
    }}>
      {label}
    </span>
  );
}

function KV({ k, v }) {
  return (
    <div style={{ display: 'flex', gap: 12, padding: '7px 0', borderBottom: '1px solid #F5F5F5', alignItems: 'flex-start' }}>
      <span style={{ fontSize: 10, color: '#8C8C8C', minWidth: 130, flexShrink: 0, paddingTop: 2, textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 700, fontFamily: "'JetBrains Mono', monospace" }}>
        {k}
      </span>
      <span style={{ fontSize: 13, color: '#1a1a1a', lineHeight: 1.55, fontFamily: "'DM Sans', sans-serif" }}>{v}</span>
    </div>
  );
}

function Prose({ children }) {
  return (
    <div style={{
      background: '#F8F8F8', border: '1px solid #E8E8E8', borderRadius: 8,
      padding: '12px 14px', fontSize: 13, color: '#1a1a1a',
      lineHeight: 1.75, fontFamily: "'DM Sans', sans-serif",
      whiteSpace: 'pre-wrap', wordBreak: 'break-word',
    }}>
      {children}
    </div>
  );
}

// ── Result Renderers ───────────────────────────────────────────────────────────
function TrendSpyResult({ data }) {
  if (!data) return <Prose>No data returned.</Prose>;
  return (
    <div>
      {data.niche_pulse && (
        <Block title="Niche Pulse" accent>
          <p style={{ fontSize: 14, color: '#1a1a1a', lineHeight: 1.7, margin: 0, fontFamily: "'DM Sans', sans-serif" }}>{data.niche_pulse}</p>
        </Block>
      )}
      {Array.isArray(data.trending_now) && data.trending_now.length > 0 && (
        <Block title={`Trending Now — ${data.trending_now.length} Topics`}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {data.trending_now.map((t, i) => (
              <div key={i} style={{ padding: '12px 14px', background: '#F8F8F8', borderRadius: 8, border: '1px solid #E8E8E8' }}>
                <div style={{ display: 'flex', gap: 6, marginBottom: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                  <Tag label={t.urgency || 'MEDIUM'} color={t.urgency === 'HIGH' ? '#DC2626' : '#C2410C'} bg={t.urgency === 'HIGH' ? '#FEF2F2' : '#FFF7ED'} />
                  {t.search_volume_signal && <Tag label={t.search_volume_signal} color="#2563EB" bg="#EFF6FF" />}
                  {t.peak_window && <span style={{ fontSize: 11, color: '#8C8C8C', fontFamily: "'JetBrains Mono', monospace" }}>{t.peak_window}</span>}
                </div>
                <p style={{ fontSize: 14, fontWeight: 600, color: '#0A0A0A', margin: '0 0 5px', fontFamily: "'DM Sans', sans-serif" }}>{t.topic}</p>
                <p style={{ fontSize: 12, color: '#5C5C5C', margin: '0 0 4px', lineHeight: 1.55, fontFamily: "'DM Sans', sans-serif" }}>{t.why_trending}</p>
                {t.best_angle && <p style={{ fontSize: 12, color: '#2563EB', margin: 0, fontFamily: "'DM Sans', sans-serif" }}>💡 {t.best_angle}</p>}
              </div>
            ))}
          </div>
        </Block>
      )}
      {Array.isArray(data.content_ideas_today) && data.content_ideas_today.length > 0 && (
        <Block title="Post These Today">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {data.content_ideas_today.map((idea, i) => (
              <div key={i} style={{ padding: '12px 14px', background: '#F8F8F8', borderRadius: 8, border: '1px solid #E8E8E8' }}>
                <div style={{ display: 'flex', gap: 6, marginBottom: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                  <Tag label={`CTR ${idea.estimated_ctr}`} color={idea.estimated_ctr === 'HIGH' ? '#0E7C4A' : '#C2410C'} bg={idea.estimated_ctr === 'HIGH' ? '#F0FDF4' : '#FFF7ED'} />
                  {idea.effort_level && <Tag label={idea.effort_level} color="#5C5C5C" />}
                  {idea.format && <span style={{ fontSize: 11, color: '#8C8C8C', fontFamily: "'JetBrains Mono', monospace" }}>{idea.format}</span>}
                </div>
                <p style={{ fontSize: 14, fontWeight: 600, color: '#0A0A0A', margin: '0 0 5px', fontFamily: "'DM Sans', sans-serif" }}>{idea.title}</p>
                {idea.hook && <p style={{ fontSize: 12, color: '#2563EB', margin: '0 0 4px', fontStyle: 'italic', fontFamily: "'DM Sans', sans-serif" }}>"{idea.hook}"</p>}
                {idea.why_now && <p style={{ fontSize: 12, color: '#5C5C5C', margin: 0, fontFamily: "'DM Sans', sans-serif" }}>{idea.why_now}</p>}
              </div>
            ))}
          </div>
        </Block>
      )}
      {data.best_upload_window && (
        <Block title="Best Upload Window">
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 8 }}>
            {data.best_upload_window.date_guidance && <Tag label={data.best_upload_window.date_guidance} color="#0A0A0A" bg="#F0F0F0" />}
            {data.best_upload_window.time_slot && <Tag label={data.best_upload_window.time_slot} color="#0A0A0A" bg="#F0F0F0" />}
          </div>
          {data.best_upload_window.reasoning && <p style={{ fontSize: 13, color: '#5C5C5C', margin: 0, lineHeight: 1.6, fontFamily: "'DM Sans', sans-serif" }}>{data.best_upload_window.reasoning}</p>}
        </Block>
      )}
      {Array.isArray(data.seven_day_prediction) && data.seven_day_prediction.length > 0 && (
        <Block title="7-Day Prediction">
          {data.seven_day_prediction.map((p, i) => (
            <div key={i} style={{ padding: '8px 0', borderBottom: i < data.seven_day_prediction.length - 1 ? '1px solid #F0F0F0' : 'none' }}>
              <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                <span style={{ fontSize: 10, fontWeight: 700, color: '#8C8C8C', fontFamily: "'JetBrains Mono', monospace", paddingTop: 2, flexShrink: 0, minWidth: 60 }}>{p.day_range}</span>
                <div>
                  <p style={{ fontSize: 13, fontWeight: 600, color: '#0A0A0A', margin: '0 0 3px', fontFamily: "'DM Sans', sans-serif" }}>{p.predicted_topic}</p>
                  {p.preparation_action && <p style={{ fontSize: 12, color: '#5C5C5C', margin: 0, fontFamily: "'DM Sans', sans-serif" }}>{p.preparation_action}</p>}
                </div>
              </div>
            </div>
          ))}
        </Block>
      )}
    </div>
  );
}

function TitleBattleResult({ data }) {
  if (!data) return <Prose>No data returned.</Prose>;
  return (
    <div>
      {data.winner && (
        <Block title="🏆 Winner" accent>
          <p style={{ fontSize: 17, fontWeight: 700, color: '#0A0A0A', margin: '0 0 10px', lineHeight: 1.4, fontFamily: "'DM Sans', sans-serif" }}>{data.winner.title}</p>
          {data.winner.why_it_wins && <p style={{ fontSize: 13, color: '#5C5C5C', margin: '0 0 10px', lineHeight: 1.6, fontFamily: "'DM Sans', sans-serif" }}>{data.winner.why_it_wins}</p>}
          {data.winner.ab_test_challenger && <p style={{ fontSize: 12, color: '#8C8C8C', margin: '0 0 10px', fontFamily: "'DM Sans', sans-serif" }}>A/B challenger: <span style={{ color: '#0A0A0A', fontWeight: 600 }}>{data.winner.ab_test_challenger}</span></p>}
          <CopyBtn text={data.winner.title} label="Copy Winning Title" />
        </Block>
      )}
      {Array.isArray(data.title_variants) && data.title_variants.length > 0 && (
        <Block title="All Variants — Ranked">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {data.title_variants.map((t, i) => (
              <div key={i} style={{
                padding: '10px 12px', background: i === 0 ? '#F8F8F8' : '#FFFFFF',
                borderRadius: 8, border: `1px solid ${i === 0 ? '#0A0A0A' : '#E8E8E8'}`,
              }}>
                <div style={{ display: 'flex', gap: 6, marginBottom: 6, alignItems: 'center', flexWrap: 'wrap' }}>
                  <span style={{ background: i === 0 ? '#0A0A0A' : '#F0F0F0', color: i === 0 ? '#fff' : '#5C5C5C', borderRadius: 4, padding: '2px 8px', fontSize: 10, fontWeight: 800, fontFamily: "'JetBrains Mono', monospace" }}>#{t.rank}</span>
                  <Tag label={`CTR ${t.ctr_prediction}`} color={t.ctr_prediction === 'HIGH' ? '#0E7C4A' : '#C2410C'} bg={t.ctr_prediction === 'HIGH' ? '#F0FDF4' : '#FFF7ED'} />
                  {t.framework && <span style={{ fontSize: 10, color: '#8C8C8C', fontFamily: "'JetBrains Mono', monospace", textTransform: 'uppercase', letterSpacing: '0.05em' }}>{t.framework}</span>}
                  {(t.character_count > 0 || t.title?.length > 0) && <span style={{ fontSize: 10, color: '#BCBCBC', fontFamily: "'JetBrains Mono', monospace", marginLeft: 'auto' }}>{t.character_count || t.title?.length} chars</span>}
                </div>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
                  <p style={{ fontSize: 13, fontWeight: i === 0 ? 600 : 400, color: '#0A0A0A', margin: 0, lineHeight: 1.4, flex: 1, fontFamily: "'DM Sans', sans-serif" }}>{t.title}</p>
                  <CopyBtn text={t.title} />
                </div>
                {t.click_psychology && <p style={{ fontSize: 12, color: '#5C5C5C', margin: '6px 0 0', lineHeight: 1.5, fontFamily: "'DM Sans', sans-serif" }}>{t.click_psychology}</p>}
              </div>
            ))}
          </div>
        </Block>
      )}
      {data.title_formula && (
        <Block title="Reusable Formula">
          <Prose>{data.title_formula}</Prose>
        </Block>
      )}
    </div>
  );
}

function ThumbnailBrainResult({ data }) {
  if (!data) return <Prose>No data returned.</Prose>;
  const pc = data.primary_concept;
  return (
    <div>
      {pc && (
        <Block title={`Primary Concept — ${pc.concept_name || ''}`} accent>
          <KV k="Visual" v={pc.visual_description} />
          <KV k="Subject" v={pc.subject} />
          {pc.expression_or_emotion && <KV k="Expression" v={pc.expression_or_emotion} />}
          <KV k="Background" v={pc.background} />
          <KV k="Text Overlay" v={pc.text_overlay} />
          {pc.text_style && <KV k="Text Style" v={pc.text_style} />}
          {pc.visual_hook && <KV k="Visual Hook" v={pc.visual_hook} />}
          {pc.color_palette && (
            <div style={{ padding: '7px 0' }}>
              <p style={{ fontSize: 10, color: '#8C8C8C', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 700, marginBottom: 6, fontFamily: "'JetBrains Mono', monospace" }}>Colour Palette</p>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {Object.entries(pc.color_palette).filter(([k]) => k !== 'contrast_score').map(([k, v]) => (
                  <span key={k} style={{ fontSize: 12, color: '#5C5C5C', fontFamily: "'DM Sans', sans-serif" }}><span style={{ color: '#8C8C8C' }}>{k}:</span> {v}</span>
                ))}
                {pc.color_palette.contrast_score && <Tag label={`Contrast: ${pc.color_palette.contrast_score}`} color="#0A0A0A" />}
              </div>
            </div>
          )}
          {pc.ai_image_prompt && (
            <div style={{ marginTop: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontSize: 10, color: '#0A0A0A', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 700, fontFamily: "'JetBrains Mono', monospace" }}>AI Image Prompt</span>
                <CopyBtn text={pc.ai_image_prompt} label="Copy Prompt" />
              </div>
              <Prose>{pc.ai_image_prompt}</Prose>
            </div>
          )}
        </Block>
      )}
      {data.variant_b && (
        <Block title={`Variant B — ${data.variant_b.concept_name || ''}`}>
          {data.variant_b.visual_description && <p style={{ fontSize: 13, color: '#5C5C5C', margin: '0 0 10px', lineHeight: 1.6, fontFamily: "'DM Sans', sans-serif" }}>{data.variant_b.visual_description}</p>}
          <KV k="Text Overlay" v={data.variant_b.text_overlay} />
          {data.variant_b.key_difference && <KV k="Use When" v={data.variant_b.key_difference} />}
          {data.variant_b.ai_image_prompt && (
            <div style={{ marginTop: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontSize: 10, color: '#0A0A0A', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 700, fontFamily: "'JetBrains Mono', monospace" }}>AI Prompt (Variant B)</span>
                <CopyBtn text={data.variant_b.ai_image_prompt} />
              </div>
              <Prose>{data.variant_b.ai_image_prompt}</Prose>
            </div>
          )}
        </Block>
      )}
      {data.split_test_strategy && <Block title="A/B Test Strategy"><Prose>{data.split_test_strategy}</Prose></Block>}
      {data.avoid && <Block title="What to Avoid" danger><Prose>{data.avoid}</Prose></Block>}
      {data.mobile_check && <Block title="Mobile (120px) Check"><Prose>{data.mobile_check}</Prose></Block>}
    </div>
  );
}

function HookUpgraderResult({ data }) {
  if (!data) return <Prose>No data returned.</Prose>;
  return (
    <div>
      {data.diagnosis && (
        <Block title="Diagnosis — Why Your Hook Was Weak" danger>
          <div style={{ display: 'flex', gap: 6, marginBottom: 10, flexWrap: 'wrap' }}>
            <Tag label={data.diagnosis.weakness_type} color="#DC2626" bg="#FEF2F2" />
            {data.diagnosis.estimated_retention_loss && <Tag label={`${data.diagnosis.estimated_retention_loss} viewers lost`} color="#DC2626" bg="#FEF2F2" />}
          </div>
          {data.diagnosis.core_problem && <p style={{ fontSize: 13, color: '#5C5C5C', margin: '0 0 8px', lineHeight: 1.6, fontFamily: "'DM Sans', sans-serif" }}>{data.diagnosis.core_problem}</p>}
          {data.diagnosis.missing_element && <p style={{ fontSize: 12, color: '#8C8C8C', margin: 0, fontFamily: "'DM Sans', sans-serif" }}>Missing: {data.diagnosis.missing_element}</p>}
        </Block>
      )}
      {data.winner && (
        <Block title="🏆 Winning Upgrade" accent>
          <p style={{ fontSize: 16, fontWeight: 600, color: '#0A0A0A', margin: '0 0 10px', lineHeight: 1.4, borderLeft: '3px solid #0A0A0A', paddingLeft: 12, fontFamily: "'DM Sans', sans-serif" }}>{data.winner.hook_text}</p>
          {data.winner.why_it_wins && <p style={{ fontSize: 13, color: '#5C5C5C', margin: '0 0 8px', lineHeight: 1.6, fontFamily: "'DM Sans', sans-serif" }}>{data.winner.why_it_wins}</p>}
          {data.winner.delivery_note && <p style={{ fontSize: 12, color: '#8C8C8C', margin: '0 0 10px', lineHeight: 1.5, fontFamily: "'DM Sans', sans-serif" }}>🎙 {data.winner.delivery_note}</p>}
          <CopyBtn text={data.winner.hook_text} label="Copy Hook" />
        </Block>
      )}
      {Array.isArray(data.upgrades) && data.upgrades.length > 0 && (
        <Block title="All 5 Upgrades">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {data.upgrades.map((u, i) => (
              <div key={i} style={{ padding: '12px 14px', background: i === 0 ? '#F8F8F8' : '#FFFFFF', borderRadius: 8, border: `1px solid ${i === 0 ? '#0A0A0A' : '#E8E8E8'}` }}>
                <div style={{ display: 'flex', gap: 6, marginBottom: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                  <span style={{ background: i === 0 ? '#0A0A0A' : '#F0F0F0', color: i === 0 ? '#fff' : '#5C5C5C', borderRadius: 4, padding: '2px 7px', fontSize: 10, fontWeight: 800, fontFamily: "'JetBrains Mono', monospace" }}>#{u.rank}</span>
                  <Tag label={u.trigger} color="#0A0A0A" />
                  <Tag label={`CTR ${u.ctr_prediction}`} color={u.ctr_prediction === 'HIGH' ? '#0E7C4A' : '#C2410C'} bg={u.ctr_prediction === 'HIGH' ? '#F0FDF4' : '#FFF7ED'} />
                  {u.word_count > 0 && <span style={{ fontSize: 11, color: '#BCBCBC', marginLeft: 'auto', fontFamily: "'JetBrains Mono', monospace" }}>{u.word_count}w</span>}
                </div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start', justifyContent: 'space-between' }}>
                  <p style={{ fontSize: 14, fontWeight: 600, color: '#0A0A0A', margin: '0 0 6px', lineHeight: 1.4, flex: 1, fontFamily: "'DM Sans', sans-serif" }}>{u.hook_text}</p>
                  <CopyBtn text={u.hook_text} />
                </div>
                {u.psychology && <p style={{ fontSize: 12, color: '#5C5C5C', margin: 0, lineHeight: 1.5, fontFamily: "'DM Sans', sans-serif" }}>{u.psychology}</p>}
              </div>
            ))}
          </div>
        </Block>
      )}
      {data.hook_formula && <Block title="Reusable Formula"><Prose>{data.hook_formula}</Prose></Block>}
    </div>
  );
}

function CommentReplyResult({ data }) {
  if (!data) return <Prose>No data returned.</Prose>;
  const typeColor = { PRAISE: '#0E7C4A', QUESTION: '#2563EB', CRITICISM: '#DC2626', DEBATE: '#C2410C', PIN_WORTHY: '#0A0A0A' };
  const typeBg    = { PRAISE: '#F0FDF4', QUESTION: '#EFF6FF', CRITICISM: '#FEF2F2', DEBATE: '#FFF7ED', PIN_WORTHY: '#F0F0F0' };
  return (
    <div>
      {data.pin_recommendation && (
        <Block title="📌 Pin This Comment" accent>
          <p style={{ fontSize: 13, color: '#5C5C5C', margin: 0, lineHeight: 1.6, fontFamily: "'DM Sans', sans-serif" }}>{data.pin_recommendation.reason}</p>
        </Block>
      )}
      {Array.isArray(data.replies) && data.replies.map((r, i) => (
        <div key={i} style={{ border: `1px solid ${data.pin_recommendation?.comment_number === r.comment_number ? '#0A0A0A' : '#E8E8E8'}`, borderRadius: 10, marginBottom: 12, overflow: 'hidden' }}>
          <div style={{ padding: '9px 14px', background: '#F8F8F8', borderBottom: '1px solid #E8E8E8', display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
            <span style={{ fontSize: 10, color: '#8C8C8C', fontWeight: 600, fontFamily: "'JetBrains Mono', monospace" }}>#{r.comment_number}</span>
            {r.comment_type && <Tag label={r.comment_type} color={typeColor[r.comment_type] || '#5C5C5C'} bg={typeBg[r.comment_type] || '#F0F0F0'} />}
            {data.pin_recommendation?.comment_number === r.comment_number && <Tag label="PIN" color="#0A0A0A" />}
          </div>
          <div style={{ padding: 14 }}>
            {r.original_comment && <p style={{ fontSize: 12, color: '#8C8C8C', margin: '0 0 10px', fontStyle: 'italic', lineHeight: 1.5, fontFamily: "'DM Sans', sans-serif" }}>"{r.original_comment}"</p>}
            <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', justifyContent: 'space-between' }}>
              <p style={{ fontSize: 14, color: '#0A0A0A', margin: '0 0 8px', lineHeight: 1.6, flex: 1, fontFamily: "'DM Sans', sans-serif" }}>{r.reply}</p>
              <CopyBtn text={r.reply} />
            </div>
            {r.follow_up_question && <p style={{ fontSize: 12, color: '#2563EB', margin: 0, fontFamily: "'DM Sans', sans-serif" }}>💭 {r.follow_up_question}</p>}
          </div>
        </div>
      ))}
      {data.engagement_summary && <Block title="Engagement Summary"><Prose>{data.engagement_summary}</Prose></Block>}
      {data.content_signal && (
        <Block title="Content Signal from Comments">
          <p style={{ fontSize: 13, color: '#0A0A0A', margin: 0, lineHeight: 1.6, fontFamily: "'DM Sans', sans-serif" }}>{data.content_signal}</p>
        </Block>
      )}
    </div>
  );
}

function CompetitorAutopsyResult({ data }) {
  if (!data) return <Prose>No data returned.</Prose>;
  return (
    <div>
      {data.content_patterns && (
        <Block title="Content Patterns">
          <KV k="Dominant Format" v={data.content_patterns.dominant_format} />
          <KV k="Avg Length" v={data.content_patterns.avg_content_length} />
          <KV k="Upload Cadence" v={data.content_patterns.upload_cadence} />
          <KV k="Series Strategy" v={data.content_patterns.series_vs_standalone} />
          <KV k="Evergreen vs Trend" v={data.content_patterns.evergreen_vs_trending} />
          {Array.isArray(data.content_patterns.topic_clusters) && data.content_patterns.topic_clusters.length > 0 && (
            <div style={{ padding: '7px 0' }}>
              <p style={{ fontSize: 10, color: '#8C8C8C', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 700, marginBottom: 6, fontFamily: "'JetBrains Mono', monospace" }}>Topic Clusters</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                {data.content_patterns.topic_clusters.map((t, i) => <Tag key={i} label={t} color="#0A0A0A" />)}
              </div>
            </div>
          )}
        </Block>
      )}
      {data.hook_formula && (
        <Block title="Their Hook Formula">
          <KV k="Title Pattern" v={data.hook_formula.title_pattern} />
          <KV k="Thumbnail Formula" v={data.hook_formula.thumbnail_formula} />
          <KV k="Opening Style" v={data.hook_formula.opening_hook_style} />
          <KV k="CTR Drivers" v={data.hook_formula.ctr_drivers} />
        </Block>
      )}
      {Array.isArray(data.content_gaps) && data.content_gaps.length > 0 && (
        <Block title="Content Gaps You Can Exploit" accent>
          {data.content_gaps.map((g, i) => (
            <div key={i} style={{ padding: '12px 0', borderBottom: i < data.content_gaps.length - 1 ? '1px solid #F0F0F0' : 'none' }}>
              <div style={{ display: 'flex', gap: 6, marginBottom: 6, flexWrap: 'wrap' }}>
                <Tag label={`Opportunity: ${g.opportunity_size}`} color={g.opportunity_size === 'HIGH' ? '#0E7C4A' : '#C2410C'} bg={g.opportunity_size === 'HIGH' ? '#F0FDF4' : '#FFF7ED'} />
              </div>
              <p style={{ fontSize: 13, fontWeight: 600, color: '#0A0A0A', margin: '0 0 4px', fontFamily: "'DM Sans', sans-serif" }}>{g.gap}</p>
              <p style={{ fontSize: 12, color: '#5C5C5C', margin: '0 0 4px', lineHeight: 1.5, fontFamily: "'DM Sans', sans-serif" }}>{g.why_they_missed_it}</p>
              <p style={{ fontSize: 12, color: '#2563EB', margin: 0, fontFamily: "'DM Sans', sans-serif" }}>▶ {g.how_to_exploit}</p>
            </div>
          ))}
        </Block>
      )}
      {Array.isArray(data.weaknesses) && data.weaknesses.length > 0 && (
        <Block title="Their Weaknesses">
          {data.weaknesses.map((w, i) => (
            <div key={i} style={{ padding: '10px 0', borderBottom: i < data.weaknesses.length - 1 ? '1px solid #F0F0F0' : 'none' }}>
              <p style={{ fontSize: 13, fontWeight: 600, color: '#DC2626', margin: '0 0 4px', fontFamily: "'DM Sans', sans-serif" }}>{w.weakness}</p>
              <p style={{ fontSize: 12, color: '#5C5C5C', margin: '0 0 4px', lineHeight: 1.5, fontFamily: "'DM Sans', sans-serif" }}>{w.evidence}</p>
              <p style={{ fontSize: 12, color: '#2563EB', margin: 0, fontFamily: "'DM Sans', sans-serif" }}>▶ {w.exploit_strategy}</p>
            </div>
          ))}
        </Block>
      )}
      {data.battle_plan && (
        <Block title="Your Battle Plan" accent>
          {data.battle_plan.differentiation_angle && <p style={{ fontSize: 13, color: '#0A0A0A', margin: '0 0 14px', lineHeight: 1.6, fontWeight: 600, fontFamily: "'DM Sans', sans-serif" }}>{data.battle_plan.differentiation_angle}</p>}
          {Array.isArray(data.battle_plan.first_3_videos) && data.battle_plan.first_3_videos.length > 0 && (
            <>
              <p style={{ fontSize: 10, color: '#8C8C8C', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700, marginBottom: 8, fontFamily: "'JetBrains Mono', monospace" }}>First 3 Videos to Make</p>
              {data.battle_plan.first_3_videos.map((v, i) => (
                <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 6 }}>
                  <span style={{ background: '#0A0A0A', color: '#fff', borderRadius: 4, padding: '2px 8px', fontSize: 10, fontWeight: 800, flexShrink: 0, fontFamily: "'JetBrains Mono', monospace" }}>V{i + 1}</span>
                  <p style={{ fontSize: 13, color: '#0A0A0A', margin: 0, lineHeight: 1.4, fontFamily: "'DM Sans', sans-serif" }}>{v}</p>
                </div>
              ))}
            </>
          )}
          {data.battle_plan.timeline_to_compete && <p style={{ fontSize: 12, color: '#8C8C8C', marginTop: 12, margin: 0, fontFamily: "'DM Sans', sans-serif" }}>Timeline: {data.battle_plan.timeline_to_compete}</p>}
        </Block>
      )}
    </div>
  );
}

function ViralDecoderResult({ data }) {
  if (!data) return <Prose>No data returned.</Prose>;
  return (
    <div>
      {data.viral_verdict && (
        <Block title="Viral Verdict" accent>
          <p style={{ fontSize: 15, color: '#0A0A0A', fontWeight: 600, margin: 0, lineHeight: 1.5, fontFamily: "'DM Sans', sans-serif" }}>{data.viral_verdict}</p>
        </Block>
      )}
      {data.algorithm_analysis && (
        <Block title="Algorithm Analysis">
          <KV k="Distribution Trigger" v={data.algorithm_analysis.initial_distribution_trigger} />
          <KV k="Key Metric Driver" v={data.algorithm_analysis.key_metric_driver} />
          <KV k="Distribution Pattern" v={data.algorithm_analysis.distribution_pattern} />
          <KV k="Timing Factor" v={data.algorithm_analysis.timing_factor} />
        </Block>
      )}
      {Array.isArray(data.psychological_autopsy) && data.psychological_autopsy.length > 0 && (
        <Block title="Psychological Triggers Decoded">
          {data.psychological_autopsy.map((p, i) => (
            <div key={i} style={{ padding: '10px 0', borderBottom: i < data.psychological_autopsy.length - 1 ? '1px solid #F0F0F0' : 'none' }}>
              <div style={{ display: 'flex', gap: 6, marginBottom: 5, flexWrap: 'wrap' }}>
                <Tag label={p.trigger} color="#0A0A0A" />
                <Tag label={p.strength} color={p.strength === 'HIGH' ? '#0E7C4A' : '#5C5C5C'} bg={p.strength === 'HIGH' ? '#F0FDF4' : '#F0F0F0'} />
                {p.where_it_appears && <span style={{ fontSize: 11, color: '#8C8C8C', fontFamily: "'JetBrains Mono', monospace" }}>in {p.where_it_appears}</span>}
              </div>
              <p style={{ fontSize: 13, color: '#5C5C5C', margin: 0, lineHeight: 1.5, fontFamily: "'DM Sans', sans-serif" }}>{p.mechanism}</p>
            </div>
          ))}
        </Block>
      )}
      {data.replication_blueprint && (
        <Block title="Replication Blueprint" accent>
          {data.replication_blueprint.core_formula && (
            <p style={{ fontSize: 13, color: '#5C5C5C', margin: '0 0 14px', lineHeight: 1.6, fontStyle: 'italic', fontFamily: "'DM Sans', sans-serif" }}>Formula: {data.replication_blueprint.core_formula}</p>
          )}
          {[1, 2, 3].map(n => {
            const idea = data.replication_blueprint[`video_idea_${n}`];
            if (!idea) return null;
            return (
              <div key={n} style={{ padding: 12, background: '#F8F8F8', borderRadius: 8, border: '1px solid #E8E8E8', marginBottom: 10 }}>
                <Tag label={`IDEA ${n}`} color="#0A0A0A" />
                {idea.title && <p style={{ fontSize: 14, fontWeight: 600, color: '#0A0A0A', margin: '8px 0 4px', fontFamily: "'DM Sans', sans-serif" }}>{idea.title}</p>}
                {idea.hook && <p style={{ fontSize: 12, color: '#2563EB', margin: '0 0 6px', fontStyle: 'italic', fontFamily: "'DM Sans', sans-serif" }}>"{idea.hook}"</p>}
                {idea.why_it_replicates && <p style={{ fontSize: 12, color: '#8C8C8C', margin: 0, fontFamily: "'DM Sans', sans-serif" }}>{idea.why_it_replicates}</p>}
              </div>
            );
          })}
          {data.replication_blueprint.what_not_to_copy && (
            <p style={{ fontSize: 12, color: '#DC2626', margin: '8px 0 0', lineHeight: 1.5, fontFamily: "'DM Sans', sans-serif" }}>⚠ Don't copy: {data.replication_blueprint.what_not_to_copy}</p>
          )}
        </Block>
      )}
      {data.odds_of_replication && (
        <Block title="Odds of Replication">
          <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 10 }}>
            <span style={{ fontFamily: "'Playfair Display', serif", fontSize: 36, fontWeight: 800, color: '#0A0A0A', lineHeight: 1 }}>{data.odds_of_replication.score}/10</span>
            <div>
              {data.odds_of_replication.main_barrier && <p style={{ fontSize: 12, color: '#DC2626', margin: '0 0 3px', fontFamily: "'DM Sans', sans-serif" }}>Barrier: {data.odds_of_replication.main_barrier}</p>}
              {data.odds_of_replication.your_advantage && <p style={{ fontSize: 12, color: '#0E7C4A', margin: 0, fontFamily: "'DM Sans', sans-serif" }}>Your edge: {data.odds_of_replication.your_advantage}</p>}
            </div>
          </div>
        </Block>
      )}
    </div>
  );
}

function ChannelStrategyResult({ data }) {
  if (!data) return <Prose>No data returned.</Prose>;
  return (
    <div>
      {data.channel_brief_summary && (
        <Block title="Channel Assessment" accent>
          <p style={{ fontSize: 14, color: '#5C5C5C', margin: 0, lineHeight: 1.7, fontFamily: "'DM Sans', sans-serif" }}>{data.channel_brief_summary}</p>
        </Block>
      )}
      {Array.isArray(data.content_pillars) && data.content_pillars.length > 0 && (
        <Block title="Your 3 Content Pillars">
          {data.content_pillars.map((p, i) => (
            <div key={i} style={{ padding: '12px 0', borderBottom: i < data.content_pillars.length - 1 ? '1px solid #F0F0F0' : 'none' }}>
              <p style={{ fontSize: 14, fontWeight: 700, color: '#0A0A0A', margin: '0 0 4px', fontFamily: "'DM Sans', sans-serif" }}>{p.pillar_name}</p>
              <p style={{ fontSize: 13, color: '#5C5C5C', margin: '0 0 6px', lineHeight: 1.5, fontFamily: "'DM Sans', sans-serif" }}>{p.description}</p>
              {p.audience_need && <p style={{ fontSize: 12, color: '#8C8C8C', margin: '0 0 6px', fontFamily: "'DM Sans', sans-serif" }}>Audience need: {p.audience_need}</p>}
              {Array.isArray(p.example_titles) && p.example_titles.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                  {p.example_titles.map((t, ti) => (
                    <span key={ti} style={{ fontSize: 12, color: '#5C5C5C', paddingLeft: 10, borderLeft: '2px solid #E8E8E8', lineHeight: 1.4, fontFamily: "'DM Sans', sans-serif" }}>{t}</span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </Block>
      )}
      {Array.isArray(data.roadmap) && data.roadmap.length > 0 && (
        <Block title="90-Day Roadmap">
          {data.roadmap.map((phase, i) => (
            <div key={i} style={{ marginBottom: i < data.roadmap.length - 1 ? 20 : 0 }}>
              <div style={{ display: 'flex', gap: 8, marginBottom: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                <span style={{ background: '#0A0A0A', color: '#fff', borderRadius: 5, padding: '3px 10px', fontSize: 10, fontWeight: 800, fontFamily: "'JetBrains Mono', monospace" }}>Phase {phase.phase} — {phase.month}</span>
                {phase.theme && <span style={{ fontSize: 12, color: '#8C8C8C', fontFamily: "'DM Sans', sans-serif" }}>{phase.theme}</span>}
              </div>
              <p style={{ fontSize: 13, fontWeight: 600, color: '#0A0A0A', margin: '0 0 6px', fontFamily: "'DM Sans', sans-serif" }}>{phase.objective}</p>
              {phase.milestone && <p style={{ fontSize: 12, color: '#0E7C4A', margin: '0 0 8px', fontFamily: "'DM Sans', sans-serif" }}>🎯 Milestone: {phase.milestone}</p>}
              {phase.weekly_targets && (
                <div style={{ display: 'flex', gap: 12, marginBottom: 10, flexWrap: 'wrap' }}>
                  {Object.entries(phase.weekly_targets).map(([k, v]) => (
                    <div key={k} style={{ textAlign: 'center', background: '#F8F8F8', border: '1px solid #E8E8E8', borderRadius: 6, padding: '8px 12px' }}>
                      <span style={{ display: 'block', fontFamily: "'Playfair Display', serif", fontSize: 20, fontWeight: 800, color: '#0A0A0A' }}>{v}</span>
                      <span style={{ fontSize: 10, color: '#8C8C8C', textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: "'JetBrains Mono', monospace" }}>{k.replace(/_/g, ' ')}</span>
                    </div>
                  ))}
                </div>
              )}
              {Array.isArray(phase.first_5_content_pieces) && phase.first_5_content_pieces.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <span style={{ fontSize: 10, color: '#8C8C8C', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700, fontFamily: "'JetBrains Mono', monospace" }}>First 5 Videos</span>
                  {phase.first_5_content_pieces.map((t, ti) => (
                    <span key={ti} style={{ fontSize: 12, color: '#5C5C5C', paddingLeft: 10, borderLeft: '2px solid #E8E8E8', lineHeight: 1.4, fontFamily: "'DM Sans', sans-serif" }}>{t}</span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </Block>
      )}
      {data.subscriber_projections && (
        <Block title="Subscriber Projections">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 10 }}>
            {[['End Month 1', data.subscriber_projections.end_of_month_1], ['End Month 2', data.subscriber_projections.end_of_month_2], ['End Month 3', data.subscriber_projections.end_of_month_3]].map(([k, v]) => (
              <div key={k} style={{ textAlign: 'center', background: '#F8F8F8', borderRadius: 8, padding: 12, border: '1px solid #E8E8E8' }}>
                <span style={{ display: 'block', fontFamily: "'Playfair Display', serif", fontSize: 18, fontWeight: 800, color: '#0A0A0A', marginBottom: 2 }}>{v || '—'}</span>
                <span style={{ fontSize: 10, color: '#8C8C8C', fontFamily: "'JetBrains Mono', monospace" }}>{k}</span>
              </div>
            ))}
          </div>
          {data.subscriber_projections.assumptions && <p style={{ fontSize: 12, color: '#8C8C8C', margin: 0, fontFamily: "'DM Sans', sans-serif" }}>{data.subscriber_projections.assumptions}</p>}
        </Block>
      )}
      {data.biggest_risk && <Block title="Biggest Risk" danger><Prose>{data.biggest_risk}</Prose></Block>}
    </div>
  );
}

function MonetisationCoachResult({ data }) {
  if (!data) return <Prose>No data returned.</Prose>;
  return (
    <div>
      {data.channel_snapshot && (
        <Block title="Readiness Assessment" accent>
          <p style={{ fontSize: 14, color: '#5C5C5C', margin: 0, lineHeight: 1.7, fontFamily: "'DM Sans', sans-serif" }}>{data.channel_snapshot}</p>
        </Block>
      )}
      {data.cpm_analysis && (
        <Block title="CPM & Revenue Map">
          <KV k="CPM Range" v={data.cpm_analysis.niche_cpm_range} />
          <KV k="Estimated RPM" v={data.cpm_analysis.estimated_rpm} />
          <KV k="CPM Peak Season" v={data.cpm_analysis.seasonal_cpm_peaks} />
          <KV k="Geography Note" v={data.cpm_analysis.geography_note} />
          <KV k="AdSense Status" v={data.cpm_analysis.adsense_eligibility_note} />
        </Block>
      )}
      {Array.isArray(data.affiliate_matches) && data.affiliate_matches.length > 0 && (
        <Block title="Top Affiliate Matches">
          {data.affiliate_matches.map((a, i) => (
            <div key={i} style={{ padding: '12px 0', borderBottom: i < data.affiliate_matches.length - 1 ? '1px solid #F0F0F0' : 'none' }}>
              <div style={{ display: 'flex', gap: 8, marginBottom: 6, alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap' }}>
                <p style={{ fontSize: 14, fontWeight: 700, color: '#0A0A0A', margin: 0, fontFamily: "'DM Sans', sans-serif" }}>{a.program_name}</p>
                <span style={{ fontSize: 13, color: '#0E7C4A', fontWeight: 700, fontFamily: "'JetBrains Mono', monospace" }}>{a.commission_rate}</span>
              </div>
              {a.platform && <p style={{ fontSize: 12, color: '#8C8C8C', margin: '0 0 4px', fontFamily: "'DM Sans', sans-serif" }}>Platform: {a.platform} · Avg order: {a.avg_order_value}</p>}
              {a.audience_fit && <p style={{ fontSize: 12, color: '#5C5C5C', margin: '0 0 4px', lineHeight: 1.5, fontFamily: "'DM Sans', sans-serif" }}>{a.audience_fit}</p>}
              {a.estimated_monthly_earnings && <p style={{ fontSize: 12, color: '#2563EB', margin: 0, fontFamily: "'DM Sans', sans-serif" }}>Est. {a.estimated_monthly_earnings}/month · {a.promo_angle}</p>}
            </div>
          ))}
        </Block>
      )}
      {data.sponsor_pitch_email && (
        <Block title="Sponsor Pitch Email" accent>
          {data.sponsor_pitch_email.subject_line && <p style={{ fontSize: 12, color: '#8C8C8C', margin: '0 0 8px', fontFamily: "'DM Sans', sans-serif" }}>Subject: <span style={{ color: '#0A0A0A', fontWeight: 600 }}>{data.sponsor_pitch_email.subject_line}</span></p>}
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 8 }}>
            <CopyBtn text={data.sponsor_pitch_email.body} label="Copy Email" />
          </div>
          <Prose>{data.sponsor_pitch_email.body}</Prose>
          {data.sponsor_pitch_email.follow_up_template && <p style={{ fontSize: 12, color: '#8C8C8C', marginTop: 10, marginBottom: 0, fontFamily: "'DM Sans', sans-serif" }}>Follow-up (Day 5): <span style={{ color: '#5C5C5C' }}>{data.sponsor_pitch_email.follow_up_template}</span></p>}
        </Block>
      )}
      {Array.isArray(data.revenue_projections) && data.revenue_projections.length > 0 && (
        <Block title="Revenue Projections">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {data.revenue_projections.map((r, i) => (
              <div key={i} style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr 1.2fr', gap: 8, padding: '10px 12px', background: '#F8F8F8', borderRadius: 8, border: '1px solid #E8E8E8', alignItems: 'center' }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: '#0A0A0A', fontFamily: "'JetBrains Mono', monospace" }}>{r.milestone}</span>
                <div style={{ textAlign: 'center' }}>
                  <span style={{ fontSize: 9, color: '#8C8C8C', display: 'block', marginBottom: 1, fontFamily: "'JetBrains Mono', monospace" }}>AdSense</span>
                  <span style={{ fontSize: 12, color: '#5C5C5C', fontWeight: 600, fontFamily: "'DM Sans', sans-serif" }}>{r.monthly_adsense}</span>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <span style={{ fontSize: 9, color: '#8C8C8C', display: 'block', marginBottom: 1, fontFamily: "'JetBrains Mono', monospace" }}>Affiliate</span>
                  <span style={{ fontSize: 12, color: '#5C5C5C', fontWeight: 600, fontFamily: "'DM Sans', sans-serif" }}>{r.monthly_affiliate}</span>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: 9, color: '#8C8C8C', display: 'block', marginBottom: 1, fontFamily: "'JetBrains Mono', monospace" }}>Total</span>
                  <span style={{ fontSize: 13, color: '#0E7C4A', fontWeight: 800, fontFamily: "'DM Sans', sans-serif" }}>{r.total_monthly}</span>
                </div>
              </div>
            ))}
          </div>
        </Block>
      )}
    </div>
  );
}

function ScriptLocaliserResult({ data }) {
  if (!data) return <Prose>No data returned.</Prose>;
  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 14 }}>
        {[['Original Words', data.original_word_count, '#8C8C8C'], ['Localised Words', data.localised_word_count, '#0E7C4A'], ['Language', data.target_language, '#2563EB']].map(([k, v, c]) => (
          <div key={k} style={{ background: '#F8F8F8', border: '1px solid #E8E8E8', borderRadius: 8, padding: '12px', textAlign: 'center' }}>
            <span style={{ display: 'block', fontFamily: "'Playfair Display', serif", fontSize: v && String(v).length <= 4 ? 24 : 18, fontWeight: 800, color: c, marginBottom: 2 }}>{v || '—'}</span>
            <span style={{ fontSize: 9, color: '#8C8C8C', textTransform: 'uppercase', letterSpacing: '0.06em', fontFamily: "'JetBrains Mono', monospace" }}>{k}</span>
          </div>
        ))}
      </div>
      {data.localised_script && (
        <Block title="Localised Script" accent>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 10 }}>
            <CopyBtn text={data.localised_script} label="Copy Script" />
          </div>
          <div style={{ maxHeight: 400, overflowY: 'auto', background: '#F8F8F8', border: '1px solid #E8E8E8', borderRadius: 8, padding: '12px 14px' }}>
            <pre style={{ fontSize: 14, color: '#0A0A0A', lineHeight: 1.85, whiteSpace: 'pre-wrap', margin: 0, fontFamily: "'DM Sans', sans-serif" }}>{data.localised_script}</pre>
          </div>
        </Block>
      )}
      {data.hook_adaptation && (
        <Block title="Hook Adaptation">
          {data.hook_adaptation.original_hook && <p style={{ fontSize: 12, color: '#8C8C8C', margin: '0 0 6px', fontFamily: "'DM Sans', sans-serif" }}>Original: <span style={{ color: '#5C5C5C' }}>{data.hook_adaptation.original_hook}</span></p>}
          {data.hook_adaptation.localised_hook && <p style={{ fontSize: 14, fontWeight: 600, color: '#0A0A0A', margin: '0 0 8px', lineHeight: 1.4, fontFamily: "'DM Sans', sans-serif" }}>{data.hook_adaptation.localised_hook}</p>}
          {data.hook_adaptation.adaptation_notes && <p style={{ fontSize: 12, color: '#5C5C5C', margin: 0, lineHeight: 1.5, fontFamily: "'DM Sans', sans-serif" }}>{data.hook_adaptation.adaptation_notes}</p>}
        </Block>
      )}
      {Array.isArray(data.cultural_adaptations) && data.cultural_adaptations.length > 0 && (
        <Block title="Cultural Adaptations">
          {data.cultural_adaptations.map((a, i) => (
            <div key={i} style={{ padding: '8px 0', borderBottom: i < data.cultural_adaptations.length - 1 ? '1px solid #F0F0F0' : 'none' }}>
              <div style={{ display: 'flex', gap: 8, marginBottom: 3, flexWrap: 'wrap', alignItems: 'center' }}>
                <span style={{ fontSize: 12, color: '#DC2626', textDecoration: 'line-through', fontFamily: "'DM Sans', sans-serif" }}>{a.original}</span>
                <span style={{ fontSize: 12, color: '#8C8C8C' }}>→</span>
                <span style={{ fontSize: 12, color: '#0E7C4A', fontWeight: 600, fontFamily: "'DM Sans', sans-serif" }}>{a.localised}</span>
              </div>
              {a.reason && <p style={{ fontSize: 11, color: '#8C8C8C', margin: 0, fontFamily: "'DM Sans', sans-serif" }}>{a.reason}</p>}
            </div>
          ))}
        </Block>
      )}
      {data.tone_notes && <Block title="Tone Notes"><Prose>{data.tone_notes}</Prose></Block>}
      {data.recording_notes && <Block title="Recording Notes"><Prose>{data.recording_notes}</Prose></Block>}
    </div>
  );
}

const RESULT_COMPONENTS = {
  'trend-spy':          TrendSpyResult,
  'title-battle':       TitleBattleResult,
  'thumbnail-brain':    ThumbnailBrainResult,
  'hook-upgrader':      HookUpgraderResult,
  'comment-reply':      CommentReplyResult,
  'competitor-autopsy': CompetitorAutopsyResult,
  'viral-decoder':      ViralDecoderResult,
  'channel-strategy':   ChannelStrategyResult,
  'monetisation-coach': MonetisationCoachResult,
  'script-localiser':   ScriptLocaliserResult,
};

// ── Agent Form ─────────────────────────────────────────────────────────────────
function AgentForm({ agent, onSubmit, isRunning }) {
  const [values, setValues] = useState({});
  function set(key, val) { setValues(prev => ({ ...prev, [key]: val })); }
  function handleSubmit(e) { e.preventDefault(); onSubmit({ agentId: agent.id, ...values }); }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {agent.fields.map(field => (
        <div key={field.key} style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
          <label style={{ fontSize: 11, fontWeight: 700, color: '#0A0A0A', textTransform: 'uppercase', letterSpacing: '0.06em', fontFamily: "'DM Sans', sans-serif" }}>
            {field.label} {field.required && <span style={{ color: '#DC2626' }}>*</span>}
          </label>
          {field.type === 'textarea' ? (
            <textarea
              rows={field.rows || 4}
              style={{ ...inputStyle, resize: 'vertical' }}
              placeholder={field.placeholder || ''}
              value={values[field.key] || ''}
              onChange={e => set(field.key, e.target.value)}
              required={field.required}
              disabled={isRunning}
            />
          ) : field.type === 'select' ? (
            <select
              style={selectStyle}
              value={values[field.key] || (field.options && field.options[0]) || ''}
              onChange={e => set(field.key, e.target.value)}
              disabled={isRunning}
            >
              {(field.options || []).map(o => <option key={o} value={o}>{o}</option>)}
            </select>
          ) : (
            <input
              type="text"
              style={inputStyle}
              placeholder={field.placeholder || ''}
              value={values[field.key] || ''}
              onChange={e => set(field.key, e.target.value)}
              required={field.required}
              disabled={isRunning}
            />
          )}
        </div>
      ))}
      <button
        type="submit"
        disabled={isRunning}
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          background: isRunning ? '#E8E8E8' : '#0A0A0A', border: 'none', borderRadius: 8,
          padding: '12px 20px', color: isRunning ? '#8C8C8C' : '#fff',
          fontSize: 13, fontWeight: 700, fontFamily: "'DM Sans', sans-serif",
          cursor: isRunning ? 'not-allowed' : 'pointer', transition: 'all 0.2s', marginTop: 4,
        }}
      >
        {isRunning ? <><Spinner size={14} /><span style={{ marginLeft: 8 }}>Running {agent.name}…</span></> : `Run ${agent.name} →`}
      </button>
    </form>
  );
}

const inputStyle = {
  background: '#FFFFFF', border: '1.5px solid #E8E8E8', borderRadius: 8,
  padding: '10px 14px', color: '#0A0A0A', fontSize: 14,
  fontFamily: "'DM Sans', sans-serif", outline: 'none', width: '100%', boxSizing: 'border-box',
};
const selectStyle = {
  ...inputStyle, cursor: 'pointer', appearance: 'none',
  backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%238C8C8C' strokeWidth='1.5' fill='none' strokeLinecap='round'/%3E%3C/svg%3E\")",
  backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center', paddingRight: 36,
};

// ── Main Page ──────────────────────────────────────────────────────────────────
export default function AgentsPage() {
  const router   = useRouter();
  const supabase = getSupabaseBrowser();

  const [user,        setUser]        = useState(null);
  const [usage,       setUsage]       = useState(null);
  const [loading,     setLoading]     = useState(true);
  const [selectedId,  setSelectedId]  = useState(null);
  const [isRunning,   setIsRunning]   = useState(false);
  const [result,      setResult]      = useState(null);
  const [error,       setError]       = useState('');
  const [elapsed,     setElapsed]     = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const timerRef   = useRef(null);
  const resultsRef = useRef(null);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) { router.replace('/login'); return; }
      setUser(session.user);
      const res  = await fetch('/api/usage', { headers: { Authorization: `Bearer ${session.access_token}` } });
      const json = await res.json();
      if (json.success) setUsage(json.usage);
      setLoading(false);
    });
  }, []);

  function startTimer() {
    const t0 = Date.now();
    timerRef.current = setInterval(() => setElapsed(Date.now() - t0), 100);
  }
  function stopTimer() { clearInterval(timerRef.current); }

  async function handleRun(inputs) {
    setError(''); setResult(null); setIsRunning(true); setElapsed(0);
    startTimer();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { router.replace('/login'); return; }

    try {
      const { agentId, ...body } = inputs;
      const res  = await fetch(`/api/agents/${agentId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session.access_token}` },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      stopTimer();
      setIsRunning(false);

      if (!res.ok || !json.success) {
        setError(json.error || 'Agent failed. Please try again.');
        return;
      }

      setResult({ agentId, data: json.data, duration: json.meta?.duration_ms });
      setSidebarOpen(false); // close sidebar on mobile after run
      setTimeout(() => {
        if (resultsRef.current) resultsRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 150);
    } catch (err) {
      stopTimer(); setIsRunning(false);
      setError('Network error. Please check your connection.');
    }
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Spinner size={24} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  const plan     = usage?.plan || 'free';
  const planRank = { free: 0, pro: 1, studio: 2 }[plan] ?? 0;
  const selectedAgent = selectedId ? AGENT_MAP[selectedId] : null;
  const tierRank      = selectedAgent?.tier === 'studio' ? 2 : 1;
  const isLocked      = selectedAgent ? planRank < tierRank : false;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;800&family=DM+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        body { background: #FFFFFF; }

        /* Scrollbar */
        ::-webkit-scrollbar { width: 4px; height: 4px; }
        ::-webkit-scrollbar-track { background: #F5F5F5; }
        ::-webkit-scrollbar-thumb { background: #D0D0D0; border-radius: 4px; }

        /* Input focus ring */
        input:focus, textarea:focus, select:focus {
          border-color: #0A0A0A !important;
          box-shadow: 0 0 0 3px rgba(10,10,10,0.06) !important;
          outline: none;
        }

        /* Sidebar */
        .agents-sidebar {
          width: 240px;
          flex-shrink: 0;
          border-right: 1px solid #E8E8E8;
          background: #FAFAFA;
          display: flex;
          flex-direction: column;
          overflow-y: auto;
          height: 100%;
          transition: transform 0.25s ease;
        }

        @media (max-width: 768px) {
          .agents-sidebar {
            position: fixed;
            top: 0; left: 0; bottom: 0;
            z-index: 200;
            width: 280px;
            transform: translateX(-100%);
            box-shadow: 4px 0 24px rgba(0,0,0,0.12);
          }
          .agents-sidebar.open {
            transform: translateX(0);
          }
          .sidebar-overlay {
            display: block !important;
          }
          .agents-main {
            padding: 24px 16px 80px !important;
          }
          .topbar-agents-btn {
            display: flex !important;
          }
        }

        .sidebar-overlay {
          display: none;
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.3);
          z-index: 199;
        }

        .topbar-agents-btn {
          display: none;
          align-items: center;
          gap: 6px;
          background: #F0F0F0;
          border: 1px solid #E8E8E8;
          border-radius: 7px;
          padding: 7px 12px;
          font-size: 13px;
          font-weight: 600;
          color: #0A0A0A;
          cursor: pointer;
          font-family: 'DM Sans', sans-serif;
        }

        .result-animation {
          animation: fadeIn 0.35s ease both;
        }
      `}</style>

      <div style={{ minHeight: '100vh', background: '#FFFFFF', fontFamily: "'DM Sans', sans-serif", color: '#0A0A0A', display: 'flex', flexDirection: 'column' }}>

        {/* ── Topbar ── */}
        <header style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '0 20px', height: 56, borderBottom: '1px solid #E8E8E8',
          flexShrink: 0, position: 'sticky', top: 0, background: '#FFFFFF', zIndex: 100,
          boxShadow: '0 1px 0 #E8E8E8',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {/* Mobile hamburger */}
            <button
              className="topbar-agents-btn"
              onClick={() => setSidebarOpen(true)}
              aria-label="Open agent menu"
            >
              ☰ Agents
            </button>
            {/* Logo */}
            <div style={{ width: 28, height: 28, background: '#0A0A0A', borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <svg width="13" height="13" viewBox="0 0 20 20" fill="none">
                <polygon points="10,2 17,6 17,14 10,18 3,14 3,6" stroke="#FFFFFF" strokeWidth="1.5" fill="none"/>
                <polygon points="10,6 14,8.5 14,13.5 10,16 6,13.5 6,8.5" fill="#FFFFFF" fillOpacity="0.3"/>
              </svg>
            </div>
            <span style={{ fontFamily: "'Playfair Display', serif", fontSize: 15, fontWeight: 700, color: '#0A0A0A', letterSpacing: '-0.02em' }}>Studio AI</span>
            <span style={{ color: '#E8E8E8', fontSize: 16 }}>/</span>
            <span style={{ fontSize: 13, color: '#8C8C8C', fontWeight: 500 }}>Agents</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {usage && (
              <span style={{ fontSize: 11, color: '#8C8C8C', fontFamily: "'JetBrains Mono', monospace", background: '#F5F5F5', border: '1px solid #E8E8E8', borderRadius: 100, padding: '3px 10px' }}>
                {plan === 'free' ? `Free · ${usage.remaining ?? 0} left` : `${plan}`}
              </span>
            )}
            <button onClick={() => router.push('/generate')} style={{ background: 'none', border: 'none', color: '#8C8C8C', fontSize: 13, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", fontWeight: 500 }}>Generate</button>
            <button onClick={() => router.push('/dashboard')} style={{ background: 'none', border: 'none', color: '#8C8C8C', fontSize: 13, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", fontWeight: 500 }}>Dashboard</button>
            <button
              onClick={async () => { await supabase.auth.signOut(); router.push('/login'); }}
              style={{ background: 'transparent', border: '1px solid #E8E8E8', borderRadius: 6, padding: '6px 12px', color: '#5C5C5C', fontSize: 12, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", fontWeight: 500 }}
            >
              Sign out
            </button>
          </div>
        </header>

        <div style={{ display: 'flex', flex: 1, overflow: 'hidden', minHeight: 0, position: 'relative' }}>

          {/* Overlay for mobile */}
          <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />

          {/* ── Sidebar ── */}
          <aside className={`agents-sidebar ${sidebarOpen ? 'open' : ''}`}>
            {/* Mobile close */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', borderBottom: '1px solid #E8E8E8' }}>
              <p style={{ fontSize: 10, fontWeight: 700, color: '#8C8C8C', textTransform: 'uppercase', letterSpacing: '0.1em', margin: 0 }}>Agent Library</p>
              <button onClick={() => setSidebarOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#8C8C8C', fontSize: 18, lineHeight: 1 }}>✕</button>
            </div>

            {AGENT_GROUPS.map(group => {
              const groupRank = group.tier === 'studio' ? 2 : 1;
              const unlocked  = planRank >= groupRank;
              return (
                <div key={group.tier} style={{ borderBottom: '1px solid #E8E8E8' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 16px 6px' }}>
                    <span style={{ fontSize: 9, fontWeight: 700, color: unlocked ? group.color : '#BCBCBC', textTransform: 'uppercase', letterSpacing: '0.1em', fontFamily: "'JetBrains Mono', monospace" }}>
                      {group.label}
                    </span>
                    {!unlocked && (
                      <span style={{ fontSize: 9, background: '#F0F0F0', border: '1px solid #E8E8E8', borderRadius: 3, padding: '1px 6px', color: '#8C8C8C', fontWeight: 700, fontFamily: "'JetBrains Mono', monospace" }}>
                        {group.tier.toUpperCase()}
                      </span>
                    )}
                  </div>
                  {group.agents.map(agent => {
                    const active = selectedId === agent.id;
                    return (
                      <button
                        key={agent.id}
                        onClick={() => { setSelectedId(agent.id); setResult(null); setError(''); setSidebarOpen(false); }}
                        style={{
                          width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                          padding: '9px 16px', background: active ? '#F0F0F0' : 'transparent',
                          border: 'none', borderLeft: active ? `2px solid ${group.color}` : '2px solid transparent',
                          cursor: 'pointer', transition: 'all 0.15s', textAlign: 'left',
                        }}
                      >
                        <span style={{ fontSize: 15, flexShrink: 0 }}>{agent.icon}</span>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ fontSize: 12, fontWeight: active ? 700 : 500, color: active ? group.color : unlocked ? '#0A0A0A' : '#BCBCBC', margin: 0, fontFamily: "'DM Sans', sans-serif" }}>
                            {agent.name}
                          </p>
                          <p style={{ fontSize: 10, color: '#BCBCBC', margin: 0, lineHeight: 1.3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontFamily: "'DM Sans', sans-serif" }}>
                            {agent.desc.slice(0, 38)}…
                          </p>
                        </div>
                        {!unlocked && <span style={{ fontSize: 10, color: '#BCBCBC' }}>🔒</span>}
                      </button>
                    );
                  })}
                </div>
              );
            })}

            <div style={{ padding: '12px 16px', marginTop: 'auto' }}>
              <button
                onClick={() => router.push('/generate')}
                style={{ width: '100%', background: '#0A0A0A', border: 'none', borderRadius: 8, padding: '10px 14px', color: '#fff', fontSize: 12, fontWeight: 700, fontFamily: "'DM Sans', sans-serif", cursor: 'pointer' }}
              >
                ⚡ Core Pipeline →
              </button>
            </div>
          </aside>

          {/* ── Main workspace ── */}
          <main style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
            {!selectedAgent ? (
              /* Welcome state */
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, padding: '60px 24px', textAlign: 'center' }}>
                <div style={{ fontSize: 40, marginBottom: 16 }}>🤖</div>
                <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 24, fontWeight: 800, color: '#0A0A0A', margin: '0 0 10px', letterSpacing: '-0.03em' }}>Agent Hub</h1>
                <p style={{ fontSize: 14, color: '#8C8C8C', maxWidth: 440, lineHeight: 1.7, margin: '0 0 24px', fontFamily: "'DM Sans', sans-serif" }}>
                  10 specialised AI agents for every phase of your content workflow. Select an agent from the sidebar to get started.
                </p>
                <button
                  className="topbar-agents-btn"
                  style={{ display: 'flex', margin: '0 auto 24px' }}
                  onClick={() => setSidebarOpen(true)}
                >
                  ☰ Browse Agents
                </button>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10, maxWidth: 440, width: '100%' }}>
                  {[
                    { icon: '📡', label: 'Trend Spy', id: 'trend-spy' },
                    { icon: '🥊', label: 'Title Battle', id: 'title-battle' },
                    { icon: '🔬', label: 'Competitor Autopsy', id: 'competitor-autopsy' },
                    { icon: '💰', label: 'Monetisation Coach', id: 'monetisation-coach' },
                  ].map(item => (
                    <div
                      key={item.id}
                      style={{ background: '#FAFAFA', border: '1px solid #E8E8E8', borderRadius: 10, padding: '14px 16px', textAlign: 'left', cursor: 'pointer', transition: 'all 0.2s' }}
                      onClick={() => setSelectedId(item.id)}
                      onMouseEnter={e => { e.currentTarget.style.borderColor = '#0A0A0A'; e.currentTarget.style.background = '#F8F8F8'; }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor = '#E8E8E8'; e.currentTarget.style.background = '#FAFAFA'; }}
                    >
                      <span style={{ fontSize: 18, display: 'block', marginBottom: 5 }}>{item.icon}</span>
                      <p style={{ fontSize: 13, fontWeight: 700, color: '#0A0A0A', margin: 0, fontFamily: "'DM Sans', sans-serif" }}>{item.label}</p>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              /* Agent workspace */
              <div className="agents-main" style={{ padding: '28px 28px 60px', maxWidth: 700, width: '100%', margin: '0 auto' }}>

                {/* Agent header */}
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, marginBottom: 24, paddingBottom: 20, borderBottom: '1px solid #E8E8E8' }}>
                  <span style={{ fontSize: 28 }}>{selectedAgent.icon}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5, flexWrap: 'wrap' }}>
                      <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 20, fontWeight: 800, color: '#0A0A0A', margin: 0, letterSpacing: '-0.02em' }}>
                        {selectedAgent.name}
                      </h2>
                      <span style={{ background: '#F0F0F0', border: '1px solid #E8E8E8', borderRadius: 4, padding: '2px 8px', color: selectedAgent.tierColor, fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', fontFamily: "'JetBrains Mono', monospace" }}>
                        {selectedAgent.tier}
                      </span>
                    </div>
                    <p style={{ fontSize: 13, color: '#8C8C8C', margin: 0, lineHeight: 1.6, fontFamily: "'DM Sans', sans-serif" }}>{selectedAgent.desc}</p>
                  </div>
                </div>

                {isLocked ? (
                  /* Upgrade prompt */
                  <div style={{ border: '1px solid #E8E8E8', borderRadius: 12, padding: '32px 24px', textAlign: 'center' }}>
                    <p style={{ fontSize: 32, marginBottom: 12 }}>{selectedAgent.tier === 'studio' ? '🏢' : '⚡'}</p>
                    <p style={{ fontFamily: "'Playfair Display', serif", fontSize: 18, fontWeight: 700, color: '#0A0A0A', margin: '0 0 8px' }}>
                      {selectedAgent.name} requires {selectedAgent.tier.charAt(0).toUpperCase() + selectedAgent.tier.slice(1)}
                    </p>
                    <p style={{ fontSize: 13, color: '#8C8C8C', margin: '0 0 20px', lineHeight: 1.6, maxWidth: 360, marginLeft: 'auto', marginRight: 'auto', fontFamily: "'DM Sans', sans-serif" }}>
                      {selectedAgent.tier === 'studio'
                        ? 'Unlock Competitor Autopsy, Viral Decoder, Channel Strategy, Monetisation Coach, and Script Localiser.'
                        : 'Unlock Trend Spy, Title Battle, Thumbnail Brain, Hook Upgrader, and Comment Reply.'}
                    </p>
                    <button
                      onClick={() => router.push('/#pricing')}
                      style={{ background: '#0A0A0A', border: 'none', borderRadius: 8, padding: '12px 24px', color: '#fff', fontSize: 13, fontWeight: 700, fontFamily: "'DM Sans', sans-serif", cursor: 'pointer' }}
                    >
                      View Plans →
                    </button>
                  </div>
                ) : (
                  <>
                    {/* Form */}
                    <AgentForm agent={selectedAgent} onSubmit={handleRun} isRunning={isRunning} />

                    {/* Error */}
                    {error && (
                      <div style={{ background: '#FEF2F2', border: '1px solid #FCA5A5', borderRadius: 8, padding: '11px 14px', color: '#DC2626', fontSize: 13, display: 'flex', gap: 8, marginTop: 14, fontFamily: "'DM Sans', sans-serif" }}>
                        ⚠ {error}
                      </div>
                    )}

                    {/* Running state */}
                    {isRunning && (
                      <div style={{ background: '#F8F8F8', border: '1px solid #E8E8E8', borderRadius: 10, padding: '16px 18px', marginTop: 20, display: 'flex', alignItems: 'center', gap: 14 }}>
                        <Spinner size={16} />
                        <div style={{ flex: 1 }}>
                          <p style={{ fontSize: 13, color: '#0A0A0A', fontWeight: 600, margin: '0 0 3px', fontFamily: "'DM Sans', sans-serif" }}>Running {selectedAgent.name}…</p>
                          <p style={{ fontSize: 11, color: '#8C8C8C', margin: 0, fontFamily: "'DM Sans', sans-serif" }}>This takes 10–30 seconds</p>
                        </div>
                        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 13, color: '#0A0A0A', fontWeight: 600 }}>{(elapsed / 1000).toFixed(1)}s</span>
                      </div>
                    )}

                    {/* ── Results ── */}
                    {result && result.agentId === selectedId && (
                      <div ref={resultsRef} className="result-animation" style={{ marginTop: 28 }}>
                        {/* Result header */}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, paddingBottom: 12, borderBottom: '1px solid #E8E8E8' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <span style={{ background: '#F0FDF4', border: '1px solid #86EFAC', borderRadius: 5, padding: '4px 10px', color: '#15803D', fontSize: 11, fontWeight: 700, fontFamily: "'JetBrains Mono', monospace" }}>
                              ✓ Complete
                            </span>
                            {result.duration && (
                              <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: '#8C8C8C' }}>
                                {(result.duration / 1000).toFixed(1)}s
                              </span>
                            )}
                          </div>
                          <button
                            onClick={() => setResult(null)}
                            style={{ background: 'transparent', border: 'none', color: '#8C8C8C', fontSize: 12, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}
                          >
                            Clear ✕
                          </button>
                        </div>

                        {/* Render result */}
                        {(() => {
                          const Renderer = RESULT_COMPONENTS[result.agentId];
                          if (Renderer) return <Renderer data={result.data} />;
                          // Fallback: pretty JSON
                          return (
                            <Block title="Raw Output">
                              <pre style={{ fontSize: 12, color: '#5C5C5C', fontFamily: "'JetBrains Mono', monospace", lineHeight: 1.6, whiteSpace: 'pre-wrap', wordBreak: 'break-word', maxHeight: 500, overflowY: 'auto', margin: 0, background: '#F8F8F8', padding: 12, borderRadius: 8 }}>
                                {JSON.stringify(result.data, null, 2)}
                              </pre>
                            </Block>
                          );
                        })()}
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </main>
        </div>
      </div>
    </>
  );
}