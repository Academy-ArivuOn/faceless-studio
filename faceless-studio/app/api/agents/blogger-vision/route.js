// app/api/agents/blogger-vision/route.js
// Analyzes uploaded images or short video clips from bloggers using Gemini Vision
// Returns structured analysis to feed into the script generation pipeline

export const runtime     = 'nodejs';
export const maxDuration = 30;

import { guardAgent } from '@/packages/plan-guard';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// ─── Image Analysis ────────────────────────────────────────────────────────────
async function analyzeImages(imageDataArray, blogType, location, niche) {
  const model = genAI.getGenerativeModel({ model: 'models/gemini-flash-lite-latest' });

  const imageParts = imageDataArray.map(img => ({
    inlineData: {
      data: img.base64,
      mimeType: img.mimeType || 'image/jpeg',
    },
  }));

  const textPrompt = `
You are analyzing images uploaded by a content creator for a ${blogType} blog about "${niche}"${location ? ` in ${location}` : ''}.

Analyze these images and provide structured insights for script writing.

Return ONLY this JSON — no markdown, no explanation:

{
  "type": "image",
  "count": ${imageDataArray.length},
  "description": "rich, specific description of what is shown — setting, people, food, products, architecture, atmosphere",
  "key_elements": ["element 1", "element 2", "element 3", "element 4", "element 5"],
  "mood": "the emotional atmosphere — e.g. 'warm and rustic', 'busy and vibrant', 'peaceful and ancient'",
  "visual_hooks": [
    "most striking visual element that could open the video",
    "second best visual hook",
    "a subtle detail most people would miss"
  ],
  "sensory_details": {
    "what_you_can_infer_about_smell": "based on what you see — food smells, nature, markets, etc.",
    "what_sounds_are_likely": "ambient sounds based on the setting",
    "texture_details": "any tactile details visible — surfaces, materials, food textures"
  },
  "filming_suggestions": [
    "specific shot to recreate from this image for the video",
    "second shot suggestion",
    "detail shot to add depth"
  ],
  "thumbnail_moment": "which image or which part of an image would make the best thumbnail and why",
  "blog_type_fit": "how well these images support ${blogType} content — what's strong, what's missing",
  "location_context": "${location ? `Specific observations about ${location} that are visible or can be inferred` : 'No location specified'}",
  "unique_story": "the most interesting story these images tell that generic content about this place/thing wouldn't tell"
}
`.trim();

  const result = await model.generateContent([textPrompt, ...imageParts]);
  const response = result.response;
  let raw = response.text().trim();

  // Strip markdown fences
  raw = raw.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/i, '').trim();

  return JSON.parse(raw);
}

// ─── Video Analysis ────────────────────────────────────────────────────────────
async function analyzeVideoFrame(videoFrameBase64, mimeType, blogType, location, niche) {
  // For video, we analyze the first frame + metadata
  const model = genAI.getGenerativeModel({ model: 'models/gemini-flash-lite-latest' });

  const prompt = `
You are analyzing a short video clip (approximately 15 seconds) uploaded by a content creator for a ${blogType} blog about "${niche}"${location ? ` in ${location}` : ''}.

This is the video content. Analyze it and extract insights for script writing.

Return ONLY this JSON — no markdown, no explanation:

{
  "type": "video",
  "duration": "~15 seconds",
  "description": "rich description of what is happening in the clip — movement, people, setting, actions",
  "key_moments": [
    "first notable moment or scene",
    "second notable moment",
    "third notable moment — could be subtle"
  ],
  "atmosphere": "overall vibe — energy level, crowd, noise level, time of day, lighting",
  "hook_moment": "the single best moment from the clip to use as the video hook — be specific",
  "voiceover_opportunities": [
    "moment where voiceover would add essential context not visible in the video",
    "moment where silence or ambient sound would work better than voiceover",
    "moment for a key fact or opinion as text overlay"
  ],
  "filming_quality_note": "honest assessment — is this usable footage? what's good, what could be better",
  "b_roll_suggestions": [
    "what additional b-roll shots would complement this clip",
    "close-up shot to add",
    "wide establishing shot to add"
  ],
  "sensory_atmosphere": {
    "sounds_visible": "what audio can be inferred — crowd noise, music, nature, traffic",
    "energy_level": "LOW | MEDIUM | HIGH | ELECTRIC",
    "time_context": "morning | midday | evening | night | unclear"
  },
  "thumbnail_frame": "describe the best frame from this clip for a thumbnail",
  "unique_story": "what this clip uniquely captures that words alone couldn't convey"
}
`.trim();

  const result = await model.generateContent([
    prompt,
    {
      inlineData: {
        data: videoFrameBase64,
        mimeType: mimeType || 'video/mp4',
      },
    },
  ]);

  const response = result.response;
  let raw = response.text().trim();
  raw = raw.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/i, '').trim();

  return JSON.parse(raw);
}

// ─── POST Handler ──────────────────────────────────────────────────────────────
export async function POST(request) {
  const startMs = Date.now();

  // Auth guard — this is a free feature (no plan restriction on vision analysis)
  const guard = await guardAgent(request, 'creator');
  if (guard.blocked) return guard.response;

  try {
    let body;
    try { body = await request.json(); }
    catch { return Response.json({ error: 'Invalid JSON in request body' }, { status: 400 }); }

    const {
      mediaType,          // 'image' | 'video'
      images,             // array of { base64, mimeType } for images
      videoBase64,        // base64 string for video
      videoMimeType,      // 'video/mp4' | 'video/quicktime' etc
      blogType = 'travel',
      location = '',
      niche = '',
    } = body;

    if (!mediaType || !['image', 'video'].includes(mediaType)) {
      return Response.json({ error: 'mediaType must be "image" or "video"' }, { status: 400 });
    }

    if (mediaType === 'image') {
      if (!Array.isArray(images) || images.length === 0) {
        return Response.json({ error: 'images array is required for image analysis' }, { status: 400 });
      }
      if (images.length > 5) {
        return Response.json({ error: 'Maximum 5 images allowed' }, { status: 400 });
      }

      // Validate each image has base64 data
      for (const img of images) {
        if (!img.base64 || typeof img.base64 !== 'string') {
          return Response.json({ error: 'Each image must have a base64 field' }, { status: 400 });
        }
      }

      let analysis;
      try {
        analysis = await analyzeImages(images, blogType, location, niche);
      } catch (err) {
        console.error('[blogger-vision] Image analysis error:', err.message);
        return Response.json(
          { error: 'Failed to analyze images. Please try again.', detail: process.env.NODE_ENV === 'development' ? err.message : undefined },
          { status: 500 }
        );
      }

      return Response.json({
        success: true,
        analysis,
        meta: {
          agent: 'blogger-vision',
          media_type: 'image',
          count: images.length,
          duration_ms: Date.now() - startMs,
        },
      });
    }

    if (mediaType === 'video') {
      if (!videoBase64 || typeof videoBase64 !== 'string') {
        return Response.json({ error: 'videoBase64 is required for video analysis' }, { status: 400 });
      }

      let analysis;
      try {
        analysis = await analyzeVideoFrame(videoBase64, videoMimeType, blogType, location, niche);
      } catch (err) {
        console.error('[blogger-vision] Video analysis error:', err.message);
        return Response.json(
          { error: 'Failed to analyze video. Please try again.', detail: process.env.NODE_ENV === 'development' ? err.message : undefined },
          { status: 500 }
        );
      }

      return Response.json({
        success: true,
        analysis,
        meta: {
          agent: 'blogger-vision',
          media_type: 'video',
          duration_ms: Date.now() - startMs,
        },
      });
    }

  } catch (err) {
    console.error('[blogger-vision] Unexpected error:', err.message);
    return Response.json(
      { error: 'An unexpected error occurred in the vision analysis agent.', detail: process.env.NODE_ENV === 'development' ? err.message : undefined },
      { status: 500 }
    );
  }
}
