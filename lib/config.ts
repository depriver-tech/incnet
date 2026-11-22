/** Install-wide settings, all from the environment. See .env.example. */
/**
 * The public address. Set APP_URL when you have your own domain; otherwise it is worked out on
 * hosts that publish their address (Vercel, Render, Railway), so one-click deploys work as is.
 */
function detectAppUrl() {
  if (process.env.APP_URL) return process.env.APP_URL;
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  if (process.env.RENDER_EXTERNAL_URL) return process.env.RENDER_EXTERNAL_URL;
  if (process.env.RAILWAY_PUBLIC_DOMAIN) return `https://${process.env.RAILWAY_PUBLIC_DOMAIN}`;
  return `http://localhost:${process.env.PORT || 3000}`;
}
export const APP_URL = detectAppUrl().replace(/\/$/, '');
export const APP_NAME = process.env.APP_NAME || 'incnet';

/** Cloud mode turns on plans and open sign-up. Self-hosted installs leave it off. */
export const IS_CLOUD = process.env.INCNET_CLOUD === 'true';

/** Self-hosted installs only let the first person sign up, unless ALLOW_SIGNUP=true. */
export const ALLOW_SIGNUP = IS_CLOUD || process.env.ALLOW_SIGNUP === 'true';

export const SOURCE_URL = process.env.SOURCE_URL || 'https://github.com/depriver-tech/incnet';

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

/** One-click "Deploy with Vercel" for this repository. */
export const VERCEL_DEPLOY_URL = 'https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fdepriver-tech%2Fincnet&project-name=incnet&repository-name=incnet&env=APP_SECRET&envDescription=A%20long%20random%20string%20%2832%2B%20characters%29%20that%20signs%20sign-ins%20and%20encrypts%20payment%20keys&envLink=https%3A%2F%2Fgithub.com%2Fdepriver-tech%2Fincnet%2Fblob%2Fmain%2Fdocs%2Fvercel.md';
export const RELEASES_URL = `${SOURCE_URL}/releases/latest/download/incnet-node.zip`;
