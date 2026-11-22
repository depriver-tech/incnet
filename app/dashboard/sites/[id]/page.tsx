import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Cpu, ExternalLink, FlaskConical, Router } from 'lucide-react';
import { ActionForm, Submit } from '@/components/ActionForm';
import { CodeBox, CopyButton } from '@/components/CopyButton';
import { AutoRefresh, StatusBadge } from '@/components/RouterStatus';
import { deleteSite, rotateSiteToken, updateSite } from '@/lib/actions';
import { requireWorkspace } from '@/lib/auth';
import { APP_URL, SYNC_INTERVAL } from '@/lib/config';
import { decrypt } from '@/lib/crypto';
import { db } from '@/lib/db';
import { ago } from '@/lib/format';
import { setupScript } from '@/lib/routeros';
import { Simulator } from './Simulator';

export const metadata = { title: 'Router' };

const KIND = {
  mikrotik: { label: 'MikroTik', icon: Router },
  opennds: { label: 'Raspberry Pi / OpenWrt', icon: Cpu },
  simulated: { label: 'Simulator', icon: FlaskConical },
} as const;

export default async function SitePage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ welcome?: string }> }) {
  const { id } = await params;
  const { welcome } = await searchParams;
  const { workspace } = await requireWorkspace();
  const site = await db.site.findFirst({ where: { id, workspaceId: workspace.id } });
  if (!site) notFound();
  const token = decrypt(site.tokenEnc);
  const connected = await db.access.count({ where: { workspaceId: workspace.id, status: 'active', activeSiteId: site.id, expiresAt: { gt: new Date() } } });
  const portal = `${APP_URL}/p/${site.slug}`;
  const kind = KIND[site.kind as keyof typeof KIND] ?? KIND.mikrotik;
  const KindIcon = kind.icon;
  const installCmd = token ? `curl -fsSL -H "Authorization: Bearer ${token}" ${APP_URL}/api/router/${site.id}/install | sudo sh` : '';

  return (
    <>
      {site.kind !== 'simulated' && <AutoRefresh seconds={site.lastSeenAt ? 15 : 4} />}
      <div className="page-head">
        <div>
          <div className="row"><h1>{site.name}</h1>{site.kind === 'simulated' ? <span className="badge accent"><FlaskConical size={12} /> Simulator</span> : <StatusBadge lastSeen={site.lastSeenAt} />}</div>
          <p className="row" style={{ gap: 6 }}><KindIcon size={14} /> {kind.label} · Last check-in {ago(site.lastSeenAt)}{site.routerVersion && site.kind === 'mikrotik' ? ` · RouterOS ${site.routerVersion}` : ''} · {connected} connected</p>
        </div>
        <div className="row">
          <Link className="btn btn-ghost" href="/dashboard/portal">Design Wi-Fi page</Link>
          <a className="btn btn-ghost" href={portal} target="_blank" rel="noreferrer">Open Wi-Fi page <ExternalLink size={14} /></a>
        </div>
      </div>

      {welcome === 'demo' && (
        <div className="notice" style={{ marginBottom: 16 }}>
          <strong>Welcome to the incnet demo.</strong> On the right is a phone connected to this café&apos;s Wi-Fi. Buy a package with any number (for example 0712 345 678) and watch the virtual router let it online. Payments are in test mode, so no money moves. Explore Packages, Vouchers and Sales from the menu.
        </div>
      )}

      {site.kind === 'simulated' ? (
        <Simulator siteId={site.id} slug={site.slug} payments={workspace.paymentProvider} />
      ) : site.kind === 'opennds' ? (
        <section className="card" style={{ marginBottom: 16 }}>
          <div className="card-head"><h2>One-command setup</h2><span className="muted small">Raspberry Pi OS (Bookworm+) or OpenWrt</span></div>
          <div className="card-pad stack" style={{ gap: 14 }}>
            {!site.lastSeenAt && <p className="notice">Waiting for this gateway. Run the command below on it. This page updates by itself when it checks in.</p>}
            <ol className="flow">
              <li><div><strong>Connect the device to the internet</strong><div className="muted small">Raspberry Pi: plug the Ethernet port into your internet router. OpenWrt: use the WAN port.</div></div></li>
              <li><div><strong>Open a terminal on it</strong><div className="muted small">SSH in (for example <span className="mono">ssh pi@raspberrypi.local</span>) or use the Pi&apos;s own terminal.</div></div></li>
              <li><div><strong>Paste this command</strong><div className="muted small">It installs openNDS (the open-source captive portal), sets up the hotspot on <span className="mono">{site.ports}</span> and starts the incnet agent, which checks in every {SYNC_INTERVAL} seconds.</div></div></li>
            </ol>
            <CodeBox code={installCmd || '# The router token could not be read. Click "New router token" below.'} />
            <p className="muted small">Name the Wi-Fi by adding <span className="mono">SSID=&quot;My Café Wi-Fi&quot;</span> right after <span className="mono">sudo</span>. The command contains this gateway&apos;s secret token; keep it private. On a Pi, building openNDS takes a few minutes the first time.</p>
            <p className="badge warn" style={{ justifySelf: 'start' }}>Beta: Raspberry Pi and OpenWrt support is new. Tell us how it goes.</p>
          </div>
        </section>
      ) : (
        <section className="card" style={{ marginBottom: 16 }}>
          <div className="card-head"><h2>Setup script</h2><span className="muted small">Paste into WinBox → New Terminal. Safe to paste again.</span></div>
          <div className="card-pad stack" style={{ gap: 14 }}>
            {!site.lastSeenAt && <p className="notice">Waiting for this router. Paste the script below into the MikroTik terminal. This page updates by itself when the router checks in.</p>}
            <ol className="flow">
              <li><div><strong>Plug in your access points</strong><div className="muted small">Cable them to <span className="mono">{site.ports.split(',').join(', ')}</span> and set them to AP (bridge) mode, with DHCP off.</div></div></li>
              <li><div><strong>Open the router terminal</strong><div className="muted small">WinBox or WebFig → New Terminal, or SSH into the router.</div></div></li>
              <li><div><strong>Paste the script and press Enter</strong><div className="muted small">It sets up the hotspot, the login page and a sync job that runs every {SYNC_INTERVAL} seconds.</div></div></li>
            </ol>
            <CodeBox code={token ? setupScript(site, token) : '# The router token could not be read. Click "New router token" below.'} />
            <p className="muted small">The script contains this router&apos;s secret token. Keep it private. If it leaks, make a new token and paste the script again.</p>
          </div>
        </section>
      )}

      <div className="grid grid-2" style={{ marginTop: 16 }}>
        <section className="card">
          <div className="card-head"><h2>Settings</h2></div>
          <div className="card-pad">
            <ActionForm action={updateSite}>
              <input type="hidden" name="id" value={site.id} />
              <input type="hidden" name="kind" value={site.kind} />
              <label className="field">Venue name<input name="name" defaultValue={site.name} required /></label>
              {site.kind !== 'simulated' && <label className="field">{site.kind === 'opennds' ? 'Hotspot interface' : 'Hotspot ports'}<input name="ports" defaultValue={site.ports} /></label>}
              {site.kind !== 'simulated' ? <label className="field">Hotspot network (10.5.X.0/24)<input name="subnet" type="number" min={1} max={254} defaultValue={site.subnet} /></label> : <><input type="hidden" name="ports" value={site.ports} /><input type="hidden" name="subnet" value={site.subnet} /></>}
              <div><Submit>Save</Submit></div>
            </ActionForm>
          </div>
        </section>
        <section className="card">
          <div className="card-head"><h2>Wi-Fi page</h2></div>
          <div className="card-pad stack" style={{ gap: 12 }}>
            <p className="muted small">Phones on this Wi-Fi are sent here to buy a package or enter a voucher.</p>
            <div className="row"><span className="mono small" style={{ wordBreak: 'break-all' }}>{portal}</span><CopyButton text={portal} /></div>
            <hr style={{ border: 0, borderTop: '1px solid var(--line)', margin: '6px 0' }} />
            <div className="row">
              {site.kind !== 'simulated' && <form action={rotateSiteToken}><input type="hidden" name="id" value={site.id} /><button className="btn btn-ghost btn-sm">New router token</button></form>}
              <form action={deleteSite}><input type="hidden" name="id" value={site.id} /><button className="btn btn-danger btn-sm">Remove router</button></form>
            </div>
            {site.kind === 'mikrotik' && <p className="muted small">Removing a router here does not change the MikroTik. To undo the setup there, remove the hotspot named “incnet” and the “incnet-sync” scheduler.</p>}
            {site.kind === 'opennds' && <p className="muted small">To undo the setup on the device: stop and disable the opennds and incnet services, and delete the incnet-hotspot network connection.</p>}
          </div>
        </section>
      </div>
    </>
  );
}
