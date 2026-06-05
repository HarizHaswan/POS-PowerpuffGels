import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request) {
  try {
    const { searchParams } = request.nextUrl;
    const seller = searchParams.get("seller");
    const date = searchParams.get("date");
    const search = searchParams.get("search");

    const where = {};

    // 1. Date Filtering
    if (date && date !== "all") {
      const startOfDay = new Date();
      if (date === "today") {
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date();
        endOfDay.setHours(23, 59, 59, 999);
        where.createdAt = {
          gte: startOfDay,
          lte: endOfDay,
        };
      } else if (date === "yesterday") {
        const startOfYesterday = new Date();
        startOfYesterday.setDate(startOfYesterday.getDate() - 1);
        startOfYesterday.setHours(0, 0, 0, 0);
        const endOfYesterday = new Date();
        endOfYesterday.setDate(endOfYesterday.getDate() - 1);
        endOfYesterday.setHours(23, 59, 59, 999);
        where.createdAt = {
          gte: startOfYesterday,
          lte: endOfYesterday,
        };
      } else if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        const [year, month, day] = date.split("-").map(Number);
        const customStart = new Date(year, month - 1, day, 0, 0, 0, 0);
        const customEnd = new Date(year, month - 1, day, 23, 59, 59, 999);
        where.createdAt = {
          gte: customStart,
          lte: customEnd,
        };
      }
    }

    // 2. Seller Filtering
    if (seller && seller !== "All") {
      where.items = {
        some: {
          seller: seller,
        },
      };
    }

    // 3. Text Search Filtering
    if (search) {
      where.OR = [
        { notes: { contains: search } },
        { id: { contains: search } },
      ];
    }

    const transactions = await prisma.transaction.findMany({
      where,
      include: {
        items: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(transactions);
  } catch (error) {
    console.error("Error fetching transactions:", error);
    return NextResponse.json(
      { error: "Failed to fetch transactions" },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const { items, notes } = await request.json();

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: "Items array is required" },
        { status: 400 }
      );
    }

    // Validation
    const sellersList = ["Nadia", "Ainina", "Afrina"];
    for (const item of items) {
      if (!sellersList.includes(item.seller)) {
        return NextResponse.json(
          { error: `Invalid seller: ${item.seller}` },
          { status: 400 }
        );
      }
      if (!Number.isInteger(item.quantity) || item.quantity <= 0) {
        return NextResponse.json(
          { error: "Quantity must be a positive integer" },
          { status: 400 }
        );
      }
      if (typeof item.amount !== "number" || item.amount < 0) {
        return NextResponse.json(
          { error: "Amount must be a non-negative number" },
          { status: 400 }
        );
      }
    }

    const totalAmount = items.reduce((sum, item) => sum + item.amount, 0);

    const transaction = await prisma.transaction.create({
      data: {
        totalAmount,
        notes: notes || null,
        items: {
          create: items.map((item) => ({
            seller: item.seller,
            quantity: item.quantity,
            amount: item.amount,
          })),
        },
      },
      include: {
        items: true,
      },
    });

    return NextResponse.json(transaction, { status: 201 });
  } catch (error) {
    console.error("Error creating transaction:", error);
    return NextResponse.json(
      { error: "Failed to create transaction" },
      { status: 500 }
    );
  }
}
