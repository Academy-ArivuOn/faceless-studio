// packages/agents/blogger-prompts.js
// Intelligent blogger prompt system that generates DIVERSE, AUTHENTIC scripts
// No generic "if you don't do this you'll lose money" openers
// Supports: travel, food, advertisement, culture, event, product_review, lifestyle
// Supports: image analysis, short video clip description, location context

// ─── Opening Style Library ────────────────────────────────────────────────────
// Each blog type gets a palette of opening styles to pick from
// This prevents repetitive "hype" or "fear" openings

const OPENING_STYLE_LIBRARY = {
  // Conversational / Slice of Life
  slice_of_life: {
    label: 'Slice of Life',
    description: 'Start in the middle of an experience — no setup, just presence',
    example: 'The smell hit me before I even opened the door...',
  },
  native_meme_reference: {
    label: 'Native Meme / Cultural Reference',
    description: 'Start with a relatable local meme, joke, or cultural saying before pivoting',
    example: 'You know that feeling when someone says "oru lift podungappa" and you actually trust them? That\'s me right now at...',
  },
  unexpected_confession: {
    label: 'Unexpected Confession',
    description: 'Creator admits something surprising or counter-intuitive about themselves',
    example: 'I\'ve been living in Chennai for 8 years and I had never heard of this place until last week.',
  },
  sensory_immersion: {
    label: 'Sensory Immersion',
    description: 'Paint a vivid sensory picture — smell, sound, texture, temperature',
    example: 'Imagine: 6 AM, sea breeze, fresh idli steam rising, and a queue of 40 people who all somehow look completely at peace.',
  },
  direct_address: {
    label: 'Direct Address',
    description: 'Speak directly to a specific type of person in the audience',
    example: 'If you\'re someone who plans every trip on a spreadsheet, this video is your sign to delete the spreadsheet.',
  },
  mystery_tease: {
    label: 'Mystery Tease',
    description: 'Open with something unexplained that demands resolution — not fear-based, just curious',
    example: 'There\'s a door in this lane that has no sign, no menu outside, and a 2-hour wait every single day.',
  },
  local_legend: {
    label: 'Local Legend / Story',
    description: 'Open with a piece of local history, legend, or folklore connected to the place',
    example: 'This chai shop has been running since 1962. The owner\'s grandfather started it. The recipe has never changed.',
  },
  contrast_open: {
    label: 'Before / After Contrast',
    description: 'Juxtapose what people expect vs what they find',
    example: 'Everyone told me Madurai is just temples. Nobody told me about the rooftop at midnight.',
  },
  friend_recommendation: {
    label: 'Friend Recommendation Energy',
    description: 'Talk like you\'re excitedly telling your best friend about a discovery — casual, genuine, warm',
    example: 'Okay wait, I have to tell you about this place. Like drop what you\'re doing, put this on full screen.',
  },
  advertisement_authentic: {
    label: 'Authentic Advertisement Open',
    description: 'For paid/sponsored content — be transparent about it but lead with genuine value, show the place first',
    example: 'So [Brand] asked me to come check out their new branch, and honestly? I wasn\'t expecting much. Spoiler: I was wrong.',
  },
};

// ─── Blog Type Configs ────────────────────────────────────────────────────────

const BLOG_TYPE_CONFIGS = {
  travel: {
    label: 'Travel Blog',
    allowed_openings: ['slice_of_life', 'sensory_immersion', 'contrast_open', 'local_legend', 'friend_recommendation', 'mystery_tease', 'native_meme_reference'],
    script_structure: 'journey_narrative',
    visual_focus: 'location_showcase',
    cta_type: 'save_for_trip',
    tone_guidance: 'Discovery, wonder, practical tips woven in naturally. Not a travel guide recitation — a friend sharing a real experience.',
  },
  advertisement: {
    label: 'Advertisement / Sponsored',
    allowed_openings: ['advertisement_authentic', 'slice_of_life', 'sensory_immersion', 'friend_recommendation', 'unexpected_confession'],
    script_structure: 'walk_through_experience',
    visual_focus: 'product_and_place',
    cta_type: 'visit_or_purchase',
    tone_guidance: 'Transparent about sponsorship but genuinely enthusiastic. Show first, sell second. The audience can feel fake — be real.',
  },
  food: {
    label: 'Food & Restaurant',
    allowed_openings: ['sensory_immersion', 'slice_of_life', 'mystery_tease', 'native_meme_reference', 'friend_recommendation', 'local_legend'],
    script_structure: 'tasting_journey',
    visual_focus: 'food_closeups_and_preparation',
    cta_type: 'try_it_now',
    tone_guidance: 'Make people taste through the screen. Describe texture, temperature, smell. Opinion-driven — not a Zomato review.',
  },
  culture: {
    label: 'Culture & Heritage',
    allowed_openings: ['local_legend', 'sensory_immersion', 'contrast_open', 'mystery_tease', 'direct_address'],
    script_structure: 'story_and_exploration',
    visual_focus: 'architecture_people_rituals',
    cta_type: 'learn_and_visit',
    tone_guidance: 'Respectful, curious, deep. Connect past to present. Don\'t be a Wikipedia recitation — find the human story.',
  },
  event: {
    label: 'Event Coverage',
    allowed_openings: ['slice_of_life', 'sensory_immersion', 'direct_address', 'native_meme_reference', 'friend_recommendation'],
    script_structure: 'live_coverage_highlights',
    visual_focus: 'crowd_energy_highlights',
    cta_type: 'attend_next_time',
    tone_guidance: 'Capture the energy. Make people feel FOMO. Show the best moments without spoiling the experience.',
  },
  product_review: {
    label: 'Product / Service Review',
    allowed_openings: ['unexpected_confession', 'contrast_open', 'direct_address', 'slice_of_life', 'friend_recommendation'],
    script_structure: 'honest_review_journey',
    visual_focus: 'product_features_in_context',
    cta_type: 'informed_decision',
    tone_guidance: 'Honest. Show actual use, not just aesthetics. The good AND the not-so-good. People trust reviewers who are real.',
  },
  lifestyle: {
    label: 'Lifestyle / Day in Life',
    allowed_openings: ['slice_of_life', 'native_meme_reference', 'unexpected_confession', 'direct_address', 'friend_recommendation'],
    script_structure: 'day_narrative',
    visual_focus: 'authentic_moments',
    cta_type: 'relate_and_follow',
    tone_guidance: 'Unfiltered but intentional. Real moments, not performative authenticity. People follow people, not content.',
  },
};

// ─── Platform-Specific Blogger Rules ─────────────────────────────────────────

const PLATFORM_BLOGGER_RULES = {
  YouTube: {
    duration: '5-12 minutes',
    script_length: '700-1400 words',
    hook_window: '60 seconds',
    chapters: true,
    b_roll_critical: true,
    ending: 'Strong CTA + related video suggestion',
  },
  'Instagram Reels': {
    duration: '30-90 seconds',
    script_length: '100-200 words',
    hook_window: '3 seconds',
    chapters: false,
    b_roll_critical: true,
    ending: 'Save + Share + Comment CTA',
  },
  TikTok: {
    duration: '30-180 seconds',
    script_length: '100-250 words',
    hook_window: '2 seconds',
    chapters: false,
    b_roll_critical: true,
    ending: 'Duet suggestion or strong opinion to spark comments',
  },
  'YouTube Shorts': {
    duration: '30-60 seconds',
    script_length: '80-150 words',
    hook_window: '3 seconds',
    chapters: false,
    b_roll_critical: true,
    ending: 'Subscribe hook + watch full video',
  },
  Blog: {
    duration: '5-10 min read',
    script_length: '800-1500 words',
    hook_window: '2 sentences',
    chapters: true,
    b_roll_critical: false,
    ending: 'Internal links + email signup or social follow',
  },
  Podcast: {
    duration: '10-20 minutes',
    script_length: '1000-2000 words',
    hook_window: '30 seconds',
    chapters: true,
    b_roll_critical: false,
    ending: 'Rating ask + next episode tease',
  },
};

// ─── Media Context Builder ────────────────────────────────────────────────────
// Builds a rich context block from uploaded media analysis

function buildMediaContextBlock(mediaAnalysis) {
  if (!mediaAnalysis) return '';

  const parts = [];

  if (mediaAnalysis.type === 'image') {
    parts.push(`
VISUAL CONTEXT FROM UPLOADED IMAGE(S):
Creator has provided ${mediaAnalysis.count || 1} image(s) of the subject.

What the AI sees in the images:
${mediaAnalysis.description}

Key visual elements detected:
${mediaAnalysis.key_elements ? mediaAnalysis.key_elements.map(e => `- ${e}`).join('\n') : '- Various elements visible'}

Mood/Atmosphere from image:
${mediaAnalysis.mood || 'Not specified'}

Suggested visual hooks from images:
${mediaAnalysis.visual_hooks ? mediaAnalysis.visual_hooks.map(h => `- ${h}`).join('\n') : '- Use the most striking visual moment as the opener'}

CRITICAL: Use these specific visual observations to make the script concrete and authentic.
The creator filmed/photographed THESE specific things — refer to them naturally.
`.trim());
  }

  if (mediaAnalysis.type === 'video') {
    parts.push(`
VISUAL CONTEXT FROM UPLOADED VIDEO CLIP (${mediaAnalysis.duration || '~15 seconds'}):
Creator has provided a short clip of the subject.

What happens in the video:
${mediaAnalysis.description}

Key moments detected:
${mediaAnalysis.key_moments ? mediaAnalysis.key_moments.map(m => `- ${m}`).join('\n') : '- Various moments visible'}

Ambient sounds/atmosphere hinted at:
${mediaAnalysis.atmosphere || 'Not specified'}

The best moment to use as a hook from this footage:
${mediaAnalysis.hook_moment || 'The most visually striking frame'}

CRITICAL: Write the script to complement what is visible in this footage.
The voiceover should add context, not repeat what viewers can already see.
`.trim());
  }

  return parts.join('\n\n');
}

// ─── Opening Style Selector ───────────────────────────────────────────────────
// Intelligently picks the best opening style based on context

function selectOpeningStyles(blogType, niche, openingStylePreference, mediaAnalysis) {
  const config = BLOG_TYPE_CONFIGS[blogType] || BLOG_TYPE_CONFIGS.travel;
  const allowedStyles = config.allowed_openings;

  // If user explicitly chose a style, honor it
  if (openingStylePreference && openingStylePreference !== 'auto') {
    const chosen = OPENING_STYLE_LIBRARY[openingStylePreference];
    if (chosen) {
      return {
        primary: openingStylePreference,
        primaryDetails: chosen,
        alternatives: allowedStyles.filter(s => s !== openingStylePreference).slice(0, 2),
      };
    }
  }

  // Auto-select: if media provided, prefer sensory/slice_of_life
  if (mediaAnalysis) {
    const mediaFriendly = ['slice_of_life', 'sensory_immersion', 'friend_recommendation'];
    const bestMatch = mediaFriendly.find(s => allowedStyles.includes(s));
    if (bestMatch) {
      return {
        primary: bestMatch,
        primaryDetails: OPENING_STYLE_LIBRARY[bestMatch],
        alternatives: allowedStyles.filter(s => s !== bestMatch).slice(0, 2),
      };
    }
  }

  // Default to first allowed style
  const primary = allowedStyles[0];
  return {
    primary,
    primaryDetails: OPENING_STYLE_LIBRARY[primary],
    alternatives: allowedStyles.slice(1, 3),
  };
}

// ─── Main Blogger Prompt Builder ──────────────────────────────────────────────

export function buildBloggerCreatorPrompt({
  niche,
  platform,
  language,
  tone,
  creatorType,
  blogType,
  location,
  mediaAnalysis,
  openingStylePreference,
  customOpeningNote,
  _dnaBlock,
  _chainBlock,
  // Research context
  chosenTopic,
  chosenHook,
  hookTrigger,
  targetAudience,
}) {
  const config = BLOG_TYPE_CONFIGS[blogType] || BLOG_TYPE_CONFIGS.travel;
  const platformRules = PLATFORM_BLOGGER_RULES[platform] || PLATFORM_BLOGGER_RULES.YouTube;
  const openingStyles = selectOpeningStyles(blogType, niche, openingStylePreference, mediaAnalysis);
  const mediaContext = buildMediaContextBlock(mediaAnalysis);

  const isShortForm = ['Instagram Reels', 'TikTok', 'YouTube Shorts'].includes(platform);
  const isBlog = platform === 'Blog';

  const locationContext = location
    ? `LOCATION: ${location}\nIncorporate this location naturally — mention specific landmarks, local characteristics, or cultural context relevant to ${location}.`
    : '';

  const injections = [_dnaBlock, _chainBlock].filter(Boolean).join('\n\n');

  const prompt = `
${injections ? injections + '\n\n' : ''}You are an elite content creator and blogger specialising in authentic, engaging ${config.label} content for ${platform}.

You understand that great bloggers do NOT always start with fear-based hooks, money warnings, or hype.
Great bloggers start with HUMAN MOMENTS — a smell, a sound, a confession, a joke their audience gets.

═══════════════════════════════════════════════════════════
CREATOR BRIEF
═══════════════════════════════════════════════════════════
Niche: ${niche}
Platform: ${platform}
Blog Type: ${config.label}
Location: ${location || 'Not specified'}
Language: ${language || 'English'}
Tone: ${tone || 'Conversational'}
Creator Type: ${creatorType}
Target Duration: ${platformRules.duration}
Script Length Target: ${platformRules.script_length}
Hook Window: First ${platformRules.hook_window}

TOPIC: ${chosenTopic || niche}
ORIGINAL HOOK: ${chosenHook || 'Choose the most natural hook for this blog type'}

${locationContext}

═══════════════════════════════════════════════════════════
OPENING STYLE — CRITICAL
═══════════════════════════════════════════════════════════
PRIMARY STYLE TO USE: ${openingStyles.primaryDetails.label}
${openingStyles.primaryDetails.description}
Example of this style: "${openingStyles.primaryDetails.example}"

${customOpeningNote ? `CREATOR'S SPECIFIC NOTE ON OPENING: "${customOpeningNote}"` : ''}

ABSOLUTELY FORBIDDEN OPENINGS:
- "If you don't do this you'll lose money..."
- "₹1 lakh mistake everyone makes..."
- "Stop everything and watch this..."
- "You won't believe what happened..."
- Generic motivational speech before any content
- Starting with channel intro ("Hey guys, welcome back to my channel")

The script must START immediately with the experience, place, person, or moment.
No warming up. No generic praise. Straight into the story.

${openingStyles.alternatives.length > 0 ? `
ALTERNATIVE OPENING STYLES (if the primary doesn't fit naturally):
${openingStyles.alternatives.map(s => `- ${OPENING_STYLE_LIBRARY[s]?.label}: ${OPENING_STYLE_LIBRARY[s]?.example}`).join('\n')}
` : ''}

═══════════════════════════════════════════════════════════
BLOG TYPE SPECIFIC GUIDANCE
═══════════════════════════════════════════════════════════
${config.tone_guidance}

Script Structure: ${config.script_structure}
Visual Focus: ${config.visual_focus}
CTA Type: ${config.cta_type}

${blogType === 'advertisement' ? `
ADVERTISEMENT BLOG SPECIAL RULES:
- Be transparent if sponsored — audiences respect honesty
- Show the place/product FIRST through your lens — walk in, react genuinely
- Describe what you see, smell, hear, feel — not what the brand told you to say
- Include one genuine "this surprised me" moment
- Show ANY minor inconvenience honestly — it builds trust
- The CTA should be "go experience this yourself" not "buy buy buy"
` : ''}

${blogType === 'travel' ? `
TRAVEL BLOG SPECIAL RULES:
- Include: how to get there, best time to visit, approximate cost
- One "insider tip" the traveller won't find on Google
- End with who this place is perfect for (and who it might disappoint)
- Show the journey, not just the destination
` : ''}

${blogType === 'food' ? `
FOOD BLOG SPECIAL RULES:
- Describe TEXTURE first, then flavour, then presentation
- Compare to something the audience already knows
- Show the ordering/waiting process — authenticity lives in the gaps
- Include price and value assessment naturally
- One dish to definitely order + one to skip (honest takes)
` : ''}

${mediaContext ? `
═══════════════════════════════════════════════════════════
${mediaContext}
═══════════════════════════════════════════════════════════
` : ''}

═══════════════════════════════════════════════════════════
SCRIPT REQUIREMENTS
═══════════════════════════════════════════════════════════
${isShortForm ? `
SHORT-FORM RULES (${platform}):
- EVERY second must earn its place — no filler
- Cut to the best moment immediately
- Text overlays carry information while voiceover adds colour
- End on an image/moment that makes people stop scrolling
` : isBlog ? `
WRITTEN BLOG RULES:
- Short paragraphs (2-3 sentences max)
- Use subheadings to break up sections
- First sentence of each section must be a hook into that section
- Personal voice throughout — not a travel guide
` : `
LONG-FORM VIDEO RULES:
- Chapters help with watch time — include them
- Pattern interrupt every 90-120 seconds
- Personal reactions and opinions carry the video, not just facts
- End with a genuine recommendation
`}

FOR SCENES — Provide:
- Specific filming instructions (angle, movement, what to capture)
- Natural voiceover that complements the visual (doesn't repeat what's visible)
- Text overlays for short-form platforms
- B-roll search terms for footage the creator might not have

═══════════════════════════════════════════════════════════
OUTPUT — Return ONLY this complete JSON:
═══════════════════════════════════════════════════════════

{
  "full_script": "Complete word-for-word script. ${isShortForm ? '100-200' : isBlog ? '800-1500' : '700-1400'} words. Start with the chosen opening style immediately. No channel intro. Every word performable.",
  "opening_style_used": "${openingStyles.primary}",
  "opening_style_label": "${openingStyles.primaryDetails.label}",
  "estimated_duration": "${platformRules.duration}",
  "word_count": 0,
  "creator_mode": "blogger",
  "blog_type": "${blogType}",
  "location": "${location || ''}",
  "scenes": [
    {
      "scene_number": 1,
      "timestamp_start": "0:00",
      "timestamp_end": "0:30",
      "section_type": "HOOK",
      "voiceover": "exact words spoken — starting with the opening style, not a generic intro",
      "visual_direction": "specific filming direction — angle, movement, what subject to frame, lighting notes",
      "overlay_text": "text to show on screen (especially important for short-form) or null",
      "b_roll_search_term": "specific search term to find stock footage if needed",
      "tone_direction": "delivery note — pacing, energy, emotion",
      "retention_technique": "what keeps viewer watching through this scene",
      "filming_tip": "practical advice for filming this specific scene — camera movement, stabiliser, framing"
    }
  ],
  "hook_breakdown": {
    "hook_text": "the actual opening line of the script",
    "opening_style": "${openingStyles.primary}",
    "why_this_works": "specific explanation of why this opening style works for this blog type and audience",
    "psychological_mechanism": "what emotion or curiosity this opening triggers",
    "what_viewer_is_thinking": "exact internal monologue of viewer after this hook",
    "what_happens_if_hook_fails": "what the creator can do if opening doesn\'t land — Plan B"
  },
  "filming_guide": {
    "equipment_needed": ["item 1", "item 2"],
    "golden_hour_note": "best time to film this specific location/subject",
    "must_capture_shots": ["shot description 1", "shot description 2", "shot description 3"],
    "avoid": "common filming mistakes for this type of content",
    "audio_note": "microphone advice, ambient sound strategy"
  },
  "shorts_script": "Complete standalone ${isShortForm ? '60-second' : '45-60 second'} version. Different from full script. More punchy. Best single moment from the full piece.",
  "pattern_interrupts": [
    { "timestamp": "approximate time", "technique": "name", "script_line": "exact line" }
  ],
  "cta_options": [
    { "cta_text": "exact CTA word-for-word — natural for a blogger, not salesy", "placement": "where in the video", "goal": "subscribe | save | comment | share | visit | purchase", "why_it_works": "reason" },
    { "cta_text": "second option", "placement": "...", "goal": "...", "why_it_works": "..." }
  ],
  "caption_hooks": [
    "Instagram caption opening line 1 — different from video hook",
    "Instagram caption opening line 2",
    "TikTok caption (under 100 chars)"
  ],
  "media_based_insights": ${mediaAnalysis ? `"Specific observations from the uploaded media that shaped this script — what visual elements were incorporated and how"` : 'null'},
  "content_notes": "any important note about filming logistics, sensitivity, or permissions needed"
}
`.trim();

  return prompt;
}

// ─── Research Prompt for Blogger ──────────────────────────────────────────────

export function buildBloggerResearchPrompt({
  niche,
  platform,
  blogType,
  location,
  language,
  tone,
  mediaAnalysis,
  _dnaBlock,
  _chainBlock,
}) {
  const config = BLOG_TYPE_CONFIGS[blogType] || BLOG_TYPE_CONFIGS.travel;
  const mediaContext = buildMediaContextBlock(mediaAnalysis);
  const injections = [_dnaBlock, _chainBlock].filter(Boolean).join('\n\n');

  return `
${injections ? injections + '\n\n' : ''}You are a content research specialist for authentic bloggers. Your job is to find the BEST angle for this blog content — not the most hyped, but the most genuinely interesting.

BRIEF:
- Niche: ${niche}
- Platform: ${platform}
- Blog Type: ${config.label}
- Location: ${location || 'Not specified'}
- Language: ${language || 'English'}

${mediaContext ? `VISUAL CONTEXT:\n${mediaContext}\n` : ''}

Your task:
1. Find 3 authentic angles for this content — what makes this genuinely interesting to the audience
2. For each: what emotion it triggers, why it matters NOW, what the creator's unique lens is
3. Write 3 hook options using DIFFERENT opening styles (NOT fear/hype — choose from: slice_of_life, sensory_immersion, local_legend, friend_recommendation, unexpected_confession, native_meme_reference, contrast_open, mystery_tease, direct_address, advertisement_authentic)
4. Identify the target audience with precision
5. Suggest what to film/photograph

Return ONLY this JSON:

{
  "trending_angles": [
    {
      "topic": "specific angle — written as a video/post concept",
      "why_now": "why this resonates right now",
      "audience_emotion": "primary emotion triggered",
      "search_intent": "what people are searching for",
      "urgency_level": "HIGH | MEDIUM | EVERGREEN",
      "unique_creator_angle": "what perspective only THIS creator can bring"
    },
    { "topic": "...", "why_now": "...", "audience_emotion": "...", "search_intent": "...", "urgency_level": "...", "unique_creator_angle": "..." },
    { "topic": "...", "why_now": "...", "audience_emotion": "...", "search_intent": "...", "urgency_level": "...", "unique_creator_angle": "..." }
  ],
  "chosen_topic": "the single best topic — specific, authentic, platform-ready",
  "chosen_topic_reasoning": "why this angle beats the others for genuine engagement",
  "target_audience_description": "specific person — age range, what they do, why they'd watch this",
  "competitor_gap": "what similar content misses that this can do better",
  "hook_options": [
    {
      "hook_text": "complete opening — word for word, performable",
      "opening_style": "slice_of_life | sensory_immersion | local_legend | etc",
      "psychological_trigger": "emotion or curiosity triggered",
      "trigger_explanation": "why this specific opening works for this content",
      "ctr_strength": "HIGH | MEDIUM | LOW",
      "platform_fit": "${platform}",
      "risk_factor": null
    },
    { "hook_text": "...", "opening_style": "...", "psychological_trigger": "...", "trigger_explanation": "...", "ctr_strength": "...", "platform_fit": "...", "risk_factor": null },
    { "hook_text": "...", "opening_style": "...", "psychological_trigger": "...", "trigger_explanation": "...", "ctr_strength": "...", "platform_fit": "...", "risk_factor": null }
  ],
  "chosen_hook": "exact copy of the best hook_text",
  "chosen_hook_trigger": "opening style of chosen hook",
  "chosen_hook_deep_analysis": "why this opening style fits this exact content — 3 sentences",
  "filming_suggestions": {
    "must_capture": ["specific shot 1", "specific shot 2", "specific shot 3"],
    "golden_moment": "the single best moment to capture for the thumbnail",
    "audio_priority": "what ambient sounds to capture",
    "avoid_filming": "what NOT to film or show"
  },
  "thumbnail_concept": "specific thumbnail brief — not generic, based on the actual location/product/place",
  "best_upload_time": { "day": "day", "time": "HH:MM", "reasoning": "why" }
}
`.trim();
}

// ─── Export opening style options for UI ─────────────────────────────────────

export const OPENING_STYLE_OPTIONS = [
  { value: 'auto', label: '✨ Auto-select (AI chooses best fit)', group: 'smart' },
  { value: 'slice_of_life', label: '🎬 Slice of Life — Start mid-experience', group: 'natural' },
  { value: 'sensory_immersion', label: '👃 Sensory Immersion — Smell, sound, texture', group: 'natural' },
  { value: 'native_meme_reference', label: '😄 Native Meme / Cultural Joke', group: 'fun' },
  { value: 'friend_recommendation', label: '💬 Friend Recommendation Energy', group: 'natural' },
  { value: 'unexpected_confession', label: '🙊 Unexpected Confession', group: 'dramatic' },
  { value: 'mystery_tease', label: '🔍 Mystery Tease — Something unexplained', group: 'dramatic' },
  { value: 'local_legend', label: '📖 Local Legend / History', group: 'educational' },
  { value: 'contrast_open', label: '⚡ Before/After Contrast', group: 'dramatic' },
  { value: 'direct_address', label: '🎯 Direct Address — Talk to a specific person', group: 'targeted' },
  { value: 'advertisement_authentic', label: '📣 Authentic Ad Open (for sponsored content)', group: 'commercial' },
];

export const BLOG_TYPE_OPTIONS = [
  { value: 'travel', label: '✈️ Travel Blog', desc: 'Explore a destination, route, or experience', icon: '✈️' },
  { value: 'advertisement', label: '📢 Advertisement / Sponsored', desc: 'Promote a hotel, resort, restaurant, or brand', icon: '📢' },
  { value: 'food', label: '🍜 Food & Restaurant', desc: 'Review a dish, restaurant, or food spot', icon: '🍜' },
  { value: 'culture', label: '🏛️ Culture & Heritage', desc: 'Explore heritage, festivals, or traditions', icon: '🏛️' },
  { value: 'event', label: '🎪 Event Coverage', desc: 'Cover a festival, concert, or live event', icon: '🎪' },
  { value: 'product_review', label: '⭐ Product / Service Review', desc: 'On-location product or service review', icon: '⭐' },
  { value: 'lifestyle', label: '🌅 Lifestyle / Day-in-Life', desc: 'A personal vlog of your daily experience', icon: '🌅' },
];

export { BLOG_TYPE_CONFIGS, PLATFORM_BLOGGER_RULES, OPENING_STYLE_LIBRARY };
