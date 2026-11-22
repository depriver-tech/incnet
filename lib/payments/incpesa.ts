import { providerFetch } from './http';
import { mapStatus, type PaymentProvider } from './types';

/** incpesa merchant API (incpritech.com). Money settles to the venue's own incpesa balance. */
const BASE = (process.env.INCPESA_API_URL || 'https://incpritech.com/api/incpesa/v1').replace(/\/$/, '');

export const incpesa: PaymentProvider = {
  id: 'incpesa',
  label: 'incpesa',
  minAmount: 500,
  async createCharge({ key }, input) {
    const data = await providerFetch(`${BASE}/payments`, {
      key,
      method: 'POST',
      body: JSON.stringify({ amount: input.amount, phone: input.phone, reference: input.reference, description: input.description, callback_url: input.callbackUrl }),
    });
    return { status: mapStatus(data?.status), providerRef: data?.id ?? null, failureReason: data?.failure_reason ?? null };
  },
  async fetchCharge({ key }, { reference }) {
    const data = await providerFetch(`${BASE}/payments/${encodeURIComponent(reference)}`, { key });
    if (!data) return null;
    return { status: mapStatus(data.status), amount: Number(data.amount), providerRef: data.id ?? null, failureReason: data.failure_reason ?? null };
  },
};
