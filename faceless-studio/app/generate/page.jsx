'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { getSupabaseBrowser } from '@/lib/supabase-browser';

// ─── GENERATE PAGE — Corporate Premium White Theme ─────────────────────────
const PLATFORMS    = ['YouTube','Instagram Reels','TikTok','Podcast','Blog','YouTube Shorts'];
const CREATOR_TYPES= [
  { value:'general',    label:'General Creator'  },
  { value:'educator',   label:'Educator'         },
  { value:'coach',      label:'Coach / Mentor'   },
  { value:'entertainer',label:'Entertainer'      },
  { value:'podcaster',  label:'Podcaster'        },
  { value:'blogger',    label:'Blogger / Writer' },
  { value:'agency',     label:'Agency / Brand'   },
];
const LANGUAGES = ['English','Hindi','Tamil','Telugu','Kannada','Marathi','Bengali','Gujarati','Malayalam','Punjabi','Spanish','French'];
const TONES     = ['Educational','Conversational','Motivational','Entertaining','Authoritative','Storytelling'];

const AGENTS = [
  { id:'research', num:'01', label:'Research',   desc:'Trends, angles & hook psychology',    color:'#C9A227' },
  { id:'creator',  num:'02', label:'Script',      desc:'Full script, scenes & retention',     color:'#2563EB' },
  { id:'publisher',num:'03', label:'Distribute',  desc:'SEO, social captions & 7-day plan',   color:'#0E7C4A' },
];

export default function GeneratePage() {
  const router   = useRouter();
  const supabase = getSupabaseBrowser();

  const [user,        setUser]        = useState(null);
  const [usage,       setUsage]       = useState(null);
  const [pageLoading, setPageLoading] = useState(true);
  const [niche,       setNiche]       = useState('');
  const [platform,    setPlatform]    = useState('YouTube');
  const [creatorType, setCreatorType] = useState('general');
  const [language,    setLanguage]    = useState('English');
  const [tone,        setTone]        = useState('Educational');
  const [running,     setRunning]     = useState(false);
  const [agentStatus, setAgentStatus] = useState({});
  const [elapsed,     setElapsed]     = useState(0);
  const [error,       setError]       = useState('');
  const [logs,        setLogs]        = useState([]);
  const [streak,      setStreak]      = useState(0);

  const timerRef = useRef(null);
  const startRef = useRef(null);
  const logsRef  = useRef(null);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) { router.replace('/login'); return; }
      setUser(session.user);
      const res  = await fetch('/api/usage', { headers: { Authorization: `Bearer ${session.access_token}` } });
      const json = await res.json();
      if (json.success) setUsage(json.usage);
      setPageLoading(false);
    });
  }, []);

  function pushLog(msg, type = 'info') {
    setLogs(prev => {
      const next = [...prev, { t: new Date().toLocaleTimeString('en', { hour12:false }), msg, type }];
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
    setAgentStatus({ research:'running', creator:'idle', publisher:'idle' });
    startTimer();
    pushLog('Pipeline initialised', 'system');
    pushLog('Research Agent → scanning trends...', 'agent');

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { router.replace('/login'); return; }

    try {
      const res  = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type':'application/json', 'Authorization':`Bearer ${session.access_token}` },
        body: JSON.stringify({ niche:niche.trim(), platform, creatorType, language, tone }),
      });
      const json = await res.json();

      if (json?.meta?.streak) setStreak(json.meta.streak);

      if (!res.ok || !json.success) {
        stopTimer(); setRunning(false);
        setAgentStatus({ research:'error', creator:'idle', publisher:'idle' });
        pushLog(`Error: ${json.error || 'Generation failed'}`, 'error');
        setError(json.error || 'Generation failed. Please try again.');
        return;
      }

      const dur = json.meta?.agent_durations || {};
      pushLog(`✓ Research complete (${((dur.research||0)/1000).toFixed(1)}s)`, 'success');
      setAgentStatus({ research:'done', creator:'running', publisher:'idle' });
      pushLog('Creator Agent → writing full script...', 'agent');
      await new Promise(r => setTimeout(r, 350));
      pushLog(`✓ Script complete — ${json.creator?.word_count || 0} words (${((dur.creator||0)/1000).toFixed(1)}s)`, 'success');
      setAgentStatus({ research:'done', creator:'done', publisher:'running' });
      pushLog('Publisher Agent → building SEO + social assets...', 'agent');
      await new Promise(r => setTimeout(r, 350));
      pushLog(`✓ Distribution pack complete (${((dur.publisher||0)/1000).toFixed(1)}s)`, 'success');
      setAgentStatus({ research:'done', creator:'done', publisher:'done' });
      pushLog(`Pipeline finished in ${((json.meta?.total_duration_ms||0)/1000).toFixed(1)}s`, 'system');
      stopTimer();

      await new Promise(r => setTimeout(r, 600));
      sessionStorage.setItem('studioai_result', JSON.stringify(json));
      router.push('/results');
    } catch (err) {
      stopTimer(); setRunning(false);
      pushLog(`Network error: ${err.message}`, 'error');
      setError('Network error. Check your connection and try again.');
    }
  }

  if (pageLoading) return (
    <div style={{ minHeight:'100vh', background:'#FFFFFF', display:'flex', alignItems:'center', justifyContent:'center' }}>
      <Spinner />
    </div>
  );

  const planLabel = usage?.plan === 'free'
    ? `Free · ${usage?.remaining ?? 0} of ${usage?.limit} remaining`
    : `${usage?.plan?.charAt(0).toUpperCase() + usage?.plan?.slice(1)} · Unlimited`;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;800&family=DM+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin:0; padding:0; }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse-ring { 0%,100% { opacity:1; } 50% { opacity:0.4; } }

        .gen-root {
          min-height: 100vh;
          background: #FFFFFF;
          font-family: 'DM Sans', sans-serif;
          color: #0A0A0A;
          display: flex;
          flex-direction: column;
        }

        /* ── TOPBAR ── */
        .gen-topbar {
          height: 60px;
          border-bottom: 1px solid #E8E8E8;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 32px;
          background: #FFFFFF;
          position: sticky;
          top: 0;
          z-index: 100;
        }

        .gen-topbar-left {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .gen-logo-box {
          width: 30px; height: 30px;
          background: #0A0A0A;
          border-radius: 7px;
          display: flex; align-items: center; justify-content: center;
        }

        .gen-brand {
          font-family: 'Playfair Display', serif;
          font-size: 16px;
          font-weight: 700;
          color: #0A0A0A;
          letter-spacing: -0.02em;
        }

        .gen-sep { color: #E8E8E8; font-size: 16px; margin: 0 2px; }
        .gen-crumb { font-size: 14px; color: #8C8C8C; font-weight: 500; }

        .gen-topbar-right {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .gen-plan-chip {
          font-family: 'JetBrains Mono', monospace;
          font-size: 11px;
          color: #8C8C8C;
          background: #F5F5F5;
          border: 1px solid #E8E8E8;
          border-radius: 100px;
          padding: 4px 12px;
        }

        .gen-streak-badge {
          display: flex;
          align-items: center;
          gap: 5px;
          background: #FFF7ED;
          border: 1px solid #FED7AA;
          border-radius: 100px;
          padding: 4px 12px;
          font-size: 12px;
          font-weight: 600;
          color: #C2410C;
        }

        .gen-btn-ghost {
          background: none;
          border: none;
          font-family: 'DM Sans', sans-serif;
          font-size: 13px;
          font-weight: 500;
          color: #8C8C8C;
          cursor: pointer;
          transition: color 0.15s;
          padding: 0;
        }
        .gen-btn-ghost:hover { color: #0A0A0A; }

        .gen-btn-outline {
          background: transparent;
          border: 1px solid #E8E8E8;
          border-radius: 7px;
          padding: 7px 14px;
          font-family: 'DM Sans', sans-serif;
          font-size: 13px;
          font-weight: 500;
          color: #5C5C5C;
          cursor: pointer;
          transition: all 0.15s;
        }
        .gen-btn-outline:hover { border-color: #0A0A0A; color: #0A0A0A; }

        /* ── BODY LAYOUT ── */
        .gen-body {
          display: flex;
          flex: 1;
          min-height: 0;
        }

        /* ── LEFT RAIL ── */
        .gen-rail {
          width: 280px;
          flex-shrink: 0;
          border-right: 1px solid #E8E8E8;
          background: #FAFAFA;
          padding: 28px 24px;
          display: flex;
          flex-direction: column;
          gap: 32px;
          overflow-y: auto;
        }

        .gen-rail-label {
          font-size: 10px;
          font-weight: 700;
          color: #BCBCBC;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          margin: 0;
        }

        /* Agent steps */
        .gen-agents {
          display: flex;
          flex-direction: column;
          gap: 0;
        }

        .gen-agent-row {
          display: flex;
          align-items: flex-start;
          gap: 14px;
          padding-bottom: 24px;
          position: relative;
        }

        .gen-agent-connector {
          position: absolute;
          left: 15px;
          top: 38px;
          width: 1px;
          height: calc(100% - 14px);
          background: #E8E8E8;
          transition: background 0.4s;
        }
        .gen-agent-connector.done { background: #0E7C4A; }

        .gen-agent-badge {
          width: 32px; height: 32px;
          border-radius: 8px;
          border: 1.5px solid #E8E8E8;
          background: #FFFFFF;
          display: flex; align-items: center; justify-content: center;
          font-family: 'JetBrains Mono', monospace;
          font-size: 11px;
          font-weight: 500;
          color: #BCBCBC;
          flex-shrink: 0;
          transition: all 0.3s;
          position: relative;
          z-index: 1;
        }

        .gen-agent-badge.running {
          border-color: #C9A227;
          background: #FFF9EB;
          color: #C9A227;
        }

        .gen-agent-badge.done {
          border-color: #0E7C4A;
          background: #F0FDF4;
          color: #0E7C4A;
          font-size: 13px;
        }

        .gen-agent-badge.error {
          border-color: #DC2626;
          background: #FEF2F2;
          color: #DC2626;
        }

        .gen-agent-pulse {
          width: 8px; height: 8px;
          border-radius: 50%;
          background: #C9A227;
          animation: pulse-ring 1.2s ease-in-out infinite;
        }

        .gen-agent-meta { flex: 1; padding-top: 5px; }

        .gen-agent-name {
          font-size: 13px;
          font-weight: 600;
          color: #0A0A0A;
          margin-bottom: 2px;
          transition: color 0.3s;
        }

        .gen-agent-name.running { color: #C9A227; }
        .gen-agent-name.done    { color: #0E7C4A; }

        .gen-agent-desc {
          font-size: 11px;
          color: #BCBCBC;
          line-height: 1.5;
        }

        /* Terminal */
        .gen-terminal {
          border: 1px solid #E8E8E8;
          border-radius: 10px;
          overflow: hidden;
          background: #FAFAFA;
          flex: 1;
        }

        .gen-term-header {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 14px;
          border-bottom: 1px solid #E8E8E8;
          background: #FFFFFF;
        }

        .gen-term-dot {
          width: 8px; height: 8px;
          border-radius: 50%;
          background: #E8E8E8;
          flex-shrink: 0;
        }
        .gen-term-dot.active { background: #C9A227; animation: pulse-ring 1.5s ease infinite; }

        .gen-term-label {
          font-family: 'JetBrains Mono', monospace;
          font-size: 10px;
          color: #BCBCBC;
          flex: 1;
        }

        .gen-term-timer {
          font-family: 'JetBrains Mono', monospace;
          font-size: 11px;
          color: #C9A227;
          font-weight: 500;
        }

        .gen-term-body {
          padding: 12px;
          min-height: 120px;
          max-height: 200px;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          gap: 3px;
        }
        .gen-term-body::-webkit-scrollbar { width: 3px; }
        .gen-term-body::-webkit-scrollbar-thumb { background: #E8E8E8; }

        .gen-term-empty {
          font-family: 'JetBrains Mono', monospace;
          font-size: 11px;
          color: #BCBCBC;
          padding: 4px 0;
        }

        .gen-log-line {
          display: flex;
          gap: 10px;
          font-family: 'JetBrains Mono', monospace;
          font-size: 10px;
          line-height: 1.6;
        }

        .gen-log-ts { color: #BCBCBC; flex-shrink: 0; }
        .gen-log-info    { color: #5C5C5C; }
        .gen-log-success { color: #0E7C4A; }
        .gen-log-error   { color: #DC2626; }
        .gen-log-agent   { color: #2563EB; }
        .gen-log-system  { color: #8C8C8C; }

        /* ── MAIN FORM ── */
        .gen-main {
          flex: 1;
          overflow-y: auto;
          display: flex;
          justify-content: center;
          padding: 56px 40px 100px;
        }

        .gen-main-inner {
          width: 100%;
          max-width: 540px;
        }

        .gen-form-header {
          margin-bottom: 40px;
        }

        .gen-form-eyebrow {
          font-family: 'JetBrains Mono', monospace;
          font-size: 10px;
          color: #8C8C8C;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          margin-bottom: 10px;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .gen-form-eyebrow::before {
          content: '';
          width: 20px;
          height: 1px;
          background: #C9A227;
        }

        .gen-form-h1 {
          font-family: 'Playfair Display', serif;
          font-size: 30px;
          font-weight: 800;
          color: #0A0A0A;
          letter-spacing: -0.03em;
          line-height: 1.2;
          margin-bottom: 10px;
        }

        .gen-form-sub {
          font-size: 14px;
          color: #8C8C8C;
          line-height: 1.65;
          font-weight: 400;
        }

        /* Form elements */
        .gen-form { display: flex; flex-direction: column; gap: 22px; }

        .gen-field { display: flex; flex-direction: column; gap: 7px; }

        .gen-label {
          font-size: 11px;
          font-weight: 700;
          color: #0A0A0A;
          text-transform: uppercase;
          letter-spacing: 0.06em;
        }

        .gen-label-required { color: #C9A227; }

        .gen-hint {
          font-size: 12px;
          color: #BCBCBC;
          line-height: 1.5;
          margin-top: -2px;
        }

        .gen-input {
          padding: 13px 16px;
          background: #FFFFFF;
          border: 1.5px solid #E8E8E8;
          border-radius: 10px;
          font-family: 'DM Sans', sans-serif;
          font-size: 14px;
          color: #0A0A0A;
          outline: none;
          transition: border-color 0.2s, box-shadow 0.2s;
          width: 100%;
        }
        .gen-input::placeholder { color: #BCBCBC; }
        .gen-input:focus {
          border-color: #0A0A0A;
          box-shadow: 0 0 0 3px rgba(10,10,10,0.05);
        }

        .gen-grid2 {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 14px;
        }

        .gen-select {
          padding: 13px 40px 13px 16px;
          background: #FFFFFF;
          border: 1.5px solid #E8E8E8;
          border-radius: 10px;
          font-family: 'DM Sans', sans-serif;
          font-size: 14px;
          color: #0A0A0A;
          outline: none;
          cursor: pointer;
          width: 100%;
          appearance: none;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%238C8C8C' strokeWidth='1.5' fill='none' strokeLinecap='round'/%3E%3C/svg%3E");
          background-repeat: no-repeat;
          background-position: right 14px center;
          transition: border-color 0.2s;
        }
        .gen-select:focus { border-color: #0A0A0A; outline: none; }

        /* Error */
        .gen-error {
          background: #FEF2F2;
          border: 1px solid #FCA5A5;
          border-radius: 8px;
          padding: 12px 16px;
          font-size: 13px;
          color: #DC2626;
          display: flex;
          gap: 8px;
          align-items: flex-start;
          line-height: 1.5;
        }

        /* Limit warning */
        .gen-limit-warn {
          background: #FFF7ED;
          border: 1px solid #FED7AA;
          border-radius: 8px;
          padding: 12px 16px;
          font-size: 13px;
          color: #C2410C;
          display: flex;
          gap: 8px;
          align-items: center;
        }

        /* Submit */
        .gen-submit {
          background: #0A0A0A;
          border: none;
          border-radius: 10px;
          padding: 16px 24px;
          font-family: 'DM Sans', sans-serif;
          font-size: 15px;
          font-weight: 700;
          color: #FFFFFF;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          width: 100%;
          transition: all 0.2s;
          letter-spacing: -0.01em;
          margin-top: 4px;
        }
        .gen-submit:hover:not(:disabled) {
          background: #1a1a1a;
          transform: translateY(-1px);
          box-shadow: 0 8px 24px rgba(10,10,10,0.2);
        }
        .gen-submit:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .gen-usage-note {
          text-align: center;
          font-size: 12px;
          color: #BCBCBC;
          margin-top: 4px;
        }

        /* Section divider */
        .gen-divider {
          display: flex;
          align-items: center;
          gap: 14px;
        }
        .gen-divider-line { flex:1; height:1px; background:#F0F0F0; }
        .gen-divider-text {
          font-size: 11px;
          color: #BCBCBC;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          font-weight: 600;
        }

        /* Responsive */
        @media (max-width: 768px) {
          .gen-rail { display: none; }
          .gen-main { padding: 40px 24px 80px; }
        }
      `}</style>

      <div className="gen-root">

        {/* ── Topbar ── */}
        <header className="gen-topbar">
          <div className="gen-topbar-left">
            <div className="gen-logo-box">
              <svg width="14" height="14" viewBox="0 0 20 20" fill="none">
                <polygon points="10,2 17,6 17,14 10,18 3,14 3,6" stroke="#FFFFFF" strokeWidth="1.4" fill="none"/>
                <polygon points="10,6 14,8.5 14,13.5 10,16 6,13.5 6,8.5" fill="#FFFFFF" fillOpacity="0.3"/>
              </svg>
            </div>
            <span className="gen-brand">Studio AI</span>
            <span className="gen-sep">/</span>
            <span className="gen-crumb">Generate</span>
          </div>

          <div className="gen-topbar-right">
            <span className="gen-plan-chip">{planLabel}</span>
            {streak > 0 && (
              <div className="gen-streak-badge">
                🔥 {streak}-day streak
              </div>
            )}
            <button className="gen-btn-ghost" onClick={() => router.push('/dashboard')}>Dashboard</button>
            <button className="gen-btn-outline" onClick={async () => { await supabase.auth.signOut(); router.push('/login'); }}>
              Sign out
            </button>
          </div>
        </header>

        <div className="gen-body">

          {/* ── Left Rail ── */}
          <aside className="gen-rail">
            <p className="gen-rail-label">Pipeline Status</p>

            <div className="gen-agents">
              {AGENTS.map((a, i) => {
                const st = agentStatus[a.id] || 'idle';
                return (
                  <div className="gen-agent-row" key={a.id}>
                    {i < 2 && (
                      <div className={`gen-agent-connector ${st === 'done' ? 'done' : ''}`} />
                    )}
                    <div className={`gen-agent-badge ${st}`}>
                      {st === 'running' ? <div className="gen-agent-pulse" />
                        : st === 'done' ? '✓'
                        : st === 'error' ? '✕'
                        : a.num}
                    </div>
                    <div className="gen-agent-meta">
                      <div className={`gen-agent-name ${st}`}>{a.label}</div>
                      <div className="gen-agent-desc">{a.desc}</div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="gen-divider">
              <div className="gen-divider-line" />
              <span className="gen-divider-text">Log</span>
              <div className="gen-divider-line" />
            </div>

            <div className="gen-terminal">
              <div className="gen-term-header">
                <div className={`gen-term-dot ${running ? 'active' : ''}`} />
                <span className="gen-term-label">stdout</span>
                {running && <span className="gen-term-timer">{(elapsed/1000).toFixed(1)}s</span>}
              </div>
              <div className="gen-term-body" ref={logsRef}>
                {logs.length === 0
                  ? <span className="gen-term-empty">Waiting for pipeline...</span>
                  : logs.map((l, i) => (
                    <div className="gen-log-line" key={i}>
                      <span className="gen-log-ts">{l.t}</span>
                      <span className={`gen-log-${l.type || 'info'}`}>{l.msg}</span>
                    </div>
                  ))
                }
              </div>
            </div>
          </aside>

          {/* ── Main Form ── */}
          <main className="gen-main">
            <div className="gen-main-inner">

              <div className="gen-form-header">
                <div className="gen-form-eyebrow">Content Generation</div>
                <h1 className="gen-form-h1">Generate your content pack</h1>
                <p className="gen-form-sub">
                  Three AI agents — Research, Creator, Publisher — run in sequence to produce a complete, production-ready content pack in under 90 seconds.
                </p>
              </div>

              <form className="gen-form" onSubmit={handleGenerate}>

                {/* Niche */}
                <div className="gen-field">
                  <label className="gen-label">
                    Niche <span className="gen-label-required">*</span>
                  </label>
                  <input
                    className="gen-input"
                    type="text"
                    placeholder="e.g. personal finance for Indian millennials, AI tools for SaaS founders..."
                    value={niche}
                    onChange={e => setNiche(e.target.value)}
                    disabled={running}
                    required
                    minLength={2}
                  />
                  <span className="gen-hint">Specific beats generic. The more precise the niche, the stronger the output.</span>
                </div>

                {/* Platform + Creator Type */}
                <div className="gen-grid2">
                  <div className="gen-field">
                    <label className="gen-label">Platform</label>
                    <select className="gen-select" value={platform} onChange={e => setPlatform(e.target.value)} disabled={running}>
                      {PLATFORMS.map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                  </div>
                  <div className="gen-field">
                    <label className="gen-label">Creator Type</label>
                    <select className="gen-select" value={creatorType} onChange={e => setCreatorType(e.target.value)} disabled={running}>
                      {CREATOR_TYPES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                    </select>
                  </div>
                </div>

                {/* Language + Tone */}
                <div className="gen-grid2">
                  <div className="gen-field">
                    <label className="gen-label">Script Language</label>
                    <select className="gen-select" value={language} onChange={e => setLanguage(e.target.value)} disabled={running}>
                      {LANGUAGES.map(l => <option key={l} value={l}>{l}</option>)}
                    </select>
                  </div>
                  <div className="gen-field">
                    <label className="gen-label">Tone</label>
                    <select className="gen-select" value={tone} onChange={e => setTone(e.target.value)} disabled={running}>
                      {TONES.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                </div>

                {/* Errors */}
                {error && (
                  <div className="gen-error">
                    ⚠ {error}
                  </div>
                )}

                {usage?.plan === 'free' && (usage?.remaining ?? 1) === 0 && !error && (
                  <div className="gen-limit-warn">
                    ⚠ Monthly limit reached.{' '}
                    <a href="/dashboard" style={{ color:'#C9A227', textDecoration:'underline', textUnderlineOffset:'2px', fontWeight:'600' }}>
                      Upgrade your plan
                    </a>
                    {' '}to continue.
                  </div>
                )}

                <button
                  type="submit"
                  className="gen-submit"
                  disabled={running || (!usage?.allowed && usage !== null)}
                >
                  {running
                    ? <><Spinner size={15} light />Pipeline running…</>
                    : <>Run All 3 Agents →</>
                  }
                </button>

                {usage?.plan === 'free' && (
                  <p className="gen-usage-note">
                    {usage.remaining ?? 0} of {usage.limit} free generations remaining this month
                  </p>
                )}
              </form>
            </div>
          </main>

        </div>
      </div>
    </>
  );
}

function Spinner({ size = 20, light = false }) {
  return (
    <span style={{
      width:`${size}px`, height:`${size}px`,
      borderRadius:'50%',
      border:`2px solid ${light ? 'rgba(255,255,255,0.25)' : '#E8E8E8'}`,
      borderTopColor: light ? '#FFFFFF' : '#0A0A0A',
      display:'inline-block',
      animation:'spin 0.7s linear infinite',
      flexShrink:0,
    }} />
  );
}