import type { Metadata, Viewport } from 'next';
import { APP_NAME, APP_URL } from '@/lib/config';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),
  title: { default: `${APP_NAME}: hotspot billing for MikroTik`, template: `%s | ${APP_NAME}` },
  description: 'Sell Wi-Fi packages with vouchers and mobile money. One paste sets up your MikroTik. Open source.',
  icons: { icon: '/logo.svg' },
};

export const viewport: Viewport = { width: 'device-width', initialScale: 1, themeColor: '#0f9d8f' };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
