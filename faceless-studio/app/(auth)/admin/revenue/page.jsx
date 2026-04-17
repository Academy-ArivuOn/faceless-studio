'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getSupabaseBrowser } from '@/packages/supabase-browser';
import AdminShell from '@/components/admin/AdminShell';

const PLAN_PRICES = { pro: 999, studio: 2499 };
const fmtINR  = n => `₹${Number(n).toLocaleString('en-IN')}`;
const fmtLakh = n => n >= 100000 ? `₹${(n / 100000).toFixed(2)}L` : fmtINR(n);

const STATUS_BADGE = {
  captured: { bg: '#F0FDF4', color: '#16A34A', border: '#BBF7D0', label: 'Paid'     },
  created:  { bg: '#FFFBEB', color: '#B45309', border: '#FDE68A', label: 'Pending'  },
  failed:   { bg: '#FEF2F2', color: '#DC2626', border: '#FECACA', label: 'Failed'   },
  refunded: { bg: '#EFF6FF', color: '#1D4ED8', border: '#BFDBFE', label: 'Refunded' },
};

function RevenueKPI({ label, value, sub, highlight = false }) {
  return (
    <div style={{ background: '#FFFFFF', border: `1px solid ${highlight ? '#FDE68A' : '#E4E4E7'}`, borderRadius: 10, padding: '18px 20px', borderTop: highlight ? '2px solid #C9A227' : '1px solid #E4E4E7' }}>
      <p style={{ fontSize: 11, fontWeight: 600, color: '#71717A', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8 }}>{label}</p>
      <p style={{ fontSize: 28, fontWeight: 800, color: highlight ? '#92400E' : '#09090B', letterSpacing: '-0.04em', lineHeight: 1, marginBottom: 5 }}>{value}</p>
      {sub && <p style={{ fontSize: 12, color: '#A1A1AA', fontWeight: 500 }}>{sub}</p>}
    </div>
  );
}

export default function AdminRevenuePage() {
  const router   = useRouter();
  const supabase = getSupabaseBrowser();

  const [admin,       setAdmin]       = useState(null);
  const [pageLoading, setPageLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);

  // Revenue from plans (calculated)
  const [planCounts,    setPlanCounts]    = useState({ free: 0, pro: 0, studio: 0 });
  const [totalUsers,    setTotalUsers]    = useState(0);

  // Transactions from DB
  const [transactions,  setTransactions]  = useState([]);
  const [subscriptions, setSubscriptions] = useState([]);
  const [giftCodes,     setGiftCodes]     = useState([]);

  // Derived
  const [revenueFromTx, setRevenueFromTx] = useState({ total: 0, inr: 0 });

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.replace('/admin/login'); return; }
      const { data: adm } = await supabase.from('admins').select('id,name,role,email').eq('user_id', session.user.id).single();
      if (!adm) { await supabase.auth.signOut(); router.replace('/admin/login'); return; }
      setAdmin(adm);
      await fetchData();
      setPageLoading(false);
    })();
  }, []);

  async function fetchData() {
    const now       = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

    const [usageRes, totalRes, txRes, subRes, giftRes] = await Promise.all([
      supabase.from('user_usage').select('user_id, plan, plan_activated_at'),
      supabase.from('profiles').select('*', { count: 'exact', head: true }),
      supabase.from('transactions').select('id,user_id,plan,billing_cycle,amount,currency,status,payment_type,payment_method,gift_recipient_email,gift_duration_months,created_at,razorpay_payment_id,razorpay_order_id').order('created_at', { ascending: false }).limit(100),
      supabase.from('subscriptions').select('user_id,plan,billing_cycle,status,current_period_start,current_period_end').order('current_period_start', { ascending: false }).limit(50),
      supabase.from('gift_codes').select('id,code,sender_user_id,recipient_email,plan,duration_months,status,created_at,expires_at,redeemed_at').order('created_at', { ascending: false }).limit(30),
    ]);

    // Plan counts
    const counts = { free: 0, pro: 0, studio: 0 };
    (usageRes.data || []).forEach(r => { if (r.plan in counts) counts[r.plan]++; });
    setPlanCounts(counts);
    setTotalUsers(totalRes.count || 0);

    // Enrich transactions with emails
    if (txRes.data && txRes.data.length > 0) {
      const ids = [...new Set(txRes.data.map(t => t.user_id).filter(Boolean))];
      const { data: profiles } = await supabase.from('profiles').select('id,email,full_name').in('id', ids.slice(0, 200));
      const pm = {}; (profiles || []).forEach(p => { pm[p.id] = p; });
      const enriched = txRes.data.map(t => ({ ...t, email: pm[t.user_id]?.email || '—', full_name: pm[t.user_id]?.full_name || null }));
      setTransactions(enriched);

      // Revenue from captured transactions
      const captured = enriched.filter(t => t.status === 'captured');
      const totalINR = captured.reduce((s, t) => {
        const rates = { INR: 1, USD: 84, EUR: 91, GBP: 107 };
        return s + ((t.amount || 0) / 100) * (rates[t.currency] || 1);
      }, 0);
      setRevenueFromTx({ total: captured.length, inr: Math.round(totalINR) });
    }

    // Enrich subscriptions with emails
    if (subRes.data && subRes.data.length > 0) {
      const ids = [...new Set(subRes.data.map(s => s.user_id).filter(Boolean))];
      const { data: profiles } = await supabase.from('profiles').select('id,email,full_name').in('id', ids.slice(0, 100));
      const pm = {}; (profiles || []).forEach(p => { pm[p.id] = p; });
      setSubscriptions(subRes.data.map(s => ({ ...s, email: pm[s.user_id]?.email || '—', full_name: pm[s.user_id]?.full_name || null })));
    }

    setGiftCodes(giftRes.data || []);
    setLastUpdated(new Date().toISOString());
  }

  const mrrINR   = (planCounts.pro * PLAN_PRICES.pro) + (planCounts.studio * PLAN_PRICES.studio);
  const arrINR   = mrrINR * 12;
  const paidTotal= planCounts.pro + planCounts.studio;
  const convRate = totalUsers > 0 ? ((paidTotal / totalUsers) * 100).toFixed(1) : '0.0';
  const avgRPU   = paidTotal > 0 ? Math.round(mrrINR / paidTotal) : 0;

  // Recent paid activations (users who recently got a paid plan)
  const recentActivations = transactions.filter(t => t.status === 'captured' && t.payment_type === 'subscription').slice(0, 10);

  if (pageLoading) return (
    <div style={{ minHeight: '100vh', background: '#F4F4F5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: 20, height: 20, borderRadius: '50%', border: '2px solid #E4E4E7', borderTopColor: '#09090B', animation: 'spin 0.7s linear infinite' }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}} body{font-family:'Plus Jakarta Sans',sans-serif;background:#F4F4F5;}`}</style>
    </div>
  );

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; font-family: 'Plus Jakarta Sans', sans-serif; }
        @keyframes spin { to { transform: rotate(360deg); } }
        body { background: #F4F4F5; }
        ::-webkit-scrollbar { width: 4px; } ::-webkit-scrollbar-track { background: #F4F4F5; } ::-webkit-scrollbar-thumb { background: #D4D4D8; border-radius: 4px; }

        .kpi-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; margin-bottom: 20px; }
        .two-col { display: grid; grid-template-columns: 1.4fr 1fr; gap: 16px; margin-bottom: 16px; }
        .three-col { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-bottom: 16px; }

        .card { background: #FFFFFF; border: 1px solid #E4E4E7; border-radius: 10px; overflow: hidden; }
        .card-head { display: flex; align-items: center; justify-content: space-between; padding: 12px 16px 10px; border-bottom: 1px solid #F4F4F5; }
        .card-title { font-size: 13px; font-weight: 700; color: '#09090B'; letter-spacing: -0.2px; color: #09090B; }
        .card-meta { font-size: 11.5px; color: #A1A1AA; }

        .plan-row { padding: '12px 16px'; border-bottom: 1px solid #F4F4F5; padding: 12px 16px; }
        .plan-row:last-child { border-bottom: none; }

        .table-wrap { background: #FFFFFF; border: 1px solid #E4E4E7; border-radius: 10px; overflow: hidden; }
        .table-head { display: grid; grid-template-columns: 1fr 90px 100px 90px 80px 90px; gap: 8px; padding: 9px 16px; background: #FAFAFA; border-bottom: 1px solid #E4E4E7; }
        .col-head { font-size: 10.5px; font-weight: 600; color: '#71717A'; text-transform: uppercase; letter-spacing: 0.06em; color: #71717A; }
        .tx-row { display: grid; grid-template-columns: 1fr 90px 100px 90px 80px 90px; gap: 8px; align-items: center; padding: 10px 16px; border-bottom: 1px solid '#F4F4F5'; border-bottom: 1px solid #F4F4F5; transition: background 0.1s; }
        .tx-row:last-child { border-bottom: none; }
        .tx-row:hover { background: #FAFAFA; }

        .sub-row { display: grid; grid-template-columns: 1fr 80px 80px 120px 100px; gap: 8px; align-items: center; padding: 10px 16px; border-bottom: 1px solid #F4F4F5; }
        .sub-row:last-child { border-bottom: none; }
        .sub-head { display: grid; grid-template-columns: 1fr 80px 80px 120px 100px; gap: 8px; padding: 9px 16px; background: #FAFAFA; border-bottom: 1px solid #E4E4E7; }

        .gift-row { display: flex; align-items: center; gap: 12px; padding: 10px 16px; border-bottom: 1px solid #F4F4F5; }
        .gift-row:last-child { border-bottom: none; }

        .proj-table { width: 100%; border-collapse: collapse; }
        .proj-table th { padding: 9px 16px; text-align: left; font-size: 10.5px; font-weight: 600; color: #71717A; text-transform: uppercase; letter-spacing: 0.06em; border-bottom: 1px solid #E4E4E7; background: #FAFAFA; }
        .proj-table td { padding: 11px 16px; font-size: 13px; color: #09090B; border-bottom: 1px solid #F4F4F5; }
        .proj-table tr:last-child td { border-bottom: none; }

        .disclaimer { margin-top: 16px; padding: 12px 16px; background: #FFFBEB; border: 1px solid #FDE68A; border-radius: 8px; font-size: 12px; color: '#92400E'; line-height: 1.6; color: #92400E; }

        @media (max-width: 1100px) { .kpi-grid { grid-template-columns: 1fr 1fr; } .two-col { grid-template-columns: 1fr; } .three-col { grid-template-columns: 1fr 1fr; } }
        @media (max-width: 700px) { .kpi-grid { grid-template-columns: 1fr 1fr; } .three-col { grid-template-columns: 1fr; } .table-head,.tx-row { grid-template-columns: 1fr 90px 80px; } .table-head > *:nth-child(n+4),.tx-row > *:nth-child(n+4) { display: none; } }
      `}</style>

      <AdminShell admin={admin} title="Revenue" onSignOut={async () => { await supabase.auth.signOut(); router.push('/admin/login'); }} lastUpdated={lastUpdated} onRefresh={fetchData}>

        {/* KPIs */}
        <div className="kpi-grid">
          <RevenueKPI label="Monthly Recurring Revenue"  value={fmtLakh(mrrINR)}       sub={`${paidTotal} paying users`} highlight />
          <RevenueKPI label="Annual Run Rate"            value={fmtLakh(arrINR)}        sub="MRR × 12" />
          <RevenueKPI label="Avg Revenue Per User"       value={fmtINR(avgRPU)}         sub="Across paid plans only" />
          <RevenueKPI label="Conversion Rate"            value={`${convRate}%`}         sub={`${totalUsers.toLocaleString()} total users`} />
        </div>

        {/* Revenue breakdown + Projections */}
        <div className="two-col">
          {/* Plan breakdown */}
          <div className="card">
            <div className="card-head">
              <span className="card-title">Revenue by Plan</span>
              <span className="card-meta">Active subscriptions (calculated)</span>
            </div>

            {/* Plan rows */}
            {[
              { plan: 'pro',    label: 'Creator Pro',  count: planCounts.pro,    price: 999,  color: '#B45309', bg: '#FFFBEB', border: '#FDE68A' },
              { plan: 'studio', label: 'Studio',       count: planCounts.studio, price: 2499, color: '#1D4ED8', bg: '#EFF6FF', border: '#BFDBFE' },
            ].map(p => {
              const revenue = p.count * p.price;
              const pct = paidTotal > 0 ? (p.count / paidTotal * 100).toFixed(1) : '0.0';
              return (
                <div className="plan-row" key={p.plan}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ background: p.bg, color: p.color, border: `1px solid ${p.border}`, borderRadius: 4, padding: '2px 8px', fontSize: 10.5, fontWeight: 600, textTransform: 'uppercase' }}>{p.label}</span>
                      <span style={{ fontSize: 13, color: '#71717A' }}>{p.count.toLocaleString()} users</span>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <span style={{ fontSize: 15, fontWeight: 800, color: '#09090B', letterSpacing: '-0.03em' }}>{fmtINR(revenue)}</span>
                      <span style={{ fontSize: 11.5, color: '#A1A1AA', marginLeft: 4 }}>/mo</span>
                    </div>
                  </div>
                  <div style={{ height: 5, background: '#F4F4F5', borderRadius: 3, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${pct}%`, background: p.color, borderRadius: 3, transition: 'width 0.6s' }} />
                  </div>
                  <p style={{ fontSize: 11, color: '#A1A1AA', marginTop: 4 }}>{pct}% of paid users · {fmtINR(p.price)}/user/month</p>
                </div>
              );
            })}

            {/* Total row */}
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '14px 16px', background: '#FAFAFA', borderTop: '1px solid #E4E4E7' }}>
              <span style={{ fontSize: 13.5, fontWeight: 700, color: '#09090B' }}>Total MRR</span>
              <span style={{ fontSize: 18, fontWeight: 800, color: '#92400E', letterSpacing: '-0.03em' }}>{fmtLakh(mrrINR)}</span>
            </div>

            {/* Collected from transactions */}
            <div style={{ padding: '12px 16px', background: '#F0FDF4', borderTop: '1px solid #BBF7D0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 12.5, color: '#15803D', fontWeight: 500 }}>
                  Collected Revenue (from transactions)
                </span>
                <span style={{ fontSize: 15, fontWeight: 700, color: '#15803D' }}>
                  {revenueFromTx.total > 0 ? fmtLakh(revenueFromTx.inr) : '₹0'}
                  <span style={{ fontSize: 11, fontWeight: 400, marginLeft: 6, color: '#16A34A' }}>{revenueFromTx.total} payments</span>
                </span>
              </div>
            </div>
          </div>

          {/* Growth projections */}
          <div className="card">
            <div className="card-head">
              <span className="card-title">Growth Scenarios</span>
              <span className="card-meta">Based on current ARPU</span>
            </div>
            <table className="proj-table">
              <thead>
                <tr>
                  <th>Scenario</th>
                  <th>Paid Users</th>
                  <th>MRR</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { label: 'Current',     mult: 1   },
                  { label: '2× growth',   mult: 2   },
                  { label: '5× growth',   mult: 5   },
                  { label: '10× growth',  mult: 10  },
                  { label: '100× growth', mult: 100 },
                ].map(s => (
                  <tr key={s.label} style={s.mult === 1 ? { background: '#FAFAFA' } : {}}>
                    <td style={{ fontSize: 13, color: s.mult === 1 ? '#09090B' : '#71717A', fontWeight: s.mult === 1 ? 600 : 400 }}>{s.label}</td>
                    <td style={{ fontSize: 13, fontWeight: 600, color: '#09090B' }}>{Math.round(paidTotal * s.mult).toLocaleString()}</td>
                    <td style={{ fontSize: 14, fontWeight: 700, color: s.mult >= 10 ? '#B45309' : '#09090B', letterSpacing: '-0.02em' }}>{fmtLakh(mrrINR * s.mult)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Transactions Table */}
        <div style={{ marginBottom: 16 }}>
          <div className="card">
            <div className="card-head">
              <span className="card-title">Transactions</span>
              <span className="card-meta">{transactions.length} loaded</span>
            </div>
            <div className="table-head">
              <span className="col-head">User</span>
              <span className="col-head">Plan</span>
              <span className="col-head">Amount</span>
              <span className="col-head">Status</span>
              <span className="col-head">Method</span>
              <span className="col-head">Date</span>
            </div>
            {transactions.length === 0
              ? <div style={{ textAlign: 'center', padding: '40px 20px', fontSize: 13, color: '#A1A1AA' }}>No transactions yet</div>
              : transactions.slice(0, 30).map(t => {
                const st = STATUS_BADGE[t.status] || STATUS_BADGE.created;
                const sym = { INR: '₹', USD: '$', EUR: '€', GBP: '£' }[t.currency] || '₹';
                const amt = t.amount ? `${sym}${((t.amount) / 100).toLocaleString('en-IN')}` : '—';
                return (
                  <div className="tx-row" key={t.id}>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#09090B', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.full_name || t.email}</div>
                      <div style={{ fontSize: 11, color: '#A1A1AA', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.email}</div>
                    </div>
                    <div>
                      <span style={{ background: t.plan === 'pro' ? '#FFFBEB' : t.plan === 'studio' ? '#EFF6FF' : '#F4F4F5', color: t.plan === 'pro' ? '#B45309' : t.plan === 'studio' ? '#1D4ED8' : '#71717A', border: `1px solid ${t.plan === 'pro' ? '#FDE68A' : t.plan === 'studio' ? '#BFDBFE' : '#E4E4E7'}`, borderRadius: 4, padding: '2px 7px', fontSize: 10.5, fontWeight: 600, textTransform: 'uppercase' }}>
                        {t.plan || '—'}
                      </span>
                    </div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: t.status === 'captured' ? '#09090B' : '#A1A1AA' }}>{amt}</div>
                    <div>
                      <span style={{ background: st.bg, color: st.color, border: `1px solid ${st.border}`, borderRadius: 4, padding: '2px 7px', fontSize: 10.5, fontWeight: 600 }}>{st.label}</span>
                    </div>
                    <div style={{ fontSize: 12, color: '#71717A', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {t.payment_method || t.payment_type || '—'}
                    </div>
                    <div style={{ fontSize: 11.5, color: '#A1A1AA' }}>
                      {new Date(t.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: '2-digit' })}
                    </div>
                  </div>
                );
              })
            }
          </div>
        </div>

        {/* Subscriptions + Gift codes */}
        <div className="two-col">
          {/* Active subscriptions */}
          <div className="card">
            <div className="card-head">
              <span className="card-title">Active Subscriptions</span>
              <span className="card-meta">{subscriptions.filter(s => s.status === 'active').length} active</span>
            </div>
            <div className="sub-head">
              <span className="col-head">User</span>
              <span className="col-head">Plan</span>
              <span className="col-head">Cycle</span>
              <span className="col-head">Period End</span>
              <span className="col-head">Status</span>
            </div>
            {subscriptions.length === 0
              ? <div style={{ textAlign: 'center', padding: '32px 20px', fontSize: 13, color: '#A1A1AA' }}>No subscriptions yet</div>
              : subscriptions.slice(0, 15).map(s => {
                const isActive = s.status === 'active';
                return (
                  <div className="sub-row" key={s.user_id}>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: 12.5, fontWeight: 600, color: '#09090B', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.full_name || s.email}</div>
                      <div style={{ fontSize: 11, color: '#A1A1AA', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.email}</div>
                    </div>
                    <div>
                      <span style={{ background: s.plan === 'pro' ? '#FFFBEB' : '#EFF6FF', color: s.plan === 'pro' ? '#B45309' : '#1D4ED8', border: `1px solid ${s.plan === 'pro' ? '#FDE68A' : '#BFDBFE'}`, borderRadius: 4, padding: '2px 7px', fontSize: 10, fontWeight: 600, textTransform: 'uppercase' }}>
                        {s.plan}
                      </span>
                    </div>
                    <div style={{ fontSize: 12, color: '#71717A', textTransform: 'capitalize' }}>{s.billing_cycle}</div>
                    <div style={{ fontSize: 11.5, color: '#71717A' }}>
                      {s.current_period_end ? new Date(s.current_period_end).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: '2-digit' }) : '—'}
                    </div>
                    <div>
                      <span style={{ background: isActive ? '#F0FDF4' : '#FEF2F2', color: isActive ? '#16A34A' : '#DC2626', border: `1px solid ${isActive ? '#BBF7D0' : '#FECACA'}`, borderRadius: 4, padding: '2px 7px', fontSize: 10, fontWeight: 600 }}>
                        {s.status}
                      </span>
                    </div>
                  </div>
                );
              })
            }
          </div>

          {/* Gift codes */}
          <div className="card">
            <div className="card-head">
              <span className="card-title">Gift Codes</span>
              <span className="card-meta">{giftCodes.length} total · {giftCodes.filter(g => g.status === 'redeemed').length} redeemed</span>
            </div>
            {giftCodes.length === 0
              ? <div style={{ textAlign: 'center', padding: '32px 20px', fontSize: 13, color: '#A1A1AA' }}>No gift codes yet</div>
              : giftCodes.map(g => {
                const isRedeemed = g.status === 'redeemed';
                const isPending  = g.status === 'pending';
                const statusStyle = isRedeemed
                  ? { bg: '#F0FDF4', color: '#16A34A', border: '#BBF7D0' }
                  : isPending
                  ? { bg: '#FFFBEB', color: '#B45309', border: '#FDE68A' }
                  : { bg: '#FEF2F2', color: '#DC2626', border: '#FECACA' };
                return (
                  <div className="gift-row" key={g.id}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 3 }}>
                        <span style={{ fontSize: 12, fontFamily: 'monospace', fontWeight: 700, color: '#09090B', background: '#F4F4F5', border: '1px solid #E4E4E7', borderRadius: 4, padding: '1px 7px', letterSpacing: '0.08em' }}>{g.code}</span>
                        <span style={{ background: g.plan === 'pro' ? '#FFFBEB' : '#EFF6FF', color: g.plan === 'pro' ? '#B45309' : '#1D4ED8', border: `1px solid ${g.plan === 'pro' ? '#FDE68A' : '#BFDBFE'}`, borderRadius: 4, padding: '1px 6px', fontSize: 9.5, fontWeight: 600, textTransform: 'uppercase' }}>{g.plan}</span>
                      </div>
                      <div style={{ fontSize: 11.5, color: '#71717A', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        → {g.recipient_email} · {g.duration_months}mo
                      </div>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <span style={{ background: statusStyle.bg, color: statusStyle.color, border: `1px solid ${statusStyle.border}`, borderRadius: 4, padding: '2px 7px', fontSize: 10, fontWeight: 600, display: 'block', marginBottom: 3 }}>{g.status}</span>
                      <span style={{ fontSize: 10.5, color: '#A1A1AA' }}>
                        {new Date(g.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                      </span>
                    </div>
                  </div>
                );
              })
            }
          </div>
        </div>

        <div className="disclaimer">
          <strong>Note:</strong> MRR is estimated from active plan records (Pro: ₹999/mo, Studio: ₹2,499/mo). Collected revenue is from captured Razorpay transactions. Verify against your payment gateway dashboard for accounting accuracy. Annual billing discounts are not reflected in the per-plan calculation.
        </div>

      </AdminShell>
    </>
  );
}