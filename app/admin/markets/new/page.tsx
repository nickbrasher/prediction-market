"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const DEFAULT_OUTCOMES: Record<string, string[]> = {
  YES_NO: ["Yes", "No"],
  OVER_UNDER: ["Over", "Under"],
  MULTIPLE_CHOICE: ["Option A", "Option B", "Option C"],
};

export default function NewMarketPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    title: "",
    description: "",
    type: "YES_NO",
    line: "",
    closesAt: "",
  });
  const [outcomes, setOutcomes] = useState(["Yes", "No"]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function onTypeChange(type: string) {
    setForm({ ...form, type });
    setOutcomes(DEFAULT_OUTCOMES[type] ?? ["Yes", "No"]);
  }

  function addOutcome() {
    setOutcomes([...outcomes, ""]);
  }

  function updateOutcome(i: number, val: string) {
    setOutcomes(outcomes.map((o, idx) => (idx === i ? val : o)));
  }

  function removeOutcome(i: number) {
    if (outcomes.length <= 2) return;
    setOutcomes(outcomes.filter((_, idx) => idx !== i));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (outcomes.some((o) => !o.trim())) {
      setError("All outcomes must have a label.");
      return;
    }
    setLoading(true);
    const res = await fetch("/api/markets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        line: form.line ? Number(form.line) : null,
        closesAt: form.closesAt || null,
        outcomes: outcomes.map((o) => o.trim()),
      }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.error);
      return;
    }
    router.push(`/markets/${data.id}`);
    router.refresh();
  }

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">New Market</h1>

      <form onSubmit={submit} className="bg-[#1a1d27] border border-slate-800 rounded-2xl p-6 space-y-5">
        {error && (
          <div className="bg-red-900/30 border border-red-700 text-red-300 rounded-lg px-3 py-2 text-sm">{error}</div>
        )}

        <div>
          <label className="block text-sm text-slate-300 mb-1.5">Title</label>
          <input
            required
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
            placeholder="Will it rain on Friday?"
          />
        </div>

        <div>
          <label className="block text-sm text-slate-300 mb-1.5">Description</label>
          <textarea
            required
            rows={3}
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors resize-none"
            placeholder="Additional context and resolution criteria..."
          />
        </div>

        <div>
          <label className="block text-sm text-slate-300 mb-1.5">Market Type</label>
          <div className="flex bg-slate-900 border border-slate-700 rounded-lg overflow-hidden">
            {["YES_NO", "OVER_UNDER", "MULTIPLE_CHOICE"].map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => onTypeChange(t)}
                className={`flex-1 py-2.5 text-sm transition-colors ${form.type === t ? "bg-indigo-600 text-white" : "text-slate-400 hover:text-white"}`}
              >
                {t === "YES_NO" ? "Yes/No" : t === "OVER_UNDER" ? "Over/Under" : "Multiple"}
              </button>
            ))}
          </div>
        </div>

        {form.type === "OVER_UNDER" && (
          <div>
            <label className="block text-sm text-slate-300 mb-1.5">Line Value</label>
            <input
              type="number"
              step="0.5"
              value={form.line}
              onChange={(e) => setForm({ ...form, line: e.target.value })}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
              placeholder="e.g. 45.5"
            />
          </div>
        )}

        <div>
          <label className="block text-sm text-slate-300 mb-1.5">
            Outcomes
            {form.type === "MULTIPLE_CHOICE" && (
              <span className="text-slate-500 text-xs ml-2">(min 2)</span>
            )}
          </label>
          <div className="space-y-2">
            {outcomes.map((o, i) => (
              <div key={i} className="flex gap-2">
                <input
                  required
                  value={o}
                  onChange={(e) => updateOutcome(i, e.target.value)}
                  disabled={form.type !== "MULTIPLE_CHOICE"}
                  className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors disabled:opacity-60"
                  placeholder={`Outcome ${i + 1}`}
                />
                {form.type === "MULTIPLE_CHOICE" && outcomes.length > 2 && (
                  <button
                    type="button"
                    onClick={() => removeOutcome(i)}
                    className="text-red-400 hover:text-red-300 px-2"
                  >
                    ✕
                  </button>
                )}
              </div>
            ))}
          </div>
          {form.type === "MULTIPLE_CHOICE" && outcomes.length < 8 && (
            <button
              type="button"
              onClick={addOutcome}
              className="mt-2 text-sm text-indigo-400 hover:text-indigo-300"
            >
              + Add outcome
            </button>
          )}
        </div>

        <div>
          <label className="block text-sm text-slate-300 mb-1.5">Close Date (optional)</label>
          <input
            type="datetime-local"
            value={form.closesAt}
            onChange={(e) => setForm({ ...form, closesAt: e.target.value })}
            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2.5 text-white focus:outline-none focus:border-indigo-500 transition-colors"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-800 disabled:cursor-not-allowed text-white font-medium py-2.5 rounded-lg transition-colors"
        >
          {loading ? "Creating…" : "Create Market"}
        </button>
      </form>
    </div>
  );
}
