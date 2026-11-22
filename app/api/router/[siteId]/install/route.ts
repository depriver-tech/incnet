import { installScript } from '@/lib/opennds';
import { siteFromRequest } from '@/lib/sync';

export const dynamic = 'force-dynamic';

/** The one-command gateway installer: curl -fsSL -H "Authorization: Bearer …" …/install | sudo sh */
export async function GET(req: Request, { params }: { params: Promise<{ siteId: string }> }) {
  const { siteId } = await params;
  const found = await siteFromRequest(req, siteId);
  if (!found) return new Response('echo "incnet: this install link is not valid. Copy the command again from your dashboard." >&2; exit 1\n', { status: 401, headers: { 'Content-Type': 'text/plain' } });
  return new Response(installScript(found.site, found.token), { headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store' } });
}
