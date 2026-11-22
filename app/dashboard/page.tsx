import Link from 'next/link';
import { ArrowRight, Check } from 'lucide-react';
import { PayBadge } from '@/components/Badges';
import { StackedBars } from '@/components/charts/Charts';
import { AutoRefresh, StatusBadge } from '@/components/RouterStatus';
import { requireWorkspace } from '@/lib/auth';
import { db } from '@/lib/db';
import { ago, dateTime, money } from '@/lib/format';
import { getT } from '@/lib/lang';
import { can } from '@/lib/permissions';
import { maskPhone } from '@/lib/phone';
import { buildReport, parseFilters } from '@/lib/reports';
import { startOfDay, startOfMonth } from '@/lib/time';

export const metadata = { title: 'Overview' };

export default async function Overview({ searchParams }: { searchParams: Promise<{ joined?: string }> }) {
  const { workspace, role } = await requireWorkspace();
  const { joined } = await searchParams;
  const t = await getT();
  const ws = workspace.id;
  const seeMoney = can(role, 'sales.view');
  // Days start at midnight in the business's own time zone, not the server's.
  const today = startOfDay(workspace.timezone);
  const month = startOfMonth(workspace.timezone);

  const [sites, packages, vouchers, active, todaySales, monthSales, voucherToday, recent, week] = await Promise.all([
    db.site.findMany({ where: { workspaceId: ws }, orderBy: { createdAt: 'asc' } }),
    db.package.count({ where: { workspaceId: ws, active: true } }),
    db.access.count({ where: { workspaceId: ws, kind: 'voucher' } }),
    db.access.count({ where: { workspaceId: ws, status: 'active', expiresAt: { gt: new Date() } } }),
    db.payment.aggregate({ where: { workspaceId: ws, status: 'completed', completedAt: { gte: today } }, _sum: { amount: true }, _count: true }),
    db.payment.aggregate({ where: { workspaceId: ws, status: 'completed', completedAt: { gte: month } }, _sum: { amount: true } }),
    db.access.count({ where: { workspaceId: ws, kind: 'voucher', activatedAt: { gte: today } } }),
    seeMoney ? db.payment.findMany({ where: { workspaceId: ws }, orderBy: { createdAt: 'desc' }, take: 6, include: { package: true } }) : Promise.resolve([]),
    seeMoney ? buildReport(workspace, parseFilters({ period: '7d' }, workspace.timezone)) : Promise.resolve(null),
  ]);

  const online = sites.some((s) => s.kind === 'simulated' || (s.lastSeenAt && Date.now() - s.lastSeenAt.getTime() < 45_000));
  const steps = [
    { done: sites.length > 0, title: 'Add your router', text: 'Name the venue and copy one script into your router.', href: sites[0] ? `/dashboard/sites/${sites[0].id}` : '/dashboard/sites/new', cta: 'Add router' },
    { done: online, title: 'Router online', text: 'The router checks in with incnet by itself after the script runs.', href: sites[0] ? `/dashboard/sites/${sites[0].id}` : '/dashboard/sites/new', cta: 'See setup' },
    { done: packages > 0, title: 'Set your prices', text: 'Starter packages are ready. Change names, prices and speeds.', href: '/dashboard/packages', cta: 'Packages' },
    { done: workspace.paymentProvider !== 'none', title: 'Turn on mobile money (optional)', text: 'Customers pay with M-Pesa, Mixx by Yas, Airtel Money or Halotel and get online by themselves.', href: '/dashboard/settings', cta: 'Payments' },
    { done: vouchers > 0, title: 'Print vouchers (optional)', text: 'Sell codes at the counter, even without mobile money.', href: '/dashboard/vouchers', cta: 'Vouchers' },
  ];
  const remaining = can(role, 'routers.manage') ? steps.filter((s) => !s.done).length : 0;

  return (
    <>
      <AutoRefresh seconds={15} />
      {joined && <p className="notice" style={{ marginBottom: 16 }}>{t('ov.joined')}</p>}
      <div className="page-head">
        <div><h1>{t('ov.title')}</h1><p>{workspace.name} {t('ov.glance')}</p></div>
        {can(role, 'vouchers.create') && <Link className="btn" href="/dashboard/vouchers">{t('ov.makeVouchers')}</Link>}
      </div>

      <div className="grid grid-4" style={{ marginBottom: 16 }}>
        {seeMoney && <div className="card card-pad stat"><small>{t('ov.salesToday')}</small><strong>{money(todaySales._sum.amount ?? 0)}</strong><span className="muted small">{todaySales._count} {t('ov.payments')}</span></div>}
        {seeMoney && <div className="card card-pad stat"><small>{t('ov.month')}</small><strong>{money(monthSales._sum.amount ?? 0)}</strong><span className="muted small">{t('ov.mobile')}</span></div>}
        <div className="card card-pad stat"><small>{t('ov.connected')}</small><strong>{active}</strong><span className="muted small">{t('ov.timeLeft')}</span></div>
        <div className="card card-pad stat"><small>{t('ov.vouchersToday')}</small><strong>{voucherToday}</strong><span className="muted small">{vouchers} {t('ov.printed')}</span></div>
      </div>

      {week && (
        <section className="card" style={{ marginBottom: 16 }}>
          <div className="card-head"><h2>{t('ov.week')}</h2><Link className="btn btn-ghost btn-sm" href="/dashboard/reports">{t('nav.reports')} <ArrowRight size={14} /></Link></div>
          <div className="card-pad"><StackedBars data={week.buckets} labels={{ mobile: t('r.mobile'), voucher: t('r.voucher') }} /></div>
        </section>
      )}

      <div className="grid grid-2">
        {remaining > 0 && (
          <section className="card">
            <div className="card-head"><h2>{t('ov.setup')}</h2><span className="muted small">{steps.length - remaining} / {steps.length}</span></div>
            <div className="steps">
              {steps.map((s, i) => (
                <div key={s.title} className={`step${s.done ? ' done' : ''}`}>
                  <span className="n">{s.done ? <Check size={14} /> : i + 1}</span>
                  <div><strong>{s.title}</strong><div className="muted small">{s.text}</div></div>
                  {!s.done && <Link className="btn btn-ghost btn-sm" href={s.href}>{s.cta}</Link>}
                </div>
              ))}
            </div>
          </section>
        )}

        {can(role, 'routers.view') && (
          <section className="card">
            <div className="card-head"><h2>{t('ov.routers')}</h2>{can(role, 'routers.manage') && <Link className="btn btn-ghost btn-sm" href="/dashboard/sites/new">+</Link>}</div>
            {sites.length === 0 ? <p className="empty">—</p> : (
              <table><tbody>
                {sites.map((s) => (
                  <tr key={s.id}>
                    <td><Link href={`/dashboard/sites/${s.id}`}><strong>{s.name}</strong></Link><div className="muted small">{s.kind === 'simulated' ? 'Virtual router in your browser' : `Last check-in ${ago(s.lastSeenAt)}`}</div></td>
                    <td style={{ textAlign: 'right' }}><StatusBadge lastSeen={s.lastSeenAt} kind={s.kind} /></td>
                  </tr>
                ))}
              </tbody></table>
            )}
          </section>
        )}

        {seeMoney && (
          <section className="card">
            <div className="card-head"><h2>{t('ov.recent')}</h2><Link className="btn btn-ghost btn-sm" href="/dashboard/sales">{t('ov.allSales')} <ArrowRight size={14} /></Link></div>
            {recent.length === 0 ? <p className="empty">—</p> : (
              <table><tbody>
                {recent.map((p) => (
                  <tr key={p.id}>
                    <td><strong>{money(p.amount)}</strong><div className="muted small">{p.package.name} · {maskPhone(p.phone)}</div></td>
                    <td className="muted small">{dateTime(p.createdAt)}</td>
                    <td style={{ textAlign: 'right' }}><PayBadge status={p.status} /></td>
                  </tr>
                ))}
              </tbody></table>
            )}
          </section>
        )}
      </div>
    </>
  );
}
