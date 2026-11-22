import { ShieldAlert } from 'lucide-react';
import { AuthShell } from '@/components/auth/AuthShell';
import { logout } from '@/lib/actions';
import { currentUser } from '@/lib/auth';
import { db } from '@/lib/db';

export const metadata = { title: 'Account suspended', robots: { index: false } };

export default async function Suspended() {
  const user = await currentUser();
  const ws = user ? await db.member.findFirst({ where: { userId: user.id, workspace: { suspendedAt: { not: null } } }, include: { workspace: true } }) : null;
  return (
    <AuthShell title="This business is suspended" subtitle={ws?.workspace.name ?? ''} footer={<>Questions? Contact support.</>}>
      <div className="auth-card" style={{ display: 'grid', gap: 14 }}>
        <div className="invite-card" style={{ marginBottom: 0 }}>
          <span className="invite-icon" style={{ background: 'var(--bad)' }}><ShieldAlert size={18} /></span>
          <div><strong>Access is paused</strong><span>{ws?.workspace.suspendReason ?? 'The platform has paused this account.'} New Wi-Fi sales are off; customers already online keep their time.</span></div>
        </div>
        <form action={logout}><button className="auth-alt" type="submit">Sign out</button></form>
      </div>
    </AuthShell>
  );
}
