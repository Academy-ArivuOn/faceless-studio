'use client'
import React from "react"
import { useState, useEffect, useRef } from 'react'

const STEPS = [
  {
    number: '01',
    icon: '🎯',
    title: 'Tell us your niche',
    desc: 'Enter your YouTube niche, preferred platform, and tone. That\'s it. Three inputs.',
    detail: 'No prompt writing. No settings maze. Just "Personal Finance India" → and the system knows exactly what to do.',
  },
  {
    number: '02',
    icon: '🤖',
    title: '13 AI agents get to work',
    desc: 'Research Agent scans trends. Creator Agent writes your script. Publisher Agent optimises for SEO.',
    detail: 'Three agents run in sequence. Each one builds on the last. You get consistent, high-quality output every time.',
  },
  {
    number: '03',
    icon: '📦',
    title: 'Pick up your content pack',
    desc: 'Full script with scene breakdown, hook psychology, YouTube SEO, social captions — all ready to copy and publish.',
    detail: 'No editing. No rewriting. Copy the title. Copy the script. Hit upload. Done.',
  },
]

const AGENTS = [
  {
    id: 'research',
    icon: '🔍',
    name: 'Research Agent',
    tag: 'Tier 1 — Core',
    color: '#C9A435',
    bg: 'rgba(201,164,53,0.08)',
    border: 'rgba(201,164,53,0.2)',
    output: [
      '✓ Top 3 trending angles',
      '✓ Competitor gap analysis',
      '✓ Best hook type identified',
      '✓ Chosen topic + hook',
    ],
  },
  {
    id: 'creator',
    icon: '✍️',
    name: 'Creator Agent',
    tag: 'Tier 1 — Core',
    color: '#4A90D9',
    bg: 'rgba(74,144,217,0.08)',
    border: 'rgba(74,144,217,0.2)',
    output: [
      '✓ Full word-for-word script',
      '✓ Scene-by-scene direction',
      '✓ Voiceover tone notes',
      '✓ Hook psychology explain',
    ],
  },
  {
    id: 'publisher',
    icon: '🚀',
    name: 'Publisher Agent',
    tag: 'Tier 1 — Core',
    color: '#50C878',
    bg: 'rgba(80,200,120,0.08)',
    border: 'rgba(80,200,120,0.2)',
    output: [
      '✓ YouTube title + desc',
      '✓ 10 SEO-optimised tags',
      '✓ Instagram caption + tags',
      '✓ TikTok caption + tags',
    ],
  },
]

const ARROW = () => (
  <svg width="40" height="24" viewBox="0 0 40 24" fill="none" style={{ flexShrink: 0 }}>
    <path d="M0 12 L32 12 M24 4 L32 12 L24 20" stroke="rgba(201,164,53,0.5)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

export default function HowItWorks() {
  const [activeAgent, setActiveAgent] = useState(0)
  const sectionRef = useRef(null)

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveAgent(prev => (prev + 1) % 3)
    }, 2500)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(e => {
          if (e.isIntersecting) {
            e.target.classList.add('visible')
          }
        })
      },
      { threshold: 0.15 }
    )
    const els = sectionRef.current?.querySelectorAll('.animate-on-scroll')
    els?.forEach(el => observer.observe(el))
    return () => observer.disconnect()
  }, [])

  return (
    <>
      <style>{`
        .how-section {
          background: var(--white);
          padding: var(--section-pad) 0;
        }

        .section-header {
          text-align: center;
          margin-bottom: 4rem;
        }

        .section-eyebrow {
          font-family: var(--font-display);
          font-size: 0.78rem;
          font-weight: 700;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: var(--gold-500);
          margin-bottom: 1rem;
        }

        .section-title {
          font-family: var(--font-display);
          font-size: clamp(2rem, 4vw, 3rem);
          font-weight: 800;
          letter-spacing: -0.03em;
          color: var(--navy-900);
          line-height: 1.15;
          margin-bottom: 1rem;
        }

        .section-title .accent {
          background: linear-gradient(135deg, var(--gold-500), var(--gold-300));
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .section-sub {
          font-size: 1.05rem;
          color: var(--gray-600);
          max-width: 560px;
          margin: 0 auto;
          line-height: 1.7;
        }

        /* STEPS */
        .steps-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 2rem;
          margin-bottom: 5rem;
        }

        .step-card {
          padding: 2rem;
          border-radius: var(--radius-lg);
          border: 1px solid var(--gray-100);
          background: var(--white);
          position: relative;
          transition: all 0.3s ease;
        }

        .step-card:hover {
          border-color: var(--gold-300);
          box-shadow: 0 8px 40px rgba(201,164,53,0.1);
          transform: translateY(-4px);
        }

        .step-number {
          font-family: var(--font-display);
          font-size: 4rem;
          font-weight: 800;
          line-height: 1;
          background: linear-gradient(135deg, rgba(201,164,53,0.15), rgba(201,164,53,0.05));
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          margin-bottom: 1rem;
        }

        .step-icon {
          font-size: 2rem;
          margin-bottom: 0.75rem;
          display: block;
        }

        .step-title {
          font-family: var(--font-display);
          font-size: 1.2rem;
          font-weight: 700;
          color: var(--navy-900);
          margin-bottom: 0.6rem;
        }

        .step-desc {
          font-size: 0.95rem;
          color: var(--gray-600);
          line-height: 1.65;
          margin-bottom: 0.75rem;
        }

        .step-detail {
          font-size: 0.85rem;
          color: var(--gray-400);
          line-height: 1.65;
          border-top: 1px solid var(--gray-100);
          padding-top: 0.75rem;
          font-style: italic;
        }

        /* AGENT PIPELINE */
        .pipeline-section {
          background: var(--navy-950);
          border-radius: var(--radius-xl);
          padding: clamp(2.5rem, 5vw, 4rem);
          border: 1px solid rgba(201,164,53,0.1);
          position: relative;
          overflow: hidden;
        }

        .pipeline-section::before {
          content: '';
          position: absolute;
          inset: 0;
          background-image:
            linear-gradient(rgba(201,164,53,0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(201,164,53,0.03) 1px, transparent 1px);
          background-size: 40px 40px;
          pointer-events: none;
        }

        .pipeline-header {
          text-align: center;
          margin-bottom: 3rem;
          position: relative;
          z-index: 1;
        }

        .pipeline-title {
          font-family: var(--font-display);
          font-size: clamp(1.5rem, 3vw, 2.2rem);
          font-weight: 700;
          color: var(--white);
          margin-bottom: 0.5rem;
        }

        .pipeline-sub {
          font-size: 0.95rem;
          color: var(--silver-dim);
        }

        .pipeline-flow {
          display: flex;
          align-items: stretch;
          gap: 0;
          position: relative;
          z-index: 1;
        }

        .agent-card {
          flex: 1;
          background: rgba(11,19,64,0.6);
          border: 1px solid rgba(201,164,53,0.08);
          border-radius: var(--radius-lg);
          padding: 1.75rem;
          transition: all 0.4s ease;
          position: relative;
          overflow: hidden;
        }

        .agent-card.active {
          border-color: var(--current-color);
          box-shadow: 0 0 30px rgba(var(--current-rgb), 0.12);
          animation: agent-active 0.5s ease;
        }

        .agent-card::before {
          content: '';
          position: absolute;
          top: 0; left: 0; right: 0;
          height: 2px;
          background: linear-gradient(90deg, transparent, var(--current-color), transparent);
          opacity: 0;
          transition: opacity 0.4s ease;
        }

        .agent-card.active::before {
          opacity: 1;
        }

        .agent-icon {
          font-size: 2rem;
          margin-bottom: 0.75rem;
          display: block;
        }

        .agent-tag {
          font-size: 0.68rem;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          font-family: var(--font-mono);
          margin-bottom: 0.5rem;
        }

        .agent-name {
          font-family: var(--font-display);
          font-size: 1.1rem;
          font-weight: 700;
          color: var(--white);
          margin-bottom: 1rem;
        }

        .agent-outputs {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .agent-output-line {
          font-family: var(--font-mono);
          font-size: 0.78rem;
          color: rgba(200,208,232,0.6);
          transition: color 0.3s ease;
        }

        .agent-card.active .agent-output-line {
          color: rgba(200,208,232,0.9);
        }

        .pipeline-arrow {
          display: flex;
          align-items: center;
          padding: 0 0.75rem;
          flex-shrink: 0;
        }

        /* Output preview */
        .pipeline-output {
          margin-top: 2rem;
          padding: 1.5rem;
          background: rgba(201,164,53,0.05);
          border: 1px solid rgba(201,164,53,0.15);
          border-radius: var(--radius-md);
          position: relative;
          z-index: 1;
        }

        .pipeline-output-label {
          font-family: var(--font-display);
          font-size: 0.75rem;
          font-weight: 700;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: var(--gold-400);
          margin-bottom: 1rem;
        }

        .output-tags {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }

        .output-tag {
          padding: 6px 14px;
          border-radius: 100px;
          font-size: 0.8rem;
          font-weight: 600;
          font-family: var(--font-display);
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.08);
          color: var(--silver);
          transition: all 0.3s ease;
        }

        .output-tag:hover {
          background: rgba(201,164,53,0.1);
          border-color: rgba(201,164,53,0.25);
          color: var(--gold-300);
        }

        @media (max-width: 900px) {
          .steps-grid { grid-template-columns: 1fr; }
          .pipeline-flow {
            flex-direction: column;
            gap: 1rem;
          }
          .pipeline-arrow { transform: rotate(90deg); padding: 0; align-self: center; }
        }
      `}</style>

      <section className="how-section" id="how-it-works" ref={sectionRef}>
        <div className="container">
          <div className="section-header animate-on-scroll">
            <p className="section-eyebrow">The Process</p>
            <h2 className="section-title">
              Three inputs. <span className="accent">Complete content pack.</span>
            </h2>
            <p className="section-sub">
              No prompts to write. No settings to configure. Just your niche — and a full week of ready-to-publish content.
            </p>
          </div>

          {/* 3 steps */}
          <div className="steps-grid">
            {STEPS.map((s, i) => (
              <div key={s.number} className={`step-card animate-on-scroll animate-delay-${i + 1}`}>
                <div className="step-number">{s.number}</div>
                <span className="step-icon">{s.icon}</span>
                <h3 className="step-title">{s.title}</h3>
                <p className="step-desc">{s.desc}</p>
                <p className="step-detail">{s.detail}</p>
              </div>
            ))}
          </div>

          {/* Agent pipeline */}
          <div className="pipeline-section animate-on-scroll">
            <div className="pipeline-header">
              <h3 className="pipeline-title">Inside the AI Pipeline</h3>
              <p className="pipeline-sub">Watch the agents work in real-time sequence</p>
            </div>

            <div className="pipeline-flow">
              {AGENTS.map((agent, i) => (
  <React.Fragment key={agent.id}>
    <div
      className={`agent-card ${activeAgent === i ? 'active' : ''}`}
      style={{
        '--current-color': agent.color,
        '--current-rgb':
          agent.id === 'research'
            ? '201,164,53'
            : agent.id === 'creator'
            ? '74,144,217'
            : '80,200,120',
      }}
    >
      <span className="agent-icon">{agent.icon}</span>
      <p className="agent-tag" style={{ color: agent.color }}>{agent.tag}</p>
      <h4 className="agent-name">{agent.name}</h4>

      <div className="agent-outputs">
        {agent.output.map((o, idx) => (
          <span key={`${agent.id}-${idx}`} className="agent-output-line">
            {o}
          </span>
        ))}
      </div>
    </div>

    {i < AGENTS.length - 1 && (
      <div className="pipeline-arrow">
        <ARROW />
      </div>
    )}
  </React.Fragment>
))}
            </div>

            <div className="pipeline-output">
              <p className="pipeline-output-label">📦 Final output delivered to you</p>
              <div className="output-tags">
                {[
                  '📄 Full Script', '🎬 Scene Breakdown', '🪝 Hook + Psychology',
                  '▶️ YouTube Title', '📝 Description', '🏷️ 10 SEO Tags',
                  '📸 Instagram Caption', '🎵 TikTok Caption', '📅 7-Day Plan',
                  '🧠 Trend Insights',
                ].map(t => (
                  <span key={t} className="output-tag">{t}</span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}