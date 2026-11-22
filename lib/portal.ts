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
  const [packages, sold] = await Promise.all([
    db.package.findMany({ where: { workspaceId: site.workspaceId, active: true, OR: [{ siteId: null }, { siteId: site.id }] }, orderBy: [{ sort: 'asc' }, { price: 'asc' }] }),
    db.payment.groupBy({ by: ['packageId'], where: { workspaceId: site.workspaceId, status: 'completed', completedAt: { gte: new Date(Date.now() - 30 * 86_400_000) } }, _count: true }),
  ]);
  // "Most popular" goes to the best seller of the last 30 days, when there is a clear one.
  const best = [...sold].sort((a, b) => b._count - a._count)[0];
  const popularId = best && best._count >= 3 && packages.some((p) => p.id === best.packageId) ? best.packageId : null;
  return packages.map((p) => ({
    popular: p.id === popularId, id: p.id, name: p.name, price: p.price, priceLabel: money(p.price, site.workspace.currency), duration: duration(p.durationMinutes), speed: speed(p.downKbps), data: p.dataLimitMb ? `${+(p.dataLimitMb / 1024).toFixed(1)} GB` : null }));
}
