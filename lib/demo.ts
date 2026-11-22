'use server';

import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { hashPassword, startSession } from './auth';
import { encrypt, newCode, newToken, sha256 } from './crypto';
import { db } from './db';
import { throttled } from './throttle';

const DEMO_DOMAIN = 'demo.incnet.local';
const DEMO_TTL_MS = 24 * 3600_000;

/**
 * "Try the live demo": a throwaway workspace with a simulated router, test-mode payments,
 * vouchers and two weeks of sample sales. Nothing touches real hardware or real money.
 */
export async function startDemo() {
  const h = await headers();
  const ip = (h.get('x-forwarded-for') || '').split(',')[0].trim() || 'unknown';
  if (throttled(`demo:${ip}`, 5, 10 * 60_000)) redirect('/?demo=busy');

  // Old demos go away after a day.
  const old = new Date(Date.now() - DEMO_TTL_MS);
  await db.workspace.deleteMany({ where: { isDemo: true, createdAt: { lt: old } } });
  await db.user.deleteMany({ where: { email: { endsWith: `@${DEMO_DOMAIN}` }, createdAt: { lt: old } } });

  const tag = newCode(6).toLowerCase();
  const token = newToken('inr_');
  const user = await db.user.create({
    data: {
      email: `demo-${tag}@${DEMO_DOMAIN}`, name: 'Demo owner', passwordHash: await hashPassword(newToken('pw_')), isAdmin: false,
      memberships: {
        create: {
          role: 'owner',
          workspace: {
            create: {
              name: 'Mlimani Café', isDemo: true, paymentProvider: 'test', supportPhone: '0712 345 678',
              portalHeadline: 'Fast Wi-Fi for our guests', welcomeText: 'Pick a package or enter your voucher code.',
              voucherOptions: { perRow: 4, showPrice: true, showSpeed: true, showQr: true, showLogo: true, showSteps: true, ssid: 'Mlimani Café Wi-Fi', footer: '' },
            },
          },
        },
      },
    },
    include: { memberships: true },
  });
  const workspaceId = user.memberships[0].workspaceId;

  const site = await db.site.create({
    data: { workspaceId, kind: 'simulated', name: 'Mlimani Café', slug: `demo-${tag}`, ports: 'sim0', tokenHash: sha256(token), tokenEnc: encrypt(token), lastSeenAt: new Date() },
  });
  const packages = await Promise.all(
    [
      { name: '1 hour', price: 500, durationMinutes: 60, downKbps: 5000, upKbps: 2000, sort: 1 },
      { name: '1 day', price: 1000, durationMinutes: 1440, downKbps: 5000, upKbps: 2000, sort: 2 },
      { name: '1 week', price: 5000, durationMinutes: 10080, downKbps: 8000, upKbps: 3000, sort: 3 },
      { name: '1 month', price: 15000, durationMinutes: 43200, downKbps: 10000, upKbps: 4000, devices: 2, sort: 4 },
    ].map((p) => db.package.create({ data: { ...p, workspaceId } })),
  );

  // A printed batch of vouchers for the counter.
  const batch = await db.voucherBatch.create({ data: { workspaceId, siteId: site.id, packageId: packages[1].id, count: 16, note: 'Front desk' } });
  await db.access.createMany({ data: Array.from({ length: 16 }, () => ({ workspaceId, siteId: site.id, packageId: packages[1].id, batchId: batch.id, code: newCode(8), kind: 'voucher' })) });

  // Two weeks of past sales, so the charts have something to show.
  const history: { amount: number; packageId: string; at: Date }[] = [];
  for (let day = 13; day >= 1; day--) {
    const n = 3 + Math.floor(Math.random() * 7);
    for (let i = 0; i < n; i++) {
      const p = packages[Math.random() < 0.55 ? 0 : Math.random() < 0.7 ? 1 : Math.random() < 0.8 ? 2 : 3];
      history.push({ amount: p.price, packageId: p.id, at: new Date(Date.now() - day * 86_400_000 + Math.floor(Math.random() * 12 * 3600_000)) });
    }
  }
  for (const h of history) {
    const access = await db.access.create({ data: { workspaceId, siteId: site.id, packageId: h.packageId, code: newCode(8), kind: 'payment', status: 'expired', phone: `2557${Math.floor(10_000_000 + Math.random() * 89_999_999)}`, activatedAt: h.at, expiresAt: h.at, activeSiteId: site.id } });
    await db.payment.create({ data: { workspaceId, siteId: site.id, packageId: h.packageId, accessId: access.id, amount: h.amount, phone: access.phone!, provider: 'test', providerRef: `test_${h.at.getTime()}_demo`, status: 'completed', createdAt: h.at, completedAt: h.at } });
  }

  await startSession(user.id);
  redirect(`/dashboard/sites/${site.id}?welcome=demo`);
}
