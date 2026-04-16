// app/api/payment/transactions/route.js
export const runtime     = 'nodejs';
export const maxDuration = 10;

import { verifyAuth }   from '@/packages/supabase';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function GET(request) {
  try {
    let user;
    try { user = await verifyAuth(request); }
    catch (e) { return Response.json({ error: e.message }, { status: 401 }); }

    const { data: transactions, error } = await supabaseAdmin
      .from('transactions')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) throw new Error(error.message);

    const { data: subscription } = await supabaseAdmin
      .from('subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .single();

    const { data: giftsSent } = await supabaseAdmin
      .from('gift_codes')
      .select('*')
      .eq('sender_user_id', user.id)
      .order('created_at', { ascending: false });

    return Response.json({
      success: true,
      transactions: transactions || [],
      subscription:  subscription  || null,
      giftsSent:     giftsSent     || [],
    });

  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}