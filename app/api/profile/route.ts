import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: {
      id: true,
      username: true,
      email: true,
      pointBalance: true,
      isAdmin: true,
      createdAt: true,
    },
  });

  const bets = await prisma.bet.findMany({
    where: { userId: session.userId },
    include: {
      market: { select: { id: true, title: true, status: true, resolvedOutcomeId: true } },
      outcome: { select: { id: true, label: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const totalWagered = bets.reduce((sum, b) => sum + b.amountWagered, 0);
  const resolvedBets = bets.filter((b) => b.market.status === "RESOLVED");
  const wins = resolvedBets.filter((b) => b.outcome.id === b.market.resolvedOutcomeId).length;
  const winRate = resolvedBets.length > 0 ? wins / resolvedBets.length : 0;

  return NextResponse.json({ user, bets, stats: { totalWagered, wins, losses: resolvedBets.length - wins, winRate } });
}
