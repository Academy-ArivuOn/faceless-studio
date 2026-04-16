'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getSupabaseBrowser } from '@/packages/supabase-browser';

const PLANS = [
  {
    id: 'pro',
    name: 'Pro',
    icon: '⚡',
    originalPrice: 399,
    desc: 'Unlimited generations + 5 Pro Agents',
    features: ['Unlimited content generations', 'Trend Spy Agent', 'Title Battle Agent', 'Thumbnail Brain Agent', 'Hook Upgrader Agent', 'Comment Reply Agent', 'Priority support'],
    color: '#D4A847',
    bg: '#FFF9EB',
    border: '#FDE68A',
    popular: true,
  },
  {
    id: 'studio',
    name: 'Studio',
    icon: '🏢',
    originalPrice: 999,
    desc: 'Everything in Pro + 5 Studio Agents',
    features: ['Everything in Pro', 'Competitor Autopsy', 'Viral Decoder', 'Channel Strategy', 'Monetisation Coach', 'Script Localiser', 'Vlogger / Blogger Mode', 'Dedicated support'],
    color: '#2563EB',
    bg: '#EFF6FF',
    border: '#BFDBFE',
    popular: false,
  },
];

const DURATIONS = [
  { id: '1', label: '1 Month', multiplier: 1 },
  { id: '3', label: '3 Months', multiplier: 3 },
  { id: '6', label: '6 Months', multiplier: 6, badge: 'Best Value' },
  { id: '12', label: '1 Year', multiplier: 12, badge: '🎉 Full Year' },
];

function PlanCard({ plan, selected, onSelect }) {
  const discountedPrice = Math.round(plan.originalPrice * 0.9);
  return (
    <div
      onClick={() => onSelect(plan.id)}
      style={{
        border: `2px solid ${selected ? plan.color : '#E8E8E8'}`,
        borderRadius: 14, padding: '22px 20px', background: selected ? plan.bg : '#FFFFFF',
        cursor: 'pointer', transition: 'all 0.2s', position: 'relative', flex: 1,
      }}
    >
      {plan.popular && (
        <div style={{ position: 'absolute', top: -10, left: '50%', transform: 'translateX(-50%)', background: '#0A0A0A', color: '#FFFFFF', fontSize: 10, fontWeight: 800, padding: '3px 12px', borderRadius: 100, fontFamily: "'JetBrains Mono', monospace", whiteSpace: 'nowrap' }}>
          MOST GIFTED
        </div>
      )}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        <span style={{ fontSize: 20 }}>{plan.icon}</span>
        <span style={{ fontFamily: "'Playfair Display', serif", fontSize: 18, fontWeight: 800, color: '#0A0A0A' }}>{plan.name}</span>
        {selected && (
          <span style={{ marginLeft: 'auto', width: 20, height: 20, borderRadius: '50%', background: plan.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, color: '#FFFFFF', fontWeight: 800 }}>✓</span>
        )}
      </div>
      <p style={{ fontSize: 12, color: '#8C8C8C', marginBottom: 14, fontFamily: "'DM Sans', sans-serif" }}>{plan.desc}</p>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, marginBottom: 4 }}>
        <span style={{ fontFamily: "'Playfair Display', serif", fontSize: 26, fontWeight: 800, color: '#0A0A0A' }}>₹{discountedPrice}</span>
        <div style={{ paddingBottom: 4 }}>
          <span style={{ fontSize: 11, color: '#BCBCBC', textDecoration: 'line-through', display: 'block' }}>₹{plan.originalPrice}</span>
          <span style={{ fontSize: 10, color: '#0E7C4A', fontWeight: 700, fontFamily: "'JetBrains Mono', monospace" }}>10% GIFT DISCOUNT</span>
        </div>
      </div>
      <p style={{ fontSize: 10, color: '#BCBCBC', marginBottom: 14 }}>per month</p>
      <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 5 }}>
        {plan.features.map((f, i) => (
          <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 7, fontSize: 12, color: '#3C3C3C', fontFamily: "'DM Sans', sans-serif" }}>
            <span style={{ color: plan.color, fontWeight: 800, flexShrink: 0, marginTop: 1 }}>✓</span>{f}
          </li>
        ))}
      </ul>
    </div>
  );
}

function Step({ num, label, active, done }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <div style={{
        width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 11, fontWeight: 800, fontFamily: "'JetBrains Mono', monospace",
        background: done ? '#0A0A0A' : active ? '#0A0A0A' : '#F5F5F5',
        color: done || active ? '#FFFFFF' : '#BCBCBC',
        border: `2px solid ${done || active ? '#0A0A0A' : '#E8E8E8'}`,
        transition: 'all 0.3s',
      }}>
        {done ? '✓' : num}
      </div>
      <span style={{ fontSize: 12, fontWeight: active || done ? 700 : 400, color: active || done ? '#0A0A0A' : '#BCBCBC', fontFamily: "'DM Sans', sans-serif" }}>{label}</span>
    </div>
  );
}

export default function GiftPage() {
  const router = useRouter();
  const supabase = getSupabaseBrowser();

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState(1); // 1: Configure, 2: Personalise, 3: Pay
  const [submitting, setSubmitting] = useState(false);
  const [giftCode, setGiftCode] = useState('');
  const [error, setError] = useState('');

  const [selectedPlan, setSelectedPlan] = useState('pro');
  const [selectedDuration, setSelectedDuration] = useState('1');
  const [recipient, setRecipient] = useState({ name: '', email: '', message: '' });
  const [sender, setSender] = useState({ name: '', email: '' });
  const [payBy, setPayBy] = useState('sender'); // 'sender' | 'recipient'

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) { router.replace('/login'); return; }
      setUser(session.user);
      setSender(prev => ({ ...prev, email: session.user.email || '' }));
      setLoading(false);
    });
  }, []);

  const plan = PLANS.find(p => p.id === selectedPlan);
  const duration = DURATIONS.find(d => d.id === selectedDuration);
  const discountedMonthly = plan ? Math.round(plan.originalPrice * 0.9) : 0;
  const totalAmount = discountedMonthly * (duration?.multiplier || 1);
  const savings = (plan ? plan.originalPrice * (duration?.multiplier || 1) : 0) - totalAmount;

  async function handleSubmit() {
    setError('');
    if (!recipient.email || !recipient.email.includes('@')) { setError('Please enter a valid recipient email.'); return; }
    if (!recipient.name.trim()) { setError('Please enter the recipient\'s name.'); return; }
    if (payBy === 'sender' && (!sender.name.trim() || !sender.email.includes('@'))) { setError('Please fill in your name and email.'); return; }

    setSubmitting(true);

    // In production: call /api/gift to create a gift code + redirect to LemonSqueezy
    // Simulate for now
    await new Promise(r => setTimeout(r, 1500));
    const code = `GIFT-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
    setGiftCode(code);
    setStep(4); // success
    setSubmitting(false);
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: 24, height: 24, borderRadius: '50%', border: '2px solid #E8E8E8', borderTopColor: '#0A0A0A', animation: 'spin 0.7s linear infinite' }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;800&family=DM+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeUp { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }
        body { background: #FFFFFF; }

        .gf-root { min-height: 100vh; background: #FFFFFF; font-family: 'DM Sans', sans-serif; color: #0A0A0A; }
        .gf-topbar { height: 56px; border-bottom: 1px solid #E8E8E8; display: flex; align-items: center; justify-content: space-between; padding: 0 32px; position: sticky; top: 0; background: rgba(255,255,255,0.97); backdrop-filter: blur(12px); z-index: 100; }
        .gf-topbar-left { display: flex; align-items: center; gap: 10px; }
        .gf-logo { width: 28px; height: 28px; background: #0A0A0A; border-radius: 7px; display: flex; align-items: center; justify-content: center; cursor: pointer; }
        .gf-brand { font-family: 'Playfair Display', serif; font-size: 15px; font-weight: 700; color: #0A0A0A; cursor: pointer; }
        .gf-sep { color: #E8E8E8; font-size: 16px; }
        .gf-crumb { font-size: 13px; color: #8C8C8C; font-weight: 500; }
        .gf-btn-ghost { background: none; border: 1px solid #E8E8E8; border-radius: 7px; padding: 7px 14px; font-family: 'DM Sans', sans-serif; font-size: 13px; font-weight: 500; color: #5C5C5C; cursor: pointer; transition: all 0.15s; }
        .gf-btn-ghost:hover { border-color: #0A0A0A; color: #0A0A0A; }

        .gf-body { max-width: 1000px; margin: 0 auto; padding: 44px 24px 100px; }

        .gf-hero { text-align: center; margin-bottom: 44px; }
        .gf-hero-badge { display: inline-flex; align-items: center; gap: 6px; padding: '6px 16px'; background: #FFF9EB; border: 1px solid #FDE68A; border-radius: 100px; font-size: 12px; font-weight: 700; color: '#C9A227'; margin-bottom: 16px; font-family: 'JetBrains Mono', monospace; padding: 6px 16px; color: #C9A227; }
        .gf-hero-title { font-family: 'Playfair Display', serif; font-size: clamp(28px, 4vw, 40px); font-weight: 800; color: #0A0A0A; letter-spacing: -0.04em; line-height: 1.15; margin-bottom: 12px; }
        .gf-hero-sub { font-size: 15px; color: '#5C5C5C'; max-width: 500px; margin: 0 auto; line-height: 1.7; color: #5C5C5C; }

        .gf-steps { display: flex; align-items: center; gap: 0; margin-bottom: 40px; padding: 18px 24px; background: '#F8F8F8'; border: '1px solid #E8E8E8'; border-radius: 12px; overflow-x: auto; background: #F8F8F8; border: 1px solid #E8E8E8; }
        .gf-step-divider { flex: 1; height: 1px; background: #E8E8E8; margin: 0 12px; min-width: 20px; }

        .gf-layout { display: grid; grid-template-columns: 1fr 320px; gap: 28px; align-items: flex-start; }
        .gf-main { min-width: 0; }
        .gf-sidebar { position: sticky; top: 80px; }

        .gf-card { border: 1px solid #E8E8E8; border-radius: 14px; overflow: hidden; margin-bottom: 20px; animation: fadeUp 0.3s ease both; }
        .gf-card-head { padding: 18px 22px; border-bottom: 1px solid #F5F5F5; display: flex; align-items: center; gap: 10px; }
        .gf-card-num { width: 24px; height: 24px; border-radius: 6px; background: '#0A0A0A'; color: '#FFFFFF'; font-size: 11px; font-weight: 800; display: flex; align-items: center; justify-content: center; font-family: 'JetBrains Mono', monospace; flex-shrink: 0; background: #0A0A0A; color: #FFFFFF; }
        .gf-card-title { font-family: 'Playfair Display', serif; font-size: 16px; font-weight: 700; color: '#0A0A0A'; color: #0A0A0A; }
        .gf-card-body { padding: 20px 22px; }

        .gf-field { margin-bottom: 16px; }
        .gf-label { font-size: 11px; font-weight: 700; color: '#5C5C5C'; text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 6px; display: block; color: #5C5C5C; }
        .gf-sublabel { font-size: 12px; color: '#8C8C8C'; margin-top: -3px; margin-bottom: 7px; color: #8C8C8C; }
        .gf-input { width: 100%; padding: 11px 13px; border: 1.5px solid #E8E8E8; border-radius: 8px; font-family: 'DM Sans', sans-serif; font-size: 14px; color: '#0A0A0A'; outline: none; transition: border-color 0.2s, box-shadow 0.2s; background: '#FFFFFF'; color: #0A0A0A; background: #FFFFFF; }
        .gf-input::placeholder { color: #BCBCBC; }
        .gf-input:focus { border-color: #0A0A0A; box-shadow: 0 0 0 3px rgba(10,10,10,0.05); }
        .gf-textarea { width: 100%; padding: 11px 13px; border: 1.5px solid #E8E8E8; border-radius: 8px; font-family: 'DM Sans', sans-serif; font-size: 13px; color: '#0A0A0A'; outline: none; resize: none; transition: border-color 0.2s; background: '#FFFFFF'; line-height: 1.6; color: #0A0A0A; background: #FFFFFF; }
        .gf-textarea:focus { border-color: #0A0A0A; }
        .gf-grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }

        .gf-dur-row { display: flex; gap: 8px; flex-wrap: wrap; }
        .gf-dur-btn { padding: '9px 16px'; border: 1.5px solid #E8E8E8; border-radius: 8px; font-size: 13px; font-weight: 600; color: '#5C5C5C'; background: '#FFFFFF'; cursor: pointer; transition: all 0.2s; position: relative; font-family: 'DM Sans', sans-serif; padding: 9px 16px; color: #5C5C5C; background: #FFFFFF; }
        .gf-dur-btn.active { border-color: #0A0A0A; background: '#0A0A0A'; color: '#FFFFFF'; background: #0A0A0A; color: #FFFFFF; }
        .gf-dur-badge { position: absolute; top: -9px; left: '50%'; transform: 'translateX(-50%)'; background: '#0E7C4A'; color: '#FFFFFF'; font-size: 8px; font-weight: 800; padding: '2px 7px'; border-radius: 100px; white-space: 'nowrap'; font-family: 'JetBrains Mono', monospace; left: 50%; transform: translateX(-50%); background: #0E7C4A; color: #FFFFFF; white-space: nowrap; }

        .gf-payby-row { display: flex; gap: 10px; }
        .gf-payby-btn { flex: 1; padding: 14px; border: 1.5px solid #E8E8E8; border-radius: 10px; background: '#FFFFFF'; cursor: pointer; text-align: 'center'; transition: all 0.2s; background: #FFFFFF; text-align: center; }
        .gf-payby-btn.active { border-color: #0A0A0A; background: #F8F8F8; }
        .gf-payby-icon { font-size: 22px; display: block; margin-bottom: 6px; }
        .gf-payby-label { font-size: 13px; font-weight: 700; color: '#0A0A0A'; display: block; margin-bottom: 3px; color: #0A0A0A; }
        .gf-payby-desc { font-size: 11px; color: '#8C8C8C'; line-height: 1.4; color: #8C8C8C; }

        /* Order summary */
        .gf-summary { background: '#FAFAFA'; border: '1px solid #E8E8E8'; border-radius: 14px; overflow: 'hidden'; background: #FAFAFA; border: 1px solid #E8E8E8; border-radius: 14px; overflow: hidden; }
        .gf-summary-head { padding: 16px 20px; border-bottom: 1px solid #E8E8E8; }
        .gf-summary-title { font-family: 'Playfair Display', serif; font-size: 15px; font-weight: 700; color: '#0A0A0A'; color: #0A0A0A; }
        .gf-summary-body { padding: 16px 20px; display: flex; flex-direction: column; gap: 10px; }
        .gf-summary-row { display: flex; justify-content: space-between; align-items: flex-start; gap: 10px; font-size: 13px; }
        .gf-summary-key { color: '#8C8C8C'; color: #8C8C8C; }
        .gf-summary-val { font-weight: 600; color: '#0A0A0A'; text-align: right; color: #0A0A0A; }
        .gf-summary-divider { height: 1px; background: #E8E8E8; }
        .gf-summary-total { display: flex; justify-content: space-between; padding: 14px 20px; background: '#0A0A0A'; background: #0A0A0A; }
        .gf-summary-total-key { font-size: 13px; font-weight: 700; color: 'rgba(255,255,255,0.7)'; color: rgba(255,255,255,0.7); }
        .gf-summary-total-val { font-family: 'Playfair Display', serif; font-size: 22px; font-weight: 800; color: '#FFFFFF'; color: #FFFFFF; }

        .gf-discount-badge { background: '#F0FDF4'; border: '1px solid #86EFAC'; border-radius: 8px; padding: '10px 14px'; display: flex; align-items: center; gap: 8px; margin-top: 10px; background: #F0FDF4; border: 1px solid #86EFAC; padding: 10px 14px; }

        .gf-cta { width: 100%; padding: 15px; background: '#0A0A0A'; border: 'none'; border-radius: 10px; font-family: 'DM Sans', sans-serif; font-size: 15px; font-weight: 700; color: '#FFFFFF'; cursor: 'pointer'; transition: all 0.2s; margin-top: 14px; display: flex; align-items: center; justify-content: center; gap: 8px; background: #0A0A0A; border: none; color: #FFFFFF; cursor: pointer; }
        .gf-cta:hover:not(:disabled) { background: #1a1a1a; transform: translateY(-1px); box-shadow: 0 6px 20px rgba(10,10,10,0.25); }
        .gf-cta:disabled { opacity: 0.5; cursor: not-allowed; }

        .gf-error { background: '#FEF2F2'; border: '1px solid #FCA5A5'; border-radius: 8px; padding: '10px 14px'; font-size: 13px; color: '#DC2626'; margin-top: 10px; background: #FEF2F2; border: 1px solid #FCA5A5; color: #DC2626; padding: 10px 14px; }

        /* Success */
        .gf-success { text-align: center; padding: '60px 24px'; animation: fadeUp 0.5s ease both; padding: 60px 24px; }
        .gf-success-icon { width: 80px; height: 80px; border-radius: 20px; background: '#F0FDF4'; border: '2px solid #86EFAC'; display: 'flex'; align-items: center; justify-content: center; font-size: 36px; margin: '0 auto 24px'; background: #F0FDF4; border: 2px solid #86EFAC; display: flex; margin: 0 auto 24px; }
        .gf-success-title { font-family: 'Playfair Display', serif; font-size: 28px; font-weight: 800; color: '#0A0A0A'; margin-bottom: 10px; letter-spacing: -0.03em; color: #0A0A0A; }
        .gf-success-sub { font-size: 14px; color: '#5C5C5C'; max-width: 420px; margin: '0 auto 24px'; line-height: 1.7; color: #5C5C5C; margin: 0 auto 24px; }
        .gf-code-box { background: '#F8F8F8'; border: '1.5px solid #E8E8E8'; border-radius: 12px; padding: '18px 24px'; display: 'inline-flex'; flex-direction: column; align-items: center; gap: 6px; margin: '0 auto 28px'; background: #F8F8F8; border: 1.5px solid #E8E8E8; display: inline-flex; margin: 0 auto 28px; }
        .gf-code { font-family: 'JetBrains Mono', monospace; font-size: 24px; font-weight: 800; color: '#0A0A0A'; letter-spacing: '0.15em'; color: #0A0A0A; letter-spacing: 0.15em; }

        @media (max-width: 700px) {
          .gf-layout { grid-template-columns: 1fr; }
          .gf-sidebar { position: static; }
          .gf-grid2 { grid-template-columns: 1fr; }
          .gf-topbar { padding: 0 16px; }
          .gf-body { padding: 28px 16px 80px; }
          .gf-payby-row { flex-direction: column; }
        }
      `}</style>

      <div className="gf-root">
        {/* Topbar */}
        <header className="gf-topbar">
          <div className="gf-topbar-left">
            <div className="gf-logo" onClick={() => router.push('/generate')}>
              <svg width="13" height="13" viewBox="0 0 20 20" fill="none">
                <polygon points="10,2 17,6 17,14 10,18 3,14 3,6" stroke="#FFFFFF" strokeWidth="1.5" fill="none"/>
                <polygon points="10,6 14,8.5 14,13.5 10,16 6,13.5 6,8.5" fill="#FFFFFF" fillOpacity="0.3"/>
              </svg>
            </div>
            <span className="gf-brand" onClick={() => router.push('/generate')}>Studio AI</span>
            <span className="gf-sep">/</span>
            <span className="gf-crumb">Gift a Subscription</span>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="gf-btn-ghost" onClick={() => router.push('/dashboard')}>Dashboard</button>
          </div>
        </header>

        <div className="gf-body">
          {step === 4 ? (
            /* ── Success ── */
            <div className="gf-success">
              <div className="gf-success-icon">🎁</div>
              <h1 className="gf-success-title">Gift Sent!</h1>
              <p className="gf-success-sub">
                {payBy === 'sender'
                  ? `Payment confirmed. Your gift code has been created and emailed to ${recipient.email}.`
                  : `An email has been sent to ${recipient.email} with a payment link. They'll get 10% off when they pay.`}
              </p>
              <div className="gf-code-box">
                <span style={{ fontSize: 11, fontWeight: 700, color: '#8C8C8C', textTransform: 'uppercase', letterSpacing: '0.1em', fontFamily: "'JetBrains Mono', monospace" }}>Gift Code</span>
                <span className="gf-code">{giftCode}</span>
                <button
                  onClick={() => navigator.clipboard.writeText(giftCode)}
                  style={{ fontSize: 11, color: '#5C5C5C', background: 'none', border: 'none', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", fontWeight: 600 }}
                >
                  Copy Code
                </button>
              </div>
              <p style={{ fontSize: 13, color: '#8C8C8C', maxWidth: 440, margin: '0 auto 28px', lineHeight: 1.65 }}>
                {recipient.name} can redeem this code at <strong>studioai.app/redeem</strong> after signing up or logging in. The code is valid for 90 days.
              </p>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
                <button onClick={() => router.push('/generate')} style={{ padding: '12px 24px', background: '#0A0A0A', border: 'none', borderRadius: 9, color: '#FFFFFF', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}>
                  Back to Generate
                </button>
                <button onClick={() => { setStep(1); setGiftCode(''); }} className="gf-btn-ghost">
                  Send Another Gift
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Hero */}
              <div className="gf-hero">
                <div className="gf-hero-badge">🎁 Gift Studio AI</div>
                <h1 className="gf-hero-title">Give the gift of great content</h1>
                <p className="gf-hero-sub">Send a Studio AI subscription to any creator. You save 10% on the gift price. Redeemable instantly via a unique code.</p>
              </div>

              {/* Steps */}
              <div className="gf-steps">
                <Step num="1" label="Choose Plan" active={step === 1} done={step > 1} />
                <div className="gf-step-divider" />
                <Step num="2" label="Personalise" active={step === 2} done={step > 2} />
                <div className="gf-step-divider" />
                <Step num="3" label="Review & Pay" active={step === 3} done={step > 3} />
              </div>

              <div className="gf-layout">
                {/* Main */}
                <div className="gf-main">

                  {/* Step 1: Plan */}
                  {step === 1 && (
                    <div style={{ animation: 'fadeUp 0.3s ease both' }}>
                      {/* Plan selector */}
                      <div className="gf-card">
                        <div className="gf-card-head">
                          <div className="gf-card-num">1</div>
                          <span className="gf-card-title">Choose a Plan to Gift</span>
                        </div>
                        <div className="gf-card-body">
                          <div style={{ display: 'flex', gap: 14, marginBottom: 0, flexWrap: 'wrap' }}>
                            {PLANS.map(p => (
                              <PlanCard key={p.id} plan={p} selected={selectedPlan === p.id} onSelect={setSelectedPlan} />
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Duration */}
                      <div className="gf-card">
                        <div className="gf-card-head">
                          <div className="gf-card-num">2</div>
                          <span className="gf-card-title">How Long?</span>
                        </div>
                        <div className="gf-card-body">
                          <div className="gf-dur-row">
                            {DURATIONS.map(d => (
                              <button key={d.id} className={`gf-dur-btn ${selectedDuration === d.id ? 'active' : ''}`} onClick={() => setSelectedDuration(d.id)} style={{ position: 'relative' }}>
                                {d.badge && <span className="gf-dur-badge">{d.badge}</span>}
                                {d.label}
                              </button>
                            ))}
                          </div>
                          <p style={{ fontSize: 12, color: '#8C8C8C', marginTop: 12, fontFamily: "'DM Sans', sans-serif" }}>
                            Longer durations use the same discounted monthly rate. The recipient gets access for the full duration without needing a card.
                          </p>
                        </div>
                      </div>

                      {/* Who pays */}
                      <div className="gf-card">
                        <div className="gf-card-head">
                          <div className="gf-card-num">3</div>
                          <span className="gf-card-title">Who Pays?</span>
                        </div>
                        <div className="gf-card-body">
                          <div className="gf-payby-row">
                            <button className={`gf-payby-btn ${payBy === 'sender' ? 'active' : ''}`} onClick={() => setPayBy('sender')}>
                              <span className="gf-payby-icon">🎁</span>
                              <span className="gf-payby-label">I'll Pay</span>
                              <span className="gf-payby-desc">You pay now with 10% off. They receive a gift code to redeem — no credit card needed.</span>
                            </button>
                            <button className={`gf-payby-btn ${payBy === 'recipient' ? 'active' : ''}`} onClick={() => setPayBy('recipient')}>
                              <span className="gf-payby-icon">📬</span>
                              <span className="gf-payby-label">They'll Pay</span>
                              <span className="gf-payby-desc">Send them a gifted payment link. They get 10% off when they checkout. You're sponsoring the discount.</span>
                            </button>
                          </div>
                          {payBy === 'recipient' && (
                            <div style={{ marginTop: 12, padding: '12px 14px', background: '#FFFBEB', border: '1px solid #FED7AA', borderRadius: 8, fontSize: 12, color: '#92400E', fontFamily: "'DM Sans', sans-serif" }}>
                              💡 The recipient will pay for their own subscription at a 10% discounted rate via a personalised link you send them.
                            </div>
                          )}
                        </div>
                      </div>

                      <button className="gf-cta" onClick={() => setStep(2)}>
                        Continue →
                      </button>
                    </div>
                  )}

                  {/* Step 2: Personalise */}
                  {step === 2 && (
                    <div style={{ animation: 'fadeUp 0.3s ease both' }}>
                      <div className="gf-card">
                        <div className="gf-card-head">
                          <div className="gf-card-num">4</div>
                          <span className="gf-card-title">Recipient Details</span>
                        </div>
                        <div className="gf-card-body">
                          <div className="gf-grid2">
                            <div className="gf-field">
                              <label className="gf-label">Their Name <span style={{ color: '#DC2626' }}>*</span></label>
                              <input className="gf-input" placeholder="e.g. Priya Kapoor" value={recipient.name} onChange={e => setRecipient(p => ({ ...p, name: e.target.value }))} />
                            </div>
                            <div className="gf-field">
                              <label className="gf-label">Their Email <span style={{ color: '#DC2626' }}>*</span></label>
                              <input className="gf-input" type="email" placeholder="priya@example.com" value={recipient.email} onChange={e => setRecipient(p => ({ ...p, email: e.target.value }))} />
                            </div>
                          </div>
                          <div className="gf-field">
                            <label className="gf-label">Personal Message (optional)</label>
                            <p className="gf-sublabel">This will be included in the gift email they receive.</p>
                            <textarea className="gf-textarea" rows={4} placeholder="e.g. Hey Priya! I've been using Studio AI to grow my YouTube channel and thought it would help with yours too. Enjoy the gift 🎉" value={recipient.message} onChange={e => setRecipient(p => ({ ...p, message: e.target.value }))} />
                          </div>
                        </div>
                      </div>

                      {payBy === 'sender' && (
                        <div className="gf-card">
                          <div className="gf-card-head">
                            <div className="gf-card-num">5</div>
                            <span className="gf-card-title">Your Details</span>
                          </div>
                          <div className="gf-card-body">
                            <div className="gf-grid2">
                              <div className="gf-field">
                                <label className="gf-label">Your Name <span style={{ color: '#DC2626' }}>*</span></label>
                                <input className="gf-input" placeholder="e.g. Rahul Mehta" value={sender.name} onChange={e => setSender(p => ({ ...p, name: e.target.value }))} />
                              </div>
                              <div className="gf-field">
                                <label className="gf-label">Your Email (for receipt)</label>
                                <input className="gf-input" type="email" value={sender.email} onChange={e => setSender(p => ({ ...p, email: e.target.value }))} />
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      <div style={{ display: 'flex', gap: 10 }}>
                        <button className="gf-btn-ghost" onClick={() => setStep(1)} style={{ flex: 0 }}>← Back</button>
                        <button className="gf-cta" style={{ flex: 1 }} onClick={() => setStep(3)}>Continue →</button>
                      </div>
                    </div>
                  )}

                  {/* Step 3: Review */}
                  {step === 3 && (
                    <div style={{ animation: 'fadeUp 0.3s ease both' }}>
                      <div className="gf-card">
                        <div className="gf-card-head">
                          <div className="gf-card-num">✓</div>
                          <span className="gf-card-title">Review Your Gift</span>
                        </div>
                        <div className="gf-card-body">
                          {[
                            ['Plan', `${plan?.icon} ${plan?.name}`],
                            ['Duration', duration?.label],
                            ['Recipient', `${recipient.name} (${recipient.email})`],
                            ['Payment', payBy === 'sender' ? 'You pay now' : 'Recipient pays (10% off link)'],
                            ['Delivery', 'Email with gift code instantly after payment'],
                            ['Code Validity', '90 days from today'],
                          ].map(([k, v]) => (
                            <div key={k} style={{ display: 'flex', gap: 16, padding: '10px 0', borderBottom: '1px solid #F5F5F5', alignItems: 'flex-start' }}>
                              <span style={{ fontSize: 11, color: '#BCBCBC', minWidth: 110, fontFamily: "'JetBrains Mono', monospace", textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700, paddingTop: 2, flexShrink: 0 }}>{k}</span>
                              <span style={{ fontSize: 13, color: '#0A0A0A', fontFamily: "'DM Sans', sans-serif", fontWeight: 500 }}>{v}</span>
                            </div>
                          ))}
                          {recipient.message && (
                            <div style={{ marginTop: 14, padding: '14px 16px', background: '#F8F8F8', border: '1px solid #E8E8E8', borderRadius: 8 }}>
                              <p style={{ fontSize: 11, fontWeight: 700, color: '#8C8C8C', textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: "'JetBrains Mono', monospace", marginBottom: 6 }}>Personal Message</p>
                              <p style={{ fontSize: 13, color: '#3C3C3C', fontStyle: 'italic', lineHeight: 1.6 }}>"{recipient.message}"</p>
                            </div>
                          )}
                        </div>
                      </div>

                      {error && <div className="gf-error">⚠ {error}</div>}

                      <div style={{ display: 'flex', gap: 10 }}>
                        <button className="gf-btn-ghost" onClick={() => setStep(2)}>← Back</button>
                        <button className="gf-cta" style={{ flex: 1 }} onClick={handleSubmit} disabled={submitting}>
                          {submitting ? (
                            <><span style={{ width: 15, height: 15, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#FFFFFF', animation: 'spin 0.7s linear infinite', display: 'inline-block' }} />Processing…</>
                          ) : payBy === 'sender' ? `Pay ₹${totalAmount} & Send Gift 🎁` : 'Send Gift Link 📬'}
                        </button>
                      </div>
                      <p style={{ fontSize: 11, color: '#BCBCBC', textAlign: 'center', marginTop: 10, lineHeight: 1.5 }}>
                        {payBy === 'sender' ? 'You will be redirected to our secure payment page powered by LemonSqueezy.' : 'The recipient will receive a unique discounted payment link via email.'}
                      </p>
                    </div>
                  )}
                </div>

                {/* Sidebar: Order Summary */}
                <div className="gf-sidebar">
                  <div className="gf-summary">
                    <div className="gf-summary-head">
                      <span className="gf-summary-title">Order Summary</span>
                    </div>
                    <div className="gf-summary-body">
                      <div className="gf-summary-row">
                        <span className="gf-summary-key">Plan</span>
                        <span className="gf-summary-val">{plan?.icon} {plan?.name}</span>
                      </div>
                      <div className="gf-summary-row">
                        <span className="gf-summary-key">Duration</span>
                        <span className="gf-summary-val">{duration?.label}</span>
                      </div>
                      <div className="gf-summary-row">
                        <span className="gf-summary-key">Monthly Rate</span>
                        <span className="gf-summary-val">
                          <span style={{ textDecoration: 'line-through', color: '#BCBCBC', marginRight: 6 }}>₹{plan?.originalPrice}</span>
                          ₹{discountedMonthly}
                        </span>
                      </div>
                      <div className="gf-summary-divider" />
                      <div className="gf-summary-row">
                        <span className="gf-summary-key">Subtotal</span>
                        <span style={{ textDecoration: 'line-through', color: '#BCBCBC', fontSize: 13, fontWeight: 600 }}>
                          ₹{(plan?.originalPrice || 0) * (duration?.multiplier || 1)}
                        </span>
                      </div>
                      <div className="gf-discount-badge">
                        <span style={{ fontSize: 14 }}>🎁</span>
                        <span style={{ fontSize: 12, fontWeight: 700, color: '#0E7C4A', fontFamily: "'JetBrains Mono', monospace" }}>
                          Gift Discount (10%): −₹{savings}
                        </span>
                      </div>
                    </div>
                    <div className="gf-summary-total">
                      <span className="gf-summary-total-key">{payBy === 'recipient' ? 'They Pay' : 'You Pay'}</span>
                      <span className="gf-summary-total-val">₹{totalAmount}</span>
                    </div>
                  </div>

                  <div style={{ marginTop: 14, padding: '14px', background: '#F8F8F8', border: '1px solid #E8E8E8', borderRadius: 10 }}>
                    <p style={{ fontSize: 11, fontWeight: 700, color: '#0A0A0A', marginBottom: 6, fontFamily: "'DM Sans', sans-serif" }}>🔒 Secure & Instant</p>
                    <p style={{ fontSize: 11, color: '#8C8C8C', lineHeight: 1.6 }}>Payments powered by LemonSqueezy. The gift code is delivered instantly to the recipient's email.</p>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}