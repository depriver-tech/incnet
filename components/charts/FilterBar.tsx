import Link from 'next/link';
import { Download } from 'lucide-react';
import { filterQuery, type ReportFilters } from '@/lib/reports';

/** Period chips, then router / package / channel selects and custom dates, all in one row above the charts. */
export function FilterBar({ path, f, sites, packages, t, exportHref, showChannel = true }: {
  path: string; f: ReportFilters; sites: { id: string; name: string }[]; packages: { id: string; name: string }[];
  t: (k: string) => string; exportHref?: string; showChannel?: boolean;
}) {
  const presets = [['today', t('r.today')], ['7d', t('r.7d')], ['30d', t('r.30d')], ['month', t('r.month')], ['lastMonth', t('r.lastMonth')], ['custom', t('r.custom')]] as const;
  return (
    <form className="card report-filters" method="get" action={path}>
      <div style={{ display: 'grid', gap: 4 }}>
        <span className="muted" style={{ fontSize: 12, fontWeight: 500 }}>{t('r.period')}</span>
        <div className="chips">
          {presets.map(([id, label]) => (
            <Link key={id} className={`chip${f.preset === id ? ' on' : ''}`} href={`${path}?${filterQuery({ ...f, preset: id })}`} scroll={false}>{label}</Link>
          ))}
        </div>
      </div>
      <input type="hidden" name="period" value={f.preset} />
      {f.preset === 'custom' && (
        <>
          <label>{t('r.from')}<input type="date" name="from" defaultValue={f.fromInput} /></label>
          <label>{t('r.to')}<input type="date" name="to" defaultValue={f.toInput} /></label>
        </>
      )}
      <label>{t('r.router')}<select name="site" defaultValue={f.site}><option value="">{t('r.allRouters')}</option>{sites.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</select></label>
      <label>{t('r.package')}<select name="pkg" defaultValue={f.pkg}><option value="">{t('r.allPackages')}</option>{packages.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select></label>
      {showChannel && <label>{t('r.channel')}<select name="channel" defaultValue={f.channel}><option value="all">{t('r.allChannels')}</option><option value="mobile">{t('r.mobile')}</option><option value="voucher">{t('r.voucher')}</option></select></label>}
      <button className="btn btn-sm">{t('common.apply')}</button>
      <Link className="btn btn-ghost btn-sm" href={path}>{t('common.reset')}</Link>
      {exportHref && <a className="btn btn-ghost btn-sm" href={exportHref} style={{ marginLeft: 'auto' }}><Download size={14} /> {t('common.export')}</a>}
    </form>
  );
}
