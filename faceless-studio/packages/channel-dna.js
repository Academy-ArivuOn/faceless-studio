// packages/channel-dna.js
// Fetches the active channel for a user and builds a DNA context block
// Works alongside creator-dna.js — channel DNA takes priority when present

import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * getActiveChannel(userId)
 * Returns the active channel object for a Studio user, or null if:
 * - User is not on Studio plan
 * - No channels exist
 * - No active channel is set
 */
export async function getActiveChannel(userId) {
  try {
    // Get active_channel_id from profile
    const { data: profile, error: profErr } = await supabaseAdmin
      .from('profiles')
      .select('active_channel_id')
      .eq('id', userId)
      .single();

    if (profErr || !profile?.active_channel_id) return null;

    // Fetch the channel
    const { data: channel, error: chanErr } = await supabaseAdmin
      .from('channels')
      .select('*')
      .eq('id', profile.active_channel_id)
      .eq('user_id', userId)
      .single();

    if (chanErr || !channel) return null;

    return channel;
  } catch {
    return null;
  }
}

/**
 * buildChannelDNABlock(channel, fallbackInput)
 * Generates the DNA context block to prepend to every agent prompt.
 * Channel-level data takes priority over request-level input.
 */
export function buildChannelDNABlock(channel, fallbackInput = {}) {
  if (!channel) return '';

  const parts = [];

  parts.push(`═══ CHANNEL CONTEXT ═══`);
  parts.push(`Channel: ${channel.name}${channel.handle ? ` (${channel.handle})` : ''}`);

  if (channel.niche) parts.push(`Niche: ${channel.niche}`);

  parts.push(`Platform: ${channel.platform || fallbackInput.platform || 'YouTube'}`);
  parts.push(`Language: ${channel.language || fallbackInput.language || 'English'}`);
  parts.push(`Creator Type: ${channel.creator_type || fallbackInput.creatorType || 'general'}`);
  parts.push(`Creator Mode: ${channel.creator_mode || 'faceless'}`);
  parts.push(`Content Tone: ${channel.tone || fallbackInput.tone || 'Educational'}`);
  parts.push(`Channel Size: ${channel.channel_size || 'under_1k'}`);

  if (channel.brand_voice) {
    parts.push(`\nBrand Voice:\n${channel.brand_voice}`);
  }

  if (channel.target_audience) {
    parts.push(`\nTarget Audience:\n${channel.target_audience}`);
  }

  if (Array.isArray(channel.content_pillars) && channel.content_pillars.length > 0) {
    parts.push(`\nContent Pillars: ${channel.content_pillars.join(', ')}`);
  }

  if (channel.social_links && Object.keys(channel.social_links).length > 0) {
    const links = Object.entries(channel.social_links)
      .filter(([, v]) => v)
      .map(([k, v]) => `${k}: ${v}`)
      .join(', ');
    if (links) parts.push(`\nSocial: ${links}`);
  }

  parts.push(`═══════════════════════`);

  return parts.join('\n');
}

/**
 * getChannelDNA(userId)
 * Convenience: fetch + build in one call.
 * Returns { channel, dnaBlock } — dnaBlock is '' if no channel.
 */
export async function getChannelDNA(userId) {
  const channel  = await getActiveChannel(userId);
  const dnaBlock = buildChannelDNABlock(channel);
  return { channel, dnaBlock };
}

/**
 * incrementChannelGenerations(channelId)
 * Call after a successful generation to update the counter + last_used_at.
 */
export async function incrementChannelGenerations(channelId) {
  if (!channelId) return;
  try {
    await supabaseAdmin
      .from('channels')
      .update({
        generation_count: supabaseAdmin.rpc('increment', { x: 1 }),
        last_used_at:     new Date().toISOString(),
        updated_at:       new Date().toISOString(),
      })
      .eq('id', channelId);
  } catch (err) {
    console.error('[channel-dna] incrementChannelGenerations failed:', err.message);
  }
}

/**
 * mergeChannelWithInput(channel, input)
 * Returns a merged input object where channel DNA overrides request-level values.
 * Used in /api/generate to build the final cleanInput.
 */
export function mergeChannelWithInput(channel, input = {}) {
  if (!channel) return input;
  return {
    ...input,
    // Channel values take priority
    niche:       channel.niche       || input.niche,
    platform:    channel.platform    || input.platform,
    language:    channel.language    || input.language,
    creatorType: channel.creator_type || input.creatorType,
    creatorMode: channel.creator_mode || input.creatorMode,
    tone:        channel.tone        || input.tone,
    // Pass channel metadata for tracking
    _channelId:   channel.id,
    _channelName: channel.name,
  };
}