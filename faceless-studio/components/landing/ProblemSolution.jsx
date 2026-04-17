'use client'
import { useEffect, useRef, useState } from 'react'

const PAIN_POINTS = [
  { icon: '⏰', text: 'Spending 8+ hours writing a single script' },
  { icon: '😵', text: 'Staring at a blank page with zero ideas' },
  { icon: '📉', text: 'Publishing videos that get zero traction' },
  { icon: '🔁', text: 'Rewriting the same hook 15 times' },
  { icon: '🤯', text: 'Juggling research, scripting, and SEO at once' },
  { icon: '💸', text: 'Paying ₹15k/month for a content team' },
]

const GAINS = [
  { icon: '⚡', text: '90-second full content pack, ready to publish', color: '#059669' },
  { icon: '🎯', text: 'AI finds viral angles in your niche automatically', color: '#2563EB' },
  { icon: '🚀', text: 'SEO-optimised titles that actually get clicks', color: '#D4A847' },
  { icon: '🎬', text: 'Scene-by-scene direction for faceless or on-camera', color: '#7C3AED' },
  { icon: '📱', text: 'Instagram + TikTok captions generated instantly', color: '#DC2626' },
  { icon: '📅', text: 'Complete 7-day content sprint plan included', color: '#059669' },
]

export default function ProblemSolution() {
  const [visible, setVisible] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true) },
      { threshold: 0.15 }
    )
    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [])

  return (
    <>
      <style>{`
        .ps-section {
          padding: 120px 0;
          background: #ffffff;
          overflow: hidden;
        }

        .ps-inner {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 24px;
        }

        .ps-header {
          text-align: center;
          margin-bottom: 80px;
        }

        .ps-eyebrow {
          font-family: 'JetBrains Mono', monospace;
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: #6B7280;
          margin-bottom: 20px;
          display: block;
        }

        .ps-title {
          font-family: 'Bricolage Grotesque', sans-serif;
          font-size: clamp(36px, 5vw, 60px);
          font-weight: 800;
          color: #0A0A0A;
          letter-spacing: -0.04em;
          line-height: 1.08;
          margin-bottom: 20px;
        }

        .ps-sub {
          font-family: 'DM Sans', sans-serif;
          font-size: 18px;
          color: #374151;
          max-width: 560px;
          margin: 0 auto;
          line-height: 1.7;
        }

        /* Two column layout */
        .ps-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 32px;
        }

        /* Before column */
        .ps-before {
          background: #FEF2F2;
          border: 1.5px solid #FCA5A5;
          border-radius: 20px;
          padding: 36px;
          opacity: 0;
          transform: translateX(-30px);
          transition: all 0.8s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .ps-before.visible {
          opacity: 1;
          transform: translateX(0);
        }

        .col-label {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          padding: 5px 14px;
          border-radius: 100px;
          font-family: 'JetBrains Mono', monospace;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.07em;
          text-transform: uppercase;
          margin-bottom: 28px;
        }

        .label-before {
          background: #FEE2E2;
          color: #DC2626;
          border: 1px solid #FCA5A5;
        }

        .label-after {
          background: #D1FAE5;
          color: #059669;
          border: 1px solid #6EE7B7;
        }

        .col-heading {
          font-family: 'Bricolage Grotesque', sans-serif;
          font-size: 22px;
          font-weight: 700;
          color: #0A0A0A;
          margin-bottom: 24px;
          letter-spacing: -0.02em;
        }

        .pain-list {
          display: flex;
          flex-direction: column;
          gap: 14px;
        }

        .pain-item {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          padding: 14px 16px;
          background: #ffffff;
          border: 1px solid #FCA5A5;
          border-radius: 10px;
          opacity: 0;
          transform: translateX(-16px);
          transition: all 0.5s ease;
        }

        .pain-item.visible {
          opacity: 1;
          transform: translateX(0);
        }

        .pain-icon {
          font-size: 18px;
          flex-shrink: 0;
          margin-top: 1px;
        }

        .pain-text {
          font-family: 'DM Sans', sans-serif;
          font-size: 14px;
          color: #374151;
          line-height: 1.5;
          font-weight: 500;
        }

        /* After column */
        .ps-after {
          background: #0A0A0A;
          border: 1.5px solid #1F2937;
          border-radius: 20px;
          padding: 36px;
          opacity: 0;
          transform: translateX(30px);
          transition: all 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.1s;
          position: relative;
          overflow: hidden;
        }

        .ps-after.visible {
          opacity: 1;
          transform: translateX(0);
        }

        .ps-after::before {
          content: '';
          position: absolute;
          top: -60px;
          right: -60px;
          width: 200px;
          height: 200px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(212,168,71,0.15) 0%, transparent 70%);
          pointer-events: none;
        }

        .gain-list {
          display: flex;
          flex-direction: column;
          gap: 14px;
        }

        .gain-item {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          padding: 14px 16px;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 10px;
          opacity: 0;
          transform: translateX(16px);
          transition: all 0.5s ease;
          position: relative;
        }

        .gain-item.visible {
          opacity: 1;
          transform: translateX(0);
        }

        .gain-item::before {
          content: '';
          position: absolute;
          left: 0;
          top: 0;
          bottom: 0;
          width: 3px;
          border-radius: 3px 0 0 3px;
          background: var(--gain-color);
          opacity: 0;
          transition: opacity 0.4s ease;
        }

        .gain-item.visible::before { opacity: 1; }

        .gain-icon {
          font-size: 18px;
          flex-shrink: 0;
          margin-top: 1px;
        }

        .gain-text {
          font-family: 'DM Sans', sans-serif;
          font-size: 14px;
          color: rgba(255,255,255,0.85);
          line-height: 1.5;
          font-weight: 500;
        }

        /* CTA banner at bottom */
        .ps-cta-banner {
          margin-top: 60px;
          text-align: center;
          opacity: 0;
          transform: translateY(20px);
          transition: all 0.7s ease 0.5s;
        }

        .ps-cta-banner.visible {
          opacity: 1;
          transform: translateY(0);
        }

        .ps-switch-text {
          font-family: 'Bricolage Grotesque', sans-serif;
          font-size: clamp(22px, 3.5vw, 34px);
          font-weight: 700;
          color: #0A0A0A;
          letter-spacing: -0.03em;
          margin-bottom: 28px;
          line-height: 1.25;
        }

        .ps-switch-text .highlight {
          color: #D4A847;
          position: relative;
        }

        @media (max-width: 768px) {
          .ps-grid { grid-template-columns: 1fr; gap: 20px; }
          .ps-section { padding: 80px 0; }
        }
      `}</style>

      <section className="ps-section" id="problem" ref={ref}>
        <div className="ps-inner">
          <div className="ps-header">
            <span className="ps-eyebrow">The Real Problem</span>
            <h2 className="ps-title">
              You know your niche.<br />
              You just don't have time to<br />
              <em style={{ fontStyle: 'normal', color: '#DC2626' }}>create everything from scratch.</em>
            </h2>
            <p className="ps-sub">
              Every creator faces the same bottleneck. Studio AI eliminates it entirely.
            </p>
          </div>

          <div className="ps-grid">
            {/* Before */}
            <div className={`ps-before ${visible ? 'visible' : ''}`}>
              <div className="col-label label-before">
                ✕ Without Studio AI
              </div>
              <h3 className="col-heading">Hours of painful, repetitive work</h3>
              <div className="pain-list">
                {PAIN_POINTS.map((p, i) => (
                  <div
                    key={i}
                    className={`pain-item ${visible ? 'visible' : ''}`}
                    style={{ transitionDelay: `${0.1 + i * 0.08}s` }}
                  >
                    <span className="pain-icon">{p.icon}</span>
                    <span className="pain-text">{p.text}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* After */}
            <div className={`ps-after ${visible ? 'visible' : ''}`}>
              <div className="col-label label-after">
                ✓ With Studio AI
              </div>
              <h3 className="col-heading" style={{ color: '#ffffff' }}>One input. Complete content pack.</h3>
              <div className="gain-list">
                {GAINS.map((g, i) => (
                  <div
                    key={i}
                    className={`gain-item ${visible ? 'visible' : ''}`}
                    style={{
                      '--gain-color': g.color,
                      transitionDelay: `${0.2 + i * 0.08}s`
                    }}
                  >
                    <span className="gain-icon">{g.icon}</span>
                    <span className="gain-text">{g.text}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className={`ps-cta-banner ${visible ? 'visible' : ''}`}>
            <p className="ps-switch-text">
              Stop creating content the <span className="highlight">slow way.</span><br />
              Your first pack is free.
            </p>
            <a
              href="/generate"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 10,
                background: '#0A0A0A',
                color: '#ffffff',
                padding: '16px 36px',
                borderRadius: 12,
                fontFamily: "'Bricolage Grotesque', sans-serif",
                fontSize: 17,
                fontWeight: 700,
                textDecoration: 'none',
                letterSpacing: '-0.01em',
                transition: 'all 0.25s ease',
              }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 16px 48px rgba(0,0,0,0.2)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none'; }}
            >
              Try It Now — Free →
            </a>
          </div>
        </div>
      </section>
    </>
  )
}