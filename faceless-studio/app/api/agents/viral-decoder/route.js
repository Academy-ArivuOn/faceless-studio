export const runtime     = 'nodejs';
export const maxDuration = 40;

import { guardAgentWithContext }   from '@/app/api/agents/plan-guard-with-chain';
import { buildViralDecoderPrompt }  from '@/packages/agents/pro-prompts';
import { callGeminiWithRetry }      from '@/packages/gemini';
import { sanitise }                 from '@/packages/agents/validator';

export async function POST(request) {
  const startMs = Date.now();

  const guard = await guardAgent(request, 'viral-decoder');
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

    const cleanInput = {
      videoTitle:   videoTitle.trim().slice(0, 300),
      niche:        niche.trim().slice(0, 150),
      platform:     platform.trim().slice(0, 80),
      channelName:  (channelName || '').trim().slice(0, 150),
      viewCount:    String(viewCount || '').trim().slice(0, 50),
      _dnaBlock:   guard.dnaBlock   || '',
      _chainBlock: guard.chainBlock || '',
    };

    const prompt = buildViralDecoderPrompt(cleanInput);

    let result;
    try {
      result = await callGeminiWithRetry({ prompt, agentType: 'research', maxTokens: 3500 });
    } catch (err) {
      console.error('[viral-decoder] Gemini error:', err.message);
      return Response.json(
        { error: 'Viral Decoder failed to analyse content. Please try again.',
          detail: process.env.NODE_ENV === 'development' ? err.message : undefined },
        { status: 500 }
      );
    }

    const data = sanitise(result.data);

    if (!data.replication_blueprint?.core_formula) {
      console.warn('[viral-decoder] Replication blueprint incomplete');
    }

    return Response.json({
      success: true,
      data,
      meta: {
        agent:              'viral-decoder',
        duration_ms:        Date.now() - startMs,
        triggers_found:     data.psychological_autopsy?.length || 0,
        replication_ideas:  [
          data.replication_blueprint?.video_idea_1,
          data.replication_blueprint?.video_idea_2,
          data.replication_blueprint?.video_idea_3,
        ].filter(Boolean).length,
        odds_score: data.odds_of_replication?.score || null,
        dna_injected: !!guard.dnaBlock,
        session_id:  guard.sessionId,
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