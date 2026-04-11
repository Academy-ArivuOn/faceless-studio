'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getSupabaseBrowser } from '@/lib/supabase-browser';

export default function SignupPage() {
  const router   = useRouter();
  const supabase = getSupabaseBrowser();

  const [mode, setMode] = useState('signup');
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [name,     setName]     = useState('');
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState('');
  const [info,     setInfo]     = useState('');
  const [showPwd,  setShowPwd]  = useState(false);
  const [checking, setChecking] = useState(true);

  // Redirect already-logged-in users
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) router.replace('/generate');
      else setChecking(false);
    });
  }, []);

  if (checking) return (
    <div style={{ minHeight: '100vh', background: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: 24, height: 24, borderRadius: '50%', border: '2.5px solid #E8E8E8', borderTopColor: '#0A0A0A', animation: 'spin 0.7s linear infinite' }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  // Always reset error+info when switching tabs
  function switchMode(m) {
    setMode(m);
    setError('');
    setInfo('');
    // Don't clear email so user doesn't have to retype
    setPassword('');
    setShowPwd(false);
  }

  function clearAlerts() { setError(''); setInfo(''); }

  // ── LOGIN ──────────────────────────────────────────────────────────────────
  async function handleLogin(e) {
    e.preventDefault();
    clearAlerts();
    if (!email.trim())    { setError('Email is required.'); return; }
    if (!password.trim()) { setError('Password is required.'); return; }
    setLoading(true);

    const { data, error: authErr } = await supabase.auth.signInWithPassword({
      email:    email.trim().toLowerCase(),
      password: password,
    });

    if (authErr) {
      const msg = authErr.message.toLowerCase();
      if (msg.includes('invalid login credentials') || msg.includes('invalid email') || msg.includes('wrong password')) {
        setError('Incorrect email or password. Please try again.');
      } else if (msg.includes('email not confirmed')) {
        setError('Please confirm your email first. Check your inbox for the verification link.');
      } else if (msg.includes('too many requests')) {
        setError('Too many attempts. Please wait a few minutes and try again.');
      } else {
        setError(authErr.message || 'Login failed. Please try again.');
      }
      setLoading(false);
      return;
    }

    if (data?.session) {
      router.push('/generate');
    } else {
      setError('Login failed — no session returned. Please try again.');
      setLoading(false);
    }
  }

  // ── SIGN UP ────────────────────────────────────────────────────────────────
  async function handleSignup(e) {
    e.preventDefault();
    clearAlerts();
    if (!name.trim())       { setError('Full name is required.'); return; }
    if (!email.trim())      { setError('Email is required.'); return; }
    if (password.length < 8){ setError('Password must be at least 8 characters.'); return; }
    setLoading(true);

    const { data, error: authErr } = await supabase.auth.signUp({
      email:    email.trim().toLowerCase(),
      password: password,
      options: {
        data: { full_name: name.trim() },
        emailRedirectTo: `${window.location.origin}/generate`,
      },
    });

    if (authErr) {
      const msg = authErr.message.toLowerCase();
      if (msg.includes('already registered') || msg.includes('already exists') || msg.includes('user already')) {
        setError('An account with this email already exists. Sign in instead.');
      } else {
        setError(authErr.message || 'Sign up failed. Please try again.');
      }
      setLoading(false);
      return;
    }

    // Auto-confirmed (e.g. dev mode / email confirm disabled)
    if (data?.session) {
      router.push('/generate');
      return;
    }

    // Email confirmation required
    setInfo(`We sent a confirmation link to ${email.trim()}. Click it to activate your account, then sign in.`);
    setLoading(false);
  }

  // ── FORGOT PASSWORD ────────────────────────────────────────────────────────
  async function handleForgot(e) {
    e.preventDefault();
    clearAlerts();
    if (!email.trim()) { setError('Enter your email address.'); return; }
    setLoading(true);

    const { error: authErr } = await supabase.auth.resetPasswordForEmail(
      email.trim().toLowerCase(),
      { redirectTo: `${window.location.origin}/update-password` }
    );

    if (authErr) {
      setError(authErr.message || 'Failed to send reset email.');
      setLoading(false);
      return;
    }

    setInfo(`Password reset link sent to ${email.trim()}. Check your inbox.`);
    setLoading(false);
  }

  // ── RENDER ─────────────────────────────────────────────────────────────────
  const pwdStrength = password.length === 0 ? 0 : password.length < 8 ? 1 : password.length < 12 ? 2 : 3;
  const pwdColors   = ['transparent', '#EF4444', '#F59E0B', '#0E7C4A'];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;800&family=DM+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        @keyframes spin   { to { transform: rotate(360deg); } }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes float  { 0%,100%{ transform:translateY(0); } 50%{ transform:translateY(-6px); } }
        body { background: #FFFFFF; }

        .sp-root {
          min-height: 100vh;
          background: #FFFFFF;
          display: grid;
          grid-template-columns: 1fr 420px;
          font-family: 'DM Sans', sans-serif;
        }

        /* ── LEFT ── */
        .sp-left {
          background: #0A0A0A;
          position: relative;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          padding: 48px 56px;
        }
        .sp-left::before {
          content: '';
          position: absolute; inset: 0;
          background-image: radial-gradient(rgba(255,255,255,0.05) 1px, transparent 1px);
          background-size: 28px 28px;
          pointer-events: none;
        }
        .sp-left-glow {
          position: absolute; inset: 0;
          background:
            radial-gradient(circle at 20% 50%, rgba(212,168,71,0.07) 0%, transparent 50%),
            radial-gradient(circle at 80% 20%, rgba(212,168,71,0.04) 0%, transparent 40%);
          pointer-events: none;
        }
        .sp-logo { display: flex; align-items: center; gap: 10px; position: relative; z-index: 1; }
        .sp-logo-box { width: 34px; height: 34px; background: #FFFFFF; border-radius: 8px; display: flex; align-items: center; justify-content: center; }
        .sp-brand { font-family: 'Playfair Display', serif; font-size: 19px; font-weight: 700; color: #FFFFFF; letter-spacing: -0.02em; }
        .sp-left-body { position: relative; z-index: 1; }
        .sp-eyebrow { font-family: 'JetBrains Mono', monospace; font-size: 9px; color: #D4A847; text-transform: uppercase; letter-spacing: 0.12em; font-weight: 600; margin-bottom: 12px; }
        .sp-headline { font-family: 'Playfair Display', serif; font-size: clamp(26px, 3vw, 40px); font-weight: 700; color: #FFFFFF; line-height: 1.18; letter-spacing: -0.03em; margin-bottom: 16px; }
        .sp-headline em { font-style: italic; color: #D4A847; }
        .sp-subtext { font-size: 13px; color: #666; line-height: 1.7; max-width: 400px; margin-bottom: 36px; }
        .sp-features { display: flex; flex-wrap: wrap; gap: 7px; margin-bottom: 40px; }
        .sp-feat { padding: 4px 12px; border-radius: 4px; background: rgba(212,168,71,0.1); border: 1px solid rgba(212,168,71,0.2); font-size: 11px; color: #D4A847; font-family: 'JetBrains Mono', monospace; }
        .sp-stats { display: flex; gap: 28px; flex-wrap: wrap; position: relative; z-index: 1; }
        .sp-stat-n { font-family: 'Playfair Display', serif; font-size: 24px; font-weight: 700; color: #FFFFFF; letter-spacing: -0.03em; line-height: 1; }
        .sp-stat-l { font-size: 11px; color: #555; margin-top: 2px; }

        /* Floating agent bubbles */
        .sp-bubble {
          position: absolute;
          padding: 7px 14px;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.09);
          border-radius: 100px;
          font-size: 11px;
          color: rgba(255,255,255,0.65);
          white-space: nowrap;
          backdrop-filter: blur(8px);
          animation: float 4s ease-in-out infinite;
          z-index: 0;
        }

        /* ── RIGHT — FORM ── */
        .sp-right {
          background: #FFFFFF;
          display: flex;
          flex-direction: column;
          justify-content: center;
          padding: 48px 44px;
          border-left: 1px solid #E8E8E8;
          animation: fadeUp 0.4s ease both;
        }

        /* Mode tabs */
        .sp-tabs {
          display: flex;
          background: #F5F5F5;
          border-radius: 10px;
          padding: 4px;
          margin-bottom: 28px;
          gap: 3px;
        }
        .sp-tab {
          flex: 1;
          padding: 9px;
          border-radius: 7px;
          border: none;
          font-family: 'DM Sans', sans-serif;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.18s;
          background: transparent;
          color: #8C8C8C;
        }
        .sp-tab.active {
          background: #FFFFFF;
          color: #0A0A0A;
          box-shadow: 0 1px 4px rgba(0,0,0,0.08), 0 0 0 1px rgba(0,0,0,0.05);
        }

        /* Form header */
        .sp-form-title { font-family: 'Playfair Display', serif; font-size: 24px; font-weight: 700; color: #0A0A0A; letter-spacing: -0.03em; margin-bottom: 5px; }
        .sp-form-sub   { font-size: 13px; color: #8C8C8C; margin-bottom: 24px; line-height: 1.55; }

        /* Fields */
        .sp-form { display: flex; flex-direction: column; gap: 14px; }
        .sp-field { display: flex; flex-direction: column; gap: 5px; }
        .sp-label { font-size: 11px; font-weight: 700; color: #0A0A0A; text-transform: uppercase; letter-spacing: 0.06em; }
        .sp-input {
          padding: 11px 14px;
          background: #FFFFFF;
          border: 1.5px solid #E8E8E8;
          border-radius: 9px;
          font-size: 14px;
          color: #0A0A0A;
          font-family: 'DM Sans', sans-serif;
          outline: none;
          width: 100%;
          transition: border-color 0.15s, box-shadow 0.15s;
        }
        .sp-input::placeholder { color: #BCBCBC; }
        .sp-input:focus { border-color: #0A0A0A; box-shadow: 0 0 0 3px rgba(10,10,10,0.06); }
        .sp-input.err   { border-color: #EF4444; }

        /* Password wrapper */
        .sp-pwd-wrap { position: relative; }
        .sp-pwd-eye  { position: absolute; right: 12px; top: 50%; transform: translateY(-50%); background: none; border: none; cursor: pointer; font-size: 14px; color: #BCBCBC; padding: 4px; }

        /* Alerts */
        .sp-error { background: #FEF2F2; border: 1px solid #FCA5A5; border-radius: 8px; padding: 10px 14px; font-size: 13px; color: #DC2626; line-height: 1.5; }
        .sp-info  { background: #F0FDF4; border: 1px solid #86EFAC; border-radius: 8px; padding: 10px 14px; font-size: 13px; color: #15803D; line-height: 1.5; }

        /* Submit */
        .sp-submit {
          background: #0A0A0A; border: none; border-radius: 9px;
          padding: 13px 20px; font-size: 14px; font-weight: 700;
          color: #FFFFFF; cursor: pointer; font-family: 'DM Sans', sans-serif;
          display: flex; align-items: center; justify-content: center; gap: 8px;
          transition: all 0.18s; width: 100%; margin-top: 4px; letter-spacing: -0.01em;
        }
        .sp-submit:hover:not(:disabled) { background: #1a1a1a; transform: translateY(-1px); box-shadow: 0 6px 20px rgba(10,10,10,0.18); }
        .sp-submit:disabled { opacity: 0.5; cursor: not-allowed; }

        .sp-link {
          background: none; border: none; font-size: 13px; font-weight: 700;
          color: #0A0A0A; cursor: pointer; font-family: 'DM Sans', sans-serif;
          text-decoration: underline; text-underline-offset: 2px; padding: 0;
        }
        .sp-link:hover { opacity: 0.7; }

        .sp-forgot {
          background: none; border: none; font-size: 12px; color: #8C8C8C;
          cursor: pointer; font-family: 'DM Sans', sans-serif;
          text-decoration: underline; text-underline-offset: 2px; padding: 0;
        }
        .sp-forgot:hover { color: #0A0A0A; }

        .sp-row { display: flex; align-items: center; justify-content: center; gap: 6px; font-size: 13px; color: #8C8C8C; font-family: 'DM Sans', sans-serif; margin-top: 18px; }

        .sp-terms { font-size: 11px; color: #BCBCBC; text-align: center; line-height: 1.6; margin-top: 6px; }

        @media (max-width: 860px) {
          .sp-root  { grid-template-columns: 1fr; }
          .sp-left  { display: none; }
          .sp-right { padding: 40px 24px; min-height: 100vh; }
        }
      `}</style>

      <div className="sp-root">

        {/* ── LEFT PANEL ── */}
        <div className="sp-left">
          <div className="sp-left-glow" />

          {/* Floating bubbles */}
          {[
            { label: '📡 Trend Spy',         top: '14%', left: '10%', delay: '0s'   },
            { label: '🥊 Title Battle',       top: '12%', left: '60%', delay: '0.5s' },
            { label: '🔬 Competitor Autopsy', top: '55%', left: '6%',  delay: '1s'   },
            { label: '💰 Monetise Coach',     top: '60%', left: '58%', delay: '1.4s' },
            { label: '🌏 Script Localiser',   top: '80%', left: '38%', delay: '0.7s' },
            { label: '⚡ Hook Upgrader',      top: '35%', left: '72%', delay: '1.2s' },
          ].map((b, i) => (
            <div key={i} className="sp-bubble" style={{ top: b.top, left: b.left, animationDelay: b.delay, animationDuration: `${3.5 + i * 0.3}s` }}>
              {b.label}
            </div>
          ))}

          <div className="sp-logo">
            <div className="sp-logo-box">
              <svg width="15" height="15" viewBox="0 0 20 20" fill="none">
                <polygon points="10,2 17,6 17,14 10,18 3,14 3,6" stroke="#0A0A0A" strokeWidth="1.5" fill="none"/>
                <polygon points="10,6 14,8.5 14,13.5 10,16 6,13.5 6,8.5" fill="#0A0A0A" fillOpacity="0.2"/>
              </svg>
            </div>
            <span className="sp-brand">Studio AI</span>
          </div>

          <div className="sp-left-body">
            <p className="sp-eyebrow">India's Creator OS</p>
            <h2 className="sp-headline">
              From <em>idea</em><br/>to full content pack<br/>in 90 seconds.
            </h2>
            <p className="sp-subtext">
              13 AI agents work in sequence — researching trends, writing word-for-word scripts, and building your entire distribution strategy automatically.
            </p>
            <div className="sp-features">
              {['Script', 'Scene Breakdown', 'Hook Psychology', 'YouTube SEO', 'Social Captions', '7-Day Plan'].map(f => (
                <span key={f} className="sp-feat">{f}</span>
              ))}
            </div>
          </div>

          <div className="sp-stats">
            {[['13', 'AI Agents'], ['90s', 'Full Pipeline'], ['₹399', 'Pro / month'], ['Free', 'To Start']].map(([n, l]) => (
              <div key={l}>
                <div className="sp-stat-n">{n}</div>
                <div className="sp-stat-l">{l}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ── RIGHT PANEL — FORM ── */}
        <div className="sp-right">

          {/* ── FORGOT PASSWORD ── */}
          {mode === 'forgot' && (
            <>
              <h1 className="sp-form-title">Reset password</h1>
              <p className="sp-form-sub">Enter your email and we'll send a reset link.</p>
              <form className="sp-form" onSubmit={handleForgot}>
                {error && <div className="sp-error">⚠ {error}</div>}
                {info  && <div className="sp-info">✓ {info}</div>}
                {!info && (
                  <div className="sp-field">
                    <label className="sp-label">Email address</label>
                    <input className={`sp-input${error ? ' err' : ''}`} type="email" placeholder="you@example.com" value={email} onChange={e => { setEmail(e.target.value); clearAlerts(); }} required autoFocus />
                  </div>
                )}
                {!info && (
                  <button type="submit" className="sp-submit" disabled={loading}>
                    {loading ? <><Spinner />Sending…</> : 'Send reset link →'}
                  </button>
                )}
              </form>
              <div className="sp-row">
                <button className="sp-link" onClick={() => switchMode('login')}>← Back to sign in</button>
              </div>
            </>
          )}

          {/* ── LOGIN ── */}
          {mode === 'login' && (
            <>
              {/* Tab switcher */}
              <div className="sp-tabs">
                <button type="button" className={`sp-tab${mode === 'signup' ? ' active' : ''}`} onClick={() => switchMode('signup')}>Sign Up</button>
                <button type="button" className={`sp-tab${mode === 'login'  ? ' active' : ''}`} onClick={() => switchMode('login')}>Sign In</button>
              </div>

              <h1 className="sp-form-title">Welcome back</h1>
              <p className="sp-form-sub">Sign in to your Studio AI account.</p>

              <form className="sp-form" onSubmit={handleLogin}>
                {error && <div className="sp-error">⚠ {error}</div>}
                {info  && <div className="sp-info">✓ {info}</div>}

                <div className="sp-field">
                  <label className="sp-label">Email address</label>
                  <input
                    className={`sp-input${error ? ' err' : ''}`}
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={e => { setEmail(e.target.value); clearAlerts(); }}
                    required
                    autoFocus
                    autoComplete="email"
                  />
                </div>

                <div className="sp-field">
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <label className="sp-label">Password</label>
                    <button type="button" className="sp-forgot" onClick={() => switchMode('forgot')}>Forgot password?</button>
                  </div>
                  <div className="sp-pwd-wrap">
                    <input
                      className={`sp-input${error ? ' err' : ''}`}
                      type={showPwd ? 'text' : 'password'}
                      placeholder="Your password"
                      value={password}
                      onChange={e => { setPassword(e.target.value); clearAlerts(); }}
                      required
                      autoComplete="current-password"
                      style={{ paddingRight: 42 }}
                    />
                    <button type="button" className="sp-pwd-eye" onClick={() => setShowPwd(!showPwd)} tabIndex={-1}>
                      {showPwd ? '🙈' : '👁'}
                    </button>
                  </div>
                </div>

                <button type="submit" className="sp-submit" disabled={loading}>
                  {loading ? <><Spinner />Signing in…</> : 'Sign in →'}
                </button>
              </form>

              <div className="sp-row">
                Don't have an account?
                <button className="sp-link" onClick={() => switchMode('signup')}>Create one free</button>
              </div>
            </>
          )}

          {/* ── SIGN UP ── */}
          {mode === 'signup' && (
            <>
              {/* Tab switcher */}
              <div className="sp-tabs">
                <button type="button" className={`sp-tab${mode === 'signup' ? ' active' : ''}`} onClick={() => switchMode('signup')}>Sign Up</button>
                <button type="button" className={`sp-tab${mode === 'login'  ? ' active' : ''}`} onClick={() => switchMode('login')}>Sign In</button>
              </div>

              <h1 className="sp-form-title">Create account</h1>
              <p className="sp-form-sub">Free plan — 3 generations / month. No card needed.</p>

              {info ? (
                <>
                  <div className="sp-info">✓ {info}</div>
                  <div className="sp-row" style={{ marginTop: 20 }}>
                    <button className="sp-link" onClick={() => switchMode('login')}>→ Go to sign in</button>
                  </div>
                </>
              ) : (
                <form className="sp-form" onSubmit={handleSignup}>
                  {error && <div className="sp-error">⚠ {error}</div>}

                  <div className="sp-field">
                    <label className="sp-label">Full name</label>
                    <input
                      className="sp-input"
                      type="text"
                      placeholder="Arjun Kumar"
                      value={name}
                      onChange={e => { setName(e.target.value); clearAlerts(); }}
                      required
                      autoFocus
                      autoComplete="name"
                    />
                  </div>

                  <div className="sp-field">
                    <label className="sp-label">Email address</label>
                    <input
                      className="sp-input"
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={e => { setEmail(e.target.value); clearAlerts(); }}
                      required
                      autoComplete="email"
                    />
                  </div>

                  <div className="sp-field">
                    <label className="sp-label">
                      Password
                      <span style={{ color: '#BCBCBC', fontWeight: 400, textTransform: 'none', letterSpacing: 0, fontSize: 10, marginLeft: 6 }}>(min 8 characters)</span>
                    </label>
                    <div className="sp-pwd-wrap">
                      <input
                        className="sp-input"
                        type={showPwd ? 'text' : 'password'}
                        placeholder="Create a strong password"
                        value={password}
                        onChange={e => { setPassword(e.target.value); clearAlerts(); }}
                        required
                        minLength={8}
                        autoComplete="new-password"
                        style={{ paddingRight: 42 }}
                      />
                      <button type="button" className="sp-pwd-eye" onClick={() => setShowPwd(!showPwd)} tabIndex={-1}>
                        {showPwd ? '🙈' : '👁'}
                      </button>
                    </div>
                    {/* Password strength bar */}
                    {password.length > 0 && (
                      <div style={{ height: 3, background: '#F0F0F0', borderRadius: 2, overflow: 'hidden', marginTop: 4 }}>
                        <div style={{
                          height: '100%', borderRadius: 2,
                          width: `${[0, 33, 66, 100][pwdStrength]}%`,
                          background: pwdColors[pwdStrength],
                          transition: 'all 0.3s',
                        }} />
                      </div>
                    )}
                  </div>

                  <button type="submit" className="sp-submit" disabled={loading}>
                    {loading ? <><Spinner />Creating account…</> : 'Create free account →'}
                  </button>

                  <p className="sp-terms">By signing up you agree to our Terms of Service and Privacy Policy.</p>
                </form>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
}

function Spinner() {
  return (
    <span style={{
      width: 14, height: 14, borderRadius: '50%',
      border: '2px solid rgba(255,255,255,0.3)',
      borderTopColor: '#fff',
      display: 'inline-block',
      animation: 'spin 0.7s linear infinite',
      flexShrink: 0,
    }} />
  );
}