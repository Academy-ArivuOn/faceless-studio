// components/app/ThumbnailGenerator.jsx
'use client';
import { useState, useRef, useEffect } from 'react';
import { getSupabaseBrowser } from '@/packages/supabase-browser';

const PLATFORMS = [
  { value: 'youtube', label: 'YouTube', ratio: '16:9' },
  { value: 'shorts', label: 'YouTube Shorts', ratio: '9:16' },
  { value: 'instagram', label: 'Instagram', ratio: '1:1' },
  { value: 'tiktok', label: 'TikTok', ratio: '9:16' },
  { value: 'linkedin', label: 'LinkedIn', ratio: '1.5:1' },
  { value: 'twitter', label: 'Twitter/X', ratio: '16:9' },
  { value: 'facebook', label: 'Facebook', ratio: '1.2:1' },
];

const STYLES = [
  { value: 'cinematic', label: 'Cinematic' },
  { value: 'minimal', label: 'Minimal' },
  { value: 'bold', label: 'Bold' },
  { value: 'mrbeast', label: 'MrBeast Style' },
  { value: 'educational', label: 'Educational' },
];

export default function ThumbnailGenerator({ agentOutput = null }) {
  const supabase = getSupabaseBrowser();
  const [user, setUser] = useState(null);

  // Form state
  const [topic, setTopic] = useState(agentOutput?.chosen_topic || '');
  const [hook, setHook] = useState(agentOutput?.chosen_hook || '');
  const [thumbnailConcept, setThumbnailConcept] = useState(agentOutput?.thumbnail_concept || '');
  const [platform, setPlatform] = useState('youtube');
  const [style, setStyle] = useState('cinematic');
  const [userRequirements, setUserRequirements] = useState('');

  // Generation state
  const [generating, setGenerating] = useState(false);
  const [thumbnails, setThumbnails] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [error, setError] = useState('');

  // Editing state
  const [editingId, setEditingId] = useState(null);
  const [editFeedback, setEditFeedback] = useState('');
  const [editingThumbnail, setEditingThumbnail] = useState(false);

  // Comparison state
  const [compareMode, setCompareMode] = useState(false);
  const [compareId, setCompareId] = useState(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setUser(session.user);
    });
  }, []);

  async function handleGenerate(e) {
    e.preventDefault();
    if (!topic.trim()) {
      setError('Topic is required');
      return;
    }

    setError('');
    setGenerating(true);
    setThumbnails([]);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const res = await fetch('/api/agents/thumbnail', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          topic: topic.trim(),
          hook: hook.trim(),
          thumbnail_concept: thumbnailConcept.trim(),
          platform,
          style_preference: style,
          user_requirements: userRequirements.trim() || null,
          generateVariations: true,
        }),
      });

      const json = await res.json();

      if (!res.ok || !json.success) {
        setError(json.error || 'Generation failed');
        setGenerating(false);
        return;
      }

      setThumbnails(json.thumbnails || []);
      if (json.thumbnails?.length > 0) {
        setSelectedId(json.thumbnails[0].id);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setGenerating(false);
    }
  }

  async function handleEdit(e) {
    e.preventDefault();
    if (!editFeedback.trim() || !selectedId) return;

    setEditingThumbnail(true);
    setError('');

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const res = await fetch('/api/agents/thumbnail/edit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          selected_thumbnail_id: selectedId,
          feedback: editFeedback.trim(),
        }),
      });

      const json = await res.json();

      if (!res.ok || !json.success) {
        setError(json.error || 'Edit failed');
        return;
      }

      // Add edited version to thumbnails
      setThumbnails(prev => [json.edited_thumbnail, ...prev]);
      setEditFeedback('');
      setEditingId(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setEditingThumbnail(false);
    }
  }

  const selectedThumbnail = thumbnails.find(t => t.id === selectedId);

  return (
    <div style={styles.container}>
      <style>{`
        ${styles.css}
      `}</style>

      {/* Header */}
      <div style={styles.header}>
        <h2 style={styles.title}>✨ Thumbnail Generator</h2>
        <p style={styles.subtitle}>Create high-converting thumbnails for any platform</p>
      </div>

      {/* Form Section */}
      <div style={styles.formSection}>
        <form onSubmit={handleGenerate}>
          <div style={styles.grid2}>
            <div>
              <label style={styles.label}>Topic *</label>
              <input
                type="text"
                placeholder="e.g., How to make passive income"
                value={topic}
                onChange={e => setTopic(e.target.value)}
                disabled={generating}
                style={styles.input}
              />
            </div>
            <div>
              <label style={styles.label}>Platform</label>
              <select
                value={platform}
                onChange={e => setPlatform(e.target.value)}
                disabled={generating}
                style={styles.select}
              >
                {PLATFORMS.map(p => (
                  <option key={p.value} value={p.value}>
                    {p.label} ({p.ratio})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div style={styles.grid2}>
            <div>
              <label style={styles.label}>Hook (optional)</label>
              <input
                type="text"
                placeholder="Your hook from Research Agent"
                value={hook}
                onChange={e => setHook(e.target.value)}
                disabled={generating}
                style={styles.input}
              />
            </div>
            <div>
              <label style={styles.label}>Style</label>
              <select
                value={style}
                onChange={e => setStyle(e.target.value)}
                disabled={generating}
                style={styles.select}
              >
                {STYLES.map(s => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label style={styles.label}>Thumbnail Concept (optional)</label>
            <textarea
              placeholder="Visual description: subject, emotion, colors, composition..."
              value={thumbnailConcept}
              onChange={e => setThumbnailConcept(e.target.value)}
              disabled={generating}
              style={styles.textarea}
              rows="2"
            />
          </div>

          <div>
            <label style={styles.label}>Custom Requirements (optional)</label>
            <textarea
              placeholder="e.g., Make text say 'SHOCKING', add red background, more expressive face..."
              value={userRequirements}
              onChange={e => setUserRequirements(e.target.value)}
              disabled={generating}
              style={styles.textarea}
              rows="2"
            />
          </div>

          {error && <div style={styles.error}>{error}</div>}

          <button
            type="submit"
            disabled={generating}
            style={{
              ...styles.button,
              opacity: generating ? 0.6 : 1,
              cursor: generating ? 'not-allowed' : 'pointer',
            }}
          >
            {generating ? 'Generating...' : '🎨 Generate Thumbnails'}
          </button>
        </form>
      </div>

      {/* Thumbnails Grid */}
      {thumbnails.length > 0 && (
        <div style={styles.resultSection}>
          <h3 style={styles.sectionTitle}>Generated Thumbnails</h3>

          <div style={styles.grid3}>
            {thumbnails.map(thumb => (
              <div
                key={thumb.id}
                style={{
                  ...styles.card,
                  border: selectedId === thumb.id ? '3px solid #D4A847' : styles.card.border,
                }}
                onClick={() => setSelectedId(thumb.id)}
              >
                <img
                  src={thumb.image_url}
                  alt={thumb.variation_type}
                  style={styles.thumbnail}
                />
                <div style={styles.cardContent}>
                  <span style={styles.badge}>{thumb.variation_type}</span>
                  <div style={styles.score}>
                    <span style={styles.scoreLabel}>CTR:</span>
                    <span style={styles.scoreValue}>{thumb.ctr_score_prediction}%</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Selected Thumbnail Details */}
          {selectedThumbnail && (
            <div style={styles.detailsSection}>
              <div style={styles.detailsHeader}>
                <h4 style={styles.detailsTitle}>Selected: {selectedThumbnail.variation_type}</h4>
                <button
                  onClick={() => setCompareMode(!compareMode)}
                  style={styles.secondaryButton}
                >
                  {compareMode ? '✕ Close Compare' : '↔ Compare Versions'}
                </button>
              </div>

              <img
                src={selectedThumbnail.image_url}
                alt="Selected"
                style={styles.largePreview}
              />

              <div style={styles.breakdown}>
                <div style={styles.breakdownItem}>
                  <strong>Text:</strong> {selectedThumbnail.design_breakdown.text_overlay}
                </div>
                <div style={styles.breakdownItem}>
                  <strong>Colors:</strong> {selectedThumbnail.design_breakdown.color_scheme}
                </div>
                <div style={styles.breakdownItem}>
                  <strong>Focus:</strong> {selectedThumbnail.design_breakdown.subject_focus}
                </div>
              </div>

              {/* Edit Section */}
              <div style={styles.editSection}>
                <h5 style={styles.editTitle}>Refine This Thumbnail</h5>
                <form onSubmit={handleEdit}>
                  <textarea
                    placeholder="e.g., Make the face more expressive, change text to 'SHOCKING', add red background..."
                    value={editFeedback}
                    onChange={e => setEditFeedback(e.target.value)}
                    disabled={editingThumbnail}
                    style={styles.textarea}
                    rows="2"
                  />
                  <button
                    type="submit"
                    disabled={!editFeedback.trim() || editingThumbnail}
                    style={{
                      ...styles.button,
                      background: '#4A90D9',
                      opacity: editingThumbnail ? 0.6 : 1,
                    }}
                  >
                    {editingThumbnail ? 'Refining...' : '✨ Apply Feedback'}
                  </button>
                </form>
              </div>

              {/* Download */}
              <a
                href={selectedThumbnail.image_url}
                download
                style={styles.downloadButton}
              >
                ⬇ Download Thumbnail
              </a>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

const styles = {
  container: {
    padding: '32px 24px',
    maxWidth: '1200px',
    margin: '0 auto',
  },

  css: `
    @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.7; } }
  `,

  header: {
    textAlign: 'center',
    marginBottom: '40px',
  },

  title: {
    fontSize: '28px',
    fontWeight: '800',
    color: '#EEEEF5',
    margin: '0 0 8px',
  },

  subtitle: {
    fontSize: '14px',
    color: 'rgba(238,238,245,0.55)',
    margin: 0,
  },

  formSection: {
    background: 'rgba(11,19,64,0.5)',
    border: '1px solid rgba(212,168,71,0.15)',
    borderRadius: '12px',
    padding: '24px',
    marginBottom: '40px',
  },

  label: {
    display: 'block',
    fontSize: '12px',
    fontWeight: '600',
    color: 'rgba(238,238,245,0.55)',
    marginBottom: '6px',
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
  },

  input: {
    width: '100%',
    padding: '10px 12px',
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(255,255,255,0.07)',
    borderRadius: '8px',
    color: '#EEEEF5',
    fontSize: '14px',
    fontFamily: 'var(--FB)',
    outline: 'none',
    boxSizing: 'border-box',
  },

  select: {
    width: '100%',
    padding: '10px 12px',
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(255,255,255,0.07)',
    borderRadius: '8px',
    color: '#EEEEF5',
    fontSize: '14px',
    fontFamily: 'var(--FB)',
    cursor: 'pointer',
  },

  textarea: {
    width: '100%',
    padding: '10px 12px',
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(255,255,255,0.07)',
    borderRadius: '8px',
    color: '#EEEEF5',
    fontSize: '14px',
    fontFamily: 'var(--FB)',
    outline: 'none',
    boxSizing: 'border-box',
    resize: 'vertical',
  },

  grid2: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '16px',
    marginBottom: '16px',
  },

  grid3: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
    gap: '16px',
    marginBottom: '32px',
  },

  button: {
    width: '100%',
    padding: '12px 20px',
    background: '#D4A847',
    border: 'none',
    borderRadius: '8px',
    color: '#040818',
    fontSize: '14px',
    fontWeight: '700',
    cursor: 'pointer',
    marginTop: '8px',
  },

  secondaryButton: {
    padding: '8px 16px',
    background: 'rgba(212,168,71,0.15)',
    border: '1px solid rgba(212,168,71,0.3)',
    borderRadius: '6px',
    color: '#D4A847',
    fontSize: '12px',
    fontWeight: '600',
    cursor: 'pointer',
  },

  error: {
    background: 'rgba(248,113,113,0.1)',
    border: '1px solid rgba(248,113,113,0.2)',
    borderRadius: '8px',
    color: '#F87171',
    padding: '10px 12px',
    marginBottom: '16px',
    fontSize: '13px',
  },

  resultSection: {
    marginTop: '40px',
  },

  sectionTitle: {
    fontSize: '18px',
    fontWeight: '700',
    color: '#EEEEF5',
    marginBottom: '20px',
  },

  card: {
    border: '1px solid rgba(212,168,71,0.15)',
    borderRadius: '8px',
    overflow: 'hidden',
    cursor: 'pointer',
    transition: 'all 0.3s',
    background: 'rgba(11,19,64,0.5)',
  },

  thumbnail: {
    width: '100%',
    height: '180px',
    objectFit: 'cover',
  },

  cardContent: {
    padding: '8px 12px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  badge: {
    fontSize: '11px',
    fontWeight: '600',
    color: '#D4A847',
    background: 'rgba(212,168,71,0.15)',
    padding: '3px 8px',
    borderRadius: '4px',
  },

  score: {
    display: 'flex',
    gap: '4px',
    fontSize: '12px',
  },

  scoreLabel: {
    color: 'rgba(238,238,245,0.55)',
  },

  scoreValue: {
    color: '#D4A847',
    fontWeight: '700',
  },

  detailsSection: {
    background: 'rgba(11,19,64,0.5)',
    border: '1px solid rgba(212,168,71,0.15)',
    borderRadius: '12px',
    padding: '24px',
    marginTop: '24px',
  },

  detailsHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px',
  },

  detailsTitle: {
    fontSize: '16px',
    fontWeight: '700',
    color: '#EEEEF5',
    margin: 0,
  },

  largePreview: {
    width: '100%',
    borderRadius: '8px',
    marginBottom: '16px',
    maxHeight: '400px',
    objectFit: 'cover',
  },

  breakdown: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '12px',
    marginBottom: '20px',
  },

  breakdownItem: {
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(255,255,255,0.07)',
    borderRadius: '6px',
    padding: '10px 12px',
    fontSize: '12px',
    color: 'rgba(238,238,245,0.7)',
  },

  editSection: {
    background: 'rgba(212,168,71,0.07)',
    border: '1px solid rgba(212,168,71,0.15)',
    borderRadius: '8px',
    padding: '16px',
    marginBottom: '16px',
  },

  editTitle: {
    fontSize: '13px',
    fontWeight: '600',
    color: '#D4A847',
    margin: '0 0 12px',
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
  },

  downloadButton: {
    display: 'inline-block',
    padding: '10px 20px',
    background: 'rgba(62,207,142,0.15)',
    border: '1px solid rgba(62,207,142,0.3)',
    borderRadius: '6px',
    color: '#3ECF8E',
    fontSize: '12px',
    fontWeight: '600',
    textDecoration: 'none',
    cursor: 'pointer',
  },
};