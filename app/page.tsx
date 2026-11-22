import Link from 'next/link';
import {
  ArrowRight, Building2, Check, Coffee, Cpu, FlaskConical, GitBranch, Globe, GraduationCap, Hotel, LineChart, Lock, Palette, PartyPopper,
  Printer, RefreshCw, Router, ShieldCheck, Smartphone, Store, Terminal, Users, Wifi, X, Zap,
} from 'lucide-react';
import { Fonts } from '@/components/Fonts';
import { LangSwitch } from '@/components/i18n/LangProvider';
import { HeroDashboard } from '@/components/landing/HeroDashboard';
import { HostTabs } from '@/components/landing/HostTabs';
import { currentUser } from '@/lib/auth';
import { IS_CLOUD, PLANS, RELEASES_URL, SOURCE_URL, VERCEL_DEPLOY_URL } from '@/lib/config';
import { startDemo } from '@/lib/demo';
import { money } from '@/lib/format';
import { LANDING } from '@/lib/landing-content';
import { getLang, getT } from '@/lib/lang';
import { Portal } from './p/[slug]/Portal';

const USE_ICONS = [Coffee, Hotel, Building2, GraduationCap, Store, PartyPopper];
const SEC_ICONS = [Lock, ShieldCheck, RefreshCw, Wifi, Users, Globe];
const HW_ICONS = [Router, Cpu, Wifi, FlaskConical];

function Ticks({ items }: { items: string[] }) {
  return <ul className="lp-ticks">{items.map((i) => <li key={i}><Check size={16} /> {i}</li>)}</ul>;
}

export default async function Home() {
  const user = await currentUser();
  const t = await getT();
  const lang = await getLang();
  const C = LANDING[lang];
  const demoButton = (cls: string, label: string) => IS_CLOUD && <form action={startDemo}><button className={cls} type="submit"><FlaskConical size={17} /> {label}</button></form>;

  return (
    <div className="lp">
      <Fonts />
      <header className="lp-nav-wrap">
        <nav className="lp-nav wrap">
          <Link href="/" className="lp-brand"><img src="/logo.svg" alt="" /> incnet</Link>
          <div className="lp-links">
            <a href="#features">{t('lp.features')}</a>
            <a href="#hardware">{t('lp.hardware')}</a>
            <a href="#pricing">{t('lp.pricing')}</a>
            <a href="#host">{t('lp.selfhost')}</a>
            <a href={SOURCE_URL} target="_blank" rel="noreferrer">{t('lp.docs')}</a>
          </div>
          <div className="row" style={{ gap: 8 }}>
            <LangSwitch className="btn btn-ghost btn-sm" />
            {user ? <Link className="btn btn-sm" href="/dashboard">{t('lp.dashboard')}</Link> : <><Link className="btn btn-sm btn-ghost lp-hide-sm" href="/login">{t('lp.signin')}</Link><Link className="btn btn-sm" href="/signup">{t('lp.start')}</Link></>}
          </div>
        </nav>
      </header>

      <section className="lp-hero">
        <div className="wrap lp-hero-inner">
          <a className="lp-pill" href={SOURCE_URL} target="_blank" rel="noreferrer"><GitBranch size={13} /> {t('lp.pill')} <ArrowRight size={13} /></a>
          <h1>{t('lp.h1a')}<br /><span className="accent">{t('lp.h1b')}</span></h1>
          <p className="lp-lead">{t('lp.lead')}</p>
          <div className="lp-cta">
            <Link className="btn btn-lg" href={user ? '/dashboard' : '/signup'}>{user ? t('lp.openDash') : t('lp.start')} <ArrowRight size={17} /></Link>
            {demoButton('btn btn-lg btn-ghost', t('lp.demo'))}
          </div>
          <p className="lp-trust"><Check size={14} /> {t('lp.noCard')} <span>·</span> <Check size={14} /> {t('lp.anyIsp')} <span>·</span> <Check size={14} /> M-Pesa, Mixx by Yas, Airtel Money, Halotel</p>
        </div>
        <div className="lp-stage wrap">
          <HeroDashboard />
          <div className="lp-phone">
            <Portal
              preview
              slug="demo"
              business="Mlimani Café"
              design={{ theme: 'modern', color: '#0f9d8f', logo: null, bg: null, headline: lang === 'sw' ? 'Wi-Fi ya kasi kwa wageni wetu' : 'Fast Wi-Fi for our guests', welcome: null, terms: null, lang, supportPhone: null }}
              payments
              minPayment={0}
              packages={[
                { id: 'h', name: lang === 'sw' ? 'Saa 1' : '1 hour', price: 500, priceLabel: 'TSh 500', duration: '1 hour', speed: '5 Mbps', data: null },
                { id: 'd', name: lang === 'sw' ? 'Siku 1' : '1 day', price: 1000, priceLabel: 'TSh 1,000', duration: '1 day', speed: '5 Mbps', data: null },
                { id: 'w', name: lang === 'sw' ? 'Wiki 1' : '1 week', price: 5000, priceLabel: 'TSh 5,000', duration: '7 days', speed: '8 Mbps', data: null },
              ]}
              ctx={{ mac: null, ip: null, handoff: { kind: 'none' }, dst: null, err: null, code: null }}
            />
          </div>
        </div>
      </section>

      <section className="lp-strip">
        <div className="wrap lp-strip-grid">
          <div><strong>1 paste</strong><span>{t('lp.s1')}</span></div>
          <div><strong>1 command</strong><span>{t('lp.s2')}</span></div>
          <div><strong>~5 s</strong><span>{t('lp.s3')}</span></div>
          <div><strong>0</strong><span>{t('lp.s4')}</span></div>
        </div>
      </section>

      <section className="lp-section" id="features">
        <div className="wrap">
          <p className="lp-eyebrow">{t('lp.howEyebrow')}</p>
          <h2>{t('lp.howTitle')}</h2>
          <div className="lp-steps">
            {[[Router, 'lp.step1'], [Terminal, 'lp.step2'], [Smartphone, 'lp.step3'], [Zap, 'lp.step4']].map(([Icon, k], i) => {
              const I = Icon as typeof Router;
              return <div key={k as string} className="lp-step"><span className="lp-step-n">{i + 1}</span><I size={20} /><h3>{t(k as string)}</h3><p>{t(`${k}d`)}</p></div>;
            })}
          </div>
        </div>
      </section>

      <section className="lp-section lp-alt">
        <div className="wrap lp-feature">
          <div className="lp-feature-text">
            <p className="lp-eyebrow"><Palette size={14} /> {C.designer.eyebrow}</p>
            <h2>{C.designer.title}</h2>
            <p>{C.designer.text}</p>
            <Ticks items={C.designer.ticks} />
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
            <p className="lp-eyebrow"><Printer size={14} /> {C.vouchers.eyebrow}</p>
            <h2>{C.vouchers.title}</h2>
            <p>{C.vouchers.text}</p>
            <Ticks items={C.vouchers.ticks} />
          </div>
          <div className="lp-frame"><img src="/screens/vouchers.png" alt="A sheet of printable Wi-Fi vouchers with QR codes" width={1800} height={1125} loading="lazy" /></div>
        </div>
      </section>

      <section className="lp-section lp-alt">
        <div className="wrap lp-feature">
          <div className="lp-feature-text">
            <p className="lp-eyebrow"><LineChart size={14} /> {t('lp.reportEyebrow')}</p>
            <h2>{t('lp.reportTitle')}</h2>
            <p>{t('lp.reportText')}</p>
            <Ticks items={C.reportTicks} />
          </div>
          <div className="lp-report card" aria-hidden>
            <div className="lp-report-kpis">
              {[[t('r.revenue'), 'TSh 1.24M', '▲ 18%'], [t('r.sales'), '1,482', '▲ 11%'], [t('r.customers'), '612', '▲ 9%']].map(([l, v, d]) => <div key={l}><small>{l}</small><strong>{v}</strong><span>{d}</span></div>)}
            </div>
            <div className="lp-report-heat">{Array.from({ length: 7 * 16 }, (_, i) => { const h = i % 16; const d = Math.floor(i / 16); const v = Math.max(0, Math.round(5 * Math.sin(((h + 2) / 16) * Math.PI) * (d > 4 ? 1 : 0.75) - (h < 2 ? 2 : 0))); return <i key={i} className={`heat-cell s${Math.min(5, v)}`} />; })}</div>
            <div className="rank">
              {[[lang === 'sw' ? 'Siku 1' : '1 day', 46], [lang === 'sw' ? 'Saa 1' : '1 hour', 31], [lang === 'sw' ? 'Wiki 1' : '1 week', 15], [lang === 'sw' ? 'Mwezi 1' : '1 month', 8]].map(([n, p]) => <div key={n} className="rank-row"><div className="rank-top"><span>{n}</span><span><b>{p}%</b></span></div><div className="rank-track"><div style={{ width: `${p}%` }} /></div></div>)}
            </div>
          </div>
        </div>
      </section>

      <section className="lp-section">
        <div className="wrap lp-feature lp-feature-rev">
          <div className="lp-feature-text">
            <p className="lp-eyebrow"><Users size={14} /> {t('lp.teamEyebrow')}</p>
            <h2>{t('lp.teamTitle')}</h2>
            <p>{t('lp.teamText')}</p>
          </div>
          <div className="lp-roles">
            {C.roles.map(([r, d], i) => <div key={r} className="card lp-role"><span className="avatar">{r[0]}</span><div><strong>{r}</strong><span>{d}</span></div>{i === 0 && <em className="badge accent">{C.you}</em>}</div>)}
          </div>
        </div>
      </section>

      <section className="lp-section lp-alt">
        <div className="wrap lp-feature">
          <div className="lp-feature-text">
            <p className="lp-eyebrow"><FlaskConical size={14} /> {C.simulator.eyebrow}</p>
            <h2>{C.simulator.title}</h2>
            <p>{C.simulator.text}</p>
            {demoButton('btn', C.simulator.cta)}
          </div>
          <div className="lp-frame"><img src="/screens/simulator.png" alt="The simulator: a virtual router next to a virtual phone" width={1800} height={1125} loading="lazy" /></div>
        </div>
      </section>

      <section className="lp-section">
        <div className="wrap">
          <p className="lp-eyebrow">{t('lp.useEyebrow')}</p>
          <h2>{t('lp.useTitle')}</h2>
          <div className="lp-uses">
            {C.uses.map((u, i) => { const I = USE_ICONS[i]; return <div key={u.t} className="card lp-use"><I size={20} /><h3>{u.t}</h3><p>{u.d}</p></div>; })}
          </div>
        </div>
      </section>

      <section className="lp-section lp-alt" id="hardware">
        <div className="wrap">
          <p className="lp-eyebrow">{C.hardwareEyebrow}</p>
          <h2>{C.hardwareTitle}</h2>
          <div className="lp-hw">
            {C.hardware.map((h, i) => { const I = HW_ICONS[i]; return <div key={h.title} className="card lp-hw-card"><I size={22} /><h3>{h.title}</h3><p>{h.text}</p><code>{h.code}</code></div>; })}
          </div>
        </div>
      </section>

      <section className="lp-section">
        <div className="wrap lp-feature lp-feature-rev">
          <div className="lp-feature-text">
            <p className="lp-eyebrow"><Globe size={14} /> {C.business.eyebrow}</p>
            <h2>{C.business.title}</h2>
            <p>{C.business.text}</p>
            <Ticks items={C.business.ticks} />
          </div>
          <div className="lp-frame"><img src="/screens/sales.png" alt="Sales over the last 14 days" width={1800} height={1125} loading="lazy" /></div>
        </div>
      </section>

      <section className="lp-section lp-alt">
        <div className="wrap">
          <p className="lp-eyebrow">{t('lp.compareEyebrow')}</p>
          <h2>{t('lp.compareTitle')}</h2>
          <div className="card lp-compare table-wrap"><table>
            <thead><tr>{C.compareHead.map((h, i) => <th key={i} className={i === 3 ? 'accent' : ''}>{h}</th>)}</tr></thead>
            <tbody>
              {C.compare.map(([label, a, b, c]) => (
                <tr key={label}><td><strong>{label}</strong></td>{[a, b, c].map((v, i) => <td key={i} className={i === 2 ? 'lp-us' : ''}>{v === true ? <Check size={18} className="accent" aria-label="Yes" /> : v === false ? <X size={16} className="muted" aria-label="No" /> : v}</td>)}</tr>
              ))}
            </tbody>
          </table></div>
        </div>
      </section>

      <section className="lp-section">
        <div className="wrap">
          <p className="lp-eyebrow">{t('lp.secEyebrow')}</p>
          <h2>{t('lp.secTitle')}</h2>
          <div className="lp-uses">
            {C.security.map((u, i) => { const I = SEC_ICONS[i]; return <div key={u.t} className="card lp-use"><I size={20} /><h3>{u.t}</h3><p>{u.d}</p></div>; })}
          </div>
        </div>
      </section>

      <section className="lp-section lp-alt" id="pricing">
        <div className="wrap">
          <p className="lp-eyebrow">{C.pricingEyebrow}</p>
          <h2>{C.pricingTitle}</h2>
          <p className="lp-sub">{C.pricingSub}</p>
          <div className="lp-plans">
            {Object.entries(PLANS).map(([id, p]) => (
              <div key={id} className={`card lp-plan${id === 'pro' ? ' featured' : ''}`}>
                {id === 'pro' && <span className="badge accent lp-plan-tag">{C.popular}</span>}
                <h3>{p.name}</h3>
                <div className="lp-price">{p.price ? <>{money(p.price)}<small>{C.month}</small></> : C.free}</div>
                <Ticks items={C.planTicks(id === 'pro')} />
                <Link className={`btn ${id === 'pro' ? '' : 'btn-ghost'}`} href="/signup">{C.startFree}</Link>
              </div>
            ))}
            <div className="card lp-plan">
              <h3>{C.selfTitle}</h3>
              <div className="lp-price">{C.free}</div>
              <p>{C.selfText}</p>
              <Ticks items={C.selfTicks} />
              <a className="btn btn-ghost" href="#host"><GitBranch size={16} /> {C.selfCta}</a>
            </div>
          </div>
        </div>
      </section>

      <section className="lp-section" id="host">
        <div className="wrap">
          <p className="lp-eyebrow">{t('lp.hostEyebrow')}</p>
          <h2>{t('lp.hostTitle')}</h2>
          <p className="lp-sub">{t('lp.hostSub')}</p>
          <HostTabs deployUrl={VERCEL_DEPLOY_URL} releasesUrl={RELEASES_URL} docsUrl={`${SOURCE_URL}/blob/main/docs/self-hosting.md`} />
        </div>
      </section>

      <section className="lp-section lp-alt">
        <div className="wrap lp-faq-wrap">
          <div>
            <p className="lp-eyebrow">{t('lp.faqEyebrow')}</p>
            <h2>{t('lp.faqTitle')}</h2>
            <p className="lp-sub"><ShieldCheck size={16} style={{ verticalAlign: '-3px' }} /> {C.faqNote}</p>
          </div>
          <div className="lp-faq">
            {C.faq.map(([q, a]) => <details key={q}><summary>{q}<span aria-hidden>+</span></summary><p>{a}</p></details>)}
          </div>
        </div>
      </section>

      <section className="lp-final">
        <div className="wrap">
          <h2>{t('lp.final')}</h2>
          <p>{t('lp.finalSub')}</p>
          <div className="lp-cta" style={{ justifyContent: 'center' }}>
            <Link className="btn btn-lg lp-btn-light" href={user ? '/dashboard' : '/signup'}>{user ? t('lp.openDash') : t('lp.start')} <ArrowRight size={17} /></Link>
            {demoButton('btn btn-lg lp-btn-outline', t('lp.demo'))}
          </div>
        </div>
      </section>

      <footer className="lp-footer">
        <div className="wrap spread">
          <Link href="/" className="lp-brand"><img src="/logo.svg" alt="" /> incnet</Link>
          <span className="muted small">{C.footer}</span>
          <span className="row small" style={{ gap: 16 }}><a href={SOURCE_URL}>GitHub</a><a href={`${SOURCE_URL}/blob/main/docs/raspberry-pi-gateway.md`}>{C.piGuide}</a><Link href="/login">{t('lp.signin')}</Link></span>
        </div>
      </footer>
    </div>
  );
}
