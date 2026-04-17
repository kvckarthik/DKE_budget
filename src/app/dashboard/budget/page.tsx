import { getMyChapter } from "@/lib/actions/chapters";
import { getBudgetsForChapter } from "@/lib/actions/budget";
import Link from "next/link";

export default async function BudgetListPage() {
  const { chapter } = await getMyChapter();
  const budgetRows = await getBudgetsForChapter(chapter.id);

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold" style={{ color: "#C9A84C" }}>Budgets</h1>
        <Link href="/dashboard/budget/new"
          className="px-4 py-2 rounded-lg text-sm font-semibold"
          style={{ background: "#C9A84C", color: "#0D1B3E" }}>
          + New Budget
        </Link>
      </div>

      {budgetRows.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <div className="text-4xl mb-3">📋</div>
          <p>No budgets yet. Create your first one.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {budgetRows.map(({ budget, semester }) => (
            <Link key={budget.id} href={`/dashboard/budget/${budget.id}`}
              className="flex items-center justify-between p-4 rounded-xl border border-white/8 hover:border-white/20 transition-colors block"
              style={{ background: "#111827" }}>
              <div>
                <div className="font-semibold text-sm">{budget.name}</div>
                <div className="text-xs text-muted-foreground mt-0.5">{semester.label}</div>
              </div>
              <div className="flex items-center gap-3">
                {budget.totalEstimatedRevenue ? (
                  <span className="text-sm" style={{ color: "#C9A84C" }}>
                    ${(budget.totalEstimatedRevenue / 100).toLocaleString()}
                  </span>
                ) : null}
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                  budget.status === "published" ? "bg-green-500/20 text-green-400" :
                  budget.status === "archived" ? "bg-gray-500/20 text-gray-400" :
                  "bg-yellow-500/20 text-yellow-400"
                }`}>
                  {budget.status}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
