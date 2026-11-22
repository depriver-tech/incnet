import Link from 'next/link';
import { redirect } from 'next/navigation';
import { FlaskConical } from 'lucide-react';
import { AuthCard } from '@/components/auth/AuthCard';
import { AuthShell } from '@/components/auth/AuthShell';
import { currentUser } from '@/lib/auth';
import { login } from '@/lib/actions';
import { IS_CLOUD } from '@/lib/config';
import { startDemo } from '@/lib/demo';

export const metadata = { title: 'Sign in' };

export default async function Login() {
  if (await currentUser()) redirect('/dashboard');
  return (
    <AuthShell
      title="Welcome back"
      subtitle="Sign in to manage your hotspots, packages and sales"
      footer={<>Don&apos;t have an account? <Link href="/signup">Create one</Link></>}
    >
      <AuthCard
        action={login}
        submit="Sign in"
        fields={[
          { name: 'email', label: 'Email', type: 'email', autoComplete: 'email', placeholder: 'you@business.com', icon: 'mail' },
          { name: 'password', label: 'Password', type: 'password', autoComplete: 'current-password', placeholder: '••••••••', icon: 'lock' },
        ]}
      >
        {IS_CLOUD && (
          <>
            <div className="auth-divider"><span>or</span></div>
            <form action={startDemo}>
              <button className="auth-alt" type="submit"><FlaskConical size={16} /> Try the live demo, no account needed</button>
            </form>
          </>
        )}
      </AuthCard>
    </AuthShell>
  );
}
