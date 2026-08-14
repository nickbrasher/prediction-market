import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session?.isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const { amount } = await req.json();

  if (typeof amount !== "number") {
    return NextResponse.json({ error: "Amount must be a number" }, { status: 400 });
  }

  const user = await prisma.user.update({
    where: { id },
    data: { pointBalance: { increment: amount } },
    select: { id: true, username: true, pointBalance: true },
  });

  await prisma.transaction.create({
    data: { userId: id, amount, type: "ADMIN_GRANT" },
  });

  return NextResponse.json(user);
}
