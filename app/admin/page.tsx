import { redirect } from "next/navigation";
import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function AdminDashboard() {
  await requireAdmin().catch(() => redirect("/"));

  const [userCount, totalPoints, openMarkets, pendingResolution] = await Promise.all([
    prisma.user.count(),
    prisma.user.aggregate({ _sum: { pointBalance: true } }),
    prisma.market.count({ where: { status: "OPEN" } }),
    prisma.market.count({ where: { status: "CLOSED" } }),
  ]);

  const recentBets = await prisma.bet.findMany({
    include: {
      user: { select: { username: true } },
      market: { select: { title: true } },
      outcome: { select: { label: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 10,
  });

  const stats = [
    { label: "Total Users", value: userCount, href: "/admin/users" },
    { label: "Points in Circulation", value: (totalPoints._sum.pointBalance ?? 0).toLocaleString(), href: "/admin/users" },
    { label: "Open Markets", value: openMarkets, href: "/admin/markets" },
    { label: "Awaiting Resolution", value: pendingResolution, href: "/admin/markets" },
  ];

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Admin</h1>
        <Link href="/admin/markets/new" className="bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors">
          + New Market
        </Link>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {stats.map((s) => (
          <Link key={s.label} href={s.href} className="bg-[#1a1d27] border border-slate-800 rounded-xl p-4 hover:border-indigo-700 transition-colors">
            <p className="text-2xl font-bold text-white">{s.value}</p>
            <p className="text-xs text-slate-400 mt-1">{s.label}</p>
          </Link>
        ))}
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <Link href="/admin/markets" className="bg-[#1a1d27] border border-slate-800 rounded-xl p-5 hover:border-indigo-700 transition-colors group">
          <h2 className="font-semibold group-hover:text-indigo-400 transition-colors">Manage Markets →</h2>
          <p className="text-sm text-slate-400 mt-1">Create, edit, and resolve prediction markets</p>
        </Link>
        <Link href="/admin/users" className="bg-[#1a1d27] border border-slate-800 rounded-xl p-5 hover:border-indigo-700 transition-colors group">
          <h2 className="font-semibold group-hover:text-indigo-400 transition-colors">Manage Users →</h2>
          <p className="text-sm text-slate-400 mt-1">Adjust balances, grant points, manage admin roles</p>
        </Link>
      </div>

      <div className="bg-[#1a1d27] border border-slate-800 rounded-xl p-5">
        <h2 className="font-semibold mb-4">Recent Bets</h2>
        {recentBets.length === 0 ? (
          <p className="text-slate-400 text-sm">No bets yet.</p>
        ) : (
          <div className="space-y-2">
            {recentBets.map((bet) => (
              <div key={bet.id} className="flex items-center gap-3 text-sm py-1.5 border-b border-slate-800 last:border-0">
                <span className="text-slate-500">@{bet.user.username}</span>
                <span className="flex-1 text-slate-400 truncate">{bet.market.title}</span>
                <span className="text-slate-300 shrink-0">{bet.outcome.label}</span>
                <span className="text-white font-medium shrink-0">{bet.amountWagered.toLocaleString()} pts</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
