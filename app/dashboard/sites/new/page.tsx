import { requirePage } from '@/lib/auth';
import { NewSiteForm } from './NewSiteForm';

export const metadata = { title: 'Add router' };

export default async function NewSite() {
  await requirePage('routers.manage');
  return (
    <>
      <div className="page-head"><div><h1>Add a router</h1><p>Pick your hardware. incnet writes the setup for you.</p></div></div>
      <div className="grid" style={{ gridTemplateColumns: 'minmax(0, 1.5fr) minmax(260px, 1fr)', alignItems: 'start' }}>
        <section className="card card-pad"><NewSiteForm /></section>
        <section className="card card-pad stack" style={{ gap: 12 }}>
          <h2 style={{ fontSize: 16 }}>Good to know</h2>
          <ul className="muted small" style={{ paddingLeft: 18, display: 'grid', gap: 8 }}>
            <li>No VPN, public IP or port forwarding is needed. Your router calls incnet, so it works behind any internet provider, even on mobile data.</li>
            <li>Access points of any brand work. Set them to AP (bridge) mode with DHCP off.</li>
            <li>Not ready with hardware? Start with the Simulator. Everything you set up (packages, vouchers, the Wi-Fi page) carries over.</li>
          </ul>
        </section>
      </div>
    </>
  );
}
