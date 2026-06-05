const { PrismaClient } = require("../src/generated/prisma/client");
const { PrismaBetterSqlite3 } = require("@prisma/adapter-better-sqlite3");

const url = process.env.DATABASE_URL || "file:./dev.db";
const adapter = new PrismaBetterSqlite3({ url });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Clearing all transaction records from the database...");
  
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
