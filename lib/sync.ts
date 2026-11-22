import { db } from './db';
import { sha256 } from './crypto';
import { APP_URL } from './config';
import { loginPage, syncScript } from './routeros';
import { openndsLines } from './opennds';

/** Changes are re-sent for this long, so a write that commits during a sync is never missed. */
const LAG_MS = 2000;
const PAGE = 300;

/** Resolves a router's Bearer token to its site. */
export async function siteFromRequest(req: Request, siteId: string) {
  const header = req.headers.get('authorization') || '';
  const token = header.toLowerCase().startsWith('bearer ') ? header.slice(7).trim() : '';
  if (!token.startsWith('inr_')) return null;
  const site = await db.site.findUnique({ where: { tokenHash: sha256(token) } });
  return site && site.id === siteId ? { site, token } : null;
}

export type SyncAccess = { code: string; status: string; packageId: string; expiresAt: Date | null; dataLimitMb: number | null; ip: string | null; mac: string | null };
export type SyncPackage = { id: string; downKbps: number; upKbps: number; devices: number };
export type SyncData = { full: boolean; packages: SyncPackage[]; accesses: SyncAccess[]; cursor: bigint };

/**
 * The changes a router has not applied yet, and records that it checked in.
 * The cursor is the time (ms) up to which the router has applied everything; 0 asks for a full resync.
 */
export async function computeSync(site: { id: string; workspaceId: string }, cursorParam: string | null, version: string | null): Promise<SyncData> {
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
  const rows = await db.access.findMany({
    where: full ? { ...scope, status: 'active' } : { ...scope, updatedAt: { gt: new Date(Number(since)) }, status: { not: 'unused' } },
    orderBy: { updatedAt: 'asc' },
    take: PAGE,
    select: { code: true, status: true, packageId: true, expiresAt: true, updatedAt: true, ip: true, mac: true, package: { select: { dataLimitMb: true } } },
  });

  const changedSince = new Date(Number(since));
  const packages = await db.package.findMany({
    where: {
      workspaceId: site.workspaceId,
      OR: full
        ? [{ siteId: null }, { siteId: site.id }]
        : [{ siteId: null, updatedAt: { gt: changedSince } }, { siteId: site.id, updatedAt: { gt: changedSince } }, { id: { in: [...new Set(rows.map((a) => a.packageId))] } }],
    },
    select: { id: true, downKbps: true, upKbps: true, devices: true },
  });

  // A full page means more is waiting: continue just before the last change (re-sending it is harmless).
  const next = rows.length === PAGE ? BigInt(rows[rows.length - 1].updatedAt.getTime() - 1) : BigInt(started - LAG_MS);
  return {
    full,
    packages,
    accesses: rows.map((a) => ({ code: a.code, status: a.status, packageId: a.packageId, expiresAt: a.expiresAt, dataLimitMb: a.package.dataLimitMb, ip: a.ip, mac: a.mac })),
    cursor: next > 0n ? next : 1n,
  };
}

/** The response body for a router of this kind: RouterOS script, or openNDS agent lines. */
export async function buildSync(site: { id: string; workspaceId: string; slug: string; kind: string }, token: string, cursorParam: string | null, version: string | null) {
  const data = await computeSync(site, cursorParam, version);
  if (site.kind === 'opennds') return openndsLines(data);
  const login = loginPage(site.slug);
  return syncScript({ ...data, loginSize: Buffer.byteLength(login), loginUrl: `${APP_URL}/api/router/${site.id}/login`, token });
}

/** True once the router has applied the change that made this code active. */
export function isOnRouter(site: { appliedCursor: bigint }, access: { updatedAt: Date }) {
  return site.appliedCursor >= BigInt(access.updatedAt.getTime());
}
