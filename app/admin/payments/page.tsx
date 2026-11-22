import Link from 'next/link';
import { PayBadge } from '@/components/Badges';
import { db } from '@/lib/db';
import { dateTime, money } from '@/lib/format';
import { maskPhone } from '@/lib/phone';

export const metadata = { title: 'Payments' };
const PAGE = 50;
const DAY = 86_400_000;
const STATUSES = ['completed', 'pending', 'failed', 'expired', 'needs_review'];
const LABEL: Record<string, string> = { completed: 'Paid', pending: 'Waiting', failed: 'Failed', expired: 'No answer', needs_review: 'Check' };

/** Every mobile money payment on the platform, across all businesses. */
export default async function AdminPayments({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const q = await searchParams;
  const days = [1, 7, 30, 90].includes(Number(q.days)) ? Number(q.days) : 7;
  const status = STATUSES.includes(q.status || '') ? q.status! : '';
  const provider = ['incpesa', 'snippe', 'test'].includes(q.provider || '') ? q.provider! : '';
  const search = (q.q || '').trim();
  const page = Math.max(1, Number(q.page) || 1);
  const where = {
    createdAt: { gte: new Date(Date.now() - days * DAY) },
    workspace: { isDemo: q.demos === '1' ? undefined : false },
    ...(status ? { status } : {}),
    ...(provider ? { provider } : {}),
    ...(search ? { OR: [{ phone: { contains: search.replace(/\D/g, '').replace(/^0/, '') || '__' } }, { workspace: { name: { contains: search, mode: 'insensitive' as const } } }] } : {}),
  };
  const [total, sums, rows] = await Promise.all([
    db.payment.count({ where }),
    db.payment.groupBy({ by: ['status'], where, _sum: { amount: true }, _count: true }),
    db.payment.findMany({ where, orderBy: { createdAt: 'desc' }, skip: (page - 1) * PAGE, take: PAGE, include: { workspace: { select: { id: true, name: true, timezone: true } }, package: { select: { name: true } }, site: { select: { name: true } } } }),
  ]);
  const by = Object.fromEntries(sums.map((s) => [s.status, s]));
  const paid = by.completed?._sum.amount ?? 0;
  const settled = (by.completed?._count ?? 0) + (by.failed?._count ?? 0) + (by.expired?._count ?? 0);
  const pages = Math.max(1, Math.ceil(total / PAGE));
  const link = (extra: Record<string, string>) => `/admin/payments?${new URLSearchParams({ ...Object.fromEntries(Object.entries(q).filter(([, v]) => v) as [string, string][]), ...extra })}`;

  return (
    <>
      <div className="page-head"><div><h1>Payments</h1><p>Every mobile money payment on the platform. Demo workspaces are hidden unless you include them.</p></div></div>
      <div className="grid grid-4" style={{ marginBottom: 16 }}>
        <div className="card card-pad kpi"><small>Paid</small><strong>{money(paid)}</strong><span className="muted small">{by.completed?._count ?? 0} payments</span></div>
        <div className="card card-pad kpi"><small>Success rate</small><strong>{settled ? Math.round(((by.completed?._count ?? 0) / settled) * 100) : 0}%</strong><span className="muted small">of finished attempts</span></div>
        <div className="card card-pad kpi"><small>Failed or no answer</small><strong>{(by.failed?._count ?? 0) + (by.expired?._count ?? 0)}</strong><span className="muted small">{by.pending?._count ?? 0} still waiting</span></div>
        <div className="card card-pad kpi"><small>Needs a check</small><strong>{by.needs_review?._count ?? 0}</strong><span className="muted small">amount did not match</span></div>
      </div>
      <form className="card report-filters" method="get">
        <label>Search<input name="q" defaultValue={search} placeholder="Phone or business" style={{ minWidth: 200 }} /></label>
        <label>Period<select name="days" defaultValue={String(days)}><option value="1">24 hours</option><option value="7">7 days</option><option value="30">30 days</option><option value="90">90 days</option></select></label>
        <label>Status<select name="status" defaultValue={status}><option value="">All</option>{STATUSES.map((s) => <option key={s} value={s}>{LABEL[s]}</option>)}</select></label>
        <label>Provider<select name="provider" defaultValue={provider}><option value="">All</option><option value="incpesa">incpesa</option><option value="snippe">Snippe</option><option value="test">Test mode</option></select></label>
        <label>Demos<select name="demos" defaultValue={q.demos ?? ''}><option value="">Hide</option><option value="1">Include</option></select></label>
        <button className="btn btn-sm">Apply</button>
        <Link className="btn btn-ghost btn-sm" href="/admin/payments">Reset</Link>
      </form>
      <section className="card">
        <div className="card-head"><h2>{total.toLocaleString('en-US')} payments</h2></div>
        {rows.length === 0 ? <p className="empty">No payments match.</p> : (
          <div className="table-wrap"><table>
            <thead><tr><th>Amount</th><th>Business</th><th>Package · router</th><th>Phone</th><th>Provider</th><th>When</th><th>Status</th></tr></thead>
            <tbody>{rows.map((p) => (
              <tr key={p.id}>
                <td><strong>{money(p.amount)}</strong></td>
                <td><Link className="accent" href={`/admin/businesses/${p.workspace.id}`}>{p.workspace.name}</Link></td>
                <td className="small">{p.package.name}<div className="muted">{p.site?.name ?? '—'}</div></td>
                <td className="mono small">{maskPhone(p.phone)}</td>
                <td className="small">{p.provider}</td>
                <td className="muted small">{dateTime(p.createdAt, p.workspace.timezone)}</td>
                <td><PayBadge status={p.status} />{p.failureReason && p.status !== 'completed' && <div className="muted" style={{ fontSize: 11.5 }}>{p.failureReason}</div>}</td>
              </tr>
            ))}</tbody>
          </table></div>
        )}
        {pages > 1 && <div className="pager">{page > 1 ? <Link className="btn btn-ghost btn-sm" href={link({ page: String(page - 1) })}>Previous</Link> : <span />}<span className="muted small">Page {page} of {pages}</span>{page < pages ? <Link className="btn btn-ghost btn-sm" href={link({ page: String(page + 1) })}>Next</Link> : <span />}</div>}
      </section>
    </>
  );
}
