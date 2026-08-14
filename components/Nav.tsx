"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";

interface NavUser {
  username: string;
  pointBalance: number;
  isAdmin: boolean;
}

export default function Nav({ initialUser }: { initialUser: NavUser | null }) {
  const pathname = usePathname();
  const [user, setUser] = useState<NavUser | null>(initialUser);

  // Refresh balance when the route changes (catches bet placements, admin grants)
  useEffect(() => {
    fetch("/api/profile")
      .then((r) => (r.ok ? r.json() : null))
      .then((d: { user: NavUser } | null) => d && setUser(d.user))
      .catch(() => {});
  }, [pathname]);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/login";
  }

  return (
    <nav className="bg-[#1a1d27] border-b border-slate-800 sticky top-0 z-50">
      <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link href="/" className="font-bold text-lg text-indigo-400 tracking-tight">
          PredictPoint
        </Link>

        {user ? (
          <div className="flex items-center gap-4 text-sm">
            <Link href="/markets" className="text-slate-300 hover:text-white transition-colors">
              Markets
            </Link>
            <Link href="/leaderboard" className="text-slate-300 hover:text-white transition-colors">
              Leaderboard
            </Link>
            {user.isAdmin && (
              <Link href="/admin" className="text-amber-400 hover:text-amber-300 transition-colors">
                Admin
              </Link>
            )}
            <Link
              href="/profile"
              className="flex items-center gap-1.5 bg-indigo-900/50 border border-indigo-700 rounded-full px-3 py-1 hover:bg-indigo-900 transition-colors"
            >
              <span className="text-indigo-300 font-medium">
                {user.pointBalance.toLocaleString()} pts
              </span>
            </Link>
            <button onClick={logout} className="text-slate-400 hover:text-white transition-colors">
              Sign out
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-3 text-sm">
            <Link href="/login" className="text-slate-300 hover:text-white transition-colors">
              Sign in
            </Link>
            <Link
              href="/signup"
              className="bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1.5 rounded-lg transition-colors"
            >
              Sign up
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
}
