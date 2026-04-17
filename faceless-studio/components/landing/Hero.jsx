'use client'
import { useState, useEffect, useRef } from 'react'

const ROTATING_NICHES = [
  'Personal Finance India',
  'AI Tools for Creators',
  'Tech Reviews Hindi',
  'Fitness & Wellness',
  'Crypto & Investing',
  'Motivation Tamil',
  'Business Strategy',
  'Food & Recipes',
]

const STATS = [
  { number: '90s', label: 'Full content pack', sublabel: 'Research → Script → SEO' },
  { number: '13', label: 'AI Agents', sublabel: 'Chained. Specialised. Precise.' },
  { number: '3', label: 'Inputs only', sublabel: 'Niche. Platform. Language.' },
  { number: '0', label: 'Prompts written', sublabel: 'System handles everything' },
]

const PIPELINE_STEPS = [
  { step: '01', label: 'Research Agent', color: '#D4A847', desc: 'Scans 2.3M trending topics, finds viral angles' },
  { step: '02', label: 'Creator Agent', color: '#2563EB', desc: 'Writes word-for-word production-ready script' },
  { step: '03', label: 'Publisher Agent', color: '#059669', desc: 'YouTube SEO, captions, 7-day sprint plan' },
]

export default function Hero() {
  const [nicheIndex, setNicheIndex] = useState(0)
  const [displayed, setDisplayed] = useState('')
  const [isErasing, setIsErasing] = useState(false)
  const [charIndex, setCharIndex] = useState(0)
  const [pipelineActive, setPipelineActive] = useState(0)
  const [hasAnimated, setHasAnimated] = useState(false)
  const heroRef = useRef(null)
  const timeoutRef = useRef(null)

  // Typewriter effect
  useEffect(() => {
    const currentNiche = ROTATING_NICHES[nicheIndex]

    if (!isErasing && charIndex <= currentNiche.length) {
      timeoutRef.current = setTimeout(() => {
        setDisplayed(currentNiche.slice(0, charIndex))
        setCharIndex(c => c + 1)
      }, 65)
    } else if (!isErasing && charIndex > currentNiche.length) {
      timeoutRef.current = setTimeout(() => setIsErasing(true), 2400)
    } else if (isErasing && charIndex > 0) {
      timeoutRef.current = setTimeout(() => {
        setDisplayed(currentNiche.slice(0, charIndex - 1))
        setCharIndex(c => c - 1)
      }, 35)
    } else if (isErasing && charIndex === 0) {
      setIsErasing(false)
      setNicheIndex(n => (n + 1) % ROTATING_NICHES.length)
    }

    return () => clearTimeout(timeoutRef.current)
  }, [charIndex, isErasing, nicheIndex])

  // Pipeline animation
  useEffect(() => {
    const interval = setInterval(() => {
      setPipelineActive(prev => (prev + 1) % 3)
    }, 1800)
    return () => clearInterval(interval)
  }, [])

  // Scroll-triggered entrance
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated) {
          setHasAnimated(true)
        }
      },
      { threshold: 0.1 }
    )
    if (heroRef.current) observer.observe(heroRef.current)
    return () => observer.disconnect()
  }, [hasAnimated])

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,300;12..96,400;12..96,500;12..96,600;12..96,700;12..96,800&family=DM+Sans:wght@300;400;500;600&family=JetBrains+Mono:wght@400;500;600&display=swap');

        .hero-wrap {
          min-height: 100vh;
          background: #ffffff;
          position: relative;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          padding-top: 80px;
        }

        /* Geometric noise texture overlay */
        .hero-noise {
          position: absolute;
          inset: 0;
          background-image: 
            radial-gradient(circle at 20% 20%, rgba(212, 168, 71, 0.06) 0%, transparent 50%),
            radial-gradient(circle at 80% 80%, rgba(37, 99, 235, 0.04) 0%, transparent 50%),
            radial-gradient(circle at 60% 10%, rgba(5, 150, 105, 0.03) 0%, transparent 40%);
          pointer-events: none;
          z-index: 0;
        }

        /* Dot grid */
        .hero-grid {
          position: absolute;
          inset: 0;
          background-image: radial-gradient(circle, rgba(0,0,0,0.07) 1px, transparent 1px);
          background-size: 32px 32px;
          pointer-events: none;
          z-index: 0;
          mask-image: radial-gradient(ellipse at center, black 30%, transparent 80%);
        }

        .hero-inner {
          position: relative;
          z-index: 1;
          max-width: 1200px;
          margin: 0 auto;
          padding: 80px 24px 60px;
          width: 100%;
        }

        /* Eyebrow badge */
        .hero-badge {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: #0A0A0A;
          color: #ffffff;
          padding: 6px 16px;
          border-radius: 100px;
          font-family: 'JetBrains Mono', monospace;
          font-size: 11px;
          font-weight: 500;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          margin-bottom: 32px;
          opacity: 0;
          transform: translateY(20px);
          animation: heroFadeUp 0.7s ease 0.1s forwards;
        }

        .hero-badge-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #D4A847;
          animation: pulse 1.5s ease infinite;
        }

        /* Main headline */
        .hero-h1 {
          font-family: 'Bricolage Grotesque', sans-serif;
          font-size: clamp(44px, 7.5vw, 88px);
          font-weight: 800;
          line-height: 1.0;
          letter-spacing: -0.04em;
          color: #0A0A0A;
          margin-bottom: 12px;
          max-width: 900px;
          opacity: 0;
          transform: translateY(30px);
          animation: heroFadeUp 0.8s ease 0.2s forwards;
        }

        .hero-h1 .accent-gold {
          color: #D4A847;
          position: relative;
          display: inline-block;
        }

        .hero-h1 .accent-gold::after {
          content: '';
          position: absolute;
          bottom: -4px;
          left: 0;
          right: 0;
          height: 3px;
          background: #D4A847;
          border-radius: 2px;
          transform: scaleX(0);
          transform-origin: left;
          animation: underlineReveal 0.8s ease 1.0s forwards;
        }

        /* Typewriter niche */
        .hero-niche-line {
          font-family: 'Bricolage Grotesque', sans-serif;
          font-size: clamp(44px, 7.5vw, 88px);
          font-weight: 800;
          line-height: 1.0;
          letter-spacing: -0.04em;
          color: #0A0A0A;
          margin-bottom: 36px;
          display: flex;
          align-items: center;
          gap: 0;
          opacity: 0;
          transform: translateY(30px);
          animation: heroFadeUp 0.8s ease 0.35s forwards;
        }

        .hero-niche-prefix {
          color: #6B7280;
          font-weight: 600;
        }

        .hero-typewriter {
          color: #2563EB;
          border-right: 3px solid #2563EB;
          padding-right: 2px;
          animation: cursorBlink 0.8s step-end infinite;
          min-width: 4px;
        }

        /* Sub headline */
        .hero-sub {
          font-family: 'DM Sans', sans-serif;
          font-size: clamp(16px, 2.2vw, 20px);
          color: #374151;
          line-height: 1.7;
          max-width: 580px;
          font-weight: 400;
          margin-bottom: 48px;
          opacity: 0;
          transform: translateY(20px);
          animation: heroFadeUp 0.7s ease 0.5s forwards;
        }

        /* CTA buttons */
        .hero-ctas {
          display: flex;
          align-items: center;
          gap: 16px;
          flex-wrap: wrap;
          opacity: 0;
          transform: translateY(20px);
          animation: heroFadeUp 0.7s ease 0.65s forwards;
          margin-bottom: 72px;
        }

        .cta-primary {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          background: #0A0A0A;
          color: #ffffff;
          padding: 16px 32px;
          border-radius: 12px;
          font-family: 'Bricolage Grotesque', sans-serif;
          font-size: 16px;
          font-weight: 700;
          text-decoration: none;
          transition: all 0.25s ease;
          letter-spacing: -0.01em;
          position: relative;
          overflow: hidden;
        }

        .cta-primary::before {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, #D4A847, #E8CA70);
          opacity: 0;
          transition: opacity 0.25s ease;
        }

        .cta-primary:hover::before { opacity: 1; }
        .cta-primary:hover { color: #0A0A0A; transform: translateY(-2px); box-shadow: 0 12px 40px rgba(212,168,71,0.35); }

        .cta-primary span { position: relative; z-index: 1; }

        .cta-arrow {
          position: relative;
          z-index: 1;
          transition: transform 0.25s ease;
          font-size: 20px;
        }
        .cta-primary:hover .cta-arrow { transform: translateX(4px); }

        .cta-secondary {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          color: #0A0A0A;
          font-family: 'DM Sans', sans-serif;
          font-size: 15px;
          font-weight: 500;
          text-decoration: none;
          padding: 16px 20px;
          border-radius: 12px;
          border: 1.5px solid #E5E7EB;
          transition: all 0.2s ease;
        }

        .cta-secondary:hover {
          border-color: #0A0A0A;
          background: #F9FAFB;
          transform: translateY(-1px);
        }

        /* Social proof trust bar */
        .hero-trust {
          display: flex;
          align-items: center;
          gap: 8px;
          opacity: 0;
          animation: heroFadeUp 0.6s ease 0.8s forwards;
          margin-bottom: 80px;
        }

        .trust-avatars {
          display: flex;
        }

        .trust-avatar {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          border: 2px solid #ffffff;
          margin-left: -8px;
          font-size: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          color: #ffffff;
        }

        .trust-text {
          font-family: 'DM Sans', sans-serif;
          font-size: 14px;
          color: #374151;
          font-weight: 400;
        }

        .trust-text strong {
          color: #0A0A0A;
          font-weight: 600;
        }

        .trust-stars {
          display: flex;
          gap: 1px;
          margin-left: 4px;
        }

        /* Pipeline visual */
        .hero-pipeline {
          background: #0A0A0A;
          border-radius: 20px;
          padding: 32px;
          margin-bottom: 80px;
          opacity: 0;
          transform: translateY(30px);
          animation: heroFadeUp 0.9s ease 0.9s forwards;
          position: relative;
          overflow: hidden;
        }

        .pipeline-grid-bg {
          position: absolute;
          inset: 0;
          background-image:
            linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px);
          background-size: 40px 40px;
          border-radius: 20px;
          pointer-events: none;
        }

        .pipeline-label {
          font-family: 'JetBrains Mono', monospace;
          font-size: 10px;
          color: rgba(255,255,255,0.4);
          text-transform: uppercase;
          letter-spacing: 0.12em;
          margin-bottom: 24px;
          position: relative;
        }

        .pipeline-steps {
          display: grid;
          grid-template-columns: 1fr auto 1fr auto 1fr;
          gap: 0;
          align-items: center;
          position: relative;
        }

        .pipeline-step {
          padding: 20px;
          border-radius: 12px;
          border: 1px solid rgba(255,255,255,0.08);
          background: rgba(255,255,255,0.03);
          transition: all 0.5s ease;
          position: relative;
          overflow: hidden;
        }

        .pipeline-step.active {
          border-color: var(--step-color);
          background: rgba(255,255,255,0.07);
          box-shadow: 0 0 40px color-mix(in srgb, var(--step-color) 15%, transparent);
        }

        .pipeline-step.active::before {
          content: '';
          position: absolute;
          top: 0; left: 0; right: 0;
          height: 2px;
          background: var(--step-color);
          animation: stepLine 1.8s ease infinite;
        }

        .step-num {
          font-family: 'JetBrains Mono', monospace;
          font-size: 11px;
          font-weight: 600;
          color: rgba(255,255,255,0.3);
          margin-bottom: 10px;
          letter-spacing: 0.06em;
          transition: color 0.4s ease;
        }

        .pipeline-step.active .step-num { color: var(--step-color); }

        .step-label {
          font-family: 'Bricolage Grotesque', sans-serif;
          font-size: 15px;
          font-weight: 700;
          color: #ffffff;
          margin-bottom: 6px;
          letter-spacing: -0.01em;
        }

        .step-desc {
          font-family: 'DM Sans', sans-serif;
          font-size: 12px;
          color: rgba(255,255,255,0.5);
          line-height: 1.5;
          transition: color 0.4s ease;
        }

        .pipeline-step.active .step-desc { color: rgba(255,255,255,0.75); }

        .pipeline-arrow {
          padding: 0 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .pipeline-arrow svg {
          opacity: 0.3;
          transition: opacity 0.4s ease;
        }

        /* Stats row */
        .hero-stats {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 1px;
          background: #E5E7EB;
          border: 1px solid #E5E7EB;
          border-radius: 16px;
          overflow: hidden;
          opacity: 0;
          transform: translateY(20px);
          animation: heroFadeUp 0.8s ease 1.1s forwards;
        }

        .stat-item {
          background: #ffffff;
          padding: 32px 24px;
          text-align: center;
          transition: background 0.2s ease;
        }

        .stat-item:hover { background: #F9FAFB; }

        .stat-number {
          font-family: 'Bricolage Grotesque', sans-serif;
          font-size: clamp(36px, 5vw, 54px);
          font-weight: 800;
          color: #0A0A0A;
          letter-spacing: -0.04em;
          line-height: 1;
          margin-bottom: 8px;
        }

        .stat-label {
          font-family: 'DM Sans', sans-serif;
          font-size: 14px;
          font-weight: 600;
          color: #111827;
          margin-bottom: 4px;
        }

        .stat-sublabel {
          font-family: 'JetBrains Mono', monospace;
          font-size: 10px;
          color: #6B7280;
          letter-spacing: 0.04em;
          text-transform: uppercase;
        }

        @keyframes heroFadeUp {
          from { opacity: 0; transform: translateY(var(--ty, 20px)); }
          to { opacity: 1; transform: translateY(0); }
        }

        @keyframes cursorBlink {
          0%, 100% { border-color: #2563EB; }
          50% { border-color: transparent; }
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(0.8); }
        }

        @keyframes underlineReveal {
          from { transform: scaleX(0); }
          to { transform: scaleX(1); }
        }

        @keyframes stepLine {
          0% { transform: scaleX(0); transform-origin: left; }
          50% { transform: scaleX(1); transform-origin: left; }
          51% { transform: scaleX(1); transform-origin: right; }
          100% { transform: scaleX(0); transform-origin: right; }
        }

        @media (max-width: 900px) {
          .pipeline-steps { grid-template-columns: 1fr; gap: 12px; }
          .pipeline-arrow { transform: rotate(90deg); padding: 8px 0; }
          .hero-stats { grid-template-columns: repeat(2, 1fr); }
        }

        @media (max-width: 600px) {
          .hero-inner { padding: 48px 20px 40px; }
          .hero-ctas { flex-direction: column; align-items: flex-start; }
          .cta-primary, .cta-secondary { width: 100%; justify-content: center; }
          .hero-stats { grid-template-columns: repeat(2, 1fr); }
          .hero-pipeline { padding: 20px; }
        }
      `}</style>

      <section className="hero-wrap" ref={heroRef}>
        <div className="hero-noise" />
        <div className="hero-grid" />

        <div className="hero-inner">
          {/* Badge */}
          <div className="hero-badge">
            <span className="hero-badge-dot" />
            13 AI Agents Chained In Sequence
          </div>

          {/* Main headline */}
          <h1 className="hero-h1">
            Your next <span className="accent-gold">7 videos</span>,
          </h1>

          <div className="hero-niche-line">
            <span className="hero-niche-prefix">scripted for&nbsp;</span>
            <span className="hero-typewriter">{displayed}</span>
          </div>

          {/* Sub */}
          <p className="hero-sub">
            Three inputs. Ninety seconds. A complete content pack — research, word-for-word script, scene breakdown, YouTube SEO, social captions, and a 7-day plan. Ready to publish.
          </p>

          {/* CTAs */}
          <div className="hero-ctas">
            <a href="/generate" className="cta-primary">
              <span>Generate Free — No Card</span>
              <span className="cta-arrow">→</span>
            </a>
            <a href="#how-it-works" className="cta-secondary">
              ▶ See how it works
            </a>
          </div>

          {/* Trust bar */}
          <div className="hero-trust">
            <div className="trust-avatars">
              {[
                { bg: '#D4A847', letter: 'A' },
                { bg: '#2563EB', letter: 'R' },
                { bg: '#059669', letter: 'S' },
                { bg: '#DC2626', letter: 'P' },
                { bg: '#7C3AED', letter: 'K' },
              ].map((a, i) => (
                <div key={i} className="trust-avatar" style={{ background: a.bg, zIndex: 5 - i }}>
                  {a.letter}
                </div>
              ))}
            </div>
            <div style={{ marginLeft: 4 }}>
              <div className="trust-stars">
                {[1,2,3,4,5].map(i => (
                  <span key={i} style={{ color: '#D4A847', fontSize: 13 }}>★</span>
                ))}
              </div>
            </div>
            <p className="trust-text">
              <strong>2,300+ creators</strong> publishing weekly with Studio AI
            </p>
          </div>

          {/* Pipeline */}
          <div className="hero-pipeline">
            <div className="pipeline-grid-bg" />
            <p className="pipeline-label">Live Pipeline Simulation</p>
            <div className="pipeline-steps">
              {PIPELINE_STEPS.map((step, i) => (
                <>
                  <div
                    key={step.step}
                    className={`pipeline-step ${pipelineActive === i ? 'active' : ''}`}
                    style={{ '--step-color': step.color }}
                  >
                    <div className="step-num">Agent {step.step}</div>
                    <div className="step-label">{step.label}</div>
                    <div className="step-desc">{step.desc}</div>
                  </div>
                  {i < 2 && (
                    <div key={`arrow-${i}`} className="pipeline-arrow">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                        <path d="M5 12h14M13 6l6 6-6 6" stroke="rgba(255,255,255,0.6)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                  )}
                </>
              ))}
            </div>
          </div>

          {/* Stats */}
          <div className="hero-stats">
            {STATS.map((stat, i) => (
              <div key={i} className="stat-item">
                <div className="stat-number">{stat.number}</div>
                <div className="stat-label">{stat.label}</div>
                <div className="stat-sublabel">{stat.sublabel}</div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  )
}