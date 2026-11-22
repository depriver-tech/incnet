import { AccessError, redeemCode } from '@/lib/access';
import { cleanIp, cleanMac, json, portalSite } from '@/lib/portal';
import { clientIp, throttled } from '@/lib/throttle';

export const dynamic = 'force-dynamic';

export async function POST(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  // Codes are short, so guessing must be slow.
  if (throttled(`voucher:${slug}:${clientIp(req)}`, 10)) return json({ error: 'Too many tries. Wait a minute and try again.' }, 429);
  const site = await portalSite(slug);
  if (!site) return json({ error: 'This hotspot was not found.' }, 404);
  const body = await req.json().catch(() => ({}));
  try {
    const access = await redeemCode(site, String(body?.code ?? ''), cleanMac(body?.mac), cleanIp(body?.ip));
    return json({ accessId: access.id, code: access.code });
  } catch (err) {
    if (err instanceof AccessError) return json({ error: err.message }, 400);
    throw err;
  }
}
