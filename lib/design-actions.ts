'use server';

import { revalidatePath } from 'next/cache';
import type { FormState } from './actions';
import { requireAction } from './auth';
import { audit } from './audit';
import { PermissionError } from './permissions';
import { db } from './db';
import { MAX_BG_BYTES, MAX_LOGO_BYTES, isTheme, isVoucherTemplate, validImage, voucherOptions } from './design';

const field = (fd: FormData, name: string) => String(fd.get(name) ?? '').trim();

/** Saves the captive portal design. An empty image field keeps the saved image; "remove" clears it. */
export async function savePortalDesign(_: FormState, fd: FormData): Promise<FormState> {
  const ctx = await requireAction('portal.design').catch((e) => e);
  if (ctx instanceof PermissionError) return { error: ctx.message };
  const { workspace } = ctx;
  const theme = field(fd, 'theme');
  if (!isTheme(theme)) return { error: 'Choose a template.' };
  const color = field(fd, 'brandColor');
  if (!/^#[0-9a-fA-F]{6}$/.test(color)) return { error: 'Pick a colour.' };

  const image = (name: string, max: number, current: string | null) => {
    const v = field(fd, name);
    if (v === 'remove') return null;
    if (!v) return current;
    if (!validImage(v, max)) throw new Error(`That image is too large. Use one under ${Math.round(max / 1000)} KB.`);
    return v;
  };
  let portalLogo: string | null;
  let portalBg: string | null;
  try {
    portalLogo = image('logo', MAX_LOGO_BYTES, workspace.portalLogo);
    portalBg = image('background', MAX_BG_BYTES, workspace.portalBg);
  } catch (err) {
    return { error: (err as Error).message };
  }
  if (theme === 'photo' && !portalBg) return { error: 'The Photo template needs a background photo.' };

  await db.workspace.update({
    where: { id: workspace.id },
    data: {
      portalTheme: theme,
      brandColor: color,
      portalLogo,
      portalBg,
      portalHeadline: field(fd, 'headline').slice(0, 80) || null,
      welcomeText: field(fd, 'welcome').slice(0, 200) || null,
      termsText: field(fd, 'terms').slice(0, 600) || null,
      portalLang: field(fd, 'lang') === 'sw' ? 'sw' : 'en',
      supportPhone: field(fd, 'supportPhone').slice(0, 30) || null,
    },
  });
  await audit(ctx, 'design.portal', `Template: ${theme}`);
  revalidatePath('/dashboard', 'layout');
  return { ok: 'Saved. Phones on your Wi-Fi see the new design right away.' };
}

export async function saveVoucherDesign(_: FormState, fd: FormData): Promise<FormState> {
  const ctx = await requireAction('vouchers.design').catch((e) => e);
  if (ctx instanceof PermissionError) return { error: ctx.message };
  const { workspace } = ctx;
  const template = field(fd, 'template');
  if (!isVoucherTemplate(template)) return { error: 'Choose a template.' };
  const options = voucherOptions({
    perRow: Number(field(fd, 'perRow')),
    showPrice: fd.get('showPrice') === 'on',
    showSpeed: fd.get('showSpeed') === 'on',
    showQr: fd.get('showQr') === 'on',
    showLogo: fd.get('showLogo') === 'on',
    showSteps: fd.get('showSteps') === 'on',
    ssid: field(fd, 'ssid'),
    footer: field(fd, 'footer'),
  });
  await db.workspace.update({ where: { id: workspace.id }, data: { voucherTemplate: template, voucherOptions: options } });
  await audit(ctx, 'design.vouchers', `Template: ${template}`);
  revalidatePath('/dashboard/vouchers', 'layout');
  return { ok: 'Saved. Every voucher sheet now prints with this design.' };
}
