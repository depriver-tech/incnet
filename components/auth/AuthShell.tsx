import Link from 'next/link';

const FONTS = 'https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600;9..40,700;9..40,800&family=Syne+Mono&display=swap';

/** Centered layout shared by sign-in and sign-up. */
export function AuthShell({ title, subtitle, children, footer }: { title: string; subtitle: string; children: React.ReactNode; footer: React.ReactNode }) {
  return (
    <main className="auth-page">
      <link rel="stylesheet" href={FONTS} />
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
