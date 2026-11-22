import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, Lock } from 'lucide-react';
import { StatusBadge } from '@/components/RouterStatus';
import { AUDIT_LABELS } from '@/lib/audit';
import { deleteWorkspace, resumeWorkspace, setPlan, suspendWorkspace } from '@/lib/admin-actions';
import { PLANS } from '@/lib/config';
import { db } from '@/lib/db';
import { ago, dateTime, money } from '@/lib/format';
import { ROLE_INFO, type Role } from '@/lib/permissions';

export const metadata = { title: 'Business' };
const DAY = 86_400_000;

export default async function AdminWorkspace({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ error?: string }> }) {
  const { id } = await params;
  const { error } = await searchParams;
  const w = await db.workspace.findUnique({
    where: { id },
    include: {
      members: { include: { user: { select: { name: true, email: true } } }, orderBy: { createdAt: 'asc' } },
      sites: { orderBy: { createdAt: 'asc' } },
      _count: { select: { packages: true, accesses: true, batches: true } },
    },
  });
  if (!w) notFound();
  const tz = w.timezone;
  // Totals and setup only. Individual sales, customers and the team's own activity stay private to the business.
  const since30 = new Date(Date.now() - 30 * DAY);
  const [vol30, volAll, outcomes, lastSale, logs, activeCodes] = await Promise.all([
    db.payment.aggregate({ where: { workspaceId: id, status: 'completed', completedAt: { gte: since30 } }, _sum: { amount: true }, _count: true }),
    db.payment.aggregate({ where: { workspaceId: id, status: 'completed' }, _sum: { amount: true }, _count: true }),
    db.payment.groupBy({ by: ['status'], where: { workspaceId: id, createdAt: { gte: since30 } }, _count: true }),
    db.payment.aggregate({ where: { workspaceId: id, status: 'completed' }, _max: { completedAt: true } }),
    db.auditLog.findMany({ where: { workspaceId: id, action: { startsWith: 'platform.' } }, orderBy: { createdAt: 'desc' }, take: 12, include: { user: { select: { name: true } } } }),
    db.access.count({ where: { workspaceId: id, status: 'active', expiresAt: { gt: new Date() } } }),
  ]);
  const oc = Object.fromEntries(outcomes.map((o) => [o.status, o._count])) as Record<string, number>;
  const finished = (oc.completed ?? 0) + (oc.failed ?? 0) + (oc.expired ?? 0);
  const rate = finished ? Math.round(((oc.completed ?? 0) / finished) * 100) : null;
  const realSites = w.sites.filter((s) => s.kind !== 'simulated');
  const checks = [
    { ok: realSites.length > 0, label: realSites.length ? `${realSites.length} router${realSites.length > 1 ? 's' : ''} set up` : 'No router set up yet' },
    { ok: realSites.length > 0 && realSites.every((s) => s.lastSeenAt && Date.now() - s.lastSeenAt.getTime() < 45_000), label: 'All routers checking in' },
    { ok: w._count.packages > 0, label: `${w._count.packages} package${w._count.packages === 1 ? '' : 's'}` },
    { ok: w.paymentProvider !== 'none' && w.paymentProvider !== 'test', label: w.paymentProvider === 'none' ? 'Vouchers only (no mobile money)' : w.paymentProvider === 'test' ? 'Mobile money still in test mode' : `Mobile money via ${w.paymentProvider}` },
    { ok: rate === null || rate >= 50, label: rate === null ? 'No mobile money attempts in 30 days' : `${rate}% of payments succeed (30 days)` },
    { ok: !(oc.needs_review ?? 0), label: oc.needs_review ? `${oc.needs_review} payment${oc.needs_review > 1 ? 's' : ''} with a wrong amount` : 'No amount mismatches' },
  ];
  const owner = w.members.find((m) => m.role === 'owner');

  return (
    <>
      <Link href="/admin/businesses" className="muted small row" style={{ gap: 6, marginBottom: 12 }}><ArrowLeft size={14} /> All businesses</Link>
      <div className="page-head">
        <div>
          <div className="row"><h1>{w.name}</h1>{w.suspendedAt && <span className="badge bad">Suspended</span>}{w.isDemo && <span className="badge">Demo</span>}<span className={`badge ${w.plan === 'pro' ? 'accent' : ''}`}>{PLANS[w.plan as keyof typeof PLANS]?.name ?? w.plan}</span></div>
          <p>Owner {owner?.user.name ?? '—'} · {owner?.user.email ?? ''} · joined {dateTime(w.createdAt, tz)}</p>
        </div>
      </div>
      <p className="privacy-note"><Lock size={14} /> You see account status, totals and setup health. Sales, customers and the team&apos;s own activity belong to {w.name}.</p>
      {w.suspendedAt && <p className="notice warn" style={{ marginBottom: 16 }}>Suspended {dateTime(w.suspendedAt, tz)}: {w.suspendReason}. The dashboard and Wi-Fi page are blocked; customers already online keep their time.</p>}

      <div className="grid grid-4" style={{ marginBottom: 16 }}>
        <div className="card card-pad kpi"><small>Mobile money, 30 days</small><strong>{money(vol30._sum.amount ?? 0)}</strong><span className="muted small">{vol30._count} payments</span></div>
        <div className="card card-pad kpi"><small>All time</small><strong>{money(volAll._sum.amount ?? 0)}</strong><span className="muted small">{volAll._count} payments</span></div>
        <div className="card card-pad kpi"><small>Online now</small><strong>{activeCodes}</strong><span className="muted small">{w._count.accesses.toLocaleString('en-US')} codes in total</span></div>
        <div className="card card-pad kpi"><small>Setup</small><strong>{w.sites.length}</strong><span className="muted small">routers · {w._count.packages} packages · {w.paymentProvider === 'none' ? 'no mobile money' : w.paymentProvider}</span></div>
      </div>

      <div className="grid grid-2" style={{ marginBottom: 16, alignItems: 'start' }}>
        <section className="card">
          <div className="card-head"><h2>Routers</h2></div>
          {w.sites.length === 0 ? <p className="empty">No routers yet.</p> : (
            <table><tbody>{w.sites.map((s) => (
              <tr key={s.id}><td><strong>{s.name}</strong><div className="muted small">{s.kind} · {s.kind === 'simulated' ? 'virtual' : `seen ${ago(s.lastSeenAt)}`}{s.routerVersion ? ` · ${s.routerVersion}` : ''}</div></td><td style={{ textAlign: 'right' }}><StatusBadge lastSeen={s.lastSeenAt} kind={s.kind} /></td></tr>
            ))}</tbody></table>
          )}
        </section>
        <section className="card">
          <div className="card-head"><h2>Team</h2><span className="muted small">{w.members.length}</span></div>
          <table><tbody>{w.members.map((m) => (
            <tr key={m.id}><td><strong>{m.user.name}</strong><div className="muted small">{m.user.email}</div></td><td style={{ textAlign: 'right' }}><span className="badge">{ROLE_INFO[m.role as Role]?.label ?? m.role}</span></td></tr>
          ))}</tbody></table>
        </section>
      </div>

      <div className="grid grid-2" style={{ marginBottom: 16, alignItems: 'start' }}>
        <section className="card">
          <div className="card-head"><h2>Setup health</h2><span className="muted small">last sale {lastSale._max.completedAt ? ago(lastSale._max.completedAt) : 'never'}</span></div>
          <div className="card-pad stack" style={{ gap: 9 }}>
            {checks.map((c) => <div key={c.label} className="row" style={{ gap: 9 }}><span className={`badge ${c.ok ? 'ok' : 'warn'}`}>{c.ok ? '✓' : '!'}</span><span className="small">{c.label}</span></div>)}
          </div>
        </section>
        <section className="card">
          <div className="card-head"><h2>Console actions</h2><span className="muted small">the team&apos;s own activity stays private</span></div>
          {logs.length === 0 ? <p className="empty">No console actions on this business yet.</p> : (
            <table><tbody>{logs.map((l) => (
              <tr key={l.id}><td><strong>{AUDIT_LABELS[l.action] ?? l.action.replace('platform.', 'Platform: ')}</strong><div className="muted small">{l.user?.name ?? '—'} · {l.detail}</div></td><td className="muted small" style={{ textAlign: 'right' }}>{ago(l.createdAt)}</td></tr>
            ))}</tbody></table>
          )}
        </section>
      </div>

      <div className="grid grid-2" style={{ alignItems: 'start' }}>
        <section className="card">
          <div className="card-head"><h2>Plan and access</h2></div>
          <div className="card-pad stack" style={{ gap: 14 }}>
            <form action={setPlan} className="row" style={{ flexWrap: 'nowrap' }}>
              <input type="hidden" name="id" value={w.id} />
              <select name="plan" defaultValue={w.plan} style={{ width: 'auto' }}>{Object.entries(PLANS).map(([k, p]) => <option key={k} value={k}>{p.name} · {p.note}</option>)}</select>
              <button className="btn btn-sm">Change plan</button>
            </form>
            {w.suspendedAt ? (
              <form action={resumeWorkspace}><input type="hidden" name="id" value={w.id} /><button className="btn btn-sm">Lift suspension</button></form>
            ) : (
              <form action={suspendWorkspace} className="stack" style={{ gap: 8 }}>
                <input type="hidden" name="id" value={w.id} />
                <label className="field">Reason (shown to the business)<input name="reason" placeholder="Unpaid invoice, or terms of use" maxLength={200} /></label>
                <div><button className="btn btn-danger btn-sm">Suspend business</button></div>
              </form>
            )}
          </div>
        </section>
        <section className="card danger-zone">
          <div className="card-head"><h2>Delete business</h2></div>
          <div className="card-pad stack" style={{ gap: 10 }}>
            <p className="muted small">Deletes the business, its routers, packages, codes, payments records and team links. It can&apos;t be undone. The owner&apos;s sign-in stays.</p>
            {error === 'confirm' && <p className="error">Type the exact business name to confirm.</p>}
            <form action={deleteWorkspace} className="stack" style={{ gap: 8 }}>
              <input type="hidden" name="id" value={w.id} />
              <label className="field">Type <b style={{ color: 'var(--ink)' }}>{w.name}</b> to confirm<input name="confirm" autoComplete="off" /></label>
              <div><button className="btn btn-danger btn-sm">Delete permanently</button></div>
            </form>
          </div>
        </section>
      </div>
    </>
  );
}
