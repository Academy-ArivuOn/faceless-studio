// lib/thumbnail/prompt-builder.js
// Converts design specs to optimized AI image generation prompts

const STYLE_PRESETS = {
  cinematic: {
    lighting: 'cinematic lighting with key light and rim light',
    quality: '8k, award-winning photography, professional grade',
    details: 'sharp focus, perfect skin, cinematic depth of field'
  },
  minimal: {
    lighting: 'soft, even lighting, minimalist setup',
    quality: 'clean, modern, high-quality',
    details: 'minimal elements, breathing room, elegant'
  },
  bold: {
    lighting: 'dramatic high-contrast lighting, theatrical',
    quality: '8k, ultra-sharp, bold colors, punchy',
    details: 'maximum visual impact, extreme contrast'
  },
  mrbeast: {
    lighting: 'bright, high-energy, studio lighting',
    quality: '4k, highly polished, mainstream appeal',
    details: 'surprised/shocked expression, extreme emotion, exaggerated'
  },
  educational: {
    lighting: 'neutral, clear, informative lighting',
    quality: 'professional, clean, readable',
    details: 'clear subject, minimal distraction, data-focused'
  }
};

// ─── Build Image Generation Prompt ────────────────────────────────────────────
export function buildImagePrompt(designSpec, styleOverride = null) {
  const {
    topic,
    emotion,
    subject,
    textOverlay,
    primaryColors,
    background,
    composition,
    facePriority,
    emotionVisuals,
    platform,
    platformTips,
    targetAudience,
  } = designSpec;

  const styleKey = styleOverride || (
    emotion === 'shock' ? 'mrbeast' :
    emotion === 'curiosity' ? 'cinematic' :
    emotion === 'fear' ? 'bold' :
    emotion === 'excitement' ? 'mrbeast' :
    'cinematic'
  );

  const style = STYLE_PRESETS[styleKey] || STYLE_PRESETS.cinematic;

  // Build subject description
  let subjectDesc = '';
  if (subject === 'face') {
    subjectDesc = `${facePriority === 'very-high' ? 'extreme close-up of' : 'close-up of'} a person with ${emotionVisuals.face}, direct eye contact with camera, ${targetAudience || 'attractive'}`;
  } else if (subject === 'object') {
    subjectDesc = `${topic} product, professional product photography, ${emotionVisuals.elements[0] || 'striking'} presentation`;
  } else if (subject === 'graphic') {
    subjectDesc = `professional graphic design for "${topic}", data visualization, infographic style`;
  } else if (subject === 'scene') {
    subjectDesc = `atmospheric scene representing "${topic}", cinematic environment`;
  } else {
    subjectDesc = `professional thumbnail for "${topic}", eye-catching, high impact`;
  }

  // Build color instruction
  const colorDesc = primaryColors && primaryColors.length > 0
    ? `primary colors: bold ${primaryColors[0]}, white, black, maximum contrast`
    : 'high contrast colors, bold palette';

  // Build background instruction
  let bgDesc = '';
  if (background === 'dark') bgDesc = 'dark, moody background with subtle gradient';
  else if (background === 'light') bgDesc = 'bright, clean white or light background';
  else if (background === 'blur') bgDesc = 'soft bokeh blur background, depth of field effect';
  else if (background === 'solid') bgDesc = `solid ${primaryColors[0] || 'colored'} background`;
  else bgDesc = 'professional background, not distracting';

  // Build composition instruction
  const compositionMap = {
    left: 'subject positioned on left side, rule of thirds, looking right',
    right: 'subject positioned on right side, rule of thirds, looking left',
    center: 'centered composition, symmetrical framing, command attention'
  };
  const compDesc = compositionMap[composition] || compositionMap.center;

  // Build text instruction
  let textInstr = '';
  if (textOverlay && textOverlay !== 'max 3 words') {
    textInstr = `\n- Bold text overlay reading "${textOverlay}", thick sans-serif font, white text with black outline, positioned at ${composition === 'top' ? 'top' : 'bottom'}, maximum readability on small screens`;
  } else {
    textInstr = `\n- Space reserved for bold text overlay (3 words max) in ${primaryColors[0]} or white with outline`;
  }

  // Platform-specific adjustments
  let platformAdj = '';
  if (platform === 'shorts' || platform === 'tiktok') {
    platformAdj = ', vertical composition (9:16), mobile-first design, fast visual impact';
  } else if (platform === 'instagram') {
    platformAdj = ', square composition (1:1), aesthetic, feed-friendly';
  } else if (platform === 'linkedin') {
    platformAdj = ', professional tone, trustworthy appearance';
  }

  const fullPrompt = `
You are an expert thumbnail designer creating high-converting social media thumbnails.

SUBJECT:
${subjectDesc}

EMOTIONAL TONE:
${emotion} emotion, ${emotionVisuals.intensity} intensity

VISUAL DIRECTION:
- ${compDesc}
- ${bgDesc}
- ${colorDesc}
- ${style.lighting}
- ${style.details}${textInstr}

PLATFORM REQUIREMENTS:
${platformAdj}
${platformTips ? `Prioritize these design tips: ${platformTips.slice(0, 2).join(', ')}` : ''}

QUALITY:
${style.quality}

OUTPUT:
A professional, conversion-optimized thumbnail image that:
1. Immediately grabs attention
2. Clearly communicates the topic
3. Has maximum CTR potential
4. Works perfectly on mobile (small sizes)
5. Uses psychology triggers (${emotion})

Generate this thumbnail with maximum visual impact.
`.trim();

  return fullPrompt;
}

// ─── Build Variation Prompts ──────────────────────────────────────────────────
export function buildVariationPrompts(designSpec) {
  const variations = [];

  // Variation 1: Emotion Focus
  const emotionSpec = JSON.parse(JSON.stringify(designSpec));
  variations.push({
    type: 'emotion_focus',
    prompt: buildImagePrompt(emotionSpec, 'mrbeast'),
    description: 'Maximum emotion emphasis - exaggerated expression, high energy'
  });

  // Variation 2: Text Focus
  const textSpec = JSON.parse(JSON.stringify(designSpec));
  textSpec.facePriority = 'low-medium';
  variations.push({
    type: 'text_focus',
    prompt: buildImagePrompt(textSpec, 'bold'),
    description: 'Text-prominent design - bold typography, larger overlay'
  });

  // Variation 3: Contrast Focus
  const contrastSpec = JSON.parse(JSON.stringify(designSpec));
  contrastSpec.emotionVisuals.intensity = 'very-high';
  variations.push({
    type: 'contrast_focus',
    prompt: buildImagePrompt(contrastSpec, 'bold'),
    description: 'Maximum contrast - stark colors, dramatic lighting'
  });

  // Variation 4: Platform Optimized (if not already optimized)
  if (designSpec.platform !== 'youtube') {
    const platformSpec = JSON.parse(JSON.stringify(designSpec));
    platformSpec.platform = 'youtube';
    variations.push({
      type: 'platform_optimized',
      prompt: buildImagePrompt(platformSpec),
      description: 'Optimized for YouTube 16:9 format'
    });
  }

  // Variation 5: Minimal/Clean
  const minimalSpec = JSON.parse(JSON.stringify(designSpec));
  minimalSpec.emotionVisuals.intensity = 'low-medium';
  variations.push({
    type: 'minimal',
    prompt: buildImagePrompt(minimalSpec, 'minimal'),
    description: 'Cleaner, less busy design - modern aesthetic'
  });

  return variations;
}

// ─── Build Edit Prompt ────────────────────────────────────────────────────────
export function buildEditPrompt(originalSpec, feedback, editType) {
  const editedSpec = JSON.parse(JSON.stringify(originalSpec));

  // Apply feedback to spec
  const feedbackLower = feedback.toLowerCase();

  if (feedbackLower.includes('text:')) {
    const match = feedback.match(/text:\s*["']?([^"'\n]+)["']?/i);
    if (match) editedSpec.textOverlay = match[1].slice(0, 50);
  }

  if (feedbackLower.includes('more expressive')) {
    editedSpec.facePriority = 'very-high';
    editedSpec.emotionVisuals.intensity = 'very-high';
  }

  if (feedbackLower.includes('color:')) {
    const match = feedback.match(/color:\s*(\w+)/i);
    if (match) editedSpec.primaryColors = [match[1].toLowerCase()];
  }

  if (editType === 'regenerate') {
    return buildImagePrompt(editedSpec, 'mrbeast');
  } else if (editType === 'enhance') {
    return buildImagePrompt(editedSpec, 'bold');
  } else {
    return buildImagePrompt(editedSpec);
  }
}

// ─── Build Comparison Prompt ─────────────────────────────────────────────────
export function buildComparisonPrompt(designSpec1, designSpec2) {
  return {
    spec1: designSpec1,
    spec2: designSpec2,
    prompt: `Compare these two thumbnail variations for CTR potential:\n\n1. ${designSpec1.emotion} focus\n2. ${designSpec2.emotion} focus\n\nWhich has higher conversion potential for platform ${designSpec1.platform}?`
  };
}