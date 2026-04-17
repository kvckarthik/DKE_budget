"use server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { users, memberships, budgets, budgetCategoryAllocations, duesSchedules, invoices, semesters } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { BUDGET_CATEGORIES, DEFAULT_DUES } from "@/lib/constants";
import type { ClassYear } from "@/lib/constants";

async function getActorMembership(chapterId: string) {
  const { userId } = await auth();
  if (!userId) return null;
  const [user] = await db.select().from(users).where(eq(users.clerkId, userId)).limit(1);
  if (!user) return null;
  const [membership] = await db.select().from(memberships)
    .where(and(eq(memberships.userId, user.id), eq(memberships.chapterId, chapterId))).limit(1);
  return membership ?? null;
}

export async function createBudget(chapterId: string, semesterId: string, name: string) {
  const membership = await getActorMembership(chapterId);
  if (!membership || !["treasurer", "chapter_admin"].includes(membership.role)) {
    return { error: "Unauthorized" };
  }

  const [budget] = await db.insert(budgets).values({
    chapterId, semesterId, name, status: "draft",
    globalDuesIncrease: 0, freshmanRangeMin: 15, freshmanRangeMax: 25,
  }).returning();

  // seed default category allocations
  await db.insert(budgetCategoryAllocations).values(
    BUDGET_CATEGORIES.map(cat => ({
      budgetId: budget.id,
      categoryKey: cat.key,
      percentage: cat.defaultPct,
      amountCents: 0,
    }))
  );

  // seed default dues schedules
  const classYears: ClassYear[] = ["Freshman", "Sophomore", "Junior", "Senior"];
  await db.insert(duesSchedules).values(
    classYears.map(year => ({
      budgetId: budget.id,
      classYear: year,
      baseDuesCents: DEFAULT_DUES[year] * 100,
      effectiveDuesCents: DEFAULT_DUES[year] * 100,
      memberCount: year === "Freshman" ? 20 : year === "Junior" || year === "Sophomore" ? 15 : 5,
      allowedPaymentPlans: ["full", "two_installment"],
    }))
  );

  revalidatePath(`/dashboard/budget`);
  return { success: true, budgetId: budget.id };
}

export async function saveBudget(budgetId: string, data: {
  name: string;
  globalDuesIncrease: number;
  freshmanRangeMin: number;
  freshmanRangeMax: number;
  dues: Record<string, { baseCents: number; memberCount: number }>;
  allocations: Record<string, number>;
  totalEstimatedRevenue: number;
}) {
  const [budget] = await db.select().from(budgets).where(eq(budgets.id, budgetId)).limit(1);
  if (!budget) return { error: "Budget not found" };
  if (budget.status === "published") return { error: "Cannot edit a published budget" };

  const membership = await getActorMembership(budget.chapterId);
  if (!membership || !["treasurer", "chapter_admin"].includes(membership.role)) return { error: "Unauthorized" };

  await db.update(budgets).set({
    name: data.name,
    globalDuesIncrease: data.globalDuesIncrease,
    freshmanRangeMin: data.freshmanRangeMin,
    freshmanRangeMax: data.freshmanRangeMax,
    totalEstimatedRevenue: data.totalEstimatedRevenue,
    updatedAt: new Date(),
  }).where(eq(budgets.id, budgetId));

  // update dues schedules
  for (const [classYear, vals] of Object.entries(data.dues)) {
    const effective = vals.baseCents + (data.globalDuesIncrease * 100);
    await db.update(duesSchedules).set({
      baseDuesCents: vals.baseCents,
      effectiveDuesCents: effective,
      memberCount: vals.memberCount,
    }).where(and(eq(duesSchedules.budgetId, budgetId), eq(duesSchedules.classYear, classYear as ClassYear)));
  }

  // update category allocations
  for (const [categoryKey, pct] of Object.entries(data.allocations)) {
    const amountCents = Math.round((pct / 100) * data.totalEstimatedRevenue);
    await db.update(budgetCategoryAllocations).set({ percentage: pct, amountCents })
      .where(and(eq(budgetCategoryAllocations.budgetId, budgetId), eq(budgetCategoryAllocations.categoryKey, categoryKey)));
  }

  revalidatePath(`/dashboard/budget/${budgetId}`);
  return { success: true };
}

export async function publishBudget(budgetId: string) {
  const [budget] = await db.select().from(budgets).where(eq(budgets.id, budgetId)).limit(1);
  if (!budget) return { error: "Budget not found" };
  if (budget.status === "published") return { error: "Already published" };

  const membership = await getActorMembership(budget.chapterId);
  if (!membership || !["treasurer", "chapter_admin"].includes(membership.role)) return { error: "Unauthorized" };

  const schedules = await db.select().from(duesSchedules).where(eq(duesSchedules.budgetId, budgetId));
  const activeMembers = await db.select().from(memberships)
    .where(and(eq(memberships.chapterId, budget.chapterId), eq(memberships.status, "active")));

  // generate invoices for each active member based on their class year
  const invoicesToInsert = activeMembers
    .filter(m => m.classYear)
    .map(m => {
      const schedule = schedules.find(s => s.classYear === m.classYear);
      if (!schedule) return null;
      return {
        membershipId: m.id,
        budgetId: budget.id,
        amountDueCents: schedule.effectiveDuesCents,
        amountPaidCents: 0,
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        status: "pending" as const,
        paymentPlan: "full" as const,
      };
    })
    .filter(Boolean) as (typeof invoices.$inferInsert)[];

  if (invoicesToInsert.length > 0) {
    await db.insert(invoices).values(invoicesToInsert);
  }

  await db.update(budgets).set({
    status: "published", publishedAt: new Date(), updatedAt: new Date(),
  }).where(eq(budgets.id, budgetId));

  revalidatePath(`/dashboard/budget/${budgetId}`);
  revalidatePath(`/dashboard/dues`);
  return { success: true, invoicesGenerated: invoicesToInsert.length };
}

export async function getBudgetsForChapter(chapterId: string) {
  return db.select({ budget: budgets, semester: semesters })
    .from(budgets)
    .innerJoin(semesters, eq(budgets.semesterId, semesters.id))
    .where(eq(budgets.chapterId, chapterId))
    .orderBy(budgets.createdAt);
}

export async function getBudgetDetail(budgetId: string) {
  const [budget] = await db.select().from(budgets).where(eq(budgets.id, budgetId)).limit(1);
  if (!budget) return null;
  const allocations = await db.select().from(budgetCategoryAllocations).where(eq(budgetCategoryAllocations.budgetId, budgetId));
  const schedules = await db.select().from(duesSchedules).where(eq(duesSchedules.budgetId, budgetId));
  return { budget, allocations, schedules };
}
