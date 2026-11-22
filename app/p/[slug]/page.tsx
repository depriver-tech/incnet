import { notFound } from 'next/navigation';
import { db } from '@/lib/db';
import { duration, money, speed } from '@/lib/format';
import { providerFor } from '@/lib/payments';
import { Portal } from './Portal';

export const dynamic = 'force-dynamic';

/** Only hand phones back to a router login on a private address, never to an arbitrary site. */
function routerLogin(value: string | undefined) {
  if (!value) return null;
  try {
    const url = new URL(value);
    const privateHost = /^(10\.\d+\.\d+\.\d+|192\.168\.\d+\.\d+|172\.(1[6-9]|2\d|3[01])\.\d+\.\d+)$/.test(url.hostname) || !url.hostname.includes('.');
    return (url.protocol === 'http:' || url.protocol === 'https:') && privateHost ? `${url.origin}${url.pathname}` : null;
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const site = await db.site.findUnique({ where: { slug }, include: { workspace: { select: { name: true } } } });
  return { title: site ? `${site.workspace.name} Wi-Fi` : 'Wi-Fi', robots: { index: false } };
}

export default async function PortalPage({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<Record<string, string | undefined>> }) {
  const { slug } = await params;
  const q = await searchParams;
  const site = await db.site.findUnique({ where: { slug }, include: { workspace: true } });
  if (!site) notFound();
  const ws = site.workspace;
  const packages = await db.package.findMany({ where: { workspaceId: ws.id, active: true }, orderBy: [{ sort: 'asc' }, { price: 'asc' }] });
  const pay = providerFor(ws);

  return (
    <Portal
      slug={slug}
      business={ws.name}
      welcome={ws.welcomeText}
      color={ws.brandColor}
      supportPhone={ws.supportPhone}
      payments={!!pay}
      minPayment={pay?.provider.minAmount ?? 0}
      packages={packages.map((p) => ({ id: p.id, name: p.name, price: p.price, priceLabel: money(p.price, ws.currency), duration: duration(p.durationMinutes), speed: speed(p.downKbps), data: p.dataLimitMb ? `${+(p.dataLimitMb / 1024).toFixed(1)} GB` : null }))}
      ctx={{ mac: q.mac ?? null, login: routerLogin(q.login), dst: q.dst && /^https?:\/\//.test(q.dst) ? q.dst : null, err: q.err?.trim() || null }}
    />
  );
}
