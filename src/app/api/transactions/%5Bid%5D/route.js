import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PUT(request, { params }) {
  try {
    const { id } = await params;
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

    // Perform database operations atomically
    const updatedTransaction = await prisma.$transaction(async (tx) => {
      // 1. Delete all existing transaction items for this transaction
      await tx.transactionItem.deleteMany({
        where: { transactionId: id },
      });

      // 2. Calculate the new total amount
      const totalAmount = items.reduce((sum, item) => sum + item.amount, 0);

      // 3. Update the transaction notes and create the new items
      return await tx.transaction.update({
        where: { id },
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
    });

    return NextResponse.json(updatedTransaction);
  } catch (error) {
    console.error("Error updating transaction:", error);
    return NextResponse.json(
      { error: "Failed to update transaction" },
      { status: 500 }
    );
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = await params;

    // Delete the transaction. Associated items will be deleted automatically due to cascade onDelete in Prisma
    await prisma.transaction.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting transaction:", error);
    return NextResponse.json(
      { error: "Failed to delete transaction" },
      { status: 500 }
    );
  }
}
