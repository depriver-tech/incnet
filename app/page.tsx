import Link from 'next/link';
import { Cable, GitBranch, Globe, Printer, ShieldCheck, Smartphone, Zap } from 'lucide-react';
import { currentUser } from '@/lib/auth';
import { IS_CLOUD, PLANS, SOURCE_URL } from '@/lib/config';
import { money } from '@/lib/format';

const FONTS = 'https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600;9..40,700&family=Syne+Mono&display=swap';

const FEATURES = [
  { icon: Cable, title: 'One-paste router setup', text: 'Name the venue, copy one script into the MikroTik terminal, done. Hotspot, DHCP, login page and sync are all set up for you.' },
  { icon: Globe, title: 'Works behind any ISP', text: 'The router calls incnet, so there is no VPN, public IP or port forwarding to set up. It also works on mobile data links.' },
  { icon: Smartphone, title: 'Mobile money built in', text: 'Customers pick a package, enter their number and confirm with their PIN on M-Pesa, Mixx by Yas, Airtel Money or Halotel.' },
  { icon: Printer, title: 'Printable vouchers', text: 'Sell codes at the counter. Time starts on first use, and used codes fade on the print sheet.' },
  { icon: Zap, title: 'Self-healing', text: 'If a router reboots or its hotspot page is reset, incnet puts everything back on the next check-in.' },
  { icon: ShieldCheck, title: 'Yours to run', text: 'Open source under AGPL-3.0. Use our cloud, or host it yourself on your own server and domain.' },
];

export default async function Home() {
  const user = await currentUser();
  return (
    <>
      <link rel="stylesheet" href={FONTS} />
      <div className="wrap">
        <header className="top">
          <Link href="/" className="brand display"><img src="/logo.svg" alt="" /> incnet</Link>
          <nav>
            <a href="#how">How it works</a>
            <a href="#host">{IS_CLOUD ? 'Pricing' : 'Hosting'}</a>
            <a href={SOURCE_URL} target="_blank" rel="noreferrer" className="row" style={{ gap: 6 }}><GitBranch size={15} /> Source</a>
            {user ? <Link className="btn btn-sm" href="/dashboard">Dashboard</Link> : <Link className="btn btn-sm btn-ghost" href="/login">Sign in</Link>}
          </nav>
        </header>

        <section className="hero">
          <div>
            <p className="badge accent" style={{ marginBottom: 18 }}>Open source · MikroTik · Mobile money</p>
            <h1 className="display">Run a paid Wi-Fi hotspot without the hard parts.</h1>
            <p className="lead">incnet sells internet packages at your café, hostel or shop. Customers pay by phone or with a voucher and get online by themselves. You set up the router with one paste.</p>
            <div className="row">
              <Link className="btn btn-lg" href={user ? '/dashboard' : '/signup'}>{user ? 'Open dashboard' : 'Start free'}</Link>
              <a className="btn btn-lg btn-ghost" href={SOURCE_URL} target="_blank" rel="noreferrer"><GitBranch size={18} /> Self-host it</a>
            </div>
          </div>
          <PhoneMock />
        </section>
      </div>

      <section className="section" id="how">
        <div className="wrap grid grid-2" style={{ alignItems: 'center', gap: 40 }}>
          <div>
            <p className="eyebrow accent small" style={{ fontWeight: 600, marginBottom: 8 }}>HOW IT WORKS</p>
            <h2 className="display">From box to selling in about ten minutes.</h2>
            <p className="muted">No networking degree needed. incnet writes the router configuration for you and keeps it correct.</p>
          </div>
          <ol className="flow">
            <li><div><strong>Create your account</strong><div className="muted small">Starter packages (1 hour, 1 day, 1 week, 1 month) are ready to edit.</div></div></li>
            <li><div><strong>Add your router</strong><div className="muted small">Pick the ports your access points use and copy the script it gives you.</div></div></li>
            <li><div><strong>Paste it into the MikroTik</strong><div className="muted small">The router shows as online in the dashboard within seconds.</div></div></li>
            <li><div><strong>Sell</strong><div className="muted small">Turn on mobile money, print vouchers, and watch sales come in.</div></div></li>
          </ol>
        </div>
      </section>

      <section className="section">
        <div className="wrap">
          <h2 className="display" style={{ maxWidth: 640 }}>Everything a hotspot business needs.</h2>
          <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', marginTop: 28 }}>
            {FEATURES.map(({ icon: Icon, title, text }) => (
              <div key={title} className="card feature"><Icon size={22} /><h3>{title}</h3><p>{text}</p></div>
            ))}
          </div>
        </div>
      </section>

      <section className="section" id="host">
        <div className="wrap">
          <h2 className="display">Our cloud, or your server.</h2>
          <p className="muted" style={{ maxWidth: 620 }}>The same software either way. Start on our cloud with nothing to install, or run it yourself with Docker on any Linux server and your own domain.</p>
          <div className="grid grid-2" style={{ marginTop: 28 }}>
            <div className="card card-pad stack" style={{ gap: 12, borderColor: 'var(--accent)' }}>
              <h3>incnet Cloud</h3>
              <p className="muted">We run the servers, backups and updates. Mobile money through incpesa.</p>
              {Object.values(PLANS).map((p) => (
                <div key={p.name} className="spread" style={{ borderTop: '1px solid var(--line)', paddingTop: 10 }}>
                  <div><strong>{p.name}</strong><div className="muted small">{p.note}</div></div>
                  <strong>{p.price ? `${money(p.price)}/mo` : 'Free'}</strong>
                </div>
              ))}
              <Link className="btn" href="/signup" style={{ justifySelf: 'start' }}>Start free</Link>
            </div>
            <div className="card card-pad stack" style={{ gap: 12 }}>
              <h3>Self-hosted</h3>
              <p className="muted">Free forever, no limits. Bring your own server, domain and payment account (incpesa or Snippe), or run vouchers only.</p>
              <pre className="code mono small" style={{ padding: 14, whiteSpace: 'pre-wrap' }}>{`git clone ${SOURCE_URL}\ncd incnet && cp .env.example .env\ndocker compose up -d`}</pre>
              <a className="btn btn-ghost" href={SOURCE_URL} target="_blank" rel="noreferrer" style={{ justifySelf: 'start' }}><GitBranch size={16} /> Read the setup guide</a>
            </div>
          </div>
        </div>
      </section>

      <footer className="section" style={{ padding: '32px 0' }}>
        <div className="wrap spread muted small">
          <span>incnet by INCPRITECH · AGPL-3.0</span>
          <span className="row"><a href={SOURCE_URL}>Source</a><Link href="/login">Sign in</Link></span>
        </div>
      </footer>
    </>
  );
}

function PhoneMock() {
  return (
    <div className="phone" aria-hidden="true">
      <div style={{ padding: 16, fontFamily: 'system-ui', color: '#14181a', background: '#f4f6f5' }}>
        <div className="row" style={{ marginBottom: 12 }}><span style={{ width: 34, height: 34, borderRadius: 10, background: '#0f9d8f', color: '#fff', display: 'grid', placeItems: 'center', fontWeight: 800 }}>M</span><div><strong style={{ fontSize: 14 }}>Mlimani Café</strong><div style={{ fontSize: 11, color: '#5f6b6d' }}>Wi-Fi</div></div></div>
        <div style={{ background: '#fff', borderRadius: 14, padding: 12, marginBottom: 10, border: '1px solid #e3e8e6' }}>
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 8 }}>Buy a package</div>
          {[['1 hour', '500'], ['1 day', '1,000'], ['1 week', '5,000']].map(([n, p], i) => (
            <div key={n} style={{ display: 'flex', justifyContent: 'space-between', padding: '9px 10px', border: `1.5px solid ${i === 1 ? '#0f9d8f' : '#e3e8e6'}`, borderRadius: 10, marginBottom: 6, fontSize: 13, background: i === 1 ? '#eaf6f4' : '#fff' }}><span>{n}</span><b>TSh {p}</b></div>
          ))}
          <div style={{ padding: '9px 10px', border: '1.5px solid #e3e8e6', borderRadius: 10, fontSize: 13, color: '#8a9496', margin: '8px 0' }}>0712 345 678</div>
          <div style={{ background: '#0f9d8f', color: '#fff', textAlign: 'center', borderRadius: 10, padding: 10, fontWeight: 700, fontSize: 14 }}>Pay TSh 1,000</div>
        </div>
        <div style={{ background: '#fff', borderRadius: 14, padding: 12, border: '1px solid #e3e8e6', fontSize: 13 }}>
          <b>Have a voucher code?</b>
          <div style={{ display: 'flex', gap: 6, marginTop: 8 }}><div style={{ flex: 1, border: '1.5px solid #e3e8e6', borderRadius: 10, padding: 8, color: '#8a9496', fontFamily: 'monospace' }}>ENTER CODE</div><div style={{ background: '#0f9d8f', color: '#fff', borderRadius: 10, padding: '8px 12px', fontWeight: 700 }}>Connect</div></div>
        </div>
      </div>
    </div>
  );
}
