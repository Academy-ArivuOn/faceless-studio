'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

const TABS = [
  { id:'script',  label:'Script'         },
  { id:'scenes',  label:'Scenes'         },
  { id:'hook',    label:'Hook Psychology'},
  { id:'youtube', label:'YouTube'        },
  { id:'social',  label:'Social'         },
  { id:'plan',    label:'7-Day Plan'     },
];

// ── Color tokens ──────────────────────────────────────────────────────────────
const CA = '#D4A847';
const C1 = '#EEEEF5';
const C2 = 'rgba(238,238,245,0.55)';
const C3 = 'rgba(238,238,245,0.28)';
const CB = 'rgba(255,255,255,0.07)';
const CB2= 'rgba(255,255,255,0.12)';

export default function ResultsPage() {
  const router = useRouter();
  const [result, setResult] = useState(null);
  const [tab,    setTab]    = useState('script');
  const [copied, setCopied] = useState('');

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
    <div style={{minHeight:'100vh',background:'#07070E',display:'flex',alignItems:'center',justifyContent:'center'}}>
      <Spinner />
    </div>
  );

  const { research, creator, publisher, meta, input } = result;
  const totalSec = ((meta?.total_duration_ms || 0) / 1000).toFixed(1);

  return (
    <div style={P.root}>

      {/* ── Topbar ── */}
      <header style={P.topbar}>
        <div style={P.tbLeft}>
          <HexLogo />
          <span style={P.brand}>Studio AI</span>
          <span style={P.sep}>/</span>
          <span style={P.crumb}>Results</span>
        </div>
        <div style={P.tbRight}>
          {meta?.streak > 1 && <span style={P.streak}>🔥 {meta.streak}-day streak</span>}
          <span style={P.timePill}>{totalSec}s</span>
          <button style={P.newBtn} onClick={() => router.push('/generate')}>+ New generation</button>
        </div>
      </header>

      {/* ── Topic banner ── */}
      <div style={P.banner}>
        <div style={P.bannerInner}>
          <div style={P.metaRow}>
            <Tag label={input?.platform} />
            <Tag label={input?.language} />
            <Tag label={input?.tone} />
          </div>
          <h1 style={P.bannerTitle}>{research?.chosen_topic}</h1>
          {research?.chosen_hook && (
            <p style={P.bannerHook}>"{research.chosen_hook}"</p>
          )}
        </div>
      </div>

      {/* ── Tab bar ── */}
      <div style={P.tabStrip}>
        <div style={P.tabStripInner}>
          {TABS.map(t => (
            <button key={t.id}
              style={{...P.tabBtn, ...(tab===t.id ? P.tabActive : {})}}
              onClick={() => setTab(t.id)}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Content ── */}
      <div style={P.body}>
        <div style={P.bodyInner}>
          {tab === 'script'  && <ScriptTab  creator={creator}  copy={copy} copied={copied} />}
          {tab === 'scenes'  && <ScenesTab  creator={creator} />}
          {tab === 'hook'    && <HookTab    research={research} creator={creator} />}
          {tab === 'youtube' && <YouTubeTab publisher={publisher} copy={copy} copied={copied} />}
          {tab === 'social'  && <SocialTab  publisher={publisher} copy={copy} copied={copied} />}
          {tab === 'plan'    && <PlanTab    publisher={publisher} />}
        </div>
      </div>
    </div>
  );
}

// ── Script Tab ────────────────────────────────────────────────────────────────
function ScriptTab({ creator, copy, copied }) {
  if (!creator) return <Empty msg="Script data unavailable" />;
  return (
    <div style={L.stack}>
      <div style={L.statRow}>
        <Stat n={creator.word_count || '—'} label="Words" />
        <Stat n={creator.estimated_duration || '—'} label="Duration" />
        <Stat n={creator.scenes?.length || '—'} label="Scenes" />
        <Stat n={creator.pattern_interrupts?.length || '—'} label="Pattern Interrupts" />
      </div>

      <Block title="Full Script" action={<CopyBtn id="full" copied={copied} onCopy={() => copy(creator.full_script,'full')} />}>
        <pre style={L.scriptPre}>{creator.full_script}</pre>
      </Block>

      {creator.shorts_script && (
        <Block title="60-Second Short / Reel Version" action={<CopyBtn id="short" copied={copied} onCopy={() => copy(creator.shorts_script,'short')} />}>
          <pre style={L.scriptPre}>{creator.shorts_script}</pre>
        </Block>
      )}

      {creator.cta_options?.length > 0 && (
        <Block title="CTA Options">
          <div style={L.ctaGrid}>
            {creator.cta_options.map((c,i) => (
              <div key={i} style={L.ctaCard}>
                <div style={{display:'flex',gap:'8px',marginBottom:'10px',alignItems:'center'}}>
                  <span style={L.goalBadge}>{c.goal}</span>
                  <span style={{fontSize:'12px',color:C3}}>{c.placement}</span>
                </div>
                <p style={L.ctaQuote}>"{c.cta_text}"</p>
                <p style={L.ctaReason}>{c.why_it_works}</p>
              </div>
            ))}
          </div>
        </Block>
      )}
    </div>
  );
}

// ── Scenes Tab ────────────────────────────────────────────────────────────────
function ScenesTab({ creator }) {
  if (!creator?.scenes?.length) return <Empty msg="Scene data unavailable" />;
  return (
    <div style={L.stack}>
      <p style={{fontSize:'13px',color:C2,margin:0,lineHeight:'1.6'}}>Each row is a complete production brief. Use b_roll_search_term on Pexels or Shutterstock.</p>
      {creator.scenes.map((scene, i) => (
        <div key={i} style={L.sceneCard}>
          <div style={L.sceneHead}>
            <span style={L.sceneNum}>Scene {scene.scene_number}</span>
            <span style={L.sceneType}>{scene.section_type}</span>
            <span style={{fontSize:'11px',color:C3,fontFamily:'var(--FM)'}}>{scene.timestamp_start} – {scene.timestamp_end}</span>
          </div>
          <p style={L.sceneVo}>{scene.voiceover}</p>
          <div style={L.sceneFields}>
            {scene.visual_direction  && <SceneField icon="🎥" label="Visual"    val={scene.visual_direction} />}
            {scene.overlay_text      && <SceneField icon="📝" label="Overlay"   val={scene.overlay_text} />}
            {scene.b_roll_search_term&& <SceneField icon="🔍" label="B-Roll"    val={scene.b_roll_search_term} accent />}
            {scene.tone_direction    && <SceneField icon="🎭" label="Tone"      val={scene.tone_direction} />}
            {scene.retention_technique&&<SceneField icon="⚡" label="Retention" val={scene.retention_technique} gold />}
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Hook Psychology Tab ───────────────────────────────────────────────────────
function HookTab({ research, creator }) {
  return (
    <div style={L.stack}>
      <div style={L.hookHero}>
        <p style={L.hookHeroLabel}>Chosen Hook</p>
        <p style={L.hookHeroText}>"{research?.chosen_hook}"</p>
        <span style={L.triggerTag}>{research?.chosen_hook_trigger}</span>
      </div>

      {research?.chosen_hook_deep_analysis && (
        <Block title="Deep Psychology Analysis">
          <p style={{fontSize:'14px',color:C2,lineHeight:'1.75',margin:0}}>{research.chosen_hook_deep_analysis}</p>
        </Block>
      )}

      {creator?.hook_breakdown && (
        <Block title="Hook Execution Breakdown">
          <div style={L.breakdownList}>
            {[
              ['Psychological Mechanism',    creator.hook_breakdown.psychological_mechanism],
              ['Why It Works in 3 Seconds',  creator.hook_breakdown.why_first_3_seconds],
              ["Viewer's Internal Monologue", creator.hook_breakdown.what_viewer_is_thinking],
              ['What Happens If It Fails',   creator.hook_breakdown.what_happens_if_hook_fails],
            ].filter(([,v]) => v).map(([lbl,val]) => (
              <div key={lbl} style={L.breakdownRow}>
                <p style={L.breakdownLbl}>{lbl}</p>
                <p style={L.breakdownVal}>{val}</p>
              </div>
            ))}
          </div>
        </Block>
      )}

      {research?.hook_options?.length > 0 && (
        <Block title="All Hook Options">
          <div style={L.hookGrid}>
            {research.hook_options.map((h,i) => (
              <div key={i} style={L.hookCard}>
                <div style={{display:'flex',gap:'8px',marginBottom:'10px',alignItems:'center',flexWrap:'wrap'}}>
                  <span style={L.triggerTag}>{h.psychological_trigger}</span>
                  <span style={{...L.ctrTag, background: h.ctr_strength==='HIGH'?'rgba(62,207,142,0.1)':'rgba(212,168,71,0.1)', color: h.ctr_strength==='HIGH'?'#3ECF8E':CA}}>
                    CTR {h.ctr_strength}
                  </span>
                </div>
                <p style={{fontSize:'14px',color:C1,fontWeight:'500',margin:'0 0 8px',lineHeight:'1.5'}}>"{h.hook_text}"</p>
                <p style={{fontSize:'13px',color:C2,margin:0,lineHeight:'1.6'}}>{h.trigger_explanation}</p>
                {h.risk_factor && <p style={{fontSize:'12px',color:'#F87171',marginTop:'8px',marginBottom:0}}>⚠ {h.risk_factor}</p>}
              </div>
            ))}
          </div>
        </Block>
      )}

      {creator?.pattern_interrupts?.length > 0 && (
        <Block title="Pattern Interrupts">
          <table style={L.piTable}>
            <thead>
              <tr>
                {['Timestamp','Technique','Script Line'].map(h => (
                  <th key={h} style={L.piTh}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {creator.pattern_interrupts.map((p,i) => (
                <tr key={i} style={{borderBottom:`1px solid ${CB}`}}>
                  <td style={L.piTd}><span style={{fontFamily:'var(--FM)',fontSize:'12px',color:CA}}>{p.timestamp}</span></td>
                  <td style={L.piTd}><span style={{fontSize:'12px',color:C1,fontWeight:'500'}}>{p.technique}</span></td>
                  <td style={{...L.piTd,color:C2,fontSize:'13px'}}>"{p.script_line}"</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Block>
      )}
    </div>
  );
}

// ── YouTube Tab ───────────────────────────────────────────────────────────────
function YouTubeTab({ publisher, copy, copied }) {
  const yt = publisher?.youtube;
  if (!yt) return <Empty msg="YouTube data unavailable" />;
  return (
    <div style={L.stack}>
      <div style={L.recTitle}>
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'12px'}}>
          <span style={L.recTitleLabel}>Recommended Title</span>
          <CopyBtn id="yt_title" copied={copied} onCopy={() => copy(yt.recommended_title,'yt_title')} />
        </div>
        <p style={L.recTitleText}>{yt.recommended_title}</p>
      </div>

      {yt.title_options?.length > 0 && (
        <Block title="All Title Variants">
          <div style={L.stack}>
            {yt.title_options.map((t,i) => (
              <div key={i} style={L.titleRow}>
                <div style={{display:'flex',gap:'8px',marginBottom:'6px',alignItems:'center',flexWrap:'wrap'}}>
                  <span style={{...L.ctrTag, background:t.ctr_prediction==='HIGH'?'rgba(62,207,142,0.1)':'rgba(212,168,71,0.1)', color:t.ctr_prediction==='HIGH'?'#3ECF8E':CA}}>
                    CTR {t.ctr_prediction}
                  </span>
                  <span style={{fontSize:'11px',color:C3,fontFamily:'var(--FM)'}}>{t.character_count||t.title?.length} chars</span>
                  <span style={{fontSize:'11px',color:'rgba(12,170,220,0.8)',textTransform:'uppercase',letterSpacing:'0.05em',fontWeight:'600'}}>{t.primary_strategy}</span>
                </div>
                <p style={{fontSize:'14px',color:C1,fontWeight:'500',margin:'0 0 6px'}}>{t.title}</p>
                <p style={{fontSize:'12px',color:C3,margin:0,lineHeight:'1.5'}}>{t.reasoning}</p>
              </div>
            ))}
          </div>
        </Block>
      )}

      <Block title="Description" action={<CopyBtn id="yt_desc" copied={copied} onCopy={() => copy(yt.description,'yt_desc')} />}>
        <pre style={L.descPre}>{yt.description}</pre>
      </Block>

      <div style={L.colGrid}>
        <Block title="Primary Keyword">
          <span style={L.primaryKw}>{yt.primary_keyword}</span>
          <div style={{display:'flex',flexWrap:'wrap',gap:'6px',marginTop:'10px'}}>
            {yt.secondary_keywords?.map((k,i) => <span key={i} style={L.secKw}>{k}</span>)}
          </div>
        </Block>
        <Block title="Category & Cards">
          <p style={{fontSize:'13px',color:C2,margin:'0 0 10px'}}><strong style={{color:C1}}>Category:</strong> {yt.category_suggestion}</p>
          {yt.card_recommendation && <p style={{fontSize:'13px',color:C2,margin:0}}>{yt.card_recommendation}</p>}
        </Block>
      </div>

      {yt.tags?.length > 0 && (
        <Block title="Tags" action={<CopyBtn id="yt_tags" copied={copied} onCopy={() => copy(yt.tags.join(', '),'yt_tags')} />}>
          <div style={{display:'flex',flexWrap:'wrap',gap:'6px'}}>
            {yt.tags.map((tag,i) => <span key={i} style={L.tag}>{tag}</span>)}
          </div>
        </Block>
      )}

      {yt.end_screen_recommendation && (
        <Block title="End Screen Strategy">
          <p style={{fontSize:'14px',color:C2,lineHeight:'1.7',margin:0}}>{yt.end_screen_recommendation}</p>
        </Block>
      )}
    </div>
  );
}

// ── Social Tab ────────────────────────────────────────────────────────────────
function SocialTab({ publisher, copy, copied }) {
  const ig   = publisher?.instagram;
  const tt   = publisher?.tiktok;
  const blog = publisher?.blog;
  const repr = publisher?.cross_platform_repurpose;

  return (
    <div style={L.stack}>
      {ig && (
        <Block title="Instagram" action={<CopyBtn id="ig" copied={copied} onCopy={() => copy(ig.caption + '\n\n' + (ig.hashtags||[]).map(h=>`#${h.replace(/^#/,'')}`).join(' '),'ig')} />}>
          <pre style={L.descPre}>{ig.caption}</pre>
          <div style={{display:'flex',flexWrap:'wrap',gap:'5px',marginTop:'14px'}}>
            {ig.hashtags?.map((h,i) => <span key={i} style={L.hashTag}>#{h.replace(/^#/,'')}</span>)}
          </div>
          <div style={{display:'flex',gap:'24px',marginTop:'14px',flexWrap:'wrap'}}>
            {ig.reel_cover_text && <KV k="Cover text" v={ig.reel_cover_text} />}
            {ig.save_cta        && <KV k="Save CTA"   v={ig.save_cta} gold />}
          </div>
        </Block>
      )}

      {tt && (
        <Block title="TikTok" action={<CopyBtn id="tt" copied={copied} onCopy={() => copy(tt.caption+' '+(tt.hashtags||[]).join(' '),'tt')} />}>
          <p style={{fontSize:'15px',color:C1,fontWeight:'500',margin:'0 0 12px',lineHeight:'1.5'}}>{tt.caption}</p>
          <div style={{display:'flex',flexWrap:'wrap',gap:'5px',marginBottom:'14px'}}>
            {tt.hashtags?.map((h,i) => <span key={i} style={L.hashTag}>{h.startsWith('#')?h:`#${h}`}</span>)}
          </div>
          <div style={{display:'flex',gap:'24px',flexWrap:'wrap'}}>
            {tt.first_frame_text        && <KV k="First frame"  v={tt.first_frame_text} />}
            {tt.trending_sound_category && <KV k="Sound type"   v={tt.trending_sound_category} />}
            {tt.duet_stitch_suggestion  && <KV k="Duet/Stitch"  v={tt.duet_stitch_suggestion} />}
          </div>
        </Block>
      )}

      {blog && (
        <Block title="Blog / SEO">
          <div style={L.kvTable}>
            {[['SEO Title',blog.seo_title],['Meta Description',blog.meta_description],['URL Slug',blog.url_slug],['Primary Keyword',blog.primary_keyword]].filter(([,v])=>v).map(([k,v])=>(
              <div key={k} style={L.kvRow}>
                <span style={L.kvKey}>{k}</span>
                <span style={{...L.kvVal, fontFamily: k==='URL Slug'?'var(--FM)':'inherit', color: k==='URL Slug'?'rgba(56,189,248,0.85)':C1}}>{v}</span>
              </div>
            ))}
          </div>
          {blog.suggested_h2_headers?.length > 0 && (
            <div style={{marginTop:'16px'}}>
              <p style={L.miniLabel}>H2 Headers</p>
              <div style={{display:'flex',flexDirection:'column',gap:'6px'}}>
                {blog.suggested_h2_headers.map((h,i) => (
                  <div key={i} style={{display:'flex',gap:'10px',alignItems:'flex-start'}}>
                    <span style={{background:'rgba(212,168,71,0.12)',borderRadius:'4px',padding:'2px 7px',color:CA,fontSize:'10px',fontWeight:'700',flexShrink:0,marginTop:'2px'}}>H2</span>
                    <span style={{fontSize:'13px',color:C2,lineHeight:'1.5'}}>{h}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Block>
      )}

      {repr?.length > 0 && (
        <Block title="Cross-Platform Repurpose">
          <div style={{display:'flex',flexDirection:'column',gap:'12px'}}>
            {repr.map((r,i) => (
              <div key={i} style={{padding:'14px',background:'rgba(255,255,255,0.02)',borderRadius:'8px',border:`1px solid ${CB}`}}>
                <div style={{display:'flex',gap:'8px',marginBottom:'8px',alignItems:'center'}}>
                  <span style={L.triggerTag}>{r.platform}</span>
                  <span style={{fontSize:'12px',color:C3}}>{r.format}</span>
                </div>
                <p style={{fontSize:'13px',color:C2,margin:0,lineHeight:'1.6'}}>{r.specific_angle}</p>
              </div>
            ))}
          </div>
        </Block>
      )}
    </div>
  );
}

// ── 7-Day Plan Tab ────────────────────────────────────────────────────────────
function PlanTab({ publisher }) {
  const plan     = publisher?.seven_day_content_plan;
  const schedule = publisher?.posting_schedule;
  if (!plan?.length) return <Empty msg="Content plan unavailable" />;

  return (
    <div style={L.stack}>
      {schedule && (
        <div style={L.scheduleBox}>
          <p style={L.miniLabel}>Optimal Posting Schedule</p>
          <div style={{display:'flex',gap:'10px',flexWrap:'wrap',marginBottom:'10px'}}>
            {schedule.primary_post_day  && <span style={L.schedStat}>{schedule.primary_post_day}</span>}
            {schedule.primary_post_time && <span style={L.schedStat}>{schedule.primary_post_time}</span>}
            {schedule.follow_up_story_timing && <span style={{...L.schedStat, color:C2}}>Follow-up: {schedule.follow_up_story_timing}</span>}
          </div>
          {schedule.reasoning && <p style={{fontSize:'13px',color:C2,margin:0,lineHeight:'1.6'}}>{schedule.reasoning}</p>}
        </div>
      )}

      <div style={L.planGrid}>
        {plan.map((day,i) => (
          <div key={i} style={L.dayCard}>
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'10px'}}>
              <span style={L.dayNum}>Day {day.day}</span>
              <span style={L.dayType}>{day.content_type}</span>
            </div>
            <p style={{fontSize:'13px',color:C1,fontWeight:'500',lineHeight:'1.5',margin:'0 0 10px'}}>{day.topic_angle}</p>
            <div style={{display:'flex',gap:'6px',flexWrap:'wrap'}}>
              <span style={L.dayPlat}>{day.platform}</span>
              {day.repurpose_from && day.repurpose_from !== 'Original' && (
                <span style={{fontSize:'11px',color:C3}}>↻ {day.repurpose_from}</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Primitive components ──────────────────────────────────────────────────────
function Block({ title, children, action }) {
  return (
    <div style={L.block}>
      <div style={L.blockHead}>
        <span style={L.blockTitle}>{title}</span>
        {action}
      </div>
      <div style={L.blockBody}>{children}</div>
    </div>
  );
}
function Stat({ n, label }) {
  return (
    <div style={L.statCard}>
      <span style={L.statN}>{n}</span>
      <span style={L.statLbl}>{label}</span>
    </div>
  );
}
function Tag({ label }) {
  return label ? <span style={L.metaTag}>{label}</span> : null;
}
function CopyBtn({ id, copied, onCopy }) {
  const done = copied === id;
  return (
    <button onClick={onCopy} style={{background:done?'rgba(62,207,142,0.08)':'transparent',border:`1px solid ${done?'rgba(62,207,142,0.25)':CB}`,borderRadius:'5px',padding:'5px 12px',color:done?'#3ECF8E':C3,fontSize:'12px',fontWeight:'600',cursor:'pointer',fontFamily:'var(--FB)',transition:'all 0.2s'}}>
      {done ? '✓ Copied' : 'Copy'}
    </button>
  );
}
function Empty({ msg }) {
  return <div style={{padding:'60px 0',textAlign:'center',color:C3,fontSize:'14px'}}>{msg}</div>;
}
function SceneField({ icon, label, val, accent, gold }) {
  return (
    <div style={{display:'flex',flexDirection:'column',gap:'2px'}}>
      <span style={{fontSize:'10px',color:C3,textTransform:'uppercase',letterSpacing:'0.08em',fontWeight:'600'}}>{icon} {label}</span>
      <span style={{fontSize:'12px',color:gold?CA:accent?'rgba(56,189,248,0.8)':C2,lineHeight:'1.5'}}>{val}</span>
    </div>
  );
}
function KV({ k, v, gold }) {
  return (
    <div style={{display:'flex',flexDirection:'column',gap:'3px'}}>
      <span style={{fontSize:'11px',color:C3,textTransform:'uppercase',letterSpacing:'0.07em',fontWeight:'600'}}>{k}</span>
      <span style={{fontSize:'13px',color:gold?CA:C2,fontWeight:gold?'600':'400'}}>{v}</span>
    </div>
  );
}
function HexLogo() {
  return (
    <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
      <polygon points="10,2 17,6 17,14 10,18 3,14 3,6" stroke="#D4A847" strokeWidth="1.4" fill="none"/>
      <polygon points="10,6 14,8.5 14,13.5 10,16 6,13.5 6,8.5" fill="#D4A847" fillOpacity="0.12"/>
    </svg>
  );
}
function Spinner() {
  return <span style={{width:'24px',height:'24px',borderRadius:'50%',border:'2px solid rgba(255,255,255,0.08)',borderTopColor:CA,display:'block',animation:'spin 0.7s linear infinite'}} />;
}

// ── Page styles ───────────────────────────────────────────────────────────────
const P = {
  root:   { minHeight:'100vh', background:'#07070E', fontFamily:'var(--FB)', color:C1, display:'flex', flexDirection:'column' },
  topbar: { display:'flex',alignItems:'center',justifyContent:'space-between',padding:'0 28px',height:'54px',borderBottom:`1px solid ${CB}`,position:'sticky',top:0,zIndex:100,background:'rgba(7,7,14,0.9)',backdropFilter:'blur(12px)',flexShrink:0 },
  tbLeft: { display:'flex',alignItems:'center',gap:'10px' },
  brand:  { fontFamily:'var(--FH)',fontSize:'15px',fontWeight:'700',color:C1,letterSpacing:'-0.02em' },
  sep:    { color:CB2,fontSize:'16px' },
  crumb:  { fontSize:'14px',color:C2 },
  tbRight:{ display:'flex',alignItems:'center',gap:'14px' },
  streak: { fontSize:'12px',color:'rgba(255,140,66,0.9)',background:'rgba(255,100,0,0.08)',border:'1px solid rgba(255,100,0,0.15)',borderRadius:'20px',padding:'4px 12px' },
  timePill:{ fontSize:'12px',color:C3,fontFamily:'var(--FM)',background:'rgba(255,255,255,0.04)',border:`1px solid ${CB}`,borderRadius:'4px',padding:'4px 10px' },
  newBtn: { background:CA,border:'none',borderRadius:'6px',padding:'7px 16px',color:'#000',fontSize:'13px',fontWeight:'700',fontFamily:'var(--FH)',cursor:'pointer' },
  banner: { padding:'36px 28px 24px',borderBottom:`1px solid ${CB}` },
  bannerInner:{ maxWidth:'860px',margin:'0 auto' },
  metaRow:    { display:'flex',gap:'6px',marginBottom:'12px',flexWrap:'wrap' },
  metaTag:    { background:'rgba(255,255,255,0.04)',border:`1px solid ${CB}`,borderRadius:'4px',padding:'4px 10px',color:C3,fontSize:'12px',fontWeight:'500' },
  bannerTitle:{ fontFamily:'var(--FH)',fontSize:'clamp(18px,2.5vw,28px)',fontWeight:'800',color:C1,margin:'0 0 10px',letterSpacing:'-0.025em',lineHeight:1.25 },
  bannerHook: { fontSize:'14px',color:C2,margin:0,fontStyle:'italic',lineHeight:'1.6',borderLeft:`2px solid ${CA}`,paddingLeft:'14px' },
  tabStrip:   { borderBottom:`1px solid ${CB}`,position:'sticky',top:'54px',zIndex:90,background:'rgba(7,7,14,0.92)',backdropFilter:'blur(10px)',flexShrink:0 },
  tabStripInner:{ maxWidth:'860px',margin:'0 auto',padding:'0 28px',display:'flex',overflowX:'auto' },
  tabBtn:     { padding:'14px 18px',border:'none',background:'transparent',color:C3,fontSize:'13px',fontWeight:'500',cursor:'pointer',whiteSpace:'nowrap',borderBottom:'2px solid transparent',transition:'all 0.18s',fontFamily:'var(--FB)' },
  tabActive:  { color:CA, borderBottomColor:CA },
  body:       { flex:1,overflow:'auto' },
  bodyInner:  { maxWidth:'860px',margin:'0 auto',padding:'32px 28px 80px' },
};

// ── Layout primitives ─────────────────────────────────────────────────────────
const L = {
  stack:     { display:'flex',flexDirection:'column',gap:'20px' },
  statRow:   { display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(130px,1fr))',gap:'10px' },
  statCard:  { background:'rgba(255,255,255,0.025)',border:`1px solid ${CB}`,borderRadius:'8px',padding:'18px 16px',textAlign:'center' },
  statN:     { display:'block',fontFamily:'var(--FH)',fontSize:'26px',fontWeight:'800',color:CA,marginBottom:'4px' },
  statLbl:   { display:'block',fontSize:'11px',color:C3,textTransform:'uppercase',letterSpacing:'0.07em',fontWeight:'600' },
  block:     { border:`1px solid ${CB}`,borderRadius:'10px',overflow:'hidden' },
  blockHead: { display:'flex',alignItems:'center',justifyContent:'space-between',padding:'14px 20px',borderBottom:`1px solid ${CB}`,background:'rgba(255,255,255,0.015)' },
  blockTitle:{ fontSize:'13px',fontWeight:'700',color:C1,letterSpacing:'-0.01em' },
  blockBody: { padding:'20px' },
  scriptPre: { fontFamily:'var(--FB)',fontSize:'14px',color:C2,lineHeight:'1.8',whiteSpace:'pre-wrap',margin:0,wordBreak:'break-word' },
  descPre:   { fontFamily:'var(--FB)',fontSize:'13px',color:C2,lineHeight:'1.75',whiteSpace:'pre-wrap',margin:0 },
  ctaGrid:   { display:'grid',gridTemplateColumns:'1fr 1fr',gap:'12px' },
  ctaCard:   { background:'rgba(255,255,255,0.02)',border:`1px solid ${CB}`,borderRadius:'8px',padding:'14px' },
  goalBadge: { background:'rgba(12,170,220,0.1)',border:'1px solid rgba(12,170,220,0.2)',borderRadius:'4px',padding:'3px 9px',color:'rgba(56,189,248,0.85)',fontSize:'11px',fontWeight:'700',textTransform:'uppercase',letterSpacing:'0.05em' },
  ctaQuote:  { fontFamily:'var(--FH)',fontSize:'14px',color:C1,margin:'0 0 6px',lineHeight:'1.4' },
  ctaReason: { fontSize:'12px',color:C3,margin:0,lineHeight:'1.5' },
  sceneCard: { border:`1px solid ${CB}`,borderRadius:'10px',padding:'18px',background:'rgba(255,255,255,0.015)' },
  sceneHead: { display:'flex',gap:'10px',alignItems:'center',marginBottom:'10px',flexWrap:'wrap' },
  sceneNum:  { background:'rgba(212,168,71,0.1)',borderRadius:'4px',padding:'3px 10px',color:CA,fontSize:'11px',fontWeight:'700' },
  sceneType: { background:'rgba(255,255,255,0.05)',borderRadius:'4px',padding:'3px 10px',color:C3,fontSize:'11px',fontWeight:'600' },
  sceneVo:   { fontSize:'14px',color:C1,lineHeight:'1.7',margin:'0 0 14px',paddingBottom:'14px',borderBottom:`1px solid ${CB}` },
  sceneFields:{ display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(180px,1fr))',gap:'12px' },
  hookHero:  { background:'rgba(212,168,71,0.05)',border:`1px solid rgba(212,168,71,0.15)`,borderRadius:'10px',padding:'28px',textAlign:'center' },
  hookHeroLabel:{ fontSize:'11px',fontWeight:'700',color:CA,textTransform:'uppercase',letterSpacing:'0.1em',margin:'0 0 14px' },
  hookHeroText: { fontFamily:'var(--FH)',fontSize:'clamp(15px,2vw,20px)',fontWeight:'700',color:C1,margin:'0 0 14px',lineHeight:1.4 },
  triggerTag:{ background:'rgba(212,168,71,0.1)',border:`1px solid rgba(212,168,71,0.2)`,borderRadius:'4px',padding:'3px 10px',color:CA,fontSize:'11px',fontWeight:'700',letterSpacing:'0.04em' },
  ctrTag:    { borderRadius:'4px',padding:'3px 9px',fontSize:'11px',fontWeight:'700' },
  breakdownList:{ display:'flex',flexDirection:'column' },
  breakdownRow: { paddingBottom:'16px',marginBottom:'16px',borderBottom:`1px solid ${CB}` },
  breakdownLbl: { fontSize:'11px',fontWeight:'700',color:CA,textTransform:'uppercase',letterSpacing:'0.08em',margin:'0 0 6px' },
  breakdownVal: { fontSize:'13px',color:C2,lineHeight:'1.7',margin:0 },
  hookGrid:  { display:'flex',flexDirection:'column',gap:'10px' },
  hookCard:  { padding:'16px',background:'rgba(255,255,255,0.02)',border:`1px solid ${CB}`,borderRadius:'8px' },
  piTable:   { width:'100%',borderCollapse:'collapse',fontSize:'13px' },
  piTh:      { fontSize:'11px',color:C3,textTransform:'uppercase',letterSpacing:'0.07em',fontWeight:'600',padding:'0 12px 10px 0',textAlign:'left',borderBottom:`1px solid ${CB}` },
  piTd:      { padding:'10px 12px 10px 0',verticalAlign:'top' },
  recTitle:  { background:'rgba(212,168,71,0.06)',border:`1px solid rgba(212,168,71,0.15)`,borderRadius:'10px',padding:'18px 20px' },
  recTitleLabel:{ fontSize:'11px',fontWeight:'700',color:CA,textTransform:'uppercase',letterSpacing:'0.1em',margin:0 },
  recTitleText: { fontFamily:'var(--FH)',fontSize:'17px',fontWeight:'700',color:C1,margin:0,lineHeight:1.4 },
  colGrid:   { display:'grid',gridTemplateColumns:'1fr 1fr',gap:'14px' },
  titleRow:  { paddingBottom:'16px',borderBottom:`1px solid ${CB}`,marginBottom:'4px' },
  primaryKw: { display:'inline-block',background:'rgba(212,168,71,0.1)',border:`1px solid rgba(212,168,71,0.2)`,borderRadius:'5px',padding:'5px 12px',color:CA,fontSize:'13px',fontWeight:'700' },
  secKw:     { display:'inline-block',background:'rgba(255,255,255,0.04)',border:`1px solid ${CB}`,borderRadius:'5px',padding:'5px 10px',color:C2,fontSize:'12px' },
  tag:       { display:'inline-block',background:'rgba(255,255,255,0.04)',border:`1px solid ${CB}`,borderRadius:'4px',padding:'4px 10px',color:C3,fontSize:'12px' },
  hashTag:   { display:'inline-block',background:'rgba(56,189,248,0.07)',border:'1px solid rgba(56,189,248,0.12)',borderRadius:'4px',padding:'3px 9px',color:'rgba(56,189,248,0.7)',fontSize:'12px' },
  miniLabel: { fontSize:'11px',fontWeight:'700',color:C3,textTransform:'uppercase',letterSpacing:'0.1em',margin:'0 0 10px' },
  kvTable:   { display:'flex',flexDirection:'column',gap:'12px' },
  kvRow:     { display:'flex',gap:'16px',alignItems:'flex-start',paddingBottom:'12px',borderBottom:`1px solid ${CB}` },
  kvKey:     { fontSize:'12px',color:C3,fontWeight:'600',minWidth:'130px',flexShrink:0,paddingTop:'2px' },
  kvVal:     { fontSize:'13px',lineHeight:'1.5' },
  scheduleBox:{ background:'rgba(255,255,255,0.02)',border:`1px solid ${CB}`,borderRadius:'10px',padding:'18px 20px' },
  schedStat: { background:'rgba(255,255,255,0.05)',border:`1px solid ${CB}`,borderRadius:'5px',padding:'6px 12px',color:C1,fontSize:'13px',fontWeight:'600' },
  planGrid:  { display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(220px,1fr))',gap:'12px' },
  dayCard:   { background:'rgba(255,255,255,0.02)',border:`1px solid ${CB}`,borderRadius:'8px',padding:'16px',transition:'border-color 0.2s' },
  dayNum:    { background:'rgba(212,168,71,0.1)',borderRadius:'4px',padding:'3px 9px',color:CA,fontSize:'11px',fontWeight:'800' },
  dayType:   { fontSize:'11px',color:C3,textTransform:'uppercase',letterSpacing:'0.05em',fontWeight:'600' },
  dayPlat:   { background:'rgba(56,189,248,0.07)',border:'1px solid rgba(56,189,248,0.1)',borderRadius:'4px',padding:'3px 8px',color:'rgba(56,189,248,0.7)',fontSize:'11px' },
};