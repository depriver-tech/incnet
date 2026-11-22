import type { PaymentProvider } from './types';

/**
 * Test mode: no money moves. Every payment completes about six seconds after it starts,
 * so the full flow (prompt, waiting, connected) can be tried without a payment account.
 */
const DELAY_MS = 6000;

export const test: PaymentProvider = {
  id: 'test',
  label: 'Test mode',
  minAmount: 0,
  async createCharge(_creds, input) {
    return { status: 'pending', providerRef: `test_${Date.now()}_${input.reference.slice(-6)}` };
  },
  async fetchCharge(_creds, { providerRef }) {
    const started = Number(providerRef?.split('_')[1]);
    if (!started) return null;
    return Date.now() - started > DELAY_MS ? { status: 'completed' } : { status: 'pending' };
  },
};
