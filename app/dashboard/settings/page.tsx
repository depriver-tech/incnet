import { ActionForm, Submit } from '@/components/ActionForm';
import { changePassword, saveBusiness, savePayments } from '@/lib/actions';
import { requireWorkspace } from '@/lib/auth';
import { APP_URL, IS_CLOUD, PLANS } from '@/lib/config';
import { money } from '@/lib/format';

export const metadata = { title: 'Settings' };

export default async function Settings() {
  const { workspace } = await requireWorkspace();
  const hasKey = !!workspace.paymentKeyEnc;
  return (
    <>
      <div className="page-head"><div><h1>Settings</h1><p>Your business, the hotspot page and mobile money.</p></div></div>
      <div className="grid grid-2" style={{ alignItems: 'start' }}>
        <section className="card">
          <div className="card-head"><h2>Business and hotspot page</h2></div>
          <div className="card-pad">
            <ActionForm action={saveBusiness}>
              <label className="field">Business name<input name="name" defaultValue={workspace.name} required /></label>
              <label className="field">Welcome message<input name="welcomeText" defaultValue={workspace.welcomeText ?? ''} placeholder="Fast Wi-Fi for our guests" maxLength={200} /></label>
              <div className="form-row">
                <label className="field">Brand colour<input name="brandColor" type="color" defaultValue={workspace.brandColor} style={{ height: 44, padding: 4 }} /></label>
                <label className="field">Support phone<input name="supportPhone" defaultValue={workspace.supportPhone ?? ''} placeholder="0712 345 678" /></label>
              </div>
              <div><Submit>Save</Submit></div>
            </ActionForm>
          </div>
        </section>

        <section className="card">
          <div className="card-head"><h2>Mobile money</h2>{workspace.paymentProvider !== 'none' && hasKey ? <span className="badge ok">On</span> : <span className="badge">Off</span>}</div>
          <div className="card-pad">
            <ActionForm action={savePayments}>
              <label className="field">Take payments with
                <select name="provider" defaultValue={workspace.paymentProvider}>
                  <option value="none">Off, vouchers only</option>
                  <option value="incpesa">incpesa (M-Pesa, Mixx by Yas, Airtel Money, Halotel)</option>
                  <option value="snippe">Snippe, with my own account</option>
                </select>
              </label>
              <label className="field">API key
                <input name="key" type="password" autoComplete="off" placeholder={hasKey ? 'Saved. Paste a new key to replace it.' : 'ip_live_… or snp_…'} />
                <span className="hint">incpesa: incpritech.com/incpesa/account → API keys. Snippe: Settings → API Keys (scopes collection:create and collection:read).</span>
              </label>
              <label className="field">Webhook secret (Snippe only)
                <input name="secret" type="password" autoComplete="off" placeholder={workspace.paymentSecretEnc ? 'Saved' : 'whsec_…'} />
              </label>
              <p className="muted small">Payment results are sent to <span className="mono">{APP_URL}/api/webhooks/…</span> automatically. incnet also checks each payment itself, so customers get online even if a webhook is late.</p>
              <div><Submit>Save payments</Submit></div>
            </ActionForm>
          </div>
        </section>

        {IS_CLOUD && (
          <section className="card">
            <div className="card-head"><h2>Plan</h2></div>
            <div className="card-pad stack" style={{ gap: 10 }}>
              {Object.entries(PLANS).map(([id, plan]) => (
                <div key={id} className="spread" style={{ padding: 12, border: '1px solid var(--line)', borderRadius: 10, borderColor: workspace.plan === id ? 'var(--accent)' : undefined }}>
                  <div><strong>{plan.name}</strong><div className="muted small">{plan.note}</div></div>
                  <div>{plan.price ? `${money(plan.price)}/month` : 'Free'} {workspace.plan === id && <span className="badge accent">Current</span>}</div>
                </div>
              ))}
              <p className="muted small">To upgrade, contact support. Self-hosting is free and has no limits.</p>
            </div>
          </section>
        )}

        <section className="card">
          <div className="card-head"><h2>Password</h2></div>
          <div className="card-pad">
            <ActionForm action={changePassword} resetOnOk>
              <label className="field">Current password<input name="current" type="password" autoComplete="current-password" required /></label>
              <label className="field">New password<input name="next" type="password" autoComplete="new-password" minLength={8} required /></label>
              <div><Submit>Change password</Submit></div>
            </ActionForm>
          </div>
        </section>
      </div>
    </>
  );
}
