'use client'
import { useEffect, useRef, useState } from 'react'

const COMPARISON_DATA = [
  {
    asset: 'Full script (945 words)',
    chatgpt: '❌ Needs 5+ prompts',
    claude: '❌ Needs 5+ prompts',
    gemini: '❌ Needs 5+ prompts',
    studio: '✅ One niche → ready script',
  },
  {
    asset: 'Scene-by-scene breakdown (8 scenes)',
    chatgpt: '❌ Only generic structure',
    claude: '❌ Only generic structure',
    gemini: '❌ Only generic structure',
    studio: '✅ Camera + B-roll + retention tech',
  },
  {
    asset: 'SEO titles (3 high-CTR options)',
    chatgpt: '❌ Basic titles, no CTR analysis',
    claude: '❌ Basic titles, no CTR analysis',
    gemini: '❌ Basic titles, no CTR analysis',
    studio: '✅ Ranked by click potential',
  },
  {
    asset: '12 SEO tags + meta description',
    chatgpt: '❌ Manual extraction',
    claude: '❌ Manual extraction',
    gemini: '❌ Manual extraction',
    studio: '✅ Auto-generated, niche-relevant',
  },
  {
    asset: 'Instagram caption + hashtags (28)',
    chatgpt: '❌ Generic caption only',
    claude: '❌ Generic caption only',
    gemini: '❌ Generic caption only',
    studio: '✅ Platform-optimised + save CTAs',
  },
  {
    asset: 'TikTok / Reels 60s cut',
    chatgpt: '❌ No short-form adaptation',
    claude: '❌ No short-form adaptation',
    gemini: '❌ No short-form adaptation',
    studio: '✅ Ready-to-record script',
  },
  {
    asset: 'YouTube Shorts script',
    chatgpt: '❌ Not included',
    claude: '❌ Not included',
    gemini: '❌ Not included',
    studio: '✅ Separate short version',
  },
  {
    asset: '7-day content sprint plan',
    chatgpt: '❌ You build the calendar',
    claude: '❌ You build the calendar',
    gemini: '❌ You build the calendar',
    studio: '✅ Day-by-day posts + stories',
  },
  {
    asset: 'Blog post (SEO optimised)',
    chatgpt: '❌ Requires separate prompt',
    claude: '❌ Requires separate prompt',
    gemini: '❌ Requires separate prompt',
    studio: '✅ Full article + meta data',
  },
  {
    asset: 'Hidden charges & booking traps',
    chatgpt: '❌ Generic travel tips',
    claude: '❌ Generic travel tips',
    gemini: '❌ Generic travel tips',
    studio: '✅ Specific to your niche',
  },
]

export default function LiveComparison() {
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
        .comp-section {
          padding: 100px 0;
          background: #F9FAFB;
          overflow-x: auto;
        }

        .comp-inner {
          max-width: 1300px;
          margin: 0 auto;
          padding: 0 24px;
        }

        .comp-header {
          text-align: center;
          margin-bottom: 60px;
        }

        .comp-eyebrow {
          font-family: 'JetBrains Mono', monospace;
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: #6B7280;
          margin-bottom: 20px;
          display: block;
        }

        .comp-title {
          font-family: 'Bricolage Grotesque', sans-serif;
          font-size: clamp(32px, 5vw, 52px);
          font-weight: 800;
          color: #0A0A0A;
          letter-spacing: -0.03em;
          line-height: 1.1;
          margin-bottom: 20px;
        }

        .comp-sub {
          font-family: 'DM Sans', sans-serif;
          font-size: 18px;
          color: #4B5563;
          max-width: 600px;
          margin: 0 auto;
        }

        .comparison-table-wrapper {
          background: #ffffff;
          border-radius: 28px;
          box-shadow: 0 12px 40px rgba(0,0,0,0.05);
          overflow-x: auto;
          border: 1px solid #E5E7EB;
        }

        .comparison-table {
          width: 100%;
          border-collapse: collapse;
          font-family: 'DM Sans', sans-serif;
          min-width: 800px;
        }

        .comparison-table th,
        .comparison-table td {
          padding: 18px 16px;
          text-align: left;
          border-bottom: 1px solid #F0F2F5;
          vertical-align: top;
        }

        .comparison-table th {
          font-family: 'Bricolage Grotesque', sans-serif;
          font-weight: 700;
          font-size: 16px;
          background: #FAFBFC;
          color: #1F2937;
          border-bottom: 2px solid #E5E7EB;
        }

        .comparison-table td:first-child,
        .comparison-table th:first-child {
          padding-left: 24px;
        }

        .comparison-table td:last-child,
        .comparison-table th:last-child {
          padding-right: 24px;
        }

        .asset-cell {
          font-weight: 600;
          color: #0A0A0A;
          font-size: 14px;
        }

        .studio-cell {
          background: rgba(5, 150, 105, 0.03);
          font-weight: 500;
          color: #059669;
        }

        .generic-cell {
          color: #6B7280;
          font-size: 13px;
        }

        .comp-cta {
          margin-top: 50px;
          text-align: center;
        }

        .comp-badge {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: #0A0A0A;
          color: white;
          padding: 12px 28px;
          border-radius: 40px;
          font-family: 'Bricolage Grotesque', sans-serif;
          font-weight: 700;
          font-size: 15px;
          text-decoration: none;
          transition: all 0.2s ease;
        }

        .comp-badge:hover {
          transform: translateY(-2px);
          background: #1F2937;
        }

        @media (max-width: 640px) {
          .comp-section { padding: 60px 0; }
          .comparison-table th, .comparison-table td { padding: 12px 12px; }
        }
      `}</style>

      <section className="comp-section" ref={ref}>
        <div className="comp-inner">
          <div className="comp-header">
            <span className="comp-eyebrow">Live Feature Comparison</span>
            <h2 className="comp-title">
              ChatGPT · Claude · Gemini vs <span style={{ color: '#059669' }}>Studio AI</span>
            </h2>
            <p className="comp-sub">
              See what you get when you stop prompting and start using a real content engine.
            </p>
          </div>

          <div className="comparison-table-wrapper">
            <table className="comparison-table">
              <thead>
                <tr>
                  <th>Content Asset</th>
                  <th>ChatGPT</th>
                  <th>Claude</th>
                  <th>Gemini</th>
                  <th style={{ color: '#059669' }}>Studio AI</th>
                </tr>
              </thead>
              <tbody>
                {COMPARISON_DATA.map((row, idx) => (
                  <tr key={idx} style={{ opacity: visible ? 1 : 0, transform: visible ? 'none' : 'translateY(8px)', transition: `all 0.3s ease ${idx * 0.02}s` }}>
                    <td className="asset-cell">{row.asset}</td>
                    <td className="generic-cell">{row.chatgpt}</td>
                    <td className="generic-cell">{row.claude}</td>
                    <td className="generic-cell">{row.gemini}</td>
                    <td className="studio-cell">{row.studio}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="comp-cta">
            <a href="/login" className="comp-badge">
              🚀 Generate Your First Complete Pack Free →
            </a>
          </div>
        </div>
      </section>
    </>
  )
}