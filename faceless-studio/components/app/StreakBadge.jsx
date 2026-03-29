'use client';

/**
 * StreakBadge
 * Displays the user's current generation streak with fire animation.
 *
 * Props:
 *   streak   {number}  — consecutive day count (default 0)
 *   compact  {boolean} — small pill variant for topbar usage
 */
export default function StreakBadge({ streak = 0, compact = false }) {
  const isHot  = streak >= 7;
  const isFire = streak >= 3;

  if (compact) {
    return (
      <>
        <style>{`
          .streak-pill {
            display: inline-flex;
            align-items: center;
            gap: 5px;
            padding: 4px 10px;
            border-radius: 100px;
            background: ${isFire ? 'rgba(212,168,71,0.10)' : 'rgba(255,255,255,0.04)'};
            border: 1px solid ${isFire ? 'rgba(212,168,71,0.25)' : 'rgba(255,255,255,0.07)'};
            font-family: var(--FM, "Space Mono", monospace);
            font-size: 11px;
            font-weight: 600;
            color: ${isFire ? '#D4A847' : 'rgba(238,238,245,0.35)'};
            white-space: nowrap;
            transition: all 0.3s;
          }
          .streak-pill-icon { font-size: 12px; }
        `}</style>
        <span className="streak-pill">
          <span className="streak-pill-icon">{isFire ? '🔥' : '⚡'}</span>
          {streak}d streak
        </span>
      </>
    );
  }

  return (
    <>
      <style>{`
        .streak-card {
          background: ${isHot ? 'rgba(212,168,71,0.07)' : 'rgba(255,255,255,0.02)'};
          border: 1px solid ${isHot ? 'rgba(212,168,71,0.22)' : 'rgba(255,255,255,0.06)'};
          border-radius: 12px;
          padding: 20px 24px;
          display: flex;
          align-items: center;
          gap: 20px;
          transition: all 0.3s;
          position: relative;
          overflow: hidden;
        }
        .streak-card::before {
          content: '';
          position: absolute;
          inset: 0;
          background: ${isHot
            ? 'radial-gradient(ellipse at 10% 50%, rgba(212,168,71,0.06) 0%, transparent 70%)'
            : 'none'};
          pointer-events: none;
        }
        .streak-flame {
          font-size: 2.6rem;
          line-height: 1;
          flex-shrink: 0;
          animation: ${isFire ? 'flameWobble 1.6s ease-in-out infinite' : 'none'};
        }
        @keyframes flameWobble {
          0%, 100% { transform: scale(1) rotate(-2deg); }
          50%       { transform: scale(1.08) rotate(2deg); }
        }
        .streak-body { flex: 1; min-width: 0; }
        .streak-count {
          font-family: var(--FH, "Syne", sans-serif);
          font-size: 2.4rem;
          font-weight: 800;
          color: ${isFire ? '#D4A847' : 'rgba(238,238,245,0.6)'};
          line-height: 1;
          letter-spacing: -0.04em;
          margin-bottom: 4px;
        }
        .streak-label {
          font-size: 12px;
          color: rgba(238,238,245,0.35);
          font-family: var(--FM, "Space Mono", monospace);
          letter-spacing: 0.06em;
          text-transform: uppercase;
        }
        .streak-dots {
          display: flex;
          gap: 5px;
          margin-top: 10px;
          flex-wrap: wrap;
        }
        .streak-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          transition: background 0.3s;
        }
        .streak-message {
          font-size: 11px;
          color: #D4A847;
          font-family: var(--FM, "Space Mono", monospace);
          margin-top: 8px;
          font-style: italic;
        }
      `}</style>

      <div className="streak-card">
        <span className="streak-flame">
          {isHot ? '🔥' : isFire ? '🔥' : streak > 0 ? '⚡' : '💤'}
        </span>
        <div className="streak-body">
          <div className="streak-count">{streak}</div>
          <div className="streak-label">Day Streak</div>
          <div className="streak-dots">
            {Array.from({ length: Math.min(streak, 14) }).map((_, i) => (
              <span
                key={i}
                className="streak-dot"
                style={{
                  background: i < streak
                    ? `hsl(${42 - i * 1.5}, 75%, ${58 - i * 0.5}%)`
                    : 'rgba(255,255,255,0.07)',
                }}
              />
            ))}
          </div>
          {streak >= 3 && (
            <div className="streak-message">
              {streak >= 14 ? '🏆 Unstoppable. 2 weeks straight.' :
               streak >= 7  ? '🎯 One week strong — keep it up.' :
                              '🔥 Building momentum — don\'t break it.'}
            </div>
          )}
        </div>
      </div>
    </>
  );
}