"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

interface Market {
  id: string;
  title: string;
  type: string;
  status: string;
  outcomes: { id: string; label: string; poolTotal: number; marketId: string }[];
  _count: { bets: number };
}

const statusColor: Record<string, string> = {
  OPEN: "text-green-400 bg-green-400/10 border-green-400/20",
  CLOSED: "text-yellow-400 bg-yellow-400/10 border-yellow-400/20",
  RESOLVED: "text-slate-400 bg-slate-400/10 border-slate-400/20",
};

export default function AdminMarketsClient({ markets: initial }: { markets: Market[] }) {
  const router = useRouter();
  const [markets, setMarkets] = useState(initial);

  async function deleteMarket(id: string) {
    if (!confirm("Delete this market and all its bets?")) return;
    await fetch(`/api/markets/${id}`, { method: "DELETE" });
    setMarkets((prev) => prev.filter((m) => m.id !== id));
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Markets</h1>
        <Link
          href="/admin/markets/new"
          className="bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
        >
          + New Market
        </Link>
      </div>

      {markets.length === 0 ? (
        <p className="text-slate-400 text-center py-12">No markets yet.</p>
      ) : (
        <div className="space-y-3">
          {markets.map((market) => {
            const totalPool = market.outcomes.reduce((s, o) => s + o.poolTotal, 0);
            return (
              <div key={market.id} className="bg-[#1a1d27] border border-slate-800 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-xs px-2 py-0.5 rounded-full border ${statusColor[market.status] ?? ""}`}>
                        {market.status}
                      </span>
                      <span className="text-xs text-slate-500">{market.type.replace("_", " ")}</span>
                    </div>
                    <h3 className="font-medium text-slate-100">{market.title}</h3>
                    <p className="text-xs text-slate-500 mt-1">
                      {market._count.bets} bets · {totalPool.toLocaleString()} pts in pool
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 flex-wrap justify-end">
                    {market.status !== "RESOLVED" && (
                      <Link
                        href={`/admin/markets/${market.id}/resolve`}
                        className="text-xs text-amber-400 hover:text-amber-300 bg-amber-400/10 border border-amber-400/20 px-2 py-1 rounded-lg transition-colors"
                      >
                        Resolve
                      </Link>
                    )}
                    <Link
                      href={`/markets/${market.id}`}
                      className="text-xs text-indigo-400 hover:text-indigo-300 bg-indigo-400/10 border border-indigo-400/20 px-2 py-1 rounded-lg transition-colors"
                    >
                      View
                    </Link>
                    <button
                      onClick={() => deleteMarket(market.id)}
                      className="text-xs text-red-400 hover:text-red-300 bg-red-400/10 border border-red-400/20 px-2 py-1 rounded-lg transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
