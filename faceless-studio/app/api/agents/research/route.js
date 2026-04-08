export const runtime     = 'nodejs';
export const maxDuration = 30;

import { buildResearchPrompt }            from '@/lib/agents/prompts';
import { callGeminiWithRetry }            from '@/lib/gemini';
import { validateResearch, sanitise }     from '@/lib/agents/validator';
import { getTrendsForResearch, getEmptyTrends } from '@/lib/trends/fetcher';

export async function POST(request) {
  const startMs = Date.now();

  try {
    let body;
    try { body = await request.json(); }
    catch { return Response.json({ error: 'Invalid JSON in request body' }, { status: 400 }); }

    const {
      niche, platform, creatorType,
      language = 'English', tone = 'Educational',
      _dnaBlock = '', _chainBlock = '', _sessionId,
    } = body;

    if (!niche || typeof niche !== 'string' || niche.trim().length < 2)
      return Response.json({ error: 'niche is required (minimum 2 characters)' }, { status: 400 });
    if (!platform || typeof platform !== 'string')
      return Response.json({ error: 'platform is required' }, { status: 400 });
    if (!creatorType || typeof creatorType !== 'string')
      return Response.json({ error: 'creatorType is required' }, { status: 400 });

    const cleanInput = {
      niche:       niche.trim().slice(0, 150),
      platform:    platform.trim().slice(0, 80),
      creatorType: creatorType.trim().slice(0, 80),
      language:    (language || 'English').trim().slice(0, 50),
      tone:        (tone || 'Educational').trim().slice(0, 80),
    };

    let trendData;
    try {
      trendData = await getTrendsForResearch(cleanInput.niche, cleanInput.platform);
      if (trendData.trends.length === 0) trendData = getEmptyTrends();
    } catch (trendError) {
      console.warn('[research] Trend fetching failed, using fallback:', trendError.message);
      trendData = getEmptyTrends();
    }

    const prompt = buildResearchPrompt({
      ...cleanInput,
      trendData,
      _dnaBlock,
      _chainBlock,
    });

    let geminiResult;
    try {
      geminiResult = await callGeminiWithRetry({ prompt, agentType: 'research', maxTokens: 1800 });
    } catch (geminiError) {
      console.error('[research] Gemini call failed:', geminiError.message);
      return Response.json(
        { error: 'Research agent failed to generate content. Please try again.',
          detail: process.env.NODE_ENV === 'development' ? geminiError.message : undefined },
        { status: 500 }
      );
    }

    const rawData   = geminiResult.data;
    const validation = validateResearch(rawData);

    if (validation.critical) {
      console.error('[research] Critical validation failure:', validation.issues);
      return Response.json(
        { error: 'Research output failed quality check. Please try again.',
          detail: process.env.NODE_ENV === 'development' ? validation.issues : undefined },
        { status: 500 }
      );
    }

    if (validation.warningCount > 0) {
      console.warn(`[research] ${validation.warningCount} warnings:`, validation.issues.filter(i => i.severity === 'warning'));
    }

    const sanitised  = sanitise(rawData);
    const durationMs = Date.now() - startMs;

    return Response.json({
      success: true,
      data: sanitised,
      meta: {
        agent:               'research',
        duration_ms:         durationMs,
        error_count:         validation.errorCount,
        warning_count:       validation.warningCount,
        hook_count:          sanitised.hook_options?.length || 0,
        angle_count:         sanitised.trending_angles?.length || 0,
        trends_used:         trendData.source,
        trends_confidence:   trendData.low_confidence ? 'low' : 'high',
        dna_injected:        !!_dnaBlock,
        session_id:          _sessionId || null,
      },
    });

  } catch (err) {
    console.error('[research] Unexpected error:', err);
    return Response.json(
      { error: 'An unexpected error occurred in the research agent.',
        detail: process.env.NODE_ENV === 'development' ? err.message : undefined },
      { status: 500 }
    );
  }
}