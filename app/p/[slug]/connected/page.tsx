import Link from 'next/link';
import { notFound } from 'next/navigation';
import { db } from '@/lib/db';
import { duration } from '@/lib/format';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Connected (simulator)', robots: { index: false } };

/** Stands in for the router's login page when the router is simulated. */
export default async function SimConnected({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<{ username?: string }> }) {
  const { slug } = await params;
  const { username } = await searchParams;
  const site = await db.site.findUnique({ where: { slug }, include: { workspace: true } });
  if (!site || site.kind !== 'simulated') notFound();
  const access = username ? await db.access.findUnique({ where: { workspaceId_code: { workspaceId: site.workspaceId, code: username.toUpperCase() } }, include: { package: true } }) : null;
  const ok = access && access.status === 'active' && access.expiresAt && access.expiresAt > new Date();
  const left = ok ? Math.max(1, Math.round((access!.expiresAt!.getTime() - Date.now()) / 60_000)) : 0;
  const color = site.workspace.brandColor;
  return (
    <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: 20, fontFamily: 'system-ui, sans-serif', background: '#f4f6f5', color: '#14181a' }}>
      <div style={{ width: 'min(400px, 100%)', background: '#fff', border: '1px solid #e3e8e6', borderRadius: 20, padding: 28, textAlign: 'center', boxShadow: '0 10px 30px rgba(0,0,0,.06)' }}>
        <div style={{ width: 60, height: 60, margin: '0 auto 14px', borderRadius: '50%', background: ok ? color : '#d64545', color: '#fff', display: 'grid', placeItems: 'center', fontSize: 28, fontWeight: 800 }}>{ok ? '✓' : '!'}</div>
        <h1 style={{ fontSize: 22, margin: '0 0 6px' }}>{ok ? 'Online (simulated)' : 'Login refused'}</h1>
        <p style={{ color: '#5f6b6d', margin: '0 0 16px' }}>
          {ok ? <>The router accepted code <b style={{ fontFamily: 'monospace' }}>{access!.code}</b>. {access!.package.name}, about {duration(left)} left.</> : 'The router does not know this code yet, or its time is up.'}
        </p>
        <p style={{ fontSize: 13, color: '#5f6b6d', background: '#f4f6f5', borderRadius: 12, padding: 12, margin: '0 0 16px' }}>This is the simulator. On a real router, this is the moment the phone gets internet.</p>
        <Link href={`/p/${slug}`} style={{ color, fontWeight: 600 }}>Back to the Wi-Fi page</Link>
      </div>
    </div>
  );
}
