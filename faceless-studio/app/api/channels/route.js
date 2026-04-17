// app/api/channels/route.js
// List all channels for the authenticated user + create a new channel
// Studio plan only — max 5 channels per user

export const runtime     = 'nodejs';
export const maxDuration = 10;

import { verifyAuth, checkUsage } from '@/packages/supabase';
import { createClient }           from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const MAX_CHANNELS = 5;

const DEFAULT_EMOJIS = ['📺', '🎬', '🎥', '📡', '🎙️', '✍️', '📸', '🎵'];
const DEFAULT_COLORS = ['#C9A227', '#2563EB', '#0E7C4A', '#DC2626', '#7C3AED', '#0891B2', '#D97706', '#DB2777'];

// ── GET /api/channels — list all channels ────────────────────────────────────
export async function GET(request) {
  try {
    let user;
    try { user = await verifyAuth(request); }
    catch (e) { return Response.json({ error: e.message }, { status: 401 }); }

    const usage = await checkUsage(user.id);
    if (usage.plan !== 'studio') {
      return Response.json(
        { error: 'Multi-channel management requires the Studio plan', code: 'STUDIO_REQUIRED' },
        { status: 403 }
      );
    }

    const { data: channels, error } = await supabaseAdmin
      .from('channels')
      .select('*')
      .eq('user_id', user.id)
      .order('is_default', { ascending: false })
      .order('created_at', { ascending: true });

    if (error) throw new Error(error.message);

    // Also get the active channel from profile
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('active_channel_id')
      .eq('id', user.id)
      .single();

    return Response.json({
      success:          true,
      channels:         channels || [],
      active_channel_id: profile?.active_channel_id || null,
      total:            channels?.length || 0,
      limit:            MAX_CHANNELS,
      can_create:       (channels?.length || 0) < MAX_CHANNELS,
    });

  } catch (err) {
    console.error('[channels GET]', err.message);
    return Response.json({ error: err.message }, { status: 500 });
  }
}

// ── POST /api/channels — create a new channel ────────────────────────────────
export async function POST(request) {
  try {
    let user;
    try { user = await verifyAuth(request); }
    catch (e) { return Response.json({ error: e.message }, { status: 401 }); }

    const usage = await checkUsage(user.id);
    if (usage.plan !== 'studio') {
      return Response.json(
        { error: 'Multi-channel management requires the Studio plan', code: 'STUDIO_REQUIRED' },
        { status: 403 }
      );
    }

    // Check channel count
    const { count } = await supabaseAdmin
      .from('channels')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id);

    if ((count || 0) >= MAX_CHANNELS) {
      return Response.json(
        { error: `Studio plan supports up to ${MAX_CHANNELS} channels. Delete one to create another.`, code: 'CHANNEL_LIMIT_REACHED' },
        { status: 400 }
      );
    }

    let body;
    try { body = await request.json(); }
    catch { return Response.json({ error: 'Invalid JSON' }, { status: 400 }); }

    const {
      name, handle, description,
      niche, platform = 'YouTube', language = 'English',
      creator_type = 'general', creator_mode = 'faceless', tone = 'Educational',
      brand_voice, target_audience, content_pillars = [],
      channel_size = 'under_1k', social_links = {},
      avatar_emoji, avatar_color,
      is_default = false,
    } = body;

    if (!name?.trim() || name.trim().length < 2) {
      return Response.json({ error: 'Channel name is required (minimum 2 characters)' }, { status: 400 });
    }

    // Auto-assign emoji/color if not provided
    const existingCount = count || 0;
    const emoji = avatar_emoji || DEFAULT_EMOJIS[existingCount % DEFAULT_EMOJIS.length];
    const color = avatar_color || DEFAULT_COLORS[existingCount % DEFAULT_COLORS.length];

    const { data: channel, error: insertErr } = await supabaseAdmin
      .from('channels')
      .insert({
        user_id:         user.id,
        name:            name.trim().slice(0, 80),
        handle:          handle?.trim().slice(0, 60) || null,
        description:     description?.trim().slice(0, 300) || null,
        avatar_emoji:    emoji,
        avatar_color:    color,
        niche:           niche?.trim().slice(0, 150) || null,
        platform:        platform.trim().slice(0, 80),
        language:        language.trim().slice(0, 50),
        creator_type:    creator_type.trim().slice(0, 80),
        creator_mode:    creator_mode.trim().slice(0, 50),
        tone:            tone.trim().slice(0, 80),
        brand_voice:     brand_voice?.trim().slice(0, 800) || null,
        target_audience: target_audience?.trim().slice(0, 500) || null,
        content_pillars: Array.isArray(content_pillars) ? content_pillars.slice(0, 5) : [],
        channel_size:    channel_size.trim().slice(0, 30),
        social_links:    social_links || {},
        is_default:      is_default || existingCount === 0, // first channel is always default
      })
      .select()
      .single();

    if (insertErr) throw new Error(insertErr.message);

    // If this is the first channel or is_default, update profile's active_channel_id
    if (channel.is_default || existingCount === 0) {
      await supabaseAdmin
        .from('profiles')
        .update({ active_channel_id: channel.id, updated_at: new Date().toISOString() })
        .eq('id', user.id);
    }

    return Response.json({ success: true, channel }, { status: 201 });

  } catch (err) {
    console.error('[channels POST]', err.message);
    return Response.json({ error: err.message }, { status: 500 });
  }
}