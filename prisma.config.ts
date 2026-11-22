import 'dotenv/config';
import { defineConfig } from 'prisma/config';
import { directUrl } from './lib/db-url';

/** Adds ?schema=… when DATABASE_SCHEMA is set, so db push only touches incnet's own schema. */
function withSchema(url?: string) {
  const schema = process.env.DATABASE_SCHEMA;
  if (!url || !schema) return url;
  // Plain string work: real-world passwords often contain characters URL parsers reject.
  const clean = url.replace(/([?&])schema=[^&]*&?/, '$1').replace(/[?&]$/, '');
  return `${clean}${clean.includes('?') ? '&' : '?'}schema=${encodeURIComponent(schema)}`;
}

export default defineConfig({
  schema: 'prisma/schema.prisma',
  // DIRECT_URL (non-pooled) for schema changes when the runtime URL goes through a pooler.
  datasource: { url: withSchema(directUrl() || undefined) },
});
