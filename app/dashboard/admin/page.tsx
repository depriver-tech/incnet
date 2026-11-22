import { notFound } from 'next/navigation';
import { requireWorkspace } from '@/lib/auth';
import { db } from '@/lib/db';
import { ago, dateTime, money } from '@/lib/format';

export const metadata = { title: 'Platform' };

/** For the operator of a hosted incnet: every workspace on the server. */
export default async function Admin() {
  const { user } = await requireWorkspace();
  if (!user.isAdmin) notFound();
  const workspaces = await db.workspace.findMany({
    orderBy: { createdAt: 'desc' },
    take: 200,
    include: { members: { where: { role: 'owner' }, include: { user: { select: { email: true } } }, take: 1 }, sites: { select: { lastSeenAt: true } }, _count: { select: { accesses: true } } },
  });
  const paid = await db.payment.groupBy({ by: ['workspaceId'], where: { status: 'completed' }, _sum: { amount: true } });
  const volume = new Map(paid.map((p) => [p.workspaceId, p._sum.amount ?? 0]));
  return (
    <>
      <div className="page-head"><div><h1>Platform</h1><p>{workspaces.length} workspaces on this server.</p></div></div>
      <section className="card"><div className="table-wrap"><table>
        <thead><tr><th>Workspace</th><th>Owner</th><th>Plan</th><th>Routers</th><th>Codes</th><th>Mobile money</th><th>Joined</th></tr></thead>
        <tbody>
          {workspaces.map((w) => {
            const last = w.sites.map((s) => s.lastSeenAt).filter(Boolean).sort((a, b) => b!.getTime() - a!.getTime())[0];
            return (
              <tr key={w.id}>
                <td><strong>{w.name}</strong></td>
                <td className="muted">{w.members[0]?.user.email ?? '—'}</td>
                <td><span className="badge">{w.plan}</span></td>
                <td>{w.sites.length} <span className="muted small">· seen {ago(last)}</span></td>
                <td>{w._count.accesses}</td>
                <td>{money(volume.get(w.id) ?? 0)}</td>
                <td className="muted small">{dateTime(w.createdAt)}</td>
              </tr>
            );
          })}
        </tbody>
      </table></div></section>
    </>
  );
}
