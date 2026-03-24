export const runtime     = 'nodejs';
export const maxDuration = 60; // Script generation needs more time

import { buildCreatorPrompt }              from '@/lib/agents/prompts';
import { callGeminiWithRetry }             from '@/lib/gemini';
import { validateCreator, sanitise } from '@/lib/agents/validator';

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
      tone         = 'Educational',
      language     = 'English',
      hookTrigger  = 'CURIOSITY_GAP',
      hookAnalysis = '',
      competitorGap = '',
      targetAudience = '',
    } = body;

    // ── 2. Validate Required Fields ──────────────────────────────────────────
    if (!niche || typeof niche !== 'string' || niche.trim().length < 2) {
      return Response.json({ error: 'niche is required (minimum 2 characters)' }, { status: 400 });
    }
    if (!platform || typeof platform !== 'string') {
      return Response.json({ error: 'platform is required' }, { status: 400 });
    }
    if (!creatorType || typeof creatorType !== 'string') {
      return Response.json({ error: 'creatorType is required' }, { status: 400 });
    }
    if (!chosenTopic || typeof chosenTopic !== 'string' || chosenTopic.trim().length < 5) {
      return Response.json({ error: 'chosenTopic is required (minimum 5 characters)' }, { status: 400 });
    }
    if (!chosenHook || typeof chosenHook !== 'string' || chosenHook.trim().length < 10) {
      return Response.json({ error: 'chosenHook is required (minimum 10 characters)' }, { status: 400 });
    }

    // ── 3. Sanitise Input ────────────────────────────────────────────────────
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

    // ── 4. Build Prompt & Call Gemini ────────────────────────────────────────
    const prompt = buildCreatorPrompt(cleanInput);

    let geminiResult;
    try {
      geminiResult = await callGeminiWithRetry({
        prompt,
        agentType: 'creator',
        maxTokens: 3500,
      });
    } catch (geminiError) {
      console.error('[creator] Gemini call failed:', geminiError.message);
      return Response.json(
        {
          error:  'Creator agent failed to generate the script. Please try again.',
          detail: process.env.NODE_ENV === 'development' ? geminiError.message : undefined,
        },
        { status: 500 }
      );
    }

    const rawData = geminiResult.data;

    // Auto-calculate word_count if Gemini returned 0 or omitted it
    if (!rawData.word_count && rawData.full_script) {
      rawData.word_count = rawData.full_script.split(/\s+/).filter(Boolean).length;
    }

    // ── 5. Validate Output ────────────────────────────────────────────────────
    const validation = validateCreator(rawData);

    if (validation.critical) {
      console.error('[creator] Critical validation failure:', validation.issues);
      return Response.json(
        {
          error:  'Script output failed quality check. Please try again.',
          detail: process.env.NODE_ENV === 'development' ? validation.issues : undefined,
        },
        { status: 500 }
      );
    }

    if (validation.warningCount > 0) {
      console.warn(`[creator] ${validation.warningCount} warnings:`, validation.issues.filter(i => i.severity === 'warning'));
    }

    // ── 6. Sanitise & Return ──────────────────────────────────────────────────
    const sanitised = sanitise(rawData);
    const durationMs = Date.now() - startMs;

    return Response.json({
      success: true,
      data:    sanitised,
      meta: {
        agent:         'creator',
        duration_ms:   durationMs,
        script_length: sanitised.full_script?.length || 0,
        scene_count:   sanitised.scenes?.length       || 0,
        word_count:    sanitised.word_count            || 0,
        error_count:   validation.errorCount,
        warning_count: validation.warningCount,
      },
    });

  } catch (err) {
    console.error('[creator] Unexpected error:', err);
    return Response.json(
      {
        error:  'An unexpected error occurred in the creator agent.',
        detail: process.env.NODE_ENV === 'development' ? err.message : undefined,
      },
      { status: 500 }
    );
  }
}