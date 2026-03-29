'use client';
import { useState } from 'react';

/**
 * SceneCard — renders a single scene from the creator agent output
 *
 * Props:
 *   scene  {object} — scene object from creator.scenes[]
 *     scene.scene_number
 *     scene.timestamp_start
 *     scene.timestamp_end
 *     scene.section_type
 *     scene.voiceover
 *     scene.visual_direction
 *     scene.overlay_text
 *     scene.b_roll_search_term
 *     scene.tone_direction
 *     scene.retention_technique
 */

const SECTION_TYPE_STYLES = {
  HOOK:              { color: '#D4A847', bg: 'rgba(212,168,71,0.08)',  label: 'Hook'              },
  INTRO:             { color: '#4A90D9', bg: 'rgba(74,144,217,0.08)',  label: 'Intro'             },
  MAIN_CONTENT:      { color: '#3ECF8E', bg: 'rgba(62,207,142,0.08)', label: 'Main Content'      },
  PATTERN_INTERRUPT: { color: '#F59E0B', bg: 'rgba(245,158,11,0.08)',  label: 'Pattern Interrupt' },
  RETENTION_BRIDGE:  { color: '#8B5CF6', bg: 'rgba(139,92,246,0.08)', label: 'Retention Bridge'  },
  CTA:               { color: '#EC4899', bg: 'rgba(236,72,153,0.08)',  label: 'CTA'               },
  OUTRO:             { color: 'rgba(238,238,245,0.4)', bg: 'rgba(255,255,255,0.03)', label: 'Outro' },
};

function CopyButton({ text, label = 'Copy' }) {
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    });
  }

  return (
    <button
      onClick={handleCopy}
      style={{
        background:   copied ? 'rgba(62,207,142,0.1)' : 'rgba(255,255,255,0.04)',
        border:       `1px solid ${copied ? 'rgba(62,207,142,0.25)' : 'rgba(255,255,255,0.08)'}`,
        borderRadius: '6px',
        padding:      '4px 10px',
        fontSize:     '11px',
        color:        copied ? '#3ECF8E' : 'rgba(238,238,245,0.4)',
        cursor:       'pointer',
        fontFamily:   'var(--FM, "Space Mono", monospace)',
        transition:   'all 0.2s',
        whiteSpace:   'nowrap',
      }}
    >
      {copied ? '✓ Copied' : label}
    </button>
  );
}

export default function SceneCard({ scene }) {
  const [expanded, setExpanded] = useState(false);

  if (!scene) return null;

  const typeStyle = SECTION_TYPE_STYLES[scene.section_type] || SECTION_TYPE_STYLES.MAIN_CONTENT;

  return (
    <>
      <style>{`
        .scene-card {
          background: rgba(255,255,255,0.018);
          border: 1px solid rgba(255,255,255,0.055);
          border-radius: 10px;
          overflow: hidden;
          transition: border-color 0.2s;
        }
        .scene-card:hover { border-color: rgba(255,255,255,0.10); }

        .scene-header {
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 14px 18px;
          cursor: pointer;
          user-select: none;
        }
        .scene-num {
          width: 32px;
          height: 32px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: var(--FH, "Syne", sans-serif);
          font-size: 13px;
          font-weight: 800;
          flex-shrink: 0;
          color: var(--sc-color);
          background: var(--sc-bg);
          border: 1px solid var(--sc-color);
        }
        .scene-meta { flex: 1; min-width: 0; }
        .scene-type-badge {
          display: inline-block;
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          font-family: var(--FM, "Space Mono", monospace);
          color: var(--sc-color);
          margin-bottom: 3px;
        }
        .scene-timestamps {
          font-family: var(--FM, "Space Mono", monospace);
          font-size: 11px;
          color: rgba(238,238,245,0.3);
        }
        .scene-chevron {
          font-size: 12px;
          color: rgba(238,238,245,0.25);
          transition: transform 0.2s;
          flex-shrink: 0;
        }
        .scene-chevron.open { transform: rotate(180deg); }

        .scene-body {
          padding: 0 18px 18px;
          display: flex;
          flex-direction: column;
          gap: 14px;
          border-top: 1px solid rgba(255,255,255,0.04);
        }

        .scene-section-label {
          font-size: 9px;
          font-weight: 700;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: rgba(238,238,245,0.25);
          font-family: var(--FM, "Space Mono", monospace);
          margin-bottom: 6px;
        }
        .scene-voiceover {
          font-size: 13px;
          color: rgba(238,238,245,0.85);
          line-height: 1.7;
          font-family: var(--FB, "DM Sans", sans-serif);
          background: rgba(212,168,71,0.05);
          border-left: 2px solid rgba(212,168,71,0.35);
          padding: 10px 14px;
          border-radius: 0 6px 6px 0;
        }
        .scene-detail-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
        }
        .scene-detail-box {
          background: rgba(255,255,255,0.02);
          border: 1px solid rgba(255,255,255,0.05);
          border-radius: 8px;
          padding: 10px 12px;
        }
        .scene-detail-text {
          font-size: 12px;
          color: rgba(238,238,245,0.55);
          line-height: 1.6;
          font-family: var(--FB, "DM Sans", sans-serif);
        }
        .scene-overlay-chip {
          display: inline-block;
          background: rgba(212,168,71,0.10);
          border: 1px solid rgba(212,168,71,0.2);
          border-radius: 6px;
          padding: 5px 10px;
          font-size: 12px;
          color: #D4A847;
          font-family: var(--FM, "Space Mono", monospace);
        }
        .scene-broll {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 12px;
          color: rgba(238,238,245,0.45);
          font-family: var(--FM, "Space Mono", monospace);
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 6px;
          padding: 5px 10px;
        }
        .scene-actions {
          display: flex;
          gap: 8px;
          padding-top: 4px;
        }
      `}</style>

      <div
        className="scene-card"
        style={{
          '--sc-color': typeStyle.color,
          '--sc-bg':    typeStyle.bg,
        }}
      >
        {/* Header — always visible */}
        <div className="scene-header" onClick={() => setExpanded(!expanded)}>
          <div className="scene-num">S{scene.scene_number}</div>
          <div className="scene-meta">
            <div className="scene-type-badge">{typeStyle.label}</div>
            <div className="scene-timestamps">
              {scene.timestamp_start} → {scene.timestamp_end}
            </div>
          </div>
          {/* Voiceover preview clipped */}
          <span style={{ fontSize: '12px', color: 'rgba(238,238,245,0.35)', flex: 1, overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis', fontFamily: 'var(--FB)' }}>
            {scene.voiceover?.slice(0, 60)}…
          </span>
          <span className={`scene-chevron ${expanded ? 'open' : ''}`}>▼</span>
        </div>

        {/* Body — expanded */}
        {expanded && (
          <div className="scene-body">
            {/* Voiceover */}
            <div>
              <div className="scene-section-label">🎙 Voiceover</div>
              <div className="scene-voiceover">{scene.voiceover}</div>
            </div>

            {/* Visual + Tone grid */}
            <div className="scene-detail-row">
              <div className="scene-detail-box">
                <div className="scene-section-label">📹 Visual Direction</div>
                <div className="scene-detail-text">{scene.visual_direction || '—'}</div>
              </div>
              <div className="scene-detail-box">
                <div className="scene-section-label">🎭 Tone Direction</div>
                <div className="scene-detail-text">{scene.tone_direction || '—'}</div>
              </div>
            </div>

            {/* Retention technique */}
            {scene.retention_technique && (
              <div className="scene-detail-box">
                <div className="scene-section-label">🔒 Retention Technique</div>
                <div className="scene-detail-text">{scene.retention_technique}</div>
              </div>
            )}

            {/* Overlay text */}
            {scene.overlay_text && (
              <div>
                <div className="scene-section-label">📝 On-Screen Text</div>
                <span className="scene-overlay-chip">"{scene.overlay_text}"</span>
              </div>
            )}

            {/* B-roll */}
            {scene.b_roll_search_term && (
              <div>
                <div className="scene-section-label">🎬 B-Roll Search</div>
                <span className="scene-broll">
                  🔍 {scene.b_roll_search_term}
                </span>
              </div>
            )}

            {/* Actions */}
            <div className="scene-actions">
              <CopyButton text={scene.voiceover || ''} label="Copy Voiceover" />
              {scene.visual_direction && (
                <CopyButton text={scene.visual_direction} label="Copy Direction" />
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
}