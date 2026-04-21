// app/api/agents/competitor-autopsy/route.js
export const runtime     = 'nodejs';
export const maxDuration = 60;

import { guardAgentWithContext }        from '@/app/api/agents/plan-guard-with-chain';
import { buildCompetitorAutopsyPrompt } from '@/packages/agents/pro-prompts';
import { callGeminiWithRetry }          from '@/packages/gemini';
import { sanitise }                     from '@/packages/agents/validator';
import {
  fetchYouTubeChannelData,
  fetchCompetitorWebData,
  formatChannelDataForPrompt,
  buildRealDataBlock,
} from '@/packages/web-intelligence';

export async function POST(request) {
  const startMs = Date.now();

  const guard = await guardAgentWithContext(request, 'competitor-autopsy');
  if (guard.blocked) return guard.response;

  try {
    let body;
    try { body = await request.json(); }
    catch { return Response.json({ error: 'Invalid JSON in request body' }, { status: 400 }); }

    const {
      channelName, niche, platform,
      subscriberCount = '',
    } = body;

    if (!channelName || channelName.trim().length < 2)
      return Response.json({ error: 'channelName is required (minimum 2 characters)' }, { status: 400 });
    if (!niche || niche.trim().length < 2)
      return Response.json({ error: 'niche is required' }, { status: 400 });
    if (!platform)
      return Response.json({ error: 'platform is required' }, { status: 400 });

    // ── Fetch real data in parallel ───────────────────────────────────────────
    console.log(`[competitor-autopsy] Fetching real data for: ${channelName}`);
    const [channelData, webData] = await Promise.all([
      fetchYouTubeChannelData(channelName).catch(() => null),
      fetchCompetitorWebData(channelName, niche).catch(() => null),
    ]);

    // Build real data context block
    let realDataBlock = '';
    if (channelData) {
      realDataBlock += buildRealDataBlock(
        `${channelName} — YouTube Channel Data`,
        formatChannelDataForPrompt(channelData)
      );
    }
    if (webData?.recentCoverage?.length > 0) {
      realDataBlock += '\n\n' + buildRealDataBlock(
        `${channelName} — Web Coverage`,
        webData.recentCoverage.map(c => `• ${c.title}: ${c.snippet}`).join('\n')
      );
    }

    const hasRealData = !!channelData;

    const cleanInput = {
      channelName:     channelName.trim().slice(0, 150),
      niche:           niche.trim().slice(0, 150),
      platform:        platform.trim().slice(0, 80),
      subscriberCount: channelData
        ? parseInt(channelData.subscribers || 0).toLocaleString('en-IN')
        : String(subscriberCount || '').trim().slice(0, 50),
      _dnaBlock:   guard.dnaBlock   || '',
      _chainBlock: guard.chainBlock || '',
    };

    // Inject real data into prompt
    const basePrompt = buildCompetitorAutopsyPrompt(cleanInput);
    const prompt = realDataBlock
      ? `${realDataBlock}\n\nUSE THE REAL CHANNEL DATA ABOVE to make your analysis specific, accurate, and based on actual videos, view counts, and performance patterns.\n\n${basePrompt}`
      : basePrompt;

    let result;
    try {
      result = await callGeminiWithRetry({ prompt, agentType: 'research', maxTokens: 4000 });
    } catch (err) {
      console.error('[competitor-autopsy] Gemini error:', err.message);
      return Response.json(
        { error: 'Competitor Autopsy failed to analyse channel. Please try again.',
          detail: process.env.NODE_ENV === 'development' ? err.message : undefined },
        { status: 500 }
      );
    }

    const data = sanitise(result.data);
    const gapCount = data.content_gaps?.length || 0;

    if (gapCount < 2) {
      console.warn('[competitor-autopsy] Fewer than 2 content gaps returned');
    }

    // Attach raw channel data for frontend to display actual video titles
    if (channelData) {
      data._real_channel = {
        name:        channelData.name,
        subscribers: parseInt(channelData.subscribers || 0),
        totalViews:  parseInt(channelData.totalViews  || 0),
        videoCount:  parseInt(channelData.videoCount  || 0),
        top_videos:  channelData.videos.slice(0, 10).map(v => ({
          title:    v.title,
          views:    v.views,
          likes:    v.likes,
          comments: v.comments,
          date:     v.publishedAt?.slice(0, 10),
        })),
      };
    }

    return Response.json({
      success: true,
      data,
      meta: {
        agent:           'competitor-autopsy',
        duration_ms:     Date.now() - startMs,
        gaps_found:      gapCount,
        weaknesses:      data.weaknesses?.length || 0,
        battle_plan:     !!data.battle_plan,
        real_data_used:  hasRealData,
        videos_analysed: channelData?.videos?.length || 0,
        dna_injected:    !!guard.dnaBlock,
        session_id:      guard.sessionId,
      },
    });

  } catch (err) {
    console.error('[competitor-autopsy] Unexpected error:', err.message);
    return Response.json(
      { error: 'An unexpected error occurred in the Competitor Autopsy agent.',
        detail: process.env.NODE_ENV === 'development' ? err.message : undefined },
      { status: 500 }
    );
  }
}