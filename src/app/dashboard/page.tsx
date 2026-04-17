import { getMyChapter } from "@/lib/actions/chapters";
import { db } from "@/lib/db";
import { budgets, invoices, expenses, semesters, memberships } from "@/db/schema";
import { eq, and, count, sum } from "drizzle-orm";
import { fmt } from "@/lib/constants";
import Link from "next/link";

export default async function DashboardPage() {
  const { membership, chapter } = await getMyChapter();
  const isTreasurer = ["treasurer", "chapter_admin", "national_admin"].includes(membership.role);

  const [activeSemester] = await db.select().from(semesters)
    .where(and(eq(semesters.chapterId, chapter.id), eq(semesters.isActive, true)))
    .limit(1);

  let stats = { totalMembers: 0, totalRevenue: 0, collected: 0, outstanding: 0, expenses: 0 };

  if (activeSemester) {
    const [memberCount] = await db.select({ count: count() }).from(memberships)
      .where(and(eq(memberships.chapterId, chapter.id), eq(memberships.status, "active")));

    const invoiceData = await db.select({
      totalDue: sum(invoices.amountDueCents),
      totalPaid: sum(invoices.amountPaidCents),
    }).from(invoices)
      .innerJoin(budgets, eq(invoices.budgetId, budgets.id))
      .where(eq(budgets.semesterId, activeSemester.id));

    const expenseData = await db.select({ total: sum(expenses.amountCents) }).from(expenses)
      .where(and(eq(expenses.chapterId, chapter.id), eq(expenses.semesterId, activeSemester.id)));

    const due = Number(invoiceData[0]?.totalDue ?? 0);
    const paid = Number(invoiceData[0]?.totalPaid ?? 0);
    stats = {
      totalMembers: memberCount.count,
      totalRevenue: due,
      collected: paid,
      outstanding: due - paid,
      expenses: Number(expenseData[0]?.total ?? 0),
    };
  }

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: "#C9A84C", fontFamily: "Georgia, serif" }}>
          {chapter.name}
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          {activeSemester ? activeSemester.label : "No active semester"} · {chapter.school}
        </p>
      </div>

      {isTreasurer && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Active Members", value: stats.totalMembers, color: "#E5E7EB" },
            { label: "Dues Collected", value: fmt(stats.collected), color: "#10B981" },
            { label: "Outstanding", value: fmt(stats.outstanding), color: stats.outstanding > 0 ? "#EF4444" : "#10B981" },
            { label: "Expenses YTD", value: fmt(stats.expenses), color: "#F59E0B" },
          ].map(({ label, value, color }) => (
            <div key={label} className="p-4 rounded-xl border border-white/8"
              style={{ background: "#111827" }}>
              <div className="text-xs text-muted-foreground mb-1">{label}</div>
              <div className="text-xl font-bold" style={{ color }}>{value}</div>
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {isTreasurer ? (
          <>
            <QuickLink href="/dashboard/budget/new" icon="📋" title="New Budget" desc="Create a budget draft for this semester" />
            <QuickLink href="/dashboard/dues" icon="💰" title="Dues Ledger" desc="View invoices, record payments, aging report" />
            <QuickLink href="/dashboard/members" icon="👥" title="Manage Members" desc="Invite members, update class years" />
            <QuickLink href="/dashboard/expenses" icon="🧾" title="Log Expense" desc="Record chapter expenses and reimbursements" />
          </>
        ) : (
          <>
            <QuickLink href="/dashboard/my-dues" icon="💳" title="My Dues" desc="View your balance and payment history" />
            <QuickLink href="/dashboard/expenses" icon="🧾" title="Reimbursement" desc="Submit a reimbursement request" />
          </>
        )}
      </div>

      {isTreasurer && (
        <div className="p-4 rounded-xl border text-sm" style={{ borderColor: "#C9A84C33", background: "#C9A84C08" }}>
          <span style={{ color: "#C9A84C" }} className="font-medium">Chapter invite code: </span>
          <span className="font-mono tracking-widest">{chapter.inviteCode}</span>
          <span className="text-muted-foreground ml-2">— share with members to join</span>
        </div>
      )}
    </div>
  );
}

function QuickLink({ href, icon, title, desc }: { href: string; icon: string; title: string; desc: string }) {
  return (
    <Link href={href} className="p-4 rounded-xl border border-white/8 hover:border-white/20 transition-colors block"
      style={{ background: "#111827" }}>
      <div className="text-2xl mb-2">{icon}</div>
      <div className="font-semibold text-sm">{title}</div>
      <div className="text-xs text-muted-foreground mt-0.5">{desc}</div>
    </Link>
  );
}
