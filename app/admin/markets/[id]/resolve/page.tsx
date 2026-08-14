"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { calcImpliedProbability, formatPct } from "@/lib/odds";

interface Outcome {
  id: string;
  label: string;
  poolTotal: number;
}

interface Market {
  id: string;
  title: string;
  status: string;
  outcomes: Outcome[];
  _count?: { bets: number };
}

export default function ResolveMarketPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [market, setMarket] = useState<Market | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedWinner, setSelectedWinner] = useState("");
  const [resolving, setResolving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`/api/markets/${id}`)
      .then((r) => r.json())
      .then((d) => { setMarket(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [id]);

  async function resolve() {
    if (!selectedWinner) return;
    if (!confirm("This will distribute payouts to all winning bets. Continue?")) return;
    setResolving(true);
    setError("");
    const res = await fetch(`/api/markets/${id}/resolve`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ winningOutcomeId: selectedWinner }),
    });
    const data = await res.json();
    setResolving(false);
    if (!res.ok) {
      setError(data.error);
      return;
    }
    router.push("/admin/markets");
    router.refresh();
  }

  if (loading) return <div className="animate-pulse h-48 bg-[#1a1d27] rounded-xl" />;
  if (!market) return <p className="text-slate-400">Market not found.</p>;
  if (market.status === "RESOLVED") {
    return (
      <div className="max-w-lg mx-auto text-center py-12">
        <p className="text-slate-400">This market has already been resolved.</p>
      </div>
    );
  }

  const totalPool = market.outcomes.reduce((s, o) => s + o.poolTotal, 0);
  return (
    <div className="max-w-lg mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Resolve Market</h1>

      <div className="bg-[#1a1d27] border border-slate-800 rounded-xl p-5">
        <h2 className="font-semibold text-lg mb-1">{market.title}</h2>
        <p className="text-sm text-slate-400">{totalPool.toLocaleString()} total points in pool</p>
      </div>

      {error && (
        <div className="bg-red-900/30 border border-red-700 text-red-300 rounded-lg px-3 py-2 text-sm">{error}</div>
      )}

      <div className="bg-[#1a1d27] border border-slate-800 rounded-xl p-5 space-y-4">
        <h2 className="font-semibold">Select Winning Outcome</h2>
        <div className="space-y-2">
          {market.outcomes.map((outcome) => {
            const prob = calcImpliedProbability(outcome, market.outcomes);
            const estPayout = totalPool > 0 && outcome.poolTotal > 0
              ? Math.floor(totalPool / outcome.poolTotal)
              : 0;
            return (
              <button
                key={outcome.id}
                type="button"
                onClick={() => setSelectedWinner(outcome.id)}
                className={`w-full text-left px-4 py-3 rounded-lg border transition-all ${
                  selectedWinner === outcome.id
                    ? "border-green-500 bg-green-900/20"
                    : "border-slate-700 bg-slate-900/50 hover:border-slate-600"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium text-slate-100">{outcome.label}</span>
                  <div className="text-right">
                    <span className="text-sm text-indigo-400 font-medium">{formatPct(prob)}</span>
                    <span className="text-xs text-slate-500 block">{outcome.poolTotal.toLocaleString()} pts wagered</span>
                  </div>
                </div>
                {selectedWinner === outcome.id && estPayout > 0 && (
                  <p className="text-xs text-green-400 mt-1">
                    ~{estPayout}x payout multiplier for winning bettors
                  </p>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div className="bg-amber-900/20 border border-amber-700/40 rounded-xl p-4">
        <p className="text-sm text-amber-300">
          <strong>Warning:</strong> Resolution is permanent. Payouts will be calculated and distributed immediately. Bettors on losing outcomes receive nothing back.
        </p>
      </div>

      <button
        onClick={resolve}
        disabled={!selectedWinner || resolving}
        className="w-full bg-green-600 hover:bg-green-500 disabled:bg-green-900 disabled:cursor-not-allowed text-white font-medium py-3 rounded-xl transition-colors"
      >
        {resolving ? "Resolving…" : "Resolve Market & Distribute Payouts"}
      </button>
    </div>
  );
}
