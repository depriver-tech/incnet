import { db } from './db';
import { sha256 } from './crypto';
import { APP_URL } from './config';
import { loginPage, syncScript } from './routeros';

/** Changes are re-sent for this long, so a write that commits during a sync is never missed. */
const LAG_MS = 2000;
const PAGE = 300;

/** Resolves the router's Bearer token to its site. */
export async function siteFromRequest(req: Request, siteId: string) {
  const header = req.headers.get('authorization') || '';
  const token = header.toLowerCase().startsWith('bearer ') ? header.slice(7).trim() : '';
  if (!token.startsWith('inr_')) return null;
  const site = await db.site.findUnique({ where: { tokenHash: sha256(token) } });
  return site && site.id === siteId ? { site, token } : null;
}

/** Builds the router's next sync script and records that the router checked in. */
export async function buildSync(site: { id: string; workspaceId: string; slug: string }, token: string, cursorParam: string | null, version: string | null) {
  const started = Date.now();
  const since = /^\d{1,15}$/.test(cursorParam || '') ? BigInt(cursorParam!) : 0n;
  const full = since === 0n;

  // Codes whose time is up become "expired", which makes them part of this round of changes.
  await db.access.updateMany({ where: { workspaceId: site.workspaceId, status: 'active', expiresAt: { lt: new Date() } }, data: { status: 'expired' } });

  await db.site.update({
    where: { id: site.id },
    data: { lastSeenAt: new Date(), ...(full ? {} : { appliedCursor: since }), ...(version ? { routerVersion: version.slice(0, 40) } : {}) },
  });

  const scope = { workspaceId: site.workspaceId, OR: [{ siteId: null }, { siteId: site.id }] };
  const accesses = await db.access.findMany({
    where: full ? { ...scope, status: 'active' } : { ...scope, updatedAt: { gt: new Date(Number(since)) }, status: { not: 'unused' } },
    orderBy: { updatedAt: 'asc' },
    take: PAGE,
    select: { code: true, status: true, packageId: true, expiresAt: true, updatedAt: true, package: { select: { dataLimitMb: true } } },
  });

  const packageWhere = full ? { workspaceId: site.workspaceId } : { workspaceId: site.workspaceId, OR: [{ updatedAt: { gt: new Date(Number(since)) } }, { id: { in: [...new Set(accesses.map((a) => a.packageId))] } }] };
  const packages = await db.package.findMany({ where: packageWhere, select: { id: true, downKbps: true, upKbps: true, devices: true } });

  // A full page means more is waiting: continue just before the last change (re-sending it is harmless).
  const cursor = accesses.length === PAGE ? BigInt(accesses[accesses.length - 1].updatedAt.getTime() - 1) : BigInt(started - LAG_MS);
  const login = loginPage(site.slug);
  return syncScript({
    full,
    packages,
    accesses: accesses.map((a) => ({ code: a.code, status: a.status, packageId: a.packageId, expiresAt: a.expiresAt, dataLimitMb: a.package.dataLimitMb })),
    cursor: cursor > 0n ? cursor : 1n,
    loginSize: Buffer.byteLength(login),
    loginUrl: `${APP_URL}/api/router/${site.id}/login`,
    token,
  });
}

/** True once the router has applied the change that made this code active. */
export function isOnRouter(site: { appliedCursor: bigint; lastSeenAt: Date | null }, access: { updatedAt: Date }) {
  return site.appliedCursor >= BigInt(access.updatedAt.getTime());
}
