import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Palette } from 'lucide-react';
import { PrintButton } from './PrintButton';
import { VoucherSheet } from '@/components/VoucherSheet';
import { requireWorkspace } from '@/lib/auth';
import { APP_URL } from '@/lib/config';
import { db } from '@/lib/db';
import { voucherOptions } from '@/lib/design';
import { duration, money, speed } from '@/lib/format';
import { qrSvg, voucherUrl } from '@/lib/qr';

export const metadata = { title: 'Print vouchers' };

export default async function Batch({ params }: { params: Promise<{ batchId: string }> }) {
  const { batchId } = await params;
  const { workspace } = await requireWorkspace();
  const batch = await db.voucherBatch.findFirst({ where: { id: batchId, workspaceId: workspace.id }, include: { package: true, site: true, accesses: { orderBy: { code: 'asc' }, select: { code: true, status: true } } } });
  if (!batch) notFound();
  const p = batch.package;
  const options = voucherOptions(workspace.voucherOptions);
  const vouchers = await Promise.all(batch.accesses.map(async (a) => ({ code: a.code, used: a.status !== 'unused', qrSvg: options.showQr ? await qrSvg(voucherUrl(APP_URL, batch.site.slug, a.code)) : null })));
  const used = vouchers.filter((v) => v.used).length;
  return (
    <>
      <div className="page-head no-print">
        <div><h1>{batch.count} × {p.name}</h1><p>{batch.site.name} · {used} of {batch.count} used · Cut along the edges. Used codes are faded.</p></div>
        <div className="row">
          <Link className="btn btn-ghost" href="/dashboard/vouchers">Back</Link>
          <Link className="btn btn-ghost" href="/dashboard/vouchers/design"><Palette size={16} /> Design</Link>
          <PrintButton />
        </div>
      </div>
      <VoucherSheet
        template={workspace.voucherTemplate}
        options={options}
        info={{ business: workspace.name, site: batch.site.name, color: workspace.brandColor, logo: workspace.portalLogo, packageName: p.name, price: money(p.price), duration: duration(p.durationMinutes), speed: speed(p.downKbps) }}
        vouchers={vouchers}
      />
    </>
  );
}
