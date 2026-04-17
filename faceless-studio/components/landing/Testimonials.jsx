'use client'
import { useEffect, useRef, useState } from 'react'

const TESTIMONIALS = [
  {
    quote: "I used to spend entire Sundays scripting 2 videos. Now I generate 7 complete packs in under 15 minutes on Saturday morning. My output tripled. My quality actually went up.",
    name: 'Arjun Mehta',
    handle: '@arjunfinance',
    role: 'Personal Finance Creator',
    platform: 'YouTube',
    subs: '48K subscribers',
    color: '#D4A847',
    avatar: 'AM',
    avatarBg: '#D4A847',
  },
  {
    quote: "The hook psychology tab alone is worth it. I finally understand why some videos blow up and others don't. Studio AI explained it better than any course I paid for.",
    name: 'Priya Krishnan',
    handle: '@priyakrishnan_',
    role: 'Lifestyle Creator',
    platform: 'Instagram',
    subs: '12K followers',
    color: '#2563EB',
    avatar: 'PK',
    avatarBg: '#2563EB',
  },
  {
    quote: "Hindi content that actually sounds natural, not translated. The Script Localiser understood context, Hinglish code-switching, Indian references. Our channel grew 40% in 60 days.",
    name: 'Rahul Sharma',
    handle: '@rahultechhindu',
    role: 'Tech Educator',
    platform: 'YouTube',
    subs: '92K subscribers',
    color: '#059669',
    avatar: 'RS',
    avatarBg: '#059669',
  },
  {
    quote: "As an agency, we manage 6 channels. The Studio plan paid for itself in week one. We cut production time by 70% and our clients' videos are performing better than ever.",
    name: 'Sneha Gupta',
    handle: '@snehaguptamedia',
    role: 'Content Agency Owner',
    platform: 'Multi-platform',
    subs: '6 channels managed',
    color: '#7C3AED',
    avatar: 'SG',
    avatarBg: '#7C3AED',
  },
  {
    quote: "The competitor autopsy feature showed me exactly why my competitor was beating me. I implemented the changes. Within 3 weeks my average views went from 800 to 7,200.",
    name: 'Vikram Nair',
    handle: '@vikraminvests',
    role: 'Investment Creator',
    platform: 'YouTube',
    subs: '24K subscribers',
    color: '#DC2626',
    avatar: 'VN',
    avatarBg: '#DC2626',
  },
  {
    quote: "Free plan was enough to prove it works. Then I upgraded immediately. The 7-day sprint system keeps me consistent and the streak tracker is weirdly addictive.",
    name: 'Kavya Reddy',
    handle: '@kavyafitness',
    role: 'Fitness Creator',
    platform: 'Instagram + YouTube',
    subs: '31K subscribers',
    color: '#0891B2',
    avatar: 'KR',
    avatarBg: '#0891B2',
  },
]

export default function Testimonials() {
  const [visible, setVisible] = useState(false)
  const ref = useRef(null)

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
        .test-section {
          padding: 120px 0;
          background: #F9FAFB;
          overflow: hidden;
        }

        .test-inner {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 24px;
        }

        .test-header {
          text-align: center;
          margin-bottom: 70px;
        }

        .test-eyebrow {
          font-family: 'JetBrains Mono', monospace;
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: #6B7280;
          margin-bottom: 20px;
          display: block;
        }

        .test-title {
          font-family: 'Bricolage Grotesque', sans-serif;
          font-size: clamp(34px, 4.5vw, 54px);
          font-weight: 800;
          color: #0A0A0A;
          letter-spacing: -0.04em;
          line-height: 1.1;
          margin-bottom: 20px;
        }

        .test-sub {
          font-family: 'DM Sans', sans-serif;
          font-size: 17px;
          color: #374151;
          max-width: 500px;
          margin: 0 auto;
          line-height: 1.7;
        }

        /* Masonry-ish grid */
        .test-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 18px;
        }

        .test-card {
          background: #ffffff;
          border: 1.5px solid #E5E7EB;
          border-radius: 18px;
          padding: 28px;
          opacity: 0;
          transform: translateY(24px);
          transition: all 0.7s cubic-bezier(0.16, 1, 0.3, 1);
          position: relative;
          overflow: hidden;
        }

        .test-card.visible {
          opacity: 1;
          transform: translateY(0);
        }

        .test-card:hover {
          border-color: var(--tc-color);
          transform: translateY(-4px);
          box-shadow: 0 12px 48px rgba(0,0,0,0.08);
        }

        .test-card::before {
          content: '"';
          position: absolute;
          top: 16px;
          right: 24px;
          font-family: 'Bricolage Grotesque', sans-serif;
          font-size: 80px;
          font-weight: 800;
          color: rgba(0,0,0,0.04);
          line-height: 1;
        }

        .tc-stars {
          display: flex;
          gap: 2px;
          margin-bottom: 16px;
        }

        .tc-star {
          color: #D4A847;
          font-size: 14px;
        }

        .tc-quote {
          font-family: 'DM Sans', sans-serif;
          font-size: 14px;
          color: #111827;
          line-height: 1.75;
          margin-bottom: 22px;
          font-weight: 400;
          position: relative;
          z-index: 1;
        }

        .tc-author {
          display: flex;
          align-items: center;
          gap: 12px;
          padding-top: 18px;
          border-top: 1px solid #F3F4F6;
        }

        .tc-avatar {
          width: 42px;
          height: 42px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: 'Bricolage Grotesque', sans-serif;
          font-size: 13px;
          font-weight: 800;
          color: #ffffff;
          flex-shrink: 0;
        }

        .tc-name {
          font-family: 'DM Sans', sans-serif;
          font-size: 14px;
          font-weight: 700;
          color: #0A0A0A;
          margin-bottom: 2px;
        }

        .tc-role {
          font-family: 'DM Sans', sans-serif;
          font-size: 12px;
          color: #6B7280;
          margin-bottom: 2px;
        }

        .tc-subs {
          font-family: 'JetBrains Mono', monospace;
          font-size: 11px;
          font-weight: 600;
          color: var(--tc-color);
        }

        /* Trust bar */
        .test-trust-bar {
          margin-top: 60px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 40px;
          flex-wrap: wrap;
          padding: 28px;
          background: #ffffff;
          border: 1px solid #E5E7EB;
          border-radius: 16px;
          opacity: 0;
          transform: translateY(16px);
          transition: all 0.6s ease 0.6s;
        }

        .test-trust-bar.visible {
          opacity: 1;
          transform: translateY(0);
        }

        .trust-stat {
          text-align: center;
        }

        .trust-num {
          font-family: 'Bricolage Grotesque', sans-serif;
          font-size: 28px;
          font-weight: 800;
          color: #0A0A0A;
          letter-spacing: -0.04em;
          line-height: 1;
          margin-bottom: 4px;
        }

        .trust-label {
          font-family: 'DM Sans', sans-serif;
          font-size: 13px;
          color: #6B7280;
          font-weight: 500;
        }

        .trust-bar-divider {
          width: 1px;
          height: 40px;
          background: #E5E7EB;
        }

        @media (max-width: 900px) {
          .test-grid { grid-template-columns: repeat(2, 1fr); }
          .test-section { padding: 80px 0; }
          .trust-bar-divider { display: none; }
        }

        @media (max-width: 600px) {
          .test-grid { grid-template-columns: 1fr; }
        }
      `}</style>

      <section className="test-section" ref={ref}>
        <div className="test-inner">
          <div className="test-header">
            <span className="test-eyebrow">Creator Stories</span>
            <h2 className="test-title">
              2,300+ creators.<br />
              Real results.
            </h2>
            <p className="test-sub">
              From solo creators to agencies — here's what happens when you stop doing everything manually.
            </p>
          </div>

          <div className="test-grid">
            {TESTIMONIALS.map((t, i) => (
              <div
                key={i}
                className={`test-card ${visible ? 'visible' : ''}`}
                style={{
                  '--tc-color': t.color,
                  transitionDelay: `${i * 0.08}s`,
                }}
              >
                <div className="tc-stars">
                  {[1,2,3,4,5].map(s => <span key={s} className="tc-star">★</span>)}
                </div>
                <p className="tc-quote">"{t.quote}"</p>
                <div className="tc-author">
                  <div className="tc-avatar" style={{ background: t.avatarBg }}>
                    {t.avatar}
                  </div>
                  <div>
                    <div className="tc-name">{t.name}</div>
                    <div className="tc-role">{t.role} · {t.platform}</div>
                    <div className="tc-subs">{t.subs}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className={`test-trust-bar ${visible ? 'visible' : ''}`}>
            {[
              { num: '2,300+', label: 'Active creators' },
              { num: '4.9/5', label: 'Average rating' },
              { num: '48K+', label: 'Content packs generated' },
              { num: '3 months', label: 'Average to monetisation' },
            ].map((s, i) => (
              <>
                {i > 0 && <div key={`div-${i}`} className="trust-bar-divider" />}
                <div key={i} className="trust-stat">
                  <div className="trust-num">{s.num}</div>
                  <div className="trust-label">{s.label}</div>
                </div>
              </>
            ))}
          </div>
        </div>
      </section>
    </>
  )
}