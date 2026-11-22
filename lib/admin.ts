import { notFound } from 'next/navigation';
import { currentUser } from './auth';

/** Platform operators only (User.isAdmin). Everyone else gets a 404, so the console stays hidden. */
export async function requirePlatformAdmin() {
  const user = await currentUser();
  if (!user?.isAdmin) notFound();
  return user;
}

export const ONLINE_MS = 45_000;
export const isOnline = (d: Date | null) => !!d && Date.now() - d.getTime() < ONLINE_MS;
