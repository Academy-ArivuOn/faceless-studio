export const runtime     = 'nodejs';
export const maxDuration = 10;

import { verifyAuth, checkUsage } from '@/packages/supabase';

export async function GET(request) {
  try {
    // Verify auth
    let user;
    try {
      user = await verifyAuth(request);
    } catch (authError) {
      return Response.json(
        { error: authError.message || 'Authentication required' },
        { status: authError.statusCode || 401 }
      );
    }

    // Get usage
    const usage = await checkUsage(user.id);

    return Response.json({
      success: true,
      usage: {
        plan:       usage.plan,
        used:       usage.used,
        limit:      usage.limit,
        remaining:  usage.remaining,
        allowed:    usage.allowed,
        reset_date: usage.reset_date,
      },
    });

  } catch (err) {
    console.error('[usage] Error:', err.message);
    return Response.json(
      { error: 'Failed to retrieve usage information.' },
      { status: 500 }
    );
  }
}