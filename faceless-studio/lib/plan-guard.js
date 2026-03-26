import { verifyAuth, checkUsage } from '@/lib/supabase';

// ─── Plan hierarchy ───────────────────────────────────────────────────────────
export const PLAN_RANK = { free: 0, pro: 1, studio: 2 };

// Which minimum plan each agent requires
export const AGENT_PLAN = {
  // Free
  research:           'free',
  creator:            'free',
  publisher:          'free',
  // Pro
  'trend-spy':        'pro',
  'title-battle':     'pro',
  'thumbnail-brain':  'pro',
  'hook-upgrader':    'pro',
  'comment-reply':    'pro',
  // Studio
  'competitor-autopsy':  'studio',
  'viral-decoder':       'studio',
  'channel-strategy':    'studio',
  'monetisation-coach':  'studio',
  'script-localiser':    'studio',
};

// ─── Guard function ───────────────────────────────────────────────────────────
// Call at the top of every Pro/Studio route handler.
// Returns { user, usage } on success, or returns a Response directly on failure.
export async function guardAgent(request, agentId) {
  // 1. Auth
  let user;
  try {
    user = await verifyAuth(request);
  } catch (authError) {
    return {
      blocked: true,
      response: Response.json(
        { error: authError.message || 'Authentication required' },
        { status: authError.statusCode || 401 }
      ),
    };
  }

  // 2. Usage / plan check
  let usage;
  try {
    usage = await checkUsage(user.id);
  } catch (usageError) {
    console.error(`[${agentId}] Usage check failed:`, usageError.message);
    return {
      blocked: true,
      response: Response.json(
        { error: 'Failed to verify plan access. Please try again.' },
        { status: 500 }
      ),
    };
  }

  // 3. Plan gate
  const requiredPlan = AGENT_PLAN[agentId] || 'pro';
  const requiredRank = PLAN_RANK[requiredPlan] ?? 1;
  const userRank     = PLAN_RANK[usage.plan] ?? 0;

  if (userRank < requiredRank) {
    return {
      blocked: true,
      response: Response.json(
        {
          error:         `This agent requires the ${requiredPlan} plan or above.`,
          code:          'PLAN_UPGRADE_REQUIRED',
          required_plan:  requiredPlan,
          current_plan:   usage.plan,
        },
        { status: 403 }
      ),
    };
  }

  return { blocked: false, user, usage };
}