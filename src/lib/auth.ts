import { auth, currentUser } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { memberships, users } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { redirect } from "next/navigation";
import type { Role } from "@/lib/constants";

export async function getCurrentUser() {
  const { userId } = await auth();
  if (!userId) return null;

  const [existing] = await db.select().from(users).where(eq(users.clerkId, userId)).limit(1);
  if (existing) return existing;

  // Auto-create DB record on first sign-in (fallback when webhook hasn't fired)
  const clerkUser = await currentUser();
  if (!clerkUser) return null;

  const email = clerkUser.emailAddresses[0]?.emailAddress ?? "";
  const [created] = await db.insert(users).values({
    clerkId: userId,
    email,
    firstName: clerkUser.firstName ?? null,
    lastName: clerkUser.lastName ?? null,
    imageUrl: clerkUser.imageUrl ?? null,
  }).onConflictDoUpdate({
    target: users.clerkId,
    set: { email, updatedAt: new Date() },
  }).returning();

  return created ?? null;
}

export async function getCurrentMembership(chapterId: string) {
  const user = await getCurrentUser();
  if (!user) return null;
  const [membership] = await db
    .select()
    .from(memberships)
    .where(and(eq(memberships.userId, user.id), eq(memberships.chapterId, chapterId)))
    .limit(1);
  return membership ?? null;
}

export async function requireRole(chapterId: string, minRole: Role) {
  const roleOrder: Role[] = ["member", "treasurer", "chapter_admin", "national_admin"];
  const membership = await getCurrentMembership(chapterId);
  if (!membership) redirect("/onboarding");
  const userLevel = roleOrder.indexOf(membership.role as Role);
  const requiredLevel = roleOrder.indexOf(minRole);
  if (userLevel < requiredLevel) redirect("/dashboard");
  return membership;
}
