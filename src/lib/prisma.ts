import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

const connectionString = process.env.DATABASE_URL || "";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

function makePrisma() {
  const pool = new pg.Pool({
    connectionString,
    ssl: { rejectUnauthorized: false },
  });
  const adapter = new PrismaPg(pool);
  return new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.prisma || makePrisma();
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
export default prisma;
