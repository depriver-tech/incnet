'use server';

import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { LANG_COOKIE } from './i18n';

export async function setLanguage(lang: string) {
  (await cookies()).set(LANG_COOKIE, lang === 'sw' ? 'sw' : 'en', { path: '/', sameSite: 'lax', maxAge: 60 * 60 * 24 * 365 });
  revalidatePath('/', 'layout');
}
