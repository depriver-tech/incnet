import Link from 'next/link';
import { LogOut } from 'lucide-react';
import { SideNav } from '@/components/SideNav';
import { logout } from '@/lib/actions';
import { requireWorkspace } from '@/lib/auth';
import { IS_CLOUD, PLANS } from '@/lib/config';

const FONTS = 'https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600;9..40,700&family=Syne+Mono&display=swap';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, workspace } = await requireWorkspace();
  return (
    <div className="shell">
      <link rel="stylesheet" href={FONTS} />
      <aside className="side">
        <Link href="/dashboard" className="logo display accent"><img src="/logo.svg" alt="" /> incnet</Link>
        <SideNav admin={user.isAdmin && IS_CLOUD} />
        <div className="foot">
          <div style={{ fontWeight: 600 }}>{workspace.name}</div>
          <div className="muted small" style={{ wordBreak: 'break-all' }}>{workspace.isDemo ? 'Demo account · resets daily' : user.email}</div>
          {IS_CLOUD && <div className="small" style={{ marginTop: 6 }}><span className="badge accent">{PLANS[workspace.plan as keyof typeof PLANS]?.name ?? 'Starter'} plan</span></div>}
          <form action={logout} style={{ marginTop: 10 }}>
            <button className="btn btn-ghost btn-sm" type="submit"><LogOut size={14} /> Sign out</button>
          </form>
        </div>
      </aside>
      <main className="main">{children}</main>
    </div>
  );
}
