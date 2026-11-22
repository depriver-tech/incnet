/** Install-wide settings, all from the environment. See .env.example. */
export const APP_URL = (process.env.APP_URL || 'http://localhost:3000').replace(/\/$/, '');
export const APP_NAME = process.env.APP_NAME || 'incnet';

/** Cloud mode turns on plans and open sign-up. Self-hosted installs leave it off. */
export const IS_CLOUD = process.env.INCNET_CLOUD === 'true';

/** Self-hosted installs only let the first person sign up, unless ALLOW_SIGNUP=true. */
export const ALLOW_SIGNUP = IS_CLOUD || process.env.ALLOW_SIGNUP === 'true';

export const SOURCE_URL = process.env.SOURCE_URL || 'https://github.com/incpritech/incnet';

/** How often the router checks in, in seconds. Lower means faster logins after payment. */
export const SYNC_INTERVAL = Math.max(2, Number(process.env.ROUTER_SYNC_SECONDS) || 4);

export const PLANS = {
  free: { name: 'Starter', price: 0, sites: 1, note: '1 router, unlimited vouchers' },
  pro: { name: 'Business', price: 25_000, sites: 20, note: 'Up to 20 routers, priority support' },
} as const;

export function siteLimit(plan: string) {
  if (!IS_CLOUD) return Infinity;
  return (PLANS[plan as keyof typeof PLANS] ?? PLANS.free).sites;
}
