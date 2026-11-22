import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { cache } from 'react';
import { db } from './db';
import { can, PermissionError, type Permission } from './permissions';

const COOKIE = 'incnet_session';
const MAX_AGE = 60 * 60 * 24 * 30;

function secret() {
  const value = process.env.APP_SECRET;
  if (!value || value.length < 32) throw new Error('APP_SECRET must be set to at least 32 characters.');
  return `incnet:session:${value}`;
}

export const hashPassword = (password: string) => bcrypt.hash(password, 11);
export const checkPassword = (password: string, hash: string) => bcrypt.compare(password, hash);

export async function startSession(userId: string) {
  const token = jwt.sign({ sub: userId }, secret(), { expiresIn: MAX_AGE });
  (await cookies()).set(COOKIE, token, { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production' && !process.env.APP_URL?.startsWith('http://'), path: '/', maxAge: MAX_AGE });
}

export async function endSession() {
  (await cookies()).delete(COOKIE);
}

/** The signed-in user, or null. Cached per request. */
export const currentUser = cache(async () => {
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token) return null;
  try {
    const { sub } = jwt.verify(token, secret()) as { sub: string };
    return await db.user.findUnique({ where: { id: sub }, select: { id: true, email: true, name: true, isAdmin: true } });
  } catch {
    return null;
  }
});

export const WORKSPACE_COOKIE = 'incnet_ws';

/**
 * The signed-in user, the workspace they are working in, and their role there.
 * People in several businesses switch with the menu; the choice is remembered in a cookie.
 */
export const requireWorkspace = cache(async () => {
  const user = await currentUser();
  if (!user) redirect('/login');
  const chosen = (await cookies()).get(WORKSPACE_COOKIE)?.value;
  const member =
    (chosen && (await db.member.findFirst({ where: { userId: user.id, workspaceId: chosen }, include: { workspace: true } }))) ||
    (await db.member.findFirst({ where: { userId: user.id }, include: { workspace: true }, orderBy: { createdAt: 'asc' } }));
  if (!member) redirect('/no-workspace');
  return { user, workspace: member.workspace, role: member.role };
});

/** For pages: the workspace context, or the "no access" page when the role does not allow it. */
export async function requirePage(perm: Permission) {
  const ctx = await requireWorkspace();
  if (!can(ctx.role, perm)) redirect('/dashboard/no-access');
  return ctx;
}

/** For actions: the workspace context, or a PermissionError the form shows as a message. */
export async function requireAction(perm: Permission) {
  const ctx = await requireWorkspace();
  if (!can(ctx.role, perm)) throw new PermissionError();
  return ctx;
}
