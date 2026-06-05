import { PrismaClient } from "../generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const globalForPrisma = globalThis;

const getPrismaClient = () => {
  const connectionString = process.env.DATABASE_URL;
  
  // Use a fallback URL only during local build / static compilation if env is not loaded,
  // to avoid build-time initialization crashes if DATABASE_URL is missing.
  const url = connectionString || "postgresql://postgres:postgres@localhost:5432/postgres";
  
  const pool = new Pool({ connectionString: url });
  const adapter = new PrismaPg(pool);
  return new PrismaClient({ adapter });
};

export const prisma = globalForPrisma.prisma || getPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
