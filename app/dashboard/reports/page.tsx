import { Delta, Heatmap, OutcomeBar, RankBars, StackedBars } from '@/components/charts/Charts';
import { FilterBar } from '@/components/charts/FilterBar';
import { requirePage } from '@/lib/auth';
import { money } from '@/lib/format';
import { getT } from '@/lib/lang';
import { maskPhone } from '@/lib/phone';
import { buildReport, filterQuery, parseFilters } from '@/lib/reports';
import { dateTime } from '@/lib/format';

export const metadata = { title: 'Reports' };

export default async function Reports({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const { workspace } = await requirePage('reports.view');
  const t = await getT();
  const f = parseFilters(await searchParams, workspace.timezone);
  const r = await buildReport(workspace, f);
  const vs = t('r.vsPrev');
  const outcomeLabels = { completed: t('r.completed'), failed: t('r.failed'), expired: t('r.expired'), pending: t('r.pending'), review: t('r.review') };

  return (
    <>
      <div className="page-head"><div><h1>{t('reports.title')}</h1><p>{t('reports.sub')}</p></div></div>
      <FilterBar path="/dashboard/reports" f={f} sites={r.sites} packages={r.packages} t={t} exportHref={`/api/reports/export?${filterQuery(f)}`} />

      <div className="grid grid-4" style={{ marginBottom: 16 }}>
        <div className="card card-pad kpi"><small>{t('r.revenue')}</small><strong>{money(r.kpi.revenue.value)}</strong><Delta value={r.kpi.revenue.delta} suffix={vs} /></div>
        <div className="card card-pad kpi"><small>{t('r.sales')}</small><strong>{r.kpi.sales.value.toLocaleString('en-US')}</strong><Delta value={r.kpi.sales.delta} suffix={vs} /></div>
        <div className="card card-pad kpi"><small>{t('r.avg')}</small><strong>{money(r.kpi.avg.value)}</strong><Delta value={r.kpi.avg.delta} suffix={vs} /></div>
        <div className="card card-pad kpi"><small>{t('r.customers')}</small><strong>{r.kpi.customers.value.toLocaleString('en-US')}</strong><Delta value={r.kpi.customers.delta} suffix={vs} /></div>
      </div>

      <section className="card" style={{ marginBottom: 16 }}>
        <div className="card-head"><h2>{t('r.overTime')}</h2><span className="muted small">{t('r.mobile')} {money(r.mix.mobile)} · {t('r.voucher')} {money(r.mix.voucher)}</span></div>
        <div className="card-pad">
          <StackedBars data={r.buckets} labels={{ mobile: t('r.mobile'), voucher: t('r.voucher') }} />
          <details className="table-view">
            <summary>{t('r.table')}</summary>
            <div className="table-wrap"><table>
              <thead><tr><th>{t('r.period')}</th><th>{t('r.mobile')}</th><th>{t('r.voucher')}</th><th>{t('r.sales')}</th><th>{t('r.revenue')}</th></tr></thead>
              <tbody>{r.buckets.filter((b) => b.count).map((b) => <tr key={b.key}><td>{b.label}</td><td>{money(b.mobile)}</td><td>{money(b.voucher)}</td><td>{b.count}</td><td><strong>{money(b.mobile + b.voucher)}</strong></td></tr>)}</tbody>
            </table></div>
          </details>
        </div>
      </section>

      <div className="grid grid-2" style={{ marginBottom: 16, alignItems: 'start' }}>
        <section className="card"><div className="card-head"><h2>{t('r.byPackage')}</h2></div><div className="card-pad"><RankBars items={r.byPackage} empty={t('common.none')} /></div></section>
        <section className="card"><div className="card-head"><h2>{t('r.byRouter')}</h2></div><div className="card-pad"><RankBars items={r.byRouter} empty={t('common.none')} /></div></section>
      </div>

      <div className="grid" style={{ gridTemplateColumns: 'minmax(0, 1.5fr) minmax(280px, 1fr)', marginBottom: 16, alignItems: 'start' }}>
        <section className="card"><div className="card-head"><h2>{t('r.peak')}</h2><span className="muted small">{t('r.peakSub')}</span></div><div className="card-pad"><Heatmap grid={r.heat} /></div></section>
        <section className="card">
          <div className="card-head"><h2>{t('r.outcomes')}</h2><span className="muted small">{r.kpi.success.value === null ? '—' : `${r.kpi.success.value}% ${t('r.success').toLowerCase()}`}</span></div>
          <div className="card-pad"><OutcomeBar data={r.outcome} labels={outcomeLabels} /></div>
        </section>
      </div>

      <section className="card">
        <div className="card-head"><h2>{t('r.topCustomers')}</h2></div>
        {r.topCustomers.length === 0 ? <p className="empty">{t('common.none')}</p> : (
          <div className="table-wrap"><table>
            <thead><tr><th>#</th><th>Phone</th><th>{t('r.sales')}</th><th>{t('r.revenue')}</th><th>Last</th></tr></thead>
            <tbody>{r.topCustomers.map((c, i) => <tr key={c.phone}><td className="muted">{i + 1}</td><td className="mono">{maskPhone(c.phone)}</td><td>{c.count}</td><td><strong>{money(c.total)}</strong></td><td className="muted small">{dateTime(c.last, workspace.timezone)}</td></tr>)}</tbody>
          </table></div>
        )}
      </section>
    </>
  );
}
