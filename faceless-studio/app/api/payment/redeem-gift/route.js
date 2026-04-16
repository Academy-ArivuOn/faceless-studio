// app/api/payment/redeem-gift/route.js
export const runtime     = 'nodejs';
export const maxDuration = 15;

import { verifyAuth }   from '@/packages/supabase';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(request) {
  try {
    let user;
    try { user = await verifyAuth(request); }
    catch (e) { return Response.json({ error: e.message }, { status: 401 }); }

    const { code } = await request.json();
    if (!code?.trim())
      return Response.json({ error: 'Gift code is required' }, { status: 400 });

    // Fetch gift code
    const { data: gift, error: giftErr } = await supabaseAdmin
      .from('gift_codes')
      .select('*')
      .eq('code', code.trim().toUpperCase())
      .single();

    if (giftErr || !gift)
      return Response.json({ error: 'Invalid gift code' }, { status: 404 });

    if (gift.status === 'redeemed')
      return Response.json({ error: 'This gift code has already been redeemed' }, { status: 400 });

    if (gift.status === 'expired' || new Date(gift.expires_at) < new Date())
      return Response.json({ error: 'This gift code has expired' }, { status: 400 });

    // Mark redeemed
    await supabaseAdmin
      .from('gift_codes')
      .update({
        status:              'redeemed',
        redeemed_by_user_id: user.id,
        redeemed_at:         new Date().toISOString(),
      })
      .eq('id', gift.id);

    // Upgrade user plan
    const now      = new Date();
    const periodEnd = new Date(now);
    periodEnd.setMonth(periodEnd.getMonth() + gift.duration_months);

    await supabaseAdmin
      .from('user_usage')
      .update({ plan: gift.plan, plan_activated_at: now.toISOString(), updated_at: now.toISOString() })
      .eq('user_id', user.id);

    await supabaseAdmin
      .from('subscriptions')
      .upsert({
        user_id:              user.id,
        plan:                 gift.plan,
        billing_cycle:        'gift',
        status:               'active',
        current_period_start: now.toISOString(),
        current_period_end:   periodEnd.toISOString(),
        updated_at:           now.toISOString(),
      }, { onConflict: 'user_id' });

    return Response.json({
      success:  true,
      plan:     gift.plan,
      months:   gift.duration_months,
      periodEnd: periodEnd.toISOString(),
    });

  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}