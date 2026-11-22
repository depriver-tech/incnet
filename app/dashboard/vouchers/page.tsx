import { getT } from '@/lib/lang';
import Link from 'next/link';
import { AccessBadge } from '@/components/Badges';
import { revokeAccess } from '@/lib/actions';
import { Palette } from 'lucide-react';
import { VoucherForm } from './VoucherForm';
import { can } from '@/lib/permissions';
import { requirePage } from '@/lib/auth';
import { db } from '@/lib/db';
import { dateTime, duration, money } from '@/lib/format';

export const metadata = { title: 'Vouchers' };

export default async function Vouchers({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { workspace, role } = await requirePage('vouchers.create');
  const t = await getT();
  const { q } = await searchParams;
  const query = (q || '').trim().toUpperCase();
  const [packages, sites, batches, found] = await Promise.all([
    db.package.findMany({ where: { workspaceId: workspace.id, active: true }, orderBy: [{ sort: 'asc' }, { price: 'asc' }], select: { id: true, name: true, price: true, siteId: true } }),
    db.site.findMany({ where: { workspaceId: workspace.id }, orderBy: { createdAt: 'asc' } }),
    db.voucherBatch.findMany({ where: { workspaceId: workspace.id }, orderBy: { createdAt: 'desc' }, take: 30, include: { package: true, site: { select: { name: true } }, _count: { select: { accesses: { where: { status: { not: 'unused' } } } } } } }),
    query ? db.access.findMany({ where: { workspaceId: workspace.id, OR: [{ code: { contains: query } }, { phone: { contains: query.replace(/^0/, '') } }] }, take: 20, include: { package: true }, orderBy: { createdAt: 'desc' } }) : Promise.resolve([]),
  ]);

  return (
    <>
      <div className="page-head">
        <div><h1>{t('vouchers.title')}</h1><p>Print codes to sell at the counter. Each code works once, on one router, and its time starts on first use.</p></div>
        {can(role, 'vouchers.design') && <Link className="btn btn-ghost" href="/dashboard/vouchers/design"><Palette size={16} /> Design vouchers</Link>}
      </div>
      <div className="grid" style={{ gridTemplateColumns: 'minmax(280px, 1fr) minmax(0, 1.6fr)', alignItems: 'start' }}>
        <section className="card">
          <div className="card-head"><h2>Make vouchers</h2></div>
          <div className="card-pad">
            <VoucherForm sites={sites.map((x) => ({ id: x.id, name: x.name }))} packages={packages.map((p) => ({ id: p.id, name: p.name, siteId: p.siteId, label: `${p.name} · ${money(p.price)}` }))} />
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
                    <td style={{ textAlign: 'right' }}>{can(role, 'vouchers.revoke') && ['unused', 'active'].includes(a.status) && <form action={revokeAccess}><input type="hidden" name="id" value={a.id} /><button className="btn btn-danger btn-sm">Cancel</button></form>}</td>
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
                      <td><strong>{b.count} × {b.package.name}</strong><div className="muted small">{b.site.name} · {duration(b.package.durationMinutes)} · {money(b.package.price)}{b.note ? ` · ${b.note}` : ''}</div></td>
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
