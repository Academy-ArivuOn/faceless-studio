'use client';
import { useState } from 'react';

/**
 * SprintTracker — 7-day content plan with checkable day cards
 *
 * Props:
 *   plan      {Array}   — publisher.seven_day_content_plan[]
 *   platform  {string}  — primary platform
 */

const PLATFORM_ICONS = {
  'YouTube':         '▶️',
  'Instagram':       '📸',
  'Instagram Reels': '📸',
  'TikTok':          '🎵',
  'Blog':            '✍️',
  'Podcast':         '🎙️',
  'YouTube Shorts':  '🩳',
};

const TYPE_COLORS = {
  'Main Video':      { color: '#D4A847', bg: 'rgba(212,168,71,0.08)'   },
  'Short':           { color: '#4A90D9', bg: 'rgba(74,144,217,0.08)'   },
  'Reel':            { color: '#EC4899', bg: 'rgba(236,72,153,0.08)'   },
  'Story':           { color: '#8B5CF6', bg: 'rgba(139,92,246,0.08)'   },
  'Community Post':  { color: '#3ECF8E', bg: 'rgba(62,207,142,0.08)'   },
  'Blog':            { color: '#F59E0B', bg: 'rgba(245,158,11,0.08)'   },
  'Podcast':         { color: '#6EE7B7', bg: 'rgba(110,231,183,0.08)'  },
};

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export default function SprintTracker({ plan = [], platform = 'YouTube' }) {
  const [done, setDone] = useState({});

  function toggleDay(day) {
    setDone(prev => ({ ...prev, [day]: !prev[day] }));
  }

  const completedCount = Object.values(done).filter(Boolean).length;

  if (!plan || plan.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '40px 24px', color: 'rgba(238,238,245,0.3)', fontFamily: 'var(--FM)', fontSize: '13px' }}>
        No 7-day plan available.
      </div>
    );
  }

  return (
    <>
      <style>{`
        .st-root { display: flex; flex-direction: column; gap: 16px; }

        .st-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 2px;
        }
        .st-title {
          font-family: var(--FH);
          font-size: 14px;
          font-weight: 700;
          color: rgba(238,238,245,0.85);
          letter-spacing: -0.01em;
        }
        .st-progress-label {
          font-family: var(--FM);
          font-size: 11px;
          color: rgba(238,238,245,0.35);
        }
        .st-progress-label span { color: #D4A847; }

        .st-track {
          height: 3px;
          background: rgba(255,255,255,0.06);
          border-radius: 2px;
          overflow: hidden;
        }
        .st-track-fill {
          height: 100%;
          background: linear-gradient(90deg, #D4A847, #E8CA70);
          border-radius: 2px;
          transition: width 0.5s ease;
        }

        .st-grid {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          gap: 8px;
        }

        .st-day-col {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .st-day-header {
          font-family: var(--FM);
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          text-align: center;
          color: rgba(238,238,245,0.25);
          padding-bottom: 4px;
        }

        .st-day-card {
          background: rgba(255,255,255,0.02);
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 10px;
          padding: 12px 10px;
          cursor: pointer;
          transition: all 0.2s;
          display: flex;
          flex-direction: column;
          gap: 8px;
          min-height: 120px;
          position: relative;
        }
        .st-day-card:hover { border-color: rgba(255,255,255,0.14); }
        .st-day-card.done-card {
          background: rgba(62,207,142,0.05);
          border-color: rgba(62,207,142,0.2);
        }

        .st-day-check {
          position: absolute;
          top: 8px;
          right: 8px;
          width: 18px;
          height: 18px;
          border-radius: 50%;
          border: 1.5px solid rgba(255,255,255,0.12);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 9px;
          transition: all 0.2s;
        }
        .st-day-check.checked {
          background: #3ECF8E;
          border-color: #3ECF8E;
          color: #000;
        }

        .st-day-icon { font-size: 18px; text-align: center; }

        .st-day-type {
          font-size: 9px;
          font-weight: 700;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          font-family: var(--FM);
          padding: 2px 6px;
          border-radius: 4px;
          text-align: center;
          line-height: 1.4;
        }

        .st-day-angle {
          font-size: 10px;
          color: rgba(238,238,245,0.5);
          line-height: 1.5;
          font-family: var(--FB);
          text-align: center;
          overflow: hidden;
          display: -webkit-box;
          -webkit-line-clamp: 3;
          -webkit-box-orient: vertical;
        }

        .st-repurpose {
          font-size: 9px;
          color: rgba(238,238,245,0.2);
          font-family: var(--FM);
          text-align: center;
          margin-top: auto;
        }

        /* List fallback for narrow screens */
        .st-list {
          display: none;
          flex-direction: column;
          gap: 8px;
        }
        .st-list-item {
          display: flex;
          align-items: flex-start;
          gap: 14px;
          padding: 14px 16px;
          background: rgba(255,255,255,0.02);
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 10px;
          cursor: pointer;
          transition: all 0.2s;
        }
        .st-list-item.done-card { background: rgba(62,207,142,0.04); border-color: rgba(62,207,142,0.2); }
        .st-list-day-num {
          width: 28px;
          height: 28px;
          border-radius: 7px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: var(--FM);
          font-size: 11px;
          font-weight: 700;
          background: rgba(212,168,71,0.1);
          color: #D4A847;
          flex-shrink: 0;
        }
        .st-list-body { flex: 1; min-width: 0; }
        .st-list-type { font-size: 10px; font-weight: 700; text-transform: uppercase; font-family: var(--FM); color: rgba(238,238,245,0.35); margin-bottom: 3px; }
        .st-list-angle { font-size: 13px; color: rgba(238,238,245,0.8); font-family: var(--FB); line-height: 1.5; }
        .st-list-check {
          width: 20px; height: 20px; border-radius: 50%;
          border: 1.5px solid rgba(255,255,255,0.12);
          display: flex; align-items: center; justify-content: center; font-size: 10px;
          flex-shrink: 0; margin-top: 3px; transition: all 0.2s;
        }
        .st-list-check.checked { background: #3ECF8E; border-color: #3ECF8E; color: #000; }

        @media (max-width: 760px) {
          .st-grid { display: none; }
          .st-list { display: flex; }
        }
      `}</style>

      <div className="st-root">
        {/* Header */}
        <div className="st-header">
          <span className="st-title">📅 7-Day Sprint</span>
          <span className="st-progress-label">
            <span>{completedCount}</span> / {plan.length} done
          </span>
        </div>

        {/* Progress bar */}
        <div className="st-track">
          <div className="st-track-fill" style={{ width: `${(completedCount / Math.max(plan.length, 1)) * 100}%` }} />
        </div>

        {/* Grid view (desktop) */}
        <div className="st-grid">
          {plan.map((item, i) => {
            const typeStyle = TYPE_COLORS[item.content_type] || TYPE_COLORS['Main Video'];
            const platformIcon = PLATFORM_ICONS[item.platform] || '📱';
            const isDone = done[item.day];
            return (
              <div
                key={item.day}
                className={`st-day-col`}
              >
                <div className="st-day-header">{DAYS[i] || `D${item.day}`}</div>
                <div
                  className={`st-day-card ${isDone ? 'done-card' : ''}`}
                  onClick={() => toggleDay(item.day)}
                >
                  <div className={`st-day-check ${isDone ? 'checked' : ''}`}>
                    {isDone ? '✓' : ''}
                  </div>
                  <div className="st-day-icon">{platformIcon}</div>
                  <div
                    className="st-day-type"
                    style={{ background: typeStyle.bg, color: typeStyle.color }}
                  >
                    {item.content_type}
                  </div>
                  <div className="st-day-angle">{item.topic_angle}</div>
                  {item.repurpose_from && item.repurpose_from !== 'Original' && (
                    <div className="st-repurpose">↩ {item.repurpose_from}</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* List view (mobile) */}
        <div className="st-list">
          {plan.map((item, i) => {
            const typeStyle = TYPE_COLORS[item.content_type] || TYPE_COLORS['Main Video'];
            const platformIcon = PLATFORM_ICONS[item.platform] || '📱';
            const isDone = done[item.day];
            return (
              <div
                key={item.day}
                className={`st-list-item ${isDone ? 'done-card' : ''}`}
                onClick={() => toggleDay(item.day)}
              >
                <div className="st-list-day-num">D{item.day}</div>
                <div className="st-list-body">
                  <div className="st-list-type" style={{ color: typeStyle.color }}>
                    {platformIcon} {item.content_type} · {item.platform}
                  </div>
                  <div className="st-list-angle">{item.topic_angle}</div>
                </div>
                <div className={`st-list-check ${isDone ? 'checked' : ''}`}>{isDone ? '✓' : ''}</div>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}