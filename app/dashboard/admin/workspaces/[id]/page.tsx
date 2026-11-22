import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { StatusBadge } from '@/components/RouterStatus';
import { PayBadge } from '@/components/Badges';
import { AUDIT_LABELS } from '@/lib/audit';
import { deleteWorkspace, resumeWorkspace, setPlan, suspendWorkspace } from '@/lib/admin-actions';
import { PLANS } from '@/lib/config';
import { db } from '@/lib/db';
import { ago, dateTime, money } from '@/lib/format';
import { maskPhone } from '@/lib/phone';
import { ROLE_INFO, type Role } from '@/lib/permissions';

export const metadata = { title: 'Business · Platform' };
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
  const [vol30, volAll, payments, logs, activeCodes] = await Promise.all([
    db.payment.aggregate({ where: { workspaceId: id, status: 'completed', completedAt: { gte: new Date(Date.now() - 30 * DAY) } }, _sum: { amount: true }, _count: true }),
    db.payment.aggregate({ where: { workspaceId: id, status: 'completed' }, _sum: { amount: true }, _count: true }),
    db.payment.findMany({ where: { workspaceId: id }, orderBy: { createdAt: 'desc' }, take: 8, include: { package: { select: { name: true } } } }),
    db.auditLog.findMany({ where: { workspaceId: id }, orderBy: { createdAt: 'desc' }, take: 12, include: { user: { select: { name: true } } } }),
    db.access.count({ where: { workspaceId: id, status: 'active', expiresAt: { gt: new Date() } } }),
  ]);
  const owner = w.members.find((m) => m.role === 'owner');

  return (
    <>
      <Link href="/dashboard/admin/workspaces" className="muted small row" style={{ gap: 6, marginBottom: 12 }}><ArrowLeft size={14} /> All businesses</Link>
      <div className="page-head">
        <div>
          <div className="row"><h1>{w.name}</h1>{w.suspendedAt && <span className="badge bad">Suspended</span>}{w.isDemo && <span className="badge">Demo</span>}<span className={`badge ${w.plan === 'pro' ? 'accent' : ''}`}>{PLANS[w.plan as keyof typeof PLANS]?.name ?? w.plan}</span></div>
          <p>Owner {owner?.user.name ?? '—'} · {owner?.user.email ?? ''} · joined {dateTime(w.createdAt, tz)}</p>
        </div>
      </div>
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
          <div className="card-head"><h2>Recent payments</h2></div>
          {payments.length === 0 ? <p className="empty">No payments yet.</p> : (
            <table><tbody>{payments.map((p) => (
              <tr key={p.id}><td><strong>{money(p.amount)}</strong><div className="muted small">{p.package.name} · {maskPhone(p.phone)}</div></td><td className="muted small">{dateTime(p.createdAt, tz)}</td><td style={{ textAlign: 'right' }}><PayBadge status={p.status} /></td></tr>
            ))}</tbody></table>
          )}
        </section>
        <section className="card">
          <div className="card-head"><h2>Activity</h2></div>
          {logs.length === 0 ? <p className="empty">Nothing yet.</p> : (
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
