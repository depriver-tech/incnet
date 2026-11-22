import type { VoucherOptions } from '@/lib/design';

export type VoucherData = { code: string; used?: boolean; qrSvg?: string | null };
export type VoucherInfo = { business: string; site: string; color: string; logo: string | null; packageName: string; price: string; duration: string; speed: string };

/** One printable sheet of vouchers in the chosen template. Used by the print page and the designer preview. */
export function VoucherSheet({ template, options, info, vouchers }: { template: string; options: VoucherOptions; info: VoucherInfo; vouchers: VoucherData[] }) {
  return (
    <div className={`vsheet vt-${template}`} style={{ '--v-accent': info.color, gridTemplateColumns: `repeat(${options.perRow}, 1fr)` } as React.CSSProperties}>
      {vouchers.map((v) => (
        <div key={v.code} className="vcard" style={{ opacity: v.used ? 0.35 : 1 }}>
          <div className="v-stub">
            {options.showLogo && (info.logo ? <img src={info.logo} alt="" className="v-logo" /> : <span className="v-mark">{info.business.slice(0, 1).toUpperCase()}</span>)}
            <div className="v-title"><strong>{info.business}</strong><span>Wi-Fi voucher</span></div>
          </div>
          <div className="v-body">
            <div className="v-main">
              <div className="v-label">Code</div>
              <div className="v-code">{v.code}</div>
              <div className="v-meta">
                <b>{info.packageName}</b>
                {options.showPrice && <span>{info.price}</span>}
                {info.duration.toLowerCase() !== info.packageName.toLowerCase() && <span>{info.duration}</span>}
                {options.showSpeed && <span>{info.speed}</span>}
              </div>
            </div>
            {options.showQr && v.qrSvg && <div className="v-qr" dangerouslySetInnerHTML={{ __html: v.qrSvg }} />}
          </div>
          {(options.showSteps || options.footer) && (
            <div className="v-foot">
              {options.showSteps && <span>1. Join {options.ssid ? <b>{options.ssid}</b> : 'the Wi-Fi'} · 2. Enter the code{options.showQr ? ' or scan' : ''}</span>}
              {options.footer && <span className="v-extra">{options.footer}</span>}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
