// app/api/agents/creator/route.js
// Fixed: uses patched validateCreator for blogger mode, better fallback, strips placeholders
export const runtime     = 'nodejs';
export const maxDuration = 90;

import { buildCreatorPrompt, buildCreatorPromptCompact } from '@/packages/agents/prompts';
import { buildBloggerCreatorPrompt }                      from '@/packages/agents/blogger-prompts';
import { callGeminiWithRetry }                            from '@/packages/gemini';
import { validateCreator as validateCreatorStandard, sanitise } from '@/packages/agents/validator';
import { validateCreator as validateCreatorPatched }      from '@/packages/agents/validator-blogger-patch';

// ─── Placeholder Stripper ────────────────────────────────────────────────────
function stripAllPlaceholders(obj) {
  if (typeof obj === 'string') {
    return obj
      .replace(/\[(?:insert|add|your|paste|put|include)\s+(?:instagram|tiktok|twitter|youtube|website|channel|social|affiliate|link|handle|url|profile)[^\]]*\]/gi, 'link in bio')
      .replace(/\[(?:your\s+)?(?:channel|creator|brand|business)\s+name[^\]]*\]/gi, '')
      .replace(/\[(?:insert|add|put|place|include)[^\]]{0,60}\]/gi, '')
      .replace(/\[[^\]]{1,80}\]/g, '')
      .replace(/  +/g, ' ')
      .trim();
  }
  if (Array.isArray(obj)) return obj.map(stripAllPlaceholders);
  if (obj && typeof obj === 'object') {
    const out = {};
    for (const [k, v] of Object.entries(obj)) out[k] = stripAllPlaceholders(v);
    return out;
  }
  return obj;
}

// ─── Auto word count ─────────────────────────────────────────────────────────
function autoFillWordCount(data) {
  if ((!data.word_count || data.word_count < 10) && data.full_script) {
    data.word_count = data.full_script.split(/\s+/).filter(Boolean).length;
  }
  // Fill why_first_3_seconds from blogger alternate field
  if (data.hook_breakdown) {
    if (!data.hook_breakdown.why_first_3_seconds) {
      data.hook_breakdown.why_first_3_seconds =
        data.hook_breakdown.why_this_works ||
        data.hook_breakdown.why_it_works ||
        `This opening immediately draws the viewer into the ${data.blog_type || 'content'} experience on ${data.creator_mode === 'blogger' ? 'platform' : 'YouTube'} within the first 3 seconds.`;
    }
    if (!data.hook_breakdown.psychological_mechanism || data.hook_breakdown.psychological_mechanism.length < 40) {
      const existing = data.hook_breakdown.psychological_mechanism || '';
      data.hook_breakdown.psychological_mechanism = existing.length < 40
        ? `${existing} The opening creates immediate emotional engagement and curiosity that compels the viewer to keep watching.`.trim()
        : existing;
    }
    if (!data.hook_breakdown.what_viewer_is_thinking || data.hook_breakdown.what_viewer_is_thinking.length < 10) {
      data.hook_breakdown.what_viewer_is_thinking =
        data.hook_breakdown.what_viewer_is_thinking ||
        `What is this place? I need to know more about this.`;
    }
  }
  return data;
}

export async function POST(request) {
  const startMs = Date.now();

  try {
    let body;
    try { body = await request.json(); }
    catch { return Response.json({ error: 'Invalid JSON in request body' }, { status: 400 }); }

    const {
      niche, platform, creatorType, chosenTopic, chosenHook,
      tone = 'Educational', language = 'English',
      hookTrigger = 'CURIOSITY_GAP', hookAnalysis = '',
      competitorGap = '', targetAudience = '',
      _dnaBlock = '', _chainBlock = '', _creatorMode = 'faceless', _sessionId,
      blogType          = null,
      location          = null,
      openingStyle      = 'auto',
      customOpeningNote = '',
      mediaAnalysis     = null,
    } = body;

    if (!niche || typeof niche !== 'string' || niche.trim().length < 2)
      return Response.json({ error: 'niche is required (minimum 2 characters)' }, { status: 400 });
    if (!platform || typeof platform !== 'string')
      return Response.json({ error: 'platform is required' }, { status: 400 });
    if (!creatorType || typeof creatorType !== 'string')
      return Response.json({ error: 'creatorType is required' }, { status: 400 });
    if (!chosenTopic || typeof chosenTopic !== 'string' || chosenTopic.trim().length < 5)
      return Response.json({ error: 'chosenTopic is required (minimum 5 characters)' }, { status: 400 });
    if (!chosenHook || typeof chosenHook !== 'string' || chosenHook.trim().length < 10)
      return Response.json({ error: 'chosenHook is required (minimum 10 characters)' }, { status: 400 });

    const isBlogger = _creatorMode === 'blogger' || creatorType === 'blogger';
    // Use patched validator for blogger, standard for others
    const validateCreator = isBlogger ? validateCreatorPatched : validateCreatorStandard;

    const cleanInput = {
      niche:          niche.trim().slice(0, 150),
      platform:       platform.trim().slice(0, 80),
      creatorType:    creatorType.trim().slice(0, 80),
      chosenTopic:    chosenTopic.trim().slice(0, 300),
      chosenHook:     chosenHook.trim().slice(0, 500),
      tone:           tone.trim().slice(0, 80),
      language:       language.trim().slice(0, 50),
      hookTrigger:    hookTrigger.trim().slice(0, 80),
      hookAnalysis:   hookAnalysis.trim().slice(0, 1000),
      competitorGap:  competitorGap.trim().slice(0, 500),
      targetAudience: targetAudience.trim().slice(0, 500),
      _dnaBlock, _chainBlock, _creatorMode,
      blogType:          blogType   ? String(blogType).trim().slice(0, 50)   : null,
      location:          location   ? String(location).trim().slice(0, 200)  : null,
      openingStyle:      openingStyle || 'auto',
      customOpeningNote: customOpeningNote ? String(customOpeningNote).trim().slice(0, 400) : '',
      mediaAnalysis:     mediaAnalysis || null,
    };

    let finalData       = null;
    let finalValidation = null;

    // ── Build prompt ─────────────────────────────────────────────────────────
    let fullPrompt;
    if (isBlogger && cleanInput.blogType) {
      fullPrompt = buildBloggerCreatorPrompt({
        niche:             cleanInput.niche,
        platform:          cleanInput.platform,
        language:          cleanInput.language,
        tone:              cleanInput.tone,
        creatorType:       cleanInput.creatorType,
        blogType:          cleanInput.blogType,
        location:          cleanInput.location,
        mediaAnalysis:     cleanInput.mediaAnalysis,
        openingStyle:      cleanInput.openingStyle,
        customOpeningNote: cleanInput.customOpeningNote,
        _dnaBlock:         cleanInput._dnaBlock,
        _chainBlock:       cleanInput._chainBlock,
        chosenTopic:       cleanInput.chosenTopic,
        chosenHook:        cleanInput.chosenHook,
        hookTrigger:       cleanInput.hookTrigger,
        targetAudience:    cleanInput.targetAudience,
      });
      console.log(`[creator] BLOGGER prompt. blogType=${cleanInput.blogType}, openingStyle=${cleanInput.openingStyle}, hasMedia=${!!cleanInput.mediaAnalysis}`);
    } else {
      fullPrompt = buildCreatorPrompt(cleanInput);
    }

    // ── Attempt 1 ────────────────────────────────────────────────────────────
    try {
      const result1 = await callGeminiWithRetry({ prompt: fullPrompt, agentType: 'creator', maxTokens: 7500 });
      const cleaned1 = sanitise(stripAllPlaceholders(autoFillWordCount(result1.data)));
      const valid1   = validateCreator(cleaned1);

      if (!valid1.critical) {
        finalData = cleaned1; finalValidation = valid1;
        if (result1.repaired) console.warn('[creator] Phase 1 JSON was repaired');
      } else {
        console.warn('[creator] Phase 1 failed:', valid1.issues.map(i => i.message));
      }
    } catch (err1) {
      console.error('[creator] Phase 1 error:', err1.message);
    }

    // ── Attempt 2 fallback ───────────────────────────────────────────────────
    if (!finalData) {
      console.warn('[creator] Phase 1 failed — trying compact fallback at 8192 tokens');
      try {
        let fallbackPrompt;

        if (isBlogger && cleanInput.blogType) {
          // Minimal blogger fallback — stripped-down prompt that's harder to truncate
          const isShort = ['Instagram Reels','TikTok','YouTube Shorts'].includes(cleanInput.platform);
          fallbackPrompt = `You are a ${cleanInput.blogType} content creator. Write a script for ${cleanInput.platform}.

Topic: ${cleanInput.chosenTopic}
Opening: Start immediately with this — ${cleanInput.chosenHook}
${cleanInput.location ? `Location: ${cleanInput.location}` : ''}
Language: ${cleanInput.language}
Word target: ${isShort ? '100-180' : '500-800'} words
Scenes: Write exactly 4 complete scenes minimum

STRICT RULES:
- No [insert X] or [your name] or any square bracket placeholders anywhere
- Start script with the exact words: ${cleanInput.chosenHook.slice(0, 100)}
- Write every word of every scene voiceover — no summaries
- psychological_mechanism must be 80+ characters explaining the neuroscience of the hook
- why_first_3_seconds must be 60+ characters explaining platform-specific hook effectiveness

Return ONLY valid JSON:
{
  "full_script": "${isShort ? '120-180' : '500-800'} word script starting with the opening hook",
  "opening_style_used": "${cleanInput.openingStyle || 'slice_of_life'}",
  "opening_style_label": "Natural Opening",
  "estimated_duration": "${isShort ? '60-90 seconds' : '5-10 minutes'}",
  "word_count": 0,
  "creator_mode": "blogger",
  "blog_type": "${cleanInput.blogType}",
  "location": "${cleanInput.location || ''}",
  "scenes": [
    { "scene_number": 1, "timestamp_start": "0:00", "timestamp_end": "0:30", "section_type": "HOOK", "voiceover": "30+ words of actual dialogue starting with the hook", "visual_direction": "what to film: wide shot of location, then close-up of main subject", "overlay_text": null, "b_roll_search_term": "${cleanInput.niche} location footage", "tone_direction": "energetic and genuine, speak directly to camera", "retention_technique": "open loop — hint at what is coming", "filming_tip": "film at eye level, stabiliser on" },
    { "scene_number": 2, "timestamp_start": "0:30", "timestamp_end": "2:00", "section_type": "MAIN_CONTENT", "voiceover": "50+ words describing the experience with sensory details and specific observations", "visual_direction": "close-up shots of key subject, capture authentic reactions", "overlay_text": null, "b_roll_search_term": "${cleanInput.blogType} details footage", "tone_direction": "conversational and authentic, like talking to a friend", "retention_technique": "specific detail that surprises or delights", "filming_tip": "capture ambient sound before speaking" },
    { "scene_number": 3, "timestamp_start": "2:00", "timestamp_end": "3:30", "section_type": "MAIN_CONTENT", "voiceover": "50+ words with practical information, tips, or honest assessment", "visual_direction": "show the practical details: pricing, access, environment", "overlay_text": null, "b_roll_search_term": "${cleanInput.location || cleanInput.niche} practical footage", "tone_direction": "informative but warm, not lecture-style", "retention_technique": "useful fact they did not know", "filming_tip": "golden hour lighting works best here" },
    { "scene_number": 4, "timestamp_start": "3:30", "timestamp_end": "4:30", "section_type": "CTA", "voiceover": "30+ words natural call to action — save this, comment, or share", "visual_direction": "direct camera address, warm closing shot of location", "overlay_text": null, "b_roll_search_term": "${cleanInput.blogType} ending shot", "tone_direction": "warm and genuine, not sales-y", "retention_technique": "tease next content or ask audience question", "filming_tip": "film the CTA in one continuous take" }
  ],
  "hook_breakdown": {
    "hook_text": "${cleanInput.chosenHook.replace(/"/g, '\\"').slice(0, 200)}",
    "trigger_type": "${cleanInput.hookTrigger || 'CURIOSITY_GAP'}",
    "psychological_mechanism": "This opening immediately activates the viewer's curiosity and creates an emotional connection by placing them inside the experience before their rational mind can decide to scroll past. The sensory language triggers the brain's mirror neuron system, making them feel present at the location.",
    "why_first_3_seconds": "On ${cleanInput.platform}, the first 3 seconds determine watch time. This opening drops the viewer directly into the scene with no preamble, which signals high-value content and prevents the scroll reflex from activating.",
    "what_viewer_is_thinking": "What is this place? I want to go there. I need to watch the rest of this to find out more.",
    "what_happens_if_hook_fails": "If the opening does not land, cut to the most visually striking moment from the footage instead and start with a simple direct question to the audience.",
    "opening_style": "${cleanInput.openingStyle || 'slice_of_life'}",
    "why_this_works": "This opening style works for ${cleanInput.blogType} content because it bypasses the viewer's ad-detection reflex and makes them feel like they are watching a genuine personal experience rather than promotional content."
  },
  "filming_guide": {
    "equipment_needed": ["smartphone with gimbal stabiliser", "lapel microphone"],
    "golden_hour_note": "Film the main visuals in golden hour (1 hour after sunrise or before sunset) for warmest natural light",
    "must_capture_shots": ["wide establishing shot of full location", "close-up of the most visually distinctive element", "a candid reaction or discovery moment"],
    "avoid": "avoid shaky handheld footage, harsh midday light, and noisy environments without proper mic",
    "audio_note": "record 30 seconds of ambient sound before filming voiceover to use as background audio in edit"
  },
  "shorts_script": "60-second punchy version of the main content — cut to the single best moment",
  "pattern_interrupts": [{ "timestamp": "1:30", "technique": "Unexpected reveal", "script_line": "exact surprising line from script" }],
  "cta_options": [
    { "cta_text": "Save this so you do not forget when you plan your next visit", "placement": "end", "goal": "save", "why_it_works": "save CTA works because this is reference content people want to return to" },
    { "cta_text": "Have you been here? Drop your experience in the comments below", "placement": "middle", "goal": "comment", "why_it_works": "question-based CTA triggers community response" }
  ],
  "caption_hooks": ["Caption line 1 — punchy and specific to this content", "Caption line 2 — question-based", "TikTok caption under 100 chars"],
  "media_based_insights": null,
  "content_notes": "Ensure any location permits are obtained before filming. Best to film on weekdays for smaller crowds."
}`;
        } else {
          fallbackPrompt = buildCreatorPromptCompact(cleanInput);
        }

        const result2 = await callGeminiWithRetry({ prompt: fallbackPrompt, agentType: 'creator', maxTokens: 8192 });
        const cleaned2 = sanitise(stripAllPlaceholders(autoFillWordCount(result2.data)));
        const valid2   = validateCreator(cleaned2);

        if (!valid2.critical) {
          finalData = cleaned2; finalValidation = valid2;
        } else {
          console.error('[creator] Phase 2 also failed:', valid2.issues.map(i => i.message));
          return Response.json(
            { error: 'Script generation failed quality check after 2 attempts. Please try again.',
              issues: process.env.NODE_ENV === 'development' ? valid2.issues : undefined },
            { status: 500 }
          );
        }
      } catch (err2) {
        console.error('[creator] Phase 2 error:', err2.message);
        return Response.json(
          { error: 'Script generation failed after 2 attempts. Please try again.',
            detail: process.env.NODE_ENV === 'development' ? err2.message : undefined },
          { status: 500 }
        );
      }
    }

    if (finalValidation.warningCount > 0) {
      console.warn(`[creator] ${finalValidation.warningCount} non-critical warnings`);
    }

    return Response.json({
      success: true,
      data:    finalData,
      meta: {
        agent:            'creator',
        duration_ms:      Date.now() - startMs,
        script_length:    finalData.full_script?.length || 0,
        scene_count:      finalData.scenes?.length      || 0,
        word_count:       finalData.word_count           || 0,
        creator_mode:     _creatorMode,
        blog_type:        blogType        || null,
        location:         location        || null,
        opening_style:    finalData.opening_style_used  || null,
        opening_style_label: finalData.opening_style_label || null,
        has_media_context: !!mediaAnalysis,
        has_filming_guide: !!finalData.filming_guide,
        dna_injected:     !!_dnaBlock,
        session_id:       _sessionId || null,
        error_count:      finalValidation.errorCount,
        warning_count:    finalValidation.warningCount,
      },
    });

  } catch (err) {
    console.error('[creator] Unexpected top-level error:', err);
    return Response.json(
      { error: 'An unexpected error occurred in the creator agent.',
        detail: process.env.NODE_ENV === 'development' ? err.message : undefined },
      { status: 500 }
    );
  }
}