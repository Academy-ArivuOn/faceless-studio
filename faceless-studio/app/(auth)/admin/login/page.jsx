'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getSupabaseBrowser } from '@/packages/supabase-browser';

export default function AdminLoginPage() {
  const router   = useRouter();
  const supabase = getSupabaseBrowser();
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState('');
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session) {
        const { data } = await supabase.from('admins').select('id').eq('user_id', session.user.id).single();
        if (data) { router.replace('/admin'); return; }
      }
      setChecking(false);
    });
  }, []);

  async function handleLogin(e) {
    e.preventDefault();
    setError(''); setLoading(true);
    const { data: authData, error: authErr } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(), password,
    });
    if (authErr) { setError('Invalid email or password.'); setLoading(false); return; }
    const { data: adminData } = await supabase.from('admins').select('id, name, role').eq('user_id', authData.user.id).single();
    if (!adminData) {
      await supabase.auth.signOut();
      setError('This account does not have admin access.'); setLoading(false); return;
    }
    await supabase.from('admins').update({ last_seen: new Date().toISOString() }).eq('user_id', authData.user.id);
    router.replace('/admin');
  }

  if (checking) return (
    <div style={{ minHeight: '100vh', background: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: 20, height: 20, borderRadius: '50%', border: '2px solid #E4E4E7', borderTopColor: '#09090B', animation: 'spin 0.7s linear infinite' }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        @keyframes spin  { to { transform: rotate(360deg); } }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
        body { background: #FFFFFF; font-family: 'Plus Jakarta Sans', sans-serif; }

        .login-root { min-height: 100vh; display: grid; grid-template-columns: 1fr 1fr; }

        .login-left {
          background: #111111; padding: 48px 56px;
          display: flex; flex-direction: column; position: relative; overflow: hidden;
        }

        .left-grid {
          position: absolute; inset: 0; pointer-events: none;
          background-image: linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px);
          background-size: 48px 48px;
        }

        .brand { display: flex; align-items: center; gap: 10px; position: relative; z-index: 1; }
        .brand-mark { width: 30px; height: 30px; background: #C9A227; border-radius: 7px; display: flex; align-items: center; justify-content: center; font-size: 14px; font-weight: 800; color: #111; }
        .brand-name { font-size: 15px; font-weight: 700; color: #FFFFFF; }
        .brand-tag  { font-size: 10px; color: rgba(255,255,255,0.35); margin-top: 1px; }

        .left-body { flex: 1; display: flex; flex-direction: column; justify-content: center; position: relative; z-index: 1; }

        .left-heading { font-size: clamp(26px, 3vw, 38px); font-weight: 800; color: #FFFFFF; line-height: 1.15; letter-spacing: -0.04em; margin-bottom: 14px; }
        .left-heading em { color: #C9A227; font-style: normal; }
        .left-sub { font-size: 14px; color: rgba(255,255,255,0.4); line-height: 1.7; max-width: 360px; margin-bottom: 36px; }

        .left-stats { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; max-width: 320px; }
        .stat-card { background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.07); border-radius: 8px; padding: 14px; }
        .stat-label { font-size: 10.5px; color: rgba(255,255,255,0.35); margin-bottom: 4px; font-weight: 500; }
        .stat-value { font-size: 20px; font-weight: 800; color: #FFFFFF; letter-spacing: -0.04em; }

        .left-footer { position: relative; z-index: 1; font-size: 10px; color: rgba(255,255,255,0.18); letter-spacing: 0.08em; text-transform: uppercase; }

        .login-right { display: flex; align-items: center; justify-content: center; padding: 48px; background: #FFFFFF; }

        .form-wrap { width: 100%; max-width: 360px; animation: fadeUp 0.4s ease both; }

        .form-eyebrow { font-size: 11px; font-weight: 600; color: #C9A227; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 10px; }
        .form-title   { font-size: 25px; font-weight: 800; color: #09090B; letter-spacing: -0.04em; margin-bottom: 5px; }
        .form-sub     { font-size: 13.5px; color: #71717A; margin-bottom: 30px; line-height: 1.5; }

        .form { display: flex; flex-direction: column; gap: 15px; }
        .field { display: flex; flex-direction: column; gap: 5px; }
        .label { font-size: 12px; font-weight: 600; color: #09090B; }

        .input { padding: 9px 12px; background: #FFFFFF; border: 1.5px solid #E4E4E7; border-radius: 7px; font-size: 13.5px; color: #09090B; outline: none; font-family: 'Plus Jakarta Sans', sans-serif; transition: border-color 0.15s; }
        .input::placeholder { color: #A1A1AA; }
        .input:focus { border-color: #09090B; }

        .err-box { background: #FEF2F2; border: 1px solid #FECACA; border-radius: 7px; padding: 9px 12px; font-size: 12.5px; color: #B91C1C; display: flex; align-items: center; gap: 7px; }

        .submit { background: #09090B; border: none; border-radius: 7px; padding: 10px 20px; font-size: 13.5px; font-weight: 600; color: #FFFFFF; cursor: pointer; font-family: 'Plus Jakarta Sans', sans-serif; transition: all 0.15s; display: flex; align-items: center; justify-content: center; gap: 8px; margin-top: 4px; }
        .submit:hover:not(:disabled) { background: #222; }
        .submit:disabled { opacity: 0.45; cursor: not-allowed; }

        .form-footer { margin-top: 24px; font-size: 11px; color: #A1A1AA; text-align: center; }

        @media (max-width: 768px) { .login-root { grid-template-columns: 1fr; } .login-left { display: none; } .login-right { padding: 32px 20px; } }
      `}</style>

      <div className="login-root">
        <div className="login-left">
          <div className="left-grid" />
          <div className="brand">
            <div className="brand-mark">S</div>
            <div><div className="brand-name">Studio AI</div><div className="brand-tag">Admin Console</div></div>
          </div>
          <div className="left-body">
            <h1 className="left-heading">Command centre<br />for <em>Studio AI</em></h1>
            <p className="left-sub">Unified operations dashboard for monitoring user growth, revenue, and platform activity in real time.</p>
            <div className="left-stats">
              {[
                { label: 'Metric', value: 'MRR'    },
                { label: 'Metric', value: 'Users'  },
                { label: 'Metric', value: 'Gens'   },
                { label: 'Metric', value: 'Plans'  },
              ].map((s, i) => (
                <div className="stat-card" key={i}>
                  <div className="stat-label">{['Revenue', 'Creators', 'Generations', 'Subscriptions'][i]}</div>
                  <div className="stat-value">{s.value}</div>
                </div>
              ))}
            </div>
          </div>
          <div className="left-footer">Restricted Access · Studio AI Operations</div>
        </div>

        <div className="login-right">
          <div className="form-wrap">
            <p className="form-eyebrow">Admin Portal</p>
            <h2 className="form-title">Sign in</h2>
            <p className="form-sub">Enter your admin credentials to access the console.</p>
            <form className="form" onSubmit={handleLogin}>
              {error && <div className="err-box"><span>⚠</span>{error}</div>}
              <div className="field">
                <label className="label">Email Address</label>
                <input className="input" type="email" placeholder="admin@studioai.app" value={email} onChange={e => setEmail(e.target.value)} required disabled={loading} autoFocus autoComplete="email" />
              </div>
              <div className="field">
                <label className="label">Password</label>
                <input className="input" type="password" placeholder="••••••••••" value={password} onChange={e => setPassword(e.target.value)} required disabled={loading} autoComplete="current-password" />
              </div>
              <button type="submit" className="submit" disabled={loading}>
                {loading ? <><span style={{ width: 13, height: 13, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', display: 'inline-block', animation: 'spin 0.7s linear infinite' }} />Verifying…</> : 'Continue →'}
              </button>
            </form>
            <p className="form-footer">Studio AI · Secure Admin Access</p>
          </div>
        </div>
      </div>
    </>
  );
}