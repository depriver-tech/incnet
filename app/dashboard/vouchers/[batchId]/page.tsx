import Link from 'next/link';
import { notFound } from 'next/navigation';
import { PrintButton } from './PrintButton';
import { requireWorkspace } from '@/lib/auth';
import { db } from '@/lib/db';
import { duration, money, speed } from '@/lib/format';

export const metadata = { title: 'Print vouchers' };

export default async function Batch({ params }: { params: Promise<{ batchId: string }> }) {
  const { batchId } = await params;
  const { workspace } = await requireWorkspace();
  const batch = await db.voucherBatch.findFirst({ where: { id: batchId, workspaceId: workspace.id }, include: { package: true, accesses: { orderBy: { code: 'asc' }, select: { code: true, status: true } } } });
  if (!batch) notFound();
  const p = batch.package;
  return (
    <>
      <div className="page-head no-print">
        <div><h1>{batch.count} × {p.name}</h1><p>Cut along the dashed lines. Used codes are faded.</p></div>
        <div className="row"><Link className="btn btn-ghost" href="/dashboard/vouchers">Back</Link><PrintButton /></div>
      </div>
      <div className="vouchers">
        {batch.accesses.map((a) => (
          <div key={a.code} className="voucher" style={{ opacity: a.status === 'unused' ? 1 : 0.35, borderColor: workspace.brandColor }}>
            <div className="v-name">{workspace.name} Wi-Fi</div>
            <div className="v-code">{a.code}</div>
            <div className="v-meta"><strong>{money(p.price)}</strong> · {duration(p.durationMinutes)} · {speed(p.downKbps)}</div>
            <div className="v-meta" style={{ marginTop: 2 }}>Connect to the Wi-Fi and enter the code.</div>
          </div>
        ))}
      </div>
    </>
  );
}
