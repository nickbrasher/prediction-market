"use client";

import { useEffect, useState } from "react";
import MarketCard from "@/components/MarketCard";

interface MarketSummary {
  id: string;
  title: string;
  type: string;
  status: string;
  line: number | null;
  closesAt: string | null;
  outcomes: { id: string; label: string; poolTotal: number; marketId: string }[];
}

const STATUS_OPTIONS = ["", "OPEN", "CLOSED", "RESOLVED"] as const;
const TYPE_OPTIONS = ["", "YES_NO", "OVER_UNDER", "MULTIPLE_CHOICE"] as const;

const TYPE_LABELS: Record<string, string> = {
  "": "All types",
  YES_NO: "Yes/No",
  OVER_UNDER: "Over/Under",
  MULTIPLE_CHOICE: "Multi-choice",
};

export default function MarketsPage() {
  const [markets, setMarkets] = useState<MarketSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("");
  const [type, setType] = useState("");

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (status) params.set("status", status);
    if (type) params.set("type", type);
    fetch(`/api/markets?${params}`)
      .then((r) => r.json())
      .then((d) => { setMarkets(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [status, type]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Markets</h1>

      <div className="flex flex-wrap gap-2">
        <div className="flex bg-[#1a1d27] border border-slate-800 rounded-lg overflow-hidden">
          {STATUS_OPTIONS.map((s) => (
            <button
              key={s}
              onClick={() => setStatus(s)}
              className={`px-3 py-1.5 text-sm transition-colors ${status === s ? "bg-indigo-600 text-white" : "text-slate-400 hover:text-white"}`}
            >
              {s === "" ? "All" : s}
            </button>
          ))}
        </div>

        <div className="flex bg-[#1a1d27] border border-slate-800 rounded-lg overflow-hidden">
          {TYPE_OPTIONS.map((t) => (
            <button
              key={t}
              onClick={() => setType(t)}
              className={`px-3 py-1.5 text-sm transition-colors ${type === t ? "bg-indigo-600 text-white" : "text-slate-400 hover:text-white"}`}
            >
              {TYPE_LABELS[t]}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-[#1a1d27] border border-slate-800 rounded-xl p-4 animate-pulse h-36" />
          ))}
        </div>
      ) : markets.length === 0 ? (
        <p className="text-slate-400 text-center py-12">No markets found.</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {markets.map((m) => (
            <MarketCard key={m.id} market={m} />
          ))}
        </div>
      )}
    </div>
  );
}
