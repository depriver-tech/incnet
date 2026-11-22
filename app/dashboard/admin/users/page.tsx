import Link from 'next/link';
import { requirePlatformAdmin } from '@/lib/admin';
import { setUserAdmin } from '@/lib/admin-actions';
import { db } from '@/lib/db';
import { dateTime } from '@/lib/format';
import { ROLE_INFO, type Role } from '@/lib/permissions';

export const metadata = { title: 'Users · Platform' };
const PAGE = 30;

export default async function AdminUsers({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const me = await requirePlatformAdmin();
  const q = await searchParams;
  const search = (q.q || '').trim();
  const only = q.only === 'admins' ? 'admins' : '';
  const page = Math.max(1, Number(q.page) || 1);
  const where = {
    NOT: { email: { endsWith: '@demo.incnet.local' } },
    ...(only ? { isAdmin: true } : {}),
    ...(search ? { OR: [{ email: { contains: search, mode: 'insensitive' as const } }, { name: { contains: search, mode: 'insensitive' as const } }] } : {}),
  };
  const [total, users] = await Promise.all([
    db.user.count({ where }),
    db.user.findMany({ where, orderBy: { createdAt: 'desc' }, skip: (page - 1) * PAGE, take: PAGE, include: { memberships: { include: { workspace: { select: { id: true, name: true } } } } } }),
  ]);
  const pages = Math.max(1, Math.ceil(total / PAGE));
  const link = (extra: Record<string, string>) => `/dashboard/admin/users?${new URLSearchParams({ ...Object.fromEntries(Object.entries(q).filter(([, v]) => v) as [string, string][]), ...extra })}`;
  return (
    <>
      <form className="card report-filters" method="get">
        <label>Search<input name="q" defaultValue={search} placeholder="Name or email" style={{ minWidth: 240 }} /></label>
        <label>Show<select name="only" defaultValue={only}><option value="">Everyone</option><option value="admins">Platform admins</option></select></label>
        <button className="btn btn-sm">Apply</button>
        <Link className="btn btn-ghost btn-sm" href="/dashboard/admin/users">Reset</Link>
      </form>
      <section className="card">
        <div className="card-head"><h2>{total.toLocaleString('en-US')} {total === 1 ? 'user' : 'users'}</h2><span className="muted small">Platform admins can open this console and see every business.</span></div>
        <div className="table-wrap"><table>
          <thead><tr><th>Name</th><th>Businesses</th><th>Joined</th><th>Platform access</th></tr></thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id}>
                <td><strong>{u.name}</strong>{u.id === me.id && <span className="muted small"> (you)</span>}<div className="muted small">{u.email}</div></td>
                <td className="small">{u.memberships.length === 0 ? <span className="muted">None</span> : u.memberships.map((m) => <div key={m.id}><Link className="accent" href={`/dashboard/admin/workspaces/${m.workspace.id}`}>{m.workspace.name}</Link> <span className="muted">· {ROLE_INFO[m.role as Role]?.label ?? m.role}</span></div>)}</td>
                <td className="muted small">{dateTime(u.createdAt)}</td>
                <td>
                  {u.isAdmin && <span className="badge accent" style={{ marginRight: 8 }}>Admin</span>}
                  {u.id !== me.id && (
                    <form action={setUserAdmin} style={{ display: 'inline' }}>
                      <input type="hidden" name="id" value={u.id} />
                      <input type="hidden" name="value" value={u.isAdmin ? 'false' : 'true'} />
                      <button className={`btn btn-sm ${u.isAdmin ? 'btn-danger' : 'btn-ghost'}`}>{u.isAdmin ? 'Remove admin' : 'Make admin'}</button>
                    </form>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table></div>
        {pages > 1 && (
          <div className="pager">
            {page > 1 ? <Link className="btn btn-ghost btn-sm" href={link({ page: String(page - 1) })}>Previous</Link> : <span />}
            <span className="muted small">Page {page} of {pages}</span>
            {page < pages ? <Link className="btn btn-ghost btn-sm" href={link({ page: String(page + 1) })}>Next</Link> : <span />}
          </div>
        )}
      </section>
    </>
  );
}
