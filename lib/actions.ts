'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { checkPassword, currentUser, endSession, hashPassword, requireWorkspace, startSession } from './auth';
import { ALLOW_SIGNUP, siteLimit } from './config';
import { encrypt, newToken, sha256, slugify } from './crypto';
import { db } from './db';
import { uniqueCode } from './access';
import { parsePorts } from './routeros';

export type FormState = { error?: string; ok?: string } | undefined;

const field = (fd: FormData, name: string) => String(fd.get(name) ?? '').trim();
const firstIssue = (err: z.ZodError) => err.issues[0]?.message || 'Check the form and try again.';

/** Sensible starter packages, so a new venue can sell on day one. */
const STARTER_PACKAGES = [
  { name: '1 hour', price: 500, durationMinutes: 60, downKbps: 5000, upKbps: 2000, sort: 1 },
  { name: '1 day', price: 1000, durationMinutes: 1440, downKbps: 5000, upKbps: 2000, sort: 2 },
  { name: '1 week', price: 5000, durationMinutes: 10080, downKbps: 5000, upKbps: 2000, sort: 3 },
  { name: '1 month', price: 15000, durationMinutes: 43200, downKbps: 8000, upKbps: 3000, devices: 2, sort: 4 },
];

// ── Accounts ──────────────────────────────────────────────────────

const signupSchema = z.object({
  name: z.string().min(2, 'Enter your name.').max(80),
  business: z.string().min(2, 'Enter your business name.').max(80),
  email: z.string().email('Enter a valid email.').max(160).transform((v) => v.toLowerCase()),
  password: z.string().min(8, 'Use at least 8 characters for the password.').max(200),
});

export async function signup(_: FormState, fd: FormData): Promise<FormState> {
  const parsed = signupSchema.safeParse({ name: field(fd, 'name'), business: field(fd, 'business'), email: field(fd, 'email'), password: String(fd.get('password') ?? '') });
  if (!parsed.success) return { error: firstIssue(parsed.error) };
  const { name, business, email, password } = parsed.data;

  // Throwaway demo accounts never count: the first real account owns the server.
  const users = await db.user.count({ where: { NOT: { email: { endsWith: '@demo.incnet.local' } } } });
  if (users > 0 && !ALLOW_SIGNUP) return { error: 'Sign-up is closed on this server. Ask the owner to invite you.' };
  if (await db.user.findUnique({ where: { email } })) return { error: 'That email already has an account. Sign in instead.' };

  const user = await db.user.create({
    data: {
      email, name, passwordHash: await hashPassword(password), isAdmin: users === 0,
      memberships: { create: { role: 'owner', workspace: { create: { name: business, packages: { create: STARTER_PACKAGES } } } } },
    },
  });
  await startSession(user.id);
  redirect('/dashboard');
}

export async function login(_: FormState, fd: FormData): Promise<FormState> {
  const email = field(fd, 'email').toLowerCase();
  const user = email ? await db.user.findUnique({ where: { email } }) : null;
  if (!user || !(await checkPassword(String(fd.get('password') ?? ''), user.passwordHash))) return { error: 'Email or password is wrong.' };
  await startSession(user.id);
  redirect('/dashboard');
}

export async function logout() {
  await endSession();
  redirect('/login');
}

export async function changePassword(_: FormState, fd: FormData): Promise<FormState> {
  const me = await currentUser();
  if (!me) redirect('/login');
  const user = await db.user.findUniqueOrThrow({ where: { id: me.id } });
  if (!(await checkPassword(String(fd.get('current') ?? ''), user.passwordHash))) return { error: 'The current password is wrong.' };
  const next = String(fd.get('next') ?? '');
  if (next.length < 8) return { error: 'Use at least 8 characters.' };
  await db.user.update({ where: { id: me.id }, data: { passwordHash: await hashPassword(next) } });
  return { ok: 'Password changed.' };
}

// ── Sites (routers) ───────────────────────────────────────────────

const siteSchema = z.object({
  kind: z.enum(['mikrotik', 'opennds', 'simulated']).default('mikrotik'),
  name: z.string().min(2, 'Name the venue, e.g. "Mlimani Café".').max(60),
  ports: z.string().max(200).refine((v) => parsePorts(v).length > 0, 'Enter at least one router port, e.g. ether5.'),
  subnet: z.coerce.number().int().min(1, 'Use a number from 1 to 254.').max(254, 'Use a number from 1 to 254.'),
});

async function uniqueSlug(base: string) {
  const root = slugify(base);
  for (let i = 0; i < 20; i++) {
    const slug = i === 0 ? root : `${root}-${Math.random().toString(36).slice(2, 6)}`;
    if (!(await db.site.findUnique({ where: { slug }, select: { id: true } }))) return slug;
  }
  throw new Error('Could not pick an address for the site.');
}

export async function createSite(_: FormState, fd: FormData): Promise<FormState> {
  const { workspace } = await requireWorkspace();
  const kind = field(fd, 'kind') || 'mikrotik';
  const defaultPort = kind === 'opennds' ? 'wlan0' : kind === 'simulated' ? 'sim0' : 'ether5';
  const parsed = siteSchema.safeParse({ kind, name: field(fd, 'name'), ports: field(fd, 'ports') || defaultPort, subnet: field(fd, 'subnet') || 50 });
  if (!parsed.success) return { error: firstIssue(parsed.error) };
  // Simulators are free and never count toward the plan's router limit.
  const count = await db.site.count({ where: { workspaceId: workspace.id, NOT: { kind: 'simulated' } } });
  if (parsed.data.kind !== 'simulated' && count >= siteLimit(workspace.plan)) return { error: 'Your plan has reached its router limit. Upgrade to add more.' };

  const token = newToken('inr_');
  const site = await db.site.create({
    data: { workspaceId: workspace.id, kind: parsed.data.kind, name: parsed.data.name, ports: parsePorts(parsed.data.ports).join(','), subnet: parsed.data.subnet, slug: await uniqueSlug(parsed.data.name), tokenHash: sha256(token), tokenEnc: encrypt(token) },
  });
  redirect(`/dashboard/sites/${site.id}`);
}

export async function updateSite(_: FormState, fd: FormData): Promise<FormState> {
  const { workspace } = await requireWorkspace();
  const id = field(fd, 'id');
  const parsed = siteSchema.safeParse({ name: field(fd, 'name'), ports: field(fd, 'ports'), subnet: field(fd, 'subnet') });
  if (!parsed.success) return { error: firstIssue(parsed.error) };
  await db.site.updateMany({ where: { id, workspaceId: workspace.id }, data: { name: parsed.data.name, ports: parsePorts(parsed.data.ports).join(','), subnet: parsed.data.subnet } });
  revalidatePath(`/dashboard/sites/${id}`);
  return { ok: 'Saved. Paste the updated script on the router to apply port or network changes.' };
}

/** Issues a new router token. The old script stops working immediately. */
export async function rotateSiteToken(fd: FormData) {
  const { workspace } = await requireWorkspace();
  const id = field(fd, 'id');
  const token = newToken('inr_');
  await db.site.updateMany({ where: { id, workspaceId: workspace.id }, data: { tokenHash: sha256(token), tokenEnc: encrypt(token), appliedCursor: 0 } });
  revalidatePath(`/dashboard/sites/${id}`);
}

export async function deleteSite(fd: FormData) {
  const { workspace } = await requireWorkspace();
  await db.site.deleteMany({ where: { id: field(fd, 'id'), workspaceId: workspace.id } });
  redirect('/dashboard/sites');
}

// ── Packages ──────────────────────────────────────────────────────

const packageSchema = z.object({
  name: z.string().min(1, 'Name the package.').max(40),
  price: z.coerce.number().int('Price must be a whole number.').min(0).max(10_000_000),
  duration: z.coerce.number().positive('Enter how long the package lasts.').max(100_000),
  unit: z.enum(['minutes', 'hours', 'days']),
  down: z.coerce.number().positive('Enter a download speed.').max(10_000),
  up: z.coerce.number().positive('Enter an upload speed.').max(10_000),
  data: z.coerce.number().min(0).max(10_000_000).optional(),
  devices: z.coerce.number().int().min(1).max(20),
  siteId: z.string().max(40).optional(),
});

const UNIT_MINUTES = { minutes: 1, hours: 60, days: 1440 } as const;

export async function savePackage(_: FormState, fd: FormData): Promise<FormState> {
  const { workspace } = await requireWorkspace();
  const parsed = packageSchema.safeParse({
    name: field(fd, 'name'), price: field(fd, 'price'), duration: field(fd, 'duration'), unit: field(fd, 'unit'),
    down: field(fd, 'down'), up: field(fd, 'up'), data: field(fd, 'data') || undefined, devices: field(fd, 'devices') || 1, siteId: field(fd, 'siteId') || undefined,
  });
  if (!parsed.success) return { error: firstIssue(parsed.error) };
  const v = parsed.data;
  if (v.siteId && !(await db.site.findFirst({ where: { id: v.siteId, workspaceId: workspace.id }, select: { id: true } }))) return { error: 'Choose a router.' };
  const data = {
    siteId: v.siteId || null,
    name: v.name, price: v.price, durationMinutes: Math.round(v.duration * UNIT_MINUTES[v.unit]),
    downKbps: Math.round(v.down * 1000), upKbps: Math.round(v.up * 1000), dataLimitMb: v.data ? Math.round(v.data * 1024) : null, devices: v.devices,
  };
  const id = field(fd, 'id');
  if (id) await db.package.updateMany({ where: { id, workspaceId: workspace.id }, data });
  else await db.package.create({ data: { ...data, workspaceId: workspace.id, sort: (await db.package.count({ where: { workspaceId: workspace.id } })) + 1 } });
  revalidatePath('/dashboard/packages');
  return { ok: id ? 'Package updated.' : 'Package added.' };
}

export async function togglePackage(fd: FormData) {
  const { workspace } = await requireWorkspace();
  const pkg = await db.package.findFirst({ where: { id: field(fd, 'id'), workspaceId: workspace.id } });
  if (pkg) await db.package.update({ where: { id: pkg.id }, data: { active: !pkg.active } });
  revalidatePath('/dashboard/packages');
}

// ── Vouchers ──────────────────────────────────────────────────────

export async function createVouchers(_: FormState, fd: FormData): Promise<FormState> {
  const { workspace } = await requireWorkspace();
  const count = Number(field(fd, 'count'));
  if (!Number.isInteger(count) || count < 1 || count > 500) return { error: 'Make between 1 and 500 vouchers at a time.' };
  const siteId = field(fd, 'siteId');
  const site = siteId ? await db.site.findFirst({ where: { id: siteId, workspaceId: workspace.id } }) : null;
  if (!site) return { error: 'Choose the router these vouchers are for.' };
  const pkg = await db.package.findFirst({ where: { id: field(fd, 'packageId'), workspaceId: workspace.id, OR: [{ siteId: null }, { siteId: site.id }] } });
  if (!pkg) return { error: 'Choose a package sold at this router.' };

  const batch = await db.$transaction(async (tx) => {
    const b = await tx.voucherBatch.create({ data: { workspaceId: workspace.id, siteId: site.id, packageId: pkg.id, count, note: field(fd, 'note').slice(0, 80) || null } });
    const codes = new Set<string>();
    while (codes.size < count) codes.add(await uniqueCode(workspace.id, tx));
    await tx.access.createMany({ data: [...codes].map((code) => ({ workspaceId: workspace.id, siteId: site.id, packageId: pkg.id, batchId: b.id, code, kind: 'voucher' })) });
    return b;
  }, { timeout: 30_000 });
  redirect(`/dashboard/vouchers/${batch.id}`);
}

/** Cancels a code. If it is in use, the router disconnects it on the next sync. */
export async function revokeAccess(fd: FormData) {
  const { workspace } = await requireWorkspace();
  await db.access.updateMany({ where: { id: field(fd, 'id'), workspaceId: workspace.id, status: { in: ['unused', 'active'] } }, data: { status: 'revoked' } });
  revalidatePath('/dashboard', 'layout');
}

// ── Settings ──────────────────────────────────────────────────────

export async function saveBusiness(_: FormState, fd: FormData): Promise<FormState> {
  const { workspace } = await requireWorkspace();
  const name = field(fd, 'name');
  const color = field(fd, 'brandColor');
  if (name.length < 2) return { error: 'Enter the business name.' };
  if (!/^#[0-9a-fA-F]{6}$/.test(color)) return { error: 'Pick a colour.' };
  const timezone = field(fd, 'timezone') || workspace.timezone;
  try { new Intl.DateTimeFormat('en', { timeZone: timezone }); } catch { return { error: 'Choose a time zone.' }; }
  await db.workspace.update({
    where: { id: workspace.id },
    data: { name: name.slice(0, 80), brandColor: color, timezone, supportPhone: field(fd, 'supportPhone').slice(0, 30) || null, welcomeText: field(fd, 'welcomeText').slice(0, 200) || null },
  });
  revalidatePath('/dashboard', 'layout');
  return { ok: 'Saved. The hotspot page uses these details now.' };
}

export async function savePayments(_: FormState, fd: FormData): Promise<FormState> {
  const { workspace } = await requireWorkspace();
  const provider = field(fd, 'provider');
  if (!['none', 'incpesa', 'snippe', 'test'].includes(provider)) return { error: 'Choose a payment option.' };
  if (provider === 'test') {
    await db.workspace.update({ where: { id: workspace.id }, data: { paymentProvider: 'test' } });
    revalidatePath('/dashboard', 'layout');
    return { ok: 'Test mode is on. Payments complete by themselves after a few seconds and no money moves. Switch to a real provider before opening to customers.' };
  }
  const key = field(fd, 'key');
  const secret = field(fd, 'secret');
  if (provider === 'incpesa' && key && !key.startsWith('ip_live_')) return { error: 'incpesa keys start with ip_live_.' };
  if (provider === 'snippe' && key && !key.startsWith('snp_')) return { error: 'Snippe keys start with snp_.' };
  if (provider !== 'none' && !key && (workspace.paymentProvider !== provider || !workspace.paymentKeyEnc)) return { error: 'Paste your API key.' };

  await db.workspace.update({
    where: { id: workspace.id },
    data: {
      paymentProvider: provider,
      ...(provider === 'none' ? { paymentKeyEnc: null, paymentSecretEnc: null } : {}),
      ...(key ? { paymentKeyEnc: encrypt(key) } : {}),
      ...(secret ? { paymentSecretEnc: encrypt(secret) } : {}),
    },
  });
  revalidatePath('/dashboard', 'layout');
  return { ok: provider === 'none' ? 'Mobile payments are off. Vouchers still work.' : 'Mobile payments are on. Try a small test payment from the hotspot page.' };
}
