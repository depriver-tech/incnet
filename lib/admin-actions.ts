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
  revalidatePath('/dashboard/admin', 'layout');
}

export async function suspendWorkspace(fd: FormData) {
  const admin = await requirePlatformAdmin();
  const id = field(fd, 'id');
  const reason = field(fd, 'reason').slice(0, 200) || 'Suspended by the platform';
  const ws = await db.workspace.update({ where: { id }, data: { suspendedAt: new Date(), suspendReason: reason } });
  await log(ws.id, admin.id, 'platform.suspend', reason);
  revalidatePath('/dashboard/admin', 'layout');
}

export async function resumeWorkspace(fd: FormData) {
  const admin = await requirePlatformAdmin();
  const ws = await db.workspace.update({ where: { id: field(fd, 'id') }, data: { suspendedAt: null, suspendReason: null } });
  await log(ws.id, admin.id, 'platform.resume', 'Suspension lifted');
  revalidatePath('/dashboard/admin', 'layout');
}

/** Deletes a business and all its data. The admin must type its exact name. */
export async function deleteWorkspace(fd: FormData) {
  await requirePlatformAdmin();
  const ws = await db.workspace.findUnique({ where: { id: field(fd, 'id') } });
  if (!ws || field(fd, 'confirm') !== ws.name) redirect(`/dashboard/admin/workspaces/${field(fd, 'id')}?error=confirm`);
  await db.workspace.delete({ where: { id: ws.id } });
  redirect('/dashboard/admin/workspaces?deleted=1');
}

export async function setUserAdmin(fd: FormData) {
  const admin = await requirePlatformAdmin();
  const id = field(fd, 'id');
  if (id === admin.id) return; // nobody removes their own access by accident
  await db.user.update({ where: { id }, data: { isAdmin: field(fd, 'value') === 'true' } });
  revalidatePath('/dashboard/admin', 'layout');
}

/** Removes demo workspaces older than a day, and their throwaway accounts. */
export async function purgeDemos() {
  await requirePlatformAdmin();
  const old = new Date(Date.now() - 24 * 3600_000);
  await db.workspace.deleteMany({ where: { isDemo: true, createdAt: { lt: old } } });
  await db.user.deleteMany({ where: { email: { endsWith: '@demo.incnet.local' }, createdAt: { lt: old } } });
  revalidatePath('/dashboard/admin', 'layout');
}
