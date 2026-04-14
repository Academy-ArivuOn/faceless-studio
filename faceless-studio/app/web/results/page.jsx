'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import React from 'react';

// ── Error Boundary ─────────────────────────────────────────────────────────────
class TabErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = { hasError: false }; }
  static getDerivedStateFromError() { return { hasError: true }; }
  componentDidCatch(err, info) { console.error('[ResultTab]', err, info); }
  render() {
    if (this.state.hasError) return (
      <div style={{ padding: '32px 24px', textAlign: 'center', background: '#FEF2F2', borderRadius: 12, border: '1px solid #FCA5A5', margin: '24px 0' }}>
        <p style={{ fontSize: 20, marginBottom: 8 }}>⚠️</p>
        <p style={{ fontSize: 14, fontWeight: 600, color: '#0A0A0A', marginBottom: 6, fontFamily: "'DM Sans',sans-serif" }}>Display error in this tab</p>
        <button onClick={() => this.setState({ hasError: false })}
          style={{ background: '#0A0A0A', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 18px', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
          Try again
        </button>
      </div>
    );
    return this.props.children;
  }
}

// ── Helpers ────────────────────────────────────────────────────────────────────
function CopyBtn({ text, label = 'Copy' }) {
  const [done, setDone] = useState(false);
  return (
    <button
      onClick={() => navigator.clipboard.writeText(text || '').then(() => { setDone(true); setTimeout(() => setDone(false), 2000); })}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 4,
        background: done ? '#F0FDF4' : '#F8F8F8',
        border: `1px solid ${done ? '#86EFAC' : '#E8E8E8'}`,
        borderRadius: 6, padding: '4px 11px', fontSize: 11, fontWeight: 600,
        color: done ? '#15803D' : '#5C5C5C', cursor: 'pointer',
        fontFamily: "'JetBrains Mono',monospace", transition: 'all 0.18s', whiteSpace: 'nowrap', flexShrink: 0,
      }}>
      {done ? '✓ Copied' : label}
    </button>
  );
}

function Label({ children, color = '#8C8C8C' }) {
  return (
    <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color, fontFamily: "'JetBrains Mono',monospace" }}>
      {children}
    </span>
  );
}

function Section({ title, children, copyText, accent = false }) {
  return (
    <div style={{ marginBottom: 28 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <Label color={accent ? '#0A0A0A' : '#8C8C8C'}>{title}</Label>
        {copyText && <CopyBtn text={copyText} />}
      </div>
      {children}
    </div>
  );
}

function Prose({ children, style = {} }) {
  return (
    <div style={{
      background: '#F8F8F8', border: '1px solid #E8E8E8', borderRadius: 10,
      padding: '16px 18px', fontSize: 14, color: '#1A1A1A', lineHeight: 1.8,
      fontFamily: "'DM Sans',sans-serif", whiteSpace: 'pre-wrap', wordBreak: 'break-word',
      ...style,
    }}>
      {children}
    </div>
  );
}

function Card({ children, highlight = false, amber = false, style = {} }) {
  const borderColor = amber ? '#FED7AA' : highlight ? '#D4A847' : '#E8E8E8';
  const bg = amber ? '#FFFBEB' : highlight ? '#FAFAF7' : '#FFFFFF';
  return (
    <div style={{ background: bg, border: `1px solid ${borderColor}`, borderRadius: 10, padding: '16px 18px', ...style }}>
      {children}
    </div>
  );
}

function Chip({ label, color = '#0A0A0A', bg = '#F0F0F0', border = '#E8E8E8' }) {
  return (
    <span style={{
      display: 'inline-block', padding: '3px 10px', borderRadius: 5,
      fontSize: 11, fontWeight: 600, fontFamily: "'JetBrains Mono',monospace",
      background: bg, border: `1px solid ${border}`, color, whiteSpace: 'nowrap', margin: '2px',
    }}>
      {label}
    </span>
  );
}

function KV({ k, v }) {
  if (!v) return null;
  return (
    <div style={{ display: 'flex', gap: 12, padding: '8px 0', borderBottom: '1px solid #F5F5F5', alignItems: 'flex-start' }}>
      <span style={{ fontSize: 10, color: '#BCBCBC', minWidth: 120, flexShrink: 0, paddingTop: 2, textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 700, fontFamily: "'JetBrains Mono',monospace" }}>{k}</span>
      <span style={{ fontSize: 13, color: '#1A1A1A', lineHeight: 1.6, fontFamily: "'DM Sans',sans-serif" }}>{v}</span>
    </div>
  );
}

// ── VLOGGER SCENE TYPES with colours ─────────────────────────────────────────
const VLOG_SCENE_TYPES = {
  ARRIVAL_SHOT:        { color: '#D97706', bg: '#FFFBEB', label: 'Arrival Shot'       },
  LOCATION_REVEAL:     { color: '#DC2626', bg: '#FEF2F2', label: 'Location Reveal'    },
  EXPLORATION_WALK:    { color: '#059669', bg: '#F0FDF4', label: 'Exploration Walk'   },
  LOCAL_INTERACTION:   { color: '#7C3AED', bg: '#F5F3FF', label: 'Local Interaction'  },
  FOOD_MOMENT:         { color: '#EA580C', bg: '#FFF7ED', label: 'Food Moment'        },
  HIGHLIGHT_SPOT:      { color: '#0891B2', bg: '#ECFEFF', label: 'Highlight Spot'     },
  TRAVEL_TIPS:         { color: '#15803D', bg: '#F0FDF4', label: 'Travel Tips'        },
  OUTRO_WALK:          { color: '#6B7280', bg: '#F9FAFB', label: 'Outro Walk'         },
  DREAM_HOOK:          { color: '#DC2626', bg: '#FEF2F2', label: 'Dream Hook'         },
  PROPERTY_REVEAL:     { color: '#D97706', bg: '#FFFBEB', label: 'Property Reveal'    },
  FEATURE_SHOWCASE:    { color: '#2563EB', bg: '#EFF6FF', label: 'Feature Showcase'   },
  ATMOSPHERE_SHOT:     { color: '#7C3AED', bg: '#F5F3FF', label: 'Atmosphere Shot'    },
  TESTIMONIAL_MOMENT:  { color: '#059669', bg: '#F0FDF4', label: 'Testimonial'        },
  AMENITY_HIGHLIGHT:   { color: '#0891B2', bg: '#ECFEFF', label: 'Amenity Highlight'  },
  BOOKING_CTA:         { color: '#DC2626', bg: '#FEF2F2', label: 'Booking CTA'        },
  HUNGER_HOOK:         { color: '#EA580C', bg: '#FFF7ED', label: 'Hunger Hook'        },
  VENUE_INTRO:         { color: '#D97706', bg: '#FFFBEB', label: 'Venue Intro'        },
  FOOD_CLOSEUP:        { color: '#EA580C', bg: '#FFF7ED', label: 'Food Close-up'      },
  FIRST_BITE:          { color: '#DC2626', bg: '#FEF2F2', label: 'First Bite'         },
  DISH_BREAKDOWN:      { color: '#059669', bg: '#F0FDF4', label: 'Dish Breakdown'     },
  CHEF_MOMENT:         { color: '#7C3AED', bg: '#F5F3FF', label: 'Chef Moment'        },
  FINAL_VERDICT:       { color: '#0A0A0A', bg: '#F5F5F5', label: 'Final Verdict'      },
  CONTEXT_HOOK:        { color: '#2563EB', bg: '#EFF6FF', label: 'Context Hook'       },
  HISTORICAL_REVEAL:   { color: '#D97706', bg: '#FFFBEB', label: 'Historical Reveal'  },
  CULTURAL_MOMENT:     { color: '#7C3AED', bg: '#F5F3FF', label: 'Cultural Moment'    },
  HERITAGE_SITE:       { color: '#059669', bg: '#F0FDF4', label: 'Heritage Site'      },
  STORYTELLING_WALK:   { color: '#0891B2', bg: '#ECFEFF', label: 'Storytelling Walk'  },
  REFLECTION_OUTRO:    { color: '#6B7280', bg: '#F9FAFB', label: 'Reflection Outro'   },
  ACTION_HOOK:         { color: '#DC2626', bg: '#FEF2F2', label: 'Action Hook'        },
  EVENT_INTRO:         { color: '#D97706', bg: '#FFFBEB', label: 'Event Intro'        },
  HIGHLIGHT_MOMENT:    { color: '#2563EB', bg: '#EFF6FF', label: 'Highlight Moment'   },
  CROWD_SHOT:          { color: '#059669', bg: '#F0FDF4', label: 'Crowd Shot'         },
  BEHIND_SCENES:       { color: '#7C3AED', bg: '#F5F3FF', label: 'Behind Scenes'      },
  ATTENDEE_REACTION:   { color: '#0891B2', bg: '#ECFEFF', label: 'Attendee Reaction'  },
  ATTEND_CTA:          { color: '#DC2626', bg: '#FEF2F2', label: 'Attend CTA'         },
  RESULT_HOOK:         { color: '#DC2626', bg: '#FEF2F2', label: 'Result Hook'        },
  UNBOXING_INTRO:      { color: '#D97706', bg: '#FFFBEB', label: 'Unboxing'           },
  FEATURE_DEMO:        { color: '#2563EB', bg: '#EFF6FF', label: 'Feature Demo'       },
  PRO_HIGHLIGHT:       { color: '#059669', bg: '#F0FDF4', label: 'Pro'                },
  CON_MOMENT:          { color: '#DC2626', bg: '#FEF2F2', label: 'Con'                },
  COMPARISON_SHOT:     { color: '#7C3AED', bg: '#F5F3FF', label: 'Comparison'         },
  MORNING_HOOK:        { color: '#D97706', bg: '#FFFBEB', label: 'Morning Hook'       },
  DAILY_ROUTINE:       { color: '#059669', bg: '#F0FDF4', label: 'Daily Routine'      },
  SPONTANEOUS_MOMENT:  { color: '#EA580C', bg: '#FFF7ED', label: 'Spontaneous'        },
  PERSONAL_REFLECTION: { color: '#7C3AED', bg: '#F5F3FF', label: 'Reflection'         },
  COMMUNITY_INTERACTION:{ color: '#0891B2', bg: '#ECFEFF', label: 'Community'         },
  DAY_WRAP:            { color: '#6B7280', bg: '#F9FAFB', label: 'Day Wrap'           },
  VIEWER_QUESTION:     { color: '#2563EB', bg: '#EFF6FF', label: 'Viewer Question'    },
};

const STANDARD_SCENE_TYPES = {
  HOOK:              { color: '#D4A847', bg: '#FFF9EB', label: 'Hook'              },
  INTRO:             { color: '#2563EB', bg: '#EFF6FF', label: 'Intro'             },
  MAIN_CONTENT:      { color: '#0E7C4A', bg: '#F0FDF4', label: 'Main Content'      },
  PATTERN_INTERRUPT: { color: '#D97706', bg: '#FFFBEB', label: 'Pattern Interrupt' },
  RETENTION_BRIDGE:  { color: '#7C3AED', bg: '#F5F3FF', label: 'Retention Bridge'  },
  CTA:               { color: '#DC2626', bg: '#FEF2F2', label: 'CTA'               },
  OUTRO:             { color: '#6B7280', bg: '#F9FAFB', label: 'Outro'             },
};

// ── Vlogger Scene Card ────────────────────────────────────────────────────────
function VloggerSceneCard({ scene }) {
  const [open, setOpen] = useState(false);
  if (!scene) return null;

  const typeStyle = VLOG_SCENE_TYPES[scene.section_type] || { color: '#059669', bg: '#F0FDF4', label: scene.section_type?.replace(/_/g, ' ') || 'Scene' };

  return (
    <div style={{ border: `1px solid ${open ? typeStyle.color + '40' : '#E8E8E8'}`, borderRadius: 12, overflow: 'hidden', marginBottom: 10, background: '#FFFFFF', transition: 'border-color 0.2s' }}>
      {/* Header */}
      <div
        style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 18px', cursor: 'pointer', background: open ? '#FAFAFA' : '#FFFFFF' }}
        onClick={() => setOpen(!open)}
      >
        {/* Scene num */}
        <div style={{ width: 34, height: 34, borderRadius: 9, background: typeStyle.bg, border: `1.5px solid ${typeStyle.color}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800, color: typeStyle.color, flexShrink: 0, fontFamily: "'JetBrains Mono',monospace" }}>
          S{scene.scene_number}
        </div>
        {/* Type + time */}
        <div style={{ flexShrink: 0, minWidth: 130 }}>
          <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: typeStyle.color, fontFamily: "'JetBrains Mono',monospace", marginBottom: 2 }}>
            {typeStyle.label}
          </div>
          <div style={{ fontSize: 10, color: '#BCBCBC', fontFamily: "'JetBrains Mono',monospace" }}>
            {scene.timestamp_start} → {scene.timestamp_end}
          </div>
        </div>
        {/* Location callout badge */}
        {scene.location_callout && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '4px 10px', background: '#FFF7ED', border: '1px solid #FED7AA', borderRadius: 6, flexShrink: 0 }}>
            <span style={{ fontSize: 10 }}>📍</span>
            <span style={{ fontSize: 11, fontWeight: 600, color: '#D97706', fontFamily: "'DM Sans',sans-serif", maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{scene.location_callout}</span>
          </div>
        )}
        {/* Voiceover preview */}
        <p style={{ flex: 1, fontSize: 12, color: '#8C8C8C', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontFamily: "'DM Sans',sans-serif", fontStyle: 'italic' }}>
          "{scene.voiceover?.slice(0, 55)}…"
        </p>
        <span style={{ fontSize: 10, color: '#BCBCBC', transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', flexShrink: 0 }}>▼</span>
      </div>

      {/* Body */}
      {open && (
        <div style={{ padding: '0 18px 18px', borderTop: '1px solid #F5F5F5', background: '#FAFAFA' }}>
          {/* Voiceover */}
          <div style={{ marginTop: 14 }}>
            <Label color="#5C5C5C">🎙 Voiceover</Label>
            <div style={{ marginTop: 6, background: '#FFFFFF', borderLeft: `3px solid ${typeStyle.color}`, borderRadius: '0 8px 8px 0', padding: '12px 16px', fontSize: 14, color: '#1A1A1A', lineHeight: 1.8, fontFamily: "'DM Sans',sans-serif" }}>
              {scene.voiceover}
            </div>
          </div>

          {/* Camera + Tone row */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 12 }}>
            {scene.visual_direction && (
              <div style={{ background: '#FFFFFF', border: '1px solid #E8E8E8', borderRadius: 8, padding: '12px 14px' }}>
                <Label color="#8C8C8C">📹 Camera Direction</Label>
                <p style={{ fontSize: 12, color: '#3C3C3C', lineHeight: 1.65, marginTop: 6, marginBottom: 0, fontFamily: "'DM Sans',sans-serif" }}>{scene.visual_direction}</p>
              </div>
            )}
            {scene.tone_direction && (
              <div style={{ background: '#FFFFFF', border: '1px solid #E8E8E8', borderRadius: 8, padding: '12px 14px' }}>
                <Label color="#8C8C8C">🎭 Vlogger Energy</Label>
                <p style={{ fontSize: 12, color: '#3C3C3C', lineHeight: 1.65, marginTop: 6, marginBottom: 0, fontFamily: "'DM Sans',sans-serif" }}>{scene.tone_direction}</p>
              </div>
            )}
          </div>

          {/* B-roll suggestion */}
          {scene.b_roll_suggestion && (
            <div style={{ marginTop: 10, background: '#FFFFFF', border: '1px solid #E8E8E8', borderRadius: 8, padding: '12px 14px' }}>
              <Label color="#8C8C8C">🎬 B-Roll Suggestions</Label>
              <p style={{ fontSize: 12, color: '#3C3C3C', marginTop: 6, marginBottom: 0, fontFamily: "'DM Sans',sans-serif", lineHeight: 1.6 }}>{scene.b_roll_suggestion}</p>
            </div>
          )}

          {/* Retention */}
          {scene.retention_technique && (
            <div style={{ marginTop: 10, background: '#FFFFFF', border: '1px solid #E8E8E8', borderRadius: 8, padding: '10px 14px' }}>
              <Label color="#8C8C8C">🔒 Retention Technique</Label>
              <p style={{ fontSize: 12, color: '#3C3C3C', marginTop: 6, marginBottom: 0, fontFamily: "'DM Sans',sans-serif" }}>{scene.retention_technique}</p>
            </div>
          )}

          {/* Actions */}
          <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
            <CopyBtn text={scene.voiceover || ''} label="Copy Voiceover" />
            {scene.visual_direction && <CopyBtn text={scene.visual_direction} label="Copy Direction" />}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Standard Scene Card (faceless/face) ───────────────────────────────────────
function SceneCard({ scene }) {
  const [open, setOpen] = useState(false);
  if (!scene) return null;
  const typeStyle = STANDARD_SCENE_TYPES[scene.section_type] || STANDARD_SCENE_TYPES.MAIN_CONTENT;

  return (
    <div style={{ border: '1px solid #E8E8E8', borderRadius: 10, overflow: 'hidden', marginBottom: 8, background: '#FFFFFF' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', cursor: 'pointer', background: open ? '#F8F8F8' : '#FFFFFF' }} onClick={() => setOpen(!open)}>
        <div style={{ width: 32, height: 32, borderRadius: 7, background: typeStyle.bg, border: `1.5px solid ${typeStyle.color}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 800, color: typeStyle.color, flexShrink: 0, fontFamily: "'JetBrains Mono',monospace" }}>
          S{scene.scene_number}
        </div>
        <div style={{ flexShrink: 0, minWidth: 100 }}>
          <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: typeStyle.color, fontFamily: "'JetBrains Mono',monospace" }}>{typeStyle.label}</div>
          <div style={{ fontSize: 10, color: '#BCBCBC', fontFamily: "'JetBrains Mono',monospace", marginTop: 2 }}>{scene.timestamp_start} → {scene.timestamp_end}</div>
        </div>
        <p style={{ flex: 1, fontSize: 12, color: '#5C5C5C', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontFamily: "'DM Sans',sans-serif" }}>
          {scene.voiceover?.slice(0, 70)}…
        </p>
        <span style={{ fontSize: 10, color: '#BCBCBC', transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', flexShrink: 0 }}>▼</span>
      </div>
      {open && (
        <div style={{ padding: '0 16px 16px', borderTop: '1px solid #F0F0F0', display: 'flex', flexDirection: 'column', gap: 12, background: '#FAFAFA' }}>
          <div style={{ marginTop: 14 }}>
            <Label color="#5C5C5C">🎙 Voiceover</Label>
            <div style={{ marginTop: 6, background: '#FFFFFF', borderLeft: `3px solid ${typeStyle.color}`, borderRadius: '0 8px 8px 0', padding: '10px 14px', fontSize: 13, color: '#1A1A1A', lineHeight: 1.75, fontFamily: "'DM Sans',sans-serif" }}>
              {scene.voiceover}
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {scene.visual_direction && (
              <div style={{ background: '#FFFFFF', border: '1px solid #E8E8E8', borderRadius: 8, padding: '10px 12px' }}>
                <Label color="#8C8C8C">📹 Visual Direction</Label>
                <p style={{ fontSize: 12, color: '#3C3C3C', lineHeight: 1.6, marginTop: 6, marginBottom: 0, fontFamily: "'DM Sans',sans-serif" }}>{scene.visual_direction}</p>
              </div>
            )}
            {scene.tone_direction && (
              <div style={{ background: '#FFFFFF', border: '1px solid #E8E8E8', borderRadius: 8, padding: '10px 12px' }}>
                <Label color="#8C8C8C">🎭 Tone</Label>
                <p style={{ fontSize: 12, color: '#3C3C3C', lineHeight: 1.6, marginTop: 6, marginBottom: 0, fontFamily: "'DM Sans',sans-serif" }}>{scene.tone_direction}</p>
              </div>
            )}
          </div>
          {scene.retention_technique && (
            <div style={{ background: '#FFFFFF', border: '1px solid #E8E8E8', borderRadius: 8, padding: '10px 12px' }}>
              <Label color="#8C8C8C">🔒 Retention Technique</Label>
              <p style={{ fontSize: 12, color: '#3C3C3C', marginTop: 6, marginBottom: 0, fontFamily: "'DM Sans',sans-serif" }}>{scene.retention_technique}</p>
            </div>
          )}
          {(scene.overlay_text || scene.b_roll_search_term) && (
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {scene.overlay_text && <Chip label={`📝 "${scene.overlay_text}"`} color="#D4A847" bg="#FFF9EB" border="#FDE68A" />}
              {scene.b_roll_search_term && <Chip label={`🎬 ${scene.b_roll_search_term}`} color="#5C5C5C" />}
            </div>
          )}
          <div style={{ display: 'flex', gap: 8 }}>
            <CopyBtn text={scene.voiceover || ''} label="Copy Voiceover" />
            {scene.visual_direction && <CopyBtn text={scene.visual_direction} label="Copy Direction" />}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Location Itinerary Table (vlogger-only) ───────────────────────────────────
function LocationItinerary({ itinerary, location, blogType }) {
  if (!Array.isArray(itinerary) || itinerary.length === 0) return null;

  const blogTypeLabels = {
    travel: '✈️ Travel', advertisement: '📢 Advertisement',
    food: '🍜 Food', culture: '🏛️ Culture', event: '🎪 Event',
    product_review: '⭐ Review', lifestyle: '🌅 Lifestyle',
  };

  return (
    <div style={{ marginBottom: 28 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <Label color="#D97706">📍 Filming Itinerary</Label>
        <div style={{ display: 'flex', gap: 6 }}>
          {blogType && <Chip label={blogTypeLabels[blogType] || blogType} color="#D97706" bg="#FFFBEB" border="#FED7AA" />}
          {location && <Chip label={`📍 ${location}`} color="#5C5C5C" bg="#F5F5F5" border="#E8E8E8" />}
        </div>
      </div>

      {/* Table */}
      <div style={{ border: '1px solid #FED7AA', borderRadius: 12, overflow: 'hidden' }}>
        {/* Header */}
        <div style={{ display: 'grid', gridTemplateColumns: '40px 1fr 1fr 80px 1fr', gap: 0, background: '#FFFBEB', borderBottom: '1px solid #FED7AA', padding: '10px 16px' }}>
          {['#', 'Location', 'What to Film', 'Duration', 'Practical Info'].map((h, i) => (
            <span key={i} style={{ fontSize: 9, fontWeight: 700, color: '#D97706', textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: "'JetBrains Mono',monospace", paddingRight: 8 }}>{h}</span>
          ))}
        </div>
        {/* Rows */}
        {itinerary.map((stop, i) => (
          <div
            key={i}
            style={{ display: 'grid', gridTemplateColumns: '40px 1fr 1fr 80px 1fr', gap: 0, padding: '12px 16px', borderBottom: i < itinerary.length - 1 ? '1px solid #F5F5F5' : 'none', background: i % 2 === 0 ? '#FFFFFF' : '#FFFDF8', alignItems: 'start', transition: 'background 0.15s' }}
          >
            <div style={{ width: 24, height: 24, borderRadius: 6, background: '#FFF7ED', border: '1px solid #FED7AA', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 800, color: '#D97706', fontFamily: "'JetBrains Mono',monospace", flexShrink: 0 }}>
              {stop.stop_number || i + 1}
            </div>
            <div style={{ paddingRight: 12 }}>
              <p style={{ fontSize: 13, fontWeight: 600, color: '#0A0A0A', margin: 0, lineHeight: 1.4, fontFamily: "'DM Sans',sans-serif" }}>{stop.place_name}</p>
            </div>
            <div style={{ paddingRight: 12 }}>
              <p style={{ fontSize: 12, color: '#5C5C5C', margin: 0, lineHeight: 1.5, fontFamily: "'DM Sans',sans-serif" }}>{stop.what_happens_here}</p>
            </div>
            <div>
              <span style={{ fontSize: 11, color: '#D97706', fontFamily: "'JetBrains Mono',monospace", fontWeight: 600, background: '#FFFBEB', padding: '2px 7px', borderRadius: 4, border: '1px solid #FED7AA', whiteSpace: 'nowrap' }}>
                {stop.duration_on_screen || '—'}
              </span>
            </div>
            <div>
              {stop.practical_info ? (
                <p style={{ fontSize: 11, color: '#8C8C8C', margin: 0, lineHeight: 1.5, fontFamily: "'DM Sans',sans-serif' " }}>{stop.practical_info}</p>
              ) : <span style={{ fontSize: 11, color: '#BCBCBC' }}>—</span>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Sprint Tracker ─────────────────────────────────────────────────────────────
function SprintTracker({ plan = [] }) {
  const [done, setDone] = useState({});
  const completedCount = Object.values(done).filter(Boolean).length;
  const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const TYPE_COLORS = {
    'Main Video': '#D4A847', 'Short': '#2563EB', 'Reel': '#DC2626', 'Vlog': '#D97706',
    'Story': '#7C3AED', 'Community Post': '#0E7C4A', 'Blog': '#D97706', 'Podcast': '#0D9488',
  };

  if (!plan || plan.length === 0) return (
    <div style={{ textAlign: 'center', padding: 40, color: '#BCBCBC', fontFamily: "'DM Sans',sans-serif", fontSize: 13 }}>No 7-day plan in this result.</div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <p style={{ fontSize: 13, fontWeight: 700, color: '#0A0A0A', margin: 0, fontFamily: "'DM Sans',sans-serif" }}>📅 7-Day Content Sprint</p>
        <span style={{ fontSize: 11, color: '#8C8C8C', fontFamily: "'JetBrains Mono',monospace" }}>
          <span style={{ color: '#0E7C4A', fontWeight: 700 }}>{completedCount}</span> / {plan.length} done
        </span>
      </div>
      <div style={{ height: 4, background: '#F0F0F0', borderRadius: 2, overflow: 'hidden' }}>
        <div style={{ height: '100%', background: 'linear-gradient(90deg, #0A0A0A, #3C3C3C)', borderRadius: 2, width: `${(completedCount / Math.max(plan.length, 1)) * 100}%`, transition: 'width 0.5s ease' }} />
      </div>
      {plan.map((item, i) => {
        const col = TYPE_COLORS[item.content_type] || '#0A0A0A';
        const isDone = done[item.day];
        return (
          <div key={item.day}
            style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 16px', background: isDone ? '#F0FDF4' : '#FFFFFF', border: `1px solid ${isDone ? '#86EFAC' : '#E8E8E8'}`, borderRadius: 10, cursor: 'pointer', transition: 'all 0.2s' }}
            onClick={() => setDone(prev => ({ ...prev, [item.day]: !prev[item.day] }))}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: isDone ? '#0E7C4A' : '#F8F8F8', border: `1.5px solid ${isDone ? '#0E7C4A' : '#E8E8E8'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 800, color: isDone ? '#FFFFFF' : '#5C5C5C', flexShrink: 0, fontFamily: "'JetBrains Mono',monospace", transition: 'all 0.2s' }}>
              {isDone ? '✓' : DAYS[i] || `D${item.day}`}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 3, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 10, fontWeight: 700, color: col, fontFamily: "'JetBrains Mono',monospace", textTransform: 'uppercase', letterSpacing: '0.04em' }}>{item.content_type}</span>
                <span style={{ fontSize: 10, color: '#BCBCBC', fontFamily: "'JetBrains Mono',monospace" }}>· {item.platform}</span>
              </div>
              <p style={{ fontSize: 13, color: isDone ? '#5C5C5C' : '#0A0A0A', margin: 0, fontFamily: "'DM Sans',sans-serif", textDecoration: isDone ? 'line-through' : 'none', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.topic_angle}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Hook Explainer ─────────────────────────────────────────────────────────────
function HookExplainer({ hookBreakdown = {}, chosenHook, hookTrigger }) {
  const TRIGGER_META = {
    LOSS_AVERSION:       { emoji: '⚠️', color: '#D97706', bg: '#FFF7ED', border: '#FDE68A', label: 'Loss Aversion' },
    CURIOSITY_GAP:       { emoji: '❓', color: '#2563EB', bg: '#EFF6FF', border: '#BFDBFE', label: 'Curiosity Gap' },
    PATTERN_INTERRUPT:   { emoji: '⚡', color: '#7C3AED', bg: '#F5F3FF', border: '#DDD6FE', label: 'Pattern Interrupt' },
    SOCIAL_PROOF:        { emoji: '👥', color: '#0E7C4A', bg: '#F0FDF4', border: '#86EFAC', label: 'Social Proof' },
    DIRECT_PROMISE:      { emoji: '🎯', color: '#D4A847', bg: '#FFF9EB', border: '#FDE68A', label: 'Direct Promise' },
    AUTHORITY_CHALLENGE: { emoji: '🔥', color: '#DC2626', bg: '#FEF2F2', border: '#FCA5A5', label: 'Authority Challenge' },
    IDENTITY:            { emoji: '🪞', color: '#0891B2', bg: '#ECFEFF', border: '#A5F3FC', label: 'Identity Trigger' },
    WANDERLUST:          { emoji: '🌏', color: '#D97706', bg: '#FFFBEB', border: '#FED7AA', label: 'Wanderlust' },
    FOMO:                { emoji: '😮', color: '#DC2626', bg: '#FEF2F2', border: '#FCA5A5', label: 'FOMO' },
    SENSORY_PULL:        { emoji: '🍜', color: '#EA580C', bg: '#FFF7ED', border: '#FDBA74', label: 'Sensory Pull' },
  };
  const t = TRIGGER_META[hookTrigger] || { emoji: '🧠', color: '#0A0A0A', bg: '#F8F8F8', border: '#E8E8E8', label: hookTrigger || 'Psychological Trigger' };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ background: t.bg, border: `1px solid ${t.border}`, borderRadius: 12, padding: '20px 22px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
          <Label color={t.color}>🪝 Chosen Hook</Label>
          <CopyBtn text={chosenHook || ''} />
        </div>
        <p style={{ fontSize: 16, fontWeight: 600, color: '#0A0A0A', lineHeight: 1.65, fontStyle: 'italic', marginBottom: 14, fontFamily: "'DM Sans',sans-serif" }}>
          "{chosenHook || hookBreakdown?.hook_text}"
        </p>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 12px', borderRadius: 100, fontSize: 11, fontWeight: 700, fontFamily: "'JetBrains Mono',monospace", background: '#FFFFFF', border: `1px solid ${t.border}`, color: t.color }}>
          {t.emoji} {t.label}
        </span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        {hookBreakdown?.psychological_mechanism && (
          <Card style={{ gridColumn: '1 / -1' }}>
            <Label>🧠 Psychological Mechanism</Label>
            <p style={{ fontSize: 13, color: '#1A1A1A', lineHeight: 1.7, marginTop: 8, marginBottom: 0, fontFamily: "'DM Sans',sans-serif" }}>{hookBreakdown.psychological_mechanism}</p>
          </Card>
        )}
        {hookBreakdown?.what_viewer_is_thinking && (
          <Card>
            <Label>💬 Viewer's Thought</Label>
            <p style={{ fontSize: 13, color: '#1A1A1A', lineHeight: 1.65, marginTop: 8, marginBottom: 0, fontFamily: "'DM Sans',sans-serif" }}>{hookBreakdown.what_viewer_is_thinking}</p>
          </Card>
        )}
        {hookBreakdown?.why_first_3_seconds && (
          <Card>
            <Label>⚡ Why First 3 Seconds</Label>
            <p style={{ fontSize: 13, color: '#1A1A1A', lineHeight: 1.65, marginTop: 8, marginBottom: 0, fontFamily: "'DM Sans',sans-serif" }}>{hookBreakdown.why_first_3_seconds}</p>
          </Card>
        )}
      </div>
      {hookBreakdown?.what_happens_if_hook_fails && (
        <div style={{ background: '#FEF2F2', border: '1px solid #FCA5A5', borderRadius: 10, padding: '14px 16px' }}>
          <Label color="#DC2626">⚠️ If Hook Fails</Label>
          <p style={{ fontSize: 13, color: '#1A1A1A', lineHeight: 1.65, marginTop: 8, marginBottom: 0, fontFamily: "'DM Sans',sans-serif" }}>{hookBreakdown.what_happens_if_hook_fails}</p>
        </div>
      )}
    </div>
  );
}

// ── TABS config ────────────────────────────────────────────────────────────────
const TABS = [
  { id: 'script',    label: 'Script',           icon: '📄' },
  { id: 'scenes',    label: 'Scenes',            icon: '🎬' },
  { id: 'hook',      label: 'Hook Psychology',   icon: '🪝' },
  { id: 'youtube',   label: 'YouTube SEO',       icon: '▶️' },
  { id: 'social',    label: 'Social',            icon: '📱' },
  { id: 'plan',      label: '7-Day Plan',        icon: '📅' },
];

const BLOG_TYPE_LABELS = {
  travel: '✈️ Travel Blog', advertisement: '📢 Place Ad',
  food: '🍜 Food Blog', culture: '🏛️ Culture',
  event: '🎪 Event', product_review: '⭐ Review', lifestyle: '🌅 Lifestyle',
};

// ── Main Page ──────────────────────────────────────────────────────────────────
export default function ResultsPage() {
  const router = useRouter();
  const [result, setResult] = useState(null);
  const [activeTab, setActiveTab] = useState('script');

  useEffect(() => {
    const raw = sessionStorage.getItem('studioai_result');
    if (!raw) { router.replace('/generate'); return; }
    try { setResult(JSON.parse(raw)); }
    catch { router.replace('/generate'); }
  }, []);

  if (!result) return (
    <div style={{ minHeight: '100vh', background: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: 28, height: 28, borderRadius: '50%', border: '2.5px solid #E8E8E8', borderTopColor: '#0A0A0A', animation: 'spin 0.7s linear infinite' }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  const { research = {}, creator = {}, publisher = {}, meta = {}, input = {} } = result;
  const yt  = publisher.youtube    || {};
  const ig  = publisher.instagram  || {};
  const tt  = publisher.tiktok     || {};
  const bl  = publisher.blog       || {};
  const ps  = publisher.posting_schedule || {};
  const totalSec = ((meta.total_duration_ms || 0) / 1000).toFixed(1);

  const isVlogger   = creator.creator_mode === 'blogger' || input.creatorType === 'blogger';
  const blogType    = creator.blog_type   || input.blogType;
  const location    = creator.location    || input.location;

  // Dynamic tabs — vlogger gets "Locations" tab instead of standard
  const displayTabs = isVlogger
    ? [
        { id: 'script',    label: 'Script',          icon: '📄' },
        { id: 'scenes',    label: 'Scenes',           icon: '🎬' },
        { id: 'locations', label: 'Locations',        icon: '📍' },
        { id: 'hook',      label: 'Hook Psychology',  icon: '🪝' },
        { id: 'youtube',   label: 'YouTube SEO',      icon: '▶️' },
        { id: 'social',    label: 'Social',           icon: '📱' },
        { id: 'plan',      label: '7-Day Plan',       icon: '📅' },
      ]
    : TABS;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;800&family=DM+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        body { background: #FFFFFF; }
        ::-webkit-scrollbar { width: 4px; height: 4px; }
        ::-webkit-scrollbar-track { background: #F5F5F5; }
        ::-webkit-scrollbar-thumb { background: #D0D0D0; border-radius: 4px; }

        .rp-root { min-height: 100vh; background: #FFFFFF; color: #0A0A0A; font-family: 'DM Sans', sans-serif; display: flex; flex-direction: column; }

        /* Topbar */
        .rp-bar { position: sticky; top: 0; z-index: 50; background: rgba(255,255,255,0.96); backdrop-filter: blur(12px); border-bottom: 1px solid #E8E8E8; height: 56px; display: flex; align-items: center; justify-content: space-between; padding: 0 24px; }
        .rp-bar-left { display: flex; align-items: center; gap: 10px; }
        .rp-logo { width: 28px; height: 28px; background: #0A0A0A; border-radius: 7px; display: flex; align-items: center; justify-content: center; cursor: pointer; flex-shrink: 0; }
        .rp-brand { font-family: 'Playfair Display', serif; font-size: 15px; font-weight: 700; color: #0A0A0A; letter-spacing: -0.02em; }
        .rp-sep { color: #E8E8E8; font-size: 16px; }
        .rp-crumb { font-size: 13px; color: #8C8C8C; font-weight: 500; }
        .rp-bar-right { display: flex; align-items: center; gap: 8px; }
        .rp-chip { display: inline-flex; align-items: center; gap: 5px; padding: 4px 12px; border-radius: 100px; font-size: 11px; font-weight: 600; white-space: nowrap; font-family: 'JetBrains Mono', monospace; }
        .rp-chip.streak { background: #FFF7ED; border: 1px solid #FED7AA; color: #C2410C; }
        .rp-chip.time   { background: #F5F5F5; border: 1px solid #E8E8E8; color: #5C5C5C; }
        .rp-chip.vlogger { background: #FFFBEB; border: 1px solid #FED7AA; color: #D97706; }
        .rp-btn { padding: 7px 14px; border-radius: 7px; font-size: 13px; font-weight: 600; cursor: pointer; font-family: 'DM Sans', sans-serif; border: none; transition: all 0.18s; white-space: nowrap; }
        .rp-btn.ghost { background: transparent; color: #5C5C5C; border: 1px solid #E8E8E8; }
        .rp-btn.ghost:hover { background: #F8F8F8; color: #0A0A0A; }
        .rp-btn.primary { background: #0A0A0A; color: #FFFFFF; }
        .rp-btn.primary:hover { background: #1a1a1a; transform: translateY(-1px); box-shadow: 0 4px 12px rgba(10,10,10,0.18); }

        /* Banner */
        .rp-banner { background: #FFFFFF; border-bottom: 1px solid #E8E8E8; padding: 36px 24px 28px; animation: fadeUp 0.4s ease both; }
        .rp-banner.vlogger-banner { background: linear-gradient(135deg, #FFFBEB 0%, #FFFFFF 60%); border-bottom-color: #FED7AA; }
        .rp-banner-inner { max-width: 820px; margin: 0 auto; }
        .rp-meta-row { display: flex; gap: 6px; flex-wrap: wrap; margin-bottom: 16px; }
        .rp-meta-tag { display: inline-flex; align-items: center; gap: 4px; padding: 4px 11px; border-radius: 6px; font-size: 12px; font-weight: 500; background: #F5F5F5; border: 1px solid #E8E8E8; color: #5C5C5C; }
        .rp-meta-tag.amber { background: #FFFBEB; border-color: #FED7AA; color: #D97706; font-weight: 600; }
        .rp-topic { font-family: 'Playfair Display', serif; font-size: clamp(22px, 3.5vw, 34px); font-weight: 700; color: #0A0A0A; line-height: 1.2; letter-spacing: -0.03em; margin-bottom: 14px; }
        .rp-hook { font-size: 14px; color: #5C5C5C; line-height: 1.7; border-left: 3px solid #0A0A0A; padding-left: 16px; font-style: italic; max-width: 680px; margin-bottom: 20px; }
        .rp-stats { display: flex; gap: 20px; flex-wrap: wrap; }
        .rp-stat { display: flex; align-items: center; gap: 6px; font-size: 13px; color: #5C5C5C; }
        .rp-stat strong { color: #0A0A0A; font-weight: 700; }

        /* Tabs */
        .rp-tabstrip { background: rgba(255,255,255,0.97); border-bottom: 1px solid #E8E8E8; position: sticky; top: 56px; z-index: 40; }
        .rp-tabs { max-width: 820px; margin: 0 auto; padding: 0 24px; display: flex; overflow-x: auto; scrollbar-width: none; }
        .rp-tabs::-webkit-scrollbar { display: none; }
        .rp-tab { padding: 13px 16px; font-size: 13px; font-weight: 500; color: #8C8C8C; background: transparent; border: none; border-bottom: 2px solid transparent; cursor: pointer; white-space: nowrap; transition: all 0.18s; margin-bottom: -1px; display: flex; align-items: center; gap: 5px; font-family: 'DM Sans', sans-serif; }
        .rp-tab:hover { color: #0A0A0A; }
        .rp-tab.active { color: #0A0A0A; border-bottom-color: #0A0A0A; font-weight: 600; }
        .rp-tab.active.amber-tab { color: #D97706; border-bottom-color: #D97706; }

        /* Content */
        .rp-content { flex: 1; background: #FFFFFF; }
        .rp-pane { max-width: 820px; margin: 0 auto; padding: 32px 24px 80px; animation: fadeUp 0.3s ease both; }

        /* Social platform */
        .sp-header { display: flex; align-items: center; gap: 10px; padding: 12px 16px; background: #F8F8F8; border: 1px solid #E8E8E8; border-radius: 10px 10px 0 0; border-bottom: none; }
        .sp-body { background: #FFFFFF; border: 1px solid #E8E8E8; border-radius: 0 0 10px 10px; padding: 20px; margin-bottom: 20px; }

        /* Title option */
        .title-opt { display: flex; align-items: flex-start; gap: 12px; padding: 13px 16px; background: #FFFFFF; border: 1px solid #E8E8E8; border-radius: 10px; margin-bottom: 8px; transition: border-color 0.18s; }
        .title-opt:hover { border-color: #0A0A0A; }
        .title-rank { width: 26px; height: 26px; border-radius: 6px; background: #F0F0F0; display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 800; color: #5C5C5C; font-family: 'JetBrains Mono', monospace; flex-shrink: 0; }
        .title-rank.gold { background: #FFF9EB; color: #D4A847; }

        @media (max-width: 640px) {
          .rp-bar { padding: 0 16px; }
          .rp-banner { padding: 24px 16px; }
          .rp-pane { padding: 24px 16px 60px; }
          .rp-tabs { padding: 0 16px; }
          .rp-tab { padding: 12px 10px; font-size: 12px; }
          .rp-brand, .rp-sep, .rp-crumb { display: none; }
        }
      `}</style>

      <div className="rp-root">
        {/* Topbar */}
        <header className="rp-bar">
          <div className="rp-bar-left">
            <div className="rp-logo" onClick={() => router.push('/generate')}>
              <svg width="13" height="13" viewBox="0 0 20 20" fill="none">
                <polygon points="10,2 17,6 17,14 10,18 3,14 3,6" stroke="#FFFFFF" strokeWidth="1.5" fill="none"/>
                <polygon points="10,6 14,8.5 14,13.5 10,16 6,13.5 6,8.5" fill="#FFFFFF" fillOpacity="0.3"/>
              </svg>
            </div>
            <span className="rp-brand">Studio AI</span>
            <span className="rp-sep">/</span>
            <span className="rp-crumb">{isVlogger ? 'Vlog Script' : 'Results'}</span>
          </div>
          <div className="rp-bar-right">
            {meta.streak > 0 && <span className="rp-chip streak">🔥 {meta.streak}-day streak</span>}
            {isVlogger && blogType && <span className="rp-chip vlogger">{BLOG_TYPE_LABELS[blogType] || blogType}</span>}
            <span className="rp-chip time">⚡ {totalSec}s</span>
            <button className="rp-btn ghost" onClick={() => router.push('/dashboard')}>History</button>
            <button className="rp-btn primary" onClick={() => router.push('/generate')}>+ New generation</button>
          </div>
        </header>

        {/* Banner */}
        <div className={`rp-banner ${isVlogger ? 'vlogger-banner' : ''}`}>
          <div className="rp-banner-inner">
            <div className="rp-meta-row">
              {isVlogger && blogType && <span className={`rp-meta-tag amber`}>{BLOG_TYPE_LABELS[blogType] || blogType}</span>}
              {location && <span className="rp-meta-tag amber">📍 {location}</span>}
              {input.platform    && <span className="rp-meta-tag">▶ {input.platform}</span>}
              {input.language    && <span className="rp-meta-tag">🌐 {input.language}</span>}
              {input.tone        && <span className="rp-meta-tag">🎭 {input.tone}</span>}
              {isVlogger && <span className="rp-meta-tag amber">🎒 Blogger Mode</span>}
            </div>
            <h1 className="rp-topic">{research.chosen_topic || 'Generated Content'}</h1>
            {research.chosen_hook && <p className="rp-hook">"{research.chosen_hook}"</p>}
            <div className="rp-stats">
              {creator.word_count > 0         && <div className="rp-stat"><span>📝</span><strong>{creator.word_count}</strong> words</div>}
              {creator.scenes?.length > 0     && <div className="rp-stat"><span>🎬</span><strong>{creator.scenes.length}</strong> scenes</div>}
              {isVlogger && creator.location_itinerary?.length > 0 && <div className="rp-stat"><span>📍</span><strong>{creator.location_itinerary.length}</strong> stops</div>}
              {yt.tags?.length > 0            && <div className="rp-stat"><span>🏷️</span><strong>{yt.tags.length}</strong> SEO tags</div>}
              {creator.estimated_duration     && <div className="rp-stat"><span>⏱</span><strong>{creator.estimated_duration}</strong></div>}
            </div>
          </div>
        </div>

        {/* Tab strip */}
        <div className="rp-tabstrip">
          <div className="rp-tabs">
            {displayTabs.map(t => (
              <button key={t.id} className={`rp-tab ${activeTab === t.id ? 'active' : ''} ${isVlogger && activeTab === t.id ? 'amber-tab' : ''}`} onClick={() => setActiveTab(t.id)}>
                {t.icon} {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="rp-content">
          <TabErrorBoundary key={activeTab}>

            {/* ── SCRIPT ── */}
            {activeTab === 'script' && (
              <div className="rp-pane">
                <Section title="📄 Full Script" copyText={creator.full_script} accent>
                  <Prose>{creator.full_script || 'No script generated.'}</Prose>
                </Section>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 28 }}>
                  {creator.estimated_duration && <Chip label={`⏱ ${creator.estimated_duration}`} />}
                  {creator.word_count > 0     && <Chip label={`📝 ${creator.word_count} words`} color="#0E7C4A" bg="#F0FDF4" border="#86EFAC" />}
                  {isVlogger && blogType       && <Chip label={BLOG_TYPE_LABELS[blogType] || blogType} color="#D97706" bg="#FFFBEB" border="#FED7AA" />}
                  {location                    && <Chip label={`📍 ${location}`} color="#D97706" bg="#FFFBEB" border="#FED7AA" />}
                  {!isVlogger && creator.creator_mode && <Chip label={`🎬 ${creator.creator_mode}`} color="#2563EB" bg="#EFF6FF" border="#BFDBFE" />}
                </div>
                {creator.shorts_script && (
                  <Section title={isVlogger ? '⚡ Reels / Shorts Cut (60s)' : '⚡ Shorts / Reels Version (60s)'} copyText={creator.shorts_script}>
                    <Prose>{creator.shorts_script}</Prose>
                  </Section>
                )}
                {Array.isArray(creator.cta_options) && creator.cta_options.length > 0 && (
                  <Section title="📣 CTA Options">
                    {creator.cta_options.map((cta, i) => (
                      <div key={i} style={{ background: '#FAFAF7', border: '1px solid #E8E8E8', borderRadius: 10, padding: '14px 16px', marginBottom: 8 }}>
                        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10, marginBottom: 8 }}>
                          <p style={{ fontSize: 14, color: '#0A0A0A', fontStyle: 'italic', lineHeight: 1.6, flex: 1, margin: 0, fontFamily: "'DM Sans',sans-serif" }}>"{cta.cta_text}"</p>
                          <CopyBtn text={cta.cta_text} />
                        </div>
                        <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                          {cta.placement && <Chip label={`📍 ${cta.placement}`} />}
                          {cta.goal      && <Chip label={`🎯 ${cta.goal}`} color={cta.goal === 'visit' || cta.goal === 'book' ? '#D97706' : '#0A0A0A'} bg={cta.goal === 'visit' || cta.goal === 'book' ? '#FFFBEB' : '#F0F0F0'} border={cta.goal === 'visit' || cta.goal === 'book' ? '#FED7AA' : '#E8E8E8'} />}
                        </div>
                        {cta.why_it_works && <p style={{ fontSize: 12, color: '#8C8C8C', marginTop: 8, marginBottom: 0, lineHeight: 1.55, fontFamily: "'DM Sans',sans-serif" }}>{cta.why_it_works}</p>}
                      </div>
                    ))}
                  </Section>
                )}
                {!isVlogger && Array.isArray(creator.pattern_interrupts) && creator.pattern_interrupts.length > 0 && (
                  <Section title="⚡ Pattern Interrupts">
                    {creator.pattern_interrupts.map((pi, i) => (
                      <div key={i} style={{ display: 'flex', gap: 12, padding: '12px 14px', background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: 8, marginBottom: 6 }}>
                        <span style={{ fontSize: 11, color: '#D97706', fontFamily: "'JetBrains Mono',monospace", whiteSpace: 'nowrap', flexShrink: 0, paddingTop: 1 }}>{pi.timestamp}</span>
                        <div>
                          <div style={{ fontSize: 10, fontWeight: 700, color: '#D97706', fontFamily: "'JetBrains Mono',monospace", marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{pi.technique}</div>
                          <p style={{ fontSize: 12, color: '#5C5C5C', margin: 0, fontFamily: "'DM Sans',sans-serif" }}>{pi.script_line}</p>
                        </div>
                      </div>
                    ))}
                  </Section>
                )}
              </div>
            )}

            {/* ── SCENES ── */}
            {activeTab === 'scenes' && (
              <div className="rp-pane">
                {isVlogger ? (
                  <>
                    {/* Vlogger mode indicator */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', background: '#FFFBEB', border: '1px solid #FED7AA', borderRadius: 10, marginBottom: 20 }}>
                      <span style={{ fontSize: 18 }}>🎒</span>
                      <div>
                        <p style={{ fontSize: 13, fontWeight: 700, color: '#D97706', margin: '0 0 2px', fontFamily: "'DM Sans',sans-serif" }}>Vlogger Scene Breakdown</p>
                        <p style={{ fontSize: 11, color: '#92400E', margin: 0, fontFamily: "'DM Sans',sans-serif" }}>Each scene includes camera direction, b-roll suggestions, and location callouts for on-site filming.</p>
                      </div>
                    </div>
                    <Section label={`🎬 ${creator.scenes?.length || 0} Vlog Scenes`}>
                      {Array.isArray(creator.scenes) && creator.scenes.length > 0
                        ? creator.scenes.map(scene => <VloggerSceneCard key={scene.scene_number} scene={scene} />)
                        : <Prose>No scene data available.</Prose>
                      }
                    </Section>
                  </>
                ) : (
                  <Section title={`🎬 Scene Breakdown — ${creator.scenes?.length || 0} Scenes`}>
                    {Array.isArray(creator.scenes) && creator.scenes.length > 0
                      ? creator.scenes.map(s => <SceneCard key={s.scene_number} scene={s} />)
                      : <Prose>No scene data.</Prose>
                    }
                  </Section>
                )}
              </div>
            )}

            {/* ── LOCATIONS (vlogger only) ── */}
            {activeTab === 'locations' && isVlogger && (
              <div className="rp-pane">
                <LocationItinerary
                  itinerary={creator.location_itinerary}
                  location={location}
                  blogType={blogType}
                />

                {/* Scene location map: list of all scene location callouts */}
                {Array.isArray(creator.scenes) && creator.scenes.some(s => s.location_callout) && (
                  <Section title="📍 All Location Callouts by Scene">
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {creator.scenes.filter(s => s.location_callout).map((s, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', background: '#FFFFFF', border: '1px solid #FED7AA', borderRadius: 8 }}>
                          <div style={{ width: 24, height: 24, borderRadius: 6, background: '#FFFBEB', border: '1px solid #FED7AA', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 800, color: '#D97706', flexShrink: 0, fontFamily: "'JetBrains Mono',monospace" }}>
                            S{s.scene_number}
                          </div>
                          <span style={{ fontSize: 12, color: '#5C5C5C', fontFamily: "'JetBrains Mono',monospace", flexShrink: 0 }}>
                            {s.timestamp_start}
                          </span>
                          <span style={{ fontSize: 10 }}>📍</span>
                          <p style={{ fontSize: 13, fontWeight: 600, color: '#D97706', margin: 0, flex: 1, fontFamily: "'DM Sans',sans-serif" }}>{s.location_callout}</p>
                          <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: (VLOG_SCENE_TYPES[s.section_type] || {}).color || '#8C8C8C', fontFamily: "'JetBrains Mono',monospace", flexShrink: 0 }}>
                            {(VLOG_SCENE_TYPES[s.section_type] || {}).label || s.section_type}
                          </div>
                        </div>
                      ))}
                    </div>
                  </Section>
                )}

                {/* Travel tips from pattern interrupts */}
                {Array.isArray(creator.pattern_interrupts) && creator.pattern_interrupts.length > 0 && (
                  <Section title="💡 Key Moments & Tips">
                    {creator.pattern_interrupts.map((pi, i) => (
                      <div key={i} style={{ display: 'flex', gap: 12, padding: '12px 14px', background: '#FFFBEB', border: '1px solid #FED7AA', borderRadius: 8, marginBottom: 6 }}>
                        <span style={{ fontSize: 11, color: '#D97706', fontFamily: "'JetBrains Mono',monospace", whiteSpace: 'nowrap', flexShrink: 0, paddingTop: 1 }}>{pi.timestamp}</span>
                        <div>
                          <div style={{ fontSize: 10, fontWeight: 700, color: '#D97706', fontFamily: "'JetBrains Mono',monospace", marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{pi.technique}</div>
                          <p style={{ fontSize: 12, color: '#5C5C5C', margin: 0, fontFamily: "'DM Sans',sans-serif" }}>{pi.script_line}</p>
                        </div>
                      </div>
                    ))}
                  </Section>
                )}
              </div>
            )}

            {/* ── HOOK PSYCHOLOGY ── */}
            {activeTab === 'hook' && (
              <div className="rp-pane">
                <HookExplainer
                  hookBreakdown={creator.hook_breakdown}
                  chosenHook={research.chosen_hook}
                  hookTrigger={research.chosen_hook_trigger}
                />
                {research.chosen_hook_deep_analysis && (
                  <div style={{ marginTop: 24 }}>
                    <Section title="🧪 Deep Psychological Analysis" copyText={research.chosen_hook_deep_analysis}>
                      <Prose>{research.chosen_hook_deep_analysis}</Prose>
                    </Section>
                  </div>
                )}
                {Array.isArray(research.hook_options) && research.hook_options.length > 0 && (
                  <div style={{ marginTop: 24 }}>
                    <Section title="🎣 All Hook Options Considered">
                      {research.hook_options.map((h, i) => {
                        const isChosen = h.hook_text === research.chosen_hook;
                        return (
                          <div key={i} style={{ padding: '14px 16px', marginBottom: 8, background: isChosen ? '#FAFAF7' : '#FFFFFF', border: `1px solid ${isChosen ? '#D4A847' : '#E8E8E8'}`, borderRadius: 10 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8, flexWrap: 'wrap' }}>
                              {isChosen && <span style={{ fontSize: 9, color: '#D4A847', fontFamily: "'JetBrains Mono',monospace", fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>★ Chosen</span>}
                              <Label color="#8C8C8C">{h.psychological_trigger}</Label>
                              {h.ctr_strength && <Chip label={h.ctr_strength} color={h.ctr_strength === 'HIGH' ? '#0E7C4A' : '#D97706'} bg={h.ctr_strength === 'HIGH' ? '#F0FDF4' : '#FFF7ED'} border={h.ctr_strength === 'HIGH' ? '#86EFAC' : '#FDE68A'} />}
                              <div style={{ marginLeft: 'auto' }}><CopyBtn text={h.hook_text} /></div>
                            </div>
                            <p style={{ fontSize: 14, color: '#0A0A0A', lineHeight: 1.65, marginBottom: 6, fontStyle: 'italic', fontFamily: "'DM Sans',sans-serif" }}>"{h.hook_text}"</p>
                            {h.trigger_explanation && <p style={{ fontSize: 12, color: '#8C8C8C', margin: 0, lineHeight: 1.55, fontFamily: "'DM Sans',sans-serif" }}>{h.trigger_explanation}</p>}
                          </div>
                        );
                      })}
                    </Section>
                  </div>
                )}
              </div>
            )}

            {/* ── YOUTUBE SEO ── */}
            {activeTab === 'youtube' && (
              <div className="rp-pane">
                {yt.recommended_title && (
                  <Section title="⭐ Recommended Title" copyText={yt.recommended_title} accent>
                    <div style={{ padding: '16px 18px', background: '#FAFAF7', border: '1px solid #D4A847', borderRadius: 10, fontSize: 17, fontWeight: 700, color: '#0A0A0A', fontFamily: "'Playfair Display',serif", letterSpacing: '-0.02em', lineHeight: 1.4 }}>
                      {yt.recommended_title}
                    </div>
                  </Section>
                )}
                {Array.isArray(yt.title_options) && yt.title_options.length > 0 && (
                  <Section title="📊 All Title Variants">
                    {yt.title_options.map((t, i) => (
                      <div key={i} className="title-opt">
                        <div className={`title-rank ${i === 0 ? 'gold' : ''}`}>{i + 1}</div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ fontSize: 14, fontWeight: 600, color: '#0A0A0A', margin: '0 0 4px', lineHeight: 1.4, fontFamily: "'DM Sans',sans-serif" }}>{t.title}</p>
                          {t.reasoning && <p style={{ fontSize: 12, color: '#8C8C8C', margin: '0 0 5px', lineHeight: 1.5, fontFamily: "'DM Sans',sans-serif" }}>{t.reasoning}</p>}
                          <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                            {t.character_count > 0 && <span style={{ fontSize: 10, color: '#BCBCBC', fontFamily: "'JetBrains Mono',monospace" }}>{t.character_count} chars</span>}
                            {t.ctr_prediction && <Chip label={`CTR: ${t.ctr_prediction}`} color={t.ctr_prediction === 'HIGH' ? '#0E7C4A' : '#D97706'} bg={t.ctr_prediction === 'HIGH' ? '#F0FDF4' : '#FFF7ED'} border={t.ctr_prediction === 'HIGH' ? '#86EFAC' : '#FDE68A'} />}
                          </div>
                        </div>
                        <CopyBtn text={t.title} />
                      </div>
                    ))}
                  </Section>
                )}
                {yt.description && (
                  <Section title="📝 YouTube Description" copyText={yt.description}>
                    <Prose>{yt.description}</Prose>
                  </Section>
                )}
                {Array.isArray(yt.tags) && yt.tags.length > 0 && (
                  <Section title={`🏷️ Tags (${yt.tags.length})`} copyText={yt.tags.join(', ')}>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                      {yt.tags.map((tag, i) => <Chip key={i} label={tag} />)}
                    </div>
                  </Section>
                )}
                {yt.primary_keyword && (
                  <Section title="🔑 Keywords">
                    <Chip label={yt.primary_keyword} color="#2563EB" bg="#EFF6FF" border="#BFDBFE" />
                    {Array.isArray(yt.secondary_keywords) && (
                      <div style={{ marginTop: 8, display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                        {yt.secondary_keywords.map((k, i) => <Chip key={i} label={k} />)}
                      </div>
                    )}
                  </Section>
                )}
                {bl.seo_title && (
                  <>
                    <div style={{ borderTop: '1px solid #E8E8E8', paddingTop: 24, marginBottom: 20 }}><Label>✍️ Blog / SEO Assets</Label></div>
                    <Section title="Blog Title" copyText={bl.seo_title}><Prose style={{ fontSize: 14, padding: '12px 14px' }}>{bl.seo_title}</Prose></Section>
                    {bl.meta_description && <Section title="Meta Description" copyText={bl.meta_description}><Prose style={{ fontSize: 13, padding: '10px 14px' }}>{bl.meta_description}</Prose></Section>}
                    {bl.url_slug && <Section title="URL Slug" copyText={bl.url_slug}><Chip label={`/${bl.url_slug}`} color="#0E7C4A" bg="#F0FDF4" border="#86EFAC" /></Section>}
                    {Array.isArray(bl.suggested_h2_headers) && bl.suggested_h2_headers.length > 0 && (
                      <Section title="H2 Headers" copyText={bl.suggested_h2_headers.join('\n')}>
                        {bl.suggested_h2_headers.map((h, i) => (
                          <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', marginBottom: 6 }}>
                            <span style={{ color: '#D4A847', fontFamily: "'JetBrains Mono',monospace", fontSize: 11, flexShrink: 0, paddingTop: 1 }}>H2</span>
                            <span style={{ fontSize: 13, color: '#0A0A0A', fontFamily: "'DM Sans',sans-serif" }}>{h}</span>
                          </div>
                        ))}
                      </Section>
                    )}
                  </>
                )}
              </div>
            )}

            {/* ── SOCIAL ── */}
            {activeTab === 'social' && (
              <div className="rp-pane">
                {ig.caption && (
                  <>
                    <div className="sp-header">
                      <span style={{ fontSize: 18 }}>📸</span>
                      <span style={{ fontSize: 14, fontWeight: 700, color: '#0A0A0A', fontFamily: "'DM Sans',sans-serif" }}>Instagram</span>
                      <div style={{ marginLeft: 'auto' }}><CopyBtn text={[ig.caption, '', ig.hashtags?.join(' ')].filter(Boolean).join('\n')} label="Copy All" /></div>
                    </div>
                    <div className="sp-body">
                      <Section title="Caption" copyText={ig.caption}><Prose>{ig.caption}</Prose></Section>
                      {ig.reel_cover_text && <Section title="Reel Cover Text"><Chip label={ig.reel_cover_text} /></Section>}
                      {ig.save_cta && <Section title="Save CTA" copyText={ig.save_cta}><Prose style={{ padding: '10px 14px', fontSize: 13 }}>{ig.save_cta}</Prose></Section>}
                      {Array.isArray(ig.hashtags) && ig.hashtags.length > 0 && (
                        <Section title={`Hashtags (${ig.hashtags.length})`} copyText={ig.hashtags.join(' ')}>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                            {ig.hashtags.map((h, i) => <Chip key={i} label={h.startsWith('#') ? h : `#${h}`} color="#DC2626" bg="#FEF2F2" border="#FCA5A5" />)}
                          </div>
                        </Section>
                      )}
                    </div>
                  </>
                )}
                {tt.caption && (
                  <>
                    <div className="sp-header">
                      <span style={{ fontSize: 18 }}>🎵</span>
                      <span style={{ fontSize: 14, fontWeight: 700, color: '#0A0A0A', fontFamily: "'DM Sans',sans-serif" }}>TikTok</span>
                      <div style={{ marginLeft: 'auto' }}><CopyBtn text={[tt.caption, tt.hashtags?.join(' ')].filter(Boolean).join('\n')} label="Copy All" /></div>
                    </div>
                    <div className="sp-body">
                      <Section title="Caption" copyText={tt.caption}><Prose style={{ fontSize: 13, padding: '10px 14px' }}>{tt.caption}</Prose></Section>
                      {tt.first_frame_text && <Section title="First Frame Text"><Chip label={tt.first_frame_text} /></Section>}
                      {Array.isArray(tt.hashtags) && tt.hashtags.length > 0 && (
                        <Section title="Hashtags" copyText={tt.hashtags.join(' ')}>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                            {tt.hashtags.map((h, i) => <Chip key={i} label={h} color="#2563EB" bg="#EFF6FF" border="#BFDBFE" />)}
                          </div>
                        </Section>
                      )}
                    </div>
                  </>
                )}
                {ps.primary_post_day && (
                  <Section title="🕐 Posting Schedule">
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
                      <Chip label={`📅 ${ps.primary_post_day}`} />
                      {ps.primary_post_time && <Chip label={`🕐 ${ps.primary_post_time}`} />}
                    </div>
                    {ps.reasoning && <p style={{ fontSize: 12, color: '#8C8C8C', margin: 0, lineHeight: 1.6, fontFamily: "'DM Sans',sans-serif" }}>{ps.reasoning}</p>}
                  </Section>
                )}
              </div>
            )}

            {/* ── 7-DAY PLAN ── */}
            {activeTab === 'plan' && (
              <div className="rp-pane">
                <SprintTracker plan={publisher.seven_day_content_plan} />
              </div>
            )}

          </TabErrorBoundary>
        </div>
      </div>
    </>
  );
}