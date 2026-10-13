import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

class BetError extends Error {
  constructor(message: string, public status: number) {
    super(message);
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: marketId } = await params;
  const { outcomeId, amount } = await req.json();

  if (!outcomeId || !Number.isInteger(amount) || amount <= 0) {
    return NextResponse.json({ error: "Invalid bet parameters" }, { status: 400 });
  }

  try {
    const bet = await prisma.$transaction(async (tx) => {
      const market = await tx.market.findUnique({
        where: { id: marketId },
        include: { outcomes: true },
      });

      if (!market) throw new BetError("Market not found", 404);
      if (market.status !== "OPEN") throw new BetError("Market is not open for betting", 400);
      if (market.closesAt && market.closesAt <= new Date()) {
        throw new BetError("Market has closed", 400);
      }
      if (!market.outcomes.some((o) => o.id === outcomeId)) {
        throw new BetError("Outcome not found", 404);
      }

      // Conditional decrement so concurrent bets can't push the balance below zero.
      const debited = await tx.user.updateMany({
        where: { id: session.userId, pointBalance: { gte: amount } },
        data: { pointBalance: { decrement: amount } },
      });
      if (debited.count === 0) throw new BetError("Insufficient points", 400);

      const bet = await tx.bet.create({
        data: {
          userId: session.userId,
          marketId,
          outcomeId,
          amountWagered: amount,
        },
      });

      await tx.outcome.update({
        where: { id: outcomeId },
        data: { poolTotal: { increment: amount } },
      });

      await tx.transaction.create({
        data: {
          userId: session.userId,
          amount: -amount,
          type: "BET_PLACED",
          relatedBetId: bet.id,
        },
      });

      return bet;
    });

    return NextResponse.json(bet, { status: 201 });
  } catch (err) {
    if (err instanceof BetError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    throw err;
  }
}
