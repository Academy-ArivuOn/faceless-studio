export const runtime     = 'nodejs';
export const maxDuration = 15;

import crypto             from 'crypto';
import { upgradePlan, getUserByEmail } from '@/lib/supabase';

// ─── Verify HMAC Signature ────────────────────────────────────────────────────
function verifySignature(rawBody, signatureHeader) {
  const secret = process.env.LEMONSQUEEZY_WEBHOOK_SECRET;
  if (!secret) {
    console.error('[webhook] LEMONSQUEEZY_WEBHOOK_SECRET is not set');
    return false;
  }
  if (!signatureHeader) return false;

  const expected = crypto
    .createHmac('sha256', secret)
    .update(rawBody, 'utf8')
    .digest('hex');

  // Use timingSafeEqual to prevent timing attacks
  try {
    return crypto.timingSafeEqual(
      Buffer.from(expected,       'hex'),
      Buffer.from(signatureHeader, 'hex')
    );
  } catch {
    return false;
  }
}

// ─── Map Variant ID to Plan Name ──────────────────────────────────────────────
function getPlanFromVariant(variantId) {
  const vid = String(variantId);
  if (vid === String(process.env.LS_VARIANT_PRO))    return 'pro';
  if (vid === String(process.env.LS_VARIANT_STUDIO)) return 'studio';
  return null;
}

// ─── POST Handler ─────────────────────────────────────────────────────────────
export async function POST(request) {
  // Read raw body as text — needed for HMAC verification
  let rawBody;
  try {
    rawBody = await request.text();
  } catch {
    return Response.json({ received: false, error: 'Failed to read body' }, { status: 200 });
  }

  // Verify signature
  const signature = request.headers.get('x-signature') || request.headers.get('X-Signature');
  if (!verifySignature(rawBody, signature)) {
    console.error('[webhook] Invalid signature — possible spoofed request');
    // Return 200 anyway so LS doesn't retry (bad signature = not our payload)
    return Response.json({ received: true, processed: false, reason: 'invalid_signature' }, { status: 200 });
  }

  // Parse body
  let event;
  try {
    event = JSON.parse(rawBody);
  } catch {
    console.error('[webhook] Failed to parse JSON body');
    return Response.json({ received: true, processed: false, reason: 'invalid_json' }, { status: 200 });
  }

  const eventName = event.meta?.event_name;
  const data      = event.data?.attributes || {};
  const variantId = data.first_order_item?.variant_id || data.variant_id;
  const email     = data.user_email || data.customer_email;

  console.log(`[webhook] Event: ${eventName} | Email: ${email} | Variant: ${variantId}`);

  // ── Upgrade events ─────────────────────────────────────────────────────────
  const upgradeEvents = [
    'order_created',
    'subscription_created',
    'subscription_resumed',
    'subscription_unpaused',
  ];

  // ── Downgrade events ───────────────────────────────────────────────────────
  const downgradeEvents = [
    'subscription_cancelled',
    'subscription_expired',
    'subscription_paused',
  ];

  try {
    if (upgradeEvents.includes(eventName)) {
      const plan = getPlanFromVariant(variantId);
      if (!plan) {
        console.warn(`[webhook] Unknown variant ID: ${variantId} — skipping upgrade`);
        return Response.json({ received: true, processed: false, reason: 'unknown_variant' }, { status: 200 });
      }

      if (!email) {
        console.error('[webhook] No email in upgrade event payload');
        return Response.json({ received: true, processed: false, reason: 'missing_email' }, { status: 200 });
      }

      const user = await getUserByEmail(email);
      if (!user) {
        console.warn(`[webhook] No user found for email: ${email}`);
        // Could be a purchase before account creation — log and move on
        return Response.json({ received: true, processed: false, reason: 'user_not_found' }, { status: 200 });
      }

      await upgradePlan(user.id, plan);
      console.log(`[webhook] ✅ Upgraded ${email} to ${plan}`);

    } else if (downgradeEvents.includes(eventName)) {
      if (!email) {
        console.error('[webhook] No email in downgrade event payload');
        return Response.json({ received: true, processed: false, reason: 'missing_email' }, { status: 200 });
      }

      const user = await getUserByEmail(email);
      if (!user) {
        console.warn(`[webhook] No user found for downgrade: ${email}`);
        return Response.json({ received: true, processed: false, reason: 'user_not_found' }, { status: 200 });
      }

      await upgradePlan(user.id, 'free');
      console.log(`[webhook] ⬇️ Downgraded ${email} to free`);

    } else {
      // Unhandled event type — log and acknowledge
      console.log(`[webhook] Unhandled event type: ${eventName} — acknowledged`);
    }

  } catch (err) {
    // Never return 4xx/5xx — Lemon Squeezy would retry, causing double upgrades
    console.error(`[webhook] Error processing event ${eventName}:`, err.message);
  }

  // Always return 200
  return Response.json({ received: true, processed: true }, { status: 200 });
}