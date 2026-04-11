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
  { agent: 'Research', icon: '🔍', color: '#6366F1', text: 'Scanning 2.3M trending topics in Personal Finance India...' },
  { agent: 'Research', icon: '🔍', color: '#6366F1', text: '✓ Found: "RBI rate cut impact on home loans" — 1.8M views in 24hrs' },
  { agent: 'Research', icon: '🔍', color: '#6366F1', text: '✓ Hook identified: Loss aversion + specific number = high CTR' },
  { agent: 'Creator', icon: '✍️', color: '#8B5CF6', text: 'Writing hook: "Your EMI is about to change. Here\'s by exactly how much."' },
  { agent: 'Creator', icon: '✍️', color: '#8B5CF6', text: 'Building full script: Hook → Problem → Framework → CTA...' },
  { agent: 'Creator', icon: '✍️', color: '#8B5CF6', text: '✓ Scene 1: Stock footage — family stressed over loan statement' },
  { agent: 'Creator', icon: '✍️', color: '#8B5CF6', text: '✓ Hook psychology: Loss aversion triggers 3.2× more clicks' },
  { agent: 'Publisher', icon: '🚀', color: '#10B981', text: 'Optimising YouTube title for CTR + SEO...' },
  { agent: 'Publisher', icon: '🚀', color: '#10B981', text: '✓ Title: "RBI Cut ₹3,000 From Your EMI — But Only If You Do This"' },
  { agent: 'Publisher', icon: '🚀', color: '#10B981', text: '✓ Instagram caption ready | ✓ TikTok hook ready | ✓ 10 SEO tags' },
  { agent: 'Done', icon: '✨', color: '#F59E0B', text: '🎉 Your complete 7-day content pack is ready. 7 videos planned.' },
]

const STATS = [
  { value: '2.3K+', label: 'Creators' },
  { value: '90s', label: 'Generation' },
  { value: '3', label: 'AI Agents' },
  { value: 'Free', label: 'Forever' },
]

export default function Hero() {
  const [nicheIndex, setNicheIndex] = useState(0)
  const [displayedNiche, setDisplayedNiche] = useState('')
  const [isTyping, setIsTyping] = useState(true)
  const [demoLines, setDemoLines] = useState([])
  const [demoRunning, setDemoRunning] = useState(false)
  const [activeAgent, setActiveAgent] = useState('research')
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

        if (line.agent === 'Research') setActiveAgent('research')
        else if (line.agent === 'Creator') setActiveAgent('creator')
        else if (line.agent === 'Publisher') setActiveAgent('publisher')
        else if (line.agent === 'Done') setActiveAgent('done')

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
          setActiveAgent('research')
        }, 5000)
      }
    }

    setTimeout(addLine, 1200)
  }, [demoRunning])

  return (
    <>
      <style>{`
        /* Fully Responsive White Background Hero */
        .hero-corporate {
          position: relative;
          min-height: 100vh;
          background: #FFFFFF;
          display: flex;
          align-items: center;
          overflow: hidden;
          padding: clamp(60px, 10vh, 100px) clamp(1rem, 5vw, 3rem) clamp(40px, 8vh, 80px);
        }

        /* Subtle gradient overlays - keeping very light */
        .hero-bg-subtle {
          position: absolute;
          inset: 0;
          background: 
            radial-gradient(circle at 0% 0%, rgba(99, 102, 241, 0.02) 0%, transparent 50%),
            radial-gradient(circle at 100% 100%, rgba(139, 92, 246, 0.02) 0%, transparent 50%),
            radial-gradient(circle at 50% 50%, rgba(16, 185, 129, 0.01) 0%, transparent 70%);
          z-index: 1;
          pointer-events: none;
        }

        /* Animated grid - very subtle */
        .hero-grid-pattern {
          position: absolute;
          inset: 0;
          background-image: 
            linear-gradient(rgba(99, 102, 241, 0.02) 1px, transparent 1px),
            linear-gradient(90deg, rgba(99, 102, 241, 0.02) 1px, transparent 1px);
          background-size: clamp(30px, 5vw, 50px) clamp(30px, 5vw, 50px);
          z-index: 1;
          animation: grid-shift 20s linear infinite;
          pointer-events: none;
        }

        /* Floating elements - very light */
        .hero-float-element {
          position: absolute;
          border-radius: 20px;
          background: linear-gradient(135deg, rgba(99, 102, 241, 0.03) 0%, rgba(139, 92, 246, 0.03) 100%);
          z-index: 1;
          animation: float-gentle 6s ease-in-out infinite;
          pointer-events: none;
        }

        .float-1 {
          width: clamp(150px, 30vw, 300px);
          height: clamp(150px, 30vw, 300px);
          top: -10%;
          right: -5%;
          animation-delay: 0s;
        }

        .float-2 {
          width: clamp(100px, 20vw, 200px);
          height: clamp(100px, 20vw, 200px);
          bottom: -5%;
          left: -5%;
          animation-delay: -3s;
        }

        /* Content Container */
        .hero-container {
          position: relative;
          z-index: 10;
          max-width: 1280px;
          width: 100%;
          margin: 0 auto;
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: clamp(1.5rem, 4vw, 3rem);
          align-items: center;
        }

        /* Left Content */
        .hero-content {
          display: flex;
          flex-direction: column;
          gap: clamp(0.75rem, 2vw, 1.25rem);
        }

        /* Badge */
        .hero-badge-corporate {
          display: inline-flex;
          align-items: center;
          gap: clamp(4px, 1vw, 8px);
          padding: clamp(4px, 0.8vw, 6px) clamp(12px, 2vw, 16px);
          background: linear-gradient(135deg, rgba(99, 102, 241, 0.06) 0%, rgba(139, 92, 246, 0.06) 100%);
          border: 1px solid rgba(99, 102, 241, 0.12);
          border-radius: 100px;
          width: fit-content;
          animation: slide-up 0.5s ease both;
        }

        .badge-icon {
          font-size: clamp(0.75rem, 1.5vw, 1rem);
        }

        .badge-text {
          font-size: clamp(0.65rem, 1.3vw, 0.8rem);
          font-weight: 600;
          color: #6366F1;
          letter-spacing: 0.02em;
        }

        /* Main Title */
        .hero-title-corporate {
          animation: slide-up 0.5s ease 0.1s both;
        }

        .title-main {
          font-size: clamp(1.8rem, 6vw, 3.5rem);
          font-weight: 700;
          line-height: 1.15;
          letter-spacing: -0.02em;
          color: #0F172A;
          margin-bottom: 0.5rem;
        }

        .title-gradient {
          background: linear-gradient(135deg, #6366F1 0%, #8B5CF6 50%, #10B981 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        /* Niche Display */
        .hero-niche-corporate {
          display: flex;
          align-items: center;
          gap: clamp(6px, 1.5vw, 12px);
          padding: clamp(6px, 1.2vw, 10px) clamp(12px, 2vw, 18px);
          background: #FAFAFA;
          border: 1px solid #E5E7EB;
          border-radius: 12px;
          width: fit-content;
          max-width: 100%;
          animation: slide-up 0.5s ease 0.15s both;
        }

        .niche-icon-corporate {
          font-size: clamp(0.9rem, 1.8vw, 1.2rem);
        }

        .niche-info {
          display: flex;
          flex-direction: column;
          gap: 2px;
          min-width: 0;
        }

        .niche-label-corporate {
          font-size: clamp(0.55rem, 1vw, 0.7rem);
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: #6B7280;
        }

        .niche-value-corporate {
          font-size: clamp(0.8rem, 1.5vw, 1rem);
          font-weight: 600;
          color: #1F2937;
          font-family: 'SF Mono', 'Monaco', monospace;
          word-break: break-word;
        }

        .cursor-corporate {
          display: inline-block;
          width: 2px;
          height: clamp(12px, 2vw, 16px);
          background: #6366F1;
          margin-left: 2px;
          animation: blink 1s step-end infinite;
        }

        /* Description */
        .hero-description-corporate {
          font-size: clamp(0.85rem, 1.5vw, 1rem);
          line-height: 1.6;
          color: #4B5563;
          animation: slide-up 0.5s ease 0.2s both;
        }

        .hero-description-corporate strong {
          color: #111827;
          font-weight: 600;
        }

        /* Agent Pills */
        .agent-pills-corporate {
          display: flex;
          gap: clamp(4px, 1vw, 8px);
          flex-wrap: wrap;
          animation: slide-up 0.5s ease 0.25s both;
        }

        .pill-corporate {
          display: flex;
          align-items: center;
          gap: clamp(3px, 0.8vw, 6px);
          padding: clamp(5px, 1vw, 8px) clamp(8px, 1.5vw, 14px);
          background: #FAFAFA;
          border: 1px solid #E5E7EB;
          border-radius: 40px;
          transition: all 0.2s ease;
        }

        .pill-corporate:hover {
          border-color: #6366F1;
          background: #FFFFFF;
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(99, 102, 241, 0.08);
        }

        .pill-icon {
          font-size: clamp(0.8rem, 1.3vw, 1rem);
        }

        .pill-text {
          font-size: clamp(0.7rem, 1.2vw, 0.85rem);
          font-weight: 500;
          color: #374151;
        }

        /* CTA Section */
        .hero-cta-corporate {
          display: flex;
          align-items: center;
          gap: clamp(8px, 1.5vw, 16px);
          flex-wrap: wrap;
          animation: slide-up 0.5s ease 0.3s both;
        }

        .btn-primary-corporate {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: clamp(4px, 0.8vw, 8px);
          padding: clamp(10px, 1.5vw, 14px) clamp(16px, 2.5vw, 28px);
          background: linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%);
          border: none;
          border-radius: 12px;
          color: white;
          font-weight: 600;
          font-size: clamp(0.85rem, 1.4vw, 1rem);
          text-decoration: none;
          transition: all 0.2s ease;
          box-shadow: 0 4px 12px rgba(99, 102, 241, 0.15);
          white-space: nowrap;
        }

        .btn-primary-corporate:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(99, 102, 241, 0.25);
        }

        .btn-primary-corporate:active {
          transform: translateY(0);
        }

        .btn-secondary-corporate {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: clamp(4px, 0.8vw, 8px);
          padding: clamp(10px, 1.5vw, 14px) clamp(16px, 2.5vw, 24px);
          background: #FFFFFF;
          border: 1px solid #E5E7EB;
          border-radius: 12px;
          color: #374151;
          font-weight: 500;
          font-size: clamp(0.85rem, 1.4vw, 1rem);
          text-decoration: none;
          transition: all 0.2s ease;
          white-space: nowrap;
        }

        .btn-secondary-corporate:hover {
          border-color: #6366F1;
          background: #FAFAFA;
          transform: translateY(-1px);
        }

        .btn-secondary-corporate:active {
          transform: translateY(0);
        }

        /* Stats */
        .hero-stats-corporate {
          display: flex;
          gap: clamp(1rem, 3vw, 2rem);
          padding-top: 0.5rem;
          animation: slide-up 0.5s ease 0.35s both;
          flex-wrap: wrap;
        }

        .stat-corporate {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .stat-value-corporate {
          font-size: clamp(1.1rem, 2.5vw, 1.5rem);
          font-weight: 700;
          color: #6366F1;
          line-height: 1.2;
        }

        .stat-label-corporate {
          font-size: clamp(0.6rem, 1vw, 0.75rem);
          font-weight: 500;
          color: #6B7280;
          text-transform: uppercase;
          letter-spacing: 0.03em;
        }

        /* Right - Demo Panel */
        .hero-demo-corporate {
          animation: slide-up 0.6s ease 0.2s both;
        }

        .demo-card {
          background: #FFFFFF;
          border: 1px solid #E5E7EB;
          border-radius: clamp(12px, 2vw, 20px);
          overflow: hidden;
          box-shadow: 
            0 20px 40px -10px rgba(0, 0, 0, 0.03),
            0 0 0 1px rgba(99, 102, 241, 0.03);
        }

        .demo-header-corporate {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: clamp(8px, 1.5vw, 14px) clamp(12px, 2vw, 18px);
          background: #FAFAFA;
          border-bottom: 1px solid #E5E7EB;
        }

        .demo-controls {
          display: flex;
          gap: clamp(3px, 0.6vw, 6px);
        }

        .control {
          width: clamp(7px, 1vw, 10px);
          height: clamp(7px, 1vw, 10px);
          border-radius: 50%;
        }

        .control.red { background: #EF4444; }
        .control.yellow { background: #F59E0B; }
        .control.green { background: #10B981; }

        .demo-header-title {
          font-family: 'SF Mono', monospace;
          font-size: clamp(0.6rem, 1.1vw, 0.75rem);
          color: #6B7280;
          font-weight: 500;
        }

        .demo-badge-live {
          display: flex;
          align-items: center;
          gap: clamp(2px, 0.4vw, 4px);
          padding: clamp(2px, 0.5vw, 4px) clamp(6px, 1vw, 10px);
          background: rgba(16, 185, 129, 0.08);
          border: 1px solid rgba(16, 185, 129, 0.15);
          border-radius: 100px;
        }

        .live-dot {
          width: clamp(4px, 0.7vw, 6px);
          height: clamp(4px, 0.7vw, 6px);
          border-radius: 50%;
          background: #10B981;
          animation: pulse 1.5s ease infinite;
        }

        .live-text {
          font-size: clamp(0.5rem, 0.9vw, 0.65rem);
          font-weight: 700;
          color: #10B981;
          letter-spacing: 0.05em;
        }

        .demo-body-corporate {
          padding: clamp(10px, 1.5vw, 16px);
          min-height: clamp(200px, 35vh, 280px);
          max-height: clamp(200px, 35vh, 280px);
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          gap: clamp(5px, 1vw, 8px);
          background: #FFFFFF;
        }

        .demo-body-corporate::-webkit-scrollbar {
          width: 3px;
        }

        .demo-body-corporate::-webkit-scrollbar-thumb {
          background: #D1D5DB;
          border-radius: 4px;
        }

        .demo-line-corporate {
          display: flex;
          align-items: flex-start;
          gap: clamp(6px, 1vw, 10px);
          padding: clamp(6px, 1.2vw, 10px) clamp(8px, 1.5vw, 12px);
          background: #FAFAFA;
          border: 1px solid #E5E7EB;
          border-radius: clamp(6px, 1vw, 10px);
          animation: slide-in 0.3s ease both;
        }

        .demo-agent-corporate {
          display: flex;
          align-items: center;
          gap: clamp(2px, 0.5vw, 4px);
          padding: clamp(2px, 0.4vw, 3px) clamp(5px, 0.8vw, 8px);
          border-radius: 6px;
          font-size: clamp(0.5rem, 0.9vw, 0.65rem);
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.03em;
          font-family: 'SF Mono', monospace;
          flex-shrink: 0;
        }

        .demo-agent-corporate.research {
          background: rgba(99, 102, 241, 0.08);
          color: #6366F1;
        }

        .demo-agent-corporate.creator {
          background: rgba(139, 92, 246, 0.08);
          color: #8B5CF6;
        }

        .demo-agent-corporate.publisher {
          background: rgba(16, 185, 129, 0.08);
          color: #10B981;
        }

        .demo-agent-corporate.done {
          background: rgba(245, 158, 11, 0.08);
          color: #F59E0B;
        }

        .demo-message-corporate {
          font-family: 'SF Mono', monospace;
          font-size: clamp(0.65rem, 1.1vw, 0.8rem);
          color: #4B5563;
          line-height: 1.4;
          flex: 1;
          word-break: break-word;
        }

        .demo-message-corporate.done {
          color: #F59E0B;
          font-weight: 500;
        }

        .demo-empty-corporate {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 100%;
          min-height: clamp(160px, 25vh, 240px);
          gap: clamp(8px, 1.5vw, 12px);
        }

        .empty-animation-corporate {
          font-size: clamp(1.8rem, 4vw, 2.5rem);
          animation: float-gentle 3s ease-in-out infinite;
        }

        .empty-text-corporate {
          font-family: 'SF Mono', monospace;
          font-size: clamp(0.65rem, 1.1vw, 0.8rem);
          color: #9CA3AF;
        }

        .demo-footer-corporate {
          padding: clamp(8px, 1.2vw, 12px) clamp(12px, 2vw, 18px);
          background: #FAFAFA;
          border-top: 1px solid #E5E7EB;
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 8px;
        }

        .agent-status-corporate {
          display: flex;
          gap: clamp(5px, 1vw, 10px);
          flex-wrap: wrap;
        }

        .status-item-corporate {
          display: flex;
          align-items: center;
          gap: clamp(3px, 0.5vw, 5px);
          opacity: 0.5;
          transition: all 0.2s ease;
        }

        .status-item-corporate.active {
          opacity: 1;
        }

        .status-dot-corporate {
          width: clamp(4px, 0.7vw, 6px);
          height: clamp(4px, 0.7vw, 6px);
          border-radius: 50%;
          background: #9CA3AF;
        }

        .status-item-corporate.active .status-dot-corporate {
          background: #10B981;
          animation: pulse 1.5s ease infinite;
        }

        .status-name-corporate {
          font-size: clamp(0.55rem, 0.9vw, 0.7rem);
          font-weight: 600;
          color: #6B7280;
          text-transform: uppercase;
          letter-spacing: 0.03em;
        }

        .status-item-corporate.active .status-name-corporate {
          color: #374151;
        }

        .demo-timer-corporate {
          font-family: 'SF Mono', monospace;
          font-size: clamp(0.55rem, 0.9vw, 0.7rem);
          color: #6B7280;
          padding: clamp(2px, 0.5vw, 4px) clamp(6px, 1vw, 10px);
          background: #FFFFFF;
          border: 1px solid #E5E7EB;
          border-radius: 6px;
        }

        /* Animations */
        @keyframes slide-up {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes slide-in {
          from {
            opacity: 0;
            transform: translateX(-10px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        @keyframes float-gentle {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-10px);
          }
        }

        @keyframes grid-shift {
          0% {
            transform: translate(0, 0);
          }
          100% {
            transform: translate(50px, 50px);
          }
        }

        @keyframes pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.5;
          }
        }

        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }

        /* Tablet Responsive */
        @media (max-width: 1024px) and (min-width: 641px) {
          .hero-container {
            grid-template-columns: 1fr;
            gap: 2.5rem;
            max-width: 700px;
          }
          
          .hero-content {
            text-align: center;
            align-items: center;
          }
          
          .hero-badge-corporate,
          .hero-niche-corporate,
          .agent-pills-corporate,
          .hero-cta-corporate,
          .hero-stats-corporate {
            justify-content: center;
          }

          .hero-niche-corporate {
            margin: 0 auto;
          }

          .demo-card {
            max-width: 600px;
            margin: 0 auto;
          }

          .title-main br {
            display: none;
          }
        }

        /* Mobile Responsive */
        @media (max-width: 640px) {
          .hero-corporate {
            padding: 50px 1rem 40px;
            min-height: auto;
          }
          
          .hero-container {
            grid-template-columns: 1fr;
            gap: 2rem;
          }
          
          .hero-content {
            text-align: center;
            align-items: center;
          }
          
          .hero-badge-corporate,
          .hero-niche-corporate {
            margin: 0 auto;
          }

          .hero-niche-corporate {
            width: 100%;
            max-width: 300px;
            justify-content: center;
          }
          
          .title-main {
            font-size: clamp(1.8rem, 8vw, 2.5rem);
          }
          
          .title-main br {
            display: none;
          }
          
          .hero-description-corporate {
            padding: 0 0.5rem;
          }
          
          .hero-stats-corporate {
            justify-content: center;
            gap: 1.2rem;
          }
          
          .hero-cta-corporate {
            flex-direction: column;
            width: 100%;
          }
          
          .btn-primary-corporate,
          .btn-secondary-corporate {
            width: 100%;
            max-width: 280px;
          }
          
          .agent-pills-corporate {
            justify-content: center;
            padding: 0 0.5rem;
          }
          
          .pill-corporate {
            flex: 0 1 auto;
          }

          .demo-body-corporate {
            min-height: 220px;
            max-height: 220px;
          }

          .demo-footer-corporate {
            flex-direction: column;
            align-items: flex-start;
          }

          .demo-timer-corporate {
            align-self: flex-end;
          }

          .float-1,
          .float-2 {
            opacity: 0.3;
          }
        }

        /* Small Mobile */
        @media (max-width: 380px) {
          .hero-corporate {
            padding: 40px 0.75rem 30px;
          }

          .title-main {
            font-size: 1.6rem;
          }

          .hero-stats-corporate {
            gap: 1rem;
          }

          .stat-value-corporate {
            font-size: 1rem;
          }

          .stat-label-corporate {
            font-size: 0.55rem;
          }

          .agent-pills-corporate {
            gap: 4px;
          }

          .pill-corporate {
            padding: 5px 8px;
          }

          .pill-text {
            font-size: 0.65rem;
          }

          .demo-line-corporate {
            flex-direction: column;
            align-items: flex-start;
            gap: 6px;
          }

          .demo-agent-corporate {
            align-self: flex-start;
          }

          .demo-message-corporate {
            font-size: 0.6rem;
          }

          .agent-status-corporate {
            gap: 8px;
          }

          .btn-primary-corporate,
          .btn-secondary-corporate {
            max-width: 100%;
            white-space: normal;
          }
        }

        /* Touch Device Optimizations */
        @media (hover: none) and (pointer: coarse) {
          .btn-primary-corporate,
          .btn-secondary-corporate,
          .pill-corporate {
            cursor: default;
            -webkit-tap-highlight-color: transparent;
          }

          .btn-primary-corporate:active,
          .btn-secondary-corporate:active {
            opacity: 0.8;
          }

          .pill-corporate:active {
            background: #F3F4F6;
          }
        }

        /* High DPI Screens */
        @media (-webkit-min-device-pixel-ratio: 2), (min-resolution: 192dpi) {
          .hero-grid-pattern {
            background-size: 40px 40px;
          }
        }

        /* Landscape Mode */
        @media (max-height: 600px) and (orientation: landscape) {
          .hero-corporate {
            min-height: auto;
            padding: 60px 1.5rem 40px;
          }

          .hero-container {
            gap: 1.5rem;
          }

          .demo-body-corporate {
            min-height: 180px;
            max-height: 180px;
          }

          .hero-content {
            gap: 0.5rem;
          }
        }

        /* Large Desktop */
        @media (min-width: 1440px) {
          .hero-container {
            max-width: 1400px;
          }

          .title-main {
            font-size: 4rem;
          }
        }
      `}</style>

      <section className="hero-corporate">
        {/* Background Elements - All white/very light */}
        <div className="hero-bg-subtle" />
        <div className="hero-grid-pattern" />
        <div className="hero-float-element float-1" />
        <div className="hero-float-element float-2" />

        {/* Main Container */}
        <div className="hero-container">
          {/* Left Column */}
          <div className="hero-content">
            {/* Badge */}
            <div className="hero-badge-corporate">
              <span className="badge-icon">✨</span>
              <span className="badge-text">AI-Powered Content Studio</span>
            </div>

            {/* Title */}
            <div className="hero-title-corporate">
              <h1 className="title-main">
                Your next <span className="title-gradient">7 videos</span>
                <br />
                researched, written,
                <br />
                ready to publish
              </h1>
            </div>

            {/* Niche */}
            <div className="hero-niche-corporate">
              <span className="niche-icon-corporate">🎯</span>
              <div className="niche-info">
                <span className="niche-label-corporate">Active Niche</span>
                <span className="niche-value-corporate">
                  {displayedNiche}
                  {isTyping && <span className="cursor-corporate" />}
                </span>
              </div>
            </div>

            {/* Description */}
            <p className="hero-description-corporate">
              Three specialized AI agents working together to research trends, 
              write production-ready scripts, and optimize for publishing — 
              <strong> all in 90 seconds.</strong>
            </p>

            {/* Agent Pills */}
            <div className="agent-pills-corporate">
              <div className="pill-corporate">
                <span className="pill-icon">🔍</span>
                <span className="pill-text">Research Agent</span>
              </div>
              <div className="pill-corporate">
                <span className="pill-icon">✍️</span>
                <span className="pill-text">Creator Agent</span>
              </div>
              <div className="pill-corporate">
                <span className="pill-icon">🚀</span>
                <span className="pill-text">Publisher Agent</span>
              </div>
            </div>

            {/* CTA */}
            <div className="hero-cta-corporate">
              <a href="/generate" className="btn-primary-corporate">
                <span>✨</span>
                Start Creating Free
                <span>→</span>
              </a>
              <a href="#how-it-works" className="btn-secondary-corporate">
                <span>▶</span>
                Watch Demo
              </a>
            </div>

            {/* Stats */}
            <div className="hero-stats-corporate">
              {STATS.map(stat => (
                <div key={stat.label} className="stat-corporate">
                  <span className="stat-value-corporate">{stat.value}</span>
                  <span className="stat-label-corporate">{stat.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Right Column - Demo */}
          <div className="hero-demo-corporate">
            <div className="demo-card">
              {/* Header */}
              <div className="demo-header-corporate">
                <div className="demo-controls">
                  <div className="control red" />
                  <div className="control yellow" />
                  <div className="control green" />
                </div>
                <span className="demo-header-title">studio-ai / pipeline</span>
                <div className="demo-badge-live">
                  <span className="live-dot" />
                  <span className="live-text">LIVE</span>
                </div>
              </div>

              {/* Body */}
              <div className="demo-body-corporate" ref={demoRef}>
                {demoLines.length === 0 ? (
                  <div className="demo-empty-corporate">
                    <div className="empty-animation-corporate">🤖</div>
                    <p className="empty-text-corporate">Initializing agents...</p>
                  </div>
                ) : (
                  demoLines.map((line, i) => (
                    <div key={i} className="demo-line-corporate">
                      <span className={`demo-agent-corporate ${line.agent.toLowerCase()}`}>
                        {line.icon} {line.agent}
                      </span>
                      <span className={`demo-message-corporate ${line.agent === 'Done' ? 'done' : ''}`}>
                        {line.text}
                      </span>
                    </div>
                  ))
                )}
              </div>

              {/* Footer */}
              <div className="demo-footer-corporate">
                <div className="agent-status-corporate">
                  <div className={`status-item-corporate ${activeAgent === 'research' ? 'active' : ''}`}>
                    <span className="status-dot-corporate" />
                    <span className="status-name-corporate">Research</span>
                  </div>
                  <div className={`status-item-corporate ${activeAgent === 'creator' ? 'active' : ''}`}>
                    <span className="status-dot-corporate" />
                    <span className="status-name-corporate">Creator</span>
                  </div>
                  <div className={`status-item-corporate ${activeAgent === 'publisher' ? 'active' : ''}`}>
                    <span className="status-dot-corporate" />
                    <span className="status-name-corporate">Publisher</span>
                  </div>
                </div>
                <span className="demo-timer-corporate">
                  {demoLines.length > 0 && demoLines[demoLines.length - 1].agent !== 'Done'
                    ? `${(demoLines.length * 0.8).toFixed(1)}s`
                    : demoLines.some(l => l.agent === 'Done') ? '✓ 8.8s' : '0.0s'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}