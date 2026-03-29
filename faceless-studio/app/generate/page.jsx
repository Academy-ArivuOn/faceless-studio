'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { getSupabaseBrowser } from '@/lib/supabase-browser';
import StreakBadge from '@/components/app/StreakBadge';

const PLATFORMS = [
  { value: 'YouTube', label: 'YouTube' },
  { value: 'Instagram Reels', label: 'Instagram Reels' },
  { value: 'TikTok', label: 'TikTok' },
  { value: 'Podcast', label: 'Podcast' },
  { value: 'Blog', label: 'Blog / Article' },
  { value: 'YouTube Shorts', label: 'YouTube Shorts' },
];
const CREATOR_TYPES = [
  { value: 'educator', label: 'Educator' },
  { value: 'coach', label: 'Coach / Mentor' },
  { value: 'entertainer', label: 'Entertainer' },
  { value: 'podcaster', label: 'Podcaster' },
  { value: 'blogger', label: 'Blogger / Writer' },
  { value: 'agency', label: 'Agency / Brand' },
  { value: 'general', label: 'General Creator' },
];
const LANGUAGES = ['English', 'Hindi', 'Tamil', 'Telugu', 'Kannada', 'Marathi', 'Bengali', 'Gujarati', 'Malayalam', 'Punjabi', 'Spanish', 'French'];
const TONES = ['Educational', 'Conversational', 'Motivational', 'Entertaining', 'Authoritative', 'Storytelling'];
const AGENTS = [
  { id: 'research', num: '01', label: 'Research', desc: 'Trends, angles & hook psychology' },
  { id: 'creator', num: '02', label: 'Script', desc: 'Full script, scenes & retention' },
  { id: 'publisher', num: '03', label: 'Distribute', desc: 'SEO, social captions & 7-day plan' },
];

export default function GeneratePage() {
  const router = useRouter();
  const supabase = getSupabaseBrowser();

  const [user, setUser] = useState(null);
  const [usage, setUsage] = useState(null);
  const [pageLoading, setPageLoading] = useState(true);
  const [niche, setNiche] = useState('');
  const [platform, setPlatform] = useState('YouTube');
  const [creatorType, setCreatorType] = useState('general');
  const [language, setLanguage] = useState('English');
  const [tone, setTone] = useState('Educational');
  const [running, setRunning] = useState(false);
  const [agentStatus, setAgentStatus] = useState({});
  const [elapsed, setElapsed] = useState(0);
  const [error, setError] = useState('');
  const [logs, setLogs] = useState([]);
  const [streak, setStreak] = useState(0);

  const timerRef = useRef(null);
  const startRef = useRef(null);
  const logsRef = useRef(null);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) { router.replace('/login'); return; }
      setUser(session.user);
      const res = await fetch('/api/usage', { headers: { Authorization: `Bearer ${session.access_token}` } });
      const json = await res.json();
      if (json.success) setUsage(json.usage);
      setPageLoading(false);
    });
  }, []);

  function pushLog(msg) {
    setLogs(prev => {
      const next = [...prev, { t: new Date().toLocaleTimeString('en', { hour12: false }), msg }];
      setTimeout(() => { if (logsRef.current) logsRef.current.scrollTop = logsRef.current.scrollHeight; }, 40);
      return next;
    });
  }

  function startTimer() {
    startRef.current = Date.now();
    timerRef.current = setInterval(() => setElapsed(Date.now() - startRef.current), 100);
  }
  function stopTimer() { clearInterval(timerRef.current); }

  async function handleGenerate(e) {
    e.preventDefault();
    if (!niche.trim() || niche.trim().length < 2) { setError('Enter a niche (minimum 2 characters).'); return; }
    if (usage && !usage.allowed) { setError('Monthly limit reached. Upgrade your plan to continue.'); return; }

    setError(''); setRunning(true); setLogs([]);
    setAgentStatus({ research: 'running', creator: 'idle', publisher: 'idle' });
    startTimer();
    pushLog('Pipeline initialised');
    pushLog('Research Agent → scanning trends and hook patterns...');

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { router.replace('/login'); return; }

    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session.access_token}` },
        body: JSON.stringify({ niche: niche.trim(), platform, creatorType, language, tone }),
      });
      const json = await res.json();

      if (json?.meta?.streak) {
        setStreak(json.meta.streak);
      }

      if (!res.ok || !json.success) {
        stopTimer(); setRunning(false);
        setAgentStatus({ research: 'error', creator: 'idle', publisher: 'idle' });
        pushLog(`✕ Error: ${json.error || 'Generation failed'}`);
        setError(json.error || 'Generation failed. Please try again.');
        return;
      }

      const dur = json.meta?.agent_durations || {};
      pushLog(`✓ Research complete — topic selected (${((dur.research || 0) / 1000).toFixed(1)}s)`);
      setAgentStatus({ research: 'done', creator: 'running', publisher: 'idle' });
      pushLog('Creator Agent → writing full script and scene breakdown...');
      await new Promise(r => setTimeout(r, 350));
      pushLog(`✓ Script complete — ${json.creator?.word_count || 0} words (${((dur.creator || 0) / 1000).toFixed(1)}s)`);
      setAgentStatus({ research: 'done', creator: 'done', publisher: 'running' });
      pushLog('Publisher Agent → building SEO metadata and social assets...');
      await new Promise(r => setTimeout(r, 350));
      pushLog(`✓ Distribution pack complete (${((dur.publisher || 0) / 1000).toFixed(1)}s)`);
      setAgentStatus({ research: 'done', creator: 'done', publisher: 'done' });
      pushLog(`— Pipeline finished in ${((json.meta?.total_duration_ms || 0) / 1000).toFixed(1)}s`);
      stopTimer();

      await new Promise(r => setTimeout(r, 700));
      sessionStorage.setItem('studioai_result', JSON.stringify(json));
      router.push('/results');

    } catch (err) {
      stopTimer(); setRunning(false);
      setAgentStatus({ research: 'error', creator: 'idle', publisher: 'idle' });
      pushLog(`✕ Network error: ${err.message}`);
      setError('Network error. Check your connection and try again.');
    }
  }

  if (pageLoading) return (
    <div style={{ minHeight: '100vh', background: BG.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Spinner size={24} />
    </div>
  );

  return (
    <div style={{ ...BG.root, minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>

      {/* ── Topbar ── */}
      <header style={T.bar}>
        <div style={T.left}>
          <HexLogo />
          <span style={T.brand}>Studio AI</span>
        </div>
        <div style={T.right}>
          {usage && <span style={T.plan}>{usage.plan === 'free' ? `Free plan · ${usage.remaining ?? 0} remaining` : `${usage.plan} · unlimited`}</span>}
          <button style={T.ghost} onClick={() => router.push('/dashboard')}>Dashboard</button>
          {streak > 0 && (
            <StreakBadge streak={streak} compact />
          )}
          <button style={T.btn} onClick={async () => { await supabase.auth.signOut(); router.push('/login'); }}>Sign out</button>
        </div>
      </header>

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>

        {/* ── Left rail ── */}
        <aside style={R.aside}>
          <p style={R.sectionLabel}>Agent Pipeline</p>

          <div style={R.agentStack}>
            {AGENTS.map((a, i) => {
              const st = agentStatus[a.id] || 'idle';
              return (
                <div key={a.id} style={R.agentRow}>
                  {i < 2 && <div style={{ ...R.line, background: st === 'done' ? CA : CB }} />}
                  <div style={{ ...R.badge, ...badgeVar(st) }}>
                    {st === 'running' ? <span style={R.pulse} /> : st === 'done' ? '✓' : st === 'error' ? '✕' : a.num}
                  </div>
                  <div style={R.agentMeta}>
                    <span style={{ ...R.agentTitle, color: st === 'done' ? CA : st === 'running' ? C1 : C3 }}>{a.label}</span>
                    <span style={R.agentNote}>{a.desc}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Terminal */}
          <div style={R.terminal}>
            <div style={R.termHead}>
              <div style={{ display: 'flex', gap: '5px' }}>
                {[0, 1, 2].map(i => <span key={i} style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'rgba(255,255,255,0.08)', display: 'block' }} />)}
              </div>
              <span style={R.termLabel}>stdout</span>
              {running && <span style={R.termTimer}>{(elapsed / 1000).toFixed(1)}s</span>}
            </div>
            <div style={R.termBody} ref={logsRef}>
              {logs.length === 0
                ? <span style={R.termEmpty}>Waiting...</span>
                : logs.map((l, i) => (
                  <div key={i} style={{ display: 'flex', gap: '10px', marginBottom: '3px' }}>
                    <span style={R.logTs}>{l.t}</span>
                    <span style={{
                      ...R.logTxt,
                      color: l.msg.startsWith('✕') ? '#F87171'
                        : l.msg.startsWith('✓') || l.msg.startsWith('—') ? '#3ECF8E'
                          : C2,
                    }}>{l.msg}</span>
                  </div>
                ))
              }
            </div>
          </div>
        </aside>

        {/* ── Main form ── */}
        <main style={F.main}>
          <div style={F.wrap}>
            <div style={F.header}>
              <h1 style={F.h1}>Generate Content Pack</h1>
              <p style={F.sub}>Three specialised agents produce a complete script, scene breakdown, SEO metadata, and 7-day distribution plan in under 90 seconds.</p>
            </div>

            <form onSubmit={handleGenerate} style={F.form}>

              <div style={F.field}>
                <label style={F.label}>Niche <span style={{ color: CA }}>*</span></label>
                <input
                  style={F.input} type="text"
                  placeholder="e.g. personal finance for Indian millennials, SaaS growth hacking, fitness for busy professionals..."
                  value={niche} onChange={e => setNiche(e.target.value)}
                  disabled={running} required
                />
                <span style={F.hint}>Specific beats generic. The more precise your niche, the stronger the output.</span>
              </div>

              <div style={F.grid2}>
                <div style={F.field}>
                  <label style={F.label}>Platform</label>
                  <select style={F.select} value={platform} onChange={e => setPlatform(e.target.value)}>
                    {PLATFORMS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
                  </select>
                </div>
                <div style={F.field}>
                  <label style={F.label}>Creator Type</label>
                  <select style={F.select} value={creatorType} onChange={e => setCreatorType(e.target.value)}>
                    {CREATOR_TYPES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                  </select>
                </div>
              </div>

              <div style={F.grid2}>
                <div style={F.field}>
                  <label style={F.label}>Script Language</label>
                  <select style={F.select} value={language} onChange={e => setLanguage(e.target.value)}>
                    {LANGUAGES.map(l => <option key={l} value={l}>{l}</option>)}
                  </select>
                </div>
                <div style={F.field}>
                  <label style={F.label}>Tone</label>
                  <select style={F.select} value={tone} onChange={e => setTone(e.target.value)}>
                    {TONES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              </div>

              {error && (
                <div style={F.errBox}>
                  <span style={{ color: '#F87171', fontSize: '11px' }}>●</span>
                  <span>{error}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={running}
                style={{ ...F.cta, opacity: running ? 0.55 : 1, cursor: running ? 'not-allowed' : 'pointer' }}
              >
                {running
                  ? <><Spinner size={14} dark /> <span style={{ marginLeft: '10px' }}>Pipeline running…</span></>
                  : <>Run All 3 Agents <span style={{ marginLeft: '8px', fontSize: '15px' }}>→</span></>
                }
              </button>

              {usage?.plan === 'free' && (
                <p style={{ textAlign: 'center', fontSize: '12px', color: (usage.remaining ?? 0) === 0 ? '#F87171' : C3, margin: '4px 0 0' }}>
                  {usage.remaining ?? 0} of {usage.limit} free generations remaining this month
                </p>
              )}

            </form>
          </div>
        </main>

      </div>
    </div>
  );
}

// ── Atom components ──────────────────────────────────────────────────────────
function HexLogo() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <polygon points="10,2 17,6 17,14 10,18 3,14 3,6" stroke="#D4A847" strokeWidth="1.4" fill="none" />
      <polygon points="10,6 14,8.5 14,13.5 10,16 6,13.5 6,8.5" fill="#D4A847" fillOpacity="0.12" />
    </svg>
  );
}
function Spinner({ size = 20, dark = false }) {
  return <span style={{ width: `${size}px`, height: `${size}px`, borderRadius: '50%', border: `2px solid ${dark ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.1)'}`, borderTopColor: dark ? '#000' : '#D4A847', display: 'inline-block', animation: 'spin 0.7s linear infinite', flexShrink: 0 }} />;
}

// ── Color tokens ──────────────────────────────────────────────────────────────
const BG = { bg: '#07070E', root: { background: '#07070E', fontFamily: 'var(--FB)', color: '#EEEEF5' } };
const CA = '#D4A847';  // accent gold
const C1 = '#EEEEF5';  // text primary
const C2 = 'rgba(238,238,245,0.55)';  // text secondary
const C3 = 'rgba(238,238,245,0.28)';  // text tertiary
const CB = 'rgba(255,255,255,0.07)';  // border default

function badgeVar(st) {
  if (st === 'running') return { border: `1px solid ${CA}`, color: CA, background: 'rgba(212,168,71,0.08)' };
  if (st === 'done') return { border: '1px solid #3ECF8E', color: '#3ECF8E', background: 'rgba(62,207,142,0.08)' };
  if (st === 'error') return { border: '1px solid #F87171', color: '#F87171', background: 'rgba(248,113,113,0.08)' };
  return { border: `1px solid ${CB}`, color: C3, background: 'transparent' };
}

// ── Topbar styles ─────────────────────────────────────────────────────────────
const T = {
  bar: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 28px', height: '54px', borderBottom: `1px solid ${CB}`, flexShrink: 0 },
  left: { display: 'flex', alignItems: 'center', gap: '10px' },
  brand: { fontFamily: 'var(--FH)', fontSize: '15px', fontWeight: '700', color: C1, letterSpacing: '-0.02em' },
  right: { display: 'flex', alignItems: 'center', gap: '16px' },
  plan: { fontSize: '12px', color: C3, fontFamily: 'var(--FM)' },
  ghost: { background: 'transparent', border: 'none', color: C2, fontSize: '13px', cursor: 'pointer', fontFamily: 'var(--FB)', padding: '4px 0' },
  btn: { background: 'transparent', border: `1px solid ${CB}`, borderRadius: '6px', padding: '6px 14px', color: C2, fontSize: '13px', cursor: 'pointer', fontFamily: 'var(--FB)' },
};

// ── Rail styles ───────────────────────────────────────────────────────────────
const R = {
  aside: { width: '300px', flexShrink: 0, borderRight: `1px solid ${CB}`, padding: '28px 24px', display: 'flex', flexDirection: 'column', gap: '28px', overflowY: 'auto' },
  sectionLabel: { fontSize: '10px', fontWeight: '700', color: C3, letterSpacing: '0.12em', textTransform: 'uppercase', margin: 0 },
  agentStack: { display: 'flex', flexDirection: 'column' },
  agentRow: { display: 'flex', alignItems: 'flex-start', gap: '14px', paddingBottom: '20px', position: 'relative' },
  line: { position: 'absolute', left: '15px', top: '36px', width: '1px', height: 'calc(100% - 4px)', transition: 'background 0.4s' },
  badge: { width: '32px', height: '32px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: '700', fontFamily: 'var(--FM)', flexShrink: 0, transition: 'all 0.3s' },
  pulse: { width: '7px', height: '7px', borderRadius: '50%', background: CA, display: 'block', animation: 'pulse 1.2s ease-in-out infinite' },
  agentMeta: { display: 'flex', flexDirection: 'column', gap: '3px', paddingTop: '5px' },
  agentTitle: { fontSize: '13px', fontWeight: '600', transition: 'color 0.3s' },
  agentNote: { fontSize: '11px', color: C3, lineHeight: '1.5' },
  terminal: { border: `1px solid ${CB}`, borderRadius: '8px', overflow: 'hidden', background: '#050509', flex: 1 },
  termHead: { display: 'flex', alignItems: 'center', gap: '8px', padding: '9px 12px', borderBottom: `1px solid ${CB}`, background: 'rgba(255,255,255,0.015)' },
  termLabel: { fontSize: '11px', color: C3, fontFamily: 'var(--FM)', flex: 1 },
  termTimer: { fontSize: '11px', color: CA, fontFamily: 'var(--FM)' },
  termBody: { padding: '12px', minHeight: '110px', maxHeight: '180px', overflowY: 'auto', display: 'flex', flexDirection: 'column' },
  termEmpty: { fontSize: '11px', color: C3, fontFamily: 'var(--FM)' },
  logTs: { fontSize: '10px', color: C3, fontFamily: 'var(--FM)', flexShrink: 0, paddingTop: '1px', whiteSpace: 'nowrap' },
  logTxt: { fontSize: '11px', fontFamily: 'var(--FM)', lineHeight: '1.6', wordBreak: 'break-word' },
};

// ── Form styles ───────────────────────────────────────────────────────────────
const SEL_ARROW = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='11' height='7' viewBox='0 0 11 7'%3E%3Cpath d='M1 1l4.5 4.5L10 1' stroke='rgba(238,238,245,0.28)' strokeWidth='1.5' fill='none' strokeLinecap='round'/%3E%3C/svg%3E")`;
const F = {
  main: { flex: 1, overflowY: 'auto', display: 'flex', justifyContent: 'center', padding: '52px 32px 80px' },
  wrap: { width: '100%', maxWidth: '520px' },
  header: { marginBottom: '36px' },
  h1: { fontFamily: 'var(--FH)', fontSize: '24px', fontWeight: '800', color: C1, margin: '0 0 10px', letterSpacing: '-0.03em' },
  sub: { fontSize: '14px', color: C2, margin: 0, lineHeight: '1.7' },
  form: { display: 'flex', flexDirection: 'column', gap: '20px' },
  field: { display: 'flex', flexDirection: 'column', gap: '7px' },
  label: { fontSize: '11px', fontWeight: '600', color: C2, letterSpacing: '0.06em', textTransform: 'uppercase' },
  hint: { fontSize: '12px', color: C3, lineHeight: '1.5' },
  input: { background: 'rgba(255,255,255,0.03)', border: `1px solid ${CB}`, borderRadius: '8px', padding: '11px 14px', color: C1, fontSize: '14px', fontFamily: 'var(--FB)', outline: 'none', width: '100%', boxSizing: 'border-box' },
  grid2: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' },
  select: { background: 'rgba(255,255,255,0.03)', border: `1px solid ${CB}`, borderRadius: '8px', padding: '11px 36px 11px 14px', color: C1, fontSize: '14px', fontFamily: 'var(--FB)', outline: 'none', cursor: 'pointer', width: '100%', appearance: 'none', backgroundImage: SEL_ARROW, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center' },
  errBox: { background: 'rgba(248,113,113,0.07)', border: '1px solid rgba(248,113,113,0.18)', borderRadius: '8px', padding: '11px 14px', color: '#F87171', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px' },
  cta: { display: 'flex', alignItems: 'center', justifyContent: 'center', background: CA, border: 'none', borderRadius: '8px', padding: '14px 24px', color: '#000', fontSize: '14px', fontWeight: '700', fontFamily: 'var(--FH)', letterSpacing: '-0.01em', transition: 'opacity 0.2s', marginTop: '6px' },
};