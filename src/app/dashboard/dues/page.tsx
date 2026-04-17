import { getMyChapter } from "@/lib/actions/chapters";
import { getInvoicesForChapter } from "@/lib/actions/dues";
import { fmt } from "@/lib/constants";

export default async function DuesPage() {
  const { chapter } = await getMyChapter();
  const rows = await getInvoicesForChapter(chapter.id);

  const totalDue = rows.reduce((s, r) => s + r.invoice.amountDueCents, 0);
  const totalPaid = rows.reduce((s, r) => s + r.invoice.amountPaidCents, 0);
  const outstanding = totalDue - totalPaid;

  return (
    <div className="max-w-4xl space-y-6">
      <h1 className="text-xl font-bold" style={{ color: "#C9A84C" }}>Dues Ledger</h1>

      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Total Due", value: fmt(totalDue), color: "#E5E7EB" },
          { label: "Collected", value: fmt(totalPaid), color: "#10B981" },
          { label: "Outstanding", value: fmt(outstanding), color: outstanding > 0 ? "#EF4444" : "#10B981" },
        ].map(({ label, value, color }) => (
          <div key={label} className="p-4 rounded-xl border border-white/8" style={{ background: "#111827" }}>
            <div className="text-xs text-muted-foreground mb-1">{label}</div>
            <div className="text-xl font-bold" style={{ color }}>{value}</div>
          </div>
        ))}
      </div>

      {rows.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <div className="text-4xl mb-3">💰</div>
          <p>No invoices yet. Publish a budget to generate invoices.</p>
        </div>
      ) : (
        <div className="rounded-xl border border-white/8 overflow-hidden" style={{ background: "#111827" }}>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/8 text-xs text-muted-foreground uppercase tracking-wide">
                <th className="p-3 text-left">Member</th>
                <th className="p-3 text-left">Class</th>
                <th className="p-3 text-right">Due</th>
                <th className="p-3 text-right">Paid</th>
                <th className="p-3 text-right">Balance</th>
                <th className="p-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(({ invoice, membership, user }) => {
                const balance = invoice.amountDueCents - invoice.amountPaidCents;
                return (
                  <tr key={invoice.id} className="border-b border-white/5 hover:bg-white/3 transition-colors">
                    <td className="p-3 font-medium">{user.firstName} {user.lastName}</td>
                    <td className="p-3 text-muted-foreground">{membership.classYear ?? "—"}</td>
                    <td className="p-3 text-right">{fmt(invoice.amountDueCents)}</td>
                    <td className="p-3 text-right text-green-400">{fmt(invoice.amountPaidCents)}</td>
                    <td className="p-3 text-right" style={{ color: balance > 0 ? "#EF4444" : "#10B981" }}>{fmt(balance)}</td>
                    <td className="p-3 text-center">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        invoice.status === "paid" ? "bg-green-500/20 text-green-400" :
                        invoice.status === "overdue" ? "bg-red-500/20 text-red-400" :
                        invoice.status === "partial" ? "bg-yellow-500/20 text-yellow-400" :
                        "bg-gray-500/20 text-gray-400"
                      }`}>{invoice.status}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
