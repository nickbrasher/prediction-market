"use client";

import Link from "next/link";
import { calcImpliedProbability, formatPct } from "@/lib/odds";

interface Outcome {
  id: string;
  label: string;
  poolTotal: number;
  marketId?: string;
}

interface Market {
  id: string;
  title: string;
  type: string;
  status: string;
  line: number | null;
  closesAt: Date | string | null;
  outcomes: Outcome[];
}

export default function MarketCard({ market }: { market: Market }) {
  const totalPool = market.outcomes.reduce((s, o) => s + o.poolTotal, 0);

  const statusColor = {
    OPEN: "text-green-400 bg-green-400/10 border-green-400/20",
    CLOSED: "text-yellow-400 bg-yellow-400/10 border-yellow-400/20",
    RESOLVED: "text-slate-400 bg-slate-400/10 border-slate-400/20",
  }[market.status] ?? "text-slate-400";

  const typeLabel = {
    YES_NO: "Yes/No",
    OVER_UNDER: "O/U",
    MULTIPLE_CHOICE: "Multi",
  }[market.type] ?? market.type;

  return (
    <Link href={`/markets/${market.id}`} className="block bg-[#1a1d27] border border-slate-800 rounded-xl p-4 hover:border-indigo-700 hover:bg-[#1e2130] transition-all">
      <div className="flex items-start justify-between gap-2 mb-3">
        <h3 className="font-semibold text-slate-100 leading-snug line-clamp-2">{market.title}</h3>
        <span className={`shrink-0 text-xs px-2 py-0.5 rounded-full border ${statusColor}`}>
          {market.status}
        </span>
      </div>

      <div className="flex items-center gap-2 mb-3 text-xs text-slate-500">
        <span className="bg-slate-800 px-2 py-0.5 rounded">{typeLabel}</span>
        {market.line !== null && <span>Line: {market.line}</span>}
        <span className="ml-auto">{totalPool.toLocaleString()} pts in pool</span>
      </div>

      <div className="space-y-1.5">
        {market.outcomes.map((outcome) => {
          const prob = calcImpliedProbability(outcome, market.outcomes);
          return (
            <div key={outcome.id} className="flex items-center gap-2">
              <span className="text-sm text-slate-300 w-24 truncate">{outcome.label}</span>
              <div className="flex-1 bg-slate-800 rounded-full h-2 overflow-hidden">
                <div
                  className="h-full bg-indigo-500 rounded-full transition-all"
                  style={{ width: `${prob * 100}%` }}
                />
              </div>
              <span className="text-sm font-medium text-indigo-400 w-12 text-right">{formatPct(prob)}</span>
            </div>
          );
        })}
      </div>

      {market.closesAt && (
        <p className="text-xs text-slate-500 mt-3">
          Closes {new Date(market.closesAt as string).toLocaleDateString()}
        </p>
      )}
    </Link>
  );
}
