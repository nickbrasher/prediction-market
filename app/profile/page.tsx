"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface ProfileData {
  user: {
    id: string;
    username: string;
    email: string;
    pointBalance: number;
    isAdmin: boolean;
    createdAt: string;
  };
  bets: {
    id: string;
    amountWagered: number;
    payoutReceived: number | null;
    createdAt: string;
    market: { id: string; title: string; status: string; resolvedOutcomeId: string | null };
    outcome: { id: string; label: string };
  }[];
  stats: {
    totalWagered: number;
    wins: number;
    losses: number;
    winRate: number;
  };
}

export default function ProfilePage() {
  const [data, setData] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/profile")
      .then((r) => r.json())
      .then((d) => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="animate-pulse space-y-4"><div className="h-32 bg-[#1a1d27] rounded-xl" /><div className="h-64 bg-[#1a1d27] rounded-xl" /></div>;
  }

  if (!data) return <p className="text-slate-400">Failed to load profile.</p>;

  const { user, bets, stats } = data;

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="bg-gradient-to-br from-indigo-900/40 to-slate-900 border border-indigo-800/40 rounded-2xl p-6">
        <p className="text-slate-400 text-sm mb-1">@{user.username}</p>
        <p className="text-4xl font-bold text-white">
          {user.pointBalance.toLocaleString()} <span className="text-indigo-400 text-2xl">pts</span>
        </p>
        <p className="text-slate-500 text-xs mt-2">{user.email}</p>
        {user.isAdmin && <span className="text-xs text-amber-400 bg-amber-400/10 border border-amber-400/20 px-2 py-0.5 rounded-full mt-2 inline-block">Admin</span>}
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="bg-[#1a1d27] border border-slate-800 rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-white">{bets.length}</p>
          <p className="text-xs text-slate-400 mt-1">Total Bets</p>
        </div>
        <div className="bg-[#1a1d27] border border-slate-800 rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-green-400">{stats.wins}</p>
          <p className="text-xs text-slate-400 mt-1">Wins</p>
        </div>
        <div className="bg-[#1a1d27] border border-slate-800 rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-indigo-400">{(stats.winRate * 100).toFixed(0)}%</p>
          <p className="text-xs text-slate-400 mt-1">Win Rate</p>
        </div>
      </div>

      <div className="bg-[#1a1d27] border border-slate-800 rounded-xl p-5">
        <h2 className="font-semibold mb-4">Bet History</h2>
        {bets.length === 0 ? (
          <p className="text-slate-400 text-sm text-center py-4">
            No bets yet.{" "}
            <Link href="/markets" className="text-indigo-400 hover:underline">Browse markets</Link>
          </p>
        ) : (
          <div className="space-y-3">
            {bets.map((bet) => {
              const isResolved = bet.market.status === "RESOLVED";
              const isWin = isResolved && bet.outcome.id === bet.market.resolvedOutcomeId;
              const isLoss = isResolved && bet.outcome.id !== bet.market.resolvedOutcomeId;

              return (
                <div key={bet.id} className="flex items-start gap-3 py-2 border-b border-slate-800 last:border-0">
                  <div className="flex-1 min-w-0">
                    <Link href={`/markets/${bet.market.id}`} className="text-sm font-medium text-slate-200 hover:text-indigo-400 line-clamp-1 block">
                      {bet.market.title}
                    </Link>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Bet on: <span className="text-slate-300">{bet.outcome.label}</span>
                    </p>
                    <p className="text-xs text-slate-500">{new Date(bet.createdAt).toLocaleDateString()}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-medium text-white">-{bet.amountWagered.toLocaleString()}</p>
                    {isWin && bet.payoutReceived !== null && (
                      <p className="text-xs text-green-400">+{bet.payoutReceived.toLocaleString()} win</p>
                    )}
                    {isLoss && <p className="text-xs text-red-400">Lost</p>}
                    {!isResolved && (
                      <span className="text-xs text-indigo-400 bg-indigo-400/10 px-1.5 py-0.5 rounded">{bet.market.status}</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
