'use client';

import { Activity, Building2, LayoutDashboard, Router, Users } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const LINKS = [
  { href: '/admin', label: 'Overview', icon: LayoutDashboard, exact: true },
  { href: '/admin/businesses', label: 'Businesses', icon: Building2 },
  { href: '/admin/routers', label: 'Routers', icon: Router },
  { href: '/admin/users', label: 'Users', icon: Users },
  { href: '/admin/system', label: 'System', icon: Activity },
];

export function AdminNav() {
  const path = usePathname();
  return (
    <nav className="cx-nav">
      {LINKS.map(({ href, label, icon: Icon, exact }) => {
        const on = exact ? path === href : path.startsWith(href);
        return <Link key={href} href={href} className={on ? 'on' : ''}><Icon size={17} /> {label}</Link>;
      })}
    </nav>
  );
}
