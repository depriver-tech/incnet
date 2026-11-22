import { Fonts } from '@/components/Fonts';
import Link from 'next/link';


/** Centered layout shared by sign-in and sign-up. */
export function AuthShell({ title, subtitle, children, footer }: { title: string; subtitle: string; children: React.ReactNode; footer: React.ReactNode }) {
  return (
    <main className="auth-page">
      <Fonts />
      <div className="auth-glow" aria-hidden />
      <div className="auth-box">
        <div className="auth-head">
          <Link href="/" className="auth-brand"><img src="/logo.svg" alt="" /><span>incnet</span></Link>
          <h1>{title}</h1>
          <p>{subtitle}</p>
        </div>
        {children}
        <p className="auth-footer">{footer}</p>
      </div>
    </main>
  );
}
