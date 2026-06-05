import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request) {
  try {
    const { searchParams } = request.nextUrl;
    const date = searchParams.get("date");

    const where = {};

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

    const transactions = await prisma.transaction.findMany({
      where,
      include: {
        items: true,
      },
    });

    const stats = {
      overall: {
        revenue: 0,
        transactions: transactions.length,
        itemsSold: 0,
      },
      sellers: {
        Nadia: { revenue: 0, itemsSold: 0 },
        Ainina: { revenue: 0, itemsSold: 0 },
        Afrina: { revenue: 0, itemsSold: 0 },
      },
    };

    transactions.forEach((tx) => {
      stats.overall.revenue += tx.totalAmount;
      tx.items.forEach((item) => {
        stats.overall.itemsSold += item.quantity;
        if (stats.sellers[item.seller]) {
          stats.sellers[item.seller].revenue += item.amount;
          stats.sellers[item.seller].itemsSold += item.quantity;
        }
      });
    });

    // Round values to 2 decimal places to avoid floating point precision issues
    stats.overall.revenue = parseFloat(stats.overall.revenue.toFixed(2));
    Object.keys(stats.sellers).forEach((key) => {
      stats.sellers[key].revenue = parseFloat(stats.sellers[key].revenue.toFixed(2));
    });

    return NextResponse.json(stats);
  } catch (error) {
    console.error("Error generating reports:", error);
    return NextResponse.json(
      { error: "Failed to generate report statistics" },
      { status: 500 }
    );
  }
}
