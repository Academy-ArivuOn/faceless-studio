export const runtime     = 'nodejs';
export const maxDuration = 30;

import { guardAgent }                from '@/lib/plan-guard';
import { buildThumbnailBrainPrompt } from '@/lib/agents/pro-prompts';
import { callGeminiWithRetry }       from '@/lib/gemini';
import { sanitise }                  from '@/lib/agents/validator';

export async function POST(request) {
  const startMs = Date.now();

  const guard = await guardAgent(request, 'thumbnail-brain');
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

    const cleanInput = {
      topic:      topic.trim().slice(0, 300),
      niche:      niche.trim().slice(0, 150),
      platform:   platform.trim().slice(0, 80),
      chosenHook: chosenHook.trim().slice(0, 400),
      titleText:  titleText.trim().slice(0, 150),
    };

    const prompt = buildThumbnailBrainPrompt(cleanInput);

    let result;
    try {
      result = await callGeminiWithRetry({ prompt, agentType: 'publisher', maxTokens: 2500 });
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

    return Response.json({
      success: true,
      data,
      meta: {
        agent:       'thumbnail-brain',
        duration_ms: Date.now() - startMs,
        has_variant: !!data.variant_b,
        has_ai_prompt: !!data.primary_concept?.ai_image_prompt,
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