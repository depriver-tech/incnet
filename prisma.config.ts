import 'dotenv/config';
import { defineConfig } from 'prisma/config';

/** Adds ?schema=… when DATABASE_SCHEMA is set, so db push only touches incnet's own schema. */
function withSchema(url?: string) {
  const schema = process.env.DATABASE_SCHEMA;
  if (!url || !schema) return url;
  const u = new URL(url);
  u.searchParams.set('schema', schema);
  return u.toString();
}

export default defineConfig({
  schema: 'prisma/schema.prisma',
  // DIRECT_URL (non-pooled) for schema changes when the runtime URL goes through a pooler.
  datasource: { url: withSchema(process.env.DIRECT_URL || process.env.DATABASE_URL) },
});
