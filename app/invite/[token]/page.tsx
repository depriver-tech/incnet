import Link from 'next/link';
import { Users } from 'lucide-react';
import { AuthCard } from '@/components/auth/AuthCard';
import { AuthShell } from '@/components/auth/AuthShell';
import { currentUser } from '@/lib/auth';
import { login, signup } from '@/lib/actions';
import { ROLE_INFO, type Role } from '@/lib/permissions';
import { inviteFromToken, joinWithInvite } from '@/lib/team-actions';

export const metadata = { title: 'Join a team', robots: { index: false } };

/** Where an invite link lands: join with the current account, sign in, or create one. */
export default async function InvitePage({ params, searchParams }: { params: Promise<{ token: string }>; searchParams: Promise<{ have?: string }> }) {
  const { token } = await params;
  const { have } = await searchParams;
  const invite = await inviteFromToken(token);
  const user = await currentUser();
  const role = invite ? ROLE_INFO[invite.role as Role] : null;

  if (!invite || !role) {
    return (
      <AuthShell title="This invite has expired" subtitle="Invite links work once and last 7 days." footer={<Link href="/login">Go to sign in</Link>}>
        <div className="auth-card"><p className="muted">Ask the person who invited you for a new link.</p></div>
      </AuthShell>
    );
  }

  const intro = (
    <div className="invite-card">
      <span className="invite-icon"><Users size={18} /></span>
      <div><strong>{invite.workspace.name}</strong><span>You&apos;re invited as <b>{role.label}</b>. {role.summary}</span></div>
    </div>
  );

  if (user) {
    return (
      <AuthShell title="Join the team" subtitle={`Signed in as ${user.email}`} footer={<Link href="/dashboard">Not now</Link>}>
        <div className="auth-card">
          {intro}
          <form action={joinWithInvite}><input type="hidden" name="token" value={token} /><button className="auth-submit" style={{ width: '100%' }}>Join {invite.workspace.name}</button></form>
        </div>
      </AuthShell>
    );
  }

  return have ? (
    <AuthShell title="Sign in to join" subtitle={invite.workspace.name} footer={<>New to incnet? <Link href={`/invite/${token}`}>Create an account</Link></>}>
      {intro}
      <AuthCard action={login} submit="Sign in and join" hidden={{ invite: token }} fields={[
        { name: 'email', label: 'Email', type: 'email', autoComplete: 'email', placeholder: 'you@business.com', icon: 'mail' },
        { name: 'password', label: 'Password', type: 'password', autoComplete: 'current-password', placeholder: '••••••••', icon: 'lock' },
      ]} />
    </AuthShell>
  ) : (
    <AuthShell title="Join the team" subtitle="Create your account to get started" footer={<>Already have an account? <Link href={`/invite/${token}?have=1`}>Sign in</Link></>}>
      {intro}
      <AuthCard action={signup} submit="Create account and join" hidden={{ invite: token, business: '' }} fields={[
        { name: 'name', label: 'Your name', autoComplete: 'name', placeholder: 'Asha Mwakyusa', icon: 'user' },
        { name: 'email', label: 'Email', type: 'email', autoComplete: 'email', placeholder: 'you@business.com', icon: 'mail' },
        { name: 'password', label: 'Password', type: 'password', autoComplete: 'new-password', placeholder: 'At least 8 characters', icon: 'lock' },
      ]} />
    </AuthShell>
  );
}
