// app/api/payment/create-order/route.js
export const runtime     = 'nodejs';
export const maxDuration = 15;

import { verifyAuth }               from '@/packages/supabase';
import { createOrder, PLAN_PRICES } from '@/packages/razorpay';
import { createClient }             from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(request) {
  try {
    // Auth
    let user;
    try { user = await verifyAuth(request); }
    catch (e) { return Response.json({ error: e.message }, { status: 401 }); }

    const body = await request.json();
    const { plan, billingCycle = 'monthly', currency = 'INR', paymentType = 'subscription', giftData } = body;

    if (!['pro', 'studio'].includes(plan))
      return Response.json({ error: 'Invalid plan' }, { status: 400 });
    if (!['monthly', 'annual'].includes(billingCycle))
      return Response.json({ error: 'Invalid billing cycle' }, { status: 400 });

    // Get amount
    const prices  = PLAN_PRICES[plan]?.[billingCycle];
    const amount  = prices?.[currency];
    if (!amount)
      return Response.json({ error: 'Invalid currency or plan' }, { status: 400 });

    const receipt = `studioai_${user.id.slice(0, 8)}_${Date.now()}`;
    const notes   = {
      user_id:      user.id,
      plan,
      billing_cycle: billingCycle,
      payment_type: paymentType,
      ...(giftData ? {
        gift_recipient_email: giftData.recipientEmail,
        gift_recipient_name:  giftData.recipientName,
        gift_duration_months: giftData.durationMonths,
      } : {}),
    };

    // Create Razorpay order
    const order = await createOrder({ amount, currency, receipt, notes });

    // Save transaction record (pending)
    const txData = {
      user_id:          user.id,
      razorpay_order_id: order.id,
      plan,
      billing_cycle:    billingCycle,
      amount,
      currency,
      status:           'created',
      payment_type:     paymentType,
      metadata:         { receipt, notes },
    };
    if (giftData) {
      txData.gift_recipient_email  = giftData.recipientEmail;
      txData.gift_recipient_name   = giftData.recipientName;
      txData.gift_message          = giftData.message || null;
      txData.gift_duration_months  = giftData.durationMonths;
    }

    const { data: tx, error: txErr } = await supabaseAdmin
      .from('transactions')
      .insert(txData)
      .select()
      .single();

    if (txErr) console.error('[create-order] DB error:', txErr.message);

    return Response.json({
      success:    true,
      orderId:    order.id,
      amount,
      currency,
      keyId:      process.env.RAZORPAY_KEY_ID,
      txId:       tx?.id,
    });

  } catch (err) {
    console.error('[create-order]', err.message);
    return Response.json({ error: err.message || 'Order creation failed' }, { status: 500 });
  }
}
