import { auth } from "@clerk/nextjs/server";
import { getMyInvoices } from "@/lib/actions/dues";
import { fmt } from "@/lib/constants";
import { redirect } from "next/navigation";

export default async function MyDuesPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const rows = await getMyInvoices(userId);
  const totalDue = rows.reduce((s, r) => s + r.invoice.amountDueCents, 0);
  const totalPaid = rows.reduce((s, r) => s + r.invoice.amountPaidCents, 0);
  const balance = totalDue - totalPaid;

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="text-xl font-bold" style={{ color: "#C9A84C" }}>My Dues</h1>

      <div className="p-6 rounded-xl border text-center" style={{ borderColor: "#C9A84C33", background: "#C9A84C08" }}>
        <div className="text-sm text-muted-foreground mb-1">Current Balance</div>
        <div className="text-4xl font-bold" style={{ color: balance > 0 ? "#EF4444" : "#10B981" }}>
          {fmt(balance)}
        </div>
        {balance > 0 && (
          <div className="text-sm text-muted-foreground mt-2">
            {fmt(totalPaid)} paid of {fmt(totalDue)} total
          </div>
        )}
        {balance === 0 && totalDue > 0 && (
          <div className="text-sm text-green-400 mt-2">All dues paid — thank you!</div>
        )}
      </div>

      {rows.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <div className="text-4xl mb-3">✅</div>
          <p>No invoices yet. Check back once your treasurer publishes the semester budget.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {rows.map(({ invoice }) => (
            <div key={invoice.id} className="p-4 rounded-xl border border-white/8" style={{ background: "#111827" }}>
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-semibold text-sm">Semester Dues</div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    Due {new Date(invoice.dueDate).toLocaleDateString()}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold" style={{ color: "#C9A84C" }}>{fmt(invoice.amountDueCents)}</div>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    invoice.status === "paid" ? "bg-green-500/20 text-green-400" :
                    invoice.status === "overdue" ? "bg-red-500/20 text-red-400" :
                    invoice.status === "partial" ? "bg-yellow-500/20 text-yellow-400" :
                    "bg-gray-500/20 text-gray-400"
                  }`}>{invoice.status}</span>
                </div>
              </div>
              {invoice.amountPaidCents > 0 && (
                <div className="mt-2 text-xs text-green-400">
                  {fmt(invoice.amountPaidCents)} paid · {fmt(invoice.amountDueCents - invoice.amountPaidCents)} remaining
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
