export const money = (amount: number, currency = 'TZS') => `${currency === 'TZS' ? 'TSh' : currency} ${amount.toLocaleString('en-US')}`;

export function duration(minutes: number) {
  if (minutes % 1440 === 0) { const d = minutes / 1440; return d === 1 ? '1 day' : `${d} days`; }
  if (minutes % 60 === 0) { const h = minutes / 60; return h === 1 ? '1 hour' : `${h} hours`; }
  return `${minutes} min`;
}

export const speed = (kbps: number) => (kbps >= 1000 ? `${+(kbps / 1000).toFixed(1)} Mbps` : `${kbps} kbps`);

export function ago(date: Date | null | undefined) {
  if (!date) return 'never';
  const s = Math.round((Date.now() - date.getTime()) / 1000);
  if (s < 60) return `${Math.max(s, 0)}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)} min ago`;
  if (s < 86400) return `${Math.floor(s / 3600)} h ago`;
  return `${Math.floor(s / 86400)} d ago`;
}

/** A real IANA time zone, or null. Hosts set odd values in TZ (Vercel uses ":UTC"), which Intl rejects. */
export function validTimeZone(tz: string | null | undefined) {
  if (!tz) return null;
  try {
    new Intl.DateTimeFormat('en', { timeZone: tz });
    return tz;
  } catch {
    return null;
  }
}

/** The fallback zone for dates: DEFAULT_TIMEZONE if valid, else East Africa Time. Never the server's own TZ. */
export const DEFAULT_TZ = validTimeZone(process.env.DEFAULT_TIMEZONE) ?? 'Africa/Dar_es_Salaam';

export const dateTime = (d: Date | null | undefined, tz?: string | null) =>
  d ? d.toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', timeZone: validTimeZone(tz) ?? DEFAULT_TZ }) : '—';
