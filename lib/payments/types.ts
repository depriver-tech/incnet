export type ChargeStatus = 'pending' | 'completed' | 'failed' | 'expired';

export interface ChargeInput {
  reference: string; // our Payment id
  amount: number;
  phone: string; // 255XXXXXXXXX
  description: string;
  callbackUrl: string;
}

export interface ChargeResult {
  status: ChargeStatus;
  amount?: number;
  providerRef?: string | null;
  failureReason?: string | null;
}

export interface Credentials {
  key: string;
  secret?: string | null;
}

export interface PaymentProvider {
  id: string;
  label: string;
  minAmount: number;
  createCharge(creds: Credentials, input: ChargeInput): Promise<ChargeResult>;
  /** Looks the charge up by our reference (or the provider's reference). Null when unknown. */
  fetchCharge(creds: Credentials, ref: { reference: string; providerRef?: string | null }): Promise<ChargeResult | null>;
}

export class ProviderError extends Error {
  /** True when the provider answered and refused, so no prompt went out. */
  constructor(message: string, public definite: boolean) {
    super(message);
  }
}

export function mapStatus(value: unknown): ChargeStatus {
  const s = String(value || '').toLowerCase();
  if (s === 'completed' || s === 'successful' || s === 'success') return 'completed';
  if (s === 'failed' || s === 'voided' || s === 'cancelled' || s === 'rejected') return 'failed';
  if (s === 'expired') return 'expired';
  return 'pending';
}
