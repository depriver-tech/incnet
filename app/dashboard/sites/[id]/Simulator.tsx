'use client';

import { RefreshCw, Smartphone, Terminal } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';

type SimUser = { code: string; kind: string; package: string; down: number; up: number; expiresAt: string; mac: string | null; ip: string | null; onRouter: boolean };

function randomPhone() {
  const hex = () => Math.floor(Math.random() * 256).toString(16).padStart(2, '0').toUpperCase();
  return { mac: `02:${hex()}:${hex()}:${hex()}:${hex()}:${hex()}`, ip: `10.5.50.${10 + Math.floor(Math.random() * 240)}` };
}

const left = (iso: string) => {
  const m = Math.max(0, Math.round((new Date(iso).getTime() - Date.now()) / 60_000));
  return m >= 1440 ? `${Math.floor(m / 1440)}d ${Math.floor((m % 1440) / 60)}h` : m >= 60 ? `${Math.floor(m / 60)}h ${m % 60}m` : `${m}m`;
};

/**
 * A virtual MikroTik and a virtual phone. The router half runs the real check-in every four
 * seconds; the phone half is the real Wi-Fi page, so vouchers and test payments behave exactly as live.
 */
export function Simulator({ siteId, slug, payments }: { siteId: string; slug: string; payments: string }) {
  const [phone, setPhone] = useState<{ mac: string; ip: string } | null>(null);
  const [frameKey, setFrameKey] = useState(0);
  const [users, setUsers] = useState<SimUser[]>([]);
  const [script, setScript] = useState('');
  const [ticks, setTicks] = useState(0);
  const [lastChanges, setLastChanges] = useState(0);
  const [showScript, setShowScript] = useState(false);
  const cursor = useRef('0');
  const hasScript = useRef(false);

  useEffect(() => setPhone(randomPhone()), []);

  const tick = useCallback(async () => {
    const res = await fetch(`/api/sim/${siteId}?c=${cursor.current}`, { cache: 'no-store' }).catch(() => null);
    const data = res?.ok ? await res.json() : null;
    if (!data) return;
    cursor.current = data.cursor;
    setUsers(data.users);
    setLastChanges(data.changes);
    // Keep the last script that actually changed something, so it stays readable.
    if (data.changes > 0 || !hasScript.current) { setScript(data.script); hasScript.current = true; }
    setTicks((n) => n + 1);
  }, [siteId]);

  useEffect(() => {
    tick();
    const t = setInterval(() => { if (document.visibilityState === 'visible') tick(); }, 4000);
    return () => clearInterval(t);
  }, [tick]);

  const portal = phone ? `/p/${slug}?mac=${encodeURIComponent(phone.mac)}&ip=${phone.ip}` : '';

  return (
    <div className="sim">
      <section className="card sim-router">
        <div className="card-head">
          <h2 className="row" style={{ gap: 8 }}><Terminal size={16} /> Virtual router</h2>
          <span className="badge ok"><span className="dot sim-pulse" /> Checking in every 4s</span>
        </div>
        <div className="card-pad stack" style={{ gap: 14 }}>
          <div className="grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
            <div className="sim-stat"><small>Check-ins</small><strong>{ticks}</strong></div>
            <div className="sim-stat"><small>Hotspot users</small><strong>{users.filter((u) => u.onRouter).length}</strong></div>
            <div className="sim-stat"><small>Last change</small><strong>{lastChanges ? `${lastChanges} code${lastChanges > 1 ? 's' : ''}` : 'none'}</strong></div>
          </div>
          <div className="table-wrap" style={{ border: '1px solid var(--line)', borderRadius: 12 }}>
            <table>
              <thead><tr><th>Code</th><th>Package</th><th>Time left</th><th>On router</th></tr></thead>
              <tbody>
                {users.length === 0 ? (
                  <tr><td colSpan={4} className="muted small" style={{ textAlign: 'center', padding: 22 }}>No one online yet. Use a voucher or buy a package on the phone.</td></tr>
                ) : users.map((u) => (
                  <tr key={u.code}>
                    <td className="mono"><strong>{u.code}</strong><div className="muted" style={{ fontSize: 11 }}>{u.kind === 'payment' ? 'paid' : 'voucher'}{u.ip ? ` · ${u.ip}` : ''}</div></td>
                    <td className="small">{u.package}</td>
                    <td className="small">{left(u.expiresAt)}</td>
                    <td>{u.onRouter ? <span className="badge ok">Yes</span> : <span className="badge warn">Next check-in</span>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div>
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => setShowScript(!showScript)}>{showScript ? 'Hide' : 'Show'} what the router received</button>
            {showScript && <div className="code" style={{ marginTop: 10 }}><pre className="mono">{script || 'Waiting for the first check-in…'}</pre></div>}
          </div>
          <p className="muted small">Payments here use <strong>{payments === 'test' ? 'test mode' : payments}</strong>{payments === 'test' ? ': they complete after about six seconds and no money moves.' : '.'} Vouchers for this router are on the Vouchers page.</p>
        </div>
      </section>

      <section className="sim-phone-col">
        <div className="sim-phone" aria-label="Simulated phone">
          <div className="sim-notch" />
          {phone ? <iframe key={frameKey} src={portal} title="Simulated phone" /> : <div className="skeleton" style={{ height: '100%' }} />}
        </div>
        <div className="row" style={{ justifyContent: 'center', marginTop: 12 }}>
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => setFrameKey((k) => k + 1)}><RefreshCw size={14} /> Reload page</button>
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => { try { localStorage.removeItem('incnet-last-code'); } catch {} setPhone(randomPhone()); setFrameKey((k) => k + 1); }}><Smartphone size={14} /> New phone</button>
        </div>
        {phone && <p className="muted mono" style={{ fontSize: 11, textAlign: 'center', marginTop: 6 }}>{phone.mac} · {phone.ip}</p>}
      </section>
    </div>
  );
}
