'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { requirePlatformAdmin } from './admin';
import { PLANS } from './config';
import { db } from './db';

const field = (fd: FormData, name: string) => String(fd.get(name) ?? '').trim();

/** Every console action lands in the business's own activity log, tagged as the platform. */
async function log(workspaceId: string, userId: string, action: string, detail: string) {
  await db.auditLog.create({ data: { workspaceId, userId, action, detail: `[Platform] ${detail}`.slice(0, 300) } }).catch(() => null);
}

export async function setPlan(fd: FormData) {
  const admin = await requirePlatformAdmin();
  const id = field(fd, 'id');
  const plan = field(fd, 'plan');
  if (!(plan in PLANS)) return;
  const ws = await db.workspace.update({ where: { id }, data: { plan } });
  await log(ws.id, admin.id, 'platform.plan', `Plan set to ${PLANS[plan as keyof typeof PLANS].name}`);
  revalidatePath('/admin', 'layout');
}

export async function suspendWorkspace(fd: FormData) {
  const admin = await requirePlatformAdmin();
  const id = field(fd, 'id');
  const reason = field(fd, 'reason').slice(0, 200) || 'Suspended by the platform';
  const ws = await db.workspace.update({ where: { id }, data: { suspendedAt: new Date(), suspendReason: reason } });
  await log(ws.id, admin.id, 'platform.suspend', reason);
  revalidatePath('/admin', 'layout');
}

export async function resumeWorkspace(fd: FormData) {
  const admin = await requirePlatformAdmin();
  const ws = await db.workspace.update({ where: { id: field(fd, 'id') }, data: { suspendedAt: null, suspendReason: null } });
  await log(ws.id, admin.id, 'platform.resume', 'Suspension lifted');
  revalidatePath('/admin', 'layout');
}

/** Deletes a business and all its data. The admin must type its exact name. */
export async function deleteWorkspace(fd: FormData) {
  await requirePlatformAdmin();
  const ws = await db.workspace.findUnique({ where: { id: field(fd, 'id') } });
  if (!ws || field(fd, 'confirm') !== ws.name) redirect(`/admin/businesses/${field(fd, 'id')}?error=confirm`);
  await db.workspace.delete({ where: { id: ws.id } });
  redirect('/admin/businesses?deleted=1');
}

export async function setUserAdmin(fd: FormData) {
  const admin = await requirePlatformAdmin();
  const id = field(fd, 'id');
  if (id === admin.id) return; // nobody removes their own access by accident
  await db.user.update({ where: { id }, data: { isAdmin: field(fd, 'value') === 'true' } });
  revalidatePath('/admin', 'layout');
}

/** Removes demo workspaces older than a day, and their throwaway accounts. */
export async function purgeDemos() {
  await requirePlatformAdmin();
  const old = new Date(Date.now() - 24 * 3600_000);
  await db.workspace.deleteMany({ where: { isDemo: true, createdAt: { lt: old } } });
  await db.user.deleteMany({ where: { email: { endsWith: '@demo.incnet.local' }, createdAt: { lt: old } } });
  revalidatePath('/admin', 'layout');
}

// ── Support sessions ───────────────────────────────────────────────

/** Opens a business's dashboard as read-only platform support, for troubleshooting. Logged for the business to see. */
export async function startSupport(fd: FormData) {
  const admin = await requirePlatformAdmin();
  const { SUPPORT_COOKIE, signSupport } = await import('./support');
  const { cookies } = await import('next/headers');
  const id = field(fd, 'id');
  const reason = field(fd, 'reason').slice(0, 200);
  const minutes = field(fd, 'minutes') === '60' ? 60 : 30;
  if (reason.length < 5) redirect(`/admin/businesses/${id}?support=reason`);
  const ws = await db.workspace.findUnique({ where: { id }, select: { id: true } });
  if (!ws) redirect('/admin/businesses');
  const now = Date.now();
  (await cookies()).set(SUPPORT_COOKIE, signSupport({ adminId: admin.id, workspaceId: ws.id, reason, startedAt: now, expiresAt: now + minutes * 60_000 }), {
    httpOnly: true, sameSite: 'lax', path: '/', maxAge: minutes * 60, secure: process.env.NODE_ENV === 'production' && !process.env.APP_URL?.startsWith('http://'),
  });
  await log(ws.id, admin.id, 'platform.support.start', `${admin.name} opened a read-only support session (${minutes} min): ${reason}`);
  redirect('/dashboard');
}

export async function endSupport() {
  const admin = await requirePlatformAdmin();
  const { SUPPORT_COOKIE, readSupport } = await import('./support');
  const { cookies } = await import('next/headers');
  const s = await readSupport(admin.id);
  (await cookies()).delete(SUPPORT_COOKIE);
  if (s) {
    await log(s.workspaceId, admin.id, 'platform.support.end', `${admin.name} ended the support session`);
    redirect(`/admin/businesses/${s.workspaceId}`);
  }
  redirect('/admin');
}
