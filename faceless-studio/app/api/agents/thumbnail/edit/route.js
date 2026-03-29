// app/api/agents/thumbnail/edit/route.js
export const runtime = 'nodejs';
export const maxDuration = 60;

import { verifyAuth, checkUsage, incrementUsage } from '@/lib/supabase';
import { mergeFeedbackIntoSpec, determineEditScope } from '@/lib/thumbnail/intelligence';
import { buildEditPrompt } from '@/lib/thumbnail/prompt-builder';
import { generateThumbnailWithFallback, calculateCTRScore } from '@/lib/thumbnail/image-service';
import { getThumbnailById, uploadThumbnail, saveThumbnailRecord, updateThumbnailFeedback } from '@/lib/thumbnail/storage';

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
      console.error('[thumbnail-edit] Usage check failed:', usageError.message);
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
      selected_thumbnail_id,
      feedback,
      edit_type = null, // 'regenerate' | 'enhance' | 'modify' | null (auto-detect)
    } = body;

    // ── Validate Input ────────────────────────────────────────────────────────
    if (!selected_thumbnail_id || typeof selected_thumbnail_id !== 'string') {
      return Response.json(
        { error: 'selected_thumbnail_id is required' },
        { status: 400 }
      );
    }

    if (!feedback || typeof feedback !== 'string' || feedback.trim().length < 5) {
      return Response.json(
        { error: 'feedback is required (minimum 5 characters)' },
        { status: 400 }
      );
    }

    // ── Fetch Original Thumbnail ──────────────────────────────────────────────
    const originalResult = await getThumbnailById(selected_thumbnail_id);

    if (!originalResult.success || !originalResult.thumbnail) {
      return Response.json(
        { error: 'Thumbnail not found' },
        { status: 404 }
      );
    }

    const originalThumbnail = originalResult.thumbnail;
    const originalSpec = originalThumbnail.design_spec;

    // ── Determine Edit Scope ──────────────────────────────────────────────────
    const determineEditType = edit_type || determineEditScope(feedback);

    // ── Merge Feedback into Spec ──────────────────────────────────────────────
    const editedSpec = mergeFeedbackIntoSpec(originalSpec, feedback, determineEditType);

    // ── Generate Edited Prompt ────────────────────────────────────────────────
    const editedPrompt = buildEditPrompt(originalSpec, feedback, determineEditType);

    // ── Generate Edited Thumbnail ─────────────────────────────────────────────
    let newThumbnail;
    try {
      newThumbnail = await generateThumbnailWithFallback(editedPrompt, editedSpec);
    } catch (genError) {
      console.error('[thumbnail-edit] Generation failed:', genError.message);
      return Response.json(
        { error: 'Failed to generate edited thumbnail' },
        { status: 500 }
      );
    }

    if (!newThumbnail.success && !newThumbnail.placeholder) {
      return Response.json(
        { error: 'Thumbnail generation failed: ' + newThumbnail.error },
        { status: 500 }
      );
    }

    // ── Upload Edited Thumbnail ───────────────────────────────────────────────
    let storageUrl = null;
    if (newThumbnail.image?.originalData) {
      const uploadResult = await uploadThumbnail(
        newThumbnail.image.originalData,
        user.id,
        {
          topic: originalThumbnail.topic,
          platform: originalThumbnail.platform,
          variationType: determineEditType,
          version: `v${(originalThumbnail.version?.match(/\d+/) || [1])[0] + 1}`
        }
      );

      if (uploadResult.success) {
        storageUrl = uploadResult.url;
      }
    }

    // ── Save Edited Version to DB ─────────────────────────────────────────────
    const nextVersion = `v${(originalThumbnail.version?.match(/\d+/) || [1])[0] + 1}`;
    const newRecordResult = await saveThumbnailRecord(user.id, {
      topic: originalThumbnail.topic,
      platform: originalThumbnail.platform,
      variationType: `${originalThumbnail.variation_type}-edited`,
      ctrScore: calculateCTRScore(editedSpec, `${originalThumbnail.variation_type}-edited`),
      designSpec: editedSpec,
      storageUrl,
      version: nextVersion,
      parentId: selected_thumbnail_id,
      feedback,
    });

    // ── Update Original with Feedback ─────────────────────────────────────────
    await updateThumbnailFeedback(selected_thumbnail_id, feedback);

    // ── Increment Usage ───────────────────────────────────────────────────────
    try {
      await incrementUsage(user.id);
    } catch (usageError) {
      console.error('[thumbnail-edit] Usage increment failed:', usageError.message);
    }

    // ── Response ──────────────────────────────────────────────────────────────
    return Response.json({
      success: true,
      edited_thumbnail: {
        id: newRecordResult.success ? newRecordResult.thumbnailId : null,
        image_url: storageUrl,
        variation_type: `${originalThumbnail.variation_type}-edited`,
        ctr_score_prediction: calculateCTRScore(editedSpec, `${originalThumbnail.variation_type}-edited`),
        design_breakdown: {
          text_overlay: editedSpec.textOverlay,
          color_scheme: editedSpec.primaryColors.join(', '),
          subject_focus: editedSpec.subject,
          background: editedSpec.background,
        },
        version: nextVersion,
        parent_id: selected_thumbnail_id,
      },
      meta: {
        agent: 'thumbnail-editor',
        duration_ms: Date.now() - startMs,
        edit_type: determineEditType,
        feedback_applied: feedback.slice(0, 100),
        original_ctr: originalThumbnail.ctr_score,
        new_ctr: calculateCTRScore(editedSpec, `${originalThumbnail.variation_type}-edited`),
        improvement: calculateCTRScore(editedSpec, `${originalThumbnail.variation_type}-edited`) - originalThumbnail.ctr_score,
      },
    });

  } catch (err) {
    console.error('[thumbnail-edit] Unexpected error:', err);
    return Response.json(
      {
        error: 'An unexpected error occurred in the thumbnail editor.',
        detail: process.env.NODE_ENV === 'development' ? err.message : undefined,
      },
      { status: 500 }
    );
  }
}