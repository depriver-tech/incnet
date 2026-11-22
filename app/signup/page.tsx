import Link from 'next/link';
import { redirect } from 'next/navigation';
import { AuthCard } from '@/components/auth/AuthCard';
import { AuthShell } from '@/components/auth/AuthShell';
import { currentUser } from '@/lib/auth';
import { signup } from '@/lib/actions';
import { ALLOW_SIGNUP } from '@/lib/config';
import { db } from '@/lib/db';
import { getT } from '@/lib/lang';

export const metadata = { title: 'Create account' };

export default async function Signup() {
  if (await currentUser()) redirect('/dashboard');
  const t = await getT();
  const firstUser = (await db.user.count({ where: { NOT: { email: { endsWith: '@demo.incnet.local' } } } })) === 0;
  const open = firstUser || ALLOW_SIGNUP;
  return (
    <AuthShell
      title={firstUser ? t('auth.firstTitle') : t('auth.createTitle')}
      subtitle={firstUser ? t('auth.firstSub') : t('auth.createSub')}
      footer={<>{t('auth.have')} <Link href="/login">{t('auth.signin')}</Link></>}
    >
      {open ? (
        <AuthCard
          action={signup}
          submit={t('auth.createBtn')}
          fields={[
            { name: 'name', label: t('auth.name'), autoComplete: 'name', placeholder: 'Asha Mwakyusa', icon: 'user' },
            { name: 'business', label: t('auth.business'), placeholder: 'Mlimani Café', icon: 'building' },
            { name: 'email', label: t('auth.email'), type: 'email', autoComplete: 'email', placeholder: 'you@business.com', icon: 'mail' },
            { name: 'password', label: t('auth.password'), type: 'password', autoComplete: 'new-password', placeholder: 'At least 8 characters', icon: 'lock' },
          ]}
        />
      ) : (
        <div className="auth-card"><p className="notice">Sign-up is closed on this server. Ask the owner for an account.</p></div>
      )}
    </AuthShell>
  );
}
