import Link from 'next/link';
import { CheckCircle2, XCircle } from 'lucide-react';
import { ONLINE_MS } from '@/lib/admin';
import { purgeDemos } from '@/lib/admin-actions';
import { APP_URL, IS_CLOUD, SYNC_INTERVAL } from '@/lib/config';
import { db } from '@/lib/db';
import { ago, dateTime, money } from '@/lib/format';
import { maskPhone } from '@/lib/phone';

export const metadata = { title: 'System · Platform' };
const DAY = 86_400_000;

/** Is the platform healthy? Configuration checks, routers that went quiet, payments that went wrong. */
export default async function AdminSystem() {
  const now = Date.now();
  let dbOk = true;
  try { await db.$queryRaw`SELECT 1`; } catch { dbOk = false; }
  const [offline, failed, providers, demos, oldDemos, platformLog] = await Promise.all([
    db.site.findMany({ where: { kind: { not: 'simulated' }, workspace: { isDemo: false }, OR: [{ lastSeenAt: null }, { lastSeenAt: { lt: new Date(now - ONLINE_MS) } }] }, orderBy: { lastSeenAt: 'desc' }, take: 25, include: { workspace: { select: { id: true, name: true } } } }),
    db.payment.findMany({ where: { status: { in: ['failed', 'needs_review'] }, createdAt: { gte: new Date(now - DAY) } }, orderBy: { createdAt: 'desc' }, take: 25, include: { workspace: { select: { id: true, name: true, timezone: true } } } }),
    db.workspace.groupBy({ by: ['paymentProvider'], where: { isDemo: false }, _count: true }),
    db.workspace.count({ where: { isDemo: true } }),
    db.workspace.count({ where: { isDemo: true, createdAt: { lt: new Date(now - DAY) } } }),
    db.auditLog.findMany({ where: { action: { startsWith: 'platform.' } }, orderBy: { createdAt: 'desc' }, take: 15, include: { user: { select: { name: true } }, workspace: { select: { id: true, name: true } } } }),
  ]);
  const checks = [
    { ok: dbOk, label: 'Database reachable' },
    { ok: APP_URL.startsWith('https://'), label: `Public address uses HTTPS (${APP_URL})` },
    { ok: (process.env.APP_SECRET || '').length >= 32, label: 'APP_SECRET is set and long enough' },
    { ok: true, label: `Routers check in every ${SYNC_INTERVAL}s` },
    { ok: true, label: IS_CLOUD ? 'Hosted mode: plans, open sign-up and the live demo are on' : 'Self-hosted mode' },
  ];
  const provName: Record<string, string> = { none: 'Vouchers only', incpesa: 'incpesa', snippe: 'Snippe', test: 'Test mode' };
  return (
    <>
      <div className="grid grid-2" style={{ marginBottom: 16, alignItems: 'start' }}>
        <section className="card">
          <div className="card-head"><h2>Health checks</h2></div>
          <div className="card-pad stack" style={{ gap: 10 }}>
            {checks.map((c) => <div key={c.label} className="row" style={{ gap: 10 }}>{c.ok ? <CheckCircle2 size={17} color="var(--ok)" /> : <XCircle size={17} color="var(--bad)" />}<span>{c.label}</span><span className={`badge ${c.ok ? 'ok' : 'bad'}`} style={{ marginLeft: 'auto' }}>{c.ok ? 'OK' : 'Fix'}</span></div>)}
          </div>
        </section>
        <section className="card">
          <div className="card-head"><h2>Payments setup across businesses</h2></div>
          <div className="card-pad stack" style={{ gap: 8 }}>
            {providers.map((p) => <div key={p.paymentProvider} className="spread"><span>{provName[p.paymentProvider] ?? p.paymentProvider}</span><strong>{p._count}</strong></div>)}
            <hr style={{ border: 0, borderTop: '1px solid var(--line)' }} />
            <div className="spread"><span>Demo workspaces <span className="muted small">({oldDemos} older than a day)</span></span><strong>{demos}</strong></div>
            <form action={purgeDemos}><button className="btn btn-ghost btn-sm" disabled={!oldDemos}>Clean up old demos now</button></form>
          </div>
        </section>
      </div>

      <section className="card" style={{ marginBottom: 16 }}>
        <div className="card-head"><h2>Routers not checking in</h2><span className="muted small">{offline.length}{offline.length === 25 ? '+' : ''}</span></div>
        {offline.length === 0 ? <p className="empty">Every router is online.</p> : (
          <div className="table-wrap"><table>
            <thead><tr><th>Router</th><th>Business</th><th>Type</th><th>Last check-in</th></tr></thead>
            <tbody>{offline.map((s) => <tr key={s.id}><td><strong>{s.name}</strong></td><td><Link className="accent" href={`/dashboard/admin/workspaces/${s.workspace.id}`}>{s.workspace.name}</Link></td><td className="muted">{s.kind}</td><td className="muted small">{s.lastSeenAt ? ago(s.lastSeenAt) : 'never (not set up yet)'}</td></tr>)}</tbody>
          </table></div>
        )}
      </section>

      <div className="grid grid-2" style={{ alignItems: 'start' }}>
        <section className="card">
          <div className="card-head"><h2>Failed payments, 24 hours</h2><span className="muted small">{failed.length}</span></div>
          {failed.length === 0 ? <p className="empty">None.</p> : (
            <table><tbody>{failed.map((p) => <tr key={p.id}><td><strong>{money(p.amount)}</strong> <span className="muted small">{maskPhone(p.phone)}</span><div className="muted small">{p.failureReason ?? p.status}</div></td><td className="small"><Link className="accent" href={`/dashboard/admin/workspaces/${p.workspace.id}`}>{p.workspace.name}</Link><div className="muted">{dateTime(p.createdAt, p.workspace.timezone)}</div></td></tr>)}</tbody></table>
          )}
        </section>
        <section className="card">
          <div className="card-head"><h2>Platform actions</h2></div>
          {platformLog.length === 0 ? <p className="empty">No console actions yet.</p> : (
            <table><tbody>{platformLog.map((l) => <tr key={l.id}><td><strong>{l.detail.replace('[Platform] ', '')}</strong><div className="muted small">{l.user?.name ?? '—'} · <Link className="accent" href={`/dashboard/admin/workspaces/${l.workspace.id}`}>{l.workspace.name}</Link></div></td><td className="muted small" style={{ textAlign: 'right' }}>{ago(l.createdAt)}</td></tr>)}</tbody></table>
          )}
        </section>
      </div>
    </>
  );
}
