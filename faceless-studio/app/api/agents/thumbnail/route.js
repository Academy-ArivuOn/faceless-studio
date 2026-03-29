// app/api/agents/thumbnail/route.js
export const runtime = 'nodejs';
export const maxDuration = 60;

import { verifyAuth, checkUsage, incrementUsage } from '@/lib/supabase';
import { conceptToDesignSpec, extractDesignElements, determineEditScope } from '@/lib/thumbnail/intelligence';
import { buildImagePrompt, buildVariationPrompts } from '@/lib/thumbnail/prompt-builder';
import { generateThumbnailWithFallback, calculateCTRScore } from '@/lib/thumbnail/image-service';
import { uploadThumbnail, saveThumbnailRecord } from '@/lib/thumbnail/storage';
import { sanitise } from '@/lib/agents/validator';

export async function POST(request) {
  const startMs = Date.now();

  try {
    // ── Auth ──────────────────────────────────────────────────────────────────
    let user;
    try {
      user = await verifyAuth(request);
    } catch (authError) {
      return Response.json(
        { error: authError.message || 'Authentication required' },
        { status: authError.statusCode || 401 }
      );
    }

    // ── Usage Check ───────────────────────────────────────────────────────────
    let usageCheck;
    try {
      usageCheck = await checkUsage(user.id);
    } catch (usageError) {
      console.error('[thumbnail] Usage check failed:', usageError.message);
      return Response.json(
        { error: 'Failed to check usage limits. Please try again.' },
        { status: 500 }
      );
    }

    if (!usageCheck.allowed) {
      return Response.json(
        {
          error: 'Monthly generation limit reached',
          code: 'UPGRADE_REQUIRED',
          plan: usageCheck.plan,
        },
        { status: 403 }
      );
    }

    // ── Parse Body ────────────────────────────────────────────────────────────
    let body;
    try {
      body = await request.json();
    } catch {
      return Response.json({ error: 'Invalid JSON in request body' }, { status: 400 });
    }

    const {
      // Agent input (from Research Agent output)
      topic,
      hook,
      thumbnail_concept,
      target_audience,
      emotion,
      // Direct user input
      user_requirements,
      // Platform
      platform = 'youtube',
      style_preference = 'cinematic',
      // Variation control
      generateVariations = true,
    } = body;

    // ── Validate Input ────────────────────────────────────────────────────────
    if (!topic || typeof topic !== 'string' || topic.trim().length < 3) {
      return Response.json(
        { error: 'topic is required (minimum 3 characters)' },
        { status: 400 }
      );
    }

    // ── Design Spec Generation ────────────────────────────────────────────────
    let designSpec;
    try {
      designSpec = conceptToDesignSpec({
        topic: topic.trim().slice(0, 100),
        thumbnail_concept: thumbnail_concept || '',
        hook: hook || '',
        emotion,
        platform,
        target_audience: target_audience || '',
        user_requirements: user_requirements || null,
      });
    } catch (specError) {
      console.error('[thumbnail] Design spec failed:', specError.message);
      return Response.json(
        { error: 'Failed to generate design specification' },
        { status: 500 }
      );
    }

    // ── Generate Prompts ──────────────────────────────────────────────────────
    const mainPrompt = buildImagePrompt(designSpec, style_preference);
    let variationPrompts = [];

    if (generateVariations) {
      variationPrompts = buildVariationPrompts(designSpec);
    }

    const allPrompts = [
      { type: 'primary', prompt: mainPrompt, description: 'Primary design' },
      ...variationPrompts
    ];

    // ── Generate Thumbnails ───────────────────────────────────────────────────
    const thumbnails = [];
    let successCount = 0;

    for (const promptData of allPrompts.slice(0, 5)) {
      try {
        const imageResult = await generateThumbnailWithFallback(
          promptData.prompt,
          designSpec
        );

        const ctrScore = calculateCTRScore(designSpec, promptData.type);

        // Upload to storage
        let storageUrl = null;
        if (imageResult.success && imageResult.image?.originalData) {
          const uploadResult = await uploadThumbnail(
            imageResult.image.originalData,
            user.id,
            {
              topic,
              platform,
              variationType: promptData.type,
              version: 'v1'
            }
          );

          if (uploadResult.success) {
            storageUrl = uploadResult.url;
          }
        }

        // Save to DB
        const recordResult = await saveThumbnailRecord(user.id, {
          topic,
          platform,
          variationType: promptData.type,
          ctrScore,
          designSpec,
          storageUrl,
          version: 'v1',
        });

        thumbnails.push({
          id: recordResult.success ? recordResult.thumbnailId : null,
          image_url: storageUrl,
          variation_type: promptData.type,
          ctr_score_prediction: ctrScore,
          design_breakdown: {
            text_overlay: designSpec.textOverlay,
            color_scheme: designSpec.primaryColors.join(', '),
            subject_focus: designSpec.subject,
            background: designSpec.background,
          },
          success: recordResult.success,
        });

        if (recordResult.success) successCount++;

      } catch (genError) {
        console.warn(`[thumbnail] Generation failed for ${promptData.type}:`, genError.message);
        // Continue with next variation
      }
    }

    if (successCount === 0) {
      return Response.json(
        {
          error: 'Failed to generate any thumbnails. Please try again.',
          detail: process.env.NODE_ENV === 'development' ? 'All variations failed' : undefined,
        },
        { status: 500 }
      );
    }

    // ── Increment Usage ───────────────────────────────────────────────────────
    try {
      await incrementUsage(user.id);
    } catch (usageError) {
      console.error('[thumbnail] Usage increment failed:', usageError.message);
    }

    // ── Response ──────────────────────────────────────────────────────────────
    return Response.json({
      success: true,
      thumbnails: thumbnails.filter(t => t.success),
      meta: {
        agent: 'thumbnail-generator',
        duration_ms: Date.now() - startMs,
        generated_count: successCount,
        total_attempted: allPrompts.length,
        design_spec: sanitise(designSpec),
        platform,
        ctr_potential: Math.round(
          thumbnails.reduce((sum, t) => sum + t.ctr_score_prediction, 0) / 
          thumbnails.length
        ),
      },
    });

  } catch (err) {
    console.error('[thumbnail] Unexpected error:', err);
    return Response.json(
      {
        error: 'An unexpected error occurred in the thumbnail agent.',
        detail: process.env.NODE_ENV === 'development' ? err.message : undefined,
      },
      { status: 500 }
    );
  }
}