// packages/session-context.js
// Agent chaining — stores and retrieves shared context across agents in a session

import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false, autoRefreshToken: false } }
);

// ─── Save session context ──────────────────────────────────────────────────────
export async function saveSessionContext(userId, sessionId, contextData) {
  try {
    const { error } = await supabaseAdmin
      .from('agent_sessions')
      .upsert({
        id:         sessionId,
        user_id:    userId,
        context:    contextData,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'id' });

    if (error) console.warn('[session-context] Save error:', error.message);
  } catch (err) {
    console.warn('[session-context] Unexpected error:', err.message);
  }
}

// ─── Get session context ───────────────────────────────────────────────────────
export async function getSessionContext(sessionId) {
  try {
    const { data, error } = await supabaseAdmin
      .from('agent_sessions')
      .select('context')
      .eq('id', sessionId)
      .single();

    if (error || !data) return null;
    return data.context;
  } catch (err) {
    console.warn('[session-context] Fetch error:', err.message);
    return null;
  }
}

// ─── Build chained context block for pro/studio agents ────────────────────────
export function buildChainedContextBlock(sessionContext) {
  if (!sessionContext) return '';

  const parts = [];

  if (sessionContext.research) {
    const r = sessionContext.research;
    parts.push(`
RESEARCH AGENT OUTPUT (already completed):
- Chosen Topic: ${r.chosen_topic || ''}
- Chosen Hook: ${r.chosen_hook || ''}
- Hook Trigger: ${r.chosen_hook_trigger || ''}
- Target Audience: ${r.target_audience_description || ''}
- Competitor Gap: ${r.competitor_gap || ''}
- Trending Angles Found: ${r.trending_angles?.map(a => a.topic).join(', ') || ''}
- Thumbnail Concept: ${r.thumbnail_concept || ''}
`.trim());
  }

  if (sessionContext.creator) {
    const c = sessionContext.creator;
    parts.push(`
CREATOR AGENT OUTPUT (already completed):
- Script Word Count: ${c.word_count || 0}
- Estimated Duration: ${c.estimated_duration || ''}
- Hook Used: ${c.hook_breakdown?.hook_text || ''}
- Hook Type: ${c.hook_breakdown?.trigger_type || ''}
- Scene Count: ${c.scenes?.length || 0}
- CTA Used: ${c.cta_options?.[0]?.cta_text || ''}
`.trim());
  }

  if (sessionContext.trendSpy) {
    const t = sessionContext.trendSpy;
    parts.push(`
TREND SPY OUTPUT (already completed):
- Top Trending Topic: ${t.trending_now?.[0]?.topic || ''}
- Niche Pulse: ${t.niche_pulse || ''}
- Best Upload Window: ${t.best_upload_window?.date_guidance || ''} at ${t.best_upload_window?.time_slot || ''}
`.trim());
  }

  if (sessionContext.titleBattle) {
    const tb = sessionContext.titleBattle;
    parts.push(`
TITLE BATTLE OUTPUT (already completed):
- Winning Title: ${tb.winner?.title || ''}
- Title Formula: ${tb.title_formula || ''}
`.trim());
  }

  if (sessionContext.channelStrategy) {
    const cs = sessionContext.channelStrategy;
    parts.push(`
CHANNEL STRATEGY (already completed):
- Current Month Objective: ${cs.roadmap?.[0]?.objective || ''}
- Content Pillars: ${cs.content_pillars?.map(p => p.pillar_name).join(', ') || ''}
`.trim());
  }

  if (sessionContext.competitorAutopsy) {
    const ca = sessionContext.competitorAutopsy;
    parts.push(`
COMPETITOR AUTOPSY (already completed):
- Top Gap to Exploit: ${ca.content_gaps?.[0]?.gap || ''}
- Their Weakness: ${ca.weaknesses?.[0]?.weakness || ''}
- Your Differentiation: ${ca.battle_plan?.differentiation_angle || ''}
`.trim());
  }

  if (parts.length === 0) return '';

  return `
═══════════════════════════════════════════════════════════
AGENT CHAIN CONTEXT — Outputs from agents already run this session
USE THIS to ensure your output is consistent and builds on prior work.
═══════════════════════════════════════════════════════════
${parts.join('\n\n')}
═══════════════════════════════════════════════════════════`.trim();
}
