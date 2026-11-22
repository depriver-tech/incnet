import { currentUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { syncScript } from '@/lib/routeros';
import { computeSync } from '@/lib/sync';

export const dynamic = 'force-dynamic';

/**
 * The simulated router. The dashboard calls this every few seconds in place of real hardware:
 * it runs the same check-in a MikroTik would, and reports the hotspot users the router now holds.
 */
export async function GET(req: Request, { params }: { params: Promise<{ siteId: string }> }) {
  const user = await currentUser();
  if (!user) return Response.json({ error: 'Sign in' }, { status: 401 });
  const { siteId } = await params;
  const site = await db.site.findFirst({ where: { id: siteId, kind: 'simulated', workspace: { members: { some: { userId: user.id } } } } });
  if (!site) return Response.json({ error: 'Not found' }, { status: 404 });

  const data = await computeSync(site, new URL(req.url).searchParams.get('c'), 'simulator');
  const script = syncScript({ ...data, loginSize: 0, loginUrl: '(simulated)', token: 'inr_…' });

  const applied = (await db.site.findUniqueOrThrow({ where: { id: site.id }, select: { appliedCursor: true } })).appliedCursor;
  const active = await db.access.findMany({
    where: { workspaceId: site.workspaceId, status: 'active', OR: [{ siteId: null }, { siteId: site.id }], expiresAt: { gt: new Date() } },
    orderBy: { activatedAt: 'desc' },
    take: 50,
    include: { package: { select: { name: true, downKbps: true, upKbps: true } } },
  });
  return Response.json({
    cursor: data.cursor.toString(),
    changes: data.accesses.length,
    script,
    users: active.map((a) => ({
      code: a.code, kind: a.kind, package: a.package.name, down: a.package.downKbps, up: a.package.upKbps,
      expiresAt: a.expiresAt, mac: a.mac, ip: a.ip, onRouter: applied >= BigInt(a.updatedAt.getTime()),
    })),
  }, { headers: { 'Cache-Control': 'no-store' } });
}
