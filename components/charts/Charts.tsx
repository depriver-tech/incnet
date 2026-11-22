'use client';

import { useState } from 'react';

/**
 * Small, dependency-free charts for incnet reports. Colours: series-1 (mobile money) and series-2
 * (vouchers), validated for colour-blind separation in light and dark; one teal ramp for magnitude.
 * Every chart has a hover tooltip; values in text use text colours, never the series colour.
 */
const tsh = (n: number) => `TSh ${n.toLocaleString('en-US')}`;
const short = (n: number) => (n >= 1_000_000 ? `${+(n / 1_000_000).toFixed(1)}M` : n >= 1000 ? `${+(n / 1000).toFixed(n >= 10_000 ? 0 : 1)}k` : String(n));

export function Legend({ items }: { items: { label: string; color: string; value?: string }[] }) {
  return (
    <div className="viz-legend">
      {items.map((i) => <span key={i.label}><i style={{ background: i.color }} />{i.label}{i.value && <b>{i.value}</b>}</span>)}
    </div>
  );
}

/** Revenue over time: mobile money and vouchers stacked per hour or day. */
export function StackedBars({ data, labels }: { data: { label: string; mobile: number; voucher: number; count: number }[]; labels: { mobile: string; voucher: string } }) {
  const [hover, setHover] = useState<number | null>(null);
  const max = Math.max(1, ...data.map((d) => d.mobile + d.voucher));
  const nice = niceMax(max);
  const W = 100 / Math.max(data.length, 1);
  const every = Math.ceil(data.length / 10);
  const h = hover === null ? null : data[hover];
  return (
    <div className="viz">
      <Legend items={[{ label: labels.mobile, color: 'var(--series-1)' }, { label: labels.voucher, color: 'var(--series-2)' }]} />
      <div className="viz-plot" onMouseLeave={() => setHover(null)}>
        <div className="viz-grid">{[1, 0.5, 0].map((g) => <div key={g}><span>{short(Math.round(nice * g))}</span></div>)}</div>
        <div className="viz-bars">
          {data.map((d, i) => {
            const total = d.mobile + d.voucher;
            return (
              <div key={d.label} className={`viz-col${hover === i ? ' on' : ''}`} style={{ width: `${W}%` }} onMouseEnter={() => setHover(i)} onFocus={() => setHover(i)} tabIndex={0} aria-label={`${d.label}: ${tsh(total)}`}>
                <div className="viz-stack" style={{ height: `${(total / nice) * 100}%` }}>
                  {d.voucher > 0 && <span style={{ flexGrow: d.voucher, background: 'var(--series-2)' }} />}
                  {d.mobile > 0 && <span style={{ flexGrow: d.mobile, background: 'var(--series-1)' }} />}
                </div>
              </div>
            );
          })}
        </div>
        {h && hover !== null && (
          <div className="viz-tip" style={{ left: `${Math.min(Math.max((hover + 0.5) * W, 12), 88)}%` }}>
            <strong>{h.label}</strong>
            <span><i style={{ background: 'var(--series-1)' }} />{labels.mobile}<b>{tsh(h.mobile)}</b></span>
            <span><i style={{ background: 'var(--series-2)' }} />{labels.voucher}<b>{tsh(h.voucher)}</b></span>
            <span className="viz-tip-total">{h.count} sale{h.count === 1 ? '' : 's'}<b>{tsh(h.mobile + h.voucher)}</b></span>
          </div>
        )}
      </div>
      <div className="viz-x">{data.map((d, i) => <span key={d.label} style={{ width: `${W}%` }}>{i % every === 0 ? d.label : ''}</span>)}</div>
    </div>
  );
}

function niceMax(n: number) {
  const p = 10 ** Math.floor(Math.log10(n));
  return [1, 2, 2.5, 5, 10].map((m) => m * p).find((v) => v >= n) ?? n;
}

/** Ranked list with a bar per row, for packages and routers. */
export function RankBars({ items, empty }: { items: { id: string; label: string; revenue: number; count: number; share: number }[]; empty: string }) {
  if (!items.length) return <p className="empty">{empty}</p>;
  const max = items[0].revenue || 1;
  return (
    <div className="rank">
      {items.slice(0, 8).map((i) => (
        <div key={i.id} className="rank-row" title={`${i.label}: ${tsh(i.revenue)} from ${i.count} sales`}>
          <div className="rank-top"><span>{i.label}</span><span><b>{tsh(i.revenue)}</b> <em>{Math.round(i.share * 100)}%</em></span></div>
          <div className="rank-track"><div style={{ width: `${(i.revenue / max) * 100}%` }} /></div>
          <div className="rank-sub">{i.count} sale{i.count === 1 ? '' : 's'}</div>
        </div>
      ))}
    </div>
  );
}

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

/** Sales by weekday and hour, one teal ramp from light (few) to dark (many). */
export function Heatmap({ grid }: { grid: number[][] }) {
  const [hover, setHover] = useState<{ d: number; h: number } | null>(null);
  const max = Math.max(1, ...grid.flat());
  const step = (v: number) => (v === 0 ? 0 : Math.min(5, Math.ceil((v / max) * 5)));
  return (
    <div className="heat" onMouseLeave={() => setHover(null)}>
      <div className="heat-grid">
        {grid.map((row, d) => (
          <div key={d} className="heat-row">
            <span className="heat-day">{DAYS[d]}</span>
            {row.map((v, h) => <span key={h} className={`heat-cell s${step(v)}`} onMouseEnter={() => setHover({ d, h })} title={`${DAYS[d]} ${String(h).padStart(2, '0')}:00 · ${v} sale${v === 1 ? '' : 's'}`} />)}
          </div>
        ))}
        <div className="heat-row heat-hours"><span className="heat-day" />{Array.from({ length: 24 }, (_, h) => <span key={h}>{h % 3 === 0 ? String(h).padStart(2, '0') : ''}</span>)}</div>
      </div>
      <div className="heat-foot">
        <span className="muted small">{hover ? `${DAYS[hover.d]} ${String(hover.h).padStart(2, '0')}:00–${String((hover.h + 1) % 24).padStart(2, '0')}:00 · ${grid[hover.d][hover.h]} sales` : 'Hover a square for details'}</span>
        <span className="heat-scale">Fewer {[1, 2, 3, 4, 5].map((s) => <i key={s} className={`heat-cell s${s}`} />)} More</span>
      </div>
    </div>
  );
}

/** Mobile money attempts by outcome. Status colours always come with a label. */
export function OutcomeBar({ data, labels }: { data: { completed: number; failed: number; expired: number; pending: number; review: number }; labels: Record<string, string> }) {
  const parts = [
    { key: 'completed', color: 'var(--ok)', icon: '✓' },
    { key: 'failed', color: 'var(--bad)', icon: '✕' },
    { key: 'expired', color: 'var(--warn)', icon: '◷' },
    { key: 'pending', color: 'var(--muted)', icon: '…' },
    { key: 'review', color: '#7c3aed', icon: '!' },
  ] as const;
  const total = parts.reduce((s, p) => s + data[p.key], 0);
  if (!total) return <p className="empty">No mobile money attempts in this period.</p>;
  return (
    <div className="viz">
      <div className="outcome">{parts.filter((p) => data[p.key] > 0).map((p) => <span key={p.key} style={{ flexGrow: data[p.key], background: p.color }} title={`${labels[p.key]}: ${data[p.key]}`} />)}</div>
      <div className="outcome-legend">
        {parts.filter((p) => data[p.key] > 0).map((p) => (
          <div key={p.key}><i style={{ background: p.color }}>{p.icon}</i><span>{labels[p.key]}</span><b>{data[p.key]}</b><em>{Math.round((data[p.key] / total) * 100)}%</em></div>
        ))}
      </div>
    </div>
  );
}

/** The change against the previous period, with an arrow and words, not colour alone. */
export function Delta({ value, suffix }: { value: number | null; suffix: string }) {
  if (value === null) return <span className="delta">New this period</span>;
  const cls = value > 0 ? 'up' : value < 0 ? 'down' : '';
  return <span className={`delta ${cls}`}>{value > 0 ? '▲' : value < 0 ? '▼' : '■'} {Math.abs(value)}% <em>{suffix}</em></span>;
}
