import Link from 'next/link';
import { redirect } from 'next/navigation';
import { AuthForm } from './AuthForm';
import { currentUser } from '@/lib/auth';
import { login } from '@/lib/actions';

export const metadata = { title: 'Sign in' };

export default async function Login() {
  if (await currentUser()) redirect('/dashboard');
  return (
    <div className="auth">
      <div className="box">
        <Link href="/" className="brand display accent"><img src="/logo.svg" alt="" /> incnet</Link>
        <div className="card card-pad">
          <h1 style={{ fontSize: 22, marginBottom: 4 }}>Sign in</h1>
          <p className="muted small" style={{ marginBottom: 18 }}>Manage your hotspots, packages and sales.</p>
          <AuthForm action={login} fields={[{ name: 'email', label: 'Email', type: 'email', autoComplete: 'email' }, { name: 'password', label: 'Password', type: 'password', autoComplete: 'current-password' }]} submit="Sign in" />
        </div>
        <p className="muted small" style={{ textAlign: 'center', marginTop: 16 }}>New here? <Link className="accent" href="/signup">Create an account</Link></p>
      </div>
    </div>
  );
}
