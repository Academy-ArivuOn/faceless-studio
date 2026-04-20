// packages/agents/prompts.js
// FIX: Language is now ENFORCED in every prompt, not just described.
// All text-content fields (hooks, scripts, captions, titles) must be written in the selected language.

// ─── DNA + Chain injection helpers ────────────────────────────────────────────
function injectDNAAndChain(prompt, dnaBlock, chainBlock) {
  const injections = [dnaBlock, chainBlock].filter(Boolean).join('\n\n');
  if (!injections) return prompt;
  return `${injections}\n\n${prompt}`;
}

// ─── Language Enforcement Block ────────────────────────────────────────────────
// This is the KEY fix — a hard mandate that ALL content fields must be in the target language
function getLanguageEnforcement(language) {
  if (!language || language === 'English') return '';

  const scriptPatterns = {
    Hindi:     'Devanagari script (हिंदी) with natural Hinglish mixing (55-65% Hindi, 35-45% English words naturally mixed)',
    Tamil:     'Tamil script (தமிழ்) with natural Tanglish mixing (Tamil words + English tech/brand terms)',
    Telugu:    'Telugu script (తెలుగు) with natural Telugu-English mixing',
    Kannada:   'Kannada script (ಕನ್ನಡ) with natural Kannada-English mixing',
    Marathi:   'Devanagari script (मराठी) with natural Marathi-English mixing',
    Bengali:   'Bengali script (বাংলা) with natural Bengali-English mixing',
    Gujarati:  'Gujarati script (ગુજરાતી) with natural Gujarati-English mixing',
    Malayalam: 'Malayalam script (മലയാളം) with natural Malayalam-English mixing',
    Punjabi:   'Gurmukhi script (ਪੰਜਾਬੀ) with natural Punjabi-English mixing',
    Spanish:   'Spanish with natural Spanish-English mixing where appropriate',
    French:    'French with natural French-English mixing where appropriate',
    Portuguese:'Portuguese with natural Portuguese-English mixing',
    Arabic:    'Arabic script (عربي) with natural Arabic-English mixing',
    Indonesian:'Bahasa Indonesia with natural Indonesian-English mixing',
    Japanese:  'Japanese (日本語) with natural Japanese-English mixing',
    Korean:    'Korean (한국어) with natural Korean-English mixing',
  };

  const exampleLines = {
    Hindi:     'Example: "Bhai, yeh jagah bilkul amazing hai — seriously, aap ek baar zaroor aana chahiye!"',
    Tamil:     'Example: "Machan, itha paaru — ithana nalla place Chennai-la irukku, neenga visit pannirukkeengala?"',
    Telugu:    'Example: "Bro, ee place chudali ante okkasari raavali — idi meeru miss avvakoodu!"',
    Kannada:   'Example: "Guru, ee jagada nodideeya? Bangalore hattra ithana chendada jaaga iratte!"',
    Marathi:   'Example: "Bhai, hi jagah ekda bagha — seriously, itka changlya place Mumbai-javaL aahe!"',
    Bengali:   'Example: "Bhai, ei jaygata dekho — Dhaka-r kaache eto sundor jayga ache, tumi giyecho?"',
    Gujarati:  'Example: "Yaar, aa jagya joi lo — Ahmedabad paas etli saras jagya chhe, tame gayu chho?"',
    Malayalam: 'Example: "Machan, ith nokku — Kerala-l ithra nalla place undu, ningal visited cheythittundo?"',
    Punjabi:   'Example: "Yaar, eh jagah dekh — Punjab ch itni sohni jagah hai, tu gaya hai kabhi?"',
  };

  return `
╔══════════════════════════════════════════════════════════════╗
║          MANDATORY LANGUAGE REQUIREMENT — READ FIRST         ║
╚══════════════════════════════════════════════════════════════╝

The user has selected: ${language.toUpperCase()}

ALL of the following fields MUST be written in ${language}, not English:
• hook_text / chosen_hook (ALL hooks — write in ${language})
• chosen_topic (can be a mix if title needs English keywords)
• chosen_topic_reasoning
• target_audience_description
• competitor_gap
• chosen_hook_deep_analysis
• trigger_explanation
• full_script (ENTIRE SCRIPT in ${language})
• voiceover in every scene (in ${language})
• shorts_script (in ${language})
• cta_options cta_text (in ${language})
• caption_hooks (in ${language})
• Instagram caption (in ${language})
• TikTok caption (in ${language})
• YouTube description (in ${language})

WRITING STYLE FOR ${language}:
Write in ${scriptPatterns[language] || `${language} with natural code-switching`}.
${exampleLines[language] ? exampleLines[language] : ''}

WHAT STAYS IN ENGLISH:
• YouTube title options (keep English/bilingual for searchability — titles can be in ${language} OR English OR mixed)
• Technical terms, brand names, app names (Swiggy, Zomato, etc.)
• Hashtags (can stay English for reach)
• SEO tags (keep in English for search)
• Numbers, statistics
• Field KEYS in the JSON object

WRONG (do not do this):
hook_text: "Serval animal style body language use panni strangers friend aaga mudiyuma?"
(This is Roman transliteration — NOT Tamil script)

CORRECT (do this):
hook_text: "Serval animal மாதிரி body language use பண்ணி strangers கூட friend ஆக முடியுமா? Palavakkam beach-ல இருந்து ஒரு crazy experiment, பாருங்க!"
(This is Tamil script mixed with English brand/technical words — CORRECT)

DO NOT write Tamil words in English letters (Tanglish). 
WRITE Tamil words in Tamil script (தமிழ்).
English words (nouns, tech terms, brand names) can stay in English letters.
══════════════════════════════════════════════════════════════
`.trim();
}

// ─── Platform Context ─────────────────────────────────────────────────────────
function getPlatformContext(platform, creatorType) {
  const p = platform.toLowerCase();

  if (p.includes('youtube')) {
    return `
PLATFORM: YouTube
- Algorithm heavily rewards watch time percentage, not raw views.
- First 30 seconds determine whether YouTube recommends or buries the video.
- Titles: 60 chars max displayed in feed. Front-load the emotion/number.
- Thumbnails: 3-word rule. Faces with exaggerated expressions outperform graphics by 38%.
- Tags matter less but 12-15 relevant tags help surface in search.
- ${creatorType === 'educator' ? 'Educational channels perform best with problem-first framing.' : ''}
`.trim();
  }

  if (p.includes('instagram') || p.includes('reels')) {
    return `
PLATFORM: Instagram Reels
- Algorithm distributes Reels to non-followers first. Always writing for cold audience.
- First 1 second is visual — hook must be SEEN before it is heard.
- Saves and shares are the highest-signal engagement.
`.trim();
  }

  if (p.includes('tiktok')) {
    return `
PLATFORM: TikTok
- FYP algorithm is the most democratic — new account can go viral on Day 1.
- First 0.5 seconds: TikTok measures if viewer watches past first half-second.
- Trending sounds give 2-3x initial distribution boost.
`.trim();
  }

  if (p.includes('podcast')) {
    return `PLATFORM: Podcast — Episode titles follow [Specific Value] with [Guest/Angle] format. Show notes at 300-500 words improve SEO.`.trim();
  }

  if (p.includes('blog')) {
    return `PLATFORM: Blog — Google rewards first-hand experience, specificity, and depth. Target keyword in H1, first 100 words, 2+ H2s, meta description.`.trim();
  }

  return `PLATFORM: Multi-platform — Prioritise formats that can be repurposed across 5-7 short-form assets.`;
}

// ─── Language Context (descriptive, supplemental) ─────────────────────────────
function getLanguageContext(language) {
  const l = (language || 'English').toLowerCase();

  if (l === 'hindi') {
    return `HINDI STYLE GUIDE:
- Write scripts in natural Hinglish: 55-65% Hindi words, 35-45% English words naturally mixed.
- Use Devanagari for Hindi words: "बहुत", "अच्छा", "देखो", "समझे", "सच में"
- Indian number system: ₹1,50,000 not $1500. "1.5 lakh" not "150,000".
- Common Hindi connectors: "देखो", "समझे?", "भाई", "यार", "मतलब", "actually", "basically"
- Do NOT write Hindi words in Roman letters.`;
  }

  if (l === 'tamil') {
    return `TAMIL STYLE GUIDE:
- Write in natural Tanglish: Tamil words in Tamil script + English tech/brand terms in English letters.
- Use Tamil script for Tamil words: "பாருங்க", "தெரியுமா", "மச்சான்", "சூப்பர்", "என்ன"
- Common Tamil connectors: "பாருங்க", "தெரியுமா?", "மச்சான்", "இல்லையா", "சரியா", "actually"
- NEVER write Tamil words like "parunga" or "machaan" — write them as "பாருங்க", "மச்சான்"
- English brand names, app names, technical terms stay in English letters.`;
  }

  if (l === 'telugu') {
    return `TELUGU STYLE GUIDE:
- Write Telugu words in Telugu script: "చూడండి", "తెలుసా", "బ్రో", "సూపర్", "ఏంటి"
- Mix with English tech terms naturally.
- Common connectors: "అంటే", "చూడు", "అది కాదు", "actually", "basically"`;
  }

  if (l === 'kannada') {
    return `KANNADA STYLE GUIDE:
- Write Kannada words in Kannada script: "ನೋಡಿ", "ಗೊತ್ತಾ", "ಮಚ್ಚ", "ಸೂಪರ್", "ಏನು"
- Mix with English tech terms naturally.`;
  }

  if (l === 'marathi') {
    return `MARATHI STYLE GUIDE:
- Write Marathi in Devanagari: "बघा", "माहीत आहे का", "भाऊ", "झकास", "काय"
- Mix with English tech terms naturally.`;
  }

  return `LANGUAGE: ${language} — Write in natural ${language} as spoken by a real creator. Mix with English technical/brand terms where natural.`;
}

// ─── Research Prompt ──────────────────────────────────────────────────────────
export function buildResearchPrompt({
  niche, platform, creatorType, language, tone, trendData = null,
  _dnaBlock = '', _chainBlock = '',
}) {
  const platformCtx   = getPlatformContext(platform, creatorType);
  const langCtx       = getLanguageContext(language);
  const langEnforce   = getLanguageEnforcement(language);

  let trendsInstructions = '';
  if (trendData && trendData.trends && trendData.trends.length > 0) {
    const trendsList = trendData.trends
      .map((t, i) => `${i + 1}. "${t.topic}" (Source: ${t.source}, Virality: ${t.virality_score}, Age: ${t.recency_hours}h)`)
      .join('\n');
    trendsInstructions = `
LIVE TREND SIGNALS (Real-time data):
${trendsList}
RULES: Prioritise these over internal knowledge. Build trending_angles directly from these topics.
`;
  }

  const corePrompt = `
You are the Research Agent for Studio AI. Find the STRONGEST content angle for this creator.

CREATOR BRIEF:
- Niche: ${niche}
- Platform: ${platform}
- Creator Type: ${creatorType}
- Target Language: ${language || 'English'}
- Tone: ${tone || 'Educational'}

${langEnforce}

${langCtx}

${trendsInstructions}

${platformCtx}

YOUR TASK:
1. Find 3 content angles that are trending, evergreen-with-urgency, or underserved in this niche.
2. Select the single strongest angle.
3. Write 3 hook options with different psychological triggers — ALL hooks written in ${language || 'English'}.
4. Select the best hook.
5. Describe a thumbnail concept.

PSYCHOLOGICAL TRIGGERS for hooks: LOSS_AVERSION, CURIOSITY_GAP, PATTERN_INTERRUPT, SOCIAL_PROOF, DIRECT_PROMISE, AUTHORITY_CHALLENGE, IDENTITY

CRITICAL REMINDER: Every hook_text, chosen_hook, and reasoning field MUST be written in ${language || 'English'} — not English.

Return ONLY this JSON:

{
  "trending_angles": [
    { "topic": "topic written naturally — can use ${language || 'English'} OR English for searchability", "why_now": "written in ${language || 'English'}", "audience_emotion": "primary emotion", "search_intent": "what the viewer searches for", "urgency_level": "HIGH | MEDIUM | EVERGREEN" },
    { "topic": "...", "why_now": "...", "audience_emotion": "...", "search_intent": "...", "urgency_level": "..." },
    { "topic": "...", "why_now": "...", "audience_emotion": "...", "search_intent": "...", "urgency_level": "..." }
  ],
  "chosen_topic": "the best topic title — can be bilingual for SEO",
  "chosen_topic_reasoning": "2-3 sentences in ${language || 'English'} explaining why this angle wins",
  "target_audience_description": "written in ${language || 'English'} — specific audience description",
  "competitor_gap": "written in ${language || 'English'} — what top channels are NOT covering",
  "content_warning": null,
  "hook_options": [
    { "hook_text": "MUST be in ${language || 'English'} script — complete word-for-word hook as spoken", "psychological_trigger": "LOSS_AVERSION", "trigger_explanation": "in ${language || 'English'}", "ctr_strength": "HIGH | MEDIUM | LOW", "risk_factor": null, "best_for_platform": "${platform}" },
    { "hook_text": "MUST be in ${language || 'English'} script", "psychological_trigger": "CURIOSITY_GAP", "trigger_explanation": "in ${language || 'English'}", "ctr_strength": "...", "risk_factor": null, "best_for_platform": "${platform}" },
    { "hook_text": "MUST be in ${language || 'English'} script", "psychological_trigger": "PATTERN_INTERRUPT", "trigger_explanation": "in ${language || 'English'}", "ctr_strength": "...", "risk_factor": null, "best_for_platform": "${platform}" }
  ],
  "chosen_hook": "MUST be in ${language || 'English'} script — exact copy of the best hook_text",
  "chosen_hook_trigger": "the psychological trigger of the chosen hook",
  "chosen_hook_deep_analysis": "3-4 sentences in ${language || 'English'} — why this hook works",
  "best_upload_time": { "day": "day of week", "time": "HH:MM", "reasoning": "why this time" },
  "thumbnail_concept": "thumbnail brief — can be in English or ${language || 'English'}"
}
`.trim();

  return injectDNAAndChain(corePrompt, _dnaBlock, _chainBlock);
}

// ─── Creator Prompt ───────────────────────────────────────────────────────────
export function buildCreatorPrompt({
  niche, platform, tone, language, creatorType,
  chosenTopic, chosenHook, hookTrigger, hookAnalysis,
  competitorGap, targetAudience,
  _dnaBlock = '', _chainBlock = '', _creatorMode = 'faceless',
}) {
  const p = platform.toLowerCase();
  const isShortForm = p.includes('reels') || p.includes('tiktok') || p.includes('shorts');
  const isBlog      = p.includes('blog');
  const isPodcast   = p.includes('podcast');
  const isFaceless  = _creatorMode !== 'face';

  const platformCtx = getPlatformContext(platform, creatorType);
  const langCtx     = getLanguageContext(language);
  const langEnforce = getLanguageEnforcement(language);

  const modeInstructions = isFaceless
    ? `FACELESS MODE: For each scene provide b_roll_search_term, overlay_text, and voiceover pacing note. No on-camera direction.`
    : `FACE-SHOWING MODE: For each scene provide on-camera direction, body language cue, and energy note.`;

  const formatInstructions = isShortForm
    ? `FORMAT: Short-form (60-90 seconds) — 140-200 words. Hook (0-3s) → Value (3-50s) → CTA (50-60s). Zero filler.`
    : isBlog
    ? `FORMAT: Blog article — 1,400-2,000 words. Hook intro → 4 H2 sections → Conclusion CTA.`
    : isPodcast
    ? `FORMAT: Podcast — 1,200-2,000 words. Cold open → Intro → 3-4 chapters → CTA.`
    : `FORMAT: Long-form YouTube — minimum 900 words (8-15 min). Hook → Pattern interrupt → Value sections → CTA.`;

  const corePrompt = `
You are the Creator Agent for Studio AI. Write a COMPLETE, production-ready script.

CREATOR BRIEF:
- Niche: ${niche}
- Platform: ${platform}
- Creator Type: ${creatorType}
- Language: ${language || 'English'}
- Tone: ${tone || 'Educational'}
- Chosen Topic: ${chosenTopic}
- Chosen Hook: ${chosenHook}
- Hook Trigger: ${hookTrigger || 'CURIOSITY_GAP'}
- Target Audience: ${targetAudience || 'Content creators and digital entrepreneurs'}
- Competitor Gap: ${competitorGap || 'Go deeper than surface-level advice'}

${langEnforce}

${langCtx}

${modeInstructions}

${formatInstructions}

${platformCtx}

SCRIPT RULES:
- Start with the EXACT hook: "${chosenHook}" — verbatim as the opening line
- Write exactly as a HUMAN speaks in ${language || 'English'} — contractions, natural rhythm
- full_script must be entirely in ${language || 'English'} — no English paragraphs if language is not English
- voiceover in every scene must be in ${language || 'English'}
- shorts_script must be in ${language || 'English'}
- cta_options text must be in ${language || 'English'}

Return ONLY this JSON:

{
  "full_script": "ENTIRE script in ${language || 'English'}. Minimum ${isShortForm ? '150' : isBlog ? '1400' : '900'} words. Start with hook verbatim. Every word the creator will say — all in ${language || 'English'}.",
  "estimated_duration": "${isShortForm ? '60-90 seconds' : isBlog ? '7-10 min read' : '8-15 minutes'}",
  "word_count": 0,
  "creator_mode": "${isFaceless ? 'faceless' : 'face'}",
  "scenes": [
    {
      "scene_number": 1,
      "timestamp_start": "0:00",
      "timestamp_end": "0:28",
      "section_type": "HOOK | INTRO | MAIN_CONTENT | PATTERN_INTERRUPT | RETENTION_BRIDGE | CTA | OUTRO",
      "voiceover": "exact words in ${language || 'English'} — complete, word for word",
      "visual_direction": "what to show/film — can be in English",
      "overlay_text": "text overlay in ${language || 'English'} or null",
      "b_roll_search_term": "English search term for stock footage",
      "tone_direction": "delivery note",
      "retention_technique": "technique used here"
    }
  ],
  "hook_breakdown": {
    "hook_text": "${(chosenHook || '').replace(/"/g, '\\"')}",
    "trigger_type": "${hookTrigger || 'CURIOSITY_GAP'}",
    "psychological_mechanism": "explanation — can be in English",
    "why_first_3_seconds": "why this hook works in first 3 seconds — can be in English",
    "what_viewer_is_thinking": "viewer's internal monologue in ${language || 'English'}",
    "what_happens_if_hook_fails": "plan B — can be in English"
  },
  "shorts_script": "Complete standalone 60-second script in ${language || 'English'}. Different from main script. Written word-for-word.",
  "pattern_interrupts": [
    { "timestamp": "approx time", "technique": "technique name", "script_line": "exact line in ${language || 'English'}" }
  ],
  "cta_options": [
    { "cta_text": "CTA in ${language || 'English'} — natural, word for word", "placement": "where in video", "goal": "subscribe | like | comment | follow | purchase", "why_it_works": "reason" },
    { "cta_text": "second CTA in ${language || 'English'}", "placement": "...", "goal": "...", "why_it_works": "..." }
  ],
  "content_notes": null
}
`.trim();

  return injectDNAAndChain(corePrompt, _dnaBlock, _chainBlock);
}

// ─── Publisher Prompt ─────────────────────────────────────────────────────────
export function buildPublisherPrompt({
  niche, platform, language, creatorType,
  chosenTopic, chosenHook, scriptExcerpt, targetAudience,
  _dnaBlock = '', _chainBlock = '',
}) {
  const platformCtx = getPlatformContext(platform, creatorType);
  const langCtx     = getLanguageContext(language);
  const langEnforce = getLanguageEnforcement(language);
  const excerpt     = (scriptExcerpt || '').slice(0, 500);

  const corePrompt = `
You are the Publisher Agent for Studio AI. Create platform-optimised distribution assets.

CONTENT BRIEF:
- Niche: ${niche}
- Platform: ${platform}
- Language: ${language || 'English'}
- Topic: ${chosenTopic}
- Hook: ${chosenHook}
- Target Audience: ${targetAudience || 'Content creators'}

SCRIPT OPENING: "${excerpt}"

${langEnforce}

${langCtx}

${platformCtx}

LANGUAGE RULES FOR THIS OUTPUT:
- YouTube description: write in ${language || 'English'}
- Instagram caption: write in ${language || 'English'}
- TikTok caption: write in ${language || 'English'}
- YouTube titles: can be English OR ${language || 'English'} OR bilingual (for best searchability — your choice based on what gets more clicks for this language/niche combo)
- Hashtags: keep in English for maximum reach
- SEO tags: keep in English
- seven_day_content_plan topic_angle: write in ${language || 'English'}

Return ONLY this JSON:

{
  "youtube": {
    "title_options": [
      { "title": "YouTube title — English or ${language || 'English'} or bilingual for best CTR", "character_count": 0, "primary_strategy": "CTR strategy", "ctr_prediction": "HIGH | MEDIUM | LOW", "reasoning": "why this gets clicks" },
      { "title": "...", "character_count": 0, "primary_strategy": "...", "ctr_prediction": "...", "reasoning": "..." },
      { "title": "...", "character_count": 0, "primary_strategy": "...", "ctr_prediction": "...", "reasoning": "..." }
    ],
    "recommended_title": "best title from above",
    "description": "Full YouTube description in ${language || 'English'}. 210-240 words. Hook sentence first. What viewer learns, timestamps, keywords, CTA. Zero placeholders.",
    "tags": ["tag1","tag2","tag3","tag4","tag5","tag6","tag7","tag8","tag9","tag10","tag11","tag12"],
    "primary_keyword": "main keyword in English for search",
    "secondary_keywords": ["kw1","kw2","kw3","kw4","kw5"],
    "category_suggestion": "YouTube category",
    "end_screen_recommendation": "end screen strategy",
    "card_recommendation": "cards to add"
  },
  "instagram": {
    "caption": "Full Instagram caption in ${language || 'English'}. 175-250 words. Open with hook. 3-4 short paragraphs. Save/share CTA at end.",
    "hashtags": ["hashtag1","hashtag2","hashtag3","hashtag4","hashtag5","hashtag6","hashtag7","hashtag8","hashtag9","hashtag10","hashtag11","hashtag12","hashtag13","hashtag14","hashtag15","hashtag16","hashtag17","hashtag18","hashtag19","hashtag20"],
    "reel_cover_text": "3-5 word cover text in ${language || 'English'} or English",
    "story_slide_text": "story text — under 15 words in ${language || 'English'}",
    "save_cta": "save CTA in ${language || 'English'}"
  },
  "tiktok": {
    "caption": "TikTok caption in ${language || 'English'} — under 100 characters",
    "hashtags": ["#hashtag1","#hashtag2","#hashtag3","#hashtag4","#hashtag5"],
    "first_frame_text": "under 8 words — in ${language || 'English'} or English",
    "trending_sound_category": "type of sound that fits",
    "duet_stitch_suggestion": "duet/stitch suggestion"
  },
  "blog": {
    "seo_title": "blog title — under 60 chars — can be English for SEO",
    "meta_description": "max 150 chars — can be English for SEO",
    "url_slug": "url-slug-in-english",
    "primary_keyword": "main keyword",
    "secondary_keywords": ["kw1","kw2","kw3","kw4"],
    "suggested_h2_headers": ["H2 1","H2 2","H2 3","H2 4"]
  },
  "cross_platform_repurpose": [
    { "platform": "platform name", "format": "format", "specific_angle": "how to reframe for that platform in ${language || 'English'}" },
    { "platform": "...", "format": "...", "specific_angle": "..." },
    { "platform": "...", "format": "...", "specific_angle": "..." }
  ],
  "posting_schedule": {
    "primary_post_day": "day of week",
    "primary_post_time": "HH:MM",
    "reasoning": "reason based on audience behaviour",
    "follow_up_story_timing": "when to post follow-up"
  },
  "seven_day_content_plan": [
    { "day": 1, "content_type": "Main Video | Short | Story | Community Post | Blog | Reel | Podcast", "topic_angle": "topic in ${language || 'English'}", "platform": "platform", "repurpose_from": "Original or source" },
    { "day": 2, "content_type": "...", "topic_angle": "topic in ${language || 'English'}", "platform": "...", "repurpose_from": "..." },
    { "day": 3, "content_type": "...", "topic_angle": "...", "platform": "...", "repurpose_from": "..." },
    { "day": 4, "content_type": "...", "topic_angle": "...", "platform": "...", "repurpose_from": "..." },
    { "day": 5, "content_type": "...", "topic_angle": "...", "platform": "...", "repurpose_from": "..." },
    { "day": 6, "content_type": "...", "topic_angle": "...", "platform": "...", "repurpose_from": "..." },
    { "day": 7, "content_type": "...", "topic_angle": "...", "platform": "...", "repurpose_from": "..." }
  ]
}
`.trim();

  return injectDNAAndChain(corePrompt, _dnaBlock, _chainBlock);
}

// ─── Creator Prompt (Compact Fallback) ───────────────────────────────────────
export function buildCreatorPromptCompact({
  niche, platform, tone, language, creatorType,
  chosenTopic, chosenHook, hookTrigger, hookAnalysis,
  competitorGap, targetAudience,
  _dnaBlock = '', _chainBlock = '', _creatorMode = 'faceless',
}) {
  const p = platform.toLowerCase();
  const isShortForm = p.includes('reels') || p.includes('tiktok') || p.includes('shorts');
  const isBlog      = p.includes('blog');
  const isPodcast   = p.includes('podcast');
  const isFaceless  = _creatorMode !== 'face';
  const langEnforce = getLanguageEnforcement(language);

  const scriptTarget = isShortForm ? '150-200' : isBlog ? '700-900' : isPodcast ? '600-800' : '500-700';
  const sceneTarget  = isShortForm ? '4' : '6';
  const format       = isShortForm ? 'Short-form (60-90s)' : isBlog ? 'Blog article' : isPodcast ? 'Podcast episode' : 'YouTube video';

  const corePrompt = `
You are the Creator Agent for Studio AI. Write a COMPLETE script in ${language || 'English'}.

BRIEF:
- Niche: ${niche} | Platform: ${platform} (${format})
- Language: ${language || 'English'} ← ALL script content in this language
- Topic: ${chosenTopic}
- Hook: "${chosenHook}"
- Audience: ${targetAudience || 'General audience'}
- Mode: ${isFaceless ? 'FACELESS' : 'FACE-SHOWING'}

${langEnforce}

COMPACT RULES:
- full_script: ${scriptTarget} words. ENTIRE script in ${language || 'English'}. Start with hook verbatim.
- scenes: exactly ${sceneTarget} scenes. Each voiceover in ${language || 'English'}.
- shorts_script: 80-120 words in ${language || 'English'}.
- cta_options: in ${language || 'English'}.
- JSON must be complete and valid.

Return ONLY this JSON:

{
  "full_script": "Script in ${language || 'English'} starting with: ${(chosenHook || '').replace(/"/g, '\\"').slice(0, 100)}",
  "estimated_duration": "${isShortForm ? '60-90 seconds' : isBlog ? '5-7 min read' : '5-8 minutes'}",
  "word_count": 0,
  "creator_mode": "${isFaceless ? 'faceless' : 'face'}",
  "scenes": [
    {
      "scene_number": 1,
      "timestamp_start": "0:00",
      "timestamp_end": "0:30",
      "section_type": "HOOK",
      "voiceover": "words in ${language || 'English'} for this scene",
      "visual_direction": "what to film",
      "overlay_text": null,
      "b_roll_search_term": "search term in English",
      "tone_direction": "delivery note",
      "retention_technique": "technique"
    }
  ],
  "hook_breakdown": {
    "hook_text": "${(chosenHook || '').replace(/"/g, '\\"').slice(0, 150)}",
    "trigger_type": "${hookTrigger || 'CURIOSITY_GAP'}",
    "psychological_mechanism": "what happens neurologically",
    "why_first_3_seconds": "why this works in first 3 seconds",
    "what_viewer_is_thinking": "viewer monologue in ${language || 'English'}",
    "what_happens_if_hook_fails": "plan B"
  },
  "shorts_script": "60-second script in ${language || 'English'}. Every word written.",
  "pattern_interrupts": [
    { "timestamp": "approx time", "technique": "technique", "script_line": "exact line in ${language || 'English'}" }
  ],
  "cta_options": [
    { "cta_text": "CTA in ${language || 'English'}", "placement": "where", "goal": "subscribe|like|comment|follow|purchase", "why_it_works": "reason" },
    { "cta_text": "second CTA in ${language || 'English'}", "placement": "where", "goal": "subscribe|like|comment|follow|purchase", "why_it_works": "reason" }
  ],
  "content_notes": null
}
`.trim();

  return injectDNAAndChain(corePrompt, _dnaBlock, _chainBlock);
}