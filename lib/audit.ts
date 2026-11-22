import { db } from './db';

/** Records an entry in the team activity log. Never blocks the action it describes. */
export async function audit(ctx: { workspace: { id: string }; user: { id: string } }, action: string, detail: string) {
  await db.auditLog.create({ data: { workspaceId: ctx.workspace.id, userId: ctx.user.id, action, detail: detail.slice(0, 300) } }).catch(() => null);
}

export const AUDIT_LABELS: Record<string, string> = {
  'router.create': 'Added a router',
  'router.update': 'Changed a router',
  'router.token': 'Issued a new router token',
  'router.delete': 'Removed a router',
  'package.save': 'Saved a package',
  'package.toggle': 'Showed or hid a package',
  'vouchers.create': 'Made vouchers',
  'access.revoke': 'Cancelled a code',
  'settings.business': 'Changed business settings',
  'settings.payments': 'Changed mobile money',
  'design.portal': 'Changed the Wi-Fi page',
  'design.vouchers': 'Changed the voucher design',
  'team.invite': 'Invited a team member',
  'team.invite.revoke': 'Cancelled an invite',
  'team.join': 'Joined the team',
  'team.role': 'Changed a role',
  'team.remove': 'Removed a team member',
  'team.leave': 'Left the team',
};
