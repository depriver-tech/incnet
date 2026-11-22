import { loginPage } from '@/lib/routeros';
import { siteFromRequest } from '@/lib/sync';

export const dynamic = 'force-dynamic';

/** The hotspot login.html the router stores and shows to new phones. */
export async function GET(req: Request, { params }: { params: Promise<{ siteId: string }> }) {
  const { siteId } = await params;
  const found = await siteFromRequest(req, siteId);
  if (!found) return new Response('Unauthorized', { status: 401 });
  return new Response(loginPage(found.site.slug), { headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' } });
}
