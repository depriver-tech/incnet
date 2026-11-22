import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { cache } from 'react';
import { db } from './db';

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

/** The signed-in user and their workspace. Sends anyone else to the sign-in page. */
export const requireWorkspace = cache(async () => {
  const user = await currentUser();
  if (!user) redirect('/login');
  const member = await db.member.findFirst({ where: { userId: user.id }, include: { workspace: true }, orderBy: { createdAt: 'asc' } });
  if (!member) redirect('/signup?step=workspace');
  return { user, workspace: member.workspace, role: member.role };
});
