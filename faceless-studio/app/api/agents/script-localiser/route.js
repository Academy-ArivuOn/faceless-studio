// app/api/agents/script-localiser/route.js
export const runtime     = 'nodejs';
export const maxDuration = 90;

import { guardAgentWithContext }    from '@/app/api/agents/plan-guard-with-chain';
import { buildScriptLocaliserPrompt } from '@/packages/agents/pro-prompts';
import { callGeminiWithRetry }       from '@/packages/gemini';
import { sanitise }                  from '@/packages/agents/validator';
import {
  fetchTrendingVideos,
  fetchNicheTrends,
  buildRealDataBlock,
} from '@/packages/web-intelligence';

const SUPPORTED_LANGUAGES = [
  'Hindi', 'Tamil', 'Telugu', 'Kannada', 'Marathi', 'Bengali',
  'Gujarati', 'Malayalam', 'Punjabi', 'Spanish', 'French',
  'Portuguese', 'Arabic', 'Indonesian', 'Japanese', 'Korean',
];

// Map language to region for API queries
const LANGUAGE_REGION = {
  Hindi:    { region: 'IN', lang: 'hi', nichePrefix: 'Hindi' },
  Tamil:    { region: 'IN', lang: 'ta', nichePrefix: 'Tamil' },
  Telugu:   { region: 'IN', lang: 'te', nichePrefix: 'Telugu' },
  Kannada:  { region: 'IN', lang: 'kn', nichePrefix: 'Kannada' },
  Marathi:  { region: 'IN', lang: 'mr', nichePrefix: 'Marathi' },
  Bengali:  { region: 'IN', lang: 'bn', nichePrefix: 'Bengali' },
  Gujarati: { region: 'IN', lang: 'gu', nichePrefix: 'Gujarati' },
  Malayalam:{ region: 'IN', lang: 'ml', nichePrefix: 'Malayalam' },
  Punjabi:  { region: 'IN', lang: 'pa', nichePrefix: 'Punjabi' },
  Spanish:  { region: 'ES', lang: 'es', nichePrefix: 'Spanish' },
  French:   { region: 'FR', lang: 'fr', nichePrefix: 'French' },
};

export async function POST(request) {
  const startMs = Date.now();

  const guard = await guardAgentWithContext(request, 'script-localiser');
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

    // ── Fetch real regional content examples ───────────────────────────────────
    const regionInfo = LANGUAGE_REGION[targetLanguage];
    let realDataBlock = '';

    if (regionInfo) {
      console.log(`[script-localiser] Fetching ${targetLanguage} content examples for: ${niche}`);
      const regionalQuery = `${regionInfo.nichePrefix} ${niche}`;

      const [regionalVideos, regionalTrends] = await Promise.all([
        fetchTrendingVideos(regionalQuery, platform).catch(() => []),
        fetchNicheTrends(regionalQuery, platform).catch(() => ({ relatedQueries: [], news: [] })),
      ]);

      if (regionalVideos?.length > 0) {
        realDataBlock += buildRealDataBlock(
          `Top ${targetLanguage} Content in ${niche} Right Now`,
          regionalVideos.slice(0, 8).map((v, i) =>
            `${i + 1}. "${v.title}" — ${v.views.toLocaleString('en-IN')} views | ${v.channel}`
          ).join('\n')
        );
      }

      if (regionalTrends?.relatedQueries?.length > 0) {
        realDataBlock += '\n\n' + buildRealDataBlock(
          `What ${targetLanguage} Audiences Search for in ${niche}`,
          regionalTrends.relatedQueries.join('\n')
        );
      }

      if (regionalTrends?.news?.length > 0) {
        realDataBlock += '\n\n' + buildRealDataBlock(
          `Recent ${targetLanguage} News in ${niche}`,
          regionalTrends.news.slice(0, 4).map(n => `• ${n.title}`).join('\n')
        );
      }
    }

    const cleanInput = {
      originalScript: originalScript.trim(),
      targetLanguage: targetLanguage.trim(),
      niche:          niche.trim().slice(0, 150),
      platform:       platform.trim().slice(0, 80),
      creatorType:    (creatorType || 'general').trim().slice(0, 80),
      _dnaBlock:   guard.dnaBlock   || '',
      _chainBlock: guard.chainBlock || '',
    };

    const basePrompt = buildScriptLocaliserPrompt(cleanInput);
    const prompt = realDataBlock
      ? `${realDataBlock}\n\nUSE THE REAL ${targetLanguage.toUpperCase()} CONTENT DATA ABOVE. Study the actual titles and trends to understand what ${targetLanguage} ${niche} creators actually say — the vocabulary, references, and cultural moments they use. Your localisation must sound like a real ${targetLanguage} creator in this niche, not a translation.\n\n${basePrompt}`
      : basePrompt;

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
        real_data_used:        !!realDataBlock,
        dna_injected:          !!guard.dnaBlock,
        session_id:            guard.sessionId,
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