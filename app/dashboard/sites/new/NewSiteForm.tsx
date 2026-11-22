'use client';

import { Cpu, FlaskConical, Router } from 'lucide-react';
import { useState } from 'react';
import { ActionForm, Submit } from '@/components/ActionForm';
import { createSite } from '@/lib/actions';

const KINDS = [
  { id: 'mikrotik', icon: Router, title: 'MikroTik', text: 'Any MikroTik on RouterOS 7. Paste one script into the terminal.', port: 'ether5', portLabel: 'Ports for the Wi-Fi access points', portHint: 'The router ports your access points are plugged into. They will serve the hotspot only, so leave out the port you manage the router from.' },
  { id: 'opennds', icon: Cpu, title: 'Raspberry Pi or OpenWrt', text: 'Turn a Pi or an OpenWrt router into a hotspot with one command.', port: 'wlan0', portLabel: 'Hotspot interface', portHint: 'wlan0 makes the Pi’s own Wi-Fi the hotspot. Use eth1 for a USB network adapter going to an access point. On OpenWrt, br-lan is used.' },
  { id: 'simulated', icon: FlaskConical, title: 'Simulator', text: 'No hardware. Try the full flow in your browser, with a virtual router and phone.', port: 'sim0', portLabel: '', portHint: '' },
] as const;

export function NewSiteForm() {
  const [kind, setKind] = useState<(typeof KINDS)[number]['id']>('mikrotik');
  const k = KINDS.find((x) => x.id === kind)!;
  return (
    <ActionForm action={createSite}>
      <input type="hidden" name="kind" value={kind} />
      <div className="field-label">Router type</div>
      <div className="choice-grid" role="radiogroup" aria-label="Router type">
        {KINDS.map(({ id, icon: Icon, title, text }) => (
          <button key={id} type="button" role="radio" aria-checked={kind === id} className={`choice${kind === id ? ' on' : ''}`} onClick={() => setKind(id)}>
            <Icon size={20} />
            <strong>{title}</strong>
            <span>{text}</span>
          </button>
        ))}
      </div>
      <label className="field">Venue name
        <input name="name" placeholder="Mlimani Café" required />
      </label>
      {k.portLabel && (
        <label className="field" key={kind}>{k.portLabel}
          <input name="ports" defaultValue={k.port} />
          <span className="hint">{k.portHint}</span>
        </label>
      )}
      {kind !== 'simulated' && (
        <details>
          <summary className="muted small" style={{ cursor: 'pointer' }}>Advanced</summary>
          <label className="field" style={{ marginTop: 10 }}>Hotspot network
            <div className="row" style={{ flexWrap: 'nowrap' }}><span className="mono">10.5.</span><input name="subnet" type="number" min={1} max={254} defaultValue={50} style={{ width: 90 }} /><span className="mono">.0/24</span></div>
            <span className="hint">Change only if 10.5.50.0/24 is already used on your network.</span>
          </label>
        </details>
      )}
      <div><Submit pending="Creating…">{kind === 'simulated' ? 'Create simulator' : kind === 'opennds' ? 'Create and get the command' : 'Create and get the script'}</Submit></div>
    </ActionForm>
  );
}
