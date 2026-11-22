import { notFound } from 'next/navigation';
import { db } from '@/lib/db';
import { portalDesign, portalPackages } from '@/lib/portal';
import { providerFor } from '@/lib/payments';
import { Portal, type Handoff } from './Portal';

export const dynamic = 'force-dynamic';

const PRIVATE_IP = /^(10\.\d+\.\d+\.\d+|192\.168\.\d+\.\d+|172\.(1[6-9]|2\d|3[01])\.\d+\.\d+)$/;

/** Only hand phones back to a router login on a private address, never to an arbitrary site. */
function routerLogin(value: string | undefined) {
  if (!value) return null;
  try {
    const url = new URL(value);
    const privateHost = PRIVATE_IP.test(url.hostname) || !url.hostname.includes('.');
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

/**
 * The captive portal. Routers add what they know about the phone to the address:
 * MikroTik: mac, ip, login, dst. openNDS: clientip, clientmac, redir. The simulator: mac, ip.
 */
export default async function PortalPage({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<Record<string, string | undefined>> }) {
  const { slug } = await params;
  const q = await searchParams;
  const site = await db.site.findUnique({ where: { slug }, include: { workspace: true } });
  if (!site) notFound();
  if (site.workspace.suspendedAt) {
    return (
      <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: 24, fontFamily: 'system-ui, sans-serif', textAlign: 'center', color: '#3a4446' }}>
        <div><h1 style={{ fontSize: 20, marginBottom: 8 }}>{site.workspace.name} Wi-Fi</h1><p>Wi-Fi sales are paused right now. Please ask staff for help.<br />Mauzo ya Wi-Fi yamesimamishwa kwa sasa. Tafadhali muulize mhudumu.</p></div>
      </div>
    );
  }
  const pay = providerFor(site.workspace);

  const ip = q.ip || q.clientip || null;
  const dstRaw = q.dst || q.redir || null;
  let handoff: Handoff = { kind: 'none' };
  if (site.kind === 'simulated') handoff = { kind: 'router', url: `/p/${slug}/connected` };
  else if (site.kind === 'opennds' && ip) handoff = { kind: 'gateway' };
  else { const login = routerLogin(q.login); if (login) handoff = { kind: 'router', url: login }; }

  return (
    <Portal
      slug={slug}
      business={site.workspace.name}
      design={portalDesign(site.workspace)}
      payments={!!pay}
      minPayment={pay?.provider.minAmount ?? 0}
      packages={await portalPackages(site)}
      ctx={{
        mac: q.mac || q.clientmac || null,
        ip: ip && PRIVATE_IP.test(ip) ? ip : null,
        handoff,
        dst: dstRaw && /^https?:\/\//.test(dstRaw) ? dstRaw : null,
        err: q.err?.trim() || null,
        code: q.code && /^[A-Za-z0-9]{4,16}$/.test(q.code) ? q.code.toUpperCase() : null,
      }}
    />
  );
}
