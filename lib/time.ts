/** Time-zone helpers that do not depend on the server's own zone (Vercel always runs in UTC). */

import { DEFAULT_TZ, validTimeZone } from './format';

const zone = (tz: string) => validTimeZone(tz) ?? DEFAULT_TZ;

function offsetMs(tz: string, d: Date) {
  tz = zone(tz);
  const p = Object.fromEntries(
    new Intl.DateTimeFormat('en-US', { timeZone: tz, hourCycle: 'h23', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' })
      .formatToParts(d)
      .map((x) => [x.type, x.value]),
  );
  return Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour, +p.minute, +p.second) - Math.floor(d.getTime() / 1000) * 1000;
}

/** Midnight at the start of `d`'s day, in time zone `tz`. */
export function startOfDay(tz: string, d = new Date()) {
  const off = offsetMs(tz, d);
  const local = new Date(d.getTime() + off);
  local.setUTCHours(0, 0, 0, 0);
  return new Date(local.getTime() - off);
}

export function startOfMonth(tz: string, d = new Date()) {
  const off = offsetMs(tz, d);
  const local = new Date(d.getTime() + off);
  local.setUTCDate(1);
  local.setUTCHours(0, 0, 0, 0);
  return new Date(local.getTime() - off);
}

/** YYYY-MM-DD of `d` in `tz`, for grouping by day. */
export const dayKey = (tz: string, d: Date) => new Intl.DateTimeFormat('en-CA', { timeZone: zone(tz) }).format(d);

export const TIMEZONES = ['Africa/Dar_es_Salaam', 'Africa/Nairobi', 'Africa/Kampala', 'Africa/Kigali', 'Africa/Lusaka', 'Africa/Johannesburg', 'Africa/Lagos', 'Africa/Accra', 'Europe/London', 'UTC'];
