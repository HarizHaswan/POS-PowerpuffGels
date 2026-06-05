const { PrismaClient } = require("../src/generated/prisma/client");
const { PrismaBetterSqlite3 } = require("@prisma/adapter-better-sqlite3");

const url = process.env.DATABASE_URL || "file:./dev.db";
const adapter = new PrismaBetterSqlite3({ url });
const prisma = new PrismaClient({ adapter });

async function main() {
  // Clear existing transactions
  await prisma.transactionItem.deleteMany({});
  await prisma.transaction.deleteMany({});

  console.log("Seeding database with sample sales...");

  // Transaction 1: Nadia only (2 items)
  await prisma.transaction.create({
    data: {
      totalAmount: 40.0,
      notes: "2 preloved hoodies from Nadia",
      items: {
        create: [
          { seller: "Nadia", quantity: 2, amount: 40.0 }
        ]
      },
      createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000) // 4 hours ago
    }
  });

  // Transaction 2: Mixed purchase (Nadia + Ainina)
  await prisma.transaction.create({
    data: {
      totalAmount: 35.0,
      notes: "1 dress (Nadia) and 1 shawl (Ainina)",
      items: {
        create: [
          { seller: "Nadia", quantity: 1, amount: 20.0 },
          { seller: "Ainina", quantity: 1, amount: 15.0 }
        ]
      },
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000) // 2 hours ago
    }
  });

  // Transaction 3: Mixed purchase (Nadia + Ainina + Afrina)
  await prisma.transaction.create({
    data: {
      totalAmount: 70.0,
      notes: "Outfit combo containing items from everyone",
      items: {
        create: [
          { seller: "Nadia", quantity: 2, amount: 30.0 },
          { seller: "Ainina", quantity: 1, amount: 15.0 },
          { seller: "Afrina", quantity: 1, amount: 25.0 }
        ]
      },
      createdAt: new Date(Date.now() - 30 * 60 * 1000) // 30 mins ago
    }
  });

  // Transaction 4: Afrina only (1 item)
  await prisma.transaction.create({
    data: {
      totalAmount: 50.0,
      notes: "Preloved denim jacket",
      items: {
        create: [
          { seller: "Afrina", quantity: 1, amount: 50.0 }
        ]
      },
      createdAt: new Date(Date.now() - 15 * 60 * 1000) // 15 mins ago
    }
  });

  console.log("Database seeded successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
