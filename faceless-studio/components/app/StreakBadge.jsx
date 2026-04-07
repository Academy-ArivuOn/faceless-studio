'use client';

/**
 * StreakBadge — works in both themes
 *
 * Props:
 *   streak   {number}
 *   compact  {boolean} — small pill for topbar
 *   dark     {boolean} — force dark styling (for dark backgrounds)
 */
export default function StreakBadge({ streak = 0, compact = false, dark = false }) {
  const isFire = streak >= 3;
  const isHot  = streak >= 7;

  if (compact) {
    return (
      <span style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 5,
        padding: '4px 10px',
        borderRadius: 100,
        background: dark
          ? (isFire ? 'rgba(212,168,71,0.10)' : 'rgba(255,255,255,0.04)')
          : (isFire ? '#FEF3C7' : '#F3F4F6'),
        border: `1px solid ${dark
          ? (isFire ? 'rgba(212,168,71,0.25)' : 'rgba(255,255,255,0.07)')
          : (isFire ? '#FDE68A' : '#E5E7EB')}`,
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: 12,
        fontWeight: 600,
        color: dark
          ? (isFire ? '#D4A847' : 'rgba(238,238,245,0.35)')
          : (isFire ? '#D97706' : '#6B7280'),
        whiteSpace: 'nowrap',
      }}>
        {isFire ? '🔥' : '⚡'} {streak}d streak
      </span>
    );
  }

  return (
    <div style={{
      background: dark
        ? (isHot ? 'rgba(212,168,71,0.07)' : 'rgba(255,255,255,0.02)')
        : '#fff',
      border: `1px solid ${dark
        ? (isHot ? 'rgba(212,168,71,0.22)' : 'rgba(255,255,255,0.06)')
        : '#F3F4F6'}`,
      borderRadius: 12,
      padding: '20px 24px',
      display: 'flex',
      alignItems: 'center',
      gap: 20,
    }}>
      <span style={{
        fontSize: '2.6rem',
        lineHeight: 1,
        flexShrink: 0,
        display: 'inline-block',
        animation: isFire ? 'flameWobble 1.6s ease-in-out infinite' : 'none',
      }}>
        {isHot ? '🔥' : isFire ? '🔥' : streak > 0 ? '⚡' : '💤'}
      </span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontFamily: "'Instrument Serif', serif",
          fontSize: '2.4rem',
          fontWeight: 400,
          color: dark
            ? (isFire ? '#D4A847' : 'rgba(238,238,245,0.6)')
            : (isFire ? '#D97706' : '#9CA3AF'),
          lineHeight: 1,
          letterSpacing: '-0.04em',
          marginBottom: 4,
        }}>{streak}</div>
        <div style={{
          fontSize: 12,
          color: dark ? 'rgba(238,238,245,0.35)' : '#9CA3AF',
          fontFamily: "'JetBrains Mono', monospace",
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
        }}>Day Streak</div>
        <div style={{ display: 'flex', gap: 5, marginTop: 10, flexWrap: 'wrap' }}>
          {Array.from({ length: Math.min(streak, 14) }).map((_, i) => (
            <span key={i} style={{
              width: 8, height: 8,
              borderRadius: '50%',
              background: i < streak
                ? `hsl(${42 - i * 1.5}, 75%, ${58 - i * 0.5}%)`
                : dark ? 'rgba(255,255,255,0.07)' : '#F3F4F6',
              display: 'inline-block',
            }} />
          ))}
        </div>
        {streak >= 3 && (
          <div style={{
            fontSize: 11,
            color: dark ? '#D4A847' : '#D97706',
            fontFamily: "'JetBrains Mono', monospace",
            marginTop: 8,
            fontStyle: 'italic',
          }}>
            {streak >= 14 ? '🏆 Unstoppable. 2 weeks straight.' :
             streak >= 7  ? '🎯 One week strong — keep it up.' :
                            '🔥 Building momentum — don\'t break it.'}
          </div>
        )}
      </div>
      <style>{`
        @keyframes flameWobble {
          0%, 100% { transform: scale(1) rotate(-2deg); }
          50% { transform: scale(1.08) rotate(2deg); }
        }
      `}</style>
    </div>
  );
}