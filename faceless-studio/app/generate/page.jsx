'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { getSupabaseBrowser } from '@/packages/supabase-browser';

// ── Constants ──────────────────────────────────────────────────────────────────
const PLATFORMS    = ['YouTube', 'Instagram Reels', 'TikTok', 'Podcast', 'Blog', 'YouTube Shorts'];
const LANGUAGES    = ['English', 'Hindi', 'Tamil', 'Telugu', 'Kannada', 'Marathi', 'Bengali', 'Gujarati', 'Malayalam', 'Punjabi'];
const TONES        = ['Conversational', 'Educational', 'Motivational', 'Entertaining', 'Authoritative', 'Storytelling'];
const CREATORTYPES = ['general', 'educator', 'coach', 'entertainer', 'podcaster', 'blogger', 'agency'];

const BLOG_TYPES = [
  { value: 'travel',         label: '✈️ Travel',           desc: 'Destinations, routes, experiences',       color: '#2563EB' },
  { value: 'advertisement',  label: '📢 Advertisement',    desc: 'Sponsored content, brand promotions',      color: '#D97706' },
  { value: 'food',           label: '🍜 Food',             desc: 'Restaurants, dishes, food spots',          color: '#DC2626' },
  { value: 'culture',        label: '🏛️ Culture',          desc: 'Heritage, festivals, traditions',          color: '#7C3AED' },
  { value: 'event',          label: '🎪 Event',            desc: 'Concerts, festivals, live events',         color: '#059669' },
  { value: 'product_review', label: '⭐ Product Review',   desc: 'On-location reviews, services',            color: '#D97706' },
  { value: 'lifestyle',      label: '🌅 Lifestyle',        desc: 'Day-in-life, personal vlogs',              color: '#EC4899' },
];

const OPENING_STYLES = [
  { value: 'auto',                    label: '✨ Auto-select',                  desc: 'AI picks best fit for your content' },
  { value: 'slice_of_life',           label: '🎬 Slice of Life',               desc: 'Start mid-experience, no intro' },
  { value: 'sensory_immersion',       label: '👃 Sensory Immersion',           desc: 'Lead with smell, sound, texture' },
  { value: 'native_meme_reference',   label: '😄 Native Meme / Joke',          desc: 'Open with a relatable cultural reference' },
  { value: 'friend_recommendation',   label: '💬 Friend Rec Energy',           desc: 'Like excitedly telling your best friend' },
  { value: 'unexpected_confession',   label: '🙊 Unexpected Confession',       desc: 'Admit something surprising first' },
  { value: 'mystery_tease',           label: '🔍 Mystery Tease',               desc: 'Something unexplained that demands an answer' },
  { value: 'local_legend',            label: '📖 Local Legend',                desc: 'History or folklore of the place' },
  { value: 'contrast_open',           label: '⚡ Before/After Contrast',       desc: 'What people expect vs what they find' },
  { value: 'direct_address',          label: '🎯 Direct Address',              desc: 'Speak to a specific type of person' },
  { value: 'advertisement_authentic', label: '📣 Authentic Ad Open',           desc: 'Transparent sponsored content opener' },
];

const AGENTS = [
  { id: 'research', num: '01', label: 'Research',    desc: 'Angles, hooks & opening psychology', color: '#C9A227' },
  { id: 'creator',  num: '02', label: 'Script',      desc: 'Full script, scenes & filming guide', color: '#2563EB' },
  { id: 'publisher',num: '03', label: 'Distribute',  desc: 'Captions, hashtags & 7-day plan',     color: '#0E7C4A' },
];

const AGENT_LOG_SEQUENCES = {
  research:  ['Analysing blog type and location context…', 'Finding authentic content angles…', 'Selecting best opening style…', '✓ Research complete'],
  creator:   ['Applying blogger DNA to script…', 'Writing scene-by-scene breakdown…', 'Building filming guide…', '✓ Script complete'],
  publisher: ['Generating platform-optimised assets…', 'Writing captions and hashtags…', 'Building 7-day content plan…', '✓ Distribution pack ready'],
};

// ── Media Upload Component ─────────────────────────────────────────────────────
function MediaUploader({ onMediaChange, disabled }) {
  const [mediaItems, setMediaItems]     = useState([]);
  const [mediaType, setMediaType]       = useState(null); // 'image' | 'video'
  const [dragOver, setDragOver]         = useState(false);
  const fileInputRef                    = useRef(null);

  function processFiles(files) {
    const arr = Array.from(files);
    if (arr.length === 0) return;

    const firstFile = arr[0];
    const isVideo   = firstFile.type.startsWith('video/');
    const isImage   = firstFile.type.startsWith('image/');

    if (!isVideo && !isImage) {
      alert('Please upload images (JPG, PNG, WEBP) or a short video clip (MP4, MOV)');
      return;
    }

    if (isVideo) {
      // Only one video
      const file = arr[0];
      if (file.size > 30 * 1024 * 1024) {
        alert('Video must be under 30MB. Please use a short clip (under 30 seconds).');
        return;
      }
      const reader = new FileReader();
      reader.onload = (e) => {
        const item = { file, preview: URL.createObjectURL(file), base64: e.target.result.split(',')[1], mimeType: file.type, type: 'video' };
        setMediaItems([item]);
        setMediaType('video');
        onMediaChange({ type: 'video', items: [item] });
      };
      reader.readAsDataURL(file);
    } else {
      // Up to 5 images
      const imageFiles = arr.filter(f => f.type.startsWith('image/')).slice(0, 5);
      const newItems   = [];
      let loaded       = 0;

      imageFiles.forEach(file => {
        const reader = new FileReader();
        reader.onload = (e) => {
          newItems.push({ file, preview: URL.createObjectURL(file), base64: e.target.result.split(',')[1], mimeType: file.type, type: 'image' });
          loaded++;
          if (loaded === imageFiles.length) {
            const combined = [...mediaItems.filter(i => i.type === 'image'), ...newItems].slice(0, 5);
            setMediaItems(combined);
            setMediaType('image');
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
    if (updated.length === 0) {
      setMediaType(null);
      onMediaChange(null);
    } else {
      onMediaChange({ type: mediaType, items: updated });
    }
  }

  function handleDrop(e) {
    e.preventDefault();
    setDragOver(false);
    processFiles(e.dataTransfer.files);
  }

  return (
    <div>
      {/* Drop zone */}
      {mediaItems.length === 0 ? (
        <div
          onDragOver={e => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => !disabled && fileInputRef.current?.click()}
          style={{
            border: `2px dashed ${dragOver ? '#0A0A0A' : '#D8D8D8'}`,
            borderRadius: 12,
            padding: '24px 20px',
            textAlign: 'center',
            cursor: disabled ? 'not-allowed' : 'pointer',
            background: dragOver ? '#F8F8F8' : '#FAFAFA',
            transition: 'all 0.2s',
            opacity: disabled ? 0.5 : 1,
          }}
        >
          <div style={{ fontSize: 28, marginBottom: 8 }}>📸</div>
          <p style={{ fontSize: 13, fontWeight: 600, color: '#0A0A0A', marginBottom: 4, fontFamily: "'DM Sans', sans-serif" }}>
            Upload photos or a short video clip
          </p>
          <p style={{ fontSize: 11, color: '#8C8C8C', fontFamily: "'DM Sans', sans-serif", marginBottom: 8 }}>
            Up to 5 photos (JPG/PNG) or 1 video clip (MP4/MOV, max 30MB)
          </p>
          <p style={{ fontSize: 10, color: '#BCBCBC', fontFamily: "'JetBrains Mono', monospace" }}>
            Drag & drop or click to browse
          </p>
        </div>
      ) : (
        <div>
          {/* Preview grid */}
          <div style={{ display: 'grid', gridTemplateColumns: mediaType === 'video' ? '1fr' : 'repeat(auto-fill, minmax(90px, 1fr))', gap: 8, marginBottom: 10 }}>
            {mediaItems.map((item, i) => (
              <div key={i} style={{ position: 'relative', borderRadius: 8, overflow: 'hidden', border: '1px solid #E8E8E8', aspectRatio: mediaType === 'video' ? '16/9' : '1' }}>
                {item.type === 'video' ? (
                  <video src={item.preview} style={{ width: '100%', height: '100%', objectFit: 'cover' }} muted />
                ) : (
                  <img src={item.preview} alt={`media ${i}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                )}
                {item.type === 'video' && (
                  <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.3)' }}>
                    <span style={{ fontSize: 24, color: 'white' }}>▶</span>
                  </div>
                )}
                <button
                  onClick={() => removeItem(i)}
                  disabled={disabled}
                  style={{ position: 'absolute', top: 4, right: 4, width: 20, height: 20, borderRadius: '50%', background: 'rgba(0,0,0,0.7)', border: 'none', color: 'white', fontSize: 10, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', lineHeight: 1 }}
                >
                  ✕
                </button>
              </div>
            ))}
            {/* Add more images button */}
            {mediaType === 'image' && mediaItems.length < 5 && (
              <div
                onClick={() => !disabled && fileInputRef.current?.click()}
                style={{ border: '1.5px dashed #D8D8D8', borderRadius: 8, aspectRatio: '1', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', background: '#FAFAFA', fontSize: 20, color: '#BCBCBC' }}
              >
                +
              </div>
            )}
          </div>
          {/* Status */}
          <p style={{ fontSize: 11, color: '#8C8C8C', fontFamily: "'JetBrains Mono', monospace" }}>
            {mediaType === 'video' ? '🎥 Video clip loaded — AI will analyse it' : `📸 ${mediaItems.length} photo${mediaItems.length > 1 ? 's' : ''} loaded — AI will analyse them`}
          </p>
        </div>
      )}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,video/mp4,video/quicktime"
        multiple={mediaType !== 'video'}
        style={{ display: 'none' }}
        onChange={e => processFiles(e.target.files)}
        disabled={disabled}
      />
    </div>
  );
}

// ── Spinner ────────────────────────────────────────────────────────────────────
function Spinner({ size = 16, light = false }) {
  return (
    <span style={{
      width: size, height: size, borderRadius: '50%',
      border: `2px solid ${light ? 'rgba(255,255,255,0.25)' : '#E8E8E8'}`,
      borderTopColor: light ? '#fff' : '#0A0A0A',
      display: 'inline-block', animation: 'spin 0.7s linear infinite', flexShrink: 0,
    }} />
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────────
export default function GeneratePage() {
  const router   = useRouter();
  const supabase = getSupabaseBrowser();

  // Auth / usage
  const [user,        setUser]        = useState(null);
  const [usage,       setUsage]       = useState(null);
  const [dna,         setDna]         = useState(null);
  const [pageLoading, setPageLoading] = useState(true);

  // Mode
  const [creatorMode, setCreatorMode] = useState('faceless'); // 'faceless' | 'face' | 'blogger'

  // Common fields
  const [niche,       setNiche]       = useState('');
  const [platform,    setPlatform]    = useState('YouTube');
  const [language,    setLanguage]    = useState('English');
  const [tone,        setTone]        = useState('Conversational');
  const [creatorType, setCreatorType] = useState('general');

  // Blogger-specific fields
  const [blogType,          setBlogType]          = useState('travel');
  const [location,          setLocation]          = useState('');
  const [openingStyle,      setOpeningStyle]      = useState('auto');
  const [customOpeningNote, setCustomOpeningNote] = useState('');
  const [mediaData,         setMediaData]         = useState(null);     // { type, items }
  const [mediaAnalysis,     setMediaAnalysis]     = useState(null);     // result from vision API
  const [analysingMedia,    setAnalysingMedia]    = useState(false);
  const [mediaError,        setMediaError]        = useState('');

  // Pipeline
  const [running,      setRunning]      = useState(false);
  const [agentStatus,  setAgentStatus]  = useState({});
  const [currentAgent, setCurrentAgent] = useState(null);
  const [elapsed,      setElapsed]      = useState(0);
  const [error,        setError]        = useState('');
  const [logs,         setLogs]         = useState([]);
  const [streak,       setStreak]       = useState(0);

  const timerRef   = useRef(null);
  const startRef   = useRef(null);
  const logsRef    = useRef(null);
  const logTimers  = useRef([]);

  const isVlogger  = creatorMode === 'blogger';

  // ── Auth / profile load ──────────────────────────────────────────────────────
  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) { router.replace('/login'); return; }
      setUser(session.user);

      const [usageRes, profileRes] = await Promise.all([
        fetch('/api/usage', { headers: { Authorization: `Bearer ${session.access_token}` } }),
        supabase.from('profiles').select('creator_mode, primary_niche, primary_platform, primary_language, creator_type').eq('id', session.user.id).single(),
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

  // ── Media Analysis ───────────────────────────────────────────────────────────
  const handleMediaChange = useCallback(async (data) => {
    setMediaData(data);
    setMediaAnalysis(null);
    setMediaError('');

    if (!data) return;

    // Auto-analyse when media is uploaded
    setAnalysingMedia(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const payload = {
        mediaType: data.type,
        blogType,
        location: location.trim(),
        niche:    niche.trim(),
      };

      if (data.type === 'image') {
        payload.images = data.items.map(i => ({ base64: i.base64, mimeType: i.mimeType }));
      } else {
        payload.videoBase64  = data.items[0].base64;
        payload.videoMimeType = data.items[0].mimeType;
      }

      const res  = await fetch('/api/agents/blogger-vision', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session.access_token}` },
        body: JSON.stringify(payload),
      });
      const json = await res.json();

      if (json.success) {
        setMediaAnalysis(json.analysis);
      } else {
        setMediaError(json.error || 'Media analysis failed. Script will be generated without visual context.');
      }
    } catch (err) {
      setMediaError('Could not analyse media. You can still generate — the script will be based on your inputs only.');
    } finally {
      setAnalysingMedia(false);
    }
  }, [blogType, location, niche, supabase]);

  // ── Pipeline Logging ─────────────────────────────────────────────────────────
  function pushLog(msg, type = 'info') {
    setLogs(prev => {
      const next = [...prev, { t: new Date().toLocaleTimeString('en', { hour12: false }), msg, type }];
      setTimeout(() => { if (logsRef.current) logsRef.current.scrollTop = logsRef.current.scrollHeight; }, 40);
      return next;
    });
  }

  function clearLogTimers() { logTimers.current.forEach(t => clearTimeout(t)); logTimers.current = []; }
  function startTimer()     { startRef.current = Date.now(); timerRef.current = setInterval(() => setElapsed(Date.now() - startRef.current), 100); }
  function stopTimer()      { clearInterval(timerRef.current); }

  function startAgentLogs(agentId, delayMs = 0) {
    const lines = AGENT_LOG_SEQUENCES[agentId] || [];
    lines.forEach((msg, i) => {
      const t = setTimeout(() => pushLog(msg, msg.startsWith('✓') ? 'success' : 'agent'), delayMs + i * 900);
      logTimers.current.push(t);
    });
  }

  // ── Generate Handler ─────────────────────────────────────────────────────────
  async function handleGenerate(e) {
    e.preventDefault();
    if (!niche.trim() || niche.trim().length < 2) { setError('Enter a niche or topic (minimum 2 characters).'); return; }
    if (usage && !usage.allowed) { setError('Monthly limit reached. Upgrade your plan to continue.'); return; }

    clearLogTimers();
    setError(''); setRunning(true); setLogs([]);
    setAgentStatus({ research: 'running', creator: 'idle', publisher: 'idle' });
    setCurrentAgent('research');
    startTimer();

    pushLog('Pipeline initialised', 'system');

    if (isVlogger) {
      pushLog(`Blogger mode: ${blogType}${location ? ` @ ${location}` : ''}`, 'system');
      if (mediaAnalysis) pushLog(`📸 Visual context loaded — ${mediaAnalysis.type === 'video' ? 'video clip' : mediaAnalysis.count + ' image(s)'} analysed`, 'system');
      if (openingStyle !== 'auto') pushLog(`Opening style: ${OPENING_STYLES.find(s => s.value === openingStyle)?.label}`, 'system');
    }

    startAgentLogs('research', 200);

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { router.replace('/login'); return; }

    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session.access_token}` },
        body: JSON.stringify({
          niche: niche.trim(),
          platform,
          creatorType: isVlogger ? 'blogger' : creatorType,
          language,
          tone,
          creatorMode,
          blogType:           isVlogger ? blogType          : null,
          location:           isVlogger && location.trim() ? location.trim() : null,
          openingStyle:       isVlogger ? openingStyle      : null,
          customOpeningNote:  isVlogger && customOpeningNote.trim() ? customOpeningNote.trim() : null,
          mediaAnalysis:      isVlogger ? mediaAnalysis     : null,
        }),
      });
      const json = await res.json();

      clearLogTimers();
      if (json?.meta?.streak) setStreak(json.meta.streak);

      if (!res.ok || !json.success) {
        stopTimer(); setRunning(false);
        setAgentStatus({ research: 'error', creator: 'idle', publisher: 'idle' });
        setCurrentAgent(null);
        pushLog(`Error: ${json.error || 'Generation failed'}`, 'error');
        setError(json.error || 'Generation failed. Please try again.');
        return;
      }

      const dur = json.meta?.agent_durations || {};
      pushLog(`✓ Research complete (${((dur.research || 0) / 1000).toFixed(1)}s)`, 'success');
      setAgentStatus({ research: 'done', creator: 'running', publisher: 'idle' });
      setCurrentAgent('creator');
      startAgentLogs('creator', 100);

      await new Promise(r => setTimeout(r, 400));
      clearLogTimers();
      pushLog(`✓ Script complete — ${json.creator?.word_count || 0} words, ${json.creator?.scenes?.length || 0} scenes`, 'success');
      if (json.creator?.opening_style_used) pushLog(`Opening style: ${json.creator?.opening_style_label || json.creator?.opening_style_used}`, 'agent');
      setAgentStatus({ research: 'done', creator: 'done', publisher: 'running' });
      setCurrentAgent('publisher');
      startAgentLogs('publisher', 100);

      await new Promise(r => setTimeout(r, 400));
      clearLogTimers();
      pushLog(`✓ Distribution pack complete`, 'success');
      setAgentStatus({ research: 'done', creator: 'done', publisher: 'done' });
      setCurrentAgent(null);
      pushLog(`Pipeline finished in ${((json.meta?.total_duration_ms || 0) / 1000).toFixed(1)}s`, 'system');
      stopTimer();

      await new Promise(r => setTimeout(r, 600));
      sessionStorage.setItem('studioai_result', JSON.stringify(json));
      router.push('/results');
    } catch (err) {
      clearLogTimers();
      stopTimer(); setRunning(false); setCurrentAgent(null);
      pushLog(`Network error: ${err.message}`, 'error');
      setError('Network error. Check your connection and try again.');
    }
  }

  // ── Loading screen ───────────────────────────────────────────────────────────
  if (pageLoading) return (
    <div style={{ minHeight: '100vh', background: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Spinner size={24} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  const planLabel = usage?.plan === 'free'
    ? `Free · ${usage?.remaining ?? 0} of ${usage?.limit} remaining`
    : `${usage?.plan?.charAt(0).toUpperCase() + usage?.plan?.slice(1)} · Unlimited`;

  const selectedBlogType = BLOG_TYPES.find(b => b.value === blogType);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;800&family=DM+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse-ring { 0%,100% { opacity:1; } 50% { opacity:0.4; } }
        @keyframes fadeIn { from { opacity:0; transform:translateY(6px); } to { opacity:1; transform:translateY(0); } }
        @keyframes slideIn { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } }
        
        body { background: #FFFFFF; }
        ::-webkit-scrollbar { width: 4px; height: 4px; }
        ::-webkit-scrollbar-track { background: #F5F5F5; }
        ::-webkit-scrollbar-thumb { background: #D0D0D0; border-radius: 4px; }

        .gen-root { min-height:100vh; background:#FFFFFF; font-family:'DM Sans',sans-serif; color:#0A0A0A; display:flex; flex-direction:column; }
        .gen-topbar { height:60px; border-bottom:1px solid #E8E8E8; display:flex; align-items:center; justify-content:space-between; padding:0 32px; background:#FFFFFF; position:sticky; top:0; z-index:100; }
        .gen-topbar-left { display:flex; align-items:center; gap:10px; }
        .gen-logo-box { width:30px; height:30px; background:#0A0A0A; border-radius:7px; display:flex; align-items:center; justify-content:center; }
        .gen-brand { font-family:'Playfair Display',serif; font-size:16px; font-weight:700; color:#0A0A0A; letter-spacing:-0.02em; }
        .gen-topbar-right { display:flex; align-items:center; gap:16px; }
        .gen-plan-chip { font-family:'JetBrains Mono',monospace; font-size:11px; color:#8C8C8C; background:#F5F5F5; border:1px solid #E8E8E8; border-radius:100px; padding:4px 12px; }
        .gen-body { display:flex; flex:1; min-height:0; }
        
        /* Sidebar */
        .gen-rail { width:280px; flex-shrink:0; border-right:1px solid #E8E8E8; background:#FAFAFA; padding:28px 24px; display:flex; flex-direction:column; gap:28px; overflow-y:auto; }
        .gen-rail-label { font-size:10px; font-weight:700; color:#000000; text-transform:uppercase; letter-spacing:0.1em; margin:0; }
        .gen-agents { display:flex; flex-direction:column; gap:0; }
        .gen-agent-row { display:flex; align-items:flex-start; gap:14px; padding-bottom:24px; position:relative; }
        .gen-agent-connector { position:absolute; left:15px; top:38px; width:1px; height:calc(100% - 14px); background:#E8E8E8; transition:background 0.4s; }
        .gen-agent-connector.done { background:#0A0A0A; }
        .gen-agent-badge { width:32px; height:32px; border-radius:8px; border:1.5px solid #E8E8E8; background:#FFFFFF; display:flex; align-items:center; justify-content:center; font-family:'JetBrains Mono',monospace; font-size:11px; font-weight:500; color:#BCBCBC; flex-shrink:0; transition:all 0.3s; position:relative; z-index:1; }
        .gen-agent-badge.running { border-color:#C9A227; background:#FFF9EB; color:#C9A227; }
        .gen-agent-badge.done { border-color:#0E7C4A; background:#F0FDF4; color:#0E7C4A; font-size:13px; }
        .gen-agent-badge.error { border-color:#DC2626; background:#FEF2F2; color:#DC2626; }
        .gen-agent-pulse { width:8px; height:8px; border-radius:50%; background:#C9A227; animation:pulse-ring 1.2s ease-in-out infinite; }
        .gen-agent-meta { flex:1; padding-top:5px; }
        .gen-agent-name { font-size:13px; font-weight:600; color:#0A0A0A; margin-bottom:2px; transition:color 0.3s; }
        .gen-agent-name.running { color:#C9A227; }
        .gen-agent-name.done { color:#0E7C4A; }
        .gen-agent-desc { font-size:11px; color:#BCBCBC; line-height:1.5; }
        
        /* Terminal */
        .gen-terminal { border:1px solid #E5E7EB; border-radius:12px; overflow:hidden; background:#FFFFFF; }
        .gen-term-header { display:flex; align-items:center; gap:10px; padding:12px 16px; border-bottom:1px solid #F1F5F9; background:#FAFAFA; }
        .gen-term-dot { width:8px; height:8px; border-radius:50%; background:#D1D5DB; }
        .gen-term-dot.active { background:#22C55E; box-shadow:0 0 8px rgba(34,197,94,0.6); }
        .gen-term-label { font-family:'JetBrains Mono',monospace; font-size:11px; color:#111827; font-weight:500; }
        .gen-term-timer { margin-left:auto; font-family:'JetBrains Mono',monospace; font-size:11px; color:#2563EB; font-weight:600; }
        .gen-term-body { padding:14px; min-height:120px; max-height:200px; overflow-y:auto; display:flex; flex-direction:column; gap:5px; }
        .gen-log-line { display:flex; gap:10px; font-family:'JetBrains Mono',monospace; font-size:11px; line-height:1.6; padding:4px 6px; border-radius:4px; }
        .gen-log-ts { color:#9CA3AF; min-width:60px; }
        .gen-log-info { color:#111827; }
        .gen-log-success { color:#16A34A; font-weight:500; }
        .gen-log-error { color:#DC2626; font-weight:500; }
        .gen-log-agent { color:#2563EB; font-weight:500; }
        .gen-log-system { color:#6B7280; }
        
        /* Main */
        .gen-main { flex:1; overflow-y:auto; display:flex; justify-content:center; padding:40px 40px 100px; }
        .gen-main-inner { width:100%; max-width:580px; }
        
        /* Form elements */
        .gen-label { font-size:11px; font-weight:700; color:#0A0A0A; text-transform:uppercase; letter-spacing:0.06em; display:block; margin-bottom:6px; }
        .gen-label-opt { font-size:10px; color:#BCBCBC; font-weight:400; text-transform:none; letterSpacing:0; margin-left:5px; }
        .gen-input { padding:12px 15px; background:#FFFFFF; border:1.5px solid #E8E8E8; border-radius:10px; font-family:'DM Sans',sans-serif; font-size:14px; color:#0A0A0A; outline:none; transition:border-color 0.2s,box-shadow 0.2s; width:100%; }
        .gen-input::placeholder { color:#BCBCBC; }
        .gen-input:focus { border-color:#0A0A0A; box-shadow:0 0 0 3px rgba(10,10,10,0.05); }
        .gen-select { padding:12px 38px 12px 15px; background:#FFFFFF; border:1.5px solid #E8E8E8; border-radius:10px; font-family:'DM Sans',sans-serif; font-size:14px; color:#0A0A0A; outline:none; cursor:pointer; width:100%; appearance:none; background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%238C8C8C' strokeWidth='1.5' fill='none' strokeLinecap='round'/%3E%3C/svg%3E"); background-repeat:no-repeat; background-position:right 14px center; transition:border-color 0.2s; }
        .gen-select:focus { border-color:#0A0A0A; outline:none; }
        .gen-grid2 { display:grid; grid-template-columns:1fr 1fr; gap:14px; }
        
        /* Mode toggle */
        .gen-mode-toggle { display:flex; gap:8px; }
        .gen-mode-btn { flex:1; padding:12px 8px; border:1.5px solid #E8E8E8; border-radius:10px; font-family:'DM Sans',sans-serif; font-size:12px; font-weight:600; cursor:pointer; transition:all 0.2s; background:#FFFFFF; color:#8C8C8C; display:flex; flex-direction:column; align-items:center; gap:4px; min-height:68px; }
        .gen-mode-btn .mode-emoji { font-size:20px; line-height:1; }
        .gen-mode-btn.active { border-color:#0A0A0A; color:#0A0A0A; background:#F8F8F8; }
        .gen-mode-btn.active-blogger { border-color:#D97706; color:#D97706; background:#FFFBEB; }
        
        /* Blog type grid */
        .blog-type-grid { display:grid; grid-template-columns:repeat(2, 1fr); gap:8px; animation:fadeIn 0.2s ease; }
        .blog-type-btn { padding:12px 13px; border:1.5px solid #E8E8E8; border-radius:10px; background:#FFFFFF; cursor:pointer; transition:all 0.2s; text-align:left; }
        .blog-type-btn.active { border-width:2px; background:#FAFAFA; }
        .blog-type-btn:hover:not(.active) { border-color:#D8D8D8; background:#FAFAFA; }
        .blog-type-label { font-size:12px; font-weight:700; color:#0A0A0A; display:block; marginBottom:2px; }
        .blog-type-btn.active .blog-type-label { color:var(--blog-color); }
        .blog-type-desc { font-size:10px; color:#8C8C8C; display:block; line-height:1.4; }
        
        /* Opening style selector */
        .opening-style-grid { display:flex; flex-direction:column; gap:5px; animation:slideIn 0.2s ease; }
        .opening-style-item { display:flex; align-items:flex-start; gap:10px; padding:10px 12px; border:1.5px solid #E8E8E8; border-radius:8px; cursor:pointer; transition:all 0.15s; }
        .opening-style-item:hover { border-color:#D8D8D8; background:#FAFAFA; }
        .opening-style-item.active { border-color:#0A0A0A; background:#F8F8F8; }
        .opening-style-item input { margin-top:2px; flex-shrink:0; accent-color:#0A0A0A; }
        .opening-style-name { font-size:12px; font-weight:600; color:#0A0A0A; display:block; }
        .opening-style-desc { font-size:11px; color:#8C8C8C; display:block; }
        
        /* Media analysis badge */
        .media-analysis-badge { background:#F0FDF4; border:1px solid #86EFAC; border-radius:10px; padding:12px 14px; animation:fadeIn 0.3s ease; }
        .media-analysis-title { font-size:11px; font-weight:700; color:#0E7C4A; text-transform:uppercase; letter-spacing:0.06em; marginBottom:6px; fontFamily:'JetBrains Mono',monospace; }
        .media-analysis-text { font-size:12px; color:#166534; line-height:1.6; }
        
        /* Section divider */
        .gen-section-div { display:flex; align-items:center; gap:10px; padding:4px 0; }
        .gen-section-div-line { flex:1; height:1px; background:#F0F0F0; }
        .gen-section-div-label { font-size:9px; font-weight:700; color:#BCBCBC; text-transform:uppercase; letter-spacing:0.08em; font-family:'JetBrains Mono',monospace; white-space:nowrap; }
        
        /* Submit button */
        .gen-submit { background:#0A0A0A; border:none; border-radius:10px; padding:15px 24px; font-family:'DM Sans',sans-serif; font-size:15px; font-weight:700; color:#FFFFFF; cursor:pointer; display:flex; align-items:center; justify-content:center; gap:10px; width:100%; transition:all 0.2s; letter-spacing:-0.01em; margin-top:4px; }
        .gen-submit.blogger-submit { background:linear-gradient(135deg, #D97706, #B45309); }
        .gen-submit:hover:not(:disabled) { transform:translateY(-1px); box-shadow:0 8px 24px rgba(10,10,10,0.18); }
        .gen-submit.blogger-submit:hover:not(:disabled) { box-shadow:0 8px 24px rgba(217,119,6,0.3); }
        .gen-submit:disabled { opacity:0.45; cursor:not-allowed; }
        
        .gen-error { background:#FEF2F2; border:1px solid #FCA5A5; border-radius:8px; padding:11px 14px; font-size:13px; color:#DC2626; display:flex; gap:8px; align-items:flex-start; line-height:1.5; }
        .gen-hint { font-size:12px; color:#8C8C8C; line-height:1.5; margin-top:4px; }
        .gen-usage-note { text-align:center; font-size:12px; color:#BCBCBC; margin-top:4px; }
        
        @media (max-width:768px) { .gen-rail { display:none; } .gen-main { padding:28px 16px 80px; } .blog-type-grid { grid-template-columns:1fr; } }
      `}</style>

      <div className="gen-root">
        {/* Topbar */}
        <header className="gen-topbar">
          <div className="gen-topbar-left">
            <div className="gen-logo-box">
              <svg width="14" height="14" viewBox="0 0 20 20" fill="none">
                <polygon points="10,2 17,6 17,14 10,18 3,14 3,6" stroke="#FFFFFF" strokeWidth="1.4" fill="none"/>
                <polygon points="10,6 14,8.5 14,13.5 10,16 6,13.5 6,8.5" fill="#FFFFFF" fillOpacity="0.3"/>
              </svg>
            </div>
            <span className="gen-brand">Studio AI</span>
            <span style={{ color: '#E8E8E8', fontSize: 16, margin: '0 2px' }}>/</span>
            <span style={{ fontSize: 14, color: '#8C8C8C', fontWeight: 500 }}>Generate</span>
          </div>
          <div className="gen-topbar-right">
            <span className="gen-plan-chip">{planLabel}</span>
            {streak > 0 && (
              <div style={{ display:'flex', alignItems:'center', gap:5, background:'#FFF7ED', border:'1px solid #FED7AA', borderRadius:100, padding:'4px 12px', fontSize:12, fontWeight:600, color:'#C2410C' }}>
                🔥 {streak}-day streak
              </div>
            )}
            <button onClick={() => router.push('/dashboard')} style={{ background:'none', border:'none', fontSize:13, color:'#8C8C8C', cursor:'pointer', fontFamily:"'DM Sans',sans-serif", fontWeight:500 }}>Dashboard</button>
            <button onClick={async () => { await supabase.auth.signOut(); router.push('/login'); }} style={{ background:'transparent', border:'1px solid #E8E8E8', borderRadius:6, padding:'6px 12px', color:'#5C5C5C', fontSize:12, cursor:'pointer', fontFamily:"'DM Sans',sans-serif" }}>Sign out</button>
          </div>
        </header>

        <div className="gen-body">
          {/* Sidebar */}
          <aside className="gen-rail">
            <p className="gen-rail-label">Pipeline Status</p>
            <div className="gen-agents">
              {AGENTS.map((a, i) => {
                const st = agentStatus[a.id] || 'idle';
                return (
                  <div className="gen-agent-row" key={a.id}>
                    {i < 2 && <div className={`gen-agent-connector ${st === 'done' ? 'done' : ''}`} />}
                    <div className={`gen-agent-badge ${st}`}>
                      {st === 'running' ? <div className="gen-agent-pulse" />
                        : st === 'done'   ? '✓'
                        : st === 'error'  ? '✕'
                        : a.num}
                    </div>
                    <div className="gen-agent-meta">
                      <div className={`gen-agent-name ${st}`}>{a.label}</div>
                      <div className="gen-agent-desc">{a.desc}</div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Terminal */}
            <div className="gen-terminal">
              <div className="gen-term-header">
                <div className={`gen-term-dot ${running ? 'active' : ''}`} />
                <span className="gen-term-label">{currentAgent ? `${currentAgent} agent` : 'stdout'}</span>
                {running && <span className="gen-term-timer">{(elapsed / 1000).toFixed(1)}s</span>}
              </div>
              <div className="gen-term-body" ref={logsRef}>
                {logs.length === 0
                  ? <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:12, color:'#6B7280' }}>Waiting for pipeline…</span>
                  : logs.map((l, i) => (
                    <div className="gen-log-line" key={i}>
                      <span className="gen-log-ts">{l.t}</span>
                      <span className={`gen-log-${l.type || 'info'}`}>{l.msg}</span>
                    </div>
                  ))
                }
              </div>
            </div>

            {/* Blogger tips */}
            {isVlogger && (
              <div style={{ background:'#FFFBEB', border:'1px solid #FDE68A', borderRadius:10, padding:'12px 14px' }}>
                <p style={{ fontSize:10, fontWeight:700, color:'#D97706', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:8, fontFamily:"'JetBrains Mono',monospace" }}>Blogger Tips</p>
                <ul style={{ listStyle:'none', display:'flex', flexDirection:'column', gap:5 }}>
                  {[
                    '📸 Upload a pic or clip for richer scripts',
                    '📍 Location = more specific content',
                    '🎭 Try "Slice of Life" opening style',
                    '🎬 Record 15s of ambient footage first',
                  ].map((tip, i) => (
                    <li key={i} style={{ fontSize:11, color:'#92400E', lineHeight:1.5, fontFamily:"'DM Sans',sans-serif" }}>{tip}</li>
                  ))}
                </ul>
              </div>
            )}
          </aside>

          {/* Main Form */}
          <main className="gen-main">
            <div className="gen-main-inner">
              {/* Header */}
              <div style={{ marginBottom: 32 }}>
                <div style={{ fontSize:10, color:'#8C8C8C', textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:10, display:'flex', alignItems:'center', gap:8, fontFamily:"'JetBrains Mono',monospace" }}>
                  <span style={{ width:20, height:1, background:'#C9A227', display:'inline-block' }}/>
                  Content Generation
                </div>
                <h1 style={{ fontFamily:"'Playfair Display',serif", fontSize:28, fontWeight:800, color:'#0A0A0A', letterSpacing:'-0.03em', lineHeight:1.2, marginBottom:8 }}>
                  {isVlogger ? 'Generate your vlog script' : 'Generate your content pack'}
                </h1>
                <p style={{ fontSize:14, color:'#5C5C5C', lineHeight:1.65 }}>
                  {isVlogger
                    ? 'Upload a photo or clip, pick your opening style, and get a complete script with filming guide.'
                    : 'Three AI agents — Research, Creator, Publisher — personalised to your niche in under 90 seconds.'}
                </p>
              </div>

              {/* DNA badge */}
              {dna && (
                <div style={{ display:'flex', alignItems:'center', gap:8, padding:'9px 13px', background: isVlogger ? '#FFFBEB' : '#F0FDF4', border:`1px solid ${isVlogger ? '#FED7AA' : '#86EFAC'}`, borderRadius:9, marginBottom:20, fontSize:12, color: isVlogger ? '#92400E' : '#15803D' }}>
                  <span style={{ fontSize:16 }}>{isVlogger ? '🎒' : '🧬'}</span>
                  <span>{isVlogger ? 'Blogger mode — camera direction, filming tips, and scene-by-scene guide included' : 'Creator DNA loaded — outputs personalised to your niche and style'}</span>
                </div>
              )}

              <form style={{ display:'flex', flexDirection:'column', gap:20 }} onSubmit={handleGenerate}>

                {/* ── Niche ── */}
                <div>
                  <label className="gen-label">
                    {isVlogger ? 'Niche / Topic' : 'Niche'} <span style={{ color:'#DC2626' }}>*</span>
                  </label>
                  <input
                    className="gen-input"
                    type="text"
                    placeholder={isVlogger
                      ? 'e.g. Street food Chennai, Hampi ruins, Brinda Bakery Ooty, Sunburn Goa…'
                      : 'e.g. personal finance for Indian millennials, AI tools for SaaS founders…'}
                    value={niche}
                    onChange={e => setNiche(e.target.value)}
                    disabled={running}
                    required
                    minLength={2}
                  />
                  {!isVlogger && <p className="gen-hint">Specific beats generic. The more precise, the stronger the output.</p>}
                </div>

                {/* ── Creator Mode ── */}
                <div>
                  <label className="gen-label">Creator Mode</label>
                  <div className="gen-mode-toggle">
                    <button type="button" className={`gen-mode-btn ${creatorMode === 'faceless' ? 'active' : ''}`} onClick={() => { setCreatorMode('faceless'); setCreatorType('general'); }} disabled={running}>
                      <span className="mode-emoji">🎬</span>Faceless
                    </button>
                    <button type="button" className={`gen-mode-btn ${creatorMode === 'face' ? 'active' : ''}`} onClick={() => { setCreatorMode('face'); setCreatorType('general'); }} disabled={running}>
                      <span className="mode-emoji">🎥</span>On Camera
                    </button>
                    <button type="button" className={`gen-mode-btn ${isVlogger ? 'active-blogger' : ''}`} onClick={() => { setCreatorMode('blogger'); setCreatorType('blogger'); }} disabled={running}>
                      <span className="mode-emoji">🎒</span>Blogger
                    </button>
                  </div>
                  {!isVlogger && (
                    <p className="gen-hint" style={{ marginTop: 8 }}>
                      {creatorMode === 'faceless' ? 'B-roll search terms, text-on-screen cues, voiceover direction.' : 'On-camera direction, body language cues, energy notes.'}
                    </p>
                  )}
                </div>

                {/* ── BLOGGER-SPECIFIC FIELDS ── */}
                {isVlogger && (
                  <>
                    {/* Blog Type */}
                    <div>
                      <label className="gen-label">Blog Type <span style={{ color:'#DC2626' }}>*</span></label>
                      <div className="blog-type-grid">
                        {BLOG_TYPES.map(bt => (
                          <button
                            key={bt.value}
                            type="button"
                            className={`blog-type-btn ${blogType === bt.value ? 'active' : ''}`}
                            style={{ '--blog-color': bt.color, borderColor: blogType === bt.value ? bt.color : '#E8E8E8' }}
                            onClick={() => setBlogType(bt.value)}
                            disabled={running}
                          >
                            <span className="blog-type-label">{bt.label}</span>
                            <span className="blog-type-desc">{bt.desc}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Location */}
                    <div>
                      <label className="gen-label">Location <span className="gen-label-opt">(optional but recommended)</span></label>
                      <input
                        className="gen-input"
                        type="text"
                        placeholder="e.g. Hampi, Karnataka · MTR Restaurant, Bangalore · Sunburn Festival, Goa"
                        value={location}
                        onChange={e => setLocation(e.target.value)}
                        disabled={running}
                      />
                      {location.trim() && (
                        <div style={{ display:'inline-flex', alignItems:'center', gap:5, marginTop:6, padding:'4px 10px', background:'#FFFBEB', border:'1px solid #FED7AA', borderRadius:6, fontSize:11, fontWeight:600, color:'#D97706', fontFamily:"'JetBrains Mono',monospace" }}>
                          📍 {location.trim()}
                        </div>
                      )}
                      <p className="gen-hint">Adding a location makes scripts dramatically more specific and authentic.</p>
                    </div>

                    {/* Media Upload */}
                    <div>
                      <label className="gen-label">
                        Photos / Video Clip <span className="gen-label-opt">(optional — AI analyses and uses in script)</span>
                      </label>
                      <MediaUploader onMediaChange={handleMediaChange} disabled={running} />

                      {/* Analysing indicator */}
                      {analysingMedia && (
                        <div style={{ display:'flex', alignItems:'center', gap:10, marginTop:10, padding:'10px 14px', background:'#F8F8F8', borderRadius:8 }}>
                          <Spinner size={14} />
                          <span style={{ fontSize:12, color:'#8C8C8C', fontFamily:"'DM Sans',sans-serif" }}>Analysing your media with AI…</span>
                        </div>
                      )}

                      {/* Media analysis result */}
                      {mediaAnalysis && !analysingMedia && (
                        <div className="media-analysis-badge" style={{ marginTop:10 }}>
                          <p className="media-analysis-title">✓ Visual context ready</p>
                          <p className="media-analysis-text">
                            {mediaAnalysis.type === 'image'
                              ? `${mediaAnalysis.count} image${mediaAnalysis.count > 1 ? 's' : ''} analysed. ${mediaAnalysis.description?.slice(0, 120)}…`
                              : `Video clip analysed. ${mediaAnalysis.description?.slice(0, 120)}…`}
                          </p>
                          {mediaAnalysis.mood && (
                            <p style={{ fontSize:11, color:'#166534', marginTop:4, fontFamily:"'JetBrains Mono',monospace" }}>
                              Mood: {mediaAnalysis.mood}
                            </p>
                          )}
                        </div>
                      )}

                      {/* Media error */}
                      {mediaError && (
                        <div style={{ marginTop:10, padding:'8px 12px', background:'#FFF7ED', border:'1px solid #FED7AA', borderRadius:8, fontSize:11, color:'#92400E' }}>
                          ⚠ {mediaError}
                        </div>
                      )}
                    </div>

                    {/* Opening Style */}
                    <div>
                      <label className="gen-label">Opening Style</label>
                      <p className="gen-hint" style={{ marginBottom:10 }}>How should your video/post open? No hype intros — pick a natural style that fits your content.</p>
                      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:6 }}>
                        {OPENING_STYLES.map(style => (
                          <button
                            key={style.value}
                            type="button"
                            onClick={() => setOpeningStyle(style.value)}
                            disabled={running}
                            style={{
                              padding:'10px 12px',
                              border:`1.5px solid ${openingStyle === style.value ? '#0A0A0A' : '#E8E8E8'}`,
                              borderRadius:9,
                              background: openingStyle === style.value ? '#F8F8F8' : '#FFFFFF',
                              cursor:'pointer',
                              textAlign:'left',
                              transition:'all 0.15s',
                            }}
                          >
                            <span style={{ display:'block', fontSize:12, fontWeight:700, color: openingStyle === style.value ? '#0A0A0A' : '#5C5C5C', marginBottom:2, fontFamily:"'DM Sans',sans-serif" }}>
                              {style.label}
                            </span>
                            <span style={{ display:'block', fontSize:10, color:'#8C8C8C', lineHeight:1.4, fontFamily:"'DM Sans',sans-serif" }}>
                              {style.desc}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Custom Opening Note */}
                    {openingStyle !== 'auto' && (
                      <div style={{ animation:'slideIn 0.2s ease' }}>
                        <label className="gen-label">Custom Opening Note <span className="gen-label-opt">(optional)</span></label>
                        <textarea
                          className="gen-input"
                          rows={2}
                          style={{ resize:'vertical' }}
                          placeholder={`e.g. "Start with me tasting the first dish, no context" or "Reference the 'single biryani' meme before starting"`}
                          value={customOpeningNote}
                          onChange={e => setCustomOpeningNote(e.target.value)}
                          disabled={running}
                        />
                      </div>
                    )}
                  </>
                )}

                {/* ── Common Preferences ── */}
                <div className="gen-section-div">
                  <div className="gen-section-div-line"/>
                  <span className="gen-section-div-label">Preferences</span>
                  <div className="gen-section-div-line"/>
                </div>

                <div className="gen-grid2">
                  <div>
                    <label className="gen-label">Platform</label>
                    <select className="gen-select" value={platform} onChange={e => setPlatform(e.target.value)} disabled={running}>
                      {PLATFORMS.map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="gen-label">Language</label>
                    <select className="gen-select" value={language} onChange={e => setLanguage(e.target.value)} disabled={running}>
                      {LANGUAGES.map(l => <option key={l} value={l}>{l}</option>)}
                    </select>
                  </div>
                </div>

                <div className="gen-grid2">
                  <div>
                    <label className="gen-label">Tone</label>
                    <select className="gen-select" value={tone} onChange={e => setTone(e.target.value)} disabled={running}>
                      {TONES.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                  {!isVlogger && (
                    <div>
                      <label className="gen-label">Creator Type</label>
                      <select className="gen-select" value={creatorType} onChange={e => setCreatorType(e.target.value)} disabled={running}>
                        {CREATORTYPES.map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
                      </select>
                    </div>
                  )}
                </div>

                {/* Error */}
                {error && (
                  <div className="gen-error">⚠ {error}</div>
                )}

                {/* Limit warning */}
                {usage?.plan === 'free' && (usage?.remaining ?? 1) === 0 && !error && (
                  <div style={{ background:'#FFF7ED', border:'1px solid #FED7AA', borderRadius:8, padding:'11px 14px', fontSize:13, color:'#C2410C', display:'flex', gap:8, alignItems:'center' }}>
                    ⚠ Monthly limit reached.{' '}
                    <a href="/dashboard" style={{ color:'#C9A227', textDecoration:'underline', fontWeight:600 }}>Upgrade your plan</a>
                  </div>
                )}

                {/* Submit */}
                <button
                  type="submit"
                  className={`gen-submit ${isVlogger ? 'blogger-submit' : ''}`}
                  disabled={running || (!usage?.allowed && usage !== null) || analysingMedia}
                >
                  {running
                    ? <><Spinner size={15} light />Pipeline running…</>
                    : analysingMedia
                    ? <><Spinner size={15} light />Analysing media…</>
                    : isVlogger
                    ? <>🎒 Generate Vlog Script →</>
                    : <>Run All 3 Agents →</>
                  }
                </button>

                {usage?.plan === 'free' && (
                  <p className="gen-usage-note">
                    {usage.remaining ?? 0} of {usage.limit} free generations remaining this month
                  </p>
                )}
              </form>
            </div>
          </main>
        </div>
      </div>
    </>
  );
}