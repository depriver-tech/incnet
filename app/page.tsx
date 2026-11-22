import Link from 'next/link';
import { ArrowRight, Check, Cpu, FlaskConical, GitBranch, Globe, Palette, Printer, Router, ShieldCheck, Smartphone, Terminal, Wifi, Zap } from 'lucide-react';
import { currentUser } from '@/lib/auth';
import { IS_CLOUD, PLANS, SOURCE_URL } from '@/lib/config';
import { startDemo } from '@/lib/demo';
import { money } from '@/lib/format';
import { HeroDashboard } from '@/components/landing/HeroDashboard';
import { Portal } from './p/[slug]/Portal';

const FONTS = 'https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600;9..40,700;9..40,800&family=Syne+Mono&display=swap';
const INSTALL = 'curl -fsSL https://raw.githubusercontent.com/depriver-tech/incnet/main/scripts/install.sh | sudo DOMAIN=wifi.example.com bash';

const FAQ = [
  ['Which routers work?', 'Any MikroTik on RouterOS 7, a Raspberry Pi (3B+, 4 or 5), or any router running OpenWrt. Access points of any brand plug in behind them. No hardware yet? Start with the built-in simulator.'],
  ['Do I need a public IP, VPN or port forwarding?', 'No. The router calls incnet every few seconds over HTTPS, so it works behind any internet provider, including mobile data links.'],
  ['How do customers pay?', 'They pick a package on the Wi-Fi page, type their number and confirm with their PIN on M-Pesa, Mixx by Yas, Airtel Money or Halotel. They are online seconds later, with no staff involved. Printed vouchers work too.'],
  ['Where does the money go?', 'Straight to your own payment account (incpesa or Snippe). incnet never holds your money.'],
  ['Can I run it on my own server?', 'Yes. incnet is open source under AGPL-3.0. One command installs it on a Raspberry Pi or a VPS with automatic HTTPS, and there is a guide for shared hosting.'],
  ['What happens if the internet or incnet goes down?', 'Customers already online stay online until their time runs out: the router enforces the limits itself. When the link comes back, the router catches up automatically.'],
];

export default async function Home() {
  const user = await currentUser();
  return (
    <div className="lp">
      <link rel="stylesheet" href={FONTS} />

      <header className="lp-nav-wrap">
        <nav className="lp-nav wrap">
          <Link href="/" className="lp-brand"><img src="/logo.svg" alt="" /> incnet</Link>
          <div className="lp-links">
            <a href="#features">Features</a>
            <a href="#hardware">Hardware</a>
            <a href="#pricing">{IS_CLOUD ? 'Pricing' : 'Hosting'}</a>
            <a href={SOURCE_URL} target="_blank" rel="noreferrer">Docs</a>
          </div>
          <div className="row" style={{ gap: 8 }}>
            {user ? <Link className="btn btn-sm" href="/dashboard">Dashboard</Link> : <><Link className="btn btn-sm btn-ghost lp-hide-sm" href="/login">Sign in</Link><Link className="btn btn-sm" href="/signup">Start free</Link></>}
          </div>
        </nav>
      </header>

      <section className="lp-hero">
        <div className="wrap lp-hero-inner">
          <a className="lp-pill" href={SOURCE_URL} target="_blank" rel="noreferrer"><GitBranch size={13} /> Open source · MikroTik · Raspberry Pi · OpenWrt <ArrowRight size={13} /></a>
          <h1>Sell Wi-Fi like a pro.<br /><span className="accent">Set it up in one paste.</span></h1>
          <p className="lp-lead">incnet runs paid hotspots for cafés, hostels, shops and estates. Customers pay with mobile money or a voucher and get online by themselves. Your router is set up with one script.</p>
          <div className="lp-cta">
            <Link className="btn btn-lg" href={user ? '/dashboard' : '/signup'}>{user ? 'Open dashboard' : 'Start free'} <ArrowRight size={17} /></Link>
            {IS_CLOUD && <form action={startDemo}><button className="btn btn-lg btn-ghost" type="submit"><FlaskConical size={17} /> Try the live demo</button></form>}
          </div>
          <p className="lp-trust"><Check size={14} /> No card needed <span>·</span> <Check size={14} /> Works behind any ISP <span>·</span> <Check size={14} /> M-Pesa, Mixx by Yas, Airtel Money, Halotel</p>

        </div>
        <div className="lp-stage wrap">
          <HeroDashboard />
          <div className="lp-phone">
            <Portal
              preview
              slug="demo"
              business="Mlimani Café"
              design={{ theme: 'modern', color: '#0f9d8f', logo: null, bg: null, headline: 'Fast Wi-Fi for our guests', welcome: null, terms: null, lang: 'en', supportPhone: null }}
              payments
              minPayment={0}
              packages={[
                { id: 'h', name: '1 hour', price: 500, priceLabel: 'TSh 500', duration: '1 hour', speed: '5 Mbps', data: null },
                { id: 'd', name: '1 day', price: 1000, priceLabel: 'TSh 1,000', duration: '1 day', speed: '5 Mbps', data: null },
                { id: 'w', name: '1 week', price: 5000, priceLabel: 'TSh 5,000', duration: '7 days', speed: '8 Mbps', data: null },
              ]}
              ctx={{ mac: null, ip: null, handoff: { kind: 'none' }, dst: null, err: null, code: null }}
            />
          </div>
        </div>
      </section>

      <section className="lp-strip">
        <div className="wrap lp-strip-grid">
          <div><strong>1 paste</strong><span>to set up a MikroTik</span></div>
          <div><strong>1 command</strong><span>for a Raspberry Pi or OpenWrt</span></div>
          <div><strong>~5 seconds</strong><span>from payment to online</span></div>
          <div><strong>0</strong><span>VPNs, public IPs or port forwards</span></div>
        </div>
      </section>

      <section className="lp-section" id="features">
        <div className="wrap">
          <p className="lp-eyebrow">HOW IT WORKS</p>
          <h2>From box to selling in ten minutes.</h2>
          <div className="lp-steps">
            {[
              { icon: Router, t: 'Add your router', d: 'Pick MikroTik, Raspberry Pi or OpenWrt. incnet writes the setup for your exact hardware.' },
              { icon: Terminal, t: 'Paste once', d: 'One script or command sets up the hotspot, DHCP, login page and a sync that heals itself.' },
              { icon: Smartphone, t: 'Customers pay', d: 'They join your Wi-Fi, pick a package, confirm with their PIN, and they are online.' },
              { icon: Zap, t: 'You get paid', d: 'Money lands in your own account. Watch sales, connected users and routers live.' },
            ].map(({ icon: Icon, t, d }, i) => (
              <div key={t} className="lp-step"><span className="lp-step-n">{i + 1}</span><Icon size={20} /><h3>{t}</h3><p>{d}</p></div>
            ))}
          </div>
        </div>
      </section>

      <section className="lp-section lp-alt">
        <div className="wrap lp-feature">
          <div className="lp-feature-text">
            <p className="lp-eyebrow"><Palette size={14} /> WI-FI PAGE DESIGNER</p>
            <h2>A Wi-Fi page that looks like your brand.</h2>
            <p>Five templates (Modern, Classic, Bold, Minimal and Photo), your logo and colours, a headline, terms of use and English or Kiswahili. A live phone preview shows every change as you make it.</p>
            <ul className="lp-ticks">
              <li><Check size={16} /> Loads fast on any phone, even before it is online</li>
              <li><Check size={16} /> Vouchers and mobile money on one screen</li>
              <li><Check size={16} /> Customers get a code to reconnect later</li>
            </ul>
          </div>
          <div className="lp-phones">
            <img src="/screens/portal-classic.png" alt="Classic template" width={390} height={844} />
            <img src="/screens/portal-bold.png" alt="Bold template" width={390} height={844} />
            <img src="/screens/portal-modern.png" alt="Modern template" width={390} height={844} />
          </div>
        </div>
      </section>

      <section className="lp-section">
        <div className="wrap lp-feature lp-feature-rev">
          <div className="lp-feature-text">
            <p className="lp-eyebrow"><Printer size={14} /> VOUCHERS</p>
            <h2>Print vouchers people want to keep.</h2>
            <p>Make up to 500 codes at a time for a specific router and package. Choose Classic, Ticket, Card or Minimal, and decide what each voucher shows. A QR code opens the Wi-Fi page with the code already filled in.</p>
            <ul className="lp-ticks">
              <li><Check size={16} /> Time starts on first use, not when printed</li>
              <li><Check size={16} /> Used codes fade on the sheet</li>
              <li><Check size={16} /> Cancel a code and it is disconnected in seconds</li>
            </ul>
          </div>
          <div className="lp-frame"><img src="/screens/vouchers.png" alt="A sheet of printable Wi-Fi vouchers with QR codes" width={1800} height={1125} loading="lazy" /></div>
        </div>
      </section>

      <section className="lp-section lp-alt">
        <div className="wrap lp-feature">
          <div className="lp-feature-text">
            <p className="lp-eyebrow"><FlaskConical size={14} /> SIMULATOR</p>
            <h2>Try everything before you touch a router.</h2>
            <p>The simulator gives you a virtual router and a virtual phone side by side. Buy a package, redeem a voucher and watch the router let the phone online, using test payments where no money moves.</p>
            {IS_CLOUD && <form action={startDemo}><button className="btn" type="submit">Open the live demo <ArrowRight size={16} /></button></form>}
          </div>
          <div className="lp-frame"><img src="/screens/simulator.png" alt="The simulator: a virtual router next to a virtual phone" width={1800} height={1125} loading="lazy" /></div>
        </div>
      </section>

      <section className="lp-section" id="hardware">
        <div className="wrap">
          <p className="lp-eyebrow">HARDWARE</p>
          <h2>Bring the router you have.</h2>
          <div className="lp-hw">
            <div className="card lp-hw-card"><Router size={22} /><h3>MikroTik</h3><p>Any model on RouterOS 7: hAP, RB5009, CCR. Paste one script into the terminal.</p><code>WinBox → New Terminal → paste</code></div>
            <div className="card lp-hw-card"><Cpu size={22} /><h3>Raspberry Pi</h3><p>A Pi 3B+, 4 or 5 becomes the hotspot, using its own Wi-Fi or an access point.</p><code>curl … /install | sudo sh</code></div>
            <div className="card lp-hw-card"><Wifi size={22} /><h3>OpenWrt</h3><p>Any OpenWrt router, with openNDS installed and configured for you.</p><code>curl … /install | sh</code></div>
            <div className="card lp-hw-card"><FlaskConical size={22} /><h3>Simulator</h3><p>No hardware at all. Learn, demo and set up your packages in the browser.</p><code>Built in</code></div>
          </div>
        </div>
      </section>

      <section className="lp-section lp-alt">
        <div className="wrap lp-feature lp-feature-rev">
          <div className="lp-feature-text">
            <p className="lp-eyebrow"><Globe size={14} /> RUN YOUR BUSINESS</p>
            <h2>Know what sold, where and when.</h2>
            <p>Sales by day, mobile money and vouchers, every router&apos;s status and every connected code. Packages can be sold everywhere or at one router only.</p>
            <ul className="lp-ticks">
              <li><Check size={16} /> Search any code or phone number</li>
              <li><Check size={16} /> Sales follow your own time zone</li>
              <li><Check size={16} /> Self-healing routers: reboots and resets are fixed for you</li>
            </ul>
          </div>
          <div className="lp-frame"><img src="/screens/sales.png" alt="Sales over the last 14 days" width={1800} height={1125} loading="lazy" /></div>
        </div>
      </section>

      <section className="lp-section" id="pricing">
        <div className="wrap">
          <p className="lp-eyebrow">PRICING</p>
          <h2>Our cloud, or your server.</h2>
          <p className="lp-sub">The same software either way. Your customers&apos; payments always go to your own account.</p>
          <div className="lp-plans">
            {Object.entries(PLANS).map(([id, p]) => (
              <div key={id} className={`card lp-plan${id === 'pro' ? ' featured' : ''}`}>
                {id === 'pro' && <span className="badge accent lp-plan-tag">Most popular</span>}
                <h3>{p.name}</h3>
                <div className="lp-price">{p.price ? <>{money(p.price)}<small>/month</small></> : 'Free'}</div>
                <p>{p.note}</p>
                <ul className="lp-ticks">
                  <li><Check size={16} /> Wi-Fi page and voucher designers</li>
                  <li><Check size={16} /> Mobile money and vouchers</li>
                  <li><Check size={16} /> {id === 'pro' ? 'Up to 20 routers' : '1 router'}</li>
                </ul>
                <Link className={`btn ${id === 'pro' ? '' : 'btn-ghost'}`} href="/signup">Start free</Link>
              </div>
            ))}
            <div className="card lp-plan">
              <h3>Self-hosted</h3>
              <div className="lp-price">Free</div>
              <p>Open source, no limits. Raspberry Pi, VPS or shared hosting.</p>
              <div className="lp-code"><code>{INSTALL}</code></div>
              <a className="btn btn-ghost" href={`${SOURCE_URL}/blob/main/docs/self-hosting.md`} target="_blank" rel="noreferrer"><GitBranch size={16} /> Self-hosting guide</a>
            </div>
          </div>
        </div>
      </section>

      <section className="lp-section lp-alt">
        <div className="wrap lp-faq-wrap">
          <div>
            <p className="lp-eyebrow">QUESTIONS</p>
            <h2>Good to know.</h2>
            <p className="lp-sub"><ShieldCheck size={16} style={{ verticalAlign: '-3px' }} /> Router tokens and payment keys are encrypted. Codes can only be guessed slowly.</p>
          </div>
          <div className="lp-faq">
            {FAQ.map(([q, a]) => (
              <details key={q}><summary>{q}<span aria-hidden>+</span></summary><p>{a}</p></details>
            ))}
          </div>
        </div>
      </section>

      <section className="lp-final">
        <div className="wrap">
          <h2>Ready to sell Wi-Fi?</h2>
          <p>Set up your first hotspot today. It takes about ten minutes.</p>
          <div className="lp-cta" style={{ justifyContent: 'center' }}>
            <Link className="btn btn-lg lp-btn-light" href={user ? '/dashboard' : '/signup'}>{user ? 'Open dashboard' : 'Start free'} <ArrowRight size={17} /></Link>
            {IS_CLOUD && <form action={startDemo}><button className="btn btn-lg lp-btn-outline" type="submit">Try the live demo</button></form>}
          </div>
        </div>
      </section>

      <footer className="lp-footer">
        <div className="wrap spread">
          <Link href="/" className="lp-brand"><img src="/logo.svg" alt="" /> incnet</Link>
          <span className="muted small">By INCPRITECH · Open source under AGPL-3.0</span>
          <span className="row small" style={{ gap: 16 }}><a href={SOURCE_URL}>GitHub</a><a href={`${SOURCE_URL}/blob/main/docs/raspberry-pi-gateway.md`}>Raspberry Pi guide</a><Link href="/login">Sign in</Link></span>
        </div>
      </footer>
    </div>
  );
}
