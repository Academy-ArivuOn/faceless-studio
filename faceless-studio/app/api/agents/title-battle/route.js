// app/api/agents/title-battle/route.js
export const runtime     = 'nodejs';
export const maxDuration = 40;

import { guardAgentWithContext }  from '@/app/api/agents/plan-guard-with-chain';
import { buildTitleBattlePrompt } from '@/packages/agents/pro-prompts';
import { callGeminiWithRetry }    from '@/packages/gemini';
import { sanitise }               from '@/packages/agents/validator';
import {
  fetchYouTubeVideoData,
  fetchTrendingVideos,
  buildRealDataBlock,
} from '@/packages/web-intelligence';

export async function POST(request) {
  const startMs = Date.now();

  const guard = await guardAgentWithContext(request, 'title-battle');
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

    // ── Fetch real title performance data ──────────────────────────────────────
    console.log(`[title-battle] Fetching real title performance data for: ${topic}`);
    const [similarVideos, trendingVideos] = await Promise.all([
      fetchYouTubeVideoData(topic).catch(() => null),
      fetchTrendingVideos(niche, platform).catch(() => []),
    ]);

    let realDataBlock = '';

    if (similarVideos?.length > 0) {
      realDataBlock += buildRealDataBlock(
        'Real Videos on This Topic — Performance Data',
        similarVideos.slice(0, 8).map((v, i) =>
          `${i + 1}. "${v.title}"
   Channel: ${v.channelName}
   Views: ${v.views.toLocaleString('en-IN')} | Likes: ${v.likes.toLocaleString('en-IN')} | Comments: ${v.comments.toLocaleString('en-IN')}
   Tags: ${(v.tags || []).slice(0, 5).join(', ') || 'none'}`
        ).join('\n\n')
      );
    }

    if (trendingVideos?.length > 0) {
      // Extract just titles for pattern analysis
      const titles = trendingVideos.slice(0, 12).map(v => `"${v.title}" — ${v.views.toLocaleString('en-IN')} views`);
      realDataBlock += '\n\n' + buildRealDataBlock(
        'Top Performing Titles in This Niche Right Now',
        titles.join('\n')
      );
    }

    const cleanInput = {
      topic:        topic.trim().slice(0, 300),
      niche:        niche.trim().slice(0, 150),
      platform:     platform.trim().slice(0, 80),
      currentTitle: currentTitle.trim().slice(0, 200),
      creatorType:  (creatorType || 'general').trim().slice(0, 80),
      _dnaBlock:   guard.dnaBlock   || '',
      _chainBlock: guard.chainBlock || '',
    };

    const basePrompt = buildTitleBattlePrompt(cleanInput);
    const prompt = realDataBlock
      ? `${realDataBlock}\n\nUSE THE REAL TITLE DATA ABOVE. Study the actual titles that are performing well — their patterns, word choices, numbers used, emotional triggers. Your 10 generated titles must be informed by what is actually working in this niche right now, not generic formulas.\n\n${basePrompt}`
      : basePrompt;

    let result;
    try {
      result = await callGeminiWithRetry({ prompt, agentType: 'titleBattle', maxTokens: 3500 });
    } catch (err) {
      console.error('[title-battle] Gemini error:', err.message);
      return Response.json(
        { error: 'Title Battle failed to generate variants. Please try again.',
          detail: process.env.NODE_ENV === 'development' ? err.message : undefined },
        { status: 500 }
      );
    }

    const data = sanitise(result.data);

    // Auto-fill character counts
    if (Array.isArray(data.title_variants)) {
      data.title_variants = data.title_variants.map(v => ({
        ...v,
        character_count: v.title?.length || v.character_count || 0,
        ctr_score: typeof v.ctr_score === 'number' ? v.ctr_score : 0,
      }));
    }

    // Attach real competing titles for frontend display
    if (similarVideos?.length > 0) {
      data._competing_titles = similarVideos.slice(0, 6).map(v => ({
        title:   v.title,
        views:   v.views,
        channel: v.channelName,
      }));
    }

    if (!data.title_variants || data.title_variants.length < 5) {
      console.warn('[title-battle] Fewer than 5 title variants returned');
    }

    return Response.json({
      success: true,
      data,
      meta: {
        agent:           'title-battle',
        duration_ms:     Date.now() - startMs,
        variant_count:   data.title_variants?.length || 0,
        winner:          data.winner?.title || null,
        real_data_used:  !!(similarVideos?.length),
        videos_analysed: similarVideos?.length || 0,
        dna_injected:    !!guard.dnaBlock,
        session_id:      guard.sessionId,
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