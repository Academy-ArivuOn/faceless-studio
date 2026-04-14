export const runtime     = 'nodejs';
export const maxDuration = 30;

import { guardAgentWithContext }   from '@/app/api/agents/plan-guard-with-chain';
import { buildTrendSpyPrompt }     from '@/packages/agents/pro-prompts';
import { callGeminiWithRetry }     from '@/packages/gemini';
import { sanitise }                from '@/packages/agents/validator';

export async function POST(request) {
  const startMs = Date.now();

  const guard = await guardAgentWithContext(request, 'trend-spy');
  if (guard.blocked) return guard.response;

  try {
    let body;
    try { body = await request.json(); }
    catch { return Response.json({ error: 'Invalid JSON in request body' }, { status: 400 }); }

    const { niche, platform, language = 'English' } = body;

    if (!niche || niche.trim().length < 2)
      return Response.json({ error: 'niche is required (minimum 2 characters)' }, { status: 400 });
    if (!platform)
      return Response.json({ error: 'platform is required' }, { status: 400 });

    const cleanInput = {
      niche:    niche.trim().slice(0, 150),
      platform: platform.trim().slice(0, 80),
      language: (language || 'English').trim().slice(0, 50),
      _dnaBlock:   guard.dnaBlock   || '',
      _chainBlock: guard.chainBlock || '',
    };

    const prompt = buildTrendSpyPrompt(cleanInput);

    let result;
    try {
      result = await callGeminiWithRetry({ prompt, agentType: 'trendSpy', maxTokens: 2500 });
    } catch (err) {
      console.error('[trend-spy] Gemini error:', err.message);
      return Response.json(
        { error: 'Trend Spy failed to generate brief. Please try again.',
          detail: process.env.NODE_ENV === 'development' ? err.message : undefined },
        { status: 500 }
      );
    }

    const data = sanitise(result.data);

    if (data.generated_at === 'ISO timestamp placeholder' || !data.generated_at) {
      data.generated_at = new Date().toISOString();
    }

    return Response.json({
      success: true,
      data,
      meta: {
        agent:       'trend-spy',
        duration_ms: Date.now() - startMs,
        trend_count: data.trending_now?.length || 0,
        idea_count:  data.content_ideas_today?.length || 0,
        dna_injected: !!guard.dnaBlock,
        session_id:  guard.sessionId,
      },
    });

  } catch (err) {
    console.error('[trend-spy] Unexpected error:', err.message);
    return Response.json(
      { error: 'An unexpected error occurred in the Trend Spy agent.',
        detail: process.env.NODE_ENV === 'development' ? err.message : undefined },
      { status: 500 }
    );
  }
}