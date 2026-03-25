'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getSupabaseBrowser } from '@/lib/supabase-browser';

// ── Color tokens ──────────────────────────────────────────────────────────────
const CA  = '#D4A847';
const C1  = '#EEEEF5';
const C2  = 'rgba(238,238,245,0.55)';
const C3  = 'rgba(238,238,245,0.28)';
const CB  = 'rgba(255,255,255,0.07)';
const BG  = '#07070E';

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
    <div style={{minHeight:'100vh',background:BG,display:'flex',alignItems:'center',justifyContent:'center'}}>
      <Spinner />
    </div>
  );

  const planLabel = usage?.plan?.toUpperCase() || 'FREE';
  const resetDate = usage?.reset_date
    ? new Date(usage.reset_date).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'})
    : null;

  return (
    <div style={D.root}>

      {/* ── Topbar ── */}
      <header style={D.topbar}>
        <div style={D.tbLeft}>
          <HexLogo />
          <span style={D.brand}>Studio AI</span>
        </div>
        <div style={D.tbRight}>
          <button style={D.ghost} onClick={() => router.push('/generate')}>+ Generate</button>
          <button style={D.btn} onClick={async () => { await supabase.auth.signOut(); router.push('/login'); }}>Sign out</button>
        </div>
      </header>

      <div style={D.container}>

        {/* ── Page title ── */}
        <div style={D.pageHead}>
          <div>
            <h1 style={D.h1}>Dashboard</h1>
            <p style={D.email}>{user?.email}</p>
          </div>
          <button style={D.genBtn} onClick={() => router.push('/generate')}>
            Generate content →
          </button>
        </div>

        {/* ── Stats band ── */}
        <div style={D.statsRow}>
          <StatCard label="Plan" value={planLabel} accent={usage?.plan !== 'free'} />
          <StatCard label="This month" value={String(usage?.used || 0)} />
          <StatCard
            label="Remaining"
            value={usage?.plan === 'free' ? `${usage?.remaining ?? 0} / ${usage?.limit}` : '∞'}
            warn={(usage?.remaining ?? 1) === 0 && usage?.plan === 'free'}
          />
          <StatCard label="All time" value={String(history.length)} />
        </div>

        {resetDate && usage?.plan === 'free' && (
          <p style={D.resetLine}>Free plan resets {resetDate}</p>
        )}

        {/* ── Upgrade banner (only when at limit) ── */}
        {usage?.plan === 'free' && (usage?.remaining ?? 1) === 0 && (
          <div style={D.upgradeBanner}>
            <div>
              <p style={D.upgradeTitle}>Monthly limit reached</p>
              <p style={D.upgradeSub}>Upgrade to Creator Pro for unlimited generations and all 13 AI agents.</p>
            </div>
            <button style={D.upgradeBtn}>Upgrade — ₹999/mo</button>
          </div>
        )}

        {/* ── History ── */}
        <div style={D.section}>
          <div style={D.sectionHead}>
            <span style={D.sectionTitle}>Recent Generations</span>
            {history.length > 0 && <span style={D.badge}>{history.length}</span>}
          </div>

          {history.length === 0 ? (
            <div style={D.empty}>
              <p style={D.emptyIcon}>⬡</p>
              <p style={D.emptyTitle}>No generations yet</p>
              <p style={D.emptySub}>Your content packs will appear here after your first generation.</p>
              <button style={D.emptyBtn} onClick={() => router.push('/generate')}>Start generating</button>
            </div>
          ) : (
            <div style={D.tableWrap}>
              {/* Header */}
              <div style={D.tableHead}>
                <span style={{...D.col, ...D.colNiche}}>Niche / Topic</span>
                <span style={{...D.col, ...D.colPlatform}}>Platform</span>
                <span style={{...D.col, ...D.colType}}>Type</span>
                <span style={{...D.col, ...D.colDate}}>Date</span>
              </div>
              {/* Rows */}
              <div style={D.tableBody}>
                {history.map((gen) => (
                  <div key={gen.id} style={D.tableRow}>
                    <div style={{...D.col, ...D.colNiche, flexDirection:'column', alignItems:'flex-start', gap:'4px'}}>
                      <span style={{fontSize:'13px',color:C1,fontWeight:'500',lineHeight:'1.4'}}>{gen.chosen_topic || gen.niche}</span>
                      {gen.chosen_hook && (
                        <span style={{fontSize:'12px',color:C3,fontStyle:'italic',lineHeight:'1.4',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',maxWidth:'100%'}}>
                          "{gen.chosen_hook}"
                        </span>
                      )}
                    </div>
                    <div style={{...D.col, ...D.colPlatform}}>
                      <span style={D.platTag}>{gen.platform}</span>
                    </div>
                    <div style={{...D.col, ...D.colType}}>
                      <span style={{fontSize:'12px',color:C3}}>{gen.creator_type}</span>
                    </div>
                    <div style={{...D.col, ...D.colDate}}>
                      <span style={{fontSize:'12px',color:C3,fontFamily:'var(--FM)',whiteSpace:'nowrap'}}>
                        {new Date(gen.generated_at).toLocaleDateString('en-IN',{day:'numeric',month:'short'})}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ── Plan info ── */}
        <div style={D.planSection}>
          <div style={D.planCard}>
            <div>
              <p style={D.planLabel}>Current Plan</p>
              <p style={D.planName}>{planLabel}</p>
            </div>
            {usage?.plan === 'free' && (
              <div style={{textAlign:'right'}}>
                <p style={{fontSize:'12px',color:C3,margin:'0 0 8px'}}>Unlock all 13 AI agents + unlimited generations</p>
                <button style={D.planUpgradeBtn}>View Plans →</button>
              </div>
            )}
          </div>

          <div style={D.featureGrid}>
            {[
              { label:'Research Agent',   included: true,  note:'Trend analysis & hooks'       },
              { label:'Creator Agent',    included: true,  note:'Full script & scene breakdown' },
              { label:'Publisher Agent',  included: true,  note:'SEO & social distribution'    },
              { label:'Trend Spy',        included: usage?.plan !== 'free', note:'Pro+' },
              { label:'Hook Upgrader',    included: usage?.plan !== 'free', note:'Pro+' },
              { label:'Script Localiser', included: usage?.plan === 'studio', note:'Studio only' },
            ].map(f => (
              <div key={f.label} style={D.featureRow}>
                <span style={{...D.featureDot, background: f.included ? '#3ECF8E' : CB}} />
                <span style={{fontSize:'13px',color: f.included ? C2 : C3}}>{f.label}</span>
                <span style={{fontSize:'11px',color:C3,marginLeft:'auto'}}>{f.note}</span>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}

// ── Components ────────────────────────────────────────────────────────────────
function StatCard({ label, value, accent, warn }) {
  return (
    <div style={{...D.statCard, borderColor: warn ? 'rgba(248,113,113,0.2)' : accent ? 'rgba(212,168,71,0.2)' : CB}}>
      <span style={{...D.statVal, color: warn ? '#F87171' : accent ? CA : CA}}>{value}</span>
      <span style={D.statLbl}>{label}</span>
    </div>
  );
}
function HexLogo() {
  return (
    <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
      <polygon points="10,2 17,6 17,14 10,18 3,14 3,6" stroke="#D4A847" strokeWidth="1.4" fill="none"/>
      <polygon points="10,6 14,8.5 14,13.5 10,16 6,13.5 6,8.5" fill="#D4A847" fillOpacity="0.12"/>
    </svg>
  );
}
function Spinner() {
  return <span style={{width:'22px',height:'22px',borderRadius:'50%',border:'2px solid rgba(255,255,255,0.06)',borderTopColor:CA,display:'block',animation:'spin 0.7s linear infinite'}} />;
}

// ── Styles ────────────────────────────────────────────────────────────────────
const D = {
  root:      { minHeight:'100vh',background:BG,fontFamily:'var(--FB)',color:C1 },
  topbar:    { display:'flex',alignItems:'center',justifyContent:'space-between',padding:'0 28px',height:'54px',borderBottom:`1px solid ${CB}`,position:'sticky',top:0,background:'rgba(7,7,14,0.93)',backdropFilter:'blur(12px)',zIndex:50 },
  tbLeft:    { display:'flex',alignItems:'center',gap:'10px' },
  brand:     { fontFamily:'var(--FH)',fontSize:'15px',fontWeight:'700',color:C1,letterSpacing:'-0.02em' },
  tbRight:   { display:'flex',gap:'12px',alignItems:'center' },
  ghost:     { background:'transparent',border:'none',color:C2,fontSize:'13px',cursor:'pointer',fontFamily:'var(--FB)',padding:'4px 0' },
  btn:       { background:'transparent',border:`1px solid ${CB}`,borderRadius:'6px',padding:'6px 14px',color:C2,fontSize:'13px',cursor:'pointer',fontFamily:'var(--FB)' },

  container: { maxWidth:'900px',margin:'0 auto',padding:'44px 28px 80px',display:'flex',flexDirection:'column',gap:'32px' },

  pageHead:  { display:'flex',alignItems:'flex-start',justifyContent:'space-between' },
  h1:        { fontFamily:'var(--FH)',fontSize:'24px',fontWeight:'800',color:C1,margin:'0 0 4px',letterSpacing:'-0.03em' },
  email:     { fontSize:'13px',color:C3,margin:0 },
  genBtn:    { background:CA,border:'none',borderRadius:'7px',padding:'10px 20px',color:'#000',fontSize:'13px',fontWeight:'700',fontFamily:'var(--FH)',cursor:'pointer',flexShrink:0 },

  statsRow:  { display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(160px,1fr))',gap:'10px' },
  statCard:  { border:'1px solid',borderRadius:'8px',padding:'18px 16px',textAlign:'center',background:'rgba(255,255,255,0.02)',transition:'border-color 0.2s' },
  statVal:   { display:'block',fontFamily:'var(--FH)',fontSize:'24px',fontWeight:'800',marginBottom:'4px' },
  statLbl:   { display:'block',fontSize:'11px',color:C3,textTransform:'uppercase',letterSpacing:'0.07em',fontWeight:'600' },

  resetLine: { fontSize:'12px',color:C3,margin:'-16px 0 0',textAlign:'center' },

  upgradeBanner:{ background:'rgba(212,168,71,0.06)',border:`1px solid rgba(212,168,71,0.2)`,borderRadius:'10px',padding:'20px 24px',display:'flex',alignItems:'center',justifyContent:'space-between',gap:'20px',flexWrap:'wrap' },
  upgradeTitle: { fontSize:'14px',fontWeight:'700',color:C1,margin:'0 0 4px' },
  upgradeSub:   { fontSize:'13px',color:C2,margin:0 },
  upgradeBtn:   { background:CA,border:'none',borderRadius:'7px',padding:'10px 20px',color:'#000',fontSize:'13px',fontWeight:'700',fontFamily:'var(--FH)',cursor:'pointer',flexShrink:0 },

  section:   { display:'flex',flexDirection:'column',gap:'0' },
  sectionHead:{ display:'flex',alignItems:'center',gap:'10px',marginBottom:'14px' },
  sectionTitle:{ fontSize:'13px',fontWeight:'700',color:C1,letterSpacing:'-0.01em' },
  badge:     { background:'rgba(255,255,255,0.06)',borderRadius:'20px',padding:'2px 9px',color:C3,fontSize:'11px',fontWeight:'600' },

  empty:     { border:`1px dashed rgba(255,255,255,0.08)`,borderRadius:'10px',padding:'56px 20px',textAlign:'center' },
  emptyIcon: { fontSize:'28px',color:CA,opacity:0.3,margin:'0 0 14px' },
  emptyTitle:{ fontFamily:'var(--FH)',fontSize:'16px',color:C2,margin:'0 0 6px' },
  emptySub:  { fontSize:'13px',color:C3,margin:'0 0 20px',lineHeight:'1.6' },
  emptyBtn:  { background:CA,border:'none',borderRadius:'7px',padding:'10px 22px',color:'#000',fontSize:'13px',fontWeight:'700',fontFamily:'var(--FH)',cursor:'pointer' },

  tableWrap: { border:`1px solid ${CB}`,borderRadius:'10px',overflow:'hidden' },
  tableHead: { display:'grid',gridTemplateColumns:'1fr 120px 100px 80px',padding:'10px 20px',borderBottom:`1px solid ${CB}`,background:'rgba(255,255,255,0.02)' },
  tableBody: { display:'flex',flexDirection:'column' },
  tableRow:  { display:'grid',gridTemplateColumns:'1fr 120px 100px 80px',padding:'13px 20px',borderBottom:`1px solid ${CB}`,transition:'background 0.15s' },
  col:       { display:'flex',alignItems:'center',paddingRight:'12px' },
  colNiche:  { gridColumn:'1',minWidth:0 },
  colPlatform:{ gridColumn:'2' },
  colType:   { gridColumn:'3' },
  colDate:   { gridColumn:'4' },
  platTag:   { background:'rgba(56,189,248,0.07)',border:'1px solid rgba(56,189,248,0.12)',borderRadius:'4px',padding:'3px 8px',color:'rgba(56,189,248,0.7)',fontSize:'11px',fontWeight:'600',whiteSpace:'nowrap' },

  planSection:{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:'16px' },
  planCard:  { border:`1px solid ${CB}`,borderRadius:'10px',padding:'20px',background:'rgba(255,255,255,0.02)',display:'flex',alignItems:'center',justifyContent:'space-between',gap:'16px' },
  planLabel: { fontSize:'11px',color:C3,textTransform:'uppercase',letterSpacing:'0.08em',fontWeight:'600',margin:'0 0 4px' },
  planName:  { fontFamily:'var(--FH)',fontSize:'20px',fontWeight:'800',color:CA,margin:0 },
  planUpgradeBtn:{ background:'transparent',border:`1px solid ${CB}`,borderRadius:'6px',padding:'7px 14px',color:C2,fontSize:'12px',cursor:'pointer',fontFamily:'var(--FB)' },
  featureGrid:{ border:`1px solid ${CB}`,borderRadius:'10px',padding:'6px 0',background:'rgba(255,255,255,0.02)' },
  featureRow:{ display:'flex',alignItems:'center',gap:'10px',padding:'10px 18px',borderBottom:`1px solid rgba(255,255,255,0.04)` },
  featureDot:{ width:'6px',height:'6px',borderRadius:'50%',flexShrink:0,transition:'background 0.3s' },
};