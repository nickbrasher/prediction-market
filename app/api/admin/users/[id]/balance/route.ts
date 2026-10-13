import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session?.isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const { amount } = await req.json();

  if (!Number.isInteger(amount) || amount === 0) {
    return NextResponse.json({ error: "Amount must be a non-zero whole number" }, { status: 400 });
  }

  const user = await prisma.$transaction(async (tx) => {
    // Negative grants deduct points, but never below zero.
    const updated = await tx.user.updateMany({
      where: { id, ...(amount < 0 ? { pointBalance: { gte: -amount } } : {}) },
      data: { pointBalance: { increment: amount } },
    });
    if (updated.count === 0) return null;

    await tx.transaction.create({
      data: { userId: id, amount, type: "ADMIN_GRANT" },
    });

    return tx.user.findUniqueOrThrow({
      where: { id },
      select: { id: true, username: true, pointBalance: true },
    });
  });

  if (!user) {
    return NextResponse.json({ error: "User not found or balance too low" }, { status: 400 });
  }

  return NextResponse.json(user);
}
