import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, LifeBuoy, Lock } from 'lucide-react';
import { StatusBadge } from '@/components/RouterStatus';
import { AUDIT_LABELS } from '@/lib/audit';
import { deleteWorkspace, resumeWorkspace, setPlan, startSupport, suspendWorkspace } from '@/lib/admin-actions';
import { PLANS } from '@/lib/config';
import { db } from '@/lib/db';
import { ago, dateTime, money } from '@/lib/format';
import { ROLE_INFO, type Role } from '@/lib/permissions';

export const metadata = { title: 'Business' };
const ONLINE = 45_000;

/**
 * One business, from the platform's side: account, subscription, setup and console actions.
 * Its sales, customers and team activity stay private; a support session is how you look inside.
 */
export default async function AdminWorkspace({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ error?: string; support?: string }> }) {
  const { id } = await params;
  const { error, support } = await searchParams;
  const w = await db.workspace.findUnique({
    where: { id },
    include: {
      members: { include: { user: { select: { name: true, email: true } } }, orderBy: { createdAt: 'asc' } },
      sites: { orderBy: { createdAt: 'asc' } },
      _count: { select: { packages: true } },
    },
  });
  if (!w) notFound();
  const tz = w.timezone;
  const logs = await db.auditLog.findMany({ where: { workspaceId: id, action: { startsWith: 'platform.' } }, orderBy: { createdAt: 'desc' }, take: 12 });
  const owner = w.members.find((m) => m.role === 'owner');
  const realSites = w.sites.filter((s) => s.kind !== 'simulated');
  const online = realSites.filter((s) => s.lastSeenAt && Date.now() - s.lastSeenAt.getTime() < ONLINE).length;
  const lastSeen = realSites.map((s) => s.lastSeenAt).filter(Boolean).sort((a, b) => b!.getTime() - a!.getTime())[0] ?? null;
  const checks = [
    { ok: realSites.length > 0, label: realSites.length ? `${realSites.length} router${realSites.length > 1 ? 's' : ''} set up` : 'No router set up yet' },
    { ok: realSites.length > 0 && online === realSites.length, label: realSites.length ? `${online} of ${realSites.length} routers online` : 'Nothing checking in' },
    { ok: w._count.packages > 0, label: `${w._count.packages} package${w._count.packages === 1 ? '' : 's'}` },
    { ok: w.paymentProvider !== 'none' && w.paymentProvider !== 'test', label: w.paymentProvider === 'none' ? 'Vouchers only (no mobile money)' : w.paymentProvider === 'test' ? 'Mobile money still in test mode' : `Mobile money connected (${w.paymentProvider})` },
    { ok: w.members.length > 1, label: `${w.members.length} team member${w.members.length === 1 ? '' : 's'}` },
  ];
  const plan = PLANS[w.plan as keyof typeof PLANS];

  return (
    <>
      <Link href="/admin/businesses" className="muted small row" style={{ gap: 6, marginBottom: 12 }}><ArrowLeft size={14} /> All businesses</Link>
      <div className="page-head">
        <div>
          <div className="row"><h1>{w.name}</h1>{w.suspendedAt && <span className="badge bad">Suspended</span>}{w.isDemo && <span className="badge">Demo</span>}<span className={`badge ${w.plan === 'pro' ? 'accent' : ''}`}>{plan?.name ?? w.plan}</span></div>
          <p>Owner {owner?.user.name ?? '—'} · {owner?.user.email ?? ''} · joined {dateTime(w.createdAt, tz)}</p>
        </div>
      </div>
      <p className="privacy-note"><Lock size={14} /> You see the account, subscription and setup. Sales, customers and the team&apos;s own activity belong to {w.name}. To look inside, start a support session.</p>
      {w.suspendedAt && <p className="notice warn" style={{ marginBottom: 16 }}>Suspended {dateTime(w.suspendedAt, tz)}: {w.suspendReason}. Their dashboard and Wi-Fi page are blocked; customers already online keep their time.</p>}

      <section className="card support-card" style={{ marginBottom: 16 }}>
        <div className="card-pad support-card-body">
          <span className="invite-icon"><LifeBuoy size={18} /></span>
          <div className="stack" style={{ gap: 2 }}>
            <strong>Troubleshoot with a support session</strong>
            <span className="muted small">Opens {w.name}&apos;s dashboard as read-only platform support, for a limited time. Nothing can be changed, and the session (with your reason) appears in their activity log.</span>
          </div>
          <form action={startSupport} className="support-form">
            <input type="hidden" name="id" value={w.id} />
            <input name="reason" placeholder="Reason, e.g. router not checking in (ticket #142)" required minLength={5} maxLength={200} />
            <select name="minutes" defaultValue="30" style={{ width: 'auto' }}><option value="30">30 min</option><option value="60">60 min</option></select>
            <button className="btn btn-sm">Start support session</button>
          </form>
          {support === 'reason' && <p className="error" style={{ gridColumn: '1 / -1' }}>Add a short reason (at least 5 characters).</p>}
        </div>
      </section>

      <div className="grid grid-4" style={{ marginBottom: 16 }}>
        <div className="card card-pad kpi"><small>Subscription</small><strong>{w.plan === 'pro' && !w.suspendedAt ? money(PLANS.pro.price) : money(0)}</strong><span className="muted small">{plan?.name} · per month</span></div>
        <div className="card card-pad kpi"><small>Routers online</small><strong>{online} <span className="muted" style={{ fontSize: 18 }}>/ {realSites.length}</span></strong><span className="muted small">{lastSeen ? `last check-in ${ago(lastSeen)}` : 'never checked in'}</span></div>
        <div className="card card-pad kpi"><small>Team</small><strong>{w.members.length}</strong><span className="muted small">accounts with access</span></div>
        <div className="card card-pad kpi"><small>Customer for</small><strong>{Math.max(1, Math.round((Date.now() - w.createdAt.getTime()) / 86_400_000))} days</strong><span className="muted small">since {dateTime(w.createdAt, tz).split(',')[0]}</span></div>
      </div>

      <div className="grid grid-2" style={{ marginBottom: 16, alignItems: 'start' }}>
        <section className="card">
          <div className="card-head"><h2>Setup health</h2></div>
          <div className="card-pad stack" style={{ gap: 9 }}>
            {checks.map((c) => <div key={c.label} className="row" style={{ gap: 9 }}><span className={`badge ${c.ok ? 'ok' : 'warn'}`}>{c.ok ? '✓' : '!'}</span><span className="small">{c.label}</span></div>)}
          </div>
        </section>
        <section className="card">
          <div className="card-head"><h2>Routers</h2></div>
          {w.sites.length === 0 ? <p className="empty">No routers yet.</p> : (
            <table><tbody>{w.sites.map((s) => (
              <tr key={s.id}><td><strong>{s.name}</strong><div className="muted small">{s.kind} · {s.kind === 'simulated' ? 'virtual' : `seen ${ago(s.lastSeenAt)}`}{s.routerVersion ? ` · ${s.routerVersion}` : ''}</div></td><td style={{ textAlign: 'right' }}><StatusBadge lastSeen={s.lastSeenAt} kind={s.kind} /></td></tr>
            ))}</tbody></table>
          )}
        </section>
      </div>

      <div className="grid grid-2" style={{ marginBottom: 16, alignItems: 'start' }}>
        <section className="card">
          <div className="card-head"><h2>Team accounts</h2><span className="muted small">{w.members.length}</span></div>
          <table><tbody>{w.members.map((m) => (
            <tr key={m.id}><td><strong>{m.user.name}</strong><div className="muted small">{m.user.email}</div></td><td style={{ textAlign: 'right' }}><span className="badge">{ROLE_INFO[m.role as Role]?.label ?? m.role}</span></td></tr>
          ))}</tbody></table>
        </section>
        <section className="card">
          <div className="card-head"><h2>Console actions</h2><span className="muted small">the team&apos;s own activity stays private</span></div>
          {logs.length === 0 ? <p className="empty">No console actions on this business yet.</p> : (
            <table><tbody>{logs.map((l) => (
              <tr key={l.id}><td><strong>{AUDIT_LABELS[l.action] ?? l.action}</strong><div className="muted small">{l.detail.replace('[Platform] ', '')}</div></td><td className="muted small" style={{ textAlign: 'right' }}>{ago(l.createdAt)}</td></tr>
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
            <p className="muted small">Deletes the business with its routers, packages, codes, payment records and team links. It can&apos;t be undone. The owner&apos;s sign-in stays.</p>
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
