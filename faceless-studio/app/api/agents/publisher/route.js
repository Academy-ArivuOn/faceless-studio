export const runtime     = 'nodejs';
export const maxDuration = 30;

import { buildPublisherPrompt }              from '@/lib/agents/prompts';
import { callGeminiWithRetry }               from '@/lib/gemini';
import { validatePublisher, sanitise } from '@/lib/agents/validator';

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
      scriptExcerpt  = '',
      targetAudience = '',
      language       = 'English',
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
      // Pass only first 500 chars of script for context (keeps token count low)
      scriptExcerpt:  scriptExcerpt.trim().slice(0, 500),
      targetAudience: targetAudience.trim().slice(0, 500),
      language:       language.trim().slice(0, 50),
    };

    // ── 4. Build Prompt & Call Gemini ────────────────────────────────────────
    const prompt = buildPublisherPrompt(cleanInput);

    let geminiResult;
    try {
      geminiResult = await callGeminiWithRetry({
        prompt,
        agentType: 'publisher',
        maxTokens: 2500,
      });
    } catch (geminiError) {
      console.error('[publisher] Gemini call failed:', geminiError.message);
      return Response.json(
        {
          error:  'Publisher agent failed to generate distribution assets. Please try again.',
          detail: process.env.NODE_ENV === 'development' ? geminiError.message : undefined,
        },
        { status: 500 }
      );
    }

    const rawData = geminiResult.data;

    // ── 5. Validate Output ────────────────────────────────────────────────────
    const validation = validatePublisher(rawData);

    if (validation.critical) {
      console.error('[publisher] Critical validation failure:', validation.issues);
      return Response.json(
        {
          error:  'Publisher output failed quality check. Please try again.',
          detail: process.env.NODE_ENV === 'development' ? validation.issues : undefined,
        },
        { status: 500 }
      );
    }

    if (validation.warningCount > 0) {
      console.warn(`[publisher] ${validation.warningCount} warnings:`, validation.issues.filter(i => i.severity === 'warning'));
    }

    // ── 6. Sanitise & Return ──────────────────────────────────────────────────
    const sanitised = sanitise(rawData);
    const durationMs = Date.now() - startMs;

    return Response.json({
      success: true,
      data:    sanitised,
      meta: {
        agent:         'publisher',
        duration_ms:   durationMs,
        title_options: sanitised.youtube?.title_options?.length || 0,
        tag_count:     sanitised.youtube?.tags?.length           || 0,
        ig_hashtags:   sanitised.instagram?.hashtags?.length     || 0,
        error_count:   validation.errorCount,
        warning_count: validation.warningCount,
      },
    });

  } catch (err) {
    console.error('[publisher] Unexpected error:', err);
    return Response.json(
      {
        error:  'An unexpected error occurred in the publisher agent.',
        detail: process.env.NODE_ENV === 'development' ? err.message : undefined,
      },
      { status: 500 }
    );
  }
}