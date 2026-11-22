'use client';

import { useEffect, useRef, useState } from 'react';

export type PortalPkg = { id: string; name: string; price: number; priceLabel: string; duration: string; speed: string; data: string | null };
/** How the phone gets online once its code is on the router. */
export type Handoff = { kind: 'router'; url: string } | { kind: 'gateway' } | { kind: 'none' };
export type PortalCtx = { mac: string | null; ip: string | null; handoff: Handoff; dst: string | null; err: string | null; code: string | null };
export type PortalDesign = { theme: string; color: string; logo: string | null; bg: string | null; headline: string | null; welcome: string | null; terms: string | null; lang: 'en' | 'sw'; supportPhone: string | null };

type Phase = { kind: 'idle' } | { kind: 'paying'; paymentId: string } | { kind: 'syncing'; accessId: string; code: string; offline?: boolean } | { kind: 'ready'; code: string } | { kind: 'failed'; message: string };

const T = {
  en: {
    haveCode: 'Have a voucher?', codePh: 'Enter code', connect: 'Connect', buy: 'Buy a package', phone: 'Mobile money number', pay: 'Pay', with: 'M-Pesa · Mixx by Yas · Airtel Money · Halotel',
    paying: 'Check your phone', payingText: 'Enter your PIN on the prompt to pay. Keep this page open.', syncing: 'Connecting you…', syncingText: 'Your Wi-Fi is being switched on. This takes a few seconds.',
    ready: "You're connected", readyText: 'Enjoy the internet.', yourCode: 'Your code', keepCode: 'Keep this code to reconnect later.', tryAgain: 'Cancel',
    noPay: 'Buy a voucher from staff to get online.', min: 'Mobile money starts at', choose: 'Choose a package first.', offline: 'The router is offline right now. Your time is saved; ask staff for help.',
    notOnWifi: 'Connect to the Wi-Fi network, then enter this code to get online.', reconnect: 'Reconnect with', help: 'Help:', lang: 'Kiswahili', open: 'Start browsing', terms: 'By connecting you accept the terms of use.', readTerms: 'Terms',
    preview: 'Preview only. Buttons work on the live page.',
  },
  sw: {
    haveCode: 'Una vocha?', codePh: 'Weka namba ya vocha', connect: 'Unganisha', buy: 'Nunua kifurushi', phone: 'Namba ya simu ya kulipia', pay: 'Lipa', with: 'M-Pesa · Mixx by Yas · Airtel Money · Halotel',
    paying: 'Angalia simu yako', payingText: 'Weka PIN kwenye ujumbe ili kulipa. Usifunge ukurasa huu.', syncing: 'Tunakuunganisha…', syncingText: 'Wi-Fi yako inawashwa. Subiri sekunde chache.',
    ready: 'Umeunganishwa', readyText: 'Furahia intaneti.', yourCode: 'Namba yako', keepCode: 'Hifadhi namba hii ili kuunganisha tena.', tryAgain: 'Ghairi',
    noPay: 'Nunua vocha kwa mhudumu ili kuunganishwa.', min: 'Malipo ya simu yanaanzia', choose: 'Chagua kifurushi kwanza.', offline: 'Router haipo hewani kwa sasa. Muda wako umehifadhiwa; muulize mhudumu.',
    notOnWifi: 'Unganisha kwenye mtandao wa Wi-Fi, kisha weka namba hii.', reconnect: 'Unganisha tena kwa', help: 'Msaada:', lang: 'English', open: 'Anza kutumia', terms: 'Kwa kuunganisha unakubali masharti ya matumizi.', readTerms: 'Masharti',
    preview: 'Hakikisho tu. Vitufe vinafanya kazi kwenye ukurasa halisi.',
  },
};

const STORE = 'incnet-last-code';

export function Portal(props: { slug: string; business: string; design: PortalDesign; payments: boolean; minPayment: number; packages: PortalPkg[]; ctx: PortalCtx; preview?: boolean }) {
  const { slug, ctx, design, preview } = props;
  const [lang, setLang] = useState<'en' | 'sw'>(design.lang);
  const t = T[lang];
  const [code, setCode] = useState(ctx.code ?? '');
  const [pkg, setPkg] = useState(props.packages[0]?.id ?? '');
  const [phone, setPhone] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(ctx.err);
  const [phase, setPhase] = useState<Phase>({ kind: 'idle' });
  const [saved, setSaved] = useState<string | null>(null);
  const [showTerms, setShowTerms] = useState(false);
  const handedOff = useRef(false);

  useEffect(() => setLang(design.lang), [design.lang]);
  useEffect(() => {
    if (preview) return;
    try { setSaved(localStorage.getItem(STORE)); } catch { /* storage blocked */ }
  }, [preview]);

  // Poll until the payment completes and the router has the code.
  useEffect(() => {
    if (phase.kind !== 'paying' && phase.kind !== 'syncing') return;
    const q = phase.kind === 'paying' ? `payment=${phase.paymentId}` : `access=${phase.accessId}`;
    const timer = setInterval(async () => {
      const res = await fetch(`/api/portal/${slug}/status?${q}`, { cache: 'no-store' }).catch(() => null);
      const data = res && (await res.json().catch(() => null));
      if (!data || data.error) return;
      if (data.state === 'failed') setPhase({ kind: 'failed', message: data.message });
      else if (data.state === 'syncing') setPhase((cur) => (cur.kind === 'syncing' && cur.accessId === data.accessId && cur.offline === !data.routerOnline ? cur : { kind: 'syncing', accessId: data.accessId, code: data.code, offline: !data.routerOnline }));
      else if (data.state === 'ready') setPhase({ kind: 'ready', code: data.code });
    }, 2000);
    return () => clearInterval(timer);
  }, [phase, slug]);

  // Ready: remember the code and hand the phone to the router.
  useEffect(() => {
    if (phase.kind !== 'ready' || handedOff.current) return;
    try { localStorage.setItem(STORE, phase.code); } catch { /* ignore */ }
    if (ctx.handoff.kind !== 'router') return;
    handedOff.current = true;
    const url = routerUrl(ctx.handoff.url, phase.code, ctx.dst);
    setTimeout(() => { window.location.href = url; }, 900);
  }, [phase, ctx.handoff, ctx.dst]);

  async function post(path: string, body: object) {
    if (preview) { setError(t.preview); return null; }
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/portal/${slug}/${path}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...body, mac: ctx.mac, ip: ctx.ip }) });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) { setError(data.error || 'Something went wrong. Try again.'); return null; }
      return data;
    } catch {
      setError('No connection. Check the Wi-Fi and try again.');
      return null;
    } finally {
      setBusy(false);
    }
  }

  async function redeem(value: string) {
    const data = await post('voucher', { code: value });
    if (data) setPhase({ kind: 'syncing', accessId: data.accessId, code: data.code });
  }

  async function pay() {
    if (!pkg) return setError(t.choose);
    const data = await post('pay', { packageId: pkg, phone });
    if (data) setPhase({ kind: 'paying', paymentId: data.paymentId });
  }

  const selected = props.packages.find((p) => p.id === pkg);
  const style = { '--accent': design.color, ...(design.theme === 'photo' && design.bg ? { '--bg-photo': `url("${design.bg}")` } : {}) } as React.CSSProperties;
  const showCode = phase.kind === 'syncing' || phase.kind === 'ready' ? phase.code : null;
  const readyText = ctx.handoff.kind === 'none' ? t.notOnWifi : t.readyText;

  return (
    <div className={`portal t-${design.theme}`} style={style}>
      <style>{PORTAL_CSS}</style>
      <div className="p-wrap">
        <header className="p-head">
          <div className="p-brand">
            {design.logo ? <img className="p-logo-img" src={design.logo} alt="" /> : <span className="p-logo">{props.business.slice(0, 1).toUpperCase()}</span>}
            <div><strong>{props.business}</strong><small>Wi-Fi</small></div>
          </div>
          <button type="button" className="p-lang" onClick={() => setLang(lang === 'en' ? 'sw' : 'en')}>{t.lang}</button>
        </header>
        {(design.headline || design.welcome) && (
          <div className="p-hero">
            {design.headline && <h1>{design.headline}</h1>}
            {design.welcome && <p>{design.welcome}</p>}
          </div>
        )}

        {phase.kind === 'idle' || phase.kind === 'failed' ? (
          <>
            {error && <p className="p-error" role="alert">{error}</p>}
            {phase.kind === 'failed' && <p className="p-error" role="alert">{phase.message}</p>}

            {saved && <button type="button" className="p-btn p-ghost" disabled={busy} onClick={() => redeem(saved)}>{t.reconnect} <b className="p-mono">{saved}</b></button>}

            <section className="p-card">
              <h2>{t.haveCode}</h2>
              <form onSubmit={(e) => { e.preventDefault(); redeem(code); }} className="p-inline">
                <input value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder={t.codePh} autoCapitalize="characters" autoComplete="off" spellCheck={false} className="p-mono" maxLength={16} aria-label={t.codePh} />
                <button className="p-btn" disabled={busy || code.length < 4}>{busy ? <span className="p-dots" /> : t.connect}</button>
              </form>
            </section>

            {props.packages.length > 0 && (
              <section className="p-card">
                <h2>{t.buy}</h2>
                <div className="p-pkgs" role="radiogroup" aria-label={t.buy}>
                  {props.packages.map((p) => (
                    <button key={p.id} role="radio" aria-checked={pkg === p.id} className={`p-pkg${pkg === p.id ? ' on' : ''}`} onClick={() => setPkg(p.id)} type="button">
                      <span className="p-radio" aria-hidden />
                      <span className="p-pkg-text"><strong>{p.name}</strong><small>{p.name.toLowerCase() === p.duration.toLowerCase() ? '' : `${p.duration} · `}{p.speed}{p.data ? ` · ${p.data}` : ''}</small></span>
                      <b>{p.priceLabel}</b>
                    </button>
                  ))}
                </div>
                {props.payments ? (
                  <form onSubmit={(e) => { e.preventDefault(); pay(); }} className="p-pay">
                    <label>{t.phone}<input value={phone} onChange={(e) => setPhone(e.target.value)} type="tel" inputMode="tel" placeholder="07XX XXX XXX" autoComplete="tel" /></label>
                    {selected && selected.price < props.minPayment && <p className="p-note">{t.min} TSh {props.minPayment}</p>}
                    <button className="p-btn p-big" disabled={busy}>{busy ? <span className="p-dots" /> : `${t.pay} ${selected?.priceLabel ?? ''}`}</button>
                    <p className="p-note">{t.with}</p>
                  </form>
                ) : <p className="p-note">{t.noPay}</p>}
              </section>
            )}
            {design.terms && (
              <p className="p-terms">{t.terms} <button type="button" className="p-link-inline" onClick={() => setShowTerms(!showTerms)}>{t.readTerms}</button></p>
            )}
            {showTerms && design.terms && <div className="p-card p-terms-box">{design.terms}</div>}
          </>
        ) : (
          <section className="p-card p-center" aria-live="polite">
            {phase.kind === 'paying' && <><div className="p-spin" /><h2>{t.paying}</h2><p>{t.payingText}</p></>}
            {phase.kind === 'syncing' && <><div className="p-spin" /><h2>{t.syncing}</h2><p>{phase.offline ? t.offline : t.syncingText}</p></>}
            {phase.kind === 'ready' && (
              <>
                <div className="p-check">✓</div>
                <h2>{t.ready}</h2>
                <p>{readyText}</p>
                {ctx.handoff.kind === 'router' && <a className="p-btn p-big" href={routerUrl(ctx.handoff.url, phase.code, ctx.dst)}>{t.open}</a>}
                {ctx.handoff.kind === 'gateway' && <a className="p-btn p-big" href={ctx.dst || 'http://neverssl.com'}>{t.open}</a>}
              </>
            )}
            {showCode && <div className="p-code"><small>{t.yourCode}</small><b className="p-mono">{showCode}</b><small>{t.keepCode}</small></div>}
            {phase.kind === 'paying' && <button type="button" className="p-link" onClick={() => setPhase({ kind: 'idle' })}>{t.tryAgain}</button>}
          </section>
        )}

        <footer className="p-foot">
          {design.supportPhone && <span>{t.help} <a href={`tel:${design.supportPhone}`}>{design.supportPhone}</a></span>}
          <span className="p-powered">Powered by incnet</span>
        </footer>
      </div>
    </div>
  );
}

function routerUrl(base: string, code: string, dst: string | null) {
  const params = new URLSearchParams({ username: code, password: code, dst: dst || '' });
  return `${base}${base.includes('?') ? '&' : '?'}${params}`;
}

/* System fonts only: phones cannot reach font services before they log in. */
const PORTAL_CSS = `
.portal{--ink:#14181a;--muted:#5f6b6d;--card:#fff;--line:#e3e8e6;--page:#f4f6f5;min-height:100vh;background:var(--page);color:var(--ink);font-family:system-ui,-apple-system,'Segoe UI',Roboto,sans-serif;font-size:15px;line-height:1.5}
.portal *{box-sizing:border-box}
.p-wrap{max-width:440px;margin:0 auto;padding:16px 16px 28px}
.p-head{display:flex;align-items:center;justify-content:space-between;margin-bottom:14px}
.p-brand{display:flex;align-items:center;gap:10px}.p-brand small{display:block;color:var(--muted);font-size:12px;line-height:1}
.p-logo{width:42px;height:42px;border-radius:12px;background:var(--accent);color:#fff;display:grid;place-items:center;font-weight:800;font-size:18px}
.p-logo-img{width:42px;height:42px;border-radius:12px;object-fit:contain;background:#fff}
.p-lang{border:1px solid var(--line);background:var(--card);border-radius:999px;padding:6px 12px;font:inherit;font-size:13px;color:var(--ink);cursor:pointer}
.p-hero{margin:4px 0 14px}.p-hero h1{font-size:24px;line-height:1.15;margin:0 0 6px;letter-spacing:-.02em}.p-hero p{margin:0;color:var(--muted)}
.p-card{background:var(--card);border:1px solid var(--line);border-radius:18px;padding:18px;margin-bottom:12px;box-shadow:0 6px 20px rgba(20,24,26,.05)}
.p-card h2{font-size:16px;margin:0 0 12px}
.p-inline{display:flex;gap:8px}.p-inline input{flex:1}
.portal input{width:100%;padding:13px 14px;border:1.5px solid var(--line);border-radius:12px;font:inherit;font-size:16px;background:var(--card);color:var(--ink)}
.portal input:focus{outline:none;border-color:var(--accent);box-shadow:0 0 0 3px color-mix(in srgb,var(--accent) 18%,transparent)}
.p-btn{display:inline-flex;align-items:center;justify-content:center;gap:6px;min-height:48px;padding:12px 18px;border:0;border-radius:12px;background:var(--accent);color:#fff;font:inherit;font-weight:700;font-size:16px;cursor:pointer;text-decoration:none;transition:filter .15s,transform .15s}
.p-btn:hover{filter:brightness(1.06)}.p-btn:active{transform:translateY(1px)}.p-btn:disabled{opacity:.5;cursor:not-allowed}
.p-big{width:100%;font-size:17px}
.p-ghost{width:100%;margin-bottom:12px;background:var(--card);color:var(--ink);border:1.5px dashed var(--accent)}
.p-pkgs{display:grid;gap:8px;margin-bottom:14px}
.p-pkg{display:flex;align-items:center;gap:12px;padding:13px 14px;border:1.5px solid var(--line);border-radius:14px;background:var(--card);text-align:left;font:inherit;color:var(--ink);cursor:pointer;transition:border-color .15s,background .15s}
.p-pkg-text{flex:1}.p-pkg small{display:block;color:var(--muted);font-size:13px}.p-pkg b{white-space:nowrap}
.p-radio{width:18px;height:18px;border-radius:50%;border:2px solid var(--line);flex:none;transition:all .15s}
.p-pkg.on{border-color:var(--accent);background:color-mix(in srgb,var(--accent) 7%,var(--card))}
.p-pkg.on .p-radio{border-color:var(--accent);box-shadow:inset 0 0 0 3px var(--card);background:var(--accent)}
.p-pay{display:grid;gap:10px}.p-pay label{display:grid;gap:6px;font-size:13px;color:var(--muted);font-weight:600}
.p-note{color:var(--muted);font-size:12.5px;text-align:center;margin:0}
.p-error{background:#fdecec;color:#a52a2a;border-radius:12px;padding:11px 13px;font-size:14px;margin:0 0 12px}
.p-center{text-align:center;padding:30px 20px}.p-center h2{font-size:21px;margin:14px 0 6px}.p-center p{color:var(--muted);margin:0 0 16px}
.p-spin{width:46px;height:46px;margin:0 auto;border-radius:50%;border:4px solid color-mix(in srgb,var(--accent) 18%,transparent);border-top-color:var(--accent);animation:p-spin .9s linear infinite}
.p-dots{width:18px;height:18px;border-radius:50%;border:2.5px solid rgba(255,255,255,.45);border-top-color:#fff;animation:p-spin .8s linear infinite}
@keyframes p-spin{to{transform:rotate(360deg)}}
.p-check{width:58px;height:58px;margin:0 auto;border-radius:50%;background:var(--accent);color:#fff;display:grid;place-items:center;font-size:28px;font-weight:800;animation:p-pop .35s ease-out}
@keyframes p-pop{from{transform:scale(.6);opacity:0}to{transform:scale(1);opacity:1}}
.p-code{margin-top:16px;padding:14px;border-radius:14px;background:color-mix(in srgb,var(--ink) 5%,transparent);display:grid;gap:4px}.p-code b{font-size:26px;letter-spacing:.12em}.p-code small{color:var(--muted);font-size:12px}
.p-mono{font-family:ui-monospace,Menlo,Consolas,monospace;letter-spacing:.06em}
.p-link{margin-top:14px;background:none;border:0;color:var(--accent);font:inherit;font-weight:600;cursor:pointer}
.p-terms{font-size:12.5px;color:var(--muted);text-align:center;margin:4px 0 10px}.p-link-inline{background:none;border:0;padding:0;color:var(--accent);font:inherit;font-weight:600;cursor:pointer;text-decoration:underline}
.p-terms-box{font-size:13px;color:var(--muted);white-space:pre-wrap}
.p-foot{display:flex;justify-content:space-between;gap:10px;color:var(--muted);font-size:12.5px;padding:6px 4px}.p-foot a{color:inherit;font-weight:600}
.p-powered{margin-left:auto;opacity:.7}

/* Classic: brand band across the top */
.t-classic .p-wrap{padding-top:0}
.t-classic .p-head{margin:0 -16px 0;padding:18px 16px 54px;background:var(--accent);color:#fff}
.t-classic .p-brand small{color:rgba(255,255,255,.8)}
.t-classic .p-lang{background:rgba(255,255,255,.18);border-color:rgba(255,255,255,.35);color:#fff}
.t-classic .p-hero{margin:-40px 0 12px;padding:16px 18px;background:var(--card);border-radius:18px;box-shadow:0 10px 30px rgba(20,24,26,.08)}
.t-classic .p-head + .p-card,.t-classic .p-head + .p-error,.t-classic .p-head + .p-ghost{margin-top:-40px;position:relative}
.t-classic .p-logo{background:#fff;color:var(--accent)}

/* Bold: dark, with a brand gradient */
.t-bold{--ink:#f2f5f4;--muted:#a7b3b1;--card:rgba(255,255,255,.06);--line:rgba(255,255,255,.12);--page:#0b0f10;background:radial-gradient(120% 60% at 50% 0%,color-mix(in srgb,var(--accent) 45%,#0b0f10),#0b0f10 70%)}
.t-bold .p-card{box-shadow:none;backdrop-filter:blur(6px)}
.t-bold .p-hero h1{font-size:28px}
.t-bold .p-error{background:rgba(214,69,69,.15);color:#ffb3b3}
.t-bold .p-pkg.on .p-radio{box-shadow:inset 0 0 0 3px #1a2022}

/* Minimal: plain and airy */
.t-minimal{--page:#fff}
.t-minimal .p-card{border:0;border-bottom:1px solid var(--line);border-radius:0;box-shadow:none;padding:18px 2px}
.t-minimal .p-btn{border-radius:999px}
.t-minimal .p-logo{border-radius:50%}

/* Photo: the venue's photo behind glass cards */
.t-photo{--ink:#fff;--muted:rgba(255,255,255,.85);--card:rgba(255,255,255,.14);--line:rgba(255,255,255,.3);position:relative;background:#111 var(--bg-photo) center/cover}
.t-photo::before{content:'';position:absolute;inset:0;background:linear-gradient(180deg,rgba(0,0,0,.25),rgba(0,0,0,.65));pointer-events:none}
.t-photo .p-wrap{position:relative}
.t-photo .p-card{backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px);box-shadow:0 10px 30px rgba(0,0,0,.25)}
.t-photo input{background:rgba(255,255,255,.94)!important;color:#14181a!important}
.t-photo .p-error{background:rgba(214,69,69,.85);color:#fff}
.t-photo .p-pkg.on{background:rgba(255,255,255,.26)}
.t-photo .p-pkg.on .p-radio{box-shadow:inset 0 0 0 3px #555}
.t-photo .p-hero h1{font-size:30px;text-shadow:0 2px 12px rgba(0,0,0,.35)}

@media (prefers-color-scheme:dark){
  .t-modern{--ink:#eef2f0;--muted:#9aa6a5;--card:#151a1b;--line:#283031;--page:#0d1011}
  .t-modern .p-pkg.on .p-radio{box-shadow:inset 0 0 0 3px #151a1b}
}
`;
