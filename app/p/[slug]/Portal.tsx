'use client';

import { useEffect, useRef, useState } from 'react';

type Pkg = { id: string; name: string; price: number; priceLabel: string; duration: string; speed: string; data: string | null };
type Ctx = { mac: string | null; login: string | null; dst: string | null; err: string | null };
type Phase = { kind: 'idle' } | { kind: 'paying'; paymentId: string } | { kind: 'syncing'; accessId: string; code: string; offline?: boolean } | { kind: 'ready'; code: string } | { kind: 'failed'; message: string };

const T = {
  en: {
    haveCode: 'Have a voucher code?', codePh: 'Enter code', connect: 'Connect', buy: 'Buy a package', phone: 'Mobile money number', pay: 'Pay', with: 'M-Pesa · Mixx by Yas · Airtel Money · Halotel',
    paying: 'Check your phone', payingText: 'Enter your PIN on the prompt to pay. Keep this page open.', syncing: 'Connecting you…', syncingText: 'Your Wi-Fi is being switched on. This takes a few seconds.',
    ready: "You're connected", readyText: 'Enjoy the internet.', yourCode: 'Your code', keepCode: 'Keep this code to reconnect later or on another visit.', tryAgain: 'Try again',
    noPay: 'Buy a voucher from staff to get online.', min: 'Mobile money starts at', choose: 'Choose a package first.', offline: 'The router is offline right now. Your time is saved; ask staff for help.',
    notOnWifi: 'Connect to the Wi-Fi network, then enter this code to get online.', reconnect: 'Reconnect with', help: 'Need help? Call', lang: 'Kiswahili', open: 'Open the internet',
  },
  sw: {
    haveCode: 'Una vocha?', codePh: 'Weka namba ya vocha', connect: 'Unganisha', buy: 'Nunua kifurushi', phone: 'Namba ya simu ya kulipia', pay: 'Lipa', with: 'M-Pesa · Mixx by Yas · Airtel Money · Halotel',
    paying: 'Angalia simu yako', payingText: 'Weka PIN kwenye ujumbe ili kulipa. Usifunge ukurasa huu.', syncing: 'Tunakuunganisha…', syncingText: 'Wi-Fi yako inawashwa. Subiri sekunde chache.',
    ready: 'Umeunganishwa', readyText: 'Furahia intaneti.', yourCode: 'Namba yako', keepCode: 'Hifadhi namba hii ili kuunganisha tena baadaye.', tryAgain: 'Jaribu tena',
    noPay: 'Nunua vocha kwa mhudumu ili kuunganishwa.', min: 'Malipo ya simu yanaanzia', choose: 'Chagua kifurushi kwanza.', offline: 'Router haipo hewani kwa sasa. Muda wako umehifadhiwa; muulize mhudumu.',
    notOnWifi: 'Unganisha kwenye mtandao wa Wi-Fi, kisha weka namba hii.', reconnect: 'Unganisha tena kwa', help: 'Msaada? Piga', lang: 'English', open: 'Fungua intaneti',
  },
};

const STORE = 'incnet-last-code';

export function Portal(props: { slug: string; business: string; welcome: string | null; color: string; supportPhone: string | null; payments: boolean; minPayment: number; packages: Pkg[]; ctx: Ctx }) {
  const { slug, ctx } = props;
  const [lang, setLang] = useState<'en' | 'sw'>('en');
  const t = T[lang];
  const [code, setCode] = useState('');
  const [pkg, setPkg] = useState(props.packages[0]?.id ?? '');
  const [phone, setPhone] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(ctx.err);
  const [phase, setPhase] = useState<Phase>({ kind: 'idle' });
  const [saved, setSaved] = useState<string | null>(null);
  const loggedIn = useRef(false);

  useEffect(() => {
    try { setSaved(localStorage.getItem(STORE)); if (navigator.language?.startsWith('sw')) setLang('sw'); } catch { /* storage blocked */ }
  }, []);

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
    }, 2500);
    return () => clearInterval(timer);
  }, [phase, slug]);

  // Ready: remember the code and log the phone in on the router.
  useEffect(() => {
    if (phase.kind !== 'ready' || loggedIn.current) return;
    try { localStorage.setItem(STORE, phase.code); } catch { /* ignore */ }
    if (!ctx.login) return;
    loggedIn.current = true;
    const params = new URLSearchParams({ username: phase.code, password: phase.code, dst: ctx.dst || '' });
    setTimeout(() => { window.location.href = `${ctx.login}?${params}`; }, 900);
  }, [phase, ctx.login, ctx.dst]);

  async function post(path: string, body: object) {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/portal/${slug}/${path}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...body, mac: ctx.mac }) });
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

  const style = { '--accent': props.color, '--accent-ink': '#fff' } as React.CSSProperties;
  const showCode = phase.kind === 'syncing' || phase.kind === 'ready' ? phase.code : null;

  return (
    <div className="portal" style={style}>
      <style>{PORTAL_CSS}</style>
      <header>
        <div className="p-brand"><span className="p-logo">{props.business.slice(0, 1).toUpperCase()}</span><div><strong>{props.business}</strong><small>Wi-Fi</small></div></div>
        <button className="p-lang" onClick={() => setLang(lang === 'en' ? 'sw' : 'en')}>{t.lang}</button>
      </header>
      {props.welcome && <p className="p-welcome">{props.welcome}</p>}

      {phase.kind === 'idle' || phase.kind === 'failed' ? (
        <>
          {error && <p className="p-error" role="alert">{error}</p>}
          {phase.kind === 'failed' && <p className="p-error" role="alert">{phase.message}</p>}

          {saved && (
            <button className="p-btn p-ghost" disabled={busy} onClick={() => redeem(saved)}>{t.reconnect} <b className="p-mono">{saved}</b></button>
          )}

          <section className="p-card">
            <h2>{t.haveCode}</h2>
            <form onSubmit={(e) => { e.preventDefault(); redeem(code); }} className="p-inline">
              <input value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder={t.codePh} autoCapitalize="characters" autoComplete="off" spellCheck={false} className="p-mono" maxLength={16} required />
              <button className="p-btn" disabled={busy || code.length < 4}>{t.connect}</button>
            </form>
          </section>

          <section className="p-card">
            <h2>{t.buy}</h2>
            <div className="p-pkgs" role="radiogroup">
              {props.packages.map((p) => (
                <button key={p.id} role="radio" aria-checked={pkg === p.id} className={`p-pkg${pkg === p.id ? ' on' : ''}`} onClick={() => setPkg(p.id)} type="button">
                  <span><strong>{p.name}</strong><small>{p.name.toLowerCase() === p.duration.toLowerCase() ? '' : `${p.duration} · `}{p.speed}{p.data ? ` · ${p.data}` : ''}</small></span>
                  <b>{p.priceLabel}</b>
                </button>
              ))}
            </div>
            {props.payments ? (
              <form onSubmit={(e) => { e.preventDefault(); pay(); }} className="p-pay">
                <label>{t.phone}<input value={phone} onChange={(e) => setPhone(e.target.value)} type="tel" inputMode="tel" placeholder="07XX XXX XXX" autoComplete="tel" required /></label>
                {(() => { const sel = props.packages.find((p) => p.id === pkg); return sel && sel.price < props.minPayment ? <p className="p-note">{t.min} TSh {props.minPayment}</p> : null; })()}
                <button className="p-btn p-big" disabled={busy}>{t.pay} {props.packages.find((p) => p.id === pkg)?.priceLabel ?? ''}</button>
                <p className="p-note">{t.with}</p>
              </form>
            ) : <p className="p-note">{t.noPay}</p>}
          </section>
        </>
      ) : (
        <section className="p-card p-center">
          {phase.kind === 'paying' && <><div className="p-spin" /><h2>{t.paying}</h2><p>{t.payingText}</p></>}
          {phase.kind === 'syncing' && <><div className="p-spin" /><h2>{t.syncing}</h2><p>{phase.offline ? t.offline : t.syncingText}</p></>}
          {phase.kind === 'ready' && <><div className="p-check">✓</div><h2>{t.ready}</h2><p>{ctx.login ? t.readyText : t.notOnWifi}</p>{ctx.login && <a className="p-btn p-big" href={`${ctx.login}?${new URLSearchParams({ username: phase.code, password: phase.code, dst: ctx.dst || '' })}`}>{t.open}</a>}</>}
          {showCode && <div className="p-code"><small>{t.yourCode}</small><b className="p-mono">{showCode}</b><small>{t.keepCode}</small></div>}
          {phase.kind === 'paying' && <button className="p-link" onClick={() => setPhase({ kind: 'idle' })}>{t.tryAgain}</button>}
        </section>
      )}

      <footer>
        {props.supportPhone && <span>{t.help} <a href={`tel:${props.supportPhone}`}>{props.supportPhone}</a></span>}
        <span className="p-powered">incnet</span>
      </footer>
    </div>
  );
}

/* System fonts only: phones cannot reach font services before they log in. */
const PORTAL_CSS = `
body{background:#f4f6f5}
.portal{max-width:440px;margin:0 auto;padding:16px 16px 28px;font-family:system-ui,-apple-system,'Segoe UI',Roboto,sans-serif;color:#14181a}
.portal header{display:flex;align-items:center;justify-content:space-between;margin-bottom:12px}
.p-brand{display:flex;align-items:center;gap:10px}.p-brand small{display:block;color:#5f6b6d;font-size:12px;line-height:1}
.p-logo{width:40px;height:40px;border-radius:12px;background:var(--accent);color:#fff;display:grid;place-items:center;font-weight:800;font-size:18px}
.p-lang{border:1px solid #dfe4e2;background:#fff;border-radius:999px;padding:6px 12px;font:inherit;font-size:13px;color:#14181a}
.p-welcome{color:#4b5759;margin:0 0 12px}
.p-card{background:#fff;border:1px solid #e3e8e6;border-radius:18px;padding:18px;margin-bottom:12px;box-shadow:0 6px 20px rgba(20,24,26,.05)}
.p-card h2{font-size:17px;margin:0 0 12px}
.p-inline{display:flex;gap:8px}.p-inline input{flex:1}
.portal input{width:100%;padding:13px 14px;border:1.5px solid #dfe4e2;border-radius:12px;font:inherit;font-size:16px;background:#fff;color:#14181a}
.portal input:focus{outline:none;border-color:var(--accent)}
.p-btn{display:inline-flex;align-items:center;justify-content:center;gap:6px;padding:13px 18px;border:0;border-radius:12px;background:var(--accent);color:#fff;font:inherit;font-weight:700;font-size:16px;cursor:pointer;text-decoration:none}
.p-btn:disabled{opacity:.5}
.p-big{width:100%;padding:15px;font-size:17px}
.p-ghost{width:100%;margin-bottom:12px;background:#fff;color:#14181a;border:1.5px dashed var(--accent)}
.p-pkgs{display:grid;gap:8px;margin-bottom:14px}
.p-pkg{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:13px 14px;border:1.5px solid #e3e8e6;border-radius:14px;background:#fff;text-align:left;font:inherit;color:#14181a;cursor:pointer}
.p-pkg small{display:block;color:#5f6b6d;font-size:13px}.p-pkg b{white-space:nowrap}
.p-pkg.on{border-color:var(--accent);background:color-mix(in srgb,var(--accent) 8%,#fff);box-shadow:0 0 0 1px var(--accent)}
.p-pay{display:grid;gap:10px}.p-pay label{display:grid;gap:6px;font-size:13px;color:#4b5759;font-weight:600}
.p-note{color:#5f6b6d;font-size:12.5px;text-align:center;margin:0}
.p-error{background:#fdecec;color:#a52a2a;border-radius:12px;padding:11px 13px;font-size:14px;margin:0 0 12px}
.p-center{text-align:center;padding:30px 20px}.p-center h2{font-size:21px;margin:14px 0 6px}.p-center p{color:#4b5759;margin:0 0 16px}
.p-spin{width:44px;height:44px;margin:0 auto;border-radius:50%;border:4px solid color-mix(in srgb,var(--accent) 20%,#fff);border-top-color:var(--accent);animation:p-spin 0.9s linear infinite}
@keyframes p-spin{to{transform:rotate(360deg)}}
.p-check{width:56px;height:56px;margin:0 auto;border-radius:50%;background:var(--accent);color:#fff;display:grid;place-items:center;font-size:28px;font-weight:800}
.p-code{margin-top:16px;padding:14px;border-radius:14px;background:#f4f6f5;display:grid;gap:4px}.p-code b{font-size:26px;letter-spacing:.12em}.p-code small{color:#5f6b6d;font-size:12px}
.p-mono{font-family:ui-monospace,Menlo,Consolas,monospace;letter-spacing:.06em}
.p-link{margin-top:14px;background:none;border:0;color:var(--accent);font:inherit;font-weight:600;cursor:pointer}
.portal footer{display:flex;justify-content:space-between;gap:10px;color:#7a8587;font-size:12.5px;padding:6px 4px}.portal footer a{color:inherit;font-weight:600}
.p-powered{margin-left:auto;opacity:.7}
@media (prefers-color-scheme:dark){body{background:#0d1011}.portal{color:#eef2f0}.p-card,.p-pkg,.p-lang,.portal input,.p-ghost{background:#151a1b;border-color:#283031;color:#eef2f0}.p-pkg.on{background:color-mix(in srgb,var(--accent) 14%,#151a1b)}.p-code{background:#1c2223}.p-welcome,.p-center p,.p-pay label{color:#a9b4b3}.p-pkg small,.p-note,.p-brand small{color:#9aa6a5}}
`;
