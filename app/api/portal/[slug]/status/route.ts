import { refreshPayment } from '@/lib/access';
import { db } from '@/lib/db';
import { json, portalSite } from '@/lib/portal';
import { isOnRouter } from '@/lib/sync';

export const dynamic = 'force-dynamic';

/**
 * What the phone should show next:
 * paying → waiting for the PIN; failed → try again; syncing → paid, router is picking up the code; ready → log in.
 */
export async function GET(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const site = await portalSite(slug);
  if (!site) return json({ error: 'Not found' }, 404);
  const url = new URL(req.url);
  let accessId = url.searchParams.get('access');

  const paymentId = url.searchParams.get('payment');
  if (paymentId) {
    const payment = await refreshPayment(paymentId);
    if (!payment || payment.workspaceId !== site.workspaceId) return json({ error: 'Not found' }, 404);
    if (payment.status === 'pending') return json({ state: 'paying' });
    if (payment.status === 'needs_review') return json({ state: 'failed', message: 'We received a different amount. Show this screen to staff.' });
    if (payment.status !== 'completed' || !payment.accessId) return json({ state: 'failed', message: 'The payment did not go through. No money was taken. Try again.' });
    accessId = payment.accessId;
  }

  const access = accessId ? await db.access.findFirst({ where: { id: accessId, workspaceId: site.workspaceId } }) : null;
  if (!access) return json({ error: 'Not found' }, 404);
  const fresh = await db.site.findUniqueOrThrow({ where: { id: site.id }, select: { appliedCursor: true, lastSeenAt: true } });
  const online = !!fresh.lastSeenAt && Date.now() - fresh.lastSeenAt.getTime() < 60_000;
  return json({
    state: isOnRouter(fresh, access) ? 'ready' : 'syncing',
    routerOnline: online,
    accessId: access.id,
    code: access.code,
    expiresAt: access.expiresAt,
  });
}
