import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { databaseUrl } from './db-url';

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    // DATABASE_SCHEMA lets incnet share a Postgres server with other apps, in its own schema.
    adapter: new PrismaPg({ connectionString: databaseUrl() }, { schema: process.env.DATABASE_SCHEMA || undefined }),
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db;
