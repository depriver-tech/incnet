'use client';

import { Activity, Building2, LayoutDashboard, Users } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const TABS = [
  { href: '/dashboard/admin', label: 'Overview', icon: LayoutDashboard, exact: true },
  { href: '/dashboard/admin/workspaces', label: 'Workspaces', icon: Building2 },
  { href: '/dashboard/admin/users', label: 'Users', icon: Users },
  { href: '/dashboard/admin/system', label: 'System', icon: Activity },
];

export function AdminTabs() {
  const path = usePathname();
  return (
    <nav className="admin-tabs">
      {TABS.map(({ href, label, icon: Icon, exact }) => {
        const on = exact ? path === href : path.startsWith(href);
        return <Link key={href} href={href} className={on ? 'on' : ''}><Icon size={15} /> {label}</Link>;
      })}
    </nav>
  );
}
