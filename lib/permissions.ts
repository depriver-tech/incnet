/**
 * Roles and what each may do. Checked on the server for every page and action;
 * the menu only hides what a role cannot open.
 */
export const ROLES = ['owner', 'admin', 'manager', 'cashier', 'viewer'] as const;
export type Role = (typeof ROLES)[number];

export const ROLE_INFO: Record<Role, { label: string; summary: string }> = {
  owner: { label: 'Owner', summary: 'Everything, including the plan and the team. One per business.' },
  admin: { label: 'Admin', summary: 'Everything except the plan: routers, payments, team and settings.' },
  manager: { label: 'Manager', summary: 'Packages, vouchers, the Wi-Fi page, sales and reports.' },
  cashier: { label: 'Cashier', summary: 'Makes and prints vouchers, and looks up codes. Sees today only.' },
  viewer: { label: 'Viewer', summary: 'Read-only: sales, reports and customers. Good for an accountant.' },
};

const MATRIX = {
  'dashboard.view': ['owner', 'admin', 'manager', 'cashier', 'viewer'],
  'routers.view': ['owner', 'admin', 'manager', 'viewer'],
  'routers.manage': ['owner', 'admin'],
  'packages.view': ['owner', 'admin', 'manager', 'cashier', 'viewer'],
  'packages.manage': ['owner', 'admin', 'manager'],
  'vouchers.create': ['owner', 'admin', 'manager', 'cashier'],
  'vouchers.revoke': ['owner', 'admin', 'manager'],
  'vouchers.design': ['owner', 'admin', 'manager'],
  'portal.design': ['owner', 'admin', 'manager'],
  'sales.view': ['owner', 'admin', 'manager', 'viewer'],
  'reports.view': ['owner', 'admin', 'manager', 'viewer'],
  'customers.view': ['owner', 'admin', 'manager', 'viewer'],
  'settings.business': ['owner', 'admin'],
  'payments.manage': ['owner', 'admin'],
  'team.view': ['owner', 'admin', 'manager'],
  'team.manage': ['owner', 'admin'],
  'billing.manage': ['owner'],
} as const satisfies Record<string, readonly Role[]>;

export type Permission = keyof typeof MATRIX;

export function can(role: string, perm: Permission) {
  return (MATRIX[perm] as readonly string[]).includes(role);
}

/** Roles a member may hand out: never more than their own, and only the owner makes owners. */
export function assignableRoles(role: string): Role[] {
  if (role === 'owner') return ['admin', 'manager', 'cashier', 'viewer'];
  if (role === 'admin') return ['manager', 'cashier', 'viewer'];
  return [];
}

export class PermissionError extends Error {
  constructor() {
    super("You don't have permission to do that. Ask an owner or admin.");
  }
}
