// app/api/agents/channel-strategy/route.js
export const runtime     = 'nodejs';
export const maxDuration = 70;

import { guardAgentWithContext }      from '@/app/api/agents/plan-guard-with-chain';
import { buildChannelStrategyPrompt } from '@/packages/agents/pro-prompts';
import { callGeminiWithRetry }        from '@/packages/gemini';
import { sanitise }                   from '@/packages/agents/validator';
import {
  fetchTrendingVideos,
  fetchNicheTrends,
  formatTrendingDataForPrompt,
  buildRealDataBlock,
} from '@/packages/web-intelligence';

export async function POST(request) {
  const startMs = Date.now();

  const guard = await guardAgentWithContext(request, 'channel-strategy');
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

    // ── Fetch real niche data for strategy context ─────────────────────────────
    console.log(`[channel-strategy] Fetching real niche data for: ${niche}`);
    const [trendingVideos, nicheData] = await Promise.all([
      fetchTrendingVideos(niche, platform).catch(() => []),
      fetchNicheTrends(niche, platform).catch(() => ({ googleTrends: [], news: [], relatedQueries: [] })),
    ]);

    let realDataBlock = '';

    if (trendingVideos?.length > 0) {
      realDataBlock += buildRealDataBlock(
        'What Is Currently Working in This Niche',
        formatTrendingDataForPrompt(trendingVideos.slice(0, 10))
      );

      // Analyse upload frequency of top channels
      const channels = [...new Set(trendingVideos.map(v => v.channel))].slice(0, 5);
      realDataBlock += '\n\n' + buildRealDataBlock(
        'Top Channels Dominating This Niche Right Now',
        channels.map((ch, i) => {
          const chVideos = trendingVideos.filter(v => v.channel === ch);
          const avgViews = chVideos.length > 0
            ? Math.round(chVideos.reduce((s, v) => s + v.views, 0) / chVideos.length)
            : 0;
          return `${i + 1}. ${ch} — Avg views on trending videos: ${avgViews.toLocaleString('en-IN')}`;
        }).join('\n')
      );
    }

    if (nicheData?.relatedQueries?.length > 0) {
      realDataBlock += '\n\n' + buildRealDataBlock(
        'What Audiences Are Searching for in This Niche',
        nicheData.relatedQueries.join('\n')
      );
    }

    if (nicheData?.news?.length > 0) {
      realDataBlock += '\n\n' + buildRealDataBlock(
        'Recent News Signals in This Niche',
        nicheData.news.slice(0, 5).map(n => `• ${n.title}: ${n.snippet}`).join('\n')
      );
    }

    const cleanInput = {
      niche:              niche.trim().slice(0, 150),
      platform:           platform.trim().slice(0, 80),
      currentSubscribers: String(currentSubscribers || '0').trim().slice(0, 50),
      monetisationGoal:   (monetisationGoal || '').trim().slice(0, 300),
      contentFrequency:   (contentFrequency || '').trim().slice(0, 150),
      biggestChallenge:   (biggestChallenge || '').trim().slice(0, 300),
      targetAudience:     (targetAudience || '').trim().slice(0, 300),
      _dnaBlock:   guard.dnaBlock   || '',
      _chainBlock: guard.chainBlock || '',
    };

    const basePrompt = buildChannelStrategyPrompt(cleanInput);
    const prompt = realDataBlock
      ? `${realDataBlock}\n\nUSE THE REAL NICHE DATA ABOVE to make your strategy specific. The first_5_content_pieces for each phase must be based on actual gaps and opportunities from the real trending data. Identify topics with high views but low competition. Base your subscriber projections on actual channel performance data you can see above.\n\n${basePrompt}`
      : basePrompt;

    let result;
    try {
      result = await callGeminiWithRetry({ prompt, agentType: 'creator', maxTokens: 5500 });
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
        agent:           'channel-strategy',
        duration_ms:     Date.now() - startMs,
        phases:          data.roadmap?.length || 0,
        pillars:         data.content_pillars?.length || 0,
        growth_tactics:  data.growth_tactics?.length || 0,
        real_data_used:  trendingVideos?.length > 0,
        dna_injected:    !!guard.dnaBlock,
        session_id:      guard.sessionId,
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