"use client";

import { useEffect, useState } from "react";

interface LeaderUser {
  id: string;
  username: string;
  pointBalance: number;
  _count: { bets: number };
}

export default function LeaderboardPage() {
  const [users, setUsers] = useState<LeaderUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentId, setCurrentId] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      fetch("/api/leaderboard").then((r) => r.json()),
      fetch("/api/profile").then((r) => r.ok ? r.json() : null),
    ]).then(([lb, profile]) => {
      setUsers(lb);
      if (profile) setCurrentId(profile.user.id);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const medals = ["🥇", "🥈", "🥉"];

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold">Leaderboard</h1>

      {loading ? (
        <div className="space-y-2">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="h-14 bg-[#1a1d27] border border-slate-800 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="bg-[#1a1d27] border border-slate-800 rounded-xl overflow-hidden">
          {users.map((u, i) => (
            <div
              key={u.id}
              className={`flex items-center gap-4 px-4 py-3.5 ${i < users.length - 1 ? "border-b border-slate-800" : ""} ${u.id === currentId ? "bg-indigo-900/20" : ""}`}
            >
              <span className="w-8 text-center text-sm font-bold">
                {i < 3 ? medals[i] : <span className="text-slate-500">{i + 1}</span>}
              </span>
              <div className="flex-1">
                <p className={`font-medium ${u.id === currentId ? "text-indigo-400" : "text-slate-100"}`}>
                  @{u.username}
                  {u.id === currentId && <span className="text-xs text-slate-500 ml-2">(you)</span>}
                </p>
                <p className="text-xs text-slate-500">{u._count.bets} bets placed</p>
              </div>
              <span className="font-bold text-white">{u.pointBalance.toLocaleString()} <span className="text-indigo-400 text-sm">pts</span></span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
