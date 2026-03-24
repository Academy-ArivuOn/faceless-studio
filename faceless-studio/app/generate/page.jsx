'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { getSupabaseBrowser } from '@/lib/supabase-browser';

// ─── Constants ────────────────────────────────────────────────────────────────
const PLATFORMS = [
  { value: 'YouTube',          label: '▶  YouTube' },
  { value: 'Instagram Reels',  label: '⬡  Instagram Reels' },
  { value: 'TikTok',           label: '♪  TikTok' },
  { value: 'Podcast',          label: '🎙  Podcast' },
  { value: 'Blog',             label: '✍  Blog' },
  { value: 'YouTube Shorts',   label: '⚡ YouTube Shorts' },
];

const CREATOR_TYPES = [
  { value: 'educator',      label: 'Educator / Teacher' },
  { value: 'coach',         label: 'Coach / Mentor' },
  { value: 'entertainer',   label: 'Entertainer' },
  { value: 'podcaster',     label: 'Podcaster' },
  { value: 'blogger',       label: 'Blogger / Writer' },
  { value: 'agency',        label: 'Agency / Brand' },
  { value: 'general',       label: 'General Creator' },
];

const LANGUAGES = [
  'English', 'Hindi', 'Tamil', 'Telugu', 'Kannada', 'Marathi',
  'Bengali', 'Gujarati', 'Malayalam', 'Punjabi', 'Spanish', 'French',
];

const TONES = ['Educational', 'Conversational', 'Motivational', 'Entertaining', 'Authoritative', 'Storytelling'];

const AGENTS = [
  { id: 'research',  label: 'Research Agent',   icon: '🔍', desc: 'Finding viral angles & hook psychology' },
  { id: 'creator',   label: 'Creator Agent',    icon: '✍️',  desc: 'Writing full script & scene breakdown' },
  { id: 'publisher', label: 'Publisher Agent',  icon: '📡', desc: 'Building YouTube SEO & social assets' },
];

// ─── Component ────────────────────────────────────────────────────────────────
export default function GeneratePage() {
  const router   = useRouter();
  const supabase = getSupabaseBrowser();

  const [user,    setUser]    = useState(null);
  const [usage,   setUsage]   = useState(null);
  const [loading, setLoading] = useState(true);

  // Form state
  const [niche,       setNiche]       = useState('');
  const [platform,    setPlatform]    = useState('YouTube');
  const [creatorType, setCreatorType] = useState('general');
  const [language,    setLanguage]    = useState('English');
  const [tone,        setTone]        = useState('Educational');

  // Pipeline state
  const [running,      setRunning]      = useState(false);
  const [agentStatus,  setAgentStatus]  = useState({});  // { research: 'idle'|'running'|'done'|'error' }
  const [currentAgent, setCurrentAgent] = useState(null);
  const [elapsedMs,    setElapsedMs]    = useState(0);
  const [error,        setError]        = useState('');
  const timerRef = useRef(null);
  const startRef = useRef(null);

  // ── Auth gate ──────────────────────────────────────────────────────────────
  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) { router.replace('/login'); return; }
      setUser(session.user);
      // Fetch usage
      const res  = await fetch('/api/usage', { headers: { Authorization: `Bearer ${session.access_token}` } });
      const json = await res.json();
      if (json.success) setUsage(json.usage);
      setLoading(false);
    });
  }, []);

  // ── Timer ──────────────────────────────────────────────────────────────────
  function startTimer() {
    startRef.current = Date.now();
    timerRef.current = setInterval(() => setElapsedMs(Date.now() - startRef.current), 250);
  }
  function stopTimer() {
    if (timerRef.current) clearInterval(timerRef.current);
  }

  // ── Submit ─────────────────────────────────────────────────────────────────
  async function handleGenerate(e) {
    e.preventDefault();
    if (!niche.trim() || niche.trim().length < 2) { setError('Please enter a niche (at least 2 characters).'); return; }
    if (usage && !usage.allowed) { setError('Monthly limit reached. Upgrade to continue.'); return; }

    setError('');
    setRunning(true);
    setAgentStatus({ research: 'idle', creator: 'idle', publisher: 'idle' });
    startTimer();

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { router.replace('/login'); return; }

    // Optimistically show pipeline animation
    setCurrentAgent('research');
    setAgentStatus({ research: 'running', creator: 'idle', publisher: 'idle' });

    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type':  'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ niche: niche.trim(), platform, creatorType, language, tone }),
      });

      const json = await res.json();

      if (!res.ok || !json.success) {
        stopTimer();
        setRunning(false);
        setAgentStatus({ research: 'error', creator: 'idle', publisher: 'idle' });
        setError(json.error || 'Generation failed. Please try again.');
        return;
      }

      // Mark all agents done
      setAgentStatus({ research: 'done', creator: 'done', publisher: 'done' });
      setCurrentAgent(null);
      stopTimer();

      // Store results in sessionStorage → redirect to results
      sessionStorage.setItem('studioai_result', JSON.stringify(json));
      router.push('/results');

    } catch (err) {
      stopTimer();
      setRunning(false);
      setAgentStatus({ research: 'error', creator: 'idle', publisher: 'idle' });
      setError('Network error. Make sure the dev server is running.');
    }
  }

  // ── Loading screen ─────────────────────────────────────────────────────────
  if (loading) return (
    <div style={styles.splash}>
      <div style={styles.spinner} />
    </div>
  );

  // ── Main render ────────────────────────────────────────────────────────────
  return (
    <div style={styles.page}>
      console.log("SERVICE KEY:", process.env.SUPABASE_SERVICE_ROLE_KEY);
      {/* Background */}
      <div style={{...styles.blob, top: '-15%', left: '-10%',  background: 'radial-gradient(circle, rgba(233,161,0,0.09) 0%, transparent 60%)'}} />
      <div style={{...styles.blob, bottom: '-10%', right: '-10%', background: 'radial-gradient(circle, rgba(12,170,220,0.08) 0%, transparent 60%)'}} />

      {/* Nav */}
      <nav style={styles.nav}>
        <div style={styles.navLogo}>
          <span style={{color:'var(--gold)', fontSize:'20px'}}>⬡</span>
          <span style={styles.navLogoText}>Studio AI</span>
        </div>
        <div style={styles.navRight}>
          {usage && (
            <span style={styles.usagePill}>
              {usage.plan === 'free'
                ? `${usage.remaining ?? 0} free left`
                : `${usage.plan} plan ∞`}
            </span>
          )}
          <button style={styles.navBtn} onClick={async () => { await supabase.auth.signOut(); router.push('/login'); }}>
            Sign out
          </button>
        </div>
      </nav>

      <div style={styles.container}>
        {/* Header */}
        <div style={styles.header}>
          <h1 style={styles.h1}>Generate Your Content Pack</h1>
          <p style={styles.subtitle}>3 AI agents fire in sequence → full script, SEO, social assets in ~90 seconds.</p>
        </div>

        {/* Pipeline status (shows during generation) */}
        {running && (
          <div style={styles.pipelineBox}>
            <div style={styles.pipelineHeader}>
              <span style={styles.pipelineLive}>● LIVE</span>
              <span style={styles.pipelineTimer}>{(elapsedMs / 1000).toFixed(1)}s</span>
            </div>
            <div style={styles.agentsList}>
              {AGENTS.map((agent, i) => {
                const status = agentStatus[agent.id] || 'idle';
                return (
                  <div key={agent.id} style={{...styles.agentRow, ...(status === 'running' ? styles.agentRowRunning : {})}}>
                    <div style={{...styles.agentDot, ...getDotStyle(status)}} />
                    <span style={styles.agentIcon}>{agent.icon}</span>
                    <div style={styles.agentInfo}>
                      <span style={{...styles.agentName, color: status === 'done' ? 'var(--gold)' : status === 'running' ? 'var(--white)' : 'var(--w3)'}}>
                        {agent.label}
                      </span>
                      <span style={styles.agentDesc}>
                        {status === 'running' ? agent.desc : status === 'done' ? 'Complete ✓' : status === 'error' ? 'Failed ✗' : 'Waiting...'}
                      </span>
                    </div>
                    {status === 'running' && <div style={styles.agentSpinner} />}
                    {status === 'done'    && <span style={styles.checkmark}>✓</span>}
                  </div>
                );
              })}
            </div>
            <p style={styles.pipelineNote}>Do not close this tab. Generation takes 60-90 seconds.</p>
          </div>
        )}

        {/* Form */}
        {!running && (
          <form onSubmit={handleGenerate} style={styles.form}>
            {/* Niche input */}
            <div style={styles.field}>
              <label style={styles.label}>
                Your Niche <span style={{color:'var(--gold)'}}>*</span>
              </label>
              <input
                style={styles.input}
                type="text"
                placeholder="e.g. personal finance for Indian millennials, fitness for busy moms, SaaS growth hacking..."
                value={niche}
                onChange={e => setNiche(e.target.value)}
                disabled={running}
                required
              />
              <span style={styles.hint}>Be specific. "Personal finance India" beats "finance".</span>
            </div>

            {/* Row: Platform + Creator Type */}
            <div style={styles.row}>
              <div style={styles.field}>
                <label style={styles.label}>Platform</label>
                <select style={styles.select} value={platform} onChange={e => setPlatform(e.target.value)}>
                  {PLATFORMS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
                </select>
              </div>
              <div style={styles.field}>
                <label style={styles.label}>Creator Type</label>
                <select style={styles.select} value={creatorType} onChange={e => setCreatorType(e.target.value)}>
                  {CREATOR_TYPES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                </select>
              </div>
            </div>

            {/* Row: Language + Tone */}
            <div style={styles.row}>
              <div style={styles.field}>
                <label style={styles.label}>Script Language</label>
                <select style={styles.select} value={language} onChange={e => setLanguage(e.target.value)}>
                  {LANGUAGES.map(l => <option key={l} value={l}>{l}</option>)}
                </select>
              </div>
              <div style={styles.field}>
                <label style={styles.label}>Tone</label>
                <select style={styles.select} value={tone} onChange={e => setTone(e.target.value)}>
                  {TONES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
            </div>

            {error && <p style={styles.errorMsg}>{error}</p>}

            {/* Submit */}
            <button type="submit" disabled={running} style={styles.submitBtn}>
              <span style={styles.submitIcon}>⬡</span>
              Fire All 3 Agents
              <span style={styles.submitArrow}>→</span>
            </button>

            {usage && usage.plan === 'free' && (
              <p style={styles.usageNote}>
                {usage.remaining} of {usage.limit} free generations remaining this month
              </p>
            )}
          </form>
        )}
      </div>
    </div>
  );
}

// ─── Helper ───────────────────────────────────────────────────────────────────
function getDotStyle(status) {
  if (status === 'running') return { background: 'var(--gold)', boxShadow: '0 0 8px var(--gold)' };
  if (status === 'done')    return { background: '#00dc82' };
  if (status === 'error')   return { background: '#ff6b6b' };
  return { background: 'var(--w3)' };
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = {
  splash: {
    minHeight: '100vh', background: 'var(--void)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  spinner: {
    width: '36px', height: '36px',
    border: '3px solid rgba(233,161,0,0.2)',
    borderTopColor: 'var(--gold)',
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
  },
  page: {
    minHeight: '100vh', background: 'var(--void)',
    fontFamily: 'var(--FB)', position: 'relative', overflow: 'hidden',
  },
  blob: {
    position: 'absolute', width: '700px', height: '700px',
    borderRadius: '50%', pointerEvents: 'none',
  },
  nav: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '20px 40px',
    borderBottom: '1px solid rgba(238,242,255,0.07)',
    position: 'relative', zIndex: 10,
  },
  navLogo: { display: 'flex', alignItems: 'center', gap: '10px' },
  navLogoText: {
    fontFamily: 'var(--FH)', fontSize: '18px', fontWeight: '700',
    color: 'var(--white)', letterSpacing: '-0.02em',
  },
  navRight: { display: 'flex', alignItems: 'center', gap: '16px' },
  usagePill: {
    background: 'rgba(233,161,0,0.12)', border: '1px solid rgba(233,161,0,0.25)',
    borderRadius: '20px', padding: '6px 14px',
    color: 'var(--gold)', fontSize: '12px', fontWeight: '600',
  },
  navBtn: {
    background: 'transparent', border: '1px solid rgba(238,242,255,0.15)',
    borderRadius: '8px', padding: '8px 16px',
    color: 'var(--w5)', fontSize: '13px', cursor: 'pointer',
    fontFamily: 'var(--FB)',
  },
  container: {
    maxWidth: '680px', margin: '0 auto', padding: '60px 24px 80px',
    position: 'relative', zIndex: 1,
  },
  header: { marginBottom: '40px', textAlign: 'center' },
  h1: {
    fontFamily: 'var(--FH)', fontSize: 'clamp(26px, 4vw, 36px)',
    fontWeight: '800', color: 'var(--white)', margin: '0 0 12px',
    letterSpacing: '-0.03em',
  },
  subtitle: { color: 'var(--w5)', fontSize: '15px', margin: 0 },

  // Pipeline
  pipelineBox: {
    background: 'rgba(238,242,255,0.04)',
    border: '1px solid rgba(233,161,0,0.25)',
    borderRadius: '16px', padding: '28px',
    marginBottom: '32px',
  },
  pipelineHeader: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: '24px',
  },
  pipelineLive: {
    color: 'var(--gold)', fontSize: '12px', fontWeight: '700',
    letterSpacing: '0.1em', animation: 'pulse 1.5s ease-in-out infinite',
  },
  pipelineTimer: { color: 'var(--w5)', fontFamily: 'var(--FM)', fontSize: '13px' },
  agentsList: { display: 'flex', flexDirection: 'column', gap: '16px' },
  agentRow: {
    display: 'flex', alignItems: 'center', gap: '16px',
    padding: '16px', borderRadius: '12px',
    border: '1px solid transparent', transition: 'all 0.3s',
  },
  agentRowRunning: {
    background: 'rgba(233,161,0,0.07)',
    border: '1px solid rgba(233,161,0,0.2)',
  },
  agentDot: {
    width: '8px', height: '8px', borderRadius: '50%',
    flexShrink: 0, transition: 'all 0.3s',
  },
  agentIcon: { fontSize: '22px', flexShrink: 0 },
  agentInfo: { flex: 1, display: 'flex', flexDirection: 'column', gap: '3px' },
  agentName: { fontSize: '14px', fontWeight: '600', transition: 'color 0.3s' },
  agentDesc: { fontSize: '12px', color: 'var(--w3)' },
  agentSpinner: {
    width: '18px', height: '18px', flexShrink: 0,
    border: '2px solid rgba(233,161,0,0.2)',
    borderTopColor: 'var(--gold)',
    borderRadius: '50%',
    animation: 'spin 0.7s linear infinite',
  },
  checkmark: { color: '#00dc82', fontSize: '16px', fontWeight: '700' },
  pipelineNote: {
    marginTop: '20px', marginBottom: 0,
    color: 'var(--w3)', fontSize: '12px', textAlign: 'center',
  },

  // Form
  form: { display: 'flex', flexDirection: 'column', gap: '22px' },
  field: { display: 'flex', flexDirection: 'column', gap: '8px' },
  label: { fontSize: '13px', fontWeight: '600', color: 'var(--w8)', letterSpacing: '0.02em' },
  input: {
    background: 'rgba(238,242,255,0.06)',
    border: '1px solid rgba(238,242,255,0.12)',
    borderRadius: '12px', padding: '14px 18px',
    color: 'var(--white)', fontSize: '15px',
    fontFamily: 'var(--FB)', outline: 'none',
  },
  hint: { fontSize: '12px', color: 'var(--w3)' },
  row: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' },
  select: {
    background: 'rgba(238,242,255,0.06)',
    border: '1px solid rgba(238,242,255,0.12)',
    borderRadius: '12px', padding: '14px 18px',
    color: 'var(--white)', fontSize: '14px',
    fontFamily: 'var(--FB)', outline: 'none', cursor: 'pointer',
  },
  errorMsg: {
    background: 'rgba(255,80,80,0.1)',
    border: '1px solid rgba(255,80,80,0.3)',
    borderRadius: '10px', padding: '14px',
    color: '#ff6b6b', fontSize: '14px', margin: 0,
  },
  submitBtn: {
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
    background: 'linear-gradient(135deg, var(--gold) 0%, var(--gold-hi) 100%)',
    border: 'none', borderRadius: '12px', padding: '18px',
    color: '#000', fontSize: '16px', fontWeight: '800',
    fontFamily: 'var(--FH)', cursor: 'pointer', letterSpacing: '-0.01em',
    transition: 'transform 0.2s, box-shadow 0.2s',
    boxShadow: '0 4px 30px rgba(233,161,0,0.25)',
  },
  submitIcon: { fontSize: '18px' },
  submitArrow: { fontSize: '18px' },
  usageNote: { textAlign: 'center', color: 'var(--w3)', fontSize: '12px', margin: 0 },
};