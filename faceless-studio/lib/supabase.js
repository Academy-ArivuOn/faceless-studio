import { createClient } from '@supabase/supabase-js';

// ─── Clients ──────────────────────────────────────────────────────────────────
// Service role client — bypasses RLS for backend writes. NEVER expose to browser.
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: { persistSession: false, autoRefreshToken: false },
  }
);

// Anon client — used only for verifying user JWTs
const supabaseAnon = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  {
    auth: { persistSession: false },
  }
);

// ─── Plan Limits ──────────────────────────────────────────────────────────────
export const PLAN_LIMITS = {
  free:   3,
  pro:    Infinity,
  studio: Infinity,
};

// ─── nextMonthStart ───────────────────────────────────────────────────────────
// Returns an ISO timestamp for the 1st of next month at 00:00:00 UTC
function nextMonthStart() {
  const now  = new Date();
  const next = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1, 0, 0, 0, 0));
  return next.toISOString();
}

// ─── verifyAuth ───────────────────────────────────────────────────────────────
// Extracts the Bearer token from the Authorization header and verifies it with Supabase.
// Returns the user object or throws an error with statusCode 401.
export async function verifyAuth(request) {
  const authHeader = request.headers.get('Authorization') || request.headers.get('authorization');

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    const err = new Error('Missing or malformed Authorization header');
    err.statusCode = 401;
    throw err;
  }

  const token = authHeader.replace('Bearer ', '').trim();

  const { data: { user }, error } = await supabaseAnon.auth.getUser(token);

  if (error || !user) {
    const err = new Error(error?.message || 'Invalid or expired session token');
    err.statusCode = 401;
    throw err;
  }

  return user;
}

// ─── getOrCreateUsage ─────────────────────────────────────────────────────────
// Returns the user_usage row, creating one if this is the user's first request.
export async function getOrCreateUsage(userId) {
  const { data: existing, error: fetchError } = await supabaseAdmin
    .from('user_usage')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (existing) return existing;

  // First time — create the row (the trigger should have done this, but belt-and-suspenders)
  if (fetchError?.code === 'PGRST116') {
    const { data: created, error: createError } = await supabaseAdmin
      .from('user_usage')
      .insert({
        user_id:          userId,
        plan:             'free',
        generations_count: 0,
        total_generations: 0,
        reset_date:        nextMonthStart(),
      })
      .select()
      .single();

    if (createError) throw new Error(`Failed to create usage row: ${createError.message}`);
    return created;
  }

  throw new Error(`Failed to fetch usage row: ${fetchError?.message}`);
}

// ─── checkUsage ───────────────────────────────────────────────────────────────
// Returns { allowed, plan, used, limit, remaining, reason }
// Auto-resets monthly counter if reset_date has passed.
export async function checkUsage(userId) {
  const usage = await getOrCreateUsage(userId);

  // Auto-reset if past the reset date
  if (usage.reset_date && new Date() >= new Date(usage.reset_date)) {
    const { data: reset, error: resetError } = await supabaseAdmin
      .from('user_usage')
      .update({
        generations_count: 0,
        reset_date:        nextMonthStart(),
        updated_at:        new Date().toISOString(),
      })
      .eq('user_id', userId)
      .select()
      .single();

    if (!resetError && reset) {
      usage.generations_count = 0;
      usage.reset_date = reset.reset_date;
    }
  }

  const plan      = usage.plan || 'free';
  const used      = usage.generations_count || 0;
  const limit     = PLAN_LIMITS[plan] ?? PLAN_LIMITS.free;
  const remaining = limit === Infinity ? Infinity : Math.max(0, limit - used);
  const allowed   = remaining > 0;

  return {
    allowed,
    plan,
    used,
    limit:     limit === Infinity ? null : limit,
    remaining: remaining === Infinity ? null : remaining,
    reason:    allowed ? null : `Monthly limit reached (${used}/${limit} on ${plan} plan)`,
    reset_date: usage.reset_date,
  };
}

// ─── incrementUsage ───────────────────────────────────────────────────────────
// Atomically increments the usage counter.
// Prefers RPC (avoids race conditions); falls back to manual update.
export async function incrementUsage(userId) {
  // Try the atomic RPC first
  const { error: rpcError } = await supabaseAdmin.rpc('increment_usage', { uid: userId });

  if (!rpcError) return;

  // Fallback: manual increment (non-atomic but acceptable for low concurrency)
  console.warn('[incrementUsage] RPC failed, using fallback:', rpcError.message);

  const usage = await getOrCreateUsage(userId);

  const { error: updateError } = await supabaseAdmin
    .from('user_usage')
    .update({
      generations_count: (usage.generations_count || 0) + 1,
      total_generations: (usage.total_generations  || 0) + 1,
      updated_at:        new Date().toISOString(),
    })
    .eq('user_id', userId);

  if (updateError) {
    // Non-critical — log but don't throw. Generation already succeeded.
    console.error('[incrementUsage] Fallback update failed:', updateError.message);
  }
}

// ─── saveGeneration ───────────────────────────────────────────────────────────
// Saves the full generation pack to the generations table.
// Non-critical — logs errors but does not throw.
export async function saveGeneration({ userId, input, research, creator, publisher, durationMs }) {
  try {
    const { data, error } = await supabaseAdmin
      .from('generations')
      .insert({
        user_id:              userId,
        niche:                input.niche,
        platform:             input.platform,
        tone:                 input.tone     || 'Educational',
        language:             input.language || 'English',
        creator_type:         input.creatorType,
        chosen_topic:         research.chosen_topic,
        chosen_hook:          research.chosen_hook,
        research_output:      research,
        creator_output:       creator,
        publisher_output:     publisher,
        generation_duration_ms: durationMs,
        generated_at:         new Date().toISOString(),
      })
      .select('id')
      .single();

    if (error) {
      console.error('[saveGeneration] Insert error:', error.message);
      return null;
    }
    return data?.id;
  } catch (err) {
    console.error('[saveGeneration] Unexpected error:', err.message);
    return null;
  }
}

// ─── getHistory ───────────────────────────────────────────────────────────────
// Returns the last N generations for a user (lightweight — no full JSONB blobs).
export async function getHistory(userId, limit = 20) {
  const { data, error } = await supabaseAdmin
    .from('generations')
    .select('id, niche, platform, creator_type, chosen_topic, chosen_hook, generated_at')
    .eq('user_id', userId)
    .order('generated_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('[getHistory] Error:', error.message);
    return [];
  }
  return data || [];
}

// ─── updateStreak ─────────────────────────────────────────────────────────────
// Checks the user's last generation date and updates streak accordingly:
// - Same day → keep current streak (don't double-count)
// - Yesterday → increment streak
// - Anything older → reset to 1
// Returns the new streak count.
export async function updateStreak(userId) {
  try {
    const { data: profile, error: fetchError } = await supabaseAdmin
      .from('profiles')
      .select('streak_count, last_generation_date')
      .eq('id', userId)
      .single();

    if (fetchError || !profile) return 1;

    const today         = new Date().toISOString().slice(0, 10);           // YYYY-MM-DD
    const lastDate      = profile.last_generation_date;
    const currentStreak = profile.streak_count || 0;

    let newStreak;

    if (lastDate === today) {
      // Already generated today — don't change streak
      newStreak = currentStreak;
    } else if (lastDate) {
      const last       = new Date(lastDate);
      const todayDate  = new Date(today);
      const diffDays   = Math.round((todayDate - last) / (1000 * 60 * 60 * 24));

      newStreak = diffDays === 1 ? currentStreak + 1 : 1;
    } else {
      newStreak = 1;
    }

    const { error: updateError } = await supabaseAdmin
      .from('profiles')
      .update({
        streak_count:          newStreak,
        last_generation_date:  today,
        updated_at:            new Date().toISOString(),
      })
      .eq('id', userId);

    if (updateError) {
      console.error('[updateStreak] Update error:', updateError.message);
    }

    return newStreak;
  } catch (err) {
    console.error('[updateStreak] Unexpected error:', err.message);
    return 1;
  }
}

// ─── upgradePlan ─────────────────────────────────────────────────────────────
// Called from the Lemon Squeezy webhook to change a user's plan.
export async function upgradePlan(userId, plan) {
  const validPlans = ['free', 'pro', 'studio'];
  if (!validPlans.includes(plan)) {
    throw new Error(`Invalid plan: ${plan}. Must be one of: ${validPlans.join(', ')}`);
  }

  const { error } = await supabaseAdmin
    .from('user_usage')
    .update({
      plan:             plan,
      plan_activated_at: plan !== 'free' ? new Date().toISOString() : null,
      updated_at:        new Date().toISOString(),
    })
    .eq('user_id', userId);

  if (error) throw new Error(`Failed to upgrade plan: ${error.message}`);
}

// ─── getUserByEmail ───────────────────────────────────────────────────────────
// Used by the webhook to look up a user by email address.
// Queries auth.users via the admin API (service role required).
export async function getUserByEmail(email) {
  // Supabase Admin API — lists users with filter
  const { data, error } = await supabaseAdmin.auth.admin.listUsers({
    page:    1,
    perPage: 1,
    // Supabase doesn't support direct email filter in listUsers,
    // so we query the profiles table instead
  });

  // Query profiles table (which mirrors auth.users email via trigger)
  const { data: profile, error: profileError } = await supabaseAdmin
    .from('profiles')
    .select('id, email')
    .eq('email', email.toLowerCase().trim())
    .single();

  if (profileError || !profile) return null;
  return profile;
}