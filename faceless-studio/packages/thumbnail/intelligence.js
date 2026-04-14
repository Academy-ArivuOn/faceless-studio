// packages/thumbnail/intelligence.js
// Thumbnail Intelligence Engine - converts concepts to structured design specs

const PLATFORM_RULES = {
  youtube: {
    aspectRatio: '16:9',
    textMax: '3 words',
    colorScheme: 'high-contrast',
    facePriority: 'high',
    style: 'bold, exaggerated, curiosity-driven',
    tips: [
      'Expressive face with mouth open or shocked expression',
      'Bold, yellow/red/white text',
      'High contrast background',
      'Curiosity gap visual (question mark, confused face)',
      'Arrow or directional element pointing to face'
    ]
  },
  shorts: {
    aspectRatio: '9:16',
    textMax: '2 words',
    colorScheme: 'vibrant',
    facePriority: 'very-high',
    style: 'fast, emotional, exaggerated',
    tips: [
      'Vertical composition optimized',
      'Large expressive face',
      'Quick-read text at top/bottom',
      'Movement suggestion',
      'High saturation colors'
    ]
  },
  instagram: {
    aspectRatio: '1:1',
    textMax: '2 words',
    colorScheme: 'aesthetic, cohesive',
    facePriority: 'medium',
    style: 'clean, visually pleasing, on-brand',
    tips: [
      'Balanced composition',
      'Cohesive color palette (2-3 colors max)',
      'Elegant typography',
      'Negative space utilization',
      'High production value look'
    ]
  },
  tiktok: {
    aspectRatio: '9:16',
    textMax: '2 words',
    colorScheme: 'vibrant, trendy',
    facePriority: 'very-high',
    style: 'edgy, trendy, gen-z aesthetic',
    tips: [
      'Vertical-first design',
      'Bold, emoji-like expressions',
      'Trending color combos',
      'Movement lines or dynamic elements',
      'Quick visual impact'
    ]
  },
  linkedin: {
    aspectRatio: '1.5:1',
    textMax: '3 words',
    colorScheme: 'professional, minimal',
    facePriority: 'medium',
    style: 'authority-driven, credible, minimal',
    tips: [
      'Professional appearance',
      'Trusted color palette (blue, gray, white)',
      'Data visualization if applicable',
      'Minimalist design',
      'High trust visual elements'
    ]
  },
  twitter: {
    aspectRatio: '16:9',
    textMax: '4 words',
    colorScheme: 'high-contrast, sharp',
    facePriority: 'low-medium',
    style: 'text-driven, sharp, witty',
    tips: [
      'Bold typography dominates',
      'Sharp color contrast',
      'Quick readability',
      'Minimalist composition',
      'Text legibility on small screens'
    ]
  },
  facebook: {
    aspectRatio: '1.2:1',
    textMax: '3 words',
    colorScheme: 'warm, emotional',
    facePriority: 'medium-high',
    style: 'relatable, emotional, community-focused',
    tips: [
      'Warm, inviting colors',
      'Relatable human element',
      'Clear emotion expression',
      'Balanced composition',
      'Family/community feeling'
    ]
  }
};

const EMOTION_VISUAL_MAP = {
  shock: {
    face: 'wide eyes, open mouth, raised eyebrows',
    colors: ['red', 'yellow', 'black'],
    elements: ['lightning bolt', 'explosion effect', 'starburst'],
    intensity: 'high'
  },
  curiosity: {
    face: 'raised eyebrow, slight head tilt, focused gaze',
    colors: ['blue', 'white', 'yellow'],
    elements: ['question mark', 'pointing hand', 'spotlight'],
    intensity: 'medium'
  },
  fear: {
    face: 'wide eyes, raised eyebrows, concerned expression',
    colors: ['red', 'dark gray', 'black'],
    elements: ['warning triangle', 'danger symbol', 'dark shadows'],
    intensity: 'high'
  },
  excitement: {
    face: 'big smile, bright eyes, upbeat expression',
    colors: ['yellow', 'green', 'orange'],
    elements: ['fireworks', 'confetti', 'stars', 'arrows pointing up'],
    intensity: 'high'
  },
  inspiration: {
    face: 'gentle smile, bright eyes, uplifted gaze',
    colors: ['gold', 'white', 'blue'],
    elements: ['light glow', 'upward arrow', 'halo'],
    intensity: 'medium'
  },
  skepticism: {
    face: 'raised eyebrow, sideways mouth, doubtful expression',
    colors: ['gray', 'white', 'dark blue'],
    elements: ['question mark', 'thinking bubble', 'concerned lines'],
    intensity: 'low-medium'
  },
  anger: {
    face: 'furrowed brows, tight mouth, intense stare',
    colors: ['red', 'black', 'dark gray'],
    elements: ['lightning', 'impact lines', 'fire'],
    intensity: 'very-high'
  },
  sadness: {
    face: 'downturned mouth, sad eyes, somber expression',
    colors: ['dark blue', 'gray', 'muted tones'],
    elements: ['teardrop', 'shadow', 'storm clouds'],
    intensity: 'medium'
  }
};

const COLOR_PSYCHOLOGY = {
  red: { trigger: 'urgency, energy, danger', usage: 'CTAs, warnings, excitement' },
  yellow: { trigger: 'happiness, optimism, attention', usage: 'CTAs, highlights, energy' },
  blue: { trigger: 'trust, calm, authority', usage: 'backgrounds, professional, credibility' },
  green: { trigger: 'growth, health, money', usage: 'success, positive change' },
  orange: { trigger: 'playfulness, energy, warmth', usage: 'calls to action, fun content' },
  purple: { trigger: 'luxury, mystery, creativity', usage: 'premium content, creative niches' },
  black: { trigger: 'sophistication, drama, contrast', usage: 'backgrounds, text contrast' },
  white: { trigger: 'clean, minimal, clarity', usage: 'backgrounds, text, breathing room' }
};

// ─── Parse Thumbnail Concept ──────────────────────────────────────────────────
function parseThumbnailConcept(concept) {
  if (!concept || typeof concept !== 'string') {
    return {
      subject: 'generic',
      emotion: 'curiosity',
      text: 'max 3 words',
      background: 'neutral',
      composition: 'center'
    };
  }

  const lower = concept.toLowerCase();

  // Extract emotion
  let emotion = 'curiosity';
  for (const [key, value] of Object.entries(EMOTION_VISUAL_MAP)) {
    if (lower.includes(key)) {
      emotion = key;
      break;
    }
  }

  // Extract subject type
  let subject = 'generic';
  if (lower.includes('face') || lower.includes('person') || lower.includes('expression')) subject = 'face';
  if (lower.includes('object') || lower.includes('product')) subject = 'object';
  if (lower.includes('graphic') || lower.includes('chart') || lower.includes('data')) subject = 'graphic';
  if (lower.includes('landscape') || lower.includes('scene')) subject = 'scene';

  // Extract text hints
  let text = 'max 3 words';
  const textMatch = concept.match(/(?:text|say|write|label):\s*["']?([^"'\n]+)["']?/i);
  if (textMatch) text = textMatch[1].slice(0, 50);

  // Extract background
  let background = 'neutral';
  if (lower.includes('dark') || lower.includes('black')) background = 'dark';
  if (lower.includes('bright') || lower.includes('light') || lower.includes('white')) background = 'light';
  if (lower.includes('blur') || lower.includes('bokeh')) background = 'blur';
  if (lower.includes('solid')) background = 'solid';

  // Extract composition
  let composition = 'center';
  if (lower.includes('left')) composition = 'left';
  if (lower.includes('right')) composition = 'right';

  return { subject, emotion, text, background, composition };
}

// ─── Convert Concept to Design Spec ───────────────────────────────────────────
export function conceptToDesignSpec(inputData) {
  const {
    topic = '',
    thumbnail_concept = '',
    hook = '',
    emotion = null,
    platform = 'youtube',
    target_audience = '',
    user_requirements = null,
  } = inputData;

  const platformLower = (platform || 'youtube').toLowerCase();
  const platformRules = PLATFORM_RULES[platformLower] || PLATFORM_RULES.youtube;
  const conceptParsed = parseThumbnailConcept(thumbnail_concept);
  const emotionFinal = emotion || conceptParsed.emotion;
  const emotionVisuals = EMOTION_VISUAL_MAP[emotionFinal] || EMOTION_VISUAL_MAP.curiosity;

  // Determine text overlay
  let textOverlay = conceptParsed.text;
  if (user_requirements && user_requirements.toLowerCase().includes('text:')) {
    const match = user_requirements.match(/text:\s*["']?([^"'\n]+)["']?/i);
    if (match) textOverlay = match[1].slice(0, 50);
  }
  // Limit text based on platform
  const wordLimit = platformRules.textMax.split(' ')[0];
  if (textOverlay.split(/\s+/).length > parseInt(wordLimit)) {
    textOverlay = textOverlay.split(/\s+/).slice(0, parseInt(wordLimit)).join(' ');
  }

  // Determine color scheme
  let primaryColors = emotionVisuals.colors;
  if (user_requirements && user_requirements.toLowerCase().includes('color:')) {
    const match = user_requirements.match(/color:\s*(\w+)/i);
    if (match) primaryColors = [match[1].toLowerCase()];
  }

  // Determine subject
  let subject = conceptParsed.subject;
  if (hook && hook.includes('face')) subject = 'face';

  // Build specification
  const spec = {
    platform: platformLower,
    topic: topic.slice(0, 100),
    hook: hook.slice(0, 200),
    emotion: emotionFinal,
    subject: subject,
    textOverlay: textOverlay,
    primaryColors: primaryColors,
    secondaryColors: ['white', 'black'],
    background: conceptParsed.background,
    composition: conceptParsed.composition,
    facePriority: platformRules.facePriority,
    style: platformRules.style,
    aspectRatio: platformRules.aspectRatio,
    emotionVisuals: emotionVisuals,
    platformTips: platformRules.tips,
    targetAudience: target_audience.slice(0, 200),
    userRequirements: user_requirements ? user_requirements.slice(0, 500) : null,
  };

  return spec;
}

// ─── Extract Design Elements ──────────────────────────────────────────────────
export function extractDesignElements(spec) {
  const {
    emotion,
    subject,
    primaryColors,
    background,
    composition,
    emotionVisuals,
    platformTips,
  } = spec;

  return {
    faceExpression: emotionVisuals.face,
    visualElements: emotionVisuals.elements,
    colorPalette: primaryColors,
    backgroundStyle: background,
    compositionFocus: composition,
    contrastLevel: emotionVisuals.intensity,
    designTips: platformTips,
    lightingStyle: emotionVisuals.intensity === 'high' ? 'cinematic-high-contrast' : 'balanced',
  };
}

// ─── Merge Feedback into Spec ────────────────────────────────────────────────
export function mergeFeedbackIntoSpec(currentSpec, feedback, editType) {
  const updated = JSON.parse(JSON.stringify(currentSpec));

  const feedbackLower = feedback.toLowerCase();

  // Text changes
  if (feedbackLower.includes('text:') || feedbackLower.includes('say:')) {
    const match = feedback.match(/(?:text|say):\s*["']?([^"'\n]+)["']?/i);
    if (match) {
      const newText = match[1].slice(0, 50);
      updated.textOverlay = newText;
    }
  }

  // Color changes
  for (const [color, _] of Object.entries(COLOR_PSYCHOLOGY)) {
    if (feedbackLower.includes(`${color} background`) || feedbackLower.includes(`${color} color`)) {
      updated.primaryColors = [color];
      break;
    }
  }

  // Emotion changes
  for (const [emoKey, _] of Object.entries(EMOTION_VISUAL_MAP)) {
    if (feedbackLower.includes(`more ${emoKey}`) || feedbackLower.includes(`less ${emoKey}`)) {
      if (feedbackLower.includes('more')) {
        updated.emotion = emoKey;
        updated.emotionVisuals = EMOTION_VISUAL_MAP[emoKey];
      }
      break;
    }
  }

  // Face emphasis
  if (feedbackLower.includes('more expressive') || feedbackLower.includes('bigger face')) {
    updated.facePriority = 'very-high';
  }
  if (feedbackLower.includes('smaller face') || feedbackLower.includes('less face')) {
    updated.facePriority = 'low-medium';
  }

  // Composition changes
  if (feedbackLower.includes('left side') || feedbackLower.includes('move left')) {
    updated.composition = 'left';
  }
  if (feedbackLower.includes('right side') || feedbackLower.includes('move right')) {
    updated.composition = 'right';
  }
  if (feedbackLower.includes('center')) {
    updated.composition = 'center';
  }

  // Contrast changes
  if (feedbackLower.includes('more contrast') || feedbackLower.includes('higher contrast')) {
    updated.emotionVisuals.intensity = 'very-high';
  }
  if (feedbackLower.includes('less contrast') || feedbackLower.includes('softer')) {
    updated.emotionVisuals.intensity = 'low-medium';
  }

  updated.editType = editType || 'modify';
  updated.feedbackApplied = feedback;

  return updated;
}

// ─── Determine Edit Scope ────────────────────────────────────────────────────
export function determineEditScope(feedback) {
  const lower = feedback.toLowerCase();

  // Check if major change (requires regeneration)
  const majorPatterns = [
    /change.*subject|different.*object|new.*character/,
    /completely different|start over|new design/,
    /change.*composition.*drastically|different layout/,
    /multiple changes/,
  ];

  const isMajor = majorPatterns.some(p => p.test(lower));

  // Check if minor change (can be enhanced)
  const minorPatterns = [
    /bigger|smaller|bolder|lighter|darker/,
    /add.*text|change.*text/,
    /adjust|tweak|fine.tune/,
    /more|less(?!.*subject|.*character)/,
  ];

  const isMinor = minorPatterns.some(p => p.test(lower));

  if (isMajor) return 'regenerate';
  if (isMinor) return 'enhance';
  return 'modify';
}