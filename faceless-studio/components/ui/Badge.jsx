'use client';

/**
 * Badge — general-purpose label chip
 *
 * Props:
 *   children  {ReactNode}
 *   variant   'default' | 'gold' | 'green' | 'red' | 'blue' | 'outline'
 *   size      'sm' | 'md'
 *   dot       {boolean} — show a coloured dot before the label
 */
export default function Badge({
  children,
  variant = 'default',
  size    = 'md',
  dot     = false,
}) {
  const variants = {
    default: {
      background: 'rgba(255,255,255,0.05)',
      border:     '1px solid rgba(255,255,255,0.08)',
      color:      'rgba(238,238,245,0.55)',
      dotColor:   'rgba(238,238,245,0.3)',
    },
    gold: {
      background: 'rgba(212,168,71,0.10)',
      border:     '1px solid rgba(212,168,71,0.22)',
      color:      '#D4A847',
      dotColor:   '#D4A847',
    },
    green: {
      background: 'rgba(62,207,142,0.08)',
      border:     '1px solid rgba(62,207,142,0.2)',
      color:      '#3ECF8E',
      dotColor:   '#3ECF8E',
    },
    red: {
      background: 'rgba(248,113,113,0.08)',
      border:     '1px solid rgba(248,113,113,0.2)',
      color:      '#F87171',
      dotColor:   '#F87171',
    },
    blue: {
      background: 'rgba(74,144,217,0.08)',
      border:     '1px solid rgba(74,144,217,0.2)',
      color:      '#4A90D9',
      dotColor:   '#4A90D9',
    },
    outline: {
      background: 'transparent',
      border:     '1px solid rgba(255,255,255,0.10)',
      color:      'rgba(238,238,245,0.45)',
      dotColor:   'rgba(238,238,245,0.3)',
    },
  };

  const sizes = {
    sm: { padding: '2px 8px',  fontSize: '10px', borderRadius: '4px', gap: '5px', dotSize: '5px' },
    md: { padding: '4px 10px', fontSize: '11px', borderRadius: '6px', gap: '6px', dotSize: '6px' },
  };

  const v = variants[variant] || variants.default;
  const s = sizes[size] || sizes.md;

  return (
    <span
      style={{
        display:        'inline-flex',
        alignItems:     'center',
        gap:            s.gap,
        padding:        s.padding,
        borderRadius:   s.borderRadius,
        background:     v.background,
        border:         v.border,
        color:          v.color,
        fontSize:       s.fontSize,
        fontWeight:     '600',
        fontFamily:     'var(--FM, "Space Mono", monospace)',
        letterSpacing:  '0.04em',
        textTransform:  'uppercase',
        whiteSpace:     'nowrap',
        lineHeight:     1.4,
      }}
    >
      {dot && (
        <span
          style={{
            width:        s.dotSize,
            height:       s.dotSize,
            borderRadius: '50%',
            background:   v.dotColor,
            flexShrink:   0,
          }}
        />
      )}
      {children}
    </span>
  );
}