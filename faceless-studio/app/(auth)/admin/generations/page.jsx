'use client';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { getSupabaseBrowser } from '@/packages/supabase-browser';
import AdminShell from '@/components/admin/AdminShell';

const PLATFORM_ICONS = {
  'YouTube': '▶', 'Instagram Reels': '📸', 'TikTok': '🎵',
  'Podcast': '🎙', 'Blog': '✍', 'YouTube Shorts': '⚡',
};

function StatCard({ label, value, sub }) {
  return (
    <div style={{ background: '#FFFFFF', border: '1px solid #E4E4E7', borderRadius: 10, padding: '16px 18px' }}>
      <p style={{ fontSize: 11, fontWeight: 600, color: '#71717A', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8 }}>{label}</p>
      <p style={{ fontSize: 26, fontWeight: 800, color: '#09090B', letterSpacing: '-0.04em', lineHeight: 1, marginBottom: 4 }}>{value}</p>
      {sub && <p style={{ fontSize: 11.5, color: '#A1A1AA', fontWeight: 500 }}>{sub}</p>}
    </div>
  );
}

export default function AdminGenerationsPage() {
  const router   = useRouter();
  const supabase = getSupabaseBrowser();

  const [admin,       setAdmin]       = useState(null);
  const [pageLoading, setPageLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);

  const [gens,        setGens]        = useState([]);
  const [filtered,    setFiltered]    = useState([]);
  const [search,      setSearch]      = useState('');
  const [platFilter,  setPlatFilter]  = useState('all');
  const [dateRange,   setDateRange]   = useState('30');
  const [page,        setPage]        = useState(1);

  const [stats,       setStats]       = useState({ today: 0, week: 0, month: 0, total: 0, avgDuration: 0 });
  const [platforms,   setPlatforms]   = useState([]);
  const [creatorTypes,setCreatorTypes]= useState([]);

  const PER_PAGE = 30;

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
    const now      = new Date();
    const today    = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
    const weekAgo  = new Date(now.getTime() -  7 * 86400000).toISOString();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

    const [todayRes, weekRes, monthRes, totalRes, gensRes] = await Promise.all([
      supabase.from('generations').select('*', { count: 'exact', head: true }).gte('generated_at', today),
      supabase.from('generations').select('*', { count: 'exact', head: true }).gte('generated_at', weekAgo),
      supabase.from('generations').select('*', { count: 'exact', head: true }).gte('generated_at', monthStart),
      supabase.from('generations').select('*', { count: 'exact', head: true }),
      supabase.from('generations')
        .select('id,user_id,niche,platform,creator_type,tone,language,chosen_topic,chosen_hook,generated_at,generation_duration_ms')
        .order('generated_at', { ascending: false })
        .limit(600),
    ]);

    const gensData = gensRes.data || [];

    // Enrich with emails
    const userIds = [...new Set(gensData.map(g => g.user_id))];
    const { data: profiles } = await supabase.from('profiles').select('id,email,full_name').in('id', userIds.slice(0, 500));
    const profileMap = {};
    (profiles || []).forEach(p => { profileMap[p.id] = p; });

    const enriched = gensData.map(g => ({
      ...g,
      email:     profileMap[g.user_id]?.email     || '—',
      full_name: profileMap[g.user_id]?.full_name || null,
    }));
    setGens(enriched);

    // Platform distribution (all time from loaded data)
    const platMap = {};
    enriched.forEach(g => { if (g.platform) platMap[g.platform] = (platMap[g.platform] || 0) + 1; });
    const platTotal = Object.values(platMap).reduce((s, n) => s + n, 0) || 1;
    setPlatforms(
      Object.entries(platMap).sort((a, b) => b[1] - a[1])
        .map(([name, count]) => ({ name, count, pct: ((count / platTotal) * 100).toFixed(1) }))
    );

    // Creator type breakdown
    const ctMap = {};
    enriched.forEach(g => { if (g.creator_type) ctMap[g.creator_type] = (ctMap[g.creator_type] || 0) + 1; });
    setCreatorTypes(Object.entries(ctMap).sort((a, b) => b[1] - a[1]).map(([type, count]) => ({ type, count })));

    // Avg duration
    const durValid = enriched.filter(g => g.generation_duration_ms > 0);
    const avgDur   = durValid.length > 0 ? Math.round(durValid.reduce((s, g) => s + g.generation_duration_ms, 0) / durValid.length) : 0;

    setStats({ today: todayRes.count || 0, week: weekRes.count || 0, month: monthRes.count || 0, total: totalRes.count || 0, avgDuration: avgDur });
    setLastUpdated(new Date().toISOString());
  }

  useEffect(() => {
    const cutoff = new Date(Date.now() - parseInt(dateRange) * 86400000).toISOString();
    let r = gens.filter(g => g.generated_at >= cutoff);
    if (search.trim()) {
      const q = search.toLowerCase();
      r = r.filter(g =>
        (g.email || '').toLowerCase().includes(q) ||
        (g.niche || '').toLowerCase().includes(q) ||
        (g.chosen_topic || '').toLowerCase().includes(q)
      );
    }
    if (platFilter !== 'all') r = r.filter(g => g.platform === platFilter);
    setFiltered(r);
    setPage(1);
  }, [search, platFilter, dateRange, gens]);

  const paged   = filtered.slice(0, page * PER_PAGE);
  const hasMore = paged.length < filtered.length;
  const maxPlat = platforms[0]?.count || 1;

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

        .stats-row { display: grid; grid-template-columns: repeat(5, 1fr); gap: 12px; margin-bottom: 18px; }
        .two-col { display: grid; grid-template-columns: 1.6fr 1fr; gap: 16px; margin-bottom: 16px; }

        .card { background: #FFFFFF; border: 1px solid #E4E4E7; border-radius: 10px; overflow: hidden; }
        .card-head { display: flex; align-items: center; justify-content: space-between; padding: 12px 16px 10px; border-bottom: 1px solid #F4F4F5; }
        .card-title { font-size: 13px; font-weight: 700; color: #09090B; letter-spacing: -0.2px; }
        .card-meta  { font-size: 11.5px; color: #A1A1AA; }

        .toolbar { display: flex; gap: 10px; margin-bottom: 14px; flex-wrap: wrap; align-items: center; }
        .search-wrap { flex: 1; min-width: 180px; position: relative; }
        .search-icon { position: absolute; left: 10px; top: 50%; transform: translateY(-50%); color: #A1A1AA; pointer-events: none; }
        .search-input { width: 100%; padding: 7px 12px 7px 32px; background: #FFFFFF; border: 1px solid #E4E4E7; border-radius: 7px; font-size: 13px; color: #09090B; outline: none; }
        .search-input::placeholder { color: #A1A1AA; }
        .search-input:focus { border-color: #09090B; }
        .filter-select { padding: 7px 28px 7px 10px; background: #FFFFFF url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6'%3E%3Cpath d='M1 1l4 4 4-4' stroke='%2371717A' strokeWidth='1.5' fill='none' strokeLinecap='round'/%3E%3C/svg%3E") no-repeat right 8px center; border: 1px solid #E4E4E7; border-radius: 7px; font-size: 12.5px; color: #09090B; outline: none; appearance: none; cursor: pointer; }
        .filter-select:focus { border-color: #09090B; }
        .result-count { font-size: 12px; color: #A1A1AA; }

        .table-wrap { background: #FFFFFF; border: 1px solid #E4E4E7; border-radius: 10px; overflow: hidden; }
        .table-head { display: grid; grid-template-columns: 80px 160px 150px 130px 160px 100px 70px; gap: 8px; padding: 9px 16px; background: #FAFAFA; border-bottom: 1px solid #E4E4E7; }
        .col-head { font-size: 10.5px; font-weight: 600; color: '#71717A'; text-transform: uppercase; letter-spacing: 0.06em; color: #71717A; }
        .gen-row { display: grid; grid-template-columns: 80px 160px 150px 130px 160px 100px 70px; gap: 8px; align-items: center; padding: 9px 16px; border-bottom: 1px solid #F4F4F5; transition: background 0.1s; }
        .gen-row:last-child { border-bottom: none; }
        .gen-row:hover { background: #FAFAFA; }

        .bar-track { height: 4px; background: '#F4F4F5'; border-radius: 2px; overflow: hidden; background: #F4F4F5; }
        .bar-fill { height: 100%; background: #09090B; border-radius: 2px; }

        .ct-row { display: flex; align-items: center; justify-content: space-between; padding: '8px 16px'; border-bottom: 1px solid #F4F4F5; padding: 8px 16px; }
        .ct-row:last-child { border-bottom: none; }

        @media (max-width: 1100px) { .stats-row { grid-template-columns: repeat(3, 1fr); } .two-col { grid-template-columns: 1fr; } }
        @media (max-width: 700px) { .stats-row { grid-template-columns: 1fr 1fr; } .table-head,.gen-row { grid-template-columns: 80px 1fr 100px 70px; } .table-head > *:nth-child(n+4),.gen-row > *:nth-child(n+4) { display: none; } .table-head > *:nth-child(4),.gen-row > *:nth-child(4) { display: block !important; } .table-head > *:nth-child(7),.gen-row > *:nth-child(7) { display: block !important; } }
      `}</style>

      <AdminShell admin={admin} title="Generations" onSignOut={async () => { await supabase.auth.signOut(); router.push('/admin/login'); }} lastUpdated={lastUpdated} onRefresh={fetchData}>

        {/* Stats */}
        <div className="stats-row">
          <StatCard label="Today"        value={stats.today.toLocaleString()}  sub="generations today" />
          <StatCard label="This Week"    value={stats.week.toLocaleString()}   sub="last 7 days" />
          <StatCard label="This Month"   value={stats.month.toLocaleString()}  sub={`${new Date().toLocaleDateString('en-IN', { month: 'long' })}`} />
          <StatCard label="All Time"     value={stats.total.toLocaleString()}  sub="total pipeline runs" />
          <StatCard label="Avg Duration" value={stats.avgDuration > 0 ? `${(stats.avgDuration / 1000).toFixed(1)}s` : '—'} sub="pipeline time" />
        </div>

        {/* Platform + Creator type */}
        <div className="two-col">
          {/* Platform */}
          <div className="card">
            <div className="card-head">
              <span className="card-title">Platform Distribution</span>
              <span className="card-meta">From loaded data</span>
            </div>
            <div style={{ padding: '8px 16px' }}>
              {platforms.length === 0
                ? <p style={{ fontSize: 12.5, color: '#A1A1AA', padding: '20px 0', textAlign: 'center' }}>No data yet</p>
                : platforms.map(p => (
                  <div key={p.name} style={{ padding: '8px 0', borderBottom: '1px solid #F4F4F5' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                      <span style={{ fontSize: 13, color: '#09090B', fontWeight: 500 }}>
                        {PLATFORM_ICONS[p.name] || '📺'} {p.name}
                      </span>
                      <span style={{ fontSize: 12.5, color: '#71717A', fontWeight: 500 }}>{p.count.toLocaleString()} · {p.pct}%</span>
                    </div>
                    <div className="bar-track">
                      <div className="bar-fill" style={{ width: `${(p.count / maxPlat) * 100}%` }} />
                    </div>
                  </div>
                ))
              }
            </div>
          </div>

          {/* Creator type breakdown */}
          <div className="card">
            <div className="card-head">
              <span className="card-title">Creator Types</span>
              <span className="card-meta">{creatorTypes.length} types</span>
            </div>
            {creatorTypes.length === 0
              ? <p style={{ fontSize: 12.5, color: '#A1A1AA', padding: '20px 16px', textAlign: 'center' }}>No data yet</p>
              : creatorTypes.map((ct, i) => {
                const maxCt = creatorTypes[0]?.count || 1;
                return (
                  <div className="ct-row" key={ct.type}>
                    <div style={{ minWidth: 0 }}>
                      <span style={{ fontSize: 13, color: '#09090B', fontWeight: 500, textTransform: 'capitalize' }}>{ct.type}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, marginLeft: 12 }}>
                      <div className="bar-track" style={{ flex: 1 }}>
                        <div className="bar-fill" style={{ width: `${(ct.count / maxCt) * 100}%` }} />
                      </div>
                      <span style={{ fontSize: 12, color: '#71717A', fontWeight: 600, whiteSpace: 'nowrap', minWidth: 30, textAlign: 'right' }}>{ct.count}</span>
                    </div>
                  </div>
                );
              })
            }
          </div>
        </div>

        {/* Toolbar */}
        <div className="toolbar">
          <div className="search-wrap">
            <svg className="search-icon" width="14" height="14" viewBox="0 0 14 14" fill="none">
              <circle cx="6" cy="6" r="4.5" stroke="currentColor" strokeWidth="1.4"/>
              <path d="M10 10l2.5 2.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
            </svg>
            <input className="search-input" type="text" placeholder="Search by email, niche or topic…" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <select className="filter-select" value={platFilter} onChange={e => setPlatFilter(e.target.value)}>
            <option value="all">All Platforms</option>
            {platforms.map(p => <option key={p.name} value={p.name}>{p.name}</option>)}
          </select>
          <select className="filter-select" value={dateRange} onChange={e => setDateRange(e.target.value)}>
            <option value="1">Today</option>
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
            <option value="90">Last 90 days</option>
            <option value="9999">All time</option>
          </select>
          <span className="result-count">{filtered.length.toLocaleString()} records</span>
        </div>

        {/* Table */}
        <div className="table-wrap">
          <div className="table-head">
            <span className="col-head">Time</span>
            <span className="col-head">User</span>
            <span className="col-head">Niche</span>
            <span className="col-head">Platform</span>
            <span className="col-head">Topic</span>
            <span className="col-head">Language</span>
            <span className="col-head">Duration</span>
          </div>

          {paged.length === 0
            ? <div style={{ textAlign: 'center', padding: '40px 20px', fontSize: 13, color: '#A1A1AA' }}>No generations found</div>
            : paged.map(g => (
              <div className="gen-row" key={g.id}>
                <div style={{ fontSize: 11, color: '#A1A1AA', lineHeight: 1.45 }}>
                  {new Date(g.generated_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}<br />
                  {new Date(g.generated_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })}
                </div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 12.5, fontWeight: 600, color: '#09090B', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{g.full_name || g.email}</div>
                  <div style={{ fontSize: 11, color: '#A1A1AA', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{g.email !== g.full_name ? g.email : ''}</div>
                </div>
                <div style={{ fontSize: 12.5, color: '#71717A', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{g.niche || '—'}</div>
                <div>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: '#F4F4F5', border: '1px solid #E4E4E7', borderRadius: 4, padding: '2px 7px', fontSize: 11.5, color: '#71717A', whiteSpace: 'nowrap' }}>
                    {PLATFORM_ICONS[g.platform] || '📺'} {g.platform}
                  </span>
                </div>
                <div style={{ fontSize: 12.5, color: '#09090B', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{g.chosen_topic || g.niche || '—'}</div>
                <div>
                  {g.language && g.language !== 'English'
                    ? <span style={{ background: '#F5F3FF', border: '1px solid #DDD6FE', color: '#7C3AED', borderRadius: 4, padding: '2px 7px', fontSize: 10.5, fontWeight: 600 }}>{g.language}</span>
                    : <span style={{ fontSize: 12, color: '#D4D4D8' }}>EN</span>
                  }
                </div>
                <div style={{ fontSize: 13, fontWeight: 600, color: g.generation_duration_ms > 0 ? '#16A34A' : '#D4D4D8' }}>
                  {g.generation_duration_ms > 0 ? `${(g.generation_duration_ms / 1000).toFixed(1)}s` : '—'}
                </div>
              </div>
            ))
          }

          {hasMore && (
            <button style={{ width: '100%', padding: '11px', background: '#FAFAFA', border: 'none', borderTop: '1px solid #F4F4F5', fontSize: 12.5, fontWeight: 500, color: '#71717A', cursor: 'pointer' }}
              onClick={() => setPage(p => p + 1)}>
              Load more — {filtered.length - paged.length} remaining
            </button>
          )}
        </div>

      </AdminShell>
    </>
  );
}