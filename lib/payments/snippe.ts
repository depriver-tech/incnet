import crypto from 'crypto';
import { providerFetch } from './http';
import { mapStatus, type PaymentProvider } from './types';

/** Snippe (snippe.sh) direct, for operators with their own Snippe account. */
const BASE = 'https://api.snippe.sh';

export const snippe: PaymentProvider = {
  id: 'snippe',
  label: 'Snippe',
  minAmount: 500,
  async createCharge({ key }, input) {
    const data = await providerFetch(`${BASE}/v1/payments`, {
      key,
      method: 'POST',
      // Snippe rejects idempotency keys longer than 30 characters.
      headers: { 'Idempotency-Key': input.reference.slice(0, 30) },
      body: JSON.stringify({
        payment_type: 'mobile',
        details: { amount: input.amount, currency: 'TZS' },
        phone_number: input.phone,
        customer: { firstname: 'Wi-Fi', lastname: 'Customer', email: 'wifi@example.com' },
        webhook_url: input.callbackUrl,
        metadata: { incnet_id: input.reference },
      }),
    });
    return { status: mapStatus(data?.status), providerRef: data?.reference ?? null };
  },
  async fetchCharge({ key }, { providerRef }) {
    if (!providerRef) return null;
    const data = await providerFetch(`${BASE}/v1/payments/${encodeURIComponent(providerRef)}`, { key });
    if (!data) return null;
    const amount = typeof data.amount === 'object' ? data.amount?.value : data.amount;
    return { status: mapStatus(data.status), amount: Number(amount), providerRef: data.reference ?? providerRef, failureReason: data.failure_reason ?? null };
  },
};

/** HMAC-SHA256 over `{timestamp}.{raw body}`, as hex. Rejects anything older than five minutes. */
export function validSnippeSignature(rawBody: string, timestamp: string | null, signature: string | null, secret: string) {
  if (!timestamp || !signature || !/^\d+$/.test(timestamp) || !/^[a-f0-9]{64}$/i.test(signature)) return false;
  if (Math.abs(Date.now() / 1000 - Number(timestamp)) > 300) return false;
  const expected = crypto.createHmac('sha256', secret).update(`${timestamp}.${rawBody}`).digest();
  return crypto.timingSafeEqual(expected, Buffer.from(signature, 'hex'));
}
