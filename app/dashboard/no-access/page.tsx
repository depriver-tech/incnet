import Link from 'next/link';
import { Lock } from 'lucide-react';
import { requireWorkspace } from '@/lib/auth';
import { ROLE_INFO, type Role } from '@/lib/permissions';

export const metadata = { title: 'No access' };

export default async function NoAccess() {
  const { role } = await requireWorkspace();
  const info = ROLE_INFO[role as Role];
  return (
    <div className="card card-pad" style={{ maxWidth: 520, margin: '40px auto', textAlign: 'center', display: 'grid', gap: 12, justifyItems: 'center' }}>
      <span className="invite-icon"><Lock size={18} /></span>
      <h1 style={{ fontSize: 26 }}>This page isn&apos;t part of your role</h1>
      <p className="muted">You&apos;re a <b>{info?.label ?? role}</b>: {info?.summary} Ask an owner or admin if you need more access.</p>
      <Link className="btn" href="/dashboard">Back to overview</Link>
    </div>
  );
}
