'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getSupabaseBrowser } from '@/packages/supabase-browser';

export default function RedeemPage() {
  const router   = useRouter();
  const supabase = getSupabaseBrowser();
  const [user,      setUser]      = useState(null);
  const [loading,   setLoading]   = useState(true);
  const [code,      setCode]      = useState('');
  const [redeeming, setRedeeming] = useState(false);
  const [error,     setError]     = useState('');
  const [success,   setSuccess]   = useState(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) { router.replace('/login?redirect=/redeem'); return; }
      setUser(session.user);
      setLoading(false);
    });
  }, []);

  async function handleRedeem(e) {
    e.preventDefault();
    if (!code.trim()) return;
    setRedeeming(true);
    setError('');

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res  = await fetch('/api/payment/redeem-gift', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify({ code: code.trim() }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || 'Redemption failed');
      setSuccess(json);
    } catch (err) {
      setError(err.message || 'Failed to redeem. Please check the code and try again.');
    } finally {
      setRedeeming(false);
    }
  }

  if (loading) return (
    <div style={{ minHeight:'100vh', background:'#07070E', display:'flex', alignItems:'center', justifyContent:'center' }}>
      <div style={{ width:24, height:24, borderRadius:'50%', border:'2px solid rgba(212,168,71,0.3)', borderTopColor:'#D4A847', animation:'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@400;500;600&family=Space+Mono:wght@400;700&display=swap');
        *, *::before, *::after { box-sizing:border-box; margin:0; padding:0; }
        @keyframes spin { to{transform:rotate(360deg)} }
        @keyframes rise { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
        body { background:#07070E; }
      `}</style>

      <div style={{ minHeight:'100vh', background:'#07070E', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'24px', fontFamily:"'DM Sans',sans-serif", animation:'rise 0.4s ease both' }}>

        {/* Logo */}
        <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:40 }}>
          <div style={{ width:32, height:32, background:'rgba(212,168,71,0.15)', border:'1px solid rgba(212,168,71,0.3)', borderRadius:8, display:'flex', alignItems:'center', justifyContent:'center' }}>
            <span style={{ fontSize:14 }}>🎁</span>
          </div>
          <span style={{ fontFamily:"'Syne',sans-serif", fontSize:16, fontWeight:700, color:'#EEEEF5' }}>Studio AI</span>
        </div>

        <div style={{ width:'100%', maxWidth:440 }}>
          {success ? (
            // ── SUCCESS ──
            <div style={{ textAlign:'center' }}>
              <div style={{ width:72, height:72, borderRadius:'50%', background:'rgba(80,200,120,0.12)', border:'2px solid rgba(80,200,120,0.3)', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 24px', fontSize:32 }}>✓</div>
              <h1 style={{ fontFamily:"'Syne',sans-serif", fontSize:28, fontWeight:800, color:'#EEEEF5', marginBottom:10, letterSpacing:'-0.03em' }}>Gift Redeemed!</h1>
              <p style={{ fontSize:14, color:'rgba(238,238,245,0.55)', lineHeight:1.7, marginBottom:28 }}>
                Your <strong style={{ color:'#EEEEF5', textTransform:'capitalize' }}>{success.plan}</strong> plan is now active for {success.months} month{success.months > 1 ? 's' : ''}. All agents are unlocked.
              </p>
              <button onClick={() => router.push('/generate')} style={{ width:'100%', padding:'15px', background:'linear-gradient(135deg,#D4A847,#C9A227)', border:'none', borderRadius:11, fontFamily:"'Syne',sans-serif", fontSize:15, fontWeight:800, color:'#07070E', cursor:'pointer' }}>
                Start Creating →
              </button>
            </div>
          ) : (
            // ── FORM ──
            <>
              <h1 style={{ fontFamily:"'Syne',sans-serif", fontSize:28, fontWeight:800, color:'#EEEEF5', marginBottom:8, letterSpacing:'-0.03em', textAlign:'center' }}>Redeem Gift</h1>
              <p style={{ fontSize:14, color:'rgba(238,238,245,0.45)', textAlign:'center', marginBottom:36, lineHeight:1.6 }}>
                Enter your gift code below to unlock your Studio AI subscription.
              </p>

              <form onSubmit={handleRedeem}>
                <div style={{ marginBottom:16 }}>
                  <input
                    type="text"
                    placeholder="XXXX-XXXX-XXXX"
                    value={code}
                    onChange={e => setCode(e.target.value.toUpperCase())}
                    disabled={redeeming}
                    style={{
                      width:'100%', padding:'16px 20px', background:'rgba(255,255,255,0.03)',
                      border:'1.5px solid rgba(255,255,255,0.08)', borderRadius:11,
                      color:'#EEEEF5', fontSize:22, fontFamily:"'Space Mono',monospace",
                      fontWeight:700, letterSpacing:'0.12em', outline:'none',
                      textAlign:'center', transition:'border-color 0.2s',
                    }}
                    onFocus={e => { e.target.style.borderColor = 'rgba(212,168,71,0.4)'; }}
                    onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.08)'; }}
                  />
                </div>

                {error && (
                  <div style={{ background:'rgba(248,113,113,0.08)', border:'1px solid rgba(248,113,113,0.2)', borderRadius:9, padding:'12px 14px', fontSize:13, color:'#F87171', marginBottom:16 }}>
                    ⚠ {error}
                  </div>
                )}

                <button type="submit" disabled={redeeming || !code.trim()} style={{
                  width:'100%', padding:'15px', background:'linear-gradient(135deg,#D4A847,#C9A227)',
                  border:'none', borderRadius:11, fontFamily:"'Syne',sans-serif", fontSize:15,
                  fontWeight:800, color:'#07070E', cursor: (redeeming || !code.trim()) ? 'not-allowed' : 'pointer',
                  opacity: (redeeming || !code.trim()) ? 0.5 : 1, display:'flex', alignItems:'center', justifyContent:'center', gap:8,
                }}>
                  {redeeming
                    ? <><span style={{ width:16, height:16, borderRadius:'50%', border:'2.5px solid rgba(7,7,14,0.3)', borderTopColor:'#07070E', animation:'spin 0.7s linear infinite', display:'inline-block' }} />Redeeming…</>
                    : 'Redeem Gift Code →'
                  }
                </button>
              </form>

              <p style={{ textAlign:'center', marginTop:24, fontSize:12, color:'rgba(238,238,245,0.25)' }}>
                Don't have a code? <button onClick={() => router.push('/#pricing')} style={{ background:'none', border:'none', color:'rgba(212,168,71,0.7)', cursor:'pointer', fontSize:12, textDecoration:'underline', textUnderlineOffset:2 }}>View plans</button>
              </p>
            </>
          )}
        </div>
      </div>
    </>
  );
}