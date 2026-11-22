/** Captive portal themes and voucher templates. Shared by the dashboard designers, the portal and the print sheet. */

export const PORTAL_THEMES = [
  { id: 'modern', name: 'Modern', note: 'Light cards, soft shadows' },
  { id: 'classic', name: 'Classic', note: 'Brand-colour header band' },
  { id: 'bold', name: 'Bold', note: 'Dark, with a brand gradient' },
  { id: 'minimal', name: 'Minimal', note: 'Plain white, lots of space' },
  { id: 'photo', name: 'Photo', note: 'Your photo behind glass cards' },
] as const;
export type PortalTheme = (typeof PORTAL_THEMES)[number]['id'];

export const VOUCHER_TEMPLATES = [
  { id: 'classic', name: 'Classic', note: 'Dashed cut-out cards' },
  { id: 'ticket', name: 'Ticket', note: 'Brand stub and perforation' },
  { id: 'card', name: 'Card', note: 'Full brand-colour cards' },
  { id: 'minimal', name: 'Minimal', note: 'Ink-saving, code first' },
] as const;
export type VoucherTemplate = (typeof VOUCHER_TEMPLATES)[number]['id'];

export type VoucherOptions = {
  perRow: number;
  showPrice: boolean;
  showSpeed: boolean;
  showQr: boolean;
  showLogo: boolean;
  showSteps: boolean;
  ssid: string;
  footer: string;
};

export const DEFAULT_VOUCHER_OPTIONS: VoucherOptions = { perRow: 4, showPrice: true, showSpeed: true, showQr: true, showLogo: true, showSteps: true, ssid: '', footer: '' };

export function voucherOptions(raw: unknown): VoucherOptions {
  const o = (raw && typeof raw === 'object' ? raw : {}) as Partial<VoucherOptions>;
  const bool = (v: unknown, d: boolean) => (typeof v === 'boolean' ? v : d);
  return {
    perRow: [2, 3, 4, 5].includes(Number(o.perRow)) ? Number(o.perRow) : DEFAULT_VOUCHER_OPTIONS.perRow,
    showPrice: bool(o.showPrice, true),
    showSpeed: bool(o.showSpeed, true),
    showQr: bool(o.showQr, true),
    showLogo: bool(o.showLogo, true),
    showSteps: bool(o.showSteps, true),
    ssid: typeof o.ssid === 'string' ? o.ssid.slice(0, 32) : '',
    footer: typeof o.footer === 'string' ? o.footer.slice(0, 80) : '',
  };
}

export const isTheme = (v: string): v is PortalTheme => PORTAL_THEMES.some((t) => t.id === v);
export const isVoucherTemplate = (v: string): v is VoucherTemplate => VOUCHER_TEMPLATES.some((t) => t.id === v);

/** Images are stored inline; keep them small. */
export const MAX_LOGO_BYTES = 120_000;
export const MAX_BG_BYTES = 450_000;
export function validImage(value: string, max: number) {
  return /^data:image\/(png|jpeg|webp|svg\+xml);base64,[A-Za-z0-9+/=]+$/.test(value) && value.length <= max * 1.37;
}
