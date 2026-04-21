// app/api/agents/hook-upgrader/route.js
export const runtime     = 'nodejs';
export const maxDuration = 40;

import { guardAgentWithContext }  from '@/app/api/agents/plan-guard-with-chain';
import { buildHookUpgraderPrompt } from '@/packages/agents/pro-prompts';
import { callGeminiWithRetry }     from '@/packages/gemini';
import { sanitise }                from '@/packages/agents/validator';
import {
  fetchTrendingVideos,
  buildRealDataBlock,
} from '@/packages/web-intelligence';

export async function POST(request) {
  const startMs = Date.now();

  const guard = await guardAgentWithContext(request, 'hook-upgrader');
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

    // ── Fetch real high-performing titles for hook pattern analysis ────────────
    console.log(`[hook-upgrader] Fetching real performing titles for niche: ${niche}`);
    const trendingVideos = await fetchTrendingVideos(niche, platform).catch(() => []);

    let realDataBlock = '';

    if (trendingVideos?.length > 0) {
      // Top performing titles as examples of proven hooks
      const highEngagement = trendingVideos
        .filter(v => v.views > 10000)
        .slice(0, 10);

      if (highEngagement.length > 0) {
        realDataBlock = buildRealDataBlock(
          'Real High-Performing Titles in This Niche (Study Their Hooks)',
          highEngagement.map((v, i) =>
            `${i + 1}. "${v.title}"
   Views: ${v.views.toLocaleString('en-IN')} | Channel: ${v.channel}
   Published: ${v.publishedAt?.slice(0, 10) || 'N/A'}`
          ).join('\n\n')
        );
      }
    }

    const cleanInput = {
      weakHook: weakHook.trim().slice(0, 500),
      niche:    niche.trim().slice(0, 150),
      platform: platform.trim().slice(0, 80),
      tone:     (tone || 'Educational').trim().slice(0, 80),
      _dnaBlock:   guard.dnaBlock   || '',
      _chainBlock: guard.chainBlock || '',
    };

    const basePrompt = buildHookUpgraderPrompt(cleanInput);
    const prompt = realDataBlock
      ? `${realDataBlock}\n\nUSE THE REAL PERFORMING TITLES ABOVE as reference. Study the opening words, emotional triggers, and structure of these actual high-view titles in this niche. Your 5 hook rewrites must be informed by proven patterns from this real data — not generic examples.\n\n${basePrompt}`
      : basePrompt;

    let result;
    try {
      result = await callGeminiWithRetry({ prompt, agentType: 'hookUpgrade', maxTokens: 3000 });
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
        agent:           'hook-upgrader',
        duration_ms:     Date.now() - startMs,
        upgrade_count:   data.upgrades?.length || 0,
        diagnosis:       data.diagnosis?.weakness_type || null,
        winner:          data.winner?.hook_text?.slice(0, 80) || null,
        real_data_used:  trendingVideos?.length > 0,
        dna_injected:    !!guard.dnaBlock,
        session_id:      guard.sessionId,
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