'use client';
import { useState, useEffect } from 'react';

const STATUS_STYLES = {
  captured: { color: '#50C878', bg: 'rgba(80,200,120,0.1)',  border: 'rgba(80,200,120,0.2)',  label: 'Paid'     },
  created:  { color: '#D4A847', bg: 'rgba(212,168,71,0.1)',  border: 'rgba(212,168,71,0.2)',  label: 'Pending'  },
  failed:   { color: '#F87171', bg: 'rgba(248,113,113,0.1)', border: 'rgba(248,113,113,0.2)', label: 'Failed'   },
  refunded: { color: '#4A90D9', bg: 'rgba(74,144,217,0.1)',  border: 'rgba(74,144,217,0.2)',  label: 'Refunded' },
};

const PLAN_META = {
  pro:    { color: '#D4A847', label: 'Creator Pro', icon: '⚡' },
  studio: { color: '#4A90D9', label: 'Studio',      icon: '🏢' },
  free:   { color: '#8C8C8C', label: 'Free',        icon: '⬡' },
};

const CURRENCY_SYMBOLS = { INR: '₹', USD: '$', EUR: '€', GBP: '£' };

function fmtAmount(amount, currency) {
  const sym   = CURRENCY_SYMBOLS[currency] || '₹';
  const value = currency === 'INR'
    ? (amount / 100).toLocaleString('en-IN')
    : (amount / 100).toFixed(2);
  return `${sym}${value}`;
}

function fmtDate(dateStr) {
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric',
  });
}

function TxRow({ tx }) {
  const [open, setOpen] = useState(false);
  const status  = STATUS_STYLES[tx.status] || STATUS_STYLES.created;
  const planMeta = PLAN_META[tx.plan] || PLAN_META.free;

  return (
    <div style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
      {/* Row */}
      <div
        onClick={() => setOpen(!open)}
        style={{ display: 'grid', gridTemplateColumns: '1fr 110px 100px 90px 32px', gap: 12, padding: '14px 20px', cursor: 'pointer', transition: 'background 0.15s', alignItems: 'center' }}
        onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
      >
        {/* Description */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 3 }}>
            <span style={{ fontSize: 13 }}>{planMeta.icon}</span>
            <span style={{ fontSize: 13, fontWeight: 600, color: '#EEEEF5', fontFamily: "'DM Sans', sans-serif" }}>
              {tx.payment_type === 'gift'
                ? `Gift — ${planMeta.label}`
                : `${planMeta.label} · ${tx.billing_cycle === 'annual' ? 'Annual' : 'Monthly'}`}
            </span>
          </div>
          <div style={{ fontSize: 11, color: 'rgba(238,238,245,0.35)', fontFamily: "'Space Mono', monospace" }}>
            {fmtDate(tx.created_at)} · {tx.razorpay_order_id?.slice(-12) || '—'}
          </div>
        </div>

        {/* Payment method */}
        <div style={{ fontSize: 11, color: 'rgba(238,238,245,0.4)', fontFamily: "'Space Mono', monospace", textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          {tx.payment_method || '—'}
        </div>

        {/* Amount */}
        <div style={{ fontFamily: "'Syne', 'DM Sans', sans-serif", fontSize: 14, fontWeight: 700, color: '#EEEEF5', textAlign: 'right' }}>
          {fmtAmount(tx.amount, tx.currency)}
        </div>

        {/* Status */}
        <div>
          <span style={{ display: 'inline-flex', padding: '3px 9px', borderRadius: 5, fontSize: 10, fontWeight: 700, fontFamily: "'Space Mono', monospace", textTransform: 'uppercase', letterSpacing: '0.05em', background: status.bg, border: `1px solid ${status.border}`, color: status.color }}>
            {status.label}
          </span>
        </div>

        {/* Chevron */}
        <span style={{ fontSize: 10, color: 'rgba(238,238,245,0.25)', transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', textAlign: 'right' }}>▼</span>
      </div>

      {/* Expanded detail */}
      {open && (
        <div style={{ padding: '0 20px 16px', background: 'rgba(255,255,255,0.015)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12, paddingTop: 12, borderTop: '1px solid rgba(255,255,255,0.05)' }}>
            {[
              ['Razorpay Order',   tx.razorpay_order_id   || '—'],
              ['Payment ID',       tx.razorpay_payment_id  || '—'],
              ['Currency',         tx.currency             || '—'],
              ['Type',             tx.payment_type         || '—'],
              ...(tx.payment_type === 'gift' ? [
                ['Recipient',      tx.gift_recipient_email || '—'],
                ['Gift Code',      tx.gift_code            || '—'],
                ['Duration',       `${tx.gift_duration_months || '?'} month(s)`],
              ] : [
                ['Billing Cycle',  tx.billing_cycle        || '—'],
              ]),
            ].map(([k, v]) => (
              <div key={k}>
                <div style={{ fontSize: 9, color: 'rgba(238,238,245,0.3)', fontFamily: "'Space Mono', monospace", textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>{k}</div>
                <div style={{ fontSize: 12, color: 'rgba(238,238,245,0.7)', fontFamily: "'Space Mono', monospace", wordBreak: 'break-all' }}>{v}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function TransactionsPanel({ session }) {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab,     setTab]     = useState('transactions'); // transactions | subscription | gifts

  useEffect(() => {
    if (!session?.access_token) return;
    fetch('/api/payment/transactions', {
      headers: { Authorization: `Bearer ${session.access_token}` },
    })
      .then(r => r.json())
      .then(json => { if (json.success) setData(json); })
      .finally(() => setLoading(false));
  }, [session?.access_token]);

  if (loading) return (
    <div style={{ padding: '40px', textAlign: 'center' }}>
      <div style={{ width: 24, height: 24, borderRadius: '50%', border: '2px solid rgba(238,238,245,0.1)', borderTopColor: '#D4A847', animation: 'spin 0.8s linear infinite', margin: '0 auto' }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  const txs  = data?.transactions  || [];
  const sub  = data?.subscription  || null;
  const gifts= data?.giftsSent     || [];

  const successfulTxs = txs.filter(t => t.status === 'captured');
  const totalSpend    = successfulTxs.reduce((sum, t) => {
    // Convert all to INR equivalent for display
    const rates = { INR: 1, USD: 84, EUR: 91, GBP: 107 };
    return sum + (t.amount / 100) * (rates[t.currency] || 1);
  }, 0);

  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif" }}>
      {/* Stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginBottom: 24 }}>
        {[
          { label: 'Total Transactions', value: txs.length },
          { label: 'Successful Payments', value: successfulTxs.length },
          { label: 'Total Spent (est. INR)', value: `₹${Math.round(totalSpend).toLocaleString('en-IN')}` },
        ].map(({ label, value }) => (
          <div key={label} style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 10, padding: '16px 18px' }}>
            <div style={{ fontSize: 10, color: 'rgba(238,238,245,0.35)', fontFamily: "'Space Mono', monospace", textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>{label}</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: '#EEEEF5', fontFamily: "'Syne', 'DM Sans', sans-serif", letterSpacing: '-0.02em' }}>{value}</div>
          </div>
        ))}
      </div>

      {/* Sub tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 20, borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: 0 }}>
        {[
          { id: 'transactions', label: `Transactions (${txs.length})` },
          { id: 'subscription', label: 'Subscription' },
          { id: 'gifts',        label: `Gifts Sent (${gifts.length})` },
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            style={{ padding: '10px 16px', background: 'none', border: 'none', borderBottom: `2px solid ${tab === t.id ? '#D4A847' : 'transparent'}`, cursor: 'pointer', fontSize: 13, fontWeight: tab === t.id ? 700 : 500, color: tab === t.id ? '#D4A847' : 'rgba(238,238,245,0.45)', fontFamily: "'DM Sans', sans-serif", marginBottom: -1, transition: 'all 0.2s' }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Transactions tab */}
      {tab === 'transactions' && (
        txs.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px 24px', color: 'rgba(238,238,245,0.3)', fontSize: 14, fontFamily: "'DM Sans', sans-serif" }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>💳</div>
            No transactions yet. <button onClick={() => window.location.href = '/checkout'} style={{ background: 'none', border: 'none', color: '#D4A847', cursor: 'pointer', fontSize: 14, textDecoration: 'underline', textUnderlineOffset: 2 }}>Upgrade your plan</button>
          </div>
        ) : (
          <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, overflow: 'hidden' }}>
            {/* Table header */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 110px 100px 90px 32px', gap: 12, padding: '10px 20px', background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              {['Description', 'Method', 'Amount', 'Status', ''].map((h, i) => (
                <div key={i} style={{ fontSize: 9, fontWeight: 700, color: 'rgba(238,238,245,0.3)', fontFamily: "'Space Mono', monospace", textTransform: 'uppercase', letterSpacing: '0.08em', textAlign: i === 2 ? 'right' : 'left' }}>{h}</div>
              ))}
            </div>
            {txs.map(tx => <TxRow key={tx.id} tx={tx} />)}
          </div>
        )
      )}

      {/* Subscription tab */}
      {tab === 'subscription' && (
        <div>
          {sub ? (
            <div style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, overflow: 'hidden' }}>
              <div style={{ padding: '20px 24px', background: 'rgba(212,168,71,0.04)', borderBottom: '1px solid rgba(212,168,71,0.12)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 22 }}>{PLAN_META[sub.plan]?.icon || '⬡'}</span>
                  <div>
                    <div style={{ fontFamily: "'Syne', 'DM Sans', sans-serif", fontSize: 18, fontWeight: 800, color: '#EEEEF5' }}>{PLAN_META[sub.plan]?.label || sub.plan} Plan</div>
                    <div style={{ fontSize: 11, color: 'rgba(238,238,245,0.4)', fontFamily: "'Space Mono', monospace", textTransform: 'uppercase', letterSpacing: '0.06em', marginTop: 2, textTransform: 'capitalize' }}>{sub.billing_cycle} · {sub.status}</div>
                  </div>
                  <div style={{ marginLeft: 'auto' }}>
                    <span style={{ padding: '4px 10px', borderRadius: 6, fontSize: 10, fontWeight: 700, fontFamily: "'Space Mono', monospace", textTransform: 'uppercase', letterSpacing: '0.05em', background: sub.status === 'active' ? 'rgba(80,200,120,0.12)' : 'rgba(248,113,113,0.12)', border: `1px solid ${sub.status === 'active' ? 'rgba(80,200,120,0.25)' : 'rgba(248,113,113,0.25)'}`, color: sub.status === 'active' ? '#50C878' : '#F87171' }}>
                      {sub.status}
                    </span>
                  </div>
                </div>
              </div>
              <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                {[
                  ['Period Start',  sub.current_period_start  ? fmtDate(sub.current_period_start)  : '—'],
                  ['Period End',    sub.current_period_end    ? fmtDate(sub.current_period_end)    : '—'],
                  ['Plan ID',       sub.razorpay_plan_id      || '—'],
                  ['Subscription ID',sub.razorpay_subscription_id || 'Manual payment'],
                ].map(([k, v]) => (
                  <div key={k} style={{ display: 'flex', gap: 16, padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                    <span style={{ fontSize: 11, color: 'rgba(238,238,245,0.35)', minWidth: 120, fontFamily: "'Space Mono', monospace", textTransform: 'uppercase', letterSpacing: '0.06em' }}>{k}</span>
                    <span style={{ fontSize: 13, color: 'rgba(238,238,245,0.7)' }}>{v}</span>
                  </div>
                ))}
              </div>
              {sub.status === 'active' && (
                <div style={{ padding: '16px 24px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                  <button onClick={() => window.location.href = '/checkout'} style={{ padding: '10px 20px', background: 'linear-gradient(135deg,#D4A847,#C9A227)', border: 'none', borderRadius: 8, fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 700, color: '#07070E', cursor: 'pointer' }}>
                    Upgrade / Change Plan →
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '48px 24px' }}>
              <div style={{ fontSize: 32, marginBottom: 12 }}>📋</div>
              <p style={{ fontSize: 14, color: 'rgba(238,238,245,0.4)', marginBottom: 20 }}>You're on the Free plan.</p>
              <button onClick={() => window.location.href = '/checkout'} style={{ padding: '12px 24px', background: 'linear-gradient(135deg,#D4A847,#C9A227)', border: 'none', borderRadius: 9, fontFamily: "'DM Sans', sans-serif", fontSize: 14, fontWeight: 700, color: '#07070E', cursor: 'pointer' }}>
                Upgrade to Pro →
              </button>
            </div>
          )}
        </div>
      )}

      {/* Gifts tab */}
      {tab === 'gifts' && (
        gifts.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px 24px', color: 'rgba(238,238,245,0.3)', fontSize: 14 }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>🎁</div>
            No gifts sent yet. <button onClick={() => window.location.href = '/checkout/gift'} style={{ background: 'none', border: 'none', color: '#D4A847', cursor: 'pointer', fontSize: 14, textDecoration: 'underline', textUnderlineOffset: 2 }}>Send a gift</button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {gifts.map(g => {
              const pm = PLAN_META[g.plan] || PLAN_META.free;
              const isRedeemed = g.status === 'redeemed';
              return (
                <div key={g.id} style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, padding: '16px 20px' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 5 }}>
                        <span style={{ fontSize: 14 }}>{pm.icon}</span>
                        <span style={{ fontFamily: "'Syne', 'DM Sans', sans-serif", fontSize: 14, fontWeight: 700, color: '#EEEEF5' }}>{pm.label} Gift · {g.duration_months} Month{g.duration_months > 1 ? 's' : ''}</span>
                      </div>
                      <div style={{ fontSize: 12, color: 'rgba(238,238,245,0.45)' }}>To: {g.recipient_name} ({g.recipient_email})</div>
                      <div style={{ fontSize: 11, color: 'rgba(238,238,245,0.3)', fontFamily: "'Space Mono', monospace", marginTop: 4 }}>Code: {g.code} · {fmtDate(g.created_at)}</div>
                    </div>
                    <span style={{ padding: '4px 10px', borderRadius: 6, fontSize: 10, fontWeight: 700, fontFamily: "'Space Mono', monospace", textTransform: 'uppercase', letterSpacing: '0.05em', background: isRedeemed ? 'rgba(80,200,120,0.12)' : 'rgba(212,168,71,0.1)', border: `1px solid ${isRedeemed ? 'rgba(80,200,120,0.25)' : 'rgba(212,168,71,0.2)'}`, color: isRedeemed ? '#50C878' : '#D4A847', flexShrink: 0 }}>
                      {isRedeemed ? 'Redeemed' : g.status}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )
      )}
    </div>
  );
}