'use client'
import { useEffect, useRef, useState } from 'react'

const TIERS = [
  {
    id: 'core',
    label: 'Tier 1 — Core',
    color: '#C9A435',
    bg: 'rgba(201,164,53,0.07)',
    planLabel: 'Free + Pro',
    agents: [
      {
        icon: '🔍', name: 'Research Agent',
        desc: 'Scans trending topics in your niche in real-time. Identifies viral angles and competitor gaps.',
        tags: ['Trend Analysis', 'Gap Finding', 'Hook Selection'],
      },
      {
        icon: '✍️', name: 'Creator Agent',
        desc: 'Writes full word-for-word scripts with scene-by-scene direction and voiceover tone guidance.',
        tags: ['Full Script', 'Scene Breakdown', 'Voice Direction'],
      },
      {
        icon: '🚀', name: 'Publisher Agent',
        desc: 'Generates YouTube SEO, Instagram captions, TikTok hooks and hashtags — all ready to paste.',
        tags: ['YouTube SEO', 'Captions', 'Hashtags'],
      },
    ],
  },
  {
    id: 'retention',
    label: 'Tier 2 — Retention',
    color: '#4A90D9',
    bg: 'rgba(74,144,217,0.07)',
    planLabel: 'Pro',
    agents: [
      {
        icon: '📡', name: 'Trend Spy Agent',
        desc: 'Morning brief: what\'s blowing up in your niche in the last 48 hours with ready-to-use angles.',
        tags: ['Daily Trends', 'Morning Brief', 'Niche-specific'],
      },
      {
        icon: '🥊', name: 'Title A/B Battle',
        desc: 'Generates 10 title variations, scores each on CTR psychology, SEO strength, and emotional pull.',
        tags: ['CTR Scoring', 'A/B Testing', 'Psychology'],
      },
      {
        icon: '🖼️', name: 'Thumbnail Brain',
        desc: 'AI-generated thumbnail brief: colors, layout, text, expression — everything your designer needs.',
        tags: ['Color Psychology', 'Layout Guide', 'Canva Brief'],
      },
      {
        icon: '⚡', name: 'Hook Upgrader',
        desc: 'Paste any weak hook — get 5 rewrites using different psychological triggers with explained reasoning.',
        tags: ['5 Variants', 'Psychology Tags', 'Trigger Analysis'],
      },
      {
        icon: '💬', name: 'Comment Reply',
        desc: 'Paste top comments, get perfectly crafted replies that encourage engagement and tease next video.',
        tags: ['Engagement', 'Algorithm Signal', 'On-brand Voice'],
      },
    ],
  },
  {
    id: 'pro',
    label: 'Tier 3 — Pro Power',
    color: '#50C878',
    bg: 'rgba(80,200,120,0.07)',
    planLabel: 'Studio',
    agents: [
      {
        icon: '🔬', name: 'Competitor Autopsy',
        desc: 'Dissects any competitor channel — hook patterns, title formulas, thumbnail codes, upload schedule.',
        tags: ['Hook Pattern', 'Title Formula', 'Gap Analysis'],
      },
      {
        icon: '🔄', name: 'Viral Reverse Engineer',
        desc: 'Decode why any viral video worked. Get the exact formula to replicate it in your niche.',
        tags: ['Viral Formula', 'Niche Adaptation', 'Template'],
      },
      {
        icon: '📊', name: 'Channel Strategy',
        desc: '5-question intake → 90-day content strategy, upload cadence, what to own, what to avoid.',
        tags: ['90-Day Plan', 'Positioning', 'Growth Strategy'],
      },
      {
        icon: '🌏', name: 'Script Localisation',
        desc: 'Rewrite scripts in Hindi, Tamil, Telugu, Kannada — culturally adapted, not just translated.',
        tags: ['Hindi', 'Tamil', 'Telugu', 'Kannada'],
      },
      {
        icon: '💰', name: 'Monetisation Coach',
        desc: 'Niche-specific revenue roadmap: AdSense CPM, affiliate programs, sponsor rates and pitch templates.',
        tags: ['CPM Estimates', 'Affiliate Maps', 'Sponsor Pitch'],
      },
    ],
  },
]

export default function AgentsSection() {
  const [activeTab, setActiveTab] = useState('core')
  const sectionRef = useRef(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => entries.forEach(e => e.isIntersecting && e.target.classList.add('visible')),
      { threshold: 0.1 }
    )
    sectionRef.current?.querySelectorAll('.animate-on-scroll')
      .forEach(el => observer.observe(el))
    return () => observer.disconnect()
  }, [])

  const activeTier = TIERS.find(t => t.id === activeTab)

  return (
    <>
      <style>{`
        .agents-section {
          background: var(--gray-50);
          padding: var(--section-pad) 0;
        }

        .tier-tabs {
          display: flex;
          gap: 8px;
          justify-content: center;
          margin-top: 2.5rem;
          margin-bottom: 3rem;
          flex-wrap: wrap;
        }

        .tier-tab {
          padding: 10px 22px;
          border-radius: 100px;
          border: 1.5px solid var(--gray-200);
          background: transparent;
          font-family: var(--font-display);
          font-size: 0.85rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.25s ease;
          color: var(--gray-600);
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .tier-tab:hover {
          border-color: var(--gold-300);
          color: var(--navy-900);
        }

        .tier-tab.active {
          color: var(--navy-950);
          box-shadow: 0 4px 16px rgba(201,164,53,0.2);
        }

        .tier-tab-dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
        }

        .tier-plan-badge {
          font-size: 0.68rem;
          padding: 2px 8px;
          border-radius: 100px;
          font-weight: 700;
          letter-spacing: 0.06em;
          text-transform: uppercase;
        }

        /* Agent grid */
        .agents-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 1.25rem;
        }

        .agent-tile {
          background: var(--white);
          border: 1px solid var(--gray-100);
          border-radius: var(--radius-lg);
          padding: 1.75rem;
          transition: all 0.3s ease;
          cursor: default;
          position: relative;
          overflow: hidden;
        }

        .agent-tile::before {
          content: '';
          position: absolute;
          top: 0; left: 0; right: 0;
          height: 2px;
          background: var(--tier-color);
          opacity: 0;
          transition: opacity 0.3s ease;
        }

        .agent-tile:hover {
          border-color: var(--gray-200);
          box-shadow: 0 8px 32px rgba(11,19,64,0.08);
          transform: translateY(-3px);
        }

        .agent-tile:hover::before {
          opacity: 1;
        }

        .agent-tile-icon {
          font-size: 2.2rem;
          margin-bottom: 0.75rem;
          display: block;
        }

        .agent-tile-name {
          font-family: var(--font-display);
          font-size: 1.05rem;
          font-weight: 700;
          color: var(--navy-900);
          margin-bottom: 0.5rem;
        }

        .agent-tile-desc {
          font-size: 0.9rem;
          color: var(--gray-600);
          line-height: 1.65;
          margin-bottom: 1rem;
        }

        .agent-tile-tags {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
        }

        .agent-tile-tag {
          font-size: 0.72rem;
          font-weight: 600;
          padding: 4px 10px;
          border-radius: 100px;
          font-family: var(--font-display);
          letter-spacing: 0.02em;
        }

        /* Total count */
        .agents-count {
          text-align: center;
          margin-top: 3rem;
          padding: 1.75rem;
          background: var(--navy-950);
          border-radius: var(--radius-xl);
          border: 1px solid rgba(201,164,53,0.12);
        }

        .agents-count-number {
          font-family: var(--font-display);
          font-size: clamp(2.5rem, 5vw, 4rem);
          font-weight: 800;
          background: linear-gradient(135deg, var(--gold-300), var(--gold-500));
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          line-height: 1;
        }

        .agents-count-label {
          font-size: 1rem;
          color: var(--silver);
          margin-top: 0.5rem;
        }

        .agents-count-sub {
          font-size: 0.85rem;
          color: var(--silver-dim);
          margin-top: 0.35rem;
        }

        @media (max-width: 600px) {
          .agents-grid { grid-template-columns: 1fr; }
        }
      `}</style>

      <section className="agents-section" id="agents" ref={sectionRef}>
        <div className="container">
          <div className="section-header animate-on-scroll">
            <p className="section-eyebrow" style={{ color: 'var(--gold-500)' }}>The Agent Ecosystem</p>
            <h2 className="section-title" style={{ color: 'var(--navy-900)' }}>
              13 agents. <span className="accent">One operating system.</span>
            </h2>
            <p className="section-sub">
              Not a single AI doing everything. A structured pipeline of specialists — each one built for exactly one job.
            </p>
          </div>

          {/* Tier tabs */}
          <div className="tier-tabs animate-on-scroll">
            {TIERS.map(t => (
              <button
                key={t.id}
                className={`tier-tab ${activeTab === t.id ? 'active' : ''}`}
                onClick={() => setActiveTab(t.id)}
                style={activeTab === t.id ? {
                  background: t.bg,
                  borderColor: t.color,
                  color: 'var(--navy-950)',
                } : {}}
              >
                <span className="tier-tab-dot" style={{ background: t.color }} />
                {t.label}
                <span
                  className="tier-plan-badge"
                  style={{
                    background: activeTab === t.id ? t.bg : 'var(--gray-100)',
                    color: activeTab === t.id ? t.color : 'var(--gray-400)',
                    border: `1px solid ${activeTab === t.id ? t.color : 'transparent'}`,
                  }}
                >
                  {t.planLabel}
                </span>
              </button>
            ))}
          </div>

          {/* Agents grid */}
          <div className="agents-grid animate-on-scroll">
            {activeTier?.agents.map((agent, i) => (
              <div
                key={agent.name}
                className="agent-tile"
                style={{
                  '--tier-color': activeTier.color,
                  animationDelay: `${i * 0.05}s`,
                }}
              >
                <span className="agent-tile-icon">{agent.icon}</span>
                <h3 className="agent-tile-name">{agent.name}</h3>
                <p className="agent-tile-desc">{agent.desc}</p>
                <div className="agent-tile-tags">
                  {agent.tags.map(tag => (
                    <span
                      key={tag}
                      className="agent-tile-tag"
                      style={{
                        background: activeTier.bg,
                        color: activeTier.color,
                        border: `1px solid ${activeTier.color}30`,
                      }}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Total count bar */}
          <div className="agents-count animate-on-scroll">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '3rem', flexWrap: 'wrap' }}>
              <div>
                <div className="agents-count-number">13</div>
                <p className="agents-count-label">Total AI Agents</p>
              </div>
              <div style={{ width: 1, height: 60, background: 'rgba(201,164,53,0.15)', flexShrink: 0 }} className="hide-mobile" />
              <div>
                <div className="agents-count-number">3</div>
                <p className="agents-count-label">Agent Tiers</p>
              </div>
              <div style={{ width: 1, height: 60, background: 'rgba(201,164,53,0.15)', flexShrink: 0 }} className="hide-mobile" />
              <div>
                <div className="agents-count-number">90s</div>
                <p className="agents-count-label">Full Pack Generated</p>
              </div>
              <div style={{ width: 1, height: 60, background: 'rgba(201,164,53,0.15)', flexShrink: 0 }} className="hide-mobile" />
              <div>
                <div className="agents-count-number">0</div>
                <p className="agents-count-label">Prompts You Write</p>
                <p className="agents-count-sub">System handles everything</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}