'use client';
// components/app/GenerationOverlay.jsx
// Full-screen animated popup shown during the 3-agent pipeline.
// Shows real-time step progress, elapsed timer, and fun copy for each agent.

import { useState, useEffect, useRef } from 'react';

const AGENT_STEPS = {
  research: [
    { icon: '🔍', text: 'Scanning trending angles in your niche…' },
    { icon: '🧠', text: 'Finding the strongest content hook…' },
    { icon: '🎯', text: 'Analysing what competitors missed…' },
    { icon: '📊', text: 'Building your content strategy…' },
  ],
  creator: [
    { icon: '✍️', text: 'Crafting your opening scene…' },
    { icon: '🎬', text: 'Writing scene-by-scene breakdown…' },
    { icon: '🎙️', text: 'Perfecting voiceover directions…' },
    { icon: '🎒', text: 'Building the filming guide…' },
  ],
  publisher: [
    { icon: '📱', text: 'Writing Instagram caption…' },
    { icon: '▶️', text: 'Optimising YouTube title & description…' },
    { icon: '🏷️', text: 'Generating SEO tags…' },
    { icon: '📅', text: 'Building your 7-day content plan…' },
  ],
};

const BLOGGER_CREATOR_STEPS = [
  { icon: '🎒', text: 'Applying your blog type to the script…' },
  { icon: '📸', text: 'Weaving visual context into scenes…' },
  { icon: '🗺️', text: 'Adding location-specific details…' },
  { icon: '🎬', text: 'Writing scene-by-scene filming guide…' },
];

const FUN_FACTS = [
  'Did you know? The first 3 seconds of a video determine 60% of watch time.',
  'Creators who post consistently grow 3x faster than irregular posters.',
  'Thumbnails with faces get 38% more clicks than graphics alone.',
  'The best upload time for most Indian audiences is Tuesday–Thursday, 6–9 PM.',
  'A strong hook reduces drop-off in the first 30 seconds by up to 45%.',
  'Short-form content under 60s gets 2x the share rate of longer videos.',
  'Location-tagged content gets 79% more engagement on average.',
];

const AGENT_LABELS = {
  research: 'Research Agent',
  creator:  'Script Agent',
  publisher:'Distribution Agent',
};

const AGENT_DESCS = {
  research: 'Finding angles, hooks & content strategy',
  creator:  'Writing your full script & scene breakdown',
  publisher:'Creating captions, SEO & 7-day plan',
};

export default function GenerationOverlay({
  visible,
  currentAgent,   // 'research' | 'creator' | 'publisher' | null
  agentStatus,    // { research: 'done'|'running'|'idle'|'error', ... }
  elapsed,        // ms elapsed
  isBlogger,
  blogType,
  location,
  openingStyle,
  hasMedia,
}) {
  const [stepIdx,       setStepIdx]    = useState(0);
  const [factIdx,       setFactIdx]    = useState(0);
  const [factVisible,   setFactVisible] = useState(true);
  const [particles,     setParticles]  = useState([]);
  const stepTimer  = useRef(null);
  const factTimer  = useRef(null);
  const partTimer  = useRef(null);

  // Cycle through steps within the current agent
  useEffect(() => {
    if (!currentAgent) return;
    setStepIdx(0);
    stepTimer.current = setInterval(() => {
      setStepIdx(i => {
        const steps = getSteps(currentAgent, isBlogger);
        return (i + 1) % steps.length;
      });
    }, 2200);
    return () => clearInterval(stepTimer.current);
  }, [currentAgent, isBlogger]);

  // Cycle facts with fade
  useEffect(() => {
    if (!visible) return;
    factTimer.current = setInterval(() => {
      setFactVisible(false);
      setTimeout(() => {
        setFactIdx(i => (i + 1) % FUN_FACTS.length);
        setFactVisible(true);
      }, 400);
    }, 5000);
    return () => clearInterval(factTimer.current);
  }, [visible]);

  // Generate floating particles on mount
  useEffect(() => {
    if (!visible) return;
    const pts = Array.from({ length: 18 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 6 + 3,
      dur: Math.random() * 4 + 3,
      delay: Math.random() * 3,
      opacity: Math.random() * 0.3 + 0.1,
    }));
    setParticles(pts);
  }, [visible]);

  function getSteps(agent, blogger) {
    if (agent === 'creator' && blogger) return BLOGGER_CREATOR_STEPS;
    return AGENT_STEPS[agent] || AGENT_STEPS.research;
  }

  if (!visible) return null;

  const agents = ['research', 'creator', 'publisher'];
  const elapsedSec = (elapsed / 1000).toFixed(1);
  const currentSteps = currentAgent ? getSteps(currentAgent, isBlogger) : [];
  const currentStep  = currentSteps[stepIdx] || currentSteps[0];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;800&family=DM+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');
        
        @keyframes spin     { to { transform: rotate(360deg); } }
        @keyframes fadeIn   { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }
        @keyframes fadeUp   { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }
        @keyframes float    { 0%,100% { transform:translateY(0px); } 50% { transform:translateY(-12px); } }
        @keyframes pulse    { 0%,100% { opacity:1; transform:scale(1); } 50% { opacity:0.6; transform:scale(0.94); } }
        @keyframes shimmer  { 0% { background-position: -400px 0; } 100% { background-position: 400px 0; } }
        @keyframes slideFact{ from { opacity:0; transform:translateY(6px); } to { opacity:1; transform:translateY(0); } }
        @keyframes ripple   { 0% { transform:scale(0.8); opacity:0.8; } 100% { transform:scale(2.2); opacity:0; } }
        @keyframes checkPop { 0% { transform:scale(0) rotate(-12deg); } 70% { transform:scale(1.2) rotate(4deg); } 100% { transform:scale(1) rotate(0); } }
        @keyframes barFill  { from { width:0%; } to { width:100%; } }
        @keyframes orb      {
          0%   { transform:translate(0,0) scale(1); }
          33%  { transform:translate(30px,-20px) scale(1.05); }
          66%  { transform:translate(-20px,15px) scale(0.95); }
          100% { transform:translate(0,0) scale(1); }
        }

        .gen-overlay {
          position: fixed;
          inset: 0;
          z-index: 9999;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(8, 8, 12, 0.92);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          animation: fadeIn 0.3s ease;
        }

        .gen-overlay-card {
          background: #FFFFFF;
          border-radius: 20px;
          width: 100%;
          max-width: 520px;
          margin: 20px;
          overflow: hidden;
          position: relative;
          animation: fadeUp 0.4s ease;
          box-shadow: 0 40px 80px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.1);
        }

        .gen-overlay-top {
          background: linear-gradient(135deg, #0A0A0A 0%, #1A1A2E 50%, #16213E 100%);
          padding: 32px 28px 28px;
          position: relative;
          overflow: hidden;
        }

        .gen-orb-1 {
          position: absolute;
          width: 180px; height: 180px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(201,162,39,0.25) 0%, transparent 70%);
          top: -60px; right: -40px;
          animation: orb 8s ease-in-out infinite;
        }
        .gen-orb-2 {
          position: absolute;
          width: 120px; height: 120px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(37,99,235,0.2) 0%, transparent 70%);
          bottom: -30px; left: 20px;
          animation: orb 10s ease-in-out infinite reverse;
        }

        .gen-particle {
          position: absolute;
          border-radius: 50%;
          background: rgba(201,162,39,0.4);
          pointer-events: none;
        }

        .gen-overlay-brand {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 20px;
          position: relative;
          z-index: 2;
        }
        .gen-overlay-logo {
          width: 28px; height: 28px;
          background: rgba(255,255,255,0.08);
          border: 1px solid rgba(255,255,255,0.12);
          border-radius: 7px;
          display: flex; align-items: center; justify-content: center;
        }
        .gen-overlay-brandname {
          font-family: 'Playfair Display', serif;
          font-size: 14px; font-weight: 700;
          color: rgba(255,255,255,0.9);
          letter-spacing: -0.02em;
        }

        .gen-overlay-title {
          font-family: 'Playfair Display', serif;
          font-size: 24px; font-weight: 800;
          color: #FFFFFF;
          letter-spacing: -0.03em;
          line-height: 1.2;
          margin-bottom: 6px;
          position: relative; z-index: 2;
        }
        .gen-overlay-subtitle {
          font-family: 'DM Sans', sans-serif;
          font-size: 13px;
          color: rgba(255,255,255,0.45);
          margin-bottom: 24px;
          position: relative; z-index: 2;
        }

        /* Agent progress pills */
        .gen-overlay-agents {
          display: flex;
          gap: 8px;
          position: relative; z-index: 2;
        }
        .gen-agent-pill {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 6px;
          padding: 10px 8px;
          border-radius: 10px;
          transition: all 0.3s;
          position: relative;
          overflow: hidden;
        }
        .gen-agent-pill.idle    { background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.07); }
        .gen-agent-pill.running { background: rgba(201,162,39,0.12); border: 1px solid rgba(201,162,39,0.3); }
        .gen-agent-pill.done    { background: rgba(14,124,74,0.12); border: 1px solid rgba(14,124,74,0.3); }
        .gen-agent-pill.error   { background: rgba(220,38,38,0.1); border: 1px solid rgba(220,38,38,0.25); }

        .gen-agent-pill-icon {
          width: 28px; height: 28px;
          border-radius: 7px;
          display: flex; align-items: center; justify-content: center;
          font-size: 11px; font-weight: 800;
          font-family: 'JetBrains Mono', monospace;
          transition: all 0.3s;
        }
        .gen-agent-pill.idle    .gen-agent-pill-icon { background: rgba(255,255,255,0.06); color: rgba(255,255,255,0.3); }
        .gen-agent-pill.running .gen-agent-pill-icon { background: rgba(201,162,39,0.2); color: #C9A227; }
        .gen-agent-pill.done    .gen-agent-pill-icon { background: rgba(14,124,74,0.2); color: #0E7C4A; font-size: 14px; }
        .gen-agent-pill.error   .gen-agent-pill-icon { background: rgba(220,38,38,0.15); color: #DC2626; }

        .gen-agent-pill-spinner {
          width: 14px; height: 14px;
          border-radius: 50%;
          border: 2px solid rgba(201,162,39,0.2);
          border-top-color: #C9A227;
          animation: spin 0.8s linear infinite;
        }
        .gen-agent-pill-name {
          font-family: 'DM Sans', sans-serif;
          font-size: 10px; font-weight: 600;
          text-align: center; line-height: 1.3;
          transition: color 0.3s;
        }
        .gen-agent-pill.idle    .gen-agent-pill-name { color: rgba(255,255,255,0.25); }
        .gen-agent-pill.running .gen-agent-pill-name { color: #C9A227; }
        .gen-agent-pill.done    .gen-agent-pill-name { color: #0E7C4A; }
        .gen-agent-pill.error   .gen-agent-pill-name { color: #DC2626; }

        /* Running bar */
        .gen-agent-pill-bar {
          position: absolute;
          bottom: 0; left: 0;
          height: 2px;
          background: #C9A227;
          border-radius: 1px;
          animation: barFill 2.5s ease-in-out infinite;
        }

        /* Bottom section */
        .gen-overlay-bottom {
          padding: 24px 28px 28px;
          background: #FFFFFF;
        }

        .gen-current-step {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          padding: 14px 16px;
          background: #F8F8F8;
          border-radius: 12px;
          border: 1px solid #E8E8E8;
          margin-bottom: 16px;
          min-height: 60px;
          animation: fadeIn 0.25s ease;
        }
        .gen-step-icon {
          font-size: 20px;
          flex-shrink: 0;
          margin-top: 1px;
          animation: float 3s ease-in-out infinite;
        }
        .gen-step-content { flex: 1; }
        .gen-step-agent {
          font-family: 'JetBrains Mono', monospace;
          font-size: 9px; font-weight: 700;
          text-transform: uppercase; letter-spacing: 0.1em;
          color: #8C8C8C;
          margin-bottom: 4px;
        }
        .gen-step-text {
          font-family: 'DM Sans', sans-serif;
          font-size: 13px; font-weight: 600;
          color: #0A0A0A;
          line-height: 1.4;
        }
        .gen-step-spinner {
          width: 14px; height: 14px;
          border-radius: 50%;
          border: 2px solid #E8E8E8;
          border-top-color: #0A0A0A;
          animation: spin 0.8s linear infinite;
          flex-shrink: 0;
          margin-top: 3px;
        }

        /* Timer */
        .gen-timer-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 16px;
        }
        .gen-timer-label {
          font-family: 'DM Sans', sans-serif;
          font-size: 12px; color: #8C8C8C;
        }
        .gen-timer-val {
          font-family: 'JetBrains Mono', monospace;
          font-size: 13px; font-weight: 700;
          color: #0A0A0A;
          background: #F5F5F5;
          border: 1px solid #E8E8E8;
          border-radius: 6px;
          padding: 3px 10px;
        }

        /* Context badges */
        .gen-context-badges {
          display: flex;
          gap: 6px;
          flex-wrap: wrap;
          margin-bottom: 16px;
        }
        .gen-ctx-badge {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 4px 9px;
          border-radius: 6px;
          font-family: 'JetBrains Mono', monospace;
          font-size: 10px; font-weight: 600;
          background: #F0F0F0;
          border: 1px solid #E8E8E8;
          color: #5C5C5C;
          white-space: nowrap;
        }
        .gen-ctx-badge.amber { background: #FFFBEB; border-color: #FDE68A; color: #D97706; }
        .gen-ctx-badge.blue  { background: #EFF6FF; border-color: #BFDBFE; color: #2563EB; }
        .gen-ctx-badge.green { background: #F0FDF4; border-color: #86EFAC; color: #15803D; }

        /* Fun fact */
        .gen-fact {
          background: linear-gradient(135deg, #FAFAFA, #F5F5F5);
          border: 1px solid #E8E8E8;
          border-radius: 10px;
          padding: 12px 14px;
          border-left: 3px solid #C9A227;
        }
        .gen-fact-label {
          font-family: 'JetBrains Mono', monospace;
          font-size: 9px; font-weight: 700;
          text-transform: uppercase; letter-spacing: 0.1em;
          color: #C9A227;
          margin-bottom: 5px;
        }
        .gen-fact-text {
          font-family: 'DM Sans', sans-serif;
          font-size: 12px; color: #5C5C5C;
          line-height: 1.6;
          transition: opacity 0.4s;
        }

        @media (max-width: 540px) {
          .gen-overlay-card { margin: 12px; border-radius: 16px; }
          .gen-overlay-top { padding: 24px 20px 20px; }
          .gen-overlay-bottom { padding: 18px 20px 24px; }
          .gen-overlay-title { font-size: 20px; }
        }
      `}</style>

      <div className="gen-overlay">
        <div className="gen-overlay-card">

          {/* ── Top dark section ── */}
          <div className="gen-overlay-top">
            <div className="gen-orb-1" />
            <div className="gen-orb-2" />

            {/* Particles */}
            {particles.map(p => (
              <div
                key={p.id}
                className="gen-particle"
                style={{
                  left: `${p.x}%`, top: `${p.y}%`,
                  width: p.size, height: p.size,
                  opacity: p.opacity,
                  animation: `float ${p.dur}s ease-in-out ${p.delay}s infinite`,
                }}
              />
            ))}

            {/* Brand */}
            <div className="gen-overlay-brand">
              <div className="gen-overlay-logo">
                <svg width="12" height="12" viewBox="0 0 20 20" fill="none">
                  <polygon points="10,2 17,6 17,14 10,18 3,14 3,6" stroke="rgba(255,255,255,0.8)" strokeWidth="1.4" fill="none"/>
                  <polygon points="10,6 14,8.5 14,13.5 10,16 6,13.5 6,8.5" fill="rgba(255,255,255,0.25)"/>
                </svg>
              </div>
              <span className="gen-overlay-brandname">Studio AI</span>
            </div>

            {/* Title */}
            <div className="gen-overlay-title">
              {isBlogger ? 'Crafting your vlog script…' : 'Building your content pack…'}
            </div>
            <div className="gen-overlay-subtitle">
              Three specialised agents working in sequence
            </div>

            {/* Agent pills */}
            <div className="gen-overlay-agents">
              {agents.map((a) => {
                const st = agentStatus?.[a] || 'idle';
                const isRunning = st === 'running';
                const isDone    = st === 'done';
                const isError   = st === 'error';
                return (
                  <div key={a} className={`gen-agent-pill ${st}`}>
                    {isRunning && <div className="gen-agent-pill-bar" />}
                    <div className="gen-agent-pill-icon">
                      {isRunning ? <div className="gen-agent-pill-spinner" />
                        : isDone  ? '✓'
                        : isError ? '✕'
                        : a === 'research' ? '01' : a === 'creator' ? '02' : '03'}
                    </div>
                    <div className="gen-agent-pill-name">
                      {AGENT_LABELS[a]}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ── Bottom white section ── */}
          <div className="gen-overlay-bottom">

            {/* Current step */}
            {currentAgent && currentStep && (
              <div className="gen-current-step">
                <div className="gen-step-icon">{currentStep.icon}</div>
                <div className="gen-step-content">
                  <div className="gen-step-agent">{AGENT_LABELS[currentAgent]}</div>
                  <div className="gen-step-text">{currentStep.text}</div>
                </div>
                <div className="gen-step-spinner" />
              </div>
            )}

            {/* Timer */}
            <div className="gen-timer-row">
              <span className="gen-timer-label">Usually takes 25–45 seconds</span>
              <span className="gen-timer-val">{elapsedSec}s</span>
            </div>

            {/* Context badges */}
            {(isBlogger || location || hasMedia) && (
              <div className="gen-context-badges">
                {isBlogger && blogType && (
                  <span className="gen-ctx-badge amber">
                    🎒 {blogType.replace('_', ' ')}
                  </span>
                )}
                {location && (
                  <span className="gen-ctx-badge blue">
                    📍 {location.slice(0, 24)}{location.length > 24 ? '…' : ''}
                  </span>
                )}
                {hasMedia && (
                  <span className="gen-ctx-badge green">
                    📸 Visual context loaded
                  </span>
                )}
                {openingStyle && openingStyle !== 'auto' && (
                  <span className="gen-ctx-badge">
                    🎭 {openingStyle.replace(/_/g, ' ')}
                  </span>
                )}
              </div>
            )}

            {/* Fun fact */}
            <div className="gen-fact">
              <div className="gen-fact-label">💡 While you wait</div>
              <div
                className="gen-fact-text"
                style={{ opacity: factVisible ? 1 : 0 }}
              >
                {FUN_FACTS[factIdx]}
              </div>
            </div>

          </div>
        </div>
      </div>
    </>
  );
}