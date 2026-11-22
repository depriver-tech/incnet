'use client';

import { Languages } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { createContext, useContext, useTransition } from 'react';
import { translate, type Lang } from '@/lib/i18n';
import { setLanguage } from '@/lib/lang-actions';

const LangContext = createContext<Lang>('en');

export function LangProvider({ lang, children }: { lang: Lang; children: React.ReactNode }) {
  return <LangContext.Provider value={lang}>{children}</LangContext.Provider>;
}

export function useLang() {
  return useContext(LangContext);
}

export function useT() {
  const lang = useContext(LangContext);
  return (key: string) => translate(lang, key);
}

/** Switches between English and Kiswahili and re-renders the page in place. */
export function LangSwitch({ className = 'btn btn-ghost btn-sm' }: { className?: string }) {
  const lang = useLang();
  const router = useRouter();
  const [pending, start] = useTransition();
  return (
    <button type="button" className={className} disabled={pending} onClick={() => start(async () => { await setLanguage(lang === 'en' ? 'sw' : 'en'); router.refresh(); })} aria-label="Change language">
      <Languages size={14} /> {lang === 'en' ? 'Kiswahili' : 'English'}
    </button>
  );
}
