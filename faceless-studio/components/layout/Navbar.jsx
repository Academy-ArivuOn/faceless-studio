'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [activeLink, setActiveLink] = useState('/')

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Close menu on route change
  useEffect(() => {
    setMenuOpen(false)
  }, [activeLink])

  // Prevent body scroll when menu is open
  useEffect(() => {
    if (menuOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [menuOpen])

  const navLinks = [
    { href: '#how-it-works', label: 'How It Works' },
    { href: '#agents', label: 'AI Agents' },
    { href: '#features', label: 'Features' },
    { href: '#pricing', label: 'Pricing' },
  ]

  return (
    <>
      <style>{`
        /* Premium Corporate Navbar - Studio AI */
        .navbar-premium {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          z-index: 1000;
          padding: 0 clamp(1rem, 4vw, 2.5rem);
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          background: transparent;
        }

        .navbar-premium.scrolled {
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(12px);
          border-bottom: 1px solid rgba(99, 102, 241, 0.1);
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
        }

        .nav-container {
          display: flex;
          align-items: center;
          justify-content: space-between;
          max-width: 1280px;
          margin: 0 auto;
          height: clamp(60px, 8vh, 76px);
        }

        /* Logo Section */
        .nav-logo-premium {
          display: flex;
          align-items: center;
          gap: clamp(8px, 1.5vw, 12px);
          text-decoration: none;
          flex-shrink: 0;
        }

        .logo-icon-wrapper {
          position: relative;
          width: clamp(32px, 5vw, 40px);
          height: clamp(32px, 5vw, 40px);
        }

        .logo-icon-bg {
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, #6366F1 0%, #8B5CF6 50%, #10B981 100%);
          border-radius: 10px;
          animation: logo-pulse 3s ease-in-out infinite;
        }

        .logo-icon-inner {
          position: absolute;
          inset: 2px;
          background: #FFFFFF;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .logo-icon-text {
          font-size: clamp(16px, 2.5vw, 20px);
          font-weight: 800;
          background: linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          font-family: 'Sora', 'Plus Jakarta Sans', sans-serif;
        }

        .logo-text {
          font-family: 'Sora', 'Plus Jakarta Sans', sans-serif;
          font-weight: 700;
          font-size: clamp(1rem, 2vw, 1.2rem);
          color: #0F172A;
          letter-spacing: -0.02em;
        }

        .logo-text-highlight {
          background: linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        /* Navigation Links */
        .nav-links-premium {
          display: flex;
          align-items: center;
          gap: clamp(1.5rem, 3vw, 2.5rem);
          list-style: none;
          margin: 0;
          padding: 0;
        }

        .nav-link-item {
          position: relative;
        }

        .nav-link-premium {
          color: #475569;
          text-decoration: none;
          font-size: clamp(0.85rem, 1.3vw, 0.95rem);
          font-weight: 500;
          transition: color 0.2s ease;
          font-family: 'Plus Jakarta Sans', sans-serif;
          padding: 0.5rem 0;
          white-space: nowrap;
        }

        .nav-link-premium:hover {
          color: #6366F1;
        }

        .nav-link-premium.active {
          color: #6366F1;
        }

        .nav-link-premium.active::after {
          content: '';
          position: absolute;
          bottom: -2px;
          left: 0;
          right: 0;
          height: 2px;
          background: linear-gradient(90deg, #6366F1 0%, #8B5CF6 100%);
          border-radius: 2px;
        }

        /* CTA Section */
        .nav-cta-premium {
          display: flex;
          align-items: center;
          gap: clamp(8px, 1.5vw, 16px);
          flex-shrink: 0;
        }

        .nav-login-premium {
          color: #475569;
          text-decoration: none;
          font-size: clamp(0.85rem, 1.3vw, 0.95rem);
          font-weight: 500;
          transition: color 0.2s ease;
          font-family: 'Plus Jakarta Sans', sans-serif;
          padding: 0.5rem 0.75rem;
          white-space: nowrap;
        }

        .nav-login-premium:hover {
          color: #6366F1;
        }

        .nav-start-premium {
          background: linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%);
          color: white;
          padding: clamp(8px, 1.2vw, 10px) clamp(16px, 2vw, 24px);
          border-radius: 10px;
          font-size: clamp(0.8rem, 1.2vw, 0.9rem);
          font-weight: 600;
          text-decoration: none;
          font-family: 'Plus Jakarta Sans', sans-serif;
          transition: all 0.25s ease;
          box-shadow: 0 2px 8px rgba(99, 102, 241, 0.2);
          white-space: nowrap;
          border: none;
          display: inline-flex;
          align-items: center;
          gap: 6px;
        }

        .nav-start-premium:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 16px rgba(99, 102, 241, 0.3);
          background: linear-gradient(135deg, #7C7FF5 0%, #9B6FF6 100%);
        }

        .nav-start-premium:active {
          transform: translateY(0);
        }

        /* Mobile Menu Button */
        .nav-menu-button {
          display: none;
          flex-direction: column;
          justify-content: center;
          gap: 5px;
          width: 40px;
          height: 40px;
          padding: 8px;
          background: transparent;
          border: 1px solid #E2E8F0;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s ease;
          flex-shrink: 0;
        }

        .nav-menu-button:hover {
          background: #F8FAFC;
          border-color: #CBD5E1;
        }

        .nav-menu-button span {
          display: block;
          width: 100%;
          height: 2px;
          background: #0F172A;
          border-radius: 2px;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .nav-menu-button.active span:first-child {
          transform: rotate(45deg) translate(5px, 5px);
        }

        .nav-menu-button.active span:nth-child(2) {
          opacity: 0;
          transform: scale(0);
        }

        .nav-menu-button.active span:last-child {
          transform: rotate(-45deg) translate(5px, -5px);
        }

        /* Mobile Menu Overlay */
        .mobile-menu-overlay {
          display: none;
          position: fixed;
          top: clamp(60px, 8vh, 76px);
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(255, 255, 255, 0.98);
          backdrop-filter: blur(12px);
          z-index: 999;
          padding: 1.5rem clamp(1rem, 4vw, 2rem);
          overflow-y: auto;
          animation: slide-down 0.3s ease;
        }

        .mobile-menu-overlay.open {
          display: block;
        }

        .mobile-menu-content {
          max-width: 600px;
          margin: 0 auto;
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .mobile-nav-link {
          color: #0F172A;
          text-decoration: none;
          font-size: 1.1rem;
          font-weight: 600;
          padding: 1rem 1.25rem;
          border-bottom: 1px solid #E2E8F0;
          font-family: 'Plus Jakarta Sans', sans-serif;
          transition: all 0.2s ease;
          border-radius: 8px;
        }

        .mobile-nav-link:hover {
          background: #F8FAFC;
          color: #6366F1;
          padding-left: 1.5rem;
        }

        .mobile-nav-link.active {
          color: #6366F1;
          background: linear-gradient(90deg, rgba(99, 102, 241, 0.05) 0%, transparent 100%);
        }

        .mobile-cta-section {
          margin-top: 1.5rem;
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .mobile-login-link {
          color: #475569;
          text-decoration: none;
          font-size: 1rem;
          font-weight: 500;
          padding: 0.75rem 1.25rem;
          text-align: center;
          font-family: 'Plus Jakarta Sans', sans-serif;
          border-radius: 8px;
          transition: all 0.2s ease;
        }

        .mobile-login-link:hover {
          background: #F8FAFC;
          color: #6366F1;
        }

        .mobile-start-button {
          background: linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%);
          color: white;
          padding: 1rem 1.5rem;
          border-radius: 12px;
          font-size: 1rem;
          font-weight: 600;
          text-decoration: none;
          font-family: 'Plus Jakarta Sans', sans-serif;
          text-align: center;
          transition: all 0.25s ease;
          box-shadow: 0 4px 12px rgba(99, 102, 241, 0.2);
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }

        .mobile-start-button:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(99, 102, 241, 0.3);
        }

        .mobile-start-button:active {
          transform: translateY(0);
        }

        /* Agent Status Indicator */
        .agent-status-indicator {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 6px 12px;
          background: rgba(16, 185, 129, 0.08);
          border: 1px solid rgba(16, 185, 129, 0.15);
          border-radius: 100px;
          margin-left: 8px;
        }

        .agent-status-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #10B981;
          animation: pulse-gentle 2s ease infinite;
        }

        .agent-status-text {
          font-size: 0.75rem;
          font-weight: 600;
          color: #10B981;
          text-transform: uppercase;
          letter-spacing: 0.03em;
        }

        /* Animations */
        @keyframes logo-pulse {
          0%, 100% {
            transform: scale(1);
            opacity: 1;
          }
          50% {
            transform: scale(1.02);
            opacity: 0.95;
          }
        }

        @keyframes pulse-gentle {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.5;
          }
        }

        @keyframes slide-down {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        /* Responsive Breakpoints */
        @media (max-width: 1024px) {
          .nav-links-premium {
            gap: 1.5rem;
          }
        }

        @media (max-width: 860px) {
          .nav-links-premium,
          .nav-login-premium {
            display: none;
          }

          .nav-menu-button {
            display: flex;
          }

          .nav-cta-premium {
            gap: 8px;
          }

          .agent-status-indicator {
            display: none;
          }
        }

        @media (max-width: 640px) {
          .navbar-premium {
            padding: 0 1rem;
          }

          .nav-container {
            height: 64px;
          }

          .logo-text {
            display: none;
          }

          .nav-start-premium {
            padding: 8px 16px;
            font-size: 0.8rem;
          }

          .mobile-nav-link {
            font-size: 1rem;
            padding: 0.875rem 1rem;
          }

          .mobile-start-button {
            padding: 0.875rem 1.25rem;
            font-size: 0.95rem;
          }
        }

        @media (max-width: 380px) {
          .nav-start-premium span:last-child {
            display: none;
          }

          .nav-start-premium {
            padding: 8px 12px;
          }

          .mobile-menu-overlay {
            padding: 1rem 0.875rem;
          }
        }

        /* Touch Device Optimizations */
        @media (hover: none) and (pointer: coarse) {
          .nav-link-premium,
          .nav-login-premium,
          .nav-start-premium,
          .mobile-nav-link,
          .mobile-login-link,
          .mobile-start-button {
            cursor: default;
            -webkit-tap-highlight-color: transparent;
          }

          .nav-menu-button:active {
            background: #E2E8F0;
          }
        }

        /* Landscape Mode */
        @media (max-height: 500px) and (orientation: landscape) {
          .mobile-menu-overlay {
            padding: 1rem;
          }

          .mobile-menu-content {
            gap: 0.25rem;
          }

          .mobile-nav-link {
            padding: 0.75rem 1rem;
          }

          .mobile-cta-section {
            margin-top: 0.75rem;
          }
        }

        /* Dark mode support for future */
        @media (prefers-color-scheme: dark) {
          .navbar-premium.scrolled {
            background: rgba(15, 23, 42, 0.95);
            border-bottom-color: rgba(99, 102, 241, 0.15);
          }

          .logo-text,
          .nav-link-premium,
          .nav-login-premium {
            color: #E2E8F0;
          }

          .nav-link-premium:hover,
          .nav-login-premium:hover {
            color: #818CF8;
          }

          .nav-menu-button {
            border-color: #334155;
          }

          .nav-menu-button span {
            background: #E2E8F0;
          }

          .mobile-menu-overlay {
            background: rgba(15, 23, 42, 0.98);
          }

          .mobile-nav-link {
            color: #E2E8F0;
            border-bottom-color: #334155;
          }

          .mobile-nav-link:hover {
            background: rgba(99, 102, 241, 0.1);
          }
        }
      `}</style>

      <nav className={`navbar-premium ${scrolled ? 'scrolled' : ''}`}>
        <div className="nav-container">
          {/* Logo */}
          <Link href="/" className="nav-logo-premium">
            <div className="logo-icon-wrapper">
              <div className="logo-icon-bg" />
              <div className="logo-icon-inner">
                <span className="logo-icon-text">S</span>
              </div>
            </div>
            <span className="logo-text">
              Studio <span className="logo-text-highlight">AI</span>
            </span>
          </Link>

          {/* Desktop Navigation */}
          <ul className="nav-links-premium">
            {navLinks.map(link => (
              <li key={link.href} className="nav-link-item">
                <a
                  href={link.href}
                  className={`nav-link-premium ${activeLink === link.href ? 'active' : ''}`}
                  onClick={() => setActiveLink(link.href)}
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>

          {/* Agent Status (Desktop) */}
          <div className="agent-status-indicator">
            <span className="agent-status-dot" />
            <span className="agent-status-text">3 Agents Active</span>
          </div>

          {/* CTA Buttons */}
          <div className="nav-cta-premium">
            <a href="/login" className="nav-login-premium">
              Sign In
            </a>
            <a href="/generate" className="nav-start-premium">
              <span>✨</span>
              Start Free
              <span>→</span>
            </a>
          </div>

          {/* Mobile Menu Button */}
          <button
            className={`nav-menu-button ${menuOpen ? 'active' : ''}`}
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle menu"
            aria-expanded={menuOpen}
          >
            <span />
            <span />
            <span />
          </button>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      <div className={`mobile-menu-overlay ${menuOpen ? 'open' : ''}`}>
        <div className="mobile-menu-content">
          {navLinks.map(link => (
            <a
              key={link.href}
              href={link.href}
              className={`mobile-nav-link ${activeLink === link.href ? 'active' : ''}`}
              onClick={() => {
                setActiveLink(link.href)
                setMenuOpen(false)
              }}
            >
              {link.label}
            </a>
          ))}
          
          <div className="mobile-cta-section">
            <a
              href="/login"
              className="mobile-login-link"
              onClick={() => setMenuOpen(false)}
            >
              Sign In to Your Account
            </a>
            <a
              href="/generate"
              className="mobile-start-button"
              onClick={() => setMenuOpen(false)}
            >
              <span>✨</span>
              Start Creating Free
              <span>→</span>
            </a>
          </div>

          {/* Agent Status (Mobile) */}
          <div style={{ 
            marginTop: '1rem', 
            padding: '0.75rem',
            textAlign: 'center',
            color: '#64748B',
            fontSize: '0.8rem'
          }}>
            <span>🤖 3 AI Agents ready to work</span>
          </div>
        </div>
      </div>
    </>
  )
}