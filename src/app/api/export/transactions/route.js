import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import * as XLSX from "xlsx";

export async function GET(request) {
  try {
    const { searchParams } = request.nextUrl;
    const format = searchParams.get("format") || "csv";
    const date = searchParams.get("date");
    const seller = searchParams.get("seller");

    const where = {};

    // Apply same filters as the transactions list
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

    if (seller && seller !== "All") {
      where.items = { some: { seller } };
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

    if (format === "excel") {
      // Create Excel Worksheet Data
      const worksheetData = [
        [
          "Transaction ID",
          "Date & Time",
          "Total Amount (RM)",
          "Notes",
          "Items Summary",
          "Nadia Qty",
          "Nadia Amt (RM)",
          "Ainina Qty",
          "Ainina Amt (RM)",
          "Afrina Qty",
          "Afrina Amt (RM)",
        ],
      ];

      transactions.forEach((tx) => {
        const nadiaItem = tx.items.find((i) => i.seller === "Nadia");
        const aininaItem = tx.items.find((i) => i.seller === "Ainina");
        const afrinaItem = tx.items.find((i) => i.seller === "Afrina");
        const itemsSummary = tx.items
          .map((i) => `${i.seller} (x${i.quantity})`)
          .join(", ");

        worksheetData.push([
          tx.id,
          new Date(tx.createdAt).toLocaleString("en-MY", { timeZone: "Asia/Kuala_Lumpur" }),
          tx.totalAmount,
          tx.notes || "",
          itemsSummary,
          nadiaItem ? nadiaItem.quantity : 0,
          nadiaItem ? nadiaItem.amount : 0,
          aininaItem ? aininaItem.quantity : 0,
          aininaItem ? aininaItem.amount : 0,
          afrinaItem ? afrinaItem.quantity : 0,
          afrinaItem ? afrinaItem.amount : 0,
        ]);
      });

      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
      XLSX.utils.book_append_sheet(workbook, worksheet, "Transactions");
      const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });

      return new Response(buffer, {
        headers: {
          "Content-Disposition": 'attachment; filename="transactions.xlsx"',
          "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        },
      });
    } else {
      // Default: CSV
      let csvContent = "\uFEFF"; // UTF-8 BOM for Excel compatibility
      csvContent +=
        "Transaction ID,Date & Time,Total Amount (RM),Notes,Items Summary,Nadia Qty,Nadia Amt (RM),Ainina Qty,Ainina Amt (RM),Afrina Qty,Afrina Amt (RM)\n";

      transactions.forEach((tx) => {
        const nadiaItem = tx.items.find((i) => i.seller === "Nadia");
        const aininaItem = tx.items.find((i) => i.seller === "Ainina");
        const afrinaItem = tx.items.find((i) => i.seller === "Afrina");
        const itemsSummary = tx.items
          .map((i) => `${i.seller} (x${i.quantity})`)
          .join("; ");

        const row = [
          tx.id,
          `"${new Date(tx.createdAt).toLocaleString("en-MY", { timeZone: "Asia/Kuala_Lumpur" })}"`,
          tx.totalAmount.toFixed(2),
          `"${(tx.notes || "").replace(/"/g, '""')}"`,
          `"${itemsSummary}"`,
          nadiaItem ? nadiaItem.quantity : 0,
          nadiaItem ? nadiaItem.amount.toFixed(2) : "0.00",
          aininaItem ? aininaItem.quantity : 0,
          aininaItem ? aininaItem.amount.toFixed(2) : "0.00",
          afrinaItem ? afrinaItem.quantity : 0,
          afrinaItem ? afrinaItem.amount.toFixed(2) : "0.00",
        ].join(",");

        csvContent += row + "\n";
      });

      return new Response(csvContent, {
        headers: {
          "Content-Disposition": 'attachment; filename="transactions.csv"',
          "Content-Type": "text/csv; charset=utf-8",
        },
      });
    }
  } catch (error) {
    console.error("Error exporting transactions:", error);
    return NextResponse.json(
      { error: "Failed to export transactions" },
      { status: 500 }
    );
  }
}
