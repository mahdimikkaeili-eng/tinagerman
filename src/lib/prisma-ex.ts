import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as { prismaEx?: PrismaClient };

export const prismaEx = globalForPrisma.prismaEx ?? new PrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prismaEx = prismaEx;
}
