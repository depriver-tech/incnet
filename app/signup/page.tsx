import Link from 'next/link';
import { redirect } from 'next/navigation';
import { AuthForm } from '../login/AuthForm';
import { currentUser } from '@/lib/auth';
import { signup } from '@/lib/actions';
import { ALLOW_SIGNUP } from '@/lib/config';
import { db } from '@/lib/db';

export const metadata = { title: 'Create account' };

export default async function Signup() {
  if (await currentUser()) redirect('/dashboard');
  const firstUser = (await db.user.count()) === 0;
  const open = firstUser || ALLOW_SIGNUP;
  return (
    <div className="auth">
      <div className="box">
        <Link href="/" className="brand display accent"><img src="/logo.svg" alt="" /> incnet</Link>
        <div className="card card-pad">
          <h1 style={{ fontSize: 22, marginBottom: 4 }}>{firstUser ? 'Set up this incnet server' : 'Create your account'}</h1>
          <p className="muted small" style={{ marginBottom: 18 }}>{firstUser ? 'The first account becomes the server owner.' : 'Start selling Wi-Fi in a few minutes.'}</p>
          {open ? (
            <AuthForm
              action={signup}
              submit="Create account"
              fields={[
                { name: 'name', label: 'Your name', autoComplete: 'name' },
                { name: 'business', label: 'Business name', placeholder: 'Mlimani Café' },
                { name: 'email', label: 'Email', type: 'email', autoComplete: 'email' },
                { name: 'password', label: 'Password (8+ characters)', type: 'password', autoComplete: 'new-password' },
              ]}
            />
          ) : <p className="notice">Sign-up is closed on this server. Ask the owner for an account.</p>}
        </div>
        <p className="muted small" style={{ textAlign: 'center', marginTop: 16 }}>Have an account? <Link className="accent" href="/login">Sign in</Link></p>
      </div>
    </div>
  );
}
