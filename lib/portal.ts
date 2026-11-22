import { db } from './db';

export const portalSite = (slug: string) =>
  db.site.findUnique({ where: { slug }, include: { workspace: true } });

export const json = (data: unknown, status = 200) => Response.json(data, { status, headers: { 'Cache-Control': 'no-store' } });

export const cleanMac = (mac: unknown) => (typeof mac === 'string' && /^[0-9A-Fa-f:-]{11,17}$/.test(mac) ? mac.toUpperCase() : null);
