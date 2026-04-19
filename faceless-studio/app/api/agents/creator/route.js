// app/api/agents/creator/route.js
export const runtime     = 'nodejs';
export const maxDuration = 90;

import { buildCreatorPrompt, buildCreatorPromptCompact } from '@/packages/agents/prompts';
import { buildBloggerCreatorPrompt }                      from '@/packages/agents/blogger-prompts';
import { callGeminiWithRetry }                            from '@/packages/gemini';
import { validateCreator, sanitise }                      from '@/packages/agents/validator';

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
      // Vlogger / blogger fields
      blogType     = null,
      location     = null,
      // NEW blogger fields
      openingStyle       = 'auto',
      customOpeningNote  = '',
      mediaAnalysis      = null,   // object from blogger-vision API
    } = body;

    // ── Validation ───────────────────────────────────────────────────────────
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
      _dnaBlock,
      _chainBlock,
      _creatorMode,
      // Blogger fields
      blogType:          blogType   ? String(blogType).trim().slice(0, 50)   : null,
      location:          location   ? String(location).trim().slice(0, 200)  : null,
      openingStyle:      openingStyle || 'auto',
      customOpeningNote: customOpeningNote ? String(customOpeningNote).trim().slice(0, 400) : '',
      mediaAnalysis:     mediaAnalysis || null,
    };

    let finalData       = null;
    let finalValidation = null;

    // ── Choose prompt builder ────────────────────────────────────────────────
    let fullPrompt;

    if (isBlogger && cleanInput.blogType) {
      // Use the specialised blogger prompt builder
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

      console.log(`[creator] Using BLOGGER prompt builder. blogType=${cleanInput.blogType}, openingStyle=${cleanInput.openingStyle}, hasMedia=${!!cleanInput.mediaAnalysis}`);
    } else {
      // Standard content creator prompt
      fullPrompt = buildCreatorPrompt(cleanInput);
    }

    // ── Attempt 1 ───────────────────────────────────────────────────────────
    try {
      const result1 = await callGeminiWithRetry({
        prompt:    fullPrompt,
        agentType: 'creator',
        maxTokens: 7500,
      });

      if (!result1.data.word_count && result1.data.full_script) {
        result1.data.word_count = result1.data.full_script.split(/\s+/).filter(Boolean).length;
      }

      const valid1 = validateCreator(result1.data);

      if (!valid1.critical) {
        finalData       = sanitise(result1.data);
        finalValidation = valid1;
        if (result1.repaired) console.warn('[creator] Phase 1 JSON was repaired');
      } else {
        console.warn('[creator] Phase 1 failed validation:', valid1.issues.map(i => i.message));
      }
    } catch (err1) {
      console.error('[creator] Phase 1 error:', err1.message);
    }

    // ── Fallback Attempt 2 ───────────────────────────────────────────────────
    if (!finalData) {
      console.warn('[creator] Falling back to compact prompt at max tokens (8192)');
      try {
        // For blogger fallback, use a simplified blogger prompt or standard compact
        let compactPrompt;
        if (isBlogger && cleanInput.blogType) {
          // Simplified blogger prompt for fallback
          const blogConfig = {
            travel: 'journey narrative with sensory details',
            advertisement: 'walk through the experience authentically',
            food: 'tasting journey with texture and flavour focus',
            culture: 'story and exploration of heritage',
            event: 'live coverage energy',
            product_review: 'honest review journey',
            lifestyle: 'day narrative authentically',
          };
          const structure = blogConfig[cleanInput.blogType] || 'authentic experience narrative';

          compactPrompt = `
You are writing a ${cleanInput.blogType} blog script for ${cleanInput.platform}.
Niche: ${cleanInput.niche}
Topic: ${cleanInput.chosenTopic}
${cleanInput.location ? `Location: ${cleanInput.location}` : ''}
Language: ${cleanInput.language}

CRITICAL: Do NOT start with fear-based hooks, money warnings, or hype.
Start with a natural, human moment — sensory detail, slice of life, or cultural reference.
Structure: ${structure}

Write a complete, word-for-word performable script.

Return ONLY this JSON:
{
  "full_script": "Complete script starting naturally (${cleanInput.platform.toLowerCase().includes('reels') || cleanInput.platform.toLowerCase().includes('tiktok') || cleanInput.platform.toLowerCase().includes('shorts') ? '150-200' : '600-900'} words)",
  "opening_style_used": "${cleanInput.openingStyle === 'auto' ? 'slice_of_life' : cleanInput.openingStyle}",
  "opening_style_label": "Natural Opening",
  "estimated_duration": "${cleanInput.platform.toLowerCase().includes('reels') ? '60-90 seconds' : '5-10 minutes'}",
  "word_count": 0,
  "creator_mode": "blogger",
  "blog_type": "${cleanInput.blogType}",
  "location": "${cleanInput.location || ''}",
  "scenes": [
    { "scene_number": 1, "timestamp_start": "0:00", "timestamp_end": "0:30", "section_type": "HOOK", "voiceover": "opening scene voiceover", "visual_direction": "what to film", "overlay_text": null, "b_roll_search_term": "search term", "tone_direction": "delivery note", "retention_technique": "technique", "filming_tip": "practical advice" }
  ],
  "hook_breakdown": {
    "hook_text": "${cleanInput.chosenHook.replace(/"/g, '\\"')}",
    "opening_style": "${cleanInput.openingStyle}",
    "why_this_works": "explanation",
    "psychological_mechanism": "what happens",
    "what_viewer_is_thinking": "viewer reaction",
    "what_happens_if_hook_fails": "plan b"
  },
  "filming_guide": {
    "equipment_needed": ["smartphone or camera", "lapel mic or directional mic"],
    "golden_hour_note": "film in golden hour for best results",
    "must_capture_shots": ["establishing wide shot", "close-up detail shot", "reaction shot"],
    "avoid": "shaky footage without stabiliser",
    "audio_note": "capture ambient sound before speaking"
  },
  "shorts_script": "60-second version",
  "pattern_interrupts": [{ "timestamp": "1:00", "technique": "Visual cut", "script_line": "mid-script interrupt" }],
  "cta_options": [
    { "cta_text": "Save this for your next trip", "placement": "end", "goal": "save", "why_it_works": "saves for later reference" },
    { "cta_text": "Comment your experience below", "placement": "middle", "goal": "comment", "why_it_works": "engagement boost" }
  ],
  "caption_hooks": ["Opening caption line 1", "Opening caption line 2", "TikTok caption under 100 chars"],
  "media_based_insights": null,
  "content_notes": null
}
`.trim();
        } else {
          compactPrompt = buildCreatorPromptCompact(cleanInput);
        }

        const result2 = await callGeminiWithRetry({ prompt: compactPrompt, agentType: 'creator', maxTokens: 8192 });

        if (!result2.data.word_count && result2.data.full_script) {
          result2.data.word_count = result2.data.full_script.split(/\s+/).filter(Boolean).length;
        }

        const valid2 = validateCreator(result2.data);

        if (!valid2.critical) {
          finalData       = sanitise(result2.data);
          finalValidation = valid2;
        } else {
          console.error('[creator] Phase 2 also failed validation:', valid2.issues.map(i => i.message));
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
        agent:             'creator',
        duration_ms:       Date.now() - startMs,
        script_length:     finalData.full_script?.length || 0,
        scene_count:       finalData.scenes?.length       || 0,
        word_count:        finalData.word_count            || 0,
        creator_mode:      _creatorMode,
        blog_type:         blogType         || null,
        location:          location         || null,
        opening_style:     finalData.opening_style_used  || null,
        opening_style_label: finalData.opening_style_label || null,
        has_media_context: !!mediaAnalysis,
        has_filming_guide: !!finalData.filming_guide,
        dna_injected:      !!_dnaBlock,
        session_id:        _sessionId || null,
        error_count:       finalValidation.errorCount,
        warning_count:     finalValidation.warningCount,
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