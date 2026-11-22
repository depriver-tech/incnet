import { PayBadge } from '@/components/Badges';
import { requireWorkspace } from '@/lib/auth';
import { db } from '@/lib/db';
import { dateTime, money } from '@/lib/format';
import { maskPhone } from '@/lib/phone';

export const metadata = { title: 'Sales' };

export default async function Sales() {
  const { workspace } = await requireWorkspace();
  const since = new Date(Date.now() - 13 * 86_400_000);
  since.setHours(0, 0, 0, 0);
  const [payments, recentPaid, vouchersUsed] = await Promise.all([
    db.payment.findMany({ where: { workspaceId: workspace.id }, orderBy: { createdAt: 'desc' }, take: 100, include: { package: true, site: true, access: { select: { code: true } } } }),
    db.payment.findMany({ where: { workspaceId: workspace.id, status: 'completed', completedAt: { gte: since } }, select: { amount: true, completedAt: true } }),
    db.access.findMany({ where: { workspaceId: workspace.id, kind: 'voucher', activatedAt: { gte: since } }, select: { activatedAt: true, package: { select: { price: true } } } }),
  ]);

  // Last 14 days: mobile money received plus the value of vouchers used.
  const days = Array.from({ length: 14 }, (_, i) => {
    const d = new Date(since.getTime() + i * 86_400_000);
    return { key: d.toDateString(), label: d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }), mobile: 0, voucher: 0 };
  });
  const byKey = new Map(days.map((d) => [d.key, d]));
  for (const p of recentPaid) { const d = byKey.get(p.completedAt!.toDateString()); if (d) d.mobile += p.amount; }
  for (const v of vouchersUsed) { const d = byKey.get(v.activatedAt!.toDateString()); if (d) d.voucher += v.package.price; }
  const max = Math.max(1, ...days.map((d) => d.mobile + d.voucher));
  const total = days.reduce((s, d) => s + d.mobile + d.voucher, 0);

  return (
    <>
      <div className="page-head"><div><h1>Sales</h1><p>Mobile money payments and vouchers used over the last 14 days.</p></div></div>
      <section className="card card-pad" style={{ marginBottom: 16 }}>
        <div className="spread" style={{ marginBottom: 14 }}>
          <div className="stat"><small>14-day total</small><strong>{money(total)}</strong></div>
          <div className="row small muted"><span className="row" style={{ gap: 6 }}><i style={{ width: 10, height: 10, borderRadius: 3, background: 'var(--accent)' }} />Mobile money</span><span className="row" style={{ gap: 6 }}><i style={{ width: 10, height: 10, borderRadius: 3, background: 'color-mix(in srgb, var(--accent) 35%, var(--surface-2))' }} />Vouchers used</span></div>
        </div>
        <div role="img" aria-label="Daily sales for the last 14 days" style={{ display: 'grid', gridTemplateColumns: 'repeat(14, 1fr)', gap: 6, alignItems: 'end', height: 160 }}>
          {days.map((d) => (
            <div key={d.key} title={`${d.label}: ${money(d.mobile)} mobile, ${money(d.voucher)} vouchers`} style={{ display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', height: '100%' }}>
              <div style={{ height: `${(d.voucher / max) * 100}%`, background: 'color-mix(in srgb, var(--accent) 35%, var(--surface-2))', borderRadius: d.mobile ? 0 : '4px 4px 0 0' }} />
              <div style={{ height: `${(d.mobile / max) * 100}%`, background: 'var(--accent)', borderRadius: '4px 4px 0 0', order: -1 }} />
            </div>
          ))}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(14, 1fr)', gap: 6, marginTop: 6 }}>
          {days.map((d, i) => <span key={d.key} className="muted" style={{ fontSize: 10.5, textAlign: 'center' }}>{i % 2 === 1 ? d.label : ''}</span>)}
        </div>
      </section>

      <section className="card">
        <div className="card-head"><h2>Mobile money payments</h2><span className="muted small">Latest 100</span></div>
        {payments.length === 0 ? <p className="empty">No payments yet. Turn on mobile money in Settings.</p> : (
          <div className="table-wrap"><table>
            <thead><tr><th>Amount</th><th>Package</th><th>Phone</th><th>Router</th><th>Code</th><th>When</th><th>Status</th></tr></thead>
            <tbody>
              {payments.map((p) => (
                <tr key={p.id}>
                  <td><strong>{money(p.amount)}</strong></td>
                  <td>{p.package.name}</td>
                  <td className="mono small">{maskPhone(p.phone)}</td>
                  <td className="muted">{p.site?.name ?? '—'}</td>
                  <td className="mono small">{p.access?.code ?? '—'}</td>
                  <td className="muted small">{dateTime(p.createdAt)}</td>
                  <td><PayBadge status={p.status} />{p.failureReason && p.status !== 'completed' && <div className="muted" style={{ fontSize: 11.5 }}>{p.failureReason}</div>}</td>
                </tr>
              ))}
            </tbody>
          </table></div>
        )}
      </section>
    </>
  );
}
