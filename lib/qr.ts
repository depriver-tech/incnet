import QRCode from 'qrcode';

/** A small SVG QR code. Works on the server and in the browser. */
export function qrSvg(text: string) {
  return QRCode.toString(text, { type: 'svg', margin: 0, errorCorrectionLevel: 'M', color: { dark: '#111111', light: '#ffffff' } });
}

/** Scanning a voucher opens the Wi-Fi page with the code already filled in. */
export const voucherUrl = (appUrl: string, slug: string, code: string) => `${appUrl}/p/${slug}?code=${code}`;
