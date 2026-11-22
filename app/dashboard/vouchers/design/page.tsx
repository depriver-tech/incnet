import { VoucherDesigner } from './VoucherDesigner';
import { requirePage } from '@/lib/auth';
import { APP_URL } from '@/lib/config';
import { db } from '@/lib/db';
import { voucherOptions } from '@/lib/design';
import { duration, money, speed } from '@/lib/format';

export const metadata = { title: 'Design vouchers' };

export default async function VoucherDesign() {
  const { workspace } = await requirePage('vouchers.design');
  const [pkg, site] = await Promise.all([
    db.package.findFirst({ where: { workspaceId: workspace.id, active: true }, orderBy: [{ sort: 'asc' }, { price: 'asc' }] }),
    db.site.findFirst({ where: { workspaceId: workspace.id }, orderBy: { createdAt: 'asc' } }),
  ]);
  return (
    <>
      <div className="page-head"><div><h1>Design vouchers</h1><p>Pick a template and what each voucher shows. Every printed sheet uses this design.</p></div></div>
      <VoucherDesigner
        template={workspace.voucherTemplate}
        options={voucherOptions(workspace.voucherOptions)}
        sampleUrl={`${APP_URL}/p/${site?.slug ?? 'your-venue'}?code=H7KM3QXP`}
        info={{ business: workspace.name, site: site?.name ?? '', color: workspace.brandColor, logo: workspace.portalLogo, packageName: pkg?.name ?? '1 day', price: money(pkg?.price ?? 1000), duration: duration(pkg?.durationMinutes ?? 1440), speed: speed(pkg?.downKbps ?? 5000) }}
      />
    </>
  );
}
