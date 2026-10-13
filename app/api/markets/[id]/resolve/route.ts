import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

class ResolveError extends Error {
  constructor(message: string, public status: number) {
    super(message);
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session?.isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id: marketId } = await params;
  const { winningOutcomeId } = await req.json();

  if (!winningOutcomeId) {
    return NextResponse.json({ error: "winningOutcomeId required" }, { status: 400 });
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      const outcome = await tx.outcome.findFirst({
        where: { id: winningOutcomeId, marketId },
      });
      if (!outcome) {
        const exists = await tx.market.count({ where: { id: marketId } });
        throw exists
          ? new ResolveError("Outcome not found", 404)
          : new ResolveError("Market not found", 404);
      }

      // Flip status first so a concurrent resolve or bet can't slip in.
      const flipped = await tx.market.updateMany({
        where: { id: marketId, status: { not: "RESOLVED" } },
        data: { status: "RESOLVED", resolvedOutcomeId: winningOutcomeId },
      });
      if (flipped.count === 0) throw new ResolveError("Already resolved", 400);

      const market = await tx.market.findUniqueOrThrow({
        where: { id: marketId },
        include: { outcomes: true, bets: true },
      });

      const totalPool = market.outcomes.reduce((sum, o) => sum + o.poolTotal, 0);
      const winningPool = market.outcomes.find((o) => o.id === winningOutcomeId)!.poolTotal;

      // If nobody backed the winner, refund every bet instead of burning the pool.
      const refund = winningPool === 0;
      const paidBets = refund
        ? market.bets
        : market.bets.filter((b) => b.outcomeId === winningOutcomeId);

      for (const bet of paidBets) {
        const payout = refund
          ? bet.amountWagered
          : Math.floor((bet.amountWagered / winningPool) * totalPool);

        await tx.bet.update({
          where: { id: bet.id },
          data: { payoutReceived: payout },
        });
        await tx.user.update({
          where: { id: bet.userId },
          data: { pointBalance: { increment: payout } },
        });
        await tx.transaction.create({
          data: {
            userId: bet.userId,
            amount: payout,
            type: "PAYOUT_RECEIVED",
            relatedBetId: bet.id,
          },
        });
      }

      return { totalPool, payoutsCount: paidBets.length, refunded: refund };
    });

    return NextResponse.json({ success: true, ...result });
  } catch (err) {
    if (err instanceof ResolveError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    throw err;
  }
}
