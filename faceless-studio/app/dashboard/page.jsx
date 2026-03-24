'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getSupabaseBrowser } from '@/lib/supabase-browser';

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

      const [usageRes, historyRes] = await Promise.all([
        fetch('/api/usage', { headers: { Authorization: `Bearer ${session.access_token}` } }),
        // History: read from Supabase directly via browser client
        supabase.from('generations')
          .select('id, niche, platform, creator_type, chosen_topic, chosen_hook, generated_at')
          .order('generated_at', { ascending: false })
          .limit(20),
      ]);

      const usageJson = await usageRes.json();
      if (usageJson.success) setUsage(usageJson.usage);
      if (!historyRes.error) setHistory(historyRes.data || []);
      setLoading(false);
    });
  }, []);

  if (loading) return (
    <div style={styles.splash}>
      <div style={styles.spinner} />
    </div>
  );

  return (
    <div style={styles.page}>
      <div style={{...styles.blob, top:'-10%', left:'-5%', background:'radial-gradient(circle, rgba(233,161,0,0.07) 0%, transparent 60%)'}} />

      {/* Nav */}
      <nav style={styles.nav}>
        <div style={styles.navLogo}>
          <span style={{color:'var(--gold)',fontSize:'20px'}}>⬡</span>
          <span style={styles.navLogoText}>Studio AI</span>
        </div>
        <div style={styles.navRight}>
          <button style={styles.genBtn} onClick={() => router.push('/generate')}>+ Generate</button>
          <button style={styles.navBtn} onClick={async () => { await supabase.auth.signOut(); router.push('/login'); }}>Sign out</button>
        </div>
      </nav>

      <div style={styles.container}>
        {/* Header */}
        <div style={styles.header}>
          <h1 style={styles.h1}>Dashboard</h1>
          <p style={styles.subtext}>{user?.email}</p>
        </div>

        {/* Stats */}
        <div style={styles.statsGrid}>
          <div style={styles.statCard}>
            <p style={styles.statVal}>{usage?.plan?.toUpperCase() || 'FREE'}</p>
            <p style={styles.statLabel}>Current Plan</p>
          </div>
          <div style={styles.statCard}>
            <p style={styles.statVal}>{usage?.used || 0}</p>
            <p style={styles.statLabel}>This Month</p>
          </div>
          <div style={{...styles.statCard, borderColor: usage?.plan === 'free' ? 'rgba(233,161,0,0.2)' : 'rgba(0,220,130,0.2)'}}>
            <p style={{...styles.statVal, color: usage?.remaining === 0 ? '#ff6b6b' : 'var(--gold)'}}>
              {usage?.plan === 'free' ? `${usage?.remaining ?? 0} / ${usage?.limit}` : '∞'}
            </p>
            <p style={styles.statLabel}>Remaining</p>
          </div>
          <div style={styles.statCard}>
            <p style={styles.statVal}>{history.length}</p>
            <p style={styles.statLabel}>Total Generations</p>
          </div>
        </div>

        {/* Reset date */}
        {usage?.reset_date && (
          <p style={styles.resetNote}>
            Free plan resets {new Date(usage.reset_date).toLocaleDateString('en-IN', { day:'numeric', month:'long', year:'numeric' })}
          </p>
        )}

        {/* History */}
        <div style={styles.historySection}>
          <div style={styles.historyHeader}>
            <h2 style={styles.h2}>Recent Generations</h2>
            {history.length > 0 && <span style={styles.historyCount}>{history.length} items</span>}
          </div>

          {history.length === 0 ? (
            <div style={styles.emptyState}>
              <p style={styles.emptyIcon}>⬡</p>
              <p style={styles.emptyTitle}>No generations yet</p>
              <p style={styles.emptyDesc}>Generate your first content pack to see it here.</p>
              <button style={styles.emptyBtn} onClick={() => router.push('/generate')}>
                Start Generating
              </button>
            </div>
          ) : (
            <div style={styles.historyList}>
              {history.map((gen) => (
                <div key={gen.id} style={styles.historyCard}>
                  <div style={styles.historyTop}>
                    <span style={styles.historyPlatform}>{gen.platform}</span>
                    <span style={styles.historyType}>{gen.creator_type}</span>
                    <span style={styles.historyDate}>
                      {new Date(gen.generated_at).toLocaleDateString('en-IN', { day:'numeric', month:'short', hour:'2-digit', minute:'2-digit' })}
                    </span>
                  </div>
                  <p style={styles.historyNiche}>{gen.niche}</p>
                  {gen.chosen_topic && <p style={styles.historyTopic}>{gen.chosen_topic}</p>}
                  {gen.chosen_hook && <p style={styles.historyHook}>"{gen.chosen_hook}"</p>}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const styles = {
  splash: { minHeight:'100vh', background:'var(--void)', display:'flex', alignItems:'center', justifyContent:'center' },
  spinner: { width:'36px', height:'36px', border:'3px solid rgba(233,161,0,0.2)', borderTopColor:'var(--gold)', borderRadius:'50%', animation:'spin 0.8s linear infinite' },
  page: { minHeight:'100vh', background:'var(--void)', fontFamily:'var(--FB)', position:'relative', overflow:'hidden' },
  blob: { position:'absolute', width:'600px', height:'600px', borderRadius:'50%', pointerEvents:'none' },
  nav: { display:'flex', alignItems:'center', justifyContent:'space-between', padding:'20px 40px', borderBottom:'1px solid rgba(238,242,255,0.07)', position:'relative', zIndex:10 },
  navLogo: { display:'flex', alignItems:'center', gap:'10px' },
  navLogoText: { fontFamily:'var(--FH)', fontSize:'18px', fontWeight:'700', color:'var(--white)', letterSpacing:'-0.02em' },
  navRight: { display:'flex', gap:'12px', alignItems:'center' },
  genBtn: { background:'linear-gradient(135deg, var(--gold) 0%, var(--gold-hi) 100%)', border:'none', borderRadius:'8px', padding:'9px 20px', color:'#000', fontSize:'13px', fontWeight:'700', fontFamily:'var(--FB)', cursor:'pointer' },
  navBtn: { background:'transparent', border:'1px solid rgba(238,242,255,0.15)', borderRadius:'8px', padding:'8px 16px', color:'var(--w5)', fontSize:'13px', cursor:'pointer', fontFamily:'var(--FB)' },

  container: { maxWidth:'820px', margin:'0 auto', padding:'48px 24px 80px', position:'relative', zIndex:1 },
  header: { marginBottom:'32px' },
  h1: { fontFamily:'var(--FH)', fontSize:'clamp(24px, 3vw, 32px)', fontWeight:'800', color:'var(--white)', margin:'0 0 6px', letterSpacing:'-0.03em' },
  subtext: { color:'var(--w3)', fontSize:'14px', margin:0 },
  h2: { fontFamily:'var(--FH)', fontSize:'18px', fontWeight:'700', color:'var(--white)', margin:0 },

  statsGrid: { display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(160px, 1fr))', gap:'12px', marginBottom:'12px' },
  statCard: { background:'rgba(238,242,255,0.04)', border:'1px solid rgba(238,242,255,0.08)', borderRadius:'14px', padding:'24px', textAlign:'center', transition:'border-color 0.2s' },
  statVal: { fontFamily:'var(--FH)', fontSize:'28px', fontWeight:'800', color:'var(--gold)', margin:'0 0 6px' },
  statLabel: { color:'var(--w3)', fontSize:'12px', margin:0, textTransform:'uppercase', letterSpacing:'0.05em' },

  resetNote: { color:'var(--w3)', fontSize:'12px', marginBottom:'40px', textAlign:'center' },

  historySection: { marginTop:'8px' },
  historyHeader: { display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'20px' },
  historyCount: { background:'rgba(238,242,255,0.08)', borderRadius:'20px', padding:'4px 12px', color:'var(--w5)', fontSize:'12px' },

  emptyState: { textAlign:'center', padding:'64px 20px', background:'rgba(238,242,255,0.02)', border:'1px dashed rgba(238,242,255,0.1)', borderRadius:'16px' },
  emptyIcon: { fontSize:'40px', marginBottom:'16px', color:'var(--gold)', opacity:0.5 },
  emptyTitle: { fontFamily:'var(--FH)', fontSize:'18px', color:'var(--w8)', margin:'0 0 8px' },
  emptyDesc: { color:'var(--w3)', fontSize:'14px', margin:'0 0 24px' },
  emptyBtn: { background:'linear-gradient(135deg, var(--gold) 0%, var(--gold-hi) 100%)', border:'none', borderRadius:'10px', padding:'12px 28px', color:'#000', fontSize:'14px', fontWeight:'700', fontFamily:'var(--FB)', cursor:'pointer' },

  historyList: { display:'flex', flexDirection:'column', gap:'12px' },
  historyCard: { background:'rgba(238,242,255,0.03)', border:'1px solid rgba(238,242,255,0.08)', borderRadius:'14px', padding:'20px', transition:'border-color 0.2s', cursor:'default' },
  historyTop: { display:'flex', gap:'10px', alignItems:'center', marginBottom:'10px', flexWrap:'wrap' },
  historyPlatform: { background:'rgba(12,170,220,0.1)', borderRadius:'6px', padding:'4px 10px', color:'var(--blue-hi)', fontSize:'11px', fontWeight:'700' },
  historyType: { background:'rgba(238,242,255,0.06)', borderRadius:'6px', padding:'4px 10px', color:'var(--w5)', fontSize:'11px' },
  historyDate: { color:'var(--w3)', fontSize:'11px', marginLeft:'auto', fontFamily:'var(--FM)' },
  historyNiche: { color:'var(--w8)', fontSize:'14px', fontWeight:'600', margin:'0 0 6px' },
  historyTopic: { color:'var(--gold)', fontSize:'13px', margin:'0 0 6px', lineHeight:'1.4' },
  historyHook: { color:'var(--w3)', fontSize:'12px', fontStyle:'italic', margin:0, lineHeight:'1.5', borderLeft:'2px solid rgba(233,161,0,0.3)', paddingLeft:'10px' },
};