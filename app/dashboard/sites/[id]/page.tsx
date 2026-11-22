import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ExternalLink } from 'lucide-react';
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

export const metadata = { title: 'Router' };

export default async function SitePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { workspace } = await requireWorkspace();
  const site = await db.site.findFirst({ where: { id, workspaceId: workspace.id } });
  if (!site) notFound();
  const token = decrypt(site.tokenEnc);
  const script = token ? setupScript(site, token) : '# The router token could not be read. Click "New router token" below.';
  const connected = await db.access.count({ where: { workspaceId: workspace.id, status: 'active', activeSiteId: site.id, expiresAt: { gt: new Date() } } });
  const portal = `${APP_URL}/p/${site.slug}`;

  return (
    <>
      <AutoRefresh seconds={site.lastSeenAt ? 15 : 4} />
      <div className="page-head">
        <div>
          <div className="row"><h1>{site.name}</h1><StatusBadge lastSeen={site.lastSeenAt} /></div>
          <p>Last check-in {ago(site.lastSeenAt)}{site.routerVersion ? ` · RouterOS ${site.routerVersion}` : ''} · {connected} connected</p>
        </div>
        <a className="btn btn-ghost" href={portal} target="_blank" rel="noreferrer">Preview hotspot page <ExternalLink size={14} /></a>
      </div>

      {!site.lastSeenAt && (
        <p className="notice" style={{ marginBottom: 16 }}>Waiting for this router. Paste the script below into the MikroTik terminal. This page updates by itself when the router checks in.</p>
      )}

      <section className="card" style={{ marginBottom: 16 }}>
        <div className="card-head">
          <h2>Setup script</h2>
          <span className="muted small">Paste into WinBox → New Terminal. Safe to paste again.</span>
        </div>
        <div className="card-pad stack" style={{ gap: 14 }}>
          <ol className="flow">
            <li><div><strong>Plug in your access points</strong><div className="muted small">Cable them to <span className="mono">{site.ports.split(',').join(', ')}</span> and set them to AP (bridge) mode, with DHCP off. Name the Wi-Fi as you like.</div></div></li>
            <li><div><strong>Open the router terminal</strong><div className="muted small">WinBox or WebFig → New Terminal, or SSH into the router.</div></div></li>
            <li><div><strong>Paste the script and press Enter</strong><div className="muted small">It sets up the hotspot, the login page and a sync job that runs every {SYNC_INTERVAL} seconds.</div></div></li>
          </ol>
          <CodeBox code={script} />
          <p className="muted small">The script contains this router&apos;s secret token. Keep it private. If it leaks, make a new token and paste the script again.</p>
        </div>
      </section>

      <div className="grid grid-2">
        <section className="card">
          <div className="card-head"><h2>Settings</h2></div>
          <div className="card-pad">
            <ActionForm action={updateSite}>
              <input type="hidden" name="id" value={site.id} />
              <label className="field">Venue name<input name="name" defaultValue={site.name} required /></label>
              <label className="field">Hotspot ports<input name="ports" defaultValue={site.ports} /></label>
              <label className="field">Hotspot network (10.5.X.0/24)<input name="subnet" type="number" min={1} max={254} defaultValue={site.subnet} /></label>
              <div><Submit>Save</Submit></div>
            </ActionForm>
          </div>
        </section>
        <section className="card">
          <div className="card-head"><h2>Hotspot page</h2></div>
          <div className="card-pad stack" style={{ gap: 12 }}>
            <p className="muted small">Phones on this Wi-Fi are sent here to buy a package or enter a voucher.</p>
            <div className="row"><span className="mono small" style={{ wordBreak: 'break-all' }}>{portal}</span><CopyButton text={portal} /></div>
            <Link className="btn btn-ghost btn-sm" href="/dashboard/settings" style={{ justifySelf: 'start' }}>Change logo colour and text</Link>
            <hr style={{ border: 0, borderTop: '1px solid var(--line)', margin: '6px 0' }} />
            <div className="row">
              <form action={rotateSiteToken}><input type="hidden" name="id" value={site.id} /><button className="btn btn-ghost btn-sm">New router token</button></form>
              <form action={deleteSite}><input type="hidden" name="id" value={site.id} /><button className="btn btn-danger btn-sm">Remove router</button></form>
            </div>
            <p className="muted small">Removing a router here does not change the MikroTik. To undo the setup on the router, remove the hotspot named “incnet” and the “incnet-sync” scheduler.</p>
          </div>
        </section>
      </div>
    </>
  );
}
