import { decrypt } from '../crypto';
import { incpesa } from './incpesa';
import { snippe } from './snippe';
import type { Credentials, PaymentProvider } from './types';

export const PROVIDERS: Record<string, PaymentProvider> = { incpesa, snippe };

/** The workspace's configured provider and decrypted keys, or null when mobile payments are off. */
export function providerFor(ws: { paymentProvider: string; paymentKeyEnc: string | null; paymentSecretEnc: string | null }): { provider: PaymentProvider; creds: Credentials } | null {
  const provider = PROVIDERS[ws.paymentProvider];
  const key = decrypt(ws.paymentKeyEnc);
  if (!provider || !key) return null;
  return { provider, creds: { key, secret: decrypt(ws.paymentSecretEnc) } };
}
