import { APP_URL } from '@/lib/config';
import { db } from '@/lib/db';
import { providerFor } from '@/lib/payments';
import { ProviderError } from '@/lib/payments/types';
import { normalizeTzPhone } from '@/lib/phone';
import { cleanMac, json, portalSite } from '@/lib/portal';
import { clientIp, throttled } from '@/lib/throttle';

export const dynamic = 'force-dynamic';

export async function POST(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (throttled(`pay:${slug}:${clientIp(req)}`, 5)) return json({ error: 'Too many payment requests. Wait a minute and try again.' }, 429);
  const site = await portalSite(slug);
  if (!site) return json({ error: 'This hotspot was not found.' }, 404);
  const p = providerFor(site.workspace);
  if (!p) return json({ error: 'Mobile payments are not available here yet. Ask staff for a voucher.' }, 400);

  const body = await req.json().catch(() => ({}));
  const phone = normalizeTzPhone(String(body?.phone ?? ''));
  if (!phone) return json({ error: 'Enter a valid mobile number, like 0712 345 678.' }, 400);
  const pkg = await db.package.findFirst({ where: { id: String(body?.packageId ?? ''), workspaceId: site.workspaceId, active: true } });
  if (!pkg) return json({ error: 'Choose a package.' }, 400);
  if (pkg.price < p.provider.minAmount) return json({ error: `Mobile payments start at TSh ${p.provider.minAmount}.` }, 400);

  // Each prompt rings a real phone: no more than 3 per number every 10 minutes.
  const recent = await db.payment.count({ where: { workspaceId: site.workspaceId, phone, createdAt: { gte: new Date(Date.now() - 10 * 60_000) } } });
  if (recent >= 3) return json({ error: 'Too many prompts to this number. Try again in a few minutes.' }, 429);

  const payment = await db.payment.create({
    data: { workspaceId: site.workspaceId, siteId: site.id, packageId: pkg.id, amount: pkg.price, phone, mac: cleanMac(body?.mac), provider: p.provider.id },
  });
  try {
    const result = await p.provider.createCharge(p.creds, {
      reference: payment.id,
      amount: pkg.price,
      phone,
      description: `${site.workspace.name} Wi-Fi: ${pkg.name}`.slice(0, 120),
      callbackUrl: `${APP_URL}/api/webhooks/${p.provider.id}/${site.workspaceId}`,
    });
    await db.payment.update({ where: { id: payment.id }, data: { providerRef: result.providerRef ?? null, ...(result.status === 'failed' ? { status: 'failed', failureReason: result.failureReason } : {}) } });
    return json({ paymentId: payment.id });
  } catch (err) {
    const definite = err instanceof ProviderError && err.definite;
    await db.payment.update({ where: { id: payment.id }, data: definite ? { status: 'failed', failureReason: (err as Error).message.slice(0, 200) } : { failureReason: 'Prompt not confirmed yet' } });
    if (definite) return json({ error: 'The payment could not be started. Check the number and try again.' }, 400);
    if (!(err instanceof ProviderError)) console.error('pay', err);
    return json({ paymentId: payment.id });
  }
}
