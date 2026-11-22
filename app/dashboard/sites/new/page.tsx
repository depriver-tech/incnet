import { ActionForm, Submit } from '@/components/ActionForm';
import { createSite } from '@/lib/actions';

export const metadata = { title: 'Add router' };

export default function NewSite() {
  return (
    <>
      <div className="page-head"><div><h1>Add a router</h1><p>Two details, then you get one script to paste into the MikroTik.</p></div></div>
      <div className="grid grid-2">
        <section className="card card-pad">
          <ActionForm action={createSite}>
            <label className="field">Venue name
              <input name="name" placeholder="Mlimani Café" required autoFocus />
            </label>
            <label className="field">Ports for the Wi-Fi access points
              <input name="ports" defaultValue="ether5" placeholder="ether5, ether6" />
              <span className="hint">The router ports your access points are plugged into. They will serve the hotspot only, so do not include the port you manage the router from.</span>
            </label>
            <details>
              <summary className="muted small" style={{ cursor: 'pointer' }}>Advanced</summary>
              <label className="field" style={{ marginTop: 10 }}>Hotspot network
                <div className="row" style={{ flexWrap: 'nowrap' }}><span className="mono">10.5.</span><input name="subnet" type="number" min={1} max={254} defaultValue={50} style={{ width: 90 }} /><span className="mono">.0/24</span></div>
                <span className="hint">Change only if 10.5.50.0/24 is already used on this router.</span>
              </label>
            </details>
            <div><Submit pending="Creating…">Create and get the script</Submit></div>
          </ActionForm>
        </section>
        <section className="card card-pad stack">
          <h2 style={{ fontSize: 16 }}>What you need</h2>
          <ul className="muted" style={{ paddingLeft: 18, display: 'grid', gap: 6 }}>
            <li>A MikroTik router on RouterOS 7 with internet.</li>
            <li>Access points (any brand) in AP or bridge mode, cabled to the ports above.</li>
            <li>WinBox, WebFig or SSH to open the router terminal.</li>
          </ul>
          <p className="muted small">No VPN, public IP or port forwarding is needed. The router calls incnet, so it works behind any internet provider.</p>
        </section>
      </div>
    </>
  );
}
