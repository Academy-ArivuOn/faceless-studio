// lib/creator-dna.js
// Creator DNA — fetches, builds, and injects creator profile into all agent prompts

import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false, autoRefreshToken: false } }
);

// ─── Fetch Creator DNA from DB ─────────────────────────────────────────────────
export async function getCreatorDNA(userId) {
  try {
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    const { data: usageRow } = await supabaseAdmin
      .from('user_usage')
      .select('plan, total_generations')
      .eq('user_id', userId)
      .single();

    // Fetch last 5 generation topics to avoid repetition
    const { data: recentGens } = await supabaseAdmin
      .from('generations')
      .select('chosen_topic, chosen_hook, niche, platform, creator_type')
      .eq('user_id', userId)
      .order('generated_at', { ascending: false })
      .limit(5);

    if (!profile) return null;

    return {
      creator_type:       profile.creator_type || 'general',
      primary_niche:      profile.primary_niche || '',
      primary_platform:   profile.primary_platform || 'YouTube',
      primary_language:   profile.primary_language || 'English',
      streak_count:       profile.streak_count || 0,
      total_generations:  usageRow?.total_generations || 0,
      plan:               usageRow?.plan || 'free',
      recent_topics:      recentGens?.map(g => g.chosen_topic).filter(Boolean) || [],
      recent_hooks:       recentGens?.map(g => g.chosen_hook).filter(Boolean) || [],
      brand_voice:        profile.brand_voice || null,
      target_audience:    profile.target_audience_description || null,
      creator_mode:       profile.creator_mode || 'faceless', // 'faceless' | 'face'
      content_pillars:    profile.content_pillars || [],
      channel_size:       profile.channel_size || 'under_1k',
    };
  } catch (err) {
    console.warn('[creator-dna] Failed to fetch profile:', err.message);
    return null;
  }
}

// ─── Save Creator DNA after generation ────────────────────────────────────────
export async function updateCreatorDNA(userId, updates) {
  try {
    await supabaseAdmin
      .from('profiles')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', userId);
  } catch (err) {
    console.warn('[creator-dna] Failed to update profile:', err.message);
  }
}

// ─── Build DNA Context Block for prompt injection ──────────────────────────────
export function buildDNAContextBlock(dna, currentInput = {}) {
  if (!dna) return '';

  const avoidTopics = dna.recent_topics.length > 0
    ? `ALREADY COVERED (avoid repeating these exact topics):\n${dna.recent_topics.map((t, i) => `  ${i + 1}. ${t}`).join('\n')}`
    : '';

  const channelSizeContext = {
    'under_1k':   'Starting creator — audience is small but highly engaged. Focus on searchable content.',
    '1k_10k':     'Early growth phase — starting to gain traction. Mix of search and trend-based content.',
    '10k_100k':   'Mid-tier creator — established niche authority. Trend + community content works.',
    '100k_plus':  'Established creator — audience expects consistent quality and unique angles.',
  }[dna.channel_size] || '';

  const modeContext = dna.creator_mode === 'faceless'
    ? 'CREATOR MODE: FACELESS — Generate b-roll search terms, text-on-screen cues, stock footage direction, and voiceover pacing notes. No on-camera direction needed.'
    : 'CREATOR MODE: FACE-SHOWING — Generate on-camera direction, body language cues, energy notes, and personal story hooks. Visual direction = what the creator should DO on camera.';

  return `
═══════════════════════════════════════════════════════════
CREATOR DNA — Personalised context for this creator
═══════════════════════════════════════════════════════════
Creator Type: ${dna.creator_type}
${modeContext}
Primary Niche: ${dna.primary_niche || currentInput.niche || 'Not set'}
Primary Platform: ${dna.primary_platform || currentInput.platform || 'YouTube'}
Language: ${dna.primary_language || currentInput.language || 'English'}
Channel Size: ${dna.channel_size} — ${channelSizeContext}
Streak: ${dna.streak_count} days active
Total Generations: ${dna.total_generations}
${dna.brand_voice ? `Brand Voice: ${dna.brand_voice}` : ''}
${dna.target_audience ? `Known Target Audience: ${dna.target_audience}` : ''}
${dna.content_pillars?.length > 0 ? `Content Pillars: ${dna.content_pillars.join(', ')}` : ''}
${avoidTopics}
═══════════════════════════════════════════════════════════
USE THIS CONTEXT to personalise every output. The creator is NOT a generic creator — 
tailor angles, examples, language, and tone to match their established identity.
`.trim();
}