export const runtime     = 'nodejs';
export const maxDuration = 30;

import { guardAgent }               from '@/lib/plan-guard';
import { buildHookUpgraderPrompt }  from '@/lib/agents/pro-prompts';
import { callGeminiWithRetry }      from '@/lib/gemini';
import { sanitise }                 from '@/lib/agents/validator';

export async function POST(request) {
  const startMs = Date.now();

  const guard = await guardAgent(request, 'hook-upgrader');
  if (guard.blocked) return guard.response;

  try {
    let body;
    try { body = await request.json(); }
    catch { return Response.json({ error: 'Invalid JSON in request body' }, { status: 400 }); }

    const {
      weakHook, niche, platform,
      tone = 'Educational',
    } = body;

    if (!weakHook || weakHook.trim().length < 5)
      return Response.json({ error: 'weakHook is required (minimum 5 characters)' }, { status: 400 });
    if (!niche || niche.trim().length < 2)
      return Response.json({ error: 'niche is required' }, { status: 400 });
    if (!platform)
      return Response.json({ error: 'platform is required' }, { status: 400 });

    const cleanInput = {
      weakHook: weakHook.trim().slice(0, 500),
      niche:    niche.trim().slice(0, 150),
      platform: platform.trim().slice(0, 80),
      tone:     (tone || 'Educational').trim().slice(0, 80),
    };

    const prompt = buildHookUpgraderPrompt(cleanInput);

    let result;
    try {
      result = await callGeminiWithRetry({ prompt, agentType: 'hookUpgrade', maxTokens: 2500 });
    } catch (err) {
      console.error('[hook-upgrader] Gemini error:', err.message);
      return Response.json(
        { error: 'Hook Upgrader failed to generate rewrites. Please try again.',
          detail: process.env.NODE_ENV === 'development' ? err.message : undefined },
        { status: 500 }
      );
    }

    const data = sanitise(result.data);

    // Auto-fill word counts
    if (Array.isArray(data.upgrades)) {
      data.upgrades = data.upgrades.map(u => ({
        ...u,
        word_count: u.hook_text
          ? u.hook_text.split(/\s+/).filter(Boolean).length
          : (u.word_count || 0),
      }));
    }

    if (!data.upgrades || data.upgrades.length < 3) {
      console.warn('[hook-upgrader] Fewer than 3 upgrades returned');
    }

    return Response.json({
      success: true,
      data,
      meta: {
        agent:          'hook-upgrader',
        duration_ms:    Date.now() - startMs,
        upgrade_count:  data.upgrades?.length || 0,
        diagnosis:      data.diagnosis?.weakness_type || null,
        winner:         data.winner?.hook_text?.slice(0, 80) || null,
      },
    });

  } catch (err) {
    console.error('[hook-upgrader] Unexpected error:', err.message);
    return Response.json(
      { error: 'An unexpected error occurred in the Hook Upgrader agent.',
        detail: process.env.NODE_ENV === 'development' ? err.message : undefined },
      { status: 500 }
    );
  }
}