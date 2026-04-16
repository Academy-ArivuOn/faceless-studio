'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getSupabaseBrowser } from '@/packages/supabase-browser';

function Toggle({ checked, onChange }) {
  return (
    <button
      onClick={() => onChange(!checked)}
      style={{
        width: 44, height: 24, borderRadius: 12, background: checked ? '#0A0A0A' : '#E8E8E8',
        border: 'none', cursor: 'pointer', position: 'relative', transition: 'background 0.2s', flexShrink: 0,
      }}
    >
      <span style={{
        position: 'absolute', top: 3, left: checked ? 23 : 3, width: 18, height: 18,
        borderRadius: '50%', background: '#FFFFFF', transition: 'left 0.2s',
        boxShadow: '0 1px 4px rgba(0,0,0,0.2)',
      }} />
    </button>
  );
}

function SettingRow({ title, desc, children, danger = false }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '18px 0', borderBottom: '1px solid #F5F5F5', gap: 24,
    }}>
      <div style={{ flex: 1 }}>
        <p style={{ fontSize: 14, fontWeight: 600, color: danger ? '#DC2626' : '#0A0A0A', margin: 0, marginBottom: 3, fontFamily: "'DM Sans', sans-serif" }}>
          {title}
        </p>
        <p style={{ fontSize: 12, color: '#8C8C8C', margin: 0, lineHeight: 1.55, fontFamily: "'DM Sans', sans-serif" }}>{desc}</p>
      </div>
      <div style={{ flexShrink: 0 }}>{children}</div>
    </div>
  );
}

function SectionHeader({ icon, title, desc }) {
  return (
    <div style={{ marginBottom: 4, paddingTop: 8 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
        <span style={{ fontSize: 16 }}>{icon}</span>
        <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 17, fontWeight: 700, color: '#0A0A0A', letterSpacing: '-0.02em' }}>{title}</h2>
      </div>
      {desc && <p style={{ fontSize: 13, color: '#8C8C8C', marginLeft: 24 }}>{desc}</p>}
    </div>
  );
}

function DangerModal({ open, onClose, onConfirm, title, desc, confirmLabel = 'Confirm', loading }) {
  if (!open) return null;
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999, padding: 20 }}>
      <div style={{ background: '#FFFFFF', border: '1px solid #E8E8E8', borderRadius: 16, padding: 32, maxWidth: 420, width: '100%', boxShadow: '0 20px 60px rgba(0,0,0,0.15)' }}>
        <div style={{ width: 48, height: 48, borderRadius: 12, background: '#FEF2F2', border: '1px solid #FCA5A5', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
          <span style={{ fontSize: 22 }}>⚠️</span>
        </div>
        <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: 20, fontWeight: 800, color: '#0A0A0A', marginBottom: 8 }}>{title}</h3>
        <p style={{ fontSize: 13, color: '#5C5C5C', lineHeight: 1.65, marginBottom: 24, fontFamily: "'DM Sans', sans-serif" }}>{desc}</p>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={onClose} style={{ flex: 1, padding: '11px', border: '1px solid #E8E8E8', borderRadius: 9, background: '#FFFFFF', fontSize: 13, fontWeight: 600, color: '#5C5C5C', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}>
            Cancel
          </button>
          <button onClick={onConfirm} disabled={loading} style={{ flex: 1, padding: '11px', border: 'none', borderRadius: 9, background: '#DC2626', fontSize: 13, fontWeight: 700, color: '#FFFFFF', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", opacity: loading ? 0.6 : 1 }}>
            {loading ? 'Processing…' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function SettingsPage() {
  const router = useRouter();
  const supabase = getSupabaseBrowser();

  const [user, setUser] = useState(null);
  const [usage, setUsage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedSection, setSavedSection] = useState('');
  const [modal, setModal] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);

  const [newEmail, setNewEmail] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [passError, setPassError] = useState('');

  const [notifs, setNotifs] = useState({
    weekly_digest: true,
    generation_complete: true,
    streak_reminder: false,
    product_updates: true,
    tips_tricks: false,
  });

  const [privacy, setPrivacy] = useState({
    analytics: true,
    usage_data: true,
  });

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) { router.replace('/login'); return; }
      setUser(session.user);
      const usageRes = await fetch('/api/usage', { headers: { Authorization: `Bearer ${session.access_token}` } });
      const usageJson = await usageRes.json();
      if (usageJson.success) setUsage(usageJson.usage);
      setLoading(false);
    });
  }, []);

  function showSaved(section) {
    setSavedSection(section);
    setTimeout(() => setSavedSection(''), 2500);
  }

  async function handleEmailChange() {
    if (!newEmail.includes('@')) return;
    setSaving(true);
    const { error } = await supabase.auth.updateUser({ email: newEmail });
    setSaving(false);
    if (!error) { showSaved('email'); setNewEmail(''); }
  }

  async function handlePasswordChange() {
    setPassError('');
    if (newPass.length < 8) { setPassError('Password must be at least 8 characters.'); return; }
    if (newPass !== confirmPass) { setPassError('Passwords do not match.'); return; }
    setSaving(true);
    const { error } = await supabase.auth.updateUser({ password: newPass });
    setSaving(false);
    if (!error) { showSaved('password'); setNewPass(''); setConfirmPass(''); }
    else setPassError(error.message);
  }

  async function handleDeleteAccount() {
    setModalLoading(true);
    // In production: call your API to delete user data then sign out
    await supabase.auth.signOut();
    router.push('/');
  }

  async function handleSignOutAll() {
    setModalLoading(true);
    await supabase.auth.signOut({ scope: 'global' });
    router.push('/login');
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: 24, height: 24, borderRadius: '50%', border: '2px solid #E8E8E8', borderTopColor: '#0A0A0A', animation: 'spin 0.7s linear infinite' }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  const plan = usage?.plan || 'free';
  const planLabel = { free: 'Free', pro: 'Pro', studio: 'Studio' }[plan] || 'Free';

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;800&family=DM+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        @keyframes spin { to { transform: rotate(360deg); } }
        body { background: #FFFFFF; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-thumb { background: #D0D0D0; border-radius: 4px; }

        .st-root { min-height: 100vh; background: #FFFFFF; font-family: 'DM Sans', sans-serif; color: #0A0A0A; }
        .st-topbar { height: 56px; border-bottom: 1px solid #E8E8E8; display: flex; align-items: center; justify-content: space-between; padding: 0 32px; position: sticky; top: 0; background: rgba(255,255,255,0.97); backdrop-filter: blur(12px); z-index: 100; }
        .st-topbar-left { display: flex; align-items: center; gap: 10px; }
        .st-logo { width: 28px; height: 28px; background: #0A0A0A; border-radius: 7px; display: flex; align-items: center; justify-content: center; cursor: pointer; }
        .st-brand { font-family: 'Playfair Display', serif; font-size: 15px; font-weight: 700; color: #0A0A0A; cursor: pointer; }
        .st-sep { color: #E8E8E8; font-size: 16px; }
        .st-crumb { font-size: 13px; color: #8C8C8C; font-weight: 500; }
        .st-topbar-right { display: flex; align-items: center; gap: 8px; }
        .st-btn-ghost { background: none; border: 1px solid #E8E8E8; border-radius: 7px; padding: 7px 14px; font-family: 'DM Sans', sans-serif; font-size: 13px; font-weight: 500; color: #5C5C5C; cursor: pointer; transition: all 0.15s; }
        .st-btn-ghost:hover { border-color: #0A0A0A; color: #0A0A0A; }
        .st-btn-primary { background: #0A0A0A; border: none; border-radius: 7px; padding: 8px 16px; font-family: 'DM Sans', sans-serif; font-size: 13px; font-weight: 700; color: #FFFFFF; cursor: pointer; transition: all 0.2s; }
        .st-btn-primary:hover:not(:disabled) { background: #1a1a1a; transform: translateY(-1px); }
        .st-btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }
        .st-btn-danger { background: #FEF2F2; border: 1px solid #FCA5A5; border-radius: 7px; padding: 8px 16px; font-family: 'DM Sans', sans-serif; font-size: 13px; font-weight: 700; color: '#DC2626'; cursor: pointer; transition: all 0.15s; color: #DC2626; }
        .st-btn-danger:hover { background: #DC2626; color: #FFFFFF; }

        .st-layout { display: flex; max-width: 960px; margin: 0 auto; padding: 40px 24px 100px; gap: 40px; }
        .st-sidebar { width: 200px; flex-shrink: 0; position: sticky; top: 80px; align-self: flex-start; }
        .st-sidebar-nav { display: flex; flex-direction: column; gap: 2px; }
        .st-sidebar-link { display: flex; align-items: center; gap: 8px; padding: '8px 12px'; background: none; border: none; cursor: pointer; font-family: 'DM Sans', sans-serif; font-size: 13px; font-weight: 500; color: #8C8C8C; border-radius: 7px; transition: all 0.15s; width: 100%; text-align: left; padding: 8px 12px; }
        .st-sidebar-link:hover { background: #F5F5F5; color: #0A0A0A; }
        .st-sidebar-link.active { background: #0A0A0A; color: #FFFFFF; font-weight: 700; }
        .st-sidebar-section { font-size: 9px; font-weight: 700; color: #BCBCBC; text-transform: uppercase; letter-spacing: 0.1em; padding: '4px 12px'; margin-top: 16px; margin-bottom: 4px; padding: 4px 12px; font-family: 'JetBrains Mono', monospace; }

        .st-main { flex: 1; min-width: 0; }
        .st-section { background: #FFFFFF; border: 1px solid #E8E8E8; border-radius: 14px; overflow: hidden; margin-bottom: 20px; }
        .st-section-head { padding: 20px 24px; border-bottom: 1px solid #F5F5F5; }
        .st-section-body { padding: 0 24px; }
        .st-section-foot { padding: 16px 24px; background: #FAFAFA; border-top: 1px solid #F5F5F5; display: flex; align-items: center; justify-content: flex-end; gap: 8px; }

        .st-field { margin-bottom: 14px; }
        .st-label { font-size: 11px; font-weight: 700; color: #5C5C5C; text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 6px; display: block; }
        .st-input { width: 100%; padding: 11px 13px; border: 1.5px solid #E8E8E8; border-radius: 8px; font-family: 'DM Sans', sans-serif; font-size: 14px; color: #0A0A0A; outline: none; transition: border-color 0.2s, box-shadow 0.2s; background: #FFFFFF; }
        .st-input::placeholder { color: #BCBCBC; }
        .st-input:focus { border-color: #0A0A0A; box-shadow: 0 0 0 3px rgba(10,10,10,0.05); }
        .st-input.error { border-color: #FCA5A5; }
        .st-error { font-size: 12px; color: '#DC2626'; margin-top: 6px; color: #DC2626; font-family: 'DM Sans', sans-serif; }

        .st-saved { font-size: 12px; color: '#15803D'; background: '#F0FDF4'; border: '1px solid #86EFAC'; border-radius: 6px; padding: '4px 10px'; color: #15803D; background: #F0FDF4; border: 1px solid #86EFAC; padding: 4px 10px; font-family: 'JetBrains Mono', monospace; font-weight: 600; }

        .st-plan-card { display: flex; align-items: center; justify-content: space-between; padding: '20px 0'; gap: 16px; padding: 20px 0; }
        .st-plan-badge { display: inline-flex; align-items: center; gap: 6px; padding: '5px 14px'; border-radius: 100px; font-size: 12px; font-weight: 700; font-family: 'JetBrains Mono', monospace; padding: 5px 14px; }

        @media (max-width: 700px) {
          .st-layout { flex-direction: column; padding: 24px 16px 80px; gap: 24px; }
          .st-sidebar { width: 100%; position: static; }
          .st-sidebar-nav { flex-direction: row; flex-wrap: wrap; }
          .st-topbar { padding: 0 16px; }
        }
      `}</style>

      <div className="st-root">
        {/* Topbar */}
        <header className="st-topbar">
          <div className="st-topbar-left">
            <div className="st-logo" onClick={() => router.push('/generate')}>
              <svg width="13" height="13" viewBox="0 0 20 20" fill="none">
                <polygon points="10,2 17,6 17,14 10,18 3,14 3,6" stroke="#FFFFFF" strokeWidth="1.5" fill="none"/>
                <polygon points="10,6 14,8.5 14,13.5 10,16 6,13.5 6,8.5" fill="#FFFFFF" fillOpacity="0.3"/>
              </svg>
            </div>
            <span className="st-brand" onClick={() => router.push('/generate')}>Studio AI</span>
            <span className="st-sep">/</span>
            <span className="st-crumb">Settings</span>
          </div>
          <div className="st-topbar-right">
            <button className="st-btn-ghost" onClick={() => router.push('/profile')}>Profile</button>
            <button className="st-btn-ghost" onClick={() => router.push('/dashboard')}>Dashboard</button>
          </div>
        </header>

        <div className="st-layout">
          {/* Sidebar */}
          <aside className="st-sidebar">
            <div className="st-sidebar-nav">
              <span className="st-sidebar-section">Account</span>
              {[
                { id: 'account', label: 'Account', icon: '🔑' },
                { id: 'plan', label: 'Plan & Billing', icon: '💳' },
                { id: 'notifications', label: 'Notifications', icon: '🔔' },
              ].map(item => (
                <button key={item.id} className={`st-sidebar-link`} onClick={() => document.getElementById(`st-${item.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' })}>
                  <span>{item.icon}</span>{item.label}
                </button>
              ))}
              <span className="st-sidebar-section">Privacy</span>
              {[
                { id: 'privacy', label: 'Privacy', icon: '🔒' },
                { id: 'danger', label: 'Danger Zone', icon: '⚠️' },
              ].map(item => (
                <button key={item.id} className={`st-sidebar-link`} onClick={() => document.getElementById(`st-${item.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' })}>
                  <span>{item.icon}</span>{item.label}
                </button>
              ))}
            </div>
          </aside>

          {/* Main */}
          <main className="st-main">

            {/* Account */}
            <div id="st-account" className="st-section" style={{ marginBottom: 20 }}>
              <div className="st-section-head">
                <SectionHeader icon="🔑" title="Account" desc="Manage your email address and password." />
              </div>
              <div className="st-section-body">
                <SettingRow
                  title="Email Address"
                  desc={`Current: ${user?.email}`}
                >
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    {savedSection === 'email' && <span className="st-saved">✓ Saved</span>}
                  </div>
                </SettingRow>
                <div style={{ paddingBottom: 16, paddingTop: 4 }}>
                  <div className="st-field">
                    <label className="st-label">New Email Address</label>
                    <input className="st-input" type="email" placeholder="new@email.com" value={newEmail} onChange={e => setNewEmail(e.target.value)} />
                  </div>
                  <button className="st-btn-primary" style={{ fontSize: 12 }} onClick={handleEmailChange} disabled={saving || !newEmail}>
                    Update Email
                  </button>
                </div>

                <SettingRow title="Password" desc="Use a strong password of at least 8 characters.">
                  {savedSection === 'password' && <span className="st-saved">✓ Changed</span>}
                </SettingRow>
                <div style={{ paddingBottom: 20, paddingTop: 4 }}>
                  <div className="st-field">
                    <label className="st-label">New Password</label>
                    <input className={`st-input ${passError ? 'error' : ''}`} type="password" placeholder="Min 8 characters" value={newPass} onChange={e => setNewPass(e.target.value)} />
                  </div>
                  <div className="st-field">
                    <label className="st-label">Confirm New Password</label>
                    <input className={`st-input ${passError ? 'error' : ''}`} type="password" placeholder="Repeat password" value={confirmPass} onChange={e => setConfirmPass(e.target.value)} />
                  </div>
                  {passError && <p className="st-error">{passError}</p>}
                  <button className="st-btn-primary" style={{ fontSize: 12 }} onClick={handlePasswordChange} disabled={saving || !newPass}>
                    Update Password
                  </button>
                </div>

                <SettingRow
                  title="Sign Out All Devices"
                  desc="This will sign you out of all sessions including this one."
                >
                  <button className="st-btn-ghost" style={{ fontSize: 12 }} onClick={() => setModal('signout-all')}>Sign Out All</button>
                </SettingRow>
              </div>
            </div>

            {/* Plan */}
            <div id="st-plan" className="st-section" style={{ marginBottom: 20 }}>
              <div className="st-section-head">
                <SectionHeader icon="💳" title="Plan & Billing" desc="Manage your subscription and usage." />
              </div>
              <div className="st-section-body">
                <div className="st-plan-card" style={{ borderBottom: '1px solid #F5F5F5' }}>
                  <div>
                    <p style={{ fontSize: 13, fontWeight: 600, color: '#0A0A0A', marginBottom: 4 }}>Current Plan</p>
                    <span className="st-plan-badge" style={{
                      background: plan === 'free' ? '#F5F5F5' : plan === 'pro' ? '#FFF9EB' : '#EFF6FF',
                      color: plan === 'free' ? '#5C5C5C' : plan === 'pro' ? '#D4A847' : '#2563EB',
                      border: `1px solid ${plan === 'free' ? '#E8E8E8' : plan === 'pro' ? '#FDE68A' : '#BFDBFE'}`,
                    }}>
                      {plan === 'free' ? '⬡' : plan === 'pro' ? '⚡' : '🏢'} {planLabel}
                    </span>
                  </div>
                  {plan === 'free' && (
                    <button onClick={() => router.push('/#pricing')} style={{ background: '#0A0A0A', border: 'none', borderRadius: 8, padding: '10px 18px', color: '#FFFFFF', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}>
                      Upgrade Plan →
                    </button>
                  )}
                  {plan !== 'free' && (
                    <button className="st-btn-ghost" style={{ fontSize: 12 }} onClick={() => router.push('/#pricing')}>Manage Plan</button>
                  )}
                </div>

                {usage && (
                  <>
                    <SettingRow title="Monthly Usage" desc={`${usage.used || 0} of ${plan === 'free' ? usage.limit : '∞'} generations used this month.`}>
                      {plan === 'free' && (
                        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 13, fontWeight: 700, color: '#0A0A0A' }}>
                          {usage.remaining ?? 0} left
                        </span>
                      )}
                    </SettingRow>
                    {usage.reset_date && (
                      <SettingRow title="Resets On" desc="Your usage counter resets at the beginning of each billing month.">
                        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: '#8C8C8C' }}>
                          {new Date(usage.reset_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </span>
                      </SettingRow>
                    )}
                  </>
                )}

                <SettingRow title="Gift a Subscription" desc="Send a Studio AI subscription as a gift to another creator.">
                  <button className="st-btn-ghost" style={{ fontSize: 12 }} onClick={() => router.push('/gift')}>
                    🎁 Send Gift →
                  </button>
                </SettingRow>
              </div>
            </div>

            {/* Notifications */}
            <div id="st-notifications" className="st-section" style={{ marginBottom: 20 }}>
              <div className="st-section-head">
                <SectionHeader icon="🔔" title="Notifications" desc="Control what emails and reminders you receive." />
              </div>
              <div className="st-section-body">
                {[
                  { key: 'weekly_digest', title: 'Weekly Digest', desc: 'A curated summary of trending topics in your niche every Monday.' },
                  { key: 'generation_complete', title: 'Generation Complete', desc: 'Notify when a long-running generation finishes.' },
                  { key: 'streak_reminder', title: 'Streak Reminders', desc: 'Daily reminder to keep your content streak alive.' },
                  { key: 'product_updates', title: 'Product Updates', desc: 'New features, agents, and improvements to Studio AI.' },
                  { key: 'tips_tricks', title: 'Tips & Tricks', desc: 'Occasional emails with prompting tips to get better outputs.' },
                ].map(n => (
                  <SettingRow key={n.key} title={n.title} desc={n.desc}>
                    <Toggle checked={notifs[n.key]} onChange={v => setNotifs(prev => ({ ...prev, [n.key]: v }))} />
                  </SettingRow>
                ))}
              </div>
              <div className="st-section-foot">
                <button className="st-btn-primary" style={{ fontSize: 12 }} onClick={() => showSaved('notifs')}>
                  {savedSection === 'notifs' ? '✓ Saved' : 'Save Preferences'}
                </button>
              </div>
            </div>

            {/* Privacy */}
            <div id="st-privacy" className="st-section" style={{ marginBottom: 20 }}>
              <div className="st-section-head">
                <SectionHeader icon="🔒" title="Privacy" desc="Control how your data is used to improve Studio AI." />
              </div>
              <div className="st-section-body">
                <SettingRow title="Usage Analytics" desc="Allow anonymous usage data to help us improve the product. No personally identifiable data is collected.">
                  <Toggle checked={privacy.analytics} onChange={v => setPrivacy(p => ({ ...p, analytics: v }))} />
                </SettingRow>
                <SettingRow title="Training Data" desc="Allow your generation inputs (not scripts) to be used to improve AI output quality. Anonymised before use.">
                  <Toggle checked={privacy.usage_data} onChange={v => setPrivacy(p => ({ ...p, usage_data: v }))} />
                </SettingRow>
                <div style={{ padding: '16px 0' }}>
                  <a href="/privacy" style={{ fontSize: 12, color: '#8C8C8C', textDecoration: 'underline', textUnderlineOffset: 3 }}>Read our Privacy Policy →</a>
                </div>
              </div>
              <div className="st-section-foot">
                <button className="st-btn-primary" style={{ fontSize: 12 }} onClick={() => showSaved('privacy')}>
                  {savedSection === 'privacy' ? '✓ Saved' : 'Save Preferences'}
                </button>
              </div>
            </div>

            {/* Danger Zone */}
            <div id="st-danger" className="st-section" style={{ marginBottom: 20, borderColor: '#FCA5A5' }}>
              <div className="st-section-head" style={{ background: '#FEF2F2' }}>
                <SectionHeader icon="⚠️" title="Danger Zone" desc="Irreversible actions. Please read carefully before proceeding." />
              </div>
              <div className="st-section-body">
                <SettingRow
                  title="Export My Data"
                  desc="Download all your generations, profile data, and settings as a JSON file."
                  danger={false}
                >
                  <button className="st-btn-ghost" style={{ fontSize: 12 }} onClick={() => {}}>
                    Export Data
                  </button>
                </SettingRow>
                <SettingRow
                  title="Delete Account"
                  desc="Permanently delete your account, all generations, and all associated data. This cannot be undone."
                  danger
                >
                  <button className="st-btn-danger" style={{ fontSize: 12 }} onClick={() => setModal('delete')}>
                    Delete Account
                  </button>
                </SettingRow>
              </div>
            </div>

          </main>
        </div>
      </div>

      {/* Sign out all modal */}
      <DangerModal
        open={modal === 'signout-all'}
        onClose={() => setModal(null)}
        onConfirm={handleSignOutAll}
        loading={modalLoading}
        title="Sign Out All Devices"
        desc="You'll be signed out of all active sessions including this one. You'll need to log in again on all your devices."
        confirmLabel="Sign Out All"
      />

      {/* Delete modal */}
      <DangerModal
        open={modal === 'delete'}
        onClose={() => setModal(null)}
        onConfirm={handleDeleteAccount}
        loading={modalLoading}
        title="Delete Your Account?"
        desc="This will permanently delete your account, all 
generated content packs, your Creator DNA, and all usage history. This action cannot be reversed."
        confirmLabel="Yes, Delete Everything"
      />
    </>
  );
}