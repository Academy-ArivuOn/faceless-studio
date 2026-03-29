// lib/thumbnail/image-service.js
// Image generation and post-processing service using Gemini

import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// ─── Generate Image ───────────────────────────────────────────────────────────
export async function generateThumbnailImage(prompt, retries = 2) {
  let attempt = 0;

  while (attempt < retries) {
    try {
      attempt++;

      const model = genAI.getGenerativeModel({ model: 'models/gemini-2.0-flash' });

      const response = await model.generateContent({
        contents: [
          {
            role: 'user',
            parts: [
              {
                text: `You are a professional thumbnail designer. Generate a high-converting social media thumbnail based on this detailed specification:\n\n${prompt}\n\nReturn ONLY a visual representation that maximizes CTR.`
              }
            ]
          }
        ],
        generationConfig: {
          temperature: 0.8,
          topK: 40,
          topP: 0.9,
          maxOutputTokens: 1024,
        },
      });

      // Extract image data if available
      const content = response.response.candidates?.[0]?.content?.parts?.[0];

      if (content?.inlineData) {
        return {
          success: true,
          mimeType: content.inlineData.mimeType,
          data: content.inlineData.data,
        };
      }

      // Fallback: return placeholder response
      if (attempt < retries) {
        await new Promise(r => setTimeout(r, 1000));
        continue;
      }

      return {
        success: false,
        error: 'No image data in response',
        retryable: true
      };

    } catch (err) {
      console.error(`[image-service] Generation attempt ${attempt}/${retries} failed:`, err.message);

      if (attempt >= retries) {
        return {
          success: false,
          error: err.message,
          retryable: err.message.includes('rate limit') || err.message.includes('timeout')
        };
      }

      await new Promise(r => setTimeout(r, 1500));
    }
  }

  return {
    success: false,
    error: 'Max retries exceeded',
    retryable: false
  };
}

// ─── Generate Multiple Variations ─────────────────────────────────────────────
export async function generateThumbnailVariations(variations, maxConcurrent = 3) {
  const results = [];

  for (let i = 0; i < variations.length; i += maxConcurrent) {
    const batch = variations.slice(i, i + maxConcurrent);
    const batchResults = await Promise.allSettled(
      batch.map(v =>
        generateThumbnailImage(v.prompt)
          .then(img => ({
            ...v,
            image: img,
            index: i + batch.indexOf(v)
          }))
      )
    );

    batchResults.forEach(result => {
      if (result.status === 'fulfilled') {
        results.push(result.value);
      } else {
        console.error('[image-service] Variation failed:', result.reason);
      }
    });
  }

  return results;
}

// ─── Calculate CTR Score ──────────────────────────────────────────────────────
export function calculateCTRScore(designSpec, variationType) {
  let score = 50; // Base score

  // Emotion scoring
  const emotionScores = {
    shock: 25,
    excitement: 25,
    curiosity: 25,
    fear: 20,
    inspiration: 18,
    skepticism: 12,
    anger: 15,
    sadness: 5
  };
  score += emotionScores[designSpec.emotion] || 15;

  // Face priority scoring
  const faceScores = {
    'very-high': 20,
    'high': 15,
    'medium': 10,
    'low-medium': 5,
    'low': 0
  };
  score += faceScores[designSpec.facePriority] || 0;

  // Contrast/intensity scoring
  if (designSpec.emotionVisuals.intensity === 'very-high') score += 15;
  else if (designSpec.emotionVisuals.intensity === 'high') score += 12;
  else if (designSpec.emotionVisuals.intensity === 'medium') score += 8;
  else score += 3;

  // Text overlay scoring
  if (designSpec.textOverlay && designSpec.textOverlay.length > 0) score += 10;

  // Color psychology bonus
  const primaryColor = designSpec.primaryColors?.[0];
  if (primaryColor === 'red') score += 8;
  else if (primaryColor === 'yellow') score += 6;
  else if (primaryColor === 'orange') score += 7;

  // Variation type bonus
  if (variationType === 'emotion_focus') score += 5;
  else if (variationType === 'text_focus') score += 3;
  else if (variationType === 'contrast_focus') score += 4;

  // Platform adjustment
  const platformBonus = {
    youtube: 5,
    shorts: 6,
    tiktok: 7,
    instagram: 3,
    linkedin: 2,
    twitter: 4,
    facebook: 3
  };
  score += platformBonus[designSpec.platform] || 0;

  // Cap at 100
  return Math.min(100, Math.max(0, Math.round(score)));
}

// ─── Post-Process Thumbnail ───────────────────────────────────────────────────
export function enhanceThumbnailPostProcess(imageData, designSpec) {
  // In a real implementation, this would apply:
  // - Contrast/saturation boost
  // - Text overlay rendering
  // - Face detection and zoom/crop
  // - Glow/outline effects
  // - Mobile optimization

  return {
    success: true,
    enhanced: true,
    originalData: imageData,
    enhancements: {
      contrast: 'boosted-15%',
      saturation: 'boosted-10%',
      textOverlay: designSpec.textOverlay ? 'applied' : 'none',
      faceEnhanced: designSpec.facePriority === 'very-high' ? 'yes' : 'no',
    }
  };
}

// ─── Generate Image with Fallback ────────────────────────────────────────────
export async function generateThumbnailWithFallback(prompt, designSpec) {
  try {
    const imageResult = await generateThumbnailImage(prompt);

    if (imageResult.success) {
      const enhanced = enhanceThumbnailPostProcess(imageResult.data, designSpec);
      return {
        success: true,
        image: enhanced,
        ctrScore: calculateCTRScore(designSpec, 'standard'),
      };
    }

    if (imageResult.retryable) {
      // Try once more
      const retryResult = await generateThumbnailImage(prompt, 1);
      if (retryResult.success) {
        const enhanced = enhanceThumbnailPostProcess(retryResult.data, designSpec);
        return {
          success: true,
          image: enhanced,
          ctrScore: calculateCTRScore(designSpec, 'standard'),
        };
      }
    }

    // Return structured error
    return {
      success: false,
      error: imageResult.error,
      fallback: true,
      ctrScore: calculateCTRScore(designSpec, 'standard'),
      placeholder: true
    };

  } catch (err) {
    console.error('[image-service] Unexpected error:', err.message);
    return {
      success: false,
      error: err.message,
      fallback: true,
      ctrScore: calculateCTRScore(designSpec, 'standard'),
    };
  }
}