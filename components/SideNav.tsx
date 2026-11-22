'use client';

import { BarChart3, Package, Router, Settings, Shield, Smartphone, Ticket, LayoutDashboard } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const LINKS = [
  { href: '/dashboard', label: 'Overview', icon: LayoutDashboard, exact: true },
  { href: '/dashboard/sites', label: 'Routers', icon: Router },
  { href: '/dashboard/packages', label: 'Packages', icon: Package },
  { href: '/dashboard/vouchers', label: 'Vouchers', icon: Ticket },
  { href: '/dashboard/portal', label: 'Wi-Fi page', icon: Smartphone },
  { href: '/dashboard/sales', label: 'Sales', icon: BarChart3 },
  { href: '/dashboard/settings', label: 'Settings', icon: Settings },
];

export function SideNav({ admin }: { admin: boolean }) {
  const path = usePathname();
  const links = admin ? [...LINKS, { href: '/dashboard/admin', label: 'Platform', icon: Shield }] : LINKS;
  return (
    <>
      {links.map(({ href, label, icon: Icon, ...rest }) => {
        const on = 'exact' in rest ? path === href : path.startsWith(href);
        return (
          <Link key={href} href={href} className={`nav${on ? ' on' : ''}`}>
            <Icon size={17} /> {label}
          </Link>
        );
      })}
    </>
  );
}
