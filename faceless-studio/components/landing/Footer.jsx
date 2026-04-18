'use client'
import { useEffect, useRef, useState } from 'react'

export function FinalCTA() {
  const [visible, setVisible] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true) },
      { threshold: 0.2 }
    )
    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [])

  return (
    <>
      <style>{`
        .fcta-section {
          padding: 120px 24px;
          background: #0A0A0A;
          position: relative;
          overflow: hidden;
        }

        .fcta-glow {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 800px;
          height: 400px;
          background: radial-gradient(ellipse at center, rgba(212,168,71,0.1) 0%, transparent 70%);
          pointer-events: none;
        }

        .fcta-dots {
          position: absolute;
          inset: 0;
          background-image: radial-gradient(circle, rgba(255,255,255,0.05) 1px, transparent 1px);
          background-size: 32px 32px;
          pointer-events: none;
          mask-image: radial-gradient(ellipse at center, black 30%, transparent 75%);
        }

        .fcta-inner {
          max-width: 800px;
          margin: 0 auto;
          text-align: center;
          position: relative;
          z-index: 1;
        }

        .fcta-badge {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          padding: 6px 16px;
          background: rgba(212,168,71,0.12);
          border: 1px solid rgba(212,168,71,0.25);
          border-radius: 100px;
          font-family: 'JetBrains Mono', monospace;
          font-size: 11px;
          font-weight: 600;
          color: #D4A847;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          margin-bottom: 32px;
          opacity: 0;
          transform: translateY(16px);
          transition: all 0.6s ease;
        }

        .fcta-badge.visible {
          opacity: 1;
          transform: translateY(0);
        }

        .fcta-title {
          font-family: 'Bricolage Grotesque', sans-serif;
          font-size: clamp(40px, 6vw, 72px);
          font-weight: 800;
          color: #ffffff;
          letter-spacing: -0.04em;
          line-height: 1.05;
          margin-bottom: 20px;
          opacity: 0;
          transform: translateY(24px);
          transition: all 0.7s ease 0.1s;
        }

        .fcta-title.visible {
          opacity: 1;
          transform: translateY(0);
        }

        .fcta-sub {
          font-family: 'DM Sans', sans-serif;
          font-size: 18px;
          color: rgba(255,255,255,0.6);
          line-height: 1.7;
          max-width: 520px;
          margin: 0 auto 44px;
          opacity: 0;
          transform: translateY(16px);
          transition: all 0.6s ease 0.2s;
        }

        .fcta-sub.visible {
          opacity: 1;
          transform: translateY(0);
        }

        .fcta-buttons {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 16px;
          flex-wrap: wrap;
          opacity: 0;
          transform: translateY(16px);
          transition: all 0.6s ease 0.3s;
        }

        .fcta-buttons.visible {
          opacity: 1;
          transform: translateY(0);
        }

        .fcta-primary {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          background: #D4A847;
          color: #0A0A0A;
          padding: 18px 40px;
          border-radius: 14px;
          font-family: 'Bricolage Grotesque', sans-serif;
          font-size: 17px;
          font-weight: 800;
          text-decoration: none;
          letter-spacing: -0.01em;
          transition: all 0.25s ease;
        }

        .fcta-primary:hover {
          background: #E8CA70;
          transform: translateY(-2px);
          box-shadow: 0 16px 48px rgba(212,168,71,0.35);
        }

        .fcta-secondary {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          color: rgba(255,255,255,0.6);
          font-family: 'DM Sans', sans-serif;
          font-size: 15px;
          font-weight: 500;
          text-decoration: none;
          padding: 18px 24px;
          border-radius: 14px;
          border: 1.5px solid rgba(255,255,255,0.12);
          transition: all 0.2s ease;
        }

        .fcta-secondary:hover {
          border-color: rgba(255,255,255,0.3);
          color: #ffffff;
          transform: translateY(-1px);
        }

        .fcta-note {
          margin-top: 24px;
          font-family: 'JetBrains Mono', monospace;
          font-size: 11px;
          color: rgba(255,255,255,0.3);
          letter-spacing: 0.06em;
          text-transform: uppercase;
          opacity: 0;
          transition: opacity 0.6s ease 0.45s;
        }

        .fcta-note.visible { opacity: 1; }
      `}</style>

      <section className="fcta-section" ref={ref}>
        <div className="fcta-glow" />
        <div className="fcta-dots" />
        <div className="fcta-inner">
          <div className={`fcta-badge ${visible ? 'visible' : ''}`}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#D4A847', animation: 'pulse 1.5s ease infinite' }} />
            Live now — 2,300+ creators
          </div>
          <h2 className={`fcta-title ${visible ? 'visible' : ''}`}>
            Your first content pack<br />
            takes 90 seconds.
          </h2>
          <p className={`fcta-sub ${visible ? 'visible' : ''}`}>
            No card required. No setup. Just your niche — and a complete week of content, ready to publish.
          </p>
          <div className={`fcta-buttons ${visible ? 'visible' : ''}`}>
            <a href="/login" className="fcta-primary">
              Generate Free Now →
            </a>
            <a href="#pricing" className="fcta-secondary">
              View Pricing
            </a>
          </div>
          <p className={`fcta-note ${visible ? 'visible' : ''}`}>
            Free forever plan available · No credit card needed
          </p>
        </div>
      </section>
    </>
  )
}

export function Footer() {
  const NAV = {
    'Product': ['How It Works', 'AI Agents', 'Pricing', 'Changelog'],
    'Creators': ['YouTube Creators', 'Podcast Creators', 'Bloggers & Vloggers', 'Agencies'],
    'Resources': ['Blog', 'Creator Playbook', 'Agent Documentation', 'API Docs'],
    'Company': ['About', 'Privacy Policy', 'Terms of Service', 'Contact'],
  }

  return (
    <>
      <style>{`
        .footer {
          background: #0A0A0A;
          border-top: 1px solid rgba(255,255,255,0.07);
          padding: 64px 24px 40px;
        }

        .footer-inner {
          max-width: 1200px;
          margin: 0 auto;
        }

        .footer-top {
          display: grid;
          grid-template-columns: 280px 1fr;
          gap: 80px;
          margin-bottom: 56px;
        }

        .footer-brand {
          display: flex;
          flex-direction: column;
        }

        .footer-logo {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 16px;
        }

        .footer-logo-mark {
          width: 32px;
          height: 32px;
          background: rgba(212,168,71,0.15);
          border: 1px solid rgba(212,168,71,0.3);
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .footer-brand-name {
          font-family: 'Bricolage Grotesque', sans-serif;
          font-size: 17px;
          font-weight: 700;
          color: #ffffff;
          letter-spacing: -0.02em;
        }

        .footer-tagline {
          font-family: 'DM Sans', sans-serif;
          font-size: 14px;
          color: rgba(255,255,255,0.45);
          line-height: 1.7;
          margin-bottom: 24px;
        }

        .footer-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 6px 12px;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 8px;
          font-family: 'JetBrains Mono', monospace;
          font-size: 10px;
          color: rgba(255,255,255,0.4);
          text-transform: uppercase;
          letter-spacing: 0.06em;
          width: fit-content;
        }

        .footer-nav {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 32px;
        }

        .footer-nav-col h4 {
          font-family: 'DM Sans', sans-serif;
          font-size: 12px;
          font-weight: 700;
          color: rgba(255,255,255,0.9);
          text-transform: uppercase;
          letter-spacing: 0.08em;
          margin-bottom: 16px;
        }

        .footer-nav-col ul {
          list-style: none;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .footer-nav-col ul li a {
          font-family: 'DM Sans', sans-serif;
          font-size: 13px;
          color: rgba(255,255,255,0.45);
          text-decoration: none;
          transition: color 0.2s ease;
        }

        .footer-nav-col ul li a:hover { color: rgba(255,255,255,0.85); }

        .footer-bottom {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding-top: 28px;
          border-top: 1px solid rgba(255,255,255,0.07);
          flex-wrap: wrap;
          gap: 16px;
        }

        .footer-copy {
          font-family: 'JetBrains Mono', monospace;
          font-size: 11px;
          color: rgba(255,255,255,0.3);
          letter-spacing: 0.04em;
        }

        .footer-legal {
          display: flex;
          gap: 20px;
        }

        .footer-legal a {
          font-family: 'JetBrains Mono', monospace;
          font-size: 11px;
          color: rgba(255,255,255,0.3);
          text-decoration: none;
          letter-spacing: 0.04em;
          transition: color 0.2s ease;
        }

        .footer-legal a:hover { color: rgba(255,255,255,0.6); }

        @media (max-width: 900px) {
          .footer-top { grid-template-columns: 1fr; gap: 40px; }
          .footer-nav { grid-template-columns: repeat(2, 1fr); }
        }

        @media (max-width: 500px) {
          .footer-nav { grid-template-columns: 1fr; gap: 24px; }
        }
      `}</style>

      <footer className="footer">
        <div className="footer-inner">
          <div className="footer-top">
            <div className="footer-brand">
              <div className="footer-logo">
                <div className="footer-logo-mark">
                  <svg width="14" height="14" viewBox="0 0 20 20" fill="none">
                    <polygon points="10,2 17,6 17,14 10,18 3,14 3,6" stroke="#D4A847" strokeWidth="1.5" fill="none"/>
                    <polygon points="10,6 14,8.5 14,13.5 10,16 6,13.5 6,8.5" fill="#D4A847" fillOpacity="0.3"/>
                  </svg>
                </div>
                <span className="footer-brand-name">Studio AI</span>
              </div>
              <p className="footer-tagline">
                The AI content operating system for creators who publish seriously. 13 agents. 90 seconds. One complete pack.
              </p>
              <div className="footer-badge">
                <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#059669' }} />
                India-focused · Global reach
              </div>
            </div>

            <nav className="footer-nav">
              {Object.entries(NAV).map(([category, links]) => (
                <div key={category} className="footer-nav-col">
                  <h4>{category}</h4>
                  <ul>
                    {links.map(link => (
                      <li key={link}><a href="#">{link}</a></li>
                    ))}
                  </ul>
                </div>
              ))}
            </nav>
          </div>

          <div className="footer-bottom">
            <p className="footer-copy">© 2025 Studio AI. All rights reserved.</p>
            <div className="footer-legal">
              <a href="/privacy">Privacy</a>
              <a href="/terms">Terms</a>
              <a href="/contact">Contact</a>
            </div>
          </div>
        </div>
      </footer>
    </>
  )
}