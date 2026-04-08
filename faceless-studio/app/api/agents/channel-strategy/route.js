export const runtime     = 'nodejs';
export const maxDuration = 60;

import { guardAgent }                  from '@/lib/plan-guard';
import { buildChannelStrategyPrompt }  from '@/lib/agents/pro-prompts';
import { callGeminiWithRetry }         from '@/lib/gemini';
import { sanitise }                    from '@/lib/agents/validator';

export async function POST(request) {
  const startMs = Date.now();

  const guard = await guardAgent(request, 'channel-strategy');
  if (guard.blocked) return guard.response;

  try {
    let body;
    try { body = await request.json(); }
    catch { return Response.json({ error: 'Invalid JSON in request body' }, { status: 400 }); }

    const {
      niche, platform,
      currentSubscribers = '0',
      monetisationGoal   = '',
      contentFrequency   = '',
      biggestChallenge   = '',
      targetAudience     = '',
    } = body;

    if (!niche || niche.trim().length < 2)
      return Response.json({ error: 'niche is required' }, { status: 400 });
    if (!platform)
      return Response.json({ error: 'platform is required' }, { status: 400 });

    const cleanInput = {
      niche:              niche.trim().slice(0, 150),
      platform:           platform.trim().slice(0, 80),
      currentSubscribers: String(currentSubscribers || '0').trim().slice(0, 50),
      monetisationGoal:   (monetisationGoal || '').trim().slice(0, 300),
      contentFrequency:   (contentFrequency || '').trim().slice(0, 150),
      biggestChallenge:   (biggestChallenge || '').trim().slice(0, 300),
      targetAudience:     (targetAudience || '').trim().slice(0, 300),
    };

    const prompt = buildChannelStrategyPrompt(cleanInput);

    let result;
    try {
      result = await callGeminiWithRetry({ prompt, agentType: 'creator', maxTokens: 5000 });
    } catch (err) {
      console.error('[channel-strategy] Gemini error:', err.message);
      return Response.json(
        { error: 'Channel Strategy agent failed to build roadmap. Please try again.',
          detail: process.env.NODE_ENV === 'development' ? err.message : undefined },
        { status: 500 }
      );
    }

    const data = sanitise(result.data);

    if (!Array.isArray(data.roadmap) || data.roadmap.length < 3) {
      console.warn('[channel-strategy] Incomplete roadmap returned');
    }

    return Response.json({
      success: true,
      data,
      meta: {
        agent:          'channel-strategy',
        duration_ms:    Date.now() - startMs,
        phases:         data.roadmap?.length || 0,
        pillars:        data.content_pillars?.length || 0,
        growth_tactics: data.growth_tactics?.length || 0,
      },
    });

  } catch (err) {
    console.error('[channel-strategy] Unexpected error:', err.message);
    return Response.json(
      { error: 'An unexpected error occurred in the Channel Strategy agent.',
        detail: process.env.NODE_ENV === 'development' ? err.message : undefined },
      { status: 500 }
    );
  }
}