import Link from 'next/link';
import { AlertTriangle, ArrowRight, Ban, CreditCard, FlaskConical, Lock, WifiOff } from 'lucide-react';
import { SingleBars } from '@/components/charts/Charts';
import { db } from '@/lib/db';
import { dateTime, money } from '@/lib/format';
import { dayKey } from '@/lib/time';
import { DEFAULT_TZ } from '@/lib/format';
import { ONLINE_MS } from '@/lib/admin';

export const metadata = { title: 'Overview' };

const DAY = 86_400_000;

/** Platform health at a glance: growth, money moving, and what needs attention. */
export default async function AdminOverview() {
  const now = Date.now();
  const d30 = new Date(now - 30 * DAY);
  const d7 = new Date(now - 7 * DAY);
  const real = { isDemo: false };
  const [workspaces, pro, suspended, demos, users, sites, online, activeWs, signups30, signups7, volume30, payments30, failed24, recentWs] = await Promise.all([
    db.workspace.count({ where: real }),
    db.workspace.count({ where: { ...real, plan: 'pro' } }),
    db.workspace.count({ where: { suspendedAt: { not: null } } }),
    db.workspace.count({ where: { isDemo: true } }),
    db.user.count({ where: { NOT: { email: { endsWith: '@demo.incnet.local' } } } }),
    db.site.count({ where: { kind: { not: 'simulated' }, workspace: real } }),
    db.site.count({ where: { kind: { not: 'simulated' }, workspace: real, lastSeenAt: { gte: new Date(now - ONLINE_MS) } } }),
    db.workspace.count({ where: { ...real, payments: { some: { status: 'completed', completedAt: { gte: d7 } } } } }),
    db.workspace.findMany({ where: { ...real, createdAt: { gte: d30 } }, select: { createdAt: true } }),
    db.workspace.count({ where: { ...real, createdAt: { gte: d7 } } }),
    db.payment.findMany({ where: { status: 'completed', completedAt: { gte: d30 }, workspace: real }, select: { amount: true, completedAt: true } }),
    db.payment.count({ where: { createdAt: { gte: d30 }, workspace: real } }),
    db.payment.count({ where: { status: { in: ['failed', 'needs_review'] }, createdAt: { gte: new Date(now - DAY) }, workspace: real } }),
    db.workspace.findMany({ where: real, orderBy: { createdAt: 'desc' }, take: 6, include: { members: { where: { role: 'owner' }, take: 1, include: { user: { select: { email: true } } } } } }),
  ]);
  const offline = sites - online;
  const totalVolume = volume30.reduce((s, p) => s + p.amount, 0);
  const completed30 = volume30.length;

  const days = Array.from({ length: 30 }, (_, i) => new Date(now - (29 - i) * DAY));
  const signupSeries = days.map((d) => ({ label: d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', timeZone: DEFAULT_TZ }), key: dayKey(DEFAULT_TZ, d), value: 0 }));
  const volSeries = signupSeries.map((d) => ({ ...d, value: 0 }));
  const idx = new Map(signupSeries.map((d, i) => [d.key, i]));
  for (const w of signups30) { const i = idx.get(dayKey(DEFAULT_TZ, w.createdAt)); if (i !== undefined) signupSeries[i].value += 1; }
  for (const p of volume30) { const i = idx.get(dayKey(DEFAULT_TZ, p.completedAt!)); if (i !== undefined) volSeries[i].value += p.amount; }

  const attention = [
    { n: offline, icon: WifiOff, text: 'routers offline right now', href: '/admin/system' },
    { n: failed24, icon: CreditCard, text: 'failed or flagged payments in the last 24 hours', href: '/admin/system' },
    { n: suspended, icon: Ban, text: 'suspended businesses', href: '/admin/businesses?status=suspended' },
    { n: demos, icon: FlaskConical, text: 'demo workspaces (cleaned up after 24 hours)', href: '/admin/system' },
  ];

  return (
    <>
      <div className="page-head"><div><h1>Platform overview</h1><p>Growth, money moving and what needs attention. Demo workspaces are left out of the numbers.</p></div></div>
      <p className="privacy-note"><Lock size={14} /> The console is for running the platform: accounts, plans, router health and setup issues. Each business&apos;s sales and customers stay theirs; you only see totals.</p>
      <div className="grid grid-4" style={{ marginBottom: 16 }}>
        <div className="card card-pad kpi"><small>Businesses</small><strong>{workspaces.toLocaleString('en-US')}</strong><span className="muted small">+{signups7} this week · {pro} on Business</span></div>
        <div className="card card-pad kpi"><small>Active this week</small><strong>{activeWs.toLocaleString('en-US')}</strong><span className="muted small">made a sale in the last 7 days</span></div>
        <div className="card card-pad kpi"><small>Routers online</small><strong>{online} <span className="muted" style={{ fontSize: 18 }}>/ {sites}</span></strong><span className="muted small">{users} users in total</span></div>
        <div className="card card-pad kpi"><small>Mobile money, 30 days</small><strong>{money(totalVolume)}</strong><span className="muted small">{completed30} of {payments30} payments completed</span></div>
      </div>

      <div className="grid grid-2" style={{ marginBottom: 16, alignItems: 'start' }}>
        <section className="card"><div className="card-head"><h2>New businesses, 30 days</h2><span className="muted small">{signups30.length} sign-ups</span></div><div className="card-pad"><SingleBars data={signupSeries} unit="sign-ups" /></div></section>
        <section className="card"><div className="card-head"><h2>Mobile money volume, 30 days</h2><span className="muted small">{money(totalVolume)}</span></div><div className="card-pad"><SingleBars data={volSeries} unit="" money /></div></section>
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
          {recentWs.length === 0 ? <p className="empty">No businesses yet.</p> : (
            <table><tbody>
              {recentWs.map((w) => (
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
