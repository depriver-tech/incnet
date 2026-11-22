import { ArrowRight, BarChart3, LayoutDashboard, Package, Router, Settings, Smartphone, Ticket } from 'lucide-react';

/**
 * A coded replica of the incnet dashboard for the landing page hero. Same tokens and shapes as
 * the real app, so it stays sharp at any size and follows light and dark mode. Decorative only.
 */
const BARS = [38, 52, 44, 61, 48, 70, 57, 66, 74, 59, 81, 72, 88, 95];
const PAYMENTS = [
  ['TSh 1,000', '1 day', '25571•••678', '2 min ago'],
  ['TSh 500', '1 hour', '25578•••736', '9 min ago'],
  ['TSh 5,000', '1 week', '25576•••242', '24 min ago'],
  ['TSh 500', '1 hour', '25571•••680', '41 min ago'],
];

export function HeroDashboard() {
  return (
    <div className="hd" aria-hidden>
      <aside className="hd-side">
        <div className="hd-logo"><img src="/logo.svg" alt="" /> incnet</div>
        {[[LayoutDashboard, 'Overview', true], [Router, 'Routers'], [Package, 'Packages'], [Ticket, 'Vouchers'], [Smartphone, 'Wi-Fi page'], [BarChart3, 'Sales'], [Settings, 'Settings']].map(([Icon, label, on]) => {
          const I = Icon as typeof Router;
          return <div key={label as string} className={`hd-nav${on ? ' on' : ''}`}><I size={14} /> {label as string}</div>;
        })}
      </aside>
      <div className="hd-main">
        <div className="hd-head">
          <div><div className="hd-h1">Good to see you</div><div className="hd-sub">Mlimani Café at a glance.</div></div>
          <div className="hd-btn">Make vouchers</div>
        </div>
        <div className="hd-stats">
          <div className="hd-card"><small>Sales today</small><strong>TSh 48,500</strong><span className="hd-up">↑ 18% vs yesterday</span></div>
          <div className="hd-card"><small>This month</small><strong>TSh 1.24M</strong><span>mobile money</span></div>
          <div className="hd-card"><small>Online now</small><strong>37</strong><span>across 3 routers</span></div>
          <div className="hd-card"><small>Vouchers used</small><strong>22</strong><span>today</span></div>
        </div>
        <div className="hd-grid">
          <div className="hd-left">
          <div className="hd-card hd-chart">
            <div className="hd-row"><b>Sales, last 14 days</b><span className="hd-muted">TSh 612,000</span></div>
            <div className="hd-bars">{BARS.map((h, i) => <i key={i} style={{ height: `${h}%`, animationDelay: `${i * 40}ms` }} />)}</div>
          </div>
          <div className="hd-card">
            <div className="hd-row"><b>Routers</b><span className="hd-muted">3</span></div>
            {[['Mlimani Café', 'MikroTik hAP ax²'], ['Garden Hostel', 'Raspberry Pi 5'], ['Kariakoo Shop', 'OpenWrt']].map(([n, t]) => (
              <div key={n} className="hd-item"><div><b>{n}</b><span>{t}</span></div><em className="hd-online"><i /> Online</em></div>
            ))}
          </div>
          <div className="hd-card hd-pay">
            <div className="hd-row"><b>Recent payments</b><span className="hd-muted">All sales <ArrowRight size={11} /></span></div>
            {PAYMENTS.map(([a, p, ph, t]) => (
              <div key={ph} className="hd-item"><div><b>{a}</b><span>{p} · {ph}</span></div><span className="hd-muted">{t}</span><em className="hd-paid">Paid</em></div>
            ))}
          </div>
          </div>
          <div className="hd-spacer" />
        </div>
      </div>
    </div>
  );
}
