'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getSupabaseBrowser } from '@/lib/supabase-browser';

// ─── DASHBOARD PAGE — Corporate Premium White Theme ────────────────────────

export default function DashboardPage() {
  const router   = useRouter();
  const supabase = getSupabaseBrowser();

  const [user,    setUser]    = useState(null);
  const [usage,   setUsage]   = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) { router.replace('/login'); return; }
      setUser(session.user);
      const [usageRes, histRes] = await Promise.all([
        fetch('/api/usage', { headers:{ Authorization:`Bearer ${session.access_token}` }}),
        supabase.from('generations')
          .select('id,niche,platform,creator_type,chosen_topic,chosen_hook,generated_at')
          .order('generated_at',{ ascending:false })
          .limit(20),
      ]);
      const usageJson = await usageRes.json();
      if (usageJson.success) setUsage(usageJson.usage);
      if (!histRes.error) setHistory(histRes.data || []);
      setLoading(false);
    });
  }, []);

  if (loading) return (
    <div style={{ minHeight:'100vh', background:'#FFFFFF', display:'flex', alignItems:'center', justifyContent:'center' }}>
      <div style={{ width:24, height:24, borderRadius:'50%', border:'2px solid #E8E8E8', borderTopColor:'#0A0A0A', animation:'spin 0.7s linear infinite' }} />
      <style>{`@keyframes spin { to { transform:rotate(360deg); } }`}</style>
    </div>
  );

  const plan      = usage?.plan || 'free';
  const resetDate = usage?.reset_date
    ? new Date(usage.reset_date).toLocaleDateString('en-IN',{ day:'numeric', month:'short', year:'numeric' })
    : null;

  const usagePct = plan === 'free' && usage?.limit
    ? Math.min(100, ((usage.used || 0) / usage.limit) * 100)
    : 100;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;800&family=DM+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');

        *, *::before, *::after { box-sizing:border-box; margin:0; padding:0; }
        @keyframes spin { to { transform:rotate(360deg); } }

        .dash-root {
          min-height: 100vh;
          background: #FFFFFF;
          font-family: 'DM Sans', sans-serif;
          color: #0A0A0A;
        }

        /* ── TOPBAR ── */
        .dash-topbar {
          height: 60px;
          border-bottom: 1px solid #E8E8E8;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 40px;
          background: #FFFFFF;
          position: sticky;
          top: 0;
          z-index: 100;
        }

        .dash-topbar-left {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .dash-logo-box {
          width: 30px; height: 30px;
          background: #0A0A0A;
          border-radius: 7px;
          display: flex; align-items: center; justify-content: center;
        }

        .dash-brand {
          font-family: 'Playfair Display', serif;
          font-size: 16px;
          font-weight: 700;
          color: #0A0A0A;
        }

        .dash-sep { color: #E8E8E8; margin: 0 4px; }

        .dash-crumb {
          font-size: 14px;
          color: #8C8C8C;
          font-weight: 500;
        }

        .dash-topbar-right {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .dash-nav-btn {
          background: none;
          border: none;
          font-family: 'DM Sans', sans-serif;
          font-size: 13px;
          font-weight: 500;
          color: #8C8C8C;
          cursor: pointer;
          transition: color 0.15s;
          padding: 0;
          text-decoration: none;
          display: inline-flex;
        }
        .dash-nav-btn:hover { color: #0A0A0A; }

        .dash-generate-btn {
          background: #0A0A0A;
          border: none;
          border-radius: 8px;
          padding: 9px 18px;
          font-family: 'DM Sans', sans-serif;
          font-size: 13px;
          font-weight: 700;
          color: #FFFFFF;
          cursor: pointer;
          transition: all 0.2s;
          letter-spacing: -0.01em;
        }
        .dash-generate-btn:hover {
          background: #1a1a1a;
          transform: translateY(-1px);
          box-shadow: 0 4px 14px rgba(10,10,10,0.2);
        }

        /* ── MAIN ── */
        .dash-main {
          max-width: 1040px;
          margin: 0 auto;
          padding: 48px 40px 100px;
        }

        /* ── PAGE HEADER ── */
        .dash-page-header {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          margin-bottom: 48px;
          padding-bottom: 32px;
          border-bottom: 1px solid #F0F0F0;
          flex-wrap: wrap;
          gap: 16px;
        }

        .dash-page-eyebrow {
          font-family: 'JetBrains Mono', monospace;
          font-size: 10px;
          color: #8C8C8C;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          margin-bottom: 8px;
        }

        .dash-page-title {
          font-family: 'Playfair Display', serif;
          font-size: 32px;
          font-weight: 800;
          color: #0A0A0A;
          letter-spacing: -0.04em;
          line-height: 1.15;
          margin-bottom: 4px;
        }

        .dash-page-email {
          font-size: 13px;
          color: #8C8C8C;
          font-weight: 400;
        }

        /* ── STATS ── */
        .dash-stats-row {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 16px;
          margin-bottom: 40px;
        }

        .dash-stat-card {
          border: 1.5px solid #E8E8E8;
          border-radius: 12px;
          padding: 24px;
          background: #FFFFFF;
          transition: border-color 0.2s, box-shadow 0.2s;
        }
        .dash-stat-card:hover {
          border-color: #D8D8D8;
          box-shadow: 0 4px 16px rgba(10,10,10,0.05);
        }

        .dash-stat-card.accent {
          border-color: #C9A227;
          background: #FFFDF5;
        }

        .dash-stat-card.warn {
          border-color: #FCA5A5;
          background: #FEF2F2;
        }

        .dash-stat-label {
          font-size: 10px;
          font-weight: 700;
          color: #8C8C8C;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          margin-bottom: 12px;
        }

        .dash-stat-value {
          font-family: 'Playfair Display', serif;
          font-size: 36px;
          font-weight: 800;
          color: #0A0A0A;
          letter-spacing: -0.04em;
          line-height: 1;
          margin-bottom: 6px;
        }

        .dash-stat-value.gold { color: #C9A227; }
        .dash-stat-value.red  { color: #DC2626; }

        .dash-stat-sub {
          font-size: 12px;
          color: #BCBCBC;
          font-weight: 400;
        }

        /* Usage bar */
        .dash-usage-bar-wrap {
          margin-bottom: 32px;
        }

        .dash-usage-bar-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;
        }

        .dash-usage-bar-label {
          font-size: 12px;
          font-weight: 600;
          color: #5C5C5C;
        }

        .dash-usage-bar-pct {
          font-family: 'JetBrains Mono', monospace;
          font-size: 11px;
          color: #8C8C8C;
        }

        .dash-usage-bar-track {
          height: 4px;
          background: #F0F0F0;
          border-radius: 2px;
          overflow: hidden;
        }

        .dash-usage-bar-fill {
          height: 100%;
          border-radius: 2px;
          background: #0A0A0A;
          transition: width 0.6s ease;
        }

        .dash-usage-bar-fill.warn { background: #DC2626; }
        .dash-usage-bar-fill.mid  { background: #C9A227; }

        /* ── UPGRADE BANNER ── */
        .dash-upgrade-banner {
          background: #0A0A0A;
          border-radius: 12px;
          padding: 24px 28px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 20px;
          margin-bottom: 40px;
          flex-wrap: wrap;
        }

        .dash-upgrade-title {
          font-family: 'Playfair Display', serif;
          font-size: 18px;
          font-weight: 700;
          color: #FFFFFF;
          margin-bottom: 4px;
          letter-spacing: -0.02em;
        }

        .dash-upgrade-sub {
          font-size: 13px;
          color: rgba(255,255,255,0.5);
          line-height: 1.5;
        }

        .dash-upgrade-btn {
          background: #C9A227;
          border: none;
          border-radius: 8px;
          padding: 12px 24px;
          font-family: 'DM Sans', sans-serif;
          font-size: 14px;
          font-weight: 700;
          color: #0A0A0A;
          cursor: pointer;
          white-space: nowrap;
          transition: all 0.2s;
          letter-spacing: -0.01em;
          flex-shrink: 0;
        }
        .dash-upgrade-btn:hover { background: #D4A733; transform: translateY(-1px); }

        /* ── SECTION ── */
        .dash-section { margin-bottom: 48px; }

        .dash-section-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 20px;
        }

        .dash-section-title {
          font-family: 'Playfair Display', serif;
          font-size: 20px;
          font-weight: 700;
          color: #0A0A0A;
          letter-spacing: -0.02em;
        }

        .dash-section-count {
          font-family: 'JetBrains Mono', monospace;
          font-size: 11px;
          color: #8C8C8C;
          background: #F5F5F5;
          border: 1px solid #E8E8E8;
          border-radius: 100px;
          padding: 3px 10px;
        }

        /* ── EMPTY STATE ── */
        .dash-empty {
          border: 1.5px dashed #E8E8E8;
          border-radius: 12px;
          padding: 64px 24px;
          text-align: center;
        }

        .dash-empty-icon {
          font-size: 32px;
          margin-bottom: 16px;
          display: block;
          opacity: 0.3;
        }

        .dash-empty-title {
          font-family: 'Playfair Display', serif;
          font-size: 20px;
          font-weight: 700;
          color: #0A0A0A;
          margin-bottom: 8px;
          letter-spacing: -0.02em;
        }

        .dash-empty-sub {
          font-size: 14px;
          color: #8C8C8C;
          line-height: 1.6;
          margin-bottom: 24px;
          max-width: 360px;
          margin-left: auto;
          margin-right: auto;
        }

        .dash-empty-cta {
          background: #0A0A0A;
          border: none;
          border-radius: 9px;
          padding: 12px 24px;
          font-family: 'DM Sans', sans-serif;
          font-size: 14px;
          font-weight: 700;
          color: #FFFFFF;
          cursor: pointer;
          transition: all 0.2s;
        }
        .dash-empty-cta:hover { background: #1a1a1a; transform: translateY(-1px); }

        /* ── HISTORY TABLE ── */
        .dash-table {
          border: 1.5px solid #E8E8E8;
          border-radius: 12px;
          overflow: hidden;
        }

        .dash-table-header {
          display: grid;
          grid-template-columns: 1fr 130px 110px 90px;
          padding: 12px 20px;
          background: #F8F8F8;
          border-bottom: 1px solid #E8E8E8;
        }

        .dash-table-col-head {
          font-size: 10px;
          font-weight: 700;
          color: #8C8C8C;
          text-transform: uppercase;
          letter-spacing: 0.08em;
        }

        .dash-table-body { display: flex; flex-direction: column; }

        .dash-table-row {
          display: grid;
          grid-template-columns: 1fr 130px 110px 90px;
          padding: 16px 20px;
          border-bottom: 1px solid #F0F0F0;
          align-items: center;
          transition: background 0.15s;
          cursor: pointer;
        }
        .dash-table-row:last-child { border-bottom: none; }
        .dash-table-row:hover { background: #F8F8F8; }

        .dash-table-topic {
          font-size: 13px;
          font-weight: 600;
          color: #0A0A0A;
          line-height: 1.4;
          margin-bottom: 3px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          max-width: 95%;
        }

        .dash-table-hook {
          font-size: 12px;
          color: #8C8C8C;
          font-style: italic;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          max-width: 95%;
        }

        .dash-platform-chip {
          display: inline-block;
          background: #F0F0F0;
          border: 1px solid #E8E8E8;
          border-radius: 5px;
          padding: 3px 9px;
          font-size: 11px;
          font-weight: 600;
          color: #5C5C5C;
          white-space: nowrap;
        }

        .dash-type-text {
          font-size: 12px;
          color: #8C8C8C;
          text-transform: capitalize;
        }

        .dash-date-text {
          font-family: 'JetBrains Mono', monospace;
          font-size: 11px;
          color: #BCBCBC;
          white-space: nowrap;
        }

        /* ── PLAN SECTION ── */
        .dash-plan-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
        }

        .dash-plan-card {
          border: 1.5px solid #E8E8E8;
          border-radius: 12px;
          padding: 24px;
          background: #FFFFFF;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          flex-wrap: wrap;
        }

        .dash-plan-label {
          font-size: 10px;
          font-weight: 700;
          color: #BCBCBC;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          margin-bottom: 6px;
        }

        .dash-plan-name {
          font-family: 'Playfair Display', serif;
          font-size: 28px;
          font-weight: 800;
          color: #0A0A0A;
          letter-spacing: -0.04em;
        }

        .dash-view-plans-btn {
          background: transparent;
          border: 1.5px solid #E8E8E8;
          border-radius: 8px;
          padding: 9px 16px;
          font-family: 'DM Sans', sans-serif;
          font-size: 13px;
          font-weight: 600;
          color: #5C5C5C;
          cursor: pointer;
          transition: all 0.2s;
          flex-shrink: 0;
        }
        .dash-view-plans-btn:hover { border-color: #0A0A0A; color: #0A0A0A; }

        .dash-features-card {
          border: 1.5px solid #E8E8E8;
          border-radius: 12px;
          overflow: hidden;
          background: #FFFFFF;
        }

        .dash-feature-row {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 13px 20px;
          border-bottom: 1px solid #F5F5F5;
        }
        .dash-feature-row:last-child { border-bottom: none; }

        .dash-feature-dot {
          width: 7px; height: 7px;
          border-radius: 50%;
          flex-shrink: 0;
        }

        .dash-feature-text {
          font-size: 13px;
          color: #3C3C3C;
          flex: 1;
        }

        .dash-feature-text.inactive {
          color: #BCBCBC;
          text-decoration: line-through;
        }

        .dash-feature-badge {
          font-size: 10px;
          font-weight: 600;
          padding: 2px 8px;
          border-radius: 100px;
          color: #8C8C8C;
          background: #F5F5F5;
          text-transform: uppercase;
          letter-spacing: 0.06em;
        }

        /* Responsive */
        @media (max-width: 900px) {
          .dash-stats-row { grid-template-columns: repeat(2, 1fr); }
          .dash-plan-grid { grid-template-columns: 1fr; }
        }
        @media (max-width: 640px) {
          .dash-table-header,
          .dash-table-row { grid-template-columns: 1fr 100px; }
          .dash-table-header > *:nth-child(3),
          .dash-table-header > *:nth-child(4),
          .dash-table-row > *:nth-child(3),
          .dash-table-row > *:nth-child(4) { display: none; }
          .dash-main { padding: 32px 20px 80px; }
          .dash-topbar { padding: 0 20px; }
          .dash-stats-row { grid-template-columns: 1fr 1fr; }
        }
      `}</style>

      <div className="dash-root">

        {/* ── Topbar ── */}
        <header className="dash-topbar">
          <div className="dash-topbar-left">
            <div className="dash-logo-box">
              <svg width="14" height="14" viewBox="0 0 20 20" fill="none">
                <polygon points="10,2 17,6 17,14 10,18 3,14 3,6" stroke="#FFFFFF" strokeWidth="1.4" fill="none"/>
                <polygon points="10,6 14,8.5 14,13.5 10,16 6,13.5 6,8.5" fill="#FFFFFF" fillOpacity="0.3"/>
              </svg>
            </div>
            <span className="dash-brand">Studio AI</span>
            <span className="dash-sep">/</span>
            <span className="dash-crumb">Dashboard</span>
          </div>
          <div className="dash-topbar-right">
            <button className="dash-nav-btn" onClick={() => router.push('/agents')}>Agents</button>
            <button
              className="dash-generate-btn"
              onClick={() => router.push('/generate')}
            >
              + Generate →
            </button>
            <button
              className="dash-nav-btn"
              style={{ marginLeft: 8 }}
              onClick={async () => { await supabase.auth.signOut(); router.push('/login'); }}
            >
              Sign out
            </button>
          </div>
        </header>

        <main className="dash-main">

          {/* ── Page Header ── */}
          <div className="dash-page-header">
            <div>
              <div className="dash-page-eyebrow">Workspace</div>
              <h1 className="dash-page-title">Dashboard</h1>
              <p className="dash-page-email">{user?.email}</p>
            </div>
          </div>

          {/* ── Stats ── */}
          <div className="dash-stats-row">
            <div className={`dash-stat-card ${plan !== 'free' ? 'accent' : ''}`}>
              <div className="dash-stat-label">Current Plan</div>
              <div className={`dash-stat-value ${plan !== 'free' ? 'gold' : ''}`}>
                {plan.charAt(0).toUpperCase() + plan.slice(1)}
              </div>
              <div className="dash-stat-sub">{plan === 'free' ? '3 gens/month' : 'Unlimited generations'}</div>
            </div>

            <div className="dash-stat-card">
              <div className="dash-stat-label">Used This Month</div>
              <div className="dash-stat-value">{usage?.used || 0}</div>
              <div className="dash-stat-sub">{resetDate ? `Resets ${resetDate}` : 'Unlimited'}</div>
            </div>

            <div className={`dash-stat-card ${(usage?.remaining ?? 1) === 0 && plan === 'free' ? 'warn' : ''}`}>
              <div className="dash-stat-label">Remaining</div>
              <div className={`dash-stat-value ${(usage?.remaining ?? 1) === 0 && plan === 'free' ? 'red' : ''}`}>
                {plan === 'free' ? `${usage?.remaining ?? 0}` : '∞'}
              </div>
              <div className="dash-stat-sub">
                {plan === 'free' ? `of ${usage?.limit} free` : 'No limit on this plan'}
              </div>
            </div>

            <div className="dash-stat-card">
              <div className="dash-stat-label">All Time</div>
              <div className="dash-stat-value">{history.length}</div>
              <div className="dash-stat-sub">Content packs generated</div>
            </div>
          </div>

          {/* Usage bar */}
          {plan === 'free' && (
            <div className="dash-usage-bar-wrap">
              <div className="dash-usage-bar-header">
                <span className="dash-usage-bar-label">Monthly usage</span>
                <span className="dash-usage-bar-pct">{usage?.used || 0} / {usage?.limit}</span>
              </div>
              <div className="dash-usage-bar-track">
                <div
                  className={`dash-usage-bar-fill ${usagePct >= 100 ? 'warn' : usagePct >= 66 ? 'mid' : ''}`}
                  style={{ width: `${usagePct}%` }}
                />
              </div>
            </div>
          )}

          {/* Upgrade banner */}
          {plan === 'free' && (usage?.remaining ?? 1) === 0 && (
            <div className="dash-upgrade-banner">
              <div>
                <div className="dash-upgrade-title">Monthly limit reached.</div>
                <div className="dash-upgrade-sub">
                  Upgrade to Creator Pro for unlimited generations and all 8 AI agents.
                </div>
              </div>
              <button className="dash-upgrade-btn" onClick={() => router.push('/#pricing')}>
                Upgrade — ₹399/mo
              </button>
            </div>
          )}

          {/* ── Generation History ── */}
          <div className="dash-section">
            <div className="dash-section-header">
              <h2 className="dash-section-title">Recent Generations</h2>
              {history.length > 0 && (
                <span className="dash-section-count">{history.length}</span>
              )}
            </div>

            {history.length === 0 ? (
              <div className="dash-empty">
                <span className="dash-empty-icon">◈</span>
                <h3 className="dash-empty-title">No generations yet</h3>
                <p className="dash-empty-sub">
                  Your content packs will appear here after your first generation. It takes under 90 seconds.
                </p>
                <button className="dash-empty-cta" onClick={() => router.push('/generate')}>
                  Generate your first content pack →
                </button>
              </div>
            ) : (
              <div className="dash-table">
                <div className="dash-table-header">
                  <span className="dash-table-col-head">Niche / Topic</span>
                  <span className="dash-table-col-head">Platform</span>
                  <span className="dash-table-col-head">Type</span>
                  <span className="dash-table-col-head">Date</span>
                </div>
                <div className="dash-table-body">
                  {history.map(gen => (
                    <div
                      className="dash-table-row"
                      key={gen.id}
                      onClick={() => {/* could link to result detail */}}
                    >
                      <div>
                        <div className="dash-table-topic">
                          {gen.chosen_topic || gen.niche}
                        </div>
                        {gen.chosen_hook && (
                          <div className="dash-table-hook">"{gen.chosen_hook}"</div>
                        )}
                      </div>
                      <div>
                        <span className="dash-platform-chip">{gen.platform}</span>
                      </div>
                      <div>
                        <span className="dash-type-text">{gen.creator_type}</span>
                      </div>
                      <div>
                        <span className="dash-date-text">
                          {new Date(gen.generated_at).toLocaleDateString('en-IN',{ day:'numeric', month:'short' })}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* ── Plan & Features ── */}
          <div className="dash-section">
            <div className="dash-section-header">
              <h2 className="dash-section-title">Your Plan</h2>
            </div>

            <div className="dash-plan-grid">
              <div className="dash-plan-card">
                <div>
                  <div className="dash-plan-label">Active Plan</div>
                  <div className="dash-plan-name">
                    {plan.charAt(0).toUpperCase() + plan.slice(1)}
                  </div>
                </div>
                {plan === 'free' && (
                  <button
                    className="dash-view-plans-btn"
                    onClick={() => router.push('/#pricing')}
                  >
                    View Plans →
                  </button>
                )}
              </div>

              <div className="dash-features-card">
                {[
                  { label:'Research Agent',   active:true,  note:'Free' },
                  { label:'Creator Agent',    active:true,  note:'Free' },
                  { label:'Publisher Agent',  active:true,  note:'Free' },
                  { label:'Hook Upgrader',    active:plan !== 'free', note:'Pro+' },
                  { label:'Title Battle',     active:plan !== 'free', note:'Pro+' },
                  { label:'Competitor Autopsy',active:plan === 'studio', note:'Studio' },
                  { label:'Script Localiser', active:plan === 'studio', note:'Studio' },
                ].map(f => (
                  <div className="dash-feature-row" key={f.label}>
                    <div
                      className="dash-feature-dot"
                      style={{ background: f.active ? '#0E7C4A' : '#E8E8E8' }}
                    />
                    <span className={`dash-feature-text ${f.active ? '' : 'inactive'}`}>{f.label}</span>
                    <span className="dash-feature-badge">{f.note}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

        </main>
      </div>
    </>
  );
}