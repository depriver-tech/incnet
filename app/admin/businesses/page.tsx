import Link from 'next/link';
import { db } from '@/lib/db';
import { ago, dateTime, money } from '@/lib/format';
import { PLANS } from '@/lib/config';
import { isOnline } from '@/lib/admin';

export const metadata = { title: 'Businesses' };
const PAGE = 25;
const DAY = 86_400_000;

export default async function AdminWorkspaces({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const q = await searchParams;
  const search = (q.q || '').trim();
  const plan = ['free', 'pro'].includes(q.plan || '') ? q.plan! : '';
  const status = ['active', 'suspended', 'demo'].includes(q.status || '') ? q.status! : '';
  const sort = ['new', 'old', 'name'].includes(q.sort || '') ? q.sort! : 'new';
  const setup = q.setup === 'none' ? 'none' : q.setup === 'live' ? 'live' : '';
  const page = Math.max(1, Number(q.page) || 1);

  const where = {
    ...(status === 'demo' ? { isDemo: true } : { isDemo: false }),
    ...(status === 'suspended' ? { suspendedAt: { not: null } } : status === 'active' ? { suspendedAt: null } : {}),
    ...(plan ? { plan } : {}),
    ...(setup === 'none' ? { sites: { none: { kind: { not: 'simulated' } } } } : setup === 'live' ? { sites: { some: { kind: { not: 'simulated' }, lastSeenAt: { gte: new Date(Date.now() - 7 * DAY) } } } } : {}),
    ...(search ? { OR: [{ name: { contains: search, mode: 'insensitive' as const } }, { members: { some: { user: { email: { contains: search, mode: 'insensitive' as const } } } } }] } : {}),
  };
  const [total, rows] = await Promise.all([
    db.workspace.count({ where }),
    db.workspace.findMany({
      where,
      orderBy: sort === 'old' ? { createdAt: 'asc' } : sort === 'name' ? { name: 'asc' } : { createdAt: 'desc' },
      skip: (page - 1) * PAGE,
      take: PAGE,
      include: {
        members: { where: { role: 'owner' }, take: 1, include: { user: { select: { email: true, name: true } } } },
        sites: { select: { lastSeenAt: true, kind: true } },
        _count: { select: { members: true } },
      },
    }),
  ]);
  const list = rows;
  const pages = Math.max(1, Math.ceil(total / PAGE));
  const link = (extra: Record<string, string>) => `/admin/businesses?${new URLSearchParams({ ...Object.fromEntries(Object.entries(q).filter(([, v]) => v) as [string, string][]), ...extra })}`;

  return (
    <>
      <div className="page-head"><div><h1>Businesses</h1><p>Every business on the platform. Search, filter, and open one to manage it.</p></div></div>
      {q.deleted && <p className="notice" style={{ marginBottom: 16 }}>The business and all its data were deleted.</p>}
      <form className="card report-filters" method="get">
        <label>Search<input name="q" defaultValue={search} placeholder="Business or owner email" style={{ minWidth: 240 }} /></label>
        <label>Status<select name="status" defaultValue={status}><option value="">All (no demos)</option><option value="active">Active</option><option value="suspended">Suspended</option><option value="demo">Demos</option></select></label>
        <label>Plan<select name="plan" defaultValue={plan}><option value="">All plans</option><option value="free">Starter</option><option value="pro">Business</option></select></label>
        <label>Setup<select name="setup" defaultValue={setup}><option value="">Any</option><option value="none">Never added a router</option><option value="live">Router active this week</option></select></label>
        <label>Sort<select name="sort" defaultValue={sort}><option value="new">Newest</option><option value="old">Oldest</option><option value="name">Name</option></select></label>
        <button className="btn btn-sm">Apply</button>
        <Link className="btn btn-ghost btn-sm" href="/admin/businesses">Reset</Link>
      </form>
      <section className="card">
        <div className="card-head"><h2>{total.toLocaleString('en-US')} {total === 1 ? 'business' : 'businesses'}</h2></div>
        {list.length === 0 ? <p className="empty">No businesses match.</p> : (
          <div className="table-wrap"><table>
            <thead><tr><th>Business</th><th>Owner</th><th>Plan</th><th>Routers</th><th>Team</th><th>Subscription</th><th>Joined</th></tr></thead>
            <tbody>
              {list.map((w) => {
                const real = w.sites.filter((s) => s.kind !== 'simulated');
                const up = real.filter((s) => isOnline(s.lastSeenAt)).length;
                const last = real.map((s) => s.lastSeenAt).filter(Boolean).sort((a, b) => b!.getTime() - a!.getTime())[0] ?? null;
                return (
                  <tr key={w.id}>
                    <td>
                      <Link href={`/admin/businesses/${w.id}`}><strong>{w.name}</strong></Link>
                      <div className="row" style={{ gap: 4, marginTop: 2 }}>
                        {w.suspendedAt && <span className="badge bad">Suspended</span>}
                        {w.isDemo && <span className="badge">Demo</span>}
                      </div>
                    </td>
                    <td className="small">{w.members[0]?.user.name ?? '—'}<div className="muted">{w.members[0]?.user.email ?? ''}</div></td>
                    <td><span className={`badge ${w.plan === 'pro' ? 'accent' : ''}`}>{w.plan === 'pro' ? 'Business' : 'Starter'}</span></td>
                    <td className="small">{up}/{real.length} online<div className="muted">{real.length ? `seen ${ago(last)}` : 'none yet'}</div></td>
                    <td>{w._count.members}</td>
                    <td><strong>{w.plan === 'pro' && !w.suspendedAt ? `${money(PLANS.pro.price)}/mo` : '—'}</strong></td>
                    <td className="muted small">{dateTime(w.createdAt, w.timezone)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table></div>
        )}
        {pages > 1 && (
          <div className="pager">
            {page > 1 ? <Link className="btn btn-ghost btn-sm" href={link({ page: String(page - 1) })}>Previous</Link> : <span />}
            <span className="muted small">Page {page} of {pages}</span>
            {page < pages ? <Link className="btn btn-ghost btn-sm" href={link({ page: String(page + 1) })}>Next</Link> : <span />}
          </div>
        )}
      </section>
    </>
  );
}
