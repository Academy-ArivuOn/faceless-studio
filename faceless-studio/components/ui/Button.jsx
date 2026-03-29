'use client';

/**
 * Button — unified button component matching Precision Dark design system
 *
 * Props:
 *   children   {ReactNode}
 *   variant    'primary' | 'ghost' | 'outline' | 'danger'
 *   size       'sm' | 'md' | 'lg'
 *   icon       {ReactNode}  — optional left icon
 *   iconRight  {ReactNode}  — optional right icon
 *   loading    {boolean}
 *   disabled   {boolean}
 *   onClick    {function}
 *   type       'button' | 'submit' | 'reset'
 *   style      {object}    — additional inline styles
 *   fullWidth  {boolean}
 */
export default function Button({
  children,
  variant   = 'primary',
  size      = 'md',
  icon,
  iconRight,
  loading   = false,
  disabled  = false,
  onClick,
  type      = 'button',
  style     = {},
  fullWidth = false,
}) {
  const variants = {
    primary: {
      background:  '#D4A847',
      border:      '1px solid #D4A847',
      color:       '#000',
      hoverBg:     '#E2B85A',
    },
    ghost: {
      background:  'transparent',
      border:      '1px solid transparent',
      color:       'rgba(238,238,245,0.6)',
      hoverBg:     'rgba(255,255,255,0.05)',
    },
    outline: {
      background:  'transparent',
      border:      '1px solid rgba(255,255,255,0.10)',
      color:       'rgba(238,238,245,0.65)',
      hoverBg:     'rgba(255,255,255,0.04)',
    },
    danger: {
      background:  'rgba(248,113,113,0.1)',
      border:      '1px solid rgba(248,113,113,0.25)',
      color:       '#F87171',
      hoverBg:     'rgba(248,113,113,0.18)',
    },
  };

  const sizes = {
    sm: { padding: '6px 12px',  fontSize: '12px', borderRadius: '6px',  gap: '6px',  iconSize: '13px' },
    md: { padding: '9px 16px',  fontSize: '13px', borderRadius: '8px',  gap: '8px',  iconSize: '14px' },
    lg: { padding: '13px 24px', fontSize: '14px', borderRadius: '9px',  gap: '10px', iconSize: '15px' },
  };

  const v = variants[variant] || variants.primary;
  const s = sizes[size]       || sizes.md;
  const isDisabled = disabled || loading;

  return (
    <>
      <style>{`
        .btn-base {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          font-family: var(--FH, "Syne", sans-serif);
          font-weight: 700;
          letter-spacing: -0.01em;
          transition: all 0.2s ease;
          white-space: nowrap;
          text-decoration: none;
          outline: none;
          position: relative;
          overflow: hidden;
        }
        .btn-base:not(:disabled):hover { transform: translateY(-1px); filter: brightness(1.08); }
        .btn-base:not(:disabled):active { transform: translateY(0); }
        .btn-base:disabled { opacity: 0.45; cursor: not-allowed; }

        @keyframes btn-spin {
          to { transform: rotate(360deg); }
        }
        .btn-spinner {
          width: 13px;
          height: 13px;
          border-radius: 50%;
          border: 2px solid currentColor;
          border-top-color: transparent;
          animation: btn-spin 0.6s linear infinite;
          flex-shrink: 0;
        }
      `}</style>

      <button
        type={type}
        disabled={isDisabled}
        onClick={!isDisabled ? onClick : undefined}
        className="btn-base"
        style={{
          background:   v.background,
          border:       v.border,
          color:        v.color,
          padding:      s.padding,
          fontSize:     s.fontSize,
          borderRadius: s.borderRadius,
          gap:          s.gap,
          width:        fullWidth ? '100%' : undefined,
          ...style,
        }}
      >
        {loading ? (
          <span className="btn-spinner" />
        ) : icon ? (
          <span style={{ fontSize: s.iconSize, display: 'flex', alignItems: 'center' }}>{icon}</span>
        ) : null}

        {children}

        {!loading && iconRight && (
          <span style={{ fontSize: s.iconSize, display: 'flex', alignItems: 'center' }}>{iconRight}</span>
        )}
      </button>
    </>
  );
}