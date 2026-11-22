import Link from 'next/link';
import { redirect } from 'next/navigation';
import { FlaskConical } from 'lucide-react';
import { AuthCard } from '@/components/auth/AuthCard';
import { AuthShell } from '@/components/auth/AuthShell';
import { currentUser } from '@/lib/auth';
import { login } from '@/lib/actions';
import { IS_CLOUD } from '@/lib/config';
import { startDemo } from '@/lib/demo';
import { getT } from '@/lib/lang';

export const metadata = { title: 'Sign in' };

export default async function Login() {
  if (await currentUser()) redirect('/dashboard');
  const t = await getT();
  return (
    <AuthShell
      title={t('auth.welcome')}
      subtitle={t('auth.welcomeSub')}
      footer={<>{t('auth.noAccount')} <Link href="/signup">{t('auth.create')}</Link></>}
    >
      <AuthCard
        action={login}
        submit={t('auth.signin')}
        fields={[
          { name: 'email', label: t('auth.email'), type: 'email', autoComplete: 'email', placeholder: 'you@business.com', icon: 'mail' },
          { name: 'password', label: t('auth.password'), type: 'password', autoComplete: 'current-password', placeholder: '••••••••', icon: 'lock' },
        ]}
      >
        {IS_CLOUD && (
          <>
            <div className="auth-divider"><span>{t('auth.or')}</span></div>
            <form action={startDemo}>
              <button className="auth-alt" type="submit"><FlaskConical size={16} /> {t('auth.demo')}</button>
            </form>
          </>
        )}
      </AuthCard>
    </AuthShell>
  );
}
