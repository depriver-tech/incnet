import Link from 'next/link';
import { ExternalLink } from 'lucide-react';
import { PortalDesigner } from './PortalDesigner';
import { requireWorkspace } from '@/lib/auth';
import { db } from '@/lib/db';
import { portalDesign, portalPackages } from '@/lib/portal';

export const metadata = { title: 'Wi-Fi page' };

export default async function PortalDesign() {
  const { workspace } = await requireWorkspace();
  const site = await db.site.findFirst({ where: { workspaceId: workspace.id }, orderBy: { createdAt: 'asc' } });
  const packages = site
    ? await portalPackages({ ...site, workspace })
    : await portalPackages({ id: '-', workspaceId: workspace.id, workspace });
  return (
    <>
      <div className="page-head">
        <div><h1>Wi-Fi page</h1><p>What phones see when they join your Wi-Fi. One design for all your routers.</p></div>
        {site && <Link className="btn btn-ghost" href={`/p/${site.slug}`} target="_blank">Open live page <ExternalLink size={14} /></Link>}
      </div>
      <PortalDesigner business={workspace.name} design={portalDesign(workspace)} packages={packages} slug={site?.slug ?? 'preview'} />
    </>
  );
}
