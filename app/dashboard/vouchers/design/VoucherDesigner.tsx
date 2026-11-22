'use client';

import { useEffect, useState } from 'react';
import { ActionForm, Submit } from '@/components/ActionForm';
import { VoucherSheet, type VoucherInfo } from '@/components/VoucherSheet';
import { VOUCHER_TEMPLATES, type VoucherOptions } from '@/lib/design';
import { saveVoucherDesign } from '@/lib/design-actions';
import { qrSvg } from '@/lib/qr';

const SAMPLE = ['H7KM3QXP', 'R2WD8NTA', 'C9PL4ZEY', 'M5TB2KUF', 'X3NG7VHD', 'J8QR6WSE', 'Z4FY9KCM', 'B6UA3TPR'];

export function VoucherDesigner({ template: t0, options: o0, info, sampleUrl }: { template: string; options: VoucherOptions; info: VoucherInfo; sampleUrl: string }) {
  const [template, setTemplate] = useState(t0);
  const [o, setO] = useState(o0);
  const [qr, setQr] = useState<string | null>(null);
  useEffect(() => { qrSvg(sampleUrl).then(setQr).catch(() => setQr(null)); }, [sampleUrl]);
  const set = <K extends keyof VoucherOptions>(k: K, v: VoucherOptions[K]) => setO((cur) => ({ ...cur, [k]: v }));
  const check = (k: 'showPrice' | 'showSpeed' | 'showQr' | 'showLogo' | 'showSteps', label: string) => (
    <label className="check"><input type="checkbox" name={k} checked={o[k]} onChange={(e) => set(k, e.target.checked)} /> {label}</label>
  );

  return (
    <div className="designer">
      <section className="card card-pad">
        <ActionForm action={saveVoucherDesign}>
          <input type="hidden" name="template" value={template} />
          <div className="field-label">Template</div>
          <div className="choice-grid">
            {VOUCHER_TEMPLATES.map((v) => (
              <button key={v.id} type="button" className={`choice${template === v.id ? ' on' : ''}`} onClick={() => setTemplate(v.id)} aria-pressed={template === v.id}>
                <strong>{v.name}</strong><span>{v.note}</span>
              </button>
            ))}
          </div>
          <label className="field">Vouchers per row
            <select name="perRow" value={o.perRow} onChange={(e) => set('perRow', Number(e.target.value))}>
              {[2, 3, 4, 5].map((n) => <option key={n} value={n}>{n} per row{n === 4 ? ' (A4, 40 per page)' : ''}</option>)}
            </select>
          </label>
          <div className="checks">
            {check('showLogo', 'Logo')}
            {check('showPrice', 'Price')}
            {check('showSpeed', 'Speed')}
            {check('showQr', 'QR code')}
            {check('showSteps', 'How to connect')}
          </div>
          <label className="field">Wi-Fi name (optional)<input name="ssid" value={o.ssid} onChange={(e) => set('ssid', e.target.value)} placeholder="Mlimani Café Wi-Fi" maxLength={32} /></label>
          <label className="field">Footer line (optional)<input name="footer" value={o.footer} onChange={(e) => set('footer', e.target.value)} placeholder="Valid 30 days from purchase. No refunds." maxLength={80} /></label>
          <p className="muted small">The logo and colour come from your Wi-Fi page design. Scanning the QR code opens the Wi-Fi page with the code filled in.</p>
          <div><Submit>Save design</Submit></div>
        </ActionForm>
      </section>
      <section className="card">
        <div className="card-head"><h2>Preview</h2><span className="muted small">Sample codes</span></div>
        <div className="card-pad preview-paper">
          <VoucherSheet template={template} options={o} info={info} vouchers={SAMPLE.slice(0, o.perRow * 2).map((code) => ({ code, qrSvg: qr }))} />
        </div>
      </section>
    </div>
  );
}
