import Link from 'next/link';
import { ArrowLeft, LogOut, ShieldCheck } from 'lucide-react';
import { AdminNav } from '@/components/admin/AdminNav';
import { Fonts } from '@/components/Fonts';
import { requirePlatformAdmin } from '@/lib/admin';
import { logout } from '@/lib/actions';
import { APP_URL, IS_CLOUD } from '@/lib/config';
import { db } from '@/lib/db';

export const metadata = { title: { default: 'Console', template: '%s · incnet Console' }, robots: { index: false } };

/** The super admin console: its own shell, separate from any business dashboard. */
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const admin = await requirePlatformAdmin();
  const hasBusiness = (await db.member.count({ where: { userId: admin.id } })) > 0;
  const host = new URL(APP_URL).host;
  return (
    <div className="cx">
      <Fonts />
      <aside className="cx-side">
        <Link href="/admin" className="cx-brand"><img src="/logo.svg" alt="" /><span>incnet<em>Console</em></span></Link>
        <span className="cx-role"><ShieldCheck size={13} /> Super admin</span>
        <AdminNav />
        <div className="cx-foot">
          {hasBusiness && <Link href="/dashboard" className="cx-back"><ArrowLeft size={15} /> Back to my business</Link>}
          <div className="cx-user"><span className="cx-avatar">{admin.name.slice(0, 1).toUpperCase()}</span><div><strong>{admin.name}</strong><small>{admin.email}</small></div></div>
          <form action={logout}><button className="cx-signout" type="submit"><LogOut size={14} /> Sign out</button></form>
        </div>
      </aside>
      <div className="cx-body">
        <header className="cx-top">
          <span className="cx-env"><i className={IS_CLOUD ? 'live' : ''} /> {IS_CLOUD ? 'incnet Cloud' : 'Self-hosted'} · {host}</span>
          <span className="cx-top-note">Every business on this server</span>
        </header>
        <main className="cx-main">{children}</main>
      </div>
    </div>
  );
}
