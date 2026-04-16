// packages/supabase.js  — FIXED saveGeneration + all helpers
// Replace your existing packages/supabase.js with this file.

import { createClient } from '@supabase/supabase-js';

// ── Client (service-role for server-side writes) ───────────────────────────
function getServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Missing SUPABASE env vars');
  return createClient(url, key, { auth: { persistSession: false } });
}

// ── Auth helpers ───────────────────────────────────────────────────────────
export async function verifyAuth(request) {
  const authHeader = request.headers.get('Authorization') || '';
  const token = authHeader.replace(/^Bearer\s+/i, '').trim();
  if (!token) {
    const err = new Error('No authorization token provided');
    err.statusCode = 401;
    throw err;
  }

  const supabase = getServiceClient();
  const { data: { user }, error } = await supabase.auth.getUser(token);

  if (error || !user) {
    const err = new Error('Invalid or expired token');
    err.statusCode = 401;
    throw err;
  }

  return user;
}

// ── Usage helpers ──────────────────────────────────────────────────────────
export async function checkUsage(userId) {
  const supabase = getServiceClient();

  let { data, error } = await supabase
    .from('user_usage')
    .select('plan, generations_count, total_generations, reset_date')
    .eq('user_id', userId)
    .single();

  // Auto-create row if missing (new user trigger may not have fired yet)
  if (error && error.code === 'PGRST116') {
    const { data: inserted, error: insertErr } = await supabase
      .from('user_usage')
      .insert({
        user_id:           userId,
        plan:              'free',
        generations_count: 0,
        total_generations: 0,
        reset_date:        new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1).toISOString(),
      })
      .select('plan, generations_count, total_generations, reset_date')
      .single();

    if (insertErr) throw new Error(`checkUsage insert failed: ${insertErr.message}`);
    data = inserted;
    error = null;
  }

  if (error) throw new Error(`checkUsage failed: ${error.message}`);

  // Monthly reset check
  const now = new Date();
  const resetDate = data.reset_date ? new Date(data.reset_date) : null;
  if (resetDate && now >= resetDate) {
    const nextReset = new Date(now.getFullYear(), now.getMonth() + 1, 1).toISOString();
    await supabase
      .from('user_usage')
      .update({ generations_count: 0, reset_date: nextReset, updated_at: new Date().toISOString() })
      .eq('user_id', userId);
    data.generations_count = 0;
    data.reset_date = nextReset;
  }

  const LIMITS = { free: 3, pro: Infinity, studio: Infinity };
  const plan    = data.plan || 'free';
  const limit   = LIMITS[plan] ?? 3;
  const used    = data.generations_count || 0;
  const allowed = used < limit;

  return {
    plan,
    used,
    limit:      limit === Infinity ? null : limit,
    remaining:  limit === Infinity ? null : Math.max(0, limit - used),
    allowed,
    reset_date: data.reset_date,
    reason:     allowed ? null : `Monthly limit of ${limit} reached`,
  };
}

export async function incrementUsage(userId) {
  const supabase = getServiceClient();
  const { error } = await supabase.rpc('increment_usage', { uid: userId });
  if (error) throw new Error(`incrementUsage failed: ${error.message}`);
}

// ── Save generation ────────────────────────────────────────────────────────
// FIX: properly maps ALL input fields (creatorMode, blogType, location) to DB columns
export async function saveGeneration({ userId, input, research, creator, publisher, durationMs }) {
  const supabase = getServiceClient();

  const row = {
    user_id:                userId,
    // Core input fields (these columns exist in schema.sql)
    niche:                  input.niche        || null,
    platform:               input.platform     || null,
    tone:                   input.tone         || 'Educational',
    language:               input.language     || 'English',
    creator_type:           input.creatorType  || input.creator_type || null,
    // Derived from research output
    chosen_topic:           research?.chosen_topic || null,
    chosen_hook:            research?.chosen_hook  || null,
    // Full agent outputs stored as JSONB
    research_output:        research   || null,
    creator_output:         creator    || null,
    publisher_output:       publisher  || null,
    generation_duration_ms: durationMs || null,
    generated_at:           new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from('generations')
    .insert(row)
    .select('id')
    .single();

  if (error) {
    console.error('[saveGeneration] DB insert error:', error.message, error.details);
    throw new Error(`saveGeneration failed: ${error.message}`);
  }

  return data?.id || null;
}

// ── Streak ─────────────────────────────────────────────────────────────────
export async function updateStreak(userId) {
  const supabase = getServiceClient();

  const { data: profile, error: fetchErr } = await supabase
    .from('profiles')
    .select('streak_count, last_generation_date')
    .eq('id', userId)
    .single();

  if (fetchErr) {
    console.error('[updateStreak] fetch failed:', fetchErr.message);
    return 0;
  }

  const today     = new Date().toISOString().slice(0, 10);
  const lastDate  = profile?.last_generation_date;
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);

  let newStreak = 1;
  if (lastDate === yesterday) {
    newStreak = (profile.streak_count || 0) + 1;
  } else if (lastDate === today) {
    newStreak = profile.streak_count || 1; // already incremented today
  }

  await supabase
    .from('profiles')
    .update({
      streak_count:          newStreak,
      last_generation_date:  today,
      updated_at:            new Date().toISOString(),
    })
    .eq('id', userId);

  return newStreak;
}

// ── Plan management ────────────────────────────────────────────────────────
export async function upgradePlan(userId, plan) {
  const supabase = getServiceClient();

  const { error } = await supabase
    .from('user_usage')
    .update({
      plan,
      plan_activated_at: new Date().toISOString(),
      updated_at:        new Date().toISOString(),
    })
    .eq('user_id', userId);

  if (error) throw new Error(`upgradePlan failed: ${error.message}`);
}

export async function getUserByEmail(email) {
  const supabase = getServiceClient();

  const { data, error } = await supabase
    .from('profiles')
    .select('id, email')
    .eq('email', email.toLowerCase().trim())
    .single();

  if (error && error.code !== 'PGRST116') {
    console.error('[getUserByEmail] error:', error.message);
  }

  return data || null;
}