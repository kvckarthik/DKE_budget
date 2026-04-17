import { getBudgetDetail } from "@/lib/actions/budget";
import { BudgetPlanner } from "@/components/budget/budget-planner";
import { notFound } from "next/navigation";

export default async function BudgetDetailPage({ params }: { params: Promise<{ budgetId: string }> }) {
  const { budgetId } = await params;
  const detail = await getBudgetDetail(budgetId);
  if (!detail) notFound();
  return <BudgetPlanner initialData={detail} />;
}
