import { buildSync, siteFromRequest } from '@/lib/sync';

export const dynamic = 'force-dynamic';

/** Called by the router every few seconds. Answers with RouterOS script for the router to run. */
export async function GET(req: Request, { params }: { params: Promise<{ siteId: string }> }) {
  const { siteId } = await params;
  const found = await siteFromRequest(req, siteId);
  if (!found) return new Response(':log warning "incnet: router token rejected"\n', { status: 401, headers: { 'Content-Type': 'text/plain' } });
  const url = new URL(req.url);
  const script = await buildSync(found.site, found.token, url.searchParams.get('c'), url.searchParams.get('v'));
  return new Response(script, { headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store' } });
}
