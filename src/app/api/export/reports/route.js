import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import * as XLSX from "xlsx";

export async function GET(request) {
  try {
    const { searchParams } = request.nextUrl;
    const format = searchParams.get("format") || "csv";
    const date = searchParams.get("date");

    const where = {};

    if (date && date !== "all") {
      const startOfDay = new Date();
      if (date === "today") {
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date();
        endOfDay.setHours(23, 59, 59, 999);
        where.createdAt = { gte: startOfDay, lte: endOfDay };
      } else if (date === "yesterday") {
        const startOfYesterday = new Date();
        startOfYesterday.setDate(startOfYesterday.getDate() - 1);
        startOfYesterday.setHours(0, 0, 0, 0);
        const endOfYesterday = new Date();
        endOfYesterday.setDate(endOfYesterday.getDate() - 1);
        endOfYesterday.setHours(23, 59, 59, 999);
        where.createdAt = { gte: startOfYesterday, lte: endOfYesterday };
      } else if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        const [year, month, day] = date.split("-").map(Number);
        const customStart = new Date(year, month - 1, day, 0, 0, 0, 0);
        const customEnd = new Date(year, month - 1, day, 23, 59, 59, 999);
        where.createdAt = { gte: customStart, lte: customEnd };
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

    const reportDateStr = date ? date.toUpperCase() : "ALL TIME";

    if (format === "excel") {
      const workbook = XLSX.utils.book_new();

      // 1. Overall Summary Sheet
      const summaryData = [
        ["BOOTH SALES OVERALL SUMMARY", "", ""],
        ["Report Period", reportDateStr, ""],
        ["", "", ""],
        ["Metric", "Value", ""],
        ["Total Revenue (RM)", stats.overall.revenue, ""],
        ["Total Transactions", stats.overall.transactions, ""],
        ["Total Items Sold", stats.overall.itemsSold, ""],
      ];
      const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
      XLSX.utils.book_append_sheet(workbook, summarySheet, "Overall Summary");

      // 2. Seller Breakdown Sheet
      const sellerData = [
        ["SELLER SALES BREAKDOWN", "", ""],
        ["Report Period", reportDateStr, ""],
        ["", "", ""],
        ["Seller Name", "Items Sold", "Revenue (RM)"],
        ["Nadia", stats.sellers.Nadia.itemsSold, stats.sellers.Nadia.revenue],
        ["Ainina", stats.sellers.Ainina.itemsSold, stats.sellers.Ainina.revenue],
        ["Afrina", stats.sellers.Afrina.itemsSold, stats.sellers.Afrina.revenue],
      ];
      const sellerSheet = XLSX.utils.aoa_to_sheet(sellerData);
      XLSX.utils.book_append_sheet(workbook, sellerSheet, "Seller Breakdown");

      const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });

      return new Response(buffer, {
        headers: {
          "Content-Disposition": `attachment; filename="sales_report_${date || "all"}.xlsx"`,
          "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        },
      });
    } else {
      // CSV format
      let csvContent = "\uFEFF"; // UTF-8 BOM

      // Overall Section
      csvContent += `BOOTH SALES OVERALL SUMMARY\n`;
      csvContent += `Report Period,${reportDateStr}\n\n`;
      csvContent += `Metric,Value\n`;
      csvContent += `Total Revenue (RM),${stats.overall.revenue.toFixed(2)}\n`;
      csvContent += `Total Transactions,${stats.overall.transactions}\n`;
      csvContent += `Total Items Sold,${stats.overall.itemsSold}\n\n`;

      // Seller Section
      csvContent += `SELLER SALES BREAKDOWN\n`;
      csvContent += `Seller Name,Items Sold,Revenue (RM)\n`;
      csvContent += `Nadia,${stats.sellers.Nadia.itemsSold},${stats.sellers.Nadia.revenue.toFixed(2)}\n`;
      csvContent += `Ainina,${stats.sellers.Ainina.itemsSold},${stats.sellers.Ainina.revenue.toFixed(2)}\n`;
      csvContent += `Afrina,${stats.sellers.Afrina.itemsSold},${stats.sellers.Afrina.revenue.toFixed(2)}\n`;

      return new Response(csvContent, {
        headers: {
          "Content-Disposition": `attachment; filename="sales_report_${date || "all"}.csv"`,
          "Content-Type": "text/csv; charset=utf-8",
        },
      });
    }
  } catch (error) {
    console.error("Error exporting reports:", error);
    return NextResponse.json(
      { error: "Failed to export reports" },
      { status: 500 }
    );
  }
}
