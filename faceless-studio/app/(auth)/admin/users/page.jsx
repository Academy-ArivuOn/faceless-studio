'use client';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { getSupabaseBrowser } from '@/packages/supabase-browser';
import AdminShell from '@/components/admin/AdminShell';

const PLAN_PRICES = { pro: 999, studio: 2499 };
const AVATAR_COLORS = ['#C9A227','#2563EB','#16A34A','#7C3AED','#DB2777','#0891B2','#EA580C','#9333EA'];

function PlanBadge({ plan }) {
  const styles = {
    free:   { bg: '#F4F4F5', color: '#71717A', border: '#E4E4E7' },
    pro:    { bg: '#FFFBEB', color: '#B45309', border: '#FDE68A' },
    studio: { bg: '#EFF6FF', color: '#1D4ED8', border: '#BFDBFE' },
  };
  const s = styles[plan] || styles.free;
  return (
    <span style={{ background: s.bg, color: s.color, border: `1px solid ${s.border}`, display: 'inline-flex', alignItems: 'center', padding: '2px 8px', borderRadius: 4, fontSize: 10.5, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.03em', whiteSpace: 'nowrap' }}>
      {plan}
    </span>
  );
}

function PlanModal({ user, onClose, onSave }) {
  const supabase   = getSupabaseBrowser();
  const [selected, setSelected] = useState(user.plan || 'free');
  const [saving,   setSaving]   = useState(false);

  async function handleSave() {
    if (selected === user.plan) { onClose(); return; }
    setSaving(true);
    const { error } = await supabase.from('user_usage')
      .update({ plan: selected, updated_at: new Date().toISOString() })
      .eq('user_id', user.id);
    setSaving(false);
    if (!error) { onSave(user.id, selected); onClose(); }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(9,9,11,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: 20 }}>
      <div style={{ background: '#FFFFFF', border: '1px solid #E4E4E7', borderRadius: 12, padding: 24, width: '100%', maxWidth: 380, boxShadow: '0 20px 48px rgba(0,0,0,0.12)' }}>
        <h3 style={{ fontSize: 16, fontWeight: 700, color: '#09090B', marginBottom: 4, letterSpacing: '-0.3px' }}>Change Plan</h3>
        <p style={{ fontSize: 12.5, color: '#71717A', marginBottom: 20 }}>{user.email}</p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
          {[
            { plan: 'free',   label: 'Free',          desc: '3 generations/month',    price: '₹0'      },
            { plan: 'pro',    label: 'Creator Pro',   desc: 'Unlimited · All Pro agents', price: '₹999/mo' },
            { plan: 'studio', label: 'Studio',        desc: 'All 13 agents · Teams',  price: '₹2,499/mo'},
          ].map(opt => {
            const isSelected = selected === opt.plan;
            const isCurrent  = user.plan === opt.plan;
            return (
              <button
                key={opt.plan}
                onClick={() => setSelected(opt.plan)}
                style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 14px', border: `1.5px solid ${isSelected ? '#09090B' : '#E4E4E7'}`, borderRadius: 8, background: isSelected ? '#FAFAFA' : '#FFFFFF', cursor: 'pointer', textAlign: 'left', transition: 'all 0.12s' }}
              >
                <div style={{ width: 16, height: 16, borderRadius: '50%', border: `2px solid ${isSelected ? '#09090B' : '#D4D4D8'}`, background: isSelected ? '#09090B' : '#FFFFFF', flex: 'shrink 0', transition: 'all 0.12s' }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#09090B' }}>{opt.label}{isCurrent && <span style={{ marginLeft: 6, fontSize: 10, color: '#71717A', fontWeight: 500 }}>(current)</span>}</div>
                  <div style={{ fontSize: 11.5, color: '#71717A', marginTop: 2 }}>{opt.desc}</div>
                </div>
                <span style={{ fontSize: 12.5, fontWeight: 600, color: '#09090B', whiteSpace: 'nowrap' }}>{opt.price}</span>
              </button>
            );
          })}
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={onClose} style={{ flex: 1, padding: '9px', border: '1px solid #E4E4E7', borderRadius: 7, background: '#FFFFFF', fontSize: 13, fontWeight: 500, color: '#71717A', cursor: 'pointer' }}>Cancel</button>
          <button onClick={handleSave} disabled={saving || selected === user.plan} style={{ flex: 1, padding: '9px', border: 'none', borderRadius: 7, background: '#09090B', fontSize: 13, fontWeight: 600, color: '#FFFFFF', cursor: 'pointer', opacity: saving || selected === user.plan ? 0.4 : 1 }}>
            {saving ? 'Saving…' : 'Update Plan'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AdminUsersPage() {
  const router   = useRouter();
  const supabase = getSupabaseBrowser();

  const [admin,      setAdmin]      = useState(null);
  const [pageLoading,setPageLoading]= useState(true);
  const [lastUpdated,setLastUpdated]= useState(null);

  const [users,      setUsers]      = useState([]);
  const [filtered,   setFiltered]   = useState([]);
  const [search,     setSearch]     = useState('');
  const [planFilter, setPlanFilter] = useState('all');
  const [sortBy,     setSortBy]     = useState('newest');
  const [page,       setPage]       = useState(1);
  const [modalUser,  setModalUser]  = useState(null);
  const PER_PAGE = 25;

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.replace('/admin/login'); return; }
      const { data: adm } = await supabase.from('admins').select('id,name,role,email').eq('user_id', session.user.id).single();
      if (!adm) { await supabase.auth.signOut(); router.replace('/admin/login'); return; }
      setAdmin(adm);
      await fetchUsers();
      setPageLoading(false);
    })();
  }, []);

  async function fetchUsers() {
    const [profilesRes, usageRes] = await Promise.all([
      supabase.from('profiles').select('id,email,full_name,creator_type,primary_niche,primary_platform,primary_language,streak_count,created_at,channel_size,creator_mode').order('created_at', { ascending: false }),
      supabase.from('user_usage').select('user_id,plan,generations_count,total_generations,reset_date,plan_activated_at'),
    ]);
    if (!profilesRes.data) return;
    const usageMap = {};
    (usageRes.data || []).forEach(u => { usageMap[u.user_id] = u; });
    setUsers(profilesRes.data.map(p => ({ ...p, ...usageMap[p.id] })));
    setLastUpdated(new Date().toISOString());
  }

  useEffect(() => {
    let r = [...users];
    if (search.trim()) {
      const q = search.toLowerCase();
      r = r.filter(u =>
        (u.email || '').toLowerCase().includes(q) ||
        (u.full_name || '').toLowerCase().includes(q) ||
        (u.primary_niche || '').toLowerCase().includes(q)
      );
    }
    if (planFilter !== 'all') r = r.filter(u => (u.plan || 'free') === planFilter);
    if (sortBy === 'oldest')  r = [...r].reverse();
    if (sortBy === 'gens')    r = [...r].sort((a, b) => (b.total_generations || 0) - (a.total_generations || 0));
    if (sortBy === 'streak')  r = [...r].sort((a, b) => (b.streak_count || 0) - (a.streak_count || 0));
    setFiltered(r);
    setPage(1);
  }, [search, planFilter, sortBy, users]);

  function handlePlanUpdate(userId, newPlan) {
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, plan: newPlan } : u));
  }

  const paged   = filtered.slice(0, page * PER_PAGE);
  const hasMore = paged.length < filtered.length;

  const planCounts = { all: users.length, free: 0, pro: 0, studio: 0 };
  users.forEach(u => { const p = u.plan || 'free'; if (p in planCounts) planCounts[p]++; });

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

        .stat-strip { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 18px; }
        .stat-mini { background: #FFFFFF; border: 1px solid #E4E4E7; border-radius: 8px; padding: 14px 16px; }
        .stat-mini-val { font-size: 24px; font-weight: 800; color: #09090B; letter-spacing: -0.04em; line-height: 1; margin-bottom: 3px; }
        .stat-mini-lbl { font-size: 11px; color: #71717A; font-weight: 500; text-transform: uppercase; letter-spacing: 0.06em; }

        .toolbar { display: flex; gap: 10px; margin-bottom: 14px; flex-wrap: wrap; align-items: center; }
        .search-wrap { flex: 1; min-width: 200px; position: relative; }
        .search-icon { position: absolute; left: 10px; top: 50%; transform: translateY(-50%); color: #A1A1AA; pointer-events: none; }
        .search-input { width: 100%; padding: 8px 12px 8px 32px; background: #FFFFFF; border: 1px solid #E4E4E7; border-radius: 7px; font-size: 13px; color: #09090B; outline: none; }
        .search-input::placeholder { color: #A1A1AA; }
        .search-input:focus { border-color: #09090B; }
        .filter-select { padding: 7px 28px 7px 10px; background: #FFFFFF url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6'%3E%3Cpath d='M1 1l4 4 4-4' stroke='%2371717A' strokeWidth='1.5' fill='none' strokeLinecap='round'/%3E%3C/svg%3E") no-repeat right 8px center; border: 1px solid #E4E4E7; border-radius: 7px; font-size: 12.5px; color: #09090B; outline: none; appearance: none; cursor: pointer; }
        .filter-select:focus { border-color: #09090B; }

        .plan-tabs { display: flex; gap: 6px; margin-bottom: 14px; flex-wrap: wrap; }
        .plan-tab { padding: 6px 13px; border-radius: 6px; border: 1px solid #E4E4E7; background: #FFFFFF; font-size: 12px; font-weight: 500; color: #71717A; cursor: pointer; transition: all 0.12s; display: flex; align-items: center; gap: 5px; }
        .plan-tab:hover { border-color: #D4D4D8; color: #09090B; }
        .plan-tab.active { background: #09090B; color: #FFFFFF; border-color: #09090B; font-weight: 600; }
        .plan-tab-count { background: rgba(255,255,255,0.15); border-radius: 3px; padding: 0 4px; font-size: 10px; }
        .plan-tab:not(.active) .plan-tab-count { background: #F4F4F5; color: #71717A; }

        .table-wrap { background: #FFFFFF; border: 1px solid #E4E4E7; border-radius: 10px; overflow: hidden; }
        .table-head { display: grid; grid-template-columns: 1fr 90px 130px 70px 80px 90px 100px; gap: 8px; padding: 9px 16px; background: #FAFAFA; border-bottom: 1px solid #E4E4E7; }
        .col-head { font-size: 10.5px; font-weight: 600; color: #71717A; text-transform: uppercase; letter-spacing: 0.06em; }
        .user-row { display: grid; grid-template-columns: 1fr 90px 130px 70px 80px 90px 100px; gap: 8px; align-items: center; padding: 10px 16px; border-bottom: 1px solid #F4F4F5; transition: background 0.1s; }
        .user-row:hover { background: #FAFAFA; }
        .user-row:last-child { border-bottom: none; }
        .user-avatar { width: 28px; height: 28px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 700; flex-shrink: 0; }
        .action-btn { background: #FFFFFF; border: 1px solid #E4E4E7; border-radius: 6px; padding: 5px 10px; font-size: 12px; font-weight: 500; color: #71717A; cursor: pointer; transition: all 0.12s; white-space: nowrap; }
        .action-btn:hover { border-color: #09090B; color: #09090B; }
        .result-count { font-size: 12px; color: '#A1A1AA'; margin-left: auto; color: #A1A1AA; }
        .empty-state { text-align: center; padding: 40px 20px; font-size: 13px; color: #A1A1AA; }

        @media (max-width: 1100px) { .stat-strip { grid-template-columns: 1fr 1fr; } }
        @media (max-width: 900px) { .table-head,.user-row { grid-template-columns: 1fr 90px 90px 80px; } .table-head > *:nth-child(n+5),.user-row > *:nth-child(n+5) { display: none; } }
        @media (max-width: 600px) { .table-head,.user-row { grid-template-columns: 1fr 80px; } .table-head > *:nth-child(n+3),.user-row > *:nth-child(n+3) { display: none; } .stat-strip { grid-template-columns: 1fr 1fr; } }
      `}</style>

      <AdminShell admin={admin} title="Users" onSignOut={async () => { await supabase.auth.signOut(); router.push('/admin/login'); }} lastUpdated={lastUpdated} onRefresh={fetchUsers}>

        {/* Stats strip */}
        <div className="stat-strip">
          {[
            { label: 'Total Users', value: users.length.toLocaleString() },
            { label: 'Free Plan',   value: planCounts.free.toLocaleString() },
            { label: 'Pro Plan',    value: planCounts.pro.toLocaleString() },
            { label: 'Studio Plan', value: planCounts.studio.toLocaleString() },
          ].map(s => (
            <div className="stat-mini" key={s.label}>
              <div className="stat-mini-val">{s.value}</div>
              <div className="stat-mini-lbl">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Toolbar */}
        <div className="toolbar">
          <div className="search-wrap">
            <svg className="search-icon" width="14" height="14" viewBox="0 0 14 14" fill="none">
              <circle cx="6" cy="6" r="4.5" stroke="currentColor" strokeWidth="1.4"/>
              <path d="M10 10l2.5 2.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
            </svg>
            <input className="search-input" type="text" placeholder="Search by name, email or niche…" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <select className="filter-select" value={sortBy} onChange={e => setSortBy(e.target.value)}>
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="gens">Most Generations</option>
            <option value="streak">Longest Streak</option>
          </select>
          <span className="result-count">{filtered.length.toLocaleString()} user{filtered.length !== 1 ? 's' : ''}</span>
        </div>

        {/* Plan filter tabs */}
        <div className="plan-tabs">
          {[
            { key: 'all', label: 'All Plans' },
            { key: 'free', label: 'Free' },
            { key: 'pro', label: 'Pro' },
            { key: 'studio', label: 'Studio' },
          ].map(t => (
            <button key={t.key} className={`plan-tab ${planFilter === t.key ? 'active' : ''}`} onClick={() => setPlanFilter(t.key)}>
              {t.label}
              <span className="plan-tab-count">{planCounts[t.key]}</span>
            </button>
          ))}
        </div>

        {/* Table */}
        <div className="table-wrap">
          <div className="table-head">
            <span className="col-head">User</span>
            <span className="col-head">Plan</span>
            <span className="col-head">Niche</span>
            <span className="col-head">Gens</span>
            <span className="col-head">Streak</span>
            <span className="col-head">Joined</span>
            <span className="col-head">Actions</span>
          </div>

          {paged.length === 0
            ? <div className="empty-state">No users match your filter.</div>
            : paged.map((u, i) => {
              const initials = (u.full_name || u.email || '?')[0].toUpperCase();
              const color    = AVATAR_COLORS[i % AVATAR_COLORS.length];
              const plan     = u.plan || 'free';
              return (
                <div className="user-row" key={u.id}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 9, minWidth: 0 }}>
                    <div className="user-avatar" style={{ background: `${color}18`, color }}>{initials}</div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#09090B', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.full_name || '—'}</div>
                      <div style={{ fontSize: 11, color: '#A1A1AA', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.email}</div>
                    </div>
                  </div>
                  <div><PlanBadge plan={plan} /></div>
                  <div style={{ fontSize: 12.5, color: '#71717A', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.primary_niche || <span style={{ color: '#D4D4D8' }}>—</span>}</div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: (u.total_generations || 0) > 10 ? '#B45309' : '#09090B' }}>{u.total_generations || 0}</div>
                  <div style={{ fontSize: 13, color: '#09090B' }}>
                    {(u.streak_count || 0) > 0 ? <span style={{ color: '#EA580C', fontWeight: 600 }}>🔥 {u.streak_count}d</span> : <span style={{ color: '#D4D4D8' }}>—</span>}
                  </div>
                  <div style={{ fontSize: 12, color: '#A1A1AA' }}>
                    {new Date(u.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: '2-digit' })}
                  </div>
                  <div>
                    <button className="action-btn" onClick={() => setModalUser(u)}>Change Plan</button>
                  </div>
                </div>
              );
            })
          }

          {hasMore && (
            <button style={{ width: '100%', padding: '11px', background: '#FAFAFA', border: 'none', borderTop: '1px solid #F4F4F5', fontSize: 12.5, fontWeight: 500, color: '#71717A', cursor: 'pointer' }}
              onClick={() => setPage(p => p + 1)}>
              Load more — {filtered.length - paged.length} remaining
            </button>
          )}
        </div>

      </AdminShell>

      {modalUser && <PlanModal user={modalUser} onClose={() => setModalUser(null)} onSave={handlePlanUpdate} />}
    </>
  );
}