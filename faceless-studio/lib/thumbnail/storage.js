// lib/thumbnail/storage.js
// Supabase storage integration for thumbnails

import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false, autoRefreshToken: false } }
);

// ─── Upload Thumbnail to Storage ──────────────────────────────────────────────
export async function uploadThumbnail(thumbnailData, userId, context = {}) {
  try {
    const {
      topic = 'untitled',
      platform = 'youtube',
      variationType = 'original',
      version = 'v1'
    } = context;

    // Generate unique filename
    const timestamp = Date.now();
    const filename = `${userId}/${topic.slice(0,30).replace(/\s+/g,'-')}-${platform}-${variationType}-${version}-${timestamp}.webp`;

    // Upload to bucket
    const { data, error } = await supabaseAdmin.storage
      .from('thumbnails')
      .upload(filename, thumbnailData, {
        contentType: 'image/webp',
        upsert: false,
      });

    if (error) throw error;

    // Generate public URL
    const { data: { publicUrl } } = supabaseAdmin.storage
      .from('thumbnails')
      .getPublicUrl(filename);

    return {
      success: true,
      filename,
      url: publicUrl,
      storagePath: data.path,
    };

  } catch (err) {
    console.error('[storage] Upload failed:', err.message);
    return {
      success: false,
      error: err.message,
    };
  }
}

// ─── Save Thumbnail Record to DB ──────────────────────────────────────────────
export async function saveThumbnailRecord(userId, thumbnailData) {
  try {
    const {
      topic,
      platform,
      variationType,
      ctrScore,
      designSpec,
      storageUrl,
      version = 'v1',
      parentId = null,
      feedback = null,
    } = thumbnailData;

    const { data, error } = await supabaseAdmin
      .from('thumbnails')
      .insert({
        user_id: userId,
        topic: topic.slice(0, 200),
        platform: platform.slice(0, 50),
        variation_type: variationType,
        version,
        parent_id: parentId,
        ctr_score: ctrScore,
        design_spec: designSpec,
        storage_url: storageUrl,
        feedback: feedback,
        created_at: new Date().toISOString(),
      })
      .select('id')
      .single();

    if (error) throw error;

    return {
      success: true,
      thumbnailId: data.id,
    };

  } catch (err) {
    console.error('[storage] Record save failed:', err.message);
    return {
      success: false,
      error: err.message,
    };
  }
}

// ─── Get User Thumbnails ──────────────────────────────────────────────────────
export async function getUserThumbnails(userId, limit = 50) {
  try {
    const { data, error } = await supabaseAdmin
      .from('thumbnails')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;

    return {
      success: true,
      thumbnails: data || [],
    };

  } catch (err) {
    console.error('[storage] Fetch failed:', err.message);
    return {
      success: false,
      error: err.message,
      thumbnails: [],
    };
  }
}

// ─── Get Thumbnail by ID ──────────────────────────────────────────────────────
export async function getThumbnailById(thumbnailId) {
  try {
    const { data, error } = await supabaseAdmin
      .from('thumbnails')
      .select('*')
      .eq('id', thumbnailId)
      .single();

    if (error) throw error;

    return {
      success: true,
      thumbnail: data,
    };

  } catch (err) {
    console.error('[storage] Get by ID failed:', err.message);
    return {
      success: false,
      error: err.message,
      thumbnail: null,
    };
  }
}

// ─── Update Thumbnail with Feedback ───────────────────────────────────────────
export async function updateThumbnailFeedback(thumbnailId, feedback) {
  try {
    const { data, error } = await supabaseAdmin
      .from('thumbnails')
      .update({
        feedback,
        updated_at: new Date().toISOString(),
      })
      .eq('id', thumbnailId)
      .select('id')
      .single();

    if (error) throw error;

    return {
      success: true,
      thumbnailId: data.id,
    };

  } catch (err) {
    console.error('[storage] Feedback update failed:', err.message);
    return {
      success: false,
      error: err.message,
    };
  }
}

// ─── Get Thumbnail Versions ──────────────────────────────────────────────────
export async function getThumbnailVersions(parentId) {
  try {
    const { data, error } = await supabaseAdmin
      .from('thumbnails')
      .select('*')
      .or(`id.eq.${parentId},parent_id.eq.${parentId}`)
      .order('version', { ascending: false });

    if (error) throw error;

    return {
      success: true,
      versions: data || [],
    };

  } catch (err) {
    console.error('[storage] Version fetch failed:', err.message);
    return {
      success: false,
      error: err.message,
      versions: [],
    };
  }
}

// ─── Delete Thumbnail ─────────────────────────────────────────────────────────
export async function deleteThumbnail(thumbnailId, storageUrl) {
  try {
    // Delete from storage if URL exists
    if (storageUrl) {
      const filename = storageUrl.split('/').pop();
      if (filename) {
        await supabaseAdmin.storage
          .from('thumbnails')
          .remove([filename]);
      }
    }

    // Delete from DB
    const { error } = await supabaseAdmin
      .from('thumbnails')
      .delete()
      .eq('id', thumbnailId);

    if (error) throw error;

    return { success: true };

  } catch (err) {
    console.error('[storage] Delete failed:', err.message);
    return {
      success: false,
      error: err.message,
    };
  }
}