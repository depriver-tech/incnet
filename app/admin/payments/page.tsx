import Link from 'next/link';
import { Lock } from 'lucide-react';
import { db } from '@/lib/db';
import { ago, money } from '@/lib/format';

export const metadata = { title: 'Payment health' };
const DAY = 86_400_000;
const PROVIDER: Record<string, string> = { none: 'Vouchers only', incpesa: 'incpesa', snippe: 'Snippe', test: 'Test mode' };

/**
 * Payment health per business, for spotting broken setups. Totals only: individual sales and
 * customers' phone numbers belong to each business and are never shown here.
 */
export default async function PaymentHealth({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const q = await searchParams;
  const days = [1, 7, 30].includes(Number(q.days)) ? Number(q.days) : 7;
  const filter = ['issues', 'test', 'none'].includes(q.show || '') ? q.show! : '';
  const since = new Date(Date.now() - days * DAY);

  const [businesses, attempts, last] = await Promise.all([
    db.workspace.findMany({ where: { isDemo: false }, select: { id: true, name: true, paymentProvider: true, suspendedAt: true }, orderBy: { name: 'asc' } }),
    db.payment.groupBy({ by: ['workspaceId', 'status'], where: { createdAt: { gte: since }, workspace: { isDemo: false } }, _count: true, _sum: { amount: true } }),
    db.payment.groupBy({ by: ['workspaceId'], where: { status: 'completed', workspace: { isDemo: false } }, _max: { completedAt: true } }),
  ]);
  const stats = new Map<string, { completed: number; failed: number; expired: number; pending: number; review: number; volume: number }>();
  for (const a of attempts) {
    const s = stats.get(a.workspaceId) ?? { completed: 0, failed: 0, expired: 0, pending: 0, review: 0, volume: 0 };
    if (a.status === 'completed') { s.completed += a._count; s.volume += a._sum.amount ?? 0; }
    else if (a.status === 'failed') s.failed += a._count;
    else if (a.status === 'expired') s.expired += a._count;
    else if (a.status === 'needs_review') s.review += a._count;
    else s.pending += a._count;
    stats.set(a.workspaceId, s);
  }
  const lastSale = new Map(last.map((l) => [l.workspaceId, l._max.completedAt]));
  const rows = businesses.map((b) => {
    const s = stats.get(b.id) ?? { completed: 0, failed: 0, expired: 0, pending: 0, review: 0, volume: 0 };
    const finished = s.completed + s.failed + s.expired;
    const rate = finished ? Math.round((s.completed / finished) * 100) : null;
    // A setup looks broken when most finished attempts fail, or an amount came back wrong.
    const issue = s.review > 0 ? 'Amount mismatch' : finished >= 5 && rate !== null && rate < 50 ? 'Most payments failing' : b.paymentProvider === 'test' ? 'Still in test mode' : null;
    return { ...b, ...s, finished, rate, issue, last: lastSale.get(b.id) ?? null };
  }).filter((r) => (filter === 'issues' ? r.issue : filter === 'test' ? r.paymentProvider === 'test' : filter === 'none' ? r.paymentProvider === 'none' : true))
    .sort((a, b) => Number(!!b.issue) - Number(!!a.issue) || b.finished - a.finished);

  const totals = rows.reduce((t, r) => ({ volume: t.volume + r.volume, completed: t.completed + r.completed, finished: t.finished + r.finished }), { volume: 0, completed: 0, finished: 0 });
  const issues = rows.filter((r) => r.issue).length;

  return (
    <>
      <div className="page-head"><div><h1>Payment health</h1><p>Is mobile money working for each business? Totals only, to spot broken setups.</p></div></div>
      <p className="privacy-note"><Lock size={14} /> Each business&apos;s sales and customers belong to that business. The console shows totals and setup status only, never individual payments or phone numbers.</p>
      <div className="grid grid-4" style={{ marginBottom: 16 }}>
        <div className="card card-pad kpi"><small>Mobile money, {days === 1 ? '24 hours' : `${days} days`}</small><strong>{money(totals.volume)}</strong><span className="muted small">across all businesses</span></div>
        <div className="card card-pad kpi"><small>Platform success rate</small><strong>{totals.finished ? Math.round((totals.completed / totals.finished) * 100) : 0}%</strong><span className="muted small">{totals.finished} finished attempts</span></div>
        <div className="card card-pad kpi"><small>Businesses with issues</small><strong>{issues}</strong><span className="muted small">failing, mismatched or test mode</span></div>
        <div className="card card-pad kpi"><small>Taking mobile money</small><strong>{businesses.filter((b) => b.paymentProvider !== 'none').length}</strong><span className="muted small">of {businesses.length} businesses</span></div>
      </div>
      <form className="card report-filters" method="get">
        <label>Period<select name="days" defaultValue={String(days)}><option value="1">24 hours</option><option value="7">7 days</option><option value="30">30 days</option></select></label>
        <label>Show<select name="show" defaultValue={filter}><option value="">All businesses</option><option value="issues">Only with issues</option><option value="test">Still in test mode</option><option value="none">Vouchers only</option></select></label>
        <button className="btn btn-sm">Apply</button>
        <Link className="btn btn-ghost btn-sm" href="/admin/payments">Reset</Link>
      </form>
      <section className="card">
        <div className="card-head"><h2>{rows.length} {rows.length === 1 ? 'business' : 'businesses'}</h2></div>
        {rows.length === 0 ? <p className="empty">Nothing to show.</p> : (
          <div className="table-wrap"><table>
            <thead><tr><th>Business</th><th>Provider</th><th>Attempts</th><th>Success</th><th>Failed · no answer</th><th>Volume</th><th>Last sale</th><th>Status</th></tr></thead>
            <tbody>{rows.map((r) => (
              <tr key={r.id}>
                <td><Link className="accent" href={`/admin/businesses/${r.id}`}><strong>{r.name}</strong></Link>{r.suspendedAt && <span className="badge bad" style={{ marginLeft: 6 }}>Suspended</span>}</td>
                <td className="small">{PROVIDER[r.paymentProvider] ?? r.paymentProvider}</td>
                <td>{r.finished + r.pending}</td>
                <td>{r.rate === null ? '—' : `${r.rate}%`}</td>
                <td className="small">{r.failed} · {r.expired}</td>
                <td><strong>{money(r.volume)}</strong></td>
                <td className="muted small">{r.last ? ago(r.last) : 'never'}</td>
                <td>{r.issue ? <span className="badge warn">{r.issue}</span> : <span className="badge ok">OK</span>}</td>
              </tr>
            ))}</tbody>
          </table></div>
        )}
      </section>
    </>
  );
}
