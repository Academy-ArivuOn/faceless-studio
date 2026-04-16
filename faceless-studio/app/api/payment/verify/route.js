// app/api/payment/verify/route.js
export const runtime     = 'nodejs';
export const maxDuration = 20;

import { verifyAuth }                                      from '@/packages/supabase';
import { verifyPaymentSignature, fetchPayment, generateGiftCode } from '@/packages/razorpay';
import { createClient }                                    from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(request) {
  try {
    let user;
    try { user = await verifyAuth(request); }
    catch (e) { return Response.json({ error: e.message }, { status: 401 }); }

    const { razorpayOrderId, razorpayPaymentId, razorpaySignature, txId } = await request.json();

    // 1. Verify signature
    let signatureValid = false;
    try {
      signatureValid = verifyPaymentSignature({
        orderId:   razorpayOrderId,
        paymentId: razorpayPaymentId,
        signature: razorpaySignature,
      });
    } catch {
      return Response.json({ error: 'Invalid payment signature' }, { status: 400 });
    }

    if (!signatureValid)
      return Response.json({ error: 'Payment signature verification failed' }, { status: 400 });

    // 2. Fetch payment details from Razorpay
    let payment;
    try { payment = await fetchPayment(razorpayPaymentId); }
    catch (e) { return Response.json({ error: 'Could not fetch payment details' }, { status: 500 }); }

    if (payment.status !== 'captured')
      return Response.json({ error: 'Payment not captured yet' }, { status: 400 });

    // 3. Get transaction record
    const { data: tx, error: txFetchErr } = await supabaseAdmin
      .from('transactions')
      .select('*')
      .eq('id', txId)
      .eq('user_id', user.id)
      .single();

    if (txFetchErr || !tx)
      return Response.json({ error: 'Transaction not found' }, { status: 404 });

    if (tx.status === 'captured')
      return Response.json({ success: true, alreadyProcessed: true });

    // 4. Update transaction
    const { error: txUpdateErr } = await supabaseAdmin
      .from('transactions')
      .update({
        razorpay_payment_id: razorpayPaymentId,
        razorpay_signature:  razorpaySignature,
        status:              'captured',
        payment_method:      payment.method,
        updated_at:          new Date().toISOString(),
      })
      .eq('id', txId);

    if (txUpdateErr) console.error('[verify] TX update error:', txUpdateErr.message);

    // 5. Handle subscription upgrade OR gift
    if (tx.payment_type === 'gift') {
      // Generate gift code, send email (email sending omitted — hook into your email provider)
      const giftCode = generateGiftCode();
      const expiresAt = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString();

      await supabaseAdmin.from('gift_codes').insert({
        code:                 giftCode,
        transaction_id:       txId,
        sender_user_id:       user.id,
        recipient_email:      tx.gift_recipient_email,
        recipient_name:       tx.gift_recipient_name,
        plan:                 tx.plan,
        duration_months:      tx.gift_duration_months,
        message:              tx.gift_message,
        status:               'pending',
        expires_at:           expiresAt,
      });

      // Update transaction with gift code
      await supabaseAdmin.from('transactions')
        .update({ gift_code: giftCode })
        .eq('id', txId);

      return Response.json({ success: true, paymentType: 'gift', giftCode });

    } else {
      // Upgrade user plan
      const now        = new Date();
      const periodEnd  = new Date(now);
      if (tx.billing_cycle === 'annual') periodEnd.setFullYear(periodEnd.getFullYear() + 1);
      else periodEnd.setMonth(periodEnd.getMonth() + 1);

      // Update user_usage plan
      await supabaseAdmin
        .from('user_usage')
        .update({
          plan:              tx.plan,
          plan_activated_at: now.toISOString(),
          updated_at:        now.toISOString(),
        })
        .eq('user_id', user.id);

      // Upsert subscription record
      await supabaseAdmin
        .from('subscriptions')
        .upsert({
          user_id:              user.id,
          razorpay_plan_id:     `${tx.plan}_${tx.billing_cycle}`,
          plan:                 tx.plan,
          billing_cycle:        tx.billing_cycle,
          status:               'active',
          current_period_start: now.toISOString(),
          current_period_end:   periodEnd.toISOString(),
          updated_at:           now.toISOString(),
        }, { onConflict: 'user_id' });

      return Response.json({
        success:     true,
        paymentType: 'subscription',
        plan:        tx.plan,
        billingCycle: tx.billing_cycle,
        periodEnd:   periodEnd.toISOString(),
      });
    }

  } catch (err) {
    console.error('[verify]', err.message);
    return Response.json({ error: err.message || 'Verification failed' }, { status: 500 });
  }
}