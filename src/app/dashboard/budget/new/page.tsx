"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function NewBudgetPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const fd = new FormData(e.currentTarget);
    const res = await fetch("/api/budget/create", {
      method: "POST",
      body: JSON.stringify({ name: fd.get("name") }),
      headers: { "Content-Type": "application/json" },
    });
    const data = await res.json();
    if (data.budgetId) router.push(`/dashboard/budget/${data.budgetId}`);
    else setLoading(false);
  }

  return (
    <div className="max-w-md space-y-6">
      <h1 className="text-xl font-bold" style={{ color: "#C9A84C" }}>New Budget</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Budget Name</label>
          <input name="name" placeholder="e.g. Fall 2026 Budget" required
            className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm focus:outline-none focus:border-yellow-500/50" />
        </div>
        <button type="submit" disabled={loading}
          className="px-6 py-2.5 rounded-lg font-semibold text-sm disabled:opacity-50"
          style={{ background: "#C9A84C", color: "#0D1B3E" }}>
          {loading ? "Creating…" : "Create Budget"}
        </button>
      </form>
    </div>
  );
}
