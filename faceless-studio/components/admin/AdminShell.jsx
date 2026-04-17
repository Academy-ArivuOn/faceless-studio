'use client';
import { usePathname, useRouter } from 'next/navigation';

const NAV = [
  { path: '/admin',             label: 'Overview',    icon: <GridIcon /> },
  { path: '/admin/users',       label: 'Users',       icon: <UsersIcon /> },
  { path: '/admin/generations', label: 'Generations', icon: <ActivityIcon /> },
  { path: '/admin/revenue',     label: 'Revenue',     icon: <TrendIcon /> },
];

function GridIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
      <rect x="1" y="1" width="5.5" height="5.5" rx="1" stroke="currentColor" strokeWidth="1.3"/>
      <rect x="8.5" y="1" width="5.5" height="5.5" rx="1" stroke="currentColor" strokeWidth="1.3"/>
      <rect x="1" y="8.5" width="5.5" height="5.5" rx="1" stroke="currentColor" strokeWidth="1.3"/>
      <rect x="8.5" y="8.5" width="5.5" height="5.5" rx="1" stroke="currentColor" strokeWidth="1.3"/>
    </svg>
  );
}
function UsersIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
      <circle cx="5.5" cy="4.5" r="2.5" stroke="currentColor" strokeWidth="1.3"/>
      <path d="M1 13c0-2.5 2-4 4.5-4s4.5 1.5 4.5 4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
      <path d="M10 6.5c1.5 0 3 1 3 3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
      <circle cx="10.5" cy="4" r="1.8" stroke="currentColor" strokeWidth="1.3"/>
    </svg>
  );
}
function ActivityIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
      <polyline points="1,10 4,6 7,8 10,4 14,7" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}
function TrendIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
      <path d="M1 11l4-4 3 3 6-7" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M10 3h4v4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}
function SignOutIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <path d="M5 2H2a1 1 0 00-1 1v8a1 1 0 001 1h3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
      <path d="M9 10l3-3-3-3M12 7H5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

export default function AdminShell({ admin, title, children, onSignOut, lastUpdated, onRefresh }) {
  const pathname = usePathname();
  const router   = useRouter();

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        @keyframes spin { to { transform: rotate(360deg); } }
        body { background: #F4F4F5; font-family: 'Plus Jakarta Sans', sans-serif; }
        * { font-family: 'Plus Jakarta Sans', sans-serif; }

        /* ── Shell layout ── */
        .shell { display: flex; min-height: 100vh; }

        /* ── Sidebar ── */
        .sidebar {
          width: 220px; flex-shrink: 0; background: #111111;
          display: flex; flex-direction: column;
          position: fixed; top: 0; left: 0; bottom: 0; z-index: 100;
        }

        .sidebar-logo {
          height: 56px; display: flex; align-items: center; gap: 9px;
          padding: 0 20px; border-bottom: 1px solid rgba(255,255,255,0.07);
        }

        .logo-mark {
          width: 26px; height: 26px; background: #C9A227; border-radius: 6px;
          display: flex; align-items: center; justify-content: center;
          font-size: 13px; font-weight: 800; color: #111; flex-shrink: 0;
          letter-spacing: -0.5px;
        }

        .logo-text { font-size: 14px; font-weight: 700; color: #FFFFFF; letter-spacing: -0.3px; }
        .logo-sub  { font-size: 10px; font-weight: 500; color: rgba(255,255,255,0.35); letter-spacing: 0.02em; margin-top: 1px; }

        .sidebar-nav { flex: 1; padding: 16px 12px; display: flex; flex-direction: column; gap: 1px; }

        .nav-label { font-size: 10px; font-weight: 600; color: rgba(255,255,255,0.2); text-transform: uppercase; letter-spacing: 0.1em; padding: 8px 8px 5px; }

        .nav-item {
          display: flex; align-items: center; gap: 9px;
          padding: 8px 10px; border-radius: 7px; border: none;
          background: transparent; cursor: pointer; color: rgba(255,255,255,0.45);
          font-size: 13.5px; font-weight: 500; transition: all 0.12s;
          text-align: left; width: 100%; letter-spacing: -0.1px;
        }

        .nav-item:hover { background: rgba(255,255,255,0.06); color: rgba(255,255,255,0.85); }

        .nav-item.active {
          background: rgba(201,162,39,0.15); color: #C9A227; font-weight: 600;
        }

        .nav-item svg { flex-shrink: 0; }

        .sidebar-footer {
          padding: 14px 16px; border-top: 1px solid rgba(255,255,255,0.07);
        }

        .admin-badge {
          display: flex; align-items: center; gap: 9px; margin-bottom: 10px;
        }

        .admin-avatar {
          width: 28px; height: 28px; border-radius: 50%; background: #C9A227;
          display: flex; align-items: center; justify-content: center;
          font-size: 11px; font-weight: 700; color: #111; flex-shrink: 0;
        }

        .admin-name  { font-size: 12.5px; font-weight: 600; color: rgba(255,255,255,0.85); }
        .admin-role  { font-size: 10px; font-weight: 500; color: rgba(255,255,255,0.3); text-transform: capitalize; margin-top: 1px; }

        .signout-btn {
          display: flex; align-items: center; gap: 7px;
          background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08);
          border-radius: 6px; padding: 7px 10px; color: rgba(255,255,255,0.35);
          font-size: 12px; font-weight: 500; cursor: pointer; transition: all 0.12s;
          width: 100%;
        }

        .signout-btn:hover { background: rgba(220,38,38,0.1); border-color: rgba(220,38,38,0.2); color: #EF4444; }

        /* ── Main area ── */
        .main { flex: 1; margin-left: 220px; display: flex; flex-direction: column; min-height: 100vh; }

        /* ── Topbar ── */
        .topbar {
          height: 56px; background: #FFFFFF; border-bottom: 1px solid #E4E4E7;
          display: flex; align-items: center; justify-content: space-between;
          padding: 0 28px; position: sticky; top: 0; z-index: 50;
        }

        .topbar-left { display: flex; align-items: center; gap: 10px; }
        .topbar-title { font-size: 15px; font-weight: 700; color: #09090B; letter-spacing: -0.3px; }
        .topbar-right { display: flex; align-items: center; gap: 10px; }

        .refresh-btn {
          display: flex; align-items: center; gap: 5px;
          background: transparent; border: 1px solid #E4E4E7; border-radius: 6px;
          padding: 5px 10px; font-size: 12px; font-weight: 500; color: #71717A;
          cursor: pointer; transition: all 0.12s;
        }

        .refresh-btn:hover { background: #F4F4F5; border-color: #D4D4D8; color: #09090B; }

        .last-updated { font-size: 11px; color: #A1A1AA; }

        /* ── Page content ── */
        .page-content { flex: 1; padding: 24px 28px 48px; }

        /* ── Responsive ── */
        @media (max-width: 900px) {
          .sidebar { display: none; }
          .main { margin-left: 0; }
          .topbar { padding: 0 16px; }
          .page-content { padding: 20px 16px 40px; }
        }

        /* ── Shared table styles ── */
        .data-table { width: 100%; border-collapse: collapse; }
        .data-table th { padding: 10px 16px; text-align: left; font-size: 11px; font-weight: 600; color: #71717A; text-transform: uppercase; letter-spacing: 0.06em; border-bottom: 1px solid #E4E4E7; background: #FAFAFA; white-space: nowrap; }
        .data-table td { padding: 11px 16px; font-size: 13px; color: #09090B; border-bottom: 1px solid #F4F4F5; vertical-align: middle; }
        .data-table tr:last-child td { border-bottom: none; }
        .data-table tbody tr:hover td { background: #FAFAFA; }

        /* ── Shared card ── */
        .card { background: #FFFFFF; border: 1px solid #E4E4E7; border-radius: 10px; }

        /* ── Shared badge ── */
        .badge-free   { background: #F4F4F5; color: #71717A; border: 1px solid #E4E4E7; }
        .badge-pro    { background: #FFFBEB; color: #B45309; border: 1px solid #FDE68A; }
        .badge-studio { background: #EFF6FF; color: #1D4ED8; border: 1px solid #BFDBFE; }
        .badge { display: inline-flex; align-items: center; padding: 2px 8px; border-radius: 4px; font-size: 10.5px; font-weight: 600; letter-spacing: 0.02em; white-space: nowrap; text-transform: uppercase; }

        /* ── Select ── */
        .filter-select { padding: 6px 28px 6px 10px; background: #FFFFFF url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6'%3E%3Cpath d='M1 1l4 4 4-4' stroke='%2371717A' strokeWidth='1.5' fill='none' strokeLinecap='round'/%3E%3C/svg%3E") no-repeat right 8px center; border: 1px solid #E4E4E7; border-radius: 6px; font-size: 12.5px; color: #09090B; outline: none; appearance: none; cursor: pointer; }
        .filter-select:focus { border-color: #C9A227; }
        .filter-select option { background: #FFFFFF; }

        /* ── Search ── */
        .search-input { padding: 7px 12px 7px 32px; background: #FFFFFF; border: 1px solid #E4E4E7; border-radius: 6px; font-size: 13px; color: #09090B; outline: none; width: 100%; }
        .search-input::placeholder { color: #A1A1AA; }
        .search-input:focus { border-color: #C9A227; }

        /* ── Load more ── */
        .load-more-btn { width: 100%; padding: 11px; background: #FAFAFA; border: none; border-top: 1px solid #F4F4F5; font-size: 12.5px; font-weight: 500; color: #71717A; cursor: pointer; border-radius: 0 0 10px 10px; transition: all 0.12s; }
        .load-more-btn:hover { background: #F4F4F5; color: #09090B; }

        /* ── Section header ── */
        .section-head { display: flex; align-items: center; justify-content: space-between; padding: 14px 16px 12px; border-bottom: 1px solid #F4F4F5; }
        .section-title { font-size: 13.5px; font-weight: 700; color: #09090B; letter-spacing: -0.2px; }
        .section-meta { font-size: 12px; color: #A1A1AA; font-weight: 500; }
      `}</style>

      <div className="shell">
        {/* ── Sidebar ── */}
        <aside className="sidebar">
          <div className="sidebar-logo">
            <div className="logo-mark">S</div>
            <div>
              <div className="logo-text">Studio AI</div>
              <div className="logo-sub">Admin Console</div>
            </div>
          </div>

          <nav className="sidebar-nav">
            <div className="nav-label">Menu</div>
            {NAV.map(item => (
              <button
                key={item.path}
                className={`nav-item ${pathname === item.path ? 'active' : ''}`}
                onClick={() => router.push(item.path)}
              >
                {item.icon}
                {item.label}
              </button>
            ))}
          </nav>

          <div className="sidebar-footer">
            {admin && (
              <div className="admin-badge">
                <div className="admin-avatar">{(admin.name || '?')[0].toUpperCase()}</div>
                <div>
                  <div className="admin-name">{admin.name}</div>
                  <div className="admin-role">{admin.role}</div>
                </div>
              </div>
            )}
            <button className="signout-btn" onClick={onSignOut}>
              <SignOutIcon /> Sign Out
            </button>
          </div>
        </aside>

        {/* ── Main ── */}
        <div className="main">
          <header className="topbar">
            <div className="topbar-left">
              <span className="topbar-title">{title}</span>
            </div>
            <div className="topbar-right">
              {lastUpdated && (
                <span className="last-updated">
                  Updated {new Date(lastUpdated).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                </span>
              )}
              {onRefresh && (
                <button className="refresh-btn" onClick={onRefresh}>
                  <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
                    <path d="M9.5 2A5 5 0 105.5 10.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
                    <path d="M7.5 2h2V0" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  Refresh
                </button>
              )}
            </div>
          </header>

          <div className="page-content">
            {children}
          </div>
        </div>
      </div>
    </>
  );
}