'use client';
import { useState } from 'react';
import SceneCard    from '@/components/app/SceneCard';
import HookExplainer from '@/components/app/HookExplainer';
import SprintTracker from '@/components/app/SprintTracker';

/**
 * ResultTabs — 6-tab display for the complete generation pack
 *
 * Props:
 *   research   {object} — from API
 *   creator    {object} — from API
 *   publisher  {object} — from API
 *   input      {object} — { niche, platform, creatorType, language, tone }
 */

// ── Shared copy button ────────────────────────────────────────────────────────
function CopyBtn({ text, label = 'Copy' }) {
  const [copied, setCopied] = useState(false);
  function go() {
    navigator.clipboard.writeText(text || '').then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    });
  }
  return (
    <button onClick={go} style={{
      display:      'inline-flex',
      alignItems:   'center',
      gap:          '5px',
      background:   copied ? 'rgba(62,207,142,0.1)' : 'rgba(255,255,255,0.04)',
      border:       `1px solid ${copied ? 'rgba(62,207,142,0.25)' : 'rgba(255,255,255,0.08)'}`,
      borderRadius: '6px',
      padding:      '5px 12px',
      fontSize:     '11px',
      color:        copied ? '#3ECF8E' : 'rgba(238,238,245,0.4)',
      cursor:       'pointer',
      fontFamily:   'var(--FM, "Space Mono", monospace)',
      transition:   'all 0.2s',
      whiteSpace:   'nowrap',
    }}>
      {copied ? '✓ Copied' : label}
    </button>
  );
}

// ── Section wrapper ───────────────────────────────────────────────────────────
function Section({ label, children, copyText, gold = false }) {
  return (
    <div style={{ marginBottom: '28px' }}>
      <div style={{
        display:        'flex',
        alignItems:     'center',
        justifyContent: 'space-between',
        marginBottom:   '12px',
      }}>
        <span style={{
          fontSize:      '9px',
          fontWeight:    '700',
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          color:         gold ? '#D4A847' : 'rgba(238,238,245,0.25)',
          fontFamily:    'var(--FM)',
        }}>{label}</span>
        {copyText && <CopyBtn text={copyText} />}
      </div>
      {children}
    </div>
  );
}

// ── Prose block ───────────────────────────────────────────────────────────────
function Prose({ children }) {
  return (
    <div style={{
      background:   'rgba(255,255,255,0.02)',
      border:       '1px solid rgba(255,255,255,0.055)',
      borderRadius: '10px',
      padding:      '16px 18px',
      fontSize:     '13px',
      color:        'rgba(238,238,245,0.8)',
      lineHeight:   '1.75',
      fontFamily:   'var(--FB)',
      whiteSpace:   'pre-wrap',
      wordBreak:    'break-word',
    }}>
      {children}
    </div>
  );
}

// ── Tag chip ─────────────────────────────────────────────────────────────────
function Chip({ label, color = '#D4A847' }) {
  return (
    <span style={{
      display:      'inline-block',
      padding:      '4px 10px',
      borderRadius: '6px',
      fontSize:     '11px',
      fontWeight:   '600',
      fontFamily:   'var(--FM)',
      background:   `${color}12`,
      border:       `1px solid ${color}28`,
      color:        color,
      margin:       '3px',
      whiteSpace:   'nowrap',
    }}>
      {label}
    </span>
  );
}

// ── Tabs config ───────────────────────────────────────────────────────────────
const TABS = [
  { id: 'script',   label: '📄 Script'          },
  { id: 'scenes',   label: '🎬 Scenes'          },
  { id: 'hook',     label: '🪝 Hook Psychology'  },
  { id: 'youtube',  label: '▶️ YouTube SEO'      },
  { id: 'social',   label: '📱 Social'           },
  { id: 'plan',     label: '📅 7-Day Plan'       },
];

// ─────────────────────────────────────────────────────────────────────────────
export default function ResultTabs({ research = {}, creator = {}, publisher = {}, input = {} }) {
  const [activeTab, setActiveTab] = useState('script');

  const yt = publisher.youtube      || {};
  const ig = publisher.instagram    || {};
  const tt = publisher.tiktok       || {};
  const bl = publisher.blog         || {};
  const ps = publisher.posting_schedule || {};

  return (
    <>
      <style>{`
        .rt-root { display: flex; flex-direction: column; }

        /* Tab bar */
        .rt-tabs {
          display: flex;
          gap: 2px;
          border-bottom: 1px solid rgba(255,255,255,0.06);
          overflow-x: auto;
          -webkit-overflow-scrolling: touch;
          scrollbar-width: none;
          padding-bottom: 1px;
          flex-shrink: 0;
        }
        .rt-tabs::-webkit-scrollbar { display: none; }

        .rt-tab {
          padding: 11px 16px;
          font-size: 12px;
          font-weight: 600;
          font-family: var(--FH, "Syne", sans-serif);
          color: rgba(238,238,245,0.35);
          background: transparent;
          border: none;
          border-bottom: 2px solid transparent;
          cursor: pointer;
          white-space: nowrap;
          transition: all 0.2s;
          margin-bottom: -1px;
          letter-spacing: -0.01em;
        }
        .rt-tab:hover { color: rgba(238,238,245,0.65); }
        .rt-tab.active {
          color: #D4A847;
          border-bottom-color: #D4A847;
        }

        /* Content pane */
        .rt-pane {
          padding: 28px 0;
          overflow-y: auto;
          flex: 1;
        }

        /* Title option card */
        .title-option {
          display: flex;
          gap: 12px;
          align-items: flex-start;
          padding: 14px 16px;
          background: rgba(255,255,255,0.02);
          border: 1px solid rgba(255,255,255,0.055);
          border-radius: 10px;
          margin-bottom: 8px;
          transition: border-color 0.2s;
        }
        .title-option:hover { border-color: rgba(212,168,71,0.2); }
        .title-option-rank {
          width: 24px;
          height: 24px;
          border-radius: 6px;
          background: rgba(212,168,71,0.1);
          border: 1px solid rgba(212,168,71,0.2);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 11px;
          font-weight: 700;
          color: #D4A847;
          font-family: var(--FM);
          flex-shrink: 0;
        }
        .title-option-body { flex: 1; min-width: 0; }
        .title-option-title {
          font-size: 14px;
          font-weight: 600;
          color: rgba(238,238,245,0.9);
          font-family: var(--FB);
          margin-bottom: 4px;
          line-height: 1.4;
        }
        .title-option-meta {
          display: flex;
          gap: 8px;
          align-items: center;
          flex-wrap: wrap;
          margin-top: 6px;
        }
        .title-meta-item {
          font-size: 10px;
          color: rgba(238,238,245,0.3);
          font-family: var(--FM);
        }

        /* CTA box */
        .cta-box {
          background: rgba(212,168,71,0.05);
          border: 1px solid rgba(212,168,71,0.15);
          border-radius: 10px;
          padding: 16px 18px;
          margin-bottom: 10px;
        }
        .cta-text {
          font-size: 14px;
          color: rgba(238,238,245,0.9);
          font-family: var(--FB);
          font-style: italic;
          margin-bottom: 8px;
          line-height: 1.6;
        }
        .cta-meta {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }
        .cta-meta-chip {
          font-size: 10px;
          font-family: var(--FM);
          padding: 3px 8px;
          border-radius: 4px;
          background: rgba(255,255,255,0.04);
          color: rgba(238,238,245,0.3);
        }

        /* Social platform header */
        .social-platform {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 12px 16px;
          background: rgba(255,255,255,0.02);
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 10px 10px 0 0;
          border-bottom: none;
        }
        .social-platform-icon { font-size: 20px; }
        .social-platform-name {
          font-family: var(--FH);
          font-size: 14px;
          font-weight: 700;
          color: rgba(238,238,245,0.8);
        }
        .social-platform-body {
          background: rgba(255,255,255,0.018);
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 0 0 10px 10px;
          padding: 16px 18px;
          margin-bottom: 20px;
        }

        @media (max-width: 640px) {
          .rt-tab { padding: 10px 12px; font-size: 11px; }
        }
      `}</style>

      <div className="rt-root">
        {/* Tab bar */}
        <div className="rt-tabs">
          {TABS.map(t => (
            <button
              key={t.id}
              className={`rt-tab ${activeTab === t.id ? 'active' : ''}`}
              onClick={() => setActiveTab(t.id)}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* ── SCRIPT TAB ────────────────────────────────────────────────────── */}
        {activeTab === 'script' && (
          <div className="rt-pane">
            <Section label="📄 Full Script" copyText={creator.full_script} gold>
              <Prose>{creator.full_script || 'No script generated.'}</Prose>
            </Section>

            {/* Meta */}
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '28px' }}>
              {creator.estimated_duration && <Chip label={`⏱ ${creator.estimated_duration}`} />}
              {creator.word_count > 0 && <Chip label={`📝 ${creator.word_count} words`} />}
              {input.language && <Chip label={`🌐 ${input.language}`} color="#4A90D9" />}
              {input.tone && <Chip label={`🎭 ${input.tone}`} color="#8B5CF6" />}
            </div>

            {/* Shorts script */}
            {creator.shorts_script && (
              <Section label="⚡ Shorts / Reels Version (60s)" copyText={creator.shorts_script}>
                <Prose>{creator.shorts_script}</Prose>
              </Section>
            )}

            {/* CTAs */}
            {Array.isArray(creator.cta_options) && creator.cta_options.length > 0 && (
              <Section label="📣 CTA Options">
                {creator.cta_options.map((cta, i) => (
                  <div key={i} className="cta-box">
                    <div className="cta-text">"{cta.cta_text}"</div>
                    <div className="cta-meta">
                      {cta.placement && <span className="cta-meta-chip">📍 {cta.placement}</span>}
                      {cta.goal && <span className="cta-meta-chip">🎯 {cta.goal}</span>}
                    </div>
                    {cta.why_it_works && (
                      <p style={{ fontSize: '12px', color: 'rgba(238,238,245,0.35)', marginTop: '8px', fontFamily: 'var(--FB)', lineHeight: '1.55' }}>
                        {cta.why_it_works}
                      </p>
                    )}
                  </div>
                ))}
              </Section>
            )}

            {/* Pattern interrupts */}
            {Array.isArray(creator.pattern_interrupts) && creator.pattern_interrupts.length > 0 && (
              <Section label="⚡ Pattern Interrupts">
                {creator.pattern_interrupts.map((pi, i) => (
                  <div key={i} style={{
                    display: 'flex', gap: '12px', alignItems: 'flex-start',
                    padding: '12px 14px',
                    background: 'rgba(245,158,11,0.05)',
                    border: '1px solid rgba(245,158,11,0.15)',
                    borderRadius: '8px',
                    marginBottom: '8px',
                  }}>
                    <span style={{ fontSize: '11px', color: '#F59E0B', fontFamily: 'var(--FM)', whiteSpace: 'nowrap', paddingTop: '1px' }}>
                      {pi.timestamp}
                    </span>
                    <div>
                      <div style={{ fontSize: '11px', fontWeight: '700', color: '#F59E0B', fontFamily: 'var(--FM)', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{pi.technique}</div>
                      <div style={{ fontSize: '12px', color: 'rgba(238,238,245,0.6)', fontFamily: 'var(--FB)' }}>{pi.script_line}</div>
                    </div>
                  </div>
                ))}
              </Section>
            )}
          </div>
        )}

        {/* ── SCENES TAB ────────────────────────────────────────────────────── */}
        {activeTab === 'scenes' && (
          <div className="rt-pane">
            <Section label={`🎬 Scene Breakdown — ${creator.scenes?.length || 0} Scenes`}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {Array.isArray(creator.scenes) && creator.scenes.length > 0
                  ? creator.scenes.map(scene => <SceneCard key={scene.scene_number} scene={scene} />)
                  : <Prose>No scene data available.</Prose>
                }
              </div>
            </Section>
          </div>
        )}

        {/* ── HOOK PSYCHOLOGY TAB ───────────────────────────────────────────── */}
        {activeTab === 'hook' && (
          <div className="rt-pane">
            <HookExplainer
              hookBreakdown={creator.hook_breakdown}
              chosenHook={research.chosen_hook}
              hookTrigger={research.chosen_hook_trigger}
            />

            {/* Deep analysis from research */}
            {research.chosen_hook_deep_analysis && (
              <div style={{ marginTop: '24px' }}>
                <Section label="🧪 Deep Analysis" copyText={research.chosen_hook_deep_analysis}>
                  <Prose>{research.chosen_hook_deep_analysis}</Prose>
                </Section>
              </div>
            )}

            {/* All hook options */}
            {Array.isArray(research.hook_options) && research.hook_options.length > 0 && (
              <div style={{ marginTop: '24px' }}>
                <Section label="🎣 All Hook Options Considered">
                  {research.hook_options.map((h, i) => (
                    <div key={i} style={{
                      padding: '14px 16px',
                      background: h.hook_text === research.chosen_hook ? 'rgba(212,168,71,0.07)' : 'rgba(255,255,255,0.02)',
                      border: `1px solid ${h.hook_text === research.chosen_hook ? 'rgba(212,168,71,0.2)' : 'rgba(255,255,255,0.055)'}`,
                      borderRadius: '10px',
                      marginBottom: '8px',
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                        {h.hook_text === research.chosen_hook && (
                          <span style={{ fontSize: '10px', color: '#D4A847', fontFamily: 'var(--FM)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.06em' }}>★ Chosen</span>
                        )}
                        <span style={{ fontSize: '10px', color: 'rgba(238,238,245,0.3)', fontFamily: 'var(--FM)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{h.psychological_trigger}</span>
                        {h.ctr_strength && <Chip label={h.ctr_strength} color={h.ctr_strength === 'HIGH' ? '#3ECF8E' : h.ctr_strength === 'MEDIUM' ? '#F59E0B' : '#F87171'} />}
                      </div>
                      <div style={{ fontSize: '14px', color: 'rgba(238,238,245,0.85)', fontFamily: 'var(--FB)', lineHeight: '1.6', marginBottom: '6px' }}>
                        "{h.hook_text}"
                      </div>
                      {h.trigger_explanation && (
                        <div style={{ fontSize: '12px', color: 'rgba(238,238,245,0.4)', fontFamily: 'var(--FB)', lineHeight: '1.5' }}>
                          {h.trigger_explanation}
                        </div>
                      )}
                    </div>
                  ))}
                </Section>
              </div>
            )}
          </div>
        )}

        {/* ── YOUTUBE SEO TAB ───────────────────────────────────────────────── */}
        {activeTab === 'youtube' && (
          <div className="rt-pane">
            {/* Recommended title */}
            {yt.recommended_title && (
              <Section label="⭐ Recommended Title" copyText={yt.recommended_title} gold>
                <div style={{
                  padding: '16px 18px',
                  background: 'rgba(212,168,71,0.08)',
                  border: '1px solid rgba(212,168,71,0.2)',
                  borderRadius: '10px',
                  fontSize: '16px',
                  fontWeight: '700',
                  color: 'rgba(238,238,245,0.95)',
                  fontFamily: 'var(--FH)',
                  letterSpacing: '-0.02em',
                }}>
                  {yt.recommended_title}
                </div>
              </Section>
            )}

            {/* Title options */}
            {Array.isArray(yt.title_options) && yt.title_options.length > 0 && (
              <Section label="📊 All Title Variants">
                {yt.title_options.map((t, i) => (
                  <div key={i} className="title-option">
                    <div className="title-option-rank">{i + 1}</div>
                    <div className="title-option-body">
                      <div className="title-option-title">{t.title}</div>
                      {t.reasoning && (
                        <div style={{ fontSize: '12px', color: 'rgba(238,238,245,0.4)', fontFamily: 'var(--FB)', lineHeight: '1.5' }}>
                          {t.reasoning}
                        </div>
                      )}
                      <div className="title-option-meta">
                        {t.character_count > 0 && <span className="title-meta-item">{t.character_count} chars</span>}
                        {t.primary_strategy && <span className="title-meta-item">· {t.primary_strategy}</span>}
                        {t.ctr_prediction && <span className="title-meta-item" style={{ color: t.ctr_prediction === 'HIGH' ? '#3ECF8E' : '#F59E0B' }}>· CTR: {t.ctr_prediction}</span>}
                      </div>
                    </div>
                    <CopyBtn text={t.title} />
                  </div>
                ))}
              </Section>
            )}

            {/* Description */}
            {yt.description && (
              <Section label="📝 YouTube Description" copyText={yt.description}>
                <Prose>{yt.description}</Prose>
              </Section>
            )}

            {/* Tags */}
            {Array.isArray(yt.tags) && yt.tags.length > 0 && (
              <Section label={`🏷️ Tags (${yt.tags.length})`} copyText={yt.tags.join(', ')}>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                  {yt.tags.map((tag, i) => <Chip key={i} label={tag} />)}
                </div>
              </Section>
            )}

            {/* Primary keyword */}
            {yt.primary_keyword && (
              <Section label="🔑 Primary Keyword">
                <Chip label={yt.primary_keyword} color="#4A90D9" />
                {Array.isArray(yt.secondary_keywords) && yt.secondary_keywords.length > 0 && (
                  <div style={{ marginTop: '8px', display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                    {yt.secondary_keywords.map((k, i) => <Chip key={i} label={k} color="rgba(74,144,217,0.6)" />)}
                  </div>
                )}
              </Section>
            )}

            {/* End screen / cards */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '28px' }}>
              {yt.end_screen_recommendation && (
                <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.055)', borderRadius: '10px', padding: '14px 16px' }}>
                  <div style={{ fontSize: '9px', fontWeight: '700', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(238,238,245,0.25)', fontFamily: 'var(--FM)', marginBottom: '8px' }}>📺 End Screen</div>
                  <div style={{ fontSize: '12px', color: 'rgba(238,238,245,0.6)', fontFamily: 'var(--FB)', lineHeight: '1.6' }}>{yt.end_screen_recommendation}</div>
                </div>
              )}
              {yt.card_recommendation && (
                <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.055)', borderRadius: '10px', padding: '14px 16px' }}>
                  <div style={{ fontSize: '9px', fontWeight: '700', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(238,238,245,0.25)', fontFamily: 'var(--FM)', marginBottom: '8px' }}>🃏 Cards</div>
                  <div style={{ fontSize: '12px', color: 'rgba(238,238,245,0.6)', fontFamily: 'var(--FB)', lineHeight: '1.6' }}>{yt.card_recommendation}</div>
                </div>
              )}
            </div>

            {/* Blog SEO */}
            {bl.seo_title && (
              <>
                <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '24px', marginBottom: '20px' }}>
                  <span style={{ fontSize: '10px', fontWeight: '700', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(238,238,245,0.25)', fontFamily: 'var(--FM)' }}>✍️ Blog / SEO</span>
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
                      <div key={i} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', marginBottom: '6px', fontSize: '13px', color: 'rgba(238,238,245,0.7)', fontFamily: 'var(--FB)' }}>
                        <span style={{ color: '#D4A847', fontFamily: 'var(--FM)', fontSize: '11px', paddingTop: '2px', flexShrink: 0 }}>H2</span>
                        <span>{h}</span>
                      </div>
                    ))}
                  </Section>
                )}
              </>
            )}
          </div>
        )}

        {/* ── SOCIAL TAB ────────────────────────────────────────────────────── */}
        {activeTab === 'social' && (
          <div className="rt-pane">
            {/* Instagram */}
            {ig.caption && (
              <>
                <div className="social-platform">
                  <span className="social-platform-icon">📸</span>
                  <span className="social-platform-name">Instagram</span>
                  <div style={{ marginLeft: 'auto' }}>
                    <CopyBtn text={[ig.caption, '', ig.hashtags?.map(h => `#${h.replace(/^#/, '')}`).join(' ')].filter(Boolean).join('\n')} label="Copy All" />
                  </div>
                </div>
                <div className="social-platform-body">
                  <Section label="Caption" copyText={ig.caption}>
                    <Prose>{ig.caption}</Prose>
                  </Section>
                  {ig.reel_cover_text && (
                    <Section label="Reel Cover Text">
                      <Chip label={ig.reel_cover_text} />
                    </Section>
                  )}
                  {ig.save_cta && (
                    <Section label="Save CTA" copyText={ig.save_cta}>
                      <Prose>{ig.save_cta}</Prose>
                    </Section>
                  )}
                  {Array.isArray(ig.hashtags) && ig.hashtags.length > 0 && (
                    <Section label={`Hashtags (${ig.hashtags.length})`} copyText={ig.hashtags.map(h => `#${h.replace(/^#/, '')}`).join(' ')}>
                      <div style={{ display: 'flex', flexWrap: 'wrap' }}>
                        {ig.hashtags.map((h, i) => <Chip key={i} label={`#${h.replace(/^#/, '')}`} color="#EC4899" />)}
                      </div>
                    </Section>
                  )}
                </div>
              </>
            )}

            {/* TikTok */}
            {tt.caption && (
              <>
                <div className="social-platform">
                  <span className="social-platform-icon">🎵</span>
                  <span className="social-platform-name">TikTok</span>
                  <div style={{ marginLeft: 'auto' }}>
                    <CopyBtn text={[tt.caption, tt.hashtags?.join(' ')].filter(Boolean).join('\n')} label="Copy All" />
                  </div>
                </div>
                <div className="social-platform-body">
                  <Section label="Caption" copyText={tt.caption}>
                    <Prose>{tt.caption}</Prose>
                  </Section>
                  {tt.first_frame_text && (
                    <Section label="First Frame Text">
                      <Chip label={tt.first_frame_text} />
                    </Section>
                  )}
                  {tt.duet_stitch_suggestion && (
                    <Section label="Duet / Stitch Hook" copyText={tt.duet_stitch_suggestion}>
                      <Prose>{tt.duet_stitch_suggestion}</Prose>
                    </Section>
                  )}
                  {Array.isArray(tt.hashtags) && tt.hashtags.length > 0 && (
                    <Section label="Hashtags" copyText={tt.hashtags.join(' ')}>
                      <div style={{ display: 'flex', flexWrap: 'wrap' }}>
                        {tt.hashtags.map((h, i) => <Chip key={i} label={h} color="#4A90D9" />)}
                      </div>
                    </Section>
                  )}
                  {tt.trending_sound_category && (
                    <Section label="Sound Category">
                      <Chip label={tt.trending_sound_category} color="#8B5CF6" />
                    </Section>
                  )}
                </div>
              </>
            )}

            {/* Cross-platform repurpose */}
            {Array.isArray(publisher.cross_platform_repurpose) && publisher.cross_platform_repurpose.length > 0 && (
              <Section label="♻️ Repurpose Across Platforms">
                {publisher.cross_platform_repurpose.map((r, i) => (
                  <div key={i} style={{
                    padding: '12px 14px',
                    background: 'rgba(255,255,255,0.02)',
                    border: '1px solid rgba(255,255,255,0.055)',
                    borderRadius: '8px',
                    marginBottom: '8px',
                  }}>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '6px' }}>
                      <Chip label={r.platform} />
                      {r.format && <Chip label={r.format} color="#8B5CF6" />}
                    </div>
                    <div style={{ fontSize: '12px', color: 'rgba(238,238,245,0.55)', fontFamily: 'var(--FB)', lineHeight: '1.6' }}>{r.specific_angle}</div>
                  </div>
                ))}
              </Section>
            )}

            {/* Posting schedule */}
            {ps.primary_post_day && (
              <Section label="🕐 Posting Schedule">
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center', marginBottom: '10px' }}>
                  <Chip label={`📅 ${ps.primary_post_day}`} color="#D4A847" />
                  {ps.primary_post_time && <Chip label={`🕐 ${ps.primary_post_time}`} color="#D4A847" />}
                  {ps.follow_up_story_timing && <Chip label={`+📱 ${ps.follow_up_story_timing}`} color="rgba(212,168,71,0.6)" />}
                </div>
                {ps.reasoning && (
                  <div style={{ fontSize: '12px', color: 'rgba(238,238,245,0.45)', fontFamily: 'var(--FB)', lineHeight: '1.6' }}>
                    {ps.reasoning}
                  </div>
                )}
              </Section>
            )}
          </div>
        )}

        {/* ── 7-DAY PLAN TAB ────────────────────────────────────────────────── */}
        {activeTab === 'plan' && (
          <div className="rt-pane">
            <SprintTracker
              plan={publisher.seven_day_content_plan}
              platform={input.platform || 'YouTube'}
            />
          </div>
        )}
      </div>
    </>
  );
}