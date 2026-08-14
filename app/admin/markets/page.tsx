import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import AdminMarketsClient from "./AdminMarketsClient";

export default async function AdminMarketsPage() {
  await requireAdmin().catch(() => redirect("/"));

  const markets = await prisma.market.findMany({
    include: {
      outcomes: true,
      _count: { select: { bets: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return <AdminMarketsClient markets={markets} />;
}
