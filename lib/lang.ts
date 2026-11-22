import { cookies, headers } from 'next/headers';
import { cache } from 'react';
import { LANG_COOKIE, translate, type Lang } from './i18n';

/** The visitor's language: their choice, else Kiswahili when the browser prefers it, else English. */
export const getLang = cache(async (): Promise<Lang> => {
  const chosen = (await cookies()).get(LANG_COOKIE)?.value;
  if (chosen === 'en' || chosen === 'sw') return chosen;
  const accept = (await headers()).get('accept-language') || '';
  // sw, sw-TZ, sw-KE...: the first language the browser asks for decides.
  return /^sw(-|;|,|$)/i.test(accept.trim()) ? 'sw' : 'en';
});

/** A translator for server components. */
export async function getT() {
  const lang = await getLang();
  return (key: string) => translate(lang, key);
}
