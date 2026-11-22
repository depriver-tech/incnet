'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

const ONLINE_MS = 45_000;

export function isOnline(lastSeen: string | Date | null) {
  return !!lastSeen && Date.now() - new Date(lastSeen).getTime() < ONLINE_MS;
}

export function StatusBadge({ lastSeen }: { lastSeen: string | Date | null }) {
  if (!lastSeen) return <span className="badge warn"><span className="dot" /> Waiting for router</span>;
  return isOnline(lastSeen) ? <span className="badge ok"><span className="dot" /> Online</span> : <span className="badge bad"><span className="dot" /> Offline</span>;
}

/** Re-renders the page every few seconds, so a router that just checked in shows as online. */
export function AutoRefresh({ seconds = 5 }: { seconds?: number }) {
  const router = useRouter();
  useEffect(() => {
    const t = setInterval(() => router.refresh(), seconds * 1000);
    return () => clearInterval(t);
  }, [router, seconds]);
  return null;
}
