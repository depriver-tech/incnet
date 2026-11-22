import Link from 'next/link';
import { PayBadge } from '@/components/Badges';
import { StackedBars } from '@/components/charts/Charts';
import { FilterBar } from '@/components/charts/FilterBar';
import { requirePage } from '@/lib/auth';
import { db } from '@/lib/db';
import { dateTime, money } from '@/lib/format';
import { getT } from '@/lib/lang';
import { maskPhone } from '@/lib/phone';
import { buildReport, filterQuery, parseFilters } from '@/lib/reports';

export const metadata = { title: 'Sales' };
const PAGE = 50;
const STATUSES = ['completed', 'pending', 'failed', 'expired', 'needs_review'];

export default async function Sales({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const { workspace } = await requirePage('sales.view');
  const t = await getT();
  const q = await searchParams;
  const f = parseFilters({ period: '7d', ...q }, workspace.timezone);
  const status = STATUSES.includes(q.status || '') ? q.status! : '';
  const search = (q.q || '').replace(/\D/g, '').replace(/^0/, '');
  const page = Math.max(1, Number(q.page) || 1);
  const where = {
    workspaceId: workspace.id, createdAt: { gte: f.from, lt: f.to },
    ...(f.site ? { siteId: f.site } : {}), ...(f.pkg ? { packageId: f.pkg } : {}), ...(status ? { status } : {}), ...(search ? { phone: { contains: search } } : {}),
  };
  const [report, total, sum, payments] = await Promise.all([
    buildReport(workspace, { ...f, channel: 'mobile' }),
    db.payment.count({ where }),
    db.payment.aggregate({ where: { ...where, status: 'completed' }, _sum: { amount: true } }),
    db.payment.findMany({ where, orderBy: { createdAt: 'desc' }, skip: (page - 1) * PAGE, take: PAGE, include: { package: true, site: true, access: { select: { code: true } } } }),
  ]);
  const pages = Math.max(1, Math.ceil(total / PAGE));
  const link = (extra: Record<string, string>) => `/dashboard/sales?${new URLSearchParams({ ...Object.fromEntries(Object.entries(q).filter(([, v]) => v) as [string, string][]), ...extra })}`;
  const statusLabel: Record<string, string> = { completed: t('r.completed'), pending: t('r.pending'), failed: t('r.failed'), expired: t('r.expired'), needs_review: t('r.review') };

  return (
    <>
      <div className="page-head"><div><h1>{t('sales.title')}</h1><p>{t('sales.sub')}</p></div></div>
      <FilterBar path="/dashboard/sales" f={{ ...f, channel: 'mobile' }} sites={report.sites} packages={report.packages} t={t} showChannel={false} exportHref={`/api/reports/export?${filterQuery({ ...f, channel: 'mobile' })}`} />

      <section className="card" style={{ marginBottom: 16 }}>
        <div className="card-head"><h2>{t('r.overTime')}</h2><span className="muted small">{money(sum._sum.amount ?? 0)} · {report.kpi.success.value ?? '—'}% {t('r.success').toLowerCase()}</span></div>
        <div className="card-pad"><StackedBars data={report.buckets} labels={{ mobile: t('r.mobile'), voucher: t('r.voucher') }} /></div>
      </section>

      <section className="card">
        <div className="card-head">
          <h2>{total.toLocaleString('en-US')} payments</h2>
          <form className="filters" method="get">
            {Object.entries(q).filter(([k, v]) => v && !['q', 'status', 'page'].includes(k)).map(([k, v]) => <input key={k} type="hidden" name={k} value={v} />)}
            <input name="q" defaultValue={q.q} placeholder="Phone number" />
            <select name="status" defaultValue={status}><option value="">All statuses</option>{STATUSES.map((s) => <option key={s} value={s}>{statusLabel[s]}</option>)}</select>
            <button className="btn btn-ghost btn-sm">{t('common.apply')}</button>
          </form>
        </div>
        {payments.length === 0 ? <p className="empty">{t('common.none')}</p> : (
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
