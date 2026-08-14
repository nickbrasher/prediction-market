import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import MarketCard from "@/components/MarketCard";

export default async function Dashboard() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const markets = await prisma.market.findMany({
    where: { status: "OPEN" },
    include: { outcomes: true },
    orderBy: { createdAt: "desc" },
    take: 6,
  });

  const leaders = await prisma.user.findMany({
    select: { id: true, username: true, pointBalance: true },
    orderBy: { pointBalance: "desc" },
    take: 5,
  });

  return (
    <div className="space-y-8">
      <div className="bg-gradient-to-br from-indigo-900/40 to-slate-900 border border-indigo-800/40 rounded-2xl p-6">
        <p className="text-slate-400 text-sm mb-1">Your balance</p>
        <p className="text-4xl font-bold text-white">
          {user.pointBalance.toLocaleString()}{" "}
          <span className="text-indigo-400 text-2xl">pts</span>
        </p>
        <p className="text-slate-400 text-sm mt-1">@{user.username}</p>
      </div>

      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Open Markets</h2>
          <Link href="/markets" className="text-sm text-indigo-400 hover:text-indigo-300">
            View all →
          </Link>
        </div>
        {markets.length === 0 ? (
          <p className="text-slate-400 text-sm bg-[#1a1d27] border border-slate-800 rounded-xl p-6 text-center">
            No open markets yet.{" "}
            {user.isAdmin && (
              <Link href="/admin/markets/new" className="text-indigo-400 hover:underline">
                Create one
              </Link>
            )}
          </p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {markets.map((m) => (
              <MarketCard key={m.id} market={m} />
            ))}
          </div>
        )}
      </section>

      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Leaderboard</h2>
          <Link href="/leaderboard" className="text-sm text-indigo-400 hover:text-indigo-300">
            Full board →
          </Link>
        </div>
        <div className="bg-[#1a1d27] border border-slate-800 rounded-xl overflow-hidden">
          {leaders.map((u, i) => (
            <div
              key={u.id}
              className={`flex items-center gap-3 px-4 py-3 ${i < leaders.length - 1 ? "border-b border-slate-800" : ""}`}
            >
              <span
                className={`text-sm font-bold w-6 text-center ${
                  i === 0
                    ? "text-yellow-400"
                    : i === 1
                    ? "text-slate-300"
                    : i === 2
                    ? "text-amber-600"
                    : "text-slate-500"
                }`}
              >
                {i + 1}
              </span>
              <span
                className={`flex-1 text-sm ${u.id === user.id ? "text-indigo-400 font-semibold" : "text-slate-200"}`}
              >
                @{u.username}
              </span>
              <span className="text-sm font-medium text-slate-300">
                {u.pointBalance.toLocaleString()} pts
              </span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
