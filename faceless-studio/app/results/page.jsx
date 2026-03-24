'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

// ─── Tab definitions ──────────────────────────────────────────────────────────
const TABS = [
  { id: 'script',    label: '📝 Script' },
  { id: 'scenes',    label: '🎬 Scenes' },
  { id: 'hook',      label: '🧠 Hook Psychology' },
  { id: 'youtube',   label: '▶ YouTube SEO' },
  { id: 'social',    label: '📱 Social' },
  { id: 'plan',      label: '📅 7-Day Plan' },
];

export default function ResultsPage() {
  const router = useRouter();
  const [result,  setResult]  = useState(null);
  const [tab,     setTab]     = useState('script');
  const [copied,  setCopied]  = useState('');

  useEffect(() => {
    const raw = sessionStorage.getItem('studioai_result');
    if (!raw) { router.replace('/generate'); return; }
    try { setResult(JSON.parse(raw)); } catch { router.replace('/generate'); }
  }, []);

  function copy(text, id) {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(id);
      setTimeout(() => setCopied(''), 2000);
    });
  }

  if (!result) return (
    <div style={styles.splash}>
      <div style={styles.spinner} />
    </div>
  );

  const { research, creator, publisher, meta, input } = result;

  return (
    <div style={styles.page}>
      {/* BG */}
      <div style={{...styles.blob, top:'-10%', left:'-5%',  background:'radial-gradient(circle, rgba(233,161,0,0.08) 0%, transparent 60%)'}}/>
      <div style={{...styles.blob, bottom:'-10%', right:'-5%', background:'radial-gradient(circle, rgba(12,170,220,0.07) 0%, transparent 60%)'}}/>

      {/* Nav */}
      <nav style={styles.nav}>
        <div style={styles.navLogo}>
          <span style={{color:'var(--gold)',fontSize:'20px'}}>⬡</span>
          <span style={styles.navLogoText}>Studio AI</span>
        </div>
        <div style={styles.navRight}>
          {meta?.streak > 1 && <span style={styles.streak}>🔥 {meta.streak} day streak</span>}
          <span style={styles.timePill}>Generated in {((meta?.total_duration_ms||0)/1000).toFixed(1)}s</span>
          <button style={styles.newBtn} onClick={() => router.push('/generate')}>+ New</button>
        </div>
      </nav>

      {/* Topic banner */}
      <div style={styles.topicBanner}>
        <div style={styles.topicInner}>
          <p style={styles.topicLabel}>Generated Content Pack</p>
          <h1 style={styles.topicTitle}>{research?.chosen_topic}</h1>
          <div style={styles.topicMeta}>
            <span style={styles.metaTag}>{input?.platform}</span>
            <span style={styles.metaTag}>{input?.language}</span>
            <span style={styles.metaTag}>{input?.tone}</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={styles.tabBar}>
        <div style={styles.tabBarInner}>
          {TABS.map(t => (
            <button key={t.id}
              style={{...styles.tabBtn, ...(tab === t.id ? styles.tabBtnActive : {})}}
              onClick={() => setTab(t.id)}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div style={styles.content}>
        {tab === 'script'  && <ScriptTab  creator={creator}  copy={copy} copied={copied}/>}
        {tab === 'scenes'  && <ScenesTab  creator={creator}  copy={copy} copied={copied}/>}
        {tab === 'hook'    && <HookTab    research={research} creator={creator}/>}
        {tab === 'youtube' && <YouTubeTab publisher={publisher} copy={copy} copied={copied}/>}
        {tab === 'social'  && <SocialTab  publisher={publisher} copy={copy} copied={copied}/>}
        {tab === 'plan'    && <PlanTab    publisher={publisher}/>}
      </div>
    </div>
  );
}

// ─── Script Tab ───────────────────────────────────────────────────────────────
function ScriptTab({ creator, copy, copied }) {
  if (!creator) return <EmptyState msg="Script data not available" />;
  return (
    <div style={styles.tabContent}>
      <div style={styles.statsRow}>
        <StatCard label="Word Count"       value={creator.word_count || '—'} />
        <StatCard label="Est. Duration"    value={creator.estimated_duration || '—'} />
        <StatCard label="Scenes"           value={creator.scenes?.length || '—'} />
        <StatCard label="Pattern Interrupts" value={creator.pattern_interrupts?.length || '—'} />
      </div>

      <Section title="Full Script" action={<CopyBtn id="full_script" copied={copied} onCopy={() => copy(creator.full_script, 'full_script')} />}>
        <pre style={styles.scriptPre}>{creator.full_script}</pre>
      </Section>

      {creator.shorts_script && (
        <Section title="60-Second Short / Reel Version" action={<CopyBtn id="shorts" copied={copied} onCopy={() => copy(creator.shorts_script, 'shorts')} />}>
          <pre style={styles.scriptPre}>{creator.shorts_script}</pre>
        </Section>
      )}

      {creator.cta_options?.length > 0 && (
        <Section title="CTA Options">
          {creator.cta_options.map((cta, i) => (
            <div key={i} style={styles.ctaCard}>
              <div style={styles.ctaTop}>
                <span style={styles.ctaBadge}>{cta.goal}</span>
                <span style={styles.ctaPlacement}>{cta.placement}</span>
              </div>
              <p style={styles.ctaText}>"{cta.cta_text}"</p>
              <p style={styles.ctaWhy}>{cta.why_it_works}</p>
            </div>
          ))}
        </Section>
      )}
    </div>
  );
}

// ─── Scenes Tab ───────────────────────────────────────────────────────────────
function ScenesTab({ creator, copy, copied }) {
  if (!creator?.scenes?.length) return <EmptyState msg="Scene data not available" />;
  return (
    <div style={styles.tabContent}>
      <p style={styles.sectionDesc}>Each scene is a complete filming brief. Use visual_direction for B-roll, overlay_text for on-screen graphics.</p>
      {creator.scenes.map((scene, i) => (
        <div key={i} style={styles.sceneCard}>
          <div style={styles.sceneHeader}>
            <span style={styles.sceneNum}>Scene {scene.scene_number}</span>
            <span style={styles.sceneType}>{scene.section_type}</span>
            <span style={styles.sceneTime}>{scene.timestamp_start} – {scene.timestamp_end}</span>
          </div>
          <div style={styles.sceneGrid}>
            <div style={styles.sceneVoiceover}>
              <p style={styles.sceneFieldLabel}>🎙 Voiceover</p>
              <p style={styles.sceneFieldVal}>{scene.voiceover}</p>
            </div>
            <div style={styles.sceneDetails}>
              {scene.visual_direction && (
                <div style={styles.sceneDetail}>
                  <span style={styles.sceneDetailLabel}>🎥 Visual</span>
                  <span style={styles.sceneDetailVal}>{scene.visual_direction}</span>
                </div>
              )}
              {scene.overlay_text && (
                <div style={styles.sceneDetail}>
                  <span style={styles.sceneDetailLabel}>📝 Overlay</span>
                  <span style={styles.sceneDetailVal}>{scene.overlay_text}</span>
                </div>
              )}
              {scene.b_roll_search_term && (
                <div style={styles.sceneDetail}>
                  <span style={styles.sceneDetailLabel}>🔍 B-Roll</span>
                  <span style={{...styles.sceneDetailVal, color:'var(--blue-hi)'}}>{scene.b_roll_search_term}</span>
                </div>
              )}
              {scene.tone_direction && (
                <div style={styles.sceneDetail}>
                  <span style={styles.sceneDetailLabel}>🎭 Tone</span>
                  <span style={styles.sceneDetailVal}>{scene.tone_direction}</span>
                </div>
              )}
              {scene.retention_technique && (
                <div style={styles.sceneDetail}>
                  <span style={styles.sceneDetailLabel}>⚡ Retention</span>
                  <span style={{...styles.sceneDetailVal, color:'var(--gold)'}}>{scene.retention_technique}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Hook Psychology Tab ──────────────────────────────────────────────────────
function HookTab({ research, creator }) {
  return (
    <div style={styles.tabContent}>
      {/* Chosen hook */}
      <div style={styles.hookHero}>
        <p style={styles.hookHeroLabel}>Chosen Hook</p>
        <p style={styles.hookHeroText}>"{research?.chosen_hook}"</p>
        <span style={styles.triggerBadge}>{research?.chosen_hook_trigger}</span>
      </div>

      {research?.chosen_hook_deep_analysis && (
        <Section title="Deep Psychology Analysis">
          <p style={styles.analysisText}>{research.chosen_hook_deep_analysis}</p>
        </Section>
      )}

      {creator?.hook_breakdown && (
        <Section title="Hook Execution Breakdown">
          {[
            ['Psychological Mechanism',  creator.hook_breakdown.psychological_mechanism],
            ['Why It Works in 3 Seconds', creator.hook_breakdown.why_first_3_seconds],
            ["Viewer's Internal Monologue", creator.hook_breakdown.what_viewer_is_thinking],
            ['What Happens If It Fails',  creator.hook_breakdown.what_happens_if_hook_fails],
          ].map(([label, val]) => val && (
            <div key={label} style={styles.breakdownRow}>
              <p style={styles.breakdownLabel}>{label}</p>
              <p style={styles.breakdownVal}>{val}</p>
            </div>
          ))}
        </Section>
      )}

      {research?.hook_options?.length > 0 && (
        <Section title="All Hook Options Considered">
          {research.hook_options.map((h, i) => (
            <div key={i} style={styles.hookOptionCard}>
              <div style={styles.hookOptionTop}>
                <span style={styles.triggerBadge}>{h.psychological_trigger}</span>
                <span style={{...styles.ctrBadge, background: h.ctr_strength === 'HIGH' ? 'rgba(0,220,130,0.15)' : 'rgba(233,161,0,0.12)', color: h.ctr_strength === 'HIGH' ? '#00dc82' : 'var(--gold)'}}>
                  CTR: {h.ctr_strength}
                </span>
              </div>
              <p style={styles.hookOptionText}>"{h.hook_text}"</p>
              <p style={styles.hookOptionExplain}>{h.trigger_explanation}</p>
              {h.risk_factor && <p style={styles.hookRisk}>⚠ {h.risk_factor}</p>}
            </div>
          ))}
        </Section>
      )}

      {creator?.pattern_interrupts?.length > 0 && (
        <Section title="Pattern Interrupts in Script">
          {creator.pattern_interrupts.map((p, i) => (
            <div key={i} style={styles.patternRow}>
              <span style={styles.patternTime}>{p.timestamp}</span>
              <span style={styles.patternTech}>{p.technique}</span>
              <span style={styles.patternLine}>"{p.script_line}"</span>
            </div>
          ))}
        </Section>
      )}
    </div>
  );
}

// ─── YouTube Tab ──────────────────────────────────────────────────────────────
function YouTubeTab({ publisher, copy, copied }) {
  const yt = publisher?.youtube;
  if (!yt) return <EmptyState msg="YouTube data not available" />;
  return (
    <div style={styles.tabContent}>
      {/* Recommended Title */}
      <div style={styles.recTitle}>
        <p style={styles.recTitleLabel}>✅ Recommended Title</p>
        <p style={styles.recTitleText}>{yt.recommended_title}</p>
        <CopyBtn id="yt_title" copied={copied} onCopy={() => copy(yt.recommended_title, 'yt_title')} />
      </div>

      {/* Title options */}
      {yt.title_options?.length > 0 && (
        <Section title="All Title Options">
          {yt.title_options.map((t, i) => (
            <div key={i} style={styles.titleOptionCard}>
              <div style={styles.titleOptionTop}>
                <span style={{...styles.ctrBadge, background: t.ctr_prediction === 'HIGH' ? 'rgba(0,220,130,0.15)' : 'rgba(233,161,0,0.12)', color: t.ctr_prediction === 'HIGH' ? '#00dc82' : 'var(--gold)'}}>
                  CTR: {t.ctr_prediction}
                </span>
                <span style={styles.charCount}>{t.character_count || t.title?.length} chars</span>
                <span style={styles.titleStrategy}>{t.primary_strategy}</span>
              </div>
              <p style={styles.titleText}>{t.title}</p>
              <p style={styles.titleReason}>{t.reasoning}</p>
            </div>
          ))}
        </Section>
      )}

      {/* Description */}
      <Section title="YouTube Description" action={<CopyBtn id="yt_desc" copied={copied} onCopy={() => copy(yt.description, 'yt_desc')} />}>
        <pre style={styles.descPre}>{yt.description}</pre>
      </Section>

      {/* Keywords */}
      <Section title="SEO Keywords">
        <div style={styles.keywordRow}>
          <span style={styles.primaryKw}>{yt.primary_keyword}</span>
          {yt.secondary_keywords?.map(kw => (
            <span key={kw} style={styles.secKw}>{kw}</span>
          ))}
        </div>
      </Section>

      {/* Tags */}
      {yt.tags?.length > 0 && (
        <Section title="Tags" action={<CopyBtn id="yt_tags" copied={copied} onCopy={() => copy(yt.tags.join(', '), 'yt_tags')} />}>
          <div style={styles.tagsWrap}>
            {yt.tags.map((tag, i) => <span key={i} style={styles.tag}>{tag}</span>)}
          </div>
        </Section>
      )}

      {/* Cards & End screen */}
      <div style={styles.twoCol}>
        {yt.end_screen_recommendation && (
          <Section title="End Screen">
            <p style={styles.bodyText}>{yt.end_screen_recommendation}</p>
          </Section>
        )}
        {yt.card_recommendation && (
          <Section title="Cards">
            <p style={styles.bodyText}>{yt.card_recommendation}</p>
          </Section>
        )}
      </div>
    </div>
  );
}

// ─── Social Tab ───────────────────────────────────────────────────────────────
function SocialTab({ publisher, copy, copied }) {
  const ig  = publisher?.instagram;
  const tt  = publisher?.tiktok;
  const blog= publisher?.blog;
  return (
    <div style={styles.tabContent}>
      {ig && (
        <Section title="Instagram" action={<CopyBtn id="ig_caption" copied={copied} onCopy={() => copy(ig.caption + '\n\n' + ig.hashtags?.map(h => `#${h.replace(/^#/,'')}`).join(' '), 'ig_caption')} />}>
          <pre style={styles.captionPre}>{ig.caption}</pre>
          <div style={styles.hashtagsWrap}>
            {ig.hashtags?.map((h, i) => <span key={i} style={styles.hashtag}>#{h.replace(/^#/,'')}</span>)}
          </div>
          {ig.reel_cover_text && <p style={styles.igMeta}>Cover text: <strong style={{color:'var(--white)'}}>{ig.reel_cover_text}</strong></p>}
          {ig.save_cta && <p style={styles.igMeta}>Save CTA: <strong style={{color:'var(--gold)'}}>{ig.save_cta}</strong></p>}
        </Section>
      )}

      {tt && (
        <Section title="TikTok" action={<CopyBtn id="tt_caption" copied={copied} onCopy={() => copy(tt.caption + ' ' + tt.hashtags?.join(' '), 'tt_caption')} />}>
          <p style={styles.bodyText}>{tt.caption}</p>
          <div style={styles.hashtagsWrap}>
            {tt.hashtags?.map((h, i) => <span key={i} style={styles.hashtag}>{h.startsWith('#') ? h : `#${h}`}</span>)}
          </div>
          {tt.first_frame_text && <p style={styles.igMeta}>First frame: <strong style={{color:'var(--white)'}}>{tt.first_frame_text}</strong></p>}
          {tt.trending_sound_category && <p style={styles.igMeta}>Sound: <strong style={{color:'var(--blue-hi)'}}>{tt.trending_sound_category}</strong></p>}
          {tt.duet_stitch_suggestion && <p style={styles.igMeta}>Duet/Stitch: <strong style={{color:'var(--w8)'}}>{tt.duet_stitch_suggestion}</strong></p>}
        </Section>
      )}

      {blog && (
        <Section title="Blog / SEO">
          {[
            ['SEO Title',        blog.seo_title],
            ['Meta Description', blog.meta_description],
            ['URL Slug',         blog.url_slug],
            ['Primary Keyword',  blog.primary_keyword],
          ].map(([label, val]) => val && (
            <div key={label} style={styles.breakdownRow}>
              <p style={styles.breakdownLabel}>{label}</p>
              <p style={{...styles.breakdownVal, fontFamily: label === 'URL Slug' ? 'var(--FM)' : 'inherit', color: label === 'URL Slug' ? 'var(--blue-hi)' : 'var(--w8)'}}>{val}</p>
            </div>
          ))}
          {blog.suggested_h2_headers?.length > 0 && (
            <>
              <p style={{...styles.breakdownLabel, marginTop:'16px'}}>Suggested H2 Headers</p>
              {blog.suggested_h2_headers.map((h, i) => (
                <div key={i} style={styles.h2Row}>
                  <span style={styles.h2Num}>H2</span>
                  <span style={styles.h2Text}>{h}</span>
                </div>
              ))}
            </>
          )}
        </Section>
      )}

      {publisher?.cross_platform_repurpose?.length > 0 && (
        <Section title="Cross-Platform Repurpose Plan">
          {publisher.cross_platform_repurpose.map((r, i) => (
            <div key={i} style={styles.repurposeCard}>
              <div style={styles.repurposeTop}>
                <span style={styles.repurposePlat}>{r.platform}</span>
                <span style={styles.repurposeFormat}>{r.format}</span>
              </div>
              <p style={styles.repurposeAngle}>{r.specific_angle}</p>
            </div>
          ))}
        </Section>
      )}
    </div>
  );
}

// ─── 7-Day Plan Tab ───────────────────────────────────────────────────────────
function PlanTab({ publisher }) {
  const plan = publisher?.seven_day_content_plan;
  const schedule = publisher?.posting_schedule;
  if (!plan?.length) return <EmptyState msg="Content plan not available" />;

  return (
    <div style={styles.tabContent}>
      {schedule && (
        <div style={styles.scheduleBox}>
          <p style={styles.scheduleTitle}>📅 Optimal Posting Schedule</p>
          <div style={styles.scheduleRow}>
            <span style={styles.scheduleStat}>{schedule.primary_post_day}</span>
            <span style={styles.scheduleStat}>{schedule.primary_post_time}</span>
            {schedule.follow_up_story_timing && <span style={styles.scheduleStat}>Follow-up: {schedule.follow_up_story_timing}</span>}
          </div>
          {schedule.reasoning && <p style={styles.scheduleReason}>{schedule.reasoning}</p>}
        </div>
      )}

      <div style={styles.planGrid}>
        {plan.map((day, i) => (
          <div key={i} style={styles.dayCard}>
            <div style={styles.dayHeader}>
              <span style={styles.dayNum}>Day {day.day}</span>
              <span style={styles.dayType}>{day.content_type}</span>
            </div>
            <p style={styles.dayTopic}>{day.topic_angle}</p>
            <div style={styles.dayMeta}>
              <span style={styles.dayPlatform}>{day.platform}</span>
              {day.repurpose_from !== 'Original' && (
                <span style={styles.dayRepurpose}>↻ {day.repurpose_from}</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Helper components ────────────────────────────────────────────────────────
function Section({ title, children, action }) {
  return (
    <div style={styles.section}>
      <div style={styles.sectionHeader}>
        <h3 style={styles.sectionTitle}>{title}</h3>
        {action}
      </div>
      <div style={styles.sectionBody}>{children}</div>
    </div>
  );
}

function StatCard({ label, value }) {
  return (
    <div style={styles.statCard}>
      <p style={styles.statVal}>{value}</p>
      <p style={styles.statLabel}>{label}</p>
    </div>
  );
}

function CopyBtn({ id, copied, onCopy }) {
  return (
    <button style={{...styles.copyBtn, ...(copied === id ? styles.copyBtnDone : {})}} onClick={onCopy}>
      {copied === id ? '✓ Copied' : 'Copy'}
    </button>
  );
}

function EmptyState({ msg }) {
  return <div style={styles.empty}><p style={styles.emptyMsg}>{msg}</p></div>;
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = {
  splash: { minHeight:'100vh', background:'var(--void)', display:'flex', alignItems:'center', justifyContent:'center' },
  spinner: { width:'36px', height:'36px', border:'3px solid rgba(233,161,0,0.2)', borderTopColor:'var(--gold)', borderRadius:'50%', animation:'spin 0.8s linear infinite' },
  page: { minHeight:'100vh', background:'var(--void)', fontFamily:'var(--FB)', position:'relative', overflow:'hidden' },
  blob: { position:'absolute', width:'700px', height:'700px', borderRadius:'50%', pointerEvents:'none' },

  nav: { display:'flex', alignItems:'center', justifyContent:'space-between', padding:'20px 40px', borderBottom:'1px solid rgba(238,242,255,0.07)', position:'sticky', top:0, zIndex:100, background:'rgba(0,0,8,0.85)', backdropFilter:'blur(12px)' },
  navLogo: { display:'flex', alignItems:'center', gap:'10px' },
  navLogoText: { fontFamily:'var(--FH)', fontSize:'18px', fontWeight:'700', color:'var(--white)', letterSpacing:'-0.02em' },
  navRight: { display:'flex', alignItems:'center', gap:'12px' },
  streak: { background:'rgba(255,100,0,0.12)', border:'1px solid rgba(255,100,0,0.25)', borderRadius:'20px', padding:'6px 14px', color:'#ff8c42', fontSize:'12px', fontWeight:'600' },
  timePill: { background:'rgba(12,170,220,0.12)', border:'1px solid rgba(12,170,220,0.25)', borderRadius:'20px', padding:'6px 14px', color:'var(--blue-hi)', fontSize:'12px', fontFamily:'var(--FM)' },
  newBtn: { background:'linear-gradient(135deg, var(--gold) 0%, var(--gold-hi) 100%)', border:'none', borderRadius:'8px', padding:'8px 18px', color:'#000', fontSize:'13px', fontWeight:'700', fontFamily:'var(--FB)', cursor:'pointer' },

  topicBanner: { padding:'48px 40px 32px', borderBottom:'1px solid rgba(238,242,255,0.07)', position:'relative', zIndex:1 },
  topicInner: { maxWidth:'900px', margin:'0 auto' },
  topicLabel: { color:'var(--gold)', fontSize:'12px', fontWeight:'700', letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:'12px', margin:'0 0 12px' },
  topicTitle: { fontFamily:'var(--FH)', fontSize:'clamp(20px, 3vw, 32px)', fontWeight:'800', color:'var(--white)', margin:'0 0 16px', letterSpacing:'-0.02em', lineHeight:1.2 },
  topicMeta: { display:'flex', gap:'8px', flexWrap:'wrap' },
  metaTag: { background:'rgba(238,242,255,0.08)', borderRadius:'6px', padding:'5px 12px', color:'var(--w5)', fontSize:'12px', fontWeight:'500' },

  tabBar: { borderBottom:'1px solid rgba(238,242,255,0.08)', position:'sticky', top:'61px', zIndex:90, background:'rgba(0,0,8,0.9)', backdropFilter:'blur(12px)' },
  tabBarInner: { maxWidth:'900px', margin:'0 auto', padding:'0 40px', display:'flex', gap:'0', overflowX:'auto' },
  tabBtn: { padding:'16px 20px', border:'none', background:'transparent', color:'var(--w3)', fontSize:'13px', fontWeight:'600', cursor:'pointer', whiteSpace:'nowrap', borderBottom:'2px solid transparent', transition:'all 0.2s', fontFamily:'var(--FB)' },
  tabBtnActive: { color:'var(--gold)', borderBottomColor:'var(--gold)' },

  content: { maxWidth:'900px', margin:'0 auto', padding:'32px 40px 80px', position:'relative', zIndex:1 },
  tabContent: { display:'flex', flexDirection:'column', gap:'28px' },

  statsRow: { display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(140px, 1fr))', gap:'12px' },
  statCard: { background:'rgba(238,242,255,0.04)', border:'1px solid rgba(238,242,255,0.08)', borderRadius:'12px', padding:'20px', textAlign:'center' },
  statVal: { fontFamily:'var(--FH)', fontSize:'28px', fontWeight:'800', color:'var(--gold)', margin:'0 0 6px' },
  statLabel: { color:'var(--w3)', fontSize:'12px', margin:0, textTransform:'uppercase', letterSpacing:'0.05em' },

  section: { background:'rgba(238,242,255,0.03)', border:'1px solid rgba(238,242,255,0.08)', borderRadius:'14px', overflow:'hidden' },
  sectionHeader: { display:'flex', alignItems:'center', justifyContent:'space-between', padding:'18px 24px', borderBottom:'1px solid rgba(238,242,255,0.06)' },
  sectionTitle: { fontFamily:'var(--FH)', fontSize:'15px', fontWeight:'700', color:'var(--white)', margin:0 },
  sectionBody: { padding:'24px' },
  sectionDesc: { color:'var(--w3)', fontSize:'13px', marginTop:0, marginBottom:'8px' },

  scriptPre: { fontFamily:'var(--FB)', fontSize:'14px', color:'var(--w8)', lineHeight:'1.8', whiteSpace:'pre-wrap', margin:0, wordBreak:'break-word' },
  descPre:   { fontFamily:'var(--FB)', fontSize:'14px', color:'var(--w8)', lineHeight:'1.7', whiteSpace:'pre-wrap', margin:0 },
  captionPre:{ fontFamily:'var(--FB)', fontSize:'14px', color:'var(--w8)', lineHeight:'1.7', whiteSpace:'pre-wrap', margin:'0 0 16px' },

  copyBtn: { background:'rgba(238,242,255,0.08)', border:'1px solid rgba(238,242,255,0.15)', borderRadius:'8px', padding:'7px 14px', color:'var(--w5)', fontSize:'12px', fontWeight:'600', cursor:'pointer', fontFamily:'var(--FB)', transition:'all 0.2s' },
  copyBtnDone: { background:'rgba(0,220,130,0.12)', borderColor:'rgba(0,220,130,0.3)', color:'#00dc82' },

  ctaCard: { background:'rgba(238,242,255,0.04)', borderRadius:'10px', padding:'16px', marginBottom:'12px', border:'1px solid rgba(238,242,255,0.07)' },
  ctaTop: { display:'flex', gap:'10px', marginBottom:'10px', alignItems:'center' },
  ctaBadge: { background:'rgba(12,170,220,0.15)', borderRadius:'6px', padding:'4px 10px', color:'var(--blue-hi)', fontSize:'11px', fontWeight:'700', textTransform:'uppercase' },
  ctaPlacement: { color:'var(--w3)', fontSize:'12px' },
  ctaText: { fontFamily:'var(--FH)', fontSize:'15px', color:'var(--white)', margin:'0 0 8px' },
  ctaWhy: { color:'var(--w5)', fontSize:'13px', margin:0, lineHeight:'1.6' },

  sceneCard: { background:'rgba(238,242,255,0.03)', border:'1px solid rgba(238,242,255,0.08)', borderRadius:'14px', padding:'24px', marginBottom:'4px' },
  sceneHeader: { display:'flex', gap:'12px', alignItems:'center', marginBottom:'16px' },
  sceneNum: { background:'rgba(233,161,0,0.15)', borderRadius:'6px', padding:'4px 12px', color:'var(--gold)', fontSize:'12px', fontWeight:'700' },
  sceneType: { background:'rgba(238,242,255,0.06)', borderRadius:'6px', padding:'4px 12px', color:'var(--w5)', fontSize:'12px', fontWeight:'600' },
  sceneTime: { color:'var(--w3)', fontSize:'12px', fontFamily:'var(--FM)' },
  sceneGrid: { display:'grid', gridTemplateColumns:'1fr 1fr', gap:'20px' },
  sceneVoiceover: { gridColumn:'1' },
  sceneDetails: { display:'flex', flexDirection:'column', gap:'10px' },
  sceneFieldLabel: { color:'var(--w3)', fontSize:'11px', fontWeight:'700', textTransform:'uppercase', letterSpacing:'0.08em', margin:'0 0 8px' },
  sceneFieldVal: { color:'var(--w8)', fontSize:'14px', lineHeight:'1.7', margin:0 },
  sceneDetail: { display:'flex', flexDirection:'column', gap:'3px' },
  sceneDetailLabel: { color:'var(--w3)', fontSize:'11px', fontWeight:'700', textTransform:'uppercase', letterSpacing:'0.06em' },
  sceneDetailVal: { color:'var(--w5)', fontSize:'13px', lineHeight:'1.5' },

  hookHero: { background:'linear-gradient(135deg, rgba(233,161,0,0.1) 0%, rgba(12,170,220,0.06) 100%)', border:'1px solid rgba(233,161,0,0.2)', borderRadius:'16px', padding:'32px', textAlign:'center' },
  hookHeroLabel: { color:'var(--gold)', fontSize:'11px', fontWeight:'700', textTransform:'uppercase', letterSpacing:'0.1em', margin:'0 0 16px' },
  hookHeroText: { fontFamily:'var(--FH)', fontSize:'clamp(16px, 2.5vw, 22px)', fontWeight:'700', color:'var(--white)', margin:'0 0 16px', lineHeight:1.4 },
  triggerBadge: { background:'rgba(233,161,0,0.15)', border:'1px solid rgba(233,161,0,0.3)', borderRadius:'20px', padding:'6px 16px', color:'var(--gold)', fontSize:'12px', fontWeight:'700', letterSpacing:'0.05em' },

  analysisText: { color:'var(--w8)', fontSize:'15px', lineHeight:'1.8', margin:0 },
  breakdownRow: { marginBottom:'20px', paddingBottom:'20px', borderBottom:'1px solid rgba(238,242,255,0.06)' },
  breakdownLabel: { color:'var(--gold)', fontSize:'11px', fontWeight:'700', textTransform:'uppercase', letterSpacing:'0.08em', margin:'0 0 8px' },
  breakdownVal: { color:'var(--w8)', fontSize:'14px', lineHeight:'1.7', margin:0 },

  hookOptionCard: { background:'rgba(238,242,255,0.04)', border:'1px solid rgba(238,242,255,0.08)', borderRadius:'12px', padding:'20px', marginBottom:'12px' },
  hookOptionTop: { display:'flex', gap:'10px', marginBottom:'12px', alignItems:'center' },
  ctrBadge: { borderRadius:'6px', padding:'4px 10px', fontSize:'11px', fontWeight:'700' },
  hookOptionText: { fontFamily:'var(--FH)', fontSize:'15px', color:'var(--white)', margin:'0 0 10px', lineHeight:1.4 },
  hookOptionExplain: { color:'var(--w5)', fontSize:'13px', lineHeight:'1.6', margin:0 },
  hookRisk: { color:'#ff8c42', fontSize:'12px', marginTop:'10px', marginBottom:0 },
  patternRow: { display:'flex', gap:'12px', alignItems:'flex-start', padding:'12px', borderBottom:'1px solid rgba(238,242,255,0.05)', flexWrap:'wrap' },
  patternTime: { background:'rgba(238,242,255,0.06)', borderRadius:'4px', padding:'3px 8px', color:'var(--w5)', fontSize:'12px', fontFamily:'var(--FM)', whiteSpace:'nowrap' },
  patternTech: { background:'rgba(233,161,0,0.1)', borderRadius:'4px', padding:'3px 8px', color:'var(--gold)', fontSize:'12px', fontWeight:'600', whiteSpace:'nowrap' },
  patternLine: { color:'var(--w8)', fontSize:'13px', flex:1 },

  recTitle: { background:'rgba(233,161,0,0.08)', border:'1px solid rgba(233,161,0,0.2)', borderRadius:'14px', padding:'24px', display:'flex', flexDirection:'column', gap:'12px' },
  recTitleLabel: { color:'var(--gold)', fontSize:'11px', fontWeight:'700', textTransform:'uppercase', letterSpacing:'0.1em', margin:0 },
  recTitleText: { fontFamily:'var(--FH)', fontSize:'18px', fontWeight:'800', color:'var(--white)', margin:0 },

  titleOptionCard: { background:'rgba(238,242,255,0.03)', border:'1px solid rgba(238,242,255,0.07)', borderRadius:'10px', padding:'16px', marginBottom:'10px' },
  titleOptionTop: { display:'flex', gap:'8px', marginBottom:'10px', alignItems:'center', flexWrap:'wrap' },
  charCount: { color:'var(--w3)', fontSize:'11px', fontFamily:'var(--FM)' },
  titleStrategy: { color:'var(--blue-hi)', fontSize:'11px', fontWeight:'600', textTransform:'uppercase', letterSpacing:'0.05em' },
  titleText: { fontFamily:'var(--FH)', fontSize:'15px', color:'var(--white)', margin:'0 0 8px' },
  titleReason: { color:'var(--w5)', fontSize:'12px', lineHeight:'1.6', margin:0 },

  keywordRow: { display:'flex', gap:'8px', flexWrap:'wrap', alignItems:'center' },
  primaryKw: { background:'rgba(233,161,0,0.15)', border:'1px solid rgba(233,161,0,0.3)', borderRadius:'6px', padding:'6px 14px', color:'var(--gold)', fontSize:'13px', fontWeight:'700' },
  secKw: { background:'rgba(238,242,255,0.06)', borderRadius:'6px', padding:'6px 12px', color:'var(--w5)', fontSize:'13px' },
  tagsWrap: { display:'flex', flexWrap:'wrap', gap:'8px' },
  tag: { background:'rgba(12,170,220,0.1)', border:'1px solid rgba(12,170,220,0.2)', borderRadius:'6px', padding:'5px 12px', color:'var(--blue-hi)', fontSize:'12px' },

  twoCol: { display:'grid', gridTemplateColumns:'1fr 1fr', gap:'16px' },
  bodyText: { color:'var(--w8)', fontSize:'14px', lineHeight:'1.7', margin:0 },

  hashtagsWrap: { display:'flex', flexWrap:'wrap', gap:'6px' },
  hashtag: { background:'rgba(12,170,220,0.08)', borderRadius:'6px', padding:'4px 10px', color:'var(--blue-hi)', fontSize:'12px' },
  igMeta: { color:'var(--w3)', fontSize:'13px', marginTop:'12px', marginBottom:0 },

  h2Row: { display:'flex', gap:'10px', alignItems:'flex-start', marginBottom:'10px' },
  h2Num: { background:'rgba(233,161,0,0.12)', borderRadius:'4px', padding:'3px 8px', color:'var(--gold)', fontSize:'11px', fontWeight:'700', whiteSpace:'nowrap' },
  h2Text: { color:'var(--w8)', fontSize:'14px' },

  repurposeCard: { background:'rgba(238,242,255,0.04)', borderRadius:'10px', padding:'16px', marginBottom:'10px' },
  repurposeTop: { display:'flex', gap:'10px', marginBottom:'8px', alignItems:'center' },
  repurposePlat: { background:'rgba(233,161,0,0.12)', borderRadius:'6px', padding:'4px 10px', color:'var(--gold)', fontSize:'12px', fontWeight:'700' },
  repurposeFormat: { color:'var(--w5)', fontSize:'12px' },
  repurposeAngle: { color:'var(--w8)', fontSize:'14px', lineHeight:'1.6', margin:0 },

  scheduleBox: { background:'rgba(12,170,220,0.06)', border:'1px solid rgba(12,170,220,0.2)', borderRadius:'14px', padding:'24px', marginBottom:'8px' },
  scheduleTitle: { color:'var(--blue-hi)', fontSize:'13px', fontWeight:'700', textTransform:'uppercase', letterSpacing:'0.05em', margin:'0 0 12px' },
  scheduleRow: { display:'flex', gap:'12px', flexWrap:'wrap', marginBottom:'12px' },
  scheduleStat: { background:'rgba(12,170,220,0.1)', borderRadius:'6px', padding:'6px 14px', color:'var(--white)', fontSize:'14px', fontWeight:'600' },
  scheduleReason: { color:'var(--w5)', fontSize:'13px', lineHeight:'1.6', margin:0 },

  planGrid: { display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(240px, 1fr))', gap:'14px' },
  dayCard: { background:'rgba(238,242,255,0.04)', border:'1px solid rgba(238,242,255,0.08)', borderRadius:'12px', padding:'20px', transition:'border-color 0.2s' },
  dayHeader: { display:'flex', gap:'10px', alignItems:'center', marginBottom:'12px' },
  dayNum: { background:'rgba(233,161,0,0.15)', borderRadius:'6px', padding:'4px 12px', color:'var(--gold)', fontSize:'12px', fontWeight:'800' },
  dayType: { color:'var(--w3)', fontSize:'11px', fontWeight:'600', textTransform:'uppercase', letterSpacing:'0.05em' },
  dayTopic: { color:'var(--w8)', fontSize:'13px', lineHeight:'1.6', margin:'0 0 12px' },
  dayMeta: { display:'flex', gap:'8px', flexWrap:'wrap' },
  dayPlatform: { background:'rgba(12,170,220,0.1)', borderRadius:'4px', padding:'3px 8px', color:'var(--blue-hi)', fontSize:'11px' },
  dayRepurpose: { color:'var(--w3)', fontSize:'11px' },

  empty: { textAlign:'center', padding:'60px 20px' },
  emptyMsg: { color:'var(--w3)', fontSize:'14px' },
};