'use client';

import { Link2 } from 'lucide-react';
import { useActionState } from 'react';
import { CopyButton } from '@/components/CopyButton';
import { Submit } from '@/components/ActionForm';
import { ROLE_INFO, type Role } from '@/lib/permissions';
import { createInvite } from '@/lib/team-actions';

export function InviteForm({ roles }: { roles: Role[] }) {
  const [state, run] = useActionState(createInvite, undefined);
  return (
    <form action={run} className="form-grid">
      <label className="field">Who is it for? (optional)<input name="label" placeholder="Asha, front desk" maxLength={60} /></label>
      <div className="field-label">Role</div>
      <div className="role-grid">
        {roles.map((r, i) => (
          <label key={r} className="role-option">
            <input type="radio" name="role" value={r} defaultChecked={i === roles.length - 2 || roles.length === 1} />
            <span><strong>{ROLE_INFO[r].label}</strong><small>{ROLE_INFO[r].summary}</small></span>
          </label>
        ))}
      </div>
      <div><Submit pending="Creating link…"><Link2 size={15} /> Create invite link</Submit></div>
      {state?.error && <p className="error" role="alert">{state.error}</p>}
      {state?.link && (
        <div className="notice" role="status" style={{ display: 'grid', gap: 8 }}>
          <span>{state.ok}</span>
          <div className="ht-code"><code>{state.link}</code><CopyButton text={state.link} /></div>
          <span className="muted small">Share it on WhatsApp, SMS or email. Anyone with the link can join with this role until it is used.</span>
        </div>
      )}
    </form>
  );
}
