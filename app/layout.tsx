import type { Metadata, Viewport } from 'next';
import { APP_NAME, APP_URL } from '@/lib/config';
import './globals.css';
import { LangProvider } from '@/components/i18n/LangProvider';
import { getLang } from '@/lib/lang';
import { HTML_LANG } from '@/lib/i18n';

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),
  title: { default: `${APP_NAME}: hotspot billing for MikroTik`, template: `%s | ${APP_NAME}` },
  description: 'Sell Wi-Fi packages with vouchers and mobile money. One paste sets up your MikroTik. Open source.',
  icons: { icon: '/logo.svg' },
};

export const viewport: Viewport = { width: 'device-width', initialScale: 1, themeColor: '#0f9d8f' };

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const lang = await getLang();
  return (
    <html lang={HTML_LANG[lang]}>
      <body><LangProvider lang={lang}>{children}</LangProvider></body>
    </html>
  );
}
