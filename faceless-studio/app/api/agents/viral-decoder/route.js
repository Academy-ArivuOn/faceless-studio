// app/api/agents/viral-decoder/route.js
export const runtime     = 'nodejs';
export const maxDuration = 50;

import { guardAgentWithContext }  from '@/app/api/agents/plan-guard-with-chain';
import { buildViralDecoderPrompt } from '@/packages/agents/pro-prompts';
import { callGeminiWithRetry }     from '@/packages/gemini';
import { sanitise }                from '@/packages/agents/validator';
import {
  fetchViralVideoContext,
  fetchTrendingVideos,
  formatTrendingDataForPrompt,
  buildRealDataBlock,
} from '@/packages/web-intelligence';

export async function POST(request) {
  const startMs = Date.now();

  const guard = await guardAgentWithContext(request, 'viral-decoder');
  if (guard.blocked) return guard.response;

  try {
    let body;
    try { body = await request.json(); }
    catch { return Response.json({ error: 'Invalid JSON in request body' }, { status: 400 }); }

    const {
      videoTitle, niche, platform,
      channelName = '',
      viewCount   = '',
    } = body;

    if (!videoTitle || videoTitle.trim().length < 5)
      return Response.json({ error: 'videoTitle is required (minimum 5 characters)' }, { status: 400 });
    if (!niche || niche.trim().length < 2)
      return Response.json({ error: 'niche is required' }, { status: 400 });
    if (!platform)
      return Response.json({ error: 'platform is required' }, { status: 400 });

    // ── Fetch real data in parallel ───────────────────────────────────────────
    console.log(`[viral-decoder] Fetching real video data for: ${videoTitle}`);
    const [viralCtx, trendingVideos] = await Promise.all([
      fetchViralVideoContext(videoTitle, channelName, niche).catch(() => null),
      fetchTrendingVideos(niche, platform).catch(() => []),
    ]);

    let realDataBlock = '';
    let resolvedViewCount = viewCount;

    if (viralCtx?.videoData) {
      const v = viralCtx.videoData;
      resolvedViewCount = v.views.toLocaleString('en-IN');
      realDataBlock += buildRealDataBlock(
        'Target Viral Video — Actual Data',
        `Title: "${v.title}"
Channel: ${v.channelName}
Views: ${v.views.toLocaleString('en-IN')}
Likes: ${v.likes.toLocaleString('en-IN')}
Comments: ${v.comments.toLocaleString('en-IN')}
Published: ${v.publishedAt?.slice(0, 10) || 'N/A'}
Tags used: ${(v.tags || []).join(', ') || 'none'}
Description excerpt: ${(v.description || '').slice(0, 300)}`
      );
    }

    if (trendingVideos?.length > 0) {
      realDataBlock += '\n\n' + buildRealDataBlock(
        'Niche Performance Benchmark (recent trending)',
        formatTrendingDataForPrompt(trendingVideos.slice(0, 8))
      );
    }

    const cleanInput = {
      videoTitle:  videoTitle.trim().slice(0, 300),
      niche:       niche.trim().slice(0, 150),
      platform:    platform.trim().slice(0, 80),
      channelName: (channelName || '').trim().slice(0, 150),
      viewCount:   resolvedViewCount || String(viewCount || '').trim().slice(0, 50),
      _dnaBlock:   guard.dnaBlock   || '',
      _chainBlock: guard.chainBlock || '',
    };

    const basePrompt = buildViralDecoderPrompt(cleanInput);
    const prompt = realDataBlock
      ? `${realDataBlock}\n\nUSE THE REAL VIDEO DATA ABOVE. Analyse the actual view count, engagement ratios, tags, and timing to explain why this specific video went viral — not generic assumptions.\n\n${basePrompt}`
      : basePrompt;

    let result;
    try {
      result = await callGeminiWithRetry({ prompt, agentType: 'research', maxTokens: 4000 });
    } catch (err) {
      console.error('[viral-decoder] Gemini error:', err.message);
      return Response.json(
        { error: 'Viral Decoder failed to analyse content. Please try again.',
          detail: process.env.NODE_ENV === 'development' ? err.message : undefined },
        { status: 500 }
      );
    }

    const data = sanitise(result.data);

    // Attach real video data for frontend
    if (viralCtx?.videoData) {
      data._real_video = viralCtx.videoData;
    }
    if (trendingVideos?.length > 0) {
      data._niche_benchmark = trendingVideos.slice(0, 5).map(v => ({
        title:   v.title,
        channel: v.channel,
        views:   v.views,
      }));
    }

    return Response.json({
      success: true,
      data,
      meta: {
        agent:             'viral-decoder',
        duration_ms:       Date.now() - startMs,
        triggers_found:    data.psychological_autopsy?.length || 0,
        replication_ideas: [
          data.replication_blueprint?.video_idea_1,
          data.replication_blueprint?.video_idea_2,
          data.replication_blueprint?.video_idea_3,
        ].filter(Boolean).length,
        odds_score:       data.odds_of_replication?.score || null,
        real_data_used:   !!viralCtx?.videoData,
        actual_views:     viralCtx?.videoData?.views || null,
        dna_injected:     !!guard.dnaBlock,
        session_id:       guard.sessionId,
      },
    });

  } catch (err) {
    console.error('[viral-decoder] Unexpected error:', err.message);
    return Response.json(
      { error: 'An unexpected error occurred in the Viral Decoder agent.',
        detail: process.env.NODE_ENV === 'development' ? err.message : undefined },
      { status: 500 }
    );
  }
}