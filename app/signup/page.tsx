import Link from 'next/link';
import { redirect } from 'next/navigation';
import { AuthCard } from '@/components/auth/AuthCard';
import { AuthShell } from '@/components/auth/AuthShell';
import { currentUser } from '@/lib/auth';
import { signup } from '@/lib/actions';
import { ALLOW_SIGNUP } from '@/lib/config';
import { db } from '@/lib/db';

export const metadata = { title: 'Create account' };

export default async function Signup() {
  if (await currentUser()) redirect('/dashboard');
  const firstUser = (await db.user.count({ where: { NOT: { email: { endsWith: '@demo.incnet.local' } } } })) === 0;
  const open = firstUser || ALLOW_SIGNUP;
  return (
    <AuthShell
      title={firstUser ? 'Set up this incnet server' : 'Create your account'}
      subtitle={firstUser ? 'The first account becomes the server owner' : 'Start selling Wi-Fi in a few minutes. Free to start.'}
      footer={<>Have an account? <Link href="/login">Sign in</Link></>}
    >
      {open ? (
        <AuthCard
          action={signup}
          submit="Create account"
          fields={[
            { name: 'name', label: 'Your name', autoComplete: 'name', placeholder: 'Asha Mwakyusa', icon: 'user' },
            { name: 'business', label: 'Business name', placeholder: 'Mlimani Café', icon: 'building' },
            { name: 'email', label: 'Email', type: 'email', autoComplete: 'email', placeholder: 'you@business.com', icon: 'mail' },
            { name: 'password', label: 'Password', type: 'password', autoComplete: 'new-password', placeholder: 'At least 8 characters', icon: 'lock' },
          ]}
        />
      ) : (
        <div className="auth-card"><p className="notice">Sign-up is closed on this server. Ask the owner for an account.</p></div>
      )}
    </AuthShell>
  );
}
