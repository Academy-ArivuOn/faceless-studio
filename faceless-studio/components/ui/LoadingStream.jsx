'use client';

/**
 * LoadingStream — animated loading state for AI pipeline stages
 *
 * Props:
 *   message   {string}   — current status message
 *   agent     {string}   — agent name: 'research' | 'creator' | 'publisher'
 *   elapsed   {number}   — elapsed ms (optional, shows timer)
 *   lines     {Array}    — array of { t, msg } log objects (optional)
 */
export default function LoadingStream({ message = 'Generating...', agent = 'research', elapsed = 0, lines = [] }) {
  const agentColors = {
    research:  '#D4A847',
    creator:   '#4A90D9',
    publisher: '#3ECF8E',
  };

  const color = agentColors[agent] || '#D4A847';

  return (
    <>
      <style>{`
        .ls-root {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 20px;
          padding: 32px 24px;
        }
        .ls-orb {
          width: 56px;
          height: 56px;
          border-radius: 50%;
          border: 2px solid var(--ls-color);
          border-top-color: transparent;
          animation: ls-spin 0.9s linear infinite;
          position: relative;
          flex-shrink: 0;
        }
        .ls-orb::after {
          content: '';
          position: absolute;
          inset: 5px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(var(--ls-rgb), 0.12), transparent);
        }
        @keyframes ls-spin { to { transform: rotate(360deg); } }

        .ls-message {
          font-family: var(--FM, "Space Mono", monospace);
          font-size: 12px;
          color: rgba(238,238,245,0.6);
          text-align: center;
          letter-spacing: 0.02em;
        }
        .ls-message strong { color: rgba(238,238,245,0.9); }

        .ls-timer {
          font-family: var(--FM, "Space Mono", monospace);
          font-size: 11px;
          color: var(--ls-color);
          letter-spacing: 0.04em;
        }

        .ls-log {
          width: 100%;
          max-height: 120px;
          overflow-y: auto;
          background: rgba(0,0,0,0.25);
          border: 1px solid rgba(255,255,255,0.05);
          border-radius: 8px;
          padding: 10px 12px;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .ls-log::-webkit-scrollbar { width: 3px; }
        .ls-log::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); }

        .ls-log-line {
          display: flex;
          gap: 10px;
          font-family: var(--FM, "Space Mono", monospace);
          font-size: 10px;
        }
        .ls-log-ts { color: rgba(238,238,245,0.25); flex-shrink: 0; }
        .ls-log-msg { color: rgba(238,238,245,0.55); }
        .ls-log-msg.ok  { color: #3ECF8E; }
        .ls-log-msg.err { color: #F87171; }

        .ls-dots {
          display: flex;
          gap: 6px;
          align-items: center;
        }
        .ls-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: var(--ls-color);
          animation: ls-bounce 1.4s ease-in-out infinite;
        }
        .ls-dot:nth-child(2) { animation-delay: 0.18s; }
        .ls-dot:nth-child(3) { animation-delay: 0.36s; }
        @keyframes ls-bounce {
          0%, 80%, 100% { transform: scale(0.6); opacity: 0.4; }
          40%            { transform: scale(1);   opacity: 1; }
        }
      `}</style>

      <div
        className="ls-root"
        style={{
          '--ls-color': color,
          '--ls-rgb':   agent === 'research' ? '212,168,71' : agent === 'creator' ? '74,144,217' : '62,207,142',
        }}
      >
        <div className="ls-orb" />

        <div className="ls-dots">
          <div className="ls-dot" />
          <div className="ls-dot" />
          <div className="ls-dot" />
        </div>

        <p className="ls-message">{message}</p>

        {elapsed > 0 && (
          <span className="ls-timer">{(elapsed / 1000).toFixed(1)}s elapsed</span>
        )}

        {lines.length > 0 && (
          <div className="ls-log">
            {lines.map((l, i) => (
              <div key={i} className="ls-log-line">
                <span className="ls-log-ts">{l.t}</span>
                <span className={`ls-log-msg ${l.msg?.startsWith('✓') || l.msg?.startsWith('—') ? 'ok' : l.msg?.startsWith('✕') ? 'err' : ''}`}>
                  {l.msg}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}