// ─── Platform Context ─────────────────────────────────────────────────────────
function getPlatformContext(platform, creatorType) {
  const p = platform.toLowerCase();

  if (p.includes('youtube')) {
    return `
PLATFORM: YouTube
- Algorithm heavily rewards watch time percentage, not raw views. A 10-min video watched 70% beats a 20-min video watched 30%.
- First 30 seconds determine whether YouTube recommends or buries the video. No slow intros.
- Titles: 60 chars max displayed in feed. Front-load the emotion/number. No clickbait that doesn't deliver — YouTube penalises high CTR + low watch time.
- Thumbnails: 3-word rule — thumbnail should say 3 key words visually. Faces with exaggerated expressions outperform graphics by 38%.
- Tags matter less than they did, but 12-15 relevant tags help surface in search.
- Chapters (timestamps) increase search ranking and watch time.
- Community posts and Shorts used to funnel viewers to main videos increase subscription conversion.
- ${creatorType === 'educator' ? 'Educational channels perform best with problem-first framing, not lesson-first.' : ''}
- ${creatorType === 'podcaster' ? 'Podcast clips as Shorts (vertical 60s) drive subscribers to full episodes effectively.' : ''}
`.trim();
  }

  if (p.includes('instagram') || p.includes('reels')) {
    return `
PLATFORM: Instagram Reels
- Algorithm distributes Reels to non-followers first. You are always writing for a cold audience.
- First 1 second is visual — the hook must be SEEN before it's heard. Text overlay on frame 1 is mandatory.
- Audio accounts for 40% of retention. Use trending audio where possible or high-energy original.
- 7-15 second Reels get boosted to Explore. 30-60 second Reels get pushed to Reels tab.
- Captions are keyword-indexed. First 125 chars show before "more" tap — front-load the value proposition.
- 20-25 hashtags (mix: 3 mega >1M, 10 mid 100K-1M, 7 niche <100K, 5 exact-match).
- Stories drive DMs; Reels drive reach. Strategy differs per objective.
- Saves and shares are the highest-signal engagement (beat likes 5x for distribution).
`.trim();
  }

  if (p.includes('tiktok')) {
    return `
PLATFORM: TikTok
- FYP algorithm is the most democratic — a new account can go viral on Day 1. No follower count needed.
- First 0.5 seconds: TikTok measures if the viewer even watches past the first half-second. Most don't.
- Hook must be in the text on screen OR in the first spoken word. Not in a title — on the video itself.
- Duets and Stitches signal to the algorithm that your content is conversation-worthy. Encourage them.
- Trending sounds give a 2-3x initial distribution boost. Use trending audio when content allows.
- Captions are under 100 characters. The real description is ON the video itself.
- Posting 1-3 times/day is the recommended cadence. Consistency rewards compound.
- Comments within first 30 minutes are critical — reply to every comment in the first hour.
`.trim();
  }

  if (p.includes('podcast')) {
    return `
PLATFORM: Podcast
- Discoverability is primarily through show notes (SEO), guest appearances, and platform search.
- Episode titles follow the format: [Specific Value] with [Guest/Angle] — searches are specific, not vague.
- First 90 seconds = cold open or host intro + single-sentence value prop. No long ad reads at the start.
- Show notes at 300-500 words with timestamps improve SEO and serve as episode navigation.
- Chapters in podcast files (MP3 ID3 tags) are now rendered by Spotify, Apple Podcasts — use them.
- Clips (60-90s) distributed as Reels/Shorts/TikTok are the #1 growth driver for podcasts.
- Episode frequency: consistency > volume. Weekly beats sporadic daily.
`.trim();
  }

  if (p.includes('blog')) {
    return `
PLATFORM: Blog / Long-form Written Content
- Google's Helpful Content Update (2024) rewards first-hand experience, specificity, and depth.
- Target keyword in: title (H1), first 100 words, at least 2 H2 headers, image alt text, meta description.
- E-E-A-T (Experience, Expertise, Authoritativeness, Trustworthiness) signals are now ranking factors.
- Featured snippet format: answer the question directly in 40-50 words after the H2 that matches the query.
- Internal linking (3-5 per article) passes link equity and reduces bounce rate.
- Target word count: 1,500-2,500 for competitive keywords. Quality over length — thin content ranks poorly.
- Mobile-first: 70% of blog readers are on mobile. Short paragraphs (2-3 lines max), subheadings every 300 words.
`.trim();
  }

  return `
PLATFORM: Multi-platform / General Content
- Prioritise formats that can be repurposed: a long-form piece spawns 5-7 short-form assets.
- Core content hierarchy: long-form (pillar) → medium-form (platform-optimised) → short-form (clips).
- Consistency in brand voice and visual identity across platforms increases cross-platform follow rate by 62%.
`.trim();
}

// ─── Language Context ─────────────────────────────────────────────────────────
function getLanguageContext(language) {
  const l = (language || 'English').toLowerCase();

  if (l === 'hindi') {
    return `
LANGUAGE: Hindi (Hinglish)
- Write scripts in natural Hinglish: 55-65% Hindi, 35-45% English words naturally mixed.
- Use Devanagari script for Hindi words unless creator requests Roman transliteration.
- Number system: use Indian format — ₹1,50,000 not $1500. "1.5 lakh" not "150,000". "1 crore" not "10M".
- Cultural anchors to use naturally: JEE, UPSC, IPL, Diwali, Holi, cricket, startup ecosystem.
- Indian apps: PhonePe, Paytm, Swiggy, Zomato, Zepto, Meesho, Groww, Zerodha, Cred.
- Common Hindi connectors: "dekho", "samjhe?", "bhai", "yaar", "matlab", "actually", "basically"
- Do NOT use overly formal Hindi — it sounds unnatural on video.
`.trim();
  }

  if (l === 'tamil') {
    return `
LANGUAGE: Tamil
- Write in conversational Tamil with natural Tamil-English code-switching (Tanglish).
- Reference Tamil cultural markers: Kollywood, Pongal, Kaavadi, Chennai weather, TN politics when relevant.
- Use natural connectors: "naan solren", "paarunga", "theriyuma", "correctaa"
- Respect formal/informal register difference for educational vs entertainment content.
`.trim();
  }

  if (l === 'telugu') {
    return `
LANGUAGE: Telugu
- Write in natural Telugu with Telugu-English mixing as common in Telugu YouTube culture.
- Reference: Tollywood, Hyderabad, Vizag, Telugu festivals, regional food.
- Natural connectors: "cheppali antey", "ardham ayyinda?", "chudandi", "idi correct"
`.trim();
  }

  if (l === 'kannada') {
    return `
LANGUAGE: Kannada
- Write in natural Kannada with Kannada-English mixing common in Bangalore creator culture.
- Reference: Bengaluru startup culture, Ugadi, Mysuru, Kannada cinema, regional identity.
- Natural connectors: "nodri", "gottaytha?", "heli", "swalpа"
`.trim();
  }

  if (l === 'marathi') {
    return `
LANGUAGE: Marathi
- Write in natural Marathi with Marathi-English mixing.
- Reference: Mumbai, Pune startup scene, Ganesh Chaturthi, Marathi cultural pride.
- Natural connectors: "bagha", "kalatay ka?", "aata", "actually"
`.trim();
  }

  return `
LANGUAGE: English (International)
- Use clear, jargon-free international English accessible to a global audience.
- Avoid heavy Americanisms, British-isms, or region-specific slang unless audience is clearly regional.
- Conversational but authoritative tone.
`.trim();
}

// ─── Research Prompt ──────────────────────────────────────────────────────────
export function buildResearchPrompt({ niche, platform, creatorType, language, tone }) {
  const platformCtx = getPlatformContext(platform, creatorType);
  const langCtx     = getLanguageContext(language);

  return `
You are the Research Agent for Studio AI. Your job: find the STRONGEST possible content angle
for this creator, then select the most psychologically powerful hook.

CREATOR BRIEF:
- Niche: ${niche}
- Platform: ${platform}
- Creator Type: ${creatorType}
- Target Language: ${language || 'English'}
- Tone: ${tone || 'Educational'}

${platformCtx}

${langCtx}

YOUR TASK:
1. Think of 3 content angles that are trending, evergreen-with-urgency, or strongly underserved in this niche right now.
2. For each angle: identify the audience emotion it triggers, the search intent, and why it's right NOW.
3. Select the single strongest angle for this platform and audience.
4. Write 3 different hook options with different psychological triggers for the chosen angle.
5. Select the best hook with deep psychological analysis.
6. Identify the best upload timing based on this niche's audience behaviour.
7. Describe a thumbnail concept that would stop the scroll.

PSYCHOLOGICAL TRIGGERS to use for hooks (use each trigger at most once across all 3 options):
- LOSS_AVERSION: Frame around what the viewer is losing/missing/at risk of
- CURIOSITY_GAP: Open a specific question the viewer MUST know the answer to  
- PATTERN_INTERRUPT: Counterintuitive or shocking claim that breaks expectations
- SOCIAL_PROOF: Specific numbers, stories, or examples that create FOMO
- DIRECT_PROMISE: Clear, specific, measurable outcome the viewer will get
- AUTHORITY_CHALLENGE: Challenge a common belief held by the audience
- IDENTITY: Speaks directly to who the viewer believes they are

OUTPUT FORMAT — Return ONLY this JSON, nothing else:

{
  "trending_angles": [
    {
      "topic": "specific content topic as a working title",
      "why_now": "why this angle is relevant or urgent right now — specific reason",
      "audience_emotion": "primary emotion this triggers (fear, curiosity, pride, urgency, etc.)",
      "search_intent": "what the viewer is searching for when they'd find this",
      "urgency_level": "HIGH | MEDIUM | EVERGREEN"
    },
    {
      "topic": "...",
      "why_now": "...",
      "audience_emotion": "...",
      "search_intent": "...",
      "urgency_level": "..."
    },
    {
      "topic": "...",
      "why_now": "...",
      "audience_emotion": "...",
      "search_intent": "...",
      "urgency_level": "..."
    }
  ],
  "chosen_topic": "the single best topic title — punchy, specific, production-ready",
  "chosen_topic_reasoning": "2-3 sentences explaining WHY this angle beats the other two for this specific platform and audience",
  "target_audience_description": "specific description of who watches this content — age, pain point, awareness level, what they've already tried",
  "competitor_gap": "what top channels in this niche are NOT covering that creates an opening for this creator",
  "content_warning": null,
  "hook_options": [
    {
      "hook_text": "complete, word-for-word hook — exactly as it would be spoken or shown on screen",
      "psychological_trigger": "LOSS_AVERSION",
      "trigger_explanation": "why this trigger works specifically for this audience and topic",
      "ctr_strength": "HIGH | MEDIUM | LOW",
      "risk_factor": "any risk with this hook (over-promise, niche misalignment, etc.) or null",
      "best_for_platform": "which platform or format this hook is strongest on"
    },
    {
      "hook_text": "...",
      "psychological_trigger": "CURIOSITY_GAP",
      "trigger_explanation": "...",
      "ctr_strength": "...",
      "risk_factor": "...",
      "best_for_platform": "..."
    },
    {
      "hook_text": "...",
      "psychological_trigger": "PATTERN_INTERRUPT",
      "trigger_explanation": "...",
      "ctr_strength": "...",
      "risk_factor": "...",
      "best_for_platform": "..."
    }
  ],
  "chosen_hook": "exact copy of the best hook_text from hook_options above",
  "chosen_hook_trigger": "the psychological trigger of the chosen hook",
  "chosen_hook_deep_analysis": "3-4 sentences explaining the neuroscience/psychology of why this hook works: what's happening in the viewer's brain, what they fear losing, what question it forces open, and why they CANNOT scroll past it",
  "best_upload_time": {
    "day": "day of week",
    "time": "HH:MM local time",
    "reasoning": "why this specific day/time based on this niche's audience behaviour patterns"
  },
  "thumbnail_concept": "detailed thumbnail brief: subject, text overlay (3 words max), colour contrast, emotion on face if applicable, background element — specific enough to brief a designer or use with AI image tools"
}
`.trim();
}

// ─── Creator Prompt ───────────────────────────────────────────────────────────
export function buildCreatorPrompt({
  niche, platform, tone, language, creatorType,
  chosenTopic, chosenHook, hookTrigger, hookAnalysis,
  competitorGap, targetAudience,
}) {
  const p = platform.toLowerCase();

  // Detect content format from platform string
  const isShortForm = p.includes('reels') || p.includes('tiktok') || p.includes('shorts');
  const isBlog      = p.includes('blog');
  const isPodcast   = p.includes('podcast');
  const isLongForm  = !isShortForm && !isBlog && !isPodcast;

  const platformCtx = getPlatformContext(platform, creatorType);
  const langCtx     = getLanguageContext(language);

  const formatInstructions = isShortForm
    ? `FORMAT: Short-form video (Reels/TikTok/Shorts)
- Full script: 140-200 words (60-90 seconds spoken at natural pace)
- Structure: Hook (0-3s) → Payoff setup (3-10s) → Value delivery (10-50s) → CTA (50-60s)
- ZERO slow intros. ZERO filler. Every second must earn its place.
- scenes array: 4-6 scenes maximum
- Voiceover lines must be punchy, fast-moving, energetic`
    : isBlog
    ? `FORMAT: Blog / Written Article
- Full script = full article body: 1,400-2,000 words
- Structure: Hook intro paragraph → H2 section 1 → H2 section 2 → H2 section 3 → H2 section 4 → Conclusion CTA
- Write in first-person or second-person depending on tone
- scenes array represents article sections (H2 blocks), each with: section heading, full paragraph content, internal link suggestion, visual_direction (image/infographic brief)
- Include subpoints, examples, and data within each section`
    : isPodcast
    ? `FORMAT: Podcast Episode
- Full script: 1,200-2,000 words (8-15 minutes at natural speaking pace)
- Structure: Cold open (compelling clip tease) → Intro (host signature + episode value prop) → Main content in 3-4 chapters → Listener CTA
- scenes represent episode chapters, each with timestamps
- Write as natural spoken audio — contractions, pauses, emphasis cues`
    : `FORMAT: Long-form YouTube Video
- Full script: minimum 900 words (8-15 minutes on screen at natural speaking pace)
- Structure: Hook (0-30s) → Pattern interrupt 1 (30-60s) → Value section 1 → Pattern interrupt 2 → Value section 2 → Value section 3 → Retention bridge → CTA
- scenes array: 8-14 scenes
- Include B-roll directions and visual overlay text for each scene`;

  return `
You are the Creator Agent for Studio AI. Your job: write a COMPLETE, PRODUCTION-READY script
and full scene breakdown that a creator can film or record TODAY without any additional work.

CREATOR BRIEF:
- Niche: ${niche}
- Platform: ${platform}
- Creator Type: ${creatorType}
- Language: ${language || 'English'}
- Tone: ${tone || 'Educational'}

RESEARCH CONTEXT (use this to inform the script):
- Chosen Topic: ${chosenTopic}
- Chosen Hook: ${chosenHook}
- Hook Trigger: ${hookTrigger || 'CURIOSITY_GAP'}
- Hook Psychology: ${hookAnalysis || 'Use curiosity gap to pull viewers through the content'}
- Target Audience: ${targetAudience || 'Content creators and digital entrepreneurs'}
- Competitor Gap: ${competitorGap || 'Most creators cover surface-level advice — go deeper'}

${formatInstructions}

${platformCtx}

${langCtx}

SCRIPT QUALITY STANDARDS:
- The hook must be the EXACT hook from research: "${chosenHook}" — start the script with this verbatim
- Write exactly how a HUMAN speaks — contractions, natural rhythm, conversational energy
- Include at minimum 2 pattern interrupts (unexpected statistic, story shift, format change, direct audience address)
- Every transition must pull the viewer forward: end each section with a micro-curiosity gap
- CTAs must be embedded naturally — not bolted on at the end like an afterthought
- Shorts script must be a SEPARATE standalone 60-second version, fully written out

OUTPUT FORMAT — Return ONLY this JSON, nothing else:

{
  "full_script": "The complete word-for-word script. Start with the hook verbatim. Write every word the creator will say. No placeholders, no (pause here), no [insert example] — write the actual example. Minimum ${isShortForm ? '150' : isBlog ? '1400' : '900'} words.",
  "estimated_duration": "${isShortForm ? '60-90 seconds' : isBlog ? '7-10 min read' : '8-15 minutes'}",
  "word_count": 0,
  "scenes": [
    {
      "scene_number": 1,
      "timestamp_start": "0:00",
      "timestamp_end": "0:28",
      "section_type": "HOOK | INTRO | MAIN_CONTENT | PATTERN_INTERRUPT | RETENTION_BRIDGE | CTA | OUTRO",
      "voiceover": "exact words spoken in this scene — complete, word for word",
      "visual_direction": "what the camera/screen should show — specific shot type, movement, on-screen action",
      "overlay_text": "text to display on screen during this scene (null if none)",
      "b_roll_search_term": "specific search term to find B-roll footage on Pexels/Shutterstock or null",
      "tone_direction": "how to deliver this section — emotional cue for the creator",
      "retention_technique": "specific technique used to retain viewers at this moment"
    }
  ],
  "hook_breakdown": {
    "hook_text": "${chosenHook}",
    "trigger_type": "${hookTrigger || 'CURIOSITY_GAP'}",
    "psychological_mechanism": "what is happening neurologically when the viewer hears or reads this hook",
    "why_first_3_seconds": "why this hook works specifically in the first 3 seconds of the platform context",
    "what_viewer_is_thinking": "exact internal monologue of the viewer when they encounter this hook",
    "what_happens_if_hook_fails": "what the viewer does if the hook doesn't land — and why this hook avoids that failure"
  },
  "shorts_script": "Complete standalone 60-second short-form script. Different from the long-form — optimised for Shorts/Reels. Start with the hook. Every line earns its place. Written word-for-word. ${isShortForm ? 'Same as full_script for short-form platforms.' : 'This is a separate compressed version.'}",
  "pattern_interrupts": [
    {
      "timestamp": "approximate timestamp where this occurs",
      "technique": "name of the technique (Hard Cut, Shocking Stat, Direct Address, Story Pivot, Visual Contrast, Callback)",
      "script_line": "the exact line or cue from the script where this interrupt happens"
    }
  ],
  "cta_options": [
    {
      "cta_text": "complete word-for-word CTA as spoken in the video",
      "placement": "where in the video this CTA appears (timestamp or section name)",
      "goal": "subscribe | like | comment | follow | link in bio | email signup | purchase",
      "why_it_works": "psychological reason this CTA works at this placement for this audience"
    },
    {
      "cta_text": "...",
      "placement": "...",
      "goal": "...",
      "why_it_works": "..."
    }
  ],
  "content_notes": null
}
`.trim();
}

// ─── Publisher Prompt ─────────────────────────────────────────────────────────
export function buildPublisherPrompt({
  niche, platform, language, creatorType,
  chosenTopic, chosenHook, scriptExcerpt, targetAudience,
}) {
  const platformCtx = getPlatformContext(platform, creatorType);
  const langCtx     = getLanguageContext(language);

  // Use first 500 chars of script for context
  const excerpt = (scriptExcerpt || '').slice(0, 500);

  return `
You are the Publisher Agent for Studio AI. Your job: create complete, platform-optimised
distribution assets for this piece of content — fully written, ready to paste and publish.

CONTENT BRIEF:
- Niche: ${niche}
- Platform: ${platform}
- Creator Type: ${creatorType}
- Language: ${language || 'English'}
- Topic: ${chosenTopic}
- Hook: ${chosenHook}
- Target Audience: ${targetAudience || 'Content creators and digital entrepreneurs'}

SCRIPT OPENING (use for context):
"${excerpt}"

${platformCtx}

${langCtx}

TASK:
Write fully production-ready distribution assets for YouTube, Instagram, TikTok, Blog SEO,
and a cross-platform repurpose plan. Every field must be completely written — no templates,
no placeholders, no "add your link here" strings.

OUTPUT FORMAT — Return ONLY this JSON, nothing else:

{
  "youtube": {
    "title_options": [
      {
        "title": "complete YouTube title — specific, front-loaded, under 60 chars",
        "character_count": 0,
        "primary_strategy": "CTR strategy used (number, power word, curiosity, etc.)",
        "ctr_prediction": "HIGH | MEDIUM | LOW",
        "reasoning": "why this title gets clicks based on psychology and search"
      },
      {
        "title": "...",
        "character_count": 0,
        "primary_strategy": "...",
        "ctr_prediction": "...",
        "reasoning": "..."
      },
      {
        "title": "...",
        "character_count": 0,
        "primary_strategy": "...",
        "ctr_prediction": "...",
        "reasoning": "..."
      }
    ],
    "recommended_title": "exact copy of the best title from title_options",
    "description": "Full YouTube description, 210-240 words. Start with a hook sentence (not 'In this video'). Include: what the viewer will learn (3 bullet points with actual content), timestamps for main chapters (e.g. 0:00 Intro, 1:30 Main Point), relevant keywords naturally embedded, and a call to action at the end. For social links write: Follow on Instagram | link in bio — never use bracket placeholders. Zero square brackets anywhere in this field. Fully written and complete.",
    "tags": ["tag1", "tag2", "tag3", "tag4", "tag5", "tag6", "tag7", "tag8", "tag9", "tag10", "tag11", "tag12"],
    "primary_keyword": "the single main keyword this video targets",
    "secondary_keywords": ["kw1", "kw2", "kw3", "kw4", "kw5"],
    "category_suggestion": "YouTube category name",
    "end_screen_recommendation": "specific end screen strategy: what to show, when to show it, and why",
    "card_recommendation": "which cards to add, at what timestamps, and why"
  },
  "instagram": {
    "caption": "Full Instagram caption, 175-250 words. Open with the hook (no @ tag, no hashtags at start). Include the key insight in the first 2 lines (before the fold). 3-4 short punchy paragraphs. End with a save/share CTA. Hashtags go BELOW this caption in the hashtags field. Fully written.",
    "hashtags": ["hashtag1", "hashtag2", "hashtag3", "hashtag4", "hashtag5", "hashtag6", "hashtag7", "hashtag8", "hashtag9", "hashtag10", "hashtag11", "hashtag12", "hashtag13", "hashtag14", "hashtag15", "hashtag16", "hashtag17", "hashtag18", "hashtag19", "hashtag20"],
    "reel_cover_text": "3-5 word text overlay for the Reel cover thumbnail",
    "story_slide_text": "text for an IG Story swipe-up slide that teases this Reel — under 15 words",
    "save_cta": "one-line save CTA to use in the caption"
  },
  "tiktok": {
    "caption": "TikTok caption under 100 characters — punchy, uses 1-2 keywords, ends with curiosity",
    "hashtags": ["#hashtag1", "#hashtag2", "#hashtag3", "#hashtag4", "#hashtag5"],
    "first_frame_text": "text to show in the first frame of the TikTok — under 8 words, maximum curiosity",
    "trending_sound_category": "type of trending sound that would fit this content (upbeat, storytelling, dramatic, etc.)",
    "duet_stitch_suggestion": "specific suggestion for encouraging Duets or Stitches — what to ask viewers to react to"
  },
  "blog": {
    "seo_title": "SEO-optimised blog post title — includes primary keyword, under 60 chars",
    "meta_description": "Meta description. HARD LIMIT: 150 characters maximum. Count every character including spaces. Include the primary keyword and a compelling reason to click. Stop writing at 150 characters.",
    "url_slug": "url-friendly-slug-with-hyphens",
    "primary_keyword": "main keyword targeted",
    "secondary_keywords": ["kw1", "kw2", "kw3", "kw4"],
    "suggested_h2_headers": [
      "H2 Header 1 — specific, includes keyword variant",
      "H2 Header 2 — addresses main audience pain point",
      "H2 Header 3 — covers the core solution/insight",
      "H2 Header 4 — conclusion/actionable next steps"
    ]
  },
  "cross_platform_repurpose": [
    {
      "platform": "platform name",
      "format": "specific format (e.g., Twitter thread, LinkedIn article, Email newsletter, Pinterest infographic)",
      "specific_angle": "how to reframe this exact content for that platform's audience and format — 2 sentences"
    },
    {
      "platform": "...",
      "format": "...",
      "specific_angle": "..."
    },
    {
      "platform": "...",
      "format": "...",
      "specific_angle": "..."
    }
  ],
  "posting_schedule": {
    "primary_post_day": "day of week",
    "primary_post_time": "HH:MM (creator's local time)",
    "reasoning": "specific reason based on niche audience behaviour, not generic advice",
    "follow_up_story_timing": "when to post the follow-up Story/Shorts/community post — e.g., +6 hours after main post"
  },
  "seven_day_content_plan": [
    {
      "day": 1,
      "content_type": "Main Video | Short | Story | Community Post | Blog | Reel | Podcast",
      "topic_angle": "specific angle to cover — full working title",
      "platform": "primary platform for this piece",
      "repurpose_from": "what this is repurposed from or 'Original'"
    },
    { "day": 2, "content_type": "...", "topic_angle": "...", "platform": "...", "repurpose_from": "..." },
    { "day": 3, "content_type": "...", "topic_angle": "...", "platform": "...", "repurpose_from": "..." },
    { "day": 4, "content_type": "...", "topic_angle": "...", "platform": "..", "repurpose_from": "..." },
    { "day": 5, "content_type": "...", "topic_angle": "...", "platform": "...", "repurpose_from": "..." },
    { "day": 6, "content_type": "...", "topic_angle": "...", "platform": "...", "repurpose_from": "..." },
    { "day": 7, "content_type": "...", "topic_angle": "...", "platform": "...", "repurpose_from": "..." }
  ]
}
`.trim();
}

// ─── Creator Prompt (Compact) ─────────────────────────────────────────────────
// Used as fallback when the full prompt exceeds Gemini's token output limit.
// Produces the SAME required fields but with tighter length constraints.
// Target: fits within 6000 output tokens for any platform/format.
export function buildCreatorPromptCompact({
  niche, platform, tone, language, creatorType,
  chosenTopic, chosenHook, hookTrigger, hookAnalysis,
  competitorGap, targetAudience,
}) {
  const p = platform.toLowerCase();
  const isShortForm = p.includes('reels') || p.includes('tiktok') || p.includes('shorts');
  const isBlog      = p.includes('blog');
  const isPodcast   = p.includes('podcast');

  const scriptTarget = isShortForm ? '150-200' : isBlog ? '700-900' : isPodcast ? '600-800' : '500-700';
  const sceneTarget  = isShortForm ? '4' : '6';
  const format       = isShortForm ? 'Short-form (60-90s)' : isBlog ? 'Blog article' : isPodcast ? 'Podcast episode' : 'YouTube video';

  return `
You are the Creator Agent for Studio AI. Write a COMPLETE, production-ready script.
This is a compact generation — fit everything within the token budget by being precise, not verbose.
Every field must be fully written. No truncation. No placeholders.

BRIEF:
- Niche: ${niche}
- Platform: ${platform} (${format})
- Creator Type: ${creatorType}
- Language: ${language || 'English'}
- Tone: ${tone || 'Educational'}
- Topic: ${chosenTopic}
- Hook: "${chosenHook}"
- Hook Trigger: ${hookTrigger || 'CURIOSITY_GAP'}
- Audience: ${targetAudience || 'Content creators and digital entrepreneurs'}
- Competitor Gap: ${competitorGap || 'Go deeper than surface-level advice'}

COMPACT RULES:
- full_script: ${scriptTarget} words. Complete, performable, word-for-word. Start with the exact hook.
- scenes: exactly ${sceneTarget} scenes. Each scene voiceover 1-2 sentences. No padding.
- shorts_script: 80-120 words. Standalone 60-second version.
- All other fields: concise but complete. 1-2 sentences per explanation field.
- JSON must be syntactically valid and complete. Close every string, array, and object.

Return ONLY this JSON:

{
  "full_script": "Complete word-for-word script starting with: ${chosenHook.replace(/"/g, '\\"')}",
  "estimated_duration": "${isShortForm ? '60-90 seconds' : isBlog ? '5-7 min read' : '5-8 minutes'}",
  "word_count": 0,
  "scenes": [
    {
      "scene_number": 1,
      "timestamp_start": "0:00",
      "timestamp_end": "0:30",
      "section_type": "HOOK",
      "voiceover": "exact words for this scene",
      "visual_direction": "what to show on screen",
      "overlay_text": null,
      "b_roll_search_term": "search term for stock footage or null",
      "tone_direction": "how to deliver this",
      "retention_technique": "technique used here"
    }
  ],
  "hook_breakdown": {
    "hook_text": "${chosenHook.replace(/"/g, '\\"')}",
    "trigger_type": "${hookTrigger || 'CURIOSITY_GAP'}",
    "psychological_mechanism": "what happens neurologically when viewer encounters this hook",
    "why_first_3_seconds": "why this works in the first 3 seconds on this platform",
    "what_viewer_is_thinking": "exact internal monologue of the viewer",
    "what_happens_if_hook_fails": "what viewer does and why this hook avoids that"
  },
  "shorts_script": "Complete standalone 60-second script. Different from full_script. Every word written.",
  "pattern_interrupts": [
    {
      "timestamp": "approximate time",
      "technique": "technique name",
      "script_line": "exact line from the script"
    }
  ],
  "cta_options": [
    {
      "cta_text": "exact word-for-word CTA",
      "placement": "where in the video",
      "goal": "subscribe | like | comment | follow | purchase",
      "why_it_works": "why this CTA works here"
    },
    {
      "cta_text": "second CTA option",
      "placement": "where in the video",
      "goal": "subscribe | like | comment | follow | purchase",
      "why_it_works": "why this CTA works here"
    }
  ],
  "content_notes": null
}
`.trim();
}