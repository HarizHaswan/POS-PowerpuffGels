const { PrismaClient } = require("../src/generated/prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");
const { Pool } = require("pg");

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error("Error: DATABASE_URL is not defined in environment variables.");
  process.exit(1);
}

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Clearing all transaction records from the PostgreSQL database...");
  
  // Delete all items first to satisfy foreign key constraints
  await prisma.transactionItem.deleteMany({});
  // Delete all parent transactions
  await prisma.transaction.deleteMany({});
  
  console.log("Database cleared successfully! Reports and history are now empty.");
}

main()
  .catch((e) => {
    console.error("Error clearing database:", e);
    process.exit(1);
  });
