import Link from 'next/link';
import { LogOut } from 'lucide-react';
import { Fonts } from '@/components/Fonts';
import { SideNav } from '@/components/SideNav';
import { LangSwitch } from '@/components/i18n/LangProvider';
import { logout } from '@/lib/actions';
import { requireWorkspace } from '@/lib/auth';
import { IS_CLOUD, PLANS } from '@/lib/config';
import { db } from '@/lib/db';
import { getT } from '@/lib/lang';
import { ROLE_INFO, type Role } from '@/lib/permissions';
import { switchWorkspace } from '@/lib/team-actions';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, workspace, role } = await requireWorkspace();
  const t = await getT();
  const memberships = await db.member.findMany({ where: { userId: user.id }, include: { workspace: { select: { id: true, name: true } } }, orderBy: { createdAt: 'asc' } });
  return (
    <div className="shell">
      <Fonts />
      <aside className="side">
        <Link href="/dashboard" className="logo display accent"><img src="/logo.svg" alt="" /> incnet</Link>
        <SideNav role={role} admin={user.isAdmin && IS_CLOUD} />
        <div className="foot">
          {memberships.length > 1 ? (
            <form action={switchWorkspace} className="ws-switch">
              <select name="workspaceId" defaultValue={workspace.id} aria-label={t('nav.switch')}>
                {memberships.map((m) => <option key={m.workspaceId} value={m.workspaceId}>{m.workspace.name}</option>)}
              </select>
              <button className="btn btn-ghost btn-sm">{t('nav.switch')}</button>
            </form>
          ) : <div style={{ fontWeight: 600 }}>{workspace.name}</div>}
          <div className="muted small" style={{ wordBreak: 'break-all' }}>{workspace.isDemo ? t('nav.demo') : user.email}</div>
          <div className="row small" style={{ marginTop: 6, gap: 6 }}>
            <span className="badge">{ROLE_INFO[role as Role]?.label ?? role}</span>
            {IS_CLOUD && <span className="badge accent">{PLANS[workspace.plan as keyof typeof PLANS]?.name ?? 'Starter'}</span>}
          </div>
          <div className="row" style={{ marginTop: 10, gap: 6 }}>
            <LangSwitch />
            <form action={logout}><button className="btn btn-ghost btn-sm" type="submit"><LogOut size={14} /> {t('nav.signout')}</button></form>
          </div>
        </div>
      </aside>
      <main className="main">{children}</main>
    </div>
  );
}
