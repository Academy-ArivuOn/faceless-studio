'use client';

/**
 * Card — surface container matching Precision Dark design system
 *
 * Props:
 *   children   {ReactNode}
 *   variant    'default' | 'gold' | 'dark' | 'glass'
 *   padding    'none' | 'sm' | 'md' | 'lg'
 *   hover      {boolean}  — enable hover lift animation
 *   style      {object}
 *   className  {string}
 *   onClick    {function}
 */
export default function Card({
  children,
  variant   = 'default',
  padding   = 'md',
  hover     = false,
  style     = {},
  className = '',
  onClick,
}) {
  const variants = {
    default: {
      background: 'rgba(255,255,255,0.025)',
      border:     '1px solid rgba(255,255,255,0.06)',
    },
    gold: {
      background: 'rgba(212,168,71,0.06)',
      border:     '1px solid rgba(212,168,71,0.18)',
    },
    dark: {
      background: '#050509',
      border:     '1px solid rgba(255,255,255,0.055)',
    },
    glass: {
      background: 'rgba(255,255,255,0.03)',
      border:     '1px solid rgba(255,255,255,0.07)',
      backdropFilter: 'blur(20px)',
    },
  };

  const paddings = {
    none: '0',
    sm:   '14px 16px',
    md:   '20px 24px',
    lg:   '28px 32px',
  };

  const v = variants[variant] || variants.default;
  const p = paddings[padding] || paddings.md;

  return (
    <>
      <style>{`
        .card-hover:hover {
          transform: translateY(-2px);
          border-color: rgba(212,168,71,0.2) !important;
          box-shadow: 0 8px 32px rgba(0,0,0,0.35);
          transition: all 0.25s ease;
        }
        .card-clickable { cursor: pointer; }
        .card-base { transition: all 0.25s ease; }
      `}</style>

      <div
        className={`card-base ${hover ? 'card-hover' : ''} ${onClick ? 'card-clickable' : ''} ${className}`}
        onClick={onClick}
        style={{
          background:     v.background,
          border:         v.border,
          backdropFilter: v.backdropFilter,
          borderRadius:   '10px',
          padding:        p,
          ...style,
        }}
      >
        {children}
      </div>
    </>
  );
}