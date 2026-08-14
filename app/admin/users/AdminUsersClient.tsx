"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface User {
  id: string;
  username: string;
  email: string;
  pointBalance: number;
  isAdmin: boolean;
  createdAt: Date | string;
  _count: { bets: number };
}

export default function AdminUsersClient({ users: initial }: { users: User[] }) {
  const router = useRouter();
  const [users, setUsers] = useState(initial);
  const [adjusting, setAdjusting] = useState<string | null>(null);
  const [adjustAmount, setAdjustAmount] = useState("");
  const [loading, setLoading] = useState(false);

  async function adjustBalance(userId: string) {
    const amount = Number(adjustAmount);
    if (!amount) return;
    setLoading(true);
    const res = await fetch(`/api/admin/users/${userId}/balance`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount }),
    });
    const data = await res.json();
    setLoading(false);
    if (res.ok) {
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, pointBalance: data.pointBalance } : u))
      );
      setAdjusting(null);
      setAdjustAmount("");
      router.refresh();
    }
  }

  async function toggleAdmin(userId: string, current: boolean) {
    if (!confirm(`${current ? "Remove" : "Grant"} admin access for this user?`)) return;
    const res = await fetch(`/api/admin/users/${userId}/admin`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isAdmin: !current }),
    });
    if (res.ok) {
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, isAdmin: !current } : u))
      );
      router.refresh();
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Users</h1>

      <div className="space-y-3">
        {users.map((user) => (
          <div key={user.id} className="bg-[#1a1d27] border border-slate-800 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-medium text-slate-100">@{user.username}</span>
                  {user.isAdmin && (
                    <span className="text-xs text-amber-400 bg-amber-400/10 border border-amber-400/20 px-1.5 py-0.5 rounded">Admin</span>
                  )}
                  <span className="text-sm font-bold text-indigo-400">{user.pointBalance.toLocaleString()} pts</span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">{user.email}</p>
                <p className="text-xs text-slate-500">{user._count.bets} bets · joined {new Date(user.createdAt).toLocaleDateString()}</p>
              </div>

              <div className="flex items-center gap-2 shrink-0 flex-wrap justify-end">
                <button
                  onClick={() => { setAdjusting(adjusting === user.id ? null : user.id); setAdjustAmount(""); }}
                  className="text-xs text-indigo-400 hover:text-indigo-300 bg-indigo-400/10 border border-indigo-400/20 px-2 py-1 rounded-lg transition-colors"
                >
                  Adjust pts
                </button>
                <button
                  onClick={() => toggleAdmin(user.id, user.isAdmin)}
                  className={`text-xs px-2 py-1 rounded-lg border transition-colors ${
                    user.isAdmin
                      ? "text-red-400 hover:text-red-300 bg-red-400/10 border-red-400/20"
                      : "text-amber-400 hover:text-amber-300 bg-amber-400/10 border-amber-400/20"
                  }`}
                >
                  {user.isAdmin ? "Remove admin" : "Make admin"}
                </button>
              </div>
            </div>

            {adjusting === user.id && (
              <div className="mt-3 flex gap-2">
                <input
                  type="number"
                  value={adjustAmount}
                  onChange={(e) => setAdjustAmount(e.target.value)}
                  placeholder="e.g. 500 or -100"
                  className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
                />
                <button
                  onClick={() => adjustBalance(user.id)}
                  disabled={loading || !adjustAmount}
                  className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-800 text-white text-sm px-3 py-2 rounded-lg transition-colors"
                >
                  {loading ? "…" : "Apply"}
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
