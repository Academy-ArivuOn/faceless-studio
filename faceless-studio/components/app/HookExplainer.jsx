'use client';
import { useState } from 'react';

/**
 * HookExplainer — renders the hook breakdown from creator.hook_breakdown
 *
 * Props:
 *   hookBreakdown  {object} — creator.hook_breakdown
 *   chosenHook     {string} — the hook text (from research.chosen_hook)
 *   hookTrigger    {string} — e.g. "LOSS_AVERSION"
 */

const TRIGGER_META = {
  LOSS_AVERSION:       { emoji: '⚠️', color: '#F59E0B', label: 'Loss Aversion'       },
  CURIOSITY_GAP:       { emoji: '❓', color: '#4A90D9', label: 'Curiosity Gap'       },
  PATTERN_INTERRUPT:   { emoji: '⚡', color: '#8B5CF6', label: 'Pattern Interrupt'   },
  SOCIAL_PROOF:        { emoji: '👥', color: '#3ECF8E', label: 'Social Proof'        },
  DIRECT_PROMISE:      { emoji: '🎯', color: '#D4A847', label: 'Direct Promise'      },
  AUTHORITY_CHALLENGE: { emoji: '🔥', color: '#EC4899', label: 'Authority Challenge' },
  IDENTITY:            { emoji: '🪞', color: '#6EE7B7', label: 'Identity Trigger'    },
};

function CopyButton({ text }) {
  const [copied, setCopied] = useState(false);
  function handleCopy() {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    });
  }
  return (
    <button onClick={handleCopy} style={{
      background:   copied ? 'rgba(62,207,142,0.1)' : 'rgba(255,255,255,0.04)',
      border:       `1px solid ${copied ? 'rgba(62,207,142,0.25)' : 'rgba(255,255,255,0.08)'}`,
      borderRadius: '6px',
      padding:      '5px 12px',
      fontSize:     '11px',
      color:        copied ? '#3ECF8E' : 'rgba(238,238,245,0.4)',
      cursor:       'pointer',
      fontFamily:   'var(--FM)',
      transition:   'all 0.2s',
    }}>
      {copied ? '✓ Copied' : 'Copy Hook'}
    </button>
  );
}

export default function HookExplainer({ hookBreakdown, chosenHook, hookTrigger }) {
  const trigger = TRIGGER_META[hookTrigger] || { emoji: '🧠', color: '#D4A847', label: hookTrigger || 'Psychological Trigger' };
  const hb = hookBreakdown || {};

  return (
    <>
      <style>{`
        .he-root {
          display: flex;
          flex-direction: column;
          gap: 18px;
        }

        /* Hook display */
        .he-hook-box {
          background: rgba(212,168,71,0.06);
          border: 1px solid rgba(212,168,71,0.2);
          border-radius: 12px;
          padding: 20px 22px;
          position: relative;
        }
        .he-hook-label {
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: #D4A847;
          font-family: var(--FM);
          margin-bottom: 10px;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .he-hook-text {
          font-size: 16px;
          font-weight: 600;
          color: rgba(238,238,245,0.95);
          line-height: 1.6;
          font-family: var(--FB);
          font-style: italic;
          margin-bottom: 14px;
        }
        .he-trigger-pill {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 5px 12px;
          border-radius: 100px;
          font-size: 11px;
          font-weight: 700;
          font-family: var(--FM);
          letter-spacing: 0.06em;
          text-transform: uppercase;
        }

        /* Analysis cards */
        .he-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
        }
        .he-card {
          background: rgba(255,255,255,0.02);
          border: 1px solid rgba(255,255,255,0.055);
          border-radius: 10px;
          padding: 14px 16px;
        }
        .he-card.full { grid-column: 1 / -1; }
        .he-card-label {
          font-size: 9px;
          font-weight: 700;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: rgba(238,238,245,0.25);
          font-family: var(--FM);
          margin-bottom: 8px;
        }
        .he-card-text {
          font-size: 13px;
          color: rgba(238,238,245,0.75);
          line-height: 1.65;
          font-family: var(--FB);
        }

        /* Brain meter */
        .he-strength-label {
          font-size: 9px;
          font-weight: 700;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: rgba(238,238,245,0.25);
          font-family: var(--FM);
          margin-bottom: 10px;
        }
        .he-meter-track {
          height: 4px;
          background: rgba(255,255,255,0.06);
          border-radius: 2px;
          overflow: hidden;
          margin-bottom: 8px;
        }
        .he-meter-fill {
          height: 100%;
          border-radius: 2px;
          background: linear-gradient(90deg, #D4A847, #E8CA70);
          transition: width 0.8s ease;
        }
        .he-meter-ticks {
          display: flex;
          justify-content: space-between;
          font-size: 9px;
          color: rgba(238,238,245,0.2);
          font-family: var(--FM);
        }

        @media (max-width: 640px) {
          .he-grid { grid-template-columns: 1fr; }
          .he-card.full { grid-column: 1; }
        }
      `}</style>

      <div className="he-root">
        {/* Hook display */}
        <div className="he-hook-box">
          <div className="he-hook-label">
            🪝 Chosen Hook
            <CopyButton text={chosenHook || hb.hook_text || ''} />
          </div>
          <div className="he-hook-text">
            "{chosenHook || hb.hook_text}"
          </div>
          <span
            className="he-trigger-pill"
            style={{
              background: `${trigger.color}14`,
              border:     `1px solid ${trigger.color}30`,
              color:      trigger.color,
            }}
          >
            {trigger.emoji} {trigger.label}
          </span>
        </div>

        {/* Psychology breakdown */}
        <div className="he-grid">
          <div className="he-card full">
            <div className="he-card-label">🧠 Psychological Mechanism</div>
            <div className="he-card-text">{hb.psychological_mechanism || '—'}</div>
          </div>

          <div className="he-card">
            <div className="he-card-label">💬 What Viewer Is Thinking</div>
            <div className="he-card-text">{hb.what_viewer_is_thinking || '—'}</div>
          </div>

          <div className="he-card">
            <div className="he-card-label">⚡ Why First 3 Seconds</div>
            <div className="he-card-text">{hb.why_first_3_seconds || '—'}</div>
          </div>

          {hb.what_happens_if_hook_fails && (
            <div className="he-card full" style={{ borderColor: 'rgba(248,113,113,0.15)', background: 'rgba(248,113,113,0.04)' }}>
              <div className="he-card-label" style={{ color: 'rgba(248,113,113,0.5)' }}>⚠️ If Hook Fails</div>
              <div className="he-card-text">{hb.what_happens_if_hook_fails}</div>
            </div>
          )}
        </div>

        {/* Strength meter */}
        <div className="he-card">
          <div className="he-strength-label">Hook Strength Score</div>
          <div className="he-meter-track">
            <div
              className="he-meter-fill"
              style={{ width: trigger.label === 'Curiosity Gap' ? '92%' : trigger.label === 'Loss Aversion' ? '88%' : '82%' }}
            />
          </div>
          <div className="he-meter-ticks">
            <span>Weak</span>
            <span>Average</span>
            <span>Strong</span>
            <span>Viral</span>
          </div>
        </div>
      </div>
    </>
  );
}