import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: marketId } = await params;
  const { outcomeId, amount } = await req.json();

  if (!outcomeId || !amount || amount <= 0) {
    return NextResponse.json({ error: "Invalid bet parameters" }, { status: 400 });
  }

  const market = await prisma.market.findUnique({
    where: { id: marketId },
    include: { outcomes: true },
  });

  if (!market) return NextResponse.json({ error: "Market not found" }, { status: 404 });
  if (market.status !== "OPEN") {
    return NextResponse.json({ error: "Market is not open for betting" }, { status: 400 });
  }

  const outcome = market.outcomes.find((o) => o.id === outcomeId);
  if (!outcome) return NextResponse.json({ error: "Outcome not found" }, { status: 404 });

  const user = await prisma.user.findUnique({ where: { id: session.userId } });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });
  if (user.pointBalance < amount) {
    return NextResponse.json({ error: "Insufficient points" }, { status: 400 });
  }

  const [bet] = await prisma.$transaction([
    prisma.bet.create({
      data: {
        userId: session.userId,
        marketId,
        outcomeId,
        amountWagered: amount,
      },
    }),
    prisma.outcome.update({
      where: { id: outcomeId },
      data: { poolTotal: { increment: amount } },
    }),
    prisma.user.update({
      where: { id: session.userId },
      data: { pointBalance: { decrement: amount } },
    }),
  ]);

  await prisma.transaction.create({
    data: {
      userId: session.userId,
      amount: -amount,
      type: "BET_PLACED",
      relatedBetId: bet.id,
    },
  });

  return NextResponse.json(bet, { status: 201 });
}
