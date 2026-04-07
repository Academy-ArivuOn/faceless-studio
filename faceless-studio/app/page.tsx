'use client';
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';

// ─── STUDIO AI LANDING PAGE ────────────────────────────────────────────────
// Corporate Premium White/Black theme
// Font: Playfair Display (headings) + DM Sans (body) + JetBrains Mono (code)

const STATS = [
  { value: '13', label: 'AI Agents' },
  { value: '90s', label: 'Full Pack Generated' },
  { value: '₹399', label: 'Pro Plan/Month' },
  { value: '3', label: 'Free Generations' },
];

const FEATURES = [
  {
    num: '01',
    icon: '◎',
    title: 'Research Agent',
    desc: 'Scans 2M+ trending signals across your niche. Returns the 3 strongest angles with hook psychology, competitor gaps, and optimal upload timing.',
    tags: ['Trend Analysis', 'Hook Selection', 'Gap Finding'],
    plan: 'Free',
  },
  {
    num: '02',
    icon: '◈',
    title: 'Creator Agent',
    desc: 'Writes a complete word-for-word script with scene-by-scene production direction, B-roll search terms, retention techniques, and pattern interrupts.',
    tags: ['Full Script', 'Scene Breakdown', 'VO Direction'],
    plan: 'Free',
  },
  {
    num: '03',
    icon: '◇',
    title: 'Publisher Agent',
    desc: 'Generates YouTube title variants, SEO description, 12 tags, Instagram caption, TikTok hook, and a 7-day posting calendar. Ready to paste.',
    tags: ['YouTube SEO', 'Social Captions', '7-Day Plan'],
    plan: 'Free',
  },
  {
    num: '04',
    icon: '⊕',
    title: 'Title Battle (A/B)',
    desc: '10 title variants scored against CTR psychology frameworks: Loss Aversion, Curiosity Gap, Pattern Interrupt, Direct Promise, Social Proof, and more.',
    tags: ['CTR Scoring', 'A/B Ranking', 'Psychology'],
    plan: 'Pro',
  },
  {
    num: '05',
    icon: '⊞',
    title: 'Hook Upgrader',
    desc: 'Paste your weak hook — get 5 rewrites using 5 different psychological triggers, each with neuroscience explanation and platform-fit score.',
    tags: ['5 Rewrites', 'Trigger Analysis', 'Platform Fit'],
    plan: 'Pro',
  },
  {
    num: '06',
    icon: '⊟',
    title: 'Competitor Autopsy',
    desc: 'Dissects any channel — hook patterns, content gaps, thumbnail formulas, monetisation signals, and a personalised battle plan to take their audience.',
    tags: ['Gap Analysis', 'Battle Plan', 'Hook Patterns'],
    plan: 'Studio',
  },
];

const PLANS = [
  {
    id: 'free',
    name: 'Free',
    price: '₹0',
    period: '/month',
    desc: 'Start generating. No card needed.',
    features: ['3 content packs/month', 'Core 3 agents', 'YouTube focus', 'Full script + scene breakdown'],
    locked: ['Generation history', 'Pro agents', 'Regional language mode'],
    cta: 'Start Free',
    href: '/signup',
    highlight: false,
  },
  {
    id: 'pro',
    name: 'Creator Pro',
    price: '₹399',
    period: '/month',
    desc: 'Everything you need to grow a real channel.',
    features: ['Unlimited generations', 'All 8 agents', 'All platforms', 'Complete history', '7-day sprint system', 'Hindi / Tamil / Telugu mode', 'Hook Upgrader + Title Battle'],
    cta: 'Start Pro Free →',
    href: '/signup',
    highlight: true,
    badge: 'Most Popular',
  },
  {
    id: 'studio',
    name: 'Studio',
    price: '₹999',
    period: '/month',
    desc: 'For agencies managing multiple channels.',
    features: ['Everything in Pro', 'All 13 agents', '5 team seats', 'Competitor Autopsy', 'Viral Decoder', 'Channel Strategy', 'Monetisation Coach', 'Script Localiser'],
    cta: 'Contact Us',
    href: '/contact',
    highlight: false,
    badge: 'For Agencies',
  },
];

const PROBLEMS = [
  { q: 'Spending hours writing scripts that sound robotic?', a: 'Creator Agent writes in your exact tone, for your platform, in your language — Hindi, Tamil, Telugu, or English.' },
  { q: 'Not knowing which topic will actually perform?', a: 'Research Agent analyses 2M+ real-time signals, picks the angle with the highest CTR potential, and explains why.' },
  { q: 'Repurposing content takes all your time?', a: 'Publisher Agent generates platform-specific assets for YouTube, Instagram, and TikTok in a single run.' },
];

export default function LandingPage() {
  // 1. Explicitly allow number or null
  const [openProblem, setOpenProblem] = useState<number | null>(null);
  const [annual, setAnnual] = useState(false);
  
  // 2. Define the object shape for animation tracking
  const [visible, setVisible] = useState<Record<string, boolean>>({});
  
  const observers = useRef({});

  useEffect(() => {
    const els = document.querySelectorAll('[data-animate]');
    const obs = new IntersectionObserver(
      entries => entries.forEach(e => {
        if (e.isIntersecting) {
          // Type safety is now ensured here
          const key = e.target.getAttribute('data-animate');
          if (key) {
            setVisible(v => ({ ...v, [key]: true }));
          }
        }
      }),
      { threshold: 0.1 }
    );
    els.forEach(el => obs.observe(el));
    return () => obs.disconnect();
  }, []);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;0,700;0,800;1,700&family=DM+Sans:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html { scroll-behavior: smooth; }

        body {
          font-family: 'DM Sans', sans-serif;
          background: #FFFFFF;
          color: #0A0A0A;
          -webkit-font-smoothing: antialiased;
        }

        .lp-container {
          max-width: 1180px;
          margin: 0 auto;
          padding: 0 32px;
        }

        /* ── NAVBAR ── */
        .lp-nav {
          position: fixed;
          top: 0; left: 0; right: 0;
          z-index: 200;
          background: rgba(255,255,255,0.92);
          backdrop-filter: blur(20px);
          border-bottom: 1px solid #E8E8E8;
        }

        .lp-nav-inner {
          max-width: 1180px;
          margin: 0 auto;
          padding: 0 32px;
          height: 64px;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .lp-nav-logo {
          display: flex;
          align-items: center;
          gap: 10px;
          text-decoration: none;
        }

        .lp-nav-logo-box {
          width: 32px; height: 32px;
          background: #0A0A0A;
          border-radius: 7px;
          display: flex; align-items: center; justify-content: center;
        }

        .lp-nav-logo-name {
          font-family: 'Playfair Display', serif;
          font-size: 17px;
          font-weight: 700;
          color: #0A0A0A;
          letter-spacing: -0.02em;
        }

        .lp-nav-links {
          display: flex;
          align-items: center;
          gap: 32px;
          list-style: none;
        }

        .lp-nav-links a {
          font-size: 14px;
          font-weight: 500;
          color: #5C5C5C;
          text-decoration: none;
          transition: color 0.15s;
        }

        .lp-nav-links a:hover { color: #0A0A0A; }

        .lp-nav-cta {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .btn-ghost {
          background: transparent;
          border: none;
          font-family: 'DM Sans', sans-serif;
          font-size: 14px;
          font-weight: 500;
          color: #5C5C5C;
          cursor: pointer;
          text-decoration: none;
          padding: 0;
          transition: color 0.15s;
        }
        .btn-ghost:hover { color: #0A0A0A; }

        .btn-primary {
          background: #0A0A0A;
          border: none;
          border-radius: 8px;
          padding: 10px 22px;
          font-family: 'DM Sans', sans-serif;
          font-size: 13px;
          font-weight: 700;
          color: #FFFFFF;
          cursor: pointer;
          text-decoration: none;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          transition: all 0.2s;
          letter-spacing: -0.01em;
        }
        .btn-primary:hover {
          background: #1a1a1a;
          transform: translateY(-1px);
          box-shadow: 0 6px 20px rgba(10,10,10,0.2);
        }

        .btn-outline {
          background: transparent;
          border: 1.5px solid #E8E8E8;
          border-radius: 8px;
          padding: 10px 22px;
          font-family: 'DM Sans', sans-serif;
          font-size: 13px;
          font-weight: 600;
          color: #0A0A0A;
          cursor: pointer;
          text-decoration: none;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          transition: all 0.2s;
        }
        .btn-outline:hover {
          border-color: #0A0A0A;
          background: #F5F5F5;
        }

        /* ── HERO ── */
        .lp-hero {
          padding: 160px 0 100px;
          background: #FFFFFF;
          position: relative;
          overflow: hidden;
        }

        .lp-hero::before {
          content: '';
          position: absolute;
          top: 0; left: 0; right: 0;
          height: 1px;
          background: linear-gradient(90deg, transparent, #E8E8E8 30%, #E8E8E8 70%, transparent);
        }

        /* Subtle grid */
        .lp-hero-grid {
          position: absolute;
          inset: 0;
          background-image:
            linear-gradient(#F0F0F0 1px, transparent 1px),
            linear-gradient(90deg, #F0F0F0 1px, transparent 1px);
          background-size: 60px 60px;
          mask-image: radial-gradient(ellipse 80% 60% at 50% 40%, black 30%, transparent 100%);
          pointer-events: none;
        }

        .lp-hero-inner {
          position: relative;
          z-index: 1;
          max-width: 1180px;
          margin: 0 auto;
          padding: 0 32px;
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 80px;
          align-items: center;
        }

        .lp-hero-badge {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: #F5F5F5;
          border: 1px solid #E8E8E8;
          border-radius: 100px;
          padding: 6px 16px;
          margin-bottom: 28px;
          font-size: 11px;
          font-weight: 600;
          color: #5C5C5C;
          letter-spacing: 0.06em;
          text-transform: uppercase;
        }

        .lp-hero-badge-dot {
          width: 6px; height: 6px;
          border-radius: 50%;
          background: #C9A227;
        }

        .lp-hero-title {
          font-family: 'Playfair Display', serif;
          font-size: clamp(38px, 4.5vw, 58px);
          font-weight: 800;
          color: #0A0A0A;
          line-height: 1.1;
          letter-spacing: -0.04em;
          margin-bottom: 24px;
        }

        .lp-hero-title em {
          font-style: italic;
          color: #C9A227;
        }

        .lp-hero-desc {
          font-size: 17px;
          color: #5C5C5C;
          line-height: 1.7;
          max-width: 460px;
          margin-bottom: 40px;
          font-weight: 400;
        }

        .lp-hero-actions {
          display: flex;
          align-items: center;
          gap: 14px;
          margin-bottom: 48px;
          flex-wrap: wrap;
        }

        .btn-primary-lg {
          background: #0A0A0A;
          border: none;
          border-radius: 10px;
          padding: 15px 28px;
          font-family: 'DM Sans', sans-serif;
          font-size: 15px;
          font-weight: 700;
          color: #FFFFFF;
          cursor: pointer;
          text-decoration: none;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          transition: all 0.2s;
          letter-spacing: -0.01em;
        }
        .btn-primary-lg:hover {
          background: #1a1a1a;
          transform: translateY(-2px);
          box-shadow: 0 10px 30px rgba(10,10,10,0.25);
        }

        .btn-outline-lg {
          background: transparent;
          border: 1.5px solid #D8D8D8;
          border-radius: 10px;
          padding: 15px 28px;
          font-family: 'DM Sans', sans-serif;
          font-size: 15px;
          font-weight: 600;
          color: #0A0A0A;
          cursor: pointer;
          text-decoration: none;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          transition: all 0.2s;
        }
        .btn-outline-lg:hover {
          border-color: #0A0A0A;
          background: #F5F5F5;
        }

        .lp-hero-stats {
          display: flex;
          gap: 32px;
          flex-wrap: wrap;
        }

        .lp-hero-stat {
          display: flex;
          flex-direction: column;
          gap: 3px;
        }

        .lp-hero-stat-value {
          font-family: 'Playfair Display', serif;
          font-size: 24px;
          font-weight: 700;
          color: #0A0A0A;
          letter-spacing: -0.04em;
        }

        .lp-hero-stat-label {
          font-size: 11px;
          color: #8C8C8C;
          font-weight: 500;
          text-transform: uppercase;
          letter-spacing: 0.06em;
        }

        /* Hero right: Terminal mockup */
        .lp-hero-right {}

        .lp-terminal {
          background: #0A0A0A;
          border-radius: 14px;
          overflow: hidden;
          box-shadow:
            0 0 0 1px rgba(255,255,255,0.06),
            0 40px 80px rgba(10,10,10,0.25),
            0 0 60px rgba(201,162,39,0.04);
        }

        .lp-terminal-bar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 14px 18px;
          border-bottom: 1px solid rgba(255,255,255,0.07);
          background: rgba(255,255,255,0.03);
        }

        .lp-terminal-dots {
          display: flex;
          gap: 7px;
        }

        .lp-terminal-dot {
          width: 11px; height: 11px;
          border-radius: 50%;
        }

        .lp-terminal-label {
          font-family: 'JetBrains Mono', monospace;
          font-size: 11px;
          color: rgba(255,255,255,0.3);
          letter-spacing: 0.04em;
        }

        .lp-terminal-live {
          display: flex;
          align-items: center;
          gap: 5px;
          font-family: 'JetBrains Mono', monospace;
          font-size: 10px;
          color: #4ADE80;
          font-weight: 500;
        }

        .lp-terminal-live-dot {
          width: 5px; height: 5px;
          border-radius: 50%;
          background: #4ADE80;
          animation: pulse-green 1.5s ease-in-out infinite;
        }

        @keyframes pulse-green {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(0.8); }
        }

        .lp-terminal-body {
          padding: 20px;
          min-height: 300px;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .lp-terminal-line {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          padding: 8px 12px;
          border-radius: 7px;
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.04);
          animation: slide-in 0.3s ease;
        }

        @keyframes slide-in {
          from { opacity: 0; transform: translateX(-8px); }
          to { opacity: 1; transform: translateX(0); }
        }

        .lp-terminal-agent {
          font-family: 'JetBrains Mono', monospace;
          font-size: 10px;
          font-weight: 500;
          letter-spacing: 0.04em;
          text-transform: uppercase;
          padding: 2px 7px;
          border-radius: 4px;
          flex-shrink: 0;
          margin-top: 1px;
          white-space: nowrap;
        }

        .lp-terminal-text {
          font-family: 'JetBrains Mono', monospace;
          font-size: 11px;
          color: rgba(255,255,255,0.65);
          line-height: 1.5;
        }

        .lp-terminal-text.gold { color: #C9A227; }

        .lp-terminal-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 12px 18px;
          border-top: 1px solid rgba(255,255,255,0.06);
          background: rgba(255,255,255,0.02);
        }

        .lp-terminal-footer-agents {
          display: flex;
          gap: 6px;
        }

        .lp-terminal-footer-pill {
          font-family: 'JetBrains Mono', monospace;
          font-size: 10px;
          font-weight: 500;
          padding: 3px 9px;
          border-radius: 100px;
          border: 1px solid transparent;
        }

        .lp-terminal-footer-time {
          font-family: 'JetBrains Mono', monospace;
          font-size: 10px;
          color: rgba(255,255,255,0.25);
        }

        /* ── SECTION COMMONS ── */
        .lp-section {
          padding: 100px 0;
          border-top: 1px solid #F0F0F0;
        }

        .lp-section-alt { background: #F8F8F8; }

        .lp-section-eyebrow {
          font-family: 'JetBrains Mono', monospace;
          font-size: 11px;
          font-weight: 500;
          color: #8C8C8C;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          margin-bottom: 16px;
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .lp-section-eyebrow::before {
          content: '';
          width: 24px;
          height: 1px;
          background: #C9A227;
          flex-shrink: 0;
        }

        .lp-section-title {
          font-family: 'Playfair Display', serif;
          font-size: clamp(28px, 3.5vw, 44px);
          font-weight: 800;
          color: #0A0A0A;
          letter-spacing: -0.04em;
          line-height: 1.15;
          margin-bottom: 18px;
        }

        .lp-section-title em {
          font-style: italic;
          color: #C9A227;
        }

        .lp-section-sub {
          font-size: 17px;
          color: #5C5C5C;
          line-height: 1.7;
          max-width: 560px;
          font-weight: 400;
        }

        /* ── AGENTS GRID ── */
        .lp-agents-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1px;
          background: #E8E8E8;
          border: 1px solid #E8E8E8;
          border-radius: 16px;
          overflow: hidden;
          margin-top: 60px;
        }

        .lp-agent-card {
          background: #FFFFFF;
          padding: 36px 32px;
          transition: background 0.2s;
          cursor: default;
        }

        .lp-agent-card:hover {
          background: #FAFAFA;
        }

        .lp-agent-num {
          font-family: 'JetBrains Mono', monospace;
          font-size: 11px;
          color: #BCBCBC;
          margin-bottom: 20px;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .lp-agent-plan-badge {
          font-size: 10px;
          font-weight: 700;
          padding: 3px 8px;
          border-radius: 100px;
          letter-spacing: 0.06em;
          text-transform: uppercase;
        }

        .lp-agent-plan-free   { background: #F0FDF4; color: #15803D; }
        .lp-agent-plan-pro    { background: #FFF7ED; color: #C2410C; }
        .lp-agent-plan-studio { background: #F5F3FF; color: #6D28D9; }

        .lp-agent-icon {
          font-size: 22px;
          margin-bottom: 14px;
          display: block;
          color: #0A0A0A;
        }

        .lp-agent-title {
          font-family: 'Playfair Display', serif;
          font-size: 19px;
          font-weight: 700;
          color: #0A0A0A;
          margin-bottom: 10px;
          letter-spacing: -0.02em;
          line-height: 1.3;
        }

        .lp-agent-desc {
          font-size: 13px;
          color: #5C5C5C;
          line-height: 1.65;
          margin-bottom: 20px;
        }

        .lp-agent-tags {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
        }

        .lp-agent-tag {
          font-size: 11px;
          font-weight: 500;
          padding: 3px 10px;
          border-radius: 4px;
          background: #F5F5F5;
          color: #5C5C5C;
          border: 1px solid #E8E8E8;
        }

        /* ── PROBLEMS (ACCORDION) ── */
        .lp-problems-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 80px;
          align-items: start;
          margin-top: 60px;
        }

        .lp-problem-item {
          border-bottom: 1px solid #E8E8E8;
        }

        .lp-problem-q {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          padding: 20px 0;
          cursor: pointer;
          font-family: 'DM Sans', sans-serif;
          font-size: 15px;
          font-weight: 600;
          color: #0A0A0A;
          line-height: 1.4;
          background: none;
          border: none;
          width: 100%;
          text-align: left;
          transition: color 0.15s;
        }

        .lp-problem-q:hover { color: #C9A227; }

        .lp-problem-toggle {
          width: 24px; height: 24px;
          border-radius: 50%;
          border: 1.5px solid #E8E8E8;
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
          font-size: 14px;
          color: #8C8C8C;
          transition: all 0.2s;
        }

        .lp-problem-a {
          font-size: 14px;
          color: #5C5C5C;
          line-height: 1.7;
          padding-bottom: 20px;
          overflow: hidden;
          transition: max-height 0.3s ease;
        }

        /* ── PRICING ── */
        .lp-pricing-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 20px;
          margin-top: 60px;
          align-items: start;
        }

        .lp-plan-card {
          border: 1.5px solid #E8E8E8;
          border-radius: 16px;
          padding: 32px;
          background: #FFFFFF;
          position: relative;
          transition: all 0.2s;
        }

        .lp-plan-card:hover {
          border-color: #0A0A0A;
          transform: translateY(-4px);
          box-shadow: 0 16px 48px rgba(10,10,10,0.1);
        }

        .lp-plan-card.highlighted {
          border-color: #0A0A0A;
          background: #0A0A0A;
          box-shadow: 0 20px 60px rgba(10,10,10,0.2);
          transform: scale(1.02);
        }

        .lp-plan-badge {
          position: absolute;
          top: -13px;
          left: 50%;
          transform: translateX(-50%);
          background: #C9A227;
          color: #0A0A0A;
          font-size: 10px;
          font-weight: 800;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          padding: 4px 14px;
          border-radius: 100px;
          white-space: nowrap;
        }

        .lp-plan-name {
          font-family: 'DM Sans', sans-serif;
          font-size: 12px;
          font-weight: 700;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          margin-bottom: 16px;
        }

        .lp-plan-name.light { color: rgba(255,255,255,0.5); }
        .lp-plan-name.dark  { color: #8C8C8C; }

        .lp-plan-price-wrap {
          display: flex;
          align-items: baseline;
          gap: 4px;
          margin-bottom: 8px;
        }

        .lp-plan-price {
          font-family: 'Playfair Display', serif;
          font-size: 40px;
          font-weight: 800;
          letter-spacing: -0.04em;
          line-height: 1;
        }

        .lp-plan-price.light { color: #FFFFFF; }
        .lp-plan-price.dark  { color: #0A0A0A; }

        .lp-plan-period {
          font-size: 14px;
          font-weight: 400;
        }

        .lp-plan-period.light { color: rgba(255,255,255,0.4); }
        .lp-plan-period.dark  { color: #8C8C8C; }

        .lp-plan-desc {
          font-size: 13px;
          margin-bottom: 24px;
          padding-bottom: 24px;
          border-bottom: 1px solid;
          line-height: 1.5;
        }

        .lp-plan-desc.light { color: rgba(255,255,255,0.45); border-color: rgba(255,255,255,0.1); }
        .lp-plan-desc.dark  { color: #8C8C8C; border-color: #F0F0F0; }

        .lp-plan-features {
          display: flex;
          flex-direction: column;
          gap: 10px;
          margin-bottom: 28px;
        }

        .lp-plan-feature {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          font-size: 13px;
          line-height: 1.4;
        }

        .lp-plan-feature.light { color: rgba(255,255,255,0.75); }
        .lp-plan-feature.dark  { color: #3C3C3C; }
        .lp-plan-feature.muted { color: #BCBCBC; text-decoration: line-through; }

        .lp-plan-check {
          width: 16px; height: 16px;
          border-radius: 50%;
          flex-shrink: 0;
          margin-top: 1px;
          display: flex; align-items: center; justify-content: center;
          font-size: 9px;
        }

        .lp-plan-check.yes-light { background: rgba(201,162,39,0.2); color: #C9A227; }
        .lp-plan-check.yes-dark  { background: #F0F0F0; color: #0A0A0A; }
        .lp-plan-check.no        { background: #F0F0F0; color: #BCBCBC; }

        .lp-plan-cta {
          display: block;
          text-align: center;
          padding: 13px 20px;
          border-radius: 9px;
          font-family: 'DM Sans', sans-serif;
          font-size: 14px;
          font-weight: 700;
          text-decoration: none;
          cursor: pointer;
          transition: all 0.2s;
          letter-spacing: -0.01em;
          border: none;
        }

        .lp-plan-cta.white {
          background: #FFFFFF;
          color: #0A0A0A;
        }
        .lp-plan-cta.white:hover {
          background: #F5F5F5;
          transform: translateY(-1px);
        }

        .lp-plan-cta.black {
          background: #0A0A0A;
          color: #FFFFFF;
        }
        .lp-plan-cta.black:hover {
          background: #1a1a1a;
          transform: translateY(-1px);
          box-shadow: 0 6px 20px rgba(10,10,10,0.2);
        }

        .lp-plan-cta.outline {
          background: transparent;
          color: #0A0A0A;
          border: 1.5px solid #E8E8E8;
        }
        .lp-plan-cta.outline:hover {
          border-color: #0A0A0A;
          background: #F5F5F5;
        }

        /* ── CTA BAND ── */
        .lp-cta-band {
          background: #0A0A0A;
          padding: 100px 0;
          text-align: center;
          position: relative;
          overflow: hidden;
        }

        .lp-cta-band::before {
          content: '';
          position: absolute;
          inset: 0;
          background:
            radial-gradient(ellipse at 20% 50%, rgba(201,162,39,0.08) 0%, transparent 60%),
            radial-gradient(ellipse at 80% 50%, rgba(201,162,39,0.04) 0%, transparent 50%);
          pointer-events: none;
        }

        .lp-cta-band-title {
          font-family: 'Playfair Display', serif;
          font-size: clamp(32px, 4vw, 52px);
          font-weight: 800;
          color: #FFFFFF;
          letter-spacing: -0.04em;
          line-height: 1.15;
          margin-bottom: 18px;
          position: relative;
        }

        .lp-cta-band-title em {
          font-style: italic;
          color: #C9A227;
        }

        .lp-cta-band-sub {
          font-size: 16px;
          color: rgba(255,255,255,0.45);
          margin-bottom: 40px;
          position: relative;
          line-height: 1.6;
        }

        .lp-cta-band-actions {
          display: flex;
          justify-content: center;
          gap: 14px;
          flex-wrap: wrap;
          position: relative;
        }

        .btn-cta-white {
          background: #FFFFFF;
          border: none;
          border-radius: 10px;
          padding: 15px 32px;
          font-family: 'DM Sans', sans-serif;
          font-size: 15px;
          font-weight: 700;
          color: #0A0A0A;
          cursor: pointer;
          text-decoration: none;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          transition: all 0.2s;
          letter-spacing: -0.01em;
        }
        .btn-cta-white:hover {
          background: #F5F5F5;
          transform: translateY(-2px);
          box-shadow: 0 10px 30px rgba(255,255,255,0.15);
        }

        .btn-cta-outline-white {
          background: transparent;
          border: 1.5px solid rgba(255,255,255,0.2);
          border-radius: 10px;
          padding: 15px 32px;
          font-family: 'DM Sans', sans-serif;
          font-size: 15px;
          font-weight: 600;
          color: rgba(255,255,255,0.7);
          cursor: pointer;
          text-decoration: none;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          transition: all 0.2s;
        }
        .btn-cta-outline-white:hover {
          border-color: rgba(255,255,255,0.5);
          color: #FFFFFF;
        }

        /* ── FOOTER ── */
        .lp-footer {
          background: #F8F8F8;
          border-top: 1px solid #E8E8E8;
          padding: 48px 0;
        }

        .lp-footer-inner {
          max-width: 1180px;
          margin: 0 auto;
          padding: 0 32px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 20px;
        }

        .lp-footer-brand {
          font-family: 'Playfair Display', serif;
          font-size: 16px;
          font-weight: 700;
          color: #0A0A0A;
        }

        .lp-footer-links {
          display: flex;
          gap: 24px;
          flex-wrap: wrap;
        }

        .lp-footer-links a {
          font-size: 13px;
          color: #8C8C8C;
          text-decoration: none;
          transition: color 0.15s;
        }
        .lp-footer-links a:hover { color: #0A0A0A; }

        .lp-footer-copy {
          font-size: 12px;
          color: #BCBCBC;
        }

        /* Animate on scroll */
        [data-animate] {
          opacity: 0;
          transform: translateY(20px);
          transition: opacity 0.6s ease, transform 0.6s ease;
        }
        [data-animate].visible {
          opacity: 1;
          transform: translateY(0);
        }

        /* Responsive */
        @media (max-width: 1024px) {
          .lp-agents-grid { grid-template-columns: repeat(2, 1fr); }
          .lp-pricing-grid { grid-template-columns: 1fr; max-width: 480px; margin-left: auto; margin-right: auto; }
          .lp-plan-card.highlighted { transform: scale(1); }
          .lp-hero-inner { grid-template-columns: 1fr; }
          .lp-hero-right { display: none; }
          .lp-problems-grid { grid-template-columns: 1fr; }
        }

        @media (max-width: 768px) {
          .lp-agents-grid { grid-template-columns: 1fr; }
          .lp-nav-links { display: none; }
          .lp-section { padding: 72px 0; }
        }

        @media (max-width: 480px) {
          .lp-container { padding: 0 20px; }
          .lp-hero-inner { padding: 0 20px; }
        }
      `}</style>

      {/* ── NAVBAR ── */}
      <nav className="lp-nav">
        <div className="lp-nav-inner">
          <Link href="/" className="lp-nav-logo">
            <div className="lp-nav-logo-box">
              <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
                <polygon points="10,2 17,6 17,14 10,18 3,14 3,6" stroke="#FFFFFF" strokeWidth="1.4" fill="none"/>
                <polygon points="10,6 14,8.5 14,13.5 10,16 6,13.5 6,8.5" fill="#FFFFFF" fillOpacity="0.3"/>
              </svg>
            </div>
            <span className="lp-nav-logo-name">Studio AI</span>
          </Link>

          <ul className="lp-nav-links">
            <li><a href="#agents">Agents</a></li>
            <li><a href="#how-it-works">How It Works</a></li>
            <li><a href="#pricing">Pricing</a></li>
          </ul>

          <div className="lp-nav-cta">
            <Link href="/login" className="btn-ghost">Sign in</Link>
            <Link href="/signup" className="btn-primary">Start Free →</Link>
          </div>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section className="lp-hero">
        <div className="lp-hero-grid" />
        <div className="lp-hero-inner">
          <div>
            <div className="lp-hero-badge">
              <span className="lp-hero-badge-dot" />
              India's Content Operating System
            </div>

            <h1 className="lp-hero-title">
              Your next 7 videos.<br />
              <em>Researched. Written.</em><br />
              Distributed.
            </h1>

            <p className="lp-hero-desc">
              Three specialised AI agents produce a complete content pack — full script, scene breakdown, hook psychology, YouTube SEO, social captions, and 7-day plan — in under 90 seconds.
            </p>

            <div className="lp-hero-actions">
              <Link href="/signup" className="btn-primary-lg">⚡ Generate Free</Link>
              <a href="#how-it-works" className="btn-outline-lg">▶ How It Works</a>
            </div>

            <div className="lp-hero-stats">
              {STATS.map(s => (
                <div className="lp-hero-stat" key={s.label}>
                  <span className="lp-hero-stat-value">{s.value}</span>
                  <span className="lp-hero-stat-label">{s.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Terminal mockup */}
          <div className="lp-hero-right">
            <div className="lp-terminal">
              <div className="lp-terminal-bar">
                <div className="lp-terminal-dots">
                  <div className="lp-terminal-dot" style={{ background: '#FF5F57' }} />
                  <div className="lp-terminal-dot" style={{ background: '#FFBD2E' }} />
                  <div className="lp-terminal-dot" style={{ background: '#28CA41' }} />
                </div>
                <span className="lp-terminal-label">studio-ai / pipeline</span>
                <span className="lp-terminal-live">
                  <span className="lp-terminal-live-dot" /> LIVE
                </span>
              </div>
              <div className="lp-terminal-body">
                {[
                  { agent:'Research', color:'#C9A227', bg:'rgba(201,162,39,0.1)', text:'Scanning personal finance india trends...' },
                  { agent:'Research', color:'#C9A227', bg:'rgba(201,162,39,0.1)', text:'✓ RBI rate cut impact — 1.8M views in 24hrs' },
                  { agent:'Research', color:'#C9A227', bg:'rgba(201,162,39,0.1)', text:'✓ Hook: LOSS_AVERSION • CTR: HIGH' },
                  { agent:'Creator',  color:'#4A90D9', bg:'rgba(74,144,217,0.1)', text:'"Your EMI is about to change. Here\'s by exactly how much."' },
                  { agent:'Creator',  color:'#4A90D9', bg:'rgba(74,144,217,0.1)', text:'✓ Script: 1,247 words • 12 scenes • 2 pattern interrupts' },
                  { agent:'Publisher',color:'#0E7C4A', bg:'rgba(14,124,74,0.1)',  text:'✓ Title + Description + 12 tags ready' },
                  { agent:'Done',     color:'#C9A227', bg:'rgba(201,162,39,0.05)', text:'🎉 Full content pack ready in 8.4s', gold:true },
                ].map((line, i) => (
                  <div className="lp-terminal-line" key={i}>
                    <span className="lp-terminal-agent" style={{ color:line.color, background:line.bg }}>{line.agent}</span>
                    <span className={`lp-terminal-text ${line.gold ? 'gold' : ''}`}>{line.text}</span>
                  </div>
                ))}
              </div>
              <div className="lp-terminal-footer">
                <div className="lp-terminal-footer-agents">
                  {[
                    { n:'Research', c:'rgba(201,162,39,0.15)', tc:'#C9A227' },
                    { n:'Creator',  c:'rgba(74,144,217,0.15)',  tc:'#4A90D9' },
                    { n:'Publisher',c:'rgba(14,124,74,0.15)',   tc:'#0E7C4A' },
                  ].map(a => (
                    <span className="lp-terminal-footer-pill" key={a.n}
                      style={{ background:a.c, color:a.tc, borderColor:`${a.tc}30` }}>
                      {a.n}
                    </span>
                  ))}
                </div>
                <span className="lp-terminal-footer-time">✓ 8.4s total</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── AGENTS ── */}
      <section className="lp-section" id="agents">
        <div className="lp-container">
          <div data-animate="agents-header" className={visible['agents-header'] ? 'visible' : ''}>
            <div className="lp-section-eyebrow">Agent Ecosystem</div>
            <h2 className="lp-section-title">13 agents. <em>One operating system.</em></h2>
            <p className="lp-section-sub">Not a single AI doing everything. A structured pipeline of specialists — each built for exactly one job, each feeding context to the next.</p>
          </div>

          <div className="lp-agents-grid" data-animate="agents-grid" style={{ opacity: visible['agents-grid'] ? 1 : 0, transform: visible['agents-grid'] ? 'none' : 'translateY(20px)', transition: 'opacity 0.6s ease, transform 0.6s ease' }}>
            {FEATURES.map(f => (
              <div className="lp-agent-card" key={f.num}>
                <div className="lp-agent-num">
                  <span>{f.num}</span>
                  <span className={`lp-agent-plan-badge lp-agent-plan-${f.plan.toLowerCase()}`}>{f.plan}</span>
                </div>
                <span className="lp-agent-icon">{f.icon}</span>
                <h3 className="lp-agent-title">{f.title}</h3>
                <p className="lp-agent-desc">{f.desc}</p>
                <div className="lp-agent-tags">
                  {f.tags.map(t => <span className="lp-agent-tag" key={t}>{t}</span>)}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PROBLEMS ── */}
      <section className="lp-section lp-section-alt" id="how-it-works">
        <div className="lp-container">
          <div className="lp-problems-grid">
            <div>
              <div className="lp-section-eyebrow">The Problem</div>
              <h2 className="lp-section-title">Every creator has <em>these exact problems.</em></h2>
              <p className="lp-section-sub">We built Studio AI to solve them — not with a chatbot, but with a structured pipeline that knows what it's doing.</p>
            </div>

            <div>
              {PROBLEMS.map((p, i) => (
                <div className="lp-problem-item" key={i}>
                  <button
                    className="lp-problem-q"
                    onClick={() => setOpenProblem(openProblem === i ? null : i)}
                  >
                    {p.q}
                    <div className="lp-problem-toggle">
                      {openProblem === i ? '−' : '+'}
                    </div>
                  </button>
                  {openProblem === i && (
                    <div className="lp-problem-a">{p.a}</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── PRICING ── */}
      <section className="lp-section" id="pricing">
        <div className="lp-container">
          <div className="lp-section-eyebrow">Pricing</div>
          <h2 className="lp-section-title">Start free. <em>Upgrade when it clicks.</em></h2>
          <p className="lp-section-sub">No card on signup. The free plan works. The paid plan pays for itself the first week.</p>

          <div className="lp-pricing-grid">
            {PLANS.map(plan => {
              const hl = plan.highlight;
              const cl = hl ? 'light' : 'dark';
              return (
                <div className={`lp-plan-card ${hl ? 'highlighted' : ''}`} key={plan.id}>
                  {plan.badge && <div className="lp-plan-badge">{plan.badge}</div>}
                  <p className={`lp-plan-name ${cl}`}>{plan.name}</p>
                  <div className="lp-plan-price-wrap">
                    <span className={`lp-plan-price ${cl}`}>{plan.price}</span>
                    <span className={`lp-plan-period ${cl}`}>{plan.period}</span>
                  </div>
                  <p className={`lp-plan-desc ${cl}`}>{plan.desc}</p>
                  <div className="lp-plan-features">
                    {plan.features.map(f => (
                      <div className={`lp-plan-feature ${cl}`} key={f}>
                        <div className={`lp-plan-check ${hl ? 'yes-light' : 'yes-dark'}`}>✓</div>
                        <span>{f}</span>
                      </div>
                    ))}
                    {(plan.locked || []).map(f => (
                      <div className="lp-plan-feature muted" key={f}>
                        <div className="lp-plan-check no">✕</div>
                        <span>{f}</span>
                      </div>
                    ))}
                  </div>
                  <Link
                    href={plan.href}
                    className={`lp-plan-cta ${hl ? 'white' : plan.id === 'studio' ? 'outline' : 'black'}`}
                  >
                    {plan.cta}
                  </Link>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── CTA BAND ── */}
      <section className="lp-cta-band">
        <div className="lp-container" style={{ position:'relative', zIndex:1, textAlign:'center' }}>
          <h2 className="lp-cta-band-title">
            Your next video is<br /><em>90 seconds away.</em>
          </h2>
          <p className="lp-cta-band-sub">Free plan · No card · Cancel anytime</p>
          <div className="lp-cta-band-actions">
            <Link href="/signup" className="btn-cta-white">⚡ Start Generating Free</Link>
            <a href="#pricing" className="btn-cta-outline-white">View plans</a>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="lp-footer">
        <div className="lp-footer-inner">
          <span className="lp-footer-brand">Studio AI</span>
          <div className="lp-footer-links">
            <a href="#agents">Agents</a>
            <a href="#pricing">Pricing</a>
            <Link href="/login">Login</Link>
            <Link href="/signup">Sign Up</Link>
          </div>
          <span className="lp-footer-copy">© 2026 Studio AI. Confidential.</span>
        </div>
      </footer>
    </>
  );
}