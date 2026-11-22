'use client';

import { ImagePlus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { ActionForm, Submit } from '@/components/ActionForm';
import { Portal, type PortalDesign, type PortalPkg } from '@/app/p/[slug]/Portal';
import { PORTAL_THEMES } from '@/lib/design';
import { savePortalDesign } from '@/lib/design-actions';

/** Shrinks a picked image in the browser so it can be stored inline (logo ~256px PNG, photo ~1200px JPEG). */
function shrink(file: File, max: number, type: 'image/png' | 'image/jpeg', quality = 0.78): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, max / Math.max(img.width, img.height));
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL(type, quality));
      URL.revokeObjectURL(img.src);
    };
    img.onerror = () => reject(new Error('That file is not an image.'));
    img.src = URL.createObjectURL(file);
  });
}

const SWATCHES = ['#0f9d8f', '#2563eb', '#7c3aed', '#db2777', '#ea580c', '#16a34a', '#0f172a', '#b45309'];

export function PortalDesigner({ business, design: d0, packages, slug }: { business: string; design: PortalDesign; packages: PortalPkg[]; slug: string }) {
  const [d, setD] = useState(d0);
  const [logoField, setLogoField] = useState('');
  const [bgField, setBgField] = useState('');
  const [imgError, setImgError] = useState<string | null>(null);
  const set = <K extends keyof PortalDesign>(k: K, v: PortalDesign[K]) => setD((cur) => ({ ...cur, [k]: v }));

  async function pick(kind: 'logo' | 'bg', file?: File | null) {
    if (!file) return;
    setImgError(null);
    try {
      const url = kind === 'logo' ? await shrink(file, 256, 'image/png') : await shrink(file, 1200, 'image/jpeg');
      if (kind === 'logo') { set('logo', url); setLogoField(url); } else { set('bg', url); setBgField(url); if (d.theme !== 'photo') set('theme', 'photo'); }
    } catch (e) {
      setImgError((e as Error).message);
    }
  }

  return (
    <div className="designer">
      <section className="card card-pad">
        <ActionForm action={savePortalDesign}>
          <input type="hidden" name="theme" value={d.theme} />
          <input type="hidden" name="logo" value={logoField} />
          <input type="hidden" name="background" value={bgField} />
          <input type="hidden" name="brandColor" value={d.color} />
          <input type="hidden" name="lang" value={d.lang} />

          <div className="field-label">Template</div>
          <div className="choice-grid">
            {PORTAL_THEMES.map((t) => (
              <button key={t.id} type="button" className={`choice theme-choice${d.theme === t.id ? ' on' : ''}`} onClick={() => set('theme', t.id)} aria-pressed={d.theme === t.id}>
                <span className={`theme-swatch ts-${t.id}`} style={{ '--c': d.color } as React.CSSProperties} aria-hidden />
                <strong>{t.name}</strong><span>{t.note}</span>
              </button>
            ))}
          </div>

          <div className="field-label">Brand colour</div>
          <div className="row" style={{ gap: 8 }}>
            {SWATCHES.map((c) => <button key={c} type="button" className={`swatch${d.color === c ? ' on' : ''}`} style={{ background: c }} onClick={() => set('color', c)} aria-label={`Colour ${c}`} />)}
            <input type="color" value={d.color} onChange={(e) => set('color', e.target.value)} aria-label="Custom colour" style={{ width: 44, height: 34, padding: 2 }} />
          </div>

          <div className="form-row">
            <div className="field"><span>Logo</span>
              <div className="row">
                <label className="btn btn-ghost btn-sm"><ImagePlus size={14} /> {d.logo ? 'Change' : 'Upload'}<input type="file" accept="image/*" hidden onChange={(e) => pick('logo', e.target.files?.[0])} /></label>
                {d.logo && <button type="button" className="btn btn-ghost btn-sm" onClick={() => { set('logo', null); setLogoField('remove'); }}><Trash2 size={14} /></button>}
              </div>
            </div>
            <div className="field"><span>Background photo</span>
              <div className="row">
                <label className="btn btn-ghost btn-sm"><ImagePlus size={14} /> {d.bg ? 'Change' : 'Upload'}<input type="file" accept="image/*" hidden onChange={(e) => pick('bg', e.target.files?.[0])} /></label>
                {d.bg && <button type="button" className="btn btn-ghost btn-sm" onClick={() => { set('bg', null); setBgField('remove'); if (d.theme === 'photo') set('theme', 'modern'); }}><Trash2 size={14} /></button>}
              </div>
            </div>
          </div>
          {imgError && <p className="error">{imgError}</p>}

          <label className="field">Headline<input name="headline" value={d.headline ?? ''} onChange={(e) => set('headline', e.target.value || null)} placeholder="Fast Wi-Fi for our guests" maxLength={80} /></label>
          <label className="field">Welcome message<input name="welcome" value={d.welcome ?? ''} onChange={(e) => set('welcome', e.target.value || null)} placeholder="Pick a package or enter your voucher." maxLength={200} /></label>
          <div className="form-row">
            <label className="field">Support phone<input name="supportPhone" value={d.supportPhone ?? ''} onChange={(e) => set('supportPhone', e.target.value || null)} placeholder="0712 345 678" /></label>
            <label className="field">Default language
              <select value={d.lang} onChange={(e) => set('lang', e.target.value === 'sw' ? 'sw' : 'en')}><option value="en">English</option><option value="sw">Kiswahili</option></select>
            </label>
          </div>
          <label className="field">Terms of use (optional)<textarea name="terms" value={d.terms ?? ''} onChange={(e) => set('terms', e.target.value || null)} placeholder="Fair use applies. Illegal downloads are not allowed." maxLength={600} /></label>
          <div><Submit>Save design</Submit></div>
        </ActionForm>
      </section>

      <section className="stack" style={{ gap: 10, justifyItems: 'center' }}>
        <div className="sim-phone" aria-label="Preview">
          <div className="sim-notch" />
          <div className="phone-scroll">
            <Portal preview slug={slug} business={business} design={d} payments minPayment={0} packages={packages} ctx={{ mac: null, ip: null, handoff: { kind: 'none' }, dst: null, err: null, code: null }} />
          </div>
        </div>
        <p className="muted small">Live preview. Buttons only work on the real page.</p>
      </section>
    </div>
  );
}
