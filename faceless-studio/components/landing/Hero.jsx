'use client'
import { useState, useEffect, useRef } from 'react'

const NICHES = [
  'Personal Finance India',
  'Tech Reviews Hindi',
  'Motivation Tamil',
  'Crypto & Investing',
  'Health & Fitness',
  'AI & Technology',
]

const DEMO_LINES = [
  { agent: 'Research', icon: '🔍', color: '#C9A435', text: 'Scanning 2.3M trending topics in Personal Finance India...' },
  { agent: 'Research', icon: '🔍', color: '#C9A435', text: '✓ Found: "RBI rate cut impact on home loans" — 1.8M views in 24hrs' },
  { agent: 'Research', icon: '🔍', color: '#C9A435', text: '✓ Hook identified: Loss aversion + specific number = high CTR' },
  { agent: 'Creator', icon: '✍️', color: '#4A90D9', text: 'Writing hook: "Your EMI is about to change. Here\'s by exactly how much."' },
  { agent: 'Creator', icon: '✍️', color: '#4A90D9', text: 'Building full script: Hook → Problem → Framework → CTA...' },
  { agent: 'Creator', icon: '✍️', color: '#4A90D9', text: '✓ Scene 1: Stock footage — family stressed over loan statement' },
  { agent: 'Creator', icon: '✍️', color: '#4A90D9', text: '✓ Hook psychology: Loss aversion triggers 3.2× more clicks' },
  { agent: 'Publisher', icon: '🚀', color: '#50C878', text: 'Optimising YouTube title for CTR + SEO...' },
  { agent: 'Publisher', icon: '🚀', color: '#50C878', text: '✓ Title: "RBI Cut ₹3,000 From Your EMI — But Only If You Do This"' },
  { agent: 'Publisher', icon: '🚀', color: '#50C878', text: '✓ Instagram caption ready | ✓ TikTok hook ready | ✓ 10 SEO tags' },
  { agent: 'Done', icon: '✅', color: '#C9A435', text: '🎉 Your complete content pack is ready. 7 videos planned.' },
]

const STATS = [
  { value: '2,300+', label: 'Creators using it' },
  { value: '90s', label: 'Avg generation time' },
  { value: '13', label: 'AI Agents working' },
  { value: '₹0', label: 'To start today' },
]

export default function Hero() {
  const [nicheIndex, setNicheIndex] = useState(0)
  const [displayedNiche, setDisplayedNiche] = useState('')
  const [isTyping, setIsTyping] = useState(true)
  const [demoLines, setDemoLines] = useState([])
  const [demoRunning, setDemoRunning] = useState(false)
  const [particles, setParticles] = useState([])
  const demoRef = useRef(null)

  // Niche typewriter
  useEffect(() => {
    const niche = NICHES[nicheIndex]
    let i = 0
    setDisplayedNiche('')
    setIsTyping(true)

    const typeTimer = setInterval(() => {
      if (i <= niche.length) {
        setDisplayedNiche(niche.slice(0, i))
        i++
      } else {
        clearInterval(typeTimer)
        setIsTyping(false)
        setTimeout(() => {
          setNicheIndex(prev => (prev + 1) % NICHES.length)
        }, 2200)
      }
    }, 60)

    return () => clearInterval(typeTimer)
  }, [nicheIndex])

  // Demo stream
  useEffect(() => {
    if (demoRunning) return
    setDemoRunning(true)
    setDemoLines([])

    let lineIndex = 0
    const addLine = () => {
      if (lineIndex < DEMO_LINES.length) {
        const line = DEMO_LINES[lineIndex]
if (!line) return

setDemoLines(prev => [...prev, line])
        lineIndex++
        if (demoRef.current) {
          demoRef.current.scrollTop = demoRef.current.scrollHeight
        }
        setTimeout(addLine, lineIndex < 4 ? 800 : lineIndex < 8 ? 700 : 650)
      } else {
        setTimeout(() => {
          setDemoLines([])
          setDemoRunning(false)
        }, 4000)
      }
    }

    setTimeout(addLine, 1200)
  }, [demoRunning])

  // Particles
  useEffect(() => {
    setParticles(
      Array.from({ length: 28 }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: Math.random() * 3 + 1,
        delay: Math.random() * 8,
        duration: Math.random() * 6 + 6,
        opacity: Math.random() * 0.5 + 0.1,
      }))
    )
  }, [])

  return (
    <>
      <style>{`
        .hero {
          position: relative;
          min-height: 100vh;
          background: radial-gradient(ellipse at 20% 50%, rgba(26, 38, 104, 0.6) 0%, transparent 60%),
                      radial-gradient(ellipse at 80% 20%, rgba(201, 164, 53, 0.08) 0%, transparent 50%),
                      radial-gradient(ellipse at 50% 100%, rgba(11, 19, 64, 0.8) 0%, transparent 70%),
                      var(--navy-950);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          padding: 120px clamp(1.25rem, 4vw, 2.5rem) 80px;
        }

        /* Background grid */
        .hero::before {
          content: '';
          position: absolute;
          inset: 0;
          background-image:
            linear-gradient(rgba(201, 164, 53, 0.04) 1px, transparent 1px),
            linear-gradient(90deg, rgba(201, 164, 53, 0.04) 1px, transparent 1px);
          background-size: 60px 60px;
          mask-image: radial-gradient(ellipse at center, black 20%, transparent 80%);
          pointer-events: none;
        }

        .hero-particle {
          position: absolute;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(201, 164, 53, 0.8), rgba(201, 164, 53, 0.1));
          animation: particle-drift linear infinite;
          pointer-events: none;
        }

        .hero-glow-orb {
          position: absolute;
          border-radius: 50%;
          filter: blur(80px);
          pointer-events: none;
        }

        .hero-content {
          position: relative;
          z-index: 2;
          max-width: 1200px;
          width: 100%;
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: clamp(2rem, 4vw, 4rem);
          align-items: center;
        }

        .hero-left {
          display: flex;
          flex-direction: column;
          gap: 1.75rem;
        }

        .hero-badge {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 7px 16px;
          background: rgba(201, 164, 53, 0.1);
          border: 1px solid rgba(201, 164, 53, 0.2);
          border-radius: 100px;
          color: var(--gold-300);
          font-size: 0.8rem;
          font-weight: 600;
          letter-spacing: 0.05em;
          text-transform: uppercase;
          font-family: var(--font-display);
          width: fit-content;
          animation: fadeUp 0.6s ease both;
        }

        .hero-badge-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: var(--gold-400);
          animation: pulse-gold 2s ease infinite;
        }

        .hero-title {
          font-family: var(--font-display);
          font-size: clamp(2.6rem, 5vw, 4rem);
          font-weight: 800;
          line-height: 1.1;
          letter-spacing: -0.03em;
          color: var(--white);
          animation: fadeUp 0.7s ease 0.1s both;
        }

        .hero-title .line-gold {
          background: linear-gradient(135deg, var(--gold-300) 0%, var(--gold-500) 50%, var(--gold-300) 100%);
          background-size: 200% auto;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          animation: shimmer 4s linear infinite;
        }

        .hero-niche-box {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          background: rgba(201, 164, 53, 0.07);
          border: 1px solid rgba(201, 164, 53, 0.18);
          border-radius: 10px;
          padding: 10px 16px;
          font-family: var(--font-mono);
          font-size: 0.9rem;
          color: var(--gold-300);
          margin-top: 0.5rem;
          width: fit-content;
          min-width: 280px;
          animation: fadeUp 0.7s ease 0.15s both;
        }

        .niche-label {
          color: var(--silver-dim);
          font-size: 0.75rem;
          flex-shrink: 0;
        }

        .niche-cursor {
          display: inline-block;
          width: 2px;
          height: 16px;
          background: var(--gold-400);
          margin-left: 2px;
          animation: blink 1s step-end infinite;
          vertical-align: middle;
        }

        .hero-desc {
          font-size: 1.1rem;
          color: var(--silver);
          line-height: 1.7;
          max-width: 500px;
          animation: fadeUp 0.7s ease 0.2s both;
        }

        .hero-desc strong {
          color: var(--white);
          font-weight: 600;
        }

        .hero-actions {
          display: flex;
          align-items: center;
          gap: 1rem;
          flex-wrap: wrap;
          animation: fadeUp 0.7s ease 0.3s both;
        }

        .hero-stats {
          display: flex;
          gap: 2rem;
          padding-top: 0.5rem;
          animation: fadeUp 0.7s ease 0.4s both;
        }

        .hero-stat-item {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .hero-stat-value {
          font-family: var(--font-display);
          font-size: 1.3rem;
          font-weight: 700;
          color: var(--gold-300);
        }

        .hero-stat-label {
          font-size: 0.75rem;
          color: var(--silver-dim);
          font-weight: 500;
        }

        /* DEMO PANEL */
        .hero-demo {
          animation: fadeUp 0.8s ease 0.2s both;
        }

        .demo-panel {
          background: rgba(6, 11, 40, 0.85);
          border: 1px solid rgba(201, 164, 53, 0.2);
          border-radius: 20px;
          overflow: hidden;
          box-shadow:
            0 0 0 1px rgba(201, 164, 53, 0.05),
            0 24px 80px rgba(4, 8, 24, 0.7),
            inset 0 1px 0 rgba(201, 164, 53, 0.1);
          backdrop-filter: blur(20px);
        }

        .demo-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 14px 18px;
          border-bottom: 1px solid rgba(201, 164, 53, 0.1);
          background: rgba(11, 19, 64, 0.6);
        }

        .demo-dots {
          display: flex;
          gap: 7px;
        }

        .demo-dot {
          width: 11px;
          height: 11px;
          border-radius: 50%;
        }

        .demo-title {
          font-family: var(--font-mono);
          font-size: 0.78rem;
          color: var(--silver-dim);
          letter-spacing: 0.05em;
        }

        .demo-live {
          display: flex;
          align-items: center;
          gap: 5px;
          font-size: 0.72rem;
          color: #50C878;
          font-weight: 600;
          font-family: var(--font-mono);
        }

        .demo-live-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #50C878;
          animation: pulse-gold 1.5s ease infinite;
        }

        .demo-body {
          padding: 16px;
          min-height: 320px;
          max-height: 320px;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          gap: 8px;
          scroll-behavior: smooth;
        }

        .demo-body::-webkit-scrollbar { width: 3px; }
        .demo-body::-webkit-scrollbar-thumb { background: rgba(201,164,53,0.3); border-radius: 2px; }

        .demo-line {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          padding: 8px 12px;
          border-radius: 8px;
          background: rgba(11, 19, 64, 0.5);
          border: 1px solid rgba(200, 208, 232, 0.05);
          animation: stream-in 0.3s ease both;
        }

        .demo-line-agent {
          font-size: 0.68rem;
          font-weight: 700;
          font-family: var(--font-mono);
          letter-spacing: 0.06em;
          text-transform: uppercase;
          flex-shrink: 0;
          padding: 2px 7px;
          border-radius: 4px;
          background: rgba(255,255,255,0.05);
          margin-top: 1px;
        }

        .demo-line-text {
          font-family: var(--font-mono);
          font-size: 0.8rem;
          color: rgba(200, 208, 232, 0.85);
          line-height: 1.5;
        }

        .demo-line-text.done {
          color: var(--gold-300);
          font-weight: 500;
        }

        .demo-empty {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 100%;
          gap: 10px;
          opacity: 0.4;
        }

        .demo-empty-icon {
          font-size: 2.5rem;
          animation: float 3s ease infinite;
        }

        .demo-empty-text {
          font-family: var(--font-mono);
          font-size: 0.8rem;
          color: var(--silver-dim);
        }

        .demo-footer {
          padding: 12px 18px;
          border-top: 1px solid rgba(201, 164, 53, 0.08);
          display: flex;
          align-items: center;
          justify-content: space-between;
          background: rgba(11, 19, 64, 0.4);
        }

        .demo-agents-active {
          display: flex;
          gap: 6px;
        }

        .demo-agent-pill {
          display: flex;
          align-items: center;
          gap: 5px;
          padding: 4px 10px;
          border-radius: 100px;
          font-size: 0.72rem;
          font-weight: 600;
          font-family: var(--font-mono);
          border: 1px solid transparent;
          transition: all 0.4s ease;
        }

        .demo-agent-pill.active-research {
          background: rgba(201, 164, 53, 0.12);
          border-color: rgba(201, 164, 53, 0.3);
          color: #E8CA70;
        }

        .demo-agent-pill.active-creator {
          background: rgba(74, 144, 217, 0.12);
          border-color: rgba(74, 144, 217, 0.3);
          color: #7DB8F0;
        }

        .demo-agent-pill.active-publisher {
          background: rgba(80, 200, 120, 0.12);
          border-color: rgba(80, 200, 120, 0.3);
          color: #7FD8A0;
        }

        .demo-agent-pill.inactive {
          background: rgba(255,255,255,0.03);
          border-color: rgba(255,255,255,0.05);
          color: var(--silver-dim);
        }

        .demo-timer {
          font-family: var(--font-mono);
          font-size: 0.72rem;
          color: var(--silver-dim);
        }

        /* Scroll indicator */
        .scroll-indicator {
          position: absolute;
          bottom: 2rem;
          left: 50%;
          transform: translateX(-50%);
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
          animation: fadeIn 1s ease 1s both;
          z-index: 2;
        }

        .scroll-mouse {
          width: 24px;
          height: 38px;
          border: 2px solid rgba(201, 164, 53, 0.3);
          border-radius: 12px;
          position: relative;
        }

        .scroll-wheel {
          width: 3px;
          height: 8px;
          background: var(--gold-400);
          border-radius: 2px;
          position: absolute;
          top: 6px;
          left: 50%;
          transform: translateX(-50%);
          animation: float 1.5s ease infinite;
        }

        .scroll-text {
          font-size: 0.7rem;
          color: rgba(200,208,232,0.4);
          letter-spacing: 0.1em;
          text-transform: uppercase;
          font-family: var(--font-display);
          font-weight: 600;
        }

        @media (max-width: 900px) {
          .hero-content {
            grid-template-columns: 1fr;
          }
          .hero-left { text-align: center; align-items: center; }
          .hero-stats { justify-content: center; }
          .hero-actions { justify-content: center; }
        }

        @media (max-width: 480px) {
          .hero-stats { gap: 1.25rem; }
          .hero-title { font-size: 2.2rem; }
        }
      `}</style>

      <section className="hero" id="hero">
        {/* Background glow orbs */}
        <div className="hero-glow-orb" style={{
          width: 600, height: 600,
          background: 'radial-gradient(circle, rgba(26,38,104,0.5), transparent)',
          top: -200, left: -200,
        }} />
        <div className="hero-glow-orb" style={{
          width: 400, height: 400,
          background: 'radial-gradient(circle, rgba(201,164,53,0.06), transparent)',
          top: 100, right: -100,
        }} />

        {/* Floating particles */}
        {particles.map(p => (
          <div
            key={p.id}
            className="hero-particle"
            style={{
              left: `${p.x}%`,
              top: `${p.y}%`,
              width: p.size,
              height: p.size,
              opacity: p.opacity,
              animationDelay: `${p.delay}s`,
              animationDuration: `${p.duration}s`,
            }}
          />
        ))}

        <div className="hero-content">
          {/* LEFT */}
          <div className="hero-left">
            <div className="hero-badge">
              <span className="hero-badge-dot" />
              India's First Faceless YouTube OS
            </div>

            <h1 className="hero-title">
              Your next 7 videos.<br />
              <span className="line-gold">Written. Directed.</span><br />
              Ready to publish.
            </h1>

            <div className="hero-niche-box">
              <span className="niche-label">Niche →</span>
              <span style={{ color: 'var(--gold-300)' }}>{displayedNiche}</span>
              {isTyping && <span className="niche-cursor" />}
            </div>

            <p className="hero-desc">
              Not a prompt box. Not a caption tool.<br />
              A <strong>complete AI operating system</strong> that researches trends,
              writes scripts with scene-by-scene direction, explains hook psychology,
              and hands you a 7-day posting plan — <strong>in 90 seconds.</strong>
            </p>

            <div className="hero-actions">
              <a href="/generate" className="btn btn-gold btn-lg">
                ⚡ Generate Free
              </a>
              <a href="#how-it-works" className="btn btn-outline">
                ▶ See How It Works
              </a>
            </div>

            <div className="hero-stats">
              {STATS.map(s => (
                <div key={s.label} className="hero-stat-item">
                  <span className="hero-stat-value">{s.value}</span>
                  <span className="hero-stat-label">{s.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* RIGHT — LIVE DEMO */}
          <div className="hero-demo">
            <div className="demo-panel">
              <div className="demo-header">
                <div className="demo-dots">
                  <div className="demo-dot" style={{ background: '#FF5F57' }} />
                  <div className="demo-dot" style={{ background: '#FFBD2E' }} />
                  <div className="demo-dot" style={{ background: '#28CA41' }} />
                </div>
                <span className="demo-title">faceless-studio / ai-pipeline</span>
                <span className="demo-live">
                  <span className="demo-live-dot" />
                  LIVE
                </span>
              </div>

              <div className="demo-body" ref={demoRef}>
                {demoLines.length === 0 ? (
                  <div className="demo-empty">
                    <div className="demo-empty-icon">🤖</div>
                    <p className="demo-empty-text">Initialising agents...</p>
                  </div>
                ) : (
                  demoLines.map((line, i) => (
                    <div key={i} className="demo-line">
                      <span
                        className="demo-line-agent"
                        style={{ color: line.color }}
                      >
                        {line.icon} {line.agent}
                      </span>
                      <span className={`demo-line-text ${line.agent === 'Done' ? 'done' : ''}`}>
                        {line.text}
                      </span>
                    </div>
                  ))
                )}
              </div>

              <div className="demo-footer">
                <div className="demo-agents-active">
                  {[
                    { name: 'Research', cls: demoLines.some(l => l.agent === 'Research') ? 'active-research' : 'inactive' },
                    { name: 'Creator', cls: demoLines.some(l => l.agent === 'Creator') ? 'active-creator' : 'inactive' },
                    { name: 'Publisher', cls: demoLines.some(l => l.agent === 'Publisher') ? 'active-publisher' : 'inactive' },
                  ].map(a => (
                    <span key={a.name} className={`demo-agent-pill ${a.cls}`}>
                      {a.name}
                    </span>
                  ))}
                </div>
                <span className="demo-timer">
                  {demoLines.length > 0 && demoLines[demoLines.length - 1].agent !== 'Done'
                    ? `${demoLines.length * 0.8}s elapsed`
                    : demoLines.some(l => l.agent === 'Done') ? '✓ 8.8s total' : '--'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="scroll-indicator">
          <div className="scroll-mouse">
            <div className="scroll-wheel" />
          </div>
          <span className="scroll-text">Scroll</span>
        </div>
      </section>
    </>
  )
}