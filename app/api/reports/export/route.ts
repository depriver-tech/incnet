import { requireWorkspace } from '@/lib/auth';
import { db } from '@/lib/db';
import { can } from '@/lib/permissions';
import { parseFilters, salesIn } from '@/lib/reports';

export const dynamic = 'force-dynamic';

const cell = (v: unknown) => {
  const s = v === null || v === undefined ? '' : String(v);
  // Quote everything, and defuse spreadsheet formulas (=, +, -, @).
  return `"${(/^[=+\-@]/.test(s) ? `'${s}` : s).replace(/"/g, '""')}"`;
};

/** CSV of every sale matching the report filters. */
export async function GET(req: Request) {
  const { workspace, role } = await requireWorkspace();
  if (!can(role, 'reports.view')) return new Response('Forbidden', { status: 403 });
  const q = Object.fromEntries(new URL(req.url).searchParams);
  const f = parseFilters(q, workspace.timezone);
  const [sales, packages, sites] = await Promise.all([
    salesIn(workspace.id, f, f.from, f.to),
    db.package.findMany({ where: { workspaceId: workspace.id }, select: { id: true, name: true } }),
    db.site.findMany({ where: { workspaceId: workspace.id }, select: { id: true, name: true } }),
  ]);
  const pkg = new Map(packages.map((p) => [p.id, p.name]));
  const site = new Map(sites.map((s) => [s.id, s.name]));
  const when = new Intl.DateTimeFormat('en-CA', { timeZone: workspace.timezone, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' });
  const rows = [['Date', 'Channel', 'Package', 'Router', 'Amount (TZS)', 'Phone', 'Code']];
  for (const s of sales) rows.push([when.format(s.at).replace(',', ''), s.channel === 'mobile' ? 'Mobile money' : 'Voucher', pkg.get(s.packageId) ?? '', s.siteId ? site.get(s.siteId) ?? '' : '', String(s.amount), s.phone ?? '', s.code ?? '']);
  const body = '﻿' + rows.map((r) => r.map(cell).join(',')).join('\r\n') + '\r\n';
  const name = `incnet-sales-${f.fromInput}-to-${f.toInput}.csv`;
  return new Response(body, { headers: { 'Content-Type': 'text/csv; charset=utf-8', 'Content-Disposition': `attachment; filename="${name}"`, 'Cache-Control': 'no-store' } });
}
