"use server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { users, memberships, invoices, payments } from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { revalidatePath } from "next/cache";

async function getActorUser() {
  const { userId } = await auth();
  if (!userId) return null;
  const [user] = await db.select().from(users).where(eq(users.clerkId, userId)).limit(1);
  return user ?? null;
}

export async function recordPayment(invoiceId: string, input: {
  amountCents: number;
  method: "venmo" | "zelle" | "cash" | "check" | "bank_transfer" | "other";
  externalRef?: string;
  notes?: string;
}) {
  const user = await getActorUser();
  if (!user) return { error: "Not authenticated" };

  const [invoice] = await db.select().from(invoices).where(eq(invoices.id, invoiceId)).limit(1);
  if (!invoice) return { error: "Invoice not found" };

  await db.insert(payments).values({
    invoiceId,
    amountCents: input.amountCents,
    method: input.method,
    externalRef: input.externalRef ?? null,
    notes: input.notes ?? null,
    status: "confirmed",
    recordedBy: user.id,
    paidAt: new Date(),
  });

  const newPaid = invoice.amountPaidCents + input.amountCents;
  const newStatus = newPaid >= invoice.amountDueCents ? "paid" : "partial";
  await db.update(invoices).set({ amountPaidCents: newPaid, status: newStatus, updatedAt: new Date() })
    .where(eq(invoices.id, invoiceId));

  revalidatePath("/dashboard/dues");
  return { success: true };
}

export async function submitPaymentNotification(invoiceId: string, input: {
  amountCents: number;
  method: "venmo" | "zelle" | "cash" | "check" | "bank_transfer" | "other";
  externalRef?: string;
}) {
  const user = await getActorUser();
  if (!user) return { error: "Not authenticated" };

  await db.insert(payments).values({
    invoiceId,
    amountCents: input.amountCents,
    method: input.method,
    externalRef: input.externalRef ?? null,
    status: "pending",
    recordedBy: user.id,
    paidAt: new Date(),
  });

  revalidatePath("/dashboard/my-dues");
  return { success: true };
}

export async function getInvoicesForChapter(chapterId: string) {
  return db.select({
    invoice: invoices,
    membership: memberships,
    user: users,
  })
    .from(invoices)
    .innerJoin(memberships, eq(invoices.membershipId, memberships.id))
    .innerJoin(users, eq(memberships.userId, users.id))
    .where(eq(memberships.chapterId, chapterId))
    .orderBy(desc(invoices.createdAt));
}

export async function getMyInvoices(userId: string) {
  const [user] = await db.select().from(users).where(eq(users.clerkId, userId)).limit(1);
  if (!user) return [];
  const myMemberships = await db.select().from(memberships).where(eq(memberships.userId, user.id));
  if (myMemberships.length === 0) return [];
  const membershipIds = myMemberships.map(m => m.id);
  return db.select({ invoice: invoices, payments: payments })
    .from(invoices)
    .leftJoin(payments, eq(payments.invoiceId, invoices.id))
    .where(eq(invoices.membershipId, membershipIds[0]))
    .orderBy(desc(invoices.createdAt));
}
