'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getSupabaseBrowser } from '@/packages/supabase-browser';

const THINKING_LINES = [
  { icon: '🔍', text: 'Scanning 2.4M trending topics...', color: '#10B981' },
  { icon: '🧠', text: 'Identifying curiosity gap hooks...', color: '#3B82F6' },
  { icon: '✍️', text: 'Writing word-for-word script...', color: '#8B5CF6' },
  { icon: '🎬', text: 'Building scene breakdown...', color: '#F59E0B' },
  { icon: '🚀', text: 'Optimising YouTube SEO...', color: '#EF4444' },
  { icon: '📅', text: 'Creating 7-day content plan...', color: '#10B981' },
  { icon: '✅', text: 'Content pack ready in 87 seconds', color: '#000' },
];

export default function LoginPage() {
  const router = useRouter();
  const supabase = getSupabaseBrowser();

  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [visibleLines, setVisibleLines] = useState([]);
  const [thinkingDone, setThinkingDone] = useState(false);
  const [inputFocus, setInputFocus] = useState('');

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) router.replace('/generate');
    });
  }, []);

  // Thinking animation loop
  useEffect(() => {
    let timeout;
    let lineIndex = 0;
    setVisibleLines([]);
    setThinkingDone(false);

    const addLine = () => {
      if (lineIndex < THINKING_LINES.length) {
        setVisibleLines(prev => [...prev, THINKING_LINES[lineIndex]]);
        lineIndex++;
        const delay = lineIndex === THINKING_LINES.length ? 2500 : 900;
        timeout = setTimeout(addLine, delay);
      } else {
        setThinkingDone(true);
        timeout = setTimeout(() => {
          lineIndex = 0;
          setVisibleLines([]);
          setThinkingDone(false);
          timeout = setTimeout(addLine, 600);
        }, 3500);
      }
    };

    timeout = setTimeout(addLine, 800);
    return () => clearTimeout(timeout);
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(''); setSuccess(''); setLoading(true);
    try {
      if (mode === 'signup') {
        const { error: signUpError } = await supabase.auth.signUp({
          email, password,
          options: { data: { full_name: name } },
        });
        if (signUpError) throw signUpError;
        setSuccess('Account created! Check your email to confirm, then log in.');
        setMode('login');
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
        if (signInError) throw signInError;
        router.replace('/generate');
      }
    } catch (err) {
      setError(err.message || 'Something went wrong. Try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=DM+Sans:wght@300;400;500;600&family=JetBrains+Mono:wght@400;500&display=swap');

        * { box-sizing: border-box; margin: 0; padding: 0; }

        .login-root {
          min-height: 100vh;
          background: #FAFAFA;
          display: grid;
          grid-template-columns: 1fr 1fr;
          font-family: 'DM Sans', sans-serif;
        }

        /* ── LEFT PANEL ── */
        .login-left {
          background: #0A0A0A;
          display: flex;
          flex-direction: column;
          padding: 48px;
          position: relative;
          overflow: hidden;
        }

        .login-left::before {
          content: '';
          position: absolute;
          inset: 0;
          background:
            radial-gradient(ellipse 600px 400px at 20% 30%, rgba(255,255,255,0.03) 0%, transparent 70%),
            radial-gradient(ellipse 400px 300px at 80% 80%, rgba(255,255,255,0.02) 0%, transparent 70%);
          pointer-events: none;
        }

        /* Subtle grid */
        .login-left::after {
          content: '';
          position: absolute;
          inset: 0;
          background-image:
            linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px);
          background-size: 48px 48px;
          pointer-events: none;
        }

        .left-logo {
          display: flex;
          align-items: center;
          gap: 10px;
          position: relative;
          z-index: 1;
        }

        .logo-mark {
          width: 34px;
          height: 34px;
          background: #fff;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 16px;
          font-weight: 700;
          color: #000;
          font-family: 'Instrument Serif', serif;
          letter-spacing: -0.03em;
          flex-shrink: 0;
        }

        .logo-name {
          font-family: 'Instrument Serif', serif;
          font-size: 18px;
          color: #fff;
          letter-spacing: -0.02em;
        }

        .left-center {
          flex: 1;
          display: flex;
          flex-direction: column;
          justify-content: center;
          position: relative;
          z-index: 1;
          padding: 40px 0;
        }

        .left-headline {
          font-family: 'Instrument Serif', serif;
          font-size: clamp(36px, 3.5vw, 52px);
          font-weight: 400;
          color: #fff;
          line-height: 1.15;
          letter-spacing: -0.03em;
          margin-bottom: 16px;
        }

        .left-headline em {
          font-style: italic;
          color: rgba(255,255,255,0.5);
        }

        .left-sub {
          font-size: 15px;
          color: rgba(255,255,255,0.45);
          line-height: 1.7;
          max-width: 380px;
          margin-bottom: 48px;
        }

        /* Thinking terminal */
        .thinking-terminal {
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 12px;
          overflow: hidden;
          max-width: 420px;
        }

        .terminal-bar {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 12px 16px;
          border-bottom: 1px solid rgba(255,255,255,0.06);
          background: rgba(255,255,255,0.02);
        }

        .t-dot {
          width: 10px;
          height: 10px;
          border-radius: 50%;
        }

        .terminal-label {
          font-family: 'JetBrains Mono', monospace;
          font-size: 11px;
          color: rgba(255,255,255,0.3);
          margin-left: 4px;
          letter-spacing: 0.04em;
        }

        .terminal-live {
          margin-left: auto;
          display: flex;
          align-items: center;
          gap: 5px;
          font-family: 'JetBrains Mono', monospace;
          font-size: 10px;
          color: #10B981;
          font-weight: 500;
        }

        .live-dot {
          width: 5px;
          height: 5px;
          border-radius: 50%;
          background: #10B981;
          animation: live-pulse 1.5s ease infinite;
        }

        @keyframes live-pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.4; transform: scale(0.7); }
        }

        .terminal-body {
          padding: 16px;
          min-height: 200px;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .thinking-line {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          animation: line-in 0.4s cubic-bezier(0.16, 1, 0.3, 1) both;
        }

        @keyframes line-in {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        .t-icon {
          font-size: 14px;
          flex-shrink: 0;
          margin-top: 1px;
        }

        .t-text {
          font-family: 'JetBrains Mono', monospace;
          font-size: 12px;
          color: rgba(255,255,255,0.65);
          line-height: 1.5;
        }

        .t-text.done-line {
          color: #10B981;
          font-weight: 500;
        }

        .t-check {
          margin-left: auto;
          font-size: 11px;
          flex-shrink: 0;
        }

        .t-cursor {
          display: inline-block;
          width: 8px;
          height: 14px;
          background: rgba(255,255,255,0.4);
          animation: cursor-blink 1s step-end infinite;
          vertical-align: middle;
          margin-left: 3px;
          border-radius: 1px;
        }

        @keyframes cursor-blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }

        /* Progress bar at bottom */
        .terminal-progress {
          height: 2px;
          background: rgba(255,255,255,0.06);
          position: relative;
          overflow: hidden;
        }

        .terminal-progress-fill {
          position: absolute;
          top: 0; left: 0; bottom: 0;
          background: linear-gradient(90deg, #10B981, #3B82F6);
          transition: width 0.8s ease;
          border-radius: 1px;
        }

        /* Left bottom stats */
        .left-stats {
          display: flex;
          gap: 32px;
          position: relative;
          z-index: 1;
        }

        .left-stat-num {
          font-family: 'Instrument Serif', serif;
          font-size: 24px;
          color: #fff;
          letter-spacing: -0.03em;
          display: block;
        }

        .left-stat-lbl {
          font-size: 12px;
          color: rgba(255,255,255,0.3);
          display: block;
          margin-top: 2px;
        }

        /* ── RIGHT PANEL ── */
        .login-right {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 48px;
          background: #FAFAFA;
        }

        .login-card {
          width: 100%;
          max-width: 400px;
        }

        .card-headline {
          font-family: 'Instrument Serif', serif;
          font-size: 32px;
          font-weight: 400;
          color: #0A0A0A;
          letter-spacing: -0.03em;
          margin-bottom: 8px;
          line-height: 1.2;
        }

        .card-sub {
          font-size: 14px;
          color: #6B7280;
          margin-bottom: 36px;
          line-height: 1.6;
        }

        /* Mode switcher */
        .mode-switch {
          display: flex;
          background: #F3F4F6;
          border-radius: 10px;
          padding: 4px;
          margin-bottom: 28px;
          gap: 2px;
        }

        .mode-btn {
          flex: 1;
          padding: 9px;
          border: none;
          border-radius: 8px;
          font-family: 'DM Sans', sans-serif;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
          background: transparent;
          color: #6B7280;
        }

        .mode-btn.active {
          background: #fff;
          color: #0A0A0A;
          font-weight: 600;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1), 0 1px 2px rgba(0,0,0,0.06);
        }

        /* Form fields */
        .field-group {
          display: flex;
          flex-direction: column;
          gap: 14px;
          margin-bottom: 20px;
        }

        .field-wrap {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .field-label {
          font-size: 13px;
          font-weight: 500;
          color: #374151;
          letter-spacing: -0.01em;
        }

        .field-input {
          width: 100%;
          padding: 12px 14px;
          background: #fff;
          border: 1.5px solid #E5E7EB;
          border-radius: 10px;
          font-family: 'DM Sans', sans-serif;
          font-size: 15px;
          color: #0A0A0A;
          outline: none;
          transition: all 0.2s ease;
          -webkit-appearance: none;
        }

        .field-input:focus {
          border-color: #0A0A0A;
          box-shadow: 0 0 0 3px rgba(10,10,10,0.06);
        }

        .field-input::placeholder { color: #9CA3AF; }

        /* Alert messages */
        .alert-error {
          background: #FEF2F2;
          border: 1px solid #FECACA;
          border-radius: 8px;
          padding: 11px 14px;
          color: #DC2626;
          font-size: 13px;
          margin-bottom: 16px;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .alert-success {
          background: #F0FDF4;
          border: 1px solid #BBF7D0;
          border-radius: 8px;
          padding: 11px 14px;
          color: #16A34A;
          font-size: 13px;
          margin-bottom: 16px;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        /* Submit button */
        .submit-btn {
          width: 100%;
          padding: 14px;
          background: #0A0A0A;
          border: none;
          border-radius: 10px;
          color: #fff;
          font-family: 'DM Sans', sans-serif;
          font-size: 15px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          letter-spacing: -0.01em;
          position: relative;
          overflow: hidden;
        }

        .submit-btn::after {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, rgba(255,255,255,0.08) 0%, transparent 60%);
          pointer-events: none;
        }

        .submit-btn:hover:not(:disabled) {
          background: #1a1a1a;
          transform: translateY(-1px);
          box-shadow: 0 8px 24px rgba(0,0,0,0.2);
        }

        .submit-btn:active:not(:disabled) {
          transform: translateY(0);
        }

        .submit-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .btn-spinner {
          width: 16px;
          height: 16px;
          border-radius: 50%;
          border: 2px solid rgba(255,255,255,0.3);
          border-top-color: #fff;
          animation: spin 0.7s linear infinite;
        }

        @keyframes spin { to { transform: rotate(360deg); } }

        /* Footer note */
        .form-footer {
          text-align: center;
          margin-top: 20px;
          font-size: 13px;
          color: #9CA3AF;
          line-height: 1.6;
        }

        .form-footer a {
          color: #0A0A0A;
          text-decoration: none;
          font-weight: 500;
          border-bottom: 1px solid #E5E7EB;
        }

        /* Social proof */
        .social-proof {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-top: 28px;
          padding-top: 24px;
          border-top: 1px solid #F3F4F6;
        }

        .avatar-stack {
          display: flex;
        }

        .avatar {
          width: 28px;
          height: 28px;
          border-radius: 50%;
          border: 2px solid #FAFAFA;
          background: #E5E7EB;
          margin-left: -8px;
          font-size: 11px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 600;
          color: #374151;
          overflow: hidden;
        }

        .avatar:first-child { margin-left: 0; }

        .proof-text {
          font-size: 13px;
          color: #6B7280;
          line-height: 1.4;
        }

        .proof-text strong { color: #0A0A0A; font-weight: 600; }

        /* Responsive */
        @media (max-width: 768px) {
          .login-root { grid-template-columns: 1fr; }
          .login-left { display: none; }
          .login-right { padding: 32px 24px; }
        }
      `}</style>

      <div className="login-root">
        {/* ── LEFT — Animated thinking panel ── */}
        <div className="login-left">
          <div className="left-logo">
            <div className="logo-mark">S</div>
            <span className="logo-name">Studio AI</span>
          </div>

          <div className="left-center">
            <h1 className="left-headline">
              Your content.<br />
              <em>Researched. Written.</em><br />
              Published.
            </h1>
            <p className="left-sub">
              13 AI agents chain together in 90 seconds to produce a complete content pack — script, scenes, SEO, and a 7-day plan.
            </p>

            {/* Thinking terminal */}
            <div className="thinking-terminal">
              <div className="terminal-bar">
                <div className="t-dot" style={{ background: '#FF5F57' }} />
                <div className="t-dot" style={{ background: '#FFBD2E' }} />
                <div className="t-dot" style={{ background: '#28CA41' }} />
                <span className="terminal-label">studio-ai / agent-pipeline</span>
                <span className="terminal-live">
                  <span className="live-dot" />
                  LIVE
                </span>
              </div>

              <div className="terminal-body">
                {visibleLines.map((line, i) => {
                  if (!line) return null;
                  const isLast = i === visibleLines.length - 1;
                  const isComplete = line.text.includes('ready');
                  return (
                    <div key={i} className="thinking-line">
                      <span className="t-icon">{line.icon}</span>
                      <span className={`t-text ${isComplete ? 'done-line' : ''}`}>
                        {line.text}
                        {isLast && !thinkingDone && <span className="t-cursor" />}
                      </span>
                      {!isLast && <span className="t-check">✓</span>}
                    </div>
                  );
                })}
                {visibleLines.length === 0 && (
                  <div className="thinking-line">
                    <span className="t-icon">⏳</span>
                    <span className="t-text">
                      Initialising pipeline<span className="t-cursor" />
                    </span>
                  </div>
                )}
              </div>

              <div className="terminal-progress">
                <div
                  className="terminal-progress-fill"
                  style={{ width: `${(visibleLines.length / THINKING_LINES.length) * 100}%` }}
                />
              </div>
            </div>
          </div>

          <div className="left-stats">
            {[
              { num: '2,300+', lbl: 'Creators' },
              { num: '87s', lbl: 'Avg time' },
              { num: '13', lbl: 'AI agents' },
            ].map(s => (
              <div key={s.lbl}>
                <span className="left-stat-num">{s.num}</span>
                <span className="left-stat-lbl">{s.lbl}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── RIGHT — Auth form ── */}
        <div className="login-right">
          <div className="login-card">
            <h2 className="card-headline">
              {mode === 'login' ? 'Welcome back' : 'Start creating'}
            </h2>
            <p className="card-sub">
              {mode === 'login'
                ? 'Log in to access your AI content pipeline.'
                : 'Free plan — 3 generations/month. No card required.'}
            </p>

            {/* Mode toggle */}
            <div className="mode-switch">
              <button className={`mode-btn ${mode === 'login' ? 'active' : ''}`} onClick={() => { setMode('login'); setError(''); }}>
                Log In
              </button>
              <button className={`mode-btn ${mode === 'signup' ? 'active' : ''}`} onClick={() => { setMode('signup'); setError(''); }}>
                Sign Up
              </button>
            </div>

            {/* Alerts */}
            {error && (
              <div className="alert-error">
                <span>⚠</span> {error}
              </div>
            )}
            {success && (
              <div className="alert-success">
                <span>✓</span> {success}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="field-group">
                {mode === 'signup' && (
                  <div className="field-wrap">
                    <label className="field-label">Full Name</label>
                    <input
                      className="field-input"
                      type="text"
                      placeholder="Your name"
                      value={name}
                      onChange={e => setName(e.target.value)}
                      required
                      disabled={loading}
                    />
                  </div>
                )}
                <div className="field-wrap">
                  <label className="field-label">Email</label>
                  <input
                    className="field-input"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                    disabled={loading}
                  />
                </div>
                <div className="field-wrap">
                  <label className="field-label">Password</label>
                  <input
                    className="field-input"
                    type="password"
                    placeholder={mode === 'signup' ? 'Min. 6 characters' : '••••••••'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                    minLength={6}
                    disabled={loading}
                  />
                </div>
              </div>

              <button type="submit" className="submit-btn" disabled={loading}>
                {loading
                  ? <span className="btn-spinner" />
                  : mode === 'login' ? 'Log In →' : 'Create Account →'
                }
              </button>
            </form>

            {/* Social proof */}
            <div className="social-proof">
              <div className="avatar-stack">
                {['A', 'R', 'S', 'P', 'K'].map((l, i) => (
                  <div key={i} className="avatar" style={{
                    background: ['#E5E7EB','#D1FAE5','#DBEAFE','#FEF3C7','#FCE7F3'][i],
                    color: ['#374151','#065F46','#1E40AF','#92400E','#831843'][i],
                  }}>
                    {l}
                  </div>
                ))}
              </div>
              <p className="proof-text">
                <strong>2,300+ creators</strong> use Studio AI weekly
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}