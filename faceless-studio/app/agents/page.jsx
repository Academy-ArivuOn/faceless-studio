'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { getSupabaseBrowser } from '@/lib/supabase-browser';

// ── Constants ──────────────────────────────────────────────────────────────────
const PLATFORMS   = ['YouTube','Instagram Reels','TikTok','Podcast','Blog','YouTube Shorts'];
const LANGUAGES   = ['English','Hindi','Tamil','Telugu','Kannada','Marathi','Bengali','Gujarati','Malayalam','Punjabi'];
const TONES       = ['Educational','Conversational','Motivational','Entertaining','Authoritative','Storytelling'];
const CREATORTYPES= ['general','educator','coach','entertainer','podcaster','blogger','agency'];
const LOC_LANGS   = ['Hindi','Tamil','Telugu','Kannada','Marathi','Bengali','Gujarati','Malayalam','Punjabi','Spanish','French','Portuguese','Arabic','Indonesian','Japanese','Korean'];

// ── Agent Config ───────────────────────────────────────────────────────────────
const AGENT_GROUPS = [
  {
    tier: 'pro', label: 'Pro Agents', color: '#4A90D9', bg: 'rgba(74,144,217,0.08)',
    agents: [
      {
        id: 'trend-spy', icon: '📡', name: 'Trend Spy',
        desc: '48-hour trend brief: what is blowing up in your niche right now.',
        fields: [
          { key:'niche',    label:'Niche',    type:'text',   required:true,  placeholder:'e.g. personal finance india' },
          { key:'platform', label:'Platform', type:'select', options:PLATFORMS },
          { key:'language', label:'Language', type:'select', options:LANGUAGES },
        ],
      },
      {
        id: 'title-battle', icon: '🥊', name: 'Title Battle',
        desc: '10 title variants scored and ranked by CTR psychology.',
        fields: [
          { key:'topic',       label:'Video Topic',                type:'text',   required:true, placeholder:'e.g. How to invest in index funds' },
          { key:'niche',       label:'Niche',                      type:'text',   required:true, placeholder:'e.g. personal finance' },
          { key:'platform',    label:'Platform',                   type:'select', options:PLATFORMS },
          { key:'currentTitle',label:'Current Title (optional)',   type:'text',   placeholder:'Paste your existing title to beat' },
          { key:'creatorType', label:'Creator Type',               type:'select', options:CREATORTYPES },
        ],
      },
      {
        id: 'thumbnail-brain', icon: '🖼️', name: 'Thumbnail Brain',
        desc: 'Full designer-ready thumbnail brief with AI image prompts.',
        fields: [
          { key:'topic',      label:'Topic',               type:'text', required:true, placeholder:'e.g. passive income ideas 2025' },
          { key:'niche',      label:'Niche',               type:'text', required:true, placeholder:'e.g. personal finance' },
          { key:'platform',   label:'Platform',            type:'select', options:PLATFORMS },
          { key:'chosenHook', label:'Hook (optional)',     type:'text', placeholder:'Your opening hook' },
          { key:'titleText',  label:'Title Text (optional)',type:'text', placeholder:'Thumbnail text overlay' },
        ],
      },
      {
        id: 'hook-upgrader', icon: '⚡', name: 'Hook Upgrader',
        desc: 'Paste a weak hook — get 5 powerful rewrites with psychology explained.',
        fields: [
          { key:'weakHook', label:'Weak Hook to Upgrade', type:'textarea', required:true, rows:3, placeholder:'Paste your weak opening hook here...' },
          { key:'niche',    label:'Niche',                type:'text',     required:true, placeholder:'e.g. fitness' },
          { key:'platform', label:'Platform',             type:'select',   options:PLATFORMS },
          { key:'tone',     label:'Tone',                 type:'select',   options:TONES },
        ],
      },
      {
        id: 'comment-reply', icon: '💬', name: 'Comment Reply',
        desc: 'Algorithm-optimised replies that encourage re-engagement.',
        fields: [
          { key:'comments',    label:'Comments (one per line)', type:'textarea', required:true, rows:5, placeholder:'Paste comments here, one per line...' },
          { key:'niche',       label:'Niche',                   type:'text',     required:true, placeholder:'e.g. cooking' },
          { key:'platform',    label:'Platform',                type:'select',   options:PLATFORMS },
          { key:'channelTone', label:'Channel Tone',            type:'select',   options:TONES },
          { key:'channelName', label:'Channel Name (optional)', type:'text',     placeholder:'Your channel name' },
        ],
      },
    ],
  },
  {
    tier: 'studio', label: 'Studio Agents', color: '#50C878', bg: 'rgba(80,200,120,0.08)',
    agents: [
      {
        id: 'competitor-autopsy', icon: '🔬', name: 'Competitor Autopsy',
        desc: 'Dissect any channel — hook patterns, gaps, and battle plan to beat them.',
        fields: [
          { key:'channelName',     label:'Channel / Creator Name',  type:'text',   required:true, placeholder:'e.g. Akshat Shrivastava' },
          { key:'niche',           label:'Niche',                   type:'text',   required:true, placeholder:'e.g. personal finance india' },
          { key:'platform',        label:'Platform',                type:'select', options:PLATFORMS },
          { key:'subscriberCount', label:'Approx. Subscribers',     type:'text',   placeholder:'e.g. 1.2M' },
        ],
      },
      {
        id: 'viral-decoder', icon: '🔄', name: 'Viral Decoder',
        desc: 'Reverse-engineer why a video went viral and extract the replicable formula.',
        fields: [
          { key:'videoTitle',  label:'Viral Video Title',         type:'text', required:true, placeholder:'Paste the exact viral video title' },
          { key:'niche',       label:'Niche',                     type:'text', required:true, placeholder:'e.g. finance' },
          { key:'platform',    label:'Platform',                  type:'select', options:PLATFORMS },
          { key:'channelName', label:'Channel Name (optional)',   type:'text', placeholder:'Creator / channel name' },
          { key:'viewCount',   label:'View Count (optional)',     type:'text', placeholder:'e.g. 2.4M views' },
        ],
      },
      {
        id: 'channel-strategy', icon: '📊', name: 'Channel Strategy',
        desc: '90-day content roadmap with pillars, milestones, and first 15 titles.',
        fields: [
          { key:'niche',              label:'Niche',                   type:'text',     required:true, placeholder:'e.g. AI tools for students' },
          { key:'platform',           label:'Platform',                type:'select',   options:PLATFORMS },
          { key:'currentSubscribers', label:'Current Subscribers',     type:'text',     placeholder:'e.g. 0 or 850' },
          { key:'monetisationGoal',   label:'Monetisation Goal',       type:'textarea', rows:2, placeholder:'e.g. reach ₹50k/month via affiliates within 6 months' },
          { key:'contentFrequency',   label:'Current Posting Frequency',type:'text',   placeholder:'e.g. 1 video/week or not posting yet' },
          { key:'biggestChallenge',   label:'Biggest Challenge',       type:'textarea', rows:2, placeholder:'e.g. topic consistency and low views' },
          { key:'targetAudience',     label:'Target Audience',         type:'textarea', rows:2, placeholder:'e.g. Indian college students interested in AI and productivity' },
        ],
      },
      {
        id: 'monetisation-coach', icon: '💰', name: 'Monetisation Coach',
        desc: 'CPM map, affiliate matches, sponsorship pricing and a ready-to-send pitch email.',
        fields: [
          { key:'niche',           label:'Niche',           type:'text',   required:true, placeholder:'e.g. fitness india' },
          { key:'platform',        label:'Platform',        type:'select', options:PLATFORMS },
          { key:'subscriberCount', label:'Subscribers',     type:'text',   placeholder:'e.g. 3500' },
          { key:'averageViews',    label:'Average Views',   type:'text',   placeholder:'e.g. 600' },
          { key:'location',        label:'Location',        type:'text',   placeholder:'India' },
        ],
      },
      {
        id: 'script-localiser', icon: '🌏', name: 'Script Localiser',
        desc: 'Culturally adapt your English script into Hindi, Tamil, Telugu and more.',
        fields: [
          { key:'originalScript',  label:'Original Script (min 50 chars)', type:'textarea',   required:true, rows:8, placeholder:'Paste your full English script here...' },
          { key:'targetLanguage',  label:'Target Language',                type:'select',     options:LOC_LANGS },
          { key:'niche',           label:'Niche',                          type:'text',        required:true, placeholder:'e.g. finance' },
          { key:'platform',        label:'Platform',                       type:'select',     options:PLATFORMS },
          { key:'creatorType',     label:'Creator Type',                   type:'select',     options:CREATORTYPES },
        ],
      },
    ],
  },
];

// Flat lookup map
const AGENT_MAP = {};
AGENT_GROUPS.forEach(g => g.agents.forEach(a => {
  AGENT_MAP[a.id] = { ...a, tier: g.tier, tierColor: g.color, tierBg: g.bg };
}));

// ── Color tokens ───────────────────────────────────────────────────────────────
const BG = '#07070E';
const CA = '#D4A847';
const C1 = '#EEEEF5';
const C2 = 'rgba(238,238,245,0.55)';
const C3 = 'rgba(238,238,245,0.28)';
const CB = 'rgba(255,255,255,0.07)';
const CB2= 'rgba(255,255,255,0.12)';

// ── Utility components ─────────────────────────────────────────────────────────
function Spinner({ size = 18 }) {
  return <span style={{ width:size, height:size, borderRadius:'50%', border:'2px solid rgba(255,255,255,0.08)', borderTopColor:CA, display:'inline-block', animation:'spin 0.7s linear infinite', flexShrink:0 }} />;
}
function CopyBtn({ text, label = 'Copy' }) {
  const [done, setDone] = useState(false);
  function copy() {
    navigator.clipboard.writeText(text).then(() => { setDone(true); setTimeout(() => setDone(false), 2000); });
  }
  return (
    <button onClick={copy} style={{ background: done ? 'rgba(62,207,142,0.08)' : 'transparent', border:`1px solid ${done ? 'rgba(62,207,142,0.3)' : CB}`, borderRadius:5, padding:'4px 12px', color: done ? '#3ECF8E' : C3, fontSize:12, cursor:'pointer', fontFamily:'var(--FB)', transition:'all 0.2s', flexShrink:0 }}>
      {done ? '✓ Copied' : label}
    </button>
  );
}
function Block({ title, children, action, accent }) {
  return (
    <div style={{ border:`1px solid ${accent ? 'rgba(212,168,71,0.2)' : CB}`, borderRadius:10, overflow:'hidden', marginBottom:14 }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'11px 16px', borderBottom:`1px solid ${CB}`, background: accent ? 'rgba(212,168,71,0.04)' : 'rgba(255,255,255,0.015)' }}>
        <span style={{ fontSize:12, fontWeight:700, color: accent ? CA : C1, letterSpacing:'-0.01em' }}>{title}</span>
        {action}
      </div>
      <div style={{ padding:16 }}>{children}</div>
    </div>
  );
}
function Tag({ label, color }) {
  return <span style={{ background:`${color}18`, border:`1px solid ${color}30`, borderRadius:4, padding:'3px 9px', color, fontSize:11, fontWeight:700, letterSpacing:'0.04em' }}>{label}</span>;
}
function KV({ k, v, mono }) {
  return (
    <div style={{ display:'flex', gap:12, padding:'8px 0', borderBottom:`1px solid rgba(255,255,255,0.04)` }}>
      <span style={{ fontSize:11, color:C3, minWidth:130, flexShrink:0, paddingTop:2, textTransform:'uppercase', letterSpacing:'0.06em', fontWeight:600 }}>{k}</span>
      <span style={{ fontSize:13, color:C2, lineHeight:'1.5', fontFamily: mono ? 'var(--FM)' : 'var(--FB)' }}>{v}</span>
    </div>
  );
}
function HexLogo() {
  return (
    <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
      <polygon points="10,2 17,6 17,14 10,18 3,14 3,6" stroke={CA} strokeWidth="1.4" fill="none"/>
      <polygon points="10,6 14,8.5 14,13.5 10,16 6,13.5 6,8.5" fill={CA} fillOpacity="0.12"/>
    </svg>
  );
}

// ── Result Renderers ───────────────────────────────────────────────────────────

function TrendSpyResult({ data }) {
  if (!data) return null;
  return (
    <div>
      {data.niche_pulse && (
        <Block title="Niche Pulse" accent>
          <p style={{ fontSize:14, color:C2, lineHeight:'1.7', margin:0 }}>{data.niche_pulse}</p>
        </Block>
      )}
      {data.trending_now?.length > 0 && (
        <Block title={`Trending Now — ${data.trending_now.length} Topics`}>
          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            {data.trending_now.map((t,i) => (
              <div key={i} style={{ padding:'12px 14px', background:'rgba(255,255,255,0.02)', borderRadius:8, border:`1px solid ${CB}` }}>
                <div style={{ display:'flex', gap:8, marginBottom:8, alignItems:'center', flexWrap:'wrap' }}>
                  <Tag label={t.urgency} color={t.urgency==='HIGH'?'#F87171':'#FBBF24'} />
                  <Tag label={t.search_volume_signal} color="#4A90D9" />
                  <span style={{ fontSize:11, color:C3 }}>{t.peak_window}</span>
                </div>
                <p style={{ fontSize:14, fontWeight:600, color:C1, margin:'0 0 6px' }}>{t.topic}</p>
                <p style={{ fontSize:12, color:C2, margin:'0 0 4px', lineHeight:'1.5' }}>{t.why_trending}</p>
                <p style={{ fontSize:12, color:C3, margin:0 }}>💡 {t.best_angle}</p>
              </div>
            ))}
          </div>
        </Block>
      )}
      {data.content_ideas_today?.length > 0 && (
        <Block title="Post These Today">
          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            {data.content_ideas_today.map((idea,i) => (
              <div key={i} style={{ padding:'12px 14px', background:'rgba(212,168,71,0.04)', borderRadius:8, border:'1px solid rgba(212,168,71,0.12)' }}>
                <div style={{ display:'flex', gap:8, marginBottom:8, flexWrap:'wrap', alignItems:'center' }}>
                  <Tag label={`CTR ${idea.estimated_ctr}`} color={idea.estimated_ctr==='HIGH'?'#3ECF8E':CA} />
                  <Tag label={idea.effort_level} color={C3} />
                  <span style={{ fontSize:11, color:C3 }}>{idea.format}</span>
                </div>
                <p style={{ fontSize:14, fontWeight:600, color:C1, margin:'0 0 6px' }}>{idea.title}</p>
                <p style={{ fontSize:12, color:CA, margin:'0 0 4px', fontStyle:'italic' }}>"{idea.hook}"</p>
                <p style={{ fontSize:12, color:C3, margin:0 }}>{idea.why_now}</p>
              </div>
            ))}
          </div>
        </Block>
      )}
      {data.best_upload_window && (
        <Block title="Best Upload Window">
          <div style={{ display:'flex', gap:10, flexWrap:'wrap', marginBottom:8 }}>
            <span style={{ background:'rgba(212,168,71,0.1)', border:'1px solid rgba(212,168,71,0.2)', borderRadius:6, padding:'6px 14px', color:CA, fontSize:13, fontWeight:600 }}>{data.best_upload_window.date_guidance}</span>
            <span style={{ background:'rgba(212,168,71,0.1)', border:'1px solid rgba(212,168,71,0.2)', borderRadius:6, padding:'6px 14px', color:CA, fontSize:13, fontWeight:600 }}>{data.best_upload_window.time_slot}</span>
          </div>
          <p style={{ fontSize:13, color:C2, margin:0, lineHeight:'1.6' }}>{data.best_upload_window.reasoning}</p>
        </Block>
      )}
    </div>
  );
}

function TitleBattleResult({ data }) {
  if (!data) return null;
  return (
    <div>
      {data.winner && (
        <Block title="Winner" accent>
          <p style={{ fontSize:17, fontWeight:700, color:C1, margin:'0 0 10px', lineHeight:1.4 }}>{data.winner.title}</p>
          <p style={{ fontSize:13, color:C2, margin:'0 0 10px', lineHeight:'1.6' }}>{data.winner.why_it_wins}</p>
          {data.winner.ab_test_challenger && (
            <p style={{ fontSize:12, color:C3, margin:'0 0 8px' }}>A/B challenger: <span style={{ color:C2 }}>{data.winner.ab_test_challenger}</span></p>
          )}
          <CopyBtn text={data.winner.title} label="Copy Winning Title" />
        </Block>
      )}
      {data.title_variants?.length > 0 && (
        <Block title="All 10 Variants — Ranked">
          <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
            {data.title_variants.map((t,i) => (
              <div key={i} style={{ padding:'10px 12px', background: i===0 ? 'rgba(212,168,71,0.05)' : 'rgba(255,255,255,0.02)', borderRadius:8, border:`1px solid ${i===0 ? 'rgba(212,168,71,0.2)' : CB}` }}>
                <div style={{ display:'flex', gap:8, marginBottom:6, alignItems:'center', flexWrap:'wrap' }}>
                  <span style={{ background:'rgba(255,255,255,0.06)', borderRadius:4, padding:'2px 8px', color: i===0 ? CA : C3, fontSize:10, fontWeight:800 }}>#{t.rank}</span>
                  <Tag label={`CTR ${t.ctr_prediction}`} color={t.ctr_prediction==='HIGH'?'#3ECF8E':CA} />
                  <span style={{ fontSize:10, color:C3, textTransform:'uppercase', letterSpacing:'0.05em', fontWeight:600 }}>{t.framework}</span>
                  <span style={{ fontSize:11, color:C3, fontFamily:'var(--FM)', marginLeft:'auto' }}>{t.character_count || t.title?.length} chars</span>
                </div>
                <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:8 }}>
                  <p style={{ fontSize:13, fontWeight: i===0 ? 600 : 400, color: i===0 ? C1 : C2, margin:0, lineHeight:'1.4' }}>{t.title}</p>
                  <CopyBtn text={t.title} />
                </div>
              </div>
            ))}
          </div>
        </Block>
      )}
      {data.title_formula && (
        <Block title="Reusable Title Formula">
          <p style={{ fontSize:13, color:C2, margin:0, lineHeight:'1.7', fontStyle:'italic' }}>{data.title_formula}</p>
        </Block>
      )}
    </div>
  );
}

function ThumbnailBrainResult({ data }) {
  if (!data) return null;
  const pc = data.primary_concept;
  return (
    <div>
      {pc && (
        <Block title={`Primary Concept — ${pc.concept_name}`} accent>
          <KV k="Visual" v={pc.visual_description} />
          <KV k="Subject" v={pc.subject} />
          {pc.expression_or_emotion && <KV k="Expression" v={pc.expression_or_emotion} />}
          <KV k="Background" v={pc.background} />
          <KV k="Text Overlay" v={pc.text_overlay} />
          <KV k="Text Style" v={pc.text_style} />
          {pc.color_palette && (
            <div style={{ padding:'8px 0' }}>
              <span style={{ fontSize:11, color:C3, textTransform:'uppercase', letterSpacing:'0.06em', fontWeight:600 }}>Colour Palette</span>
              <div style={{ display:'flex', gap:8, marginTop:6, flexWrap:'wrap' }}>
                {Object.entries(pc.color_palette).filter(([k]) => k !== 'contrast_score').map(([k,v]) => (
                  <span key={k} style={{ fontSize:12, color:C2 }}><span style={{ color:C3 }}>{k}:</span> {v}</span>
                ))}
                <Tag label={`Contrast: ${pc.color_palette.contrast_score}`} color={CA} />
              </div>
            </div>
          )}
          <KV k="Visual Hook" v={pc.visual_hook} />
          {pc.ai_image_prompt && (
            <div style={{ marginTop:8 }}>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:6 }}>
                <span style={{ fontSize:11, color:CA, textTransform:'uppercase', letterSpacing:'0.06em', fontWeight:700 }}>AI Image Prompt</span>
                <CopyBtn text={pc.ai_image_prompt} label="Copy Prompt" />
              </div>
              <p style={{ fontSize:13, color:C2, margin:0, lineHeight:'1.6', fontFamily:'var(--FM)', background:'rgba(255,255,255,0.03)', borderRadius:6, padding:'10px 12px' }}>{pc.ai_image_prompt}</p>
            </div>
          )}
        </Block>
      )}
      {data.variant_b && (
        <Block title={`Variant B — ${data.variant_b.concept_name}`}>
          <p style={{ fontSize:13, color:C2, margin:'0 0 10px', lineHeight:'1.6' }}>{data.variant_b.visual_description}</p>
          <KV k="Text Overlay" v={data.variant_b.text_overlay} />
          <KV k="Use When" v={data.variant_b.key_difference} />
          {data.variant_b.ai_image_prompt && (
            <div style={{ marginTop:10 }}>
              <div style={{ display:'flex', justifyContent:'space-between', marginBottom:6 }}>
                <span style={{ fontSize:11, color:CA, textTransform:'uppercase', letterSpacing:'0.06em', fontWeight:700 }}>AI Prompt (Variant B)</span>
                <CopyBtn text={data.variant_b.ai_image_prompt} />
              </div>
              <p style={{ fontSize:12, color:C2, margin:0, fontFamily:'var(--FM)', background:'rgba(255,255,255,0.03)', borderRadius:6, padding:'10px 12px', lineHeight:'1.6' }}>{data.variant_b.ai_image_prompt}</p>
            </div>
          )}
        </Block>
      )}
      {data.split_test_strategy && <Block title="A/B Test Strategy"><p style={{ fontSize:13, color:C2, margin:0, lineHeight:'1.6' }}>{data.split_test_strategy}</p></Block>}
      {data.avoid && <Block title="What to Avoid"><p style={{ fontSize:13, color:'#F87171', margin:0, lineHeight:'1.6' }}>{data.avoid}</p></Block>}
      {data.mobile_check && <Block title="Mobile (120px) Check"><p style={{ fontSize:13, color:C2, margin:0, lineHeight:'1.6' }}>{data.mobile_check}</p></Block>}
    </div>
  );
}

function HookUpgraderResult({ data }) {
  if (!data) return null;
  return (
    <div>
      {data.diagnosis && (
        <Block title="Diagnosis — Why Your Hook Was Weak">
          <div style={{ display:'flex', gap:8, marginBottom:10, flexWrap:'wrap' }}>
            <Tag label={data.diagnosis.weakness_type} color="#F87171" />
            {data.diagnosis.estimated_retention_loss && <Tag label={`${data.diagnosis.estimated_retention_loss} viewers lost`} color="#F87171" />}
          </div>
          <p style={{ fontSize:13, color:C2, margin:'0 0 8px', lineHeight:'1.6' }}>{data.diagnosis.core_problem}</p>
          <p style={{ fontSize:12, color:C3, margin:0, lineHeight:'1.5' }}>Missing: {data.diagnosis.missing_element}</p>
        </Block>
      )}
      {data.winner && (
        <Block title="Winning Upgrade" accent>
          <p style={{ fontSize:16, fontWeight:600, color:C1, margin:'0 0 10px', lineHeight:'1.4', borderLeft:`3px solid ${CA}`, paddingLeft:12 }}>{data.winner.hook_text}</p>
          <p style={{ fontSize:13, color:C2, margin:'0 0 8px', lineHeight:'1.6' }}>{data.winner.why_it_wins}</p>
          {data.winner.delivery_note && <p style={{ fontSize:12, color:C3, margin:'0 0 10px', lineHeight:'1.5' }}>🎙 {data.winner.delivery_note}</p>}
          <CopyBtn text={data.winner.hook_text} label="Copy Hook" />
        </Block>
      )}
      {data.upgrades?.length > 0 && (
        <Block title="All 5 Upgrades">
          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            {data.upgrades.map((u,i) => (
              <div key={i} style={{ padding:'12px 14px', background: i===0 ? 'rgba(212,168,71,0.04)' : 'rgba(255,255,255,0.02)', borderRadius:8, border:`1px solid ${i===0 ? 'rgba(212,168,71,0.15)' : CB}` }}>
                <div style={{ display:'flex', gap:8, marginBottom:8, alignItems:'center', flexWrap:'wrap' }}>
                  <span style={{ background:'rgba(255,255,255,0.06)', borderRadius:4, padding:'2px 7px', color:i===0?CA:C3, fontSize:10, fontWeight:800 }}>#{u.rank}</span>
                  <Tag label={u.trigger} color={CA} />
                  <Tag label={`CTR ${u.ctr_prediction}`} color={u.ctr_prediction==='HIGH'?'#3ECF8E':CA} />
                  <span style={{ fontSize:11, color:C3, marginLeft:'auto' }}>{u.word_count}w</span>
                </div>
                <div style={{ display:'flex', gap:8, alignItems:'flex-start', justifyContent:'space-between' }}>
                  <p style={{ fontSize:14, fontWeight:600, color:C1, margin:'0 0 6px', lineHeight:'1.4', flex:1 }}>{u.hook_text}</p>
                  <CopyBtn text={u.hook_text} />
                </div>
                <p style={{ fontSize:12, color:C2, margin:0, lineHeight:'1.5' }}>{u.psychology}</p>
              </div>
            ))}
          </div>
        </Block>
      )}
      {data.hook_formula && (
        <Block title="Reusable Formula">
          <p style={{ fontSize:13, color:C2, margin:0, lineHeight:'1.7', fontStyle:'italic' }}>{data.hook_formula}</p>
        </Block>
      )}
    </div>
  );
}

function CommentReplyResult({ data }) {
  if (!data) return null;
  const typeColor = { PRAISE:'#3ECF8E', QUESTION:'#4A90D9', CRITICISM:'#F87171', DEBATE:'#FBBF24', PIN_WORTHY:CA };
  return (
    <div>
      {data.pin_recommendation && (
        <Block title="📌 Pin This Comment" accent>
          <p style={{ fontSize:13, color:C2, margin:0, lineHeight:'1.6' }}>{data.pin_recommendation.reason}</p>
        </Block>
      )}
      {data.replies?.map((r,i) => (
        <div key={i} style={{ border:`1px solid ${data.pin_recommendation?.comment_number === r.comment_number ? 'rgba(212,168,71,0.25)' : CB}`, borderRadius:10, marginBottom:12, overflow:'hidden' }}>
          <div style={{ padding:'10px 14px', background:'rgba(255,255,255,0.015)', borderBottom:`1px solid ${CB}`, display:'flex', gap:8, alignItems:'center', flexWrap:'wrap' }}>
            <span style={{ fontSize:11, color:C3, fontWeight:600 }}>#{r.comment_number}</span>
            {r.comment_type && <Tag label={r.comment_type} color={typeColor[r.comment_type] || C3} />}
            {data.pin_recommendation?.comment_number === r.comment_number && <Tag label="PIN" color={CA} />}
          </div>
          <div style={{ padding:14 }}>
            <p style={{ fontSize:12, color:C3, margin:'0 0 10px', fontStyle:'italic', lineHeight:'1.5' }}>"{r.original_comment}"</p>
            <div style={{ display:'flex', gap:10, alignItems:'flex-start', justifyContent:'space-between' }}>
              <p style={{ fontSize:14, color:C1, margin:'0 0 8px', lineHeight:'1.6', flex:1 }}>{r.reply}</p>
              <CopyBtn text={r.reply} />
            </div>
            {r.follow_up_question && <p style={{ fontSize:12, color:CA, margin:0 }}>💭 {r.follow_up_question}</p>}
          </div>
        </div>
      ))}
      {data.engagement_summary && (
        <Block title="Engagement Summary">
          <p style={{ fontSize:13, color:C2, margin:0, lineHeight:'1.6' }}>{data.engagement_summary}</p>
        </Block>
      )}
      {data.content_signal && (
        <Block title="Content Signal from Comments">
          <p style={{ fontSize:13, color:CA, margin:0, lineHeight:'1.6' }}>{data.content_signal}</p>
        </Block>
      )}
    </div>
  );
}

function CompetitorAutopsyResult({ data }) {
  if (!data) return null;
  return (
    <div>
      {data.content_patterns && (
        <Block title="Content Patterns">
          <KV k="Dominant Format"   v={data.content_patterns.dominant_format} />
          <KV k="Avg Length"        v={data.content_patterns.avg_content_length} />
          <KV k="Upload Cadence"    v={data.content_patterns.upload_cadence} />
          <KV k="Series Strategy"   v={data.content_patterns.series_vs_standalone} />
          <KV k="Evergreen vs Trend"v={data.content_patterns.evergreen_vs_trending} />
          {data.content_patterns.topic_clusters?.length > 0 && (
            <div style={{ padding:'8px 0' }}>
              <span style={{ fontSize:11, color:C3, textTransform:'uppercase', letterSpacing:'0.06em', fontWeight:600 }}>Topic Clusters</span>
              <div style={{ display:'flex', flexWrap:'wrap', gap:6, marginTop:6 }}>
                {data.content_patterns.topic_clusters.map((t,i) => <Tag key={i} label={t} color={CA} />)}
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
      {data.content_gaps?.length > 0 && (
        <Block title="Content Gaps You Can Exploit" accent>
          {data.content_gaps.map((g,i) => (
            <div key={i} style={{ padding:'12px 0', borderBottom: i < data.content_gaps.length-1 ? `1px solid ${CB}` : 'none' }}>
              <div style={{ display:'flex', gap:8, marginBottom:8, flexWrap:'wrap' }}>
                <Tag label={`Opportunity: ${g.opportunity_size}`} color={g.opportunity_size==='HIGH'?'#3ECF8E':CA} />
              </div>
              <p style={{ fontSize:13, fontWeight:600, color:C1, margin:'0 0 4px' }}>{g.gap}</p>
              <p style={{ fontSize:12, color:C2, margin:'0 0 4px', lineHeight:'1.5' }}>{g.why_they_missed_it}</p>
              <p style={{ fontSize:12, color:CA, margin:0 }}>▶ {g.how_to_exploit}</p>
            </div>
          ))}
        </Block>
      )}
      {data.weaknesses?.length > 0 && (
        <Block title="Their Weaknesses">
          {data.weaknesses.map((w,i) => (
            <div key={i} style={{ padding:'10px 0', borderBottom: i < data.weaknesses.length-1 ? `1px solid ${CB}` : 'none' }}>
              <p style={{ fontSize:13, fontWeight:600, color:'#F87171', margin:'0 0 4px' }}>{w.weakness}</p>
              <p style={{ fontSize:12, color:C2, margin:'0 0 4px', lineHeight:'1.5' }}>{w.evidence}</p>
              <p style={{ fontSize:12, color:CA, margin:0 }}>▶ {w.exploit_strategy}</p>
            </div>
          ))}
        </Block>
      )}
      {data.battle_plan && (
        <Block title="Your Battle Plan" accent>
          <p style={{ fontSize:13, color:C2, margin:'0 0 14px', lineHeight:'1.6', fontWeight:600 }}>{data.battle_plan.differentiation_angle}</p>
          {data.battle_plan.first_3_videos?.length > 0 && (
            <>
              <p style={{ fontSize:11, color:C3, textTransform:'uppercase', letterSpacing:'0.08em', fontWeight:700, marginBottom:8 }}>First 3 Videos to Make</p>
              {data.battle_plan.first_3_videos.map((v,i) => (
                <div key={i} style={{ display:'flex', gap:10, marginBottom:8 }}>
                  <span style={{ background:'rgba(212,168,71,0.1)', color:CA, borderRadius:4, padding:'2px 8px', fontSize:11, fontWeight:800, flexShrink:0 }}>V{i+1}</span>
                  <p style={{ fontSize:13, color:C1, margin:0, lineHeight:'1.4' }}>{v}</p>
                </div>
              ))}
            </>
          )}
          {data.battle_plan.timeline_to_compete && <p style={{ fontSize:12, color:C3, marginTop:12, margin:0 }}>Timeline: {data.battle_plan.timeline_to_compete}</p>}
        </Block>
      )}
    </div>
  );
}

function ViralDecoderResult({ data }) {
  if (!data) return null;
  return (
    <div>
      {data.viral_verdict && (
        <Block title="Viral Verdict" accent>
          <p style={{ fontSize:15, color:C1, fontWeight:600, margin:0, lineHeight:'1.5' }}>{data.viral_verdict}</p>
        </Block>
      )}
      {data.algorithm_analysis && (
        <Block title="Algorithm Analysis">
          <KV k="Distribution Trigger" v={data.algorithm_analysis.initial_distribution_trigger} />
          <KV k="Key Metric Driver"    v={data.algorithm_analysis.key_metric_driver} />
          <KV k="Distribution Pattern" v={data.algorithm_analysis.distribution_pattern} />
          <KV k="Timing Factor"        v={data.algorithm_analysis.timing_factor} />
        </Block>
      )}
      {data.psychological_autopsy?.length > 0 && (
        <Block title="Psychological Triggers Decoded">
          {data.psychological_autopsy.map((p,i) => (
            <div key={i} style={{ padding:'10px 0', borderBottom: i < data.psychological_autopsy.length-1 ? `1px solid ${CB}` : 'none' }}>
              <div style={{ display:'flex', gap:8, marginBottom:6, flexWrap:'wrap' }}>
                <Tag label={p.trigger} color={CA} />
                <Tag label={p.strength} color={p.strength==='HIGH'?'#3ECF8E':C3} />
                <span style={{ fontSize:11, color:C3 }}>in {p.where_it_appears}</span>
              </div>
              <p style={{ fontSize:13, color:C2, margin:0, lineHeight:'1.5' }}>{p.mechanism}</p>
            </div>
          ))}
        </Block>
      )}
      {data.replication_blueprint && (
        <Block title="Replication Blueprint" accent>
          {data.replication_blueprint.core_formula && (
            <p style={{ fontSize:13, color:CA, margin:'0 0 14px', lineHeight:'1.6', fontStyle:'italic' }}>Formula: {data.replication_blueprint.core_formula}</p>
          )}
          {[1,2,3].map(n => {
            const idea = data.replication_blueprint[`video_idea_${n}`];
            if (!idea) return null;
            return (
              <div key={n} style={{ padding:'12px', background:'rgba(255,255,255,0.02)', borderRadius:8, border:`1px solid ${CB}`, marginBottom:10 }}>
                <span style={{ background:'rgba(212,168,71,0.1)', color:CA, borderRadius:4, padding:'2px 8px', fontSize:10, fontWeight:800 }}>IDEA {n}</span>
                <p style={{ fontSize:14, fontWeight:600, color:C1, margin:'8px 0 4px' }}>{idea.title}</p>
                <p style={{ fontSize:12, color:CA, margin:'0 0 6px', fontStyle:'italic' }}>"{idea.hook}"</p>
                <p style={{ fontSize:12, color:C3, margin:0 }}>{idea.why_it_replicates}</p>
              </div>
            );
          })}
          {data.replication_blueprint.what_not_to_copy && (
            <p style={{ fontSize:12, color:'#F87171', margin:'8px 0 0', lineHeight:'1.5' }}>⚠ Don't copy: {data.replication_blueprint.what_not_to_copy}</p>
          )}
        </Block>
      )}
      {data.odds_of_replication && (
        <Block title="Odds of Replication">
          <div style={{ display:'flex', gap:10, alignItems:'center', marginBottom:10 }}>
            <span style={{ fontFamily:'var(--FH)', fontSize:32, fontWeight:800, color:CA }}>{data.odds_of_replication.score}/10</span>
            <div>
              <p style={{ fontSize:12, color:'#F87171', margin:'0 0 3px' }}>Barrier: {data.odds_of_replication.main_barrier}</p>
              <p style={{ fontSize:12, color:'#3ECF8E', margin:0 }}>Your edge: {data.odds_of_replication.your_advantage}</p>
            </div>
          </div>
        </Block>
      )}
    </div>
  );
}

function ChannelStrategyResult({ data }) {
  if (!data) return null;
  return (
    <div>
      {data.channel_brief_summary && (
        <Block title="Channel Assessment" accent>
          <p style={{ fontSize:14, color:C2, margin:0, lineHeight:'1.7' }}>{data.channel_brief_summary}</p>
        </Block>
      )}
      {data.content_pillars?.length > 0 && (
        <Block title="Your 3 Content Pillars">
          {data.content_pillars.map((p,i) => (
            <div key={i} style={{ padding:'12px 0', borderBottom: i < data.content_pillars.length-1 ? `1px solid ${CB}` : 'none' }}>
              <p style={{ fontSize:14, fontWeight:700, color:CA, margin:'0 0 4px' }}>{p.pillar_name}</p>
              <p style={{ fontSize:13, color:C2, margin:'0 0 8px', lineHeight:'1.5' }}>{p.description}</p>
              <p style={{ fontSize:12, color:C3, margin:'0 0 8px' }}>Audience need: {p.audience_need}</p>
              {p.example_titles?.length > 0 && (
                <div style={{ display:'flex', flexDirection:'column', gap:4 }}>
                  {p.example_titles.map((t,ti) => <span key={ti} style={{ fontSize:12, color:C2, paddingLeft:10, borderLeft:`2px solid rgba(212,168,71,0.3)`, lineHeight:'1.4' }}>{t}</span>)}
                </div>
              )}
            </div>
          ))}
        </Block>
      )}
      {data.roadmap?.length > 0 && (
        <Block title="90-Day Roadmap">
          {data.roadmap.map((phase,i) => (
            <div key={i} style={{ marginBottom: i < data.roadmap.length-1 ? 20 : 0 }}>
              <div style={{ display:'flex', gap:8, marginBottom:10, alignItems:'center' }}>
                <span style={{ background:'rgba(212,168,71,0.12)', color:CA, borderRadius:5, padding:'3px 10px', fontSize:11, fontWeight:800 }}>Phase {phase.phase} — {phase.month}</span>
                <span style={{ fontSize:12, color:C3 }}>{phase.theme}</span>
              </div>
              <p style={{ fontSize:13, fontWeight:600, color:C1, margin:'0 0 8px' }}>{phase.objective}</p>
              <p style={{ fontSize:12, color:'#3ECF8E', margin:'0 0 8px' }}>🎯 Milestone: {phase.milestone}</p>
              <div style={{ display:'flex', gap:14, marginBottom:10 }}>
                {phase.weekly_targets && Object.entries(phase.weekly_targets).map(([k,v]) => (
                  <div key={k} style={{ textAlign:'center' }}>
                    <span style={{ display:'block', fontFamily:'var(--FH)', fontSize:18, fontWeight:800, color:CA }}>{v}</span>
                    <span style={{ fontSize:10, color:C3, textTransform:'uppercase', letterSpacing:'0.05em' }}>{k.replace(/_/g,' ')}</span>
                  </div>
                ))}
              </div>
              {phase.first_5_content_pieces?.length > 0 && (
                <div style={{ display:'flex', flexDirection:'column', gap:4 }}>
                  <span style={{ fontSize:10, color:C3, textTransform:'uppercase', letterSpacing:'0.08em', fontWeight:700 }}>First 5 Videos</span>
                  {phase.first_5_content_pieces.map((t,ti) => (
                    <span key={ti} style={{ fontSize:12, color:C2, paddingLeft:10, borderLeft:`2px solid rgba(212,168,71,0.2)`, lineHeight:'1.4' }}>{t}</span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </Block>
      )}
      {data.subscriber_projections && (
        <Block title="Subscriber Projections">
          <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10, marginBottom:10 }}>
            {[['End Month 1', data.subscriber_projections.end_of_month_1],['End Month 2', data.subscriber_projections.end_of_month_2],['End Month 3', data.subscriber_projections.end_of_month_3]].map(([k,v]) => (
              <div key={k} style={{ textAlign:'center', background:'rgba(255,255,255,0.02)', borderRadius:8, padding:12, border:`1px solid ${CB}` }}>
                <span style={{ display:'block', fontFamily:'var(--FH)', fontSize:16, fontWeight:800, color:CA, marginBottom:3 }}>{v}</span>
                <span style={{ fontSize:10, color:C3 }}>{k}</span>
              </div>
            ))}
          </div>
          {data.subscriber_projections.assumptions && <p style={{ fontSize:12, color:C3, margin:0 }}>{data.subscriber_projections.assumptions}</p>}
        </Block>
      )}
      {data.biggest_risk && (
        <Block title="Biggest Risk">
          <p style={{ fontSize:13, color:'#F87171', margin:0, lineHeight:'1.6' }}>{data.biggest_risk}</p>
        </Block>
      )}
    </div>
  );
}

function MonetisationCoachResult({ data }) {
  if (!data) return null;
  return (
    <div>
      {data.channel_snapshot && (
        <Block title="Readiness Assessment" accent>
          <p style={{ fontSize:14, color:C2, margin:0, lineHeight:'1.7' }}>{data.channel_snapshot}</p>
        </Block>
      )}
      {data.cpm_analysis && (
        <Block title="CPM & Revenue Map">
          <KV k="CPM Range"    v={data.cpm_analysis.niche_cpm_range} />
          <KV k="Estimated RPM" v={data.cpm_analysis.estimated_rpm} />
          <KV k="CPM Peak Season" v={data.cpm_analysis.seasonal_cpm_peaks} />
          <KV k="Geography Note"  v={data.cpm_analysis.geography_note} />
          <KV k="AdSense Status"  v={data.cpm_analysis.adsense_eligibility_note} />
          {data.cpm_analysis.top_paying_content_categories?.length > 0 && (
            <div style={{ padding:'8px 0' }}>
              <span style={{ fontSize:11, color:C3, textTransform:'uppercase', letterSpacing:'0.06em', fontWeight:600 }}>Top-Paying Content</span>
              <div style={{ display:'flex', flexWrap:'wrap', gap:6, marginTop:6 }}>
                {data.cpm_analysis.top_paying_content_categories.map((c,i) => <Tag key={i} label={c} color={CA} />)}
              </div>
            </div>
          )}
        </Block>
      )}
      {data.affiliate_matches?.length > 0 && (
        <Block title="Top Affiliate Matches">
          {data.affiliate_matches.map((a,i) => (
            <div key={i} style={{ padding:'12px 0', borderBottom: i < data.affiliate_matches.length-1 ? `1px solid ${CB}` : 'none' }}>
              <div style={{ display:'flex', gap:10, marginBottom:8, alignItems:'center', justifyContent:'space-between' }}>
                <p style={{ fontSize:14, fontWeight:700, color:C1, margin:0 }}>{a.program_name}</p>
                <span style={{ fontSize:13, color:'#3ECF8E', fontWeight:700 }}>{a.commission_rate}</span>
              </div>
              <p style={{ fontSize:12, color:C3, margin:'0 0 4px' }}>Platform: {a.platform} · Avg order: {a.avg_order_value}</p>
              <p style={{ fontSize:12, color:C2, margin:'0 0 4px', lineHeight:'1.5' }}>{a.audience_fit}</p>
              <p style={{ fontSize:12, color:CA, margin:0 }}>Est. ₹{a.estimated_monthly_earnings}/month · {a.promo_angle}</p>
            </div>
          ))}
        </Block>
      )}
      {data.sponsor_pitch_email && (
        <Block title="Sponsor Pitch Email" accent>
          <p style={{ fontSize:12, color:C3, margin:'0 0 8px' }}>Subject: <span style={{ color:C1, fontWeight:600 }}>{data.sponsor_pitch_email.subject_line}</span></p>
          <div style={{ display:'flex', justifyContent:'flex-end', marginBottom:8 }}>
            <CopyBtn text={data.sponsor_pitch_email.body} label="Copy Email" />
          </div>
          <pre style={{ fontSize:13, color:C2, lineHeight:'1.75', whiteSpace:'pre-wrap', margin:0, fontFamily:'var(--FB)', background:'rgba(255,255,255,0.02)', borderRadius:8, padding:'12px 14px' }}>{data.sponsor_pitch_email.body}</pre>
          {data.sponsor_pitch_email.follow_up_template && <p style={{ fontSize:12, color:C3, marginTop:10, marginBottom:0 }}>Follow-up (Day 5): <span style={{ color:C2 }}>{data.sponsor_pitch_email.follow_up_template}</span></p>}
        </Block>
      )}
      {data.revenue_projections?.length > 0 && (
        <Block title="Revenue Projections">
          <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
            {data.revenue_projections.map((r,i) => (
              <div key={i} style={{ display:'grid', gridTemplateColumns:'1.5fr 1fr 1fr 1.2fr', gap:10, padding:'10px 12px', background:'rgba(255,255,255,0.02)', borderRadius:8, border:`1px solid ${CB}`, alignItems:'center' }}>
                <span style={{ fontSize:12, fontWeight:700, color:CA }}>{r.milestone}</span>
                <div style={{ textAlign:'center' }}>
                  <span style={{ fontSize:10, color:C3, display:'block', marginBottom:2 }}>AdSense</span>
                  <span style={{ fontSize:12, color:C2, fontWeight:600 }}>{r.monthly_adsense}</span>
                </div>
                <div style={{ textAlign:'center' }}>
                  <span style={{ fontSize:10, color:C3, display:'block', marginBottom:2 }}>Affiliate</span>
                  <span style={{ fontSize:12, color:C2, fontWeight:600 }}>{r.monthly_affiliate}</span>
                </div>
                <div style={{ textAlign:'right' }}>
                  <span style={{ fontSize:10, color:C3, display:'block', marginBottom:2 }}>Total</span>
                  <span style={{ fontSize:13, color:'#3ECF8E', fontWeight:800 }}>{r.total_monthly}</span>
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
  if (!data) return null;
  return (
    <div>
      <div style={{ display:'flex', gap:10, marginBottom:14 }}>
        <div style={{ flex:1, background:'rgba(255,255,255,0.02)', border:`1px solid ${CB}`, borderRadius:8, padding:'12px 16px', textAlign:'center' }}>
          <span style={{ display:'block', fontFamily:'var(--FH)', fontSize:22, fontWeight:800, color:CA }}>{data.original_word_count || '—'}</span>
          <span style={{ fontSize:11, color:C3, textTransform:'uppercase', letterSpacing:'0.06em' }}>Original Words</span>
        </div>
        <div style={{ flex:1, background:'rgba(255,255,255,0.02)', border:`1px solid ${CB}`, borderRadius:8, padding:'12px 16px', textAlign:'center' }}>
          <span style={{ display:'block', fontFamily:'var(--FH)', fontSize:22, fontWeight:800, color:'#3ECF8E' }}>{data.localised_word_count || '—'}</span>
          <span style={{ fontSize:11, color:C3, textTransform:'uppercase', letterSpacing:'0.06em' }}>Localised Words</span>
        </div>
        {data.target_language && (
          <div style={{ flex:1, background:'rgba(255,255,255,0.02)', border:`1px solid ${CB}`, borderRadius:8, padding:'12px 16px', textAlign:'center' }}>
            <span style={{ display:'block', fontFamily:'var(--FH)', fontSize:16, fontWeight:800, color:CA, marginTop:3 }}>{data.target_language}</span>
            <span style={{ fontSize:11, color:C3, textTransform:'uppercase', letterSpacing:'0.06em' }}>Language</span>
          </div>
        )}
      </div>
      {data.localised_script && (
        <Block title="Localised Script" accent>
          <div style={{ display:'flex', justifyContent:'flex-end', marginBottom:10 }}>
            <CopyBtn text={data.localised_script} label="Copy Script" />
          </div>
          <pre style={{ fontSize:14, color:C1, lineHeight:'1.85', whiteSpace:'pre-wrap', margin:0, fontFamily:'var(--FB)', maxHeight:420, overflowY:'auto' }}>{data.localised_script}</pre>
        </Block>
      )}
      {data.hook_adaptation && (
        <Block title="Hook Adaptation">
          <p style={{ fontSize:12, color:C3, margin:'0 0 6px' }}>Original: <span style={{ color:C2 }}>{data.hook_adaptation.original_hook}</span></p>
          <p style={{ fontSize:14, fontWeight:600, color:CA, margin:'0 0 8px', lineHeight:'1.4' }}>{data.hook_adaptation.localised_hook}</p>
          <p style={{ fontSize:12, color:C2, margin:0, lineHeight:'1.5' }}>{data.hook_adaptation.adaptation_notes}</p>
        </Block>
      )}
      {data.cultural_adaptations?.length > 0 && (
        <Block title="Cultural Adaptations">
          {data.cultural_adaptations.map((a,i) => (
            <div key={i} style={{ padding:'10px 0', borderBottom: i < data.cultural_adaptations.length-1 ? `1px solid ${CB}` : 'none' }}>
              <div style={{ display:'flex', gap:10, marginBottom:4, flexWrap:'wrap' }}>
                <span style={{ fontSize:12, color:'#F87171', textDecoration:'line-through' }}>{a.original}</span>
                <span style={{ fontSize:12, color:C3 }}>→</span>
                <span style={{ fontSize:12, color:'#3ECF8E', fontWeight:600 }}>{a.localised}</span>
              </div>
              <p style={{ fontSize:11, color:C3, margin:0 }}>{a.reason}</p>
            </div>
          ))}
        </Block>
      )}
      {data.tone_notes && <Block title="Tone Notes"><p style={{ fontSize:13, color:C2, margin:0, lineHeight:'1.6' }}>{data.tone_notes}</p></Block>}
      {data.recording_notes && <Block title="Recording Notes"><p style={{ fontSize:13, color:CA, margin:0, lineHeight:'1.6' }}>{data.recording_notes}</p></Block>}
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

// ── Form component ─────────────────────────────────────────────────────────────
function AgentForm({ agent, onSubmit, isRunning, disabled }) {
  const [values, setValues] = useState({});

  function set(key, val) { setValues(prev => ({ ...prev, [key]: val })); }

  function handleSubmit(e) {
    e.preventDefault();
    onSubmit({ agentId: agent.id, ...values });
  }

  const SEL_ARROW = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='11' height='7' viewBox='0 0 11 7'%3E%3Cpath d='M1 1l4.5 4.5L10 1' stroke='rgba(238,238,245,0.28)' strokeWidth='1.5' fill='none' strokeLinecap='round'/%3E%3C/svg%3E")`;

  const inputBase = { background:'rgba(255,255,255,0.03)', border:`1px solid ${CB}`, borderRadius:8, padding:'10px 14px', color:C1, fontSize:13, fontFamily:'var(--FB)', outline:'none', width:'100%', boxSizing:'border-box', resize:'vertical' };
  const selectBase = { ...inputBase, appearance:'none', backgroundImage:SEL_ARROW, backgroundRepeat:'no-repeat', backgroundPosition:'right 12px center', paddingRight:36, cursor:'pointer' };

  return (
    <form onSubmit={handleSubmit} style={{ display:'flex', flexDirection:'column', gap:14 }}>
      {agent.fields.map(field => (
        <div key={field.key} style={{ display:'flex', flexDirection:'column', gap:6 }}>
          <label style={{ fontSize:11, fontWeight:700, color:C2, textTransform:'uppercase', letterSpacing:'0.07em' }}>
            {field.label} {field.required && <span style={{ color:CA }}>*</span>}
          </label>
          {field.type === 'textarea' ? (
            <textarea
              rows={field.rows || 4}
              style={inputBase}
              placeholder={field.placeholder || ''}
              value={values[field.key] || ''}
              onChange={e => set(field.key, e.target.value)}
              required={field.required}
              disabled={disabled}
            />
          ) : field.type === 'select' ? (
            <select
              style={selectBase}
              value={values[field.key] || field.options[0]}
              onChange={e => set(field.key, e.target.value)}
              disabled={disabled}
            >
              {field.options.map(o => <option key={o} value={o}>{o}</option>)}
            </select>
          ) : (
            <input
              type="text"
              style={inputBase}
              placeholder={field.placeholder || ''}
              value={values[field.key] || ''}
              onChange={e => set(field.key, e.target.value)}
              required={field.required}
              disabled={disabled}
            />
          )}
        </div>
      ))}
      <button
        type="submit"
        disabled={isRunning || disabled}
        style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:10, background: disabled ? 'rgba(212,168,71,0.3)' : CA, border:'none', borderRadius:8, padding:'12px 20px', color: disabled ? 'rgba(0,0,0,0.4)' : '#000', fontSize:13, fontWeight:700, fontFamily:'var(--FH)', cursor: isRunning || disabled ? 'not-allowed' : 'pointer', opacity: isRunning ? 0.6 : 1, transition:'opacity 0.2s', marginTop:4 }}
      >
        {isRunning ? <><Spinner size={14} /><span>Running {agent.name}…</span></> : `Run ${agent.name} →`}
      </button>
    </form>
  );
}

// ── Upgrade prompt ─────────────────────────────────────────────────────────────
function UpgradePrompt({ requiredPlan, agentName }) {
  const router = useRouter();
  return (
    <div style={{ border:'1px solid rgba(212,168,71,0.2)', borderRadius:10, padding:'28px 24px', textAlign:'center' }}>
      <p style={{ fontSize:24, marginBottom:10 }}>{requiredPlan === 'studio' ? '🏢' : '⚡'}</p>
      <p style={{ fontFamily:'var(--FH)', fontSize:16, fontWeight:700, color:C1, margin:'0 0 8px' }}>{agentName} requires {requiredPlan.charAt(0).toUpperCase() + requiredPlan.slice(1)}</p>
      <p style={{ fontSize:13, color:C2, margin:'0 0 20px', lineHeight:'1.6' }}>
        {requiredPlan === 'studio'
          ? 'Unlock Competitor Autopsy, Viral Decoder, Channel Strategy, Monetisation Coach, and Script Localiser on the Studio plan.'
          : 'Unlock Trend Spy, Title Battle, Thumbnail Brain, Hook Upgrader, and Comment Reply on the Pro plan.'}
      </p>
      <button onClick={() => router.push('/#pricing')} style={{ background:CA, border:'none', borderRadius:8, padding:'11px 24px', color:'#000', fontSize:13, fontWeight:700, fontFamily:'var(--FH)', cursor:'pointer' }}>
        View Plans →
      </button>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────────
export default function AgentsPage() {
  const router   = useRouter();
  const supabase = getSupabaseBrowser();

  const [user,       setUser]       = useState(null);
  const [usage,      setUsage]      = useState(null);
  const [loading,    setLoading]    = useState(true);
  const [selectedId, setSelectedId] = useState(null);
  const [isRunning,  setIsRunning]  = useState(false);
  const [result,     setResult]     = useState(null);
  const [error,      setError]      = useState('');
  const [elapsed,    setElapsed]    = useState(0);
  const timerRef = useRef(null);
  const resultsRef = useRef(null);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) { router.replace('/login'); return; }
      setUser(session.user);
      const res  = await fetch('/api/usage', { headers: { Authorization:`Bearer ${session.access_token}` }});
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
    setError('');
    setResult(null);
    setIsRunning(true);
    setElapsed(0);
    startTimer();

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { router.replace('/login'); return; }

    try {
      const res  = await fetch('/api/generate', {
        method:  'POST',
        headers: { 'Content-Type':'application/json', 'Authorization':`Bearer ${session.access_token}` },
        body:    JSON.stringify(inputs),
      });
      const json = await res.json();
      stopTimer();
      setIsRunning(false);

      if (!res.ok || !json.success) {
        setError(json.error || 'Agent failed. Please try again.');
        return;
      }

      setResult({ agentId: json.agentId, data: json.data, duration: json.meta?.total_duration_ms });
      setTimeout(() => { if (resultsRef.current) resultsRef.current.scrollIntoView({ behavior:'smooth', block:'start' }); }, 100);
    } catch (err) {
      stopTimer();
      setIsRunning(false);
      setError('Network error. Please check your connection.');
    }
  }

  if (loading) return (
    <div style={{ minHeight:'100vh', background:BG, display:'flex', alignItems:'center', justifyContent:'center' }}>
      <Spinner size={24} />
    </div>
  );

  const plan         = usage?.plan || 'free';
  const planRank     = { free:0, pro:1, studio:2 }[plan] ?? 0;
  const selectedAgent = selectedId ? AGENT_MAP[selectedId] : null;
  const tierRank     = selectedAgent?.tier === 'studio' ? 2 : 1;
  const isLocked     = selectedAgent ? planRank < tierRank : false;

  return (
    <div style={{ minHeight:'100vh', background:BG, fontFamily:'var(--FB)', color:C1, display:'flex', flexDirection:'column' }}>

      {/* Topbar */}
      <header style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0 24px', height:54, borderBottom:`1px solid ${CB}`, flexShrink:0, position:'sticky', top:0, background:'rgba(7,7,14,0.95)', backdropFilter:'blur(12px)', zIndex:50 }}>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <HexLogo />
          <span style={{ fontFamily:'var(--FH)', fontSize:15, fontWeight:700, color:C1, letterSpacing:'-0.02em' }}>Studio AI</span>
          <span style={{ color:CB2, margin:'0 2px' }}>/</span>
          <span style={{ fontSize:14, color:C2 }}>Agents</span>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:14 }}>
          {usage && <span style={{ fontSize:12, color:C3, fontFamily:'var(--FM)' }}>{plan === 'free' ? `Free · ${usage.remaining ?? 0} gens left` : `${plan} · unlimited`}</span>}
          <button style={{ background:'transparent', border:'none', color:C2, fontSize:13, cursor:'pointer', fontFamily:'var(--FB)' }} onClick={() => router.push('/generate')}>Generate</button>
          <button style={{ background:'transparent', border:'none', color:C2, fontSize:13, cursor:'pointer', fontFamily:'var(--FB)' }} onClick={() => router.push('/dashboard')}>Dashboard</button>
          <button style={{ background:'transparent', border:`1px solid ${CB}`, borderRadius:6, padding:'6px 14px', color:C2, fontSize:13, cursor:'pointer', fontFamily:'var(--FB)' }} onClick={async () => { await supabase.auth.signOut(); router.push('/login'); }}>Sign out</button>
        </div>
      </header>

      <div style={{ display:'flex', flex:1, overflow:'hidden', minHeight:0 }}>

        {/* Sidebar */}
        <aside style={{ width:240, flexShrink:0, borderRight:`1px solid ${CB}`, overflowY:'auto', display:'flex', flexDirection:'column' }}>
          <div style={{ padding:'18px 16px 12px', borderBottom:`1px solid ${CB}` }}>
            <p style={{ fontSize:10, fontWeight:700, color:C3, textTransform:'uppercase', letterSpacing:'0.12em', margin:0 }}>Agent Library</p>
          </div>

          {AGENT_GROUPS.map(group => {
            const groupRank = group.tier === 'studio' ? 2 : 1;
            const unlocked  = planRank >= groupRank;
            return (
              <div key={group.tier} style={{ borderBottom:`1px solid ${CB}` }}>
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'12px 16px 8px' }}>
                  <span style={{ fontSize:10, fontWeight:700, color: unlocked ? group.color : C3, textTransform:'uppercase', letterSpacing:'0.1em' }}>{group.label}</span>
                  {!unlocked && <span style={{ fontSize:9, background:`${group.color}18`, border:`1px solid ${group.color}30`, borderRadius:3, padding:'1px 6px', color:group.color, fontWeight:700 }}>{group.tier.toUpperCase()}</span>}
                </div>
                {group.agents.map(agent => {
                  const active = selectedId === agent.id;
                  return (
                    <button
                      key={agent.id}
                      onClick={() => { setSelectedId(agent.id); setResult(null); setError(''); }}
                      style={{ width:'100%', display:'flex', alignItems:'center', gap:10, padding:'9px 16px', background: active ? `${group.color}12` : 'transparent', border:'none', borderLeft: active ? `2px solid ${group.color}` : '2px solid transparent', cursor:'pointer', transition:'all 0.15s', textAlign:'left' }}
                    >
                      <span style={{ fontSize:16, flexShrink:0 }}>{agent.icon}</span>
                      <div>
                        <p style={{ fontSize:12, fontWeight: active ? 700 : 500, color: active ? group.color : unlocked ? C2 : C3, margin:0 }}>{agent.name}</p>
                        <p style={{ fontSize:10, color:C3, margin:0, lineHeight:'1.3' }}>{agent.desc.slice(0, 40)}…</p>
                      </div>
                      {!unlocked && <span style={{ fontSize:10, marginLeft:'auto', color:C3 }}>🔒</span>}
                    </button>
                  );
                })}
              </div>
            );
          })}

          <div style={{ padding:'14px 16px', marginTop:'auto' }}>
            <button onClick={() => router.push('/generate')} style={{ width:'100%', background:'rgba(212,168,71,0.08)', border:'1px solid rgba(212,168,71,0.2)', borderRadius:8, padding:'9px 14px', color:CA, fontSize:12, fontWeight:700, fontFamily:'var(--FH)', cursor:'pointer' }}>
              ⚡ Core Pipeline →
            </button>
          </div>
        </aside>

        {/* Main workspace */}
        <main style={{ flex:1, overflowY:'auto', display:'flex', flexDirection:'column' }}>
          {!selectedAgent ? (
            /* Welcome state */
            <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', flex:1, padding:'60px 32px', textAlign:'center' }}>
              <div style={{ fontSize:48, marginBottom:20 }}>🤖</div>
              <h1 style={{ fontFamily:'var(--FH)', fontSize:24, fontWeight:800, color:C1, margin:'0 0 12px', letterSpacing:'-0.03em' }}>Agent Hub</h1>
              <p style={{ fontSize:14, color:C2, maxWidth:480, lineHeight:'1.7', margin:'0 0 28px' }}>
                10 specialised AI agents for every phase of your content workflow. Select an agent from the sidebar to get started.
              </p>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(2, 1fr)', gap:12, maxWidth:480, width:'100%' }}>
                {[
                  { icon:'📡', label:'Trend Spy', desc:'48-hr niche brief', tier:'pro' },
                  { icon:'🥊', label:'Title Battle', desc:'10 CTR-ranked titles', tier:'pro' },
                  { icon:'🔬', label:'Competitor Autopsy', desc:'Full channel dissection', tier:'studio' },
                  { icon:'💰', label:'Monetisation Coach', desc:'Revenue roadmap', tier:'studio' },
                ].map(item => (
                  <div key={item.label} style={{ background:'rgba(255,255,255,0.02)', border:`1px solid ${CB}`, borderRadius:10, padding:'14px 16px', textAlign:'left', cursor:'pointer' }}
                    onClick={() => setSelectedId(AGENT_GROUPS.flatMap(g => g.agents).find(a => a.name === item.label)?.id)}>
                    <span style={{ fontSize:20, display:'block', marginBottom:6 }}>{item.icon}</span>
                    <p style={{ fontSize:13, fontWeight:700, color:C1, margin:'0 0 3px' }}>{item.label}</p>
                    <p style={{ fontSize:11, color:C3, margin:0 }}>{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            /* Agent workspace */
            <div style={{ padding:'28px 32px', maxWidth:720, width:'100%', margin:'0 auto' }}>

              {/* Agent header */}
              <div style={{ display:'flex', alignItems:'flex-start', gap:14, marginBottom:24, paddingBottom:20, borderBottom:`1px solid ${CB}` }}>
                <span style={{ fontSize:32 }}>{selectedAgent.icon}</span>
                <div style={{ flex:1 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:6, flexWrap:'wrap' }}>
                    <h2 style={{ fontFamily:'var(--FH)', fontSize:20, fontWeight:800, color:C1, margin:0, letterSpacing:'-0.02em' }}>{selectedAgent.name}</h2>
                    <span style={{ background:`${selectedAgent.tierColor}18`, border:`1px solid ${selectedAgent.tierColor}30`, borderRadius:4, padding:'2px 9px', color:selectedAgent.tierColor, fontSize:10, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.06em' }}>{selectedAgent.tier}</span>
                  </div>
                  <p style={{ fontSize:13, color:C2, margin:0, lineHeight:'1.6' }}>{selectedAgent.desc}</p>
                </div>
              </div>

              {isLocked ? (
                <UpgradePrompt requiredPlan={selectedAgent.tier} agentName={selectedAgent.name} />
              ) : (
                <>
                  {/* Form */}
                  <AgentForm agent={selectedAgent} onSubmit={handleRun} isRunning={isRunning} disabled={false} />

                  {/* Error */}
                  {error && (
                    <div style={{ background:'rgba(248,113,113,0.07)', border:'1px solid rgba(248,113,113,0.2)', borderRadius:8, padding:'11px 14px', color:'#F87171', fontSize:13, display:'flex', gap:8, marginTop:14 }}>
                      ● {error}
                    </div>
                  )}

                  {/* Loading bar */}
                  {isRunning && (
                    <div style={{ background:'rgba(255,255,255,0.02)', border:`1px solid ${CB}`, borderRadius:10, padding:'18px 20px', marginTop:20, display:'flex', alignItems:'center', gap:14 }}>
                      <Spinner size={18} />
                      <div style={{ flex:1 }}>
                        <p style={{ fontSize:13, color:C1, fontWeight:600, margin:'0 0 4px' }}>Running {selectedAgent.name}…</p>
                        <p style={{ fontSize:12, color:C3, margin:0 }}>This takes 10–30 seconds depending on complexity</p>
                      </div>
                      <span style={{ fontFamily:'var(--FM)', fontSize:13, color:CA }}>{(elapsed/1000).toFixed(1)}s</span>
                    </div>
                  )}

                  {/* Results */}
                  {result && result.agentId === selectedId && (
                    <div ref={resultsRef} style={{ marginTop:28 }}>
                      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16, paddingBottom:12, borderBottom:`1px solid ${CB}` }}>
                        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                          <span style={{ background:'rgba(62,207,142,0.1)', border:'1px solid rgba(62,207,142,0.2)', borderRadius:5, padding:'4px 10px', color:'#3ECF8E', fontSize:11, fontWeight:700 }}>✓ Complete</span>
                          {result.duration && <span style={{ fontFamily:'var(--FM)', fontSize:11, color:C3 }}>{(result.duration/1000).toFixed(1)}s</span>}
                        </div>
                        <button onClick={() => setResult(null)} style={{ background:'transparent', border:'none', color:C3, fontSize:12, cursor:'pointer', fontFamily:'var(--FB)' }}>Clear ✕</button>
                      </div>

                      {(() => {
                        const Renderer = RESULT_COMPONENTS[result.agentId];
                        return Renderer ? <Renderer data={result.data} /> : (
                          <pre style={{ fontSize:12, color:C2, fontFamily:'var(--FM)', lineHeight:'1.6', whiteSpace:'pre-wrap', background:'rgba(255,255,255,0.02)', borderRadius:8, padding:14 }}>
                            {JSON.stringify(result.data, null, 2)}
                          </pre>
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
  );
}