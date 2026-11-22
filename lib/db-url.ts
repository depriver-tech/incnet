/**
 * Database URLs, accepting the names that hosting integrations create, so one-click deploys
 * (Vercel + Neon, Vercel Postgres, Prisma Postgres, Supabase) work without renaming anything.
 */
export const databaseUrl = () => process.env.DATABASE_URL || process.env.POSTGRES_PRISMA_URL || process.env.POSTGRES_URL || '';
export const directUrl = () => process.env.DIRECT_URL || process.env.DATABASE_URL_UNPOOLED || process.env.POSTGRES_URL_NON_POOLING || databaseUrl();
