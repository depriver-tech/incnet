import Link from 'next/link';
import { AuthShell } from '@/components/auth/AuthShell';
import { logout } from '@/lib/actions';

export const metadata = { title: 'No business yet' };

/** Someone whose last team removed them. */
export default function NoWorkspace() {
  return (
    <AuthShell title="You're not in a business yet" subtitle="Ask an owner for an invite link, or start your own." footer={<Link href="/">incnet home</Link>}>
      <div className="auth-card" style={{ display: 'grid', gap: 10 }}>
        <form action={logout}><button className="auth-alt" type="submit">Sign out</button></form>
      </div>
    </AuthShell>
  );
}
