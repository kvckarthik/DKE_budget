import { getMyChapter } from "@/lib/actions/chapters";
import { db } from "@/lib/db";
import { semesters } from "@/db/schema";
import { eq } from "drizzle-orm";

export default async function SettingsPage() {
  const { chapter, membership } = await getMyChapter();
  const allSemesters = await db.select().from(semesters).where(eq(semesters.chapterId, chapter.id));

  return (
    <div className="max-w-2xl space-y-8">
      <h1 className="text-xl font-bold" style={{ color: "#C9A84C" }}>Settings</h1>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Chapter</h2>
        <div className="p-4 rounded-xl border border-white/8 space-y-3" style={{ background: "#111827" }}>
          {[
            { label: "Chapter Name", value: chapter.name },
            { label: "School", value: chapter.school },
            { label: "DKE Designation", value: chapter.dkeDesignation ?? "—" },
            { label: "Invite Code", value: chapter.inviteCode, mono: true },
          ].map(({ label, value, mono }) => (
            <div key={label} className="flex justify-between text-sm">
              <span className="text-muted-foreground">{label}</span>
              <span className={mono ? "font-mono tracking-widest" : "font-medium"}>{value}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Semesters</h2>
        <div className="rounded-xl border border-white/8 overflow-hidden" style={{ background: "#111827" }}>
          {allSemesters.map(sem => (
            <div key={sem.id} className="flex items-center justify-between p-3 border-b border-white/5 text-sm last:border-0">
              <span>{sem.label}</span>
              {sem.isActive && (
                <span className="px-2 py-0.5 rounded-full text-xs bg-green-500/20 text-green-400">Active</span>
              )}
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Your Role</h2>
        <div className="p-4 rounded-xl border border-white/8 text-sm" style={{ background: "#111827" }}>
          <span className="text-muted-foreground">Role: </span>
          <span className="font-medium capitalize">{membership.role.replace("_", " ")}</span>
        </div>
      </section>
    </div>
  );
}
