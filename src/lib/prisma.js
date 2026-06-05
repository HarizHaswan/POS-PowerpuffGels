import { PrismaClient } from "../generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const globalForPrisma = globalThis;

const getPrismaClient = () => {
  const connectionString = process.env.DATABASE_URL;
  
  // Fallback for local build validation
  const url = connectionString || "postgresql://postgres:postgres@localhost:5432/postgres";
  
  const isLocal = url.includes("localhost") || url.includes("127.0.0.1");
  
  const pool = new Pool({
    connectionString: url,
    // Supabase and Neon require SSL. Using rejectUnauthorized: false prevents SSL certificate validation failures.
    ssl: isLocal ? false : { rejectUnauthorized: false },
  });
  
  const adapter = new PrismaPg(pool);
  return new PrismaClient({ adapter });
};

export const prisma = globalForPrisma.prisma || getPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
