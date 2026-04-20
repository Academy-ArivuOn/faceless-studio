// packages/agents/blogger-prompts.js
// FIX: Language enforcement added to ALL content fields.
// When Tamil is selected, scripts, hooks, CTAs, captions ALL come out in Tamil script.

const OPENING_STYLE_LIBRARY = {
  slice_of_life:           { label: 'Slice of Life',           description: 'Start in the middle of an experience — no setup, just presence',                       example: 'The smell hit me before I even opened the door.' },
  native_meme_reference:   { label: 'Native Meme or Cultural Reference', description: 'Start with a relatable local meme, joke, or cultural saying',                  example: 'Namma Chennai la "oru lift podungappa" nu solluvaanga — ithu avar kitta naambinen.' },
  unexpected_confession:   { label: 'Unexpected Confession',   description: 'Creator admits something surprising or counter-intuitive',                               example: 'I have been living in Chennai for 8 years and never heard of this place.' },
  sensory_immersion:       { label: 'Sensory Immersion',       description: 'Paint a vivid sensory picture — smell, sound, texture, temperature',                     example: '6 AM. Sea breeze. Fresh idli steam rising. A queue of 40 people at peace.' },
  direct_address:          { label: 'Direct Address',          description: 'Speak directly to a specific type of person',                                            example: 'If you plan every trip on a spreadsheet, this is your sign to delete it.' },
  mystery_tease:           { label: 'Mystery Tease',           description: 'Open with something unexplained that demands resolution',                                 example: 'There is a door in this lane. No sign. No menu. A 2-hour wait every day.' },
  local_legend:            { label: 'Local Legend or Story',   description: 'Open with local history, legend, or folklore',                                           example: 'This chai shop has been running since 1962. The recipe has never changed.' },
  contrast_open:           { label: 'Before After Contrast',   description: 'Juxtapose what people expect vs what they find',                                         example: 'Everyone told me Madurai is just temples. Nobody told me about the rooftop.' },
  friend_recommendation:   { label: 'Friend Recommendation Energy', description: 'Talk like excitedly telling your best friend',                                      example: 'Okay wait, I have to tell you about this place. Drop what you are doing.' },
  advertisement_authentic: { label: 'Authentic Advertisement Open', description: 'For paid content — be transparent but lead with genuine value first',               example: 'They asked me to check out their new branch. Honestly I was not expecting much. I was wrong.' },
};

const BLOG_TYPE_CONFIGS = {
  travel:         { label: 'Travel Blog',                   allowed_openings: ['slice_of_life','sensory_immersion','contrast_open','local_legend','friend_recommendation','mystery_tease','native_meme_reference'], tone_guidance: 'Discovery, wonder, practical tips woven in naturally.',                       extra_rules: 'Include: how to get there, best time, approximate cost, one insider tip.' },
  advertisement:  { label: 'Advertisement or Sponsored',    allowed_openings: ['advertisement_authentic','slice_of_life','sensory_immersion','friend_recommendation','unexpected_confession'],                       tone_guidance: 'Transparent about sponsorship. Show first, sell second.',                       extra_rules: 'Describe what you see, smell, hear. One genuine "this surprised me" moment.' },
  food:           { label: 'Food and Restaurant Blog',       allowed_openings: ['sensory_immersion','slice_of_life','mystery_tease','native_meme_reference','friend_recommendation','local_legend'],                 tone_guidance: 'Make people taste through the screen. Texture first, then flavour.',             extra_rules: 'Include price and value. One dish to order, one to skip.' },
  culture:        { label: 'Culture and Heritage Blog',      allowed_openings: ['local_legend','sensory_immersion','contrast_open','mystery_tease','direct_address'],                                                 tone_guidance: 'Respectful, curious, deep. Find the human story, not Wikipedia.',                extra_rules: 'Connect every historical fact to something the viewer can feel.' },
  event:          { label: 'Event Coverage Blog',            allowed_openings: ['slice_of_life','sensory_immersion','direct_address','native_meme_reference','friend_recommendation'],                               tone_guidance: 'Capture the energy. Make people feel FOMO.',                                    extra_rules: 'Best moments, crowd energy, practical info for attending next time.' },
  product_review: { label: 'Product or Service Review Blog', allowed_openings: ['unexpected_confession','contrast_open','direct_address','slice_of_life','friend_recommendation'],                                    tone_guidance: 'Honest. Show actual use. The good AND the not-so-good.',                         extra_rules: 'Show product in real context. Clear verdict at the end.' },
  lifestyle:      { label: 'Lifestyle or Day-in-Life Blog',  allowed_openings: ['slice_of_life','native_meme_reference','unexpected_confession','direct_address','friend_recommendation'],                           tone_guidance: 'Unfiltered but intentional. Real moments.',                                     extra_rules: 'Weave a narrative arc. End with genuine reflection.' },
};

const PLATFORM_RULES = {
  YouTube:           { script_words: '700-1200',  scene_count: '6-10', duration: '5-12 minutes',  short_words: '150-200' },
  'Instagram Reels': { script_words: '120-180',   scene_count: '4-6',  duration: '30-90 seconds', short_words: '80-120'  },
  TikTok:            { script_words: '120-200',   scene_count: '4-6',  duration: '30-180 seconds',short_words: '80-120'  },
  'YouTube Shorts':  { script_words: '80-150',    scene_count: '4-5',  duration: '30-60 seconds', short_words: '60-100'  },
  Blog:              { script_words: '800-1500',  scene_count: '5-8',  duration: '5-10 min read', short_words: '150-200' },
  Podcast:           { script_words: '1000-1800', scene_count: '5-8',  duration: '10-20 minutes', short_words: '150-200' },
};

// ─── Language Enforcement Block ───────────────────────────────────────────────
function getBloggerLanguageEnforcement(language) {
  if (!language || language === 'English') return '';

  const scriptGuide = {
    Hindi:     { script: 'Devanagari (हिंदी)', example: '"यार, ये जगह देखो — seriously इतना amazing है कि believe नहीं होगा!"', wrongExample: '"Yaar, yeh jagah dekho"', rightNote: 'Write Hindi words in Devanagari, keep English brand/tech terms in English' },
    Tamil:     { script: 'Tamil script (தமிழ்)', example: '"மச்சான், ஒரு நிமிஷம் — இந்த place-ஐ பாரு, இது Chennai-ல இருக்கு தெரியுமா?"', wrongExample: '"Machaan, oru nimisham"', rightNote: 'Write Tamil words in Tamil script, keep English brand/tech terms in English letters' },
    Telugu:    { script: 'Telugu script (తెలుగు)', example: '"బ్రో, ఇది చూడు — ఇంత అమేజింగ్ place ఇక్కడ ఉందని తెలుసా?"', wrongExample: '"Bro, idi chudu"', rightNote: 'Write Telugu words in Telugu script' },
    Kannada:   { script: 'Kannada script (ಕನ್ನಡ)', example: '"ಮಚ್ಚ, ಇದನ್ನು ನೋಡು — ಇಷ್ಟು ಅದ್ಭುತ place ಇಲ್ಲಿ ಇದೆ ಅಂತ ಗೊತ್ತಿತ್ತಾ?"', wrongExample: '"Maccha, idannu nodu"', rightNote: 'Write Kannada words in Kannada script' },
    Marathi:   { script: 'Devanagari (मराठी)', example: '"भाऊ, हे बघ — इतकी भारी जागा इथे आहे हे माहीत होतं का तुला?"', wrongExample: '"Bhau, he bagh"', rightNote: 'Write Marathi in Devanagari' },
    Bengali:   { script: 'Bengali script (বাংলা)', example: '"ভাই, এটা দেখো — এত সুন্দর জায়গা এখানে আছে জানতে?"', wrongExample: '"Bhai, eta dekho"', rightNote: 'Write Bengali in Bengali script' },
    Gujarati:  { script: 'Gujarati script (ગુજરાતી)', example: '"ભાઈ, આ જો — આટલી સરસ જગ્યા અહીં છે, ખબર હતી?"', wrongExample: '"Bhai, aa jo"', rightNote: 'Write Gujarati in Gujarati script' },
    Malayalam: { script: 'Malayalam script (മലയാളം)', example: '"മച്ചാ, ഇത് നോക്കൂ — ഇത്ര നല്ല place ഇവിടെ ഉണ്ട് എന്ന് അറിയാമോ?"', wrongExample: '"Macha, ithu nokku"', rightNote: 'Write Malayalam in Malayalam script' },
    Punjabi:   { script: 'Gurmukhi (ਪੰਜਾਬੀ)', example: '"ਯਾਰ, ਇਹ ਵੇਖ — ਇੱਥੇ ਇੰਨੀ ਵਧੀਆ ਜਗ੍ਹਾ ਹੈ, ਪਤਾ ਸੀ?"', wrongExample: '"Yaar, eh vekh"', rightNote: 'Write Punjabi in Gurmukhi script' },
  };

  const guide = scriptGuide[language];
  if (!guide) return `\nWRITE ALL SCRIPT CONTENT IN ${language}. Not English.\n`;

  return `
╔══════════════════════════════════════════════════════════════╗
║        MANDATORY LANGUAGE: ${language.toUpperCase().padEnd(32)}║
╚══════════════════════════════════════════════════════════════╝

Write ALL of these in ${language} using ${guide.script}:
• full_script — ENTIRE script
• voiceover in EVERY scene
• shorts_script
• cta_options cta_text
• caption_hooks
• hook_breakdown.what_viewer_is_thinking

CORRECT EXAMPLE:
${guide.example}

WRONG (do NOT do this — this is just Roman transliteration):
${guide.wrongExample}

RULE: ${guide.rightNote}
English brand names, app names, technical terms (YouTube, Instagram, Tamil, cricket, ECR) stay in English letters.
Numbers, statistics, and proper nouns that are commonly written in English stay in English.
The CONVERSATIONAL words, verbs, adjectives — write in ${language} script.
══════════════════════════════════════════════════════════════`.trim();
}

function buildMediaContextBlock(mediaAnalysis) {
  if (!mediaAnalysis) return '';
  if (mediaAnalysis.type === 'image') {
    return `VISUAL CONTEXT FROM UPLOADED IMAGES (${mediaAnalysis.count || 1} photo(s)):
Description: ${mediaAnalysis.description || 'Images provided by creator'}
Key elements: ${Array.isArray(mediaAnalysis.key_elements) ? mediaAnalysis.key_elements.join(', ') : 'Various elements'}
Mood: ${mediaAnalysis.mood || 'Not specified'}
Best visual hook: ${Array.isArray(mediaAnalysis.visual_hooks) ? mediaAnalysis.visual_hooks[0] : 'Use most striking element'}
INSTRUCTION: Write the script so it references these specific visuals naturally. Voiceover should complement what viewers see, not describe it.`;
  }
  if (mediaAnalysis.type === 'video') {
    return `VISUAL CONTEXT FROM UPLOADED VIDEO CLIP:
Description: ${mediaAnalysis.description || 'Video clip provided'}
Key moments: ${Array.isArray(mediaAnalysis.key_moments) ? mediaAnalysis.key_moments.join('; ') : 'Various moments'}
Atmosphere: ${mediaAnalysis.atmosphere || 'Not specified'}
Best hook moment: ${mediaAnalysis.hook_moment || 'Most visually striking moment'}
INSTRUCTION: Voiceover adds context the video cannot show by itself.`;
  }
  return '';
}

function selectPrimaryOpeningStyle(blogType, openingStylePreference, mediaAnalysis) {
  const config  = BLOG_TYPE_CONFIGS[blogType] || BLOG_TYPE_CONFIGS.travel;
  const allowed = config.allowed_openings;
  if (openingStylePreference && openingStylePreference !== 'auto') {
    const style = OPENING_STYLE_LIBRARY[openingStylePreference];
    if (style && allowed.includes(openingStylePreference)) return { key: openingStylePreference, ...style };
  }
  if (mediaAnalysis) {
    const pick = ['slice_of_life','sensory_immersion','friend_recommendation'].find(s => allowed.includes(s));
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
  const langEnforce = getBloggerLanguageEnforcement(language);
  const injections  = [_dnaBlock, _chainBlock].filter(Boolean).join('\n\n');

  const isShortForm = ['Instagram Reels','TikTok','YouTube Shorts'].includes(platform);
  const scriptWords = platRules.script_words;
  const sceneCount  = platRules.scene_count;
  const minScenes   = parseInt(sceneCount.split('-')[0]);

  return `${injections ? injections + '\n\n' : ''}You are an elite ${config.label} content creator writing a complete, performable script.

CREATOR BRIEF:
- Niche: ${niche}
- Blog Type: ${config.label}
- Platform: ${platform}
- Location: ${location || 'Not specified'}
- Language: ${language || 'English'} ← WRITE ALL SCRIPT CONTENT IN THIS LANGUAGE
- Tone: ${tone || 'Conversational'}
- Topic: ${chosenTopic || niche}
- Target Audience: ${targetAudience || 'General audience'}

${langEnforce}

${location ? `LOCATION CONTEXT: ${location} — incorporate specific local details and cultural context naturally.` : ''}

${mediaCtx ? `\n${mediaCtx}\n` : ''}

OPENING STYLE: ${openStyle.label}
${openStyle.description}
Example (in English — you will write yours in ${language || 'English'}): ${openStyle.example}
${customOpeningNote ? `CREATOR NOTE: ${customOpeningNote}` : ''}

FORBIDDEN OPENINGS (in any language):
- Fear/money-loss scare tactics ("If you don't do this you'll lose money")
- Generic motivational speech
- "Hey guys welcome back to my channel"
Start immediately with the ${openStyle.label} style — in ${language || 'English'}.

BLOG TYPE RULES:
${config.tone_guidance}
${config.extra_rules}

SCRIPT LENGTH: ${scriptWords} words
SCENE COUNT: minimum ${minScenes} scenes
DURATION: ${platRules.duration}

LANGUAGE MANDATE FOR THIS OUTPUT:
- full_script: write ENTIRELY in ${language || 'English'}
- Every scene voiceover: write in ${language || 'English'}
- shorts_script: write in ${language || 'English'}
- cta_options cta_text: write in ${language || 'English'}
- caption_hooks: write in ${language || 'English'}
- hook_breakdown.what_viewer_is_thinking: write in ${language || 'English'}
- visual_direction, b_roll_search_term, filming_tip: can stay in English

Return ONLY this JSON:

{
  "full_script": "ENTIRE script in ${language || 'English'} — ${scriptWords} words. Starts with ${openStyle.label} style immediately. Every word performable. No English if ${language || 'English'} is not English.",
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
      "voiceover": "30+ words of dialogue in ${language || 'English'} — NOT English if language is Tamil/Hindi/etc",
      "visual_direction": "what to film — can be in English",
      "overlay_text": "overlay text in ${language || 'English'} or null",
      "b_roll_search_term": "English search term for stock footage",
      "tone_direction": "delivery note",
      "retention_technique": "technique",
      "filming_tip": "practical filming advice"
    },
    {
      "scene_number": 2,
      "timestamp_start": "0:30",
      "timestamp_end": "1:30",
      "section_type": "MAIN_CONTENT",
      "voiceover": "40+ words in ${language || 'English'} — sensory details and specific observations",
      "visual_direction": "close-up shots of key subject",
      "overlay_text": null,
      "b_roll_search_term": "details footage search term",
      "tone_direction": "conversational and authentic",
      "retention_technique": "specific surprising detail",
      "filming_tip": "capture ambient sound before speaking"
    },
    {
      "scene_number": 3,
      "timestamp_start": "1:30",
      "timestamp_end": "3:00",
      "section_type": "MAIN_CONTENT",
      "voiceover": "40+ words in ${language || 'English'} — practical info, tips, honest assessment",
      "visual_direction": "show practical details: pricing, access, environment",
      "overlay_text": null,
      "b_roll_search_term": "practical footage search term",
      "tone_direction": "informative but warm",
      "retention_technique": "useful fact they did not know",
      "filming_tip": "golden hour lighting works best"
    },
    {
      "scene_number": 4,
      "timestamp_start": "3:00",
      "timestamp_end": "4:30",
      "section_type": "CTA",
      "voiceover": "30+ words in ${language || 'English'} — natural CTA, not sales-y",
      "visual_direction": "direct camera address, warm closing shot",
      "overlay_text": null,
      "b_roll_search_term": "ending shot search term",
      "tone_direction": "warm and genuine",
      "retention_technique": "tease next content or ask audience question",
      "filming_tip": "film CTA in one continuous take"
    }
  ],
  "hook_breakdown": {
    "hook_text": "${(chosenHook || '').replace(/"/g, '\\"').slice(0, 200)}",
    "trigger_type": "${hookTrigger || openStyle.key.toUpperCase()}",
    "psychological_mechanism": "explain what emotion or curiosity the opening triggers — at least 80 characters",
    "why_first_3_seconds": "why this opening works on ${platform} in the first 3 seconds — at least 60 characters",
    "what_viewer_is_thinking": "viewer's internal monologue in ${language || 'English'} — at least 40 characters",
    "what_happens_if_hook_fails": "Plan B action if opening does not land",
    "opening_style": "${openStyle.key}",
    "why_this_works": "why this style fits this blog type and audience"
  },
  "filming_guide": {
    "equipment_needed": ["smartphone with gimbal stabiliser", "lapel microphone"],
    "golden_hour_note": "best time of day for this specific content",
    "must_capture_shots": ["establishing wide shot", "close-up detail shot", "reaction or walking shot"],
    "avoid": "specific filming mistakes to avoid",
    "audio_note": "record 30 seconds of ambient sound before filming"
  },
  "shorts_script": "Complete standalone 60-second script in ${language || 'English'} — ${platRules.short_words} words. Every word written out.",
  "pattern_interrupts": [
    { "timestamp": "1:00", "technique": "Visual cut or question", "script_line": "exact line in ${language || 'English'}" }
  ],
  "cta_options": [
    { "cta_text": "natural CTA in ${language || 'English'} — word for word", "placement": "end", "goal": "save", "why_it_works": "reason" },
    { "cta_text": "second CTA in ${language || 'English'}", "placement": "middle", "goal": "comment", "why_it_works": "reason" }
  ],
  "caption_hooks": [
    "caption line 1 in ${language || 'English'} — punchy",
    "caption line 2 in ${language || 'English'} — question-based",
    "TikTok caption in ${language || 'English'} — under 100 characters"
  ],
  "media_based_insights": ${mediaAnalysis ? '"Specific ways the uploaded media shaped this script"' : 'null'},
  "content_notes": "any logistics or permissions note relevant to filming"
}`;
}

// ─── Blogger Research Prompt ───────────────────────────────────────────────────
export function buildBloggerResearchPrompt({
  niche, platform, blogType, location, language, tone, mediaAnalysis, _dnaBlock, _chainBlock,
}) {
  const config     = BLOG_TYPE_CONFIGS[blogType] || BLOG_TYPE_CONFIGS.travel;
  const mediaCtx   = buildMediaContextBlock(mediaAnalysis);
  const langEnforce = getBloggerLanguageEnforcement(language);
  const injections  = [_dnaBlock, _chainBlock].filter(Boolean).join('\n\n');

  return `${injections ? injections + '\n\n' : ''}You are a content research specialist. Find the BEST angle for this blog content.

BRIEF:
- Niche: ${niche}
- Platform: ${platform}
- Blog Type: ${config.label}
- Location: ${location || 'Not specified'}
- Language: ${language || 'English'} ← write all content fields in this language

${langEnforce}

${mediaCtx ? `VISUAL CONTEXT:\n${mediaCtx}\n` : ''}

Return ONLY this JSON. ALL hook_text and reasoning fields MUST be in ${language || 'English'}:

{
  "trending_angles": [
    { "topic": "topic — can be bilingual for SEO", "why_now": "in ${language || 'English'}", "audience_emotion": "emotion", "search_intent": "search intent", "urgency_level": "HIGH|MEDIUM|EVERGREEN", "unique_creator_angle": "unique angle in ${language || 'English'}" },
    { "topic": "...", "why_now": "...", "audience_emotion": "...", "search_intent": "...", "urgency_level": "...", "unique_creator_angle": "..." },
    { "topic": "...", "why_now": "...", "audience_emotion": "...", "search_intent": "...", "urgency_level": "...", "unique_creator_angle": "..." }
  ],
  "chosen_topic": "best topic — can be bilingual",
  "chosen_topic_reasoning": "reasoning in ${language || 'English'}",
  "target_audience_description": "audience description in ${language || 'English'}",
  "competitor_gap": "gap in ${language || 'English'}",
  "hook_options": [
    { "hook_text": "MUST be in ${language || 'English'} script — complete opening word for word", "psychological_trigger": "CURIOSITY_GAP", "trigger_explanation": "in ${language || 'English'}", "ctr_strength": "HIGH", "risk_factor": null, "best_for_platform": "${platform}" },
    { "hook_text": "MUST be in ${language || 'English'} script", "psychological_trigger": "LOSS_AVERSION", "trigger_explanation": "...", "ctr_strength": "MEDIUM", "risk_factor": null, "best_for_platform": "${platform}" },
    { "hook_text": "MUST be in ${language || 'English'} script", "psychological_trigger": "PATTERN_INTERRUPT", "trigger_explanation": "...", "ctr_strength": "HIGH", "risk_factor": null, "best_for_platform": "${platform}" }
  ],
  "chosen_hook": "MUST be in ${language || 'English'} script — exact copy of best hook_text",
  "chosen_hook_trigger": "trigger name",
  "chosen_hook_deep_analysis": "analysis in ${language || 'English'}",
  "best_upload_time": { "day": "day", "time": "HH:MM", "reasoning": "reason" },
  "thumbnail_concept": "thumbnail brief — can be in English"
}`;
}

export const OPENING_STYLE_OPTIONS = [
  { value: 'auto',                    label: '✨ Auto-select',            desc: 'AI picks best fit' },
  { value: 'slice_of_life',           label: '🎬 Slice of Life',         desc: 'Start mid-experience' },
  { value: 'sensory_immersion',       label: '👃 Sensory Immersion',     desc: 'Smell, sound, texture' },
  { value: 'native_meme_reference',   label: '😄 Native Meme / Joke',    desc: 'Cultural reference opener' },
  { value: 'friend_recommendation',   label: '💬 Friend Rec Energy',     desc: 'Telling your best friend' },
  { value: 'unexpected_confession',   label: '🙊 Unexpected Confession', desc: 'Admit something surprising' },
  { value: 'mystery_tease',           label: '🔍 Mystery Tease',         desc: 'Something unexplained' },
  { value: 'local_legend',            label: '📖 Local Legend',          desc: 'History or folklore' },
  { value: 'contrast_open',           label: '⚡ Before/After Contrast', desc: 'Expectation vs reality' },
  { value: 'direct_address',          label: '🎯 Direct Address',        desc: 'Speak to a specific person' },
  { value: 'advertisement_authentic', label: '📣 Authentic Ad Open',     desc: 'Transparent sponsor opener' },
];

export const BLOG_TYPE_OPTIONS = [
  { value: 'travel',         label: '✈️ Travel Blog',       desc: 'Destinations, routes, experiences' },
  { value: 'advertisement',  label: '📢 Advertisement',      desc: 'Sponsored content, brand promotions' },
  { value: 'food',           label: '🍜 Food & Restaurant',  desc: 'Restaurants, dishes, food spots' },
  { value: 'culture',        label: '🏛️ Culture & Heritage', desc: 'Heritage, festivals, traditions' },
  { value: 'event',          label: '🎪 Event Coverage',     desc: 'Concerts, festivals, live events' },
  { value: 'product_review', label: '⭐ Product Review',     desc: 'On-location reviews, services' },
  { value: 'lifestyle',      label: '🌅 Lifestyle',          desc: 'Day-in-life, personal vlogs' },
];

export { BLOG_TYPE_CONFIGS, PLATFORM_RULES, OPENING_STYLE_LIBRARY };