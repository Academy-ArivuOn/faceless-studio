export const runtime     = 'nodejs';
export const maxDuration = 60; // extended: covers base call + possible retry

import { buildPublisherPrompt }          from '@/packages/agents/prompts';
import { callGeminiWithRetry }           from '@/packages/gemini';
import { validatePublisher, sanitise }   from '@/packages/agents/validator';

// ─── Placeholder Stripper ─────────────────────────────────────────────────────
// Gemini writes [insert link] or [your channel] in descriptions.
// Replace known patterns with sensible text, then nuke any remaining brackets.
function stripPlaceholders(obj) {
  if (typeof obj === 'string') {
    return obj
      // Named link placeholders → plain instruction text
      .replace(/\[(?:insert|add|your|paste|put|include)\s+(?:instagram|tiktok|twitter|youtube|website|channel|social|affiliate|link|handle|url|profile)[^\]]*\]/gi, 'link in bio')
      // Channel / creator name placeholders
      .replace(/\[(?:your\s+)?(?:channel|creator|brand|business)\s+name[^\]]*\]/gi, '')
      // Generic [insert X] patterns
      .replace(/\[(?:insert|add|put|place|include)[^\]]{0,60}\]/gi, '')
      // Any remaining [X] up to 80 chars
      .replace(/\[[^\]]{1,80}\]/g, '')
      // Collapse multiple spaces
      .replace(/  +/g, ' ')
      .trim();
  }
  if (Array.isArray(obj)) return obj.map(stripPlaceholders);
  if (obj && typeof obj === 'object') {
    const out = {};
    for (const [k, v] of Object.entries(obj)) out[k] = stripPlaceholders(v);
    return out;
  }
  return obj;
}

// ─── SEO Limit Enforcer ───────────────────────────────────────────────────────
// Hard-enforce character limits so length warnings never cascade to failures.
function enforceSeoLimits(data) {
  // meta_description hard cap at 155 chars
  if (data?.blog?.meta_description?.length > 155) {
    const trimmed   = data.blog.meta_description.slice(0, 152);
    const lastSpace = trimmed.lastIndexOf(' ');
    data.blog.meta_description = (lastSpace > 80 ? trimmed.slice(0, lastSpace) : trimmed) + '…';
  }
  // YouTube titles: update character_count after any placeholder stripping
  if (Array.isArray(data?.youtube?.title_options)) {
    data.youtube.title_options = data.youtube.title_options.map(t => ({
      ...t,
      title:           (t.title || '').slice(0, 100),
      character_count: (t.title || '').slice(0, 100).length,
    }));
  }
  return data;
}

// ─── Full Clean Pipeline ──────────────────────────────────────────────────────
// Strip placeholders → enforce limits → sanitise secrets
function cleanOutput(rawData) {
  return sanitise(enforceSeoLimits(stripPlaceholders(rawData)));
}

// ─── POST Handler ─────────────────────────────────────────────────────────────
export async function POST(request) {
  const startMs = Date.now();

  try {
    // ── 1. Parse Body ────────────────────────────────────────────────────────
    let body;
    try {
      body = await request.json();
    } catch {
      return Response.json({ error: 'Invalid JSON in request body' }, { status: 400 });
    }

    const {
      niche,
      platform,
      creatorType,
      chosenTopic,
      chosenHook,
      scriptExcerpt  = '',
      targetAudience = '',
      language       = 'English',
    } = body;

    // ── 2. Validate Required Fields ──────────────────────────────────────────
    if (!niche || typeof niche !== 'string' || niche.trim().length < 2)
      return Response.json({ error: 'niche is required (minimum 2 characters)' }, { status: 400 });
    if (!platform || typeof platform !== 'string')
      return Response.json({ error: 'platform is required' }, { status: 400 });
    if (!creatorType || typeof creatorType !== 'string')
      return Response.json({ error: 'creatorType is required' }, { status: 400 });
    if (!chosenTopic || typeof chosenTopic !== 'string' || chosenTopic.trim().length < 5)
      return Response.json({ error: 'chosenTopic is required (minimum 5 characters)' }, { status: 400 });
    if (!chosenHook || typeof chosenHook !== 'string' || chosenHook.trim().length < 10)
      return Response.json({ error: 'chosenHook is required (minimum 10 characters)' }, { status: 400 });

    // ── 3. Clean Input ────────────────────────────────────────────────────────
    const cleanInput = {
      niche:          niche.trim().slice(0, 150),
      platform:       platform.trim().slice(0, 80),
      creatorType:    creatorType.trim().slice(0, 80),
      chosenTopic:    chosenTopic.trim().slice(0, 300),
      chosenHook:     chosenHook.trim().slice(0, 500),
      scriptExcerpt:  scriptExcerpt.trim().slice(0, 500),
      targetAudience: targetAudience.trim().slice(0, 500),
      language:       language.trim().slice(0, 50),
    };

    const prompt = buildPublisherPrompt(cleanInput);

    // ── 4. Attempt 1 ─────────────────────────────────────────────────────────
    let finalData       = null;
    let finalValidation = null;

    try {
      const result1  = await callGeminiWithRetry({ prompt, agentType: 'publisher', maxTokens: 2500 });
      const cleaned1 = cleanOutput(result1.data);
      const valid1   = validatePublisher(cleaned1);

      if (!valid1.critical) {
        finalData       = cleaned1;
        finalValidation = valid1;
      } else {
        console.warn('[publisher] Attempt 1 failed. Issues:', valid1.issues.map(i => i.message));
      }
    } catch (err1) {
      console.error('[publisher] Attempt 1 Gemini error:', err1.message);
    }

    // ── 5. Attempt 2 (only if attempt 1 failed) ───────────────────────────────
    if (!finalData) {
      const retryPrompt = `${prompt}

═══ STRICT RULES — READ BEFORE GENERATING ═══
• ZERO square brackets anywhere. Not one. No [insert], [add], [your X], [link], [handle].
• For social media links write the words: link in bio
• YouTube description: fully written, 210-240 words, NO brackets, NO template language.
• Meta description: MAXIMUM 150 characters. Count every character. Stop at 150.
• Every field must be complete and final — no placeholders of any kind.
═════════════════════════════════════════════`;

      try {
        const result2  = await callGeminiWithRetry({ prompt: retryPrompt, agentType: 'publisher', maxTokens: 2800 });
        const cleaned2 = cleanOutput(result2.data);
        const valid2   = validatePublisher(cleaned2);

        if (!valid2.critical) {
          finalData       = cleaned2;
          finalValidation = valid2;
        } else {
          console.error('[publisher] Attempt 2 also failed. Issues:', valid2.issues.map(i => i.message));
          // Return structured failure — do NOT throw
          return Response.json(
            {
              error:  'Publisher quality check failed after 2 attempts. Please try again.',
              issues: process.env.NODE_ENV === 'development' ? valid2.issues : undefined,
            },
            { status: 500 }
          );
        }
      } catch (err2) {
        console.error('[publisher] Attempt 2 Gemini error:', err2.message);
        return Response.json(
          {
            error:  'Publisher agent could not complete after 2 attempts. Please try again.',
            detail: process.env.NODE_ENV === 'development' ? err2.message : undefined,
          },
          { status: 500 }
        );
      }
    }

    // ── 6. Return ─────────────────────────────────────────────────────────────
    if (finalValidation.warningCount > 0) {
      console.warn(`[publisher] ${finalValidation.warningCount} non-critical warnings (not blocking)`);
    }

    return Response.json({
      success: true,
      data:    finalData,
      meta: {
        agent:         'publisher',
        duration_ms:   Date.now() - startMs,
        title_options: finalData.youtube?.title_options?.length || 0,
        tag_count:     finalData.youtube?.tags?.length           || 0,
        ig_hashtags:   finalData.instagram?.hashtags?.length     || 0,
        error_count:   finalValidation.errorCount,
        warning_count: finalValidation.warningCount,
      },
    });

  } catch (err) {
    console.error('[publisher] Unexpected top-level error:', err.message);
    return Response.json(
      {
        error:  'An unexpected error occurred in the publisher agent.',
        detail: process.env.NODE_ENV === 'development' ? err.message : undefined,
      },
      { status: 500 }
    );
  }
}