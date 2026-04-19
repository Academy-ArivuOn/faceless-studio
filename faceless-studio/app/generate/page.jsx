'use client';
// app/generate/page.jsx
// Key change: sidebar terminal removed — replaced with GenerationOverlay full-screen popup
// All blogger fields and media upload preserved from previous version

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { getSupabaseBrowser } from '@/packages/supabase-browser';
import GenerationOverlay from '@/components/app/GenerationOverlay';

// ── Constants ──────────────────────────────────────────────────────────────────
const PLATFORMS    = ['YouTube', 'Instagram Reels', 'TikTok', 'Podcast', 'Blog', 'YouTube Shorts'];
const LANGUAGES    = ['English', 'Hindi', 'Tamil', 'Telugu', 'Kannada', 'Marathi', 'Bengali', 'Gujarati', 'Malayalam', 'Punjabi'];
const TONES        = ['Conversational', 'Educational', 'Motivational', 'Entertaining', 'Authoritative', 'Storytelling'];
const CREATORTYPES = ['general', 'educator', 'coach', 'entertainer', 'podcaster', 'blogger', 'agency'];

const BLOG_TYPES = [
  { value: 'travel',         label: '✈️ Travel',           desc: 'Destinations, routes, experiences',    color: '#2563EB' },
  { value: 'advertisement',  label: '📢 Advertisement',    desc: 'Sponsored content, brand promotions',   color: '#D97706' },
  { value: 'food',           label: '🍜 Food',             desc: 'Restaurants, dishes, food spots',       color: '#DC2626' },
  { value: 'culture',        label: '🏛️ Culture',          desc: 'Heritage, festivals, traditions',       color: '#7C3AED' },
  { value: 'event',          label: '🎪 Event',            desc: 'Concerts, festivals, live events',      color: '#059669' },
  { value: 'product_review', label: '⭐ Product Review',   desc: 'On-location reviews, services',         color: '#D97706' },
  { value: 'lifestyle',      label: '🌅 Lifestyle',        desc: 'Day-in-life, personal vlogs',           color: '#EC4899' },
];

const OPENING_STYLES = [
  { value: 'auto',                    label: '✨ Auto-select',            desc: 'AI picks best fit' },
  { value: 'slice_of_life',           label: '🎬 Slice of Life',         desc: 'Start mid-experience' },
  { value: 'sensory_immersion',       label: '👃 Sensory Immersion',     desc: 'Smell, sound, texture' },
  { value: 'native_meme_reference',   label: '😄 Native Meme / Joke',    desc: 'Cultural reference opener' },
  { value: 'friend_recommendation',   label: '💬 Friend Rec Energy',     desc: 'Telling your best friend' },
  { value: 'unexpected_confession',   label: '🙊 Unexpected Confession', desc: 'Admit something surprising' },
  { value: 'mystery_tease',           label: '🔍 Mystery Tease',         desc: 'Something unexplained' },
  { value: 'local_legend',            label: '📖 Local Legend',          desc: 'History or folklore' },
  { value: 'contrast_open',           label: '⚡ Before/After Contrast', desc: 'Expectation vs reality' },
  { value: 'direct_address',          label: '🎯 Direct Address',        desc: 'Speak to a specific person' },
  { value: 'advertisement_authentic', label: '📣 Authentic Ad Open',     desc: 'Transparent sponsor opener' },
];

// ── Media Uploader ─────────────────────────────────────────────────────────────
function MediaUploader({ onMediaChange, disabled }) {
  const [mediaItems, setMediaItems] = useState([]);
  const [mediaType,  setMediaType]  = useState(null);
  const [dragOver,   setDragOver]   = useState(false);
  const fileInputRef = useRef(null);

  function processFiles(files) {
    const arr = Array.from(files);
    if (!arr.length) return;
    const first = arr[0];
    const isVideo = first.type.startsWith('video/');
    const isImage = first.type.startsWith('image/');
    if (!isVideo && !isImage) { alert('Please upload images (JPG/PNG/WEBP) or a video clip (MP4/MOV)'); return; }

    if (isVideo) {
      if (first.size > 30 * 1024 * 1024) { alert('Video must be under 30MB.'); return; }
      const reader = new FileReader();
      reader.onload = e => {
        const item = { file: first, preview: URL.createObjectURL(first), base64: e.target.result.split(',')[1], mimeType: first.type, type: 'video' };
        setMediaItems([item]); setMediaType('video');
        onMediaChange({ type: 'video', items: [item] });
      };
      reader.readAsDataURL(first);
    } else {
      const imageFiles = arr.filter(f => f.type.startsWith('image/')).slice(0, 5);
      const newItems = []; let loaded = 0;
      imageFiles.forEach(file => {
        const reader = new FileReader();
        reader.onload = e => {
          newItems.push({ file, preview: URL.createObjectURL(file), base64: e.target.result.split(',')[1], mimeType: file.type, type: 'image' });
          loaded++;
          if (loaded === imageFiles.length) {
            const combined = [...mediaItems.filter(i => i.type === 'image'), ...newItems].slice(0, 5);
            setMediaItems(combined); setMediaType('image');
            onMediaChange({ type: 'image', items: combined });
          }
        };
        reader.readAsDataURL(file);
      });
    }
  }

  function removeItem(idx) {
    const updated = mediaItems.filter((_, i) => i !== idx);
    setMediaItems(updated);
    if (!updated.length) { setMediaType(null); onMediaChange(null); }
    else onMediaChange({ type: mediaType, items: updated });
  }

  return (
    <div>
      {mediaItems.length === 0 ? (
        <div
          onDragOver={e => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={e => { e.preventDefault(); setDragOver(false); processFiles(e.dataTransfer.files); }}
          onClick={() => !disabled && fileInputRef.current?.click()}
          style={{ border: `2px dashed ${dragOver ? '#0A0A0A' : '#D8D8D8'}`, borderRadius: 12, padding: '20px', textAlign: 'center', cursor: disabled ? 'not-allowed' : 'pointer', background: dragOver ? '#F8F8F8' : '#FAFAFA', transition: 'all 0.2s', opacity: disabled ? 0.5 : 1 }}
        >
          <div style={{ fontSize: 24, marginBottom: 6 }}>📸</div>
          <p style={{ fontSize: 12, fontWeight: 600, color: '#0A0A0A', marginBottom: 2, fontFamily: "'DM Sans',sans-serif" }}>Upload photos or a video clip</p>
          <p style={{ fontSize: 10, color: '#8C8C8C', fontFamily: "'DM Sans',sans-serif" }}>Up to 5 photos or 1 clip (MP4/MOV, max 30MB)</p>
        </div>
      ) : (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: mediaType === 'video' ? '1fr' : 'repeat(auto-fill, minmax(80px, 1fr))', gap: 6, marginBottom: 8 }}>
            {mediaItems.map((item, i) => (
              <div key={i} style={{ position: 'relative', borderRadius: 8, overflow: 'hidden', border: '1px solid #E8E8E8', aspectRatio: mediaType === 'video' ? '16/9' : '1' }}>
                {item.type === 'video'
                  ? <video src={item.preview} style={{ width:'100%',height:'100%',objectFit:'cover' }} muted />
                  : <img src={item.preview} alt="" style={{ width:'100%',height:'100%',objectFit:'cover' }} />}
                {item.type === 'video' && <div style={{ position:'absolute',inset:0,display:'flex',alignItems:'center',justifyContent:'center',background:'rgba(0,0,0,0.3)' }}><span style={{fontSize:20,color:'white'}}>▶</span></div>}
                <button onClick={() => removeItem(i)} disabled={disabled} style={{ position:'absolute',top:3,right:3,width:18,height:18,borderRadius:'50%',background:'rgba(0,0,0,0.7)',border:'none',color:'white',fontSize:9,cursor:'pointer',lineHeight:1 }}>✕</button>
              </div>
            ))}
            {mediaType === 'image' && mediaItems.length < 5 && (
              <div onClick={() => !disabled && fileInputRef.current?.click()} style={{ border:'1.5px dashed #D8D8D8',borderRadius:8,aspectRatio:'1',display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',background:'#FAFAFA',fontSize:18,color:'#BCBCBC' }}>+</div>
            )}
          </div>
          <p style={{ fontSize: 10, color: '#8C8C8C', fontFamily: "'JetBrains Mono',monospace" }}>
            {mediaType === 'video' ? '🎥 Video clip ready — AI will analyse' : `📸 ${mediaItems.length} photo${mediaItems.length > 1 ? 's' : ''} ready — AI will analyse`}
          </p>
        </div>
      )}
      <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp,video/mp4,video/quicktime" multiple={mediaType !== 'video'} style={{ display:'none' }} onChange={e => processFiles(e.target.files)} disabled={disabled} />
    </div>
  );
}

function Spinner({ size = 16, light = false }) {
  return <span style={{ width:size,height:size,borderRadius:'50%',border:`2px solid ${light?'rgba(255,255,255,0.25)':'#E8E8E8'}`,borderTopColor:light?'#fff':'#0A0A0A',display:'inline-block',animation:'spin 0.7s linear infinite',flexShrink:0 }} />;
}

// ── Main Page ──────────────────────────────────────────────────────────────────
export default function GeneratePage() {
  const router   = useRouter();
  const supabase = getSupabaseBrowser();

  const [user,        setUser]        = useState(null);
  const [usage,       setUsage]       = useState(null);
  const [dna,         setDna]         = useState(null);
  const [pageLoading, setPageLoading] = useState(true);
  const [creatorMode, setCreatorMode] = useState('faceless');
  const [niche,       setNiche]       = useState('');
  const [platform,    setPlatform]    = useState('YouTube');
  const [language,    setLanguage]    = useState('English');
  const [tone,        setTone]        = useState('Conversational');
  const [creatorType, setCreatorType] = useState('general');
  const [blogType,         setBlogType]         = useState('travel');
  const [location,         setLocation]         = useState('');
  const [openingStyle,     setOpeningStyle]      = useState('auto');
  const [customOpeningNote,setCustomOpeningNote] = useState('');
  const [mediaData,        setMediaData]         = useState(null);
  const [mediaAnalysis,    setMediaAnalysis]     = useState(null);
  const [analysingMedia,   setAnalysingMedia]    = useState(false);
  const [mediaError,       setMediaError]        = useState('');
  const [running,      setRunning]      = useState(false);
  const [agentStatus,  setAgentStatus]  = useState({});
  const [currentAgent, setCurrentAgent] = useState(null);
  const [elapsed,      setElapsed]      = useState(0);
  const [error,        setError]        = useState('');
  const [streak,       setStreak]       = useState(0);

  const timerRef  = useRef(null);
  const startRef  = useRef(null);
  const isVlogger = creatorMode === 'blogger';

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) { router.replace('/login'); return; }
      setUser(session.user);
      const [usageRes, profileRes] = await Promise.all([
        fetch('/api/usage', { headers: { Authorization: `Bearer ${session.access_token}` } }),
        supabase.from('profiles').select('creator_mode,primary_niche,primary_platform,primary_language,creator_type').eq('id', session.user.id).single(),
      ]);
      const usageJson = await usageRes.json();
      if (usageJson.success) setUsage(usageJson.usage);
      if (!profileRes.error && profileRes.data) {
        const p = profileRes.data;
        setDna(p);
        if (p.creator_mode && ['faceless','face','blogger'].includes(p.creator_mode)) setCreatorMode(p.creator_mode);
        if (p.primary_niche) setNiche(p.primary_niche);
        if (p.primary_platform && PLATFORMS.includes(p.primary_platform)) setPlatform(p.primary_platform);
        if (p.primary_language) setLanguage(p.primary_language);
        if (p.creator_type && CREATORTYPES.includes(p.creator_type)) setCreatorType(p.creator_type);
        if (p.creator_type === 'blogger') setCreatorMode('blogger');
      }
      setPageLoading(false);
    });
  }, []);

  const handleMediaChange = useCallback(async (data) => {
    setMediaData(data); setMediaAnalysis(null); setMediaError('');
    if (!data) return;
    setAnalysingMedia(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const payload = { mediaType: data.type, blogType, location: location.trim(), niche: niche.trim() };
      if (data.type === 'image') payload.images = data.items.map(i => ({ base64: i.base64, mimeType: i.mimeType }));
      else { payload.videoBase64 = data.items[0].base64; payload.videoMimeType = data.items[0].mimeType; }
      const res  = await fetch('/api/agents/blogger-vision', { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session.access_token}` }, body: JSON.stringify(payload) });
      const json = await res.json();
      if (json.success) setMediaAnalysis(json.analysis);
      else setMediaError(json.error || 'Media analysis failed — script will be generated without visual context.');
    } catch { setMediaError('Could not analyse media. Script will be based on your inputs only.'); }
    finally { setAnalysingMedia(false); }
  }, [blogType, location, niche, supabase]);

  function startTimer() { startRef.current = Date.now(); timerRef.current = setInterval(() => setElapsed(Date.now() - startRef.current), 100); }
  function stopTimer()  { clearInterval(timerRef.current); }

  async function handleGenerate(e) {
    e.preventDefault();
    if (!niche.trim() || niche.trim().length < 2) { setError('Enter a niche or topic (minimum 2 characters).'); return; }
    if (usage && !usage.allowed) { setError('Monthly limit reached. Upgrade your plan to continue.'); return; }

    setError(''); setRunning(true); setElapsed(0);
    setAgentStatus({ research: 'running', creator: 'idle', publisher: 'idle' });
    setCurrentAgent('research');
    startTimer();

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { router.replace('/login'); return; }

    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session.access_token}` },
        body: JSON.stringify({
          niche: niche.trim(), platform,
          creatorType: isVlogger ? 'blogger' : creatorType,
          language, tone, creatorMode,
          blogType:          isVlogger ? blogType          : null,
          location:          isVlogger && location.trim() ? location.trim() : null,
          openingStyle:      isVlogger ? openingStyle      : null,
          customOpeningNote: isVlogger && customOpeningNote.trim() ? customOpeningNote.trim() : null,
          mediaAnalysis:     isVlogger ? mediaAnalysis     : null,
        }),
      });
      const json = await res.json();
      if (json?.meta?.streak) setStreak(json.meta.streak);

      if (!res.ok || !json.success) {
        stopTimer(); setRunning(false);
        setAgentStatus({ research: 'error', creator: 'idle', publisher: 'idle' });
        setCurrentAgent(null);
        setError(json.error || 'Generation failed. Please try again.');
        return;
      }

      // Simulate agent progression visuals
      setAgentStatus({ research: 'done', creator: 'running', publisher: 'idle' });
      setCurrentAgent('creator');
      await new Promise(r => setTimeout(r, 500));
      setAgentStatus({ research: 'done', creator: 'done', publisher: 'running' });
      setCurrentAgent('publisher');
      await new Promise(r => setTimeout(r, 400));
      setAgentStatus({ research: 'done', creator: 'done', publisher: 'done' });
      setCurrentAgent(null);
      stopTimer();
      await new Promise(r => setTimeout(r, 500));

      sessionStorage.setItem('studioai_result', JSON.stringify(json));
      router.push('/results');
    } catch (err) {
      stopTimer(); setRunning(false); setCurrentAgent(null);
      setError('Network error. Check your connection and try again.');
    }
  }

  if (pageLoading) return (
    <div style={{ minHeight:'100vh',background:'#FFFFFF',display:'flex',alignItems:'center',justifyContent:'center' }}>
      <Spinner size={24} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  const planLabel = usage?.plan === 'free'
    ? `Free · ${usage?.remaining ?? 0} of ${usage?.limit} remaining`
    : `${usage?.plan?.charAt(0).toUpperCase() + usage?.plan?.slice(1)} · Unlimited`;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;800&family=DM+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes fadeIn{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}
        @keyframes slideIn{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
        body{background:#FFFFFF;}
        ::-webkit-scrollbar{width:4px;height:4px;}
        ::-webkit-scrollbar-track{background:#F5F5F5;}
        ::-webkit-scrollbar-thumb{background:#D0D0D0;border-radius:4px;}

        .gp-root{min-height:100vh;background:#FFFFFF;font-family:'DM Sans',sans-serif;color:#0A0A0A;display:flex;flex-direction:column;}
        .gp-topbar{height:56px;border-bottom:1px solid #E8E8E8;display:flex;align-items:center;justify-content:space-between;padding:0 28px;background:#FFFFFF;position:sticky;top:0;z-index:100;}
        .gp-logo-box{width:28px;height:28px;background:#0A0A0A;border-radius:7px;display:flex;align-items:center;justify-content:center;}
        .gp-brand{font-family:'Playfair Display',serif;font-size:15px;font-weight:700;color:#0A0A0A;letter-spacing:-0.02em;}
        .gp-body{flex:1;overflow-y:auto;display:flex;justify-content:center;padding:36px 24px 100px;}
        .gp-inner{width:100%;max-width:560px;}
        .gp-label{font-size:11px;font-weight:700;color:#0A0A0A;text-transform:uppercase;letter-spacing:0.06em;display:block;margin-bottom:6px;}
        .gp-label-opt{font-size:10px;color:#BCBCBC;font-weight:400;text-transform:none;margin-left:4px;}
        .gp-input{padding:11px 14px;background:#FFFFFF;border:1.5px solid #E8E8E8;border-radius:10px;font-family:'DM Sans',sans-serif;font-size:14px;color:#0A0A0A;outline:none;transition:border-color 0.2s,box-shadow 0.2s;width:100%;}
        .gp-input::placeholder{color:#BCBCBC;}
        .gp-input:focus{border-color:#0A0A0A;box-shadow:0 0 0 3px rgba(10,10,10,0.05);}
        .gp-select{padding:11px 36px 11px 14px;background:#FFFFFF;border:1.5px solid #E8E8E8;border-radius:10px;font-family:'DM Sans',sans-serif;font-size:14px;color:#0A0A0A;outline:none;cursor:pointer;width:100%;appearance:none;background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%238C8C8C' strokeWidth='1.5' fill='none' strokeLinecap='round'/%3E%3C/svg%3E");background-repeat:no-repeat;background-position:right 13px center;}
        .gp-select:focus{border-color:#0A0A0A;outline:none;}
        .gp-grid2{display:grid;grid-template-columns:1fr 1fr;gap:12px;}
        .gp-mode-toggle{display:flex;gap:8px;}
        .gp-mode-btn{flex:1;padding:11px 8px;border:1.5px solid #E8E8E8;border-radius:10px;font-family:'DM Sans',sans-serif;font-size:12px;font-weight:600;cursor:pointer;transition:all 0.2s;background:#FFFFFF;color:#8C8C8C;display:flex;flex-direction:column;align-items:center;gap:3px;min-height:64px;}
        .gp-mode-btn .mode-emoji{font-size:18px;line-height:1;}
        .gp-mode-btn.active{border-color:#0A0A0A;color:#0A0A0A;background:#F8F8F8;}
        .gp-mode-btn.active-blogger{border-color:#D97706;color:#D97706;background:#FFFBEB;}
        .blog-type-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:7px;animation:fadeIn 0.2s ease;}
        .blog-type-btn{padding:11px 12px;border:1.5px solid #E8E8E8;border-radius:10px;background:#FFFFFF;cursor:pointer;transition:all 0.2s;text-align:left;}
        .blog-type-btn.active{border-width:2px;background:#FAFAFA;}
        .blog-type-btn:hover:not(.active){border-color:#D8D8D8;background:#FAFAFA;}
        .blog-type-label{font-size:12px;font-weight:700;color:#0A0A0A;display:block;margin-bottom:1px;}
        .blog-type-btn.active .blog-type-label{color:var(--blog-color);}
        .blog-type-desc{font-size:10px;color:#8C8C8C;display:block;line-height:1.3;}
        .gp-section-div{display:flex;align-items:center;gap:10px;padding:2px 0;}
        .gp-section-div-line{flex:1;height:1px;background:#F0F0F0;}
        .gp-section-div-label{font-size:9px;font-weight:700;color:#BCBCBC;text-transform:uppercase;letter-spacing:0.08em;font-family:'JetBrains Mono',monospace;white-space:nowrap;}
        .gp-submit{background:#0A0A0A;border:none;border-radius:10px;padding:14px 24px;font-family:'DM Sans',sans-serif;font-size:15px;font-weight:700;color:#FFFFFF;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:10px;width:100%;transition:all 0.2s;margin-top:4px;}
        .gp-submit.blogger-submit{background:linear-gradient(135deg,#D97706,#B45309);}
        .gp-submit:hover:not(:disabled){transform:translateY(-1px);box-shadow:0 8px 24px rgba(10,10,10,0.15);}
        .gp-submit.blogger-submit:hover:not(:disabled){box-shadow:0 8px 24px rgba(217,119,6,0.3);}
        .gp-submit:disabled{opacity:0.45;cursor:not-allowed;}
        .gp-hint{font-size:12px;color:#8C8C8C;line-height:1.5;margin-top:4px;}
        .gp-error{background:#FEF2F2;border:1px solid #FCA5A5;border-radius:8px;padding:11px 14px;font-size:13px;color:#DC2626;display:flex;gap:8px;align-items:flex-start;line-height:1.5;}
        @media(max-width:640px){.gp-body{padding:20px 14px 80px;}.blog-type-grid{grid-template-columns:1fr;}.gp-grid2{grid-template-columns:1fr;}}
      `}</style>

      {/* Generation overlay popup */}
      <GenerationOverlay
        visible={running}
        currentAgent={currentAgent}
        agentStatus={agentStatus}
        elapsed={elapsed}
        isBlogger={isVlogger}
        blogType={blogType}
        location={location}
        openingStyle={openingStyle}
        hasMedia={!!mediaAnalysis}
      />

      <div className="gp-root">
        {/* Topbar */}
        <header className="gp-topbar">
          <div style={{ display:'flex',alignItems:'center',gap:9 }}>
            <div className="gp-logo-box">
              <svg width="13" height="13" viewBox="0 0 20 20" fill="none">
                <polygon points="10,2 17,6 17,14 10,18 3,14 3,6" stroke="#FFFFFF" strokeWidth="1.4" fill="none"/>
                <polygon points="10,6 14,8.5 14,13.5 10,16 6,13.5 6,8.5" fill="#FFFFFF" fillOpacity="0.3"/>
              </svg>
            </div>
            <span className="gp-brand">Studio AI</span>
            <span style={{ color:'#E8E8E8',fontSize:15,margin:'0 2px' }}>/</span>
            <span style={{ fontSize:13,color:'#8C8C8C',fontWeight:500 }}>Generate</span>
          </div>
          <div style={{ display:'flex',alignItems:'center',gap:14 }}>
            <span style={{ fontFamily:"'JetBrains Mono',monospace",fontSize:11,color:'#8C8C8C',background:'#F5F5F5',border:'1px solid #E8E8E8',borderRadius:100,padding:'3px 10px' }}>{planLabel}</span>
            {streak > 0 && <div style={{ display:'flex',alignItems:'center',gap:4,background:'#FFF7ED',border:'1px solid #FED7AA',borderRadius:100,padding:'3px 10px',fontSize:11,fontWeight:600,color:'#C2410C' }}>🔥 {streak}d</div>}
            <button onClick={() => router.push('/dashboard')} style={{ background:'none',border:'none',fontSize:12,color:'#8C8C8C',cursor:'pointer',fontFamily:"'DM Sans',sans-serif" }}>Dashboard</button>
            <button onClick={async () => { await supabase.auth.signOut(); router.push('/login'); }} style={{ background:'transparent',border:'1px solid #E8E8E8',borderRadius:6,padding:'5px 10px',color:'#5C5C5C',fontSize:11,cursor:'pointer' }}>Sign out</button>
          </div>
        </header>

        {/* Main form */}
        <main className="gp-body">
          <div className="gp-inner">
            {/* Header */}
            <div style={{ marginBottom:28 }}>
              <div style={{ fontSize:10,color:'#8C8C8C',textTransform:'uppercase',letterSpacing:'0.1em',marginBottom:10,display:'flex',alignItems:'center',gap:8,fontFamily:"'JetBrains Mono',monospace" }}>
                <span style={{ width:18,height:1,background:'#C9A227',display:'inline-block' }}/>Content Generation
              </div>
              <h1 style={{ fontFamily:"'Playfair Display',serif",fontSize:26,fontWeight:800,color:'#0A0A0A',letterSpacing:'-0.03em',lineHeight:1.2,marginBottom:7 }}>
                {isVlogger ? 'Generate your vlog script' : 'Generate your content pack'}
              </h1>
              <p style={{ fontSize:13,color:'#5C5C5C',lineHeight:1.65 }}>
                {isVlogger
                  ? 'Upload a photo or clip, pick your opening style, and get a complete script with filming guide.'
                  : 'Three AI agents — Research, Script, Publisher — all personalised to your niche.'}
              </p>
            </div>

            {dna && (
              <div style={{ display:'flex',alignItems:'center',gap:8,padding:'8px 12px',background:isVlogger?'#FFFBEB':'#F0FDF4',border:`1px solid ${isVlogger?'#FED7AA':'#86EFAC'}`,borderRadius:9,marginBottom:18,fontSize:12,color:isVlogger?'#92400E':'#15803D' }}>
                <span style={{ fontSize:14 }}>{isVlogger?'🎒':'🧬'}</span>
                <span>{isVlogger?'Blogger mode — filming guide, scene breakdown & opening style included':'Creator DNA loaded — personalised to your niche and style'}</span>
              </div>
            )}

            <form style={{ display:'flex',flexDirection:'column',gap:18 }} onSubmit={handleGenerate}>

              {/* Niche */}
              <div>
                <label className="gp-label">{isVlogger?'Niche / Topic':'Niche'} <span style={{color:'#DC2626'}}>*</span></label>
                <input className="gp-input" type="text"
                  placeholder={isVlogger ? 'e.g. Street food Chennai, Hampi ruins, Sunburn Goa…' : 'e.g. personal finance for Indian millennials…'}
                  value={niche} onChange={e => setNiche(e.target.value)} disabled={running} required minLength={2} />
                {!isVlogger && <p className="gp-hint">Specific beats generic — the more precise, the stronger the output.</p>}
              </div>

              {/* Creator Mode */}
              <div>
                <label className="gp-label">Creator Mode</label>
                <div className="gp-mode-toggle">
                  <button type="button" className={`gp-mode-btn ${creatorMode==='faceless'?'active':''}`} onClick={()=>{setCreatorMode('faceless');setCreatorType('general');}} disabled={running}>
                    <span className="mode-emoji">🎬</span>Faceless
                  </button>
                  <button type="button" className={`gp-mode-btn ${creatorMode==='face'?'active':''}`} onClick={()=>{setCreatorMode('face');setCreatorType('general');}} disabled={running}>
                    <span className="mode-emoji">🎥</span>On Camera
                  </button>
                  <button type="button" className={`gp-mode-btn ${isVlogger?'active-blogger':''}`} onClick={()=>{setCreatorMode('blogger');setCreatorType('blogger');}} disabled={running}>
                    <span className="mode-emoji">🎒</span>Blogger
                  </button>
                </div>
              </div>

              {/* ── Blogger fields ── */}
              {isVlogger && (<>
                {/* Blog Type */}
                <div>
                  <label className="gp-label">Blog Type <span style={{color:'#DC2626'}}>*</span></label>
                  <div className="blog-type-grid">
                    {BLOG_TYPES.map(bt => (
                      <button key={bt.value} type="button"
                        className={`blog-type-btn ${blogType===bt.value?'active':''}`}
                        style={{ '--blog-color':bt.color, borderColor:blogType===bt.value?bt.color:'#E8E8E8' }}
                        onClick={()=>setBlogType(bt.value)} disabled={running}>
                        <span className="blog-type-label">{bt.label}</span>
                        <span className="blog-type-desc">{bt.desc}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Location */}
                <div>
                  <label className="gp-label">Location <span className="gp-label-opt">(optional but recommended)</span></label>
                  <input className="gp-input" type="text"
                    placeholder="e.g. Hampi, Karnataka · MTR Restaurant, Bangalore · Sunburn Festival, Goa"
                    value={location} onChange={e=>setLocation(e.target.value)} disabled={running} />
                  {location.trim() && (
                    <div style={{ display:'inline-flex',alignItems:'center',gap:4,marginTop:5,padding:'3px 9px',background:'#FFFBEB',border:'1px solid #FED7AA',borderRadius:6,fontSize:11,fontWeight:600,color:'#D97706',fontFamily:"'JetBrains Mono',monospace" }}>
                      📍 {location.trim()}
                    </div>
                  )}
                  <p className="gp-hint">Adding a location makes scripts dramatically more specific and authentic.</p>
                </div>

                {/* Media Upload */}
                <div>
                  <label className="gp-label">Photos / Video Clip <span className="gp-label-opt">(AI will analyse & use in script)</span></label>
                  <MediaUploader onMediaChange={handleMediaChange} disabled={running} />
                  {analysingMedia && (
                    <div style={{ display:'flex',alignItems:'center',gap:8,marginTop:8,padding:'9px 12px',background:'#F8F8F8',borderRadius:8 }}>
                      <Spinner size={13} />
                      <span style={{ fontSize:12,color:'#8C8C8C',fontFamily:"'DM Sans',sans-serif" }}>Analysing your media with AI Vision…</span>
                    </div>
                  )}
                  {mediaAnalysis && !analysingMedia && (
                    <div style={{ marginTop:8,background:'#F0FDF4',border:'1px solid #86EFAC',borderRadius:10,padding:'10px 13px',animation:'fadeIn 0.3s ease' }}>
                      <p style={{ fontSize:11,fontWeight:700,color:'#0E7C4A',textTransform:'uppercase',letterSpacing:'0.06em',marginBottom:4,fontFamily:"'JetBrains Mono',monospace" }}>✓ Visual context ready</p>
                      <p style={{ fontSize:12,color:'#166534',lineHeight:1.6,fontFamily:"'DM Sans',sans-serif" }}>
                        {mediaAnalysis.type==='image' ? `${mediaAnalysis.count} image(s) analysed. ${mediaAnalysis.description?.slice(0,100)}…` : `Video clip analysed. ${mediaAnalysis.description?.slice(0,100)}…`}
                      </p>
                    </div>
                  )}
                  {mediaError && (
                    <div style={{ marginTop:8,padding:'8px 11px',background:'#FFF7ED',border:'1px solid #FED7AA',borderRadius:8,fontSize:11,color:'#92400E' }}>⚠ {mediaError}</div>
                  )}
                </div>

                {/* Opening Style */}
                <div>
                  <label className="gp-label">Opening Style</label>
                  <p className="gp-hint" style={{ marginBottom:8 }}>No hype, no fear-bait — pick a natural opener that fits your content.</p>
                  <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:5 }}>
                    {OPENING_STYLES.map(s => (
                      <button key={s.value} type="button" onClick={()=>setOpeningStyle(s.value)} disabled={running}
                        style={{ padding:'9px 11px',border:`1.5px solid ${openingStyle===s.value?'#0A0A0A':'#E8E8E8'}`,borderRadius:9,background:openingStyle===s.value?'#F8F8F8':'#FFFFFF',cursor:'pointer',textAlign:'left',transition:'all 0.15s' }}>
                        <span style={{ display:'block',fontSize:11,fontWeight:700,color:openingStyle===s.value?'#0A0A0A':'#5C5C5C',marginBottom:1,fontFamily:"'DM Sans',sans-serif" }}>{s.label}</span>
                        <span style={{ display:'block',fontSize:10,color:'#8C8C8C',lineHeight:1.3,fontFamily:"'DM Sans',sans-serif" }}>{s.desc}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Custom note */}
                {openingStyle !== 'auto' && (
                  <div style={{ animation:'slideIn 0.2s ease' }}>
                    <label className="gp-label">Opening Note <span className="gp-label-opt">(optional hint for AI)</span></label>
                    <textarea className="gp-input" rows={2} style={{ resize:'vertical' }}
                      placeholder='e.g. "Start with me trying the first dish" or "Reference the biryani meme before starting"'
                      value={customOpeningNote} onChange={e=>setCustomOpeningNote(e.target.value)} disabled={running} />
                  </div>
                )}
              </>)}

              {/* Common prefs */}
              <div className="gp-section-div">
                <div className="gp-section-div-line"/>
                <span className="gp-section-div-label">Preferences</span>
                <div className="gp-section-div-line"/>
              </div>

              <div className="gp-grid2">
                <div>
                  <label className="gp-label">Platform</label>
                  <select className="gp-select" value={platform} onChange={e=>setPlatform(e.target.value)} disabled={running}>
                    {PLATFORMS.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
                <div>
                  <label className="gp-label">Language</label>
                  <select className="gp-select" value={language} onChange={e=>setLanguage(e.target.value)} disabled={running}>
                    {LANGUAGES.map(l => <option key={l} value={l}>{l}</option>)}
                  </select>
                </div>
              </div>

              <div className="gp-grid2">
                <div>
                  <label className="gp-label">Tone</label>
                  <select className="gp-select" value={tone} onChange={e=>setTone(e.target.value)} disabled={running}>
                    {TONES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                {!isVlogger && (
                  <div>
                    <label className="gp-label">Creator Type</label>
                    <select className="gp-select" value={creatorType} onChange={e=>setCreatorType(e.target.value)} disabled={running}>
                      {CREATORTYPES.map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase()+c.slice(1)}</option>)}
                    </select>
                  </div>
                )}
              </div>

              {error && <div className="gp-error">⚠ {error}</div>}

              {usage?.plan==='free' && (usage?.remaining??1)===0 && !error && (
                <div style={{ background:'#FFF7ED',border:'1px solid #FED7AA',borderRadius:8,padding:'10px 13px',fontSize:13,color:'#C2410C',display:'flex',gap:8,alignItems:'center' }}>
                  ⚠ Monthly limit reached. <a href="/dashboard" style={{ color:'#C9A227',textDecoration:'underline',fontWeight:600 }}>Upgrade plan</a>
                </div>
              )}

              <button type="submit" className={`gp-submit ${isVlogger?'blogger-submit':''}`}
                disabled={running || (!usage?.allowed && usage!==null) || analysingMedia}>
                {analysingMedia ? <><Spinner size={14} light />Analysing media…</>
                  : isVlogger ? <>🎒 Generate Vlog Script →</>
                  : <>Run All 3 Agents →</>}
              </button>

              {usage?.plan==='free' && (
                <p style={{ textAlign:'center',fontSize:11,color:'#BCBCBC',marginTop:-6 }}>
                  {usage.remaining??0} of {usage.limit} free generations remaining
                </p>
              )}
            </form>
          </div>
        </main>
      </div>
    </>
  );
}