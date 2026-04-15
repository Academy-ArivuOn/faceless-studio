export const runtime     = 'nodejs';
export const maxDuration = 30;

import { guardAgentWithContext }   from '@/app/api/agents/plan-guard-with-chain';
import { buildCommentReplyPrompt }   from '@/packages/agents/pro-prompts';
import { callGeminiWithRetry }       from '@/packages/gemini';
import { sanitise }                  from '@/packages/agents/validator';

export async function POST(request) {
  const startMs = Date.now();

  const guard = await guardAgentWithContext(request, 'comment-reply');
  if (guard.blocked) return guard.response;

  try {
    let body;
    try { body = await request.json(); }
    catch { return Response.json({ error: 'Invalid JSON in request body' }, { status: 400 }); }

    const {
      comments, niche, platform,
      channelTone = 'Educational',
      channelName = '',
    } = body;

    if (!comments || (Array.isArray(comments) ? comments.length === 0 : !String(comments).trim()))
      return Response.json({ error: 'comments are required (array or string)' }, { status: 400 });
    if (!niche || niche.trim().length < 2)
      return Response.json({ error: 'niche is required' }, { status: 400 });
    if (!platform)
      return Response.json({ error: 'platform is required' }, { status: 400 });

    // Normalise comments — accept array or newline-separated string
    const commentsArray = Array.isArray(comments)
      ? comments.map(c => String(c).trim()).filter(Boolean).slice(0, 20)
      : String(comments).split('\n').map(c => c.trim()).filter(Boolean).slice(0, 20);

    if (commentsArray.length === 0)
      return Response.json({ error: 'At least one non-empty comment is required' }, { status: 400 });

    const cleanInput = {
      comments:    commentsArray,
      niche:       niche.trim().slice(0, 150),
      platform:    platform.trim().slice(0, 80),
      channelTone: (channelTone || 'Educational').trim().slice(0, 80),
      channelName: (channelName || '').trim().slice(0, 100),
      _dnaBlock:   guard.dnaBlock   || '',
      _chainBlock: guard.chainBlock || '',
    };

    const prompt = buildCommentReplyPrompt(cleanInput);

    let result;
    try {
      result = await callGeminiWithRetry({ prompt, agentType: 'commentReply', maxTokens: 3000 });
    } catch (err) {
      console.error('[comment-reply] Gemini error:', err.message);
      return Response.json(
        { error: 'Comment Reply agent failed to generate replies. Please try again.',
          detail: process.env.NODE_ENV === 'development' ? err.message : undefined },
        { status: 500 }
      );
    }

    const data = sanitise(result.data);

    if (!Array.isArray(data.replies) || data.replies.length === 0) {
      console.warn('[comment-reply] No replies returned');
    }

    return Response.json({
      success: true,
      data,
      meta: {
        agent:         'comment-reply',
        duration_ms:   Date.now() - startMs,
        comments_in:   commentsArray.length,
        replies_out:   data.replies?.length || 0,
        pin_recommendation: data.pin_recommendation?.comment_number || null,
        dna_injected: !!guard.dnaBlock,
        session_id:  guard.sessionId,
      },
    });

  } catch (err) {
    console.error('[comment-reply] Unexpected error:', err.message);
    return Response.json(
      { error: 'An unexpected error occurred in the Comment Reply agent.',
        detail: process.env.NODE_ENV === 'development' ? err.message : undefined },
      { status: 500 }
    );
  }
}