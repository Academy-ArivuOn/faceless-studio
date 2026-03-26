export const runtime     = 'nodejs';
export const maxDuration = 30;

import { guardAgent }              from '@/lib/plan-guard';
import { buildTitleBattlePrompt }  from '@/lib/agents/pro-prompts';
import { callGeminiWithRetry }     from '@/lib/gemini';
import { sanitise }                from '@/lib/agents/validator';

export async function POST(request) {
  const startMs = Date.now();

  const guard = await guardAgent(request, 'title-battle');
  if (guard.blocked) return guard.response;

  try {
    let body;
    try { body = await request.json(); }
    catch { return Response.json({ error: 'Invalid JSON in request body' }, { status: 400 }); }

    const {
      topic, niche, platform,
      currentTitle  = '',
      creatorType   = 'general',
    } = body;

    if (!topic || topic.trim().length < 5)
      return Response.json({ error: 'topic is required (minimum 5 characters)' }, { status: 400 });
    if (!niche || niche.trim().length < 2)
      return Response.json({ error: 'niche is required' }, { status: 400 });
    if (!platform)
      return Response.json({ error: 'platform is required' }, { status: 400 });

    const cleanInput = {
      topic:        topic.trim().slice(0, 300),
      niche:        niche.trim().slice(0, 150),
      platform:     platform.trim().slice(0, 80),
      currentTitle: currentTitle.trim().slice(0, 200),
      creatorType:  (creatorType || 'general').trim().slice(0, 80),
    };

    const prompt = buildTitleBattlePrompt(cleanInput);

    let result;
    try {
      result = await callGeminiWithRetry({ prompt, agentType: 'titleBattle', maxTokens: 3000 });
    } catch (err) {
      console.error('[title-battle] Gemini error:', err.message);
      return Response.json(
        { error: 'Title Battle failed to generate variants. Please try again.',
          detail: process.env.NODE_ENV === 'development' ? err.message : undefined },
        { status: 500 }
      );
    }

    const data = sanitise(result.data);

    // Auto-fill character counts Gemini forgets
    if (Array.isArray(data.title_variants)) {
      data.title_variants = data.title_variants.map(v => ({
        ...v,
        character_count: v.title?.length || v.character_count || 0,
        ctr_score: typeof v.ctr_score === 'number' ? v.ctr_score : 0,
      }));
    }

    if (!data.title_variants || data.title_variants.length < 5) {
      console.warn('[title-battle] Fewer than 5 title variants returned');
    }

    return Response.json({
      success: true,
      data,
      meta: {
        agent:          'title-battle',
        duration_ms:    Date.now() - startMs,
        variant_count:  data.title_variants?.length || 0,
        winner:         data.winner?.title || null,
      },
    });

  } catch (err) {
    console.error('[title-battle] Unexpected error:', err.message);
    return Response.json(
      { error: 'An unexpected error occurred in the Title Battle agent.',
        detail: process.env.NODE_ENV === 'development' ? err.message : undefined },
      { status: 500 }
    );
  }
}