import Link from 'next/link';
import { FilterBar } from '@/components/charts/FilterBar';
import { requirePage } from '@/lib/auth';
import { db } from '@/lib/db';
import { dateTime, money } from '@/lib/format';
import { getT } from '@/lib/lang';
import { maskPhone } from '@/lib/phone';
import { parseFilters } from '@/lib/reports';

export const metadata = { title: 'Customers' };
const PAGE = 25;

/** Everyone who paid by phone in the period: how much, how often, what they buy. */
export default async function Customers({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const { workspace } = await requirePage('customers.view');
  const t = await getT();
  const q = await searchParams;
  const f = parseFilters({ period: '30d', ...q }, workspace.timezone);
  const sort = ['total', 'count', 'recent'].includes(q.sort || '') ? q.sort! : 'total';
  const search = (q.q || '').replace(/\D/g, '');
  const page = Math.max(1, Number(q.page) || 1);

  const [payments, packages, sites] = await Promise.all([
    db.payment.findMany({
      where: { workspaceId: workspace.id, status: 'completed', completedAt: { gte: f.from, lt: f.to }, ...(f.site ? { siteId: f.site } : {}), ...(f.pkg ? { packageId: f.pkg } : {}), ...(search ? { phone: { contains: search.replace(/^0/, '') } } : {}) },
      select: { phone: true, amount: true, completedAt: true, packageId: true },
      take: 50_000,
    }),
    db.package.findMany({ where: { workspaceId: workspace.id }, select: { id: true, name: true } }),
    db.site.findMany({ where: { workspaceId: workspace.id }, select: { id: true, name: true } }),
  ]);
  const pkgName = new Map(packages.map((p) => [p.id, p.name]));
  const map = new Map<string, { phone: string; total: number; count: number; first: Date; last: Date; pkgs: Map<string, number> }>();
  for (const p of payments) {
    const c = map.get(p.phone) ?? { phone: p.phone, total: 0, count: 0, first: p.completedAt!, last: p.completedAt!, pkgs: new Map() };
    c.total += p.amount; c.count += 1;
    if (p.completedAt! < c.first) c.first = p.completedAt!;
    if (p.completedAt! > c.last) c.last = p.completedAt!;
    c.pkgs.set(p.packageId, (c.pkgs.get(p.packageId) ?? 0) + 1);
    map.set(p.phone, c);
  }
  const all = [...map.values()].sort((a, b) => (sort === 'count' ? b.count - a.count : sort === 'recent' ? b.last.getTime() - a.last.getTime() : b.total - a.total));
  const repeat = all.filter((c) => c.count > 1).length;
  const revenue = all.reduce((s, c) => s + c.total, 0);
  const pages = Math.max(1, Math.ceil(all.length / PAGE));
  const rows = all.slice((page - 1) * PAGE, page * PAGE);
  const link = (extra: Record<string, string>) => `/dashboard/customers?${new URLSearchParams({ ...Object.fromEntries(Object.entries(q).filter(([, v]) => v) as [string, string][]), ...extra })}`;

  return (
    <>
      <div className="page-head"><div><h1>{t('customers.title')}</h1><p>{t('customers.sub')}</p></div></div>
      <FilterBar path="/dashboard/customers" f={f} sites={sites} packages={packages} t={t} showChannel={false} />
      <div className="grid grid-4" style={{ marginBottom: 16 }}>
        <div className="card card-pad kpi"><small>{t('r.customers')}</small><strong>{all.length.toLocaleString('en-US')}</strong></div>
        <div className="card card-pad kpi"><small>Came back</small><strong>{all.length ? Math.round((repeat / all.length) * 100) : 0}%</strong><span className="muted small">{repeat} bought more than once</span></div>
        <div className="card card-pad kpi"><small>Spend per customer</small><strong>{money(all.length ? Math.round(revenue / all.length) : 0)}</strong></div>
        <div className="card card-pad kpi"><small>{t('r.revenue')}</small><strong>{money(revenue)}</strong></div>
      </div>
      <section className="card">
        <div className="card-head">
          <h2>{all.length} customers</h2>
          <form className="filters" method="get">
            {Object.entries(q).filter(([k, v]) => v && !['q', 'sort', 'page'].includes(k)).map(([k, v]) => <input key={k} type="hidden" name={k} value={v} />)}
            <input name="q" defaultValue={q.q} placeholder="Phone number" />
            <select name="sort" defaultValue={sort}><option value="total">Most spent</option><option value="count">Most visits</option><option value="recent">Most recent</option></select>
            <button className="btn btn-ghost btn-sm">{t('common.apply')}</button>
          </form>
        </div>
        {rows.length === 0 ? <p className="empty">{t('common.none')}</p> : (
          <div className="table-wrap"><table>
            <thead><tr><th>Phone</th><th>Purchases</th><th>Spent</th><th>Average</th><th>Favourite</th><th>First</th><th>Last</th></tr></thead>
            <tbody>
              {rows.map((c) => {
                const fav = [...c.pkgs.entries()].sort((a, b) => b[1] - a[1])[0];
                return (
                  <tr key={c.phone}>
                    <td className="mono"><strong>{maskPhone(c.phone)}</strong>{c.count > 1 && <span className="badge accent" style={{ marginLeft: 8 }}>Regular</span>}</td>
                    <td>{c.count}</td>
                    <td><strong>{money(c.total)}</strong></td>
                    <td>{money(Math.round(c.total / c.count))}</td>
                    <td className="small">{pkgName.get(fav[0]) ?? '—'}</td>
                    <td className="muted small">{dateTime(c.first, workspace.timezone)}</td>
                    <td className="muted small">{dateTime(c.last, workspace.timezone)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table></div>
        )}
        {pages > 1 && (
          <div className="pager">
            {page > 1 ? <Link className="btn btn-ghost btn-sm" href={link({ page: String(page - 1) })}>{t('common.prev')}</Link> : <span />}
            <span className="muted small">{t('common.page')} {page} {t('common.of')} {pages}</span>
            {page < pages ? <Link className="btn btn-ghost btn-sm" href={link({ page: String(page + 1) })}>{t('common.next')}</Link> : <span />}
          </div>
        )}
      </section>
    </>
  );
}
