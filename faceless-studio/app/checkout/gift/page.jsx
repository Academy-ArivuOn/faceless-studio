// app/checkout/gift/page.jsx
'use client';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { getSupabaseBrowser } from '@/packages/supabase-browser';

export const dynamic = 'force-dynamic';

function loadRazorpay() {
  return new Promise((resolve) => {
    if (window.Razorpay) { resolve(true); return; }
    const s   = document.createElement('script');
    s.src     = 'https://checkout.razorpay.com/v1/checkout.js';
    s.onload  = () => resolve(true);
    s.onerror = () => resolve(false);
    document.body.appendChild(s);
  });
}

const PLANS = {
  pro:    { name: 'Creator Pro', icon: '⚡', prices: { monthly: 999,  annual: 7999 } },
  studio: { name: 'Studio',      icon: '🏢', prices: { monthly: 2499, annual: 19999 } },
};
const DURATIONS = [
  { id: '1', label: '1 Month',   months: 1 },
  { id: '3', label: '3 Months',  months: 3 },
  { id: '6', label: '6 Months',  months: 6, badge: 'Best Value' },
  { id: '12',label: '1 Year',    months: 12, badge: '🎉 Full Year' },
];

export default function GiftCheckoutPage() {
  const router   = useRouter();
  const supabase = getSupabaseBrowser();

  const [user,        setUser]        = useState(null);
  const [loading,     setLoading]     = useState(true);
  const [step,        setStep]        = useState(1);  // 1=configure 2=personalise 3=review 4=success
  const [processing,  setProcessing]  = useState(false);
  const [error,       setError]       = useState('');
  const [giftCode,    setGiftCode]    = useState('');

  const [plan,        setPlan]        = useState('pro');
  const [duration,    setDuration]    = useState('1');
  const [recipient,   setRecipient]   = useState({ name: '', email: '', message: '' });
  const [sender,      setSender]      = useState({ name: '', email: '' });

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) { router.replace('/login'); return; }
      setUser(session.user);
      setSender(p => ({ ...p, email: session.user.email || '' }));
      setLoading(false);
    });
  }, []);

  const dur      = DURATIONS.find(d => d.id === duration);
  const pl       = PLANS[plan];
  // 10% gift discount
  const monthly  = Math.round(pl.prices.monthly * 0.9);
  const total    = monthly * (dur?.months || 1);
  const savings  = (pl.prices.monthly * (dur?.months || 1)) - total;

  const handlePay = useCallback(async () => {
    setError('');
    if (!recipient.email?.includes('@') || !recipient.name?.trim())
      return setError('Please fill in recipient details.');

    setProcessing(true);
    try {
      const rzOk = await loadRazorpay();
      if (!rzOk) throw new Error('Payment system failed to load. Refresh and try again.');

      const { data: { session } } = await supabase.auth.getSession();

      // Create order
      const orderRes = await fetch('/api/payment/create-order', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify({
          plan,
          billingCycle:  'monthly',
          currency:      'INR',
          paymentType:   'gift',
          giftData: {
            recipientEmail: recipient.email,
            recipientName:  recipient.name,
            message:        recipient.message,
            durationMonths: dur.months,
          },
        }),
      });
      const orderJson = await orderRes.json();
      if (!orderRes.ok || !orderJson.success) throw new Error(orderJson.error || 'Order creation failed');

      await new Promise((resolve, reject) => {
        const options = {
          key:         orderJson.keyId,
          amount:      orderJson.amount,
          currency:    'INR',
          order_id:    orderJson.orderId,
          name:        'Studio AI — Gift',
          description: `${pl.name} Gift — ${dur.label} for ${recipient.name}`,
          handler: async (response) => {
            try {
              const vRes = await fetch('/api/payment/verify', {
                method:  'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
                body: JSON.stringify({
                  razorpayOrderId:   response.razorpay_order_id,
                  razorpayPaymentId: response.razorpay_payment_id,
                  razorpaySignature: response.razorpay_signature,
                  txId:              orderJson.txId,
                }),
              });
              const vJson = await vRes.json();
              if (!vRes.ok || !vJson.success) throw new Error(vJson.error || 'Verification failed');
              setGiftCode(vJson.giftCode);
              setStep(4);
              resolve();
            } catch (e) { reject(e); }
          },
          prefill:  { email: user.email, name: sender.name || '' },
          theme:    { color: '#C9A227', backdrop_color: 'rgba(7,7,14,0.85)' },
          modal:    { ondismiss: () => { setProcessing(false); resolve(); }, animation: true },
          config: {
            display: {
              blocks: {
                utib:  { name: 'Pay via UPI', instruments: [{ method: 'upi' }] },
                other: { name: 'Other Methods',instruments: [{ method:'card' },{ method:'netbanking' },{ method:'wallet' }] },
              },
              sequence:    ['block.utib', 'block.other'],
              preferences: { show_default_blocks: false },
            },
          },
        };
        const rzp = new window.Razorpay(options);
        rzp.on('payment.failed', (r) => { setError(r.error?.description || 'Payment failed'); setProcessing(false); reject(); });
        rzp.open();
      });

    } catch (err) {
      setError(err.message || 'Payment failed. Please try again.');
      setProcessing(false);
    }
  }, [user, plan, duration, dur, recipient, sender, pl, total]);

  if (loading) return (
    <div style={{ minHeight:'100vh', background:'#07070E', display:'flex', alignItems:'center', justifyContent:'center' }}>
      <div style={{ width:24, height:24, borderRadius:'50%', border:'2px solid rgba(212,168,71,0.3)', borderTopColor:'#D4A847', animation:'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  // ── SUCCESS ──────────────────────────────────────────────────────────────
  if (step === 4) return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@400;600&family=Space+Mono:wght@400;700&display=swap');
        *, *::before, *::after { box-sizing:border-box; margin:0; padding:0; }
        @keyframes rise { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
        body { background:#07070E; }
      `}</style>
      <div style={{ minHeight:'100vh', background:'#07070E', display:'flex', alignItems:'center', justifyContent:'center', padding:'24px', fontFamily:"'DM Sans', sans-serif" }}>
        <div style={{ textAlign:'center', maxWidth:480, animation:'rise 0.5s ease both' }}>
          <div style={{ fontSize:48, marginBottom:20 }}>🎁</div>
          <h1 style={{ fontFamily:"'Syne',sans-serif", fontSize:28, fontWeight:800, color:'#EEEEF5', marginBottom:10, letterSpacing:'-0.03em' }}>Gift Sent!</h1>
          <p style={{ fontSize:14, color:'rgba(238,238,245,0.55)', lineHeight:1.7, marginBottom:28 }}>
            Your gift has been sent to <strong style={{ color:'#EEEEF5' }}>{recipient.email}</strong>. They'll receive a redemption code via email.
          </p>
          <div style={{ background:'rgba(212,168,71,0.06)', border:'1px solid rgba(212,168,71,0.2)', borderRadius:14, padding:'20px 28px', marginBottom:28, display:'inline-block' }}>
            <p style={{ fontSize:11, color:'rgba(212,168,71,0.7)', fontFamily:"'Space Mono',monospace", textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:10 }}>Gift Code</p>
            <p style={{ fontFamily:"'Space Mono',monospace", fontSize:22, fontWeight:700, color:'#D4A847', letterSpacing:'0.1em' }}>{giftCode}</p>
            <button onClick={() => navigator.clipboard.writeText(giftCode)} style={{ marginTop:10, background:'none', border:'1px solid rgba(212,168,71,0.3)', borderRadius:6, padding:'5px 14px', color:'rgba(212,168,71,0.7)', fontSize:11, cursor:'pointer', fontFamily:"'DM Sans',sans-serif" }}>
              Copy Code
            </button>
          </div>
          <p style={{ fontSize:12, color:'rgba(238,238,245,0.35)', marginBottom:24 }}>
            Recipient can redeem at <span style={{ color:'rgba(238,238,245,0.6)' }}>studioai.app/redeem</span> · Valid 90 days
          </p>
          <div style={{ display:'flex', gap:10 }}>
            <button onClick={() => router.push('/generate')} style={{ flex:1, padding:'13px', background:'#C9A227', border:'none', borderRadius:9, fontSize:14, fontWeight:700, color:'#07070E', cursor:'pointer', fontFamily:"'Syne',sans-serif" }}>
              Back to Generate
            </button>
            <button onClick={() => router.push('/profile')} style={{ padding:'13px 18px', background:'transparent', border:'1px solid rgba(255,255,255,0.1)', borderRadius:9, fontSize:13, color:'rgba(238,238,245,0.6)', cursor:'pointer', fontFamily:"'DM Sans',sans-serif" }}>
              View Transactions
            </button>
          </div>
        </div>
      </div>
    </>
  );

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@400;500;600;700&family=Space+Mono:wght@400;700&display=swap');
        *, *::before, *::after { box-sizing:border-box; margin:0; padding:0; }
        @keyframes spin { to{transform:rotate(360deg)} }
        body { background:#07070E; }
        .gck-root { min-height:100vh; background:#07070E; color:#EEEEF5; font-family:'DM Sans',sans-serif; }
        .gck-bar { height:56px; border-bottom:1px solid rgba(255,255,255,0.06); display:flex; align-items:center; justify-content:space-between; padding:0 28px; }
        .gck-body { max-width:960px; margin:0 auto; padding:44px 24px 100px; display:grid; grid-template-columns:1fr 340px; gap:36px; align-items:start; }
        .gck-card { background:rgba(255,255,255,0.025); border:1px solid rgba(255,255,255,0.07); border-radius:14px; padding:22px; margin-bottom:18px; }
        .gck-title { font-family:'Syne',sans-serif; font-size:14px; font-weight:700; color:rgba(238,238,245,0.45); text-transform:uppercase; letter-spacing:0.08em; margin-bottom:14px; }
        .gck-plan-row { display:grid; grid-template-columns:1fr 1fr; gap:10px; }
        .gck-plan-btn { padding:16px; border:1.5px solid rgba(255,255,255,0.07); border-radius:10px; background:rgba(255,255,255,0.02); cursor:pointer; transition:all 0.2s; text-align:left; }
        .gck-plan-btn.active { border-color:rgba(212,168,71,0.5); background:rgba(212,168,71,0.07); }
        .gck-dur-row { display:flex; gap:8px; flex-wrap:wrap; }
        .gck-dur-btn { padding:10px 16px; border:1.5px solid rgba(255,255,255,0.07); border-radius:8px; background:rgba(255,255,255,0.02); cursor:pointer; font-size:13px; font-weight:600; color:rgba(238,238,245,0.6); transition:all 0.2s; position:relative; font-family:'DM Sans',sans-serif; }
        .gck-dur-btn.active { border-color:rgba(212,168,71,0.5); background:rgba(212,168,71,0.07); color:#D4A847; }
        .gck-field { margin-bottom:14px; }
        .gck-label { font-size:11px; font-weight:700; color:rgba(238,238,245,0.45); text-transform:uppercase; letter-spacing:0.07em; margin-bottom:6px; display:block; }
        .gck-input { width:100%; padding:11px 14px; border:1.5px solid rgba(255,255,255,0.07); border-radius:9px; background:rgba(255,255,255,0.03); color:#EEEEF5; font-size:14px; font-family:'DM Sans',sans-serif; outline:none; transition:border-color 0.2s; }
        .gck-input:focus { border-color:rgba(212,168,71,0.4); }
        .gck-input::placeholder { color:rgba(238,238,245,0.2); }
        .gck-textarea { width:100%; padding:11px 14px; border:1.5px solid rgba(255,255,255,0.07); border-radius:9px; background:rgba(255,255,255,0.03); color:#EEEEF5; font-size:13px; font-family:'DM Sans',sans-serif; outline:none; resize:none; transition:border-color 0.2s; }
        .gck-textarea:focus { border-color:rgba(212,168,71,0.4); }
        .gck-cta { width:100%; padding:15px; background:linear-gradient(135deg,#D4A847,#C9A227); border:none; border-radius:11px; font-family:'Syne',sans-serif; font-size:15px; font-weight:800; color:#07070E; cursor:pointer; display:flex; align-items:center; justify-content:center; gap:8px; transition:all 0.25s; }
        .gck-cta:hover:not(:disabled) { transform:translateY(-2px); box-shadow:0 10px 30px rgba(212,168,71,0.35); }
        .gck-cta:disabled { opacity:0.5; cursor:not-allowed; }
        .gck-steps { display:flex; align-items:center; gap:0; margin-bottom:36px; }
        .gck-step { display:flex; align-items:center; gap:8px; }
        .gck-step-num { width:26px; height:26px; border-radius:'50%'; display:flex; align-items:center; justify-content:center; font-size:11px; font-weight:800; border-radius:50%; font-family:'Space Mono',monospace; }
        .gck-step-line { flex:1; height:1px; background:rgba(255,255,255,0.08); margin:0 8px; }
        .gck-step-label { font-size:12px; font-weight:600; white-space:nowrap; }
        .gck-nav-row { display:flex; gap:10px; }
        .gck-back-btn { padding:'11px 18px'; border:1px solid rgba(255,255,255,0.08); border-radius:9px; background:transparent; color:rgba(238,238,245,0.5); font-size:13px; cursor:pointer; font-family:'DM Sans',sans-serif; padding:11px 18px; }
        .gck-error { background:rgba(248,113,113,0.08); border:1px solid rgba(248,113,113,0.2); border-radius:9px; padding:12px 14px; font-size:13px; color:#F87171; margin-bottom:14px; }
        @media (max-width:768px) { .gck-body { grid-template-columns:1fr; padding:24px 16px 60px; } }
      `}</style>

      <div className="gck-root">
        <header className="gck-bar">
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <div style={{ width:28, height:28, background:'rgba(212,168,71,0.15)', border:'1px solid rgba(212,168,71,0.3)', borderRadius:7, display:'flex', alignItems:'center', justifyContent:'center' }}>
              <span style={{ fontSize:12 }}>🎁</span>
            </div>
            <span style={{ fontFamily:"'Syne',sans-serif", fontSize:15, fontWeight:700, color:'#EEEEF5' }}>Studio AI — Gift</span>
          </div>
          <button onClick={() => router.push('/gift')} style={{ background:'none', border:'1px solid rgba(255,255,255,0.08)', borderRadius:7, padding:'7px 14px', fontSize:12, color:'rgba(238,238,245,0.5)', cursor:'pointer' }}>
            ← Back
          </button>
        </header>

        <div className="gck-body">
          <div>
            {/* Steps */}
            <div className="gck-steps">
              {[{n:'1',l:'Plan'},{n:'2',l:'Recipient'},{n:'3',l:'Review'}].map((s,i) => (
                <div key={s.n} style={{ display:'flex', alignItems:'center', flex: i < 2 ? 1 : 'none' }}>
                  <div className="gck-step">
                    <div className="gck-step-num" style={{ background: step > i ? '#D4A847' : step === i+1 ? 'rgba(212,168,71,0.15)' : 'rgba(255,255,255,0.05)', color: step > i ? '#07070E' : step === i+1 ? '#D4A847' : 'rgba(238,238,245,0.3)', border: step === i+1 ? '1.5px solid rgba(212,168,71,0.5)' : 'none' }}>{step > i+1 ? '✓' : s.n}</div>
                    <span className="gck-step-label" style={{ color: step >= i+1 ? '#EEEEF5' : 'rgba(238,238,245,0.3)' }}>{s.l}</span>
                  </div>
                  {i < 2 && <div className="gck-step-line" />}
                </div>
              ))}
            </div>

            {/* Step 1: Plan */}
            {step === 1 && (
              <>
                <div className="gck-card">
                  <p className="gck-title">Choose Plan to Gift</p>
                  <div className="gck-plan-row">
                    {Object.entries(PLANS).map(([key, p]) => (
                      <div key={key} className={`gck-plan-btn ${plan === key ? 'active' : ''}`} onClick={() => setPlan(key)}>
                        <div style={{ fontSize:18, marginBottom:6 }}>{p.icon}</div>
                        <div style={{ fontFamily:"'Syne',sans-serif", fontSize:14, fontWeight:700, color:'#EEEEF5', marginBottom:4 }}>{p.name}</div>
                        <div style={{ fontSize:11, color:'rgba(238,238,245,0.4)' }}>₹{Math.round(p.prices.monthly * 0.9)}/mo · 10% off</div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="gck-card">
                  <p className="gck-title">Duration</p>
                  <div className="gck-dur-row">
                    {DURATIONS.map(d => (
                      <button key={d.id} className={`gck-dur-btn ${duration === d.id ? 'active' : ''}`} onClick={() => setDuration(d.id)}>
                        {d.label}
                        {d.badge && <span style={{ fontSize:9, background:'rgba(80,200,120,0.15)', color:'#50C878', borderRadius:3, padding:'1px 5px', marginLeft:5, fontFamily:"'Space Mono',monospace" }}>{d.badge}</span>}
                      </button>
                    ))}
                  </div>
                </div>
                <button className="gck-cta" onClick={() => setStep(2)}>Continue to Recipient →</button>
              </>
            )}

            {/* Step 2: Recipient */}
            {step === 2 && (
              <>
                <div className="gck-card">
                  <p className="gck-title">Recipient Details</p>
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                    <div className="gck-field">
                      <label className="gck-label">Name *</label>
                      <input className="gck-input" placeholder="Priya Kapoor" value={recipient.name} onChange={e => setRecipient(p => ({...p, name:e.target.value}))} />
                    </div>
                    <div className="gck-field">
                      <label className="gck-label">Email *</label>
                      <input className="gck-input" type="email" placeholder="priya@example.com" value={recipient.email} onChange={e => setRecipient(p => ({...p, email:e.target.value}))} />
                    </div>
                  </div>
                  <div className="gck-field">
                    <label className="gck-label">Personal Message (optional)</label>
                    <textarea className="gck-textarea" rows={3} placeholder="Hey! I thought you'd love this for your channel..." value={recipient.message} onChange={e => setRecipient(p => ({...p, message:e.target.value}))} />
                  </div>
                </div>
                {error && <div className="gck-error">⚠ {error}</div>}
                <div className="gck-nav-row">
                  <button className="gck-back-btn" onClick={() => setStep(1)}>← Back</button>
                  <button className="gck-cta" style={{ flex:1 }} onClick={() => {
                    if (!recipient.email?.includes('@') || !recipient.name?.trim()) return setError('Please fill in recipient name and email.');
                    setError(''); setStep(3);
                  }}>Review & Pay →</button>
                </div>
              </>
            )}

            {/* Step 3: Review */}
            {step === 3 && (
              <>
                <div className="gck-card">
                  <p className="gck-title">Review Your Gift</p>
                  {[
                    ['Plan',      `${pl.icon} ${pl.name}`],
                    ['Duration',  dur?.label],
                    ['Recipient', `${recipient.name} (${recipient.email})`],
                    ['Amount',    `₹${total.toLocaleString()} (10% gift discount applied)`],
                    ['Code Valid','90 days from today'],
                  ].map(([k,v]) => (
                    <div key={k} style={{ display:'flex', gap:16, padding:'10px 0', borderBottom:'1px solid rgba(255,255,255,0.05)', alignItems:'flex-start' }}>
                      <span style={{ fontSize:10, color:'rgba(238,238,245,0.3)', minWidth:90, fontFamily:"'Space Mono',monospace", textTransform:'uppercase', letterSpacing:'0.06em', paddingTop:2, flexShrink:0 }}>{k}</span>
                      <span style={{ fontSize:13, color:'#EEEEF5', fontWeight:500 }}>{v}</span>
                    </div>
                  ))}
                  {recipient.message && (
                    <div style={{ marginTop:14, padding:'12px 14px', background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.06)', borderRadius:8 }}>
                      <p style={{ fontSize:11, color:'rgba(238,238,245,0.3)', fontFamily:"'Space Mono',monospace", marginBottom:6, textTransform:'uppercase', letterSpacing:'0.06em' }}>Message</p>
                      <p style={{ fontSize:13, color:'rgba(238,238,245,0.7)', fontStyle:'italic', lineHeight:1.6 }}>"{recipient.message}"</p>
                    </div>
                  )}
                </div>
                {error && <div className="gck-error">⚠ {error}</div>}
                <div className="gck-nav-row">
                  <button className="gck-back-btn" onClick={() => setStep(2)}>← Back</button>
                  <button className="gck-cta" style={{ flex:1 }} onClick={handlePay} disabled={processing}>
                    {processing ? <><span style={{ width:15, height:15, borderRadius:'50%', border:'2px solid rgba(7,7,14,0.3)', borderTopColor:'#07070E', animation:'spin 0.7s linear infinite', display:'inline-block' }} />Processing…</> : `Pay ₹${total.toLocaleString()} & Send Gift 🎁`}
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Summary sidebar */}
          <div style={{ position:'sticky', top:24 }}>
            <div style={{ background:'rgba(255,255,255,0.025)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:14, overflow:'hidden' }}>
              <div style={{ padding:'18px 22px', borderBottom:'1px solid rgba(255,255,255,0.06)', background:'rgba(212,168,71,0.04)' }}>
                <div style={{ fontFamily:"'Syne',sans-serif", fontSize:16, fontWeight:800, color:'#EEEEF5', marginBottom:4 }}>{pl.icon} {pl.name} Gift</div>
                <div style={{ fontSize:11, color:'rgba(238,238,245,0.4)', fontFamily:"'Space Mono',monospace", textTransform:'uppercase', letterSpacing:'0.06em' }}>{dur?.label} · INR</div>
              </div>
              <div style={{ padding:'18px 22px', display:'flex', flexDirection:'column', gap:10 }}>
                {[
                  ['Original Price', `₹${(pl.prices.monthly * (dur?.months || 1)).toLocaleString()}`],
                  ['Gift Discount (10%)', `-₹${savings.toLocaleString()}`],
                ].map(([k,v]) => (
                  <div key={k} style={{ display:'flex', justifyContent:'space-between', fontSize:13 }}>
                    <span style={{ color:'rgba(238,238,245,0.5)' }}>{k}</span>
                    <span style={{ fontWeight:600, color: k.includes('Discount') ? '#50C878' : '#EEEEF5' }}>{v}</span>
                  </div>
                ))}
              </div>
              <div style={{ padding:'16px 22px', background:'rgba(212,168,71,0.06)', borderTop:'1px solid rgba(212,168,71,0.12)', display:'flex', justifyContent:'space-between', alignItems:'baseline' }}>
                <span style={{ fontSize:13, color:'rgba(238,238,245,0.6)' }}>You Pay</span>
                <span style={{ fontFamily:"'Syne',sans-serif", fontSize:26, fontWeight:800, color:'#D4A847', letterSpacing:'-0.04em' }}>₹{total.toLocaleString()}</span>
              </div>
              <div style={{ padding:'14px 22px', borderTop:'1px solid rgba(255,255,255,0.05)' }}>
                <div style={{ display:'flex', alignItems:'center', gap:8, fontSize:11, color:'rgba(238,238,245,0.3)' }}>
                  <span>🔒</span>
                  <span>Secure payment via Razorpay · Code delivered instantly</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}