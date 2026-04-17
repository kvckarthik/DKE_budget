import Link from "next/link";
import { auth } from "@clerk/nextjs/server";

export default async function LandingPage() {
  const { userId } = await auth();

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6 py-16"
      style={{ background: "linear-gradient(135deg, #0D1B3E 0%, #0A0F1E 100%)" }}>
      <div className="max-w-2xl w-full text-center space-y-8">
        <div className="flex items-center justify-center gap-4">
          <div className="w-16 h-16 rounded-xl flex items-center justify-center text-2xl font-bold"
            style={{ background: "#C9A84C", color: "#0D1B3E", fontFamily: "Georgia, serif" }}>
            ΔΚΕ
          </div>
          <div className="text-left">
            <h1 className="text-3xl font-bold" style={{ color: "#C9A84C", fontFamily: "Georgia, serif" }}>
              Delta Kappa Epsilon
            </h1>
            <p className="text-sm text-muted-foreground tracking-widest uppercase">
              Financial Platform
            </p>
          </div>
        </div>

        <p className="text-lg text-muted-foreground">
          Dues management, budget planning, and expense tracking for DKE chapters.
          Built for treasurers. Transparent for members.
        </p>

        <div className="flex gap-4 justify-center flex-wrap">
          {userId ? (
            <Link href="/dashboard"
              className="px-6 py-3 rounded-lg font-semibold text-sm"
              style={{ background: "#C9A84C", color: "#0D1B3E" }}>
              Go to Dashboard
            </Link>
          ) : (
            <>
              <Link href="/sign-up"
                className="px-6 py-3 rounded-lg font-semibold text-sm"
                style={{ background: "#C9A84C", color: "#0D1B3E" }}>
                Get Started
              </Link>
              <Link href="/sign-in"
                className="px-6 py-3 rounded-lg font-semibold text-sm border border-white/20 text-white hover:bg-white/5">
                Sign In
              </Link>
            </>
          )}
        </div>

        <div className="grid grid-cols-3 gap-4 pt-8 text-left">
          {[
            { icon: "💰", title: "Dues Tracking", desc: "Auto-generate invoices, track payments, aging reports" },
            { icon: "📊", title: "Budget Planning", desc: "Allocate revenue across categories with live projections" },
            { icon: "🧾", title: "Expense Ledger", desc: "Log expenses, approve reimbursements, export for handoff" },
          ].map(({ icon, title, desc }) => (
            <div key={title} className="p-4 rounded-xl border border-white/10"
              style={{ background: "rgba(255,255,255,0.03)" }}>
              <div className="text-2xl mb-2">{icon}</div>
              <div className="font-semibold text-sm mb-1">{title}</div>
              <div className="text-xs text-muted-foreground">{desc}</div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
