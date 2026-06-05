import { PrismaClient } from "../generated/prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";

const globalForPrisma = globalThis;

const getPrismaClient = () => {
  const url = process.env.DATABASE_URL || "file:./dev.db";
  // Remove the file: prefix if it has it for better-sqlite3 or pass it to adapter.
  // PrismaBetterSqlite3 expects the same file: path.
  const adapter = new PrismaBetterSqlite3({ url });
  return new PrismaClient({ adapter });
};

export const prisma = globalForPrisma.prisma || getPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
