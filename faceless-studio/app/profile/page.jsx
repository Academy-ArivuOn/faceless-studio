'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { getSupabaseBrowser } from '@/packages/supabase-browser';

const PLATFORMS = ['YouTube', 'Instagram Reels', 'TikTok', 'Podcast', 'Blog', 'YouTube Shorts'];
const LANGUAGES = ['English', 'Hindi', 'Tamil', 'Telugu', 'Kannada', 'Marathi', 'Bengali', 'Gujarati', 'Malayalam', 'Punjabi', 'Spanish', 'French'];
const CREATOR_TYPES = [
  { value: 'general', label: 'General Creator' },
  { value: 'educator', label: 'Educator' },
  { value: 'coach', label: 'Coach / Mentor' },
  { value: 'entertainer', label: 'Entertainer' },
  { value: 'podcaster', label: 'Podcaster' },
  { value: 'blogger', label: 'Blogger / Vlogger' },
  { value: 'agency', label: 'Agency / Brand' },
];
const CREATOR_MODES = [
  { value: 'faceless', label: '🎬 Faceless', desc: 'B-roll & voiceover scripts' },
  { value: 'face', label: '🎥 On Camera', desc: 'On-camera direction' },
  { value: 'blogger', label: '🎒 Blogger', desc: 'Vlog filming scripts' },
];
const NICHES = [
  'Personal Finance', 'Fitness & Health', 'Technology', 'Food & Cooking',
  'Travel', 'Business & Entrepreneurship', 'Education', 'Entertainment',
  'Gaming', 'Beauty & Fashion', 'Parenting', 'Spirituality', 'Real Estate',
];
const SOCIAL_PLATFORMS = [
  { key: 'youtube', label: 'YouTube', placeholder: 'youtube.com/c/yourchannel' },
  { key: 'instagram', label: 'Instagram', placeholder: 'instagram.com/yourhandle' },
  { key: 'tiktok', label: 'TikTok', placeholder: 'tiktok.com/@yourhandle' },
  { key: 'twitter', label: 'X / Twitter', placeholder: 'x.com/yourhandle' },
  { key: 'website', label: 'Website', placeholder: 'yourwebsite.com' },
];

function Avatar({ name, url, size = 80 }) {
  if (url) return (
    <img src={url} alt={name} style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover', border: '2px solid #E8E8E8' }} />
  );
  const initials = (name || '?').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%', background: '#0A0A0A',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.32, fontWeight: 700, color: '#FFFFFF',
      fontFamily: "'Playfair Display', serif", border: '2px solid #E8E8E8', flexShrink: 0,
    }}>
      {initials}
    </div>
  );
}

function SaveToast({ visible }) {
  return (
    <div style={{
      position: 'fixed', bottom: 32, left: '50%', transform: `translateX(-50%) translateY(${visible ? 0 : 20}px)`,
      opacity: visible ? 1 : 0, transition: 'all 0.3s ease', pointerEvents: 'none', zIndex: 999,
      background: '#0A0A0A', color: '#FFFFFF', borderRadius: 10, padding: '12px 24px',
      fontSize: 13, fontWeight: 600, fontFamily: "'DM Sans', sans-serif",
      display: 'flex', alignItems: 'center', gap: 8, boxShadow: '0 8px 30px rgba(0,0,0,0.25)',
    }}>
      <span style={{ color: '#86EFAC' }}>✓</span> Profile saved successfully
    </div>
  );
}

export default function ProfilePage() {
  const router = useRouter();
  const supabase = getSupabaseBrowser();
  const fileRef = useRef(null);

  const [user, setUser] = useState(null);
  const [usage, setUsage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [activeTab, setActiveTab] = useState('profile');

  // Form state
  const [form, setForm] = useState({
    full_name: '',
    bio: '',
    primary_niche: '',
    custom_niche: '',
    primary_platform: 'YouTube',
    primary_language: 'English',
    creator_type: 'general',
    creator_mode: 'faceless',
    brand_voice: '',
    target_audience_description: '',
    content_pillars: [],
    channel_size: 'under_1k',
    social_links: {},
  });
  const [pillarInput, setPillarInput] = useState('');

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) { router.replace('/login'); return; }
      setUser(session.user);

      const [usageRes, profileRes] = await Promise.all([
        fetch('/api/usage', { headers: { Authorization: `Bearer ${session.access_token}` } }),
        supabase.from('profiles').select('*').eq('id', session.user.id).single(),
      ]);

      const usageJson = await usageRes.json();
      if (usageJson.success) setUsage(usageJson.usage);

      if (!profileRes.error && profileRes.data) {
        const p = profileRes.data;
        setAvatarPreview(p.avatar_url || null);
        setForm({
          full_name: p.full_name || '',
          bio: p.bio || '',
          primary_niche: p.primary_niche || '',
          custom_niche: '',
          primary_platform: p.primary_platform || 'YouTube',
          primary_language: p.primary_language || 'English',
          creator_type: p.creator_type || 'general',
          creator_mode: p.creator_mode || 'faceless',
          brand_voice: p.brand_voice || '',
          target_audience_description: p.target_audience_description || '',
          content_pillars: p.content_pillars || [],
          channel_size: p.channel_size || 'under_1k',
          social_links: p.social_links || {},
        });
      }
      setLoading(false);
    });
  }, []);

  function setField(key, val) { setForm(prev => ({ ...prev, [key]: val })); }

  function addPillar() {
    const v = pillarInput.trim();
    if (!v || form.content_pillars.length >= 5) return;
    setField('content_pillars', [...form.content_pillars, v]);
    setPillarInput('');
  }
  function removePillar(i) {
    setField('content_pillars', form.content_pillars.filter((_, idx) => idx !== i));
  }

  function handleAvatarChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => setAvatarPreview(ev.target.result);
    reader.readAsDataURL(file);
  }

  async function handleSave() {
    setSaving(true);
    const { data: { session } } = await supabase.auth.getSession();
    const niche = form.primary_niche === '__custom__' ? form.custom_niche : form.primary_niche;

    const { error } = await supabase.from('profiles').upsert({
      id: session.user.id,
      email: session.user.email,
      full_name: form.full_name,
      bio: form.bio,
      primary_niche: niche,
      primary_platform: form.primary_platform,
      primary_language: form.primary_language,
      creator_type: form.creator_type,
      creator_mode: form.creator_mode,
      brand_voice: form.brand_voice,
      target_audience_description: form.target_audience_description,
      content_pillars: form.content_pillars,
      channel_size: form.channel_size,
      social_links: form.social_links,
      avatar_url: avatarPreview,
      updated_at: new Date().toISOString(),
    });

    setSaving(false);
    if (!error) {
      setToast(true);
      setTimeout(() => setToast(false), 3000);
    }
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: 28, height: 28, borderRadius: '50%', border: '2.5px solid #E8E8E8', borderTopColor: '#0A0A0A', animation: 'spin 0.7s linear infinite' }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  const plan = usage?.plan || 'free';

  const TABS = [
    { id: 'profile', label: 'Profile', icon: '👤' },
    { id: 'creator', label: 'Creator DNA', icon: '🧬' },
    { id: 'social', label: 'Social Links', icon: '🔗' },
  ];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;800&family=DM+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeUp { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } }
        body { background: #FFFFFF; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-thumb { background: #D0D0D0; border-radius: 4px; }

        .pr-root { min-height: 100vh; background: #FFFFFF; font-family: 'DM Sans', sans-serif; color: #0A0A0A; }

        .pr-topbar { height: 56px; border-bottom: 1px solid #E8E8E8; display: flex; align-items: center; justify-content: space-between; padding: 0 32px; position: sticky; top: 0; background: rgba(255,255,255,0.97); backdrop-filter: blur(12px); z-index: 100; }
        .pr-topbar-left { display: flex; align-items: center; gap: 10px; }
        .pr-logo { width: 28px; height: 28px; background: #0A0A0A; border-radius: 7px; display: flex; align-items: center; justify-content: center; cursor: pointer; }
        .pr-brand { font-family: 'Playfair Display', serif; font-size: 15px; font-weight: 700; color: #0A0A0A; letter-spacing: -0.02em; cursor: pointer; }
        .pr-sep { color: #E8E8E8; font-size: 16px; }
        .pr-crumb { font-size: 13px; color: #8C8C8C; font-weight: 500; }
        .pr-topbar-right { display: flex; align-items: center; gap: 8px; }
        .pr-btn-ghost { background: none; border: 1px solid #E8E8E8; border-radius: 7px; padding: 7px 14px; font-family: 'DM Sans', sans-serif; font-size: 13px; font-weight: 500; color: #5C5C5C; cursor: pointer; transition: all 0.15s; }
        .pr-btn-ghost:hover { border-color: #0A0A0A; color: #0A0A0A; }
        .pr-btn-primary { background: #0A0A0A; border: none; border-radius: 7px; padding: 7px 16px; font-family: 'DM Sans', sans-serif; font-size: 13px; font-weight: 700; color: #FFFFFF; cursor: pointer; transition: all 0.2s; display: flex; align-items: center; gap: 6px; }
        .pr-btn-primary:hover:not(:disabled) { background: #1a1a1a; transform: translateY(-1px); box-shadow: 0 4px 12px rgba(10,10,10,0.2); }
        .pr-btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }

        .pr-body { max-width: 860px; margin: 0 auto; padding: 40px 24px 100px; }

        .pr-header { margin-bottom: 36px; }
        .pr-header-inner { display: flex; align-items: flex-start; gap: 20px; }
        .pr-avatar-wrap { position: relative; flex-shrink: 0; cursor: pointer; }
        .pr-avatar-overlay { position: absolute; inset: 0; border-radius: '50%'; background: rgba(0,0,0,0); display: flex; align-items: center; justify-content: center; transition: background 0.2s; border-radius: 50%; }
        .pr-avatar-wrap:hover .pr-avatar-overlay { background: rgba(0,0,0,0.45); }
        .pr-avatar-edit-icon { opacity: 0; font-size: 18px; transition: opacity 0.2s; }
        .pr-avatar-wrap:hover .pr-avatar-edit-icon { opacity: 1; }
        .pr-header-text { flex: 1; padding-top: 4px; }
        .pr-user-name { font-family: 'Playfair Display', serif; font-size: 26px; font-weight: 800; color: #0A0A0A; letter-spacing: -0.03em; margin-bottom: 4px; }
        .pr-user-email { font-size: 13px; color: #8C8C8C; margin-bottom: 10px; }
        .pr-plan-chip { display: inline-flex; align-items: center; gap: 5px; padding: 4px 12px; border-radius: 100px; font-size: 11px; font-weight: 700; font-family: 'JetBrains Mono', monospace; background: #F5F5F5; border: 1px solid #E8E8E8; color: #5C5C5C; }
        .pr-plan-chip.paid { background: #FFF9EB; border-color: #FDE68A; color: #D4A847; }

        .pr-tabs { display: flex; border-bottom: 1px solid #E8E8E8; margin-bottom: 32px; }
        .pr-tab { padding: 12px 16px; font-size: 13px; font-weight: 500; color: #8C8C8C; background: none; border: none; border-bottom: 2px solid transparent; cursor: pointer; transition: all 0.2s; margin-bottom: -1px; display: flex; align-items: center; gap: 6px; font-family: 'DM Sans', sans-serif; }
        .pr-tab:hover { color: #0A0A0A; }
        .pr-tab.active { color: #0A0A0A; border-bottom-color: #0A0A0A; font-weight: 700; }

        .pr-section { animation: fadeUp 0.3s ease both; }
        .pr-section-title { font-family: 'Playfair Display', serif; font-size: 18px; font-weight: 700; color: #0A0A0A; letter-spacing: -0.02em; margin-bottom: 4px; }
        .pr-section-sub { font-size: 13px; color: #8C8C8C; margin-bottom: 24px; line-height: 1.5; }

        .pr-field { margin-bottom: 20px; }
        .pr-label { font-size: 11px; font-weight: 700; color: #0A0A0A; text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 7px; display: block; }
        .pr-sublabel { font-size: 12px; color: #8C8C8C; margin-top: -4px; margin-bottom: 8px; }
        .pr-input { width: 100%; padding: 12px 14px; border: 1.5px solid #E8E8E8; border-radius: 9px; font-family: 'DM Sans', sans-serif; font-size: 14px; color: #0A0A0A; outline: none; transition: border-color 0.2s, box-shadow 0.2s; background: #FFFFFF; }
        .pr-input::placeholder { color: #BCBCBC; }
        .pr-input:focus { border-color: #0A0A0A; box-shadow: 0 0 0 3px rgba(10,10,10,0.05); }
        .pr-textarea { width: 100%; padding: 12px 14px; border: 1.5px solid #E8E8E8; border-radius: 9px; font-family: 'DM Sans', sans-serif; font-size: 14px; color: #0A0A0A; outline: none; resize: vertical; transition: border-color 0.2s; background: #FFFFFF; line-height: 1.65; }
        .pr-textarea:focus { border-color: #0A0A0A; }
        .pr-select { width: 100%; padding: 12px 36px 12px 14px; border: 1.5px solid #E8E8E8; border-radius: 9px; font-family: 'DM Sans', sans-serif; font-size: 14px; color: #0A0A0A; outline: none; appearance: none; background: #FFFFFF url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%238C8C8C' strokeWidth='1.5' fill='none' strokeLinecap='round'/%3E%3C/svg%3E") no-repeat right 14px center; cursor: pointer; transition: border-color 0.2s; }
        .pr-select:focus { border-color: #0A0A0A; }
        .pr-grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }

        .pr-mode-row { display: flex; gap: 10px; }
        .pr-mode-btn { flex: 1; padding: 12px; border: 1.5px solid #E8E8E8; border-radius: 10px; background: #FFFFFF; cursor: pointer; text-align: center; transition: all 0.2s; }
        .pr-mode-btn.active { border-color: #0A0A0A; background: #F8F8F8; }
        .pr-mode-btn-label { font-size: 12px; font-weight: 600; color: #0A0A0A; font-family: 'DM Sans', sans-serif; display: block; margin-bottom: 2px; }
        .pr-mode-btn.active .pr-mode-btn-label { color: #0A0A0A; }
        .pr-mode-btn-desc { font-size: 10px; color: #8C8C8C; }

        .pr-niche-grid { display: flex; flex-wrap: wrap; gap: 7px; }
        .pr-niche-chip { padding: '5px 12px'; border: 1.5px solid #E8E8E8; border-radius: 7px; font-size: 12px; font-weight: 500; color: #5C5C5C; cursor: pointer; transition: all 0.15s; background: #FFFFFF; padding: 5px 12px; font-family: 'DM Sans', sans-serif; }
        .pr-niche-chip:hover { border-color: #0A0A0A; color: #0A0A0A; }
        .pr-niche-chip.active { border-color: #0A0A0A; background: #0A0A0A; color: #FFFFFF; }

        .pr-pillar-row { display: flex; gap: 8px; margin-bottom: 10px; }
        .pr-pillar-tag { display: inline-flex; align-items: center; gap: 6px; padding: '4px 12px'; background: #F5F5F5; border: 1px solid #E8E8E8; border-radius: 6px; font-size: 12px; font-weight: 500; color: #0A0A0A; font-family: 'DM Sans', sans-serif; padding: 4px 12px; }
        .pr-pillar-remove { background: none; border: none; cursor: pointer; color: #BCBCBC; font-size: 12px; padding: 0; line-height: 1; transition: color 0.15s; }
        .pr-pillar-remove:hover { color: #DC2626; }

        .pr-social-row { display: flex; align-items: center; gap: 10px; margin-bottom: 10px; }
        .pr-social-label { font-size: 12px; font-weight: 600; color: #5C5C5C; font-family: 'JetBrains Mono', monospace; width: 80px; flex-shrink: 0; }

        .pr-channel-size { display: flex; gap: 8px; flex-wrap: wrap; }
        .pr-size-btn { padding: 8px 14px; border: 1.5px solid #E8E8E8; border-radius: 8px; font-size: 12px; font-weight: 600; color: #5C5C5C; background: #FFFFFF; cursor: pointer; transition: all 0.2s; font-family: 'DM Sans', sans-serif; }
        .pr-size-btn.active { border-color: #0A0A0A; background: #0A0A0A; color: #FFFFFF; }

        .pr-save-bar { position: fixed; bottom: 0; left: 0; right: 0; border-top: 1px solid #E8E8E8; background: rgba(255,255,255,0.97); backdrop-filter: blur(12px); padding: 16px 24px; display: flex; align-items: center; justify-content: flex-end; gap: 10px; z-index: 90; }
        .pr-save-info { font-size: 12px; color: #8C8C8C; margin-right: 'auto'; }

        @media (max-width: 600px) {
          .pr-grid2 { grid-template-columns: 1fr; }
          .pr-header-inner { flex-direction: column; }
          .pr-mode-row { flex-direction: column; }
          .pr-topbar { padding: 0 16px; }
          .pr-body { padding: 24px 16px 80px; }
        }
      `}</style>

      <div className="pr-root">
        {/* Topbar */}
        <header className="pr-topbar">
          <div className="pr-topbar-left">
            <div className="pr-logo" onClick={() => router.push('/generate')}>
              <svg width="13" height="13" viewBox="0 0 20 20" fill="none">
                <polygon points="10,2 17,6 17,14 10,18 3,14 3,6" stroke="#FFFFFF" strokeWidth="1.5" fill="none"/>
                <polygon points="10,6 14,8.5 14,13.5 10,16 6,13.5 6,8.5" fill="#FFFFFF" fillOpacity="0.3"/>
              </svg>
            </div>
            <span className="pr-brand" onClick={() => router.push('/generate')}>Studio AI</span>
            <span className="pr-sep">/</span>
            <span className="pr-crumb">Profile</span>
          </div>
          <div className="pr-topbar-right">
            <button className="pr-btn-ghost" onClick={() => router.push('/dashboard')}>Dashboard</button>
            <button className="pr-btn-ghost" onClick={() => router.push('/settings')}>Settings</button>
          </div>
        </header>

        <div className="pr-body">
          {/* Header */}
          <div className="pr-header">
            <div className="pr-header-inner">
              <div className="pr-avatar-wrap" onClick={() => fileRef.current?.click()}>
                <Avatar name={form.full_name || user?.email} url={avatarPreview} size={80} />
                <div className="pr-avatar-overlay">
                  <span className="pr-avatar-edit-icon">✏️</span>
                </div>
                <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleAvatarChange} />
              </div>
              <div className="pr-header-text">
                <h1 className="pr-user-name">{form.full_name || 'Your Profile'}</h1>
                <p className="pr-user-email">{user?.email}</p>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  <span className={`pr-plan-chip ${plan !== 'free' ? 'paid' : ''}`}>
                    {plan === 'free' ? '⬡ Free Plan' : plan === 'pro' ? '⚡ Pro Plan' : '🏢 Studio Plan'}
                  </span>
                  {form.primary_niche && (
                    <span className="pr-plan-chip">🎯 {form.primary_niche}</span>
                  )}
                  {form.creator_mode && (
                    <span className="pr-plan-chip">
                      {form.creator_mode === 'faceless' ? '🎬' : form.creator_mode === 'face' ? '🎥' : '🎒'} {form.creator_mode}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="pr-tabs">
            {TABS.map(t => (
              <button key={t.id} className={`pr-tab ${activeTab === t.id ? 'active' : ''}`} onClick={() => setActiveTab(t.id)}>
                {t.icon} {t.label}
              </button>
            ))}
          </div>

          {/* Tab: Profile */}
          {activeTab === 'profile' && (
            <div className="pr-section">
              <h2 className="pr-section-title">Basic Information</h2>
              <p className="pr-section-sub">Your public identity on Studio AI. Your name is shown on generated content exports.</p>

              <div className="pr-grid2">
                <div className="pr-field">
                  <label className="pr-label">Full Name</label>
                  <input className="pr-input" type="text" placeholder="e.g. Arjun Sharma" value={form.full_name} onChange={e => setField('full_name', e.target.value)} />
                </div>
                <div className="pr-field">
                  <label className="pr-label">Creator Type</label>
                  <select className="pr-select" value={form.creator_type} onChange={e => setField('creator_type', e.target.value)}>
                    {CREATOR_TYPES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                  </select>
                </div>
              </div>

              <div className="pr-field">
                <label className="pr-label">Bio</label>
                <p className="pr-sublabel">A short description of who you are and what you create.</p>
                <textarea className="pr-textarea" rows={3} placeholder="e.g. Personal finance creator helping Indian millennials build wealth through smart investing..." value={form.bio} onChange={e => setField('bio', e.target.value)} />
              </div>

              <div className="pr-field">
                <label className="pr-label">Your Niche</label>
                <p className="pr-sublabel">Select one — this trains the Research Agent to find better topics for you.</p>
                <div className="pr-niche-grid" style={{ marginBottom: 10 }}>
                  {NICHES.map(n => (
                    <button key={n} className={`pr-niche-chip ${form.primary_niche === n ? 'active' : ''}`} onClick={() => setField('primary_niche', n)}>
                      {n}
                    </button>
                  ))}
                  <button className={`pr-niche-chip ${form.primary_niche === '__custom__' ? 'active' : ''}`} onClick={() => setField('primary_niche', '__custom__')}>
                    + Custom
                  </button>
                </div>
                {form.primary_niche === '__custom__' && (
                  <input className="pr-input" placeholder="e.g. sustainable architecture India" value={form.custom_niche} onChange={e => setField('custom_niche', e.target.value)} />
                )}
              </div>

              <div className="pr-grid2">
                <div className="pr-field">
                  <label className="pr-label">Primary Platform</label>
                  <select className="pr-select" value={form.primary_platform} onChange={e => setField('primary_platform', e.target.value)}>
                    {PLATFORMS.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
                <div className="pr-field">
                  <label className="pr-label">Script Language</label>
                  <select className="pr-select" value={form.primary_language} onChange={e => setField('primary_language', e.target.value)}>
                    {LANGUAGES.map(l => <option key={l} value={l}>{l}</option>)}
                  </select>
                </div>
              </div>

              <div className="pr-field">
                <label className="pr-label">Channel Size</label>
                <div className="pr-channel-size">
                  {[
                    { value: 'under_1k', label: 'Under 1K' },
                    { value: '1k_10k', label: '1K – 10K' },
                    { value: '10k_100k', label: '10K – 100K' },
                    { value: '100k_plus', label: '100K+' },
                  ].map(s => (
                    <button key={s.value} className={`pr-size-btn ${form.channel_size === s.value ? 'active' : ''}`} onClick={() => setField('channel_size', s.value)}>
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Tab: Creator DNA */}
          {activeTab === 'creator' && (
            <div className="pr-section">
              <h2 className="pr-section-title">Creator DNA</h2>
              <p className="pr-section-sub">This data is injected into every AI agent call to personalise scripts, hooks, and strategies to your voice and audience.</p>

              <div className="pr-field">
                <label className="pr-label">Creator Mode</label>
                <div className="pr-mode-row">
                  {CREATOR_MODES.map(m => (
                    <button key={m.value} className={`pr-mode-btn ${form.creator_mode === m.value ? 'active' : ''}`} onClick={() => setField('creator_mode', m.value)}>
                      <span className="pr-mode-btn-label">{m.label}</span>
                      <span className="pr-mode-btn-desc">{m.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="pr-field">
                <label className="pr-label">Brand Voice</label>
                <p className="pr-sublabel">How do you speak to your audience? The AI will match this tone in every script.</p>
                <textarea className="pr-textarea" rows={3} placeholder="e.g. Conversational and direct, like a knowledgeable friend. I avoid jargon, use relatable analogies, and occasionally use humour. Never corporate-sounding." value={form.brand_voice} onChange={e => setField('brand_voice', e.target.value)} />
              </div>

              <div className="pr-field">
                <label className="pr-label">Target Audience</label>
                <p className="pr-sublabel">Describe your viewer in detail. The more specific, the better your scripts.</p>
                <textarea className="pr-textarea" rows={3} placeholder="e.g. Indian professionals aged 25–35 working in IT or finance, earning ₹8–20L/year, who want to invest but feel overwhelmed by options and jargon." value={form.target_audience_description} onChange={e => setField('target_audience_description', e.target.value)} />
              </div>

              <div className="pr-field">
                <label className="pr-label">Content Pillars</label>
                <p className="pr-sublabel">The 3–5 core topics your channel covers. Used to keep script suggestions on-brand.</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
                  {form.content_pillars.map((p, i) => (
                    <span key={i} className="pr-pillar-tag">
                      {p}
                      <button className="pr-pillar-remove" onClick={() => removePillar(i)}>✕</button>
                    </span>
                  ))}
                </div>
                {form.content_pillars.length < 5 && (
                  <div className="pr-pillar-row">
                    <input className="pr-input" style={{ flex: 1 }} placeholder="e.g. Mutual Fund Basics" value={pillarInput} onChange={e => setPillarInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addPillar())} />
                    <button onClick={addPillar} style={{ padding: '10px 16px', background: '#0A0A0A', color: '#fff', border: 'none', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", whiteSpace: 'nowrap' }}>
                      + Add
                    </button>
                  </div>
                )}
                {form.content_pillars.length >= 5 && (
                  <p style={{ fontSize: 12, color: '#8C8C8C' }}>Maximum 5 pillars reached.</p>
                )}
              </div>
            </div>
          )}

          {/* Tab: Social Links */}
          {activeTab === 'social' && (
            <div className="pr-section">
              <h2 className="pr-section-title">Social Links</h2>
              <p className="pr-section-sub">Add your social profiles. These are used to personalise CTAs in your generated scripts.</p>

              {SOCIAL_PLATFORMS.map(sp => (
                <div className="pr-social-row" key={sp.key}>
                  <span className="pr-social-label">{sp.label}</span>
                  <input
                    className="pr-input"
                    placeholder={sp.placeholder}
                    value={(form.social_links || {})[sp.key] || ''}
                    onChange={e => setField('social_links', { ...(form.social_links || {}), [sp.key]: e.target.value })}
                  />
                </div>
              ))}

              <div style={{ marginTop: 24, padding: '16px 20px', background: '#F8F8F8', border: '1px solid #E8E8E8', borderRadius: 10 }}>
                <p style={{ fontSize: 13, fontWeight: 600, color: '#0A0A0A', marginBottom: 4, fontFamily: "'DM Sans', sans-serif" }}>🔒 Privacy Notice</p>
                <p style={{ fontSize: 12, color: '#8C8C8C', lineHeight: 1.6 }}>Your social links are stored securely and only used to generate personalised CTAs in your scripts. They are never shared or made public.</p>
              </div>
            </div>
          )}
        </div>

        {/* Save bar */}
        <div className="pr-save-bar">
          <span style={{ fontSize: 12, color: '#8C8C8C', flex: 1 }}>Changes are saved to your account</span>
          <button className="pr-btn-ghost" onClick={() => router.push('/dashboard')}>Cancel</button>
          <button className="pr-btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? (
              <><span style={{ width: 14, height: 14, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', animation: 'spin 0.7s linear infinite', display: 'inline-block' }} />Saving…</>
            ) : 'Save Profile'}
          </button>
        </div>

        <SaveToast visible={toast} />
      </div>
    </>
  );
}