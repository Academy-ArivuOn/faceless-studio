'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <>
      <style>{`
        .navbar {
          position: fixed;
          top: 0; left: 0; right: 0;
          z-index: 999;
          padding: 0 clamp(1.25rem, 4vw, 2.5rem);
          transition: all 0.35s ease;
        }
        .navbar.scrolled {
          background: rgba(4, 8, 24, 0.92);
          backdrop-filter: blur(20px);
          border-bottom: 1px solid rgba(201, 164, 53, 0.12);
          box-shadow: 0 8px 32px rgba(4, 8, 24, 0.4);
        }
        .nav-inner {
          display: flex;
          align-items: center;
          justify-content: space-between;
          max-width: 1200px;
          margin: 0 auto;
          height: 72px;
        }
        .nav-logo {
          display: flex;
          align-items: center;
          gap: 10px;
          text-decoration: none;
        }
        .nav-logo-icon {
          width: 36px;
          height: 36px;
          background: linear-gradient(135deg, #C9A435, #E8CA70);
          border-radius: 9px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 18px;
          font-weight: 800;
          color: #040818;
          font-family: 'Sora', sans-serif;
          box-shadow: 0 4px 16px rgba(201, 164, 53, 0.35);
        }
        .nav-logo-text {
          font-family: 'Sora', sans-serif;
          font-weight: 700;
          font-size: 1.15rem;
          color: white;
          letter-spacing: -0.01em;
        }
        .nav-logo-text span {
          background: linear-gradient(135deg, #C9A435, #E8CA70);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        .nav-links {
          display: flex;
          align-items: center;
          gap: 2rem;
          list-style: none;
        }
        .nav-links a {
          color: rgba(200, 208, 232, 0.8);
          text-decoration: none;
          font-size: 0.9rem;
          font-weight: 500;
          transition: color 0.2s;
          font-family: 'Plus Jakarta Sans', sans-serif;
        }
        .nav-links a:hover { color: #E8CA70; }
        .nav-cta {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .nav-login {
          color: rgba(200, 208, 232, 0.8);
          text-decoration: none;
          font-size: 0.9rem;
          font-weight: 500;
          transition: color 0.2s;
          font-family: 'Plus Jakarta Sans', sans-serif;
        }
        .nav-login:hover { color: white; }
        .nav-start {
          background: linear-gradient(135deg, #C9A435, #D4B04A);
          color: #040818;
          padding: 9px 22px;
          border-radius: 10px;
          font-size: 0.875rem;
          font-weight: 700;
          text-decoration: none;
          font-family: 'Sora', sans-serif;
          transition: all 0.25s ease;
          box-shadow: 0 4px 16px rgba(201, 164, 53, 0.3);
        }
        .nav-start:hover {
          transform: translateY(-1px);
          box-shadow: 0 6px 24px rgba(201, 164, 53, 0.45);
          background: linear-gradient(135deg, #D4B04A, #E8CA70);
        }
        .nav-burger {
          display: none;
          flex-direction: column;
          gap: 5px;
          cursor: pointer;
          padding: 4px;
          background: none;
          border: none;
        }
        .nav-burger span {
          display: block;
          width: 24px;
          height: 2px;
          background: var(--silver);
          border-radius: 2px;
          transition: all 0.3s ease;
        }
        .mobile-menu {
          display: none;
          position: fixed;
          top: 72px; left: 0; right: 0;
          background: rgba(4, 8, 24, 0.97);
          backdrop-filter: blur(20px);
          border-bottom: 1px solid rgba(201, 164, 53, 0.12);
          padding: 1.5rem clamp(1.25rem, 4vw, 2.5rem);
          z-index: 998;
          flex-direction: column;
          gap: 1rem;
        }
        .mobile-menu.open { display: flex; }
        .mobile-menu a {
          color: rgba(200, 208, 232, 0.8);
          text-decoration: none;
          font-size: 1rem;
          font-weight: 500;
          padding: 0.5rem 0;
          border-bottom: 1px solid rgba(201, 164, 53, 0.08);
          font-family: 'Plus Jakarta Sans', sans-serif;
        }
        .mobile-menu .nav-start {
          display: inline-block;
          text-align: center;
          margin-top: 0.5rem;
          padding: 12px 22px;
          font-size: 0.95rem;
        }
        @media (max-width: 860px) {
          .nav-links, .nav-login { display: none; }
          .nav-burger { display: flex; }
        }
      `}</style>

      <nav className={`navbar ${scrolled ? 'scrolled' : ''}`}>
        <div className="nav-inner">
          <Link href="/" className="nav-logo">
            <div className="nav-logo-icon">F</div>
            <span className="nav-logo-text">Faceless <span>Studio</span></span>
          </Link>

          <ul className="nav-links">
            <li><a href="#how-it-works">How It Works</a></li>
            <li><a href="#agents">Agents</a></li>
            <li><a href="#features">Features</a></li>
            <li><a href="#pricing">Pricing</a></li>
          </ul>

          <div className="nav-cta">
            <a href="/login" className="nav-login">Log in</a>
            <a href="/generate" className="nav-start">Start Free →</a>
          </div>

          <button
            className="nav-burger"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle menu"
          >
            <span style={menuOpen ? { transform: 'rotate(45deg) translate(5px, 5px)' } : {}} />
            <span style={menuOpen ? { opacity: 0 } : {}} />
            <span style={menuOpen ? { transform: 'rotate(-45deg) translate(5px, -5px)' } : {}} />
          </button>
        </div>
      </nav>

      <div className={`mobile-menu ${menuOpen ? 'open' : ''}`}>
        <a href="#how-it-works" onClick={() => setMenuOpen(false)}>How It Works</a>
        <a href="#agents" onClick={() => setMenuOpen(false)}>Agents</a>
        <a href="#features" onClick={() => setMenuOpen(false)}>Features</a>
        <a href="#pricing" onClick={() => setMenuOpen(false)}>Pricing</a>
        <a href="/generate" className="nav-start">Start Free — No Card →</a>
      </div>
    </>
  )
}