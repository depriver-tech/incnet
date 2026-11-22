import Link from 'next/link';
import { ArrowRight, Check } from 'lucide-react';
import { AutoRefresh, StatusBadge } from '@/components/RouterStatus';
import { requireWorkspace } from '@/lib/auth';
import { db } from '@/lib/db';
import { ago, dateTime, money } from '@/lib/format';
import { maskPhone } from '@/lib/phone';
import { PayBadge } from '@/components/Badges';

export const metadata = { title: 'Overview' };

function startOfDay() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

export default async function Overview() {
  const { workspace } = await requireWorkspace();
  const ws = workspace.id;
  const today = startOfDay();
  const month = new Date(today.getFullYear(), today.getMonth(), 1);

  const [sites, packages, vouchers, active, todaySales, monthSales, voucherToday, recent] = await Promise.all([
    db.site.findMany({ where: { workspaceId: ws }, orderBy: { createdAt: 'asc' } }),
    db.package.count({ where: { workspaceId: ws, active: true } }),
    db.access.count({ where: { workspaceId: ws, kind: 'voucher' } }),
    db.access.count({ where: { workspaceId: ws, status: 'active', expiresAt: { gt: new Date() } } }),
    db.payment.aggregate({ where: { workspaceId: ws, status: 'completed', completedAt: { gte: today } }, _sum: { amount: true }, _count: true }),
    db.payment.aggregate({ where: { workspaceId: ws, status: 'completed', completedAt: { gte: month } }, _sum: { amount: true } }),
    db.access.count({ where: { workspaceId: ws, kind: 'voucher', activatedAt: { gte: today } } }),
    db.payment.findMany({ where: { workspaceId: ws }, orderBy: { createdAt: 'desc' }, take: 6, include: { package: true } }),
  ]);

  const online = sites.some((s) => s.lastSeenAt && Date.now() - s.lastSeenAt.getTime() < 45_000);
  const steps = [
    { done: sites.length > 0, title: 'Add your router', text: 'Name the venue and copy one script into your MikroTik.', href: sites[0] ? `/dashboard/sites/${sites[0].id}` : '/dashboard/sites/new', cta: 'Add router' },
    { done: online, title: 'Router online', text: 'The router checks in with incnet by itself after the script runs.', href: sites[0] ? `/dashboard/sites/${sites[0].id}` : '/dashboard/sites/new', cta: 'See setup' },
    { done: packages > 0, title: 'Set your prices', text: 'Starter packages are ready. Change names, prices and speeds.', href: '/dashboard/packages', cta: 'Packages' },
    { done: workspace.paymentProvider !== 'none', title: 'Turn on mobile money (optional)', text: 'Customers pay with M-Pesa, Mixx by Yas, Airtel Money or Halotel and get online by themselves.', href: '/dashboard/settings', cta: 'Payments' },
    { done: vouchers > 0, title: 'Print vouchers (optional)', text: 'Sell codes at the counter, even without mobile money.', href: '/dashboard/vouchers', cta: 'Vouchers' },
  ];
  const remaining = steps.filter((s) => !s.done).length;

  return (
    <>
      <AutoRefresh seconds={10} />
      <div className="page-head">
        <div>
          <h1>Good to see you</h1>
          <p>{workspace.name} at a glance.</p>
        </div>
        <Link className="btn" href="/dashboard/vouchers">Make vouchers</Link>
      </div>

      <div className="grid grid-4" style={{ marginBottom: 16 }}>
        <div className="card card-pad stat"><small>Sales today</small><strong>{money(todaySales._sum.amount ?? 0)}</strong><span className="muted small">{todaySales._count} mobile payments</span></div>
        <div className="card card-pad stat"><small>This month</small><strong>{money(monthSales._sum.amount ?? 0)}</strong><span className="muted small">mobile money</span></div>
        <div className="card card-pad stat"><small>Connected codes</small><strong>{active}</strong><span className="muted small">with time left</span></div>
        <div className="card card-pad stat"><small>Vouchers used today</small><strong>{voucherToday}</strong><span className="muted small">{vouchers} printed in total</span></div>
      </div>

      <div className="grid grid-2">
        {remaining > 0 && (
          <section className="card">
            <div className="card-head"><h2>Get set up</h2><span className="muted small">{steps.length - remaining} of {steps.length} done</span></div>
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

        <section className="card">
          <div className="card-head"><h2>Routers</h2><Link className="btn btn-ghost btn-sm" href="/dashboard/sites/new">Add router</Link></div>
          {sites.length === 0 ? <p className="empty">No routers yet.</p> : (
            <table><tbody>
              {sites.map((s) => (
                <tr key={s.id}>
                  <td><Link href={`/dashboard/sites/${s.id}`}><strong>{s.name}</strong></Link><div className="muted small">Last check-in {ago(s.lastSeenAt)}</div></td>
                  <td style={{ textAlign: 'right' }}><StatusBadge lastSeen={s.lastSeenAt} /></td>
                </tr>
              ))}
            </tbody></table>
          )}
        </section>

        <section className="card">
          <div className="card-head"><h2>Recent payments</h2><Link className="btn btn-ghost btn-sm" href="/dashboard/sales">All sales <ArrowRight size={14} /></Link></div>
          {recent.length === 0 ? <p className="empty">Payments from the hotspot page show up here.</p> : (
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
      </div>
    </>
  );
}
