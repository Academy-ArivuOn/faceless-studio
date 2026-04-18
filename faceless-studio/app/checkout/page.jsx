// app/checkout/page.jsx
'use client';
export const dynamic = 'force-dynamic';

import { Suspense } from 'react';
import { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { getSupabaseBrowser } from '@/packages/supabase-browser';

// ── Constants ────────────────────────────────────────────────────────────────
const CURRENCIES = [
  { code: 'INR', symbol: '₹', label: 'Indian Rupee', flag: '🇮🇳' },
  { code: 'USD', symbol: '$', label: 'US Dollar',    flag: '🇺🇸' },
  { code: 'EUR', symbol: '€', label: 'Euro',         flag: '🇪🇺' },
  { code: 'GBP', symbol: '£', label: 'British Pound',flag: '🇬🇧' },
];

const PLANS = {
  pro: {
    name: 'Creator Pro',
    icon: '⚡',
    color: '#C9A227',
    features: [
      'Unlimited generations',
      'All 8 retention agents',
      'All platforms (YouTube + Insta + TikTok)',
      'Full script + hook psychology',
      'Complete generation history',
      '7-day sprint + streak system',
      'Hook Upgrader + Title A/B Battle',
      'Hindi / Tamil / Telugu mode',
    ],
    prices: {
      monthly: { INR: 999,  USD: 11.99, EUR: 10.99, GBP: 9.99  },
      annual:  { INR: 7999, USD: 95.99, EUR: 87.99, GBP: 79.99 },
    },
  },
  studio: {
    name: 'Studio',
    icon: '🏢',
    color: '#4A90D9',
    features: [
      'Everything in Pro',
      'All 13 agents including Pro Power tier',
      '5 team member seats',
      'Bulk generation (full month at once)',
      'Custom brand voice profile',
      'Competitor Autopsy + Viral Decoder',
      'Monetisation Coach agent',
      'White-label export + API access',
    ],
    prices: {
      monthly: { INR: 2499, USD: 29.99, EUR: 27.99, GBP: 24.99 },
      annual:  { INR: 19999,USD: 239.99,EUR: 219.99,GBP: 199.99},
    },
  },
};

// ── Load Razorpay script ────────────────────────────────────────────────────
function loadRazorpay() {
  return new Promise((resolve) => {
    if (window.Razorpay) { resolve(true); return; }
    const script    = document.createElement('script');
    script.src      = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload   = () => resolve(true);
    script.onerror  = () => resolve(false);
    document.body.appendChild(script);
  });
}

// ── Format price ─────────────────────────────────────────────────────────────
function fmt(amount, currency) {
  const sym = { INR: '₹', USD: '$', EUR: '€', GBP: '£' }[currency] || '';
  return `${sym}${amount.toLocaleString()}`;
}

// ── Checkmark ────────────────────────────────────────────────────────────────
function Check({ color = '#C9A227' }) {
  return (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none" style={{ flexShrink: 0, marginTop: 1 }}>
      <circle cx="7.5" cy="7.5" r="7.5" fill={color} fillOpacity="0.15" />
      <path d="M4.5 7.5l2 2 4-4" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// ── Inner component that uses useSearchParams ────────────────────────────────
function CheckoutContent() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const supabase     = getSupabaseBrowser();

  const defaultPlan = searchParams.get('plan') || 'pro';
  const [user,          setUser]          = useState(null);
  const [loading,       setLoading]       = useState(true);
  const [selectedPlan,  setSelectedPlan]  = useState(defaultPlan);
  const [billingCycle,  setBillingCycle]  = useState('monthly');
  const [currency,      setCurrency]      = useState('INR');
  const [processing,    setProcessing]    = useState(false);
  const [step,          setStep]          = useState('plan');  // plan | success | error
  const [successData,   setSuccessData]   = useState(null);
  const [error,         setError]         = useState('');
  const [showCurrency,  setShowCurrency]  = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) { router.replace('/login'); return; }
      setUser(session.user);
      setLoading(false);
    });
  }, []);

  const plan     = PLANS[selectedPlan];
  const price    = plan?.prices?.[billingCycle]?.[currency] || 0;
  const annual   = plan?.prices?.annual?.[currency] || 0;
  const monthly  = plan?.prices?.monthly?.[currency] || 0;
  const savings  = Math.round(((monthly * 12) - annual) / (monthly * 12) * 100);
  const sym      = { INR: '₹', USD: '$', EUR: '€', GBP: '£' }[currency] || '₹';

  // Paise/smallest unit conversion
  const toPaise = (amount) => {
    if (currency === 'INR') return Math.round(amount * 100);
    return Math.round(amount * 100); // all currencies in smallest unit
  };

  const handleCheckout = useCallback(async () => {
    if (!user) return;
    setProcessing(true);
    setError('');

    try {
      const rzLoaded = await loadRazorpay();
      if (!rzLoaded) throw new Error('Payment system failed to load. Please refresh and try again.');

      const { data: { session } } = await supabase.auth.getSession();

      // Create order
      const orderRes = await fetch('/api/payment/create-order', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify({
          plan:         selectedPlan,
          billingCycle,
          currency,
          paymentType: 'subscription',
        }),
      });
      const orderJson = await orderRes.json();
      if (!orderRes.ok || !orderJson.success) throw new Error(orderJson.error || 'Order creation failed');

      // Open Razorpay checkout
      await new Promise((resolve, reject) => {
        const options = {
          key:         orderJson.keyId,
          amount:      orderJson.amount,
          currency,
          order_id:    orderJson.orderId,
          name:        'Studio AI',
          description: `${plan.name} — ${billingCycle === 'annual' ? 'Annual' : 'Monthly'} Plan`,
          image:       '/logo.png',
          handler: async (response) => {
            try {
              const verifyRes = await fetch('/api/payment/verify', {
                method:  'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
                body: JSON.stringify({
                  razorpayOrderId:   response.razorpay_order_id,
                  razorpayPaymentId: response.razorpay_payment_id,
                  razorpaySignature: response.razorpay_signature,
                  txId:              orderJson.txId,
                }),
              });
              const verifyJson = await verifyRes.json();
              if (!verifyRes.ok || !verifyJson.success) throw new Error(verifyJson.error || 'Verification failed');
              setSuccessData({ plan: selectedPlan, billingCycle, currency, amount: price, paymentId: response.razorpay_payment_id });
              setStep('success');
              resolve();
            } catch (e) {
              reject(e);
            }
          },
          prefill: {
            email: user.email,
            name:  user.user_metadata?.full_name || '',
          },
          notes: { platform: 'Studio AI', plan: selectedPlan },
          theme: {
            color: '#C9A227',
            backdrop_color: 'rgba(7,7,14,0.85)',
          },
          modal: {
            ondismiss: () => { setProcessing(false); resolve(); },
            animation: true,
          },
          // 2026 Razorpay config
          config: {
            display: {
              blocks: {
                utib: { name: 'Pay via UPI', instruments: [{ method: 'upi' }] },
                other: { name: 'Other Payment Modes', instruments: [
                  { method: 'card' },
                  { method: 'netbanking' },
                  { method: 'wallet' },
                ] },
              },
              sequence: ['block.utib', 'block.other'],
              preferences: { show_default_blocks: false },
            },
          },
        };
        const rzp = new window.Razorpay(options);
        rzp.on('payment.failed', (resp) => {
          setError(resp.error?.description || 'Payment failed. Please try again.');
          setStep('error');
          setProcessing(false);
          reject(new Error(resp.error?.description));
        });
        rzp.open();
      });

    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.');
      setProcessing(false);
      if (err.message && !err.message.includes('dismissed')) setStep('error');
    }
  }, [user, selectedPlan, billingCycle, currency, price, plan]);

  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#07070E', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: 28, height: 28, borderRadius: '50%', border: '2px solid rgba(212,168,71,0.3)', borderTopColor: '#D4A847', animation: 'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  // ── SUCCESS ──────────────────────────────────────────────────────────────
  if (step === 'success') return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@400;500;600&family=Space+Mono:wght@400;700&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes rise { from { opacity:0; transform:translateY(24px); } to { opacity:1; transform:translateY(0); } }
        @keyframes pop  { 0%{transform:scale(0.7);opacity:0} 70%{transform:scale(1.05)} 100%{transform:scale(1);opacity:1} }
        body { background: #07070E; }
      `}</style>
      <div style={{ minHeight: '100vh', background: '#07070E', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', fontFamily: "'DM Sans', sans-serif" }}>
        <div style={{ textAlign: 'center', maxWidth: 480, animation: 'rise 0.5s ease both' }}>
          <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'rgba(80,200,120,0.12)', border: '2px solid rgba(80,200,120,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 28px', animation: 'pop 0.6s ease 0.2s both', fontSize: 36 }}>
            ✓
          </div>
          <h1 style={{ fontFamily: "'Syne', sans-serif", fontSize: 32, fontWeight: 800, color: '#EEEEF5', marginBottom: 12, letterSpacing: '-0.03em' }}>
            You're on {PLANS[successData?.plan]?.name}!
          </h1>
          <p style={{ fontSize: 14, color: 'rgba(238,238,245,0.55)', lineHeight: 1.7, marginBottom: 32 }}>
            Payment of {sym}{successData?.amount?.toLocaleString()} confirmed. Your plan is now active — all agents are unlocked.
          </p>
          <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, padding: '16px 20px', marginBottom: 28, textAlign: 'left' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              <span style={{ fontSize: 12, color: 'rgba(238,238,245,0.4)', fontFamily: "'Space Mono', monospace", textTransform: 'uppercase', letterSpacing: '0.05em' }}>Plan</span>
              <span style={{ fontSize: 13, color: '#EEEEF5', fontWeight: 600 }}>{PLANS[successData?.plan]?.name}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              <span style={{ fontSize: 12, color: 'rgba(238,238,245,0.4)', fontFamily: "'Space Mono', monospace", textTransform: 'uppercase', letterSpacing: '0.05em' }}>Billing</span>
              <span style={{ fontSize: 13, color: '#EEEEF5', fontWeight: 600, textTransform: 'capitalize' }}>{successData?.billingCycle}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0' }}>
              <span style={{ fontSize: 12, color: 'rgba(238,238,245,0.4)', fontFamily: "'Space Mono', monospace", textTransform: 'uppercase', letterSpacing: '0.05em' }}>Payment ID</span>
              <span style={{ fontSize: 11, color: 'rgba(238,238,245,0.5)', fontFamily: "'Space Mono', monospace" }}>{successData?.paymentId?.slice(0, 20)}…</span>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={() => router.push('/generate')} style={{ flex: 1, padding: '14px', background: '#C9A227', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 700, color: '#07070E', cursor: 'pointer', fontFamily: "'Syne', sans-serif" }}>
              Start Creating →
            </button>
            <button onClick={() => router.push('/profile')} style={{ padding: '14px 20px', background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, fontSize: 13, color: 'rgba(238,238,245,0.6)', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}>
              View Receipt
            </button>
          </div>
        </div>
      </div>
    </>
  );

  // ── MAIN CHECKOUT ─────────────────────────────────────────────────────────
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@600;700;800&family=DM+Sans:wght@400;500;600;700&family=Space+Mono:wght@400;700&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        @keyframes spin  { to { transform: rotate(360deg); } }
        @keyframes slide { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } }
        body { background: #07070E; }

        .ck-root { min-height: 100vh; background: #07070E; font-family: 'DM Sans', sans-serif; color: #EEEEF5; }

        /* Topbar */
        .ck-bar { height: 60px; border-bottom: 1px solid rgba(255,255,255,0.06); display: flex; align-items: center; justify-content: space-between; padding: 0 32px; }
        .ck-bar-logo { display: flex; align-items: center; gap: 10px; }
        .ck-bar-mark { width: 30px; height: 30px; background: rgba(212,168,71,0.15); border: 1px solid rgba(212,168,71,0.3); border-radius: 8px; display: flex; align-items: center; justify-content: center; }
        .ck-bar-brand { font-family: 'Syne', sans-serif; font-size: 15px; font-weight: 700; color: #EEEEF5; }
        .ck-bar-step  { font-family: 'Space Mono', monospace; font-size: 10px; color: rgba(238,238,245,0.35); text-transform: uppercase; letter-spacing: 0.1em; }
        .ck-bar-back  { background: none; border: 1px solid rgba(255,255,255,0.08); border-radius: 7px; padding: 7px 14px; font-size: 13px; color: rgba(238,238,245,0.55); cursor: pointer; font-family: 'DM Sans', sans-serif; transition: all 0.2s; }
        .ck-bar-back:hover { border-color: rgba(255,255,255,0.2); color: #EEEEF5; }

        /* Grid */
        .ck-body { max-width: 1060px; margin: 0 auto; padding: 48px 24px 80px; display: grid; grid-template-columns: 1fr 380px; gap: 40px; align-items: start; }

        /* Left */
        .ck-left { display: flex; flex-direction: column; gap: 28px; animation: slide 0.4s ease both; }
        .ck-eyebrow { font-family: 'Space Mono', monospace; font-size: 10px; color: rgba(238,238,245,0.35); text-transform: uppercase; letter-spacing: 0.12em; margin-bottom: 8px; }
        .ck-title { font-family: 'Syne', sans-serif; font-size: 28px; font-weight: 800; color: #EEEEF5; letter-spacing: -0.03em; line-height: 1.2; }
        .ck-title span { background: linear-gradient(135deg, #D4A847, #E8CA70); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }

        /* Card */
        .ck-card { background: rgba(255,255,255,0.025); border: 1px solid rgba(255,255,255,0.07); border-radius: 14px; padding: 24px; }
        .ck-card-title { font-family: 'Syne', sans-serif; font-size: 13px; font-weight: 700; color: rgba(238,238,245,0.5); text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 16px; }

        /* Plan tabs */
        .ck-plan-tabs { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
        .ck-plan-tab  { padding: 16px; border: 1.5px solid rgba(255,255,255,0.07); border-radius: 10px; cursor: pointer; transition: all 0.25s; background: rgba(255,255,255,0.02); position: relative; }
        .ck-plan-tab:hover { border-color: rgba(212,168,71,0.3); background: rgba(212,168,71,0.04); }
        .ck-plan-tab.active { border-color: rgba(212,168,71,0.5); background: rgba(212,168,71,0.07); }
        .ck-plan-name  { font-family: 'Syne', sans-serif; font-size: 15px; font-weight: 700; color: #EEEEF5; margin-bottom: 4px; display: flex; align-items: center; gap: 8px; }
        .ck-plan-price { font-family: 'Syne', sans-serif; font-size: 24px; font-weight: 800; color: #D4A847; letter-spacing: -0.03em; }
        .ck-plan-period{ font-size: 12px; color: rgba(238,238,245,0.4); }
        .ck-plan-radio  { position: absolute; top: 14px; right: 14px; width: 18px; height: 18px; border-radius: 50%; border: 1.5px solid rgba(255,255,255,0.15); display: flex; align-items: center; justify-content: center; transition: all 0.2s; }
        .ck-plan-tab.active .ck-plan-radio { border-color: #D4A847; background: #D4A847; }

        /* Billing toggle */
        .ck-billing-row { display: flex; gap: 6px; }
        .ck-billing-btn { flex: 1; padding: 12px; border: 1.5px solid rgba(255,255,255,0.07); border-radius: 9px; background: rgba(255,255,255,0.02); cursor: pointer; transition: all 0.2s; position: relative; }
        .ck-billing-btn.active { border-color: rgba(212,168,71,0.5); background: rgba(212,168,71,0.07); }
        .ck-billing-label { font-family: 'Syne', sans-serif; font-size: 13px; font-weight: 700; color: rgba(238,238,245,0.7); display: block; }
        .ck-billing-btn.active .ck-billing-label { color: #EEEEF5; }
        .ck-billing-save { display: inline-block; margin-top: 4px; padding: '2px 7px'; background: rgba(80,200,120,0.15); border-radius: 4px; font-size: 10px; font-weight: 700; color: #50C878; font-family: 'Space Mono', monospace; text-transform: uppercase; letter-spacing: 0.05em; padding: 2px 7px; }

        /* Currency select */
        .ck-currency-wrap { position: relative; }
        .ck-currency-btn  { width: 100%; padding: 12px 16px; border: 1.5px solid rgba(255,255,255,0.07); border-radius: 9px; background: rgba(255,255,255,0.02); cursor: pointer; display: flex; align-items: center; gap: 10px; transition: border-color 0.2s; }
        .ck-currency-btn:hover { border-color: rgba(212,168,71,0.3); }
        .ck-currency-btn.open { border-color: rgba(212,168,71,0.5); }
        .ck-currency-flag { font-size: 18px; }
        .ck-currency-label { flex: 1; text-align: left; }
        .ck-currency-code { font-family: 'Syne', sans-serif; font-size: 13px; font-weight: 700; color: #EEEEF5; }
        .ck-currency-name { font-size: 11px; color: rgba(238,238,245,0.4); }
        .ck-currency-arrow { font-size: 10px; color: rgba(238,238,245,0.3); transition: transform 0.2s; }
        .ck-currency-btn.open .ck-currency-arrow { transform: rotate(180deg); }
        .ck-currency-dropdown { position: absolute; top: calc(100% + 6px); left: 0; right: 0; background: #10101A; border: 1px solid rgba(255,255,255,0.1); border-radius: 10px; overflow: hidden; z-index: 50; }
        .ck-currency-option { width: 100%; padding: 12px 16px; border: none; background: transparent; cursor: pointer; display: flex; align-items: center; gap: 10px; transition: background 0.15s; }
        .ck-currency-option:hover { background: rgba(212,168,71,0.08); }
        .ck-currency-option.selected { background: rgba(212,168,71,0.1); }

        /* Feature list */
        .ck-features { display: flex; flex-direction: column; gap: 8px; }
        .ck-feature { display: flex; align-items: flex-start; gap: 10px; font-size: 13px; color: rgba(238,238,245,0.75); line-height: 1.45; }

        /* Right */
        .ck-right { position: sticky; top: 24px; animation: slide 0.4s ease 0.1s both; }

        /* Summary card */
        .ck-summary { background: rgba(255,255,255,0.025); border: 1px solid rgba(255,255,255,0.07); border-radius: 16px; overflow: hidden; }
        .ck-summary-head { padding: 20px 24px; border-bottom: 1px solid rgba(255,255,255,0.06); background: rgba(212,168,71,0.04); }
        .ck-summary-plan { font-family: 'Syne', sans-serif; font-size: 18px; font-weight: 800; color: #EEEEF5; margin-bottom: 4px; }
        .ck-summary-cycle { font-size: 12px; color: rgba(238,238,245,0.4); font-family: 'Space Mono', monospace; text-transform: uppercase; letter-spacing: 0.06em; }
        .ck-summary-body { padding: 20px 24px; display: flex; flex-direction: column; gap: 10px; }
        .ck-summary-row { display: flex; justify-content: space-between; align-items: baseline; }
        .ck-summary-key { font-size: 13px; color: rgba(238,238,245,0.5); }
        .ck-summary-val { font-size: 13px; font-weight: 600; color: #EEEEF5; }
        .ck-summary-divider { height: 1px; background: rgba(255,255,255,0.06); }
        .ck-summary-total { padding: 16px 24px; background: rgba(212,168,71,0.06); border-top: 1px solid rgba(212,168,71,0.12); display: flex; justify-content: space-between; align-items: baseline; }
        .ck-summary-total-label { font-size: 13px; color: rgba(238,238,245,0.6); }
        .ck-summary-total-amount { font-family: 'Syne', sans-serif; font-size: 28px; font-weight: 800; color: #D4A847; letter-spacing: -0.04em; }
        .ck-summary-total-cycle { font-size: 12px; color: rgba(238,238,245,0.4); }

        /* CTA */
        .ck-cta-wrap { padding: 20px 24px; border-top: 1px solid rgba(255,255,255,0.06); }
        .ck-cta { width: 100%; padding: 16px; background: linear-gradient(135deg, #D4A847, #C9A227); border: none; border-radius: 11px; font-family: 'Syne', sans-serif; font-size: 15px; font-weight: 800; color: #07070E; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 10px; transition: all 0.25s; letter-spacing: -0.01em; }
        .ck-cta:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 10px 32px rgba(212,168,71,0.35); }
        .ck-cta:disabled { opacity: 0.5; cursor: not-allowed; }
        .ck-cta-sub { text-align: center; margin-top: 12px; font-size: 11px; color: rgba(238,238,245,0.3); line-height: 1.6; }
        .ck-cta-sub a { color: rgba(238,238,245,0.5); text-decoration: underline; text-underline-offset: 2px; }

        /* Trust badges */
        .ck-trust { display: flex; justify-content: center; gap: 20px; padding: 16px 24px; border-top: 1px solid rgba(255,255,255,0.04); }
        .ck-trust-item { display: flex; align-items: center; gap: 5px; font-size: 10px; color: rgba(238,238,245,0.3); font-family: 'Space Mono', monospace; }

        /* Error */
        .ck-error { background: rgba(248,113,113,0.08); border: 1px solid rgba(248,113,113,0.2); border-radius: 10px; padding: 14px 16px; font-size: 13px; color: #F87171; display: flex; gap: 8px; align-items: flex-start; }

        @media (max-width: 768px) {
          .ck-body { grid-template-columns: 1fr; padding: 24px 16px 60px; }
          .ck-right { position: static; }
          .ck-bar { padding: 0 16px; }
        }
      `}</style>

      <div className="ck-root">
        {/* Topbar */}
        <header className="ck-bar">
          <div className="ck-bar-logo">
            <div className="ck-bar-mark">
              <svg width="14" height="14" viewBox="0 0 20 20" fill="none">
                <polygon points="10,2 17,6 17,14 10,18 3,14 3,6" stroke="#D4A847" strokeWidth="1.5" fill="none"/>
                <polygon points="10,6 14,8.5 14,13.5 10,16 6,13.5 6,8.5" fill="#D4A847" fillOpacity="0.3"/>
              </svg>
            </div>
            <span className="ck-bar-brand">Studio AI</span>
            <span className="ck-bar-step" style={{ marginLeft: 8 }}>/ Checkout</span>
          </div>
          <button className="ck-bar-back" onClick={() => router.push('/#pricing')}>← Back to Pricing</button>
        </header>

        <div className="ck-body">
          {/* ── LEFT ── */}
          <div className="ck-left">
            <div>
              <p className="ck-eyebrow">Upgrade your plan</p>
              <h1 className="ck-title">Unlock your <span>content OS</span></h1>
            </div>

            {/* Plan selector */}
            <div className="ck-card">
              <p className="ck-card-title">Choose Plan</p>
              <div className="ck-plan-tabs">
                {Object.entries(PLANS).map(([key, p]) => (
                  <div
                    key={key}
                    className={`ck-plan-tab ${selectedPlan === key ? 'active' : ''}`}
                    onClick={() => setSelectedPlan(key)}
                  >
                    <div className="ck-plan-radio">
                      {selectedPlan === key && (
                        <svg width="8" height="8" viewBox="0 0 8 8"><circle cx="4" cy="4" r="3" fill="#07070E"/></svg>
                      )}
                    </div>
                    <div className="ck-plan-name">
                      <span>{p.icon}</span>{p.name}
                    </div>
                    <div className="ck-plan-price">
                      {sym}{p.prices[billingCycle][currency]?.toLocaleString()}
                      <span className="ck-plan-period"> /mo</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Billing cycle */}
            <div className="ck-card">
              <p className="ck-card-title">Billing Cycle</p>
              <div className="ck-billing-row">
                <button
                  className={`ck-billing-btn ${billingCycle === 'monthly' ? 'active' : ''}`}
                  onClick={() => setBillingCycle('monthly')}
                >
                  <span className="ck-billing-label">Monthly</span>
                  <span style={{ fontSize: 12, color: 'rgba(238,238,245,0.4)', marginTop: 3, display: 'block' }}>
                    {sym}{plan.prices.monthly[currency]?.toLocaleString()} / month
                  </span>
                </button>
                <button
                  className={`ck-billing-btn ${billingCycle === 'annual' ? 'active' : ''}`}
                  onClick={() => setBillingCycle('annual')}
                >
                  <span className="ck-billing-label">Annual</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 3 }}>
                    <span style={{ fontSize: 12, color: 'rgba(238,238,245,0.4)' }}>
                      {sym}{Math.round(plan.prices.annual[currency] / 12)?.toLocaleString()} / month
                    </span>
                    <span className="ck-billing-save">Save {savings}%</span>
                  </div>
                </button>
              </div>
            </div>

            {/* Currency */}
            <div className="ck-card">
              <p className="ck-card-title">Payment Currency</p>
              <div className="ck-currency-wrap">
                <button
                  className={`ck-currency-btn ${showCurrency ? 'open' : ''}`}
                  onClick={() => setShowCurrency(!showCurrency)}
                >
                  <span className="ck-currency-flag">{CURRENCIES.find(c => c.code === currency)?.flag}</span>
                  <div className="ck-currency-label">
                    <div className="ck-currency-code">{currency}</div>
                    <div className="ck-currency-name">{CURRENCIES.find(c => c.code === currency)?.label}</div>
                  </div>
                  <span className="ck-currency-arrow">▼</span>
                </button>
                {showCurrency && (
                  <div className="ck-currency-dropdown">
                    {CURRENCIES.map(c => (
                      <button
                        key={c.code}
                        className={`ck-currency-option ${currency === c.code ? 'selected' : ''}`}
                        onClick={() => { setCurrency(c.code); setShowCurrency(false); }}
                      >
                        <span style={{ fontSize: 18 }}>{c.flag}</span>
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 700, color: '#EEEEF5', fontFamily: "'Syne', sans-serif" }}>{c.code}</div>
                          <div style={{ fontSize: 11, color: 'rgba(238,238,245,0.4)' }}>{c.label}</div>
                        </div>
                        <span style={{ marginLeft: 'auto', fontSize: 13, color: '#D4A847', fontFamily: "'Syne', sans-serif", fontWeight: 700 }}>
                          {c.symbol}{plan.prices[billingCycle][c.code]?.toLocaleString()}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Features */}
            <div className="ck-card">
              <p className="ck-card-title">What you get</p>
              <div className="ck-features">
                {plan.features.map((f, i) => (
                  <div key={i} className="ck-feature">
                    <Check color={plan.color} />
                    {f}
                  </div>
                ))}
              </div>
            </div>

            {/* Error */}
            {step === 'error' && error && (
              <div className="ck-error">
                <span>⚠</span> {error}
              </div>
            )}
          </div>

          {/* ── RIGHT: Order Summary ── */}
          <div className="ck-right">
            <div className="ck-summary">
              <div className="ck-summary-head">
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <span style={{ fontSize: 20 }}>{plan.icon}</span>
                  <div className="ck-summary-plan">{plan.name}</div>
                </div>
                <div className="ck-summary-cycle">{billingCycle} billing · {currency}</div>
              </div>

              <div className="ck-summary-body">
                <div className="ck-summary-row">
                  <span className="ck-summary-key">Plan</span>
                  <span className="ck-summary-val">{plan.name}</span>
                </div>
                <div className="ck-summary-row">
                  <span className="ck-summary-key">Billing</span>
                  <span className="ck-summary-val" style={{ textTransform: 'capitalize' }}>{billingCycle}</span>
                </div>
                {billingCycle === 'annual' && (
                  <div className="ck-summary-row">
                    <span className="ck-summary-key">You save</span>
                    <span className="ck-summary-val" style={{ color: '#50C878' }}>
                      {sym}{((plan.prices.monthly[currency] * 12) - plan.prices.annual[currency]).toLocaleString()}
                    </span>
                  </div>
                )}
                <div className="ck-summary-divider" />
                <div className="ck-summary-row">
                  <span className="ck-summary-key">Agents unlocked</span>
                  <span className="ck-summary-val">{selectedPlan === 'pro' ? '8' : '13'}</span>
                </div>
                <div className="ck-summary-row">
                  <span className="ck-summary-key">Generations</span>
                  <span className="ck-summary-val">Unlimited</span>
                </div>
              </div>

              <div className="ck-summary-total">
                <span className="ck-summary-total-label">Due today</span>
                <div style={{ textAlign: 'right' }}>
                  <div className="ck-summary-total-amount">{sym}{price?.toLocaleString()}</div>
                  {billingCycle === 'annual' && (
                    <div style={{ fontSize: 11, color: 'rgba(238,238,245,0.35)', marginTop: 2, fontFamily: "'Space Mono', monospace" }}>
                      {sym}{Math.round(price / 12)?.toLocaleString()} / month
                    </div>
                  )}
                </div>
              </div>

              <div className="ck-cta-wrap">
                <button className="ck-cta" onClick={handleCheckout} disabled={processing}>
                  {processing ? (
                    <><span style={{ width: 16, height: 16, borderRadius: '50%', border: '2.5px solid rgba(7,7,14,0.3)', borderTopColor: '#07070E', animation: 'spin 0.7s linear infinite', display: 'inline-block' }} />Processing…</>
                  ) : (
                    <>Pay {sym}{price?.toLocaleString()} →</>
                  )}
                </button>
                <p className="ck-cta-sub">
                  Secure payment via Razorpay · UPI, Cards, NetBanking, Wallets accepted<br/>
                  <a href="/privacy">Privacy Policy</a> · <a href="/terms">Terms of Service</a> · Cancel anytime
                </p>
              </div>

              <div className="ck-trust">
                <div className="ck-trust-item">🔒 256-bit SSL</div>
                <div className="ck-trust-item">🏦 RBI Compliant</div>
                <div className="ck-trust-item">✓ PCI DSS</div>
              </div>
            </div>

            {/* Razorpay badge */}
            <div style={{ textAlign: 'center', marginTop: 16 }}>
              <span style={{ fontSize: 11, color: 'rgba(238,238,245,0.2)', fontFamily: "'Space Mono', monospace" }}>
                Payments powered by Razorpay
              </span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

// ── Main export with Suspense boundary ───────────────────────────────────────
export default function CheckoutPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: '100vh', background: '#07070E', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: 28, height: 28, borderRadius: '50%', border: '2px solid rgba(212,168,71,0.3)', borderTopColor: '#D4A847', animation: 'spin 0.8s linear infinite' }} />
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    }>
      <CheckoutContent />
    </Suspense>
  );
}