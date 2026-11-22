import { getT } from '@/lib/lang';
import { InviteForm } from './InviteForm';
import { requirePage } from '@/lib/auth';
import { AUDIT_LABELS } from '@/lib/audit';
import { db } from '@/lib/db';
import { ago, dateTime } from '@/lib/format';
import { ROLE_INFO, ROLES, assignableRoles, can, type Role } from '@/lib/permissions';
import { changeRole, leaveWorkspace, removeMember, revokeInvite } from '@/lib/team-actions';

export const metadata = { title: 'Team' };

const AREAS: Record<string, string> = { router: 'Routers', package: 'Packages', vouchers: 'Vouchers', access: 'Codes', settings: 'Settings', design: 'Design', team: 'Team' };

export default async function Team({ searchParams }: { searchParams: Promise<{ who?: string; area?: string; days?: string }> }) {
  const ctx = await requirePage('team.view');
  const t = await getT();
  const { workspace, user, role } = ctx;
  const q = await searchParams;
  const manage = can(role, 'team.manage');
  const days = [1, 7, 30, 90].includes(Number(q.days)) ? Number(q.days) : 30;

  const [members, invites, logs] = await Promise.all([
    db.member.findMany({ where: { workspaceId: workspace.id }, include: { user: { select: { id: true, name: true, email: true } } }, orderBy: { createdAt: 'asc' } }),
    db.invite.findMany({ where: { workspaceId: workspace.id, acceptedAt: null, expiresAt: { gt: new Date() } }, orderBy: { createdAt: 'desc' } }),
    db.auditLog.findMany({
      where: {
        workspaceId: workspace.id,
        createdAt: { gte: new Date(Date.now() - days * 86_400_000) },
        ...(q.who ? { userId: q.who } : {}),
        ...(q.area && AREAS[q.area] ? { action: { startsWith: q.area } } : {}),
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
      include: { user: { select: { name: true } } },
    }),
  ]);
  const order = (r: string) => ROLES.indexOf(r as Role);
  members.sort((a, b) => order(a.role) - order(b.role));
  const grantable = assignableRoles(role);

  return (
    <>
      <div className="page-head">
        <div><h1>{t('team.title')}</h1><p>Invite staff, give each person the right role, and see who did what.</p></div>
        {role !== 'owner' && <form action={leaveWorkspace}><button className="btn btn-ghost">Leave {workspace.name}</button></form>}
      </div>

      <div className="grid" style={{ gridTemplateColumns: 'minmax(0, 1.5fr) minmax(300px, 1fr)', alignItems: 'start' }}>
        <section className="card">
          <div className="card-head"><h2>Members</h2><span className="muted small">{members.length} {members.length === 1 ? 'person' : 'people'}</span></div>
          <div className="table-wrap"><table>
            <thead><tr><th>Name</th><th>Role</th><th>Joined</th><th></th></tr></thead>
            <tbody>
              {members.map((m) => {
                const editable = manage && m.role !== 'owner' && m.userId !== user.id && !(role === 'admin' && m.role === 'admin');
                return (
                  <tr key={m.id}>
                    <td><div className="row" style={{ gap: 10, flexWrap: 'nowrap' }}><span className="avatar">{m.user.name.slice(0, 1).toUpperCase()}</span><div><strong>{m.user.name}{m.userId === user.id && <span className="muted small"> (you)</span>}</strong><div className="muted small">{m.user.email.endsWith('@demo.incnet.local') ? 'demo account' : m.user.email}</div></div></div></td>
                    <td>
                      {editable ? (
                        <form action={changeRole} className="row" style={{ gap: 6, flexWrap: 'nowrap' }}>
                          <input type="hidden" name="id" value={m.id} />
                          <select name="role" defaultValue={m.role} style={{ width: 'auto', padding: '6px 8px' }}>{grantable.map((r) => <option key={r} value={r}>{ROLE_INFO[r].label}</option>)}</select>
                          <button className="btn btn-ghost btn-sm">Save</button>
                        </form>
                      ) : <span className={`badge ${m.role === 'owner' ? 'accent' : ''}`}>{ROLE_INFO[m.role as Role]?.label ?? m.role}</span>}
                    </td>
                    <td className="muted small">{dateTime(m.createdAt)}</td>
                    <td style={{ textAlign: 'right' }}>{editable && <form action={removeMember}><input type="hidden" name="id" value={m.id} /><button className="btn btn-danger btn-sm">Remove</button></form>}</td>
                  </tr>
                );
              })}
            </tbody>
          </table></div>
          {invites.length > 0 && (
            <>
              <div className="card-head" style={{ borderTop: '1px solid var(--line)' }}><h2>Waiting to join</h2><span className="muted small">{invites.length}</span></div>
              <table><tbody>
                {invites.map((i) => (
                  <tr key={i.id}>
                    <td><strong>{i.label ?? 'Invite link'}</strong><div className="muted small">{ROLE_INFO[i.role as Role]?.label} · expires {dateTime(i.expiresAt)}</div></td>
                    <td style={{ textAlign: 'right' }}>{manage && <form action={revokeInvite}><input type="hidden" name="id" value={i.id} /><button className="btn btn-ghost btn-sm">Cancel</button></form>}</td>
                  </tr>
                ))}
              </tbody></table>
            </>
          )}
        </section>

        <div className="grid">
          {manage ? (
            <section className="card"><div className="card-head"><h2>Invite someone</h2></div><div className="card-pad"><InviteForm roles={grantable} /></div></section>
          ) : null}
          <section className="card">
            <div className="card-head"><h2>What each role can do</h2></div>
            <div className="card-pad stack" style={{ gap: 10 }}>
              {ROLES.map((r) => <div key={r}><strong>{ROLE_INFO[r].label}</strong><div className="muted small">{ROLE_INFO[r].summary}</div></div>)}
            </div>
          </section>
        </div>
      </div>

      <section className="card" style={{ marginTop: 16 }}>
        <div className="card-head">
          <h2>Activity</h2>
          <form className="filters" method="get">
            <select name="who" defaultValue={q.who ?? ''}><option value="">Everyone</option>{members.map((m) => <option key={m.userId} value={m.userId}>{m.user.name}</option>)}</select>
            <select name="area" defaultValue={q.area ?? ''}><option value="">All areas</option>{Object.entries(AREAS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select>
            <select name="days" defaultValue={String(days)}><option value="1">Today</option><option value="7">7 days</option><option value="30">30 days</option><option value="90">90 days</option></select>
            <button className="btn btn-ghost btn-sm">Apply</button>
          </form>
        </div>
        {logs.length === 0 ? <p className="empty">Nothing in this period.</p> : (
          <div className="table-wrap"><table>
            <thead><tr><th>When</th><th>Who</th><th>What</th><th>Details</th></tr></thead>
            <tbody>
              {logs.map((l) => (
                <tr key={l.id}>
                  <td className="muted small" title={dateTime(l.createdAt)}>{ago(l.createdAt)}</td>
                  <td>{l.user?.name ?? 'Removed user'}</td>
                  <td>{AUDIT_LABELS[l.action] ?? l.action}</td>
                  <td className="muted small">{l.detail}</td>
                </tr>
              ))}
            </tbody>
          </table></div>
        )}
      </section>
    </>
  );
}
