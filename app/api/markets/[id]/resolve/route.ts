import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session?.isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id: marketId } = await params;
  const { winningOutcomeId } = await req.json();

  if (!winningOutcomeId) {
    return NextResponse.json({ error: "winningOutcomeId required" }, { status: 400 });
  }

  const market = await prisma.market.findUnique({
    where: { id: marketId },
    include: { outcomes: true, bets: true },
  });

  if (!market) return NextResponse.json({ error: "Market not found" }, { status: 404 });
  if (market.status === "RESOLVED") {
    return NextResponse.json({ error: "Already resolved" }, { status: 400 });
  }

  const winningOutcome = market.outcomes.find((o) => o.id === winningOutcomeId);
  if (!winningOutcome) return NextResponse.json({ error: "Outcome not found" }, { status: 404 });

  const totalPool = market.outcomes.reduce((sum, o) => sum + o.poolTotal, 0);
  const winningPool = winningOutcome.poolTotal;

  const winningBets = market.bets.filter((b) => b.outcomeId === winningOutcomeId);

  const payouts: { betId: string; userId: string; payout: number }[] = winningBets.map((bet) => {
    const payout = winningPool > 0 ? Math.floor((bet.amountWagered / winningPool) * totalPool) : 0;
    return { betId: bet.id, userId: bet.userId, payout };
  });

  await prisma.$transaction([
    prisma.market.update({
      where: { id: marketId },
      data: { status: "RESOLVED", resolvedOutcomeId: winningOutcomeId },
    }),
    ...payouts.map(({ betId, payout }) =>
      prisma.bet.update({
        where: { id: betId },
        data: { payoutReceived: payout },
      })
    ),
    ...payouts.map(({ userId, payout }) =>
      prisma.user.update({
        where: { id: userId },
        data: { pointBalance: { increment: payout } },
      })
    ),
    ...payouts.map(({ userId, betId, payout }) =>
      prisma.transaction.create({
        data: {
          userId,
          amount: payout,
          type: "PAYOUT_RECEIVED",
          relatedBetId: betId,
        },
      })
    ),
  ]);

  return NextResponse.json({ success: true, totalPool, payoutsCount: payouts.length });
}
