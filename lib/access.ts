import { Prisma } from '@prisma/client';
import { db } from './db';
import { newCode } from './crypto';
import { providerFor } from './payments';
import { ProviderError } from './payments/types';

const SETTLEABLE = ['pending', 'failed', 'expired'];

/** A code that is unique within the workspace. */
export async function uniqueCode(workspaceId: string, tx: Prisma.TransactionClient | typeof db = db) {
  for (let i = 0; i < 8; i++) {
    const code = newCode(8);
    if (!(await tx.access.findUnique({ where: { workspaceId_code: { workspaceId, code } }, select: { id: true } }))) return code;
  }
  throw new Error('Could not create a unique code.');
}

export class AccessError extends Error {}

/** Redeems a voucher at a site. Unused codes start their clock now; active codes simply reconnect. */
export async function redeemCode(site: { id: string; workspaceId: string }, rawCode: string, mac?: string | null, ip?: string | null) {
  const code = rawCode.trim().toUpperCase().replace(/[\s-]/g, '');
  if (!/^[A-Z0-9]{4,16}$/.test(code)) throw new AccessError('Check the code and try again.');
  const access = await db.access.findUnique({ where: { workspaceId_code: { workspaceId: site.workspaceId, code } }, include: { package: true } });
  if (!access || (access.siteId && access.siteId !== site.id)) throw new AccessError('That code was not found. Check it and try again.');
  if (access.status === 'revoked') throw new AccessError('That code has been cancelled.');
  if (access.status === 'expired' || (access.expiresAt && access.expiresAt < new Date())) throw new AccessError('That code has expired. Buy a new package to continue.');
  if (access.status === 'active') {
    // Reconnecting, perhaps with a new address: record it so the gateway lets this phone in.
    if ((ip && ip !== access.ip) || (mac && mac !== access.mac)) {
      return db.access.update({ where: { id: access.id }, data: { ip: ip || access.ip, mac: mac || access.mac, activeSiteId: site.id }, include: { package: true } });
    }
    return access;
  }

  const now = new Date();
  const claimed = await db.access.updateMany({
    where: { id: access.id, status: 'unused' },
    data: { status: 'active', activatedAt: now, expiresAt: new Date(now.getTime() + access.package.durationMinutes * 60_000), mac: mac || null, ip: ip || null, activeSiteId: site.id },
  });
  if (claimed.count !== 1) throw new AccessError('That code was just used. Try again.');
  return db.access.findUniqueOrThrow({ where: { id: access.id }, include: { package: true } });
}

/** Records the result of a mobile money payment. Duplicate webhooks and polling races change nothing the second time. */
export async function applyCharge(paymentId: string, result: { status: string; amount?: number; providerRef?: string | null; failureReason?: string | null }) {
  const payment = await db.payment.findUnique({ where: { id: paymentId }, include: { package: true } });
  if (!payment) return null;

  if (result.status === 'completed') {
    if (!SETTLEABLE.includes(payment.status)) return payment;
    if (result.amount !== undefined && Number(result.amount) !== payment.amount) {
      await db.payment.updateMany({ where: { id: payment.id, status: { in: SETTLEABLE } }, data: { status: 'needs_review', failureReason: `Amount received (${result.amount}) does not match` } });
      return db.payment.findUnique({ where: { id: payment.id } });
    }
    await db.$transaction(async (tx) => {
      const claim = await tx.payment.updateMany({ where: { id: payment.id, status: { in: SETTLEABLE } }, data: { status: 'completed', completedAt: new Date(), failureReason: null, providerRef: result.providerRef ?? payment.providerRef } });
      if (claim.count !== 1) return;
      const now = new Date();
      const access = await tx.access.create({
        data: {
          workspaceId: payment.workspaceId, siteId: payment.siteId, packageId: payment.packageId, code: await uniqueCode(payment.workspaceId, tx), kind: 'payment', status: 'active',
          phone: payment.phone, mac: payment.mac, ip: payment.ip, activeSiteId: payment.siteId, activatedAt: now, expiresAt: new Date(now.getTime() + payment.package.durationMinutes * 60_000),
        },
      });
      await tx.payment.update({ where: { id: payment.id }, data: { accessId: access.id } });
    });
  } else if (result.status === 'failed' || result.status === 'expired') {
    await db.payment.updateMany({ where: { id: payment.id, status: 'pending' }, data: { status: result.status, failureReason: result.failureReason ?? null } });
  }
  return db.payment.findUnique({ where: { id: payment.id } });
}

/** Asks the provider for the latest state of a pending payment, at most every few seconds. */
export async function refreshPayment(paymentId: string) {
  const payment = await db.payment.findUnique({ where: { id: paymentId }, include: { workspace: true } });
  if (!payment || payment.status !== 'pending') return payment;
  if (payment.checkedAt && Date.now() - payment.checkedAt.getTime() < 4000) return payment;
  await db.payment.update({ where: { id: payment.id }, data: { checkedAt: new Date() } });

  // Prompts that were never answered: give up after 15 minutes.
  if (Date.now() - payment.createdAt.getTime() > 15 * 60_000) {
    await db.payment.updateMany({ where: { id: payment.id, status: 'pending' }, data: { status: 'expired', failureReason: 'No confirmation from the phone' } });
  }
  const p = providerFor(payment.workspace);
  if (!p) return db.payment.findUnique({ where: { id: payment.id } });
  try {
    const result = await p.provider.fetchCharge(p.creds, { reference: payment.id, providerRef: payment.providerRef });
    if (result) await applyCharge(payment.id, result);
  } catch (err) {
    if (!(err instanceof ProviderError)) console.error('refreshPayment', err);
  }
  return db.payment.findUnique({ where: { id: payment.id } });
}
