// app/api/agents/thumbnail-brain/route.js
export const runtime     = 'nodejs';
export const maxDuration = 40;

import { guardAgentWithContext }    from '@/app/api/agents/plan-guard-with-chain';
import { buildThumbnailBrainPrompt } from '@/packages/agents/pro-prompts';
import { callGeminiWithRetry }       from '@/packages/gemini';
import { sanitise }                  from '@/packages/agents/validator';
import {
  fetchTrendingVideos,
  fetchYouTubeVideoData,
  buildRealDataBlock,
} from '@/packages/web-intelligence';

export async function POST(request) {
  const startMs = Date.now();

  const guard = await guardAgentWithContext(request, 'thumbnail-brain');
  if (guard.blocked) return guard.response;

  try {
    let body;
    try { body = await request.json(); }
    catch { return Response.json({ error: 'Invalid JSON in request body' }, { status: 400 }); }

    const {
      topic, niche, platform,
      chosenHook = '',
      titleText  = '',
    } = body;

    if (!topic || topic.trim().length < 5)
      return Response.json({ error: 'topic is required (minimum 5 characters)' }, { status: 400 });
    if (!niche || niche.trim().length < 2)
      return Response.json({ error: 'niche is required' }, { status: 400 });
    if (!platform)
      return Response.json({ error: 'platform is required' }, { status: 400 });

    // ── Fetch real thumbnail/video performance data ─────────────────────────
    console.log(`[thumbnail-brain] Fetching real video data for: ${topic}`);
    const [topicVideos, nicheVideos] = await Promise.all([
      fetchYouTubeVideoData(topic).catch(() => null),
      fetchTrendingVideos(niche, platform).catch(() => []),
    ]);

    let realDataBlock = '';

    if (topicVideos?.length > 0) {
      // Extract thumbnail URL and performance to identify patterns
      realDataBlock += buildRealDataBlock(
        'Top Performing Videos on This Exact Topic',
        topicVideos.slice(0, 6).map((v, i) =>
          `${i + 1}. "${v.title}"
   Views: ${v.views.toLocaleString('en-IN')} | Engagement Rate: ${v.views > 0 ? ((v.likes / v.views) * 100).toFixed(2) : 0}%
   Channel: ${v.channelName}
   Published: ${v.publishedAt?.slice(0, 10) || 'N/A'}`
        ).join('\n\n')
      );
    }

    if (nicheVideos?.length > 0) {
      // Find the top 5 view counts to understand what thumbnail quality to beat
      const topPerformers = nicheVideos.slice(0, 5);
      realDataBlock += '\n\n' + buildRealDataBlock(
        'Top Performing Thumbnails in This Niche (what you are competing against)',
        topPerformers.map((v, i) =>
          `${i + 1}. "${v.title}" — ${v.views.toLocaleString('en-IN')} views
   Channel: ${v.channel}`
        ).join('\n')
      );
    }

    const cleanInput = {
      topic:      topic.trim().slice(0, 300),
      niche:      niche.trim().slice(0, 150),
      platform:   platform.trim().slice(0, 80),
      chosenHook: chosenHook.trim().slice(0, 400),
      titleText:  titleText.trim().slice(0, 150),
      _dnaBlock:   guard.dnaBlock   || '',
      _chainBlock: guard.chainBlock || '',
    };

    const basePrompt = buildThumbnailBrainPrompt(cleanInput);
    const prompt = realDataBlock
      ? `${realDataBlock}\n\nUSE THE REAL COMPETITOR DATA above. Your competitor_gap field must describe what the ACTUAL top-performing thumbnails in this niche look like based on the real video data — and how yours should visually differ. Base your contrast analysis on these real performers, not assumptions.\n\n${basePrompt}`
      : basePrompt;

    let result;
    try {
      result = await callGeminiWithRetry({ prompt, agentType: 'publisher', maxTokens: 3000 });
    } catch (err) {
      console.error('[thumbnail-brain] Gemini error:', err.message);
      return Response.json(
        { error: 'Thumbnail Brain failed to generate brief. Please try again.',
          detail: process.env.NODE_ENV === 'development' ? err.message : undefined },
        { status: 500 }
      );
    }

    const data = sanitise(result.data);

    if (!data.primary_concept?.visual_description) {
      console.warn('[thumbnail-brain] Primary concept incomplete');
    }

    // Attach real competitor info for frontend
    if (topicVideos?.length > 0) {
      data._real_competitors = topicVideos.slice(0, 5).map(v => ({
        title:   v.title,
        views:   v.views,
        channel: v.channelName,
      }));
    }

    return Response.json({
      success: true,
      data,
      meta: {
        agent:           'thumbnail-brain',
        duration_ms:     Date.now() - startMs,
        has_variant:     !!data.variant_b,
        has_ai_prompt:   !!data.primary_concept?.ai_image_prompt,
        real_data_used:  !!(topicVideos?.length),
        competitors_analysed: topicVideos?.length || 0,
        dna_injected:    !!guard.dnaBlock,
        session_id:      guard.sessionId,
      },
    });

  } catch (err) {
    console.error('[thumbnail-brain] Unexpected error:', err.message);
    return Response.json(
      { error: 'An unexpected error occurred in the Thumbnail Brain agent.',
        detail: process.env.NODE_ENV === 'development' ? err.message : undefined },
      { status: 500 }
    );
  }
}