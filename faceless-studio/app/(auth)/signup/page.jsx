'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getSupabaseBrowser } from '@/lib/supabase-browser';

// ─── CORPORATE PREMIUM WHITE/BLACK THEME ─────────────────────────────────────
// Typography: Playfair Display (serif display) + DM Sans (body) + JetBrains Mono
// Colors: Pure White #FFFFFF, Carbon Black #0A0A0A, Platinum #F5F5F5,
//         Steel #8C8C8C, Gold accent #C9A227, Signal Green #0E7C4A

export default function SignupPage() {
  const router   = useRouter();
  const supabase = getSupabaseBrowser();

  const [mode,     setMode]     = useState('signup');
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [name,     setName]     = useState('');
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState('');
  const [success,  setSuccess]  = useState('');
  const [showPass, setShowPass] = useState(false);
  const [mounted,  setMounted]  = useState(false);

  useEffect(() => {
    setMounted(true);
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) router.replace('/generate');
    });
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(''); setSuccess(''); setLoading(true);
    try {
      if (mode === 'signup') {
        const { error: err } = await supabase.auth.signUp({
          email, password,
          options: { data: { full_name: name } },
        });
        if (err) throw err;
        setSuccess('Account created — check your email to confirm, then sign in.');
        setMode('login');
      } else {
        const { error: err } = await supabase.auth.signInWithPassword({ email, password });
        if (err) throw err;
        router.replace('/generate');
      }
    } catch (err) {
      setError(err.message || 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  }

  const STEPS = ['Research', 'Script', 'Distribute'];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700;800&family=DM+Sans:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        .auth-root {
          min-height: 100vh;
          display: grid;
          grid-template-columns: 1fr 1fr;
          background: #FFFFFF;
          font-family: 'DM Sans', sans-serif;
        }

        /* ── LEFT PANEL ── */
        .auth-left {
          background: #0A0A0A;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          padding: 48px 56px;
          position: relative;
          overflow: hidden;
        }

        .auth-left::before {
          content: '';
          position: absolute;
          top: -120px; right: -120px;
          width: 400px; height: 400px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(201,162,39,0.12) 0%, transparent 70%);
          pointer-events: none;
        }

        .auth-left::after {
          content: '';
          position: absolute;
          bottom: -80px; left: -80px;
          width: 300px; height: 300px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(201,162,39,0.06) 0%, transparent 70%);
          pointer-events: none;
        }

        .auth-logo {
          display: flex;
          align-items: center;
          gap: 12px;
          position: relative;
          z-index: 1;
        }

        .auth-logo-mark {
          width: 38px; height: 38px;
          border: 1.5px solid rgba(201,162,39,0.6);
          border-radius: 8px;
          display: flex; align-items: center; justify-content: center;
          background: rgba(201,162,39,0.08);
        }

        .auth-logo-hex {
          width: 18px; height: 18px;
        }

        .auth-logo-name {
          font-family: 'Playfair Display', serif;
          font-size: 18px;
          font-weight: 700;
          color: #FFFFFF;
          letter-spacing: -0.01em;
        }

        .auth-left-body {
          position: relative;
          z-index: 1;
        }

        .auth-tagline-eyebrow {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: rgba(201,162,39,0.1);
          border: 1px solid rgba(201,162,39,0.2);
          border-radius: 100px;
          padding: 5px 14px;
          margin-bottom: 32px;
        }

        .auth-tagline-dot {
          width: 6px; height: 6px;
          border-radius: 50%;
          background: #C9A227;
          animation: blink-dot 2s ease-in-out infinite;
        }

        @keyframes blink-dot {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }

        .auth-tagline-text {
          font-size: 11px;
          font-weight: 600;
          color: #C9A227;
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }

        .auth-headline {
          font-family: 'Playfair Display', serif;
          font-size: clamp(32px, 3.5vw, 44px);
          font-weight: 800;
          color: #FFFFFF;
          line-height: 1.15;
          letter-spacing: -0.03em;
          margin-bottom: 20px;
        }

        .auth-headline em {
          font-style: normal;
          color: #C9A227;
        }

        .auth-subheadline {
          font-size: 15px;
          color: rgba(255,255,255,0.5);
          line-height: 1.7;
          max-width: 360px;
          margin-bottom: 48px;
        }

        /* Pipeline visualization */
        .auth-pipeline {
          display: flex;
          flex-direction: column;
          gap: 0;
          margin-bottom: 48px;
        }

        .auth-pipeline-step {
          display: flex;
          align-items: flex-start;
          gap: 16px;
          padding: 16px 0;
          border-bottom: 1px solid rgba(255,255,255,0.05);
          opacity: ${mounted ? 1 : 0};
          transition: opacity 0.6s ease;
        }

        .auth-pipeline-step:last-child { border-bottom: none; }

        .auth-step-num {
          width: 28px; height: 28px;
          border-radius: 6px;
          background: rgba(201,162,39,0.12);
          border: 1px solid rgba(201,162,39,0.25);
          display: flex; align-items: center; justify-content: center;
          font-family: 'JetBrains Mono', monospace;
          font-size: 11px;
          font-weight: 500;
          color: #C9A227;
          flex-shrink: 0;
          margin-top: 2px;
        }

        .auth-step-content {}
        .auth-step-title {
          font-size: 13px;
          font-weight: 600;
          color: #FFFFFF;
          margin-bottom: 3px;
        }
        .auth-step-desc {
          font-size: 12px;
          color: rgba(255,255,255,0.4);
          line-height: 1.5;
        }

        /* Stats */
        .auth-stats {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1px;
          background: rgba(255,255,255,0.06);
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 12px;
          overflow: hidden;
        }

        .auth-stat {
          background: rgba(255,255,255,0.02);
          padding: 16px;
          text-align: center;
        }

        .auth-stat-value {
          font-family: 'Playfair Display', serif;
          font-size: 22px;
          font-weight: 700;
          color: #C9A227;
          display: block;
          margin-bottom: 3px;
        }

        .auth-stat-label {
          font-size: 10px;
          color: rgba(255,255,255,0.3);
          text-transform: uppercase;
          letter-spacing: 0.08em;
          font-weight: 500;
        }

        /* ── RIGHT PANEL ── */
        .auth-right {
          display: flex;
          flex-direction: column;
          justify-content: center;
          padding: 64px 72px;
          background: #FFFFFF;
        }

        .auth-form-header {
          margin-bottom: 40px;
        }

        .auth-form-back {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 12px;
          font-weight: 500;
          color: #8C8C8C;
          text-decoration: none;
          margin-bottom: 32px;
          cursor: pointer;
          transition: color 0.2s;
          border: none;
          background: none;
          padding: 0;
        }
        .auth-form-back:hover { color: #0A0A0A; }

        .auth-form-title {
          font-family: 'Playfair Display', serif;
          font-size: 32px;
          font-weight: 800;
          color: #0A0A0A;
          letter-spacing: -0.03em;
          margin-bottom: 8px;
          line-height: 1.2;
        }

        .auth-form-subtitle {
          font-size: 14px;
          color: #8C8C8C;
          line-height: 1.6;
        }

        /* Tab switcher */
        .auth-tabs {
          display: flex;
          background: #F5F5F5;
          border-radius: 10px;
          padding: 4px;
          margin-bottom: 32px;
          gap: 4px;
        }

        .auth-tab {
          flex: 1;
          padding: 10px;
          border-radius: 7px;
          border: none;
          background: transparent;
          font-family: 'DM Sans', sans-serif;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          color: #8C8C8C;
        }

        .auth-tab.active {
          background: #FFFFFF;
          color: #0A0A0A;
          box-shadow: 0 1px 4px rgba(0,0,0,0.08), 0 0 0 1px rgba(0,0,0,0.05);
        }

        /* Form */
        .auth-form {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .auth-field {
          display: flex;
          flex-direction: column;
          gap: 7px;
        }

        .auth-label {
          font-size: 12px;
          font-weight: 600;
          color: #0A0A0A;
          letter-spacing: 0.02em;
          text-transform: uppercase;
        }

        .auth-input-wrap {
          position: relative;
        }

        .auth-input {
          width: 100%;
          padding: 13px 16px;
          background: #FFFFFF;
          border: 1.5px solid #E8E8E8;
          border-radius: 10px;
          font-family: 'DM Sans', sans-serif;
          font-size: 14px;
          color: #0A0A0A;
          outline: none;
          transition: border-color 0.2s, box-shadow 0.2s;
          -webkit-appearance: none;
        }

        .auth-input::placeholder { color: #BCBCBC; }

        .auth-input:focus {
          border-color: #0A0A0A;
          box-shadow: 0 0 0 3px rgba(10,10,10,0.06);
        }

        .auth-input.has-toggle { padding-right: 48px; }

        .auth-pass-toggle {
          position: absolute;
          right: 14px;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          cursor: pointer;
          color: #8C8C8C;
          font-size: 14px;
          padding: 4px;
          transition: color 0.2s;
          display: flex; align-items: center;
        }
        .auth-pass-toggle:hover { color: #0A0A0A; }

        /* Messages */
        .auth-error {
          background: #FEF2F2;
          border: 1px solid #FCA5A5;
          border-radius: 8px;
          padding: 11px 14px;
          font-size: 13px;
          color: #DC2626;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .auth-success {
          background: #F0FDF4;
          border: 1px solid #86EFAC;
          border-radius: 8px;
          padding: 11px 14px;
          font-size: 13px;
          color: #15803D;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        /* Submit */
        .auth-submit {
          background: #0A0A0A;
          border: none;
          border-radius: 10px;
          padding: 15px 24px;
          color: #FFFFFF;
          font-family: 'DM Sans', sans-serif;
          font-size: 14px;
          font-weight: 700;
          letter-spacing: -0.01em;
          cursor: pointer;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          margin-top: 4px;
        }

        .auth-submit:hover:not(:disabled) {
          background: #1a1a1a;
          transform: translateY(-1px);
          box-shadow: 0 8px 24px rgba(10,10,10,0.2);
        }

        .auth-submit:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .auth-submit-spinner {
          width: 15px; height: 15px;
          border-radius: 50%;
          border: 2px solid rgba(255,255,255,0.3);
          border-top-color: #FFFFFF;
          animation: spin 0.7s linear infinite;
          flex-shrink: 0;
        }
        @keyframes spin { to { transform: rotate(360deg); } }

        .auth-divider {
          display: flex;
          align-items: center;
          gap: 16px;
          margin: 4px 0;
        }
        .auth-divider-line {
          flex: 1;
          height: 1px;
          background: #E8E8E8;
        }
        .auth-divider-text {
          font-size: 11px;
          color: #BCBCBC;
          font-weight: 500;
          text-transform: uppercase;
          letter-spacing: 0.06em;
        }

        .auth-footer-text {
          text-align: center;
          font-size: 12px;
          color: #8C8C8C;
          line-height: 1.6;
          margin-top: 8px;
        }

        .auth-link {
          color: #0A0A0A;
          font-weight: 600;
          text-decoration: underline;
          text-underline-offset: 2px;
          cursor: pointer;
          border: none;
          background: none;
          font-size: inherit;
          font-family: inherit;
        }

        /* Free badge */
        .auth-free-badge {
          display: flex;
          align-items: center;
          gap: 8px;
          background: #F5F5F5;
          border-radius: 8px;
          padding: 10px 14px;
          margin-top: 4px;
        }

        .auth-free-dot {
          width: 7px; height: 7px;
          border-radius: 50%;
          background: #0E7C4A;
          flex-shrink: 0;
        }

        .auth-free-text {
          font-size: 12px;
          color: #5C5C5C;
          line-height: 1.4;
        }

        .auth-free-text strong {
          color: #0A0A0A;
          font-weight: 600;
        }

        /* Responsive */
        @media (max-width: 900px) {
          .auth-root { grid-template-columns: 1fr; }
          .auth-left { display: none; }
          .auth-right { padding: 48px 32px; }
        }

        @media (max-width: 480px) {
          .auth-right { padding: 40px 24px; }
          .auth-form-title { font-size: 26px; }
        }
      `}</style>

      <div className="auth-root">

        {/* ── LEFT: Brand panel ── */}
        <div className="auth-left">
          <div className="auth-logo">
            <div className="auth-logo-mark">
              <svg className="auth-logo-hex" viewBox="0 0 20 20" fill="none">
                <polygon points="10,2 17,6 17,14 10,18 3,14 3,6" stroke="#C9A227" strokeWidth="1.4" fill="none"/>
                <polygon points="10,6 14,8.5 14,13.5 10,16 6,13.5 6,8.5" fill="#C9A227" fillOpacity="0.15"/>
              </svg>
            </div>
            <span className="auth-logo-name">Studio AI</span>
          </div>

          <div className="auth-left-body">
            <div className="auth-tagline-eyebrow">
              <span className="auth-tagline-dot" />
              <span className="auth-tagline-text">India's #1 Content OS</span>
            </div>

            <h2 className="auth-headline">
              Your next 7 videos.<br />
              <em>Written. Ready.</em><br />
              In 90 seconds.
            </h2>

            <p className="auth-subheadline">
              Three AI agents — Research, Script, Distribute — working in sequence to produce a complete content pack, every time.
            </p>

            <div className="auth-pipeline">
              {[
                { n:'01', title:'Research Agent', desc:'Scans trending topics, selects your best hook and angle' },
                { n:'02', title:'Creator Agent',  desc:'Writes a full script with scene-by-scene production direction' },
                { n:'03', title:'Publisher Agent',desc:'YouTube SEO, Instagram captions, 7-day posting plan' },
              ].map(step => (
                <div className="auth-pipeline-step" key={step.n}>
                  <div className="auth-step-num">{step.n}</div>
                  <div className="auth-step-content">
                    <div className="auth-step-title">{step.title}</div>
                    <div className="auth-step-desc">{step.desc}</div>
                  </div>
                </div>
              ))}
            </div>

            <div className="auth-stats">
              {[
                { v:'13',   l:'AI Agents'  },
                { v:'90s',  l:'Full Pack'  },
                { v:'₹0',   l:'To Start'   },
              ].map(s => (
                <div className="auth-stat" key={s.l}>
                  <span className="auth-stat-value">{s.v}</span>
                  <span className="auth-stat-label">{s.l}</span>
                </div>
              ))}
            </div>
          </div>

          <p style={{ fontSize:'11px', color:'rgba(255,255,255,0.18)', position:'relative', zIndex:1, fontFamily:"'JetBrains Mono', monospace" }}>
            studio-ai.in · Confidential
          </p>
        </div>

        {/* ── RIGHT: Auth form ── */}
        <div className="auth-right">
          <div style={{ maxWidth: '400px', width: '100%', margin: '0 auto' }}>

            <div className="auth-form-header">
              <button className="auth-form-back" onClick={() => router.push('/')}>
                ← Back to home
              </button>

              <h1 className="auth-form-title">
                {mode === 'signup' ? 'Create account' : 'Welcome back'}
              </h1>
              <p className="auth-form-subtitle">
                {mode === 'signup'
                  ? 'Free plan · 3 generations/month · No card required'
                  : 'Sign in to your Studio AI workspace'}
              </p>
            </div>

            {/* Tab switcher */}
            <div className="auth-tabs">
              <button
                className={`auth-tab ${mode === 'signup' ? 'active' : ''}`}
                onClick={() => { setMode('signup'); setError(''); setSuccess(''); }}
              >
                Sign Up
              </button>
              <button
                className={`auth-tab ${mode === 'login' ? 'active' : ''}`}
                onClick={() => { setMode('login'); setError(''); setSuccess(''); }}
              >
                Log In
              </button>
            </div>

            <form className="auth-form" onSubmit={handleSubmit}>
              {mode === 'signup' && (
                <div className="auth-field">
                  <label className="auth-label">Full Name</label>
                  <input
                    className="auth-input"
                    type="text"
                    placeholder="Arjun Sharma"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    required
                    disabled={loading}
                    autoComplete="name"
                  />
                </div>
              )}

              <div className="auth-field">
                <label className="auth-label">Email Address</label>
                <input
                  className="auth-input"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  disabled={loading}
                  autoComplete="email"
                />
              </div>

              <div className="auth-field">
                <label className="auth-label">Password</label>
                <div className="auth-input-wrap">
                  <input
                    className="auth-input has-toggle"
                    type={showPass ? 'text' : 'password'}
                    placeholder={mode === 'signup' ? 'Minimum 6 characters' : '••••••••'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                    minLength={6}
                    disabled={loading}
                    autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                  />
                  <button
                    type="button"
                    className="auth-pass-toggle"
                    onClick={() => setShowPass(!showPass)}
                    aria-label={showPass ? 'Hide password' : 'Show password'}
                  >
                    {showPass ? '👁' : '○'}
                  </button>
                </div>
              </div>

              {error   && <div className="auth-error">⚠ {error}</div>}
              {success && <div className="auth-success">✓ {success}</div>}

              <button
                type="submit"
                className="auth-submit"
                disabled={loading}
              >
                {loading
                  ? <><div className="auth-submit-spinner" />Please wait…</>
                  : mode === 'signup'
                    ? <>Create Free Account →</>
                    : <>Sign In →</>
                }
              </button>

              {mode === 'signup' && (
                <div className="auth-free-badge">
                  <div className="auth-free-dot" />
                  <p className="auth-free-text">
                    <strong>Free forever</strong> — 3 full content packs per month.
                    No credit card. Cancel anytime.
                  </p>
                </div>
              )}

              <div className="auth-divider">
                <div className="auth-divider-line" />
                <span className="auth-divider-text">or</span>
                <div className="auth-divider-line" />
              </div>

              <p className="auth-footer-text">
                {mode === 'signup'
                  ? <>Already have an account?{' '}
                      <button className="auth-link" onClick={() => { setMode('login'); setError(''); }}>
                        Sign in
                      </button></>
                  : <>New to Studio AI?{' '}
                      <button className="auth-link" onClick={() => { setMode('signup'); setError(''); }}>
                        Create free account
                      </button></>
                }
              </p>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}