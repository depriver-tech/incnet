import { db } from './db';
import { dayKey, startOfDay, startOfMonth } from './time';

/**
 * Reporting. A sale is either a completed mobile money payment or a voucher used for the first time
 * (valued at its package price). Everything is filtered by period, router, package and channel, and
 * bucketed in the business's own time zone.
 */
export type Preset = 'today' | '7d' | '30d' | 'month' | 'lastMonth' | 'custom';
export type Channel = 'all' | 'mobile' | 'voucher';
export type ReportFilters = { preset: Preset; from: Date; to: Date; prevFrom: Date; prevTo: Date; site: string; pkg: string; channel: Channel; hourly: boolean; fromInput: string; toInput: string };

const DAY = 86_400_000;

/** Reads filters from the address bar. Unknown values fall back to the last 30 days, everything included. */
export function parseFilters(q: Record<string, string | undefined>, tz: string): ReportFilters {
  const preset = (['today', '7d', '30d', 'month', 'lastMonth', 'custom'].includes(q.period || '') ? q.period : '30d') as Preset;
  const now = new Date();
  let from: Date;
  let to = new Date(startOfDay(tz, now).getTime() + DAY);
  if (preset === 'today') from = startOfDay(tz, now);
  else if (preset === '7d') from = new Date(to.getTime() - 7 * DAY);
  else if (preset === 'month') from = startOfMonth(tz, now);
  else if (preset === 'lastMonth') { to = startOfMonth(tz, now); from = startOfMonth(tz, new Date(to.getTime() - DAY)); }
  else if (preset === 'custom' && /^\d{4}-\d{2}-\d{2}$/.test(q.from || '') && /^\d{4}-\d{2}-\d{2}$/.test(q.to || '')) {
    from = startOfDay(tz, new Date(`${q.from}T12:00:00Z`));
    to = new Date(startOfDay(tz, new Date(`${q.to}T12:00:00Z`)).getTime() + DAY);
    if (to <= from || to.getTime() - from.getTime() > 400 * DAY) { from = new Date(to.getTime() - 30 * DAY); }
  } else from = new Date(to.getTime() - 30 * DAY);
  const span = to.getTime() - from.getTime();
  const channel = (['mobile', 'voucher'].includes(q.channel || '') ? q.channel : 'all') as Channel;
  return {
    preset, from, to, prevFrom: new Date(from.getTime() - span), prevTo: from, site: q.site || '', pkg: q.pkg || '', channel,
    hourly: span <= DAY + 1000, fromInput: dayKey(tz, from), toInput: dayKey(tz, new Date(to.getTime() - 1)),
  };
}

export type Sale = { at: Date; amount: number; channel: 'mobile' | 'voucher'; packageId: string; siteId: string | null; phone: string | null; code: string | null; status: string };

/** Every sale in a range, both channels, honouring the router, package and channel filters. */
export async function salesIn(workspaceId: string, f: ReportFilters, from: Date, to: Date): Promise<Sale[]> {
  const out: Sale[] = [];
  if (f.channel !== 'voucher') {
    const payments = await db.payment.findMany({
      where: { workspaceId, status: 'completed', completedAt: { gte: from, lt: to }, ...(f.site ? { siteId: f.site } : {}), ...(f.pkg ? { packageId: f.pkg } : {}) },
      select: { amount: true, completedAt: true, packageId: true, siteId: true, phone: true, access: { select: { code: true } } },
      take: 50_000,
    });
    for (const p of payments) out.push({ at: p.completedAt!, amount: p.amount, channel: 'mobile', packageId: p.packageId, siteId: p.siteId, phone: p.phone, code: p.access?.code ?? null, status: 'completed' });
  }
  if (f.channel !== 'mobile') {
    const vouchers = await db.access.findMany({
      where: { workspaceId, kind: 'voucher', activatedAt: { gte: from, lt: to }, ...(f.site ? { activeSiteId: f.site } : {}), ...(f.pkg ? { packageId: f.pkg } : {}) },
      select: { activatedAt: true, packageId: true, activeSiteId: true, code: true, status: true, package: { select: { price: true } } },
      take: 50_000,
    });
    for (const v of vouchers) out.push({ at: v.activatedAt!, amount: v.package.price, channel: 'voucher', packageId: v.packageId, siteId: v.activeSiteId, phone: null, code: v.code, status: v.status });
  }
  return out.sort((a, b) => b.at.getTime() - a.at.getTime());
}

const pct = (now: number, before: number) => (before === 0 ? (now === 0 ? 0 : null) : Math.round(((now - before) / before) * 100));

export async function buildReport(ws: { id: string; timezone: string }, f: ReportFilters) {
  const tz = ws.timezone;
  const [sales, prev, attempts, packages, sites] = await Promise.all([
    salesIn(ws.id, f, f.from, f.to),
    salesIn(ws.id, f, f.prevFrom, f.prevTo),
    f.channel === 'voucher' ? Promise.resolve([]) : db.payment.groupBy({
      by: ['status'],
      where: { workspaceId: ws.id, createdAt: { gte: f.from, lt: f.to }, ...(f.site ? { siteId: f.site } : {}), ...(f.pkg ? { packageId: f.pkg } : {}) },
      _count: true,
    }),
    db.package.findMany({ where: { workspaceId: ws.id }, select: { id: true, name: true, price: true } }),
    db.site.findMany({ where: { workspaceId: ws.id }, select: { id: true, name: true } }),
  ]);

  const revenue = sales.reduce((s, x) => s + x.amount, 0);
  const prevRevenue = prev.reduce((s, x) => s + x.amount, 0);
  const phones = new Set(sales.filter((s) => s.phone).map((s) => s.phone));
  const prevPhones = new Set(prev.filter((s) => s.phone).map((s) => s.phone));
  const outcome = Object.fromEntries(attempts.map((a) => [a.status, a._count])) as Record<string, number>;
  const attemptsTotal = Object.values(outcome).reduce((s, n) => s + n, 0);
  const settled = (outcome.completed ?? 0) + (outcome.failed ?? 0) + (outcome.expired ?? 0);

  // Time buckets: hours for a single day, days otherwise.
  const buckets: { key: string; label: string; mobile: number; voucher: number; count: number }[] = [];
  const index = new Map<string, number>();
  const hourFmt = new Intl.DateTimeFormat('en-GB', { timeZone: tz, hour: '2-digit', hourCycle: 'h23' });
  if (f.hourly) {
    for (let h = 0; h < 24; h++) { index.set(String(h), buckets.length); buckets.push({ key: String(h), label: `${String(h).padStart(2, '0')}:00`, mobile: 0, voucher: 0, count: 0 }); }
  } else {
    for (let t = f.from.getTime() + 12 * 3600_000; t < f.to.getTime(); t += DAY) {
      const d = new Date(t);
      const key = dayKey(tz, d);
      if (index.has(key)) continue;
      index.set(key, buckets.length);
      buckets.push({ key, label: d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', timeZone: tz }), mobile: 0, voucher: 0, count: 0 });
    }
  }
  const weekdayFmt = new Intl.DateTimeFormat('en-GB', { timeZone: tz, weekday: 'short' });
  const WEEK = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const heat = Array.from({ length: 7 }, () => Array(24).fill(0) as number[]);
  const byPkg = new Map<string, { revenue: number; count: number }>();
  const bySite = new Map<string, { revenue: number; count: number }>();
  const customers = new Map<string, { total: number; count: number; last: Date }>();

  for (const s of sales) {
    const hour = Number(hourFmt.format(s.at));
    const b = buckets[index.get(f.hourly ? String(hour) : dayKey(tz, s.at)) ?? -1];
    if (b) { b[s.channel] += s.amount; b.count += 1; }
    heat[WEEK.indexOf(weekdayFmt.format(s.at))][hour] += 1;
    const p = byPkg.get(s.packageId) ?? { revenue: 0, count: 0 }; p.revenue += s.amount; p.count += 1; byPkg.set(s.packageId, p);
    const siteKey = s.siteId ?? '-';
    const r = bySite.get(siteKey) ?? { revenue: 0, count: 0 }; r.revenue += s.amount; r.count += 1; bySite.set(siteKey, r);
    if (s.phone) { const c = customers.get(s.phone) ?? { total: 0, count: 0, last: s.at }; c.total += s.amount; c.count += 1; if (s.at > c.last) c.last = s.at; customers.set(s.phone, c); }
  }

  const pkgName = new Map(packages.map((p) => [p.id, p.name]));
  const siteName = new Map(sites.map((s) => [s.id, s.name]));
  const rank = <T extends { revenue: number }>(m: Map<string, T>, name: (k: string) => string) =>
    [...m.entries()].map(([k, v]) => ({ id: k, label: name(k), ...v, share: revenue ? v.revenue / revenue : 0 })).sort((a, b) => b.revenue - a.revenue);

  return {
    kpi: {
      revenue: { value: revenue, delta: pct(revenue, prevRevenue) },
      sales: { value: sales.length, delta: pct(sales.length, prev.length) },
      avg: { value: sales.length ? Math.round(revenue / sales.length) : 0, delta: pct(sales.length ? revenue / sales.length : 0, prev.length ? prevRevenue / prev.length : 0) },
      customers: { value: phones.size, delta: pct(phones.size, prevPhones.size) },
      success: { value: settled ? Math.round(((outcome.completed ?? 0) / settled) * 100) : null, attempts: attemptsTotal },
    },
    mix: { mobile: sales.filter((s) => s.channel === 'mobile').reduce((t, s) => t + s.amount, 0), voucher: sales.filter((s) => s.channel === 'voucher').reduce((t, s) => t + s.amount, 0) },
    buckets,
    byPackage: rank(byPkg, (k) => pkgName.get(k) ?? 'Deleted package'),
    byRouter: rank(bySite, (k) => siteName.get(k) ?? 'Unknown router'),
    heat,
    outcome: { completed: outcome.completed ?? 0, failed: outcome.failed ?? 0, expired: outcome.expired ?? 0, pending: outcome.pending ?? 0, review: outcome.needs_review ?? 0 },
    topCustomers: [...customers.entries()].map(([phone, c]) => ({ phone, ...c })).sort((a, b) => b.total - a.total).slice(0, 8),
    packages, sites,
  };
}

/** Rebuilds a query string from filters, for links and the CSV export. */
export function filterQuery(f: ReportFilters, extra: Record<string, string> = {}) {
  const q = new URLSearchParams({ period: f.preset, ...(f.preset === 'custom' ? { from: f.fromInput, to: f.toInput } : {}), ...(f.site ? { site: f.site } : {}), ...(f.pkg ? { pkg: f.pkg } : {}), ...(f.channel !== 'all' ? { channel: f.channel } : {}), ...extra });
  return q.toString();
}
