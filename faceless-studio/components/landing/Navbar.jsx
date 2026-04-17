'use client'
import { useState, useEffect } from 'react'

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 12)
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [mobileOpen])

  const NAV_LINKS = [
    { label: 'How It Works', href: '#how-it-works' },
    { label: 'AI Agents', href: '#agents' },
    { label: 'Pricing', href: '#pricing' },
  ]

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,600;12..96,700;12..96,800&family=DM+Sans:wght@400;500;600&family=JetBrains+Mono:wght@400;500;600&display=swap');

        .navbar {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          z-index: 1000;
          padding: 0;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .navbar.scrolled {
          background: rgba(255,255,255,0.96);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border-bottom: 1px solid rgba(0,0,0,0.06);
          box-shadow: 0 1px 20px rgba(0,0,0,0.04);
        }

        .navbar-container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 24px;
          height: 72px;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        /* Logo */
        .nav-logo {
          display: flex;
          align-items: center;
          gap: 10px;
          text-decoration: none;
          flex-shrink: 0;
        }

        .nav-logo-mark {
          width: 34px;
          height: 34px;
          background: #0A0A0A;
          border-radius: 9px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: transform 0.2s ease;
        }

        .nav-logo:hover .nav-logo-mark {
          transform: rotate(-5deg) scale(1.05);
        }

        .nav-brand {
          font-family: 'Bricolage Grotesque', sans-serif;
          font-size: 18px;
          font-weight: 700;
          color: #0A0A0A;
          letter-spacing: -0.03em;
        }

        .nav-brand span {
          color: #D4A847;
        }

        /* Desktop nav */
        .nav-links {
          display: flex;
          align-items: center;
          gap: 2px;
          list-style: none;
        }

        .nav-link {
          font-family: 'DM Sans', sans-serif;
          font-size: 14px;
          font-weight: 500;
          color: #374151;
          text-decoration: none;
          padding: 8px 14px;
          border-radius: 8px;
          transition: all 0.15s ease;
        }

        .nav-link:hover {
          color: #0A0A0A;
          background: #F3F4F6;
        }

        /* Status indicator */
        .nav-status {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 5px 12px;
          background: #ECFDF5;
          border: 1px solid #6EE7B7;
          border-radius: 100px;
          font-family: 'JetBrains Mono', monospace;
          font-size: 10px;
          font-weight: 600;
          color: #059669;
          letter-spacing: 0.05em;
          text-transform: uppercase;
        }

        .status-dot {
          width: 5px;
          height: 5px;
          border-radius: 50%;
          background: #059669;
          animation: navPulse 2s ease infinite;
        }

        @keyframes navPulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }

        /* Nav CTAs */
        .nav-ctas {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-shrink: 0;
        }

        .nav-login {
          font-family: 'DM Sans', sans-serif;
          font-size: 14px;
          font-weight: 500;
          color: #374151;
          text-decoration: none;
          padding: 8px 14px;
          border-radius: 8px;
          transition: all 0.15s ease;
        }

        .nav-login:hover { color: #0A0A0A; background: #F3F4F6; }

        .nav-cta {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: #0A0A0A;
          color: #ffffff;
          padding: 9px 20px;
          border-radius: 10px;
          font-family: 'DM Sans', sans-serif;
          font-size: 14px;
          font-weight: 700;
          text-decoration: none;
          transition: all 0.2s ease;
          letter-spacing: -0.01em;
        }

        .nav-cta:hover {
          background: #1F2937;
          transform: translateY(-1px);
          box-shadow: 0 6px 20px rgba(0,0,0,0.2);
        }

        /* Mobile menu button */
        .nav-mobile-btn {
          display: none;
          width: 40px;
          height: 40px;
          align-items: center;
          justify-content: center;
          background: #F3F4F6;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          flex-direction: column;
          gap: 5px;
          padding: 8px;
          transition: background 0.15s ease;
        }

        .nav-mobile-btn:hover { background: #E5E7EB; }

        .hamburger-line {
          display: block;
          width: 100%;
          height: 2px;
          background: #0A0A0A;
          border-radius: 2px;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .nav-mobile-btn.open .hamburger-line:nth-child(1) {
          transform: rotate(45deg) translate(5px, 5px);
        }

        .nav-mobile-btn.open .hamburger-line:nth-child(2) {
          opacity: 0;
        }

        .nav-mobile-btn.open .hamburger-line:nth-child(3) {
          transform: rotate(-45deg) translate(5px, -5px);
        }

        /* Mobile overlay */
        .nav-mobile-overlay {
          display: none;
          position: fixed;
          top: 72px;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(255,255,255,0.98);
          backdrop-filter: blur(20px);
          z-index: 999;
          flex-direction: column;
          padding: 32px 24px;
          gap: 8px;
          animation: mobileMenuIn 0.25s ease;
        }

        .nav-mobile-overlay.open { display: flex; }

        @keyframes mobileMenuIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .mobile-nav-link {
          display: block;
          font-family: 'Bricolage Grotesque', sans-serif;
          font-size: 22px;
          font-weight: 700;
          color: #0A0A0A;
          text-decoration: none;
          padding: 14px 0;
          border-bottom: 1px solid #F3F4F6;
          letter-spacing: -0.02em;
          transition: color 0.15s ease;
        }

        .mobile-nav-link:hover { color: #D4A847; }

        .mobile-cta-group {
          margin-top: 24px;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .mobile-cta-primary {
          display: flex;
          align-items: center;
          justify-content: center;
          background: #0A0A0A;
          color: #ffffff;
          padding: 16px;
          border-radius: 12px;
          font-family: 'Bricolage Grotesque', sans-serif;
          font-size: 17px;
          font-weight: 700;
          text-decoration: none;
          letter-spacing: -0.02em;
          transition: all 0.2s ease;
        }

        .mobile-cta-primary:hover { background: #1F2937; }

        .mobile-cta-secondary {
          display: flex;
          align-items: center;
          justify-content: center;
          color: #374151;
          padding: 16px;
          border-radius: 12px;
          border: 1.5px solid #E5E7EB;
          font-family: 'DM Sans', sans-serif;
          font-size: 15px;
          font-weight: 600;
          text-decoration: none;
          transition: all 0.15s ease;
        }

        .mobile-cta-secondary:hover { border-color: #0A0A0A; color: #0A0A0A; }

        @media (max-width: 900px) {
          .nav-links, .nav-status, .nav-login { display: none; }
          .nav-mobile-btn { display: flex; }
        }

        @media (max-width: 480px) {
          .navbar-container { padding: 0 16px; }
          .nav-brand { font-size: 16px; }
        }
      `}</style>

      <nav className={`navbar ${scrolled ? 'scrolled' : ''}`}>
        <div className="navbar-container">
          <a href="/" className="nav-logo">
            <div className="nav-logo-mark">
              <svg width="14" height="14" viewBox="0 0 20 20" fill="none">
                <polygon points="10,2 17,6 17,14 10,18 3,14 3,6" stroke="#ffffff" strokeWidth="1.5" fill="none"/>
                <polygon points="10,6 14,8.5 14,13.5 10,16 6,13.5 6,8.5" fill="#ffffff" fillOpacity="0.3"/>
              </svg>
            </div>
            <span className="nav-brand">Studio <span>AI</span></span>
          </a>

          <ul className="nav-links">
            {NAV_LINKS.map(link => (
              <li key={link.href}>
                <a href={link.href} className="nav-link">{link.label}</a>
              </li>
            ))}
          </ul>

          <div className="nav-status">
            <span className="status-dot" />
            13 Agents Live
          </div>

          <div className="nav-ctas">
            <a href="/login" className="nav-login">Sign In</a>
            <a href="/generate" className="nav-cta">
              Start Free <span>→</span>
            </a>
            <button
              className={`nav-mobile-btn ${mobileOpen ? 'open' : ''}`}
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label="Menu"
            >
              <span className="hamburger-line" />
              <span className="hamburger-line" />
              <span className="hamburger-line" />
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile overlay */}
      <div className={`nav-mobile-overlay ${mobileOpen ? 'open' : ''}`}>
        {NAV_LINKS.map(link => (
          <a
            key={link.href}
            href={link.href}
            className="mobile-nav-link"
            onClick={() => setMobileOpen(false)}
          >
            {link.label}
          </a>
        ))}
        <div className="mobile-cta-group">
          <a href="/generate" className="mobile-cta-primary" onClick={() => setMobileOpen(false)}>
            Start Creating Free →
          </a>
          <a href="/login" className="mobile-cta-secondary" onClick={() => setMobileOpen(false)}>
            Sign In to Your Account
          </a>
        </div>
      </div>
    </>
  )
}