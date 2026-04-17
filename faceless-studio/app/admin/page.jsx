'use client';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { getSupabaseBrowser } from '@/packages/supabase-browser';
import AdminShell from '@/components/admin/AdminShell';

// ── helpers ───────────────────────────────────────────────────────────────────
const fmtINR = n => `₹${Number(n).toLocaleString('en-IN')}`;
const fmtLakh = n => n >= 100000 ? `₹${(n / 100000).toFixed(2)}L` : fmtINR(n);
const PLAN_PRICES = { pro: 999, studio: 2499 };
const AVATAR_COLORS = ['#C9A227','#2563EB','#16A34A','#7C3AED','#DB2777','#0891B2','#EA580C'];

function KPICard({ label, value, sub, delta, accent = false }) {
  const positive = delta > 0;
  return (
    <div style={{ background: '#FFFFFF', border: '1px solid #E4E4E7', borderRadius: 10, padding: '18px 20px' }}>
      <p style={{ fontSize: 11, fontWeight: 600, color: '#71717A', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 10 }}>{label}</p>
      <p style={{ fontSize: 28, fontWeight: 800, color: accent ? '#B45309' : '#09090B', letterSpacing: '-0.04em', lineHeight: 1, marginBottom: 6 }}>
        {value}
      </p>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {delta !== undefined && (
          <span style={{ fontSize: 11.5, fontWeight: 600, color: positive ? '#16A34A' : '#DC2626', background: positive ? '#F0FDF4' : '#FEF2F2', border: `1px solid ${positive ? '#BBF7D0' : '#FECACA'}`, borderRadius: 4, padding: '1px 6px' }}>
            {positive ? '+' : ''}{delta}
          </span>
        )}
        {sub && <span style={{ fontSize: 11.5, color: '#A1A1AA', fontWeight: 500 }}>{sub}</span>}
      </div>
    </div>
  );
}

function PlanBar({ label, count, total, revenue, color, bg, border }) {
  const pct = total > 0 ? (count / total) * 100 : 0;
  return (
    <div style={{ padding: '10px 0', borderBottom: '1px solid #F4F4F5' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ background: bg, border: `1px solid ${border}`, color, borderRadius: 4, padding: '2px 8px', fontSize: 10.5, fontWeight: 600, textTransform: 'uppercase' }}>{label}</span>
          <span style={{ fontSize: 12.5, fontWeight: 600, color: '#09090B' }}>{count.toLocaleString()} users</span>
        </div>
        <span style={{ fontSize: 12.5, fontWeight: 700, color: '#09090B' }}>{fmtINR(revenue)}/mo</span>
      </div>
      <div style={{ height: 4, background: '#F4F4F5', borderRadius: 2, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 2, transition: 'width 0.6s ease' }} />
      </div>
      <p style={{ fontSize: 11, color: '#A1A1AA', marginTop: 4 }}>{pct.toFixed(1)}% of total users</p>
    </div>
  );
}

export default function AdminDashboardPage() {
  const router   = useRouter();
  const supabase = getSupabaseBrowser();

  const [admin,       setAdmin]       = useState(null);
  const [pageLoading, setPageLoading] = useState(true);
  const [refreshing,  setRefreshing]  = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);

  // ── Data state ─────────────────────────────────────────────────────────────
  const [kpis,        setKpis]        = useState({ totalUsers: 0, mrrINR: 0, arrINR: 0, genMonth: 0, genToday: 0, genTotal: 0, convRate: 0, activeUsers30d: 0, newToday: 0, newWeek: 0, newMonth: 0, avgGenPerUser: 0, avgDurationMs: 0 });
  const [planCounts,  setPlanCounts]  = useState({ free: 0, pro: 0, studio: 0 });
  const [recentUsers, setRecentUsers] = useState([]);
  const [topNiches,   setTopNiches]   = useState([]);
  const [platformData,setPlatformData]= useState([]);
  const [sprintStats, setSprintStats] = useState({ active: 0, completed: 0 });

  // ── Auth ───────────────────────────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.replace('/admin/login'); return; }
      const { data: adm } = await supabase.from('admins').select('id,name,role,email').eq('user_id', session.user.id).single();
      if (!adm) { await supabase.auth.signOut(); router.replace('/admin/login'); return; }
      setAdmin(adm);
      await fetchAll();
      setPageLoading(false);
    })();
  }, []);

  // ── Data fetch ─────────────────────────────────────────────────────────────
  const fetchAll = useCallback(async () => {
    setRefreshing(true);

    const now          = new Date();
    const todayISO     = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
    const weekAgo      = new Date(now.getTime() - 7  * 86400000).toISOString();
    const monthStart   = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const ago30        = new Date(now.getTime() - 30 * 86400000).toISOString();
    const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString();
    const prevMonthEnd   = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59).toISOString();

    const [
      totalRes, usageRes, genTodayRes, genMonthRes, genTotalRes, genPrevMonthRes,
      newTodayRes, newWeekRes, newMonthRes, prevMonthSignups,
      recentRes, niche500Res, platRes, activeRaw, avgDurRes, sprintRes,
    ] = await Promise.all([
      supabase.from('profiles').select('*', { count: 'exact', head: true }),
      supabase.from('user_usage').select('user_id, plan, total_generations, plan_activated_at'),
      supabase.from('generations').select('*', { count: 'exact', head: true }).gte('generated_at', todayISO),
      supabase.from('generations').select('*', { count: 'exact', head: true }).gte('generated_at', monthStart),
      supabase.from('generations').select('*', { count: 'exact', head: true }),
      supabase.from('generations').select('*', { count: 'exact', head: true }).gte('generated_at', prevMonthStart).lte('generated_at', prevMonthEnd),
      supabase.from('profiles').select('*', { count: 'exact', head: true }).gte('created_at', todayISO),
      supabase.from('profiles').select('*', { count: 'exact', head: true }).gte('created_at', weekAgo),
      supabase.from('profiles').select('*', { count: 'exact', head: true }).gte('created_at', monthStart),
      supabase.from('profiles').select('*', { count: 'exact', head: true }).gte('created_at', prevMonthStart).lte('created_at', prevMonthEnd),
      supabase.from('profiles').select('id,email,full_name,creator_type,primary_niche,created_at').order('created_at', { ascending: false }).limit(10),
      supabase.from('generations').select('niche').gte('generated_at', ago30).limit(500),
      supabase.from('generations').select('platform').gte('generated_at', monthStart).limit(1000),
      supabase.from('generations').select('user_id').gte('generated_at', ago30).limit(2000),
      supabase.from('generations').select('generation_duration_ms').gte('generated_at', monthStart).not('generation_duration_ms', 'is', null).limit(500),
      supabase.from('sprints').select('status').limit(2000),
    ]);

    // ── Plan counts & MRR ──────────────────────────────────────────────────
    const counts = { free: 0, pro: 0, studio: 0 };
    let totalGensFromDB = 0;
    if (usageRes.data) {
      usageRes.data.forEach(r => { if (r.plan in counts) counts[r.plan]++; totalGensFromDB += (r.total_generations || 0); });
    }
    setPlanCounts(counts);
    const mrrINR = (counts.pro * PLAN_PRICES.pro) + (counts.studio * PLAN_PRICES.studio);
    const total  = totalRes.count || 0;
    const paid   = counts.pro + counts.studio;

    // ── Active users 30d ───────────────────────────────────────────────────
    const activeSet = new Set((activeRaw.data || []).map(r => r.user_id));

    // ── Avg duration ──────────────────────────────────────────────────────
    const durData = (avgDurRes.data || []).filter(r => r.generation_duration_ms > 0);
    const avgDur  = durData.length > 0 ? Math.round(durData.reduce((s, r) => s + r.generation_duration_ms, 0) / durData.length) : 0;

    // ── Platform distribution ─────────────────────────────────────────────
    const platMap = {};
    (platRes.data || []).forEach(r => { if (r.platform) platMap[r.platform] = (platMap[r.platform] || 0) + 1; });
    const platTotal = Object.values(platMap).reduce((s, n) => s + n, 0);
    const platSorted = Object.entries(platMap)
      .sort((a, b) => b[1] - a[1])
      .map(([name, count]) => ({ name, count, pct: platTotal > 0 ? (count / platTotal * 100).toFixed(1) : 0 }));
    setPlatformData(platSorted);

    // ── Top niches ─────────────────────────────────────────────────────────
    const nicheMap = {};
    (niche500Res.data || []).forEach(r => { if (!r.niche) return; const k = r.niche.trim().toLowerCase(); nicheMap[k] = (nicheMap[k] || 0) + 1; });
    setTopNiches(Object.entries(nicheMap).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([niche, count]) => ({ niche, count })));

    // ── Sprint stats ──────────────────────────────────────────────────────
    if (sprintRes.data) {
      const sc = { active: 0, completed: 0 };
      sprintRes.data.forEach(r => { if (r.status === 'active') sc.active++; else if (r.status === 'completed') sc.completed++; });
      setSprintStats(sc);
    }

    // ── Recent users (with plans) ──────────────────────────────────────────
    if (recentRes.data) {
      const ids = recentRes.data.map(p => p.id);
      const { data: planData } = await supabase.from('user_usage').select('user_id, plan, total_generations').in('user_id', ids);
      const planMap = {};
      (planData || []).forEach(p => { planMap[p.user_id] = p; });
      setRecentUsers(recentRes.data.map(u => ({ ...u, ...planMap[u.id] })));
    }

    // ── KPIs ──────────────────────────────────────────────────────────────
    const genMonthCount  = genMonthRes.count  || 0;
    const genPrevMonth   = genPrevMonthRes.count || 0;
    const genMonthDelta  = genMonthCount - genPrevMonth;
    const prevSignups    = prevMonthSignups.count || 0;
    const newMonthCount  = newMonthRes.count || 0;
    const signupDelta    = newMonthCount - prevSignups;

    setKpis({
      totalUsers:    total,
      mrrINR,
      arrINR:        mrrINR * 12,
      genMonth:      genMonthCount,
      genMonthDelta,
      genToday:      genTodayRes.count || 0,
      genTotal:      genTotalRes.count || 0,
      convRate:      total > 0 ? ((paid / total) * 100).toFixed(1) : '0.0',
      activeUsers30d: activeSet.size,
      newToday:      newTodayRes.count || 0,
      newWeek:       newWeekRes.count  || 0,
      newMonth:      newMonthCount,
      signupDelta,
      paidUsers:     paid,
      avgGenPerUser: paid > 0 ? (totalGensFromDB / total).toFixed(1) : '0',
      avgDurationMs: avgDur,
    });

    setLastUpdated(new Date().toISOString());
    setRefreshing(false);
  }, []);

  async function handleSignOut() { await supabase.auth.signOut(); router.push('/admin/login'); }

  if (pageLoading) return (
    <div style={{ minHeight: '100vh', background: '#F4F4F5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: 22, height: 22, borderRadius: '50%', border: '2.5px solid #E4E4E7', borderTopColor: '#09090B', animation: 'spin 0.7s linear infinite', margin: '0 auto 12px' }} />
        <p style={{ fontSize: 13, color: '#71717A', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Loading dashboard…</p>
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}} body{font-family:'Plus Jakarta Sans',sans-serif;background:#F4F4F5;}`}</style>
    </div>
  );

  const maxNiche = topNiches[0]?.count || 1;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; font-family: 'Plus Jakarta Sans', sans-serif; }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeUp { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }
        body { background: #F4F4F5; }
        ::-webkit-scrollbar { width: 4px; } ::-webkit-scrollbar-track { background: #F4F4F5; } ::-webkit-scrollbar-thumb { background: #D4D4D8; border-radius: 4px; }

        .page-wrap { animation: fadeUp 0.3s ease both; }
        .kpi-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; margin-bottom: 20px; }
        .two-col { display: grid; grid-template-columns: 1.6fr 1fr; gap: 16px; margin-bottom: 16px; }
        .three-col { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 16px; margin-bottom: 16px; }
        .full-col { margin-bottom: 16px; }

        .card { background: #FFFFFF; border: 1px solid #E4E4E7; border-radius: 10px; overflow: hidden; }
        .card-head { display: flex; align-items: center; justify-content: space-between; padding: 13px 16px 11px; border-bottom: 1px solid #F4F4F5; }
        .card-title { font-size: 13px; font-weight: 700; color: #09090B; letter-spacing: -0.2px; }
        .card-meta  { font-size: 11.5px; color: #A1A1AA; font-weight: 500; }
        .card-body  { padding: 14px 16px; }

        /* Activity row in recent users */
        .user-row { display: grid; grid-template-columns: 1fr 90px 100px 80px 90px; gap: 8px; align-items: center; padding: 9px 16px; border-bottom: 1px solid #F4F4F5; transition: background 0.1s; }
        .user-row:last-child { border-bottom: none; }
        .user-row:hover { background: #FAFAFA; }
        .user-avatar { width: 28px; height: 28px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 700; flex-shrink: 0; }

        /* Platform bars */
        .plat-row { display: flex; flex-direction: column; gap: 5px; padding: '8px 0'; padding: 8px 0; border-bottom: 1px solid #F4F4F5; }
        .plat-row:last-child { border-bottom: none; }
        .plat-info { display: flex; justify-content: space-between; align-items: center; }
        .plat-name  { font-size: 12.5px; color: #09090B; font-weight: 500; }
        .plat-count { font-size: 12px; color: #71717A; font-weight: 500; }
        .bar-track  { height: 4px; background: #F4F4F5; border-radius: 2px; overflow: hidden; }
        .bar-fill   { height: 100%; background: #09090B; border-radius: 2px; transition: width 0.6s ease; }

        /* Niche bars */
        .niche-row { display: flex; flex-direction: column; gap: 4px; padding: '7px 0'; padding: 7px 0; border-bottom: 1px solid #F4F4F5; }
        .niche-row:last-child { border-bottom: none; }
        .niche-info { display: flex; justify-content: space-between; }
        .niche-name  { font-size: 12.5px; color: #09090B; font-weight: 500; text-transform: capitalize; }
        .niche-count { font-size: 12px; color: #71717A; }
        .niche-fill  { height: 3px; background: #C9A227; border-radius: 2px; transition: width 0.6s ease; }

        /* Header row */
        .table-header { display: grid; grid-template-columns: 1fr 90px 100px 80px 90px; gap: 8px; padding: 8px 16px; background: #FAFAFA; border-bottom: 1px solid #F4F4F5; }
        .col-head { font-size: 10.5px; font-weight: 600; color: #71717A; text-transform: uppercase; letter-spacing: 0.06em; }

        .badge-plan { display: inline-flex; align-items: center; padding: 2px 7px; border-radius: 4px; font-size: 10px; font-weight: 600; letter-spacing: 0.02em; white-space: nowrap; text-transform: uppercase; }

        .insight-row { display: flex; align-items: center; justify-content: space-between; padding: '11px 0'; padding: 11px 0; border-bottom: 1px solid #F4F4F5; }
        .insight-row:last-child { border-bottom: none; }

        @media (max-width: 1100px) { .kpi-grid { grid-template-columns: repeat(2,1fr); } .two-col { grid-template-columns: 1fr; } .three-col { grid-template-columns: 1fr 1fr; } }
        @media (max-width: 700px) { .kpi-grid { grid-template-columns: 1fr 1fr; } .three-col { grid-template-columns: 1fr; } .table-header,.user-row { grid-template-columns: 1fr 80px 80px; } .user-row > *:nth-child(4),.user-row > *:nth-child(5),.table-header > *:nth-child(4),.table-header > *:nth-child(5) { display: none; } }
      `}</style>

      <AdminShell admin={admin} title="Overview" onSignOut={handleSignOut} lastUpdated={lastUpdated} onRefresh={fetchAll}>
        <div className="page-wrap">

          {/* Date + greeting banner */}
          <div style={{ marginBottom: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
            <div>
              <p style={{ fontSize: 20, fontWeight: 800, color: '#09090B', letterSpacing: '-0.04em', marginBottom: 2 }}>
                Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening'}, {admin?.name?.split(' ')[0] || 'Admin'}
              </p>
              <p style={{ fontSize: 13, color: '#71717A', fontWeight: 500 }}>
                {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                {refreshing && <span style={{ marginLeft: 10, fontSize: 11, color: '#A1A1AA' }}>● Refreshing…</span>}
              </p>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <div style={{ background: '#FFFFFF', border: '1px solid #E4E4E7', borderRadius: 7, padding: '6px 14px', fontSize: 12, color: '#71717A' }}>
                {kpis.newToday} new signup{kpis.newToday !== 1 ? 's' : ''} today
              </div>
              <div style={{ background: kpis.genToday > 0 ? '#F0FDF4' : '#FFFFFF', border: `1px solid ${kpis.genToday > 0 ? '#BBF7D0' : '#E4E4E7'}`, borderRadius: 7, padding: '6px 14px', fontSize: 12, color: kpis.genToday > 0 ? '#15803D' : '#71717A', fontWeight: kpis.genToday > 0 ? 600 : 400 }}>
                {kpis.genToday} generation{kpis.genToday !== 1 ? 's' : ''} today
              </div>
            </div>
          </div>

          {/* ── Primary KPIs ── */}
          <div className="kpi-grid">
            <KPICard
              label="Total Registered Users"
              value={kpis.totalUsers.toLocaleString()}
              sub={`${kpis.newMonth} new this month`}
              delta={kpis.signupDelta}
            />
            <KPICard
              label="Monthly Recurring Revenue"
              value={fmtLakh(kpis.mrrINR)}
              sub={`ARR ${fmtLakh(kpis.arrINR)}`}
              accent
            />
            <KPICard
              label="Generations This Month"
              value={kpis.genMonth.toLocaleString()}
              sub={`${kpis.genTotal.toLocaleString()} all-time`}
              delta={kpis.genMonthDelta}
            />
            <KPICard
              label="Paid Conversion Rate"
              value={`${kpis.convRate}%`}
              sub={`${kpis.paidUsers} paying users`}
            />
          </div>

          {/* ── Revenue + User Growth ── */}
          <div className="two-col">
            {/* Plan & Revenue breakdown */}
            <div className="card">
              <div className="card-head">
                <span className="card-title">Plan Distribution & Revenue</span>
                <span className="card-meta">MRR: {fmtINR(kpis.mrrINR)}/month</span>
              </div>
              <div style={{ padding: '12px 16px' }}>
                <PlanBar label="Free"   count={planCounts.free}   total={kpis.totalUsers} revenue={0}                            color="#71717A" bg="#F4F4F5" border="#E4E4E7" />
                <PlanBar label="Pro"    count={planCounts.pro}    total={kpis.totalUsers} revenue={planCounts.pro * 999}          color="#B45309" bg="#FFFBEB" border="#FDE68A" />
                <PlanBar label="Studio" count={planCounts.studio} total={kpis.totalUsers} revenue={planCounts.studio * 2499}      color="#1D4ED8" bg="#EFF6FF" border="#BFDBFE" />
              </div>
              {/* Summary row */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 1, borderTop: '1px solid #F4F4F5' }}>
                {[
                  { label: 'Pro Revenue', value: fmtINR(planCounts.pro * 999) },
                  { label: 'Studio Revenue', value: fmtINR(planCounts.studio * 2499) },
                  { label: 'Annual Run Rate', value: fmtLakh(kpis.arrINR) },
                ].map(item => (
                  <div key={item.label} style={{ padding: '12px 16px', background: '#FAFAFA', borderRight: '1px solid #F4F4F5' }}>
                    <p style={{ fontSize: 10.5, color: '#A1A1AA', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>{item.label}</p>
                    <p style={{ fontSize: 15, fontWeight: 800, color: '#09090B', letterSpacing: '-0.03em' }}>{item.value}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Key metrics column */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {/* User acquisition */}
              <div className="card">
                <div className="card-head"><span className="card-title">User Acquisition</span></div>
                <div style={{ padding: '4px 0' }}>
                  {[
                    { label: 'New today',     value: kpis.newToday,      note: '' },
                    { label: 'New this week', value: kpis.newWeek,       note: '' },
                    { label: 'New this month',value: kpis.newMonth,      note: '' },
                    { label: 'Active (30d)',  value: kpis.activeUsers30d, note: 'generated content' },
                  ].map(row => (
                    <div className="insight-row" key={row.label} style={{ padding: '10px 16px' }}>
                      <span style={{ fontSize: 13, color: '#71717A', fontWeight: 500 }}>{row.label}</span>
                      <div style={{ textAlign: 'right' }}>
                        <span style={{ fontSize: 15, fontWeight: 700, color: '#09090B' }}>{row.value.toLocaleString()}</span>
                        {row.note && <div style={{ fontSize: 10.5, color: '#A1A1AA', marginTop: 1 }}>{row.note}</div>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Product health */}
              <div className="card">
                <div className="card-head"><span className="card-title">Product Health</span></div>
                <div style={{ padding: '4px 0' }}>
                  {[
                    { label: 'Avg gens / user',   value: kpis.avgGenPerUser },
                    { label: 'Avg pipeline time', value: kpis.avgDurationMs > 0 ? `${(kpis.avgDurationMs / 1000).toFixed(1)}s` : '—' },
                    { label: 'Active sprints',     value: sprintStats.active.toLocaleString() },
                    { label: 'Completed sprints',  value: sprintStats.completed.toLocaleString() },
                  ].map(row => (
                    <div className="insight-row" key={row.label} style={{ padding: '10px 16px' }}>
                      <span style={{ fontSize: 13, color: '#71717A', fontWeight: 500 }}>{row.label}</span>
                      <span style={{ fontSize: 15, fontWeight: 700, color: '#09090B' }}>{row.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* ── Platform + Niches ── */}
          <div className="three-col">
            {/* Platform distribution */}
            <div className="card">
              <div className="card-head">
                <span className="card-title">Platform Distribution</span>
                <span className="card-meta">This month</span>
              </div>
              <div style={{ padding: '8px 16px' }}>
                {platformData.length === 0
                  ? <p style={{ fontSize: 12.5, color: '#A1A1AA', padding: '20px 0', textAlign: 'center' }}>No data yet</p>
                  : platformData.map(p => {
                    const maxCount = platformData[0]?.count || 1;
                    return (
                      <div className="plat-row" key={p.name}>
                        <div className="plat-info">
                          <span className="plat-name">{p.name}</span>
                          <span className="plat-count">{p.count.toLocaleString()} · {p.pct}%</span>
                        </div>
                        <div className="bar-track">
                          <div className="bar-fill" style={{ width: `${(p.count / maxCount) * 100}%` }} />
                        </div>
                      </div>
                    );
                  })
                }
              </div>
            </div>

            {/* Top niches */}
            <div className="card" style={{ gridColumn: 'span 2' }}>
              <div className="card-head">
                <span className="card-title">Top Niches</span>
                <span className="card-meta">Last 30 days</span>
              </div>
              <div style={{ padding: '8px 16px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 32px' }}>
                {topNiches.length === 0
                  ? <p style={{ fontSize: 12.5, color: '#A1A1AA', padding: '20px 0', textAlign: 'center', gridColumn: '1/-1' }}>No data yet</p>
                  : topNiches.map((n, i) => (
                    <div className="niche-row" key={i}>
                      <div className="niche-info">
                        <span className="niche-name">{n.niche}</span>
                        <span className="niche-count">{n.count}</span>
                      </div>
                      <div className="bar-track">
                        <div className="niche-fill" style={{ width: `${(n.count / maxNiche) * 100}%` }} />
                      </div>
                    </div>
                  ))
                }
              </div>
            </div>
          </div>

          {/* ── Recent Signups ── */}
          <div className="full-col">
            <div className="card">
              <div className="card-head">
                <span className="card-title">Recent Signups</span>
                <button
                  onClick={() => router.push('/admin/users')}
                  style={{ background: 'none', border: 'none', font: 'inherit', fontSize: 12.5, color: '#C9A227', fontWeight: 600, cursor: 'pointer' }}
                >
                  View all users →
                </button>
              </div>

              {/* Table header */}
              <div className="table-header">
                <span className="col-head">User</span>
                <span className="col-head">Plan</span>
                <span className="col-head">Niche</span>
                <span className="col-head">Gens</span>
                <span className="col-head">Joined</span>
              </div>

              {/* Rows */}
              {recentUsers.length === 0
                ? <p style={{ fontSize: 12.5, color: '#A1A1AA', textAlign: 'center', padding: '28px' }}>No users yet</p>
                : recentUsers.map((u, i) => {
                  const initials  = (u.full_name || u.email || '?')[0].toUpperCase();
                  const bg        = `${AVATAR_COLORS[i % AVATAR_COLORS.length]}18`;
                  const color     = AVATAR_COLORS[i % AVATAR_COLORS.length];
                  const plan      = u.plan || 'free';
                  const planStyle = plan === 'pro'    ? 'badge-pro'
                                  : plan === 'studio' ? 'badge-studio'
                                  : 'badge-free';
                  return (
                    <div className="user-row" key={u.id}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 9, minWidth: 0 }}>
                        <div className="user-avatar" style={{ background: bg, color }}>{initials}</div>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontSize: 13, fontWeight: 600, color: '#09090B', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.full_name || '—'}</div>
                          <div style={{ fontSize: 11, color: '#A1A1AA', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.email}</div>
                        </div>
                      </div>
                      <div>
                        <span className={`badge-plan ${planStyle}`} style={{ background: plan === 'pro' ? '#FFFBEB' : plan === 'studio' ? '#EFF6FF' : '#F4F4F5', color: plan === 'pro' ? '#B45309' : plan === 'studio' ? '#1D4ED8' : '#71717A', border: `1px solid ${plan === 'pro' ? '#FDE68A' : plan === 'studio' ? '#BFDBFE' : '#E4E4E7'}`, display: 'inline-flex', alignItems: 'center', padding: '2px 7px', borderRadius: 4, fontSize: 10, fontWeight: 600, textTransform: 'uppercase' }}>
                          {plan}
                        </span>
                      </div>
                      <div style={{ fontSize: 12.5, color: '#71717A', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {u.primary_niche || <span style={{ color: '#D4D4D8' }}>—</span>}
                      </div>
                      <div style={{ fontSize: 13.5, fontWeight: 600, color: (u.total_generations || 0) > 5 ? '#B45309' : '#09090B' }}>
                        {u.total_generations || 0}
                      </div>
                      <div style={{ fontSize: 12, color: '#A1A1AA' }}>
                        {new Date(u.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: '2-digit' })}
                      </div>
                    </div>
                  );
                })
              }
            </div>
          </div>

        </div>
      </AdminShell>
    </>
  );
}