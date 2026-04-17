'use client'
import { useEffect, useRef, useState } from 'react'

const TIERS = [
  {
    id: 'core',
    name: 'Core Agents',
    plan: 'Free',
    planColor: '#059669',
    planBg: '#ECFDF5',
    planBorder: '#6EE7B7',
    color: '#D4A847',
    agents: [
      { icon: '🔍', name: 'Research Agent', tags: ['Trend Analysis', 'Gap Finding', 'Hook Psychology'], desc: 'Scans millions of trending topics, identifies competitor gaps, and selects the highest-virality angle for your niche.' },
      { icon: '✍️', name: 'Creator Agent', tags: ['Full Script', 'Scene Breakdown', 'Voice Direction'], desc: 'Writes every word of your production script with scene-by-scene direction, B-roll search terms, and voiceover cues.' },
      { icon: '🚀', name: 'Publisher Agent', tags: ['YouTube SEO', 'Social Captions', '7-Day Plan'], desc: 'Generates YouTube titles, descriptions, tags, Instagram captions, TikTok hooks, and a complete 7-day sprint calendar.' },
    ]
  },
  {
    id: 'pro',
    name: 'Pro Agents',
    plan: 'Pro',
    planColor: '#2563EB',
    planBg: '#EFF6FF',
    planBorder: '#BFDBFE',
    color: '#2563EB',
    agents: [
      { icon: '📡', name: 'Trend Spy', tags: ['48hr Brief', 'Daily Trends', 'Niche-specific'], desc: 'Morning brief: what\'s blowing up in your niche in the last 48 hours with ready-to-use content angles.' },
      { icon: '🥊', name: 'Title Battle', tags: ['10 Variants', 'CTR Scoring', 'A/B Testing'], desc: '10 title variations ranked by CTR psychology, SEO strength, and emotional pull — with full reasoning.' },
      { icon: '🖼️', name: 'Thumbnail Brain', tags: ['Color Psychology', 'Layout Guide', 'AI Prompt'], desc: 'Complete thumbnail brief: colors, layout, text overlay, expression — and an AI image prompt ready to use.' },
      { icon: '⚡', name: 'Hook Upgrader', tags: ['5 Rewrites', 'Psychology Tags', 'Trigger Analysis'], desc: 'Paste any weak hook. Get 5 rewrites using different psychological triggers with explained reasoning.' },
      { icon: '💬', name: 'Comment Reply', tags: ['Algorithm Signal', 'Engagement', 'On-brand Voice'], desc: 'Paste top comments. Get perfectly crafted replies that re-engage viewers and signal the algorithm.' },
    ]
  },
  {
    id: 'studio',
    name: 'Studio Agents',
    plan: 'Studio',
    planColor: '#7C3AED',
    planBg: '#F5F3FF',
    planBorder: '#DDD6FE',
    color: '#7C3AED',
    agents: [
      { icon: '🔬', name: 'Competitor Autopsy', tags: ['Hook Patterns', 'Title Formula', 'Gap Analysis'], desc: 'Dissects any competitor channel — hook patterns, title formulas, thumbnail codes, upload schedule.' },
      { icon: '🔄', name: 'Viral Decoder', tags: ['Viral Formula', 'Niche Adaptation', 'Replication Template'], desc: 'Decode why any viral video worked. Extract the exact formula to replicate it in your niche.' },
      { icon: '📊', name: 'Channel Strategy', tags: ['90-Day Plan', 'Content Pillars', 'Growth Strategy'], desc: '90-day content strategy, upload cadence, what to own, what to avoid — based on 5 intake answers.' },
      { icon: '🌏', name: 'Script Localiser', tags: ['Hindi', 'Tamil', 'Telugu', 'Kannada'], desc: 'Rewrite scripts in Hindi, Tamil, Telugu, Kannada — culturally adapted, not just translated.' },
      { icon: '💰', name: 'Monetisation Coach', tags: ['CPM Estimates', 'Affiliate Maps', 'Sponsor Pitch'], desc: 'Niche-specific revenue roadmap: AdSense CPM, affiliate programs, sponsor rates and pitch email templates.' },
    ]
  },
]

export default function AgentsSection() {
  const [visible, setVisible] = useState(false)
  const [activeTier, setActiveTier] = useState('core')
  const ref = useRef(null)

  const tier = TIERS.find(t => t.id === activeTier)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true) },
      { threshold: 0.1 }
    )
    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [])

  return (
    <>
      <style>{`
        .agents-section {
          padding: 120px 0;
          background: #ffffff;
          overflow: hidden;
        }

        .agents-inner {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 24px;
        }

        .agents-header {
          text-align: center;
          margin-bottom: 60px;
        }

        .agents-eyebrow {
          font-family: 'JetBrains Mono', monospace;
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: #6B7280;
          margin-bottom: 20px;
          display: block;
        }

        .agents-title {
          font-family: 'Bricolage Grotesque', sans-serif;
          font-size: clamp(36px, 5vw, 58px);
          font-weight: 800;
          color: #0A0A0A;
          letter-spacing: -0.04em;
          line-height: 1.08;
          margin-bottom: 20px;
        }

        .agents-sub {
          font-family: 'DM Sans', sans-serif;
          font-size: 18px;
          color: #374151;
          max-width: 520px;
          margin: 0 auto;
          line-height: 1.7;
        }

        /* Tier tabs */
        .tier-tabs {
          display: flex;
          justify-content: center;
          gap: 10px;
          margin-bottom: 48px;
          flex-wrap: wrap;
        }

        .tier-tab {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 22px;
          border-radius: 100px;
          border: 1.5px solid #E5E7EB;
          background: #ffffff;
          font-family: 'DM Sans', sans-serif;
          font-size: 14px;
          font-weight: 600;
          color: #374151;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .tier-tab:hover {
          border-color: #0A0A0A;
          color: #0A0A0A;
        }

        .tier-tab.active {
          background: #0A0A0A;
          border-color: #0A0A0A;
          color: #ffffff;
        }

        .tier-plan-chip {
          padding: 2px 8px;
          border-radius: 100px;
          font-family: 'JetBrains Mono', monospace;
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.04em;
        }

        .tier-tab.active .tier-plan-chip {
          background: rgba(255,255,255,0.15);
          color: rgba(255,255,255,0.8);
        }

        /* Agent grid */
        .agents-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 18px;
          margin-bottom: 60px;
        }

        .agent-card {
          background: #ffffff;
          border: 1.5px solid #E5E7EB;
          border-radius: 16px;
          padding: 24px;
          cursor: default;
          transition: all 0.3s ease;
          position: relative;
          overflow: hidden;
          opacity: 0;
          transform: translateY(20px);
          animation: agentIn 0.5s ease forwards;
        }

        @keyframes agentIn {
          to { opacity: 1; transform: translateY(0); }
        }

        .agent-card::before {
          content: '';
          position: absolute;
          top: 0; left: 0; right: 0;
          height: 2px;
          background: var(--tier-color);
          transform: scaleX(0);
          transform-origin: left;
          transition: transform 0.3s ease;
        }

        .agent-card:hover {
          border-color: var(--tier-color);
          transform: translateY(-3px);
          box-shadow: 0 12px 40px rgba(0,0,0,0.08);
        }

        .agent-card:hover::before { transform: scaleX(1); }

        .agent-icon {
          font-size: 24px;
          margin-bottom: 12px;
          display: block;
        }

        .agent-name {
          font-family: 'Bricolage Grotesque', sans-serif;
          font-size: 17px;
          font-weight: 700;
          color: #0A0A0A;
          margin-bottom: 8px;
          letter-spacing: -0.02em;
        }

        .agent-desc {
          font-family: 'DM Sans', sans-serif;
          font-size: 13px;
          color: #374151;
          line-height: 1.65;
          margin-bottom: 14px;
        }

        .agent-tags {
          display: flex;
          flex-wrap: wrap;
          gap: 5px;
        }

        .agent-tag {
          padding: 3px 10px;
          border-radius: 100px;
          font-family: 'JetBrains Mono', monospace;
          font-size: 10px;
          font-weight: 600;
          background: var(--tier-bg);
          color: var(--tier-color);
          border: 1px solid var(--tier-border);
          letter-spacing: 0.02em;
        }

        /* Count banner */
        .agents-count-bar {
          background: #0A0A0A;
          border-radius: 16px;
          padding: 36px 48px;
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 0;
          opacity: 0;
          transform: translateY(20px);
          transition: all 0.7s ease 0.5s;
          position: relative;
          overflow: hidden;
        }

        .agents-count-bar.visible {
          opacity: 1;
          transform: translateY(0);
        }

        .agents-count-bar::before {
          content: '';
          position: absolute;
          top: -100px;
          left: 50%;
          transform: translateX(-50%);
          width: 600px;
          height: 200px;
          background: radial-gradient(circle, rgba(212,168,71,0.1) 0%, transparent 70%);
          pointer-events: none;
        }

        .count-divider {
          width: 1px;
          background: rgba(255,255,255,0.08);
          margin: 0;
        }

        .count-item {
          text-align: center;
          padding: 0 24px;
          position: relative;
        }

        .count-item:not(:last-child)::after {
          content: '';
          position: absolute;
          right: 0;
          top: 15%;
          bottom: 15%;
          width: 1px;
          background: rgba(255,255,255,0.08);
        }

        .count-num {
          font-family: 'Bricolage Grotesque', sans-serif;
          font-size: clamp(36px, 5vw, 54px);
          font-weight: 800;
          color: #D4A847;
          letter-spacing: -0.04em;
          line-height: 1;
          margin-bottom: 8px;
          display: block;
        }

        .count-label {
          font-family: 'DM Sans', sans-serif;
          font-size: 14px;
          font-weight: 600;
          color: rgba(255,255,255,0.9);
          margin-bottom: 4px;
        }

        .count-sub {
          font-family: 'JetBrains Mono', monospace;
          font-size: 10px;
          color: rgba(255,255,255,0.4);
          letter-spacing: 0.04em;
          text-transform: uppercase;
        }

        @media (max-width: 768px) {
          .agents-count-bar { 
            grid-template-columns: repeat(2, 1fr);
            gap: 24px;
            padding: 28px 24px;
          }
          .count-item::after { display: none; }
          .count-item { border-bottom: 1px solid rgba(255,255,255,0.07); padding-bottom: 20px; }
          .count-item:nth-child(n+3) { border-bottom: none; }
          .agents-grid { grid-template-columns: 1fr; }
          .agents-section { padding: 80px 0; }
        }
      `}</style>

      <section className="agents-section" id="agents" ref={ref}>
        <div className="agents-inner">
          <div className="agents-header">
            <span className="agents-eyebrow">The Agent Ecosystem</span>
            <h2 className="agents-title">
              13 specialised agents.<br />
              One operating system.
            </h2>
            <p className="agents-sub">
              Not a single AI doing everything. A structured pipeline of specialists — each built for exactly one job.
            </p>
          </div>

          {/* Tier tabs */}
          <div className="tier-tabs">
            {TIERS.map(t => (
              <button
                key={t.id}
                className={`tier-tab ${activeTier === t.id ? 'active' : ''}`}
                onClick={() => setActiveTier(t.id)}
              >
                {t.name}
                <span
                  className="tier-plan-chip"
                  style={activeTier !== t.id ? {
                    background: t.planBg,
                    color: t.planColor,
                    border: `1px solid ${t.planBorder}`,
                  } : {}}
                >
                  {t.plan}
                </span>
              </button>
            ))}
          </div>

          {/* Agent grid */}
          <div className="agents-grid" key={activeTier}>
            {tier?.agents.map((agent, i) => (
              <div
                key={agent.name}
                className="agent-card"
                style={{
                  '--tier-color': tier.color,
                  '--tier-bg': tier.agents[0] ? TIERS.find(t => t.id === activeTier)?.plan === 'Free' ? '#FFF9EB' : TIERS.find(t => t.id === activeTier)?.plan === 'Pro' ? '#EFF6FF' : '#F5F3FF' : '#FFF9EB',
                  '--tier-border': tier.agents[0] ? TIERS.find(t => t.id === activeTier)?.planBorder : '#FDE68A',
                  animationDelay: `${i * 0.06}s`,
                }}
              >
                <span className="agent-icon">{agent.icon}</span>
                <h3 className="agent-name">{agent.name}</h3>
                <p className="agent-desc">{agent.desc}</p>
                <div className="agent-tags">
                  {agent.tags.map(tag => (
                    <span key={tag} className="agent-tag">{tag}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Count bar */}
          <div className={`agents-count-bar ${visible ? 'visible' : ''}`}>
            {[
              { num: '13', label: 'Total AI Agents', sub: 'Across 3 tiers' },
              { num: '90s', label: 'Avg Generation Time', sub: 'Full content pack' },
              { num: '0', label: 'Prompts Required', sub: 'System auto-chains' },
              { num: '7', label: 'Days Planned', sub: 'Every generation' },
            ].map((c, i) => (
              <div key={i} className="count-item">
                <span className="count-num">{c.num}</span>
                <div className="count-label">{c.label}</div>
                <div className="count-sub">{c.sub}</div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  )
}