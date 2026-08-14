"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { calcImpliedProbability, formatPct, formatOdds } from "@/lib/odds";

interface Outcome {
  id: string;
  label: string;
  poolTotal: number;
}

interface Market {
  id: string;
  title: string;
  description: string;
  type: string;
  status: string;
  line: number | null;
  closesAt: string | null;
  resolvedOutcomeId: string | null;
  outcomes: Outcome[];
  bets: {
    id: string;
    amountWagered: number;
    payoutReceived: number | null;
    createdAt: string;
    user: { username: string };
    outcome: { label: string };
  }[];
}

export default function MarketDetail() {
  const { id } = useParams<{ id: string }>();
  const [market, setMarket] = useState<Market | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedOutcome, setSelectedOutcome] = useState("");
  const [amount, setAmount] = useState("");
  const [betLoading, setBetLoading] = useState(false);
  const [betError, setBetError] = useState("");
  const [betSuccess, setBetSuccess] = useState("");
  const [userBalance, setUserBalance] = useState<number | null>(null);

  const loadMarket = useCallback(() => {
    fetch(`/api/markets/${id}`)
      .then((r) => r.json())
      .then((d: Market) => { setMarket(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    loadMarket();
    fetch("/api/profile")
      .then((r) => r.ok ? r.json() : null)
      .then((d: { user: { pointBalance: number } } | null) => d && setUserBalance(d.user.pointBalance));
  }, [id, loadMarket]);

  async function placeBet(e: React.FormEvent) {
    e.preventDefault();
    setBetError("");
    setBetSuccess("");
    if (!selectedOutcome || !amount || Number(amount) <= 0) {
      setBetError("Select an outcome and enter a valid amount.");
      return;
    }
    setBetLoading(true);
    const res = await fetch(`/api/markets/${id}/bets`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ outcomeId: selectedOutcome, amount: Number(amount) }),
    });
    const data = await res.json();
    setBetLoading(false);
    if (!res.ok) {
      setBetError(data.error);
      return;
    }
    setBetSuccess("Bet placed!");
    setAmount("");
    loadMarket();
    fetch("/api/profile").then((r) => r.ok ? r.json() : null).then((d) => d && setUserBalance(d.user.pointBalance));
  }

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-8 bg-slate-800 rounded w-2/3" />
        <div className="h-48 bg-[#1a1d27] border border-slate-800 rounded-xl" />
      </div>
    );
  }

  if (!market) return <p className="text-slate-400">Market not found.</p>;

  const totalPool = market.outcomes.reduce((s, o) => s + o.poolTotal, 0);
  const isOpen = market.status === "OPEN";

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div>
        <div className="flex items-center gap-2 mb-2">
          <span className={`text-xs px-2 py-0.5 rounded-full border ${
            market.status === "OPEN" ? "text-green-400 bg-green-400/10 border-green-400/20" :
            market.status === "RESOLVED" ? "text-slate-400 bg-slate-400/10 border-slate-400/20" :
            "text-yellow-400 bg-yellow-400/10 border-yellow-400/20"
          }`}>
            {market.status}
          </span>
          <span className="text-xs text-slate-500 bg-slate-800 px-2 py-0.5 rounded">
            {market.type.replace("_", " ")}
          </span>
        </div>
        <h1 className="text-2xl font-bold text-white">{market.title}</h1>
        {market.line !== null && (
          <p className="text-slate-400 text-sm mt-1">Line: {market.line}</p>
        )}
        <p className="text-slate-300 mt-3">{market.description}</p>
        {market.closesAt && (
          <p className="text-slate-500 text-sm mt-2">
            Closes {new Date(market.closesAt).toLocaleString()}
          </p>
        )}
      </div>

      <div className="bg-[#1a1d27] border border-slate-800 rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold">Current Odds</h2>
          <span className="text-sm text-slate-400">{totalPool.toLocaleString()} pts in pool</span>
        </div>
        <div className="space-y-3">
          {market.outcomes.map((outcome) => {
            const prob = calcImpliedProbability(outcome, market.outcomes);
            const isWinner = market.resolvedOutcomeId === outcome.id;
            return (
              <div key={outcome.id} className={`rounded-lg p-3 border transition-all ${isWinner ? "border-green-500 bg-green-900/20" : "border-slate-700 bg-slate-900/50"}`}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-slate-100">{outcome.label}</span>
                    {isWinner && <span className="text-xs text-green-400 bg-green-400/10 px-2 py-0.5 rounded-full">Winner</span>}
                  </div>
                  <div className="text-right">
                    <span className="text-lg font-bold text-indigo-400">{formatPct(prob)}</span>
                    <span className="text-xs text-slate-500 block">{formatOdds(prob)}</span>
                  </div>
                </div>
                <div className="bg-slate-800 rounded-full h-2 overflow-hidden">
                  <div
                    className="h-full bg-indigo-500 rounded-full transition-all"
                    style={{ width: `${prob * 100}%` }}
                  />
                </div>
                <p className="text-xs text-slate-500 mt-1">{outcome.poolTotal.toLocaleString()} pts wagered</p>
              </div>
            );
          })}
        </div>
      </div>

      {isOpen && (
        <div className="bg-[#1a1d27] border border-slate-800 rounded-xl p-5">
          <h2 className="font-semibold mb-4">Place a Bet</h2>
          {userBalance !== null && (
            <p className="text-sm text-slate-400 mb-4">Your balance: <span className="text-indigo-400 font-medium">{userBalance.toLocaleString()} pts</span></p>
          )}

          <form onSubmit={placeBet} className="space-y-4">
            {betError && (
              <div className="bg-red-900/30 border border-red-700 text-red-300 rounded-lg px-3 py-2 text-sm">{betError}</div>
            )}
            {betSuccess && (
              <div className="bg-green-900/30 border border-green-700 text-green-300 rounded-lg px-3 py-2 text-sm">{betSuccess}</div>
            )}

            <div className="space-y-2">
              {market.outcomes.map((outcome) => (
                <button
                  key={outcome.id}
                  type="button"
                  onClick={() => setSelectedOutcome(outcome.id)}
                  className={`w-full text-left px-4 py-3 rounded-lg border transition-all ${
                    selectedOutcome === outcome.id
                      ? "border-indigo-500 bg-indigo-900/30 text-white"
                      : "border-slate-700 bg-slate-900/50 text-slate-300 hover:border-slate-600"
                  }`}
                >
                  {outcome.label}
                </button>
              ))}
            </div>

            <div>
              <label className="block text-sm text-slate-300 mb-1.5">Amount (points)</label>
              <input
                type="number"
                min="1"
                max={userBalance ?? undefined}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
                placeholder="Enter amount"
              />
            </div>

            {selectedOutcome && amount && Number(amount) > 0 && (() => {
              const outcome = market.outcomes.find((o) => o.id === selectedOutcome);
              if (!outcome) return null;
              const newPool = totalPool + Number(amount);
              const newOutcomePool = outcome.poolTotal + Number(amount);
              const estPayout = Math.floor((Number(amount) / newOutcomePool) * newPool);
              return (
                <div className="bg-slate-900 rounded-lg px-3 py-2 text-sm">
                  <p className="text-slate-400">Est. payout if you win: <span className="text-green-400 font-medium">{estPayout.toLocaleString()} pts</span></p>
                </div>
              );
            })()}

            <button
              type="submit"
              disabled={betLoading || !selectedOutcome}
              className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-800 disabled:cursor-not-allowed text-white font-medium py-2.5 rounded-lg transition-colors"
            >
              {betLoading ? "Placing bet…" : "Place Bet"}
            </button>
          </form>
        </div>
      )}

      {market.bets.length > 0 && (
        <div className="bg-[#1a1d27] border border-slate-800 rounded-xl p-5">
          <h2 className="font-semibold mb-4">Recent Bets</h2>
          <div className="space-y-2">
            {market.bets.map((bet) => (
              <div key={bet.id} className="flex items-center gap-3 text-sm text-slate-300">
                <span className="text-slate-500 font-mono">@{bet.user.username}</span>
                <span className="flex-1 text-slate-400">{bet.outcome.label}</span>
                <span className="text-white font-medium">{bet.amountWagered.toLocaleString()} pts</span>
                {bet.payoutReceived !== null && (
                  <span className={`font-medium ${bet.payoutReceived > 0 ? "text-green-400" : "text-red-400"}`}>
                    +{bet.payoutReceived.toLocaleString()}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
