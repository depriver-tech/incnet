import { applyCharge } from '@/lib/access';
import { db } from '@/lib/db';
import { providerFor } from '@/lib/payments';
import { validSnippeSignature } from '@/lib/payments/snippe';

export const dynamic = 'force-dynamic';

/**
 * Payment providers call this when a payment finishes. The body is only a hint:
 * the result is always re-read from the provider with the workspace's own key before anything is unlocked.
 */
export async function POST(req: Request, { params }: { params: Promise<{ provider: string; workspaceId: string }> }) {
  const { provider: providerId, workspaceId } = await params;
  const workspace = await db.workspace.findUnique({ where: { id: workspaceId } });
  const p = workspace && providerFor(workspace);
  if (!p || p.provider.id !== providerId) return new Response('Not configured', { status: 404 });

  const raw = await req.text();
  if (providerId === 'snippe' && p.creds.secret && !validSnippeSignature(raw, req.headers.get('x-webhook-timestamp'), req.headers.get('x-webhook-signature'), p.creds.secret)) {
    return new Response('Invalid signature', { status: 401 });
  }

  let event: any = null;
  try { event = JSON.parse(raw); } catch { return new Response('Bad request', { status: 400 }); }
  const data = event?.data ?? {};
  const ours = String(data.reference ?? data.metadata?.incnet_id ?? '');
  const payment = await db.payment.findFirst({
    where: { workspaceId, OR: [{ id: ours }, { id: String(data.metadata?.incnet_id ?? '') }, ...(data.reference ? [{ providerRef: String(data.reference) }] : []), ...(data.id ? [{ providerRef: String(data.id) }] : [])] },
  });
  if (!payment) return new Response('OK');

  try {
    const result = await p.provider.fetchCharge(p.creds, { reference: payment.id, providerRef: payment.providerRef });
    if (result) await applyCharge(payment.id, result);
    return new Response('OK');
  } catch (err) {
    console.error('webhook', err);
    return new Response('Retry later', { status: 502 });
  }
}
