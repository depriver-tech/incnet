'use client';

import { useState } from 'react';
import { ActionForm, Submit } from '@/components/ActionForm';
import { createVouchers } from '@/lib/actions';

type Opt = { id: string; name: string };
type PkgOpt = Opt & { label: string; siteId: string | null };

/** Vouchers always belong to one router and one package; the package list follows the router. */
export function VoucherForm({ sites, packages }: { sites: Opt[]; packages: PkgOpt[] }) {
  const [siteId, setSiteId] = useState(sites[0]?.id ?? '');
  const available = packages.filter((p) => !p.siteId || p.siteId === siteId);
  if (sites.length === 0) return <p className="muted small">Add a router first. Vouchers work only at the router they are made for.</p>;
  return (
    <ActionForm action={createVouchers}>
      <label className="field">Router
        <select name="siteId" value={siteId} onChange={(e) => setSiteId(e.target.value)} required>
          {sites.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
        <span className="hint">These codes will only work on this router&apos;s Wi-Fi.</span>
      </label>
      <label className="field">Package
        <select name="packageId" key={siteId} required>
          {available.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}
        </select>
        {available.length === 0 && <span className="error">No packages are sold at this router yet.</span>}
      </label>
      <label className="field">How many<input name="count" type="number" min={1} max={500} defaultValue={40} required /></label>
      <label className="field">Note (optional)<input name="note" placeholder="For the front desk" maxLength={80} /></label>
      <div><Submit pending="Making codes…">Make and print</Submit></div>
    </ActionForm>
  );
}
