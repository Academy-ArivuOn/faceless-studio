'use client'
import { useState, useEffect, useRef } from 'react'

const PLANS = [
  {
    id: 'free',
    name: 'Free',
    price: { monthly: 0, annual: 0 },
    desc: 'See it work. No card needed.',
    cta: 'Start Free Now',
    href: '/generate',
    featured: false,
    badge: null,
    features: [
      { text: '3 content generations / month', ok: true },
      { text: 'Research + Creator + Publisher agents', ok: true },
      { text: 'YouTube platform', ok: true },
      { text: 'Full script + scene breakdown', ok: true },
      { text: 'Generation history', ok: false },
      { text: 'Hook Upgrader + Title Battle', ok: false },
      { text: '7-day sprint system', ok: false },
      { text: 'Hindi / Tamil / Telugu mode', ok: false },
    ],
  },
  {
    id: 'pro',
    name: 'Creator Pro',
    price: { monthly: 999, annual: 7999 },
    desc: 'Everything you need to grow a real channel.',
    cta: 'Start Pro Free →',
    href: '/checkout?plan=pro',
    featured: true,
    badge: 'Most Popular',
    features: [
      { text: 'Unlimited generations', ok: true },
      { text: 'All 8 retention agents', ok: true },
      { text: 'All platforms (YouTube + Insta + TikTok)', ok: true },
      { text: 'Full script + hook psychology', ok: true },
      { text: 'Complete generation history', ok: true },
      { text: '7-day sprint + streak system', ok: true },
      { text: 'Hook Upgrader + Title A/B Battle', ok: true },
      { text: 'Hindi / Tamil / Telugu mode', ok: true },
    ],
  },
  {
    id: 'studio',
    name: 'Studio',
    price: { monthly: 2499, annual: 19999 },
    desc: 'For agencies managing multiple channels.',
    cta: 'Get Studio →',
    href: '/checkout?plan=studio',
    featured: false,
    badge: 'For Agencies',
    features: [
      { text: 'Everything in Pro', ok: true },
      { text: 'All 13 agents incl. Pro Power tier', ok: true },
      { text: 'Competitor Autopsy + Viral Decoder', ok: true },
      { text: 'Channel Strategy + Monetisation Coach', ok: true },
      { text: 'Script Localiser (5 languages)', ok: true },
      { text: '5 team member seats', ok: true },
      { text: 'Bulk generation (full month)', ok: true },
      { text: 'White-label export + API access', ok: true },
    ],
  },
]

export default function Pricing() {
  const [annual, setAnnual] = useState(false)
  const [visible, setVisible] = useState(false)
  const ref = useRef(null)

  const savings = Math.round(((999 * 12) - 7999) / (999 * 12) * 100)

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
        .pricing-section {
          padding: 120px 0;
          background: #ffffff;
          overflow: hidden;
        }

        .pricing-inner {
          max-width: 1100px;
          margin: 0 auto;
          padding: 0 24px;
        }

        .pricing-header {
          text-align: center;
          margin-bottom: 56px;
        }

        .pricing-eyebrow {
          font-family: 'JetBrains Mono', monospace;
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: #6B7280;
          margin-bottom: 20px;
          display: block;
        }

        .pricing-title {
          font-family: 'Bricolage Grotesque', sans-serif;
          font-size: clamp(36px, 5vw, 58px);
          font-weight: 800;
          color: #0A0A0A;
          letter-spacing: -0.04em;
          line-height: 1.08;
          margin-bottom: 20px;
        }

        .pricing-sub {
          font-family: 'DM Sans', sans-serif;
          font-size: 18px;
          color: #374151;
          max-width: 500px;
          margin: 0 auto 32px;
          line-height: 1.7;
        }

        /* Toggle */
        .billing-toggle {
          display: inline-flex;
          align-items: center;
          gap: 12px;
          padding: 6px;
          background: #F3F4F6;
          border-radius: 100px;
        }

        .toggle-option {
          padding: 8px 20px;
          border-radius: 100px;
          font-family: 'DM Sans', sans-serif;
          font-size: 14px;
          font-weight: 600;
          color: #6B7280;
          cursor: pointer;
          transition: all 0.2s ease;
          border: none;
          background: transparent;
        }

        .toggle-option.active {
          background: #ffffff;
          color: #0A0A0A;
          box-shadow: 0 1px 4px rgba(0,0,0,0.1);
        }

        .savings-badge {
          display: inline-flex;
          align-items: center;
          padding: 4px 10px;
          background: #D1FAE5;
          border: 1px solid #6EE7B7;
          border-radius: 100px;
          font-family: 'JetBrains Mono', monospace;
          font-size: 11px;
          font-weight: 700;
          color: #059669;
          letter-spacing: 0.04em;
          margin-left: 4px;
        }

        /* Plans grid */
        .plans-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 20px;
          margin-top: 48px;
        }

        .plan-card {
          border-radius: 20px;
          padding: 32px;
          border: 1.5px solid #E5E7EB;
          background: #ffffff;
          position: relative;
          display: flex;
          flex-direction: column;
          opacity: 0;
          transform: translateY(28px);
          transition: all 0.7s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .plan-card.visible {
          opacity: 1;
          transform: translateY(0);
        }

        .plan-card:hover {
          border-color: #0A0A0A;
          transform: translateY(-4px);
          box-shadow: 0 16px 60px rgba(0,0,0,0.1);
        }

        .plan-card.featured {
          background: #0A0A0A;
          border-color: #0A0A0A;
          transform: scale(1.02) translateY(0);
        }

        .plan-card.featured.visible:hover {
          transform: scale(1.02) translateY(-4px);
        }

        .plan-card.featured.visible {
          opacity: 1;
          transform: scale(1.02);
        }

        .plan-badge {
          position: absolute;
          top: -13px;
          left: 50%;
          transform: translateX(-50%);
          padding: 4px 16px;
          background: #D4A847;
          color: #0A0A0A;
          font-family: 'JetBrains Mono', monospace;
          font-size: 10px;
          font-weight: 800;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          border-radius: 100px;
          white-space: nowrap;
          box-shadow: 0 4px 16px rgba(212,168,71,0.4);
        }

        .plan-name {
          font-family: 'Bricolage Grotesque', sans-serif;
          font-size: 16px;
          font-weight: 700;
          color: #0A0A0A;
          letter-spacing: -0.01em;
          margin-bottom: 6px;
        }

        .plan-card.featured .plan-name { color: rgba(255,255,255,0.7); }

        .plan-price-row {
          display: flex;
          align-items: baseline;
          gap: 4px;
          margin: 12px 0;
        }

        .plan-currency {
          font-family: 'Bricolage Grotesque', sans-serif;
          font-size: 22px;
          font-weight: 700;
          color: #0A0A0A;
          line-height: 1;
        }

        .plan-card.featured .plan-currency { color: #D4A847; }

        .plan-amount {
          font-family: 'Bricolage Grotesque', sans-serif;
          font-size: 52px;
          font-weight: 800;
          color: #0A0A0A;
          letter-spacing: -0.05em;
          line-height: 1;
        }

        .plan-card.featured .plan-amount { color: #ffffff; }

        .plan-period {
          font-family: 'DM Sans', sans-serif;
          font-size: 14px;
          color: #6B7280;
          font-weight: 400;
        }

        .plan-card.featured .plan-period { color: rgba(255,255,255,0.45); }

        .plan-desc {
          font-family: 'DM Sans', sans-serif;
          font-size: 13px;
          color: #6B7280;
          line-height: 1.55;
          padding-bottom: 20px;
          border-bottom: 1px solid #F3F4F6;
          margin-bottom: 20px;
        }

        .plan-card.featured .plan-desc {
          color: rgba(255,255,255,0.5);
          border-bottom-color: rgba(255,255,255,0.08);
        }

        .plan-features {
          display: flex;
          flex-direction: column;
          gap: 10px;
          flex: 1;
          margin-bottom: 24px;
        }

        .plan-feature {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          font-family: 'DM Sans', sans-serif;
          font-size: 13px;
          line-height: 1.45;
          color: #374151;
        }

        .plan-card.featured .plan-feature { color: rgba(255,255,255,0.8); }

        .feature-icon-ok {
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: #D1FAE5;
          color: #059669;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 9px;
          flex-shrink: 0;
          margin-top: 1px;
          font-weight: 700;
        }

        .plan-card.featured .feature-icon-ok {
          background: rgba(212,168,71,0.2);
          color: #D4A847;
        }

        .feature-icon-no {
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: #F3F4F6;
          color: #9CA3AF;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 9px;
          flex-shrink: 0;
          margin-top: 1px;
          font-weight: 700;
        }

        .feature-text-no {
          color: #9CA3AF;
          text-decoration: line-through;
          text-decoration-color: #D1D5DB;
        }

        .plan-cta {
          display: block;
          text-align: center;
          padding: 14px 24px;
          border-radius: 12px;
          font-family: 'Bricolage Grotesque', sans-serif;
          font-size: 15px;
          font-weight: 700;
          text-decoration: none;
          transition: all 0.2s ease;
          letter-spacing: -0.01em;
        }

        .cta-dark {
          background: #ffffff;
          color: #0A0A0A;
          border: 1.5px solid #E5E7EB;
        }

        .cta-dark:hover {
          border-color: #0A0A0A;
          transform: translateY(-1px);
        }

        .cta-gold {
          background: linear-gradient(135deg, #D4A847, #E8CA70);
          color: #0A0A0A;
          border: none;
        }

        .cta-gold:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 36px rgba(212,168,71,0.4);
        }

        .cta-outline {
          background: transparent;
          color: #374151;
          border: 1.5px solid #E5E7EB;
        }

        .cta-outline:hover {
          border-color: #0A0A0A;
          color: #0A0A0A;
          transform: translateY(-1px);
        }

        /* Bottom note */
        .pricing-note {
          text-align: center;
          margin-top: 36px;
          font-family: 'DM Sans', sans-serif;
          font-size: 14px;
          color: #6B7280;
        }

        .pricing-note strong { color: #374151; font-weight: 600; }

        @media (max-width: 900px) {
          .plans-grid { grid-template-columns: 1fr; max-width: 440px; margin-left: auto; margin-right: auto; }
          .plan-card.featured { transform: scale(1); }
          .plan-card.featured.visible { transform: scale(1); }
          .plan-card.featured.visible:hover { transform: translateY(-4px); }
          .pricing-section { padding: 80px 0; }
        }
      `}</style>

      <section className="pricing-section" id="pricing" ref={ref}>
        <div className="pricing-inner">
          <div className="pricing-header">
            <span className="pricing-eyebrow">Pricing</span>
            <h2 className="pricing-title">
              Start free.<br />
              Upgrade when it works.
            </h2>
            <p className="pricing-sub">
              No card on signup. The free plan is real — 3 complete generations a month. Upgrade when you're ready.
            </p>

            <div className="billing-toggle">
              <button
                className={`toggle-option ${!annual ? 'active' : ''}`}
                onClick={() => setAnnual(false)}
              >
                Monthly
              </button>
              <button
                className={`toggle-option ${annual ? 'active' : ''}`}
                onClick={() => setAnnual(true)}
              >
                Annual
                <span className="savings-badge">Save {savings}%</span>
              </button>
            </div>
          </div>

          <div className="plans-grid">
            {PLANS.map((plan, i) => {
              const price = annual
                ? (plan.price.annual > 0 ? Math.round(plan.price.annual / 12) : 0)
                : plan.price.monthly

              return (
                <div
                  key={plan.id}
                  className={`plan-card ${plan.featured ? 'featured' : ''} ${visible ? 'visible' : ''}`}
                  style={{ transitionDelay: `${i * 0.1}s` }}
                >
                  {plan.badge && <div className="plan-badge">{plan.badge}</div>}

                  <div className="plan-name">{plan.name}</div>

                  <div className="plan-price-row">
                    {price > 0 && <span className="plan-currency">₹</span>}
                    <span className="plan-amount">
                      {price > 0 ? price.toLocaleString('en-IN') : 'Free'}
                    </span>
                    {price > 0 && <span className="plan-period">/mo</span>}
                  </div>

                  {annual && plan.price.annual > 0 && (
                    <p style={{ fontSize: 12, color: plan.featured ? 'rgba(255,255,255,0.4)' : '#9CA3AF', marginTop: -8, marginBottom: 8, fontFamily: "'DM Sans', sans-serif" }}>
                      Billed ₹{plan.price.annual.toLocaleString('en-IN')}/year
                    </p>
                  )}

                  <p className="plan-desc">{plan.desc}</p>

                  <ul className="plan-features">
                    {plan.features.map((f, fi) => (
                      <li key={fi} className="plan-feature">
                        {f.ok
                          ? <span className="feature-icon-ok">✓</span>
                          : <span className="feature-icon-no">✕</span>
                        }
                        <span className={!f.ok ? 'feature-text-no' : ''}>{f.text}</span>
                      </li>
                    ))}
                  </ul>

                  <a
                    href={plan.href}
                    className={`plan-cta ${plan.featured ? 'cta-gold' : plan.id === 'free' ? 'cta-dark' : 'cta-outline'}`}
                  >
                    {plan.cta}
                  </a>
                </div>
              )
            })}
          </div>

          <p className="pricing-note">
            Secure checkout via <strong>Lemon Squeezy</strong>. INR billing for Indian users. <strong>Cancel anytime.</strong> No questions asked.
          </p>
        </div>
      </section>
    </>
  )
}