'use client';

import { BarChart3, LayoutDashboard, LineChart, Package, Router, Settings, Shield, Smartphone, Ticket, UserRound, Users } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { can, type Permission } from '@/lib/permissions';
import { useT } from '@/components/i18n/LangProvider';

const LINKS: { href: string; key: string; icon: typeof Router; perm: Permission; exact?: boolean }[] = [
  { href: '/dashboard', key: 'nav.overview', icon: LayoutDashboard, perm: 'dashboard.view', exact: true },
  { href: '/dashboard/reports', key: 'nav.reports', icon: LineChart, perm: 'reports.view' },
  { href: '/dashboard/sales', key: 'nav.sales', icon: BarChart3, perm: 'sales.view' },
  { href: '/dashboard/customers', key: 'nav.customers', icon: UserRound, perm: 'customers.view' },
  { href: '/dashboard/vouchers', key: 'nav.vouchers', icon: Ticket, perm: 'vouchers.create' },
  { href: '/dashboard/packages', key: 'nav.packages', icon: Package, perm: 'packages.view' },
  { href: '/dashboard/sites', key: 'nav.routers', icon: Router, perm: 'routers.view' },
  { href: '/dashboard/portal', key: 'nav.portal', icon: Smartphone, perm: 'portal.design' },
  { href: '/dashboard/team', key: 'nav.team', icon: Users, perm: 'team.view' },
  { href: '/dashboard/settings', key: 'nav.settings', icon: Settings, perm: 'dashboard.view' },
];

export function SideNav({ role, admin }: { role: string; admin: boolean }) {
  const path = usePathname();
  const t = useT();
  const links = LINKS.filter((l) => can(role, l.perm));
  return (
    <>
      {links.map(({ href, key, icon: Icon, exact }) => {
        const on = exact ? path === href : path.startsWith(href);
        return <Link key={href} href={href} className={`nav${on ? ' on' : ''}`}><Icon size={17} /> {t(key)}</Link>;
      })}
      {admin && <Link href="/admin" className={`nav${path.startsWith('/admin') ? ' on' : ''}`}><Shield size={17} /> {t('nav.platform')}</Link>}
    </>
  );
}
