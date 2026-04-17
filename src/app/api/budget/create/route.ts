import { NextRequest } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { users, memberships, semesters } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { createBudget } from "@/lib/actions/budget";

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const [user] = await db.select().from(users).where(eq(users.clerkId, userId)).limit(1);
  if (!user) return Response.json({ error: "User not found" }, { status: 404 });

  const [membership] = await db.select().from(memberships)
    .where(and(eq(memberships.userId, user.id), eq(memberships.status, "active"))).limit(1);
  if (!membership) return Response.json({ error: "No chapter" }, { status: 404 });

  const [activeSemester] = await db.select().from(semesters)
    .where(and(eq(semesters.chapterId, membership.chapterId), eq(semesters.isActive, true))).limit(1);
  if (!activeSemester) return Response.json({ error: "No active semester" }, { status: 404 });

  const { name } = await req.json();
  const result = await createBudget(membership.chapterId, activeSemester.id, name);
  return Response.json(result);
}
