export const runtime     = 'nodejs';
export const maxDuration = 90; // Long scripts need full time

import { guardAgent }                  from '@/lib/plan-guard';
import { buildScriptLocaliserPrompt }  from '@/lib/agents/pro-prompts';
import { callGeminiWithRetry }         from '@/lib/gemini';
import { sanitise }                    from '@/lib/agents/validator';

const SUPPORTED_LANGUAGES = [
  'Hindi', 'Tamil', 'Telugu', 'Kannada', 'Marathi', 'Bengali',
  'Gujarati', 'Malayalam', 'Punjabi', 'Spanish', 'French',
  'Portuguese', 'Arabic', 'Indonesian', 'Japanese', 'Korean',
];

export async function POST(request) {
  const startMs = Date.now();

  const guard = await guardAgent(request, 'script-localiser');
  if (guard.blocked) return guard.response;

  try {
    let body;
    try { body = await request.json(); }
    catch { return Response.json({ error: 'Invalid JSON in request body' }, { status: 400 }); }

    const {
      originalScript, targetLanguage, niche, platform,
      creatorType = 'general',
    } = body;

    if (!originalScript || originalScript.trim().length < 50)
      return Response.json({ error: 'originalScript is required (minimum 50 characters)' }, { status: 400 });
    if (!targetLanguage || !SUPPORTED_LANGUAGES.includes(targetLanguage))
      return Response.json({
        error: `targetLanguage must be one of: ${SUPPORTED_LANGUAGES.join(', ')}`,
      }, { status: 400 });
    if (!niche || niche.trim().length < 2)
      return Response.json({ error: 'niche is required' }, { status: 400 });
    if (!platform)
      return Response.json({ error: 'platform is required' }, { status: 400 });

    const cleanInput = {
      originalScript: originalScript.trim(),     // full script — prompt builder caps it internally
      targetLanguage: targetLanguage.trim(),
      niche:          niche.trim().slice(0, 150),
      platform:       platform.trim().slice(0, 80),
      creatorType:    (creatorType || 'general').trim().slice(0, 80),
    };

    const prompt = buildScriptLocaliserPrompt(cleanInput);

    // Localisation is token-heavy — use maximum capacity
    let result;
    try {
      result = await callGeminiWithRetry({ prompt, agentType: 'localise', maxTokens: 7500 });
    } catch (err) {
      console.error('[script-localiser] Gemini error:', err.message);
      return Response.json(
        { error: 'Script Localiser failed to localise content. Please try again.',
          detail: process.env.NODE_ENV === 'development' ? err.message : undefined },
        { status: 500 }
      );
    }

    const data = sanitise(result.data);

    // Auto-fill word counts
    if (!data.original_word_count && originalScript) {
      data.original_word_count = originalScript.split(/\s+/).filter(Boolean).length;
    }
    if (!data.localised_word_count && data.localised_script) {
      data.localised_word_count = data.localised_script.split(/\s+/).filter(Boolean).length;
    }

    if (!data.localised_script || data.localised_script.trim().length < 50) {
      console.error('[script-localiser] Localised script missing or too short');
      return Response.json(
        { error: 'Localisation produced incomplete output. Please try again.' },
        { status: 500 }
      );
    }

    return Response.json({
      success: true,
      data,
      meta: {
        agent:                 'script-localiser',
        duration_ms:           Date.now() - startMs,
        target_language:       targetLanguage,
        original_word_count:   data.original_word_count || 0,
        localised_word_count:  data.localised_word_count || 0,
        adaptations_count:     data.cultural_adaptations?.length || 0,
      },
    });

  } catch (err) {
    console.error('[script-localiser] Unexpected error:', err.message);
    return Response.json(
      { error: 'An unexpected error occurred in the Script Localiser agent.',
        detail: process.env.NODE_ENV === 'development' ? err.message : undefined },
      { status: 500 }
    );
  }
}