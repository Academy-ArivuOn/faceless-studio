export const runtime     = 'nodejs';
export const maxDuration = 90; // full script generation needs time; 60 was tight

import { buildCreatorPrompt, buildCreatorPromptCompact } from '@/lib/agents/prompts';
import { callGeminiWithRetry }                           from '@/lib/gemini';
import { validateCreator, sanitise }                     from '@/lib/agents/validator';

// ─── POST Handler ─────────────────────────────────────────────────────────────
export async function POST(request) {
  const startMs = Date.now();

  try {
    // ── 1. Parse Body ────────────────────────────────────────────────────────
    let body;
    try {
      body = await request.json();
    } catch {
      return Response.json({ error: 'Invalid JSON in request body' }, { status: 400 });
    }

    const {
      niche,
      platform,
      creatorType,
      chosenTopic,
      chosenHook,
      tone           = 'Educational',
      language       = 'English',
      hookTrigger    = 'CURIOSITY_GAP',
      hookAnalysis   = '',
      competitorGap  = '',
      targetAudience = '',
    } = body;

    // ── 2. Validate Required Fields ──────────────────────────────────────────
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

    // ── 3. Clean Input ────────────────────────────────────────────────────────
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
    };

    // ── 4. Phase 1: Full prompt at 7500 tokens ────────────────────────────────
    // 7500 tokens gives ~5500 words of output — enough for any format including
    // long-form YouTube (900+ word script + 10+ scenes + hook breakdown + shorts script)
    let finalData       = null;
    let finalValidation = null;

    const fullPrompt = buildCreatorPrompt(cleanInput);

    try {
      const result1 = await callGeminiWithRetry({
        prompt:    fullPrompt,
        agentType: 'creator',
        maxTokens: 7500,
      });

      // Auto-calculate word_count if Gemini omitted it
      if (!result1.data.word_count && result1.data.full_script) {
        result1.data.word_count = result1.data.full_script
          .split(/\s+/).filter(Boolean).length;
      }

      const valid1 = validateCreator(result1.data);

      if (!valid1.critical) {
        finalData       = sanitise(result1.data);
        finalValidation = valid1;

        if (result1.repaired) {
          console.warn('[creator] Phase 1 JSON was repaired (truncation recovery succeeded)');
        }
      } else {
        console.warn('[creator] Phase 1 failed validation:', valid1.issues.map(i => i.message));
      }
    } catch (err1) {
      console.error('[creator] Phase 1 error:', err1.message);
    }

    // ── 5. Phase 2: Compact prompt at 8192 tokens (fallback) ─────────────────
    // If Phase 1 failed (validation OR truncation), switch to a more concise
    // prompt structure that produces smaller JSON but retains all required fields.
    if (!finalData) {
      console.warn('[creator] Falling back to compact prompt at max tokens (8192)');

      try {
        const compactPrompt = buildCreatorPromptCompact(cleanInput);

        const result2 = await callGeminiWithRetry({
          prompt:    compactPrompt,
          agentType: 'creator',
          maxTokens: 8192, // absolute maximum — this MUST fit
        });

        if (!result2.data.word_count && result2.data.full_script) {
          result2.data.word_count = result2.data.full_script
            .split(/\s+/).filter(Boolean).length;
        }

        const valid2 = validateCreator(result2.data);

        if (!valid2.critical) {
          finalData       = sanitise(result2.data);
          finalValidation = valid2;
        } else {
          console.error('[creator] Phase 2 also failed validation:', valid2.issues.map(i => i.message));
          // Return structured error — do NOT throw
          return Response.json(
            {
              error:  'Script generation failed quality check after 2 attempts. Please try again.',
              issues: process.env.NODE_ENV === 'development' ? valid2.issues : undefined,
            },
            { status: 500 }
          );
        }
      } catch (err2) {
        console.error('[creator] Phase 2 error:', err2.message);
        return Response.json(
          {
            error:  'Script generation failed after 2 attempts. Please try again.',
            detail: process.env.NODE_ENV === 'development' ? err2.message : undefined,
          },
          { status: 500 }
        );
      }
    }

    // ── 6. Return ─────────────────────────────────────────────────────────────
    if (finalValidation.warningCount > 0) {
      console.warn(`[creator] ${finalValidation.warningCount} non-critical warnings`);
    }

    return Response.json({
      success: true,
      data:    finalData,
      meta: {
        agent:         'creator',
        duration_ms:   Date.now() - startMs,
        script_length: finalData.full_script?.length || 0,
        scene_count:   finalData.scenes?.length       || 0,
        word_count:    finalData.word_count            || 0,
        error_count:   finalValidation.errorCount,
        warning_count: finalValidation.warningCount,
      },
    });

  } catch (err) {
    console.error('[creator] Unexpected top-level error:', err);
    return Response.json(
      {
        error:  'An unexpected error occurred in the creator agent.',
        detail: process.env.NODE_ENV === 'development' ? err.message : undefined,
      },
      { status: 500 }
    );
  }
}