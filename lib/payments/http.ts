import { ProviderError } from './types';

export async function providerFetch(url: string, init: RequestInit & { key: string }) {
  let res: Response;
  try {
    res = await fetch(url, {
      ...init,
      cache: 'no-store',
      signal: AbortSignal.timeout(20_000),
      headers: { Authorization: `Bearer ${init.key}`, Accept: 'application/json', 'Content-Type': 'application/json', ...init.headers },
    });
  } catch {
    throw new ProviderError('The payment service did not answer.', false);
  }
  const body = await res.json().catch(() => null);
  if (res.status === 404) return null;
  if (!res.ok) {
    const definite = res.status >= 400 && res.status < 500 && res.status !== 408 && res.status !== 429;
    throw new ProviderError(body?.error || body?.message || `Payment service returned ${res.status}`, definite);
  }
  return body?.data ?? body;
}
