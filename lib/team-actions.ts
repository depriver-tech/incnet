'use server';

import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import type { FormState } from './actions';
import { audit } from './audit';
import { WORKSPACE_COOKIE, currentUser, requireAction, requireWorkspace } from './auth';
import { APP_URL } from './config';
import { newToken, sha256 } from './crypto';
import { db } from './db';
import { PermissionError, ROLE_INFO, assignableRoles, type Role } from './permissions';

const INVITE_DAYS = 7;
const field = (fd: FormData, name: string) => String(fd.get(name) ?? '').trim();

async function teamCtx() {
  try {
    return await requireAction('team.manage');
  } catch (err) {
    if (err instanceof PermissionError) return { error: err.message } as const;
    throw err;
  }
}

/** Creates an invite link. The link is shown once; only its hash is stored. */
export async function createInvite(_: FormState, fd: FormData): Promise<FormState & { link?: string }> {
  const ctx = await teamCtx();
  if ('error' in ctx) return ctx;
  const role = field(fd, 'role') as Role;
  if (!assignableRoles(ctx.role).includes(role)) return { error: 'You cannot invite someone with that role.' };
  const label = field(fd, 'label').slice(0, 60) || null;
  const token = newToken('inv_');
  await db.invite.create({ data: { workspaceId: ctx.workspace.id, role, label, tokenHash: sha256(token), createdById: ctx.user.id, expiresAt: new Date(Date.now() + INVITE_DAYS * 86_400_000) } });
  await audit(ctx, 'team.invite', `${label ?? 'Someone'} as ${ROLE_INFO[role].label}`);
  revalidatePath('/dashboard/team');
  return { ok: `Invite created. Send this link to ${label ?? 'them'}; it works once and expires in ${INVITE_DAYS} days.`, link: `${APP_URL}/invite/${token}` };
}

export async function revokeInvite(fd: FormData) {
  const ctx = await requireAction('team.manage');
  const invite = await db.invite.findFirst({ where: { id: field(fd, 'id'), workspaceId: ctx.workspace.id, acceptedAt: null } });
  if (!invite) return;
  await db.invite.delete({ where: { id: invite.id } });
  await audit(ctx, 'team.invite.revoke', invite.label ?? invite.role);
  revalidatePath('/dashboard/team');
}

export async function changeRole(fd: FormData) {
  const ctx = await requireAction('team.manage');
  const member = await db.member.findFirst({ where: { id: field(fd, 'id'), workspaceId: ctx.workspace.id }, include: { user: true } });
  const role = field(fd, 'role') as Role;
  // Nobody changes the owner here, nobody changes themselves, and nobody grants more than they may.
  if (!member || member.role === 'owner' || member.userId === ctx.user.id || !assignableRoles(ctx.role).includes(role)) return;
  if (ctx.role === 'admin' && member.role === 'admin') return;
  await db.member.update({ where: { id: member.id }, data: { role } });
  await audit(ctx, 'team.role', `${member.user.name}: ${ROLE_INFO[member.role as Role]?.label ?? member.role} → ${ROLE_INFO[role].label}`);
  revalidatePath('/dashboard/team');
}

export async function removeMember(fd: FormData) {
  const ctx = await requireAction('team.manage');
  const member = await db.member.findFirst({ where: { id: field(fd, 'id'), workspaceId: ctx.workspace.id }, include: { user: true } });
  if (!member || member.role === 'owner' || member.userId === ctx.user.id) return;
  if (ctx.role === 'admin' && member.role === 'admin') return;
  await db.member.delete({ where: { id: member.id } });
  await audit(ctx, 'team.remove', member.user.name);
  revalidatePath('/dashboard/team');
}

export async function leaveWorkspace() {
  const ctx = await requireWorkspace();
  if (ctx.role === 'owner') return;
  await db.member.deleteMany({ where: { userId: ctx.user.id, workspaceId: ctx.workspace.id } });
  await audit(ctx, 'team.leave', ctx.user.name);
  (await cookies()).delete(WORKSPACE_COOKIE);
  redirect('/dashboard');
}

export async function switchWorkspace(fd: FormData) {
  const user = await currentUser();
  if (!user) redirect('/login');
  const id = field(fd, 'workspaceId');
  if (await db.member.findFirst({ where: { userId: user.id, workspaceId: id } })) {
    (await cookies()).set(WORKSPACE_COOKIE, id, { httpOnly: true, sameSite: 'lax', path: '/', maxAge: 60 * 60 * 24 * 365 });
  }
  redirect('/dashboard');
}

/** Looks up a live invite by its link token. */
export async function inviteFromToken(token: string) {
  if (!/^inv_[A-Za-z0-9_-]{20,}$/.test(token)) return null;
  const invite = await db.invite.findUnique({ where: { tokenHash: sha256(token) }, include: { workspace: { select: { id: true, name: true } } } });
  if (!invite || invite.acceptedAt || invite.expiresAt < new Date()) return null;
  return invite;
}

/** Adds a user to the invite's workspace and uses the invite up. Shared by "Join" and sign-up. */
export async function claimInvite(token: string, userId: string) {
  const invite = await inviteFromToken(token);
  if (!invite) return null;
  const claimed = await db.invite.updateMany({ where: { id: invite.id, acceptedAt: null }, data: { acceptedAt: new Date() } });
  if (claimed.count !== 1) return null;
  const existing = await db.member.findFirst({ where: { userId, workspaceId: invite.workspaceId } });
  if (!existing) await db.member.create({ data: { userId, workspaceId: invite.workspaceId, role: invite.role } });
  const user = await db.user.findUniqueOrThrow({ where: { id: userId }, select: { id: true, name: true } });
  await audit({ workspace: { id: invite.workspaceId }, user }, 'team.join', `${user.name} as ${ROLE_INFO[invite.role as Role]?.label ?? invite.role}`);
  (await cookies()).set(WORKSPACE_COOKIE, invite.workspaceId, { httpOnly: true, sameSite: 'lax', path: '/', maxAge: 60 * 60 * 24 * 365 });
  return invite;
}

export async function joinWithInvite(fd: FormData) {
  const user = await currentUser();
  if (!user) redirect('/login');
  const invite = await claimInvite(field(fd, 'token'), user.id);
  redirect(invite ? '/dashboard?joined=1' : '/dashboard');
}
