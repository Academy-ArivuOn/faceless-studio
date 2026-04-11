'use client'
import { useEffect, useRef, useState } from 'react'

const PLANS = [
  {
    id: 'free',
    name: 'Free',
    price: { monthly: 0, annual: 0 },
    currency: '₹',
    description: 'Get started. See the magic. No card needed.',
    cta: 'Start Free Now',
    ctaHref: '/generate',
    highlight: false,
    badge: null,
    features: [
      { text: '3 content generations / month', included: true },
      { text: 'Core 3 agents (Research, Creator, Publisher)', included: true },
      { text: 'YouTube only', included: true },
      { text: 'Full script + scene breakdown', included: true },
      { text: 'Script history', included: false },
      { text: '7-day sprint system', included: false },
      { text: 'Hook Upgrader + Title Battle', included: false },
      { text: 'Hindi / Tamil / Telugu mode', included: false },
    ],
  },
  {
    id: 'pro',
    name: 'Creator Pro',
    price: { monthly: 399, annual: 3999 },
    currency: '₹',
    description: 'Everything you need to grow a real faceless channel.',
    cta: 'Start Pro Free →',
    ctaHref: '/checkout/pro',
    highlight: true,
    badge: 'Most Popular',
    features: [
      { text: 'Unlimited generations', included: true },
      { text: 'All 8 retention agents', included: true },
      { text: 'All platforms (YouTube + Insta + TikTok)', included: true },
      { text: 'Full script + scene + hook psychology', included: true },
      { text: 'Complete generation history', included: true },
      { text: '7-day sprint + streak system', included: true },
      { text: 'Hook Upgrader + Title A/B Battle', included: true },
      { text: 'Hindi / Tamil / Telugu mode', included: true },
    ],
  },
  {
    id: 'studio',
    name: 'Studio',
    price: { monthly: 999, annual: 10999 },
    currency: '₹',
    description: 'For agencies and creators managing multiple channels.',
    cta: 'Contact Us',
    ctaHref: '/contact',
    highlight: false,
    badge: 'For Agencies',
    features: [
      { text: 'Everything in Pro', included: true },
      { text: 'All 13 agents including Pro Power tier', included: true },
      { text: '5 team member seats', included: true },
      { text: 'Bulk generation (full month at once)', included: true },
      { text: 'Custom brand voice profile', included: true },
      { text: 'Competitor Autopsy + Viral Reverse Engineer', included: true },
      { text: 'Monetisation Coach agent', included: true },
      { text: 'White-label export + API access', included: true },
    ],
  },
]

export default function Pricing() {
  const [annual, setAnnual] = useState(false)
  const sectionRef = useRef(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => entries.forEach(e => e.isIntersecting && e.target.classList.add('visible')),
      { threshold: 0.1 }
    )
    sectionRef.current?.querySelectorAll('.animate-on-scroll')
      .forEach(el => observer.observe(el))
    return () => observer.disconnect()
  }, [])

  const savings = Math.round(((399 * 12) - 3999) / (999 * 12) * 100)

  return (
    <>
      <style>{`
        .pricing-section {
          background: var(--navy-950);
          padding: var(--section-pad) 0;
          position: relative;
          overflow: hidden;
        }

        .pricing-section::before {
          content: '';
          position: absolute;
          inset: 0;
          background:
            radial-gradient(ellipse at 20% 80%, rgba(26,38,104,0.4) 0%, transparent 60%),
            radial-gradient(ellipse at 80% 20%, rgba(201,164,53,0.04) 0%, transparent 50%);
          pointer-events: none;
        }

        .pricing-grid-bg {
          position: absolute;
          inset: 0;
          background-image:
            linear-gradient(rgba(201,164,53,0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(201,164,53,0.03) 1px, transparent 1px);
          background-size: 50px 50px;
          pointer-events: none;
        }

        .pricing-toggle {
          display: flex;
          align-items: center;
          gap: 12px;
          justify-content: center;
          margin-bottom: 3.5rem;
        }

        .toggle-label {
          font-family: var(--font-display);
          font-size: 0.9rem;
          font-weight: 600;
          color: var(--silver-dim);
          transition: color 0.25s;
        }

        .toggle-label.active { color: var(--white); }

        .toggle-switch {
          width: 44px;
          height: 24px;
          border-radius: 12px;
          background: rgba(201,164,53,0.15);
          border: 1px solid rgba(201,164,53,0.25);
          cursor: pointer;
          position: relative;
          transition: background 0.25s;
        }

        .toggle-switch.on { background: var(--gold-500); border-color: var(--gold-400); }

        .toggle-thumb {
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: var(--white);
          position: absolute;
          top: 2px;
          left: 2px;
          transition: transform 0.25s ease;
          box-shadow: 0 2px 6px rgba(0,0,0,0.3);
        }

        .toggle-switch.on .toggle-thumb { transform: translateX(20px); }

        .toggle-savings {
          background: rgba(201,164,53,0.12);
          border: 1px solid rgba(201,164,53,0.2);
          color: var(--gold-300);
          padding: 3px 10px;
          border-radius: 100px;
          font-size: 0.75rem;
          font-weight: 700;
          font-family: var(--font-display);
        }

        /* Plans grid */
        .plans-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1.5rem;
          position: relative;
          z-index: 1;
        }

        .plan-card {
          border-radius: var(--radius-xl);
          padding: 2rem;
          border: 1px solid rgba(201,164,53,0.1);
          background: rgba(11,19,64,0.6);
          backdrop-filter: blur(20px);
          position: relative;
          transition: all 0.3s ease;
          display: flex;
          flex-direction: column;
        }

        .plan-card:hover {
          border-color: rgba(201,164,53,0.25);
          transform: translateY(-4px);
        }

        .plan-card.highlighted {
          border-color: var(--gold-500);
          background: rgba(15,24,80,0.8);
          box-shadow: 0 0 60px rgba(201,164,53,0.12), 0 24px 60px rgba(4,8,24,0.4);
          transform: scale(1.03);
        }

        .plan-card.highlighted:hover {
          transform: scale(1.03) translateY(-4px);
        }

        .plan-badge {
          position: absolute;
          top: -14px;
          left: 50%;
          transform: translateX(-50%);
          padding: 5px 18px;
          background: linear-gradient(135deg, var(--gold-500), var(--gold-400));
          color: var(--navy-950);
          font-family: var(--font-display);
          font-size: 0.72rem;
          font-weight: 800;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          border-radius: 100px;
          white-space: nowrap;
          box-shadow: 0 4px 16px rgba(201,164,53,0.4);
        }

        .plan-name {
          font-family: var(--font-display);
          font-size: 1.1rem;
          font-weight: 700;
          color: var(--silver);
          margin-bottom: 0.5rem;
          letter-spacing: 0.02em;
        }

        .plan-price {
          display: flex;
          align-items: baseline;
          gap: 4px;
          margin: 0.75rem 0;
        }

        .plan-currency {
          font-family: var(--font-display);
          font-size: 1.4rem;
          font-weight: 600;
          color: var(--white);
          line-height: 1;
        }

        .plan-amount {
          font-family: var(--font-display);
          font-size: 3rem;
          font-weight: 800;
          color: var(--white);
          line-height: 1;
          letter-spacing: -0.04em;
        }

        .plan-amount.gold {
          background: linear-gradient(135deg, var(--gold-300), var(--gold-500));
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .plan-period {
          font-size: 0.85rem;
          color: var(--silver-dim);
          font-weight: 500;
          margin-left: 2px;
        }

        .plan-desc {
          font-size: 0.88rem;
          color: var(--silver-dim);
          line-height: 1.55;
          margin-bottom: 1.5rem;
          padding-bottom: 1.5rem;
          border-bottom: 1px solid rgba(201,164,53,0.08);
        }

        .plan-features {
          list-style: none;
          display: flex;
          flex-direction: column;
          gap: 10px;
          flex: 1;
          margin-bottom: 2rem;
        }

        .plan-feature {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          font-size: 0.875rem;
          line-height: 1.45;
        }

        .feature-icon {
          flex-shrink: 0;
          width: 16px;
          height: 16px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.65rem;
          margin-top: 1px;
        }

        .feature-icon.yes {
          background: rgba(201,164,53,0.15);
          color: var(--gold-300);
        }

        .feature-icon.no {
          background: rgba(255,255,255,0.04);
          color: rgba(255,255,255,0.2);
        }

        .feature-text.included { color: var(--silver); }
        .feature-text.excluded {
          color: rgba(200,208,232,0.3);
          text-decoration: line-through;
          text-decoration-color: rgba(200,208,232,0.15);
        }

        .plan-cta {
          display: block;
          text-align: center;
          padding: 14px 24px;
          border-radius: var(--radius-md);
          font-family: var(--font-display);
          font-size: 0.95rem;
          font-weight: 700;
          text-decoration: none;
          transition: all 0.25s ease;
          cursor: pointer;
          border: none;
        }

        .plan-cta.cta-gold {
          background: linear-gradient(135deg, var(--gold-500), var(--gold-400));
          color: var(--navy-950);
          box-shadow: 0 6px 24px rgba(201,164,53,0.35);
        }

        .plan-cta.cta-gold:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 32px rgba(201,164,53,0.5);
          background: linear-gradient(135deg, var(--gold-400), var(--gold-300));
        }

        .plan-cta.cta-outline {
          background: transparent;
          color: var(--silver);
          border: 1.5px solid rgba(201,164,53,0.2);
        }

        .plan-cta.cta-outline:hover {
          border-color: var(--gold-400);
          color: var(--gold-300);
          background: var(--gold-glow);
          transform: translateY(-2px);
        }

        /* Bottom note */
        .pricing-note {
          text-align: center;
          margin-top: 2.5rem;
          font-size: 0.85rem;
          color: var(--silver-dim);
          position: relative;
          z-index: 1;
        }

        .pricing-note strong { color: var(--silver); }

        @media (max-width: 900px) {
          .plans-grid {
            grid-template-columns: 1fr;
            max-width: 440px;
            margin: 0 auto;
          }
          .plan-card.highlighted { transform: scale(1); }
          .plan-card.highlighted:hover { transform: translateY(-4px); }
        }
      `}</style>

      <section className="pricing-section" id="pricing" ref={sectionRef}>
        <div className="pricing-grid-bg" />

        <div className="container" style={{ position: 'relative', zIndex: 1 }}>
          <div className="section-header animate-on-scroll">
            <p className="section-eyebrow" style={{ color: 'var(--gold-400)' }}>Pricing</p>
            <h2 className="section-title" style={{ color: 'var(--white)' }}>
              Start free. <span className="accent">Upgrade when it clicks.</span>
            </h2>
            <p className="section-sub" style={{ color: 'var(--silver-dim)' }}>
              No card on signup. The free plan works. The paid plan is worth it once you use it.
            </p>
          </div>

          {/* Toggle */}
          <div className="pricing-toggle animate-on-scroll">
            <span className={`toggle-label ${!annual ? 'active' : ''}`}>Monthly</span>
            <div
              className={`toggle-switch ${annual ? 'on' : ''}`}
              onClick={() => setAnnual(!annual)}
            >
              <div className="toggle-thumb" />
            </div>
            <span className={`toggle-label ${annual ? 'active' : ''}`}>Annual</span>
            <span className="toggle-savings">Save {savings}%</span>
          </div>

          <div className="plans-grid animate-on-scroll">
            {PLANS.map((plan, i) => (
              <div
                key={plan.id}
                className={`plan-card ${plan.highlight ? 'highlighted' : ''} animate-delay-${i + 1}`}
              >
                {plan.badge && (
                  <div className="plan-badge">{plan.badge}</div>
                )}

                <p className="plan-name">{plan.name}</p>

                <div className="plan-price">
                  {plan.price.monthly > 0 ? (
                    <>
                      <span className="plan-currency">₹</span>
                      <span className={`plan-amount ${plan.highlight ? 'gold' : ''}`}>
                        {annual
                          ? Math.round(plan.price.annual / 12).toLocaleString('en-IN')
                          : plan.price.monthly.toLocaleString('en-IN')}
                      </span>
                      <span className="plan-period">/mo</span>
                    </>
                  ) : (
                    <span className={`plan-amount ${plan.highlight ? 'gold' : ''}`}>Free</span>
                  )}
                </div>

                {annual && plan.price.annual > 0 && (
                  <p style={{ fontSize: '0.78rem', color: 'var(--silver-dim)', marginTop: '-0.5rem', marginBottom: '0.5rem' }}>
                    Billed ₹{plan.price.annual.toLocaleString('en-IN')}/year
                  </p>
                )}

                <p className="plan-desc">{plan.description}</p>

                <ul className="plan-features">
                  {plan.features.map(f => (
                    <li key={f.text} className="plan-feature">
                      <span className={`feature-icon ${f.included ? 'yes' : 'no'}`}>
                        {f.included ? '✓' : '✕'}
                      </span>
                      <span className={`feature-text ${f.included ? 'included' : 'excluded'}`}>
                        {f.text}
                      </span>
                    </li>
                  ))}
                </ul>

                <a
                  href={plan.ctaHref}
                  className={`plan-cta ${plan.highlight ? 'cta-gold' : 'cta-outline'}`}
                >
                  {plan.cta}
                </a>
              </div>
            ))}
          </div>

          <p className="pricing-note">
            All plans include <strong>Lemon Squeezy secure checkout</strong>. 
            Payments accepted globally. INR billing for Indian users. 
            <strong> Cancel anytime.</strong>
          </p>
        </div>
      </section>
    </>
  )
}