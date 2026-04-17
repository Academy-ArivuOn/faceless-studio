'use client'
import { useEffect, useRef, useState } from 'react'

const STEPS = [
  {
    number: '01',
    title: 'Tell us your niche',
    desc: 'Type your niche, pick a platform and language. Three fields. That\'s the entire setup.',
    detail: '"Personal Finance India" is enough. The AI understands context, audience, cultural nuance, and platform algorithm behaviour without you explaining any of it.',
    icon: '🎯',
    color: '#D4A847',
    bg: '#FFF9EB',
    border: '#FDE68A',
  },
  {
    number: '02',
    title: '13 agents work in sequence',
    desc: 'Research → Creator → Publisher. Each agent builds on the last. You watch it happen in real time.',
    detail: 'Agent 1 finds the highest-virality angle in your niche. Agent 2 writes the entire script. Agent 3 produces every distribution asset. Zero back-and-forth.',
    icon: '🤖',
    color: '#2563EB',
    bg: '#EFF6FF',
    border: '#BFDBFE',
  },
  {
    number: '03',
    title: 'Pick up your content pack',
    desc: 'Script, scenes, hook psychology, SEO titles, captions, and a 7-day plan. All ready to copy and use.',
    detail: 'No editing. No rewriting. Copy the title. Paste the script. Film. Upload. The system produces output that goes directly to production without modification.',
    icon: '📦',
    color: '#059669',
    bg: '#ECFDF5',
    border: '#6EE7B7',
  },
]

const OUTPUT_TABS = [
  { id: 'script', label: '📄 Script', desc: 'Full word-for-word production script' },
  { id: 'scenes', label: '🎬 Scenes', desc: 'Scene-by-scene breakdown with B-roll' },
  { id: 'hook', label: '🪝 Hook', desc: 'Psychology behind why it works' },
  { id: 'seo', label: '▶ YouTube SEO', desc: '3 title options + description + 12 tags' },
  { id: 'social', label: '📱 Social', desc: 'Instagram + TikTok captions' },
  { id: 'plan', label: '📅 7-Day Plan', desc: 'Full sprint content calendar' },
]

export default function HowItWorks() {
  const [visible, setVisible] = useState(false)
  const [activeTab, setActiveTab] = useState('script')
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
        .hiw-section {
          padding: 120px 0;
          background: #F9FAFB;
          overflow: hidden;
        }

        .hiw-inner {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 24px;
        }

        .hiw-header {
          text-align: center;
          margin-bottom: 80px;
        }

        .hiw-eyebrow {
          font-family: 'JetBrains Mono', monospace;
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: #6B7280;
          margin-bottom: 20px;
          display: block;
        }

        .hiw-title {
          font-family: 'Bricolage Grotesque', sans-serif;
          font-size: clamp(36px, 5vw, 58px);
          font-weight: 800;
          color: #0A0A0A;
          letter-spacing: -0.04em;
          line-height: 1.08;
          margin-bottom: 20px;
        }

        .hiw-sub {
          font-family: 'DM Sans', sans-serif;
          font-size: 18px;
          color: #374151;
          max-width: 520px;
          margin: 0 auto;
          line-height: 1.7;
        }

        /* Steps */
        .hiw-steps {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 24px;
          margin-bottom: 80px;
        }

        .hiw-step {
          background: #ffffff;
          border: 1.5px solid #E5E7EB;
          border-radius: 20px;
          padding: 32px;
          position: relative;
          overflow: hidden;
          opacity: 0;
          transform: translateY(30px);
          transition: all 0.7s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .hiw-step.visible {
          opacity: 1;
          transform: translateY(0);
        }

        .hiw-step:hover {
          border-color: var(--step-color);
          box-shadow: 0 8px 40px rgba(0,0,0,0.07);
          transform: translateY(-4px);
        }

        .hiw-step::before {
          content: var(--step-num);
          position: absolute;
          top: 20px;
          right: 24px;
          font-family: 'Bricolage Grotesque', sans-serif;
          font-size: 60px;
          font-weight: 800;
          color: rgba(0,0,0,0.04);
          letter-spacing: -0.04em;
          line-height: 1;
          pointer-events: none;
        }

        .step-icon-wrap {
          width: 48px;
          height: 48px;
          border-radius: 12px;
          background: var(--step-bg);
          border: 1px solid var(--step-border);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 22px;
          margin-bottom: 20px;
        }

        .step-num-label {
          font-family: 'JetBrains Mono', monospace;
          font-size: 11px;
          font-weight: 600;
          color: var(--step-color);
          letter-spacing: 0.08em;
          text-transform: uppercase;
          margin-bottom: 10px;
        }

        .step-title {
          font-family: 'Bricolage Grotesque', sans-serif;
          font-size: 20px;
          font-weight: 700;
          color: #0A0A0A;
          letter-spacing: -0.02em;
          margin-bottom: 10px;
          line-height: 1.2;
        }

        .step-desc {
          font-family: 'DM Sans', sans-serif;
          font-size: 14px;
          color: #374151;
          line-height: 1.65;
          margin-bottom: 14px;
          font-weight: 500;
        }

        .step-detail {
          font-family: 'DM Sans', sans-serif;
          font-size: 13px;
          color: #6B7280;
          line-height: 1.65;
          padding-top: 14px;
          border-top: 1px solid #F3F4F6;
        }

        /* Output preview box */
        .hiw-output {
          background: #0A0A0A;
          border-radius: 20px;
          overflow: hidden;
          opacity: 0;
          transform: translateY(30px);
          transition: all 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.3s;
        }

        .hiw-output.visible {
          opacity: 1;
          transform: translateY(0);
        }

        .output-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 20px 24px;
          border-bottom: 1px solid rgba(255,255,255,0.08);
        }

        .output-title {
          font-family: 'JetBrains Mono', monospace;
          font-size: 12px;
          color: rgba(255,255,255,0.5);
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }

        .output-dots {
          display: flex;
          gap: 6px;
        }

        .output-dot {
          width: 10px;
          height: 10px;
          border-radius: 50%;
        }

        /* Tab bar */
        .output-tabs {
          display: flex;
          overflow-x: auto;
          border-bottom: 1px solid rgba(255,255,255,0.07);
          scrollbar-width: none;
        }

        .output-tabs::-webkit-scrollbar { display: none; }

        .output-tab {
          padding: 14px 20px;
          font-family: 'DM Sans', sans-serif;
          font-size: 13px;
          font-weight: 500;
          color: rgba(255,255,255,0.45);
          cursor: pointer;
          border-bottom: 2px solid transparent;
          margin-bottom: -1px;
          white-space: nowrap;
          transition: all 0.2s ease;
          background: none;
          border-left: none;
          border-right: none;
          border-top: none;
        }

        .output-tab:hover { color: rgba(255,255,255,0.75); }

        .output-tab.active {
          color: #D4A847;
          border-bottom-color: #D4A847;
        }

        .output-body {
          padding: 32px;
          min-height: 220px;
        }

        .output-tab-content {
          display: none;
          animation: tabFade 0.3s ease;
        }

        .output-tab-content.active { display: block; }

        @keyframes tabFade {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .output-preview-title {
          font-family: 'Bricolage Grotesque', sans-serif;
          font-size: 16px;
          font-weight: 600;
          color: rgba(255,255,255,0.9);
          margin-bottom: 12px;
          letter-spacing: -0.02em;
        }

        .output-preview-block {
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 10px;
          padding: 16px 18px;
          font-family: 'DM Sans', sans-serif;
          font-size: 13px;
          color: rgba(255,255,255,0.65);
          line-height: 1.75;
          max-height: 140px;
          overflow: hidden;
          position: relative;
        }

        .output-preview-block::after {
          content: '';
          position: absolute;
          bottom: 0; left: 0; right: 0;
          height: 50px;
          background: linear-gradient(transparent, rgba(10,10,10,0.9));
          border-radius: 0 0 10px 10px;
        }

        .output-tag-row {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
          margin-top: 16px;
        }

        .output-tag {
          padding: 4px 12px;
          background: rgba(212,168,71,0.12);
          border: 1px solid rgba(212,168,71,0.25);
          border-radius: 100px;
          font-family: 'JetBrains Mono', monospace;
          font-size: 11px;
          color: #D4A847;
        }

        @media (max-width: 900px) {
          .hiw-steps { grid-template-columns: 1fr; gap: 16px; }
          .hiw-section { padding: 80px 0; }
        }
      `}</style>

      <section className="hiw-section" id="how-it-works" ref={ref}>
        <div className="hiw-inner">
          <div className="hiw-header">
            <span className="hiw-eyebrow">How It Works</span>
            <h2 className="hiw-title">
              Three inputs.<br />
              Complete content pack.
            </h2>
            <p className="hiw-sub">
              No prompts. No setup. No configuration. Just your niche — and a full week of ready-to-publish content.
            </p>
          </div>

          {/* Steps */}
          <div className="hiw-steps">
            {STEPS.map((step, i) => (
              <div
                key={step.number}
                className={`hiw-step ${visible ? 'visible' : ''}`}
                style={{
                  '--step-color': step.color,
                  '--step-bg': step.bg,
                  '--step-border': step.border,
                  '--step-num': `"${step.number}"`,
                  transitionDelay: `${i * 0.12}s`,
                }}
              >
                <div className="step-icon-wrap">
                  {step.icon}
                </div>
                <div className="step-num-label">Step {step.number}</div>
                <h3 className="step-title">{step.title}</h3>
                <p className="step-desc">{step.desc}</p>
                <p className="step-detail">{step.detail}</p>
              </div>
            ))}
          </div>

          {/* Output preview */}
          <div className={`hiw-output ${visible ? 'visible' : ''}`}>
            <div className="output-header">
              <span className="output-title">📦 What you get — every single time</span>
              <div className="output-dots">
                <div className="output-dot" style={{ background: '#EF4444' }} />
                <div className="output-dot" style={{ background: '#F59E0B' }} />
                <div className="output-dot" style={{ background: '#10B981' }} />
              </div>
            </div>

            <div className="output-tabs">
              {OUTPUT_TABS.map(tab => (
                <button
                  key={tab.id}
                  className={`output-tab ${activeTab === tab.id ? 'active' : ''}`}
                  onClick={() => setActiveTab(tab.id)}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="output-body">
              {activeTab === 'script' && (
                <div className="output-tab-content active">
                  <div className="output-preview-title">Full Production Script</div>
                  <div className="output-preview-block">
                    "Your EMI is about to change. And most people have no idea how much they're about to save — or lose — in the next 60 days.<br /><br />
                    The RBI just cut interest rates for the first time in four years. That sounds like good news — but here's what they're not telling you about what happens to your home loan, your FD returns, and your monthly budget starting next month.<br /><br />
                    I'm going to break down exactly what this means for you in three specific scenarios — and what you need to do before the 15th of this month..."
                  </div>
                  <div className="output-tag-row">
                    <span className="output-tag">900+ words</span>
                    <span className="output-tag">Production-ready</span>
                    <span className="output-tag">8 scenes</span>
                    <span className="output-tag">Hook included</span>
                  </div>
                </div>
              )}
              {activeTab === 'scenes' && (
                <div className="output-tab-content active">
                  <div className="output-preview-title">Scene-by-Scene Breakdown</div>
                  <div className="output-preview-block">
                    S1 [0:00–0:28] HOOK — Voiceover: "Your EMI is about to change..." / B-roll: family reviewing bank statement / Text: "RBI Rate Cut = Your EMI?" / Tone: urgent, direct<br /><br />
                    S2 [0:28–1:45] INTRO — Voiceover: "The RBI just cut rates..." / B-roll: RBI building exterior, stock market screens / Overlay: "What this means for you" / Retention: end with "3 scenarios"...
                  </div>
                  <div className="output-tag-row">
                    <span className="output-tag">8 scenes</span>
                    <span className="output-tag">B-roll search terms</span>
                    <span className="output-tag">Timestamps</span>
                    <span className="output-tag">Text overlays</span>
                  </div>
                </div>
              )}
              {activeTab === 'hook' && (
                <div className="output-tab-content active">
                  <div className="output-preview-title">Hook Psychology Analysis</div>
                  <div className="output-preview-block">
                    Trigger: LOSS AVERSION — Strength: HIGH<br /><br />
                    "Your EMI is about to change" uses an immediate personal stake claim. The viewer's brain interprets this as: something is happening to MY money RIGHT NOW. Loss aversion psychology (2.5× more motivating than equivalent gain) activates the amygdala response before rational thought. Combined with "most people have no idea" (social isolation threat), the viewer cannot scroll past without feeling they're choosing to lose money...
                  </div>
                  <div className="output-tag-row">
                    <span className="output-tag">Loss Aversion</span>
                    <span className="output-tag">Curiosity Gap</span>
                    <span className="output-tag">Urgency Signal</span>
                  </div>
                </div>
              )}
              {activeTab === 'seo' && (
                <div className="output-tab-content active">
                  <div className="output-preview-title">YouTube SEO Assets</div>
                  <div className="output-preview-block">
                    ⭐ Recommended: "RBI Cut ₹3,000 From Your EMI — But Only If You Do This"<br />
                    Option 2: "Your Home Loan EMI Is About to Change — Here's By How Much"<br />
                    Option 3: "RBI Rate Cut 2025: What It Actually Means for Your Money"<br /><br />
                    Description: The RBI just made a decision that affects every Indian with a home loan, FD, or savings account. In this video, I break down exactly what the rate cut means...
                  </div>
                  <div className="output-tag-row">
                    <span className="output-tag">3 title options</span>
                    <span className="output-tag">200-word description</span>
                    <span className="output-tag">12 SEO tags</span>
                    <span className="output-tag">Primary keyword</span>
                  </div>
                </div>
              )}
              {activeTab === 'social' && (
                <div className="output-tab-content active">
                  <div className="output-preview-title">Instagram + TikTok Captions</div>
                  <div className="output-preview-block">
                    📸 INSTAGRAM: The RBI just cut rates. Here's what nobody is telling you about your EMI, FD, and savings — and what you need to do before the 15th. 🧵 (Save this post before your bank changes the numbers)<br /><br />
                    🎵 TIKTOK: Bhai, RBI ne rate cut kar diya. Kya tumhara EMI kam hoga? Yahan dekho #RBI #HomeLoan #PersonalFinance #EMI #InvestmentTips
                  </div>
                  <div className="output-tag-row">
                    <span className="output-tag">Instagram caption</span>
                    <span className="output-tag">20 hashtags</span>
                    <span className="output-tag">TikTok caption</span>
                    <span className="output-tag">Posting schedule</span>
                  </div>
                </div>
              )}
              {activeTab === 'plan' && (
                <div className="output-tab-content active">
                  <div className="output-preview-title">7-Day Content Sprint</div>
                  <div className="output-preview-block">
                    Mon — Main Video: "RBI Rate Cut — What It Means for Your EMI"<br />
                    Tue — Short: "3 Things Your Bank Won't Tell You About Rate Cuts" (60s Reel)<br />
                    Wed — Community Post: Poll "Has your bank notified you about the rate change?"<br />
                    Thu — Short: "FD vs Home Loan — Who Benefits More?" (Reel repurpose)<br />
                    Fri — Main Video: "Best Savings Account in India After RBI Cut 2025"...
                  </div>
                  <div className="output-tag-row">
                    <span className="output-tag">7 days planned</span>
                    <span className="output-tag">Multi-platform</span>
                    <span className="output-tag">Repurpose map</span>
                    <span className="output-tag">Optimal timing</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </>
  )
}