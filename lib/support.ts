import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';

/**
 * Support sessions ("impersonation"): a platform admin opens a business's dashboard to troubleshoot.
 * Read-only, time-limited, tied to the admin's own sign-in, and logged in the business's activity.
 */
export const SUPPORT_COOKIE = 'incnet_support';
export type SupportSession = { adminId: string; workspaceId: string; reason: string; startedAt: number; expiresAt: number };

const secret = () => `incnet:support:${process.env.APP_SECRET}`;

export function signSupport(s: SupportSession) {
  return jwt.sign(s, secret(), { expiresIn: Math.max(60, Math.floor((s.expiresAt - Date.now()) / 1000)) });
}

/** The current support session, if any, for this admin. */
export async function readSupport(adminId: string): Promise<SupportSession | null> {
  const token = (await cookies()).get(SUPPORT_COOKIE)?.value;
  if (!token) return null;
  try {
    const s = jwt.verify(token, secret()) as SupportSession;
    return s.adminId === adminId && s.expiresAt > Date.now() ? s : null;
  } catch {
    return null;
  }
}
