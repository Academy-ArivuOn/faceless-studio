// packages/razorpay.js
// Razorpay 2026 API helper — server-side only

import crypto from 'crypto';

const RAZORPAY_KEY_ID     = process.env.RAZORPAY_KEY_ID;
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET;
const RAZORPAY_API        = 'https://api.razorpay.com/v1';

// ── Auth header ──────────────────────────────────────────────────────────────
function authHeader() {
  const credentials = Buffer.from(`${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`).toString('base64');
  return { Authorization: `Basic ${credentials}`, 'Content-Type': 'application/json' };
}

// ── Create Order ─────────────────────────────────────────────────────────────
export async function createOrder({ amount, currency = 'INR', receipt, notes = {} }) {
  const res = await fetch(`${RAZORPAY_API}/orders`, {
    method: 'POST',
    headers: authHeader(),
    body: JSON.stringify({ amount, currency, receipt, notes }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error?.description || 'Failed to create Razorpay order');
  }
  return res.json();
}

// ── Verify Payment Signature ─────────────────────────────────────────────────
export function verifyPaymentSignature({ orderId, paymentId, signature }) {
  const body        = `${orderId}|${paymentId}`;
  const expected    = crypto
    .createHmac('sha256', RAZORPAY_KEY_SECRET)
    .update(body)
    .digest('hex');
  return crypto.timingSafeEqual(Buffer.from(expected, 'hex'), Buffer.from(signature, 'hex'));
}

// ── Fetch Payment ────────────────────────────────────────────────────────────
export async function fetchPayment(paymentId) {
  const res = await fetch(`${RAZORPAY_API}/payments/${paymentId}`, {
    headers: authHeader(),
  });
  if (!res.ok) throw new Error('Failed to fetch payment');
  return res.json();
}

// ── Plan amounts (in paise) ───────────────────────────────────────────────────
export const PLAN_PRICES = {
  pro: {
    monthly: {
      INR: 39900,   // ₹399
      USD: 1600,    // $16
      EUR: 1400,    // €14
      GBP: 1300     // £13
    },
    annual: {
      INR: 399900,  // ₹3999
      USD: 16000,   // $160
      EUR: 14000,   // €140
      GBP: 13000    // £130
    },
  },
  studio: {
    monthly: {
      INR: 99900,   // ₹999
      USD: 4000,    // $40
      EUR: 3400,    // €34
      GBP: 3200     // £32
    },
    annual: {
      INR: 999900,  // ₹9999
      USD: 40000,   // $400
      EUR: 34000,   // €340
      GBP: 32000    // £320
    },
  },
};

export const CURRENCY_SYMBOLS = { INR: '₹', USD: '$', EUR: '€', GBP: '£' };
export const SUPPORTED_CURRENCIES = ['INR', 'USD', 'EUR', 'GBP'];

// ── Generate gift code ────────────────────────────────────────────────────────
export function generateGiftCode() {
  const chars  = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const parts  = Array.from({ length: 3 }, () =>
    Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
  );
  return parts.join('-');  // e.g. XKQR-7M2N-P9YT
}