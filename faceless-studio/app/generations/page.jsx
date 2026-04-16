'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { getSupabaseBrowser } from '@/packages/supabase-browser';

const PLATFORM_ICONS = {
  'YouTube': '▶', 'Instagram Reels': '📸', 'TikTok': '🎵',
  'Podcast': '🎙', 'Blog': '✍', 'YouTube Shorts': '⚡',
};

const TYPE_COLORS = {
  general: { bg: '#F5F5F5', color: '#5C5C5C', border: '#E8E8E8' },
  educator: { bg: '#EFF6FF', color: '#2563EB', border: '#BFDBFE' },
  coach: { bg: '#F0FDF4', color: '#0E7C4A', border: '#86EFAC' },
  entertainer: { bg: '#FFF9EB', color: '#D4A847', border: '#FDE68A' },
  podcaster: { bg: '#F5F3FF', color: '#7C3AED', border: '#DDD6FE' },
  blogger: { bg: '#FFFBEB', color: '#D97706', border: '#FED7AA' },
  agency: { bg: '#F8F8F8', color: '#0A0A0A', border: '#E8E8E8' },
};

function StatCard({ value, label, sub }) {
  return (
    <div style={{ border: '1.5px solid #E8E8E8', borderRadius: 12, padding: '20px 22px', background: '#FFFFFF' }}>
      <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 32, fontWeight: 800, color: '#0A0A0A', letterSpacing: '-0.04em', marginBottom: 4 }}>{value}</div>
      <div style={{ fontSize: 12, fontWeight: 700, color: '#0A0A0A', marginBottom: 2, fontFamily: "'DM Sans', sans-serif" }}>{label}</div>
      {sub && <div style={{ fontSize: 11, color: '#BCBCBC', fontFamily: "'JetBrains Mono', monospace" }}>{sub}</div>}
    </div>
  );
}

function GenerationCard({ gen, onView, onReopen }) {
  const typeStyle = TYPE_COLORS[gen.creator_type] || TYPE_COLORS.general;
  const platformIcon = PLATFORM_ICONS[gen.platform] || '▶';
  const date = new Date(gen.generated_at);
  const dateStr = date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  const timeStr = date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });

  return (
    <div
      style={{ border: '1.5px solid #E8E8E8', borderRadius: 13, padding: '18px 20px', background: '#FFFFFF', transition: 'all 0.2s', cursor: 'pointer' }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = '#0A0A0A'; e.currentTarget.style.boxShadow = '0 4px 16px rgba(10,10,10,0.07)'; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = '#E8E8E8'; e.currentTarget.style.boxShadow = 'none'; }}
      onClick={() => onView(gen)}
    >
      {/* Top row */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 10 }}>
        <div style={{ width: 38, height: 38, borderRadius: 9, background: '#F5F5F5', border: '1px solid #E8E8E8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 }}>
          {platformIcon}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, color: '#0A0A0A', margin: '0 0 4px', lineHeight: 1.35, fontFamily: "'DM Sans', sans-serif", overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {gen.chosen_topic || gen.niche}
          </h3>
          {gen.chosen_hook && (
            <p style={{ fontSize: 12, color: '#8C8C8C', fontStyle: 'italic', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontFamily: "'DM Sans', sans-serif" }}>
              "{gen.chosen_hook}"
            </p>
          )}
        </div>
        <div style={{ flexShrink: 0, textAlign: 'right' }}>
          <span style={{ fontSize: 10, color: '#BCBCBC', fontFamily: "'JetBrains Mono', monospace", display: 'block' }}>{dateStr}</span>
          <span style={{ fontSize: 10, color: '#BCBCBC', fontFamily: "'JetBrains Mono', monospace", display: 'block' }}>{timeStr}</span>
        </div>
      </div>

      {/* Tags */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
        <span style={{ padding: '3px 9px', borderRadius: 5, fontSize: 10, fontWeight: 700, fontFamily: "'JetBrains Mono', monospace", background: '#F5F5F5', border: '1px solid #E8E8E8', color: '#5C5C5C' }}>
          {gen.platform}
        </span>
        <span style={{ padding: '3px 9px', borderRadius: 5, fontSize: 10, fontWeight: 700, fontFamily: "'JetBrains Mono', monospace", background: typeStyle.bg, border: `1px solid ${typeStyle.border}`, color: typeStyle.color }}>
          {gen.creator_type}
        </span>
        {gen.language && gen.language !== 'English' && (
          <span style={{ padding: '3px 9px', borderRadius: 5, fontSize: 10, fontWeight: 600, fontFamily: "'JetBrains Mono', monospace", background: '#F5F3FF', border: '1px solid #DDD6FE', color: '#7C3AED' }}>
            🌐 {gen.language}
          </span>
        )}
        {gen.tone && (
          <span style={{ padding: '3px 9px', borderRadius: 5, fontSize: 10, fontWeight: 600, fontFamily: "'JetBrains Mono', monospace", background: '#F8F8F8', border: '1px solid #E8E8E8', color: '#8C8C8C' }}>
            {gen.tone}
          </span>
        )}
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: 8, borderTop: '1px solid #F5F5F5', paddingTop: 12 }}>
        <button
          onClick={e => { e.stopPropagation(); onView(gen); }}
          style={{ flex: 1, padding: '8px', border: '1px solid #E8E8E8', borderRadius: 7, background: '#FFFFFF', fontSize: 12, fontWeight: 600, color: '#5C5C5C', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", transition: 'all 0.15s' }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = '#0A0A0A'; e.currentTarget.style.color = '#0A0A0A'; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = '#E8E8E8'; e.currentTarget.style.color = '#5C5C5C'; }}
        >
          👁 Preview
        </button>
        <button
          onClick={e => { e.stopPropagation(); onReopen(gen); }}
          style={{ flex: 1, padding: '8px', border: 'none', borderRadius: 7, background: '#0A0A0A', fontSize: 12, fontWeight: 700, color: '#FFFFFF', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", transition: 'all 0.15s' }}
          onMouseEnter={e => { e.currentTarget.style.background = '#1a1a1a'; }}
          onMouseLeave={e => { e.currentTarget.style.background = '#0A0A0A'; }}
        >
          ↗ Open Full Result
        </button>
      </div>
    </div>
  );
}

function PreviewModal({ gen, onClose, onOpenFull }) {
  if (!gen) return null;
  const r = gen.research_output || {};
  const c = gen.creator_output || {};
  const p = gen.publisher_output || {};
  const yt = p.youtube || {};
  const ig = p.instagram || {};

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', zIndex: 999, padding: '24px 16px', overflowY: 'auto' }}>
      <div style={{ background: '#FFFFFF', border: '1px solid #E8E8E8', borderRadius: 16, width: '100%', maxWidth: 720, boxShadow: '0 24px 60px rgba(0,0,0,0.2)', marginTop: 20 }}>
        {/* Modal header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', padding: '20px 24px', borderBottom: '1px solid #E8E8E8', gap: 12 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: 10, fontWeight: 700, color: '#8C8C8C', textTransform: 'uppercase', letterSpacing: '0.1em', fontFamily: "'JetBrains Mono', monospace", marginBottom: 6 }}>
              {new Date(gen.generated_at).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
            </p>
            <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 20, fontWeight: 800, color: '#0A0A0A', letterSpacing: '-0.02em', lineHeight: 1.2, margin: 0 }}>
              {gen.chosen_topic || gen.niche}
            </h2>
          </div>
          <button onClick={onClose} style={{ background: '#F5F5F5', border: 'none', borderRadius: 8, width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: 16, color: '#5C5C5C', flexShrink: 0 }}>✕</button>
        </div>

        {/* Modal body */}
        <div style={{ padding: '20px 24px', maxHeight: 'calc(80vh - 160px)', overflowY: 'auto' }}>

          {/* Hook */}
          {gen.chosen_hook && (
            <div style={{ padding: '14px 16px', background: '#F8F8F8', border: '1px solid #E8E8E8', borderLeft: '3px solid #0A0A0A', borderRadius: '0 10px 10px 0', marginBottom: 20 }}>
              <p style={{ fontSize: 10, fontWeight: 700, color: '#8C8C8C', textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: "'JetBrains Mono', monospace", marginBottom: 6 }}>Hook</p>
              <p style={{ fontSize: 14, color: '#0A0A0A', fontStyle: 'italic', lineHeight: 1.65, margin: 0, fontFamily: "'DM Sans', sans-serif" }}>"{gen.chosen_hook}"</p>
            </div>
          )}

          {/* Script excerpt */}
          {c.full_script && (
            <div style={{ marginBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <p style={{ fontSize: 10, fontWeight: 700, color: '#8C8C8C', textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: "'JetBrains Mono', monospace" }}>
                  📄 Script Preview
                </p>
                <div style={{ display: 'flex', gap: 6 }}>
                  {c.word_count > 0 && <span style={{ fontSize: 10, color: '#0E7C4A', fontFamily: "'JetBrains Mono', monospace", background: '#F0FDF4', border: '1px solid #86EFAC', borderRadius: 4, padding: '2px 7px', fontWeight: 700 }}>{c.word_count} words</span>}
                  {c.scenes?.length > 0 && <span style={{ fontSize: 10, color: '#2563EB', fontFamily: "'JetBrains Mono', monospace", background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: 4, padding: '2px 7px', fontWeight: 700 }}>{c.scenes.length} scenes</span>}
                </div>
              </div>
              <div style={{ background: '#F8F8F8', border: '1px solid #E8E8E8', borderRadius: 10, padding: '14px 16px', fontSize: 13, color: '#3C3C3C', lineHeight: 1.75, fontFamily: "'DM Sans', sans-serif", whiteSpace: 'pre-wrap', maxHeight: 200, overflow: 'hidden', position: 'relative' }}>
                {c.full_script.slice(0, 500)}{c.full_script.length > 500 && '…'}
                {c.full_script.length > 500 && (
                  <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 60, background: 'linear-gradient(transparent, #F8F8F8)' }} />
                )}
              </div>
            </div>
          )}

          {/* YouTube title */}
          {yt.recommended_title && (
            <div style={{ marginBottom: 16 }}>
              <p style={{ fontSize: 10, fontWeight: 700, color: '#8C8C8C', textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: "'JetBrains Mono', monospace", marginBottom: 7 }}>▶ YouTube Title</p>
              <div style={{ padding: '11px 14px', background: '#FAFAF7', border: '1px solid #D4A847', borderRadius: 8, fontSize: 14, fontWeight: 600, color: '#0A0A0A', fontFamily: "'DM Sans', sans-serif" }}>
                {yt.recommended_title}
              </div>
            </div>
          )}

          {/* Tags */}
          {Array.isArray(yt.tags) && yt.tags.length > 0 && (
            <div style={{ marginBottom: 16 }}>
              <p style={{ fontSize: 10, fontWeight: 700, color: '#8C8C8C', textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: "'JetBrains Mono', monospace", marginBottom: 7 }}>🏷 SEO Tags</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                {yt.tags.slice(0, 12).map((tag, i) => (
                  <span key={i} style={{ padding: '3px 9px', background: '#F5F5F5', border: '1px solid #E8E8E8', borderRadius: 5, fontSize: 11, color: '#5C5C5C', fontFamily: "'JetBrains Mono', monospace" }}>{tag}</span>
                ))}
                {yt.tags.length > 12 && <span style={{ fontSize: 11, color: '#BCBCBC', padding: '3px 0' }}>+{yt.tags.length - 12} more</span>}
              </div>
            </div>
          )}

          {/* IG caption */}
          {ig.caption && (
            <div style={{ marginBottom: 16 }}>
              <p style={{ fontSize: 10, fontWeight: 700, color: '#8C8C8C', textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: "'JetBrains Mono', monospace", marginBottom: 7 }}>📸 Instagram Caption</p>
              <div style={{ padding: '12px 14px', background: '#F8F8F8', border: '1px solid #E8E8E8', borderRadius: 8, fontSize: 12, color: '#3C3C3C', lineHeight: 1.65, fontFamily: "'DM Sans', sans-serif', maxHeight: 100, overflow: 'hidden" }}>
                {ig.caption.slice(0, 200)}{ig.caption.length > 200 && '…'}
              </div>
            </div>
          )}
        </div>

        {/* Modal footer */}
        <div style={{ padding: '16px 24px', borderTop: '1px solid #E8E8E8', display: 'flex', gap: 10 }}>
          <button onClick={onClose} style={{ flex: 1, padding: '11px', border: '1px solid #E8E8E8', borderRadius: 9, background: '#FFFFFF', fontSize: 13, fontWeight: 600, color: '#5C5C5C', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}>
            Close
          </button>
          <button onClick={() => onOpenFull(gen)} style={{ flex: 2, padding: '11px', border: 'none', borderRadius: 9, background: '#0A0A0A', fontSize: 13, fontWeight: 700, color: '#FFFFFF', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}>
            Open Full Result ↗
          </button>
        </div>
      </div>
    </div>
  );
}

export default function GenerationsPage() {
  const router = useRouter();
  const supabase = getSupabaseBrowser();

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generations, setGenerations] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [selectedGen, setSelectedGen] = useState(null);

  const [search, setSearch] = useState('');
  const [filterPlatform, setFilterPlatform] = useState('All');
  const [filterType, setFilterType] = useState('All');
  const [sortBy, setSortBy] = useState('newest');
  const [page, setPage] = useState(1);
  const PER_PAGE = 12;

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) { router.replace('/login'); return; }
      setUser(session.user);

      const { data, error } = await supabase
        .from('generations')
        .select('*')
        .order('generated_at', { ascending: false })
        .limit(200);

      if (!error) setGenerations(data || []);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    let result = [...generations];
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(g =>
        (g.chosen_topic || '').toLowerCase().includes(q) ||
        (g.niche || '').toLowerCase().includes(q) ||
        (g.chosen_hook || '').toLowerCase().includes(q)
      );
    }
    if (filterPlatform !== 'All') result = result.filter(g => g.platform === filterPlatform);
    if (filterType !== 'All') result = result.filter(g => g.creator_type === filterType);
    if (sortBy === 'oldest') result.reverse();
    setFiltered(result);
    setPage(1);
  }, [search, filterPlatform, filterType, sortBy, generations]);

  function handleView(gen) { setSelectedGen(gen); }

  function handleOpenFull(gen) {
    // Reconstruct the result format and store in sessionStorage
    const resultData = {
      research: { ...(gen.research_output || {}), chosen_topic: gen.chosen_topic, chosen_hook: gen.chosen_hook },
      creator: gen.creator_output || {},
      publisher: gen.publisher_output || {},
      meta: { total_duration_ms: gen.generation_duration_ms || 0 },
      input: { platform: gen.platform, language: gen.language, tone: gen.tone, creatorType: gen.creator_type },
    };
    sessionStorage.setItem('studioai_result', JSON.stringify(resultData));
    router.push('/results');
  }

  const platforms = ['All', ...new Set(generations.map(g => g.platform).filter(Boolean))];
  const types = ['All', ...new Set(generations.map(g => g.creator_type).filter(Boolean))];
  const paged = filtered.slice(0, page * PER_PAGE);
  const hasMore = paged.length < filtered.length;

  // Stats
  const totalWords = generations.reduce((sum, g) => sum + (g.creator_output?.word_count || 0), 0);
  const platforms_used = new Set(generations.map(g => g.platform)).size;
  const thisMonth = generations.filter(g => {
    const d = new Date(g.generated_at);
    const now = new Date();
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).length;

  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: 24, height: 24, borderRadius: '50%', border: '2px solid #E8E8E8', borderTopColor: '#0A0A0A', animation: 'spin 0.7s linear infinite' }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;800&family=DM+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeUp { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }
        body { background: #FFFFFF; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-thumb { background: #D0D0D0; border-radius: 4px; }

        .gh-root { min-height: 100vh; background: #FFFFFF; font-family: 'DM Sans', sans-serif; color: #0A0A0A; }
        .gh-topbar { height: 56px; border-bottom: 1px solid #E8E8E8; display: flex; align-items: center; justify-content: space-between; padding: 0 32px; position: sticky; top: 0; background: rgba(255,255,255,0.97); backdrop-filter: blur(12px); z-index: 100; }
        .gh-topbar-left { display: flex; align-items: center; gap: 10px; }
        .gh-logo { width: 28px; height: 28px; background: #0A0A0A; border-radius: 7px; display: flex; align-items: center; justify-content: center; cursor: pointer; }
        .gh-brand { font-family: 'Playfair Display', serif; font-size: 15px; font-weight: 700; color: #0A0A0A; cursor: pointer; }
        .gh-sep { color: #E8E8E8; font-size: 16px; }
        .gh-crumb { font-size: 13px; color: #8C8C8C; font-weight: 500; }
        .gh-btn-ghost { background: none; border: 1px solid #E8E8E8; border-radius: 7px; padding: 7px 14px; font-family: 'DM Sans', sans-serif; font-size: 13px; font-weight: 500; color: #5C5C5C; cursor: pointer; transition: all 0.15s; }
        .gh-btn-ghost:hover { border-color: #0A0A0A; color: #0A0A0A; }
        .gh-btn-primary { background: #0A0A0A; border: none; border-radius: 7px; padding: 8px 16px; font-family: 'DM Sans', sans-serif; font-size: 13px; font-weight: 700; color: #FFFFFF; cursor: pointer; transition: all 0.2s; }
        .gh-btn-primary:hover { background: #1a1a1a; transform: translateY(-1px); }

        .gh-body { max-width: 1080px; margin: 0 auto; padding: 40px 24px 100px; }

        .gh-header { margin-bottom: 36px; }
        .gh-header-row { display: flex; align-items: flex-end; justify-content: space-between; gap: 20px; flex-wrap: wrap; }
        .gh-title { font-family: 'Playfair Display', serif; font-size: 32px; font-weight: 800; color: #0A0A0A; letter-spacing: -0.04em; }
        .gh-sub { font-size: 14px; color: #8C8C8C; margin-top: 4px; }

        .gh-stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; margin-bottom: 32px; }

        .gh-toolbar { display: flex; gap: 10px; flex-wrap: wrap; align-items: center; margin-bottom: 24px; padding-bottom: 20px; border-bottom: 1px solid #F0F0F0; }
        .gh-search-wrap { flex: 1; min-width: 200px; position: relative; }
        .gh-search-icon { position: absolute; left: 12px; top: 50%; transform: translateY(-50%); color: #BCBCBC; font-size: 14px; pointer-events: none; }
        .gh-search { width: 100%; padding: 10px 14px 10px 36px; border: 1.5px solid #E8E8E8; border-radius: 9px; font-family: 'DM Sans', sans-serif; font-size: 13px; color: #0A0A0A; outline: none; transition: border-color 0.2s; background: #FFFFFF; }
        .gh-search::placeholder { color: #BCBCBC; }
        .gh-search:focus { border-color: #0A0A0A; }
        .gh-select { padding: 10px 32px 10px 12px; border: 1.5px solid #E8E8E8; border-radius: 9px; font-family: 'DM Sans', sans-serif; font-size: 13px; color: #0A0A0A; outline: none; appearance: none; background: #FFFFFF url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='7' viewBox='0 0 10 7'%3E%3Cpath d='M1 1l4 4 4-4' stroke='%238C8C8C' strokeWidth='1.5' fill='none' strokeLinecap='round'/%3E%3C/svg%3E") no-repeat right 10px center; cursor: pointer; transition: border-color 0.2s; }
        .gh-select:focus { border-color: #0A0A0A; }
        .gh-results-count { font-size: 12px; color: '#8C8C8C'; font-family: 'JetBrains Mono', monospace; color: #8C8C8C; white-space: nowrap; }

        .gh-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 14px; animation: fadeUp 0.3s ease both; }

        .gh-empty { border: 1.5px dashed #E8E8E8; border-radius: 14px; padding: 60px 24px; text-align: center; }
        .gh-empty-icon { font-size: 36px; margin-bottom: 16px; display: block; opacity: 0.3; }

        .gh-load-more { width: 100%; padding: 13px; border: 1.5px solid #E8E8E8; border-radius: 10px; background: #FFFFFF; font-family: 'DM Sans', sans-serif; font-size: 13px; font-weight: 600; color: '#5C5C5C'; cursor: pointer; transition: all 0.15s; margin-top: 20px; color: #5C5C5C; }
        .gh-load-more:hover { border-color: #0A0A0A; color: #0A0A0A; }

        @media (max-width: 640px) {
          .gh-stats { grid-template-columns: 1fr 1fr; }
          .gh-grid { grid-template-columns: 1fr; }
          .gh-topbar { padding: 0 16px; }
          .gh-body { padding: 24px 16px 80px; }
        }
      `}</style>

      <div className="gh-root">
        {/* Topbar */}
        <header className="gh-topbar">
          <div className="gh-topbar-left">
            <div className="gh-logo" onClick={() => router.push('/generate')}>
              <svg width="13" height="13" viewBox="0 0 20 20" fill="none">
                <polygon points="10,2 17,6 17,14 10,18 3,14 3,6" stroke="#FFFFFF" strokeWidth="1.5" fill="none"/>
                <polygon points="10,6 14,8.5 14,13.5 10,16 6,13.5 6,8.5" fill="#FFFFFF" fillOpacity="0.3"/>
              </svg>
            </div>
            <span className="gh-brand" onClick={() => router.push('/generate')}>Studio AI</span>
            <span className="gh-sep">/</span>
            <span className="gh-crumb">Generations</span>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="gh-btn-ghost" onClick={() => router.push('/dashboard')}>Dashboard</button>
            <button className="gh-btn-primary" onClick={() => router.push('/generate')}>+ New</button>
          </div>
        </header>

        <div className="gh-body">
          {/* Header */}
          <div className="gh-header">
            <div className="gh-header-row">
              <div>
                <h1 className="gh-title">All Generations</h1>
                <p className="gh-sub">Your complete content history — every script, hook, and SEO pack you've ever generated.</p>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="gh-stats">
            <StatCard value={generations.length} label="Total Generations" sub="All time" />
            <StatCard value={thisMonth} label="This Month" sub={new Date().toLocaleString('default', { month: 'long' })} />
            <StatCard value={totalWords > 1000 ? `${(totalWords / 1000).toFixed(1)}k` : totalWords} label="Words Written" sub="Across all scripts" />
            <StatCard value={platforms_used} label="Platforms" sub="Different formats" />
          </div>

          {/* Toolbar */}
          <div className="gh-toolbar">
            <div className="gh-search-wrap">
              <span className="gh-search-icon">🔍</span>
              <input className="gh-search" placeholder="Search by topic, niche, or hook…" value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <select className="gh-select" value={filterPlatform} onChange={e => setFilterPlatform(e.target.value)}>
              {platforms.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
            <select className="gh-select" value={filterType} onChange={e => setFilterType(e.target.value)}>
              {types.map(t => <option key={t} value={t}>{t === 'All' ? 'All Types' : t}</option>)}
            </select>
            <select className="gh-select" value={sortBy} onChange={e => setSortBy(e.target.value)}>
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
            </select>
            <span className="gh-results-count">{filtered.length} result{filtered.length !== 1 ? 's' : ''}</span>
          </div>

          {/* Grid */}
          {filtered.length === 0 ? (
            <div className="gh-empty">
              <span className="gh-empty-icon">◈</span>
              <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: 20, fontWeight: 700, color: '#0A0A0A', marginBottom: 8 }}>
                {generations.length === 0 ? 'No generations yet' : 'No results found'}
              </h3>
              <p style={{ fontSize: 13, color: '#8C8C8C', lineHeight: 1.65, maxWidth: 340, margin: '0 auto 20px' }}>
                {generations.length === 0
                  ? 'Your generated content packs will appear here. Start generating to build your history.'
                  : 'Try adjusting your search or filters.'}
              </p>
              {generations.length === 0 && (
                <button className="gh-btn-primary" onClick={() => router.push('/generate')}>
                  Generate Your First Content Pack →
                </button>
              )}
            </div>
          ) : (
            <>
              <div className="gh-grid">
                {paged.map(gen => (
                  <GenerationCard key={gen.id} gen={gen} onView={handleView} onReopen={handleOpenFull} />
                ))}
              </div>
              {hasMore && (
                <button className="gh-load-more" onClick={() => setPage(p => p + 1)}>
                  Load More ({filtered.length - paged.length} remaining)
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Preview Modal */}
      {selectedGen && (
        <PreviewModal gen={selectedGen} onClose={() => setSelectedGen(null)} onOpenFull={(gen) => { setSelectedGen(null); handleOpenFull(gen); }} />
      )}
    </>
  );
}