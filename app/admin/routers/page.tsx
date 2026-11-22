import Link from 'next/link';
import { StatusBadge } from '@/components/RouterStatus';
import { ONLINE_MS } from '@/lib/admin';
import { db } from '@/lib/db';
import { ago } from '@/lib/format';

export const metadata = { title: 'Routers' };
const PAGE = 50;
const KIND: Record<string, string> = { mikrotik: 'MikroTik', opennds: 'Raspberry Pi / OpenWrt', simulated: 'Simulator' };

/** Every router on the platform and whether it is checking in. */
export default async function AdminRouters({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const q = await searchParams;
  const kind = Object.keys(KIND).includes(q.kind || '') ? q.kind! : '';
  const state = ['online', 'offline', 'never'].includes(q.state || '') ? q.state! : '';
  const search = (q.q || '').trim();
  const page = Math.max(1, Number(q.page) || 1);
  const online = new Date(Date.now() - ONLINE_MS);
  const where = {
    workspace: { isDemo: false },
    ...(kind ? { kind } : { kind: { not: 'simulated' } }),
    ...(state === 'online' ? { lastSeenAt: { gte: online } } : state === 'offline' ? { lastSeenAt: { lt: online } } : state === 'never' ? { lastSeenAt: null } : {}),
    ...(search ? { OR: [{ name: { contains: search, mode: 'insensitive' as const } }, { workspace: { name: { contains: search, mode: 'insensitive' as const } } }] } : {}),
  };
  const base = { workspace: { isDemo: false }, kind: { not: 'simulated' } };
  const [total, rows, allCount, onlineCount, neverCount, kinds] = await Promise.all([
    db.site.count({ where }),
    db.site.findMany({ where, orderBy: [{ lastSeenAt: { sort: 'desc', nulls: 'last' } }], skip: (page - 1) * PAGE, take: PAGE, include: { workspace: { select: { id: true, name: true } } } }),
    db.site.count({ where: base }),
    db.site.count({ where: { ...base, lastSeenAt: { gte: online } } }),
    db.site.count({ where: { ...base, lastSeenAt: null } }),
    db.site.groupBy({ by: ['kind'], where: { workspace: { isDemo: false } }, _count: true }),
  ]);
  const pages = Math.max(1, Math.ceil(total / PAGE));
  const link = (extra: Record<string, string>) => `/admin/routers?${new URLSearchParams({ ...Object.fromEntries(Object.entries(q).filter(([, v]) => v) as [string, string][]), ...extra })}`;
  return (
    <>
      <div className="page-head"><div><h1>Routers</h1><p>Every router on the platform and whether it is checking in.</p></div></div>
      <div className="grid grid-4" style={{ marginBottom: 16 }}>
        <div className="card card-pad kpi"><small>Routers</small><strong>{allCount}</strong><span className="muted small">{kinds.map((k) => `${k._count} ${KIND[k.kind] ?? k.kind}`).join(' · ') || 'none yet'}</span></div>
        <div className="card card-pad kpi"><small>Online now</small><strong>{onlineCount}</strong><span className="muted small">checked in within a minute</span></div>
        <div className="card card-pad kpi"><small>Offline</small><strong>{allCount - onlineCount - neverCount}</strong><span className="muted small">were set up, now quiet</span></div>
        <div className="card card-pad kpi"><small>Never set up</small><strong>{neverCount}</strong><span className="muted small">script not pasted yet</span></div>
      </div>
      <form className="card report-filters" method="get">
        <label>Search<input name="q" defaultValue={search} placeholder="Router or business" style={{ minWidth: 200 }} /></label>
        <label>Status<select name="state" defaultValue={state}><option value="">All</option><option value="online">Online</option><option value="offline">Offline</option><option value="never">Never set up</option></select></label>
        <label>Type<select name="kind" defaultValue={kind}><option value="">All hardware</option>{Object.entries(KIND).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></label>
        <button className="btn btn-sm">Apply</button>
        <Link className="btn btn-ghost btn-sm" href="/admin/routers">Reset</Link>
      </form>
      <section className="card">
        <div className="card-head"><h2>{total.toLocaleString('en-US')} routers</h2></div>
        {rows.length === 0 ? <p className="empty">No routers match.</p> : (
          <div className="table-wrap"><table>
            <thead><tr><th>Router</th><th>Business</th><th>Type</th><th>Version</th><th>Last check-in</th><th>Status</th></tr></thead>
            <tbody>{rows.map((s) => (
              <tr key={s.id}>
                <td><strong>{s.name}</strong></td>
                <td><Link className="accent" href={`/admin/businesses/${s.workspace.id}`}>{s.workspace.name}</Link></td>
                <td className="small">{KIND[s.kind] ?? s.kind}</td>
                <td className="muted small">{s.routerVersion ?? '—'}</td>
                <td className="muted small">{s.lastSeenAt ? ago(s.lastSeenAt) : 'never'}</td>
                <td><StatusBadge lastSeen={s.lastSeenAt} kind={s.kind} /></td>
              </tr>
            ))}</tbody>
          </table></div>
        )}
        {pages > 1 && <div className="pager">{page > 1 ? <Link className="btn btn-ghost btn-sm" href={link({ page: String(page - 1) })}>Previous</Link> : <span />}<span className="muted small">Page {page} of {pages}</span>{page < pages ? <Link className="btn btn-ghost btn-sm" href={link({ page: String(page + 1) })}>Next</Link> : <span />}</div>}
      </section>
    </>
  );
}
