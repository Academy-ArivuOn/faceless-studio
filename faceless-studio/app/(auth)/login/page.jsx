'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getSupabaseBrowser } from '@/lib/supabase-browser';

export default function LoginPage() {
  const router   = useRouter();
  const supabase = getSupabaseBrowser();

  const [mode,    setMode]    = useState('login');   // 'login' | 'signup'
  const [email,   setEmail]   = useState('');
  const [password,setPassword]= useState('');
  const [name,    setName]    = useState('');
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');
  const [success, setSuccess] = useState('');

  // Redirect if already logged in
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) router.replace('/generate');
    });
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
    <div style={styles.page}>
      {/* Background blobs */}
      <div style={{...styles.blob, top: '-10%', left: '-5%',  background: 'radial-gradient(circle, rgba(233,161,0,0.12) 0%, transparent 65%)'}} />
      <div style={{...styles.blob, bottom: '-10%', right: '-5%', background: 'radial-gradient(circle, rgba(12,170,220,0.10) 0%, transparent 65%)'}} />

      <div style={styles.card}>
        {/* Logo */}
        <div style={styles.logo}>
          <span style={styles.logoIcon}>⬡</span>
          <span style={styles.logoText}>Studio AI</span>
        </div>

        {/* Tabs */}
        <div style={styles.tabs}>
          <button style={{...styles.tab, ...(mode === 'login'  ? styles.tabActive : {})}} onClick={() => { setMode('login');  setError(''); }}>Log In</button>
          <button style={{...styles.tab, ...(mode === 'signup' ? styles.tabActive : {})}} onClick={() => { setMode('signup'); setError(''); }}>Sign Up</button>
        </div>

        <form onSubmit={handleSubmit} style={styles.form}>
          {mode === 'signup' && (
            <div style={styles.field}>
              <label style={styles.label}>Full Name</label>
              <input
                style={styles.input}
                type="text"
                placeholder="Your name"
                value={name}
                onChange={e => setName(e.target.value)}
                required
              />
            </div>
          )}

          <div style={styles.field}>
            <label style={styles.label}>Email</label>
            <input
              style={styles.input}
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Password</label>
            <input
              style={styles.input}
              type="password"
              placeholder={mode === 'signup' ? 'Minimum 6 characters' : '••••••••'}
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              minLength={6}
            />
          </div>

          {error   && <p style={styles.errorMsg}>{error}</p>}
          {success && <p style={styles.successMsg}>{success}</p>}

          <button type="submit" disabled={loading} style={{...styles.btn, ...(loading ? styles.btnDisabled : {})}}>
            {loading ? 'Please wait…' : mode === 'login' ? 'Log In' : 'Create Account'}
          </button>
        </form>

        <p style={styles.subtext}>
          Free plan includes 3 generations/month. No credit card required.
        </p>
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: '100vh',
    background: 'var(--void)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '24px',
    position: 'relative',
    overflow: 'hidden',
    fontFamily: 'var(--FB)',
  },
  blob: {
    position: 'absolute',
    width: '600px',
    height: '600px',
    borderRadius: '50%',
    pointerEvents: 'none',
  },
  card: {
    background: 'rgba(238,242,255,0.04)',
    border: '1px solid rgba(238,242,255,0.1)',
    borderRadius: '16px',
    padding: '40px',
    width: '100%',
    maxWidth: '420px',
    backdropFilter: 'blur(12px)',
    position: 'relative',
    zIndex: 1,
  },
  logo: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    marginBottom: '32px',
    justifyContent: 'center',
  },
  logoIcon: {
    fontSize: '28px',
    color: 'var(--gold)',
  },
  logoText: {
    fontFamily: 'var(--FH)',
    fontSize: '22px',
    fontWeight: '700',
    color: 'var(--white)',
    letterSpacing: '-0.02em',
  },
  tabs: {
    display: 'flex',
    gap: '4px',
    background: 'rgba(238,242,255,0.06)',
    borderRadius: '10px',
    padding: '4px',
    marginBottom: '28px',
  },
  tab: {
    flex: 1,
    padding: '10px',
    borderRadius: '8px',
    border: 'none',
    background: 'transparent',
    color: 'var(--w5)',
    fontFamily: 'var(--FB)',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  tabActive: {
    background: 'rgba(233,161,0,0.15)',
    color: 'var(--gold-hi)',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '18px',
  },
  field: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  label: {
    fontSize: '13px',
    fontWeight: '500',
    color: 'var(--w8)',
    letterSpacing: '0.02em',
  },
  input: {
    background: 'rgba(238,242,255,0.06)',
    border: '1px solid rgba(238,242,255,0.12)',
    borderRadius: '10px',
    padding: '12px 16px',
    color: 'var(--white)',
    fontSize: '15px',
    fontFamily: 'var(--FB)',
    outline: 'none',
    transition: 'border-color 0.2s',
  },
  errorMsg: {
    background: 'rgba(255,80,80,0.1)',
    border: '1px solid rgba(255,80,80,0.3)',
    borderRadius: '8px',
    padding: '12px',
    color: '#ff6b6b',
    fontSize: '13px',
    margin: '0',
  },
  successMsg: {
    background: 'rgba(0,220,130,0.1)',
    border: '1px solid rgba(0,220,130,0.3)',
    borderRadius: '8px',
    padding: '12px',
    color: '#00dc82',
    fontSize: '13px',
    margin: '0',
  },
  btn: {
    background: 'linear-gradient(135deg, var(--gold) 0%, var(--gold-hi) 100%)',
    border: 'none',
    borderRadius: '10px',
    padding: '14px',
    color: '#000',
    fontSize: '15px',
    fontWeight: '700',
    fontFamily: 'var(--FB)',
    cursor: 'pointer',
    marginTop: '4px',
    transition: 'opacity 0.2s, transform 0.2s',
  },
  btnDisabled: {
    opacity: 0.6,
    cursor: 'not-allowed',
  },
  subtext: {
    textAlign: 'center',
    color: 'var(--w3)',
    fontSize: '12px',
    marginTop: '20px',
    marginBottom: '0',
  },
};