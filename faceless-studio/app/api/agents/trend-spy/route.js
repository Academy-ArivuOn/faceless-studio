// app/api/agents/trend-spy/route.js
export const runtime     = 'nodejs';
export const maxDuration = 40;

import { guardAgentWithContext } from '@/app/api/agents/plan-guard-with-chain';
import { buildTrendSpyPrompt }   from '@/packages/agents/pro-prompts';
import { callGeminiWithRetry }   from '@/packages/gemini';
import { sanitise }              from '@/packages/agents/validator';
import {
  fetchTrendingVideos,
  fetchNicheTrends,
  formatTrendingDataForPrompt,
  buildRealDataBlock,
} from '@/packages/web-intelligence';

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

    // ── Fetch real trending data ───────────────────────────────────────────────
    console.log(`[trend-spy] Fetching real trends for niche: ${niche}`);
    const [trendingVideos, nicheData] = await Promise.all([
      fetchTrendingVideos(niche, platform).catch(() => []),
      fetchNicheTrends(niche, platform).catch(() => ({ googleTrends: [], news: [], relatedQueries: [] })),
    ]);

    let realDataBlock = '';

    if (trendingVideos?.length > 0) {
      realDataBlock += buildRealDataBlock(
        'Trending Videos Right Now — Last 7 Days',
        formatTrendingDataForPrompt(trendingVideos)
      );
    }

    if (nicheData?.news?.length > 0) {
      realDataBlock += '\n\n' + buildRealDataBlock(
        'Latest News in This Niche',
        nicheData.news.map(n => `• [${n.date || 'recent'}] ${n.title}\n  ${n.snippet}`).join('\n\n')
      );
    }

    if (nicheData?.relatedQueries?.length > 0) {
      realDataBlock += '\n\n' + buildRealDataBlock(
        'Top Search Queries People Are Using',
        nicheData.relatedQueries.join('\n')
      );
    }

    const cleanInput = {
      niche:    niche.trim().slice(0, 150),
      platform: platform.trim().slice(0, 80),
      language: (language || 'English').trim().slice(0, 50),
      _dnaBlock:   guard.dnaBlock   || '',
      _chainBlock: guard.chainBlock || '',
    };

    const basePrompt = buildTrendSpyPrompt(cleanInput);
    const prompt = realDataBlock
      ? `${realDataBlock}\n\nUSE THE REAL TRENDING DATA ABOVE. Your trending_now array MUST be built from these actual trending videos and news — not invented topics. Analyse real view counts, engagement, and timing patterns from the data.\n\n${basePrompt}`
      : basePrompt;

    let result;
    try {
      result = await callGeminiWithRetry({ prompt, agentType: 'trendSpy', maxTokens: 3000 });
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

    // Attach real trending videos for frontend display
    if (trendingVideos?.length > 0) {
      data._real_trending = trendingVideos.slice(0, 8).map(v => ({
        title:   v.title,
        channel: v.channel,
        views:   v.views,
        date:    v.publishedAt?.slice(0, 10),
      }));
    }

    return Response.json({
      success: true,
      data,
      meta: {
        agent:           'trend-spy',
        duration_ms:     Date.now() - startMs,
        trend_count:     data.trending_now?.length || 0,
        idea_count:      data.content_ideas_today?.length || 0,
        real_data_used:  trendingVideos?.length > 0,
        videos_fetched:  trendingVideos?.length || 0,
        dna_injected:    !!guard.dnaBlock,
        session_id:      guard.sessionId,
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