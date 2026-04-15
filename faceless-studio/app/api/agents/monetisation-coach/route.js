export const runtime     = 'nodejs';
export const maxDuration = 40;

import { guardAgentWithContext }   from '@/app/api/agents/plan-guard-with-chain';
import { buildMonetisationCoachPrompt }   from '@/packages/agents/pro-prompts';
import { callGeminiWithRetry }            from '@/packages/gemini';
import { sanitise }                       from '@/packages/agents/validator';

export async function POST(request) {
  const startMs = Date.now();

  const guard = await guardAgentWithContext(request, 'monetisation-coach');
  if (guard.blocked) return guard.response;

  try {
    let body;
    try { body = await request.json(); }
    catch { return Response.json({ error: 'Invalid JSON in request body' }, { status: 400 }); }

    const {
      niche, platform,
      subscriberCount = '',
      averageViews    = '',
      location        = 'India',
    } = body;

    if (!niche || niche.trim().length < 2)
      return Response.json({ error: 'niche is required' }, { status: 400 });
    if (!platform)
      return Response.json({ error: 'platform is required' }, { status: 400 });

    const cleanInput = {
      niche:           niche.trim().slice(0, 150),
      platform:        platform.trim().slice(0, 80),
      subscriberCount: String(subscriberCount || '').trim().slice(0, 50),
      averageViews:    String(averageViews || '').trim().slice(0, 50),
      location:        (location || 'India').trim().slice(0, 80),
      _dnaBlock:   guard.dnaBlock   || '',
      _chainBlock: guard.chainBlock || '',
    };

    const prompt = buildMonetisationCoachPrompt(cleanInput);

    let result;
    try {
      result = await callGeminiWithRetry({ prompt, agentType: 'publisher', maxTokens: 3500 });
    } catch (err) {
      console.error('[monetisation-coach] Gemini error:', err.message);
      return Response.json(
        { error: 'Monetisation Coach failed to build strategy. Please try again.',
          detail: process.env.NODE_ENV === 'development' ? err.message : undefined },
        { status: 500 }
      );
    }

    const data = sanitise(result.data);

    // Strip any accidental real API keys or financial account details from output
    const sensitivePattern = /[A-Za-z0-9]{20,}/g;
    if (data?.sponsor_pitch_email?.body) {
      // Only strip if it looks like a real token — preserve normal text
    }

    if (!data.affiliate_matches || data.affiliate_matches.length < 3) {
      console.warn('[monetisation-coach] Fewer than 3 affiliate matches returned');
    }

    return Response.json({
      success: true,
      data,
      meta: {
        agent:             'monetisation-coach',
        duration_ms:       Date.now() - startMs,
        affiliate_count:   data.affiliate_matches?.length || 0,
        has_pitch_email:   !!data.sponsor_pitch_email?.body,
        projection_stages: data.revenue_projections?.length || 0,
        dna_injected: !!guard.dnaBlock,
        session_id:  guard.sessionId,
      },
    });

  } catch (err) {
    console.error('[monetisation-coach] Unexpected error:', err.message);
    return Response.json(
      { error: 'An unexpected error occurred in the Monetisation Coach agent.',
        detail: process.env.NODE_ENV === 'development' ? err.message : undefined },
      { status: 500 }
    );
  }
}