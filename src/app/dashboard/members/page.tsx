import { getMyChapter } from "@/lib/actions/chapters";
import { db } from "@/lib/db";
import { memberships, users } from "@/db/schema";
import { eq, and } from "drizzle-orm";

export default async function MembersPage() {
  const { chapter } = await getMyChapter();

  const rows = await db.select({ membership: memberships, user: users })
    .from(memberships)
    .innerJoin(users, eq(memberships.userId, users.id))
    .where(eq(memberships.chapterId, chapter.id))
    .orderBy(memberships.classYear);

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold" style={{ color: "#C9A84C" }}>Members</h1>
        <div className="text-sm text-muted-foreground">{rows.length} total</div>
      </div>

      <div className="p-3 rounded-lg border text-sm" style={{ borderColor: "#C9A84C33", background: "#C9A84C08" }}>
        <span style={{ color: "#C9A84C" }} className="font-medium">Invite code: </span>
        <span className="font-mono tracking-widest">{chapter.inviteCode}</span>
        <span className="text-muted-foreground ml-2">— share to invite new members</span>
      </div>

      <div className="rounded-xl border border-white/8 overflow-hidden" style={{ background: "#111827" }}>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/8 text-xs text-muted-foreground uppercase tracking-wide">
              <th className="p-3 text-left">Name</th>
              <th className="p-3 text-left">Email</th>
              <th className="p-3 text-left">Class Year</th>
              <th className="p-3 text-left">Role</th>
              <th className="p-3 text-center">Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(({ membership, user }) => (
              <tr key={membership.id} className="border-b border-white/5">
                <td className="p-3 font-medium">{user.firstName} {user.lastName}</td>
                <td className="p-3 text-muted-foreground text-xs">{user.email}</td>
                <td className="p-3 text-muted-foreground">{membership.classYear ?? "—"}</td>
                <td className="p-3 text-muted-foreground capitalize">{membership.role.replace("_", " ")}</td>
                <td className="p-3 text-center">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                    membership.status === "active" ? "bg-green-500/20 text-green-400" :
                    membership.status === "invited" ? "bg-blue-500/20 text-blue-400" :
                    "bg-gray-500/20 text-gray-400"
                  }`}>{membership.status}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
