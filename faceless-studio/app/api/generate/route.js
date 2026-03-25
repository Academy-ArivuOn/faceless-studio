// D:\faceless-studio\faceless-studio\app\api\generate\route.js
export const runtime     = 'nodejs';
export const maxDuration = 120; // Full pipeline: research + creator + publisher

import { verifyAuth, checkUsage, incrementUsage, saveGeneration, updateStreak } from '@/lib/supabase';

// ─── Internal Agent Caller ────────────────────────────────────────────────────
// Calls an agent route internally and validates the response.
async function callAgent(agentName, payload, authHeader) {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
  const url     = `${baseUrl}/api/agents/${agentName}`;

  const response = await fetch(url, {
    method:  'POST',
    headers: {
      'Content-Type':  'application/json',
      'Authorization': authHeader,                        // forward auth token
      'x-internal':    process.env.INTERNAL_SECRET || '', // optional security header
    },
    body: JSON.stringify(payload),
  });

  const json = await response.json();

  if (!response.ok || !json.success) {
    const err = new Error(json.error || `${agentName} agent returned status ${response.status}`);
    err.agentName = agentName;
    err.statusCode = response.status;
    throw err;
  }

  return { data: json.data, meta: json.meta };
}

// ─── POST Handler ─────────────────────────────────────────────────────────────
export async function POST(request) {
  const pipelineStart = Date.now();
  const agentDurations = {};

  try {
    // ── Step 1: Verify Auth ────────────────────────────────────────────────
    let user;
    try {
      user = await verifyAuth(request);
    } catch (authError) {
      return Response.json(
        { error: authError.message || 'Authentication required' },
        { status: authError.statusCode || 401 }
      );
    }

    // ── Step 2: Check Usage Limit ─────────────────────────────────────────
    let usageCheck;
    try {
      usageCheck = await checkUsage(user.id);
    } catch (usageError) {
      console.error('[generate] Usage check failed:', usageError.message);
      return Response.json(
        { error: 'Failed to check usage limits. Please try again.' },
        { status: 500 }
      );
    }

    if (!usageCheck.allowed) {
      return Response.json(
        {
          error:     usageCheck.reason || 'Monthly generation limit reached',
          code:      'UPGRADE_REQUIRED',
          plan:      usageCheck.plan,
          used:      usageCheck.used,
          limit:     usageCheck.limit,
          reset_date: usageCheck.reset_date,
        },
        { status: 403 }
      );
    }

    // ── Step 3: Parse & Validate Input ────────────────────────────────────
    let body;
    try {
      body = await request.json();
    } catch {
      return Response.json({ error: 'Invalid JSON in request body' }, { status: 400 });
    }

    const {
      niche,
      platform    = 'YouTube',
      creatorType = 'general',
      tone        = 'Educational',
      language    = 'English',
    } = body;

    if (!niche || typeof niche !== 'string' || niche.trim().length < 2) {
      return Response.json(
        { error: 'niche is required (minimum 2 characters)' },
        { status: 400 }
      );
    }

    const cleanInput = {
      niche:       niche.trim().slice(0, 150),
      platform:    platform.toString().trim().slice(0, 80),
      creatorType: creatorType.toString().trim().slice(0, 80),
      tone:        tone.toString().trim().slice(0, 80),
      language:    language.toString().trim().slice(0, 50),
    };

    // Forward the original auth header to agent sub-calls
    const authHeader = request.headers.get('Authorization') || '';

    // ── Step 4: Research Agent ─────────────────────────────────────────────
    let research;
    {
      const t0 = Date.now();
      try {
        const result = await callAgent('research', cleanInput, authHeader);
        research = result.data;
        agentDurations.research = Date.now() - t0;
      } catch (err) {
        console.error('[generate] Research agent failed:', err.message);
        return Response.json(
          {
            error: 'Content research failed. Please try again with a more specific niche.',
            stage: 'research',
            detail: process.env.NODE_ENV === 'development' ? err.message : undefined,
          },
          { status: 500 }
        );
      }
    }

    // ── Step 5: Creator Agent ──────────────────────────────────────────────
    let creator;
    {
      const t0 = Date.now();
      try {
        const result = await callAgent('creator', {
          ...cleanInput,
          chosenTopic:    research.chosen_topic,
          chosenHook:     research.chosen_hook,
          hookTrigger:    research.chosen_hook_trigger,
          hookAnalysis:   research.chosen_hook_deep_analysis,
          competitorGap:  research.competitor_gap,
          targetAudience: research.target_audience_description,
        }, authHeader);
        creator = result.data;
        agentDurations.creator = Date.now() - t0;
      } catch (err) {
        console.error('[generate] Creator agent failed:', err.message);
        return Response.json(
          {
            error: 'Script generation failed. Please try again.',
            stage: 'creator',
            detail: process.env.NODE_ENV === 'development' ? err.message : undefined,
          },
          { status: 500 }
        );
      }
    }

    // ── Step 6: Publisher Agent ────────────────────────────────────────────
    let publisher;
    {
      const t0 = Date.now();
      try {
        const result = await callAgent('publisher', {
          ...cleanInput,
          chosenTopic:    research.chosen_topic,
          chosenHook:     research.chosen_hook,
          // Pass only the first 500 chars of the script for context
          scriptExcerpt:  (creator.full_script || '').slice(0, 500),
          targetAudience: research.target_audience_description,
        }, authHeader);
        publisher = result.data;
        agentDurations.publisher = Date.now() - t0;
      } catch (err) {
        console.error('[generate] Publisher agent failed:', err.message);
        return Response.json(
          {
            error: 'Distribution asset generation failed. Please try again.',
            stage: 'publisher',
            detail: process.env.NODE_ENV === 'development' ? err.message : undefined,
          },
          { status: 500 }
        );
      }
    }

    // ── Step 7: Persist results (non-critical — parallel) ─────────────────
    const totalDurationMs = Date.now() - pipelineStart;

    const [saveResult, streakResult, usageResult] = await Promise.allSettled([
      saveGeneration({
        userId:     user.id,
        input:      cleanInput,
        research,
        creator,
        publisher,
        durationMs: totalDurationMs,
      }),
      updateStreak(user.id),
      incrementUsage(user.id),
    ]);

    const generationId = saveResult.status === 'fulfilled' ? saveResult.value : null;
    const newStreak    = streakResult.status === 'fulfilled' ? streakResult.value : null;

    if (saveResult.status === 'rejected')  console.error('[generate] saveGeneration failed:',  saveResult.reason?.message);
    if (streakResult.status === 'rejected') console.error('[generate] updateStreak failed:',   streakResult.reason?.message);
    if (usageResult.status === 'rejected')  console.error('[generate] incrementUsage failed:', usageResult.reason?.message);

    // ── Step 8: Return Full Package ────────────────────────────────────────
    return Response.json({
      success:      true,
      generationId,
      input:        cleanInput,
      research,
      creator,
      publisher,
      meta: {
        total_duration_ms: totalDurationMs,
        agent_durations:   agentDurations,
        streak:  newStreak,
        usage: {
          plan:      usageCheck.plan,
          used:      (usageCheck.used || 0) + 1,
          limit:     usageCheck.limit,
          remaining: usageCheck.remaining !== null ? Math.max(0, (usageCheck.remaining || 0) - 1) : null,
          reset_date: usageCheck.reset_date,
        },
      },
    });

  } catch (err) {
    console.error('[generate] Unexpected top-level error:', err);
    return Response.json(
      {
        error:  'An unexpected error occurred. Please try again.',
        detail: process.env.NODE_ENV === 'development' ? err.message : undefined,
      },
      { status: 500 }
    );
  }
}