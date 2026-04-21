// Add this component to app/agents/page.jsx
// Shows "Live Data" vs "AI Knowledge" badge in agent results

// ─── RealDataBadge ─────────────────────────────────────────────────────────
export function RealDataBadge({ meta }) {
  if (!meta) return null;

  const isReal = meta.real_data_used;
  const count  = meta.videos_analysed || meta.videos_fetched || meta.competitors_analysed || null;

  if (isReal) {
    return (
      <div style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        padding: '4px 12px',
        background: '#D1FAE5',
        border: '1px solid #6EE7B7',
        borderRadius: 100,
        marginBottom: 14,
      }}>
        <span style={{
          width: 6, height: 6,
          borderRadius: '50%',
          background: '#059669',
          flexShrink: 0,
          animation: 'pulse 1.5s ease infinite',
        }} />
        <span style={{
          fontSize: 11,
          fontWeight: 700,
          color: '#059669',
          fontFamily: "'JetBrains Mono', monospace",
          textTransform: 'uppercase',
          letterSpacing: '0.06em',
        }}>
          Live Data{count ? ` — ${count} ${count === 1 ? 'item' : 'items'} analysed` : ''}
        </span>
      </div>
    );
  }

  return (
    <div style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 6,
      padding: '4px 12px',
      background: '#F3F4F6',
      border: '1px solid #E5E7EB',
      borderRadius: 100,
      marginBottom: 14,
    }}>
      <span style={{
        fontSize: 11,
        fontWeight: 700,
        color: '#9CA3AF',
        fontFamily: "'JetBrains Mono', monospace",
        textTransform: 'uppercase',
        letterSpacing: '0.06em',
      }}>
        AI Knowledge Base
      </span>
    </div>
  );
}

// ─── RealChannelStats ──────────────────────────────────────────────────────
// Display real fetched channel stats at top of competitor autopsy result
export function RealChannelStats({ data }) {
  const ch = data?._real_channel;
  if (!ch) return null;

  return (
    <div style={{
      background: '#0A0A0A',
      borderRadius: 12,
      padding: '16px 20px',
      marginBottom: 16,
      border: '1px solid rgba(255,255,255,0.07)',
    }}>
      <p style={{
        fontSize: 10,
        fontWeight: 700,
        color: '#D4A847',
        textTransform: 'uppercase',
        letterSpacing: '0.1em',
        fontFamily: "'JetBrains Mono', monospace",
        marginBottom: 12,
      }}>
        ✓ Real YouTube Data Fetched
      </p>

      <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', marginBottom: 14 }}>
        {[
          { label: 'Subscribers', value: ch.subscribers >= 1000000
            ? `${(ch.subscribers / 1000000).toFixed(1)}M`
            : ch.subscribers >= 1000
            ? `${(ch.subscribers / 1000).toFixed(1)}K`
            : ch.subscribers.toLocaleString('en-IN') },
          { label: 'Total Views', value: ch.totalViews >= 1000000
            ? `${(ch.totalViews / 1000000).toFixed(1)}M`
            : `${(ch.totalViews / 1000).toFixed(0)}K` },
          { label: 'Videos', value: ch.videoCount.toLocaleString('en-IN') },
        ].map((s, i) => (
          <div key={i}>
            <div style={{ fontSize: 18, fontWeight: 800, color: '#ffffff', fontFamily: "'DM Sans', sans-serif" }}>
              {s.value}
            </div>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', fontFamily: "'JetBrains Mono', monospace", textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              {s.label}
            </div>
          </div>
        ))}
      </div>

      {ch.top_videos?.length > 0 && (
        <>
          <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', fontFamily: "'JetBrains Mono', monospace", textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
            Top Videos by Views
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            {ch.top_videos.slice(0, 5).map((v, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
                <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontFamily: "'DM Sans', sans-serif" }}>
                  {v.title}
                </span>
                <span style={{ fontSize: 11, color: '#D4A847', flexShrink: 0, fontFamily: "'JetBrains Mono', monospace", fontWeight: 600 }}>
                  {v.views >= 1000000
                    ? `${(v.views / 1000000).toFixed(1)}M`
                    : `${(v.views / 1000).toFixed(0)}K`}
                </span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ─── RealVideoStats ────────────────────────────────────────────────────────
// Display real fetched video stats at top of viral decoder result
export function RealVideoStats({ data }) {
  const v = data?._real_video;
  if (!v) return null;

  const engagementRate = v.views > 0 ? ((v.likes / v.views) * 100).toFixed(2) : 0;
  const commentRate    = v.views > 0 ? ((v.comments / v.views) * 100).toFixed(3) : 0;

  return (
    <div style={{
      background: '#0A0A0A',
      borderRadius: 12,
      padding: '16px 20px',
      marginBottom: 16,
      border: '1px solid rgba(255,255,255,0.07)',
    }}>
      <p style={{
        fontSize: 10, fontWeight: 700, color: '#2563EB',
        textTransform: 'uppercase', letterSpacing: '0.1em',
        fontFamily: "'JetBrains Mono', monospace", marginBottom: 10,
      }}>
        ✓ Real Video Data Fetched
      </p>
      <p style={{ fontSize: 13, color: '#ffffff', fontFamily: "'DM Sans', sans-serif", marginBottom: 12, lineHeight: 1.4 }}>
        "{v.title}"
      </p>
      <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
        {[
          { label: 'Views', value: v.views >= 1000000 ? `${(v.views/1000000).toFixed(1)}M` : `${(v.views/1000).toFixed(0)}K`, color: '#ffffff' },
          { label: 'Likes', value: v.likes >= 1000 ? `${(v.likes/1000).toFixed(1)}K` : v.likes, color: '#D4A847' },
          { label: 'Engagement', value: `${engagementRate}%`, color: '#059669' },
          { label: 'Comment Rate', value: `${commentRate}%`, color: '#2563EB' },
        ].map((s, i) => (
          <div key={i}>
            <div style={{ fontSize: 18, fontWeight: 800, color: s.color, fontFamily: "'DM Sans', sans-serif" }}>{s.value}</div>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', fontFamily: "'JetBrains Mono', monospace", textTransform: 'uppercase', letterSpacing: '0.06em' }}>{s.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── RealTrendingVideos ─────────────────────────────────────────────────────
// Display real trending videos at top of trend spy result
export function RealTrendingVideos({ data }) {
  const videos = data?._real_trending;
  if (!videos?.length) return null;

  return (
    <div style={{
      background: '#0A0A0A',
      borderRadius: 12,
      padding: '16px 20px',
      marginBottom: 16,
      border: '1px solid rgba(255,255,255,0.07)',
    }}>
      <p style={{
        fontSize: 10, fontWeight: 700, color: '#D4A847',
        textTransform: 'uppercase', letterSpacing: '0.1em',
        fontFamily: "'JetBrains Mono', monospace", marginBottom: 12,
      }}>
        ✓ {videos.length} Real Trending Videos Fetched
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {videos.slice(0, 6).map((v, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
            <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontFamily: "'DM Sans', sans-serif" }}>
              {v.title}
            </span>
            <span style={{ fontSize: 11, color: '#D4A847', flexShrink: 0, fontFamily: "'JetBrains Mono', monospace", fontWeight: 600 }}>
              {v.views >= 1000000 ? `${(v.views/1000000).toFixed(1)}M` : `${(v.views/1000).toFixed(0)}K`}v
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}