import { Shield } from 'lucide-react';
import { AdminTabs } from '@/components/AdminTabs';
import { requirePlatformAdmin } from '@/lib/admin';
import { IS_CLOUD } from '@/lib/config';

/** The platform console: every business on this server. Platform admins only. */
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requirePlatformAdmin();
  return (
    <div>
      <div className="admin-banner">
        <span className="row" style={{ gap: 8 }}><Shield size={16} /> <strong>Platform console</strong></span>
        <span className="muted small">{IS_CLOUD ? 'incnet Cloud · every business on this server' : 'Self-hosted server · every business on this install'}</span>
      </div>
      <AdminTabs />
      {children}
    </div>
  );
}
