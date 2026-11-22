import Link from 'next/link';
import { Plus } from 'lucide-react';
import { AutoRefresh, StatusBadge } from '@/components/RouterStatus';
import { requireWorkspace } from '@/lib/auth';
import { db } from '@/lib/db';
import { ago } from '@/lib/format';

export const metadata = { title: 'Routers' };

export default async function Sites() {
  const { workspace } = await requireWorkspace();
  const sites = await db.site.findMany({ where: { workspaceId: workspace.id }, orderBy: { createdAt: 'asc' } });
  return (
    <>
      <AutoRefresh seconds={10} />
      <div className="page-head">
        <div><h1>Routers</h1><p>Each venue has one MikroTik router. incnet keeps it up to date by itself.</p></div>
        <Link className="btn" href="/dashboard/sites/new"><Plus size={16} /> Add router</Link>
      </div>
      <section className="card">
        {sites.length === 0 ? (
          <div className="empty">
            <p style={{ marginBottom: 14 }}>Add your first router to start selling Wi-Fi.</p>
            <Link className="btn" href="/dashboard/sites/new">Add router</Link>
          </div>
        ) : (
          <div className="table-wrap"><table>
            <thead><tr><th>Venue</th><th>Status</th><th>Last check-in</th><th>RouterOS</th><th>Hotspot ports</th></tr></thead>
            <tbody>
              {sites.map((s) => (
                <tr key={s.id}>
                  <td><Link href={`/dashboard/sites/${s.id}`}><strong>{s.name}</strong></Link></td>
                  <td><StatusBadge lastSeen={s.lastSeenAt} /></td>
                  <td className="muted">{ago(s.lastSeenAt)}</td>
                  <td className="muted">{s.routerVersion ?? '—'}</td>
                  <td className="mono small">{s.ports}</td>
                </tr>
              ))}
            </tbody>
          </table></div>
        )}
      </section>
    </>
  );
}
