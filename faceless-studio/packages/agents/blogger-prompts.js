// packages/agents/blogger-prompts.js
// Intelligent blogger prompt system — fixes validation failures:
// 1. hook_breakdown now matches standard validator schema (psychological_mechanism, why_first_3_seconds, what_viewer_is_thinking)
// 2. No unfilled placeholder brackets in any field
// 3. Minimum 4 scenes always generated
// 4. All required string fields explicitly specified with minimum lengths

const OPENING_STYLE_LIBRARY = {
  slice_of_life: {
    label: 'Slice of Life',
    description: 'Start in the middle of an experience — no setup, just presence',
    example: 'The smell hit me before I even opened the door.',
  },
  native_meme_reference: {
    label: 'Native Meme or Cultural Reference',
    description: 'Start with a relatable local meme, joke, or cultural saying before pivoting',
    example: 'Namma Chennai la "oru lift podungappa" nu solluvaanga — ithu avar kitta naambinen.',
  },
  unexpected_confession: {
    label: 'Unexpected Confession',
    description: 'Creator admits something surprising or counter-intuitive about themselves',
    example: 'I have been living in Chennai for 8 years and I had never heard of this place until last week.',
  },
  sensory_immersion: {
    label: 'Sensory Immersion',
    description: 'Paint a vivid sensory picture — smell, sound, texture, temperature',
    example: '6 AM. Sea breeze. Fresh idli steam rising. A queue of 40 people who all somehow look completely at peace.',
  },
  direct_address: {
    label: 'Direct Address',
    description: 'Speak directly to a specific type of person in the audience',
    example: 'If you plan every trip on a spreadsheet, this video is your sign to delete the spreadsheet.',
  },
  mystery_tease: {
    label: 'Mystery Tease',
    description: 'Open with something unexplained that demands resolution',
    example: 'There is a door in this lane. No sign. No menu outside. A 2-hour wait every single day.',
  },
  local_legend: {
    label: 'Local Legend or Story',
    description: 'Open with a piece of local history, legend, or folklore connected to the place',
    example: 'This chai shop has been running since 1962. The recipe has never changed.',
  },
  contrast_open: {
    label: 'Before After Contrast',
    description: 'Juxtapose what people expect vs what they find',
    example: 'Everyone told me Madurai is just temples. Nobody told me about the rooftop at midnight.',
  },
  friend_recommendation: {
    label: 'Friend Recommendation Energy',
    description: 'Talk like you are excitedly telling your best friend about a discovery',
    example: 'Okay wait, I have to tell you about this place. Drop what you are doing. Full screen this.',
  },
  advertisement_authentic: {
    label: 'Authentic Advertisement Open',
    description: 'For paid content — be transparent but lead with genuine value first',
    example: 'They asked me to come check out their new branch. Honestly I was not expecting much. I was wrong.',
  },
};

const BLOG_TYPE_CONFIGS = {
  travel: {
    label: 'Travel Blog',
    allowed_openings: ['slice_of_life', 'sensory_immersion', 'contrast_open', 'local_legend', 'friend_recommendation', 'mystery_tease', 'native_meme_reference'],
    tone_guidance: 'Discovery, wonder, practical tips woven in naturally. A friend sharing a real experience, not a travel guide recitation.',
    extra_rules: 'Include: how to get there, best time to visit, approximate cost, one insider tip. End with who this place is perfect for.',
  },
  advertisement: {
    label: 'Advertisement or Sponsored Content',
    allowed_openings: ['advertisement_authentic', 'slice_of_life', 'sensory_immersion', 'friend_recommendation', 'unexpected_confession'],
    tone_guidance: 'Transparent about sponsorship but genuinely enthusiastic. Show first, sell second.',
    extra_rules: 'Describe what you see, smell, hear, feel. Include one genuine "this surprised me" moment. The CTA is "go experience this" not "buy buy buy".',
  },
  food: {
    label: 'Food and Restaurant Blog',
    allowed_openings: ['sensory_immersion', 'slice_of_life', 'mystery_tease', 'native_meme_reference', 'friend_recommendation', 'local_legend'],
    tone_guidance: 'Make people taste through the screen. Describe texture first, then flavour, then presentation. Opinion-driven.',
    extra_rules: 'Compare flavours to something the audience already knows. Include price and value assessment. One dish to order, one to skip.',
  },
  culture: {
    label: 'Culture and Heritage Blog',
    allowed_openings: ['local_legend', 'sensory_immersion', 'contrast_open', 'mystery_tease', 'direct_address'],
    tone_guidance: 'Respectful, curious, deep. Connect past to present. Find the human story, not Wikipedia.',
    extra_rules: 'Give historical context naturally, not as a lecture. Connect every fact to something the viewer can feel or relate to.',
  },
  event: {
    label: 'Event Coverage Blog',
    allowed_openings: ['slice_of_life', 'sensory_immersion', 'direct_address', 'native_meme_reference', 'friend_recommendation'],
    tone_guidance: 'Capture the energy. Make people feel FOMO. Show best moments without spoiling.',
    extra_rules: 'Include crowd energy, the best performer or moment, practical info for attending next time.',
  },
  product_review: {
    label: 'Product or Service Review Blog',
    allowed_openings: ['unexpected_confession', 'contrast_open', 'direct_address', 'slice_of_life', 'friend_recommendation'],
    tone_guidance: 'Honest. Show actual use, not just aesthetics. Include the good AND the not-so-good.',
    extra_rules: 'Show the product in real use context. Give a clear verdict at the end. No vague conclusions.',
  },
  lifestyle: {
    label: 'Lifestyle or Day-in-Life Blog',
    allowed_openings: ['slice_of_life', 'native_meme_reference', 'unexpected_confession', 'direct_address', 'friend_recommendation'],
    tone_guidance: 'Unfiltered but intentional. Real moments, not performative authenticity.',
    extra_rules: 'Weave a narrative arc through the day. End with a genuine reflection or insight.',
  },
};

const PLATFORM_RULES = {
  YouTube:           { script_words: '700-1200', scene_count: '6-10', duration: '5-12 minutes', short_words: '150-200' },
  'Instagram Reels': { script_words: '120-180',  scene_count: '4-6',  duration: '30-90 seconds', short_words: '80-120' },
  TikTok:            { script_words: '120-200',  scene_count: '4-6',  duration: '30-180 seconds', short_words: '80-120' },
  'YouTube Shorts':  { script_words: '80-150',   scene_count: '4-5',  duration: '30-60 seconds', short_words: '60-100' },
  Blog:              { script_words: '800-1500', scene_count: '5-8',  duration: '5-10 min read', short_words: '150-200' },
  Podcast:           { script_words: '1000-1800',scene_count: '5-8',  duration: '10-20 minutes', short_words: '150-200' },
};

function buildMediaContextBlock(mediaAnalysis) {
  if (!mediaAnalysis) return '';
  if (mediaAnalysis.type === 'image') {
    return `
VISUAL CONTEXT FROM UPLOADED IMAGES (${mediaAnalysis.count || 1} photo(s)):
Description: ${mediaAnalysis.description || 'Images provided by creator'}
Key elements visible: ${Array.isArray(mediaAnalysis.key_elements) ? mediaAnalysis.key_elements.join(', ') : 'Various elements'}
Mood and atmosphere: ${mediaAnalysis.mood || 'Not specified'}
Best visual hook from images: ${Array.isArray(mediaAnalysis.visual_hooks) ? mediaAnalysis.visual_hooks[0] : 'Use the most striking visual element'}
Inferred sounds: ${mediaAnalysis.sensory_details?.what_sounds_are_likely || 'Ambient sounds of the environment'}
Thumbnail moment: ${mediaAnalysis.thumbnail_moment || 'The most striking frame'}
INSTRUCTION: Write the script so it references these specific visuals naturally. The voiceover should complement what viewers see, not describe it.
`.trim();
  }
  if (mediaAnalysis.type === 'video') {
    return `
VISUAL CONTEXT FROM UPLOADED VIDEO CLIP:
Description: ${mediaAnalysis.description || 'Video clip provided by creator'}
Key moments: ${Array.isArray(mediaAnalysis.key_moments) ? mediaAnalysis.key_moments.join('; ') : 'Various moments'}
Atmosphere: ${mediaAnalysis.atmosphere || 'Not specified'}
Best hook moment from footage: ${mediaAnalysis.hook_moment || 'The most visually striking moment'}
Energy level: ${mediaAnalysis.sensory_atmosphere?.energy_level || 'MEDIUM'}
INSTRUCTION: Write the script to complement this footage. The voiceover adds context the video cannot show by itself.
`.trim();
  }
  return '';
}

function selectPrimaryOpeningStyle(blogType, openingStylePreference, mediaAnalysis) {
  const config = BLOG_TYPE_CONFIGS[blogType] || BLOG_TYPE_CONFIGS.travel;
  const allowed = config.allowed_openings;

  if (openingStylePreference && openingStylePreference !== 'auto') {
    const style = OPENING_STYLE_LIBRARY[openingStylePreference];
    if (style && allowed.includes(openingStylePreference)) {
      return { key: openingStylePreference, ...style };
    }
  }

  // Auto: prefer sensory if media uploaded, friend_recommendation for ads, else first allowed
  if (mediaAnalysis) {
    const pick = ['slice_of_life', 'sensory_immersion', 'friend_recommendation'].find(s => allowed.includes(s));
    if (pick) return { key: pick, ...OPENING_STYLE_LIBRARY[pick] };
  }
  if (blogType === 'advertisement') return { key: 'advertisement_authentic', ...OPENING_STYLE_LIBRARY.advertisement_authentic };
  return { key: allowed[0], ...OPENING_STYLE_LIBRARY[allowed[0]] };
}

// ─── Main Blogger Creator Prompt ──────────────────────────────────────────────
export function buildBloggerCreatorPrompt({
  niche, platform, language, tone, creatorType,
  blogType, location, mediaAnalysis,
  openingStyle: openingStylePref, customOpeningNote,
  _dnaBlock, _chainBlock,
  chosenTopic, chosenHook, hookTrigger, targetAudience,
}) {
  const config    = BLOG_TYPE_CONFIGS[blogType] || BLOG_TYPE_CONFIGS.travel;
  const platRules = PLATFORM_RULES[platform]    || PLATFORM_RULES.YouTube;
  const openStyle = selectPrimaryOpeningStyle(blogType, openingStylePref, mediaAnalysis);
  const mediaCtx  = buildMediaContextBlock(mediaAnalysis);
  const injections = [_dnaBlock, _chainBlock].filter(Boolean).join('\n\n');

  const isShortForm = ['Instagram Reels', 'TikTok', 'YouTube Shorts'].includes(platform);
  const scriptWords = platRules.script_words;
  const sceneCount  = platRules.scene_count;

  // Build the hook breakdown instruction with EXACT field names the validator expects
  // Validator checks: psychological_mechanism (min 70), why_first_3_seconds (required), what_viewer_is_thinking (min 40)
  const hookBreakdownInstruction = `
  "hook_breakdown": {
    "hook_text": "the exact first line the creator speaks — word for word",
    "trigger_type": "${hookTrigger || openStyle.key.toUpperCase()}",
    "psychological_mechanism": "explain in at least 80 characters what emotion or curiosity the opening triggers neurologically — be specific about the mechanism not just the label",
    "why_first_3_seconds": "explain in at least 60 characters exactly why this opening works in the first 3 seconds on ${platform} — reference the platform context",
    "what_viewer_is_thinking": "write the exact internal monologue of the viewer in at least 50 characters — what thought runs through their head",
    "what_happens_if_hook_fails": "what the creator can do differently if this opening does not land — specific Plan B action",
    "opening_style": "${openStyle.key}",
    "why_this_works": "specific explanation of why this opening style works for ${config.label} content and this particular audience"
  }`;

  return `${injections ? injections + '\n\n' : ''}You are an elite ${config.label} content creator writing a complete, performable script for ${platform}.

CREATOR BRIEF:
- Niche: ${niche}
- Blog Type: ${config.label}
- Platform: ${platform}
- Location: ${location || 'Not specified'}
- Language: ${language || 'English'}
- Tone: ${tone || 'Conversational'}
- Topic: ${chosenTopic || niche}
- Target Audience: ${targetAudience || 'General audience interested in this niche'}

${location ? `LOCATION CONTEXT: ${location} — incorporate specific local details, landmarks, or cultural context naturally.` : ''}

${mediaCtx ? `\n${mediaCtx}\n` : ''}

OPENING STYLE TO USE: ${openStyle.label}
${openStyle.description}
Example of this style: ${openStyle.example}
${customOpeningNote ? `CREATOR NOTE ON OPENING: ${customOpeningNote}` : ''}

FORBIDDEN OPENINGS — never use these:
- "If you don't do this you'll lose money"
- Any rupee or dollar amount as a scare tactic
- "Stop everything and watch this"
- "You won't believe what happened"
- "Hey guys welcome back to my channel"
- Generic motivational speech with no content
The script MUST start immediately with the ${openStyle.label} style above.

BLOG TYPE RULES:
${config.tone_guidance}
${config.extra_rules}

SCRIPT LENGTH: ${scriptWords} words
SCENE COUNT: exactly ${sceneCount.split('-')[0]} to ${sceneCount.split('-')[1]} scenes — you MUST write at least ${sceneCount.split('-')[0]} scenes
DURATION: ${platRules.duration}

${isShortForm ? 'SHORT-FORM: Every second must earn its place. No filler. Cut to the best moment immediately.' : ''}

CRITICAL JSON RULES:
1. Every string field must be fully written — no "[insert X]", no "[your name]", no placeholder text of any kind
2. The scenes array MUST have at least ${sceneCount.split('-')[0]} complete scene objects
3. Every scene must have voiceover, visual_direction, and tone_direction filled with real content
4. The hook_breakdown psychological_mechanism must be at least 80 characters
5. The hook_breakdown why_first_3_seconds must be at least 60 characters
6. Return ONLY valid JSON — no markdown fences, no comments, start with { end with }

Return ONLY this JSON:

{
  "full_script": "Complete word-for-word script ${scriptWords} words. Starts immediately with ${openStyle.label} style — ${openStyle.example} — then flows naturally into the full content. Every word is performable. No placeholder text anywhere.",
  "opening_style_used": "${openStyle.key}",
  "opening_style_label": "${openStyle.label}",
  "estimated_duration": "${platRules.duration}",
  "word_count": 0,
  "creator_mode": "blogger",
  "blog_type": "${blogType || 'travel'}",
  "location": "${location || ''}",
  "scenes": [
    {
      "scene_number": 1,
      "timestamp_start": "0:00",
      "timestamp_end": "0:30",
      "section_type": "HOOK",
      "voiceover": "exact words spoken in this scene — minimum 30 words of real dialogue, not a description",
      "visual_direction": "specific filming instructions: what to frame, angle, movement, lighting — minimum 20 words",
      "overlay_text": ${isShortForm ? '"3-5 word text overlay for screen"' : 'null'},
      "b_roll_search_term": "specific search term for stock footage if needed",
      "tone_direction": "delivery note — pacing, energy, emotion — minimum 15 words",
      "retention_technique": "what keeps viewer watching through this scene",
      "filming_tip": "practical filming advice for this specific scene"
    },
    {
      "scene_number": 2,
      "timestamp_start": "0:30",
      "timestamp_end": "1:30",
      "section_type": "MAIN_CONTENT",
      "voiceover": "exact words for scene 2 — minimum 40 words of real dialogue",
      "visual_direction": "filming instructions for scene 2 — what to capture",
      "overlay_text": null,
      "b_roll_search_term": "search term for scene 2",
      "tone_direction": "delivery guidance for scene 2",
      "retention_technique": "retention technique for scene 2",
      "filming_tip": "filming tip for scene 2"
    },
    {
      "scene_number": 3,
      "timestamp_start": "1:30",
      "timestamp_end": "3:00",
      "section_type": "MAIN_CONTENT",
      "voiceover": "exact words for scene 3 — minimum 40 words of real dialogue",
      "visual_direction": "filming instructions for scene 3",
      "overlay_text": null,
      "b_roll_search_term": "search term for scene 3",
      "tone_direction": "delivery guidance for scene 3",
      "retention_technique": "retention technique for scene 3",
      "filming_tip": "filming tip for scene 3"
    },
    {
      "scene_number": 4,
      "timestamp_start": "3:00",
      "timestamp_end": "4:30",
      "section_type": "CTA",
      "voiceover": "exact CTA words for scene 4 — natural, not salesy, minimum 30 words",
      "visual_direction": "what to film for the CTA scene",
      "overlay_text": null,
      "b_roll_search_term": "search term for CTA scene",
      "tone_direction": "warm, genuine delivery for the CTA",
      "retention_technique": "teaser or open loop to keep viewer engaged",
      "filming_tip": "how to film the ending naturally"
    }
  ],
  ${hookBreakdownInstruction},
  "filming_guide": {
    "equipment_needed": ["smartphone or camera with stabiliser", "lapel microphone or directional mic"],
    "golden_hour_note": "best time of day to film this specific content for optimal lighting",
    "must_capture_shots": ["establishing wide shot of the location", "close-up detail shot of the key subject", "reaction or walking shot"],
    "avoid": "specific filming mistakes to avoid for this content type",
    "audio_note": "capture ambient sound for 30 seconds before speaking to use as background audio"
  },
  "shorts_script": "Complete standalone 60-second version — ${platRules.short_words} words. Punchy, immediate, starts with best moment. Every word written out.",
  "pattern_interrupts": [
    { "timestamp": "1:00", "technique": "Visual cut or question", "script_line": "exact line from the script that creates pattern interrupt" }
  ],
  "cta_options": [
    { "cta_text": "natural CTA word for word — sounds like a person not an ad", "placement": "end of video", "goal": "save", "why_it_works": "why this CTA fits this content type" },
    { "cta_text": "second CTA option word for word", "placement": "middle of video", "goal": "comment", "why_it_works": "why this engagement CTA works here" }
  ],
  "caption_hooks": [
    "Instagram caption opening line — different from video hook, punchy",
    "Second Instagram caption option",
    "TikTok caption under 100 characters"
  ],
  "media_based_insights": ${mediaAnalysis ? '"Specific ways the uploaded media shaped this script — which visual elements were referenced and where"' : 'null'},
  "content_notes": "any logistics or permissions note relevant to filming this content"
}`;
}

// ─── Blogger Research Prompt ───────────────────────────────────────────────────
export function buildBloggerResearchPrompt({
  niche, platform, blogType, location, language, tone, mediaAnalysis, _dnaBlock, _chainBlock,
}) {
  const config  = BLOG_TYPE_CONFIGS[blogType] || BLOG_TYPE_CONFIGS.travel;
  const mediaCtx = buildMediaContextBlock(mediaAnalysis);
  const injections = [_dnaBlock, _chainBlock].filter(Boolean).join('\n\n');

  return `${injections ? injections + '\n\n' : ''}You are a content research specialist for authentic bloggers. Find the BEST angle for this content — most genuinely interesting, not most hyped.

BRIEF:
- Niche: ${niche}
- Platform: ${platform}
- Blog Type: ${config.label}
- Location: ${location || 'Not specified'}
- Language: ${language || 'English'}

${mediaCtx ? `VISUAL CONTEXT:\n${mediaCtx}\n` : ''}

Return ONLY this JSON:

{
  "trending_angles": [
    { "topic": "specific angle as video concept", "why_now": "why this resonates now", "audience_emotion": "primary emotion", "search_intent": "what people search for", "urgency_level": "HIGH|MEDIUM|EVERGREEN", "unique_creator_angle": "perspective only this creator can bring" },
    { "topic": "second angle", "why_now": "...", "audience_emotion": "...", "search_intent": "...", "urgency_level": "...", "unique_creator_angle": "..." },
    { "topic": "third angle", "why_now": "...", "audience_emotion": "...", "search_intent": "...", "urgency_level": "...", "unique_creator_angle": "..." }
  ],
  "chosen_topic": "single best topic — specific, authentic, platform-ready",
  "chosen_topic_reasoning": "why this angle beats others for genuine engagement — 2 sentences",
  "target_audience_description": "specific person — age, what they do, why they watch this content",
  "competitor_gap": "what similar content misses that this can do better",
  "hook_options": [
    { "hook_text": "complete opening word for word — no placeholders", "psychological_trigger": "CURIOSITY_GAP", "trigger_explanation": "why this works for this audience", "ctr_strength": "HIGH", "risk_factor": null, "best_for_platform": "${platform}" },
    { "hook_text": "second hook option", "psychological_trigger": "LOSS_AVERSION", "trigger_explanation": "...", "ctr_strength": "MEDIUM", "risk_factor": null, "best_for_platform": "${platform}" },
    { "hook_text": "third hook option", "psychological_trigger": "PATTERN_INTERRUPT", "trigger_explanation": "...", "ctr_strength": "HIGH", "risk_factor": null, "best_for_platform": "${platform}" }
  ],
  "chosen_hook": "exact copy of the best hook_text from above",
  "chosen_hook_trigger": "psychological trigger name",
  "chosen_hook_deep_analysis": "3 sentences on why this hook works for this exact content and audience",
  "best_upload_time": { "day": "day of week", "time": "HH:MM", "reasoning": "reason based on audience behaviour" },
  "thumbnail_concept": "specific thumbnail brief based on the actual location or subject — not generic"
}`;
}

export const OPENING_STYLE_OPTIONS = [
  { value: 'auto',                    label: '✨ Auto-select',              desc: 'AI picks best fit for your content' },
  { value: 'slice_of_life',           label: '🎬 Slice of Life',           desc: 'Start mid-experience, no intro' },
  { value: 'sensory_immersion',       label: '👃 Sensory Immersion',       desc: 'Lead with smell, sound, texture' },
  { value: 'native_meme_reference',   label: '😄 Native Meme / Joke',      desc: 'Open with a relatable cultural reference' },
  { value: 'friend_recommendation',   label: '💬 Friend Rec Energy',       desc: 'Like excitedly telling your best friend' },
  { value: 'unexpected_confession',   label: '🙊 Unexpected Confession',   desc: 'Admit something surprising first' },
  { value: 'mystery_tease',           label: '🔍 Mystery Tease',           desc: 'Something unexplained that demands an answer' },
  { value: 'local_legend',            label: '📖 Local Legend',            desc: 'History or folklore of the place' },
  { value: 'contrast_open',           label: '⚡ Before/After Contrast',   desc: 'What people expect vs what they find' },
  { value: 'direct_address',          label: '🎯 Direct Address',          desc: 'Speak to a specific type of person' },
  { value: 'advertisement_authentic', label: '📣 Authentic Ad Open',       desc: 'Transparent sponsored content opener' },
];

export const BLOG_TYPE_OPTIONS = [
  { value: 'travel',         label: '✈️ Travel Blog',          desc: 'Destinations, routes, experiences' },
  { value: 'advertisement',  label: '📢 Advertisement',         desc: 'Sponsored content, brand promotions' },
  { value: 'food',           label: '🍜 Food & Restaurant',     desc: 'Restaurants, dishes, food spots' },
  { value: 'culture',        label: '🏛️ Culture & Heritage',    desc: 'Heritage, festivals, traditions' },
  { value: 'event',          label: '🎪 Event Coverage',        desc: 'Concerts, festivals, live events' },
  { value: 'product_review', label: '⭐ Product Review',        desc: 'On-location reviews, services' },
  { value: 'lifestyle',      label: '🌅 Lifestyle',             desc: 'Day-in-life, personal vlogs' },
];

export { BLOG_TYPE_CONFIGS, PLATFORM_RULES, OPENING_STYLE_LIBRARY };