// app/api/channels/[id]/route.js
// Get / Update / Delete a single channel + set as active

export const runtime     = 'nodejs';
export const maxDuration = 10;

import { verifyAuth, checkUsage } from '@/packages/supabase';
import { createClient }           from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function getChannel(channelId, userId) {
  const { data, error } = await supabaseAdmin
    .from('channels')
    .select('*')
    .eq('id', channelId)
    .eq('user_id', userId)
    .single();
  if (error || !data) return null;
  return data;
}

// ── GET /api/channels/[id] ───────────────────────────────────────────────────
export async function GET(request, { params }) {
  try {
    let user;
    try { user = await verifyAuth(request); }
    catch (e) { return Response.json({ error: e.message }, { status: 401 }); }

    const channel = await getChannel(params.id, user.id);
    if (!channel) return Response.json({ error: 'Channel not found' }, { status: 404 });

    // Fetch generation history for this channel
    const { data: recentGens } = await supabaseAdmin
      .from('generations')
      .select('id, chosen_topic, platform, generated_at')
      .eq('user_id', user.id)
      .eq('channel_id', params.id)
      .order('generated_at', { ascending: false })
      .limit(10);

    return Response.json({
      success:    true,
      channel,
      recent_generations: recentGens || [],
    });

  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}

// ── PATCH /api/channels/[id] — update channel ────────────────────────────────
export async function PATCH(request, { params }) {
  try {
    let user;
    try { user = await verifyAuth(request); }
    catch (e) { return Response.json({ error: e.message }, { status: 401 }); }

    const usage = await checkUsage(user.id);
    if (usage.plan !== 'studio') {
      return Response.json({ error: 'Studio plan required', code: 'STUDIO_REQUIRED' }, { status: 403 });
    }

    const existing = await getChannel(params.id, user.id);
    if (!existing) return Response.json({ error: 'Channel not found' }, { status: 404 });

    let body;
    try { body = await request.json(); }
    catch { return Response.json({ error: 'Invalid JSON' }, { status: 400 }); }

    // Build update payload — only include fields that were sent
    const allowed = [
      'name', 'handle', 'description', 'avatar_emoji', 'avatar_color',
      'niche', 'platform', 'language', 'creator_type', 'creator_mode', 'tone',
      'brand_voice', 'target_audience', 'content_pillars',
      'channel_size', 'social_links', 'is_default',
    ];

    const updates = { updated_at: new Date().toISOString() };
    for (const key of allowed) {
      if (body[key] !== undefined) updates[key] = body[key];
    }

    if (updates.name !== undefined) {
      if (!updates.name?.trim() || updates.name.trim().length < 2) {
        return Response.json({ error: 'Channel name must be at least 2 characters' }, { status: 400 });
      }
      updates.name = updates.name.trim().slice(0, 80);
    }

    const { data: channel, error: updateErr } = await supabaseAdmin
      .from('channels')
      .update(updates)
      .eq('id', params.id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (updateErr) throw new Error(updateErr.message);

    // If set as default, also update active_channel_id on profile
    if (updates.is_default) {
      await supabaseAdmin
        .from('profiles')
        .update({ active_channel_id: params.id, updated_at: new Date().toISOString() })
        .eq('id', user.id);
    }

    return Response.json({ success: true, channel });

  } catch (err) {
    console.error('[channels PATCH]', err.message);
    return Response.json({ error: err.message }, { status: 500 });
  }
}

// ── DELETE /api/channels/[id] ────────────────────────────────────────────────
export async function DELETE(request, { params }) {
  try {
    let user;
    try { user = await verifyAuth(request); }
    catch (e) { return Response.json({ error: e.message }, { status: 401 }); }

    const usage = await checkUsage(user.id);
    if (usage.plan !== 'studio') {
      return Response.json({ error: 'Studio plan required', code: 'STUDIO_REQUIRED' }, { status: 403 });
    }

    const existing = await getChannel(params.id, user.id);
    if (!existing) return Response.json({ error: 'Channel not found' }, { status: 404 });

    // Cannot delete if it's the last channel
    const { count } = await supabaseAdmin
      .from('channels')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id);

    if ((count || 0) <= 1) {
      return Response.json({ error: 'Cannot delete your last channel' }, { status: 400 });
    }

    const { error: deleteErr } = await supabaseAdmin
      .from('channels')
      .delete()
      .eq('id', params.id)
      .eq('user_id', user.id);

    if (deleteErr) throw new Error(deleteErr.message);

    // If this was the default/active, promote the oldest remaining channel
    if (existing.is_default) {
      const { data: remaining } = await supabaseAdmin
        .from('channels')
        .select('id')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true })
        .limit(1)
        .single();

      if (remaining) {
        await supabaseAdmin
          .from('channels')
          .update({ is_default: true, updated_at: new Date().toISOString() })
          .eq('id', remaining.id);

        await supabaseAdmin
          .from('profiles')
          .update({ active_channel_id: remaining.id, updated_at: new Date().toISOString() })
          .eq('id', user.id);
      }
    }

    return Response.json({ success: true, deleted_id: params.id });

  } catch (err) {
    console.error('[channels DELETE]', err.message);
    return Response.json({ error: err.message }, { status: 500 });
  }
}

// ── POST /api/channels/[id]/activate — switch active channel ─────────────────
// This sub-route is handled here for simplicity