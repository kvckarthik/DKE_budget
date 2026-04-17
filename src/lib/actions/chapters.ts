"use server";
import { db } from "@/lib/db";
import { chapters, memberships, semesters, users } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

function randomInviteCode() {
  return Math.random().toString(36).slice(2, 10).toUpperCase();
}

export async function createChapter(input: {
  name: string; school: string; dkeDesignation?: string;
}) {
  const user = await getCurrentUser();
  if (!user) return { error: "Not authenticated" };

  const existingMembership = await db.select().from(memberships)
    .where(eq(memberships.userId, user.id)).limit(1);
  if (existingMembership.length > 0) return { error: "Already in a chapter" };

  let inviteCode = randomInviteCode();
  // ensure uniqueness
  const existing = await db.select().from(chapters).where(eq(chapters.inviteCode, inviteCode)).limit(1);
  if (existing.length > 0) inviteCode = randomInviteCode();

  const [chapter] = await db.insert(chapters).values({
    name: input.name,
    school: input.school,
    dkeDesignation: input.dkeDesignation || null,
    inviteCode,
  }).returning();

  await db.insert(memberships).values({
    userId: user.id,
    chapterId: chapter.id,
    role: "chapter_admin",
    status: "active",
    joinedAt: new Date(),
  });

  // create current semester
  const now = new Date();
  const isFall = now.getMonth() >= 7;
  const label = `${isFall ? "Fall" : "Spring"} ${now.getFullYear()}`;
  const startDate = isFall ? new Date(now.getFullYear(), 8, 1) : new Date(now.getFullYear(), 1, 1);
  const endDate = isFall ? new Date(now.getFullYear(), 11, 31) : new Date(now.getFullYear(), 4, 31);

  await db.insert(semesters).values({
    chapterId: chapter.id, label, startDate, endDate, isActive: true,
  });

  revalidatePath("/dashboard");
  return { success: true, chapterId: chapter.id };
}

export async function joinChapter(inviteCode: string) {
  const user = await getCurrentUser();
  if (!user) return { error: "Not authenticated" };

  const existing = await db.select().from(memberships)
    .where(eq(memberships.userId, user.id)).limit(1);
  if (existing.length > 0) return { error: "Already in a chapter" };

  const [chapter] = await db.select().from(chapters)
    .where(eq(chapters.inviteCode, inviteCode.toUpperCase())).limit(1);
  if (!chapter) return { error: "Invalid invite code" };

  await db.insert(memberships).values({
    userId: user.id,
    chapterId: chapter.id,
    role: "member",
    status: "active",
    joinedAt: new Date(),
  });

  revalidatePath("/dashboard");
  return { success: true, chapterId: chapter.id };
}

export async function getMyChapter() {
  const user = await getCurrentUser();
  if (!user) redirect("/onboarding");

  const [membership] = await db.select({
    membership: memberships,
    chapter: chapters,
  })
    .from(memberships)
    .innerJoin(chapters, eq(memberships.chapterId, chapters.id))
    .where(and(eq(memberships.userId, user.id), eq(memberships.status, "active")))
    .limit(1);

  if (!membership) redirect("/onboarding");
  return { user, membership: membership.membership, chapter: membership.chapter };
}
