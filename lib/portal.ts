import { db } from './db';
import type { PortalDesign, PortalPkg } from '@/app/p/[slug]/Portal';
import { duration, money, speed } from './format';

export const portalSite = (slug: string) =>
  db.site.findUnique({ where: { slug }, include: { workspace: true } });

export const json = (data: unknown, status = 200) => Response.json(data, { status, headers: { 'Cache-Control': 'no-store' } });

export const cleanMac = (mac: unknown) => (typeof mac === 'string' && /^[0-9A-Fa-f:-]{11,17}$/.test(mac) ? mac.toUpperCase() : null);

export const cleanIp = (ip: unknown) => (typeof ip === 'string' && /^(\d{1,3}\.){3}\d{1,3}$/.test(ip) ? ip : null);


type DesignSource = { brandColor: string; portalTheme: string; portalLogo: string | null; portalBg: string | null; portalHeadline: string | null; welcomeText: string | null; termsText: string | null; portalLang: string; supportPhone: string | null };

export function portalDesign(ws: DesignSource): PortalDesign {
  return {
    theme: ws.portalTheme, color: ws.brandColor, logo: ws.portalLogo, bg: ws.portalBg, headline: ws.portalHeadline,
    welcome: ws.welcomeText, terms: ws.termsText, lang: ws.portalLang === 'sw' ? 'sw' : 'en', supportPhone: ws.supportPhone,
  };
}

/** Packages sold at this router: its own plus the ones sold everywhere. */
export async function portalPackages(site: { id: string; workspaceId: string; workspace: { currency: string } }): Promise<PortalPkg[]> {
  const packages = await db.package.findMany({ where: { workspaceId: site.workspaceId, active: true, OR: [{ siteId: null }, { siteId: site.id }] }, orderBy: [{ sort: 'asc' }, { price: 'asc' }] });
  return packages.map((p) => ({ id: p.id, name: p.name, price: p.price, priceLabel: money(p.price, site.workspace.currency), duration: duration(p.durationMinutes), speed: speed(p.downKbps), data: p.dataLimitMb ? `${+(p.dataLimitMb / 1024).toFixed(1)} GB` : null }));
}
