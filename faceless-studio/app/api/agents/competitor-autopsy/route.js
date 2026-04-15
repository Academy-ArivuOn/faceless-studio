export const runtime     = 'nodejs';
export const maxDuration = 45;

import { guardAgentWithContext }   from '@/app/api/agents/plan-guard-with-chain';
import { buildCompetitorAutopsyPrompt }  from '@/packages/agents/pro-prompts';
import { callGeminiWithRetry }           from '@/packages/gemini';
import { sanitise }                      from '@/packages/agents/validator';

export async function POST(request) {
  const startMs = Date.now();

  const guard = await guardAgentWithContext(request, 'competitor-autopsy');
  if (guard.blocked) return guard.response;

  try {
    let body;
    try { body = await request.json(); }
    catch { return Response.json({ error: 'Invalid JSON in request body' }, { status: 400 }); }

    const {
      channelName, niche, platform,
      subscriberCount = '',
    } = body;

    if (!channelName || channelName.trim().length < 2)
      return Response.json({ error: 'channelName is required (minimum 2 characters)' }, { status: 400 });
    if (!niche || niche.trim().length < 2)
      return Response.json({ error: 'niche is required' }, { status: 400 });
    if (!platform)
      return Response.json({ error: 'platform is required' }, { status: 400 });

    const cleanInput = {
      channelName:     channelName.trim().slice(0, 150),
      niche:           niche.trim().slice(0, 150),
      platform:        platform.trim().slice(0, 80),
      subscriberCount: String(subscriberCount || '').trim().slice(0, 50),
      _dnaBlock:   guard.dnaBlock   || '',
      _chainBlock: guard.chainBlock || '',
    };

    const prompt = buildCompetitorAutopsyPrompt(cleanInput);

    let result;
    try {
      result = await callGeminiWithRetry({ prompt, agentType: 'research', maxTokens: 3500 });
    } catch (err) {
      console.error('[competitor-autopsy] Gemini error:', err.message);
      return Response.json(
        { error: 'Competitor Autopsy failed to analyse channel. Please try again.',
          detail: process.env.NODE_ENV === 'development' ? err.message : undefined },
        { status: 500 }
      );
    }

    const data = sanitise(result.data);

    const gapCount = data.content_gaps?.length || 0;
    if (gapCount < 2) {
      console.warn('[competitor-autopsy] Fewer than 2 content gaps returned');
    }

    return Response.json({
      success: true,
      data,
      meta: {
        agent:          'competitor-autopsy',
        duration_ms:    Date.now() - startMs,
        gaps_found:     gapCount,
        weaknesses:     data.weaknesses?.length || 0,
        battle_plan:    !!data.battle_plan,
        dna_injected: !!guard.dnaBlock,
        session_id:  guard.sessionId,
      },
    });

  } catch (err) {
    console.error('[competitor-autopsy] Unexpected error:', err.message);
    return Response.json(
      { error: 'An unexpected error occurred in the Competitor Autopsy agent.',
        detail: process.env.NODE_ENV === 'development' ? err.message : undefined },
      { status: 500 }
    );
  }
}