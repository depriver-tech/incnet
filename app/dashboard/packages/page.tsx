import { ActionForm, Submit } from '@/components/ActionForm';
import { savePackage, togglePackage } from '@/lib/actions';
import { requireWorkspace } from '@/lib/auth';
import { db } from '@/lib/db';
import { duration, money, speed } from '@/lib/format';

export const metadata = { title: 'Packages' };

type Pkg = { id: string; name: string; price: number; durationMinutes: number; downKbps: number; upKbps: number; dataLimitMb: number | null; devices: number; siteId: string | null };
type SiteOpt = { id: string; name: string };

function PackageFields({ pkg, sites }: { pkg?: Pkg; sites: SiteOpt[] }) {
  const minutes = pkg?.durationMinutes ?? 60;
  const [value, unit] = minutes % 1440 === 0 ? [minutes / 1440, 'days'] : minutes % 60 === 0 ? [minutes / 60, 'hours'] : [minutes, 'minutes'];
  return (
    <>
      {pkg && <input type="hidden" name="id" value={pkg.id} />}
      <div className="form-row">
        <label className="field">Name<input name="name" defaultValue={pkg?.name} placeholder="1 day" required /></label>
        <label className="field">Price (TSh)<input name="price" type="number" min={0} step={50} defaultValue={pkg?.price ?? 1000} required /></label>
      </div>
      <div className="form-row">
        <label className="field">Lasts<input name="duration" type="number" min={1} step="any" defaultValue={value} required /></label>
        <label className="field">&nbsp;<select name="unit" defaultValue={unit}><option value="minutes">minutes</option><option value="hours">hours</option><option value="days">days</option></select></label>
      </div>
      <div className="form-row">
        <label className="field">Download (Mbps)<input name="down" type="number" min={0.1} step="any" defaultValue={(pkg?.downKbps ?? 5000) / 1000} required /></label>
        <label className="field">Upload (Mbps)<input name="up" type="number" min={0.1} step="any" defaultValue={(pkg?.upKbps ?? 2000) / 1000} required /></label>
      </div>
      <div className="form-row">
        <label className="field">Data cap (GB)<input name="data" type="number" min={0} step="any" defaultValue={pkg?.dataLimitMb ? +(pkg.dataLimitMb / 1024).toFixed(2) : ''} placeholder="Unlimited" /></label>
        <label className="field">Devices per code<input name="devices" type="number" min={1} max={20} defaultValue={pkg?.devices ?? 1} /></label>
      </div>
      {sites.length > 0 && (
        <label className="field">Sold at
          <select name="siteId" defaultValue={pkg?.siteId ?? ''}>
            <option value="">Every router</option>
            {sites.map((s) => <option key={s.id} value={s.id}>{s.name} only</option>)}
          </select>
        </label>
      )}
    </>
  );
}

export default async function Packages() {
  const { workspace } = await requireWorkspace();
  const [packages, sites] = await Promise.all([
    db.package.findMany({ where: { workspaceId: workspace.id }, orderBy: [{ active: 'desc' }, { sort: 'asc' }, { price: 'asc' }], include: { site: { select: { name: true } } } }),
    db.site.findMany({ where: { workspaceId: workspace.id }, orderBy: { createdAt: 'asc' }, select: { id: true, name: true } }),
  ]);
  return (
    <>
      <div className="page-head"><div><h1>Packages</h1><p>What customers can buy. Time starts when a code is first used.</p></div></div>
      <div className="grid" style={{ gridTemplateColumns: 'minmax(0, 1.6fr) minmax(280px, 1fr)', alignItems: 'start' }}>
        <section className="card">
          {packages.length === 0 ? <p className="empty">No packages yet. Add one on the right.</p> : (
            <div className="table-wrap"><table>
              <thead><tr><th>Package</th><th>Price</th><th>Speed</th><th>Limits</th><th></th></tr></thead>
              <tbody>
                {packages.map((p) => (
                  <tr key={p.id} style={{ opacity: p.active ? 1 : 0.55 }}>
                    <td>
                      <strong>{p.name}</strong><div className="muted small">{duration(p.durationMinutes)} · {p.site ? `${p.site.name} only` : 'every router'}</div>
                      <details style={{ marginTop: 6 }}>
                        <summary className="small accent" style={{ cursor: 'pointer' }}>Edit</summary>
                        <div style={{ marginTop: 10, minWidth: 280 }}><ActionForm action={savePackage}><PackageFields pkg={p} sites={sites} /><div><Submit className="btn btn-sm">Save</Submit></div></ActionForm></div>
                      </details>
                    </td>
                    <td><strong>{money(p.price)}</strong></td>
                    <td className="muted small">↓ {speed(p.downKbps)}<br />↑ {speed(p.upKbps)}</td>
                    <td className="muted small">{p.dataLimitMb ? `${+(p.dataLimitMb / 1024).toFixed(2)} GB` : 'No data cap'}<br />{p.devices} device{p.devices > 1 ? 's' : ''}</td>
                    <td style={{ textAlign: 'right' }}>
                      <form action={togglePackage}><input type="hidden" name="id" value={p.id} /><button className="btn btn-ghost btn-sm">{p.active ? 'Hide' : 'Show'}</button></form>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table></div>
          )}
        </section>
        <section className="card">
          <div className="card-head"><h2>Add a package</h2></div>
          <div className="card-pad"><ActionForm action={savePackage} resetOnOk><PackageFields sites={sites} /><div><Submit>Add package</Submit></div></ActionForm></div>
        </section>
      </div>
    </>
  );
}
