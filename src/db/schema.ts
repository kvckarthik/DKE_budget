import {
  pgTable, text, uuid, timestamp, integer,
  boolean, pgEnum, index, uniqueIndex, jsonb,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// ─── Enums ───────────────────────────────────────────────

export const memberRoleEnum = pgEnum("member_role", ["member", "treasurer", "chapter_admin", "national_admin"]);
export const memberStatusEnum = pgEnum("member_status", ["invited", "active", "inactive", "suspended"]);
export const classYearEnum = pgEnum("class_year", ["Freshman", "Sophomore", "Junior", "Senior"]);
export const budgetStatusEnum = pgEnum("budget_status", ["draft", "published", "archived"]);
export const invoiceStatusEnum = pgEnum("invoice_status", ["pending", "partial", "paid", "overdue", "waived"]);
export const paymentStatusEnum = pgEnum("payment_status", ["pending", "confirmed", "rejected"]);
export const paymentMethodEnum = pgEnum("payment_method", ["venmo", "zelle", "cash", "check", "bank_transfer", "other"]);
export const expenseStatusEnum = pgEnum("expense_status", ["logged", "reimbursement_pending", "reimbursement_approved", "reimbursement_denied"]);
export const paymentPlanEnum = pgEnum("payment_plan", ["full", "two_installment", "four_installment"]);

// ─── Tables ──────────────────────────────────────────────

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  clerkId: text("clerk_id").notNull().unique(),
  email: text("email").notNull(),
  firstName: text("first_name"),
  lastName: text("last_name"),
  imageUrl: text("image_url"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (t) => [
  uniqueIndex("users_clerk_id_idx").on(t.clerkId),
  index("users_email_idx").on(t.email),
]);

export const chapters = pgTable("chapters", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  school: text("school").notNull(),
  dkeDesignation: text("dke_designation"),
  inviteCode: text("invite_code").notNull().unique(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (t) => [
  uniqueIndex("chapters_invite_code_idx").on(t.inviteCode),
]);

export const memberships = pgTable("memberships", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  chapterId: uuid("chapter_id").references(() => chapters.id, { onDelete: "cascade" }).notNull(),
  role: memberRoleEnum("role").default("member").notNull(),
  classYear: classYearEnum("class_year"),
  status: memberStatusEnum("status").default("invited").notNull(),
  joinedAt: timestamp("joined_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (t) => [
  uniqueIndex("memberships_user_chapter_idx").on(t.userId, t.chapterId),
  index("memberships_chapter_idx").on(t.chapterId),
  index("memberships_status_idx").on(t.chapterId, t.status),
]);

export const semesters = pgTable("semesters", {
  id: uuid("id").primaryKey().defaultRandom(),
  chapterId: uuid("chapter_id").references(() => chapters.id, { onDelete: "cascade" }).notNull(),
  label: text("label").notNull(),
  startDate: timestamp("start_date", { withTimezone: true }).notNull(),
  endDate: timestamp("end_date", { withTimezone: true }).notNull(),
  isActive: boolean("is_active").default(false).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (t) => [
  index("semesters_chapter_idx").on(t.chapterId),
  index("semesters_active_idx").on(t.chapterId, t.isActive),
]);

export const budgets = pgTable("budgets", {
  id: uuid("id").primaryKey().defaultRandom(),
  chapterId: uuid("chapter_id").references(() => chapters.id, { onDelete: "cascade" }).notNull(),
  semesterId: uuid("semester_id").references(() => semesters.id, { onDelete: "cascade" }).notNull(),
  name: text("name").notNull(),
  status: budgetStatusEnum("status").default("draft").notNull(),
  globalDuesIncrease: integer("global_dues_increase").default(0).notNull(),
  freshmanRangeMin: integer("freshman_range_min").default(15).notNull(),
  freshmanRangeMax: integer("freshman_range_max").default(25).notNull(),
  totalEstimatedRevenue: integer("total_estimated_revenue"),
  publishedAt: timestamp("published_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (t) => [
  index("budgets_chapter_semester_idx").on(t.chapterId, t.semesterId),
  index("budgets_status_idx").on(t.chapterId, t.status),
]);

export const budgetCategoryAllocations = pgTable("budget_category_allocations", {
  id: uuid("id").primaryKey().defaultRandom(),
  budgetId: uuid("budget_id").references(() => budgets.id, { onDelete: "cascade" }).notNull(),
  categoryKey: text("category_key").notNull(),
  percentage: integer("percentage").notNull(),
  amountCents: integer("amount_cents").notNull(),
}, (t) => [
  uniqueIndex("budget_alloc_unique_idx").on(t.budgetId, t.categoryKey),
  index("budget_alloc_budget_idx").on(t.budgetId),
]);

export const duesSchedules = pgTable("dues_schedules", {
  id: uuid("id").primaryKey().defaultRandom(),
  budgetId: uuid("budget_id").references(() => budgets.id, { onDelete: "cascade" }).notNull(),
  classYear: classYearEnum("class_year").notNull(),
  baseDuesCents: integer("base_dues_cents").notNull(),
  effectiveDuesCents: integer("effective_dues_cents").notNull(),
  memberCount: integer("member_count").notNull(),
  allowedPaymentPlans: jsonb("allowed_payment_plans").$type<string[]>().default(["full", "two_installment"]).notNull(),
}, (t) => [
  uniqueIndex("dues_schedule_unique_idx").on(t.budgetId, t.classYear),
  index("dues_schedule_budget_idx").on(t.budgetId),
]);

export const invoices = pgTable("invoices", {
  id: uuid("id").primaryKey().defaultRandom(),
  membershipId: uuid("membership_id").references(() => memberships.id, { onDelete: "cascade" }).notNull(),
  budgetId: uuid("budget_id").references(() => budgets.id, { onDelete: "cascade" }).notNull(),
  amountDueCents: integer("amount_due_cents").notNull(),
  amountPaidCents: integer("amount_paid_cents").default(0).notNull(),
  dueDate: timestamp("due_date", { withTimezone: true }).notNull(),
  status: invoiceStatusEnum("status").default("pending").notNull(),
  paymentPlan: paymentPlanEnum("payment_plan").default("full").notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (t) => [
  index("invoices_membership_idx").on(t.membershipId),
  index("invoices_budget_idx").on(t.budgetId),
  index("invoices_status_idx").on(t.status),
]);

export const payments = pgTable("payments", {
  id: uuid("id").primaryKey().defaultRandom(),
  invoiceId: uuid("invoice_id").references(() => invoices.id, { onDelete: "cascade" }).notNull(),
  amountCents: integer("amount_cents").notNull(),
  method: paymentMethodEnum("method").notNull(),
  externalRef: text("external_ref"),
  receiptUrl: text("receipt_url"),
  status: paymentStatusEnum("status").default("pending").notNull(),
  recordedBy: uuid("recorded_by").references(() => users.id),
  notes: text("notes"),
  paidAt: timestamp("paid_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (t) => [
  index("payments_invoice_idx").on(t.invoiceId),
  index("payments_status_idx").on(t.status),
]);

export const expenses = pgTable("expenses", {
  id: uuid("id").primaryKey().defaultRandom(),
  chapterId: uuid("chapter_id").references(() => chapters.id, { onDelete: "cascade" }).notNull(),
  semesterId: uuid("semester_id").references(() => semesters.id, { onDelete: "cascade" }).notNull(),
  categoryKey: text("category_key").notNull(),
  amountCents: integer("amount_cents").notNull(),
  vendor: text("vendor"),
  description: text("description").notNull(),
  receiptUrl: text("receipt_url"),
  status: expenseStatusEnum("status").default("logged").notNull(),
  submittedBy: uuid("submitted_by").references(() => users.id),
  reviewedBy: uuid("reviewed_by").references(() => users.id),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (t) => [
  index("expenses_chapter_idx").on(t.chapterId),
  index("expenses_semester_idx").on(t.semesterId),
  index("expenses_category_idx").on(t.chapterId, t.categoryKey),
]);

export const auditLogs = pgTable("audit_logs", {
  id: uuid("id").primaryKey().defaultRandom(),
  chapterId: uuid("chapter_id").references(() => chapters.id, { onDelete: "cascade" }).notNull(),
  actorId: uuid("actor_id").references(() => users.id),
  action: text("action").notNull(),
  entityType: text("entity_type").notNull(),
  entityId: uuid("entity_id"),
  diff: jsonb("diff"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (t) => [
  index("audit_logs_chapter_idx").on(t.chapterId),
  index("audit_logs_actor_idx").on(t.actorId),
]);

// ─── Relations ───────────────────────────────────────────

export const usersRelations = relations(users, ({ many }) => ({
  memberships: many(memberships),
}));

export const chaptersRelations = relations(chapters, ({ many }) => ({
  memberships: many(memberships),
  semesters: many(semesters),
  budgets: many(budgets),
  expenses: many(expenses),
}));

export const membershipsRelations = relations(memberships, ({ one, many }) => ({
  user: one(users, { fields: [memberships.userId], references: [users.id] }),
  chapter: one(chapters, { fields: [memberships.chapterId], references: [chapters.id] }),
  invoices: many(invoices),
}));

export const semestersRelations = relations(semesters, ({ one, many }) => ({
  chapter: one(chapters, { fields: [semesters.chapterId], references: [chapters.id] }),
  budgets: many(budgets),
  expenses: many(expenses),
}));

export const budgetsRelations = relations(budgets, ({ one, many }) => ({
  chapter: one(chapters, { fields: [budgets.chapterId], references: [chapters.id] }),
  semester: one(semesters, { fields: [budgets.semesterId], references: [semesters.id] }),
  categoryAllocations: many(budgetCategoryAllocations),
  duesSchedules: many(duesSchedules),
  invoices: many(invoices),
}));

export const invoicesRelations = relations(invoices, ({ one, many }) => ({
  membership: one(memberships, { fields: [invoices.membershipId], references: [memberships.id] }),
  budget: one(budgets, { fields: [invoices.budgetId], references: [budgets.id] }),
  payments: many(payments),
}));

export const paymentsRelations = relations(payments, ({ one }) => ({
  invoice: one(invoices, { fields: [payments.invoiceId], references: [invoices.id] }),
  recordedByUser: one(users, { fields: [payments.recordedBy], references: [users.id] }),
}));

export const expensesRelations = relations(expenses, ({ one }) => ({
  chapter: one(chapters, { fields: [expenses.chapterId], references: [chapters.id] }),
  semester: one(semesters, { fields: [expenses.semesterId], references: [semesters.id] }),
  submittedByUser: one(users, { fields: [expenses.submittedBy], references: [users.id] }),
}));
