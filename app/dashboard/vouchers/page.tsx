import Link from 'next/link';
import { ActionForm, Submit } from '@/components/ActionForm';
import { AccessBadge } from '@/components/Badges';
import { createVouchers, revokeAccess } from '@/lib/actions';
import { requireWorkspace } from '@/lib/auth';
import { db } from '@/lib/db';
import { dateTime, duration, money } from '@/lib/format';

export const metadata = { title: 'Vouchers' };

export default async function Vouchers({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { workspace } = await requireWorkspace();
  const { q } = await searchParams;
  const query = (q || '').trim().toUpperCase();
  const [packages, sites, batches, found] = await Promise.all([
    db.package.findMany({ where: { workspaceId: workspace.id, active: true }, orderBy: [{ sort: 'asc' }, { price: 'asc' }] }),
    db.site.findMany({ where: { workspaceId: workspace.id }, orderBy: { createdAt: 'asc' } }),
    db.voucherBatch.findMany({ where: { workspaceId: workspace.id }, orderBy: { createdAt: 'desc' }, take: 30, include: { package: true, _count: { select: { accesses: { where: { status: { not: 'unused' } } } } } } }),
    query ? db.access.findMany({ where: { workspaceId: workspace.id, OR: [{ code: { contains: query } }, { phone: { contains: query.replace(/^0/, '') } }] }, take: 20, include: { package: true }, orderBy: { createdAt: 'desc' } }) : Promise.resolve([]),
  ]);

  return (
    <>
      <div className="page-head"><div><h1>Vouchers</h1><p>Print codes to sell at the counter. Each code works once, and its time starts on first use.</p></div></div>
      <div className="grid" style={{ gridTemplateColumns: 'minmax(280px, 1fr) minmax(0, 1.6fr)', alignItems: 'start' }}>
        <section className="card">
          <div className="card-head"><h2>Make vouchers</h2></div>
          <div className="card-pad">
            <ActionForm action={createVouchers}>
              <label className="field">Package
                <select name="packageId" required>{packages.map((p) => <option key={p.id} value={p.id}>{p.name} · {money(p.price)}</option>)}</select>
              </label>
              <label className="field">How many<input name="count" type="number" min={1} max={500} defaultValue={40} required /></label>
              {sites.length > 1 && (
                <label className="field">Works at
                  <select name="siteId" defaultValue=""><option value="">Every router</option>{sites.map((s) => <option key={s.id} value={s.id}>{s.name} only</option>)}</select>
                </label>
              )}
              <label className="field">Note (optional)<input name="note" placeholder="For the front desk" maxLength={80} /></label>
              <div><Submit pending="Making codes…">Make and print</Submit></div>
            </ActionForm>
          </div>
        </section>

        <div className="grid">
          <section className="card">
            <div className="card-head">
              <h2>Find a code</h2>
              <form className="row" style={{ flexWrap: 'nowrap' }}><input name="q" defaultValue={q} placeholder="Code or phone" style={{ width: 200 }} /><button className="btn btn-ghost btn-sm">Search</button></form>
            </div>
            {query && (found.length === 0 ? <p className="empty">Nothing matches “{q}”.</p> : (
              <div className="table-wrap"><table><tbody>
                {found.map((a) => (
                  <tr key={a.id}>
                    <td className="mono"><strong>{a.code}</strong><div className="muted small" style={{ fontFamily: 'var(--font-body)' }}>{a.package.name} · {a.kind === 'payment' ? `paid by ${a.phone}` : 'voucher'}</div></td>
                    <td><AccessBadge status={a.status} /></td>
                    <td className="muted small">{a.expiresAt ? `Ends ${dateTime(a.expiresAt)}` : '—'}</td>
                    <td style={{ textAlign: 'right' }}>{['unused', 'active'].includes(a.status) && <form action={revokeAccess}><input type="hidden" name="id" value={a.id} /><button className="btn btn-danger btn-sm">Cancel</button></form>}</td>
                  </tr>
                ))}
              </tbody></table></div>
            ))}
          </section>

          <section className="card">
            <div className="card-head"><h2>Printed batches</h2></div>
            {batches.length === 0 ? <p className="empty">No vouchers yet.</p> : (
              <div className="table-wrap"><table>
                <thead><tr><th>Batch</th><th>Used</th><th>Made</th><th></th></tr></thead>
                <tbody>
                  {batches.map((b) => (
                    <tr key={b.id}>
                      <td><strong>{b.count} × {b.package.name}</strong><div className="muted small">{duration(b.package.durationMinutes)} · {money(b.package.price)}{b.note ? ` · ${b.note}` : ''}</div></td>
                      <td className="muted">{b._count.accesses} / {b.count}</td>
                      <td className="muted small">{dateTime(b.createdAt)}</td>
                      <td style={{ textAlign: 'right' }}><Link className="btn btn-ghost btn-sm" href={`/dashboard/vouchers/${b.id}`}>Print</Link></td>
                    </tr>
                  ))}
                </tbody>
              </table></div>
            )}
          </section>
        </div>
      </div>
    </>
  );
}
