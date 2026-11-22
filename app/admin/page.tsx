import Link from 'next/link';
import { AlertTriangle, ArrowRight, Ban, FlaskConical, Lock, Rocket, WifiOff } from 'lucide-react';
import { SingleBars } from '@/components/charts/Charts';
import { ONLINE_MS } from '@/lib/admin';
import { PLANS } from '@/lib/config';
import { db } from '@/lib/db';
import { DEFAULT_TZ, dateTime, money } from '@/lib/format';
import { dayKey } from '@/lib/time';

export const metadata = { title: { absolute: 'Overview · incnet Console' } };
const DAY = 86_400_000;

/** SaaS health: subscriptions, growth and activation. No business's sales or customers. */
export default async function AdminOverview() {
  const now = Date.now();
  const real = { isDemo: false };
  const [total, pro, suspended, demos, signups30, signups7, prev30, withRouter, routerOnline7, routersTotal, routersOnline, recent] = await Promise.all([
    db.workspace.count({ where: real }),
    db.workspace.count({ where: { ...real, plan: 'pro', suspendedAt: null } }),
    db.workspace.count({ where: { ...real, suspendedAt: { not: null } } }),
    db.workspace.count({ where: { isDemo: true } }),
    db.workspace.findMany({ where: { ...real, createdAt: { gte: new Date(now - 30 * DAY) } }, select: { createdAt: true } }),
    db.workspace.count({ where: { ...real, createdAt: { gte: new Date(now - 7 * DAY) } } }),
    db.workspace.count({ where: { ...real, createdAt: { gte: new Date(now - 60 * DAY), lt: new Date(now - 30 * DAY) } } }),
    db.workspace.count({ where: { ...real, sites: { some: { kind: { not: 'simulated' } } } } }),
    db.workspace.count({ where: { ...real, sites: { some: { kind: { not: 'simulated' }, lastSeenAt: { gte: new Date(now - 7 * DAY) } } } } }),
    db.site.count({ where: { kind: { not: 'simulated' }, workspace: real } }),
    db.site.count({ where: { kind: { not: 'simulated' }, workspace: real, lastSeenAt: { gte: new Date(now - ONLINE_MS) } } }),
    db.workspace.findMany({ where: real, orderBy: { createdAt: 'desc' }, take: 6, include: { members: { where: { role: 'owner' }, take: 1, include: { user: { select: { email: true } } } } } }),
  ]);
  const mrr = pro * PLANS.pro.price;
  const free = total - pro - suspended;
  const growth = prev30 ? Math.round(((signups30.length - prev30) / prev30) * 100) : null;

  const days = Array.from({ length: 30 }, (_, i) => new Date(now - (29 - i) * DAY));
  const series = days.map((d) => ({ label: d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', timeZone: DEFAULT_TZ }), key: dayKey(DEFAULT_TZ, d), value: 0 }));
  const idx = new Map(series.map((d, i) => [d.key, i]));
  for (const w of signups30) { const i = idx.get(dayKey(DEFAULT_TZ, w.createdAt)); if (i !== undefined) series[i].value += 1; }

  const funnel = [
    { label: 'Signed up', n: total },
    { label: 'Added a router', n: withRouter },
    { label: 'Router active this week', n: routerOnline7 },
    { label: 'On the Business plan', n: pro },
  ];
  const attention = [
    { n: routersTotal - routersOnline, icon: WifiOff, text: 'routers offline right now', href: '/admin/routers?state=offline' },
    { n: total - withRouter, icon: Rocket, text: 'businesses that never added a router', href: '/admin/businesses?setup=none' },
    { n: suspended, icon: Ban, text: 'suspended businesses', href: '/admin/businesses?status=suspended' },
    { n: demos, icon: FlaskConical, text: 'demo workspaces (cleaned up after 24 hours)', href: '/admin/system' },
  ];

  return (
    <>
      <div className="page-head"><div><h1>Overview</h1><p>Subscriptions, growth and activation across the platform.</p></div></div>
      <p className="privacy-note"><Lock size={14} /> Business data stays with each business. To troubleshoot, open a business and start a read-only support session; it is logged for them to see.</p>

      <div className="grid grid-4" style={{ marginBottom: 16 }}>
        <div className="card card-pad kpi"><small>Monthly recurring revenue</small><strong>{money(mrr)}</strong><span className="muted small">{money(mrr * 12)} a year · {pro} paying</span></div>
        <div className="card card-pad kpi"><small>Businesses</small><strong>{total.toLocaleString('en-US')}</strong><span className="muted small">+{signups7} this week{growth !== null ? ` · ${growth >= 0 ? '▲' : '▼'} ${Math.abs(growth)}% sign-ups vs last month` : ''}</span></div>
        <div className="card card-pad kpi"><small>Activation</small><strong>{total ? Math.round((routerOnline7 / total) * 100) : 0}%</strong><span className="muted small">have a router active this week</span></div>
        <div className="card card-pad kpi"><small>Paid conversion</small><strong>{total ? Math.round((pro / total) * 100) : 0}%</strong><span className="muted small">{free} on Starter · {suspended} suspended</span></div>
      </div>

      <div className="grid" style={{ gridTemplateColumns: 'minmax(0, 1.5fr) minmax(280px, 1fr)', marginBottom: 16, alignItems: 'start' }}>
        <section className="card"><div className="card-head"><h2>New businesses, 30 days</h2><span className="muted small">{signups30.length} sign-ups</span></div><div className="card-pad"><SingleBars data={series} unit="sign-ups" /></div></section>
        <section className="card">
          <div className="card-head"><h2>Activation funnel</h2></div>
          <div className="card-pad rank">
            {funnel.map((f) => (
              <div key={f.label} className="rank-row">
                <div className="rank-top"><span>{f.label}</span><span><b>{f.n.toLocaleString('en-US')}</b> <em>{total ? Math.round((f.n / total) * 100) : 0}%</em></span></div>
                <div className="rank-track"><div style={{ width: `${total ? (f.n / total) * 100 : 0}%` }} /></div>
              </div>
            ))}
          </div>
        </section>
      </div>

      <div className="grid grid-2" style={{ alignItems: 'start' }}>
        <section className="card">
          <div className="card-head"><h2 className="row" style={{ gap: 8 }}><AlertTriangle size={16} /> Needs attention</h2></div>
          <div className="attn">
            {attention.map(({ n, icon: Icon, text, href }) => (
              <Link key={text} href={href}><Icon size={17} className={n ? 'accent' : 'muted'} /><b>{n}</b><span className={n ? '' : 'muted'}>{text}</span><ArrowRight size={14} className="muted" /></Link>
            ))}
          </div>
        </section>
        <section className="card">
          <div className="card-head"><h2>Newest businesses</h2><Link className="btn btn-ghost btn-sm" href="/admin/businesses">All <ArrowRight size={14} /></Link></div>
          {recent.length === 0 ? <p className="empty">No businesses yet.</p> : (
            <table><tbody>
              {recent.map((w) => (
                <tr key={w.id}>
                  <td><Link href={`/admin/businesses/${w.id}`}><strong>{w.name}</strong></Link><div className="muted small">{w.members[0]?.user.email ?? '—'}</div></td>
                  <td><span className={`badge ${w.plan === 'pro' ? 'accent' : ''}`}>{w.plan === 'pro' ? 'Business' : 'Starter'}</span></td>
                  <td className="muted small" style={{ textAlign: 'right' }}>{dateTime(w.createdAt, w.timezone)}</td>
                </tr>
              ))}
            </tbody></table>
          )}
        </section>
      </div>
    </>
  );
}
